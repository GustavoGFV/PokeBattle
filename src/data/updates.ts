import type { TranslationKey } from '../utils/language-en.ts'

export interface UpdateEntry {
  version: string
  date: string
  titleKey: TranslationKey
  itemKeys: readonly TranslationKey[]
}

// Newest first. Add a new entry (and its keys in both language files) for each release.
export const UPDATES: readonly UpdateEntry[] = [
  {
    version: '1.3.0',
    date: '2026-10',
    titleKey: 'updates.v130.title',
    itemKeys: ['updates.v130.1', 'updates.v130.2', 'updates.v130.3', 'updates.v130.4', 'updates.v130.5'],
  },
  {
    version: '1.2.0',
    date: '2026-10',
    titleKey: 'updates.v120.title',
    itemKeys: ['updates.v120.1', 'updates.v120.2', 'updates.v120.3', 'updates.v120.4'],
  },
  {
    version: '1.1.0',
    date: '2026-10',
    titleKey: 'updates.v110.title',
    itemKeys: ['updates.v110.1', 'updates.v110.2', 'updates.v110.3', 'updates.v110.4'],
  },
  {
    version: '1.0.0',
    date: '2026-09',
    titleKey: 'updates.v100.title',
    itemKeys: ['updates.v100.1', 'updates.v100.2', 'updates.v100.3'],
  },
]
