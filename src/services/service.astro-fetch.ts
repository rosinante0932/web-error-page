import encrypt from '../utils/encrypt'
import { appVersion } from '@/constant/encrypt.constant'
import { urlEncrypter } from '../utils/url-encrypt'
import { SITE_URL } from 'astro:env/server'

const TIMEOUT = 10_000
const isProd = process.env.ENV === 'prod'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
    url: string
    method?: Method
    data?: any
    headers?: Record<string, string>
}

async function buildConfig(input: RequestOptions) {
    const method: Method = (input.method || 'POST').toUpperCase() as Method

    // 做一个 axios 风格的中间 config，方便 urlEncrypter 复用
    const config: any = {
        url: '/gw' + input.url,
        method,
        headers: { ...(input.headers || {}) } as Record<string, string>,
        data: input.data ?? {},
    }

    // 公共头（注意：fetch 的 Headers 要求 string）
    const deviceId = 'e54a603c5e2b29b4a8d20b2f6c51f6fd'
    config.headers['deviceId'] = deviceId
    config.headers['Content-Type'] = 'application/json'
    config.headers['app-version'] = String(appVersion)
    config.headers['app-type'] = '20'
    config.headers['easy-web-version'] = 'v02'

    // userId：负时间戳，3 天更新（与原逻辑一致）
    let userId = 0
    const day3 = 3600 * 24 * 3 * 1000
    if (!userId || Date.now() - Math.abs(userId) > day3) {
        userId = -Date.now()
    }

    // token 抽离
    const token = config.data?.token || ''
    if (config.data && typeof config.data === 'object') {
        delete config.data.token
    }

    // 未加密体
    config.data = {
        deviceId,
        param: config.data,
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



        // 签名/加密相关头（全部转成字符串）
        config.headers['dt-nonce'] = String(encrypt.createNonce())
        config.headers['dt-encrypted'] = 'false'
        config.headers['dt-timestamp'] = String(encrypt.createTimestamp())

        const encryptedPreview = encrypt.encrypt(config.data)
        config.headers['dt-sign'] = String(
            encrypt.createSign(
                encryptedPreview,
                config.headers['dt-nonce'],
                config.headers['dt-timestamp']
            )
        )
        config.headers['dt-encrypted'] = 'true'
        config.headers['dt-gzipped'] = 'true'
        config.headers['dt-encrypt-version'] = '3'
        config.headers['dt-client-key'] = String(encrypt.clientPublicKey)

        // 明文特例
        if (config.url !== '/gw/common/appUpdate') {
            config.body = encryptedPreview // 纯文本密文
        } else {
            config.headers['dt-encrypted'] = 'false'
            config.headers['appType'] = ''
            config.headers['appVersion'] = ''
            config.body = JSON.stringify(config.data) // 明文 JSON（仍 text/plain）
        }

        // URL 动态加密（可能改写 url / headers）
        await urlEncrypter.encrypt(config)

        if (!isProd) {
            const originConfig = JSON.parse(JSON.stringify(config))
            console.groupCollapsed(
                '%c请求拦截 (astro-fetch)',
                'padding:2px;color:#CCC;background:#036;font-weight:bold;'
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
        const res = await fetch(SITE_URL + config.url, {
            method: config.method,
            headers: config.headers,
            body: (config.method === 'GET' || config.method === 'DELETE') ? undefined : config.body,
            signal: controller.signal,
        })

        const rawText = await res.text()

        // === 响应“拦截器” ===
        let parsed: any = null
        if (process.env.encrypt && Object.prototype.toString.call(rawText) !== '[object Object]') {
            try {
                parsed = JSON.parse(encrypt.decrypt(rawText))
            } catch {
                try { parsed = JSON.parse(rawText) } catch { parsed = rawText }
            }

            if (!isProd) {
                console.groupCollapsed(
                    '%c响应拦截 (astro-fetch - decrypt)',
                    'padding:2px;color:#fff;background:#000;font-weight:bold;'
                )
                try {
                    console.log('url: ', urlEncrypter.decrypt(config.url))
                } catch {
                    console.log('url(dec-fail): ', config.url)
                }
                console.log('data: ', parsed)
                console.groupEnd()
            }
        } else {
            try { parsed = JSON.parse(rawText) } catch { parsed = rawText }
        }

        const resData = parsed

        // 特殊 code
        if (resData && typeof resData === 'object' && `${resData.code}` === '4002') {
            return
        }

        // HTTP 非 2xx
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${rawText?.slice?.(0, 200) || 'Error'}`)
        }

        // 业务码
        if (!resData || (resData.code !== 200 && resData.code !== 2000)) {
            throw new Error(resData?.msg || resData?.message || 'Error')
        }

        if (!isProd) {
            console.log('service.astro-fetch response OK:', resData)
        }
        return resData
    } catch (error: any) {
        console.error('astro fetch error', error?.message || error)
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
        const config = await buildConfig(opts)
        return doFetch(config)
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
export type { RequestOptions }
