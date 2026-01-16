import type { APIContext, MiddlewareNext } from 'astro';
import { getIp } from './utils/common';

const SUPPORTED_LOCALES = ['zh', 'en', 'ko', 'th', 'vi', 'km'] as const;
const DEFAULT_LOCALE = 'zh';

function getPreferredLanguage(headers: Headers): string {
    const acceptLanguage = headers.get('Accept-Language');
    if (!acceptLanguage) return DEFAULT_LOCALE;

    for (const locale of SUPPORTED_LOCALES) {
        if (acceptLanguage.includes(locale)) {
            return locale;
        }
    }
    return DEFAULT_LOCALE;
}

export async function onRequest(ctx: APIContext, next: MiddlewareNext) {
    const url = new URL(ctx.request.url);
    const { pathname, search } = url;

    if (pathname.startsWith('/_astro') || pathname.includes('.')) {
        return next();
    }

    try {
        getIp(ctx);
    } catch (e) {
        console.error("Middleware getIp Error:", '就是错了');
        ctx.locals.clientIP = '0.0.0.0';
    }

    const currentLocale = SUPPORTED_LOCALES.find(
        locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    const siteParam = url.searchParams.get('site');
    if (siteParam) {
        ctx.locals.referer = siteParam;
    }

    if (pathname === '/') {
        const defaultLang = getPreferredLanguage(ctx.request.headers);
        return Response.redirect(new URL(`/${defaultLang}${search}`, url.origin), 302);
    }

    if (!currentLocale) {
        return Response.redirect(new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, url.origin), 302);
    }

    return next();
}