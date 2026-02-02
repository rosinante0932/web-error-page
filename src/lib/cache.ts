// src/lib/cache.ts
type LogLike = {
  debug?: (obj: any, msg?: string) => void;
  info?: (obj: any, msg?: string) => void;
  warn?: (obj: any, msg?: string) => void;
  error?: (obj: any, msg?: string) => void;
};

const cache = new Map<string, { data: any; expire: number }>();

export async function fetchWithCache(
  key: string,
  fetcher: () => Promise<any>,
  ttl = 300000,
  logger?: LogLike
) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now < cached.expire) {
    logger?.debug?.({ key, ttlLeftMs: cached.expire - now }, "cache_hit");
    return cached.data;
  }

  logger?.debug?.({ key, hadCache: !!cached, expired: !!cached && now >= cached.expire }, "cache_miss");

  try {
    const freshData = await fetcher();
    cache.set(key, { data: freshData, expire: now + ttl });
    logger?.info?.({ key, ttl }, "cache_refresh_ok");
    return freshData;
  } catch (error) {
    if (cached) {
      logger?.warn?.({ key, err: error }, "cache_refresh_failed_use_stale");
      return cached.data;
    }
    logger?.error?.({ key, err: error }, "cache_refresh_failed_no_cache");
    throw error;
  }
}
