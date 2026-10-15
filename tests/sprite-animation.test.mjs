import assert from 'node:assert/strict'
import test from 'node:test'
import { CREATURES } from '../src/data/pokemons.ts'
import { resolveSpriteFrame, validateAttackSpriteDefinition, validateSpriteDefinition } from '../src/domain/sprites.ts'

const frame = (pixel) => ({ rows: [pixel], body: '#ffffff', accent: '#000000' })

test('all registered creature sprites pass animation data validation', () => {
  for (const creature of Object.values(CREATURES)) {
    assert.deepEqual(validateSpriteDefinition(creature.sprite), [], creature.name)
  }
})

test('directional frames take precedence and missing directions fall back safely', () => {
  const base = frame('1')
  const idle = frame('2')
  const leftAttack = frame('3')
  const sprite = {
    ...base,
    animations: { attack: { frames: [idle], frameDurationMs: 100 } },
    directionalAnimations: { left: { attack: { frames: [leftAttack], frameDurationMs: 100 } } },
  }

  assert.equal(resolveSpriteFrame(sprite, 'attack', 0, 'left').rows[0], '3')
  assert.equal(resolveSpriteFrame(sprite, 'attack', 0, 'right').rows[0], '2')
  assert.equal(resolveSpriteFrame(sprite, 'hurt', 0, 'right').rows[0], '1')
})

test('invalid sprite animation timings and pixel grids are reported', () => {
  const sprite = {
    ...frame('1'),
    animations: { idle: { frames: [frame('X')], frameDurationMs: 0 } },
  }

  const issues = validateSpriteDefinition(sprite)
  assert.ok(issues.some((issue) => issue.includes('positive frame duration')))
  assert.ok(issues.some((issue) => issue.includes('may only use ., 1, 2, 3, or E pixels')))
})

test('one-shot animations hold their final frame and idle animations loop', () => {
  const first = frame('1')
  const second = frame('2')
  const sprite = {
    ...first,
    animations: {
      attack: { frames: [first, second], frameDurationMs: 100, loop: false },
      idle: { frames: [first, second], frameDurationMs: 100 },
    },
  }

  assert.equal(resolveSpriteFrame(sprite, 'attack', 500, 'right').rows[0], '2')
  assert.equal(resolveSpriteFrame(sprite, 'idle', 200, 'right').rows[0], '1')
})

test('sprite validation rejects ragged frames and malformed animation objects without throwing', () => {
  const sprite = {
    rows: ['11', '1'],
    body: '#ffffff',
    accent: '#000000',
    animations: { attack: { frames: null, frameDurationMs: 100 } },
  }

  const issues = validateSpriteDefinition(sprite)
  assert.ok(issues.some((issue) => issue.includes('same width')))
  assert.ok(issues.some((issue) => issue.includes('at least one frame')))
})

test('attack sprite sheets require a local path and valid frame metadata', () => {
  assert.deepEqual(validateAttackSpriteDefinition({ src: '/sprites/attacks/fire.png', frameWidth: 32, frameHeight: 32, frameCount: 6, framesPerSecond: 12 }), [])
  const issues = validateAttackSpriteDefinition({ src: 'https://example.test/fire.png', frameWidth: 0, frameHeight: 32, frameCount: 0, framesPerSecond: 0 })
  assert.ok(issues.some((issue) => issue.includes('local absolute path')))
  assert.ok(issues.some((issue) => issue.includes('frameCount must be a positive integer')))
})

test('parsePokemonAnimXml extracts frame dimensions and durations strictly typed as numbers with CopyOf support', async () => {
  const { parsePokemonAnimXml } = await import('../src/domain/assets.ts')

  const sampleXml = `<?xml version="1.0" ?>
<AnimData>
  <ShadowSize>2</ShadowSize>
  <Anims>
    <Anim>
      <Name>Walk</Name>
      <FrameWidth>40</FrameWidth>
      <FrameHeight>48</FrameHeight>
      <Durations>
        <Duration>8</Duration>
        <Duration>10</Duration>
      </Durations>
    </Anim>
    <Anim>
      <Name>Attack</Name>
      <CopyOf>Strike</CopyOf>
    </Anim>
    <Anim>
      <Name>Strike</Name>
      <FrameWidth>80</FrameWidth>
      <FrameHeight>88</FrameHeight>
      <Durations>
        <Duration>2</Duration>
        <Duration>4</Duration>
      </Durations>
    </Anim>
  </Anims>
</AnimData>`

  const config = parsePokemonAnimXml(sampleXml)
  assert.equal(typeof config.walk.frameWidth, 'number')
  assert.equal(typeof config.walk.frameHeight, 'number')
  assert.equal(config.walk.frameWidth, 40)
  assert.equal(config.walk.frameHeight, 48)
  assert.deepEqual(config.walk.durations, [8, 10])

  // CopyOf Strike resolved to 80x88
  assert.equal(config.attack.frameWidth, 80)
  assert.equal(config.attack.frameHeight, 88)
  assert.deepEqual(config.attack.durations, [2, 4])
})

test('getPokemonAssetConfig loads real Pokémon frame dimensions dynamically from disk/glob', async () => {
  const { getPokemonAssetConfig } = await import('../src/domain/assets.ts')

  const charizard = getPokemonAssetConfig('Charizard')
  assert.equal(charizard.walk.frameWidth, 40)
  assert.equal(charizard.walk.frameHeight, 48)
  assert.equal(charizard.attack.frameWidth, 80)
  assert.equal(charizard.attack.frameHeight, 88)

  const blastoise = getPokemonAssetConfig('Blastoise')
  assert.equal(blastoise.walk.frameWidth, 32)
  assert.equal(blastoise.walk.frameHeight, 40)
  assert.equal(blastoise.attack.frameWidth, 64)
  assert.equal(blastoise.attack.frameHeight, 72)
})