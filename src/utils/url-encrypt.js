import dayjs from "dayjs";
import { serverTime } from "~/api/user";
import { AES } from "~/utils/aes-encrypt";
import {
  encryptKey,
  encryptIv,
  encryptHeader,
} from "@/constant/encrypt.constant";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

class UrlEncrypter {
  constructor() {
    this.prefix = encryptHeader;
    this.keysDev = {
      key: encryptKey,
      iv: encryptIv,
    };
    this.keysProd = {
      key: encryptKey,
      iv: encryptIv,
    };
    this.timeDiff = 0;
    // 是否已经校对过服务器时间
    this.alignTimeFlag = false;
    this.alignTime();
  }

  now() {
    return dayjs().valueOf();
  }

  async alignTime() {
    if (this.alignTimeFlag) {
      return;
    }
    try {
      // const resp = await serverTime();
      // console.log(resp.data, "获取服务器时间");

      const resp = {
        data: {
          serverTime: new Date().toISOString(), // ISO 格式时间字符串
          serverTimestamp: Date.now(), // 时间戳
        },
      };

      let servTimestamp;
      if (resp.data.serverTimestamp) {
        servTimestamp = resp.data.serverTimestamp;
      } else {
        const servTime = resp.data.serverTime;
        servTimestamp = dayjs.tz(servTime, "Asia/Shanghai").valueOf();
      }
      this.timeDiff = servTimestamp - this.now();
      this.alignTimeFlag = true;
    } catch (e) {
      console.log("align server time error:", e);
    }
  }

  async time() {
    await this.alignTime();
    return this.now() + this.timeDiff;
  }

  async encryptURL(url) {
    const keys = process.env.APP_ENV === "prod" ? this.keysProd : this.keysDev;
    const mixed = String(await this.time()) + url;
    const aes = new AES(keys.key, keys.iv);
    let enc = aes.encrypt(mixed);
    enc = enc.replace(/\+/g, "-");
    enc = enc.replace(/\//g, "_");
    enc = enc.replace(/=/g, "");
    return this.prefix + enc;
  }

  async encrypt(axiosRequestConfig) {
    const config = axiosRequestConfig;
    let url = config.url;
    if (!url.startsWith("/")) {
      url = "/" + url;
    }
    // config.url = await this.encryptURL(url);
    config.url = url;
    config.headers.SKKTW = "web";
    config.headers.QHUJK = "1";
  }
  decrypt(url) {
    const keys = process.env.APP_ENV === "prod" ? this.keysProd : this.keysDev;
    const entireURL = url.startsWith(location.origin)
      ? url.replace(location.origin, "")
      : url;
    const originURL = entireURL.replace(this.prefix, "");
    const decryptPath = new AES(keys.key, keys.iv).decrypt(originURL);
    const [, origin] = decryptPath.split("/gw");
    return origin;
  }
}

export const urlEncrypter = new UrlEncrypter();
