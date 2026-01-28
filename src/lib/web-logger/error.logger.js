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

function getResourceUrl(t) {
  return (
    t?.currentSrc ||
    t?.src ||
    t?.href ||
    t?.getAttribute?.("src") ||
    t?.getAttribute?.("href")
  );
}

export function installJsGlobalHandlers() {
  // 防重复（HMR/多次 import）
  if (window.__cw_global_error_installed) return;
  window.__cw_global_error_installed = true;

  // ✅ 不要直接覆盖别人：链式 window.onerror
  const prevOnError = window.onerror;

  window.onerror = function (message, source, lineno, colno, error) {
    const traceId = newTraceId();
    cwLog("ERROR", {
      source: "window.onerror",
      traceId,
      ...normalizeError(error ?? message),
      filename: source,
      lineno,
      colno,
    }).catch((e) => logFail("cwLog_onerror_failed", e));

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

  // ✅ 捕获阶段：资源加载失败 + 某些运行时错误
  window.addEventListener(
    "error",
    (event) => {
      const traceId = newTraceId();
      const target = event?.target;

      // 资源加载错误
      if (isResourceTarget(target)) {
        cwLog("ERROR", {
          source: "resource",
          traceId,
          tag: target.tagName,
          url: getResourceUrl(target),
          message: "Resource load failed",
        }).catch((e) => logFail("cwLog_resource_failed", e));
        return;
      }

      // 运行时 error 事件
      cwLog("ERROR", {
        source: "window.error",
        traceId,
        ...normalizeError(event?.error ?? event?.message),
        filename: event?.filename,
        lineno: event?.lineno,
        colno: event?.colno,
      }).catch((e) => logFail("cwLog_window_error_failed", e));
    },
    true
  );

  // ✅ Promise 未处理 reject
  window.addEventListener("unhandledrejection", (event) => {
    const traceId = newTraceId();
    const reason = event?.reason;

    cwLog("ERROR", {
      source: "unhandledrejection",
      traceId,
      ...normalizeError(reason),
      reason: typeof reason === "object" ? safeStringify(reason) : String(reason),
    }).catch((e) => logFail("cwLog_unhandledrejection_failed", e));
  });

  // ✅ 可选：后续才被处理的 reject
  window.addEventListener("rejectionhandled", () => {
    alert(6)
    const traceId = newTraceId();
    cwLog("WARN", {
      source: "rejectionhandled",
      traceId,
      message: "A previously unhandled rejection was handled later",
    }).catch((e) => logFail("cwLog_rejectionhandled_failed", e));
  });
}
