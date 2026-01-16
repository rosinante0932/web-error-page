import CryptoJS from 'crypto-js'

export class AES {
  constructor(key, iv, encode) {
    if (encode === 'base64') {
      this.key = CryptoJS.enc.Base64.parse(key)
      this.iv = CryptoJS.enc.Base64.parse(iv)
    } else {
      this.key = CryptoJS.enc.Utf8.parse(key)
      this.iv = CryptoJS.enc.Utf8.parse(iv)
    }
  }

  encrypt = data => {
    // 这里key一定要转UTF-8 否则会发现每次Aes结果都不一样 没找到原因
    // 这里的加密模式是CBC 虽然他们文档写的ECB 但是Java后端全都是CBC的
    // padding 数据对齐方式后端是cs5 前端此时选择cs7结果都是一样的，这个一定是没问题的，另一个原因是前端只有cs7，说是cs7和cs5几乎没区别。
    const encrypt = CryptoJS.AES.encrypt(data, this.key, {
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    return encrypt.toString()
  }

  decrypt = (data, raw = false) => {
    data = data.replace(/-/g, '+')
    data = data.replace(/_/g, '/')
    const decrypted = CryptoJS.AES.decrypt(data, this.key, {
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    if (raw) {
      return decrypted
    } else {
      return CryptoJS.enc.Utf8.stringify(decrypted)
    }
  }
}
