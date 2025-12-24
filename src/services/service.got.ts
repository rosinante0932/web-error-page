import got, { type OptionsOfTextResponseBody } from 'got'
import encrypt from '../utils/encrypt'
import { appVersion } from '@/constant/encrypt.constant'
import { urlEncrypter } from '../utils/url-encrypt'
import { SITE_URL } from 'astro:env/server'

const isProd = process.env.ENV === 'prod'
const TIMEOUT = 10_000

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
    url: string                 // 不含 baseURL（会自动拼上 SITE_URL）
    method?: Method
    data?: any
    headers?: Record<string, string>
}

async function buildConfig(input: RequestOptions) {
    const method: Method = (input.method || 'POST').toUpperCase() as Method

    // 组一个“axios 风格”的中间 config，方便 urlEncrypter 继续复用
    const config: any = {
        baseURL: SITE_URL,
        url: '/gw' + input.url,              // 等同于 axios request 拦截器
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

    // userId（负时间戳，3 天更新一次；原代码并未持久化，这里保持一致）
    let userId = 0
    const day3 = 3600 * 24 * 3 * 1000
    if (!userId || Date.now() - Math.abs(userId) > day3) {
        userId = -Date.now()
    }

    // 提取 token 并从 param 中删除
    const originData = (config.data && typeof config.data === 'object') ? config.data : {}
    const token = originData.token || ''
    if (originData && typeof originData === 'object') delete originData.token

    // 组装未加密请求体
    config.data = {
        deviceId,
        param: originData,
        notificationStatus: 0,
        timestamp: Date.now(),
        deviceName: 'mobile',
        platform: 4, // 1 ios, 2 android, 4 自定义
        lbs: '',
        network: -1,
        userId: parseInt(userId.toString(), 10),
        appType: 1,
    }
    config.data.token = token

    if (true) {

        // 签名 / 加密相关头（保持与原实现完全一致）
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

        // /gw/common/appUpdate 走明文特例，其它接口发送加密串
        if (config.url !== '/gw/common/appUpdate') {
            config.body = encryptedPreview                     // 加密后的纯文本
        } else {
            config.headers['dt-encrypted'] = 'false'
            config.headers['appType'] = ''
            config.headers['appVersion'] = ''
            config.body = JSON.stringify(config.data)          // 明文 JSON（仍用 text/plain 以保持兼容）
        }

        // URL 动态加密（可能改写 url / headers）
        await urlEncrypter.encrypt(config)

        if (!isProd) {
            const originConfig = JSON.parse(JSON.stringify(config))
            console.groupCollapsed('%c请求拦截 (got)', 'padding: 2px;color: #CCCCCC;background: #003366;font-weight: bold;')
            console.log(originConfig)
            console.groupEnd()
        }

    }

    // got 请求参数
    const gotOpts: OptionsOfTextResponseBody = {
        method: config.method,
        prefixUrl: config.baseURL,          // 等价 axios baseURL
        headers: config.headers,
        timeout: { request: TIMEOUT },
        throwHttpErrors: false,             // 我们自己处理非 2xx
        responseType: 'text',               // 后端返回可能是加密串
        // GET/DELETE 一般不带 body
        body: (config.method === 'GET' || config.method === 'DELETE') ? undefined : config.body,
    }



    return { url: config.url.replace(/^\//, ''), cfg: config, gotOpts }
}

async function doRequest(url: string, cfg: any, gotOpts: OptionsOfTextResponseBody) {
    const resp = await got(url, gotOpts)   // got 会把 prefixUrl + url 拼接
    const rawText = resp.body ?? ''

    // === 响应“拦截器”逻辑 ===
    let parsed: any = null
    if (process.env.encrypt) {
        try {
            parsed = JSON.parse(encrypt.decrypt(rawText))
        } catch {
            try { parsed = JSON.parse(rawText) } catch { parsed = rawText }
        }

        if (!isProd) {
            console.groupCollapsed('%c响应拦截 (got - decrypt)', 'padding: 2px;color: white;background:#000000;font-weight: bold;')
            try {
                console.log('url: ', urlEncrypter.decrypt(cfg.url))
            } catch {
                console.log('url(dec-fail): ', cfg.url)
            }
            console.log('data: ', parsed)
            console.groupEnd()
        }
    } else {
        try { parsed = JSON.parse(rawText) } catch { parsed = rawText }
    }

    const resData = parsed

    // 特殊 code：4002 直接返回（与原逻辑一致）
    if (resData && typeof resData === 'object' && `${resData.code}` === '4002') {
        return
    }

    // HTTP 非 2xx
    if (resp.statusCode < 200 || resp.statusCode >= 300) {
        throw {
            code: resp.statusCode,
            message: `HTTP ${resp.statusCode}: ${rawText?.slice?.(0, 200) || 'Error'}`
        }
    }

    // 业务码校验
    if (!resData || (resData.code !== 200 && resData.code !== 2000)) {
        throw {
            code: 500,
            message: resData?.msg || resData?.message || 'Error',
        }
    }

    if (!isProd) {
        console.log('service.got response OK:', resData)
    }
    return resData
}

const service = {
    async request(opts: RequestOptions) {
        try {
            const { url, cfg, gotOpts } = await buildConfig(opts)
            return await doRequest(url, cfg, gotOpts)
        } catch (error: any) {
            // 统一成你原 axios 拦截器错误返回的形状
            console.error('got error', error?.message || error)
            throw {
                code: error?.code || error?.statusCode || 500,
                message: error?.message || JSON.stringify(error),
            }
        }
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
