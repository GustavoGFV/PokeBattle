import { en, type Dictionary, type TranslationKey } from './language-en.ts'

export type LanguageCode = 'en' | 'pt'

export interface LanguageOption {
  code: LanguageCode
  labelKey: TranslationKey
  // Inline SVG so no flag image assets are needed.
  flag: string
}

const FLAG_EN = `<svg viewBox="0 0 24 16" width="24" height="16" aria-hidden="true" focusable="false">
  <defs><clipPath id="flag-en-left"><rect width="12" height="16"/></clipPath><clipPath id="flag-en-right"><rect x="12" width="12" height="16"/></clipPath></defs>
  <g clip-path="url(#flag-en-left)"><rect width="24" height="16" fill="#012169"/><path d="M0 0L24 16M24 0L0 16" stroke="#fff" stroke-width="3"/><path d="M0 0L24 16M24 0L0 16" stroke="#C8102E" stroke-width="1.4"/><path d="M12 0V16M0 8H24" stroke="#fff" stroke-width="5"/><path d="M12 0V16M0 8H24" stroke="#C8102E" stroke-width="3"/></g>
  <g clip-path="url(#flag-en-right)"><rect width="24" height="16" fill="#fff"/><path d="M0 1.2H24M0 3.6H24M0 6H24M0 8.4H24M0 10.8H24M0 13.2H24M0 15.6H24" stroke="#B22234" stroke-width="1.2"/><rect width="12" height="8.4" fill="#3C3B6E"/></g>
</svg>`

const FLAG_PT = `<svg viewBox="0 0 24 16" width="24" height="16" aria-hidden="true" focusable="false">
  <rect width="24" height="16" fill="#009C3B"/><path d="M12 1.6L22.4 8L12 14.4L1.6 8Z" fill="#FFDF00"/><circle cx="12" cy="8" r="3.4" fill="#002776"/><path d="M8.8 7.2Q12 6.2 15.2 8.2" stroke="#fff" stroke-width=".6" fill="none"/>
</svg>`

export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', labelKey: 'language.en', flag: FLAG_EN },
  { code: 'pt', labelKey: 'language.pt', flag: FLAG_PT },
]

const loaders: Record<LanguageCode, () => Promise<Dictionary>> = {
  en: async () => en,
  // Portuguese is only fetched when first selected.
  pt: async () => (await import('./language-pt.ts')).pt,
}

let current: LanguageCode = 'en'
let dictionary: Dictionary = en
const listeners = new Set<(code: LanguageCode) => void>()

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  return interpolate(dictionary[key] ?? en[key], params)
}

/** Translates data-driven names (arena themes, weather) and falls back to the original text. */
export function tName(prefix: 'theme' | 'weather', name: string): string {
  const key = `${prefix}.${name}` as TranslationKey
  return key in en ? t(key) : name
}

export function getLanguage(): LanguageCode {
  return current
}

export function onLanguageChange(listener: (code: LanguageCode) => void): void {
  listeners.add(listener)
}

export async function setLanguage(code: LanguageCode): Promise<void> {
  if (code === current) return
  const next = await loaders[code]()
  current = code
  dictionary = next
  document.documentElement.lang = code === 'pt' ? 'pt-BR' : 'en'
  for (const listener of listeners) listener(code)
}

/** Applies translations to static markup: data-i18n sets textContent, data-i18n-aria sets aria-label. */
export function applyTranslations(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n as TranslationKey)
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-aria]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAria as TranslationKey))
  }
}
