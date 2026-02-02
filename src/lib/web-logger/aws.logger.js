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
    /** ---------------- 必填/配置（支持外部传入覆盖） ---------------- */
    this.awsAccessKey = "/#AWS_ACCESS_KEY#/";
    this.awsSecretKey = "/#AWS_SECRET_KEY#/";
    this.region = (config.region || "ap-northeast-1").replace(/"/g, "");
    this.groupName = config.groupName || "DEV-YH-APP-LOGS-STANDARD";
    this.streamName = config.streamName;

    /** ---------------- 行为开关 ---------------- */
    this.silent = !!config.silent;
    this.maxRetry = Number(config.maxRetry || 2);
    this.timeoutMs = Number(config.timeoutMs || 8000);

    /** ---------------- 内部状态 ---------------- */
    this.sequenceToken = null;
    this.isInitialized = false;
    this._initPromise = null;

    // 初始化失败冷却（避免错误风暴时不停 init）
    this._initCooldownUntil = 0;
    this._initCooldownMs = Number(config.initCooldownMs || 30_000); // 默认 30s

    // 发送队列：同一个 stream 必须串行（否则 token 风暴）
    this._sendQueue = Promise.resolve();

    /** ---------------- CloudWatch client ---------------- */
    this.client = new CloudWatchLogsClient({
      region: this.region,
      credentials: {
        accessKeyId: this.awsAccessKey,
        secretAccessKey: this.awsSecretKey,
      },
    });

    if (!this.streamName) {
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

  // 安全 stringify：防循环引用 + 截断（避免同步卡死/抛错）
  _safeStringify(x, maxLen = 6000) {
    try {
      const seen = new WeakSet();
      const s = JSON.stringify(x, (k, v) => {
        if (typeof v === "object" && v !== null) {
          if (seen.has(v)) return "[circular]";
          seen.add(v);
        }
        if (typeof v === "string" && v.length > 2000) {
          return v.slice(0, 2000) + "...[truncated]";
        }
        return v;
      });
      return s.length > maxLen ? s.slice(0, maxLen) + "...[truncated]" : s;
    } catch {
      return "[unstringifiable]";
    }
  }

  /**
   * @func _sendWithTimeout
   * @param {*} cmd 
   * @param {*} label 
   * @desc 给 client.send 加超时（不让请求挂死太久） 
   */
  async _sendWithTimeout(cmd, label = "cw_send") {
    // 注意：AWS SDK v3 对 abortSignal 支持因实现而异；
    // 这里用 Promise.race 实现“超时返回”，不阻塞调用方。
    return Promise.race([
      this.client.send(cmd),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error(`${label}_timeout_${this.timeoutMs}ms`)), this.timeoutMs)
      ),
    ]);
  }


  /**
   * @func ensureInitialized
   * @desc 初始化（带锁 + 冷却） 
   */
  async ensureInitialized() {
    if (this.isInitialized) return true;

    // 冷却期内直接拒绝，避免错误风暴时反复 init
    if (Date.now() < this._initCooldownUntil) return false;

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

        // 设置冷却，避免不停打 Describe/Create
        this._initCooldownUntil = Date.now() + this._initCooldownMs;
        return false;
      } finally {
        this._initPromise = null;
      }
    })();

    return this._initPromise;
  }

  async initialize() {
    return this.ensureInitialized();
  }

  /**
   * @func ensureLogGroup
   * @desc 守卫函数 确保 LogGroup 存在
   */
  async ensureLogGroup() {
    try {
      const cmd = new DescribeLogGroupsCommand({
        logGroupNamePrefix: this.groupName,
      });

      const response = await this._sendWithTimeout(cmd, "describe_log_groups");
      const groupExists = response.logGroups?.some((g) => g.logGroupName === this.groupName);

      if (!groupExists) {
        this._log(`📁 创建日志组: ${this.groupName}`);
        const createCmd = new CreateLogGroupCommand({ logGroupName: this.groupName });
        await this._sendWithTimeout(createCmd, "create_log_group");
      }
    } catch (error) {
      if (error?.name !== "ResourceAlreadyExistsException") throw error;
    }
  }

  /**
   * @func ensureLogStream
   * @desc 确保 LogStream 存在 + 读取 sequenceToken
   */
  async ensureLogStream() {
    try {
      const cmd = new DescribeLogStreamsCommand({
        logGroupName: this.groupName,
        logStreamNamePrefix: this.streamName,
      });

      const response = await this._sendWithTimeout(cmd, "describe_log_streams");
      const existingStream = response.logStreams?.find((s) => s.logStreamName === this.streamName);

      if (!existingStream) {
        this._log(`📄 创建日志流: ${this.streamName}`);
        const createCmd = new CreateLogStreamCommand({
          logGroupName: this.groupName,
          logStreamName: this.streamName,
        });
        await this._sendWithTimeout(createCmd, "create_log_stream");
        this.sequenceToken = null;
      } else {
        this.sequenceToken = existingStream.uploadSequenceToken || null;
      }
    } catch (error) {
      if (error?.name !== "ResourceAlreadyExistsException") throw error;
    }
  }

  /**
   * @func _enqueueSend
   * @param {*} fn 
   * @desc  内部：串行发送（关键改动） 
   */
  _enqueueSend(fn) {
    // 保证同一 stream 永远串行写入
    this._sendQueue = this._sendQueue
      .then(fn)
      .catch((e) => {
        // 吞掉队列错误，防止队列断掉
        this._warn("cw_send_queue_error", e?.message || e);
        return false;
      });
    return this._sendQueue;
  }

  /**
   * @func log
   * @param {*} message 
   * @param {*} level 
   * @param {*} attempt 
   * @desc 发送单条日志（串行 + token 异常） 
   */
  async log(message, level = "INFO", attempt = 0) {
    const ok = await this.ensureInitialized();
    if (!ok) return false;

    // 在进入队列前构造 payload（并安全 stringify）
    const payload = typeof message === "string" ? { message } : (message || {});
    const messageData = { ...payload, level, targetType: "web-error-page" };

    const logEvent = {
      message: typeof message === "string" ? message : this._safeStringify(messageData),
      timestamp: Date.now(),
    };

    const params = {
      logGroupName: this.groupName,
      logStreamName: this.streamName,
      logEvents: [logEvent],
      ...(this.sequenceToken ? { sequenceToken: this.sequenceToken } : {}),
    };

    const cmd = new PutLogEventsCommand(params);

    return this._enqueueSend(async () => {
      try {
        const response = await this._sendWithTimeout(cmd, "put_log_events");
        this.sequenceToken = response?.nextSequenceToken || this.sequenceToken;
        return true;
      } catch (error) {
        // token 不匹配：更新 token 后重试（重试也在队列里，避免并发风暴）
        if (error?.name === "InvalidSequenceTokenException") {
          this.sequenceToken = error.expectedSequenceToken || this.sequenceToken;
          if (attempt < this.maxRetry) {
            this._warn("🔄 sequenceToken 不匹配，重试...", { attempt: attempt + 1 });
            return this.log(message, level, attempt + 1);
          }
        }

        // 重复提交：视为成功
        if (error?.name === "DataAlreadyAcceptedException") {
          this.sequenceToken = error.expectedSequenceToken || this.sequenceToken;
          return true;
        }

        this._err("❌ 日志发送失败:", error);
        return false;
      }
    });
  }

  /**
   * @func info
   * @param {*} message 
   * @desc 常规日志 
   */
  async info(message) {
    return this.log(message, "INFO");
  }
  /**
   * @func debug
   * @param {*} message 
   * @desc 调试日志 
   */
  async debug(message) {
    return this.log(message, "DEBUG");
  }
  /**
   * @func warn
   * @param {*} message 
   * @desc 告警日志 
   */
  async warn(message) {
    return this.log(message, "WARN");
  }
  /**
   * @func error
   * @param {*} message 
   * @desc 错误日志 
   */
  async error(message) {
    return this.log(message, "ERROR");
  }

  /**
   * @func logBatch
   * @param {*} messages 
   * @param {*} attempt 
   * @desc  批量发送（串行 + 排序 + token 异常） 
   */
  async logBatch(messages = [], attempt = 0) {
    const ok = await this.ensureInitialized();
    if (!ok) return false;

    if (!Array.isArray(messages) || messages.length === 0) return true;

    // CloudWatch 要求按 timestamp 升序
    const now = Date.now();
    const logEvents = messages.map((msg, i) => ({
      message: typeof msg === "string" ? msg : this._safeStringify(msg),
      timestamp: now + i,
    }));

    const params = {
      logGroupName: this.groupName,
      logStreamName: this.streamName,
      logEvents,
      ...(this.sequenceToken ? { sequenceToken: this.sequenceToken } : {}),
    };

    const cmd = new PutLogEventsCommand(params);

    return this._enqueueSend(async () => {
      try {
        const response = await this._sendWithTimeout(cmd, "put_log_events_batch");
        this.sequenceToken = response?.nextSequenceToken || this.sequenceToken;
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
    });
  }

  /**
   * @func checkConnection
   * @desc 连接检查 / 状态 
   */
  async checkConnection() {
    try {
      const cmd = new DescribeLogGroupsCommand({
        logGroupNamePrefix: this.groupName,
        limit: 1,
      });
      await this._sendWithTimeout(cmd, "check_connection");
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
      initCooldownUntil: this._initCooldownUntil,
    };
  }
}

export { CloudWatchLogger };
