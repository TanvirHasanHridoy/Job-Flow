/**
 * Local-development identity shortcut.
 *
 * The `jobmaster_dev_auth` cookie / `x-dev-auth` header lets a developer act as an
 * arbitrary user ID without OAuth. It must NEVER be honoured in production, where it
 * would let anyone impersonate any account or mint unlimited free accounts.
 */
export const DEV_AUTH_COOKIE = 'jobmaster_dev_auth';

export function isDevAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Resolves a dev-auth user ID from the cookie, the `x-dev-auth` header, or a
 * forwarded `x-session-cookie` header (Chrome extension). Returns null when
 * dev-auth is disabled or no value is present.
 */
export function resolveDevAuthUserId(sources: {
  cookieValue?: string | null;
  devHeader?: string | null;
  forwardedCookieHeader?: string | null;
}): string | null {
  if (!isDevAuthEnabled()) return null;

  const direct = sources.cookieValue || sources.devHeader;
  if (direct) return direct;

  const forwarded = sources.forwardedCookieHeader;
  if (forwarded && forwarded.includes(`${DEV_AUTH_COOKIE}=`)) {
    const match = forwarded.match(new RegExp(`${DEV_AUTH_COOKIE}=([^;]+)`));
    if (match && match[1]) return match[1];
  }
  return null;
}
