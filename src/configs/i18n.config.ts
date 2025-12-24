const i18nConfig = {
    zh: {
        key: 'zh-CN',
        label: '简体中文',
        lang: '语言'
    },
    en: {
        key: 'en',
        label: 'English',
        lang: 'Language'
    },
    th: {
        key: 'th',
        label: 'แบบไทย',
        lang: 'ภาษา'
    },
    km: {
        key: 'km',
        label: 'ខ្មែរ',
        lang: 'ភាសា'
    },
    ko: {
        key: 'ko',
        label: '한국인',
        lang: '언어'
    },
    vi: {
        key: 'vi',
        label: 'Tiếng Việt',
        lang: 'ngôn ngữ'
    }
} as const satisfies Record<string, { key: string; label: string, lang: string }>

// 1) 得到键名联合类型：'zh' | 'en' | 'th' | 'km' | 'ko' | 'vi'
export type Locale = keyof typeof i18nConfig

// 2) 类型守卫：把 string 过滤成 Locale
export function isLocale(x: string): x is Locale {
    return x in i18nConfig
}

// 3) 解析一个“可能是 string”的 locale，给默认值
export function resolveLocale(x?: string): Locale {
    return x && isLocale(x) ? x : 'zh'
}

// 4) 便捷获取配置
export function getLangMeta(l: Locale) {
    return i18nConfig[l]
}

export default i18nConfig