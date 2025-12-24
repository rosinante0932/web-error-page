class LogConfig {
  // 路由的黑名单

  static exactBlacklist = [`/gw/${import.meta.env.VITE_APP_ENV}-api/captchaImage`]

  static shouldSkipLogging(path) {
    return this.exactBlacklist.includes(path)
  }

  // 参数字段的黑名单 - 预处理为小写以提高性能 ❗️❗️❗️ 不要写大写或者驼峰，一定要写小写
  static _sensitiveFieldsLower = [
    'password',
    'email',
    'account',
    'phone',
    'userid',
    'amount',
    'token',
  ]

  // 使用 Set 提高查找性能，O(1) vs O(n)
  static _sensitiveFieldsSet = new Set(this._sensitiveFieldsLower)

  // 缓存已转换的 key，避免重复转换
  static _keyCache = new Map()

  /**
   * @func paramfilter
   * @param {*} params
   * @desc 过滤敏感字段的方法
   */
  static paramfilter(params) {
    if (params == null) return {}

    let result

    if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
      // 直接使用，避免不必要的复制
      result = params
    } else if (typeof params === 'object' && params !== null) {
      // 只在需要时转换
      result = { ...params }
    } else {
      // 对于非 Map 类型，避免昂贵的 JSON 序列化
      if (Array.isArray(params)) {
        const processedList = this._processListRecursively(params)
        result = { 'data': processedList }
      } else {
        result = params.toString()
      }
    }

    // 就地修改，避免创建新对象
    this._removeSensitiveFieldsRecursively(result)

    console.log('-----😭😭 result-----------', result, '----------------result--------')
    return result
  }

  /**
   * @func _isSensitiveField
   * @param {*} key
   * @desc 敏感字段检测
   */
  static _isSensitiveField(key) {
    // 先转换为小写进行比较
    const lowerKey = key.toLowerCase()

    // 使用小写的 key 作为缓存键
    if (this._keyCache.has(lowerKey)) {
      return this._keyCache.get(lowerKey)
    }

    let isSensitive = false

    // 首先检查精确匹配 (O(1))
    if (this._sensitiveFieldsSet.has(lowerKey)) {
      isSensitive = true
    } else {
      // 然后检查包含关系
      for (const field of this._sensitiveFieldsLower) {
        if (lowerKey.includes(field)) {
          isSensitive = true
          break
        }
      }
    }

    this._keyCache.set(lowerKey, isSensitive)
    return isSensitive
  }

  /**
   * @func _processListRecursively
   * @param {*} list
   * @desc 递归处理列表
   */
  static _processListRecursively(list) {
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        this._removeSensitiveFieldsRecursively(item)
      } else if (Array.isArray(item)) {
        this._processListRecursively(item)
      }
    }
    return list
  }

  /**
   * @func _removeSensitiveFieldsRecursively
   * @param {*} data
   * @desc 递归删除敏感字段
   */
  static _removeSensitiveFieldsRecursively(data) {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      this._processMapRecursively(data)
    } else if (Array.isArray(data)) {
      this._processListRecursively(data)
    }
  }

  /**
   * @func _processMapRecursively
   * @param {*} data
   * @desc 处理Map类型的递归过滤
   */
  static _processMapRecursively(data) {
    const keysToRemove = []

    Object.keys(data).forEach(key => {
      const value = data[key]
      if (this._isSensitiveField(key)) {
        keysToRemove.push(key)
      } else {
        // 递归处理嵌套结构
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          this._processMapRecursively(value)
        } else if (Array.isArray(value)) {
          this._processListRecursively(value)
        } else if (typeof value === 'object' && value !== null) {
          try {
            const convertedMap = { ...value }
            this._processMapRecursively(convertedMap)
            data[key] = convertedMap
          } catch (e) {
            // 转换失败，保持原值，这里其实就是防止转换错误造成阻塞
          }
        }
      }
    })

    // 批量移除敏感字段
    for (const key of keysToRemove) {
      delete data[key]
    }
  }

  /**
   * @func clearCache
   * @desc 清理缓存的方法
   */
  static clearCache() {
    this._keyCache.clear()
  }
}

export { LogConfig }
