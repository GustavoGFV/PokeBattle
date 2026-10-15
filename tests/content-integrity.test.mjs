import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { CREATURES } from '../src/data/pokemons.ts'
import { MOVES } from '../src/data/moves.ts'
import { ELEMENT_TYPES, getCreatureTypes, TYPE_CHART } from '../src/data/types.ts'
import { validateAttackSpriteDefinition } from '../src/domain/sprites.ts'
import { TRAINERS } from '../src/data/trainers.ts'

const competitors = TRAINERS

test('creatures reference valid types, stats, and four unique moves', () => {
  for (const [id, creature] of Object.entries(CREATURES)) {
    assert.equal(creature.id, id)
    assert.ok(Number.isFinite(creature.size) && creature.size > 0, `${id} must have a positive display size`)
    assert.ok(getCreatureTypes(creature.type, creature.secondaryType).length <= 2)
    assert.ok(ELEMENT_TYPES.includes(creature.type))
    if (creature.secondaryType) assert.ok(ELEMENT_TYPES.includes(creature.secondaryType))
    assert.ok(Number.isFinite(creature.size) && creature.size > 0, `${id} must have a positive display size`)
    assert.deepEqual(Object.values(creature.stats).filter((stat) => Number.isFinite(stat) && stat > 0), Object.values(creature.stats))
    assert.equal(new Set(creature.moves).size, 4)

    for (const moveId of creature.moves) assert.ok(MOVES[moveId], `${id} references missing move ${moveId}`)
  }
})

test('moves reference valid types and define usable limits and ranges', () => {
  for (const [id, move] of Object.entries(MOVES)) {
    assert.equal(move.id, id)
    assert.ok(ELEMENT_TYPES.includes(move.type), `${id} has an unknown type`)
    assert.ok(Number.isInteger(move.uses) && move.uses > 0, `${id} must have positive integer uses`)
    if (move.power !== undefined) {
      assert.ok(move.power > 0, `${id} must have positive power`)
      assert.ok(Number.isFinite(move.range) && move.range > 0, `${id} must have a positive range`)
    }
    if (move.knockbackScale !== undefined) assert.ok(move.knockbackScale >= 0, `${id} has negative knockback`)
    if (move.animation?.sprite) assert.deepEqual(validateAttackSpriteDefinition(move.animation.sprite), [], id)
    if (move.animation?.sprite) assert.deepEqual(validateAttackSpriteDefinition(move.animation.sprite), [], id)
  }
})

test('type chart covers every type and competitor rosters resolve to six creatures', () => {
  assert.deepEqual(Object.keys(TYPE_CHART).sort(), [...ELEMENT_TYPES].sort())
  assert.equal(new Set(competitors.map((competitor) => competitor.id)).size, competitors.length)

  for (const competitor of competitors) {
    assert.equal(competitor.roster.length, 6, `${competitor.name} must have six roster slots`)
    for (const creatureId of competitor.roster) {
      assert.ok(CREATURES[creatureId], `${competitor.name} references missing creature ${creatureId}`)
    }
  }
})
