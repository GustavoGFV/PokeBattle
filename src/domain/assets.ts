import type { SpriteDirection, PokemonDefinition } from './models.ts'
import { XMLParser } from 'fast-xml-parser'

export type PokemonAnimName = 'Walk' | 'Attack' | 'Faint'

export interface AnimSpec {
  frameWidth: number
  frameHeight: number
  footY: number
  durations: readonly number[]
}

export interface PokemonAssetConfig {
  walk: AnimSpec
  attack: AnimSpec
  faint: AnimSpec
}

/**
 * Direction rows based on standard 8-direction sprite sheets:
 * row 0: down, row 2: right, row 4: up, row 6: left
 */
export const POKEMON_DIRECTION_ROWS: Record<SpriteDirection, number> = {
  down: 0,
  right: 2,
  up: 4,
  left: 6,
}

// Full 8-way order of PMD sheets, clockwise on screen starting at "right":
// right, down-right, down, down-left, left, up-left, up, up-right.
const OCTANT_ROWS = [2, 1, 0, 7, 6, 5, 4, 3] as const

/** Maps a screen-space angle (radians, 0 = right, +π/2 = down/toward viewer) to the nearest sheet row. */
export function getDirectionRowForAngle(angle: number): number {
  const octant = Math.round(angle / (Math.PI / 4))
  return OCTANT_ROWS[((octant % 8) + 8) % 8]
}

export const DEFAULT_POKEMON_ANIM_CONFIG: PokemonAssetConfig = {
  walk: { frameWidth: 32, frameHeight: 32, footY: 26, durations: [8, 14, 8, 14] },
  attack: { frameWidth: 64, frameHeight: 64, footY: 42, durations: [3, 3, 3, 3, 3, 3, 3, 3] },
  faint: { frameWidth: 40, frameHeight: 40, footY: 30, durations: [8, 14] },
}

const isViteRuntime = typeof window !== 'undefined' || Boolean(import.meta.env)

// Auto-discover all available sprite assets via Vite
const trainerImages: Record<string, unknown> = isViteRuntime
  ? import.meta.glob('/src/data/TrainerSprites/*/*.png', { eager: true, import: 'default' }) as Record<string, unknown>
  : {}

const pokemonImages: Record<string, unknown> = isViteRuntime
  ? import.meta.glob('/src/data/PokemonSprites/**/*.png', { eager: true, import: 'default' }) as Record<string, unknown>
  : {}

// Auto-discover all AnimData.xml files as raw strings
const animDataXmls: Record<string, string> = isViteRuntime
  ? import.meta.glob('/src/data/PokemonSprites/**/AnimData.xml', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
  : {}

const pokemonGifs: Record<string, unknown> = isViteRuntime
  ? import.meta.glob('/src/data/PokemonSprites/**/*.gif', { eager: true, import: 'default' }) as Record<string, unknown>
  : {}

// TODO: Implement padronized sprites for Rotom
// Rotom-Wash currently ships only an animated GIF. Exact id match; once its own Walk-Anim.png exists
// the standard AnimData.xml + spritesheet pipeline takes over automatically.
const GIF_ONLY_POKEMON = new Set(['rotom-wash'])

export function isGifOnlyPokemon(pokemonName: string): boolean {
  const id = pokemonName.toLowerCase()
  return GIF_ONLY_POKEMON.has(id) && !hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}/Walk-Anim.png`)
}

export function getPokemonGifPath(pokemonName: string, isShiny = false): string {
  const file = `${pokemonName.toLowerCase()}-animated${isShiny ? '_Shiny' : ''}.gif`
  const key = `/src/data/PokemonSprites/${pokemonName}/${file}`
  const value = indexFor(pokemonGifs).get(key.toLowerCase())
  return typeof value === 'string' ? value : key
}

const lookupIndexes = new WeakMap<object, Map<string, unknown>>()

// Case-insensitive, slash-normalized index built once per glob map so lookups stay O(1) per frame.
function indexFor(map: Record<string, unknown>): Map<string, unknown> {
  let index = lookupIndexes.get(map)
  if (!index) {
    index = new Map()
    for (const [key, value] of Object.entries(map)) index.set(key.replace(/\\/g, '/').toLowerCase(), value)
    lookupIndexes.set(map, index)
  }
  return index
}

function hasAsset(map: Record<string, unknown>, key: string): boolean {
  return indexFor(map).has(key.replace(/\\/g, '/').toLowerCase())
}

function resolveAsset(map: Record<string, unknown>, key: string): string {
  const value = indexFor(map).get(key.replace(/\\/g, '/').toLowerCase())
  return typeof value === 'string' ? value : key
}

const parsedConfigCache = new Map<string, PokemonAssetConfig>()
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  isArray: (name) => name === 'Anim' || name === 'Duration',
  parseTagValue: false,
  trimValues: true,
})

function positiveNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * Parses AnimData.xml into walk/attack/faint specs. Frame sizes and durations are strict positive
 * numbers, `<CopyOf>` chains are resolved recursively, and missing data falls back to the defaults.
 */
export function parsePokemonAnimXml(xmlContent: string): PokemonAssetConfig {
  try {
    const parsedXml = xmlParser.parse(xmlContent) as {
      AnimData?: { Anims?: { Anim?: Array<Record<string, unknown>> } }
    }
    const animations = parsedXml.AnimData?.Anims?.Anim ?? []
    const byName = new Map<string, Record<string, unknown>>()
    for (const animation of animations) {
      const name = animation.Name
      if (typeof name === 'string' && name.trim()) byName.set(name.toLowerCase(), animation)
    }

    const resolve = (targetName: string, fallback: AnimSpec, visited = new Set<string>()): AnimSpec => {
      const key = targetName.toLowerCase()
      if (visited.has(key)) return fallback
      visited.add(key)

      const animation = byName.get(key)
      if (!animation) return fallback
      const copyOf = animation.CopyOf
      const inherited = typeof copyOf === 'string' && copyOf.trim()
        ? resolve(copyOf.trim(), fallback, visited)
        : fallback
      const width = positiveNumber(animation.FrameWidth) ?? inherited.frameWidth
      const height = positiveNumber(animation.FrameHeight) ?? inherited.frameHeight
      const durationBlock = animation.Durations as { Duration?: unknown[] } | undefined
      const durationValues = durationBlock?.Duration
      const durations = Array.isArray(durationValues)
        ? durationValues.map(positiveNumber).filter((value): value is number => value !== undefined)
        : []

      return {
        frameWidth: width,
        frameHeight: height,
        footY: Math.round(height * 0.75),
        durations: durations.length ? durations : inherited.durations,
      }
    }

    const walk = resolve('Walk', DEFAULT_POKEMON_ANIM_CONFIG.walk)
    const attack = resolve('Attack', resolve('Strike', resolve('Shoot', DEFAULT_POKEMON_ANIM_CONFIG.attack)))
    const faint = resolve('Faint', resolve('Hurt', resolve('Sleep', DEFAULT_POKEMON_ANIM_CONFIG.faint)))

    return { walk, attack, faint }
  } catch {
    return DEFAULT_POKEMON_ANIM_CONFIG
  }
}

export function hasPokemonSprite(
  pokemonOrName: string | PokemonDefinition | { name: string; isShiny?: boolean },
  animName: PokemonAnimName,
  isShinyParam?: boolean,
): boolean {
  const pokemonName = typeof pokemonOrName === 'string' ? pokemonOrName : pokemonOrName.name
  const isShiny = isShinyParam ?? (typeof pokemonOrName === 'object' ? !!pokemonOrName.isShiny : false)

  if (isShiny) {
    const hasShiny =
      hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}/${animName}-Anim_shiny.png`) ||
      hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}/${animName.toLowerCase()}-Anim_shiny.png`) ||
      hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}_shiny/${animName}-Anim.png`) ||
      hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}_shiny/${animName.toLowerCase()}-Anim.png`)
    if (hasShiny) return true
    if (pokemonName.includes('-')) {
      const baseName = pokemonName.split('-')[0]
      return hasPokemonSprite(baseName, animName, true)
    }
    return false
  }

  const hasStandard =
    hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}/${animName}-Anim.png`) ||
    hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}/${animName.toLowerCase()}-Anim.png`)
  if (hasStandard) return true
  if (pokemonName.includes('-')) {
    const baseName = pokemonName.split('-')[0]
    return hasPokemonSprite(baseName, animName, false)
  }
  return false
}

export function hasPokemonPortrait(
  pokemonOrName: string | PokemonDefinition | { name: string; isShiny?: boolean },
  isShinyParam?: boolean,
): boolean {
  const pokemonName = typeof pokemonOrName === 'string' ? pokemonOrName : pokemonOrName.name
  const isShiny = isShinyParam ?? (typeof pokemonOrName === 'object' ? !!pokemonOrName.isShiny : false)

  if (isShiny) {
    const hasShiny =
      hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}/Portrait_shiny.png`) ||
      hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}/portrait_shiny.png`) ||
      hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}_shiny/Portrait.png`) ||
      hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}_shiny/portrait.png`)
    if (hasShiny) return true
    if (pokemonName.includes('-')) {
      const baseName = pokemonName.split('-')[0]
      return hasPokemonPortrait(baseName, true)
    }
    return false
  }

  const hasStandard = hasAsset(pokemonImages, `/src/data/PokemonSprites/${pokemonName}/Portrait.png`)
  if (hasStandard) return true
  if (pokemonName.includes('-')) {
    const baseName = pokemonName.split('-')[0]
    return hasPokemonPortrait(baseName, false)
  }
  return false
}

export function getPokemonSpritePath(
  pokemonOrName: string | PokemonDefinition | { name: string; isShiny?: boolean },
  animName: PokemonAnimName,
  isShinyParam?: boolean,
): string {
  const pokemonName = typeof pokemonOrName === 'string' ? pokemonOrName : pokemonOrName.name
  const isShiny = isShinyParam ?? (typeof pokemonOrName === 'object' ? !!pokemonOrName.isShiny : false)

  if (isShiny) {
    const candidates = [
      `/src/data/PokemonSprites/${pokemonName}/${animName}-Anim_shiny.png`,
      `/src/data/PokemonSprites/${pokemonName}/${animName.toLowerCase()}-Anim_shiny.png`,
      `/src/data/PokemonSprites/${pokemonName}_shiny/${animName}-Anim.png`,
      `/src/data/PokemonSprites/${pokemonName}_shiny/${animName.toLowerCase()}-Anim.png`,
    ]
    for (const candidate of candidates) {
      if (hasAsset(pokemonImages, candidate)) return resolveAsset(pokemonImages, candidate)
    }
    if (pokemonName.includes('-')) {
      const baseName = pokemonName.split('-')[0]
      return getPokemonSpritePath(baseName, animName, true)
    }
    return `/src/data/PokemonSprites/${pokemonName}/${animName}-Anim_shiny.png`
  }

  const standardPath = `/src/data/PokemonSprites/${pokemonName}/${animName}-Anim.png`
  if (hasAsset(pokemonImages, standardPath)) return resolveAsset(pokemonImages, standardPath)
  const lowerPath = `/src/data/PokemonSprites/${pokemonName}/${animName.toLowerCase()}-Anim.png`
  if (hasAsset(pokemonImages, lowerPath)) return resolveAsset(pokemonImages, lowerPath)

  if (pokemonName.includes('-')) {
    const baseName = pokemonName.split('-')[0]
    return getPokemonSpritePath(baseName, animName, false)
  }

  return standardPath
}

export function getPokemonPortraitPath(
  pokemonOrName: string | PokemonDefinition | { name: string; isShiny?: boolean },
  scene: 'menu' | 'battle' = 'menu',
  isShinyParam?: boolean,
): string {
  const pokemonName = typeof pokemonOrName === 'string' ? pokemonOrName : pokemonOrName.name
  const isShiny = isShinyParam ?? (typeof pokemonOrName === 'object' ? !!pokemonOrName.isShiny : false)

  if (isShiny) {
    if (scene === 'battle') {
      const battleCandidates = [
        `/src/data/PokemonSprites/${pokemonName}/portrait_battle_shiny.png`,
        `/src/data/PokemonSprites/${pokemonName}/Portrait_Battle_shiny.png`,
        `/src/data/PokemonSprites/${pokemonName}/Portrait_battle_shiny.png`,
        `/src/data/PokemonSprites/${pokemonName}/Portrait-Battle_shiny.png`,
        `/src/data/PokemonSprites/${pokemonName}/battle_portrait_shiny.png`,
        `/src/data/PokemonSprites/${pokemonName}_shiny/portrait_battle.png`,
        `/src/data/PokemonSprites/${pokemonName}_shiny/Portrait_Battle.png`,
        `/src/data/PokemonSprites/${pokemonName}_shiny/Portrait_battle.png`,
      ]
      for (const candidate of battleCandidates) {
        if (hasAsset(pokemonImages, candidate)) return resolveAsset(pokemonImages, candidate)
      }
      if (pokemonName.includes('-')) {
        const baseName = pokemonName.split('-')[0]
        return getPokemonPortraitPath(baseName, 'battle', true)
      }
      return `/src/data/PokemonSprites/${pokemonName}/portrait_battle_shiny.png`
    }

    const shinyPortraits = [
      `/src/data/PokemonSprites/${pokemonName}/Portrait_shiny.png`,
      `/src/data/PokemonSprites/${pokemonName}/portrait_shiny.png`,
      `/src/data/PokemonSprites/${pokemonName}_shiny/Portrait.png`,
      `/src/data/PokemonSprites/${pokemonName}_shiny/portrait.png`,
    ]
    for (const candidate of shinyPortraits) {
      if (hasAsset(pokemonImages, candidate)) return resolveAsset(pokemonImages, candidate)
    }
    if (pokemonName.includes('-')) {
      const baseName = pokemonName.split('-')[0]
      return getPokemonPortraitPath(baseName, scene, true)
    }
    return `/src/data/PokemonSprites/${pokemonName}/Portrait_shiny.png`
  }

  if (scene === 'battle') {
    const battleCandidates = [
      `/src/data/PokemonSprites/${pokemonName}/portrait_battle.png`,
      `/src/data/PokemonSprites/${pokemonName}/Portrait_Battle.png`,
      `/src/data/PokemonSprites/${pokemonName}/Portrait_battle.png`,
      `/src/data/PokemonSprites/${pokemonName}/Portrait-Battle.png`,
      `/src/data/PokemonSprites/${pokemonName}/battle_portrait.png`,
    ]
    for (const candidate of battleCandidates) {
      if (hasAsset(pokemonImages, candidate)) return resolveAsset(pokemonImages, candidate)
    }
  }

  const defaultKey = `/src/data/PokemonSprites/${pokemonName}/Portrait.png`
  if (hasAsset(pokemonImages, defaultKey)) return resolveAsset(pokemonImages, defaultKey)

  if (pokemonName.includes('-')) {
    const baseName = pokemonName.split('-')[0]
    return getPokemonPortraitPath(baseName, scene, false)
  }

  return defaultKey
}

export function getTrainerSpritePath(trainerName: string, anim: 'Walking' | 'Idle' | 'Portrait'): string {
  const key = `/src/data/TrainerSprites/${trainerName}/${anim}.png`
  if (hasAsset(trainerImages, key)) return resolveAsset(trainerImages, key)
  return key
}

/**
 * Automatically retrieves animation configuration by parsing AnimData.xml from the Pokemon folder,
 * with strict automatic fallback to DEFAULT_POKEMON_ANIM_CONFIG.
 */
export function getPokemonAssetConfig(pokemonName: string): PokemonAssetConfig {
  const cached = parsedConfigCache.get(pokemonName)
  if (cached) return cached

  const xmlKey = `/src/data/PokemonSprites/${pokemonName}/AnimData.xml`
  let rawXml: string | undefined = hasAsset(animDataXmls, xmlKey) ? resolveAsset(animDataXmls, xmlKey) : undefined
  if (rawXml === xmlKey) rawXml = undefined
  // Node.js environment fallback (e.g. during unit tests)
  const proc = (globalThis as any).process
  if (!rawXml && typeof proc !== 'undefined' && proc.versions?.node) {
    try {
      const fs = proc.getBuiltinModule ? proc.getBuiltinModule('node:fs') : undefined
      const path = proc.getBuiltinModule ? proc.getBuiltinModule('node:path') : undefined
      if (fs && path) {
        const filePath = path.resolve(proc.cwd(), `src/data/PokemonSprites/${pokemonName}/AnimData.xml`)
        if (fs.existsSync(filePath)) {
          rawXml = fs.readFileSync(filePath, 'utf8')
        }
      }
    } catch {}
  }

  if (!rawXml && pokemonName.includes('-')) {
    const baseName = pokemonName.split('-')[0]
    const baseConfig = getPokemonAssetConfig(baseName)
    if (baseConfig !== DEFAULT_POKEMON_ANIM_CONFIG) {
      parsedConfigCache.set(pokemonName, baseConfig)
      return baseConfig
    }
  }

  if (!rawXml) {
    parsedConfigCache.set(pokemonName, DEFAULT_POKEMON_ANIM_CONFIG)
    return DEFAULT_POKEMON_ANIM_CONFIG
  }

  const config = parsePokemonAnimXml(rawXml)
  parsedConfigCache.set(pokemonName, config)
  return config
}

const FRAME_UNIT_MS = 40

// Durations in AnimData.xml are expressed in 40 ms ticks. Allocation-free: called every frame.
export function getPokemonFrameIndex(durations: readonly number[], elapsedMs: number, loop = true): number {
  const totalMs = getPokemonTotalAnimDurationMs(durations)
  if (totalMs <= 0) return 0
  const time = Math.max(0, elapsedMs)
  const normalizedTime = loop ? time % totalMs : Math.min(time, totalMs - 1)
  let cursor = 0
  for (let i = 0; i < durations.length; i++) {
    cursor += durations[i] * FRAME_UNIT_MS
    if (normalizedTime < cursor) return i
  }
  return durations.length - 1
}

export function getPokemonTotalAnimDurationMs(durations: readonly number[]): number {
  let total = 0
  for (let i = 0; i < durations.length; i++) total += durations[i] * FRAME_UNIT_MS
  return total
}
