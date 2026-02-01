import { CloudWatchLogger } from "./aws.logger";
import { getCachedClientIp } from "@/utils/client-ip";

/**
 * @func makeStreamName
 * @desc streamName 策略：
 * - 默认：同一次页面生命周期固定（推荐）
 * - 可选：按天滚动（下面默认按天）
 */
function makeStreamName() {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DEV-YH-APP-LOGS-STANDARD-${day}-${rand}`;
}

/**
 * @func genTraceId
 * @desc 生成 TraceId
 */
function genTraceId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 单例：组件内外都能 import 用 */
let _cw = null;

/**
 * - 每天换一次 streamName（不会炸）
 */
let _cachedDay = "";
let _cachedStream = "";

function getStreamNameDailyRotate() {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== _cachedDay) {
    _cachedDay = day;
    _cachedStream = makeStreamName();
  }
  return _cachedStream;
}

/**
 * @func getCwLogger
 * @desc 初始化/获取单例
 */
export function getCwLogger() {
  if (_cw) return _cw;

  _cw = new CloudWatchLogger({
    awsAccessKey: "/#AWS_ACCESS_KEY#/",
    awsSecretKey: "/#AWS_SECRET_KEY#/",
    region: "ap-northeast-1",
    groupName: "DEV-YH-APP-LOGS-STANDARD",
    streamName: getStreamNameDailyRotate(),
    silent: true,
    maxRetry: 2,
    timeoutMs: 8000,
  });

  return _cw;
}

/**
 * @abstract SENSITIVE_KEYS
 * @desc 属性黑名单
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "pwd",
  "secret",
  "auth",
  "privateKey",
  "secretKey",
  "awsAccessKey",
  "awsSecretKey",
  "captchaVerification",
  "originalImageBase64",
  "jigsawImageBase64",
]);

/**
 * @func sanitizePayload
 * @desc 
 * - 防阻塞 sanitize：
 * - 防循环引用
 * - 限深度
 * - 限键数
 * - 截断超长字符串
 * - Error / Event / DOM / Window 直接降级
 */
function sanitizePayload(input, seen, depth) {
  if (input == null) return input;

  if (!seen) seen = new WeakSet();
  if (!depth) depth = 0;

  if (depth > 6) return "[TRUNCATED: depth]";

  const t = typeof input;

  // primitive
  if (t !== "object") {
    if (t === "string" && input.length > 2000) return input.slice(0, 2000) + "...[truncated]";
    return input;
  }

  // 防循环引用
  if (seen.has(input)) return "[CIRCULAR]";
  seen.add(input);

  // array
  if (Array.isArray(input)) {
    const arr = input.slice(0, 50).map((v) => sanitizePayload(v, seen, depth + 1));
    if (input.length > 50) arr.push(`[TRUNCATED: ${input.length - 50} more]`);
    return arr;
  }

  // Error 降级
  if (input instanceof Error) {
    return {
      name: input.name,
      message: String(input.message || "").slice(0, 2000),
      stack: String(input.stack || "").slice(0, 2000),
    };
  }

  // DOM / Event / Window 等对象直接降级（避免展开导致卡死）
  const tag = Object.prototype.toString.call(input);
  if (tag.includes("Window") || tag.includes("Event") || tag.includes("HTMLElement")) {
    return `[SKIP:${tag}]`;
  }

  // object（限制键数量）
  const out = {};
  let count = 0;

  for (const [key, value] of Object.entries(input)) {
    if (++count > 80) {
      out.__truncated__ = "keys>80";
      break;
    }

    if (SENSITIVE_KEYS.has(key)) {
      out[key] = "[REDACTED: 字段已加密]";
    } else {
      out[key] = sanitizePayload(value, seen, depth + 1);
    }
  }

  return out;
}

/**
 * @func cwLog
 * @desc
 * 统一上报入口：组件内外都走它
 * - 自动补 traceId
 * - 自动补 streamName（按天滚动）
 * - 永远不阻塞业务：不 await、失败吞掉
 * - 永远返回 traceId（上层不被日志影响）
 */
export function cwLog(level, payload) {
  const cw = getCwLogger();
  const traceId = (payload && payload.traceId) || genTraceId();

  try {
    // 每次更新 streamName（按天）
    cw.streamName = getStreamNameDailyRotate();

    const safePayload = sanitizePayload(payload || {});

    const data = {
      qrcode: "-",
      token: "-",
      nickname: "-",
      mobile: "-",
      LOG_GROUP_NAME: "DEV-YH-APP-LOGS-STANDARD",
      LOG_STREAM_NAME: cw.streamName,
      email: "-",
      areaCode: "-",
      deviceId: "-",
      ...safePayload,
      traceId,
      clientIp: getCachedClientIp(),
    };

    // fire-and-forget：不 await，不把失败抛出去
    const p =
      level === "INFO"
        ? cw.info(data)
        : level === "DEBUG"
          ? cw.debug(data) :
          level === "WARN"
            ? cw.warn(data)
            : cw.error(data);

    Promise.resolve(p).catch(() => { });
  } catch (error) {
    // fallback 也必须吞掉，且不 await，防止错误风暴
    try {
      const fallback = sanitizePayload({
        ...(payload || {}),
        traceId,
        clientIp: "0.0.0.0",
        error: (error && error.message) || String(error),
      });

      Promise.resolve(cw.fallback && cw.fallback(fallback)).catch(() => { });
    } catch {
      // 吞掉
    }
  }

  return traceId;
}

export function newTraceId() {
  return genTraceId();
}
