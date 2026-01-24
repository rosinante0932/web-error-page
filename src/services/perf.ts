import os from "node:os";
import { monitorEventLoopDelay, PerformanceObserver } from "node:perf_hooks";
import cron, { type ScheduledTask } from "node-cron";

declare global {
    // eslint-disable-next-line no-var
    var __perf_inited: boolean | undefined;
    // eslint-disable-next-line no-var
    var __inflight: number | undefined;
    // eslint-disable-next-line no-var
    var __perf_tg_inited: boolean | undefined;
}

/* ---------------- utils ---------------- */

function bytesToMB(n: number) {
    return Math.round((n / 1024 / 1024) * 10) / 10;
}
function percent(used: number, total: number) {
    if (!total) return 0;
    return Math.round((used / total) * 100);
}
function safeErr(err: unknown) {
    const e = err as any;
    return e?.stack || e?.message || String(err);
}
function toBool(v: any) {
    return String(v ?? "").trim().toLowerCase() === "true";
}
function toNum(v: any, fallback: number) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

/* ---------------- inflight (with hang check) ---------------- */

// traceId -> startAt(ms)
const __inflightMap = new Map<string, number>();

// 防止极端情况下 inflightMap 无上限（比如 traceId 逻辑坏了）
const INFLIGHT_MAP_MAX = toNum(process.env.INFLIGHT_MAP_MAX, 5000);

export function getInflight() {
    return globalThis.__inflight ?? 0;
}

/**
 * 进入请求/任务时调用：incInflight(traceId)
 * - traceId 建议来自 middleware（每请求唯一）
 */
export function incInflight(traceId = "unknown") {
    globalThis.__inflight = (globalThis.__inflight ?? 0) + 1;

    // 同一个 traceId 重复进入时，不覆盖更早的 startAt（更容易暴露悬挂）
    if (!__inflightMap.has(traceId)) __inflightMap.set(traceId, Date.now());

    // 极端兜底：traceId 不断增长时，丢弃最老的 entry
    if (__inflightMap.size > INFLIGHT_MAP_MAX) {
        const firstKey = __inflightMap.keys().next().value;
        if (firstKey) __inflightMap.delete(firstKey);
    }
}

/**
 * 离开请求/任务时调用：decInflight(traceId)
 */
export function decInflight(traceId = "unknown") {
    globalThis.__inflight = Math.max(0, (globalThis.__inflight ?? 0) - 1);
    __inflightMap.delete(traceId);
}

type InflightHangResult = {
    inflight: number; // 全局 inflight
    tracked: number; // inflightMap size
    maxAgeMs: number;
    overCount: number;
    suspiciousThresholdMs: number;
    thresholdMs: number;
    suspicious: boolean; // 软阈值命中（前兆）
    hasHang: boolean; // 硬阈值命中（确认悬挂）
    text: string; // 给 TG 一眼能看懂
};

/**
 * Promise/请求悬挂检测
 * - suspiciousThresholdMs：软阈值（前兆）
 * - thresholdMs：硬阈值（确认悬挂）
 */
export function inflightHangCheck(opts?: {
    suspiciousThresholdMs?: number; // default 10s
    thresholdMs?: number; // default 30s
}): InflightHangResult {
    const suspiciousThresholdMs =
        toNum(opts?.suspiciousThresholdMs ?? process.env.INFLIGHT_SUSPICIOUS_MS, 10_000);
    const thresholdMs = toNum(opts?.thresholdMs ?? process.env.INFLIGHT_THRESHOLD_MS, 30_000);

    const now = Date.now();
    let maxAgeMs = 0;
    let overCount = 0;

    for (const [, startAt] of __inflightMap) {
        const age = now - startAt;
        if (age > maxAgeMs) maxAgeMs = age;
        if (age >= thresholdMs) overCount += 1;
    }

    const suspicious = maxAgeMs >= suspiciousThresholdMs && maxAgeMs < thresholdMs && overCount === 0;
    const hasHang = overCount > 0;

    const inflight = globalThis.__inflight ?? 0;
    const tracked = __inflightMap.size;

    const text = [
        `当前仍未结束的请求总数：inflight=${inflight}`,
        `有 traceId 记录的 inflight 数：tracked=${tracked}`,
        `最老请求卡住时长: ${Math.round(maxAgeMs)}ms`,
        `超过阈值(>=${thresholdMs}ms)的请求数: ${overCount}`,
        `软阈值(>=${suspiciousThresholdMs}ms): ${suspicious ? "是" : "否"}`,
        `确认悬挂: ${hasHang ? "是" : "否"}`,
    ].join(" | ");

    return {
        inflight,
        tracked,
        maxAgeMs,
        overCount,
        suspiciousThresholdMs,
        thresholdMs,
        suspicious,
        hasHang,
        text,
    };
}

/* ---------------- snapshots ---------------- */

export function memSnap() {
    const m = process.memoryUsage();
    return {
        rss: m.rss,
        heapUsed: m.heapUsed,
        heapTotal: m.heapTotal,
        external: m.external,
        arrayBuffers: (m as any).arrayBuffers || 0,
    };
}

export function sysSnap() {
    return {
        pid: process.pid,
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        uptimeSec: Math.floor(process.uptime()),
        hostname: os.hostname(),
        cpus: os.cpus()?.length || 0,
        load1: os.loadavg ? os.loadavg()[0] : null,
        load5: os.loadavg ? os.loadavg()[1] : null,
        load15: os.loadavg ? os.loadavg()[2] : null,
    };
}

/* ---------------- Event Loop Delay (singleton) ---------------- */

let __eldInited = false;
const __eld = monitorEventLoopDelay({ resolution: 20 });

function ensureEldEnabled() {
    if (__eldInited) return;
    __eld.enable();
    __eldInited = true;
}

export function eldSnap() {
    ensureEldEnabled();
    return {
        meanMs: Number((__eld.mean / 1e6).toFixed(3)),
        p50Ms: Number((__eld.percentile(50) / 1e6).toFixed(3)),
        p90Ms: Number((__eld.percentile(90) / 1e6).toFixed(3)),
        p99Ms: Number((__eld.percentile(99) / 1e6).toFixed(3)),
        maxMs: Number((__eld.max / 1e6).toFixed(3)),
    };
}

/* ---------------- GC aggregate (singleton) ---------------- */

let __gcAgg = { minor: 0, major: 0, incremental: 0, weakcb: 0, lastMs: 0, lastKind: 0 };
let __gcObsInited = false;

function ensureGcObserver() {
    if (__gcObsInited) return;
    __gcObsInited = true;

    try {
        const obs = new PerformanceObserver((list) => {
            for (const e of list.getEntries() as any[]) {
                const kind = e.kind;
                const dur = e.duration || 0;

                __gcAgg.lastMs = dur;
                __gcAgg.lastKind = kind;

                if (kind === 1) __gcAgg.minor++;
                else if (kind === 2) __gcAgg.major++;
                else if (kind === 3) __gcAgg.incremental++;
                else if (kind === 4) __gcAgg.weakcb++;
            }
        });
        obs.observe({ entryTypes: ["gc"] });
    } catch {
        // 某些环境可能不支持 gc entry
    }
}

export function gcSnap() {
    ensureGcObserver();
    return __gcAgg;
}

/* ---------------- report builders ---------------- */

export function buildHealthReport(pod = process.env.HOSTNAME || "local") {
    const inflight = getInflight();
    const mem = memSnap();
    const eld = eldSnap();
    const gc = gcSnap();
    const sys = sysSnap();

    const heapPct = percent(mem.heapUsed, mem.heapTotal);

    const summary = [
        `🩺 Node 体检报告`,
        `pod: ${pod}`,
        `uptime: ${sys.uptimeSec}s`,
        `inflight: ${inflight}`,
        `mem: rss ${bytesToMB(mem.rss)}MB | heap ${bytesToMB(mem.heapUsed)}/${bytesToMB(mem.heapTotal)}MB (${heapPct}%) | ext ${bytesToMB(mem.external)}MB | ab ${bytesToMB(mem.arrayBuffers)}MB`,
        `eld(ms): p50 ${eld.p50Ms} | p90 ${eld.p90Ms} | p99 ${eld.p99Ms} | max ${eld.maxMs}`,
        `gc: minor ${gc.minor} | major ${gc.major} | inc ${gc.incremental} | weakcb ${gc.weakcb} | last ${Math.round(gc.lastMs)}ms(kind ${gc.lastKind})`,
        `load: ${sys.load1}/${sys.load5}/${sys.load15}`,
        `node: ${sys.node}`,
        `ts: ${new Date().toISOString()}`,
    ].join("\n");

    const detail = {
        "@timestamp": new Date().toISOString(),
        type: "perf",
        kind: "health",
        pod,
        inflight,
        mem: {
            rssMB: bytesToMB(mem.rss),
            heapUsedMB: bytesToMB(mem.heapUsed),
            heapTotalMB: bytesToMB(mem.heapTotal),
            heapUsagePct: heapPct,
            externalMB: bytesToMB(mem.external),
            arrayBuffersMB: bytesToMB(mem.arrayBuffers),
        },
        eld,
        gc,
        sys,
    };

    return { summary, detail };
}

/* ---------------- perf sampler (cron) ---------------- */

let __perfSampleTask: ScheduledTask | null = null;

export function initPerfOnce(opts: {
    enabled: boolean;
    sampleMs: number; // 例如 30_000
    logger: any;
    pod?: string;
    timezone?: string;
}) {
    if (globalThis.__perf_inited) return;
    globalThis.__perf_inited = true;

    const { enabled, sampleMs, logger, pod = process.env.HOSTNAME || "local", timezone = "Asia/Shanghai" } = opts;

    if (!enabled) {
        logger.info({ type: "perf", msg: "disabled" });
        return;
    }

    const sec = Math.max(1, Math.floor(sampleMs / 1000));
    const expr =
        sec >= 60
            ? `*/${Math.max(1, Math.floor(sec / 60))} * * * *` // 分钟级
            : `*/${sec} * * * * *`; // 秒级（node-cron 6段）

    const emit = (reason: "boot" | "cron") => {
        const mem = memSnap();
        const eld = eldSnap();
        const gc = gcSnap();
        const sys = sysSnap();

        logger.info({
            "@timestamp": new Date().toISOString(),
            type: "perf",
            kind: "sample",
            reason,
            pod,
            inflight: getInflight(),
            mem: {
                rssMB: bytesToMB(mem.rss),
                heapUsedMB: bytesToMB(mem.heapUsed),
                heapTotalMB: bytesToMB(mem.heapTotal),
                heapUsagePct: percent(mem.heapUsed, mem.heapTotal),
                externalMB: bytesToMB(mem.external),
                arrayBuffersMB: bytesToMB(mem.arrayBuffers),
            },
            eld,
            gc,
            sys,
        });
    };

    logger.info({ type: "perf", msg: "enabled", sampleMs, expr, timezone });

    Promise.resolve()
        .then(() => emit("boot"))
        .catch((err) => logger.warn({ type: "perf", kind: "boot", msg: "perf_emit_boot_failed", err: safeErr(err) }));

    try {
        __perfSampleTask = cron.schedule(
            expr,
            () => {
                try {
                    emit("cron");
                } catch (err) {
                    logger.warn({ type: "perf", msg: "perf_emit_cron_failed", err: safeErr(err) });
                }
            },
            { timezone }
        );
    } catch (err) {
        logger.warn({ type: "perf", msg: "perf_cron_schedule_failed", err: safeErr(err), expr, timezone });
    }
}

/* ---------------- TG reporter (cron aligned) ---------------- */

let __perfTgTask: ScheduledTask | null = null;

export function startPerfTgReporter(opts: {
    enabled: boolean;
    everyHours: number; // 6
    pod?: string;
    logger: any;
    timezone?: string;
    boot?: boolean;
    hangThresholdMs?: number; // default 30s
    suspiciousThresholdMs?: number; // default 10s
}) {
    const {
        enabled,
        everyHours,
        pod = process.env.HOSTNAME || "local",
        logger,
        timezone = "Asia/Shanghai",
        boot = false,
        hangThresholdMs = 30_000,
        suspiciousThresholdMs = 10_000,
    } = opts;

    if (!enabled) {
        logger.info({ type: "perf", msg: "tg_reporter_disabled" });
        return;
    }
    if (globalThis.__perf_tg_inited) return;
    globalThis.__perf_tg_inited = true;

    const n = Math.max(1, Math.floor(everyHours));
    const expr = `0 */${n} * * *`; // 整点对齐

    const emitOnce = (reason: "boot" | "cron") => {
        const { summary, detail } = buildHealthReport(pod);

        const hang = inflightHangCheck({
            suspiciousThresholdMs,
            thresholdMs: hangThresholdMs,
        });

        // ✅ 正确分级
        const risk = hang.hasHang ? "hang" : hang.suspicious ? "suspicious" : "health";

        // ✅ 你想让 TG 头部展示：域名/IP/风险/traceId 的话，
        // 体检报告本身没有 traceId、domain、ip（这是“全局报告”）
        // 所以这里只能带 risk + hang 指标
        logger.warn(
            {
                type: "perf",
                kind: "health",
                msg: `health_report_${reason}`,
                pod,
                text: summary,
                detail: {
                    ...detail,
                    inflightHang: hang,
                },
                risk,
            },
            "health_report"
        );
    };

    if (boot) {
        try {
            emitOnce("boot");
        } catch (err) {
            logger.warn({ type: "perf", msg: "tg_report_boot_failed", err: safeErr(err) });
        }
    }

    try {
        __perfTgTask = cron.schedule(
            expr,
            () => {
                try {
                    emitOnce("cron");
                } catch (err) {
                    logger.warn({ type: "perf", msg: "tg_report_cron_failed", err: safeErr(err) });
                }
            },
            { timezone }
        );
    } catch (err) {
        logger.warn({ type: "perf", msg: "tg_cron_schedule_failed", err: safeErr(err), expr, timezone });
    }

    logger.info({
        type: "perf",
        msg: "tg_reporter_enabled",
        expr,
        timezone,
        everyHours: n,
        pod,
        hangThresholdMs,
        suspiciousThresholdMs,
    });
}

/* 可选：给你一个 stop（热更新/测试时用） */
export function stopPerfSchedulers(logger?: any) {
    try {
        __perfSampleTask?.stop();
        __perfTgTask?.stop();
        __perfSampleTask = null;
        __perfTgTask = null;
        globalThis.__perf_inited = false;
        globalThis.__perf_tg_inited = false;
        logger?.info?.({ type: "perf", msg: "schedulers_stopped" });
    } catch { }
}
