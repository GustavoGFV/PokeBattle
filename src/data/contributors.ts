import type { TranslationKey } from '../utils/language-en.ts'

export interface Contributor {
  name: string
  github: string
  roleKey: TranslationKey
}

// Add one entry per committer/contributor (keep in sync with `git shortlog -sn`).
export const CONTRIBUTORS: readonly Contributor[] = [
  { name: 'Gustavo Vieira', github: 'GustavoGFV', roleKey: 'credits.role.maintainer' },
]
