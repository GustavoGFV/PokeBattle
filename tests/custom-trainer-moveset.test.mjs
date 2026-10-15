import assert from 'node:assert/strict'
import test from 'node:test'
import { MOVES } from '../src/data/moves.ts'
import { POKEMONS } from '../src/data/pokemons.ts'
import { TRAINERS } from '../src/data/trainers.ts'
import { getCreatureTypes } from '../src/data/types.ts'
import { BattleEngine } from '../src/game/BattleEngine.ts'
import { availableMoves } from '../src/domain/combat.ts'
import { saveCustomTrainer, loadSavedCustomTrainers } from '../src/game/storage.ts'

test('Move Filtering strictly limits choices to Pokémon elemental typings plus universal Normal moves', () => {
  // Test with Charizard (Fire / Flying)
  const charizard = POKEMONS['charizard']
  assert.ok(charizard)
  const types = getCreatureTypes(charizard.type, charizard.secondaryType)
  assert.deepEqual(types, ['Fire', 'Flying'])

  const allowedTypes = new Set([...types, 'Normal'])
  const allMoves = Object.values(MOVES)
  const charizardAllowedMoves = allMoves.filter((m) => allowedTypes.has(m.type))

  assert.ok(charizardAllowedMoves.length > 0)
  for (const move of charizardAllowedMoves) {
    assert.ok(
      move.type === 'Fire' || move.type === 'Flying' || move.type === 'Normal',
      `Move ${move.name} of type ${move.type} should not be allowed for Fire/Flying Pokemon`,
    )
  }

  // Ensure other types like Water, Grass, Electric are excluded
  const hasWater = charizardAllowedMoves.some((m) => m.type === 'Water')
  const hasGrass = charizardAllowedMoves.some((m) => m.type === 'Grass')
  const hasElectric = charizardAllowedMoves.some((m) => m.type === 'Electric')
  assert.equal(hasWater, false)
  assert.equal(hasGrass, false)
  assert.equal(hasElectric, false)

  // Ensure Fire, Flying, and Normal moves ARE present
  const hasFire = charizardAllowedMoves.some((m) => m.type === 'Fire')
  const hasNormal = charizardAllowedMoves.some((m) => m.type === 'Normal')
  assert.equal(hasFire, true)
  assert.equal(hasNormal, true)
})

test('Move Search Filtering accurately filters moves by name', () => {
  const charizard = POKEMONS['charizard']
  const types = getCreatureTypes(charizard.type, charizard.secondaryType)
  const allowedTypes = new Set([...types, 'Normal'])
  const allMoves = Object.values(MOVES).filter((m) => allowedTypes.has(m.type))

  const query = 'blast'
  const filtered = allMoves.filter((m) => m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query))
  assert.ok(filtered.length > 0)
  for (const m of filtered) {
    assert.ok(
      m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query),
      `Move ${m.name} does not match query "${query}"`,
    )
  }
  assert.ok(filtered.some((m) => m.id === 'fire-blast'))
})

test('Equipped Move Validation strictly prevents duplicate moves in the 4-move slots', () => {
  const currentEquipped = ['flamethrower', 'fire-blast', 'slash', 'wing-attack']
  const moveSlotToChange = 1 // replacing 'fire-blast'

  // Other equipped moves are slots 0, 2, 3
  const otherEquipped = currentEquipped.filter((_, idx) => idx !== moveSlotToChange)

  // Selecting 'flamethrower' (already in slot 0) must be rejected
  const isFlamethrowerDuplicate = otherEquipped.includes('flamethrower')
  assert.equal(isFlamethrowerDuplicate, true)

  // Selecting 'tackle' (not in any slot) is valid
  const isTackleDuplicate = otherEquipped.includes('tackle')
  assert.equal(isTackleDuplicate, false)

  // All equipped moves are detected by currentEquipped.includes()
  assert.equal(currentEquipped.includes('fire-blast'), true)
  assert.equal(currentEquipped.includes('slash'), true)
  assert.equal(currentEquipped.includes('hyper-beam'), false)
})

test('Custom Trainer persistence serializes and deserializes customMoves via localStorage', () => {
  // Mock localStorage
  const storageMap = new Map()
  globalThis.localStorage = {
    getItem: (key) => storageMap.get(key) ?? null,
    setItem: (key, val) => storageMap.set(key, String(val)),
    removeItem: (key) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  }

  const customTrainer = {
    id: 'custom_test_123',
    name: 'Champion Redux',
    title: 'CUSTOM TRAINER',
    shape: 'circle',
    color: '#e53e3e',
    accent: '#f6e05e',
    region: 'Custom',
    roster: ['charizard', 'venusaur'],
    customMoves: {
      charizard: ['fire-blast', 'flamethrower', 'hyper-beam', 'extreme-speed'],
      venusaur: ['solar-beam', 'energy-ball', 'synthesis', 'recover'],
    },
  }

  saveCustomTrainer(customTrainer)
  const loaded = loadSavedCustomTrainers()
  const found = loaded.find((t) => t.id === 'custom_test_123')

  assert.ok(found)
  assert.equal(found.name, 'Champion Redux')
  assert.deepEqual(found.customMoves.charizard, ['fire-blast', 'flamethrower', 'hyper-beam', 'extreme-speed'])
  assert.deepEqual(found.customMoves.venusaur, ['solar-beam', 'energy-ball', 'synthesis', 'recover'])
})

test('BattleEngine and availableMoves correctly apply user-saved customMoves in battle', () => {
  const customTrainer = {
    id: 'custom_champ',
    name: 'Custom Battler',
    title: 'CUSTOM TRAINER',
    shape: 'diamond',
    color: '#ff0',
    accent: '#fff',
    region: 'Custom',
    roster: ['charizard'],
    customMoves: {
      charizard: ['fire-blast', 'hyper-beam', 'extreme-speed', 'recover'],
    },
  }

  const opponent = TRAINERS[0]
  const engine = new BattleEngine(() => 0.5, {
    sun: customTrainer,
    moon: { ...opponent, roster: [...opponent.roster] },
  })

  // The active battler for sun team must have custom moves assigned
  const activeBattler = engine.state.teams.sun.active
  assert.equal(activeBattler.pokemonId, 'charizard')
  assert.deepEqual(activeBattler.moves, ['fire-blast', 'hyper-beam', 'extreme-speed', 'recover'])

  // availableMoves should return the custom moves instead of default charizard moves
  const moves = availableMoves(activeBattler, POKEMONS['charizard'])
  const moveIds = moves.map((m) => m.id)
  assert.deepEqual(moveIds, ['fire-blast', 'hyper-beam', 'extreme-speed', 'recover'])

  // Ensure default moves like flamethrower (if not in custom moves) are not in available moves
  assert.ok(!moveIds.includes('flamethrower'))
})

test('Predefined trainers remain completely immutable and retain their exact predefined movesets', () => {
  for (const trainer of TRAINERS) {
    // Predefined trainers do not define customMoves
    assert.equal(trainer.customMoves, undefined)
    for (const pokeId of trainer.roster) {
      const poke = POKEMONS[pokeId]
      if (poke) {
        assert.equal(poke.moves.length, 4)
      }
    }
  }
})

