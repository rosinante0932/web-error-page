import type { APIContext, MiddlewareNext } from "astro";
import { getIp } from "./utils/common";
import { logger, withTrace } from "@/lib/log";

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

export async function onRequest(ctx: APIContext, next: MiddlewareNext) {
  const started = Date.now();
  const traceId = genTraceId();

  const url = new URL(ctx.request.url);
  const { pathname, search } = url;
  const domain = ctx.request.headers.get("host") || "";

  // 给后续页面 / API 用
  ctx.locals.traceId = traceId;


  // 静态资源直接放行（避免刷日志）
  if (pathname.startsWith("/_astro") || pathname.includes(".")) {
    return next();
  }

  // site 参数
  const siteParam = url.searchParams.get("site");
  if (siteParam) ctx.locals.referer = siteParam;

  // 获取 IP
  try {
    const ip = getIp(ctx);
    ctx.locals.logger = withTrace({ traceId, domain, ip });
  } catch (e) {
    ctx.locals.clientIP = "0.0.0.0";
    logger.warn({ traceId, pathname, err: e }, "middleware_getIp_failed");
  }

  try {
    const currentLocale = SUPPORTED_LOCALES.find(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathname === "/") {
      const defaultLang = getPreferredLanguage(ctx.request.headers);
      logger.info(
        { traceId, pathname, to: `/${defaultLang}${search}`, ip: ctx.locals.clientIP },
        "redirect_root_locale"
      );
      return Response.redirect(new URL(`/${defaultLang}${search}`, url.origin), 302);
    }

    if (!currentLocale) {
      logger.info(
        { traceId, pathname, to: `/${DEFAULT_LOCALE}${pathname}${search}`, ip: ctx.locals.clientIP },
        "redirect_missing_locale"
      );
      return Response.redirect(
        new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, url.origin),
        302
      );
    }

    const res = await next();

    logger.info(
      {
        traceId,
        method: ctx.request.method,
        pathname,
        status: res.status,
        ms: Date.now() - started,
        ip: ctx.locals.clientIP,
        site: ctx.locals.referer,
      },
      "request_done"
    );

    // 透传 traceId 给前端 / 下游
    res.headers.set("x-trace-id", traceId);

    return res;
  } catch (err) {
    logger.error(
      {
        traceId,
        method: ctx.request.method,
        pathname,
        ms: Date.now() - started,
        ip: ctx.locals.clientIP,
        site: ctx.locals.referer,
        err,
      },
      "request_failed"
    );
    throw err;
  }
}
