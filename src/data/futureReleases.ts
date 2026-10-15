import { GITHUB_RAW_URL } from './constants.ts'
import type { LanguageCode } from '../utils/i18n.ts'

export interface FutureRelease {
  title: string
  description: string
  eta?: string
}

type Localized = string | Partial<Record<LanguageCode, string>>

// Edit future-releases.json on GitHub (main branch) to change this list without redeploying.
export const FUTURE_RELEASES_URL = `${GITHUB_RAW_URL}/future-releases.json`

function pick(value: unknown, lang: LanguageCode): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const map = value as Partial<Record<LanguageCode, unknown>>
    const text = map[lang] ?? map.en
    if (typeof text === 'string') return text
  }
  return ''
}

/** Parses the remote payload `{ "items": [{ "title", "description", "eta" }] }`; text may be a string or `{ en, pt }`. */
export function parseFutureReleases(data: unknown, lang: LanguageCode): FutureRelease[] {
  const items = (data as { items?: unknown } | null)?.items
  if (!Array.isArray(items)) return []
  return items
    .map((raw: { title?: Localized; description?: Localized; eta?: unknown }) => ({
      title: pick(raw?.title, lang),
      description: pick(raw?.description, lang),
      eta: typeof raw?.eta === 'string' ? raw.eta : undefined,
    }))
    .filter((item) => item.title)
}

export async function fetchFutureReleases(lang: LanguageCode, signal?: AbortSignal): Promise<FutureRelease[]> {
  const response = await fetch(FUTURE_RELEASES_URL, { cache: 'no-cache', signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return parseFutureReleases(await response.json(), lang)
}
