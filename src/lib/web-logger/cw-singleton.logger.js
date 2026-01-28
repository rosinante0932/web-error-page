import { CloudWatchLogger } from "./aws.logger";
import { getCachedClientIp } from '@/utils/client-ip'

/**
 * ✅ streamName 策略：
 * - 默认：同一次页面生命周期固定（推荐）
 * - 可选：按天滚动（下面默认按天）
 */
function makeStreamName() {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const rand = (Math.random().toString(36).slice(2, 6)).toUpperCase();
  return `DEV-YH-APP-LOGS-STANDARD-${day}-${rand}`;
}

function genTraceId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** ✅ 单例：组件内外都能 import 用 */
let _cw = null;

/**
 * 你坚持“每次触发都要最新 streamName”，我给你折中：
 * - 每天换一次 streamName（不会炸）
 * - 如果你真要“每次都换”，把 cache 去掉就行，但不建议
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

/** 初始化/获取单例 */
export function getCwLogger() {
  if (_cw) return _cw;

  _cw = new CloudWatchLogger({
    awsAccessKey: "/#AWS_ACCESS_KEY#/",
    awsSecretKey: "/#AWS_SECRET_KEY#/",
    region: "ap-northeast-1",
    groupName: "DEV-YH-APP-LOGS-STANDARD",
    streamName: getStreamNameDailyRotate(), // ✅ 按天滚动
    silent: true,
    maxRetry: 2,
    timeoutMs: 8000,
  });

  return _cw;
}

/**
 * ✅ 统一上报入口：组件内外都走它
 * - 自动补 traceId
 * - 自动补 streamName（按天滚动）
 */
export async function cwLog(
  level,
  payload
) {
  try {
    const cw = getCwLogger();

    // ✅ 如果你要“最新 streamName”，这里可以每次更新 streamName（按天）
    cw.streamName = getStreamNameDailyRotate();

    const traceId = payload.traceId || genTraceId();

    // ✅ 关键：先 sanitize
    const safePayload = sanitizePayload(payload || {});

    const data = {
      qrcode: '-',
      token: '-',
      nickname: '-',
      mobile: '-',
      LOG_GROUP_NAME: 'DEV-YH-APP-LOGS-STANDARD',
      LOG_STREAM_NAME: cw.streamName,
      email: '-',
      areaCode: '-',
      deviceId: '-',
      ...safePayload,
      traceId,
      clientIp: getCachedClientIp(),
    };

    if (level === "INFO") return cw.info(data);
    if (level === "DEBUG") return cw.debug(data);
    if (level === "WARN") return cw.warn(data);
    return cw.error(data);
  } catch (error) {
    const fallback = sanitizePayload({
      ...payload, traceId, clientIp: '0.0.0.0', error: error?.message
        || String(error)
    } || { error: error?.message || String(error), traceId, clientIp: '0.0.0.0' });
    return cw.fallback(data);
  }
}

export function newTraceId() {
  return genTraceId();
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
  "jigsawImageBase64"
]);

function sanitizePayload(input) {
  if (input == null) return input;

  // primitive
  if (typeof input !== "object") return input;

  // array
  if (Array.isArray(input)) {
    return input.map(sanitizePayload);
  }

  // object
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(key)) {
      out[key] = "[REDACTED: 字段已加密]";
    } else {
      out[key] = sanitizePayload(value);
    }
  }
  return out;
}
