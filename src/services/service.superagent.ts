import superagent from 'superagent'
import encrypt from '../utils/encrypt'
import { appVersion } from '@/constant/encrypt.constant'
import { urlEncrypter } from '../utils/url-encrypt'
import { SITE_URL } from 'astro:env/server'

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

    // 仿 axios 的 config，便于 urlEncrypter 复用
    const config: any = {
        url: '/gw' + input.url,
        method,
        headers: { ...(input.headers || {}) },
        data: input.data ?? {},
    }

    // 公共头
    const deviceId = 'e54a603c5e2b29b4a8d20b2f6c51f6fd'
    config.headers.deviceId = deviceId
    config.headers['Content-Type'] = 'application/json'
    config.headers['app-version'] = appVersion
    config.headers['app-type'] = '20'
    config.headers['easy-web-version'] = 'v02'

    // userId：负时间戳，3 天更新
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

        // 签名/加密头
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

        // 明文特例
        if (config.url !== '/gw/common/appUpdate') {
            config.body = encryptedPreview               // 纯文本密文
        } else {
            config.headers['dt-encrypted'] = 'false'
            config.headers['appType'] = ''
            config.headers['appVersion'] = ''
            config.body = JSON.stringify(config.data)    // 明文 JSON（仍 text/plain 以兼容后端）
        }

        // URL 动态加密（可能改写 url / headers）
        await urlEncrypter.encrypt(config)

        if (!isProd) {
            const originConfig = JSON.parse(JSON.stringify(config))
            console.groupCollapsed('%c请求拦截 (superagent)', 'padding: 2px;color: #CCC;background:#036;font-weight:bold;')
            console.log(originConfig)
            console.groupEnd()
        }

    }

    return config
}

async function doRequest(config: any) {
    try {
        // superagent 请求
        let req = superagent(config.method, SITE_URL + config.url)
            .set(config.headers)
            .ok(() => true)                       // 不让 superagent 在非 2xx 时直接 throw
            .timeout({ deadline: TIMEOUT })       // 等价 axios timeout（总时限）

        // GET/DELETE 不带 body
        if (!(config.method === 'GET' || config.method === 'DELETE')) {
            req = req.send(config.body)           // 发送纯文本密文/明文
        }

        const resp = await req

        // text/plain 下，superagent 不会自动 JSON.parse
        const rawText =
            typeof resp.text === 'string'
                ? resp.text
                : (typeof resp.body === 'string' ? resp.body : (resp.body ? JSON.stringify(resp.body) : ''))

        // === “响应拦截器” ===
        let parsed: any = null
        // 你的代码中已改成无条件尝试解密；保持一致：
        try {
            parsed = JSON.parse(encrypt.decrypt(rawText))
        } catch {
            try { parsed = JSON.parse(rawText) } catch { parsed = rawText }
        }

        if (!isProd) {
            console.groupCollapsed('%c响应拦截 (superagent - decrypt)', 'padding:2px;color:#fff;background:#000;font-weight:bold;')
            try {
                console.log('url: ', urlEncrypter.decrypt(config.url))
            } catch {
                console.log('url(dec-fail): ', config.url)
            }
            console.log('data: ', parsed)
            console.groupEnd()
        }

        const resData = parsed

        // 特殊 code
        if (resData && typeof resData === 'object' && `${resData.code}` === '4002') {
            return
        }

        // HTTP 非 2xx
        if (resp.status < 200 || resp.status >= 300) {
            throw new Error(`HTTP ${resp.status}: ${rawText?.slice?.(0, 200) || 'Error'}`)
        }

        // 业务码处理
        if (!resData || (resData.code !== 200 && resData.code !== 2000)) {
            throw new Error(resData?.msg || resData?.message || 'Error')
        }

        if (!isProd) {
            console.log('service.superagent response OK:', resData)
        }

        return resData
    } catch (error: any) {
        // 统一成你原先的错误结构
        const message = error?.message || JSON.stringify(error)
        console.error('superagent error', message)
        throw {
            code: error?.status || error?.statusCode || 500,
            message,
        }
    }
}

const service = {
    async request(opts: RequestOptions) {
        const config = await buildConfig(opts)
        return doRequest(config)
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
