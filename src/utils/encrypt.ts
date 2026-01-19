import CryptoJS from "crypto-js";
import HmacSHA1 from "crypto-js/hmac-sha1";
import elliptic from "elliptic";
import pako from "pako";
import hash from "hash.js";

const parsedKeyCache = new Map<string, CryptoJS.lib.WordArray>();

function getParsedKey(base64: string) {
  if (!parsedKeyCache.has(base64)) {
    parsedKeyCache.set(base64, CryptoJS.enc.Base64.parse(base64));
  }
  return parsedKeyCache.get(base64)!;
}

function zip(str: string) {
  return pako.gzip(str);
}

function typeArrayToWordArray(u8arr: Uint8Array) {
  const len = u8arr.length;
  const words: number[] = [];
  for (let i = 0; i < len; i++) {
    words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, len);
}

function wordToBytesArray(wordArray: CryptoJS.lib.WordArray) {
  const { words, sigBytes } = wordArray;
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
}

function unzip(u8arr: Uint8Array) {
  const data = pako.inflate(u8arr);
  return CryptoJS.enc.Utf8.stringify(typeArrayToWordArray(data));
}

function createAESCipher(base64Key: string, base64Iv: string) {
  const parsedKey = getParsedKey(base64Key);
  const parsedIv = getParsedKey(base64Iv);

  return {
    encrypt: (zipData: Uint8Array | string) => {
      const payload = typeof zipData === "string" ? zipData : typeArrayToWordArray(zipData);
      return CryptoJS.AES.encrypt(payload as any, parsedKey, {
        iv: parsedIv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString();
    },
    decryptToU8: (data: string) => {
      const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
      const decrypted = CryptoJS.AES.decrypt(normalized, parsedKey, {
        iv: parsedIv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      return wordToBytesArray(decrypted);
    }
  };
}

let _ec: elliptic.ec | null = null;
function getEC() {
  if (_ec) return _ec;
  const curves = elliptic.curves as any;
  const name = "secp256k1_dc";
  if (!curves[name]) {
    Object.defineProperty(curves, name, {
      configurable: true, enumerable: true,
      get: () => {
        const curve = new curves.PresetCurve({
          type: "short",
          prime: "k256",
          p: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f",
          a: "0",
          b: "7",
          n: "ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141",
          h: "1",
          hash: hash.sha256,
          beta: "7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee",
          lambda:
            "5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72",
          basis: [
            { a: "3086d221a7d46bcde86c90e49284eb15", b: "-e4437ed6010e88286f547fa90abfe4c3" },
            { a: "114ca50f7a8e2f3f657c1108d9d44cfd8", b: "3086d221a7d46bcde86c90e49284eb15" },
          ],
          gRed: false,
          g: [
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
          ],
        });
        Object.defineProperty(curves, name, { value: curve });
        return curve;
      }
    });
  }
  _ec = new (elliptic.ec as any)(name);
  return _ec;
}

export function createEncrypter(opts: { serverPublicKeyBase64: string; defaultSignKeyBase64: string }) {
  const ec:any = getEC();
  
  const serverKey = ec.keyFromPublic(Buffer.from(opts.serverPublicKeyBase64, "base64").toString("hex"), "hex");
  const clientKey = ec.genKeyPair();
  const shared = (serverKey as any).getPublic().mul(clientKey.getPrivate()).encode('array', false);

  const defaultKey = Buffer.from(shared.slice(1, 17)).toString("base64");
  const defaultIv = Buffer.from(shared.slice(17, 33)).toString("base64");
  const clientPublicKey = Buffer.from(clientKey.getPublic().encode('array', false)).toString("base64");

  const cipher = createAESCipher(defaultKey, defaultIv);

  return {
    clientPublicKey,
    createNonce: () => Math.round(Math.random() * 2 ** 63),
    createTimestamp: () => Date.now(),

    createSign: (data: string, nonce: number, timestamp: number, keyBase64 = opts.defaultSignKeyBase64) => {
      const payload = data + nonce + timestamp;
      const keyWA = getParsedKey(keyBase64);
      return CryptoJS.enc.Base64.stringify(HmacSHA1(payload, keyWA));
    },

    encrypt: (data: unknown, key = defaultKey, iv2 = defaultIv) => {
      const plain = typeof data === "string" ? data : JSON.stringify(data);
      const zipped = zip(plain);
      if (key === defaultKey && iv2 === defaultIv) return cipher.encrypt(zipped);
      return createAESCipher(key, iv2).encrypt(zipped);
    },

    decrypt: (data: string, key = defaultKey, iv2 = defaultIv) => {
      const u8 = (key === defaultKey && iv2 === defaultIv)
        ? cipher.decryptToU8(data)
        : createAESCipher(key, iv2).decryptToU8(data);
      return unzip(u8);
    }
  };
}