import type { APIContext, MiddlewareNext } from 'astro'
import { getIp } from './utils/common'
export async function onRequest(ctx: APIContext, next: MiddlewareNext) {
    console.log(process.env.BOSS, '222')
    getIp(ctx)

    // const referer =
    //     ctx.request.headers.get('Referer') || // 正确拼写
    //     ctx.request.headers.get('Referrer') || // 少数代理会用这个
    //     '';

    // const ref = ctx.request.headers.get('referer') || '';
    // const u = new URL(ref);
    // const origin = u.origin;   // https://example.com
    // const path = u.pathname; // 跨域通常是 '/'

    // const ref1 = ctx.request.headers.get('Referer')

    // console.log(ctx.request.headers, 'ctx.request')

    // console.log(ref1, 'ref1')

    // console.log(ref, 'ref')

    // console.log(origin, 'origin')

    // console.log(path, 'path1')

    // console.log(referer, 'referer')

    console.log(ctx.request.headers, 'ctx.request.headers');

    // ctx.locals.referer = referer

    const url = new URL(ctx.request.url)

    const pathname = url.pathname

    // 定义支持的语言
    const supportedLocales = ['zh', 'en', 'ko', 'th', 'vi', 'km'] // 根据你的需求修改

    // 检查路径是否已经包含语言前缀
    const hasLocale = supportedLocales.some(locale =>
        pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    // 如果没有语言前缀，重定向到默认语言
    if (!hasLocale && pathname !== '/') {
        return Response.redirect(new URL(`/zh${pathname}${url.search}`, url.origin), 302)
    }

    console.log(url.search, 'url.search')

    if (url.searchParams.has('site')) {
        const siteValue = url.searchParams.get('site')
        console.log('aaa的值=======:', siteValue) // 输
        ctx.locals.referer = siteValue || ''
    }

    // 根路径重定向到默认语言
    if (pathname === '/') {
        // 可以根据 Accept-Language 头或用户偏好来决定默认语言
        const defaultLang = getPreferredLanguage(ctx) || 'zh'
        return Response.redirect(new URL(`/${defaultLang}/${url.search}`, url.origin), 302)
    }

    // 获取用户偏好语言的函数
    function getPreferredLanguage(ctx: APIContext) {
        const acceptLanguage = ctx.request.headers.get('Accept-Language')
        if (!acceptLanguage) return 'zh'

        // 简单的语言检测
        if (acceptLanguage.includes('zh')) return 'zh'
        if (acceptLanguage.includes('en')) return 'en'
        if (acceptLanguage.includes('km')) return 'km'
        if (acceptLanguage.includes('ko')) return 'ko'
        if (acceptLanguage.includes('th')) return 'th'
        if (acceptLanguage.includes('vi')) return 'vi'

        return 'zh' // 默认中文
    }

    return next()
}