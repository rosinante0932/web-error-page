import { installJsGlobalHandlers } from "@/lib/web-logger/error.logger";

declare global {
    interface Window {
        __LOGGER_GLOBAL_INSTALLED__?: boolean;
    }
}

export function initClientLoggersOnce() {
    if (typeof window === "undefined") return;
    if (window.__LOGGER_GLOBAL_INSTALLED__) return;
    window.__LOGGER_GLOBAL_INSTALLED__ = true;
    installJsGlobalHandlers();
}
