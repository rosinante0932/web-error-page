import type { APIContext } from "astro"
import DOMPurify from "isomorphic-dompurify";
// import { getLogger } from "./logger-singleton";

// const logger = getLogger(); // 不会每次 new

export const isClient = typeof window !== 'undefined'

/**
 * @func getIpFn
 * @desc 获取ip
 */
export const getIp = (ctx: APIContext) => {
  const ip =
    ctx.clientAddress ??
    ctx.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    ctx.request.headers.get('x-real-ip') ??
    ctx.request.headers.get('cf-connecting-ip') ??
    'unknown';
  try {
    ctx.locals.ip = ip;
    ctx.locals.local_ip = ip;
  } catch {
    console.error("--- 错了")
  } finally {
    ctx.locals.ip = ip;
    ctx.locals.local_ip = ip;
  }

  return ip
}

/**
 * @func highlightPlaceholders
 * @desc 高亮文字占位符替换
 */
export const highlightPlaceholders = (s: string) =>
  DOMPurify.sanitize(
    s.replace(/\{\%\s*(.+?)\s*\%\}/g, '<span class="text-[#2996F5]">$1</span>'),
  );
