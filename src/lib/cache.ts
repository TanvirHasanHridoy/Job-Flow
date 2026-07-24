import crypto from 'crypto';

interface CacheEntry {
  data: any;
  expiresAt: number;
}

class SimpleLRUCache {
  private max: number;
  private ttl: number;
  private cache: Map<string, CacheEntry>;

  constructor(max = 500, ttlMs = 24 * 60 * 60 * 1000) {
    this.max = max;
    this.ttl = ttlMs;
    this.cache = new Map();
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, value: any): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + this.ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global singleton instance across Next.js dev reloads
const globalForCache = globalThis as unknown as { aiResponseCache: SimpleLRUCache };
export const aiResponseCache = globalForCache.aiResponseCache || new SimpleLRUCache(500, 24 * 60 * 60 * 1000);
if (process.env.NODE_ENV !== 'production') globalForCache.aiResponseCache = aiResponseCache;

export function generateCacheKey(params: Record<string, any>): string {
  const normalizedStr = JSON.stringify(params, Object.keys(params).sort());
  return crypto.createHash('sha256').update(normalizedStr).digest('hex');
}
