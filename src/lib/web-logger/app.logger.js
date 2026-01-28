import { CloudWatchLogger } from "./aws.logger";

function genTraceId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAppLogger() {
  const day = new Date().toISOString().slice(0, 10);
  const streamName = `DEV-YH-APP-LOGS-STANDARD-${day}-${Math.random().toString(36).slice(2, 6)}`;

  const cw = new CloudWatchLogger({
    streamName,
    silent: true,        // ✅ 默认不刷 console
    maxRetry: 2,
    timeoutMs: 8000,
  });

  async function warn(payload) {
    const traceId = payload.traceId || genTraceId();
    await cw.warn({ ...payload, traceId });
    return traceId;
  }

  return { cw, warn, genTraceId, streamName };
}
