import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

class CloudWatchLogger {
  constructor(config = {}) {
    /** ---------------- 必填/配置（✅支持外部传入覆盖） ---------------- */
    this.awsAccessKey = "/#AWS_ACCESS_KEY#/";
    this.awsSecretKey = "/#AWS_SECRET_KEY#/";
    this.region = (config.region || "ap-northeast-1").replace(/"/g, ""); // ✅修复你多出来的引号
    this.groupName = config.groupName || "DEV-YH-APP-LOGS-STANDARD";
    this.streamName = config.streamName; // 建议外部传固定的，不要每条日志变

    /** ---------------- 行为开关 ---------------- */
    this.silent = !!config.silent; // true = 不刷 console.log
    this.maxRetry = Number(config.maxRetry || 2); // sequenceToken 错误重试次数（别太高）
    this.timeoutMs = Number(config.timeoutMs || 8000);

    /** ---------------- 内部状态 ---------------- */
    this.sequenceToken = null;
    this.isInitialized = false;
    this._initPromise = null; // ✅ 初始化锁（避免并发 initialize）

    /** ---------------- CloudWatch client ---------------- */
    this.client = new CloudWatchLogsClient({
      region: this.region,
      credentials: {
        accessKeyId: this.awsAccessKey,
        secretAccessKey: this.awsSecretKey,
      },
    });

    if (!this.streamName) {
      // ✅ 没传 streamName 就给个默认：每天一个 + 随机后缀（同页面生命周期不变）
      const day = new Date().toISOString().slice(0, 10);
      const rand = Math.random().toString(36).slice(2, 6);
      this.streamName = `${this.groupName}-${day}-${rand}`;
    }
  }

  /* ---------------- 小工具 ---------------- */

  _log(...args) {
    if (!this.silent) console.log(...args);
  }
  _warn(...args) {
    if (!this.silent) console.warn(...args);
  }
  _err(...args) {
    console.error(...args);
  }

  _withTimeout(promise, label = "cw") {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), this.timeoutMs);
    // AWS SDK v3 支持 abortSignal
    return Promise.race([
      promise(ac.signal),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error(`${label}_timeout_${this.timeoutMs}ms`)), this.timeoutMs)
      ),
    ]).finally(() => clearTimeout(t));
  }

  /** ---------------- 初始化（✅带锁） ---------------- */

  async ensureInitialized() {
    if (this.isInitialized) return true;
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      try {
        await this.ensureLogGroup();
        await this.ensureLogStream();
        this.isInitialized = true;
        this._log("✅ CloudWatch Logger 初始化成功", {
          groupName: this.groupName,
          streamName: this.streamName,
          region: this.region,
        });
        return true;
      } catch (e) {
        this._err("❌ CloudWatch Logger 初始化失败:", e);
        this.isInitialized = false;
        return false;
      } finally {
        // 失败也清掉，允许后续重试
        this._initPromise = null;
      }
    })();

    return this._initPromise;
  }

  async initialize() {
    // 兼容你旧代码的调用
    return this.ensureInitialized();
  }

  /** ---------------- 确保 LogGroup 存在 ---------------- */

  async ensureLogGroup() {
    try {
      const cmd = new DescribeLogGroupsCommand({
        logGroupNamePrefix: this.groupName,
      });

      const response = await this.client.send(cmd);
      const groupExists = response.logGroups?.some(
        (g) => g.logGroupName === this.groupName
      );

      if (!groupExists) {
        this._log(`📁 创建日志组: ${this.groupName}`);
        const createCmd = new CreateLogGroupCommand({
          logGroupName: this.groupName,
        });
        await this.client.send(createCmd);
      }
    } catch (error) {
      if (error?.name !== "ResourceAlreadyExistsException") throw error;
    }
  }

  /** ---------------- 确保 LogStream 存在 + 读取 sequenceToken ---------------- */

  async ensureLogStream() {
    try {
      const cmd = new DescribeLogStreamsCommand({
        logGroupName: this.groupName,
        logStreamNamePrefix: this.streamName,
      });

      const response = await this.client.send(cmd);
      const existingStream = response.logStreams?.find(
        (s) => s.logStreamName === this.streamName
      );

      if (!existingStream) {
        this._log(`📄 创建日志流: ${this.streamName}`);
        const createCmd = new CreateLogStreamCommand({
          logGroupName: this.groupName,
          logStreamName: this.streamName,
        });
        await this.client.send(createCmd);
        this.sequenceToken = null;
      } else {
        // ✅ 读取现有 token
        this.sequenceToken = existingStream.uploadSequenceToken || null;
      }
    } catch (error) {
      if (error?.name !== "ResourceAlreadyExistsException") throw error;
    }
  }

  /* ---------------- 发送单条日志（✅处理 token 异常） ---------------- */

  async log(message, level = "INFO", attempt = 0) {
    const ok = await this.ensureInitialized();
    if (!ok) return false;

    try {
      const payload =
        typeof message === "string"
          ? { message }
          : (message || {});

      const messageData = {
        ...payload,
        level,
        targetType: 'web-error-page',
      };

      const logEvent = {
        message:
          typeof message === "string"
            ? message
            : JSON.stringify(messageData),
        timestamp: Date.now(),
      };

      const params = {
        logGroupName: this.groupName,
        logStreamName: this.streamName,
        logEvents: [logEvent],
        ...(this.sequenceToken ? { sequenceToken: this.sequenceToken } : {}),
      };

      const cmd = new PutLogEventsCommand(params);

      const response = await this.client.send(cmd);
      this.sequenceToken = response.nextSequenceToken || this.sequenceToken;

      // 不要每条都 console.log（会炸），你要看可以 silent=false
      // this._log(`✅ 日志发送成功 [${level}]`);
      return true;
    } catch (error) {
      // ✅ 这两个是最常见的 token 异常
      if (error?.name === "InvalidSequenceTokenException") {
        this.sequenceToken = error.expectedSequenceToken || this.sequenceToken;
        if (attempt < this.maxRetry) {
          this._warn("🔄 sequenceToken 不匹配，重试...", { attempt: attempt + 1 });
          return this.log(message, level, attempt + 1);
        }
      }

      // ✅ 有时 AWS 会提示：这条 event 已经写入了（重复提交）
      if (error?.name === "DataAlreadyAcceptedException") {
        this.sequenceToken = error.expectedSequenceToken || this.sequenceToken;
        return true;
      }

      this._err("❌ 日志发送失败:", error);
      return false;
    }
  }

  async info(message) {
    return this.log(message, "INFO");
  }
  async debug(message) {
    return this.log(message, "DEBUG");
  }
  async warn(message) {
    return this.log(message, "WARN");
  }
  async error(message) {
    return this.log(message, "ERROR");
  }

  /* ---------------- 批量发送（✅排序 + token 异常） ---------------- */

  async logBatch(messages = [], attempt = 0) {
    const ok = await this.ensureInitialized();
    if (!ok) return false;

    if (!Array.isArray(messages) || messages.length === 0) return true;

    try {
      // ✅ CloudWatch 要求按 timestamp 升序
      const now = Date.now();
      const logEvents = messages.map((msg, i) => ({
        message: typeof msg === "string" ? msg : JSON.stringify(msg),
        timestamp: now + i, // ✅ 确保严格递增（同毫秒也 OK）
      }));

      const params = {
        logGroupName: this.groupName,
        logStreamName: this.streamName,
        logEvents,
        ...(this.sequenceToken ? { sequenceToken: this.sequenceToken } : {}),
      };

      const cmd = new PutLogEventsCommand(params);
      const response = await this.client.send(cmd);

      this.sequenceToken = response.nextSequenceToken || this.sequenceToken;
      this._log(`✅ 批量日志发送成功，共 ${messages.length} 条`);
      return true;
    } catch (error) {
      if (error?.name === "InvalidSequenceTokenException") {
        this.sequenceToken = error.expectedSequenceToken || this.sequenceToken;
        if (attempt < this.maxRetry) {
          this._warn("🔄 batch token 不匹配，重试...", { attempt: attempt + 1 });
          return this.logBatch(messages, attempt + 1);
        }
      }
      if (error?.name === "DataAlreadyAcceptedException") {
        this.sequenceToken = error.expectedSequenceToken || this.sequenceToken;
        return true;
      }

      this._err("❌ 批量日志发送失败:", error);
      return false;
    }
  }

  /* ---------------- 连接检查 / 状态 ---------------- */

  async checkConnection() {
    try {
      const cmd = new DescribeLogGroupsCommand({
        logGroupNamePrefix: this.groupName,
        limit: 1,
      });
      await this.client.send(cmd);
      this._log("✅ CloudWatch 连接正常");
      return true;
    } catch (error) {
      this._err("❌ CloudWatch 连接失败:", error);
      return false;
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      groupName: this.groupName,
      streamName: this.streamName,
      region: this.region,
      hasSequenceToken: !!this.sequenceToken,
    };
  }
}

export { CloudWatchLogger };
