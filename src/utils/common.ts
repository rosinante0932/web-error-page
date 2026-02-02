import type { APIContext } from "astro";
import DOMPurify from "isomorphic-dompurify";

export const isClient = typeof window !== "undefined";

/**
 * @func pickFirstIp
 * @param xff 
 * @desc ip处理 
 */
function pickFirstIp(xff?: string | null) {
  if (!xff) return null;
  // 可能是 "ip1, ip2, ip3"
  const first = xff.split(",")[0]?.trim();
  return first || null;
}

/**
 * @func getIp
 * @param ctx 
 * @desc 
 */
export const getIp = (ctx: APIContext) => {
  // headers 可能存在，但也要小心 ctx.request 在某些内部阶段不可用
  const headers = ctx?.request?.headers;

  const ip =
    ctx?.clientAddress ??
    pickFirstIp(headers?.get("x-forwarded-for")) ??
    headers?.get("x-real-ip") ??
    headers?.get("cf-connecting-ip") ??
    "unknown";

  // 只有在 locals 可写时才写（避免 StaticClientAddressNotAvailable / prerender/build 阶段炸）
  try {
    if (ctx && "locals" in ctx && ctx.locals) {
      ctx.locals.ip = ip;
      ctx.locals.local_ip = ip;
    }
  } catch {
    // 这里不要 console.error（会刷屏），静默即可
  }

  return ip;
};

/**
 * @func highlightPlaceholders
 * @desc 高亮文字占位符替换
 */
export const highlightPlaceholders = (s: string) =>
  DOMPurify.sanitize(
    s.replace(/\{\%\s*(.+?)\s*\%\}/g, '<span class="text-[#2996F5]">$1</span>'),
  );
