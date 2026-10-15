import type { Side } from '../domain/models.ts'

const STORAGE_KEY = 'field-circuit-record-v1'

export interface MatchRecord {
  wins: number
  losses: number
  draws: number
}

export function loadScore(): MatchRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { wins: 0, losses: 0, draws: 0 }
    const parsed = JSON.parse(stored) as Partial<MatchRecord>
    return { wins: validCount(parsed.wins), losses: validCount(parsed.losses), draws: validCount(parsed.draws) }
  } catch {
    return { wins: 0, losses: 0, draws: 0 }
  }
}

export function recordResult(winner: Side | 'draw'): MatchRecord {
  const current = loadScore()
  const updated = winner === 'draw'
    ? { ...current, draws: current.draws + 1 }
    : winner === 'sun'
      ? { ...current, wins: current.wins + 1 }
      : { ...current, losses: current.losses + 1 }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    return updated
  }
  return updated
}

function validCount(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
}