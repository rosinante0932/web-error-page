import encrypt from '../utils/encrypt'
import { appVersion } from '@/constant/encrypt.constant'
import { urlEncrypter } from '../utils/url-encrypt'
import { PROD_SITE_URL, ENCRYPT } from 'astro:env/server'

console.log(ENCRYPT, 'ENCRYPT')

const TIMEOUT = 10000
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
    const config: any = {
        url: input.url,      // 等同 request 拦截器的前缀
        method,
        headers: { ...(input.headers || {}) },
        data: input.data ?? {},
    }

    // 公共头
    const deviceId = 'e1fe3465404ea37a0d2a8b537e12c7c1'
    config.headers.deviceId = deviceId
    config.headers['Content-Type'] = 'application/json'
    // config.headers['app-version'] = appVersion
    // config.headers['app-type'] = '20'
    config.headers['easy-web-version'] = 'v01'
    config.headers['dt-encrypted'] = 'false'
    config.headers['dt-nonce'] = encrypt.createNonce()
    // config.headers['dt-timestamp'] = encrypt.createTimestamp()

    // userId（负时间戳，3天更新一次）
    let userId = 0
    const day3 = 3600 * 24 * 3 * 1000
    if (!userId || Date.now() - Math.abs(userId) > day3) {
        userId = -Date.now()
    }

    // 提取并剔除 token
    const token = config.data?.token || ''
    if (config.data && typeof config.data === 'object') {
        delete config.data.token
    }

    console.log(config.data, 'config.data --- config.data')

    config.data = {
        deviceId,
        param: config.data,
        notificationStatus: 0,
        timestamp: Date.now(),
        osVersion: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
        deviceName: 'mobile',
        platform: 4,
        screenSize: "{375, 2856}",
        lbs: '',
        network: -1,
        userId: parseInt(userId.toString(), 10),
        appType: 1,
    }

    config.data.token = token

    if (ENCRYPT === 'true') {
        // 签名/加密相关头
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

        // /common/appUpdate 走明文（按你原逻辑）
        if (config.url !== '/gw/common/appUpdate') {
            config.body = encryptedPreview
        } else {
            config.headers['dt-encrypted'] = 'false'
            // 注意：你原代码这里用的是无连字符的 header 名（可能是后端要求）
            config.headers['appType'] = ''
            config.headers['appVersion'] = ''
            config.body = JSON.stringify(config.data)
        }

        // URL 动态加密（会改写 config.url / headers 等）
        // 与原 axios config 兼容：传入包含 url/headers/method/data 的对象
        await urlEncrypter.encrypt(config)

        if (!isProd) {
            const originConfig = JSON.parse(JSON.stringify(config))
            console.groupCollapsed(
                '%c请求拦截 (fetch)',
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
        const res = await fetch(PROD_SITE_URL + config.url, {
            method: config.method,
            headers: config.headers,
            body: JSON.stringify(config.data),
            signal: controller.signal,
        })

        // 读取原始文本（你的响应可能是加密字符串）
        const rawText = await res.text()

        // 统一模拟 axios 的 response 对象（便于复用原日志代码风格）
        const response: any = { status: res.status, ok: res.ok, config, headers: res.headers, data: rawText }

        // === 响应“拦截器”逻辑 ===
        // 加密响应：按你原逻辑判断（process.env.encrypt 为真 且 data 不是对象）
        let parsed: any = null
        if (ENCRYPT === 'true') {
            // 解密 -> JSON
            try {
                parsed = JSON.parse(encrypt.decrypt(rawText))
            } catch {
                // 如果后端某些接口本身返 JSON，这里兜底尝试 JSON.parse
                try { parsed = JSON.parse(rawText) } catch { parsed = rawText }
            }

            if (!isProd) {
                console.groupCollapsed('%c响应拦截 (fetch - decrypt)', 'padding:2px;color:#fff;background:#000;font-weight:bold;')
                try {
                    console.log('url: ', urlEncrypter.decrypt(config.url))
                } catch {
                    console.log('url(dec-fail): ', config.url)
                }
                console.log('data: ', parsed)
                console.groupEnd()
            }
        } else {
            // 非加密场景：尽量按 JSON 解析，失败则原样字符串
            try { parsed = JSON.parse(rawText) } catch { parsed = rawText }
        }

        const resData = parsed

        // 按原代码处理特殊 code
        if (resData && typeof resData === 'object' && `${resData.code}` === '4002') {
            // 你原来是直接 return; 这里返回 undefined 与原行为一致
            return
        }

        // 错误码处理（与原逻辑一致）
        if (!res.ok) {
            // HTTP 非 2xx
            throw new Error(`HTTP ${res.status}: ${rawText?.slice?.(0, 200) || 'Error'}`)
        }

        if (!resData || (resData.code !== 200 && resData.code !== 2000)) {
            throw new Error(resData?.msg || resData?.message || 'Error')
        }

        if (!isProd) {
            console.log('service.fetch response OK:', resData)
        }

        // 与原 axios 拦截器最终返回一致：直接返回 resData
        return resData
    } catch (error: any) {

        console.error('fetch error', error?.message || error)
        // 与原 axios 拦截器错误返回结构保持接近
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
