import { createAES } from "~/utils/aes-encrypt";
import { encryptKey, encryptIv, encryptHeader } from "@/constant/encrypt.constant";

type Keys = { key: string; iv: string };
type AESLike = ReturnType<typeof createAES>;

class UrlEncrypter {
  private prefix: string = encryptHeader;
  private keys: Keys = { key: encryptKey, iv: encryptIv };
  private aesInstance: AESLike | null = null;

  private getAES() {
    if (!this.aesInstance) {
      this.aesInstance = createAES(this.keys.key, this.keys.iv, 'base64');
    }
    return this.aesInstance;
  }

  now() {
    return Date.now();
  }

  private urlSafeBase64(s: string) {
    return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  encryptURL(url: string) {
    const mixed = String(this.now()) + url;
    const encrypted = this.getAES().encrypt(mixed);
    return this.prefix + this.urlSafeBase64(encrypted);
  }

  encrypt(config: any) {
    let url: string = config.url || "/";
    if (!url.startsWith("/")) url = "/" + url;

    // 如果业务需要加密 URL，直接同步执行
    // config.url = this.encryptURL(url);
    
    config.headers = {
        ...config.headers,
        SKKTW: "web",
        QHUJK: "1"
    };
    return config;
  }
}

export const urlEncrypter = new UrlEncrypter();