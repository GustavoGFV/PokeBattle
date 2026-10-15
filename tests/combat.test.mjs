import assert from 'node:assert/strict'
import test from 'node:test'
import { CREATURES } from '../src/data/pokemons.ts'
import './fixtures/fakemon.mjs'
import { MOVES } from '../src/data/moves.ts'
import { ELEMENT_TYPES, getTypeColor, getTypeMultiplier, TYPE_CHART, TYPE_COLORS } from '../src/data/types.ts'
import { availableMoves, calculateDamage, calculateDodgeChance, chooseMove, engagementRange } from '../src/domain/combat.ts'

function battler(creatureId, hp = CREATURES[creatureId].stats.hp) {
  const creature = CREATURES[creatureId]
  return {
    creatureId,
    hp,
    x: 0,
    y: 0,
    stages: {},
    uses: Object.fromEntries(creature.moves.map((id) => [id, 10])),
  }
}

test('type chart supports multiple strong matchups and configured weakness damage', () => {
  assert.equal(ELEMENT_TYPES.length, 18)
  assert.equal(Object.keys(TYPE_CHART).length, 18)
  assert.deepEqual(TYPE_CHART.Flying.immuneTo, ['Ground'])
  assert.ok(TYPE_CHART.Ghost.immuneTo.includes('Normal'))
  assert.ok(TYPE_CHART.Ghost.immuneTo.includes('Fighting'))
  assert.ok(TYPE_CHART.Water.weakTo.includes('Electric'))
  assert.ok(TYPE_CHART.Water.resists.includes('Fire'))
  assert.equal(getTypeMultiplier('Grass', 'Water'), 2)
  assert.equal(getTypeMultiplier('Fire', ['Grass', 'Poison']), 2)
  assert.equal(getTypeMultiplier('Rock', ['Fire', 'Flying']), 4)
  assert.equal(getTypeMultiplier('Ice', ['Water', 'Flying']), 1)
  assert.equal(getTypeMultiplier('Grass', ['Bug', 'Steel']), 0.25)
  assert.equal(getTypeMultiplier('Fighting', ['Dark', 'Ghost']), 0)
  assert.equal(getTypeMultiplier('Fighting', 'Ghost'), 0)
  assert.equal(getTypeMultiplier('Normal', 'Ghost'), 0)
  assert.equal(CREATURES.venusaur.secondaryType, 'Poison')
  assert.equal(CREATURES.charizard.secondaryType, 'Flying')
  for (const creature of Object.values(CREATURES)) {
    assert.ok(!creature.secondaryType || creature.secondaryType !== creature.type)
  }
})

test('type colors bind attacks to their element (fire is red, grass is green, etc.)', () => {
  assert.equal(getTypeColor('Fire'), '#ef4444')
  assert.equal(getTypeColor('Grass'), '#48bb78')
  assert.equal(getTypeColor('Water'), '#3b82f6')
  assert.equal(getTypeColor('Electric'), '#facc15')
  for (const type of ELEMENT_TYPES) {
    assert.ok(TYPE_COLORS[type], `missing color for type ${type}`)
    assert.equal(getTypeColor(type), TYPE_COLORS[type])
  }
})

test('low-health creatures prioritize an available heal', () => {
  const user = battler('bramblet', 35)
  const selected = chooseMove(user, battler('cinderkit'), () => 0.5)
  assert.equal(selected?.id, 'spore-mend')
})

test('move uses are finite and exhausted moves cannot be selected', () => {
  const user = battler('cinderkit')
  user.uses['flare-rush'] = 0
  user.uses['ember-bolt'] = 0
  user.uses['warm-up'] = 0
  const remaining = availableMoves(user, CREATURES.cinderkit)
  assert.deepEqual(remaining.map((move) => move.id), ['cinder-rest'])
  assert.equal(chooseMove(user, battler('bramblet')), undefined)
})

test('type advantage increases damage while defense reduces it', () => {
  const attacker = battler('cinderkit')
  const defender = battler('bramblet')
  const move = MOVES['ember-bolt']
  const normalDamage = calculateDamage(move, attacker, defender)
  defender.stages.specialDefense = 2
  const guardedDamage = calculateDamage(move, attacker, defender)
  assert.ok(normalDamage > 0)
  assert.ok(guardedDamage < normalDamage)
})

test('immunity deals zero damage and the AI avoids immune moves', () => {
  const attacker = battler('flintbit')
  const defender = battler('fawndle')
  assert.equal(calculateDamage(MOVES['fault-line'], attacker, defender), 0)
  assert.notEqual(chooseMove(attacker, defender, () => 0.5, 100)?.id, 'fault-line')
})

test('attacks cannot be selected before their declared range', () => {
  const user = battler('cinderkit')
  const selected = chooseMove(user, battler('bramblet'), () => 0.5, 500)
  assert.equal(selected?.power, undefined)
  assert.equal(selected?.movement, undefined)
})

test('Fighter moves are short-range punches with reduced knockback', () => {
  const boxer = battler('brawlkin')
  boxer.uses['fighter-guard'] = 0
  const punch = chooseMove(boxer, battler('cinderkit'), () => 0.5, 90)

  assert.equal(CREATURES.brawlkin.type, 'Fighting')
  assert.equal(engagementRange(boxer), 100)
  assert.equal(punch?.animation?.kind, 'punch')
  assert.ok((punch?.range ?? Infinity) <= 100)
  assert.ok((punch?.knockbackScale ?? 1) < 0.35)
  assert.ok(getTypeMultiplier('Fighting', 'Rock') > 1)
  assert.ok(getTypeMultiplier('Flying', 'Fighting') > 1)
})

test('dodge chance is dynamically calculated from Pokemon Speed stat', () => {
  // Dodge Chance = 25% * (Pokemon Speed / 100)
  assert.equal(calculateDodgeChance(130), 0.325)
  assert.equal(calculateDodgeChance(100), 0.25)
  assert.equal(calculateDodgeChance(30), 0.075)
  assert.equal(calculateDodgeChance(0), 0)
})

test('shiny pokemon mechanic initializes with boolean status and calculates 1/15 chance', async () => {
  const { Pokemon } = await import('../src/domain/models.ts')
  const { rollShiny, POKEMONS } = await import('../src/data/pokemons.ts')
  const { getPokemonSpritePath } = await import('../src/domain/assets.ts')

  // Roll shiny method calculates chance
  assert.equal(typeof rollShiny(), 'boolean')
  assert.equal(Pokemon.rollShiny(1), true)
  assert.equal(Pokemon.rollShiny(0), false)

  // Pokemon instances have isShiny boolean property
  const sample = Object.values(POKEMONS)[0]
  assert.equal(typeof sample.isShiny, 'boolean')

  // Creating a Pokemon with explicit shiny status
  const shinyMon = new Pokemon(sample, true)
  assert.equal(shinyMon.isShiny, true)

  const normalMon = new Pokemon(sample, false)
  assert.equal(normalMon.isShiny, false)

  // Sprite path appends _shiny suffix to nomenclature
  const shinyWalk = getPokemonSpritePath('Charizard', 'Walk', true)
  assert.ok(shinyWalk.includes('_shiny'), `Expected _shiny in sprite path: ${shinyWalk}`)
  assert.ok(shinyWalk.endsWith('Walk-Anim_shiny.png') || shinyWalk.includes('Charizard_shiny'))

  const regularWalk = getPokemonSpritePath('Charizard', 'Walk', false)
  assert.ok(!regularWalk.includes('_shiny'), `Did not expect _shiny in regular sprite path: ${regularWalk}`)
})