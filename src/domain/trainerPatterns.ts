import type { TrainerDefinition } from './models.ts'
import { POKEMONS } from '../data/pokemons.ts'

export type TrainerPatternType =
  | 'water-kanto'
  | 'water-johto'
  | 'water-hoenn'
  | 'water-sinnoh'
  | 'rock-kanto'
  | 'rock-johto'
  | 'rock-hoenn'
  | 'rock-sinnoh'
  | 'electric-kanto'
  | 'electric-johto'
  | 'electric-hoenn'
  | 'electric-sinnoh'
  | 'fire-kanto'
  | 'fire-johto'
  | 'fire-hoenn'
  | 'fire-sinnoh'
  | 'leaf-kanto'
  | 'leaf-johto'
  | 'leaf-hoenn'
  | 'leaf-sinnoh'
  | 'tech-kanto'
  | 'tech-johto'
  | 'tech-hoenn'
  | 'tech-sinnoh'
  | 'water'
  | 'rock'
  | 'electric'
  | 'fire'
  | 'leaf'
  | 'tech'

const TYPE_THEME_MAP: Record<string, 'water' | 'rock' | 'electric' | 'fire' | 'leaf' | 'tech'> = {
  water: 'water',
  ice: 'water',
  rock: 'rock',
  ground: 'rock',
  steel: 'rock',
  electric: 'electric',
  fire: 'fire',
  dragon: 'fire',
  grass: 'leaf',
  bug: 'leaf',
  poison: 'leaf',
  psychic: 'tech',
  ghost: 'tech',
  dark: 'tech',
  fighting: 'tech',
  fairy: 'tech',
  normal: 'tech',
  flying: 'tech',
}

/**
 * Resolves the dominant element type from a trainer definition or their roster.
 */
function resolveDominantType(trainer: TrainerDefinition): string {
  if (trainer.typing) {
    return trainer.typing.toLowerCase()
  }

  // Derive from trainer roster if available
  if (trainer.roster && trainer.roster.length > 0) {
    const typeCounts: Record<string, number> = {}
    for (const pokeId of trainer.roster) {
      const poke = POKEMONS[pokeId.toLowerCase()]
      if (poke) {
        const t1 = poke.type?.toLowerCase()
        if (t1) typeCounts[t1] = (typeCounts[t1] || 0) + 1
        const t2 = poke.secondaryType?.toLowerCase()
        if (t2) typeCounts[t2] = (typeCounts[t2] || 0) + 1
      }
    }
    const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
    if (sorted.length > 0) {
      return sorted[0][0]
    }
  }

  // Fallback to title keywords if present
  const title = (trainer.title || '').toLowerCase()
  for (const type of Object.keys(TYPE_THEME_MAP)) {
    if (title.includes(type)) return type
  }

  return 'normal'
}

/**
 * Returns a pattern category based strictly on the trainer's Typing and Region combination.
 * Character names are never used. Uniquely differentiates (e.g. Fire + Kanto vs Fire + Hoenn).
 */
export function getTrainerPatternType(trainer: TrainerDefinition): TrainerPatternType {
  const typeKey = resolveDominantType(trainer)
  const baseTheme = TYPE_THEME_MAP[typeKey] || 'tech'
  const region = (trainer.region || 'kanto').toLowerCase()

  const validRegions = ['kanto', 'johto', 'hoenn', 'sinnoh']
  const normalizedRegion = validRegions.includes(region) ? region : 'kanto'

  return `${baseTheme}-${normalizedRegion}` as TrainerPatternType
}
