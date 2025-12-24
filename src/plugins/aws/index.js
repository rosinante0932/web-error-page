import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs'
import { getToken } from '../../utils/auth'

/**
 * @func CloudWatchLogger
 * @desc CloudWatch 日志
 */
class CloudWatchLogger {
  constructor(config) {
    this.awsAccessKey = config.awsAccessKey
    this.awsSecretKey = config.awsSecretKey
    this.region = config.region
    this.groupName = config.groupName
    this.streamName = config.streamName

    // 创建CloudWatch Logs客户端
    this.client = new CloudWatchLogsClient({
      region: this.region,
      credentials: {
        accessKeyId: this.awsAccessKey,
        secretAccessKey: this.awsSecretKey,
      },
    })

    this.sequenceToken = null
    this.isInitialized = false
  }

  /**
   * @func initialize
   * @desc 初始化日志组和日志流
   */
  async initialize() {
    try {
      // 检查并创建日志组
      await this.ensureLogGroup()

      // 检查并创建日志流
      await this.ensureLogStream()

      this.isInitialized = true
      console.log('✅ CloudWatch Logger 初始化成功')
      return true
    } catch (error) {
      console.error('❌ CloudWatch Logger 初始化失败:', error)
      return false
    }
  }

  /**
   * @func ensureLogGroup
   * @desc 确保日志组存在
   */
  async ensureLogGroup() {
    try {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: this.groupName,
      })

      const response = await this.client.send(command)
      const groupExists = response.logGroups?.some(group => group.logGroupName === this.groupName)

      if (!groupExists) {
        console.log(`📁 创建日志组: ${this.groupName}`)
        const createCommand = new CreateLogGroupCommand({
          logGroupName: this.groupName,
        })
        await this.client.send(createCommand)
      }
    } catch (error) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        throw error
      }
    }
  }

  /**
   * @func ensureLogStream
   * @desc 确保日志流存在
   */
  async ensureLogStream() {
    try {
      const command = new DescribeLogStreamsCommand({
        logGroupName: this.groupName,
        logStreamNamePrefix: this.streamName,
      })

      const response = await this.client.send(command)
      const streamExists = response.logStreams?.some(
        stream => stream.logStreamName === this.streamName,
      )

      if (!streamExists) {
        console.log(`📄 创建日志流: ${this.streamName}`)
        const createCommand = new CreateLogStreamCommand({
          logGroupName: this.groupName,
          logStreamName: this.streamName,
        })
        await this.client.send(createCommand)
      } else {
        // 获取现有的序列号
        const existingStream = response.logStreams?.find(
          stream => stream.logStreamName === this.streamName,
        )
        this.sequenceToken = existingStream?.uploadSequenceToken
      }
    } catch (error) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        throw error
      }
    }
  }

  /**
   * @func log
   * @param {} data
   * @param {} userinfo 用户信息
   * @param {string} encryptedParam 加密请求参数
   * @param {string} responseLog 返回日志
   * @param {string} level INFO | DEBUG | WARN | ERROR 日志等级
   * @desc 发送日志到CloudWatch
   */
  async log(data, userinfo, encryptedParam, responseLog, level = 'INFO') {
    if (!this.isInitialized) {
      console.log('⏳ 正在初始化CloudWatch Logger...')
      const initialized = await this.initialize()
      if (!initialized) {
        console.error('❌ 无法发送日志：初始化失败')
        return false
      }
    }

    const parseUserinfo = JSON.parse(userinfo)

    try {
      // 创建扁平化的日志对象
      const flatLogData = {
        timestamp: new Date().toISOString(),
        level: level,
        url: data.url, // 直接作为顶级字段
        'LOG_GROUP_NAME': this.groupName || '',
        'LOG_STREAM_NAME': this.streamName || '',
        'timestamp': new Date().toISOString(),
        'message': data.message,
        'encrypted_param': encryptedParam || '',
        'targetType': parseUserinfo?.user?.snoType || '',
        'userId': parseUserinfo?.userId || '',
        'areaCode': parseUserinfo?.areaCode || '+86',
        'userAccount': parseUserinfo?.user?.userName || '',
        'nickname': parseUserinfo?.user?.nickName || '',
        'mobile': parseUserinfo?.user?.phonenumber || '',
        'email': parseUserinfo?.user?.email || '',
        'token': getToken() || '',
        'userType': parseUserinfo?.userType || '',
        'traceId': data?.traceId || '',
        'deviceId': data?.deviceId || '',
        'clientIp': parseUserinfo?.user?.loginIp || '',
        'qrcode': '',
        'responseLog': responseLog,
      }

      const logEvent = {
        message: JSON.stringify(flatLogData),
        timestamp: Date.now(),
      }

      const params = {
        logGroupName: this.groupName,
        logStreamName: this.streamName,
        logEvents: [logEvent],
      }

      // 如果有序列号，添加到参数中
      if (this.sequenceToken) {
        params.sequenceToken = this.sequenceToken
      }

      const command = new PutLogEventsCommand(params)
      const response = await this.client.send(command)

      // 更新序列号
      this.sequenceToken = response.nextSequenceToken

      console.log(
        `✅ 日志发送成功 [${level}]: ${logEvent.message.substring(0, 100)}${logEvent.message.length > 100 ? '...' : ''}`,
      )
      return true
    } catch (error) {
      console.error('❌ 日志发送失败:', error)

      // 如果是序列号错误，重置并重试
      if (error.name === 'InvalidSequenceTokenException') {
        console.log('🔄 序列号错误，重置后重试...')
        this.sequenceToken = error.expectedSequenceToken
        return await this.log(message, level)
      }

      return false
    }
  }

  /**
   * @func info
   * @param {*} message 基本信息
   * @param {*} userinfo 用户信息
   * @param {string} encryptedParam 加密的参数
   * @param {string} responseLog 返回值
   * 发送INFO级别日志
   */
  async info(message, userinfo, encryptedParam, responseLog) {
    return await this.log(message, userinfo, encryptedParam, responseLog, 'INFO')
  }

  /**
   * @func debug
   * @param {*} message 基本信息
   * @param {*} userinfo 用户信息
   * @param {string} encryptedParam 加密的参数
   * @param {string} responseLog 返回值
   * @desc 发送DEBUG级别日志
   */
  async debug(message, userinfo, encryptedParam, responseLog) {
    return await this.log(message, userinfo, encryptedParam, responseLog, 'DEBUG')
  }

  /**
   * @func warn
   * @param {*} message 基本信息
   * @param {*} userinfo 用户信息
   * @param {string} encryptedParam 加密的参数
   * @param {string} responseLog 返回值
   * @desc 发送WARN级别日志
   */
  async warn(message, userinfo, encryptedParam, responseLog) {
    return await this.log(message, userinfo, encryptedParam, responseLog, 'WARN')
  }

  /**
   * @func error
   * @param {*} message 基本信息
   * @param {*} userinfo 用户信息
   * @param {string} encryptedParam 加密的参数
   * @param {string} responseLog 返回值
   * @desc 发送ERROR级别日志
   */
  async error(message, userinfo, encryptedParam, responseLog) {
    return await this.log(message, userinfo, encryptedParam, responseLog, 'ERROR')
  }

  /**
   * @func checkConnection
   * @desc 检查连接状态
   */
  async checkConnection() {
    try {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: this.groupName,
        limit: 1,
      })

      await this.client.send(command)
      console.log('✅ CloudWatch 连接正常')
      return true
    } catch (error) {
      console.error('❌ CloudWatch 连接失败:', error)
      return false
    }
  }

  /**
   * @func getStatus
   * @desc 获取状态信息
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      groupName: this.groupName,
      streamName: this.streamName,
      region: this.region,
      hasSequenceToken: !!this.sequenceToken,
    }
  }
}

/**
 * @func example
 * @desc 使用示例
 */
async function example() {
  // 配置CloudWatch Logger
  const logger = new CloudWatchLogger({
    awsAccessKey: 'YOUR_AWS_ACCESS_KEY',
    awsSecretKey: 'YOUR_AWS_SECRET_KEY',
    region: 'ap-northeast-1',
    groupName: 'my-app-logs',
    streamName: `my-app-stream-${new Date().toISOString()}`,
  })

  // 检查连接
  const isConnected = await logger.checkConnection()
  if (!isConnected) {
    console.error('无法连接到CloudWatch')
    return
  }

  // 发送单条日志
  await logger.info('Hello World!')

  // 发送不同级别的日志
  await logger.debug('这是调试信息')
  await logger.warn('这是警告信息')
  await logger.error('这是错误信息')

  // 发送对象
  await logger.info({
    userId: '12345',
    action: 'login',
    timestamp: new Date().toISOString(),
    metadata: {
      browser: 'Chrome',
      ip: '192.168.1.1',
    },
  })

  // 查看状态
  console.log('Logger状态:', logger.getStatus())
}

// 导出
export { CloudWatchLogger }
