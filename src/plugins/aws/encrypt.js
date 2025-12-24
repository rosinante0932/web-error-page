class BrutalEncryption {
  /**
   * @func encryptHybrid
   * @param {string} plainText
   * @desc 加密方法体
   */
  static async encryptHybrid(plainText) {
    // 1. 加载 RSA 公钥
    const rsaKey = await this._rsaPublicKeyFromPem(
      import.meta.env.VITE_PEM?.toString().replace(/\\n/g, '\n'),
    )

    // 2. 生成 AES 密钥 & IV
    const aesKey = this._generateRandomBytes(32) // 256 bit
    const iv = this._generateRandomBytes(16) // 128 bit

    // 3. AES 加密明文
    const aes = await this._createAESEncrypter(aesKey)
    const encryptedText = await this._aesEncrypt(aes, plainText, iv)

    // 4. 使用 RSA 加密 AES 密钥
    const rsa = await this._createRSAEncrypter(rsaKey)
    const encryptedAesKey = await this._rsaEncryptBytes(rsa, aesKey)

    // 5. 返回结构
    return {
      'key': encryptedAesKey,
      'iv': this._base64Encode(iv),
      'data': encryptedText,
    }
  }

  /**
   * @func _generateRandomBytes
   * @param {number} length
   * @desc 生成随机数
   */
  static _generateRandomBytes(length) {
    const rand = new Uint8Array(length)
    crypto.getRandomValues(rand)
    return rand
  }

  /**
   * @func _rsaPublicKeyFromPem
   * @param {string} pem
   * @returns 公钥处理函数
   */
  static async _rsaPublicKeyFromPem(pem) {
    const pemContents = pem
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\r/g, '')
      .replace(/\n/g, '')
      .replace(/\s/g, '')

    const binaryString = atob(pemContents)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return await crypto.subtle.importKey(
      'spki',
      bytes.buffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt'],
    )
  }

  /**
   * @func _createAESEncrypter
   * @param {string} key
   * @desc 创建AES加密的方法
   */
  static async _createAESEncrypter(key) {
    return await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt'])
  }

  /**
   * @func _aesEncrypt
   * @param {*} encrypter
   * @param {*} plainText
   * @param {*} iv
   * @desc 将字符串转换为UTF-8字节数组
   */
  static async _aesEncrypt(encrypter, plainText, iv) {
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv },
      encrypter,
      new TextEncoder().encode(plainText),
    )
    return this._base64Encode(new Uint8Array(encrypted))
  }

  /**
   * @func _createRSAEncrypter
   * @param {Strinimport("aws-sdk/clients/cloudhsm").g} publicKey
   * @desc 公钥纯函数 注意避免直接使用这种重要的变量，未来有可能在这里做逻辑
   */
  static async _createRSAEncrypter(publicKey) {
    return publicKey
  }

  /**
   * @func _rsaEncryptBytes
   * @param {*} encrypter
   * @param {*} bytes
   * @desc 'SHA-256'类型的 无符号整数数组 转换为 Base64 编码的字符串
   */
  static async _rsaEncryptBytes(encrypter, bytes) {
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      encrypter,
      bytes,
    )
    return this._base64Encode(new Uint8Array(encrypted))
  }

  /**
   * @func _base64Encode
   * @param {*} bytes
   * @desc 二进制数据转换为 Base64 编码的字符串
   */
  static _base64Encode(bytes) {
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}

export { BrutalEncryption }
