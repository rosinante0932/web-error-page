import os from "node:os";
import { monitorEventLoopDelay, PerformanceObserver } from "node:perf_hooks";
import cron from "node-cron";

declare global {
    // eslint-disable-next-line no-var
    var __perf_inited: boolean | undefined;
    // eslint-disable-next-line no-var
    var __inflight: number | undefined;
    // eslint-disable-next-line no-var
    var __perf_tg_inited: boolean | undefined;
}

function bytesToMB(n: number) {
    return Math.round((n / 1024 / 1024) * 10) / 10;
}

export function buildHealthReport(pod = process.env.HOSTNAME || "local") {
    const inflight = getInflight();
    const mem = memSnap();
    const eld = eldSnap();
    const gc = gcSnap();
    const sys = sysSnap();

    // ✅ 可读摘要（TG 里一眼能看懂）
    const summary = [
        `🩺 Node 体检报告`,
        `pod: ${pod}`,
        `uptime: ${sys.uptimeSec}s`,
        `inflight: ${inflight}`,
        `mem: rss ${bytesToMB(mem.rss)}MB | heap ${bytesToMB(mem.heapUsed)}/${bytesToMB(mem.heapTotal)}MB | ext ${bytesToMB(mem.external)}MB`,
        `eld(ms): p50 ${eld.p50Ms} | p90 ${eld.p90Ms} | p99 ${eld.p99Ms} | max ${eld.maxMs}`,
        `gc: minor ${gc.minor} | major ${gc.major} | inc ${gc.incremental} | weakcb ${gc.weakcb} | last ${Math.round(gc.lastMs)}ms(kind ${gc.lastKind})`,
        `load: ${sys.load1}/${sys.load5}/${sys.load15}`,
        `node: ${sys.node}`,
        `ts: ${new Date().toISOString()}`,
    ].join("\n");

    // ✅ 结构化详情（你后面进 ES 也好用）
    const detail = {
        "@timestamp": new Date().toISOString(),
        type: "perf",
        kind: "health",
        pod,
        inflight,
        mem,
        eld,
        gc,
        sys,
    };

    return { summary, detail };
}

export function getInflight() {
    return globalThis.__inflight ?? 0;
}
export function incInflight() {
    globalThis.__inflight = (globalThis.__inflight ?? 0) + 1;
}
export function decInflight() {
    globalThis.__inflight = Math.max(0, (globalThis.__inflight ?? 0) - 1);
}

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

// Event Loop Delay
const __eld = monitorEventLoopDelay({ resolution: 20 });
__eld.enable();

export function eldSnap() {
    return {
        meanMs: Number((__eld.mean / 1e6).toFixed(3)),
        p50Ms: Number((__eld.percentile(50) / 1e6).toFixed(3)),
        p90Ms: Number((__eld.percentile(90) / 1e6).toFixed(3)),
        p99Ms: Number((__eld.percentile(99) / 1e6).toFixed(3)),
        maxMs: Number((__eld.max / 1e6).toFixed(3)),
    };
}

// GC 聚合
let __gcAgg = { minor: 0, major: 0, incremental: 0, weakcb: 0, lastMs: 0, lastKind: 0 };
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
} catch { }

export function gcSnap() {
    return __gcAgg;
}

export function initPerfOnce(opts: {
    enabled: boolean;
    sampleMs: number;
    logger: any;
    pod?: string;
}) {
    if (globalThis.__perf_inited) return;
    globalThis.__perf_inited = true;

    const { enabled, sampleMs, logger, pod = process.env.HOSTNAME || "local" } = opts;

    if (!enabled) {
        logger.info({ type: "perf", msg: "disabled" });
        return;
    }

    const emit = (reason = "interval") => {
        logger.info({
            "@timestamp": new Date().toISOString(),
            type: "perf",
            kind: "sample",
            reason,
            pod,
            inflight: getInflight(),
            mem: memSnap(),
            eld: eldSnap(),
            gc: gcSnap(),
            sys: sysSnap(),
        });
    };

    logger.info({ type: "perf", msg: "enabled", sampleMs });
    Promise.resolve().then(() => emit("boot")).catch(() => { });
    setInterval(() => {
        try {
            emit("interval");
        } catch { }
    }, sampleMs).unref();
}

/**
 * 每隔 N 小时发送一次“体检报告”到 TG
 * 实现方式：logger.warn(...) -> pino destination(createTelegramStream) -> TG
 */

export function startPerfTgReporter(opts: {
    enabled: boolean;
    everyHours: number; // 6
    pod?: string;
    logger: any;
    timezone?: string;  // "Asia/Bangkok" | "Asia/Shanghai"
    boot?: boolean;     // 是否启动立刻发一条
}) {
    const {
        enabled,
        everyHours,
        pod = process.env.HOSTNAME || "local",
        logger,
        timezone = "Asia/Bangkok",
        boot = false, // 你要严格整点就 false
    } = opts;

    if (!enabled) {
        logger.info({ type: "perf", msg: "tg_reporter_disabled" });
        return;
    }
    if (globalThis.__perf_tg_inited) return;
    globalThis.__perf_tg_inited = true;

    // ✅ 每 N 小时的整点：minute=0，hour= */N
    // 例如 everyHours=6 => "0 */6 * * *" -> 00:00/06:00/12:00/18:00
    const expr = `0 */${Math.max(1, everyHours)} * * *`;

    const emitOnce = (reason: "boot" | "cron") => {
        const { summary, detail } = buildHealthReport(pod);

        logger.warn(
            {
                type: "perf",
                kind: "health",
                msg: `health_report_${reason}`,
                pod,
                text: summary,  // 你 TG 里可直接展示 summary
                detail,
                risk: "health",
            },
            "health_report"
        );
    };

    // 可选：启动就发一条（不想要就关掉）
    if (boot) {
        try {
            emitOnce("boot");
        } catch (e) {
            logger.warn({ type: "perf", msg: "tg_report_boot_failed", err: (e as any)?.stack || String(e) });
        }
    }

    cron.schedule(
        expr,
        () => {
            try {
                emitOnce("cron");
            } catch (e) {
                logger.warn({ type: "perf", msg: "tg_report_cron_failed", err: (e as any)?.stack || String(e) });
            }
        },
        {
            timezone, // ✅ 时区决定“整点”是泰国还是上海
        }
    );

    logger.info({ type: "perf", msg: "tg_reporter_enabled", expr, timezone, everyHours, pod });
}
