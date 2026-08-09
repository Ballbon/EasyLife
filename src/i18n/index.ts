import { createI18n } from 'vue-i18n'
import en from './locales/en'
import th from './locales/th'

export type SupportedLocale = 'th' | 'en'

const STORAGE_KEY = 'user_locale'

function getInitialLocale(): SupportedLocale {
  const savedLocale = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null
  if (savedLocale && (savedLocale === 'th' || savedLocale === 'en')) {
    return savedLocale
  }

  const browserLang = navigator.language.toLowerCase()
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
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}
