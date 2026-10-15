import type { TrainerDefinition, TrainerShape } from '../domain/models.ts'
import rawTrainers from './TrainerSprites/TrainerList.json' with { type: 'json' }

interface RawTrainerPokemon {
  name: string
  type?: string[]
  moveset?: Array<{ name: string; type: string }>
}

interface RawTrainer {
  Name: string
  Region: string
  Pokemons: RawTrainerPokemon[]
}

const TRAINER_METADATA: Record<
  string,
  { title: string; shape: TrainerShape; color: string; accent: string }
> = {
  Brock: { title: 'PEWTER GYM LEADER', shape: 'square', color: '#b6a136', accent: '#e2bf65' },
  Misty: { title: 'CERULEAN GYM LEADER', shape: 'circle', color: '#3b82f6', accent: '#90cdf4' },
  Blue: { title: 'VIRIDIAN GYM LEADER', shape: 'square', color: '#3182ce', accent: '#90cdf4' },
  Lance: { title: 'DRAGON MASTER', shape: 'diamond', color: '#c22e28', accent: '#f95587' },
  Giovanni: { title: 'TEAM ROCKET BOSS', shape: 'hexagon', color: '#1a202c', accent: '#e53e3e' },
  Red: { title: 'CHAMPION', shape: 'circle', color: '#e53e3e', accent: '#f6e05e' },
  Whitney: { title: 'GOLDENROD GYM LEADER', shape: 'circle', color: '#f95587', accent: '#fed7e2' },
  Clair: { title: 'BLACKTHORN GYM LEADER', shape: 'triangle', color: '#6366f1', accent: '#c7d2fe' },
  Karen: { title: 'ELITE FOUR', shape: 'diamond', color: '#475569', accent: '#cbd5e1' },
  Ethan: { title: 'JOHTO CHAMPION', shape: 'circle', color: '#eab308', accent: '#fef08a' },
  Norman: { title: 'PETALBURG GYM LEADER', shape: 'square', color: '#78716c', accent: '#d6d3d1' },
  Wallace: { title: 'SOOTOPOLIS GYM LEADER', shape: 'triangle', color: '#06b6d4', accent: '#a5f3fc' },
  'Steven Stone': { title: 'HOENN CHAMPION', shape: 'diamond', color: '#64748b', accent: '#e2e8f0' },
  Brendan: { title: 'HOENN HERO', shape: 'circle', color: '#10b981', accent: '#a7f3d0' },
  Volkner: { title: 'SUNYSHORE GYM LEADER', shape: 'square', color: '#eab308', accent: '#fef08a' },
  Flint: { title: 'ELITE FOUR', shape: 'triangle', color: '#f97316', accent: '#fed7aa' },
  Cynthia: { title: 'SINNOH CHAMPION', shape: 'diamond', color: '#1e1e1e', accent: '#facc15' },
  Lucas: { title: 'SINNOH HERO', shape: 'circle', color: '#2563eb', accent: '#93c5fd' },
}

export const TRAINER_REGIONS: string[] = []

export const TRAINERS: TrainerDefinition[] = (rawTrainers as RawTrainer[]).map((raw) => {
  const meta = TRAINER_METADATA[raw.Name] || {
    title: 'POKÉMON TRAINER',
    shape: 'circle' as TrainerShape,
    color: '#3b82f6',
    accent: '#93c5fd',
  }

  const region = raw.Region || 'Unknown'
  if (!TRAINER_REGIONS.includes(region)) {
    TRAINER_REGIONS.push(region)
  }

  const id = raw.Name.toLowerCase().replace(/[^a-z0-9]/g, '-')

  const roster = raw.Pokemons.map((p) => {
    return p.name.toLowerCase().replace(/[^a-z0-9-]/g, '')
  })

  // Calculate dominant pokemon type for this trainer
  const typeCounts: Record<string, number> = {}
  for (const p of raw.Pokemons) {
    for (const t of p.type || []) {
      typeCounts[t] = (typeCounts[t] || 0) + 1
    }
  }
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
  const typing = sortedTypes.length > 0 ? sortedTypes[0][0] : undefined

  return {
    id,
    name: raw.Name,
    title: meta.title,
    shape: meta.shape,
    color: meta.color,
    accent: meta.accent,
    sprite: raw.Name,
    region,
    roster,
    typing,
  }
})
