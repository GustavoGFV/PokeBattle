import { Pokemon, type PokemonDefinition } from '../domain/models.ts'
import kantoDex from './Dex/kanto_pokemons.json' with { type: 'json' }
import johtoDex from './Dex/johto_pokemons.json' with { type: 'json' }
import hoennDex from './Dex/hoenn_pokemons.json' with { type: 'json' }
import sinnohDex from './Dex/sinnoh_pokemons.json' with { type: 'json' }

export function rollShiny(chance: number = 1 / 15): boolean {
  return Pokemon.rollShiny(chance)
}

interface DexJson {
  Region: string
  Pokemons: Record<
    string,
    {
      id: string
      name: string
      size: number
      type: string
      secondaryType?: string
      stats: {
        hp: number
        speed: number
        defense: number
        attack: number
        specialDefense: number
        specialAttack: number
      }
      moves: string[]
    }
  >
}

export const POKEMONS: Record<string, PokemonDefinition> = {}
export const POKEMON_REGIONS: string[] = []

const FALLBACK_MOVES: [string, string, string, string] = ['tackle', 'quick-attack', 'swift', 'protect']

function loadDex(dex: DexJson): void {
  const region = dex.Region || 'Unknown'
  if (!POKEMON_REGIONS.includes(region)) {
    POKEMON_REGIONS.push(region)
  }

  for (const poke of Object.values(dex.Pokemons)) {
    const pokeId = poke.id.toLowerCase()
    const moves: [string, string, string, string] = [
      poke.moves[0] ?? FALLBACK_MOVES[0],
      poke.moves[1] ?? FALLBACK_MOVES[1],
      poke.moves[2] ?? FALLBACK_MOVES[2],
      poke.moves[3] ?? FALLBACK_MOVES[3],
    ]

    POKEMONS[pokeId] = new Pokemon({
      id: pokeId,
      name: poke.name,
      size: poke.size ?? 1.0,
      type: poke.type as any,
      secondaryType: poke.secondaryType as any,
      stats: poke.stats,
      moves,
      region,
    })
  }
}

// 1. Load standard Dex files
loadDex(kantoDex as DexJson)
loadDex(johtoDex as DexJson)
loadDex(hoennDex as DexJson)
loadDex(sinnohDex as DexJson)

// 2. Vite auto-discovery for any newly added *_pokemons.json files in src/data/Dex
if (typeof (import.meta as any).glob === 'function') {
  const dynamicDexModules: Record<string, DexJson> = (import.meta as any).glob('/src/data/Dex/*_pokemons.json', { eager: true })
  for (const path in dynamicDexModules) {
    const mod = dynamicDexModules[path]
    // Regions already loaded statically above are skipped to avoid rebuilding (and re-rolling) their Pokémon.
    if (mod && mod.Region && mod.Pokemons && !POKEMON_REGIONS.includes(mod.Region)) {
      loadDex(mod)
    }
  }
}

// 3. Ensure roster-specific pokemons from trainer sample teams are registered
if (!POKEMONS['rotom-wash']) {
  POKEMONS['rotom-wash'] = {
    id: 'rotom-wash',
    name: 'Rotom-Wash',
    size: 0.3,
    type: 'Electric',
    secondaryType: 'Water',
    stats: { hp: 120, speed: 86, defense: 107, attack: 65, specialDefense: 107, specialAttack: 105 },
    moves: ['hydro-pump', 'volt-switch', 'thunderbolt', 'will-o-wisp'],
    region: 'Sinnoh',
  }
}

if (!POKEMONS['druddigon']) {
  POKEMONS['druddigon'] = {
    id: 'druddigon',
    name: 'Druddigon',
    size: 1.6,
    type: 'Dragon',
    stats: { hp: 174, speed: 48, defense: 90, attack: 120, specialDefense: 90, specialAttack: 60 },
    moves: ['outrage', 'earthquake', 'sucker-punch', 'stealth-rock'],
    region: 'Unova',
  }
}

if (!POKEMONS['sawsbuck']) {
  POKEMONS['sawsbuck'] = {
    id: 'sawsbuck',
    name: 'Sawsbuck',
    size: 1.9,
    type: 'Normal',
    secondaryType: 'Grass',
    stats: { hp: 160, speed: 95, defense: 70, attack: 100, specialDefense: 70, specialAttack: 60 },
    moves: ['horn-leech', 'double-edge', 'jump-kick', 'swords-dance'],
    region: 'Unova',
  }
}

if (!POKEMONS['bouffalant']) {
  POKEMONS['bouffalant'] = {
    id: 'bouffalant',
    name: 'Bouffalant',
    size: 1.6,
    type: 'Normal',
    stats: { hp: 175, speed: 55, defense: 95, attack: 110, specialDefense: 95, specialAttack: 40 },
    moves: ['head-charge', 'earthquake', 'megahorn', 'swords-dance'],
    region: 'Unova',
  }
}

export const SUN_ROSTER = ['charizard', 'blastoise', 'venusaur']
export const MOON_ROSTER = ['venusaur', 'blastoise', 'charizard']

// Backwards compatibility export
export const CREATURES = POKEMONS
