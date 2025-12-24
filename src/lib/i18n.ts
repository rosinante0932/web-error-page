import zh from '../i18n/zh.json'
import enRaw from '../i18n/en.json'
import thRaw from '../i18n/th.json'
import kmRaw from '../i18n/km.json'
import koRaw from '../i18n/ko.json'
import viRaw from '../i18n/vi.json'

export const SUPPORTED_LOCALES = ['zh', 'en', 'th', 'km', 'ko', 'vi'] as const
export type Locale = typeof SUPPORTED_LOCALES[number]

// 以 zh 作为基准结构，强校验其他语言
type Dict = typeof zh
export type I18nKey = keyof Dict
const en: Dict = enRaw
const th: Dict = thRaw
const km: Dict = kmRaw
const ko: Dict = koRaw
const vi: Dict = viRaw

const dict: Record<Locale, Dict> = { zh, en, th, km, ko, vi }

export function t(locale: Locale, key: I18nKey): string {
  return dict[locale][key] ?? key
}

// 解析/兜底：把 string | undefined 收敛为 Locale
export function resolveLocale(input: string | undefined): Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(input ?? '')
    ? (input as Locale)
    : 'zh'
}
