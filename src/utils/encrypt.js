/**
 * 数据加密算法
 * 原数据->JSON->GZIP压缩->Aes加密->所以无需在Base64加密
 *
 * 签名生成
 * sign = （加密之后的string数据 + nonce + timestamp）-> HmacSHA1加密 -> Base64加密
 */
import CryptoJS from "crypto-js";
import HmacSHA1 from "crypto-js/hmac-sha1";
import elliptic from "elliptic";
import pako from "pako";
import hash from "hash.js";
import { AES } from "~/utils/aes-encrypt";

import { serverPublicKey, defaultSignKey } from "@/constant/encrypt.constant";

// gzip压缩 gzip 传入的参数只要不是string都是会直接崩溃的
function zip(str) {
  // string 输出字符串
  // [object ArrayBuffer] 输出Unit8Array
  return pako.gzip(str, { to: "[object ArrayBuffer]" });
}

// gzip解压
function unzip(key) {
  // GZIP解压
  const data = pako.inflate(key);
  // 16进制字节流 转wordArray
  const wordArray = typeArrayToWordArray(data);
  // wordArray 转UTF-8
  return CryptoJS.enc.Utf8.stringify(wordArray);
}

// aes加密
function aesEncrypt(zipData, key, iv) {
  // Uint8Array的数据转成WordArray的数据
  if (typeof zipData !== "string") {
    zipData = typeArrayToWordArray(zipData);
  }

  const aes = new AES(key, iv, "base64");
  return aes.encrypt(zipData);
}

// aes解密
function aesDecrypt(data, key, iv) {
  const aes = new AES(key, iv, "base64");
  const decrypt = aes.decrypt(data, true);
  // 这里转成Unit8Array方便Gzip解压
  return wordToBytesArray(decrypt);
}

// typedArrayToWordArray 字节数组转word数组
function typeArrayToWordArray(u8arr) {
  // Shortcut
  const len = u8arr.length;
  // Convert
  const words = [];
  for (let i = 0; i < len; i++) {
    words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, len);
}

// wordArray 转 字节数组
const wordToBytesArray = function (wordArray) {
  // Shortcuts
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  // Convert
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
};

function defineCurve(name, options) {
  const curves = elliptic.curves;

  Object.defineProperty(curves, name, {
    configurable: true,
    enumerable: true,
    get: () => {
      const curve = new curves.PresetCurve(options);
      Object.defineProperty(curves, name, {
        configurable: true,
        enumerable: true,
        value: curve,
      });
      return curve;
    },
  });
}

class Encrypter {
  constructor() {
    defineCurve("secp256k1_dc", {
      type: "short",
      prime: "k256",
      p: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f",
      a: "0",
      b: "7",
      n: "ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141",
      h: "1",
      hash: hash.sha256,

      // Precomputed endomorphism
      beta: "7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee",
      lambda:
        "5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72",
      basis: [
        {
          a: "3086d221a7d46bcde86c90e49284eb15",
          b: "-e4437ed6010e88286f547fa90abfe4c3",
        },
        {
          a: "114ca50f7a8e2f3f657c1108d9d44cfd8",
          b: "3086d221a7d46bcde86c90e49284eb15",
        },
      ],

      gRed: false,
      g: [
        "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
        "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
        //   pre,
      ],
    });
    const EC = elliptic.ec;
    const ec = new EC("secp256k1_dc");
    console.log("------", process.env.APP_ENV);

    // const publicKey = ['prod', 'rc'].includes(process.env.APP_ENV)
    const publicKey = true
      ? serverPublicKey
      : "BElAIHPmPBODGR+vDbITpY8sTEETYNs2iA0YSrr0L5LE8B9IPy50evh7Yu0RGKxTI9TtoJtaZhT3PAPi7QgeL40=";
    const serverKey = ec.keyFromPublic(
      Buffer.from(publicKey, "base64").toString("hex"),
      "hex"
    );

    const clientKey = ec.genKeyPair();
    const aesKey = serverKey
      .getPublic()
      .mul(clientKey.getPrivate())
      .encode()
      .slice(1, 17);
    const iv = serverKey
      .getPublic()
      .mul(clientKey.getPrivate())
      .encode()
      .slice(17, 33);

    this.defaultKey = Buffer.from(aesKey).toString("base64");
    this.defaultIv = Buffer.from(iv).toString("base64");
    this.defaultSign = true //['prod', 'rc'].includes(process.env.APP_ENV)
      ? defaultSignKey
      : "sPTF7hdkWstUizFk6Y9y6Q==";
    this.clientPublicKey = Buffer.from(clientKey.getPublic().encode()).toString(
      "base64"
    );
  }

  /**
   * 数据加密
   * param { data } 明文JSON字符串
   * param { key } 当前加密算法通用密钥
   */
  encrypt = (data, key = this.defaultKey, iv = this.defaultIv) => {
    if (typeof data !== "string") {
      data = JSON.stringify(data);
    }
    // zip压缩数据
    const zipData = zip(data);
    // aes加密 直接输出Base64加密的数据 所以无需在Base64加密
    return aesEncrypt(zipData, key, iv);
  };

  /**
   * 生成签名
   * param { data } 加密后数据
   * param { nonce } long整型 随机数
   * param { timestamp } 当前时间戳
   * param { key } 生成签名的密钥 当前应该是和加密的密钥是同一个
   */
  createSign = (data, nonce, timestamp, key = this.defaultSign) => {
    // sign 字符串
    const sign = data + nonce + timestamp;
    key = CryptoJS.enc.Base64.parse(key);

    // hmacSHA1加密 -- 这里不需要做任何转吗，CryptoJS底层默认会转UTF-8
    const sha1Data = HmacSHA1(sign, key);

    // base64 加密数据
    return CryptoJS.enc.Base64.stringify(sha1Data);
  };

  /**
   * 创建long整型随机数
   * Java端说 只需要0-MaxValue就可以了
   */
  createNonce = () => {
    return Math.round(Math.random() * 2 ** 63);
  };

  /**
   * 创建时间戳
   * TODO 再次之前应该向服务器拉取服务器时间，之后校验本地时间
   */
  createTimestamp = () => {
    return new Date().getTime();
  };

  /**
   * 数据解密
   * param { data } 加密数据
   * param { key } 当前加密算法通用密钥
   */
  decrypt = (data, key = this.defaultKey, iv = this.defaultIv) => {
    // aes解密
    const aesData = aesDecrypt(data, key, iv);

    // GZIP解密
    return unzip(aesData);
  };
}

const encrypter = new Encrypter();

export default encrypter;
