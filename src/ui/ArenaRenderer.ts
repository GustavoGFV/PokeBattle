import { POKEMONS } from '../data/pokemons.ts'
import type { BattleState, PokemonAnimationState, PokemonDefinition, PixelSprite, SpriteDirection } from '../domain/models.ts'
import {
  getPokemonPortraitPath,
  getPokemonSpritePath,
  hasPokemonPortrait,
  hasPokemonSprite,
  getTrainerSpritePath,
  getPokemonAssetConfig,
  getPokemonFrameIndex,
  POKEMON_DIRECTION_ROWS,
  getDirectionRowForAngle,
  getPokemonGifPath,
  isGifOnlyPokemon,
} from '../domain/assets.ts'
import { getGifFrame } from './gifSprite.ts'
import { t } from '../utils/i18n.ts'
import { ENTRANCE_DURATION_MS, TRAINER_ARRIVAL_MS } from '../game/arena.ts'
import { getSpriteAnimationDurationMs, resolveSpriteFrame, validateSpriteDefinition } from '../domain/sprites.ts'
import { getTypeColor } from '../data/types.ts'

const CELL = 5
const CREATURE_SCALE = 6
const WORLD_WIDTH = 1000
const WORLD_HEIGHT = 560
const COURT = { x: 31, y: 35, width: WORLD_WIDTH - 62, height: WORLD_HEIGHT - 70 }

export interface ArenaTheme {
  id: string
  name: string
  weather: string
  weatherIcon: string
  groundColor: string
  tileA: string
  tileB: string
  groutColor: string
  featureColorA: string
  featureColorB: string
  linePrimary: string
  lineSecondary: string
  curbColor: string
  trainerBoxTint?: string
}

export const ARENA_THEMES: ArenaTheme[] = [
  {
    id: 'moss',
    name: 'The Moss Court',
    weather: 'Clear Skies',
    weatherIcon: '✳',
    groundColor: '#5a7364',
    tileA: '#6b8372',
    tileB: '#5f7766',
    groutColor: '#42574b55',
    featureColorA: '#b2c09244',
    featureColorB: '#2e443955',
    linePrimary: '#e0e5c7d8',
    lineSecondary: '#e9efd08a',
    curbColor: '#1d2c25',
    trainerBoxTint: '#4a635433',
  },
  {
    id: 'magma',
    name: 'Magma Caldera',
    weather: 'Heat Haze',
    weatherIcon: '♨',
    groundColor: '#3d1c16',
    tileA: '#4c231b',
    tileB: '#351711',
    groutColor: '#250d0877',
    featureColorA: '#e6653355',
    featureColorB: '#ffaa3333',
    linePrimary: '#ffd0ad',
    lineSecondary: '#ff864799',
    curbColor: '#180704',
    trainerBoxTint: '#66221133',
  },
  {
    id: 'lagoon',
    name: 'Azure Lagoon',
    weather: 'Sea Breeze',
    weatherIcon: '≋',
    groundColor: '#294f61',
    tileA: '#335e74',
    tileB: '#244555',
    groutColor: '#17323f77',
    featureColorA: '#58d5e855',
    featureColorB: '#1a323d66',
    linePrimary: '#d8f4ffea',
    lineSecondary: '#6ee0ff99',
    curbColor: '#0f2028',
    trainerBoxTint: '#1c4d6133',
  },
  {
    id: 'glacial',
    name: 'Glacial Peak',
    weather: 'Hail Flurry',
    weatherIcon: '❄',
    groundColor: '#4f677d',
    tileA: '#5d7992',
    tileB: '#465d71',
    groutColor: '#30445477',
    featureColorA: '#c4e7ff55',
    featureColorB: '#28384666',
    linePrimary: '#f0f8ffea',
    lineSecondary: '#a5d4ff99',
    curbColor: '#19242d',
    trainerBoxTint: '#3f5d7533',
  },
  {
    id: 'thunder',
    name: 'Thunder Ridge',
    weather: 'Storm Surge',
    weatherIcon: '⚡',
    groundColor: '#3d3854',
    tileA: '#4b4466',
    tileB: '#35304a',
    groutColor: '#231e3377',
    featureColorA: '#ffd54f55',
    featureColorB: '#25203766',
    linePrimary: '#fff1b8ea',
    lineSecondary: '#e0d07099',
    curbColor: '#161321',
    trainerBoxTint: '#3a315c33',
  },
  {
    id: 'dunes',
    name: 'Golden Dunes',
    weather: 'Sand Mirage',
    weatherIcon: '☀',
    groundColor: '#725e41',
    tileA: '#826c4b',
    tileB: '#675439',
    groutColor: '#47392477',
    featureColorA: '#ffd69955',
    featureColorB: '#362a1966',
    linePrimary: '#fff3d6ea',
    lineSecondary: '#e6c58799',
    curbColor: '#261c0f',
    trainerBoxTint: '#5f4b2f33',
  },
  {
    id: 'shadow',
    name: 'Shadow Grove',
    weather: 'Eclipse Gloom',
    weatherIcon: '☽',
    groundColor: '#362f46',
    tileA: '#433b57',
    tileB: '#2e273d',
    groutColor: '#1e182977',
    featureColorA: '#b388ff55',
    featureColorB: '#18122266',
    linePrimary: '#ebd8ffea',
    lineSecondary: '#c8a2ff99',
    curbColor: '#120d1a',
    trainerBoxTint: '#3b2f5233',
  },
  {
    id: 'matrix',
    name: 'Cyber Stadium',
    weather: 'Pulse Flux',
    weatherIcon: '◆',
    groundColor: '#1f2e30',
    tileA: '#273b3e',
    tileB: '#1b2729',
    groutColor: '#0f171988',
    featureColorA: '#00e5ff44',
    featureColorB: '#00ff8833',
    linePrimary: '#d0fcffea',
    lineSecondary: '#00e5ff99',
    curbColor: '#0a1012',
    trainerBoxTint: '#133a3d33',
  },
]

export class ArenaRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D
  private readonly backdrop = document.createElement('canvas')
  private readonly backdropContext: CanvasRenderingContext2D
  private readonly imageCache = new Map<string, HTMLImageElement>()
  private readonly footOffsetCache = new Map<string, number>()
  private currentTheme: ArenaTheme = ARENA_THEMES[0]
  private themeIndex = 0
  private cssWidth = 0
  private cssHeight = 0

  constructor(canvas: HTMLCanvasElement) {
    const invalidSprites = Object.values(POKEMONS).flatMap((pokemon) =>
      pokemon.sprite ? validateSpriteDefinition(pokemon.sprite).map((issue) => `${pokemon.name}: ${issue}`) : [],
    )
    if (invalidSprites.length) throw new Error(`Invalid creature sprite data: ${invalidSprites.join('; ')}`)

    this.canvas = canvas
    this.context = canvas.getContext('2d')!
    new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect()
      this.cssWidth = bounds.width
      this.cssHeight = bounds.height
    }).observe(canvas)
    this.backdrop.width = WORLD_WIDTH
    this.backdrop.height = WORLD_HEIGHT
    this.backdropContext = this.backdrop.getContext('2d')!
    this.paintBackdrop()
  }

  getCurrentTheme(): ArenaTheme {
    return this.currentTheme
  }

  private getImage(src: string): HTMLImageElement {
    let img = this.imageCache.get(src)
    if (!img) {
      img = new Image()
      img.src = src
      this.imageCache.set(src, img)
    }
    return img
  }

  render(state: BattleState, now: number): void {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    // Avoid a forced layout read every frame: the ResizeObserver keeps the CSS size cached.
    if (this.cssWidth === 0 || this.cssHeight === 0) {
      const bounds = this.canvas.getBoundingClientRect()
      this.cssWidth = bounds.width
      this.cssHeight = bounds.height
    }
    const width = Math.max(1, Math.round(this.cssWidth * pixelRatio))
    const height = Math.max(1, Math.round(this.cssHeight * pixelRatio))

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }

    const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT)
    const offsetX = (width - WORLD_WIDTH * scale) / 2
    const offsetY = (height - WORLD_HEIGHT * scale) / 2

    this.context.setTransform(1, 0, 0, 1, 0, 0)
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.setTransform(scale, 0, 0, scale, offsetX, offsetY)
    this.context.imageSmoothingEnabled = false
    this.context.drawImage(this.backdrop, 0, 0)

    this.drawTrainers(state)

    // Nothing drawn for creatures or attacks may leave the court.
    this.context.save()
    this.context.beginPath()
    this.context.rect(COURT.x, COURT.y, COURT.width, COURT.height)
    this.context.clip()

    for (const side of ['sun', 'moon'] as const) {
      const battler = state.teams[side].active
      const pokemon = POKEMONS[battler.pokemonId || battler.creatureId]
      if (!pokemon) continue

      // Creatures stay unspawned until their trainer has fully reached the mark.
      const entering = state.phase === 'entrance'
      if (state.phase === 'ready' || (entering && state.introElapsedMs < TRAINER_ARRIVAL_MS)) continue

      const entranceProgress = Math.min(
        1,
        Math.max(0, (state.introElapsedMs - TRAINER_ARRIVAL_MS) / (ENTRANCE_DURATION_MS - TRAINER_ARRIVAL_MS)),
      )
      const summonDuration = pokemon.sprite
        ? getSpriteAnimationDurationMs(pokemon.sprite, 'summon', battler.direction, 420)
        : 420
      const summoning = entering || (battler.animationState === 'summon' && battler.animationElapsedMs < summonDuration)
      const summonProgress = entering ? entranceProgress : Math.min(1, battler.animationElapsedMs / 420)

      if (summoning && summonProgress < 1) {
        this.drawSummonEffect(battler.x, battler.y, summonProgress)
      }

      const scaleMod = CREATURE_SCALE * pokemon.size * (summoning ? easeOutBack(summonProgress) : 1)
      const facing = battler.direction === 'left' ? -1 : 1

      this.drawShadow(battler.x, battler.y, pokemon.size)
      this.drawCreature(
        this.context,
        pokemon,
        battler.x,
        battler.y,
        scaleMod,
        facing,
        battler.direction,
        battler.animationState,
        battler.animationElapsedMs,
        battler.facingAngle,
      )
    }

    this.drawAttackAnimations(state)
    this.context.restore()
    this.drawDamageNumbers(state)

    if (state.lastImpact && state.elapsedMs - state.lastImpact.at < 320) {
      const targetSide = state.lastImpact.side
      const targetBattler = state.teams[targetSide].active
      this.drawImpact(targetBattler.x, targetBattler.y, now, state.lastImpact.color)
    }

    if (state.phase === 'ready') this.drawReadyMarks()
    if (state.phase === 'ended') this.drawFinish(state)
  }

  drawPortrait(canvas: HTMLCanvasElement, pokemon: PokemonDefinition, scene: 'menu' | 'battle' = 'menu'): void {
    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.imageSmoothingEnabled = false

    let portraitSrc = getPokemonPortraitPath(pokemon, scene)
    let img = this.getImage(portraitSrc)
    if ((!img.complete || img.naturalWidth <= 0) && pokemon.isShiny && !hasPokemonPortrait(pokemon, true)) {
      portraitSrc = getPokemonPortraitPath(pokemon, scene, false)
      img = this.getImage(portraitSrc)
    }
    if (img.complete && img.naturalWidth > 0) {
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
      return
    }

    // Try to load
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
    }

    // Fallback: draw creature if sprite available, or sleek stylized placeholder badge
    if (pokemon.sprite) {
      this.drawCreature(context, pokemon, canvas.width / 2, canvas.height / 2, 3.9 * pokemon.size, 1, 'right', 'idle', 0)
    } else {
      const typeColor = getTypeColor(pokemon.type)
      context.fillStyle = typeColor
      context.beginPath()
      context.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.42, 0, Math.PI * 2)
      context.fill()

      context.fillStyle = '#ffffff'
      context.font = `bold ${Math.round(canvas.width * 0.32)}px Impact, sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(pokemon.name.slice(0, 3).toUpperCase(), canvas.width / 2, canvas.height / 2)
    }
  }

  paintBackdrop(themeIndex?: number): ArenaTheme {
    if (themeIndex !== undefined) {
      this.themeIndex = Math.abs(themeIndex) % ARENA_THEMES.length
    } else {
      const offset = 1 + Math.floor(Math.random() * (ARENA_THEMES.length - 1))
      this.themeIndex = (this.themeIndex + offset) % ARENA_THEMES.length
    }

    const theme = ARENA_THEMES[this.themeIndex]
    this.currentTheme = theme
    const context = this.backdropContext

    // 1. Base ground fill
    context.fillStyle = theme.groundColor
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // 2. Procedural tiled pavement with grout seams
    const tileW = 50
    const tileH = 42
    for (let row = 0; row < WORLD_HEIGHT; row += tileH) {
      for (let column = 0; column < WORLD_WIDTH; column += tileW) {
        const isAlt = (Math.floor(row / tileH) + Math.floor(column / tileW)) % 2 === 0
        context.fillStyle = isAlt ? theme.tileA : theme.tileB
        context.fillRect(column, row, tileW - 1, tileH - 1)

        context.fillStyle = theme.groutColor
        context.fillRect(column, row + tileH - 2, tileW, 2)
        context.fillRect(column + tileW - 2, row, 2, tileH)
      }
    }

    // 3. Procedural scatter noise (pebbles, fissures, foliage tufts, or sparks)
    for (let index = 0; index < 280; index += 1) {
      const x = Math.floor(Math.random() * (WORLD_WIDTH - 24)) + 12
      const y = Math.floor(Math.random() * (WORLD_HEIGHT - 24)) + 12
      const w = index % 4 === 0 ? (index % 3 === 0 ? 14 : 9) : 4 + (index % 4)
      const h = 2 + (index % 5)
      context.fillStyle = index % 2 === 0 ? theme.featureColorA : theme.featureColorB
      context.fillRect(x, y, w, h)
    }

    // 4. Trainer platform base tint
    if (theme.trainerBoxTint) {
      context.fillStyle = theme.trainerBoxTint
      context.fillRect(31, 245, 135, WORLD_HEIGHT - 490)
      context.fillRect(WORLD_WIDTH - 166, 245, 135, WORLD_HEIGHT - 490)
    }

    // 5. Mandatory Arena Marking Lines:
    // (a) Traced (dashed) center line
    context.strokeStyle = theme.linePrimary
    context.lineWidth = 3
    context.setLineDash([9, 8])
    context.beginPath()
    context.moveTo(WORLD_WIDTH / 2, 42)
    context.lineTo(WORLD_WIDTH / 2, WORLD_HEIGHT - 42)
    context.stroke()
    context.setLineDash([])

    // (b) Center circle
    context.beginPath()
    context.arc(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 80, 0, Math.PI * 2)
    context.stroke()

    // (c) Outer rectangle outline & (d) Trainer boundary boxes
    context.strokeStyle = theme.lineSecondary
    context.lineWidth = 2
    context.strokeRect(31, 35, WORLD_WIDTH - 62, WORLD_HEIGHT - 70)
    context.strokeRect(31, 245, 135, WORLD_HEIGHT - 490)
    context.strokeRect(WORLD_WIDTH - 166, 245, 135, WORLD_HEIGHT - 490)

    // 6. Arena top and bottom edge curbs
    context.fillStyle = theme.curbColor
    context.fillRect(0, 0, WORLD_WIDTH, 8)
    context.fillRect(0, WORLD_HEIGHT - 8, WORLD_WIDTH, 8)

    return theme
  }

  private drawCreature(
    context: CanvasRenderingContext2D,
    pokemon: PokemonDefinition,
    x: number,
    y: number,
    scale: number,
    facing: number,
    direction: SpriteDirection,
    state: PokemonAnimationState,
    animationElapsedMs: number,
    angle?: number,
  ): void {
    // TODO: Implement padronized sprites for Rotom
    if (isGifOnlyPokemon(pokemon.name)) {
      this.drawGifSprite(context, pokemon, x, y, direction, scale, facing)
      return
    }

    const config = getPokemonAssetConfig(pokemon.name)
    if (config) {
      this.drawPokemonSprite(context, pokemon, config, x, y, direction, state, animationElapsedMs, scale, facing, angle)
      return
    }

    if (pokemon.sprite) {
      this.drawPixelSprite(context, pokemon.sprite, x, y, scale, facing, direction, state, animationElapsedMs)
    }
  }

  // GIF-only creatures use the same animation for every state and face by flipping horizontally.
  private drawGifSprite(
    context: CanvasRenderingContext2D,
    pokemon: PokemonDefinition,
    x: number,
    y: number,
    direction: SpriteDirection,
    scale: number,
    facing: number,
  ): void {
    const src = getPokemonGifPath(pokemon.name, pokemon.isShiny)
    const frame = getGifFrame(src, performance.now())
    if (!frame) {
      if (pokemon.sprite) this.drawPixelSprite(context, pokemon.sprite, x, y, scale, facing, direction, 'idle', 0)
      return
    }

    const factor = scale / (CREATURE_SCALE * (pokemon.size || 1))
    const dw = Math.round(frame.width * factor * 1.5)
    const dh = Math.round(frame.height * factor * 1.5)
    if (dw <= 0 || dh <= 0) return
    context.save()
    context.imageSmoothingEnabled = false
    context.translate(Math.round(x), Math.round(y))
    if (facing < 0) context.scale(-1, 1)
    context.drawImage(frame, -Math.round(dw / 2), -dh, dw, dh)
    context.restore()
  }

  private drawPixelSprite(
    context: CanvasRenderingContext2D,
    sprite: PixelSprite,
    x: number,
    y: number,
    scale: number,
    facing: number,
    direction: SpriteDirection,
    state: PokemonAnimationState,
    animationElapsedMs: number,
  ): void {
    const frame = resolveSpriteFrame(sprite, state, animationElapsedMs, direction)
    context.save()
    context.translate(Math.round(x), Math.round(y))
    context.scale(facing, 1)
    const startX = -(frame.rows[0].length * CELL * scale) / 2
    const startY = -(frame.rows.length * CELL * scale) / 2

    for (let row = 0; row < frame.rows.length; row += 1) {
      for (let column = 0; column < frame.rows[row].length; column += 1) {
        const pixel = frame.rows[row][column]
        if (pixel === '.') continue
        const pixelX = Math.round(startX + column * CELL * scale)
        const pixelY = Math.round(startY + row * CELL * scale)
        context.fillStyle = pixel === '1' ? '#25352b' : pixel === '2' ? frame.body : pixel === '3' ? frame.accent : '#f6f2dc'
        context.fillRect(pixelX, pixelY, CELL * scale, CELL * scale)
        if (pixel === 'E') {
          context.fillStyle = '#18251f'
          context.fillRect(pixelX + CELL * scale * 0.58, pixelY + CELL * scale * 0.55, CELL * scale * 0.28, CELL * scale * 0.32)
        }
      }
    }

    context.restore()
  }

  private drawPokemonSprite(
    context: CanvasRenderingContext2D,
    pokemon: PokemonDefinition,
    config: ReturnType<typeof getPokemonAssetConfig>,
    x: number,
    y: number,
    direction: SpriteDirection,
    state: PokemonAnimationState,
    elapsedMs: number,
    scaleMod?: number,
    facing?: number,
    angle?: number,
  ): void {
    let animName: 'Walk' | 'Attack' | 'Faint' = 'Walk'
    let spec = config.walk
    let loop = true

    switch (state) {
      case 'attack':
        animName = 'Attack'
        spec = config.attack
        loop = false
        break
      case 'faint':
        animName = 'Faint'
        spec = config.faint
        loop = false
        break
      case 'walk':
        animName = 'Walk'
        spec = config.walk
        loop = true
        break
      default:
        animName = 'Walk'
        spec = config.walk
        loop = true
        elapsedMs = 0
        break
    }

    let spritePath = getPokemonSpritePath(pokemon, animName)
    let img = this.getImage(spritePath)
    if ((!img.complete || img.naturalWidth <= 0) && pokemon.isShiny && !hasPokemonSprite(pokemon, animName, true)) {
      spritePath = getPokemonSpritePath(pokemon.name, animName, false)
      img = this.getImage(spritePath)
    }

    // Guard against unready images and prevent recursion loop
    if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
      if (pokemon.sprite) {
        this.drawPixelSprite(
          context,
          pokemon.sprite,
          x,
          y,
          scaleMod ?? 6 * (pokemon.size || 1),
          facing ?? (direction === 'left' ? -1 : 1),
          direction,
          state,
          elapsedMs,
        )
      }
      return
    }

    const sheetHeight = img.naturalHeight
    const sheetWidth = img.naturalWidth
    const frameCount = Math.max(
      1,
      spec.durations.length || Math.floor(sheetWidth / spec.frameWidth),
    )

    const hasRow = (index: number): boolean => sheetHeight >= (index + 1) * spec.frameHeight
    let row = angle === undefined ? (POKEMON_DIRECTION_ROWS[direction] ?? 0) : getDirectionRowForAngle(angle)
    let flipX = false
    // Sheets missing the exact row reuse the right row, mirrored when facing left.
    if (!hasRow(row)) {
      row = hasRow(POKEMON_DIRECTION_ROWS.right) ? POKEMON_DIRECTION_ROWS.right : 0
      flipX = (facing ?? (direction === 'left' ? -1 : 1)) < 0
    }
    const frameIndex = getPokemonFrameIndex(spec.durations, elapsedMs, loop)
    const clampedFrame = Math.min(Math.max(0, frameIndex), frameCount - 1)
    const sx = Math.min(Math.max(0, clampedFrame * spec.frameWidth), sheetWidth - 1)
    const sy = Math.min(Math.max(0, row * spec.frameHeight), sheetHeight - 1)
    const sw = Math.min(Math.max(1, spec.frameWidth), sheetWidth - sx)
    const sh = Math.min(Math.max(1, spec.frameHeight), sheetHeight - sy)

    const renderScale = 2.4 * (pokemon.size || 1)
    const dw = Math.round(sw * renderScale)
    const dh = Math.round(sh * renderScale)

    // Frames of every animation are centered on the same ground point, so the foot offset
    // measured once from the walk sheet keeps the creature planted across all animations.
    const walkImg = animName === 'Walk' ? img : this.getImage(getPokemonSpritePath(pokemon, 'Walk'))
    const footFromCenter = this.measureFootOffset(walkImg, config.walk)
    const footSrcY = Math.min(sh, Math.max(0, sh / 2 + (footFromCenter ?? sh * 0.25)))

    const anchorX = Math.round(dw / 2)
    const anchorY = Math.round(footSrcY * renderScale)

    if (sw <= 0 || sh <= 0 || sx < 0 || sy < 0 || dw <= 0 || dh <= 0) return

    context.save()
    context.translate(Math.round(x), Math.round(y))
    if (flipX) context.scale(-1, 1)
    context.drawImage(img, sx, sy, sw, sh, -anchorX, -anchorY, dw, dh)
    context.restore()
  }

  // Lowest opaque pixel of the first walk frame, relative to the frame's vertical center.
  private measureFootOffset(img: HTMLImageElement, walk: ReturnType<typeof getPokemonAssetConfig>['walk']): number | null {
    if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) return null
    const cached = this.footOffsetCache.get(img.src)
    if (cached !== undefined) return cached

    const width = Math.min(walk.frameWidth, img.naturalWidth)
    const height = Math.min(walk.frameHeight, img.naturalHeight)
    let offset: number | null = null
    try {
      const scratch = document.createElement('canvas')
      scratch.width = width
      scratch.height = height
      const scratchContext = scratch.getContext('2d', { willReadFrequently: true })
      if (scratchContext) {
        scratchContext.drawImage(img, 0, 0, width, height, 0, 0, width, height)
        const pixels = scratchContext.getImageData(0, 0, width, height).data
        for (let rowIndex = height - 1; rowIndex >= 0 && offset === null; rowIndex -= 1) {
          for (let column = 0; column < width; column += 1) {
            if (pixels[(rowIndex * width + column) * 4 + 3] > 32) {
              offset = rowIndex + 1 - walk.frameHeight / 2
              break
            }
          }
        }
      }
    } catch {
      offset = null
    }

    if (offset !== null) this.footOffsetCache.set(img.src, offset)
    return offset
  }

  private drawShadow(x: number, y: number, creatureSize = 1): void {
    const shadowWidth = Math.round(54 * creatureSize)
    const shadowHeight = Math.round(12 * creatureSize)
    this.context.fillStyle = '#07100b73'
    this.context.beginPath()
    this.context.ellipse(Math.round(x), Math.round(y + 2), shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2)
    this.context.fill()
  }

  private drawSummonEffect(x: number, y: number, progress: number): void {
    const radius = Math.max(8, 52 * (1 - progress))
    this.context.fillStyle = '#ffd15c'
    this.context.beginPath()
    this.context.arc(x, y - 8, radius, 0, Math.PI * 2)
    this.context.fill()

    this.context.strokeStyle = '#ffffff'
    this.context.lineWidth = 3
    this.context.stroke()
  }

  private drawTrainers(state: BattleState): void {
    const marks = {
      sun: { startX: -30, markX: 130, groundY: WORLD_HEIGHT / 2 + 22 },
      moon: { startX: WORLD_WIDTH + 30, markX: WORLD_WIDTH - 130, groundY: WORLD_HEIGHT / 2 + 22 },
    }

    const walkDuration = TRAINER_ARRIVAL_MS
    const introProgress = Math.min(1, state.introElapsedMs / walkDuration)
    const trainerScale = 1.8

    for (const side of ['sun', 'moon'] as const) {
      const team = state.teams[side]
      const trainer = team.trainer || team.competitor
      const mark = marks[side]
      const groundY = mark.groundY

      let x: number
      let standing: boolean

      if (state.phase === 'entrance') {
        const t = easeOutCubic(introProgress)
        x = mark.startX + (mark.markX - mark.startX) * t
        standing = introProgress >= 1
      } else {
        x = mark.markX
        standing = true
      }

      const trainerName = trainer.sprite || (trainer.id === 'red' ? 'Red' : null)

      if (trainerName) {
        const boxWidth = 45
        const boxHeight = 76

        // Invisible trainer bounding reference
        this.context.strokeStyle = 'transparent'
        this.context.strokeRect(mark.markX - boxWidth / 2, groundY - boxHeight, boxWidth, boxHeight)

        if (!standing) {
          this.context.fillStyle = '#23372e55'
          this.context.fillRect(Math.round(x) - 18, groundY - 1, 36, 5)
        }

        this.drawTrainerSprite(trainerName, x, groundY, side, standing, state.introElapsedMs, trainerScale)
      } else {
        this.drawShapeChallenger(trainer, x, WORLD_HEIGHT / 2)
      }
    }
  }

  private drawTrainerSprite(
    trainerName: string,
    x: number,
    groundY: number,
    side: 'sun' | 'moon',
    standing: boolean,
    introElapsedMs: number,
    trainerScale = 1.8,
  ): void {
    const isWalking = !standing
    const animType = isWalking ? 'Walking' : 'Idle'
    const spritePath = getTrainerSpritePath(trainerName, animType)
    const img = this.getImage(spritePath)
    if (!img.complete || img.naturalWidth <= 0) return

    const facing = side === 'sun' ? -1 : 1

    this.context.save()
    this.context.translate(Math.round(x), Math.round(groundY))
    this.context.scale(facing, 1)

    const footOffset = 43 * trainerScale + 2

    if (isWalking) {
      const frameCount = 4
      const frameWidth = img.naturalWidth / frameCount
      const frameHeight = img.naturalHeight
      const frameIndex = Math.floor(introElapsedMs / 180) % frameCount
      const dw = Math.round(frameWidth * trainerScale) - 1
      const dh = Math.round(frameHeight * trainerScale) + 2
      this.context.drawImage(img, frameIndex * frameWidth, 0, frameWidth, frameHeight, -dw / 2, -footOffset, dw, dh)
    } else {
      const dw = Math.round(img.naturalWidth * trainerScale) - 1
      const dh = Math.round(img.naturalHeight * trainerScale) + 2
      this.context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, -dw / 2, -footOffset, dw, dh)
    }

    this.context.restore()
  }

  private drawShapeChallenger(trainer: { shape: string; color: string }, x: number, y: number): void {
    this.context.fillStyle = trainer.color
    if (trainer.shape === 'triangle') {
      this.context.beginPath()
      this.context.moveTo(x, y - 19)
      this.context.lineTo(x + 18, y + 15)
      this.context.lineTo(x - 18, y + 15)
      this.context.closePath()
      this.context.fill()
    } else if (trainer.shape === 'square') {
      this.context.fillRect(x - 15, y - 15, 30, 30)
    } else if (trainer.shape === 'diamond') {
      this.context.beginPath()
      this.context.moveTo(x, y - 19)
      this.context.lineTo(x + 18, y)
      this.context.lineTo(x, y + 19)
      this.context.lineTo(x - 18, y)
      this.context.closePath()
      this.context.fill()
    } else {
      this.context.beginPath()
      this.context.arc(x, y, 16, 0, Math.PI * 2)
      this.context.fill()
    }
  }

  private drawAttackAnimations(state: BattleState): void {
    for (const animation of state.attackAnimations) {
      const progress = Math.min(1, animation.elapsedMs / animation.durationMs)
      const x = animation.fromX + (animation.toX - animation.fromX) * progress
      const y = animation.fromY + (animation.toY - animation.fromY) * progress
      this.context.fillStyle = animation.color
      this.context.globalAlpha = 1 - progress * 0.55

      if (animation.sprite && this.drawAttackSprite(animation, x, y)) {
        this.context.globalAlpha = 1
        continue
      } else if (animation.kind === 'punch') {
        const angle = Math.atan2(animation.toY - animation.fromY, animation.toX - animation.fromX)
        this.context.save()
        this.context.translate(x, y)
        this.context.rotate(angle)
        this.context.fillRect(-25, -6, 18, 12)
        this.context.fillRect(-9, -13, 18, 26)
        this.context.fillRect(7, -16, 9, 7)
        this.context.fillRect(7, -7, 9, 7)
        this.context.fillRect(7, 2, 9, 7)
        this.context.fillRect(7, 11, 9, 5)
        this.context.restore()
        if (progress > 0.65) {
          const impactScale = (progress - 0.65) / 0.35
          this.context.globalAlpha *= 1 - impactScale
          this.context.fillRect(animation.toX - 17, animation.toY - 4, 8, 8)
          this.context.fillRect(animation.toX + 8, animation.toY - 12, 7, 7)
          this.context.fillRect(animation.toX + 9, animation.toY + 8, 7, 7)
        }
      } else if (animation.kind === 'projectile') {
        for (let particle = 0; particle < 4; particle += 1) {
          const trailProgress = Math.max(0, progress - particle * 0.09)
          const px = animation.fromX + (animation.toX - animation.fromX) * trailProgress
          const py = animation.fromY + (animation.toY - animation.fromY) * trailProgress
          const size = particle === 0 ? 17 : 10 - particle
          this.context.fillRect(px - size / 2, py - size / 2, size, size)
        }
      } else if (animation.kind === 'dash') {
        const trailX = animation.fromX + (animation.toX - animation.fromX) * Math.max(0, progress - 0.24)
        const trailY = animation.fromY + (animation.toY - animation.fromY) * Math.max(0, progress - 0.24)
        this.context.globalAlpha *= 0.55
        this.context.fillRect(trailX - 22, trailY - 22, 44, 44)
        this.context.globalAlpha *= 1.8
        this.context.fillRect(x - 16, y - 16, 32, 32)
      } else if (animation.kind === 'slash') {
        const angle = Math.atan2(animation.toY - animation.fromY, animation.toX - animation.fromX)
        this.context.save()
        this.context.translate(x, y)
        this.context.rotate(angle)
        this.context.strokeStyle = animation.color
        this.context.lineWidth = 5 * (1 - progress * 0.5)
        this.context.beginPath()
        this.context.arc(0, 0, 16 + progress * 16, -Math.PI * 0.45, Math.PI * 0.45)
        this.context.stroke()
        this.context.beginPath()
        this.context.arc(-6, 0, 12 + progress * 12, -Math.PI * 0.35, Math.PI * 0.35)
        this.context.stroke()
        this.context.restore()
      } else {
        const radius = animation.kind === 'burst' ? 12 + progress * 32 : 8 + progress * 23
        this.context.strokeStyle = animation.color
        this.context.lineWidth = 6 * (1 - progress * 0.6)
        this.context.beginPath()
        this.context.arc(animation.toX, animation.toY, radius, 0, Math.PI * 2)
        this.context.stroke()
        this.context.fillRect(x - 7, y - 7, 14, 14)
      }

      this.context.globalAlpha = 1
    }
  }

  private drawAttackSprite(animation: BattleState['attackAnimations'][number], x: number, y: number): boolean {
    const sprite = animation.sprite
    if (!sprite) return false
    const image = this.getImage(sprite.src)

    if (!image.complete || image.naturalWidth < sprite.frameWidth * sprite.frameCount || image.naturalHeight < sprite.frameHeight) return false

    const rawFrame = Math.floor((animation.elapsedMs * sprite.framesPerSecond) / 1000)
    const frame = sprite.loop ? rawFrame % sprite.frameCount : Math.min(rawFrame, sprite.frameCount - 1)
    const renderScale = sprite.renderScale ?? 1
    const angle = Math.atan2(animation.toY - animation.fromY, animation.toX - animation.fromX)
    this.context.save()
    this.context.translate(x, y)
    this.context.rotate(angle)
    this.context.drawImage(
      image,
      frame * sprite.frameWidth,
      0,
      sprite.frameWidth,
      sprite.frameHeight,
      (-sprite.frameWidth * renderScale) / 2,
      (-sprite.frameHeight * renderScale) / 2,
      sprite.frameWidth * renderScale,
      sprite.frameHeight * renderScale,
    )
    this.context.restore()
    return true
  }

  private drawImpact(x: number, y: number, now: number, color = '#ffe58bc9'): void {
    const pulse = 15 + ((now % 180) / 180) * 15
    this.context.strokeStyle = color
    this.context.lineWidth = 4
    this.context.beginPath()
    this.context.arc(x, y, pulse, 0, Math.PI * 2)
    this.context.stroke()
  }

  private drawDamageNumbers(state: BattleState): void {
    const normalSize = 26
    const critSize = normalSize * 1.05

    for (const item of state.damageNumbers) {
      const progress = Math.min(1, item.elapsedMs / item.durationMs)
      const floatY = easeOutCubic(progress) * 36
      const currentY = item.y - floatY
      const alpha = progress > 0.65 ? Math.max(0, 1 - (progress - 0.65) / 0.35) : 1
      const popScale = progress < 0.15 ? 0.75 + (progress / 0.15) * 0.25 : 1

      this.context.save()
      this.context.globalAlpha = alpha
      this.context.translate(item.x, currentY)
      this.context.scale(popScale, popScale)
      this.context.textAlign = 'center'
      this.context.textBaseline = 'middle'

      if (item.isDodge) {
        const dodgeSize = Math.round(normalSize * 0.8)
        this.context.font = `italic 900 ${dodgeSize}px Impact, 'Arial Black', sans-serif`
        this.context.strokeStyle = '#000000'
        this.context.lineWidth = 4
        this.context.lineJoin = 'miter'
        this.context.miterLimit = 2
        this.context.strokeText(String(item.value), 0, 0)

        this.context.fillStyle = '#ffffff'
        this.context.fillText(String(item.value), 0, 0)
      } else if (item.isCritical) {
        const fontSize = critSize
        this.context.font = `900 ${fontSize}px Impact, 'Arial Black', sans-serif`
        this.context.strokeStyle = '#000000'
        this.context.lineWidth = 6
        this.context.lineJoin = 'miter'
        this.context.miterLimit = 2
        this.context.strokeText(String(item.value), 0, 0)

        this.context.fillStyle = '#fde047'
        this.context.fillText(String(item.value), 0, 0)
      } else {
        const fontSize = normalSize
        this.context.font = `900 ${fontSize}px Impact, 'Arial Black', sans-serif`
        this.context.strokeStyle = '#000000'
        this.context.lineWidth = 3
        this.context.lineJoin = 'miter'
        this.context.miterLimit = 2
        this.context.strokeText(String(item.value), 0, 0)

        this.context.fillStyle = '#ffffff'
        this.context.fillText(String(item.value), 0, 0)
      }

      this.context.restore()
    }
  }

  private drawReadyMarks(): void {
    this.context.fillStyle = '#18251f'
    this.context.fillRect(416, WORLD_HEIGHT / 2 - 40, 168, 80)
    this.context.strokeStyle = '#d0ef86'
    this.context.lineWidth = 2
    this.context.strokeRect(416, WORLD_HEIGHT / 2 - 40, 168, 80)
    this.context.fillStyle = '#d0ef86'
    this.context.textAlign = 'center'
    this.context.font = '700 23px Impact, sans-serif'
    this.context.fillText(t('canvas.fieldReady'), 500, WORLD_HEIGHT / 2 - 6)
    this.context.font = '10px monospace'
    this.context.fillStyle = '#d9dfc4'
    this.context.fillText(t('canvas.callFirstPair'), 500, WORLD_HEIGHT / 2 + 15)
  }

  private drawFinish(_state: BattleState): void {
    this.context.fillStyle = '#101a17b8'
    this.context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
  }
}

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

function easeOutBack(progress: number): number {
  const bounded = Math.max(0, Math.min(1, progress))
  const overshoot = 1.70158
  return 1 + (overshoot + 1) * (bounded - 1) ** 3 + overshoot * (bounded - 1) ** 2
}