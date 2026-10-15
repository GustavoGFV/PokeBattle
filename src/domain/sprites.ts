import type { CreatureAnimationState, PixelSprite, SpriteAnimation, SpriteDirection, SpriteFrame } from './models.ts'

const ANIMATION_STATES: readonly CreatureAnimationState[] = ['idle', 'walk', 'attack', 'hurt', 'summon']
const DIRECTIONS: readonly SpriteDirection[] = ['up', 'down', 'left', 'right']
const PIXEL_ROW_PATTERN = /^[.123E]+$/
const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i

export function getSpriteAnimation(
  sprite: PixelSprite,
  state: CreatureAnimationState,
  direction: SpriteDirection,
): SpriteAnimation | undefined {
  return sprite.directionalAnimations?.[direction]?.[state] ?? sprite.animations?.[state]
}

export function getSpriteAnimationDurationMs(
  sprite: PixelSprite,
  state: CreatureAnimationState,
  direction: SpriteDirection,
  fallbackMs: number,
): number {
  const animation = getSpriteAnimation(sprite, state, direction)
  return animation ? animation.frames.length * animation.frameDurationMs : fallbackMs
}

export function resolveSpriteFrame(
  sprite: PixelSprite,
  state: CreatureAnimationState,
  elapsedMs: number,
  direction: SpriteDirection,
): SpriteFrame {
  const animation = getSpriteAnimation(sprite, state, direction)
  if (!animation?.frames.length || animation.frameDurationMs <= 0) return sprite

  const frameIndex = Math.floor(Math.max(0, elapsedMs) / animation.frameDurationMs)
  const loops = animation.loop ?? (state === 'idle' || state === 'walk')
  const index = loops ? frameIndex % animation.frames.length : Math.min(frameIndex, animation.frames.length - 1)
  return animation.frames[index] ?? sprite
}

export function validateSpriteDefinition(sprite: unknown): string[] {
  if (sprite === undefined || sprite === null) return []
  if (!isRecord(sprite)) return ['sprite must be an object']

  const issues: string[] = []
  validateFrame(sprite, 'base', issues)
  validateAnimationCollection(sprite.animations, 'animations', ANIMATION_STATES, issues)

  if (sprite.directionalAnimations !== undefined && !isRecord(sprite.directionalAnimations)) {
    issues.push('directionalAnimations must be an object')
  } else if (isRecord(sprite.directionalAnimations)) {
    for (const [direction, animations] of Object.entries(sprite.directionalAnimations)) {
      if (!DIRECTIONS.includes(direction as SpriteDirection)) {
        issues.push(`directionalAnimations.${direction} is not a supported direction`)
      }
      validateAnimationCollection(animations, `directionalAnimations.${direction}`, ANIMATION_STATES, issues)
    }
  }

  return issues
}

function validateAnimationCollection(
  value: unknown,
  name: string,
  allowedStates: readonly string[],
  issues: string[],
): void {
  if (value === undefined) return
  if (!isRecord(value)) {
    issues.push(`${name} must be an object`)
    return
  }

  for (const [state, animation] of Object.entries(value)) {
    if (!allowedStates.includes(state)) {
      issues.push(`${name}.${state} is not a supported animation state`)
      continue
    }
    validateAnimation(animation, `${name}.${state}`, issues)
  }
}

function validateAnimation(value: unknown, name: string, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${name} must be an animation object`)
    return
  }

  const { frameDurationMs, frames, loop } = value
  if (typeof frameDurationMs !== 'number' || !Number.isFinite(frameDurationMs) || frameDurationMs <= 0) {
    issues.push(`${name} must have a positive frame duration`)
  }
  if (loop !== undefined && typeof loop !== 'boolean') issues.push(`${name}.loop must be boolean`)
  if (!Array.isArray(frames) || frames.length === 0) {
    issues.push(`${name} must contain at least one frame`)
    return
  }

  let expectedSize: { width: number; height: number } | null = null
  frames.forEach((frame, index) => {
    const size = validateFrame(frame, `${name}.frames[${index}]`, issues)
    if (!size) return
    if (expectedSize && (size.width !== expectedSize.width || size.height !== expectedSize.height)) {
      issues.push(`${name}.frames[${index}] must match the animation frame dimensions`)
    } else if (!expectedSize) {
      expectedSize = size
    }
  })
}

function validateFrame(value: unknown, name: string, issues: string[]): { width: number; height: number } | null {
  if (!isRecord(value)) {
    issues.push(`${name} must be a frame object`)
    return null
  }

  const rows = value.rows
  if (!Array.isArray(rows) || rows.length === 0 || rows.some((row) => typeof row !== 'string' || row.length === 0)) {
    issues.push(`${name} must contain non-empty pixel rows`)
    return null
  }

  const width = rows[0].length
  if (rows.some((row) => row.length !== width)) issues.push(`${name} rows must all have the same width`)
  if (rows.some((row) => !PIXEL_ROW_PATTERN.test(row))) {
    issues.push(`${name} rows may only use ., 1, 2, 3, or E pixels`)
  }
  if (typeof value.body !== 'string' || !HEX_COLOR_PATTERN.test(value.body)) {
    issues.push(`${name}.body must be a six-digit hex color`)
  }
  if (typeof value.accent !== 'string' || !HEX_COLOR_PATTERN.test(value.accent)) {
    issues.push(`${name}.accent must be a six-digit hex color`)
  }

  return { width, height: rows.length }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateAttackSpriteDefinition(sprite: unknown): string[] {
  if (!isRecord(sprite)) return ['attack sprite must be an object']
  const issues: string[] = []

  if (typeof sprite.src !== 'string' || !sprite.src.startsWith('/') || sprite.src.startsWith('//')) {
    issues.push('attack sprite src must be a local absolute path')
  }
  for (const dimension of ['frameWidth', 'frameHeight', 'frameCount', 'framesPerSecond'] as const) {
    if (typeof sprite[dimension] !== 'number' || !Number.isInteger(sprite[dimension]) || sprite[dimension] <= 0) {
      issues.push(`attack sprite ${dimension} must be a positive integer`)
    }
  }
  if (sprite.renderScale !== undefined && (typeof sprite.renderScale !== 'number' || !Number.isFinite(sprite.renderScale) || sprite.renderScale <= 0)) {
    issues.push('attack sprite renderScale must be positive')
  }
  if (sprite.loop !== undefined && typeof sprite.loop !== 'boolean') issues.push('attack sprite loop must be boolean')
  return issues
}