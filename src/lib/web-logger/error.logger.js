import { cwLog, newTraceId } from "./cw-singleton.logger";

function normalizeError(err) {
  // err 可能是 Error / string / object / Event
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  const e = err || {};
  return {
    name: e?.name,
    message: e?.message || String(err),
    stack: e?.stack,
  };
}

function safeStringify(x) {
  try {
    return JSON.stringify(x);
  } catch {
    return "[unstringifiable]";
  }
}

function logFail(tag, err) {
  console.warn(`[${tag}]`, err?.stack || err?.message || String(err));
}

function isResourceTarget(t) {
  return (
    t &&
    (t instanceof HTMLScriptElement ||
      t instanceof HTMLLinkElement ||
      t instanceof HTMLImageElement ||
      t instanceof HTMLMediaElement)
  );
}

/**
 * @func getResourceUrl
 * @param {*} t 
 * @desc 获取资源地址  
 */
function getResourceUrl(t) {
  return (
    t?.currentSrc ||
    t?.src ||
    t?.href ||
    t?.getAttribute?.("src") ||
    t?.getAttribute?.("href")
  );
}

/**
 * @func shouldReportError
 * @desc ERROR 限流/去重/防递归（新增）
 */
let __inError = false;
// 同类错误 2 秒内只报一次
const errorCache = new Map();
function shouldReportError(key, windowMs = 2000) {
  const now = Date.now();
  const last = errorCache.get(key) || 0;
  if (now - last < windowMs) return false;
  errorCache.set(key, now);
  if (errorCache.size > 500) errorCache.clear();
  return true;
}

// 限流：每 10 秒最多报 10 条 ERROR（可调）
let errorBucket = 10;
setInterval(() => (errorBucket = 10), 10_000);

/**
 * @func buildErrorKey
 * @param {*} param0 
 * @desc 规范返回内容
 */
function buildErrorKey({ source, component, message, filename, lineno, colno }) {
  return [
    source || "unknown",
    component || "",
    String(message || "").slice(0, 160),
    filename || "",
    lineno || "",
    colno || "",
  ].join("|");
}

/**
 * @func reportErrorSafe
 * @param {*} payload 
 * @param {*} failTag 
 * @desc 错误警告 
 */
function reportErrorSafe(payload, failTag) {
  try {
    if (__inError) return; // 防递归
    if (errorBucket <= 0) return; // 限流

    const key = buildErrorKey(payload);
    if (!shouldReportError(key, 2000)) return; // 去重窗口

    errorBucket--;

    __inError = true;
    cwLog("ERROR", payload).catch((e) => logFail(failTag, e));
  } catch (e) {
    logFail(`${failTag}_sync_failed`, e);
  } finally {
    __inError = false;
  }
}

/**
 * @func installVueErrorHandler
 * @param {*} app 
 * @desc Vue 错误处理（WARN 全关） 
 */
export function installVueErrorHandler(app) {
  // 防重复（HMR/多次调用）
  if (app?.config?.__cw_error_installed) return;
  app.config.__cw_error_installed = true;

  app.config.errorHandler = (err, instance, info) => {
    const traceId = newTraceId();
    const n = normalizeError(err);

    const component =
      instance?.type?.name || instance?.type?.__name || "AnonymousComponent";

    reportErrorSafe(
      {
        source: "vue",
        traceId,
        info,
        component,
        name: n.name,
        message: n.message,
        // stack 可能很长，截断防 payload 过大
        stack: String(n.stack || "").slice(0, 2000),
      },
      "cwLog_vue_error_failed"
    );
  };

  // WARN：彻底关闭
  app.config.warnHandler = () => { };
}

/**
 * @func installJsGlobalHandlers
 * @desc 全局错误处理（全部走限流器）
 */
export function installJsGlobalHandlers() {
  // 防重复（HMR/多次 import）
  if (window.__cw_global_error_installed) return;
  window.__cw_global_error_installed = true;

  // 不直接覆盖：链式 window.onerror
  const prevOnError = window.onerror;

  window.onerror = function (message, source, lineno, colno, error) {
    const traceId = newTraceId();
    const n = normalizeError(error ?? message);

    reportErrorSafe(
      {
        source: "window.onerror",
        traceId,
        name: n.name,
        message: n.message,
        stack: String(n.stack || "").slice(0, 2000),
        filename: source,
        lineno,
        colno,
      },
      "cwLog_onerror_failed"
    );

    // 继续调用旧的 onerror（比如 Sentry/监控 SDK）
    try {
      if (typeof prevOnError === "function") {
        return prevOnError.apply(this, arguments);
      }
    } catch (e) {
      logFail("prev_onerror_failed", e);
    }

    return false; // 让控制台仍然报红
  };

  // 捕获阶段：资源加载失败 + 某些运行时错误
  window.addEventListener(
    "error",
    (event) => {
      const traceId = newTraceId();
      const target = event?.target;

      // 资源加载错误
      if (isResourceTarget(target)) {
        reportErrorSafe(
          {
            source: "resource",
            traceId,
            component: target?.tagName,
            filename: getResourceUrl(target),
            message: "Resource load failed",
          },
          "cwLog_resource_failed"
        );
        return;
      }

      // 运行时 error 事件
      const n = normalizeError(event?.error ?? event?.message);

      reportErrorSafe(
        {
          source: "window.error",
          traceId,
          name: n.name,
          message: n.message,
          stack: String(n.stack || "").slice(0, 2000),
          filename: event?.filename,
          lineno: event?.lineno,
          colno: event?.colno,
        },
        "cwLog_window_error_failed"
      );
    },
    true
  );

  // Promise 未处理 reject
  window.addEventListener("unhandledrejection", (event) => {
    const traceId = newTraceId();
    const reason = event?.reason;
    const n = normalizeError(reason);

    reportErrorSafe(
      {
        source: "unhandledrejection",
        traceId,
        name: n.name,
        message: n.message,
        stack: String(n.stack || "").slice(0, 2000),
        reason: typeof reason === "object" ? safeStringify(reason) : String(reason),
      },
      "cwLog_unhandledrejection_failed"
    );
  });
}
