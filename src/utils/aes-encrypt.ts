import CryptoJS from 'crypto-js'

const keyCache = new Map<string, CryptoJS.lib.WordArray>();

function getParsed(data: string, encode?: 'base64') {
    const cacheKey = `${encode}:${data}`;
    if (!keyCache.has(cacheKey)) {
        keyCache.set(cacheKey, encode === 'base64' 
            ? CryptoJS.enc.Base64.parse(data) 
            : CryptoJS.enc.Utf8.parse(data)
        );
    }
    return keyCache.get(cacheKey)!;
}

export function createAES(key: string, iv: string, encode?: 'base64') {
  const parsedKey = getParsed(key, encode);
  const parsedIv = getParsed(iv, encode);

  return {
    encrypt: (data: string) => {
      return CryptoJS.AES.encrypt(data, parsedKey, {
        iv: parsedIv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString();
    },
    decrypt: (data: string) => {
      const normalized = data.replace(/-/g, '+').replace(/_/g, '/')
      const decrypted = CryptoJS.AES.decrypt(normalized, parsedKey, {
        iv: parsedIv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return CryptoJS.enc.Utf8.stringify(decrypted);
    },
  }
}