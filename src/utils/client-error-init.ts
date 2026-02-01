import { installJsGlobalHandlers } from "@/lib/web-logger/error.logger";

declare global {
    interface Window {
        __LOGGER_GLOBAL_INSTALLED__?: boolean;
    }
}

export function initClientLoggersOnce() {
  if (typeof window === "undefined") return;
  if (window.__LOGGER_GLOBAL_INSTALLED__) return;

  try {
    installJsGlobalHandlers();
    window.__LOGGER_GLOBAL_INSTALLED__ = true;
  } catch (e) {
    // 只兜底，不上报，避免递归
    console.error("[logger] installJsGlobalHandlers failed", e);
  }
}