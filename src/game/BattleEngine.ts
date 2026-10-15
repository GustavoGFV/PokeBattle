import { POKEMONS, MOON_ROSTER, SUN_ROSTER } from '../data/pokemons.ts'
import { getTypeColor } from '../data/types.ts'
import { getPokemonTotalAnimDurationMs, getPokemonAssetConfig } from '../domain/assets.ts'
import { adjustedStat, applyMoveEffect, calculateDamage, calculateDodgeChance, chooseMove, engagementRange, typeMultiplier } from '../domain/combat.ts'
import { getSpriteAnimationDurationMs } from '../domain/sprites.ts'
import { type BattleState, type Battler, type TrainerDefinition, type PokemonAnimationState, type Side, type TeamState, Pokemon } from '../domain/models.ts'
import { ARENA, ENTRANCE_DURATION_MS, clampToArena, separateBattlers } from './arena.ts'

const ACTION_INTERVAL_MS = 850
const MAX_LOG_ENTRIES = 100
const ORBIT_RADIUS = 72
const ORBIT_SPEED = 0.00052
const DEFAULT_ANIMATION_DURATION_MS = { attack: 460, hurt: 460, summon: 420, faint: 1400 }
let nextAnimationId = 0
let nextDamageNumberId = 0

export interface BattleSetup {
  sun: TrainerDefinition
  moon: TrainerDefinition
}

const DEFAULT_SETUP: BattleSetup = {
  sun: { id: 'sun', name: 'Red', title: 'CHAMPION', shape: 'circle', color: '#e53e3e', accent: '#f6e05e', sprite: 'Red', region: 'Kanto', roster: SUN_ROSTER },
  moon: { id: 'moon', name: 'Blue', title: 'RIVAL', shape: 'square', color: '#3182ce', accent: '#90cdf4', sprite: 'Blue', region: 'Kanto', roster: MOON_ROSTER },
}

export class BattleEngine {
  state: BattleState
  private actionClock = 0
  private pendingDefeat: { side: Side; timeoutMs: number } | null = null
  private readonly random: () => number
  private readonly setup: BattleSetup

  constructor(random: () => number = Math.random, setup: BattleSetup = DEFAULT_SETUP) {
    this.random = random
    this.setup = setup
    this.state = this.createInitialState()
  }

  start(): void {
    if (this.state.phase === 'ready') {
      this.state.phase = 'entrance'
      this.addLog('Challengers are taking their marks.', 'system')
    }
  }

  skipEntrance(): void {
    if (this.state.phase === 'entrance') this.finishEntrance()
  }

  pause(): void {
    if (this.state.phase === 'running') this.state.phase = 'paused'
  }

  resume(): void {
    if (this.state.phase === 'paused') this.state.phase = 'running'
  }

  restart(): void {
    this.actionClock = 0
    this.pendingDefeat = null
    this.state = this.createInitialState()
    this.start()
  }

  update(deltaMs: number): void {
    if (this.state.phase === 'ready') return
    const elapsed = Math.max(0, deltaMs)
    this.state.elapsedMs += elapsed

    if (this.state.phase === 'entrance') {
      this.state.introElapsedMs += elapsed
      if (this.state.introElapsedMs >= ENTRANCE_DURATION_MS) {
        this.finishEntrance()
      }
      return
    }

    if (this.state.phase !== 'running') return

    this.updateDamageNumbers(elapsed)
    this.updateAttackAnimations(elapsed)
    this.updateBattlerAnimations(elapsed)
    this.updateOrbits(elapsed)

    if (this.pendingDefeat) {
      this.pendingDefeat.timeoutMs -= elapsed
      if (this.pendingDefeat.timeoutMs <= 0) {
        const side = this.pendingDefeat.side
        this.pendingDefeat = null
        this.advanceTeam(this.state.teams[side])
      }
      return
    }

    this.movePokemons(elapsed)
    this.actionClock += elapsed
    while (this.actionClock >= ACTION_INTERVAL_MS) {
      this.actionClock -= ACTION_INTERVAL_MS
      this.performTurn()
      if ((this.state.phase as string) === 'ended') break
    }
  }

  private finishEntrance(): void {
    this.state.phase = 'running'
    this.state.introElapsedMs = ENTRANCE_DURATION_MS
    this.addLog('Whistle blows. Battle commences.', 'system')
  }

  private performTurn(): void {
    const sunTeam = this.state.teams.sun
    const moonTeam = this.state.teams.moon
    if (sunTeam.active.animationState === 'faint' || moonTeam.active.animationState === 'faint') return

    const order = [sunTeam, moonTeam].sort((left, right) =>
      adjustedStat(POKEMONS[right.active.pokemonId]?.stats.speed ?? 100, right.active.stages.speed ?? 0)
      - adjustedStat(POKEMONS[left.active.pokemonId]?.stats.speed ?? 100, left.active.stages.speed ?? 0),
    )

    for (const team of order) {
      if (this.state.phase === 'ended') return
      const defenderTeam = team.side === 'sun' ? moonTeam : sunTeam
      const attacker = team.active
      const defender = defenderTeam.active
      if (attacker.hp <= 0 || defender.hp <= 0) continue

      const attackerPokemon = POKEMONS[attacker.pokemonId]
      const defenderPokemon = POKEMONS[defender.pokemonId]
      if (!attackerPokemon || !defenderPokemon) continue

      const distance = Math.hypot(defender.x - attacker.x, defender.y - attacker.y)
      const move = chooseMove(attacker, defender, this.random, distance)
      if (!move) continue

      faceOpponent(attacker, defender)
      const attackDuration = move.animation?.kind === 'punch'
        ? 500
        : spriteAnimationDuration(attacker, 'attack', DEFAULT_ANIMATION_DURATION_MS.attack)
      setAnimation(attacker, 'attack', attackDuration)

      const moveColor = move.animation?.color ?? getTypeColor(move.type)
      const isCritical = this.random() < 0.12

      if (move.movement?.kind === 'dash') {
        const dashDistance = Math.min(distance - 18, move.movement.distance)
        const dashAngle = Math.atan2(defender.y - attacker.y, defender.x - attacker.x)
        attacker.x = clamp(attacker.x + Math.cos(dashAngle) * dashDistance, ARENA.minX, ARENA.maxX)
        attacker.y = clamp(attacker.y + Math.sin(dashAngle) * dashDistance, ARENA.minY, ARENA.maxY)
        this.separate()
      }

      this.state.attackAnimations.push({
        id: nextAnimationId++,
        kind: move.animation?.kind ?? (move.category === 'special' ? 'projectile' : 'slash'),
        color: moveColor,
        sprite: move.animation?.sprite,
        fromX: attacker.x,
        fromY: attacker.y,
        toX: defender.x,
        toY: defender.y,
        elapsedMs: 0,
        durationMs: attackDuration,
      })

      if (move.healing) {
        const restored = Math.min(move.healing, attackerPokemon.stats.hp - attacker.hp)
        attacker.hp = Math.min(attackerPokemon.stats.hp, attacker.hp + move.healing)
        this.addLog(`${attackerPokemon.name} used ${move.name}; restored ${restored} vitality.`, team.side)
        this.state.lastImpact = { side: team.side, at: this.state.elapsedMs, healing: true, color: moveColor }
        this.state.damageNumbers.push({ id: nextDamageNumberId++, value: restored, x: attacker.x, y: attacker.y - 28, isCritical: false, elapsedMs: 0, durationMs: 820 })
      }

      if (move.power) {
        const defenderSpeed = adjustedStat(defenderPokemon.stats.speed, defender.stages.speed ?? 0)
        const dodgeChance = calculateDodgeChance(defenderSpeed)
        const isDodged = this.random() < dodgeChance

        if (isDodged) {
          this.addLog(`${defenderPokemon.name} dodged the attack!`, defenderTeam.side)
          this.state.damageNumbers.push({
            id: nextDamageNumberId++,
            value: 'DODGE',
            x: defender.x,
            y: defender.y - 28,
            isCritical: false,
            isDodge: true,
            elapsedMs: 0,
            durationMs: 820,
          })
        } else {
          const damage = calculateDamage(move, attacker, defender, isCritical)
          defender.hp = Math.max(0, defender.hp - damage)
          const effectiveness = typeMultiplier(move, defenderPokemon)
          const call = effectiveness > 1 ? ' Super effective!' : effectiveness < 1 ? ' Resisted hit.' : ''
          const critCall = isCritical ? ' Critical strike!' : ''
          this.addLog(`${attackerPokemon.name} used ${move.name}; ${damage} damage.${call}${critCall}`, team.side)
          this.state.lastImpact = { side: defenderTeam.side, at: this.state.elapsedMs, healing: false, color: moveColor }
          this.state.damageNumbers.push({ id: nextDamageNumberId++, value: damage, x: defender.x, y: defender.y - 28, isCritical, elapsedMs: 0, durationMs: 820 })

          const knockbackScale = move.knockbackScale ?? 1
          const knockbackAngle = Math.atan2(defender.y - attacker.y, defender.x - attacker.x)
          const speed = (move.animation?.kind === 'punch' ? 120 : 320) * knockbackScale
          defender.knockback = {
            velocityX: Math.cos(knockbackAngle) * speed,
            velocityY: Math.sin(knockbackAngle) * speed,
            remainingMs: 180,
          }

          if (defender.hp <= 0) {
            const faintDuration = spriteAnimationDuration(defender, 'faint', DEFAULT_ANIMATION_DURATION_MS.faint)
            setAnimation(defender, 'faint', faintDuration)
            defender.knockback = null
            this.addLog(`${defenderPokemon.name} fainted!`, defenderTeam.side)
            this.queueDefeat(defenderTeam.side, faintDuration)
            return
          }
        }
      }

      if (move.effect) {
        applyMoveEffect(move, attacker, defender)
        const targetName = move.effect.target === 'self' ? attackerPokemon.name : defenderPokemon.name
        const direction = move.effect.stages > 0 ? 'rose' : 'fell'
        this.addLog(`${attackerPokemon.name} used ${move.name}; ${targetName}'s ${move.effect.stat} ${direction}!`, team.side)
      }
    }
  }

  private queueDefeat(side: Side, timeoutMs = 800): void {
    const team = this.state.teams[side]
    const defeated = POKEMONS[team.active.pokemonId]
    const name = defeated ? defeated.name : 'Active Pokémon'
    this.addLog(`${name} yielded the field.`, side)
    this.pendingDefeat = { side, timeoutMs }
  }

  private advanceTeam(team: TeamState): void {
    if (team.index + 1 < team.roster.length) {
      team.index += 1
      const trainer = (team.trainer ?? team.competitor) as TrainerDefinition | undefined
      team.active = createBattler(team.roster[team.index], team.side, team.index, trainer)
      const current = POKEMONS[team.active.pokemonId]
      this.addLog(`${current ? current.name : 'Next Pokémon'} entered the field.`, team.side)
      setAnimation(team.active, 'summon', DEFAULT_ANIMATION_DURATION_MS.summon)
      return
    }

    const winner: Side = team.side === 'sun' ? 'moon' : 'sun'
    this.finishBattle(winner)
  }

  private updateDamageNumbers(deltaMs: number): void {
    this.state.damageNumbers = this.state.damageNumbers
      .map((entry) => ({ ...entry, elapsedMs: entry.elapsedMs + deltaMs, y: entry.y - deltaMs * 0.038 }))
      .filter((entry) => entry.elapsedMs < entry.durationMs)
  }

  private updateAttackAnimations(deltaMs: number): void {
    this.state.attackAnimations = this.state.attackAnimations
      .map((anim) => ({ ...anim, elapsedMs: anim.elapsedMs + deltaMs }))
      .filter((anim) => anim.elapsedMs < anim.durationMs)
  }

  private updateBattlerAnimations(deltaMs: number): void {
    for (const side of ['sun', 'moon'] as const) {
      const battler = this.state.teams[side].active
      battler.animationElapsedMs += deltaMs
      if (battler.animationElapsedMs >= battler.animationDurationMs) {
        if (battler.animationState !== 'faint') {
          setAnimation(battler, 'idle')
        }
      }
    }
  }

  private updateOrbits(deltaMs: number): void {
    this.state.teams.sun.active.orbitAngle += deltaMs * ORBIT_SPEED
    this.state.teams.moon.active.orbitAngle += deltaMs * ORBIT_SPEED
  }

  private addLog(message: string, side: Side | 'system'): void {
    this.state.log.push({ time: Math.round(this.state.elapsedMs / 100) / 10, message, side })
    if (this.state.log.length > MAX_LOG_ENTRIES) this.state.log.shift()
  }

  private finishBattle(winner: Side | 'draw'): void {
    this.state.phase = 'ended'
    this.state.winner = winner
    const winnerName = winner === 'draw' ? 'Draw' : (this.state.teams[winner].competitor?.name ?? this.state.teams[winner].trainer?.name)
    this.addLog(winner === 'draw' ? 'The field called it even.' : `${winnerName} Wins!`, 'system')
  }

  private movePokemons(deltaMs: number): void {
    const sun = this.state.teams.sun.active
    const moon = this.state.teams.moon.active
    const centerX = (sun.x + moon.x) / 2
    const centerY = (sun.y + moon.y) / 2
    moveToward(sun, moon, deltaMs, centerX, centerY)
    moveToward(moon, sun, deltaMs, centerX, centerY)
    faceOpponent(sun, moon)
    faceOpponent(moon, sun)
    clampToArena(sun)
    clampToArena(moon)
    this.separate()
  }

  // Opposing creatures keep a small clearance so sprites never merge.
  private separate(): void {
    const sun = this.state.teams.sun.active
    const moon = this.state.teams.moon.active
    separateBattlers(sun, moon, POKEMONS[sun.pokemonId]?.size ?? 1, POKEMONS[moon.pokemonId]?.size ?? 1)
  }

  private createInitialState(): BattleState {
    const sunTeam = createTeam('sun', this.setup.sun, this.setup.sun.roster)
    const moonTeam = createTeam('moon', this.setup.moon, this.setup.moon.roster)
    return {
      phase: 'ready',
      elapsedMs: 0,
      introElapsedMs: 0,
      teams: { sun: sunTeam, moon: moonTeam },
      winner: null,
      log: [],
      lastImpact: null,
      attackAnimations: [],
      damageNumbers: [],
    }
  }
}

function createTeam(side: Side, trainer: TrainerDefinition, roster: string[]): TeamState {
  if (roster.length === 0) throw new Error(`${trainer.name} must have at least one Pokémon`)
  return {
    side,
    name: trainer.name,
    trainer,
    competitor: trainer,
    roster,
    index: 0,
    active: createBattler(roster[0], side, 0, trainer),
  }
}

function createBattler(pokemonId: string, side: Side, rosterIndex: number, trainer?: TrainerDefinition): Battler {
  const pokemon = POKEMONS[pokemonId] || POKEMONS['charizard'] || Object.values(POKEMONS)[0]
  const isShiny = pokemon.isShiny ?? Pokemon.rollShiny()
  const customMoves = trainer?.customMoves?.[pokemonId]
  const moves = customMoves && Array.isArray(customMoves) && customMoves.length === 4
    ? ([...customMoves] as [string, string, string, string])
    : undefined
  return {
    pokemonId: pokemon.id,
    creatureId: pokemon.id,
    hp: pokemon.stats.hp,
    x: side === 'sun' ? 370 : 630,
    y: ARENA.centerY + ((rosterIndex % 3) - 1) * 45 + (side === 'moon' ? 24 : 0),
    orbitAngle: side === 'sun' ? Math.PI : 0,
    direction: side === 'sun' ? 'right' : 'left',
    facingAngle: side === 'sun' ? 0 : Math.PI,
    knockback: null,
    animationState: 'idle',
    animationElapsedMs: 0,
    animationDurationMs: Number.POSITIVE_INFINITY,
    stages: {},
    isShiny,
    moves,
  }
}

function moveToward(pokemon: Battler, opponent: Battler, deltaMs: number, centerX: number, centerY: number): void {
  if (pokemon.animationState === 'faint') return
  if (pokemon.knockback && pokemon.knockback.remainingMs > 0) {
    const knockbackTime = Math.min(deltaMs, pokemon.knockback.remainingMs)
    pokemon.x = clamp(pokemon.x + (pokemon.knockback.velocityX * knockbackTime) / 1000, ARENA.minX, ARENA.maxX)
    pokemon.y = clamp(pokemon.y + (pokemon.knockback.velocityY * knockbackTime) / 1000, ARENA.minY, ARENA.maxY)
    pokemon.knockback.remainingMs -= knockbackTime
    if (pokemon.knockback.remainingMs <= 0) pokemon.knockback = null
    return
  }

  const dx = opponent.x - pokemon.x
  const dy = opponent.y - pokemon.y
  const distance = Math.hypot(dx, dy)
  const preferredRange = engagementRange(pokemon)

  if (distance > preferredRange) {
    moveTo(pokemon, opponent.x, opponent.y, deltaMs)
    if (pokemon.animationState === 'idle') setAnimation(pokemon, 'walk')
    return
  }

  const orbitRadius = Math.min(ORBIT_RADIUS, preferredRange * 0.45)
  const targetX = centerX + Math.cos(pokemon.orbitAngle) * orbitRadius
  const targetOrbitY = clamp(centerY + Math.sin(pokemon.orbitAngle) * orbitRadius, ARENA.minY, ARENA.maxY)
  moveTo(pokemon, targetX, targetOrbitY, deltaMs)
  if (pokemon.animationState === 'walk') setAnimation(pokemon, 'idle')
}

function moveTo(pokemon: Battler, targetX: number, targetY: number, deltaMs: number): void {
  const dx = targetX - pokemon.x
  const dy = targetY - pokemon.y
  const length = Math.hypot(dx, dy)
  if (length < 0.1) return

  if (Math.abs(dx) > 0.5) pokemon.direction = dx < 0 ? 'left' : 'right'
  const definition = POKEMONS[pokemon.pokemonId] || Object.values(POKEMONS)[0]
  const speed = definition.stats.speed * 0.82 + 28
  const distanceToMove = Math.min(length, ((speed * (1 + (pokemon.stages.speed ?? 0) * 0.15) * deltaMs) / 1000))
  pokemon.x = clamp(pokemon.x + (dx / length) * distanceToMove, ARENA.minX, ARENA.maxX)
  pokemon.y = clamp(pokemon.y + (dy / length) * distanceToMove, ARENA.minY, ARENA.maxY)
}

// Each battler aims at its opponent, so the pair always shows complementary angles
// (one displays the front, the other the back). The renderer picks the matching sprite row.
function faceOpponent(pokemon: Battler, opponent: Battler): void {
  if (pokemon.animationState === 'faint') return
  const dx = opponent.x - pokemon.x
  const dy = opponent.y - pokemon.y
  if (Math.hypot(dx, dy) < 0.5) return
  pokemon.facingAngle = Math.atan2(dy, dx)
  if (Math.abs(dx) > 0.5) pokemon.direction = dx < 0 ? 'left' : 'right'
}

function setAnimation(battler: Battler, state: PokemonAnimationState, durationMs = Number.POSITIVE_INFINITY): void {
  if (battler.animationState === state) return
  battler.animationState = state
  battler.animationElapsedMs = 0
  battler.animationDurationMs = durationMs
}

function spriteAnimationDuration(battler: Battler, state: PokemonAnimationState, fallbackMs: number): number {
  const pokemon = POKEMONS[battler.pokemonId]
  if (!pokemon) return fallbackMs
  const config = getPokemonAssetConfig(pokemon.name)
  if (config) {
    if (state === 'attack') return getPokemonTotalAnimDurationMs(config.attack.durations)
    if (state === 'faint') return getPokemonTotalAnimDurationMs(config.faint.durations)
    if (state === 'walk') return getPokemonTotalAnimDurationMs(config.walk.durations)
  }
  if (pokemon.sprite) {
    return getSpriteAnimationDurationMs(pokemon.sprite, state, battler.direction, fallbackMs)
  }
  return fallbackMs
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value))
}
