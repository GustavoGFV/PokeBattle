import { POKEMONS } from '../data/pokemons.ts'
import { MOVES } from '../data/moves.ts'
import { getCreatureTypes, getTypeMultiplier } from '../data/types.ts'
import type { Battler, PokemonDefinition, MoveDefinition, StatKey } from './models.ts'

const STAT_STAGE_LIMIT = 2
const LOW_HEALTH_THRESHOLD = 0.34
const DEFAULT_MOVE_RANGE = 150

export function availableMoves(battler: Battler, pokemon: PokemonDefinition): MoveDefinition[] {
  const moveIds = battler.moves ?? pokemon.moves
  return moveIds
    .filter((moveId) => (battler.uses ? (battler.uses[moveId] ?? 0) > 0 : true))
    .map((moveId) => MOVES[moveId])
    .filter(Boolean)
}

export function chooseMove(
  battler: Battler,
  opponent: Battler,
  random: () => number = Math.random,
  opponentDistance = Number.POSITIVE_INFINITY,
): MoveDefinition | undefined {
  const pokemon = POKEMONS[battler.pokemonId || battler.creatureId]
  const opponentPokemon = POKEMONS[opponent.pokemonId || opponent.creatureId]
  if (!pokemon || !opponentPokemon) return undefined

  const moves = availableMoves(battler, pokemon)
  if (!moves.length) return undefined

  const inRangeCandidates = moves
    .filter((move) => !move.power || opponentDistance <= (move.range ?? DEFAULT_MOVE_RANGE))
    .map((move) => ({ move, score: scoreMove(move, battler, opponent, pokemon, opponentPokemon), tieBreak: random() }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.tieBreak - right.tieBreak)

  if (inRangeCandidates.length > 0) {
    return inRangeCandidates[0].move
  }

  // Fallback: if opponent is close to maximum move range, execute attack so battlers stay engaged
  const attackCandidates = moves
    .filter((move) => move.power)
    .map((move) => ({ move, score: scoreMove(move, battler, opponent, pokemon, opponentPokemon), tieBreak: random() }))
    .sort((left, right) => right.score - left.score || left.tieBreak - right.tieBreak)

  if (attackCandidates.length > 0 && opponentDistance <= (attackCandidates[0].move.range ?? DEFAULT_MOVE_RANGE) + 35) {
    return attackCandidates[0].move
  }

  return undefined
}

export function typeMultiplier(move: MoveDefinition, defender: PokemonDefinition): number {
  return getTypeMultiplier(move.type, getCreatureTypes(defender.type, defender.secondaryType))
}

export function calculateDodgeChance(speed: number): number {
  return 0.25 * (speed / 100)
}

export function calculateDamage(move: MoveDefinition, attacker: Battler, defender: Battler, isCritical = false): number {
  if (!move.power) return 0

  const attackerPokemon = POKEMONS[attacker.pokemonId || attacker.creatureId]
  const defenderPokemon = POKEMONS[defender.pokemonId || defender.creatureId]
  if (!attackerPokemon || !defenderPokemon) return 0

  const attackKey: StatKey = move.category === 'special' ? 'specialAttack' : 'attack'
  const defenseKey: StatKey = move.category === 'special' ? 'specialDefense' : 'defense'
  const offense = adjustedStat(attackerPokemon.stats[attackKey], attacker.stages[attackKey] ?? 0)
  const defense = adjustedStat(defenderPokemon.stats[defenseKey], defender.stages[defenseKey] ?? 0)
  const critMultiplier = isCritical ? 1.5 : 1
  const baseDamage = (move.power + offense * 0.2 - defense * 0.1) * critMultiplier
  const effectiveness = typeMultiplier(move, defenderPokemon)
  if (effectiveness === 0) return 0

  return Math.max(1, Math.round(baseDamage * effectiveness))
}

export function applyMoveEffect(move: MoveDefinition, attacker: Battler, defender: Battler): void {
  if (!move.effect) return
  const target = move.effect.target === 'self' ? attacker : defender
  const currentStage = target.stages[move.effect.stat] ?? 0
  target.stages[move.effect.stat] = Math.max(-STAT_STAGE_LIMIT, Math.min(STAT_STAGE_LIMIT, currentStage + move.effect.stages))
}

export function adjustedStat(base: number, stages: number): number {
  return base * (1 + Math.max(-STAT_STAGE_LIMIT, Math.min(STAT_STAGE_LIMIT, stages)) * 0.2)
}

function scoreMove(
  move: MoveDefinition,
  user: Battler,
  target: Battler,
  pokemon: PokemonDefinition,
  targetPokemon: PokemonDefinition,
): number {
  const healthRatio = user.hp / pokemon.stats.hp

  if (move.healing) {
    const missingHealth = pokemon.stats.hp - user.hp
    return healthRatio <= LOW_HEALTH_THRESHOLD && missingHealth >= 12 ? 1000 + move.healing : -1
  }

  if (move.effect) {
    const affected = move.effect.target === 'self' ? user : target
    const currentStage = affected.stages[move.effect.stat] ?? 0
    const needed = move.effect.stages > 0 ? currentStage < 1 : currentStage > -1
    if (!needed) return -1
    return move.effect.target === 'self' ? 150 + move.effect.stages : 125 + Math.abs(move.effect.stages)
  }

  const multiplier = typeMultiplier(move, targetPokemon)
  if (multiplier === 0) return -1
  const advantage = multiplier > 1 ? 300 : multiplier < 1 ? 70 : 150
  const statFit = move.category === 'special' ? pokemon.stats.specialAttack : pokemon.stats.attack
  return advantage + (move.power ?? 0) + statFit * 0.04
}

export function engagementRange(battler: Battler): number {
  const pokemon = POKEMONS[battler.pokemonId || battler.creatureId]
  if (!pokemon) return DEFAULT_MOVE_RANGE
  const attackRanges = availableMoves(battler, pokemon)
    .filter((move) => move.power)
    .map((move) => move.range ?? DEFAULT_MOVE_RANGE)
  if (!attackRanges.length) return DEFAULT_MOVE_RANGE
  const minRange = Math.min(...attackRanges)
  const maxRange = Math.max(...attackRanges)
  return Math.max(100, Math.min(220, minRange, maxRange * 0.65))
}