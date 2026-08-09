import { createI18n } from 'vue-i18n'
import en from './locales/en'
import th from './locales/th'

export type SupportedLocale = 'th' | 'en'

const STORAGE_KEY = 'user_locale'

function getInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'th'
  }

  const savedLocale = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null
  if (savedLocale && (savedLocale === 'th' || savedLocale === 'en')) {
    return savedLocale
  }

  const browserLang = (typeof navigator !== 'undefined' && navigator.language)
    ? navigator.language.toLowerCase()
    : 'th'
  if (browserLang.startsWith('th')) {
    return 'th'
  }

  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'th',
  messages: {
    th,
    en,
  },
})

export function setLocale(locale: SupportedLocale): void {
  if (i18n.mode === 'legacy') {
    ;(i18n.global.locale as unknown as string) = locale
  } else {
    ;(i18n.global.locale as any).value = locale
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale)
  }
}
