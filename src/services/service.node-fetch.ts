import { encrypter } from '../utils/encrypterSingleton'
import { appVersion } from '@/constant/encrypt.constant'
import { urlEncrypter } from '../utils/url-encrypt'
import { PROD_SITE_URL, ENCRYPT } from 'astro:env/server'

const TIMEOUT = 10_000;
const MAX_RESPONSE_SIZE = 1_024 * 1024;
const DAY_MS = 3600 * 24 * 3 * 1000;

const state = {
    cachedUserId: 0,
    lastUpdate: 0
};

function getUserId() {
    const now = Date.now();
    if (!state.cachedUserId || (now - state.lastUpdate) > DAY_MS) {
        state.cachedUserId = -now;
        state.lastUpdate = now;
    }
    return state.cachedUserId;
}

const isProd = process.env.ENV === 'prod';
const shouldEncrypt = ENCRYPT !== 'false';

function debugLog(...args: any[]) {
    if (!isProd) console.log('[API Debug]', ...args);
}

async function readTextWithLimit(res: Response, maxChars = MAX_RESPONSE_SIZE) {
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxChars) {
        throw new Error(`Response payload too large: ${contentLength} bytes`);
    }

    const text = await res.text();
    if (text.length > maxChars) {
        throw new Error(`Response string exceeds limit: ${text.length} chars`);
    }
    return text;
}

async function buildConfig(input: any) {
    const method = (input.method || 'POST').toUpperCase();
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'deviceId': 'e54a603c5e2b29b4a8d20b2f6c51f6fd',
        'app-version': appVersion,
        'app-type': '20',
        'easy-web-version': 'v02',
        ...(input.headers || {})
    };

    const token = input.data?.token || '';
    const rawParam = { ...input.data };
    delete rawParam.token;

    const requestBody = {
        deviceId: headers.deviceId,
        param: rawParam,
        notificationStatus: 0,
        timestamp: Date.now(),
        deviceName: 'mobile',
        platform: 4,
        lbs: '',
        network: -1,
        userId: getUserId(),
        appType: 1,
        token,
    };

    let finalBody: string | Uint8Array;

    if (shouldEncrypt) {
        const nonce = encrypter.createNonce();
        const timestamp = encrypter.createTimestamp();
        const encryptedData = encrypter.encrypt(requestBody);

        Object.assign(headers, {
            'dt-nonce': nonce,
            'dt-timestamp': timestamp,
            'dt-sign': encrypter.createSign(encryptedData, nonce, timestamp),
            'dt-encrypted': 'true',
            'dt-gzipped': 'true',
            'dt-encrypt-version': '3',
            'dt-client-key': encrypter.clientPublicKey
        });

        if (input.url === '/gw/common/appUpdate') {
            headers['dt-encrypted'] = 'false';
            finalBody = JSON.stringify(requestBody);
        } else {
            finalBody = encryptedData;
        }
    } else {
        finalBody = JSON.stringify(requestBody);
    }

    const config = { url: input.url, method, headers, body: finalBody };
    if (shouldEncrypt) await urlEncrypter.encrypt(config);
    
    return config;
}

async function doFetch(config: any) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        const fetchUrl = PROD_SITE_URL + config.url;
        const res = await fetch(fetchUrl, {
            method: config.method,
            headers: config.headers,
            body: config.body,
            signal: controller.signal,
            keepalive: true 
        });

        const rawText = await readTextWithLimit(res);
        let data: any;

        try {
            data = shouldEncrypt ? JSON.parse(encrypter.decrypt(rawText)) : JSON.parse(rawText);
        } catch (e) {
            throw new Error(`JSON Parse/Decrypt Failed: ${String(e)}`);
        }

        if (data?.code === 4002) return null;

        if (!res.ok || (data?.code !== 200 && data?.code !== 2000)) {
            throw new Error(data?.msg || data?.message || `HTTP ${res.status}`);
        }

        return data;
    } catch (err: any) {
        const isTimeout = err.name === 'AbortError';
        throw {
            code: isTimeout ? 408 : (err.code || 500),
            message: isTimeout ? 'Request Timeout' : err.message,
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

const service = {
    async request<T = any>(opts: any): Promise<T> {
        const config = await buildConfig(opts);
        return doFetch(config);
    },
    get<T = any>(url: string, opts = {}) { return this.request<T>({ url, method: 'GET', ...opts }); },
    post<T = any>(url: string, data?: any, opts = {}) { return this.request<T>({ url, method: 'POST', data, ...opts }); }
};

export default service;