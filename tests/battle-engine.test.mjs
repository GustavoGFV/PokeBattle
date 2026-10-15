import assert from 'node:assert/strict'
import test from 'node:test'
import { MOVES } from '../src/data/moves.ts'
import { BattleEngine } from '../src/game/BattleEngine.ts'
import { ARENA, CHALLENGER_MARKS } from '../src/game/arena.ts'
import './fixtures/fakemon.mjs'

import { getTypeColor, TYPE_COLORS } from '../src/data/types.ts'

test('challengers enter from opposite borders and meet at the arena midpoint', () => {
  assert.ok(CHALLENGER_MARKS.sun.markX < ARENA.width * 0.1)
  assert.ok(CHALLENGER_MARKS.moon.markX > ARENA.width * 0.9)
  assert.equal(CHALLENGER_MARKS.sun.markY, ARENA.centerY)
  assert.equal(CHALLENGER_MARKS.moon.markY, ARENA.centerY)
})

test('battle setup uses the selected competitor and custom roster', () => {
  const setup = {
    sun: { id: 'custom', name: 'Custom Challenger', title: 'YOUR FIELD CLUB', shape: 'diamond', color: '#ffd36c', accent: '#c7f36b', roster: ['charizard'] },
    moon: { id: 'mira', name: 'Mira Vale', title: 'SUN RUNNER', shape: 'triangle', color: '#ff765f', accent: '#ffd36c', roster: ['venusaur', 'blastoise'] },
  }
  const engine = new BattleEngine(() => 0.5, setup)

  assert.equal(engine.state.teams.sun.competitor.id, 'custom')
  assert.deepEqual(engine.state.teams.sun.roster, ['charizard'])
  assert.equal(engine.state.teams.sun.active.creatureId, 'charizard')
  assert.equal(engine.state.teams.moon.name, 'Mira Vale')
})

test('a complete bout replaces defeated creatures and declares a winner', () => {
  const engine = new BattleEngine(() => 0.5)
  engine.start()
  assert.equal(engine.state.phase, 'entrance')

  for (let frame = 0; frame < 1200 && engine.state.phase !== 'ended'; frame += 1) {
    engine.update(160)
  }

  assert.ok(engine.state.introElapsedMs >= 2400)
  assert.equal(engine.state.phase, 'ended')
  assert.ok(engine.state.winner)
  assert.ok(engine.state.teams.sun.index > 0 || engine.state.teams.moon.index > 0)
  assert.ok(engine.state.log.some((entry) => entry.message.includes('entered the field')))
  const winner = engine.state.teams[engine.state.winner]
  assert.equal(engine.state.log.at(-1).message, `${winner.competitor.name} Wins!`)
})

test('a dash attack queues an effect and applies knockback', () => {
  const engine = new BattleEngine(() => 0.5)
  engine.start()
  engine.skipEntrance()

  for (let frame = 0; frame < 12 && engine.state.attackAnimations.length === 0; frame += 1) {
    engine.update(160)
  }

  assert.ok(engine.state.attackAnimations.some((animation) => animation.kind === 'dash'))
  assert.ok(engine.state.teams.sun.active.knockback || engine.state.teams.moon.active.knockback)
})

test('fighter punches show the fist effect and keep knockback close', () => {
  const competitor = { id: 'fighter', name: 'Fighter', title: 'CLOSE COMBAT', shape: 'square', color: '#f2a17e', accent: '#f5df98', roster: ['brawlkin'] }
  const engine = new BattleEngine(() => 0.5, { sun: competitor, moon: { ...competitor, id: 'sparring-partner', name: 'Sparring Partner' } })
  engine.start()
  engine.skipEntrance()
  engine.state.teams.sun.active.x = 460
  engine.state.teams.sun.active.y = ARENA.centerY
  engine.state.teams.moon.active.x = 540
  engine.state.teams.moon.active.y = ARENA.centerY

  for (let frame = 0; frame < 6; frame += 1) engine.update(160)

  assert.ok(engine.state.attackAnimations.some((animation) => animation.kind === 'punch'))
  for (const side of ['sun', 'moon']) {
    const knockback = engine.state.teams[side].active.knockback
    assert.ok(knockback)
    assert.ok(Math.hypot(knockback.velocityX, knockback.velocityY) < 150)
  }
})

test('creatures orbit while keeping their sprites on a fixed rotation', () => {
  const engine = new BattleEngine(() => 0.5)
  engine.start()
  engine.skipEntrance()
  const initialSun = { x: engine.state.teams.sun.active.x, y: engine.state.teams.sun.active.y }
  const initialMoon = { x: engine.state.teams.moon.active.x, y: engine.state.teams.moon.active.y }
  const initialSunAngle = engine.state.teams.sun.active.orbitAngle
  const initialMoonAngle = engine.state.teams.moon.active.orbitAngle

  for (let frame = 0; frame < 4; frame += 1) engine.update(160)

  assert.notEqual(engine.state.teams.sun.active.orbitAngle, initialSunAngle)
  assert.notEqual(engine.state.teams.moon.active.orbitAngle, initialMoonAngle)
  assert.notDeepEqual({ x: engine.state.teams.sun.active.x, y: engine.state.teams.sun.active.y }, initialSun)
  assert.notDeepEqual({ x: engine.state.teams.moon.active.x, y: engine.state.teams.moon.active.y }, initialMoon)
  assert.ok(['up', 'down', 'left', 'right'].includes(engine.state.teams.sun.active.direction))
  assert.ok(['up', 'down', 'left', 'right'].includes(engine.state.teams.moon.active.direction))
  assert.equal('rotation' in engine.state.teams.sun.active, false)
})

test('move sprite-sheet metadata reaches the queued attack animation', () => {
  const move = MOVES['iron-fist']
  const originalAnimation = move.animation
  const sprite = { src: '/sprites/attacks/iron-fist.png', frameWidth: 32, frameHeight: 32, frameCount: 6, framesPerSecond: 12 }
  move.animation = { ...originalAnimation, sprite }

  try {
    const competitor = { id: 'fighter', name: 'Fighter', title: 'CLOSE COMBAT', shape: 'square', color: '#f2a17e', accent: '#f5df98', roster: ['brawlkin'] }
    const engine = new BattleEngine(() => 0.5, { sun: competitor, moon: { ...competitor, id: 'partner', name: 'Partner' } })
    engine.start()
    engine.skipEntrance()
    engine.state.teams.sun.active.x = 460
    engine.state.teams.sun.active.y = ARENA.centerY
    engine.state.teams.moon.active.x = 540
    engine.state.teams.moon.active.y = ARENA.centerY
    for (let frame = 0; frame < 6; frame += 1) engine.update(160)

    const attack = engine.state.attackAnimations.find((animation) => animation.kind === 'punch')
    assert.deepEqual(attack?.sprite, sprite)
    assert.equal(attack?.durationMs, 500)
  } finally {
    move.animation = originalAnimation
  }
})

test('attack animation colors are vinculated to their typing', () => {
  const engine = new BattleEngine(() => 0.5)
  engine.start()
  engine.skipEntrance()

  for (let frame = 0; frame < 30 && engine.state.attackAnimations.length === 0; frame += 1) {
    engine.update(160)
  }

  assert.ok(engine.state.attackAnimations.length > 0)
  for (const anim of engine.state.attackAnimations) {
    assert.ok(Object.values(TYPE_COLORS).includes(anim.color), `expected ${anim.color} to be a valid type color`)
  }
})