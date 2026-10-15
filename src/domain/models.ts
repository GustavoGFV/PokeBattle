import type { ElementType } from '../data/types.ts'

const SHINY_CHANCE = 1 / 15

export type StatKey = 'hp' | 'speed' | 'defense' | 'attack' | 'specialDefense' | 'specialAttack'
export type MoveCategory = 'physical' | 'special' | 'support'
export type Side = 'sun' | 'moon'
export type PokemonAnimationState = 'idle' | 'walk' | 'attack' | 'hurt' | 'summon' | 'faint'
export type CreatureAnimationState = PokemonAnimationState

export type SpriteDirection = 'up' | 'down' | 'left' | 'right'
export type AttackVisualKind = 'projectile' | 'slash' | 'burst' | 'dash' | 'punch'
export type TrainerShape = 'triangle' | 'square' | 'diamond' | 'circle' | 'hexagon'

export interface TrainerAppearance {
  id: string
  name: string
  title: string
  shape: TrainerShape
  color: string
  accent: string
  sprite?: string
  region?: string
  typing?: ElementType | string
}

export interface TrainerDefinition extends TrainerAppearance {
  region: string
  roster: string[]
  typing?: ElementType | string
  customMoves?: Record<string, [string, string, string, string]>
}

export interface PokemonStats {
  hp: number
  speed: number
  defense: number
  attack: number
  specialDefense: number
  specialAttack: number
}

export interface PixelSprite {
  rows: readonly string[]
  body: string
  accent: string
  animations?: Partial<Record<PokemonAnimationState, SpriteAnimation>>
  directionalAnimations?: Partial<Record<SpriteDirection, Partial<Record<PokemonAnimationState, SpriteAnimation>>>>
}

export interface SpriteAnimation {
  frames: readonly SpriteFrame[]
  frameDurationMs: number
  loop?: boolean
}

export interface SpriteFrame {
  rows: readonly string[]
  body: string
  accent: string
}

export interface PokemonDefinition {
  id: string
  name: string
  size: number
  type: ElementType
  secondaryType?: ElementType
  stats: PokemonStats
  moves: [string, string, string, string]
  region: string
  sprite?: PixelSprite
  isShiny?: boolean
}

/**
 * Data model for a Pokemon entity with strictly typed properties and shiny status management.
 */
export class Pokemon implements PokemonDefinition {
  readonly id: string
  readonly name: string
  readonly size: number
  readonly type: ElementType
  readonly secondaryType?: ElementType
  readonly stats: PokemonStats
  readonly moves: [string, string, string, string]
  readonly region: string
  readonly sprite?: PixelSprite
  isShiny: boolean

  constructor(data: PokemonDefinition, isShiny?: boolean) {
    this.id = data.id
    this.name = data.name
    this.size = data.size
    this.type = data.type
    this.secondaryType = data.secondaryType
    this.stats = data.stats
    this.moves = data.moves
    this.region = data.region
    this.sprite = data.sprite
    this.isShiny = isShiny ?? Pokemon.rollShiny()
  }

  /**
   * Calculates whether a Pokemon is shiny based on a 1/15 (15%) chance.
   */
  static rollShiny(chance: number = SHINY_CHANCE): boolean {
    return Math.random() < chance
  }
}

export interface MoveEffect {
  stat: Exclude<StatKey, 'hp'>
  stages: number
  target: 'self' | 'opponent'
}

export interface AttackSpriteDefinition {
  src: string
  frameWidth: number
  frameHeight: number
  frameCount: number
  framesPerSecond: number
  renderScale?: number
  loop?: boolean
}

export interface MoveDefinition {
  id: string
  name: string
  type: ElementType
  category: MoveCategory
  power?: number
  healing?: number
  effect?: MoveEffect
  range?: number
  knockbackScale?: number
  movement?: { kind: 'dash'; distance: number; passesThrough: boolean }
  animation?: { kind: AttackVisualKind; color?: string; sprite?: AttackSpriteDefinition }
  uses?: number
}

export interface KnockbackState {
  velocityX: number
  velocityY: number
  remainingMs: number
}

export interface AttackAnimation {
  id: number
  kind: AttackVisualKind
  color: string
  sprite?: AttackSpriteDefinition
  fromX: number
  fromY: number
  toX: number
  toY: number
  elapsedMs: number
  durationMs: number
}

export interface Battler {
  pokemonId: string
  creatureId: string
  hp: number
  x: number
  y: number
  orbitAngle: number
  direction: SpriteDirection
  /** Screen-space angle (radians, 0 = right, +π/2 = toward the viewer) from this battler to its opponent. */
  facingAngle: number
  knockback: KnockbackState | null
  animationState: PokemonAnimationState
  animationElapsedMs: number
  animationDurationMs: number
  stages: Partial<Record<Exclude<StatKey, 'hp'>, number>>
  uses?: Record<string, number>
  isShiny?: boolean
  moves?: [string, string, string, string]
}

export interface TeamState {
  side: Side
  name: string
  trainer: TrainerAppearance
  competitor: TrainerAppearance
  roster: string[]
  index: number
  active: Battler
}

export interface BattleLogEntry {
  time: number
  message: string
  side: Side | 'system'
}

export type BattlePhase = 'ready' | 'entrance' | 'running' | 'paused' | 'ended'

export interface DamageNumber {
  id: number
  value: number | string
  x: number
  y: number
  isCritical: boolean
  isDodge?: boolean
  elapsedMs: number
  durationMs: number
}

export interface BattleState {
  phase: BattlePhase
  elapsedMs: number
  introElapsedMs: number
  teams: Record<Side, TeamState>
  winner: Side | 'draw' | null
  log: BattleLogEntry[]
  lastImpact: { side: Side; at: number; healing: boolean; color?: string; type?: ElementType; critical?: boolean } | null
  attackAnimations: AttackAnimation[]
  damageNumbers: DamageNumber[]
}