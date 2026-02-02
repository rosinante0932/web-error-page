import type { APIContext, MiddlewareNext } from "astro";
import { getIp } from "./utils/common";
import { logger, withTrace } from "@/lib/server-logger/index.server";

import {
  initPerfOnce,
  incInflight,
  decInflight,
  getInflight,
  memSnap,
  eldSnap,
  startPerfTgReporter,
} from "@/services/perf";
import { PERF_TG_ON } from "astro:env/server";

const SUPPORTED_LOCALES = ["zh", "en", "ko", "th", "vi", "km"] as const;
const DEFAULT_LOCALE = "zh";

function getPreferredLanguage(headers: Headers): string {
  const acceptLanguage = headers.get("Accept-Language");
  if (!acceptLanguage) return DEFAULT_LOCALE;

  for (const locale of SUPPORTED_LOCALES) {
    if (acceptLanguage.includes(locale)) return locale;
  }
  return DEFAULT_LOCALE;
}

function genTraceId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// 你可用 env 控制
const PERF_ON = String(process.env.PERF_ON || "").toLowerCase() === "true";
const PERF_SAMPLE_MS_NUM = Number(process.env.PERF_SAMPLE_MS || 15000);

const PERF_REQ_ON = String(process.env.PERF_REQ_ON || "").toLowerCase() === "true";
const PERF_REQ_SLOW_MS_NUM = Number(process.env.PERF_REQ_SLOW_MS || 1000);

const POD = process.env.POD_NAME || process.env.HOSTNAME || "local";

export async function onRequest(ctx: APIContext, next: MiddlewareNext) {
  // standalone 下没自定义 server：用“首次请求初始化一次”的方式最稳
  initPerfOnce({ enabled: PERF_ON, sampleMs: PERF_SAMPLE_MS_NUM, logger, pod: POD });

  startPerfTgReporter({
    enabled: String(PERF_TG_ON || "").toLowerCase() === "true",
    everyHours: 6,
    pod: process.env.POD_NAME || process.env.HOSTNAME || "local",
    logger: logger, // 你的 pino logger（已经接 createTelegramStream）
    timezone: "Asia/Shanghai",
    boot: false, // 严格整点
  });

  const started = Date.now();
  const traceId = genTraceId();

  const url = new URL(ctx.request.url);
  const { pathname, search } = url;
  const domain = ctx.request.headers.get("host") || "";

  (ctx.locals as any).traceId = traceId;

  // 静态资源直接放行（避免刷日志 / 影响 inflight 统计意义）
  if (pathname.startsWith("/_astro") || pathname.includes(".")) {
    return next();
  }

  // site 参数
  const siteParam = url.searchParams.get("site");
  if (siteParam) ctx.locals.referer = siteParam;

  // inflight ++（只统计“业务请求”，静态资源已提前 return）
  incInflight(traceId);

  // 获取 IP / 注入 trace logger
  try {
    const ip = getIp(ctx);
    (ctx.locals as any).logger = withTrace({ traceId, domain, ip });
  } catch (e) {
    ctx.locals.clientIP = "0.0.0.0";
    logger.warn({ traceId, pathname, err: e }, "middleware_getIp_failed");
    // 给个兜底 logger，避免后面 ctx.locals.logger 为空
    (ctx.locals as any).logger = withTrace({ traceId, domain, ip: ctx.locals.clientIP });
  }

  try {
    const currentLocale = SUPPORTED_LOCALES.find(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathname === "/") {
      const defaultLang = getPreferredLanguage(ctx.request.headers);
      (ctx.locals as any).logger.info(
        { traceId, pathname, to: `/${defaultLang}${search}`, ip: ctx.locals.clientIP },
        "redirect_root_locale"
      );
      return Response.redirect(new URL(`/${defaultLang}${search}`, url.origin), 302);
    }

    if (!currentLocale) {
      (ctx.locals as any).logger.warn(
        { traceId, pathname, to: `/${DEFAULT_LOCALE}${pathname}${search}`, ip: ctx.locals.clientIP },
        "redirect_missing_locale"
      );
      return Response.redirect(new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, url.origin), 302);
    }

    const res = await next();
    const costMs = Date.now() - started;

    (ctx.locals as any).logger.info(
      {
        traceId,
        method: ctx.request.method,
        pathname,
        status: res.status,
        ms: costMs,
        ip: ctx.locals.clientIP,
        site: ctx.locals.referer,
      },
      "request_done"
    );

    // 慢请求：补充 perf 快照
    if (PERF_REQ_ON && PERF_REQ_SLOW_MS_NUM > 0 && costMs >= PERF_REQ_SLOW_MS_NUM) {
      (ctx.locals as any).logger.warn(
        {
          traceId,
          type: "perf",
          kind: "req",
          msg: "slow_request",
          method: ctx.request.method,
          pathname,
          status: res.status,
          costMs,
          inflight: getInflight(),
          mem: memSnap(),
          eld: eldSnap(),
        },
        "slow_request"
      );
    }

    // 透传 traceId
    res.headers.set("x-trace-id", traceId);

    return res;
  } catch (err) {
    const costMs = Date.now() - started;

    (ctx.locals as any).logger.error(
      {
        traceId,
        method: ctx.request.method,
        pathname,
        ms: costMs,
        ip: ctx.locals.clientIP,
        site: ctx.locals.referer,
        err,
      },
      "request_failed"
    );

    // 失败也可以按需打慢（可选）
    if (PERF_REQ_ON && PERF_REQ_SLOW_MS_NUM > 0 && costMs >= PERF_REQ_SLOW_MS_NUM) {
      (ctx.locals as any).logger.warn(
        {
          traceId,
          type: "perf",
          kind: "req",
          msg: "slow_request_failed",
          method: ctx.request.method,
          pathname,
          status: 500,
          costMs,
          inflight: getInflight(),
          mem: memSnap(),
          eld: eldSnap(),
        },
        "slow_request_failed"
      );
    }

    throw err;
  } finally {
    // 保证无论 redirect / next 抛错 / 正常返回，inflight 一定会减回去
    decInflight(traceId);
  }
}
