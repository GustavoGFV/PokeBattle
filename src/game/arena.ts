// Must stay in sync with the renderer's world size (1000x560) so creatures never leave the visible court.
export const ARENA = {
  width: 1000,
  height: 560,
  minX: 90,
  maxX: 910,
  minY: 160,
  maxY: 500,
  centerY: 330,
  centerX: 500,
}

// Trainers finish walking to their marks at TRAINER_ARRIVAL_MS; creatures spawn after that.
export const TRAINER_ARRIVAL_MS = 1800
export const ENTRANCE_DURATION_MS = 2400

type Position = { x: number; y: number }

export function clampToArena(position: Position): void {
  position.x = Math.max(ARENA.minX, Math.min(ARENA.maxX, position.x))
  position.y = Math.max(ARENA.minY, Math.min(ARENA.maxY, position.y))
}

const SEPARATION_BUFFER = 2

/** Footprint radius of a creature on the court, scaled by its size multiplier. */
export function bodyRadius(size: number): number {
  return Math.max(8, 14 * size + 6)
}

/**
 * Pushes two opposing battlers apart along the line between them until their bodies are at least
 * SEPARATION_BUFFER px clear of each other, keeping both inside the arena.
 */
export function separateBattlers(a: Position, b: Position, sizeA: number, sizeB: number): void {
  const minDistance = bodyRadius(sizeA) + bodyRadius(sizeB) + SEPARATION_BUFFER
  for (let pass = 0; pass < 2; pass += 1) {
    let dx = b.x - a.x
    let dy = b.y - a.y
    let distance = Math.hypot(dx, dy)
    if (distance >= minDistance) return
    if (distance < 0.001) {
      dx = 1
      dy = 0
      distance = 1
    }
    const push = (minDistance - distance) / 2
    const nx = dx / distance
    const ny = dy / distance
    a.x -= nx * push
    a.y -= ny * push
    b.x += nx * push
    b.y += ny * push
    clampToArena(a)
    clampToArena(b)
  }
}

export const CHALLENGER_MARKS = {
  sun: { entranceX: -60, markX: 58, markY: ARENA.centerY },
  moon: { entranceX: ARENA.width + 60, markX: ARENA.width - 58, markY: ARENA.centerY },
}