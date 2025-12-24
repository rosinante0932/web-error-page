import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'

import encrypt from '../utils/encrypt'
import { appVersion } from '@/constant/encrypt.constant'
import { urlEncrypter } from '../utils/url-encrypt'
import { SITE_URL } from 'astro:env/server'

const TIMEOUT = 10_000
const isProd = process.env.ENV === 'prod'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
    url: string
    method?: Method
    data?: any
    headers?: Record<string, string>
}

/** ---------- 请求拦截器（构造 axios 风格 config） ---------- */
async function buildConfig(input: RequestOptions) {
    const method: Method = (input.method || 'POST').toUpperCase() as Method
    const config: any = {
        url: '/gw' + input.url,
        method,
        headers: { ...(input.headers || {}) } as Record<string, string>,
        data: input.data ?? {},
    }

    // 公共头
    const deviceId = 'e54a603c5e2b29b4a8d20b2f6c51f6fd'
    config.headers['deviceId'] = deviceId
    config.headers['Content-Type'] = 'application/json'
    config.headers['app-version'] = String(appVersion)
    config.headers['app-type'] = '20'
    config.headers['easy-web-version'] = 'v02'

    // userId（负时间戳，3 天更新）
    let userId = 0
    const day3 = 3600 * 24 * 3 * 1000
    if (!userId || Date.now() - Math.abs(userId) > day3) {
        userId = -Date.now()
    }

    // 提取/剔除 token
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

        // 加签/加密头
        config.headers['dt-nonce'] = String(encrypt.createNonce())
        config.headers['dt-encrypted'] = 'true'
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

        // URL 动态加密（可能改写 url/headers）
        await urlEncrypter.encrypt(config)

        // Content-Length（http/https 原生模块建议手动设置）
        if (!(method === 'GET' || method === 'DELETE')) {
            const len = Buffer.byteLength(config.body || '')
            config.headers['Content-Length'] = String(len)
        }

        if (!isProd) {
            const originConfig = JSON.parse(JSON.stringify(config))
            console.groupCollapsed(
                '%c请求拦截 (node:http)',
                'padding:2px;color:#CCC;background:#036;font-weight:bold;'
            )
            console.log(originConfig)
            console.groupEnd()
        }
    }

    return config
}

/** ---------- 使用 http/https 发送请求 ---------- */
function nodeRequest(fullUrl: string, options: {
    method: Method
    headers: Record<string, string>
    body?: string
    timeout?: number
}): Promise<{ status: number; headers: http.IncomingHttpHeaders; text: string }> {
    return new Promise((resolve, reject) => {
        const u = new URL(fullUrl)
        const isHttps = u.protocol === 'https:'
        const lib = isHttps ? https : http

        const req = lib.request({
            protocol: u.protocol,
            hostname: u.hostname,
            port: u.port ? Number(u.port) : (isHttps ? 443 : 80),
            path: u.pathname + u.search,
            method: options.method,
            headers: options.headers,
        }, (res) => {
            const chunks: Buffer[] = []
            res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8')
                resolve({ status: res.statusCode ?? 0, headers: res.headers, text })
            })
        })

        req.on('error', (err) => reject(err))
        if (options.timeout && options.timeout > 0) {
            req.setTimeout(options.timeout, () => {
                req.destroy(new Error('Request timeout'))
            })
        }

        if (options.body && !(options.method === 'GET' || options.method === 'DELETE')) {
            req.write(options.body)
        }
        req.end()
    })
}

/** ---------- 响应处理（等价响应拦截器） ---------- */
async function doRequest(config: any) {
    const fullUrl = new URL(config.url, SITE_URL).toString()

    try {
        const { status, text } = await nodeRequest(fullUrl, {
            method: config.method,
            headers: config.headers,
            body: (config.method === 'GET' || config.method === 'DELETE') ? undefined : config.body,
            timeout: TIMEOUT,
        })

        // === 解密 / 解析 ===
        let parsed: any = null
        if (process.env.encrypt) {
            try {
                parsed = JSON.parse(encrypt.decrypt(text))
            } catch {
                try { parsed = JSON.parse(text) } catch { parsed = text }
            }

            if (!isProd) {
                console.groupCollapsed(
                    '%c响应拦截 (node:http - decrypt)',
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
            try { parsed = JSON.parse(text) } catch { parsed = text }
        }

        const resData = parsed

        // 特殊 code
        if (resData && typeof resData === 'object' && `${resData.code}` === '4002') {
            return
        }

        // HTTP 非 2xx
        if (status < 200 || status >= 300) {
            throw new Error(`HTTP ${status}: ${String(text).slice(0, 200) || 'Error'}`)
        }

        // 业务码（200/2000）
        if (!resData || (resData.code !== 200 && resData.code !== 2000)) {
            throw new Error(resData?.msg || resData?.message || 'Error')
        }

        if (!isProd) {
            console.log('service.http response OK:', resData)
        }
        return resData
    } catch (error: any) {
        console.error('node:http error', error?.message || error)
        throw {
            code: error?.status || 500,
            message: error?.message || JSON.stringify(error),
        }
    }
}

/** ---------- 导出的 service（与 axios 用法相近） ---------- */
const service = {
    async request(opts: RequestOptions) {
        const cfg = await buildConfig(opts)
        return doRequest(cfg)
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
