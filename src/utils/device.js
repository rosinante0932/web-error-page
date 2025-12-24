import * as UAParser from 'ua-parser-js'

/**
 * @func isAndroidMobile
 * @returns {boolean}
 * @desc 是否为安卓移动端设备
 */
export function isAndroidMobile() {
  const parser = UAParser.UAParser()
  if (String(parser.os.name).toLowerCase().includes('linux')) {
    return true
  }
  return String(parser.os.name).toLowerCase().includes('android') && String(parser.device.type).toLowerCase().includes('mobile')
}

/**
 * @func isIOSMobile
 * @returns {boolean}
 * @desc 是否为苹果移动端设备
 */
export function isIOSMobile() {
  const parser = UAParser.UAParser()
  return String(parser.os.name).toLowerCase().includes('ios') && String(parser.device.type).toLowerCase().includes('mobile')
}

/**
 * @func isAndroidDevice
 * @returns {boolean}
 * @desc 是否为安卓设备
 */
export function isAndroidDevice() {
  const parser = new UAParser()
  const result = parser.getResult()
  return String(result.os.name).toLowerCase().includes('android')
}

/**
 * @func isIOSDevice
 * @returns {boolean}
 * @desc 是否为苹果设备
 */
export function isIOSDevice() {
  const parser = new UAParser()
  const result = parser.getResult()
  return String(result.os.name).toLowerCase().includes('ios')
}

/**
 * @func isMobileDevice
 * @returns {boolean}
 * @desc 是否为移动端设备
 */
export function isMobileDevice() {
  const parser = new UAParser()
  const result = parser.getResult()
  const deviceType = result.device.type
  return deviceType === 'mobile' || deviceType === 'tablet'
}

/**
 * @func getBrowserName
 * @returns {string}
 * @desc 获取浏览器厂商名字
 */
export function getBrowserName() {
  const parser = new UAParser()
  const result = parser.getResult()
  return result.browser.name
}

/**
 * @func isEdge
 * @returns {boolean}
 * @desc 是否为 Edge 浏览器
 */
export function isEdge() {
  const parser = new UAParser()
  const result = parser.getResult()
  return String(result.browser.name).toLowerCase().includes('edge')
}

/**
 * @func isChrome
 * @returns {boolean}
 * @desc 是否为 Chrome 浏览器
 */
export function isChrome() {
  const parser = new UAParser()
  const result = parser.getResult()
  return String(result.browser.name).toLowerCase().includes('chrome')
}

/**
 * @func isMobileConfig
 * @returns {boolean}
 * @desc 检测是否为 MobileConfig 环境
 */
export const isMobileConfig = route => {
  try {
    if (isIOSMobile() && route.query?.['__device-type'] === 'iOS') {
      return false
    }
    return true
  } catch (error) {
    return true
  }
}
