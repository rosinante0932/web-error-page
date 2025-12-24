import axios from 'axios'
import encrypt from '../utils/encrypt'
import { urlEncrypter } from '../utils/url-encrypt'
import { SITE_URL } from 'astro:env/server'
import { appVersion } from '@/constant/encrypt.constant'

const service = axios.create({
  baseURL: SITE_URL,
  timeout: 10000,
})
let loadDeviceIdPromise = Promise.resolve()

const isProd = true

// request 拦截器
service.interceptors.request.use(
  async config => {
    config.url = '/gw' + config.url

    const deviceId = '4d9120333b97a1412437f4ee0b2dc632'
    config.headers.deviceId = deviceId
    config.headers['Content-Type'] = 'application/json'
    let userId = 0
    const day3 = 3600 * 24 * 3 * 1000
    if (!userId || Date.now() - Math.abs(userId) > day3) {
      userId = -Date.now()
    }
    const token = config.data.token || ''
    delete config.data.token
    config.data = {
      // param 里面传参 其余是公共部分, 公共部分有13个参数
      deviceId,
      param: config.data,
      notificationStatus: 0,
      timestamp: new Date().getTime(),
      // osVersion: navigator.userAgent,
      // 'deviceId': '2CCD0382-7962-4D2B-8AE4-27968C93A8F9',
      // 'appId': 'com.wallet.bihui',
      // 'userId': '100200',
      // 'userId': '100344',
      // deviceName: 'PC',
      // platform: 3,
      deviceName: 'mobile',
      platform: 4, // 1 ios, 2 andriod
      lbs: '',
      network: -1,
      screenSize: `${390}, ${844}`,
      // screenSize: `{${document.body.clientWidth}, ${document.body.clientHeight}}`,
      userId: parseInt(userId.toString()),
      appType: 1,
    }
    config.data.token = token
    config.headers['dt-nonce'] = encrypt.createNonce()
    config.headers['dt-encrypted'] = false
    console.log(appVersion, 'appVersion===============')
    config.headers['app-version'] = appVersion
    config.headers['app-type'] = '20'
    config.headers['easy-web-version'] = 'v02'
    //((process.env.ENV === 'rc' || process.env.ENV === 'prod') && process.env.encrypt)
    if (false) {
      config.headers['dt-timestamp'] = encrypt.createTimestamp()
      // config.headers['dt-nonce'] = encrypt.createNonce()
      config.headers['dt-sign'] = encrypt.createSign(
        encrypt.encrypt(config.data),
        config.headers['dt-nonce'],
        config.headers['dt-timestamp']
      )
      config.headers['dt-encrypted'] = true
      config.headers['dt-gzipped'] = true
      config.headers['dt-encrypt-version'] = 3
      config.headers['dt-client-key'] = encrypt.clientPublicKey
      // config.headers['eb-version'] = 'v20'
      if (false) {
        const originConfig = JSON.parse(JSON.stringify(config))
        // console.groupCollapsed('%c请求拦截', 'padding: 2px;color: #CCCCCC;background: #003366;font-weight: bold;')
        // console.log(originConfig)
        // console.groupEnd()
      }
      if (config.url !== '/gw/common/appUpdate') {
        config.data = encrypt.encrypt(config.data)
        // console.log( config.data,'2222222111111')
      } else {
        config.headers['dt-encrypted'] = false
        config.headers['appType'] = ''
        config.headers['appVersion'] = ''
      }
      // URL动态加密
      await urlEncrypter.encrypt(config)
    }

    console.log(config.headers, 'config.headers=======')

    return config
  },
  error => {
    // clearUrl()
    return Promise.resolve({
      code: error.code,
      message: error.message || JSON.stringify(error),
    })
  }
)

// response 拦截器
service.interceptors.response.use(
  response => {
    if (true && Object.prototype.toString.call(response.data) !== '[object Object]') {
      // console.log('service.interceptors.response0:', response)
      // console.log('service.interceptors.response-decrypt:', encrypt.decrypt(response.data))
      response.data = JSON.parse(encrypt.decrypt(response.data))
      if (!isProd) {
        // console.groupCollapsed('%c响应拦截', 'padding: 2px;color: white;background: #000000;font-weight: bold;')
        // console.log('url: ', urlEncrypter.decrypt(response.config.url))
        // console.log('data: ', response.data)
        // console.groupEnd()
      }
    }
    const res = response.data
    // console.log('service.interceptors.response1:', res)
    if (response && response.data instanceof Object && `${response.data.code}` === '4002') {
      // Notification.error({
      //   title: res.msg || res.message || 'Error',
      //   duration: 5000,
      // })
      return
    }
    // 错误码处理
    // console.log('service.interceptors.response2:', res)
    if (res.code !== 200 && res.code !== 2000) {
      // Notification.error({
      //   title: res.msg || res.message || 'Error',
      //   duration: 5000,
      // })
      return Promise.reject(new Error(res.msg || res.message || 'Error'))
    } else {
      // console.log('service.interceptors.response3:', res)
      return res
    }
  },
  error => {
    // console.error('error', error.message)
    // Notification.error({
    //   title: error.msg || error.message || 'Error',
    //   duration: 5000,
    // })
    return Promise.reject({
      code: error.status || 500,
      message: error.message || JSON.stringify(error),
    })
  }
)
export default service
