const cache = new Map<string, { data: any; expire: number }>();

export async function fetchWithCache(key: string, fetcher: () => Promise<any>, ttl = 300000) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now < cached.expire) {
    return cached.data;
  }

  try {
    const freshData = await fetcher();
    cache.set(key, {
      data: freshData,
      expire: now + ttl, // 设置过期时间
    });
    return freshData;
  } catch (error) {
    // 如果请求失败，且有旧缓存，先返回旧缓存顶一下
    if (cached) return cached.data;
    throw error;
  }
}