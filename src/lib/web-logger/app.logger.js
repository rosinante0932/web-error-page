import { CloudWatchLogger } from "./aws.logger";

/**
 * @func genTraceId
 * @desc 生成id 
 */
function genTraceId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @func createAppLogger
 * @desc 初始化 Cloud-Watch
 */
export function createAppLogger() {
  const day = new Date().toISOString().slice(0, 10);
  const streamName = `DEV-YH-APP-LOGS-STANDARD-${day}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const cw = new CloudWatchLogger({
    streamName,
    silent: true, // 默认不刷 console
    maxRetry: 2,
    timeoutMs: 8000,
  });

  // 日志系统铁律：永远不 throw、永远不阻塞业务
  function warn(payload = {}) {
    const traceId = payload.traceId || genTraceId();

    try {
      // 不要 await：避免拖慢调用方，也避免错误向上传播
      Promise.resolve(cw.warn({ ...payload, traceId })).catch((e) => {
        // 吞掉：不能再往外抛，否则会触发 unhandledrejection 风暴
        if (!cw?.silent) {
          console.warn("[cw.warn failed]", e?.stack || e?.message || String(e));
        }
      });
    } catch (e) {
      // 兜底：连同步异常也吞掉
      if (!cw?.silent) {
        console.warn("[cw.warn sync failed]", e?.stack || e?.message || String(e));
      }
    }

    return traceId;
  }

  return { cw, warn, genTraceId, streamName };
}
