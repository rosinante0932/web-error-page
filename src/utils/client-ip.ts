type IpResult = {
  ip: string
  source: string
}

const PROVIDERS = [
  {
    name: 'ipify',
    url: 'https://api.ipify.org?format=json',
    parse: async (res: Response) => {
      const data = await res.json()
      return data.ip
    }
  },
  {
    name: 'ipinfo',
    url: 'https://ipinfo.io/json',
    parse: async (res: Response) => {
      const data = await res.json()
      return data.ip
    }
  },
  {
    name: 'ifconfig',
    url: 'https://ifconfig.me/ip',
    parse: async (res: Response) => {
      return (await res.text()).trim()
    }
  }
]

let cachedIp: IpResult | null = null
let cachedAt = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    promise
      .then((v) => {
        clearTimeout(t)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(t)
        reject(e)
      })
  })
}

/**
 * @func fetchClientIp
 * @desc 获取 client IP（轮询 + 兜底）
 * @returns 
 */
export async function fetchClientIp(): Promise<IpResult> {
  // ✅ 缓存命中
  if (cachedIp && Date.now() - cachedAt < CACHE_TTL) {
    return cachedIp
  }

  for (const p of PROVIDERS) {
    try {
      const res = await withTimeout(fetch(p.url, { cache: 'no-store' }), 3000)
      if (!res.ok) continue

      const ip = await p.parse(res)
      if (ip && typeof ip === 'string') {
        cachedIp = { ip, source: p.name }
        cachedAt = Date.now()
        return cachedIp
      }
    } catch {
      // 静默切换下一个
    }
  }

  // ❌ 全失败
  cachedIp = { ip: '-', source: 'none' }
  cachedAt = Date.now()
  return cachedIp
}

/**
 * @func getCachedClientIp
 * @desc 同步读取（用于日志）
 */
export function getCachedClientIp(): string {
  return cachedIp?.ip || '-'
}
