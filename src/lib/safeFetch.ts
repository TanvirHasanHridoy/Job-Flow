import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Fetch a user-supplied URL without letting it reach internal infrastructure (SSRF).
 *
 * - Only http/https on default ports, no embedded credentials.
 * - Every hostname is resolved and rejected if any address is private, loopback,
 *   link-local (cloud metadata), CGNAT, multicast or otherwise non-public.
 * - Redirects are followed manually (max 5) and each hop is re-validated.
 *
 * Residual risk: DNS can change between validation and connection (rebinding).
 * Validation still blocks direct and redirect-based attacks, which is the common case.
 */

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

const MAX_REDIRECTS = 5;

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function inV4Range(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],        // "this" network
  ['10.0.0.0', 8],       // private
  ['100.64.0.0', 10],    // CGNAT
  ['127.0.0.0', 8],      // loopback
  ['169.254.0.0', 16],   // link-local / cloud metadata
  ['172.16.0.0', 12],    // private
  ['192.0.0.0', 24],     // IETF protocol assignments
  ['192.0.2.0', 24],     // TEST-NET-1
  ['192.168.0.0', 16],   // private
  ['198.18.0.0', 15],    // benchmarking
  ['198.51.100.0', 24],  // TEST-NET-2
  ['203.0.113.0', 24],   // TEST-NET-3
  ['224.0.0.0', 4],      // multicast
  ['240.0.0.0', 4],      // reserved + broadcast
];

export function isPublicIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return !BLOCKED_V4.some(([base, bits]) => inV4Range(ip, base, bits));
  }
  if (version === 6) {
    const v6 = ip.toLowerCase();
    // IPv4-mapped (::ffff:a.b.c.d) -> check the embedded IPv4 address
    const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicIp(mapped[1]);
    if (v6 === '::' || v6 === '::1') return false;
    if (/^f[cd]/.test(v6)) return false;          // fc00::/7 unique local
    if (/^fe[89ab]/.test(v6)) return false;       // fe80::/10 link-local
    if (/^ff/.test(v6)) return false;             // multicast
    if (v6.startsWith('2001:db8')) return false;  // documentation
    return true;
  }
  return false;
}

export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError('Invalid URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only http and https URLs are supported.');
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('URLs with embedded credentials are not allowed.');
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new UnsafeUrlError('Only standard web ports are allowed.');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new UnsafeUrlError('This address is not allowed.');
  }

  let addresses: string[];
  if (isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      const results = await lookup(hostname, { all: true });
      addresses = results.map(r => r.address);
    } catch {
      throw new UnsafeUrlError('Could not resolve this address.');
    }
  }

  if (addresses.length === 0 || !addresses.every(isPublicIp)) {
    throw new UnsafeUrlError('This address is not allowed.');
  }
  return url;
}

/**
 * fetch() for untrusted URLs. Returns the final Response plus the URL it came from.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit = {}
): Promise<{ response: Response; finalUrl: string; redirected: boolean }> {
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicHttpUrl(current);
    const response = await fetch(url, { ...init, redirect: 'manual' });

    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      current = new URL(response.headers.get('location')!, url).toString();
      continue;
    }
    return { response, finalUrl: url.toString(), redirected: hop > 0 };
  }
  throw new UnsafeUrlError('Too many redirects.');
}
