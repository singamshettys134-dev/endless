import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';
import { appConfig } from '../config.js';

class SessionCache { 
  constructor() {
    this.local = new LRUCache({
      max: 10000, // ~36 KB per feed entry => ~360 MB worst case
      ttl: appConfig.sessionTtlMs,
      updateAgeOnGet: true,
      ttlAutopurge: true,
    });
    this.redis = appConfig.redisUrl ? new Redis(appConfig.redisUrl, { lazyConnect: true }) : null;
    this.hits = 0;
    this.misses = 0;
    this.entries = 0;
    this.inFlight = new Map();
  }

  async get(key) {
    const localHit = this.local.get(key);
    if (localHit !== undefined) {
      this.hits += 1;
      this.entries = this.local.size;
      return localHit;
    }

    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          const parsed = JSON.parse(value);
          this.local.set(key, parsed, { ttl: appConfig.sessionTtlMs });
          this.hits += 1;
          this.entries = this.local.size;
          return parsed;
        }
      } catch {
        // ignore redis failures and fall back to miss
      }
    }

    this.misses += 1;
    this.entries = this.local.size;
    return undefined;
  }

  async set(key, value) {
    this.local.set(key, value, { ttl: appConfig.sessionTtlMs });
    this.entries = this.local.size;
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value, (_k, v) => (ArrayBuffer.isView(v) ? Array.from(v) : v)), 'PX', appConfig.sessionTtlMs);
      } catch {
        // ignore redis write failures
      }
    }
  }

  invalidate(key) {
    this.local.delete(key);
    if (this.redis) {
      this.redis.del(key).catch(() => undefined);
    }
  }

  stats() {
    const total = this.hits + this.misses;
    const hitRate = total ? (this.hits / total) * 100 : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      entries: this.local.size,
      memoryApprox: this.local.calculatedSize ? this.local.calculatedSize : this.local.size,
      ttlMs: appConfig.sessionTtlMs,
    };
  }
}

export const sessionCache = new SessionCache();

export function resetSessionCache() {
  sessionCache.local.clear();
  sessionCache.hits = 0;
  sessionCache.misses = 0;
  sessionCache.entries = 0;
}
