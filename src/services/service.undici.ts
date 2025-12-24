import { fetch, setGlobalDispatcher, Agent } from 'undici'
import encrypt from '../utils/encrypt'
import { appVersion } from '@/constant/encrypt.constant'
import { urlEncrypter } from '../utils/url-encrypt'
import { SITE_URL } from 'astro:env/server'

// 全局长连接（可选，但推荐，便于 keep-alive）
setGlobalDispatcher(
    new Agent({
        keepAliveTimeout: 30_000,
        keepAliveMaxTimeout: 60_000,
    })
)

const TIMEOUT = 10_000
const isProd = process.env.ENV === 'prod'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'
interface RequestOptions {
    url: string                   // 不含 baseURL（会自动拼 SITE_URL）
    method?: Method
    data?: any
    headers?: Record<string, string>
}

async function buildConfig(input: RequestOptions) {
    const method: Method = (input.method || 'POST').toUpperCase() as Method

    // 模拟 axios 的 config 形状，便于给 urlEncrypter 使用
    const config: any = {
        baseURL: SITE_URL,
        url: '/gw' + input.url,                 // 请求拦截器里的前缀
        method,
        headers: { ...(input.headers || {}) },
        data: input.data ?? {},
    }

    // 公共头
    const deviceId = 'e54a603c5e2b29b4a8d20b2f6c51f6fd'
    config.headers.deviceId = deviceId
    config.headers['Content-Type'] = 'text/plain'
    config.headers['app-version'] = appVersion
    config.headers['app-type'] = '20'
    config.headers['easy-web-version'] = 'v02'

    // userId（负时间戳，3天更新）
    let userId = 0
    const day3 = 3600 * 24 * 3 * 1000
    if (!userId || Date.now() - Math.abs(userId) > day3) {
        userId = -Date.now()
    }

    // token 取出后从 param 中删除
    const originData = (config.data && typeof config.data === 'object') ? config.data : {}
    const token = originData.token || ''
    if (originData && typeof originData === 'object') delete originData.token

    // 请求体（未加密）
    config.data = {
        deviceId,
        param: originData,
        notificationStatus: 0,
        timestamp: Date.now(),
        deviceName: 'mobile',
        platform: 4,
        lbs: '',
        network: -1,
        userId: parseInt(userId.toString(), 10),
        appType: 1,
    }
    config.data.token = token

    if (true) {

        // 签名/加密相关头
        config.headers['dt-nonce'] = encrypt.createNonce()
        config.headers['dt-encrypted'] = 'false'
        config.headers['dt-timestamp'] = encrypt.createTimestamp()

        const encryptedPreview = encrypt.encrypt(config.data)
        config.headers['dt-sign'] = encrypt.createSign(
            encryptedPreview,
            config.headers['dt-nonce'],
            config.headers['dt-timestamp']
        )
        config.headers['dt-encrypted'] = 'true'
        config.headers['dt-gzipped'] = 'true'
        config.headers['dt-encrypt-version'] = '3'
        config.headers['dt-client-key'] = encrypt.clientPublicKey

        // appUpdate 接口按你原逻辑走明文
        if (config.url !== '/gw/common/appUpdate') {
            config.body = encryptedPreview
        } else {
            config.headers['dt-encrypted'] = 'false'
            config.headers['appType'] = ''
            config.headers['appVersion'] = ''
            config.body = JSON.stringify(config.data)
        }

        // URL 动态加密（可能改写 url / headers）
        await urlEncrypter.encrypt(config)

        if (!isProd) {
            const originConfig = JSON.parse(JSON.stringify(config))
            console.groupCollapsed(
                '%c请求拦截 (undici/fetch)',
                'padding: 2px;color: #CCCCCC;background: #003366;font-weight: bold;'
            )
            console.log(originConfig)
            console.groupEnd()
        }
    }

    return config
}

async function doFetch(config: any) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT)

    try {
        const res = await fetch(config.baseURL + config.url, {
            method: config.method,
            headers: config.headers,
            body: (config.method === 'GET' || config.method === 'DELETE') ? undefined : config.body,
            signal: controller.signal,
        })

        // 取原始文本（你的后端可能返回加密字符串）
        const rawText = await res.text()

        // === 响应“拦截器”逻辑 ===
        let parsed: any = null
        if (process.env.encrypt) {
            // 尝试解密 -> JSON
            try {
                parsed = JSON.parse(encrypt.decrypt(rawText))
            } catch {
                // 兜底：如果后端本就返 JSON
                try { parsed = JSON.parse(rawText) } catch { parsed = rawText }
            }

            if (!isProd) {
                console.groupCollapsed('%c响应拦截 (undici - decrypt)',
                    'padding:2px;color:#fff;background:#000;font-weight:bold;')
                try {
                    console.log('url: ', urlEncrypter.decrypt(config.url))
                } catch {
                    console.log('url(dec-fail): ', config.url)
                }
                console.log('data: ', parsed)
                console.groupEnd()
            }
        } else {
            // 非加密：尽量按 JSON 解析
            try { parsed = JSON.parse(rawText) } catch { parsed = rawText }
        }

        const resData = parsed

        // 特殊 code
        if (resData && typeof resData === 'object' && `${resData.code}` === '4002') {
            return
        }

        // HTTP 层错误
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${rawText?.slice?.(0, 200) || 'Error'}`)
        }

        // 业务码判定
        if (!resData || (resData.code !== 200 && resData.code !== 2000)) {
            throw new Error(resData?.msg || resData?.message || 'Error')
        }

        if (!isProd) {
            console.log('service.undici response OK:', resData)
        }
        return resData
    } catch (error: any) {
        console.error('undici fetch error', error?.message || error)
        throw {
            code: error?.status || 500,
            message: error?.message || JSON.stringify(error),
        }
    } finally {
        clearTimeout(timer)
    }
}

const service = {
    async request(opts: RequestOptions) {
        const cfg = await buildConfig(opts)
        return doFetch(cfg)
    },
    get(url: string, config: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}) {
        return service.request({ url, method: 'GET', ...config })
    },
    delete(url: string, config: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}) {
        return service.request({ url, method: 'DELETE', ...config })
    },
    post(url: string, data?: any, config: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}) {
        return service.request({ url, method: 'POST', data, ...config })
    },
    put(url: string, data?: any, config: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}) {
        return service.request({ url, method: 'PUT', data, ...config })
    },
}

export default service
