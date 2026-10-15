import type { TrainerDefinition, TrainerShape } from '../domain/models.ts'
import { POKEMONS } from '../data/pokemons.ts'
import { MOVES } from '../data/moves.ts'
import { getCreatureTypes } from '../data/types.ts'
import { getTrainerSpritePath } from '../domain/assets.ts'
import type { BattleSetup } from '../game/BattleEngine.ts'
import { ArenaRenderer } from './ArenaRenderer.ts'
import { loadSavedCustomTrainers, saveCustomTrainer, deleteCustomTrainer } from '../game/storage.ts'
import { getTrainerPatternType } from '../domain/trainerPatterns.ts'
import { loadScore } from '../game/score.ts'
import { AboutTab } from './AboutTab.ts'

interface AppearanceOption {
  shape: TrainerShape
  color: string
  accent: string
  label: string
  sprite?: string
}

interface PointerDrag {
  sourceIndex: number
  pointerId: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  active: boolean
  element: HTMLElement
  preview: HTMLElement | null
  dropTarget: HTMLElement | null
}

export interface TitleGif {
  title: string
  source: 'GIPHY' | 'Tenor'
  url: string
}

export const TITLE_INTRO_GIFS: TitleGif[] = [
  {
    title: 'Ash Ketchum Running (Anime Opening)',
    source: 'GIPHY',
    url: 'https://media.giphy.com/media/fIkT0LdUDCM1G/giphy.gif',
  },
  {
    title: 'Ash Sprinting with Arcanine & Rapidash',
    source: 'Tenor',
    url: 'https://media1.tenor.com/m/mjX2l1D3QNUAAAAC/pokemon-arcanine.gif',
  },
  {
    title: 'Pokemon Anime Legendary Intro',
    source: 'Tenor',
    url: 'https://media1.tenor.com/m/grZiuTPMv4YAAAAC/pokemon-anime.gif',
  },
  {
    title: 'Game Boy Classic Intro - Gengar vs Nidorino',
    source: 'Tenor',
    url: 'https://media1.tenor.com/m/v3NDyJ3VfSgAAAAC/pokemon.gif',
  },
  {
    title: 'Pokemon Red Game Title Screen',
    source: 'Tenor',
    url: 'https://media1.tenor.com/m/tshl3HjvNQEAAAAC/pokemon-game-boy.gif',
  },
  {
    title: 'Pokemon Battle Stadium Opening',
    source: 'Tenor',
    url: 'https://media1.tenor.com/m/e_esKa2BR0EAAAAC/pokemon-battle-pokemon.gif',
  },
  {
    title: 'Pikachu Electric Dash',
    source: 'GIPHY',
    url: 'https://media.giphy.com/media/xx0JzzKA3Tddm/giphy.gif',
  },
  {
    title: 'Classic Pokemon Battle Intro',
    source: 'GIPHY',
    url: 'https://media.giphy.com/media/uWLJEGCSW50I3JF08G/giphy.gif',
  },
  {
    title: 'Charizard Flamethrower Opening',
    source: 'GIPHY',
    url: 'https://media.giphy.com/media/13G7hmmFr9yuxG/giphy.gif',
  },
  {
    title: 'Pokeball Arena Throw',
    source: 'GIPHY',
    url: 'https://media.giphy.com/media/G9qfCvxlwGAaQ/giphy.gif',
  },
]

function renderPokeballSvg(type: 'pokeball' | 'greatball' | 'ultraball' = 'pokeball'): string {
  if (type === 'greatball') {
    return `<svg viewBox="0 0 100 100" class="pokeball-svg" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#101726" stroke-width="6"/>
      <path d="M 2 50 A 48 48 0 0 1 98 50 Z" fill="#2563eb"/>
      <path d="M 18 18 Q 32 32 38 49 L 26 49 Q 22 34 12 26 Z" fill="#ee1515"/>
      <path d="M 82 18 Q 68 32 62 49 L 74 49 Q 78 34 88 26 Z" fill="#ee1515"/>
      <line x1="2" y1="50" x2="98" y2="50" stroke="#101726" stroke-width="7"/>
      <circle cx="50" cy="50" r="16" fill="#101726"/>
      <circle cx="50" cy="50" r="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
    </svg>`
  }
  if (type === 'ultraball') {
    return `<svg viewBox="0 0 100 100" class="pokeball-svg" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#101726" stroke-width="6"/>
      <path d="M 2 50 A 48 48 0 0 1 98 50 Z" fill="#1b2438"/>
      <path d="M 22 10 L 34 49 L 45 49 L 33 10 Z" fill="#ffcb05"/>
      <path d="M 78 10 L 66 49 L 55 49 L 67 10 Z" fill="#ffcb05"/>
      <line x1="2" y1="50" x2="98" y2="50" stroke="#101726" stroke-width="7"/>
      <circle cx="50" cy="50" r="16" fill="#101726"/>
      <circle cx="50" cy="50" r="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
    </svg>`
  }
  return `<svg viewBox="0 0 100 100" class="pokeball-svg" aria-hidden="true">
    <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#101726" stroke-width="6"/>
    <path d="M 2 50 A 48 48 0 0 1 98 50 Z" fill="#ee1515"/>
    <line x1="2" y1="50" x2="98" y2="50" stroke="#101726" stroke-width="7"/>
    <circle cx="50" cy="50" r="16" fill="#101726"/>
    <circle cx="50" cy="50" r="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
  </svg>`
}

export class MenuController {
  private readonly root: HTMLElement
  private readonly trainers: TrainerDefinition[]
  private readonly renderer: ArenaRenderer
  private readonly onPlay: (setup: BattleSetup) => void
  private activePreset: TrainerDefinition | null = null
  private activeRoster: string[] = []
  private customRoster: (string | null)[] = Array(6).fill(null)
  private customName = 'Custom Trainer'
  private appearanceIndex = 0
  private selectedOpponentId: string | null = null
  private opponentPickerOpen = false
  private pickerSlot: number | null = null
  private pointerDrag: PointerDrag | null = null
  private activeHeroGif: TitleGif = TITLE_INTRO_GIFS[Math.floor(Math.random() * TITLE_INTRO_GIFS.length)]

  // Storage & state for saved custom trainers
  private savedTrainers: TrainerDefinition[] = []
  private editingSavedTrainerId: string | null = null

  // Custom moves state: keyed by pokemonId
  private customMoves: Record<string, [string, string, string, string]> = {}
  private movePickerSlot: { teamSlot: number; moveSlot: number; pokemonId: string } | null = null
  private moveSearchQuery = ''

  // Filtering states
  private trainerSearchQuery = ''
  private trainerRegionFilter = 'all'
  private pokemonSearchQuery = ''
  private pokemonRegionFilter = 'all'

  // Navigation tab state
  private activeMenuTab: 'trainers' | 'about' = 'trainers'
  private eventsBound = false

  constructor(
    root: HTMLElement,
    trainers: TrainerDefinition[],
    renderer: ArenaRenderer,
    onPlay: (setup: BattleSetup) => void,
  ) {
    this.root = root
    this.trainers = trainers
    this.renderer = renderer
    this.onPlay = onPlay
    this.savedTrainers = loadSavedCustomTrainers()
  }

  private getAppearanceOptions(): AppearanceOption[] {
    return this.trainers.map((t) => ({
      shape: t.shape,
      color: t.color,
      accent: t.accent,
      label: `Trainer ${t.name}`,
      sprite: t.sprite || t.name,
    }))
  }

  render(): void {
    this.savedTrainers = loadSavedCustomTrainers()
    this.activeHeroGif = TITLE_INTRO_GIFS[Math.floor(Math.random() * TITLE_INTRO_GIFS.length)]
    const score = loadScore()

    const availableRegions = Array.from(new Set(this.trainers.map((t) => t.region || 'Unknown')))
    const regionOptions = availableRegions
      .map((r) => `<option value="${r}">${r} Region</option>`)
      .join('')

    this.root.innerHTML = `
      <section class="menu-screen">
        <section class="title-hero" aria-labelledby="hero-title">
          <div class="hero-bg-media" aria-hidden="true">
            <div class="hero-bg-gif" style="background-image: url('${this.activeHeroGif.url}');"></div>
            <div class="hero-bg-blur-layer"></div>
            <div class="hero-bg-gradient"></div>
          </div>
          <div class="hero-pokeballs" aria-hidden="true">
            <div class="hero-pokeball hero-pokeball--1">${renderPokeballSvg('pokeball')}</div>
            <div class="hero-pokeball hero-pokeball--2">${renderPokeballSvg('greatball')}</div>
            <div class="hero-pokeball hero-pokeball--3">${renderPokeballSvg('ultraball')}</div>
            <div class="hero-pokeball hero-pokeball--4">${renderPokeballSvg('pokeball')}</div>
            <div class="hero-pokeball hero-pokeball--5">${renderPokeballSvg('greatball')}</div>
            <div class="hero-pokeball hero-pokeball--6">${renderPokeballSvg('ultraball')}</div>
            <div class="hero-pokeball hero-pokeball--7">${renderPokeballSvg('pokeball')}</div>
          </div>
          <div class="hero-grid" aria-hidden="true"></div>
          <div class="hero-edition">POKÉ BATTLE <span>NO. 01</span></div>
          <h1 class="hero-title" id="hero-title"><span>POKÉ</span><span>BATTLE</span></h1>
          <div class="hero-foot"><span>POKÉMON LEAGUE / TRAINER BATTLE CIRCUIT</span><a href="#competitor-section" class="hero-cta" data-action="go-to-trainers">CHOOSE YOUR TRAINER <b>↓</b></a></div>
          <div class="hero-index" aria-hidden="true">01<br>—<br>06</div>
        </section>

        <!-- Main Menu Navigation Tabs -->
        <nav class="menu-tabs-bar" role="tablist" aria-label="Main menu navigation">
          <button
            type="button"
            class="menu-tab-btn ${this.activeMenuTab === 'trainers' ? 'is-active' : ''}"
            role="tab"
            aria-selected="${this.activeMenuTab === 'trainers'}"
            data-menu-tab="trainers"
          >
            <span class="tab-badge" aria-hidden="true">⚡</span>
            <span>BATTLE CIRCUIT</span>
          </button>
          <button
            type="button"
            class="menu-tab-btn ${this.activeMenuTab === 'about' ? 'is-active' : ''}"
            role="tab"
            aria-selected="${this.activeMenuTab === 'about'}"
            data-menu-tab="about"
          >
            <span class="tab-badge" aria-hidden="true">ℹ️</span>
            <span>ABOUT PROJECT</span>
          </button>
        </nav>

        <!-- Tab 1: Battle Circuit / Trainer Roster -->
        <div class="menu-tab-panel" id="trainers-tab-panel" ${this.activeMenuTab !== 'trainers' ? 'hidden' : ''}>
          <section class="competitor-section" id="competitor-section" aria-labelledby="competitor-heading">
            <div class="menu-section-heading">
              <div><span class="section-kicker">THE ROSTER DESK</span><h2 id="competitor-heading">Choose a Trainer</h2></div>
              <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <div class="menu-record-badge" aria-label="Player career match record">
                  <span>CAREER:</span>
                  <strong><b class="wins">${score.wins} W</b> / <b class="losses">${score.losses} L</b></strong>
                </div>
                <span class="section-count">${this.trainers.length + this.savedTrainers.length} TRAINERS <b>+</b> CUSTOM</span>
              </div>
            </div>

            <div class="menu-filter-bar">
              <input
                type="text"
                class="menu-search-input"
                data-filter="trainer-search"
                placeholder="Search trainers by name or title..."
                value="${escapeAttribute(this.trainerSearchQuery)}"
                aria-label="Search trainers by name"
              />
              <select class="menu-region-select" data-filter="trainer-region" aria-label="Filter trainers by region">
                <option value="all">All Regions (${availableRegions.join(', ')})</option>
                ${regionOptions}
              </select>
            </div>

            <div class="trainers-container" id="trainers-container"></div>
            <div class="menu-bottom-line"><span>SELECT A CARD TO REVIEW THE LINEUP</span><span>DRAG POKÉMON CARDS TO REORDER</span></div>
          </section>
        </div>

        <!-- Tab 2: About Project -->
        <div class="menu-tab-panel" id="about-tab-panel" ${this.activeMenuTab !== 'about' ? 'hidden' : ''}>
          <div id="about-tab-mount"></div>
        </div>
      </section>
      <div class="modal-root" id="modal-root" hidden></div>
    `

    if (this.activeMenuTab === 'trainers') {
      this.renderTrainers()
    } else {
      const mount = this.root.querySelector<HTMLElement>('#about-tab-mount')
      if (mount) {
        new AboutTab(mount).render()
      }
    }

    this.bindEvents()
  }

  public switchMenuTab(tab: 'trainers' | 'about'): void {
    this.activeMenuTab = tab
    const trainersPanel = this.root.querySelector<HTMLElement>('#trainers-tab-panel')
    const aboutPanel = this.root.querySelector<HTMLElement>('#about-tab-panel')
    const tabBtns = this.root.querySelectorAll<HTMLButtonElement>('[data-menu-tab]')

    tabBtns.forEach((btn) => {
      const isSelected = btn.dataset.menuTab === tab
      btn.classList.toggle('is-active', isSelected)
      btn.setAttribute('aria-selected', String(isSelected))
    })

    if (trainersPanel) {
      trainersPanel.hidden = tab !== 'trainers'
      if (tab === 'trainers') this.renderTrainers()
    }
    if (aboutPanel) {
      aboutPanel.hidden = tab !== 'about'
      if (tab === 'about') {
        const mount = aboutPanel.querySelector<HTMLElement>('#about-tab-mount')
        if (mount) {
          new AboutTab(mount).render()
        }
      }
    }
  }

  private bindEvents(): void {
    if (this.eventsBound) return
    this.eventsBound = true
    this.root.addEventListener('click', this.handleClick)
    this.root.addEventListener('input', this.handleInput)
    this.root.addEventListener('change', this.handleChange)
    this.root.addEventListener('pointerdown', this.handlePointerDown)
    document.addEventListener('pointermove', this.handlePointerMove, { passive: false })
    document.addEventListener('pointerup', this.handlePointerUp)
    document.addEventListener('pointercancel', this.handlePointerCancel)
    this.root.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('scroll', this.updateHeroTitle, { passive: true })
    this.updateHeroTitle()
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const menuTabBtn = target.closest<HTMLButtonElement>('[data-menu-tab]')
    if (menuTabBtn) {
      const tab = menuTabBtn.dataset.menuTab as 'trainers' | 'about'
      if (tab && tab !== this.activeMenuTab) {
        this.switchMenuTab(tab)
      }
      return
    }

    const actionButton = target.closest<HTMLElement>('[data-action]')
    if (actionButton) {
      if (actionButton.classList.contains('modal-backdrop') && target !== actionButton) return
      this.handleAction(actionButton.dataset.action ?? '', actionButton)
      return
    }

    const competitorCard = target.closest<HTMLButtonElement>('[data-competitor-id]')
    if (!competitorCard) return
    const id = competitorCard.dataset.competitorId
    if (id === 'custom') {
      this.openCustomEditor()
    } else {
      const saved = this.savedTrainers.find((t) => t.id === id)
      if (saved) {
        this.openSavedCustomTrainer(saved)
        return
      }
      const trainer = this.trainers.find((entry) => entry.id === id)
      if (trainer) this.openPreset(trainer)
    }
  }

  private readonly handleInput = (event: Event): void => {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return

    if (target.dataset.field === 'custom-name') {
      this.customName = target.value.slice(0, 24)
      return
    }

    if (target.dataset.filter === 'trainer-search') {
      this.trainerSearchQuery = target.value
      this.renderTrainers()
      return
    }

    if (target.dataset.filter === 'pokemon-search') {
      this.pokemonSearchQuery = target.value
      this.updatePokemonPickerList()
      return
    }

    if (target.dataset.filter === 'move-search') {
      this.moveSearchQuery = target.value
      this.updateMovePickerList()
      return
    }
  }

  private readonly handleChange = (event: Event): void => {
    const target = event.target
    if (!(target instanceof HTMLSelectElement)) return

    if (target.dataset.filter === 'trainer-region') {
      this.trainerRegionFilter = target.value
      this.renderTrainers()
      return
    }

    if (target.dataset.filter === 'pokemon-region') {
      this.pokemonRegionFilter = target.value
      this.updatePokemonPickerList()
      return
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const target = event.target
    if (!(target instanceof Element) || !event.isPrimary || event.button !== 0) return
    if (target.closest('button')) return
    const card = target.closest<HTMLElement>('.team-creature-card[data-team-index]')
    if (!card) return
    const bounds = card.getBoundingClientRect()
    this.pointerDrag = {
      sourceIndex: Number(card.dataset.teamIndex),
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      active: false,
      element: card,
      preview: null,
      dropTarget: null,
    }
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const drag = this.pointerDrag
    if (!drag || drag.pointerId !== event.pointerId) return
    if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return
    event.preventDefault()
    if (!drag.active) this.startPointerDrag(drag, event.clientX, event.clientY)
    if (drag.preview) {
      drag.preview.style.left = `${event.clientX - drag.offsetX}px`
      drag.preview.style.top = `${event.clientY - drag.offsetY}px`
    }

    const target = document.elementFromPoint(event.clientX, event.clientY)
    const dropTarget = target instanceof Element ? target.closest<HTMLElement>('[data-team-index]') : null
    if (drag.dropTarget !== dropTarget) {
      drag.dropTarget?.classList.remove('is-drop-target')
      drag.dropTarget = dropTarget
      if (dropTarget && Number(dropTarget.dataset.teamIndex) !== drag.sourceIndex) {
        dropTarget.classList.add('is-drop-target')
      }
    }
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const drag = this.pointerDrag
    if (!drag || drag.pointerId !== event.pointerId) return
    this.pointerDrag = null
    this.clearPointerDrag(drag)
    if (!drag.active) return
    const target = document.elementFromPoint(event.clientX, event.clientY)
    const destination = target instanceof Element ? target.closest<HTMLElement>('[data-team-index]') : null
    if (!destination) return
    const sourceIndex = drag.sourceIndex
    const destinationIndex = Number(destination.dataset.teamIndex)
    if (!Number.isInteger(sourceIndex) || !Number.isInteger(destinationIndex) || sourceIndex === destinationIndex) return

    if (this.activePreset) {
      ;[this.activeRoster[sourceIndex], this.activeRoster[destinationIndex]] = [
        this.activeRoster[destinationIndex],
        this.activeRoster[sourceIndex],
      ]
    } else {
      ;[this.customRoster[sourceIndex], this.customRoster[destinationIndex]] = [
        this.customRoster[destinationIndex],
        this.customRoster[sourceIndex],
      ]
    }
    this.renderDialog()
  }

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    const drag = this.pointerDrag
    if (!drag || drag.pointerId !== event.pointerId) return
    this.pointerDrag = null
    this.clearPointerDrag(drag)
  }

  private startPointerDrag(drag: PointerDrag, x: number, y: number): void {
    drag.active = true
    drag.element.classList.add('is-dragging')
    document.body.classList.add('is-dragging-card')

    const bounds = drag.element.getBoundingClientRect()
    const preview = drag.element.cloneNode(true) as HTMLElement
    preview.classList.remove('is-dragging', 'is-drop-target')
    preview.classList.add('team-card-drag-preview')
    preview.style.width = `${bounds.width}px`
    preview.style.height = `${bounds.height}px`
    preview.style.left = `${x - drag.offsetX}px`
    preview.style.top = `${y - drag.offsetY}px`
    copyCanvasPixels(drag.element, preview)
    document.body.append(preview)
    drag.preview = preview
  }

  private clearPointerDrag(drag: PointerDrag): void {
    drag.element.classList.remove('is-dragging')
    drag.dropTarget?.classList.remove('is-drop-target')
    drag.preview?.remove()
    document.body.classList.remove('is-dragging-card')
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      if (this.movePickerSlot !== null) {
        this.movePickerSlot = null
        this.renderDialog()
      } else if (this.pickerSlot !== null) {
        this.pickerSlot = null
        this.renderDialog()
      } else {
        this.closeModal()
      }
    }
  }

  private readonly updateHeroTitle = (): void => {
    const hero = this.root.querySelector<HTMLElement>('.title-hero')
    if (!hero) return
    const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(1, window.innerHeight * 0.72)))
    hero.style.setProperty('--title-shift', `${-progress * window.innerHeight * 0.42}px`)
    hero.style.setProperty('--title-scale', String(1 - progress * 0.82))
    hero.style.setProperty('--title-opacity', String(1 - progress))
    document.documentElement.style.setProperty('--brand-progress', String(progress))
    hero.classList.toggle('has-scrolled', progress > 0.04)
  }

  private getTrainerPortraitHtml(trainerName?: string): string {
    if (!trainerName) return '<span></span>'
    const portraitSrc = getTrainerSpritePath(trainerName, 'Portrait')
    return `<img src="${portraitSrc}" alt="${trainerName}" style="width:100%;height:100%;object-fit:cover;image-rendering:pixelated;" onerror="this.style.display='none'" />`
  }

  private renderTrainers(): void {
    const container = this.root.querySelector<HTMLElement>('#trainers-container')
    if (!container) return

    const query = this.trainerSearchQuery.trim().toLowerCase()
    const regionFilter = this.trainerRegionFilter

    const filtered = this.trainers.filter((t) => {
      const matchSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        t.title.toLowerCase().includes(query) ||
        t.region.toLowerCase().includes(query)
      const matchRegion = regionFilter === 'all' || t.region.toLowerCase() === regionFilter.toLowerCase()
      return matchSearch && matchRegion
    })

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="trainers-empty-state">
          <p>No trainers found matching "${escapeAttribute(this.trainerSearchQuery)}".</p>
          <small>Try adjusting your search terms or clearing the region filter.</small>
        </div>
      `
      return
    }

    // Group trainers by region
    const regionMap = new Map<string, TrainerDefinition[]>()
    for (const trainer of filtered) {
      const reg = trainer.region || 'Other'
      if (!regionMap.has(reg)) regionMap.set(reg, [])
      regionMap.get(reg)!.push(trainer)
    }

    const htmlParts: string[] = []

    // Custom Builder Card & Saved Custom Trainers
    const savedFiltered = this.savedTrainers.filter((t) => {
      const matchSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        t.title.toLowerCase().includes(query) ||
        t.region.toLowerCase().includes(query)
      const matchRegion = regionFilter === 'all' || t.region.toLowerCase() === regionFilter.toLowerCase()
      return matchSearch && matchRegion
    })

    if (!query || 'custom trainer'.includes(query) || savedFiltered.length > 0) {
      const savedCards = savedFiltered.map((trainer) => {
        const patternClass = getTrainerPatternType(trainer)
        return `
          <button class="competitor-card competitor-card--saved" type="button" data-competitor-id="${trainer.id}" style="--competitor-color:${trainer.color};--competitor-accent:${trainer.accent}">
            <span class="competitor-card-top"><span class="competitor-card-badge">SAVED CUSTOM</span><span>CUSTOM</span></span>
            <span class="competitor-art competitor-art--${trainer.shape} pattern-${patternClass}">
              ${trainer.sprite ? this.getTrainerPortraitHtml(trainer.sprite) : '<span></span>'}
            </span>
            <span class="competitor-card-bottom"><strong>${escapeAttribute(trainer.name)}</strong><span>${trainer.roster.length} POKÉMON <b>↗</b></span></span>
          </button>
        `
      })

      htmlParts.push(`
        <div class="region-group">
          <div class="region-divider">
            <span class="region-badge">CUSTOM ARENA TEAM</span>
            <span class="region-line"></span>
            <span class="region-count">${1 + savedFiltered.length} CUSTOM SLOTS</span>
          </div>
          <div class="competitor-grid">
            <button class="competitor-card competitor-card--custom" type="button" data-competitor-id="custom">
              <span class="competitor-card-top"><span>BUILD YOUR OWN</span><span>CUSTOM</span></span>
              <span class="custom-card-art"><span>+</span></span>
              <span class="competitor-card-bottom"><strong>Create Custom</strong><span>YOUR TEAM, YOUR CALL <b>↗</b></span></span>
            </button>
            ${savedCards.join('')}
          </div>
        </div>
      `)
    }

    // Render grouped by region with visual dividers
    for (const [region, trainersInRegion] of regionMap.entries()) {
      const cards = trainersInRegion.map((trainer) => {
        const patternClass = getTrainerPatternType(trainer)
        return `
        <button class="competitor-card" type="button" data-competitor-id="${trainer.id}" style="--competitor-color:${trainer.color};--competitor-accent:${trainer.accent}">
          <span class="competitor-card-top"><span>${trainer.title}</span><span>${trainer.region.toUpperCase()}</span></span>
          <span class="competitor-art competitor-art--${trainer.shape} pattern-${patternClass}">
            ${trainer.sprite ? this.getTrainerPortraitHtml(trainer.sprite) : '<span></span>'}
          </span>
          <span class="competitor-card-bottom"><strong>${trainer.name}</strong><span>${trainer.roster.length} POKÉMON <b>↗</b></span></span>
        </button>
      `})

      htmlParts.push(`
        <div class="region-group">
          <div class="region-divider">
            <span class="region-badge">${region.toUpperCase()} REGION</span>
            <span class="region-line"></span>
            <span class="region-count">${trainersInRegion.length} TRAINERS</span>
          </div>
          <div class="competitor-grid">
            ${cards.join('')}
          </div>
        </div>
      `)
    }

    container.innerHTML = htmlParts.join('')
  }

  private openPreset(trainer: TrainerDefinition): void {
    this.activePreset = trainer
    this.activeRoster = [...trainer.roster]
    this.selectedOpponentId = null
    this.opponentPickerOpen = false
    this.pickerSlot = null
    this.renderDialog()
    this.showModal()
  }

  private openSavedCustomTrainer(trainer: TrainerDefinition): void {
    this.activePreset = null
    this.editingSavedTrainerId = trainer.id
    this.customName = trainer.name
    this.customRoster = Array(6).fill(null)
    trainer.roster.forEach((id, i) => {
      if (i < 6) this.customRoster[i] = id
    })
    this.customMoves = {}
    if (trainer.customMoves) {
      for (const [pokeId, moves] of Object.entries(trainer.customMoves)) {
        if (Array.isArray(moves) && moves.length === 4) {
          this.customMoves[pokeId] = [...moves] as [string, string, string, string]
        }
      }
    }
    const appearances = this.getAppearanceOptions()
    const foundIndex = appearances.findIndex((a) => a.sprite === trainer.sprite || a.shape === trainer.shape)
    this.appearanceIndex = foundIndex >= 0 ? foundIndex : 0
    this.selectedOpponentId = null
    this.opponentPickerOpen = false
    this.pickerSlot = null
    this.movePickerSlot = null
    this.renderDialog()
    this.showModal()
  }

  private openCustomEditor(): void {
    this.activePreset = null
    this.editingSavedTrainerId = null
    this.customRoster = Array(6).fill(null)
    this.customMoves = {}
    this.customName = 'Custom Trainer'
    this.appearanceIndex = 0
    this.selectedOpponentId = null
    this.opponentPickerOpen = false
    this.pickerSlot = null
    this.movePickerSlot = null
    this.renderDialog()
    this.showModal()
  }

  private handleAction(action: string, element: HTMLElement): void {
    switch (action) {
      case 'close':
        this.closeModal()
        break
      case 'go-to-trainers':
        this.switchMenuTab('trainers')
        break
      case 'play':
        this.play()
        break
      case 'previous-appearance':
        this.changeAppearance(-1)
        break
      case 'next-appearance':
        this.changeAppearance(1)
        break
      case 'toggle-opponent-list':
        this.opponentPickerOpen = !this.opponentPickerOpen
        this.renderDialog()
        break
      case 'previous-opponent':
        this.cycleOpponent(-1)
        break
      case 'next-opponent':
        this.cycleOpponent(1)
        break
      case 'select-opponent':
        this.selectedOpponentId = element.dataset.opponentId === 'random' ? null : element.dataset.opponentId ?? null
        this.opponentPickerOpen = false
        this.renderDialog()
        break
      case 'add-creature':
        this.pickerSlot = Number(element.dataset.slot)
        this.pokemonSearchQuery = ''
        this.pokemonRegionFilter = 'all'
        this.renderDialog()
        break
      case 'remove-creature': {
        const slot = Number(element.dataset.slot)
        const removedId = this.customRoster[slot]
        if (this.activePreset) {
          this.activeRoster.splice(slot, 1)
        } else {
          this.customRoster[slot] = null
          if (removedId && !this.customRoster.includes(removedId)) {
            delete this.customMoves[removedId]
          }
        }
        this.renderDialog()
        break
      }
      case 'choose-creature':
        this.chooseCreature(element.dataset.creatureId ?? '')
        break
      case 'close-picker':
        this.pickerSlot = null
        this.renderDialog()
        break
      case 'open-move-picker': {
        const slot = Number(element.dataset.slot)
        const moveSlot = Number(element.dataset.moveSlot)
        const pokemonId = element.dataset.pokemonId ?? ''
        this.openMovePicker(slot, moveSlot, pokemonId)
        break
      }
      case 'close-move-picker':
        this.movePickerSlot = null
        this.renderDialog()
        break
      case 'choose-move': {
        const moveId = element.dataset.moveId ?? ''
        this.chooseMove(moveId)
        break
      }
      case 'save-trainer': {
        const roster = this.customRoster.filter((id): id is string => Boolean(id))
        if (roster.length === 0) return
        const appearances = this.getAppearanceOptions()
        const appearance = appearances[this.appearanceIndex % appearances.length] || appearances[0]
        const trainerId = this.editingSavedTrainerId || `custom_${Date.now()}`

        const cleanCustomMoves: Record<string, [string, string, string, string]> = {}
        for (const pokeId of roster) {
          if (this.customMoves[pokeId]) {
            cleanCustomMoves[pokeId] = [...this.customMoves[pokeId]]
          }
        }

        const trainer: TrainerDefinition = {
          id: trainerId,
          name: this.customName.trim() || 'Custom Trainer',
          title: 'CUSTOM TRAINER',
          shape: appearance.shape,
          color: appearance.color,
          accent: appearance.accent,
          sprite: appearance.sprite,
          region: 'Custom',
          roster,
          customMoves: cleanCustomMoves,
        }
        saveCustomTrainer(trainer)
        this.editingSavedTrainerId = trainerId
        this.savedTrainers = loadSavedCustomTrainers()
        this.renderTrainers()

        const btn = this.root.querySelector<HTMLButtonElement>('#save-trainer-btn')
        if (btn) {
          btn.classList.add('is-saved')
          btn.innerHTML = `<span aria-hidden="true">✓</span> SAVED`
          setTimeout(() => {
            if (btn) {
              btn.classList.remove('is-saved')
              btn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM5 5v14h14V8.5L15.5 5H5zm2 1h7v4H7V6zm0 8h10v4H7v-4z"/>
                </svg>
                SAVE
              `
            }
          }, 1200)
        }
        break
      }
      case 'delete-trainer':
        if (this.editingSavedTrainerId) {
          deleteCustomTrainer(this.editingSavedTrainerId)
          this.editingSavedTrainerId = null
          this.savedTrainers = loadSavedCustomTrainers()
          this.closeModal()
          this.renderTrainers()
        }
        break
    }
  }

  private renderDialog(): void {
    const root = this.root.querySelector<HTMLElement>('#modal-root')!
    if (this.pickerSlot !== null) {
      root.innerHTML = this.renderPokemonPicker()
    } else if (this.movePickerSlot !== null) {
      root.innerHTML = this.renderTeamDialog() + this.renderMovePicker()
    } else {
      root.innerHTML = this.renderTeamDialog()
    }
    this.drawCreatureCards()
  }

  private renderTeamDialog(): string {
    if (this.activePreset) {
      const trainer = this.activePreset
      const patternClass = getTrainerPatternType(trainer)
      return `
        <div class="modal-backdrop" data-action="close">
          <section class="team-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" data-dialog>
            <header class="dialog-heading">
              <div class="dialog-competitor" style="--competitor-color:${trainer.color};--competitor-accent:${trainer.accent}">
                <span class="competitor-art competitor-art--${trainer.shape} pattern-${patternClass}">
                  ${trainer.sprite ? this.getTrainerPortraitHtml(trainer.sprite) : '<span></span>'}
                </span>
                <div><span class="section-kicker">${trainer.title} · ${trainer.region.toUpperCase()}</span><h2 id="dialog-title">${trainer.name}</h2></div>
              </div>
              <div class="dialog-tools">${this.renderOpponentSelector(trainer)}<button class="icon-close" type="button" aria-label="Close" data-action="close">×</button></div>
            </header>
            <div class="dialog-versus"><span>YOUR TEAM</span><span>SELECT YOUR OPPONENT</span></div>
            <div class="team-grid team-grid--preset">${this.activeRoster.map((id, index) => this.renderCreatureCard(id, index, false)).join('')}</div>
            <footer class="dialog-footer"><span>DRAG TO REORDER YOUR FIELD CALLS</span><button class="play-button" type="button" data-action="play">PLAY MATCH <b>→</b></button></footer>
          </section>
        </div>
      `
    }

    const isLocked = this.editingSavedTrainerId !== null
    const appearances = this.getAppearanceOptions()
    const appearance = appearances[this.appearanceIndex % appearances.length] || {
      shape: 'circle' as TrainerShape,
      color: '#e53e3e',
      accent: '#f6e05e',
      label: 'Trainer',
    }
    const customTrainer = this.createCustomTrainer()
    const roster = this.customRoster
    const filledCount = roster.filter(Boolean).length
    const patternClass = getTrainerPatternType(customTrainer)
    return `
      <div class="modal-backdrop" data-action="close">
        <section class="team-dialog custom-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" data-dialog>
          <header class="dialog-heading">
            <div class="custom-identity" style="--competitor-color:${appearance.color};--competitor-accent:${appearance.accent}">
              <button class="appearance-arrow" type="button" aria-label="Previous appearance" data-action="previous-appearance" ${isLocked ? 'disabled' : ''}>←</button>
              <span class="competitor-art competitor-art--${appearance.shape} pattern-${patternClass}">
                ${appearance.sprite ? this.getTrainerPortraitHtml(appearance.sprite) : '<span></span>'}
              </span>
              <button class="appearance-arrow" type="button" aria-label="Next appearance" data-action="next-appearance" ${isLocked ? 'disabled' : ''}>→</button>
              <div class="identity-copy">
                <span class="section-kicker">${isLocked ? 'SAVED TRAINER (LOCKED IDENTITY)' : `CUSTOM TRAINER / ${appearance.label}`}</span>
                <h2 id="dialog-title">${escapeAttribute(this.customName)}</h2>
                <input class="custom-name-input" type="text" data-field="custom-name" value="${escapeAttribute(this.customName)}" maxlength="24" aria-label="Custom trainer name" placeholder="Enter trainer name" ${isLocked ? 'disabled readonly' : ''}>
              </div>
            </div>
            <div class="dialog-tools">${this.renderOpponentSelector(customTrainer)}<button class="icon-close" type="button" aria-label="Close" data-action="close">×</button></div>
          </header>
          <div class="dialog-versus"><span>BUILD YOUR LINEUP</span><span>${filledCount} / 6 SELECTED</span></div>
          <div class="team-grid team-grid--custom">${roster.map((id, index) => (id ? this.renderCreatureCard(id, index, true) : this.renderEmptySlot(index))).join('')}</div>
          <footer class="dialog-footer">
            <span>${filledCount === 0 ? 'ADD AT LEAST ONE POKÉMON TO SAVE OR PLAY' : isLocked ? 'SAVED TRAINER · REORDER/EDIT ROSTER OR PLAY' : 'CUSTOM TRAINER · SAVE TO ROSTER OR PLAY'}</span>
            <div class="dialog-actions">
              ${isLocked ? `<button class="delete-button" type="button" data-action="delete-trainer"><span aria-hidden="true">🗑</span> DELETE</button>` : ''}
              <button class="save-button" id="save-trainer-btn" type="button" data-action="save-trainer" ${filledCount === 0 ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM5 5v14h14V8.5L15.5 5H5zm2 1h7v4H7V6zm0 8h10v4H7v-4z"/>
                </svg>
                SAVE
              </button>
              <button class="play-button" type="button" data-action="play" ${filledCount === 0 ? 'disabled' : ''}>PLAY MATCH <b>→</b></button>
            </div>
          </footer>
        </section>
      </div>
    `
  }

  private getPokemonMoves(pokemonId: string, _slotIndex?: number): [string, string, string, string] {
    if (this.customMoves[pokemonId]) {
      return [...this.customMoves[pokemonId]]
    }
    const defaultMoves = POKEMONS[pokemonId]?.moves ?? ['tackle', 'tackle', 'tackle', 'tackle']
    return [...defaultMoves]
  }

  private setPokemonMove(pokemonId: string, moveSlot: number, moveId: string): void {
    const current = this.getPokemonMoves(pokemonId)
    current[moveSlot] = moveId
    this.customMoves[pokemonId] = current
  }

  private openMovePicker(teamSlot: number, moveSlot: number, pokemonId: string): void {
    // Isolated strictly to Custom Trainers
    if (this.activePreset) return
    this.movePickerSlot = { teamSlot, moveSlot, pokemonId }
    this.moveSearchQuery = ''
    this.renderDialog()
    setTimeout(() => {
      const searchInput = this.root.querySelector<HTMLInputElement>('[data-filter="move-search"]')
      if (searchInput) {
        searchInput.focus()
        searchInput.select()
      }
    }, 0)
  }

  private chooseMove(moveId: string): void {
    if (!this.movePickerSlot) return
    const { pokemonId, moveSlot, teamSlot } = this.movePickerSlot
    const currentMoves = this.getPokemonMoves(pokemonId, teamSlot)
    // Strict duplicate check: cannot choose a move currently equipped in any slot of this Pokemon
    if (currentMoves.includes(moveId)) {
      return
    }

    this.setPokemonMove(pokemonId, moveSlot, moveId)
    this.movePickerSlot = null
    this.renderDialog()
  }

  private getAllowedMovesForPokemon(pokemonId: string): import('../domain/models.ts').MoveDefinition[] {
    const pokemon = POKEMONS[pokemonId]
    if (!pokemon) return []
    const types = getCreatureTypes(pokemon.type, pokemon.secondaryType)
    const allowedTypes = new Set<string>([...types, 'Normal'])
    return Object.values(MOVES).filter((m) => allowedTypes.has(m.type))
  }

  private renderMovePicker(): string {
    if (!this.movePickerSlot) return ''
    const { pokemonId, moveSlot, teamSlot } = this.movePickerSlot
    const pokemon = POKEMONS[pokemonId]
    if (!pokemon) return ''

    const allowedTypes = Array.from(new Set([...getCreatureTypes(pokemon.type, pokemon.secondaryType), 'Normal']))
    const allowedMoves = this.getAllowedMovesForPokemon(pokemonId)
    const currentEquipped = this.getPokemonMoves(pokemonId, teamSlot)
    const currentMoveId = currentEquipped[moveSlot]
    const currentMove = MOVES[currentMoveId]

    return `
      <div class="modal-backdrop modal-backdrop--nested" data-action="close-move-picker">
        <section class="creature-picker move-picker-modal" role="dialog" aria-modal="true" aria-labelledby="move-picker-title" data-dialog>
          <header class="picker-heading">
            <div>
              <span class="section-kicker">${escapeAttribute(pokemon.name.toUpperCase())} · MOVE SLOT 0${moveSlot + 1} (CURRENT: ${escapeAttribute(currentMove?.name ?? currentMoveId)})</span>
              <h2 id="move-picker-title">Select Move</h2>
            </div>
            <button class="icon-close" type="button" aria-label="Close move selection" data-action="close-move-picker">×</button>
          </header>
          <div class="picker-filter-bar move-picker-filter-bar">
            <input
              type="text"
              class="picker-search-input"
              data-filter="move-search"
              placeholder="Search moves by name..."
              value="${escapeAttribute(this.moveSearchQuery)}"
              aria-label="Search moves by name"
              autofocus
            />
            <div class="move-type-hints">
              <span class="move-type-hints-label">ALLOWED TYPES:</span>
              ${allowedTypes.map((t) => `<span class="type-tag type-${t.toLowerCase()}">${t}</span>`).join('')}
              <span class="move-picker-count" id="move-picker-count">${allowedMoves.length} MOVES AVAILABLE</span>
            </div>
          </div>
          <div class="picker-list-container" id="move-picker-list-container">
            ${this.getMovePickerListHtml()}
          </div>
        </section>
      </div>
    `
  }

  private getMovePickerListHtml(): string {
    if (!this.movePickerSlot) return ''
    const { pokemonId, moveSlot, teamSlot } = this.movePickerSlot
    const pokemon = POKEMONS[pokemonId]
    if (!pokemon) return ''

    const allowedMoves = this.getAllowedMovesForPokemon(pokemonId)
    const currentEquipped = this.getPokemonMoves(pokemonId, teamSlot)
    const query = this.moveSearchQuery.trim().toLowerCase()

    const filteredMoves = allowedMoves.filter((m) => {
      if (!query) return true
      return m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query)
    })

    filteredMoves.sort((a, b) => a.name.localeCompare(b.name))

    if (filteredMoves.length === 0) {
      return `
        <div class="picker-empty-state">
          <span>NO MOVES FOUND MATCHING "${escapeAttribute(query)}"</span>
          <p>Try searching for a different move name or clear the search query.</p>
        </div>
      `
    }

    return `
      <div class="move-choice-list">
        ${filteredMoves.map((move) => {
          const isEquipped = currentEquipped.includes(move.id)
          const isCurrentSlot = currentEquipped[moveSlot] === move.id
          const typeClass = `type-${move.type.toLowerCase()}`

          return `
            <button
              type="button"
              class="move-choice ${isEquipped ? 'is-equipped' : ''}"
              ${isEquipped ? 'disabled aria-disabled="true"' : `data-action="choose-move" data-move-id="${escapeAttribute(move.id)}"`}
              title="${isEquipped ? (isCurrentSlot ? 'Currently in this slot' : 'Already equipped on this Pokémon') : `Select ${move.name}`}"
            >
              <span class="move-type-pip ${typeClass}" title="${move.type}"></span>
              <div class="move-choice-info">
                <div class="move-choice-head">
                  <strong class="move-choice-name">${escapeAttribute(move.name)}</strong>
                  <span class="type-tag ${typeClass}">${move.type}</span>
                  <span class="category-tag category-${move.category}">${move.category.toUpperCase()}</span>
                </div>
                <div class="move-choice-meta">
                  ${move.power ? `<span>PWR <b>${move.power}</b></span>` : ''}
                  ${move.range ? `<span>RNG <b>${move.range}</b></span>` : ''}
                  ${move.healing ? `<span>HEAL <b>${move.healing}</b></span>` : ''}
                  ${move.uses ? `<span>PP <b>${move.uses}</b></span>` : ''}
                  ${move.movement?.kind === 'dash' ? `<span>DASH <b>${move.movement.distance}px</b></span>` : ''}
                  ${move.effect ? `<span>${move.effect.stat.toUpperCase()} <b>${move.effect.stages > 0 ? '+' : ''}${move.effect.stages}</b></span>` : ''}
                </div>
              </div>
              <div class="move-choice-action">
                ${isEquipped
                  ? `<span class="move-equipped-badge">${isCurrentSlot ? 'CURRENT' : 'EQUIPPED'}</span>`
                  : `<span class="move-select-arrow">SELECT <b>→</b></span>`
                }
              </div>
            </button>
          `
        }).join('')}
      </div>
    `
  }

  private updateMovePickerList(): void {
    const container = this.root.querySelector<HTMLElement>('#move-picker-list-container')
    const countEl = this.root.querySelector<HTMLElement>('#move-picker-count')
    if (this.movePickerSlot && container) {
      container.innerHTML = this.getMovePickerListHtml()
      if (countEl) {
        const allowed = this.getAllowedMovesForPokemon(this.movePickerSlot.pokemonId)
        const q = this.moveSearchQuery.trim().toLowerCase()
        const matchCount = q
          ? allowed.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)).length
          : allowed.length
        countEl.textContent = `${matchCount} MOVES AVAILABLE`
      }
    }
  }

  private renderCreatureCard(id: string, index: number, custom: boolean): string {
    const pokemon = POKEMONS[id]
    if (!pokemon) return ''
    const stats = pokemon.stats
    const types = getCreatureTypes(pokemon.type, pokemon.secondaryType)
    const typeTags = types.map((type) => `<span class="type-tag type-${type.toLowerCase()}">${type}</span>`).join('')
    const moves = this.getPokemonMoves(id, index)
    const moveList = moves
      .map((moveId, moveIndex) => {
        const move = MOVES[moveId]
        const typeClass = move ? `type-${move.type.toLowerCase()}` : ''
        if (custom) {
          return `
            <button
              type="button"
              class="move-chip move-chip--interactive"
              data-action="open-move-picker"
              data-slot="${index}"
              data-move-slot="${moveIndex}"
              data-pokemon-id="${escapeAttribute(id)}"
              title="Click to customize move (${escapeAttribute(move?.name ?? moveId)})"
              aria-label="Change move ${escapeAttribute(move?.name ?? moveId)} in slot ${moveIndex + 1}"
            >
              <span class="move-type-pip ${typeClass}" title="${move?.type ?? ''}"></span>
              <span class="move-chip-name">${escapeAttribute(move?.name ?? moveId)}</span>
              <span class="move-chip-edit" aria-hidden="true">✎</span>
            </button>
          `
        }
        return `<span class="move-chip"><span class="move-type-pip ${typeClass}" title="${move?.type ?? ''}"></span>${escapeAttribute(move?.name ?? moveId)}</span>`
      })
      .join('')
    return `
      <article class="team-creature-card" data-team-index="${index}">
        <div class="team-card-head"><span class="team-order">0${index + 1}</span><span class="team-type-tags">${typeTags}</span><span class="drag-grip" aria-label="Drag to reorder">⠿</span></div>
        <div class="team-creature-main"><canvas class="team-creature-image" width="72" height="72" data-creature-id="${id}" role="img" aria-label="${pokemon.name}"></canvas><div class="team-creature-copy"><h3>${pokemon.name}</h3><span>${types.join(' / ')} TYPE · ${pokemon.region?.toUpperCase() ?? ''}</span></div></div>
        <div class="stat-grid"><span>HP <b>${stats.hp}</b></span><span>ATK <b>${stats.attack}</b></span><span>DEF <b>${stats.defense}</b></span><span>SPA <b>${stats.specialAttack}</b></span><span>SPD <b>${stats.specialDefense}</b></span><span>SPE <b>${stats.speed}</b></span></div>
        <div class="move-list">${moveList}</div>
        ${custom ? `<button class="remove-creature" type="button" aria-label="Remove ${pokemon.name}" data-action="remove-creature" data-slot="${index}">×</button>` : ''}
      </article>
    `
  }

  private renderEmptySlot(index: number): string {
    return `
      <div class="empty-team-slot" data-team-index="${index}">
        <span class="slot-number">0${index + 1}</span>
        <button class="add-creature-button" type="button" data-action="add-creature" data-slot="${index}"><span>+</span><b>ADD POKÉMON</b></button>
      </div>
    `
  }

  private renderPokemonPicker(): string {
    const availableRegions = Array.from(new Set(Object.values(POKEMONS).map((p) => p.region || 'Unknown')))
    const regionOptions = availableRegions
      .map((r) => `<option value="${r}" ${this.pokemonRegionFilter === r ? 'selected' : ''}>${r} Region</option>`)
      .join('')

    return `
      <div class="modal-backdrop modal-backdrop--nested" data-action="close-picker">
        <section class="creature-picker" role="dialog" aria-modal="true" aria-labelledby="picker-title" data-dialog>
          <header class="picker-heading">
            <div><span class="section-kicker">SLOT 0${(this.pickerSlot ?? 0) + 1}</span><h2 id="picker-title">Choose a Pokémon</h2></div>
            <button class="icon-close" type="button" aria-label="Back to custom team" data-action="close-picker">×</button>
          </header>
          <div class="picker-filter-bar">
            <input
              type="text"
              class="picker-search-input"
              data-filter="pokemon-search"
              placeholder="Search Pokémon by name or type..."
              value="${escapeAttribute(this.pokemonSearchQuery)}"
              aria-label="Search Pokémon by name"
            />
            <select class="picker-region-select" data-filter="pokemon-region" aria-label="Filter Pokémon by region">
              <option value="all" ${this.pokemonRegionFilter === 'all' ? 'selected' : ''}>All Regions</option>
              ${regionOptions}
            </select>
          </div>
          <div class="picker-list-container" id="picker-list-container">
            ${this.getPokemonPickerListHtml()}
          </div>
        </section>
      </div>
    `
  }

  private getPokemonPickerListHtml(): string {
    const selected = new Set(this.customRoster.filter((id): id is string => Boolean(id)))
    const query = this.pokemonSearchQuery.trim().toLowerCase()
    const regionFilter = this.pokemonRegionFilter

    const filtered = Object.values(POKEMONS)
      .filter((pokemon) => {
        const matchSearch =
          !query ||
          pokemon.name.toLowerCase().includes(query) ||
          pokemon.type.toLowerCase().includes(query) ||
          (pokemon.secondaryType && pokemon.secondaryType.toLowerCase().includes(query))
        const matchRegion = regionFilter === 'all' || pokemon.region.toLowerCase() === regionFilter.toLowerCase()
        return matchSearch && matchRegion
      })
      .sort((left, right) => left.name.localeCompare(right.name))

    if (filtered.length === 0) {
      return `
        <div class="picker-empty-state">
          <p>No Pokémon found matching "${escapeAttribute(this.pokemonSearchQuery)}".</p>
          <small>Try a different name or clear the region filter.</small>
        </div>
      `
    }

    // Group by region
    const regionMap = new Map<string, typeof filtered>()
    for (const p of filtered) {
      const reg = p.region || 'Other'
      if (!regionMap.has(reg)) regionMap.set(reg, [])
      regionMap.get(reg)!.push(p)
    }

    const htmlParts: string[] = []

    for (const [region, pokesInRegion] of regionMap.entries()) {
      const pokeButtons = pokesInRegion.map((pokemon) => `
        <button class="creature-choice" type="button" data-action="choose-creature" data-creature-id="${pokemon.id}" ${selected.has(pokemon.id) ? 'disabled' : ''}>
          <canvas class="team-creature-image" width="56" height="56" data-creature-id="${pokemon.id}" role="img" aria-label="${pokemon.name}"></canvas>
          <span class="choice-copy"><b>${pokemon.name}</b><span>${getCreatureTypes(pokemon.type, pokemon.secondaryType).join(' / ')} · ${pokemon.stats.hp} HP · ${pokemon.stats.speed} SPD</span></span>
          <span class="choice-types">${getCreatureTypes(pokemon.type, pokemon.secondaryType).map((type) => `<span class="type-tag type-${type.toLowerCase()}">${type}</span>`).join('')}</span>
          <span class="choice-add">${selected.has(pokemon.id) ? 'IN TEAM' : '+'}</span>
        </button>
      `)

      htmlParts.push(`
        <div class="picker-region-group">
          <div class="picker-region-divider">
            <span class="picker-region-badge">${region.toUpperCase()} REGION</span>
            <span class="picker-region-line"></span>
            <span class="region-count">${pokesInRegion.length} POKÉMON</span>
          </div>
          <div class="creature-choice-list">
            ${pokeButtons.join('')}
          </div>
        </div>
      `)
    }

    return htmlParts.join('')
  }

  private updatePokemonPickerList(): void {
    const listContainer = this.root.querySelector<HTMLElement>('#picker-list-container')
    if (listContainer) {
      listContainer.innerHTML = this.getPokemonPickerListHtml()
      this.drawCreatureCards()
    }
  }

  private drawCreatureCards(): void {
    for (const canvas of this.root.querySelectorAll<HTMLCanvasElement>('.team-creature-image')) {
      const pokemon = POKEMONS[canvas.dataset.creatureId ?? '']
      if (pokemon) this.renderer.drawPortrait(canvas, pokemon, 'menu')
    }
  }

  private chooseCreature(pokemonId: string): void {
    if (!POKEMONS[pokemonId] || this.pickerSlot === null || this.customRoster.includes(pokemonId)) return
    this.customRoster[this.pickerSlot] = pokemonId
    this.pickerSlot = null
    this.renderDialog()
  }

  private changeAppearance(direction: number): void {
    const appearances = this.getAppearanceOptions()
    this.appearanceIndex = (this.appearanceIndex + direction + appearances.length) % appearances.length
    this.renderDialog()
  }

  private renderOpponentSelector(player: TrainerDefinition): string {
    const candidates = this.getOpponentCandidates(player)
    const selected = candidates.find((trainer) => trainer.id === this.selectedOpponentId) ?? null
    const avatar = selected
      ? `<span class="opponent-avatar opponent-avatar--${selected.shape}" style="--competitor-color:${selected.color};--competitor-accent:${selected.accent}">${selected.sprite ? this.getTrainerPortraitHtml(selected.sprite) : '<span></span>'}</span>`
      : '<span class="opponent-question">?</span>'
    const options = this.opponentPickerOpen
      ? `
      <div class="opponent-options" role="listbox" aria-label="Choose an opponent">
        <button class="opponent-option ${selected ? '' : 'is-selected'}" type="button" role="option" aria-selected="${selected === null}" data-action="select-opponent" data-opponent-id="random"><span class="opponent-question opponent-question--small">?</span><span><b>Random opponent</b><small>Draw at match start</small></span></button>
        ${candidates
          .map(
            (trainer) => `
          <button class="opponent-option ${selected?.id === trainer.id ? 'is-selected' : ''}" type="button" role="option" aria-selected="${selected?.id === trainer.id}" data-action="select-opponent" data-opponent-id="${trainer.id}">
            <span class="opponent-avatar opponent-avatar--${trainer.shape}" style="--competitor-color:${trainer.color};--competitor-accent:${trainer.accent}">${trainer.sprite ? this.getTrainerPortraitHtml(trainer.sprite) : '<span></span>'}</span>
            <span><b>${trainer.name}</b><small>${trainer.title} (${trainer.region})</small></span>
          </button>
        `,
          )
          .join('')}
      </div>
    `
      : ''

    return `
      <div class="opponent-select">
        <span class="opponent-select-label">OPPONENT</span>
        <div class="opponent-control">
          <button class="opponent-arrow" type="button" aria-label="Previous opponent" data-action="previous-opponent">‹</button>
          <button class="opponent-current" type="button" aria-label="${selected ? `Opponent ${selected.name}` : 'Random opponent, click to choose'}" aria-haspopup="listbox" aria-expanded="${this.opponentPickerOpen}" data-action="toggle-opponent-list">
            ${avatar}<span class="opponent-current-name">${selected?.name ?? 'RANDOM'}</span>
          </button>
          <button class="opponent-arrow" type="button" aria-label="Next opponent" data-action="next-opponent">›</button>
        </div>
        ${options}
      </div>
    `
  }

  private getOpponentCandidates(player: TrainerDefinition): TrainerDefinition[] {
    const all = [...this.trainers, ...this.savedTrainers]
    return all.filter((trainer) => trainer.id !== player.id)
  }

  private cycleOpponent(direction: number): void {
    const player = this.activePreset ?? this.createCustomTrainer()
    const options: (TrainerDefinition | null)[] = [null, ...this.getOpponentCandidates(player)]
    const selectedIndex = options.findIndex((trainer) => trainer?.id === this.selectedOpponentId)
    const currentIndex = selectedIndex < 0 ? 0 : selectedIndex
    const nextIndex = (currentIndex + direction + options.length) % options.length
    this.selectedOpponentId = options[nextIndex]?.id ?? null
    this.opponentPickerOpen = false
    this.renderDialog()
  }

  private play(): void {
    const player = this.activePreset
      ? { ...this.activePreset, roster: [...this.activeRoster] }
      : this.createCustomTrainer()
    if (player.roster.length === 0) return
    const candidates = this.getOpponentCandidates(player)
    const opponent =
      candidates.find((trainer) => trainer.id === this.selectedOpponentId) ??
      candidates[Math.floor(Math.random() * candidates.length)]
    if (!opponent) return
    this.closeModal()
    this.onPlay({ sun: player, moon: { ...opponent, roster: [...opponent.roster] } })
  }

  private createCustomTrainer(): TrainerDefinition {
    const appearances = this.getAppearanceOptions()
    const appearance = appearances[this.appearanceIndex % appearances.length] || {
      shape: 'circle' as TrainerShape,
      color: '#e53e3e',
      accent: '#f6e05e',
      label: 'Trainer',
    }
    const roster = this.customRoster.filter((id): id is string => Boolean(id))
    const cleanCustomMoves: Record<string, [string, string, string, string]> = {}
    for (const pokeId of roster) {
      if (this.customMoves[pokeId]) {
        cleanCustomMoves[pokeId] = [...this.customMoves[pokeId]]
      }
    }
    return {
      id: this.editingSavedTrainerId || 'custom',
      name: this.customName.trim() || 'Custom Trainer',
      title: this.editingSavedTrainerId ? 'CUSTOM TRAINER' : 'TRAINER CLUB',
      shape: appearance.shape,
      color: appearance.color,
      accent: appearance.accent,
      sprite: appearance.sprite,
      region: 'Custom',
      roster,
      customMoves: cleanCustomMoves,
    }
  }

  private showModal(): void {
    this.root.querySelector<HTMLElement>('#modal-root')!.hidden = false
    document.body.classList.add('modal-open')
    this.root.querySelector<HTMLElement>('[data-dialog]')?.focus()
  }

  private closeModal(): void {
    const modal = this.root.querySelector<HTMLElement>('#modal-root')
    if (modal) modal.hidden = true
    this.pickerSlot = null
    this.movePickerSlot = null
    this.editingSavedTrainerId = null
    document.body.classList.remove('modal-open')
  }
}

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function copyCanvasPixels(source: HTMLElement, target: HTMLElement): void {
  const sourceCanvases = [...source.querySelectorAll<HTMLCanvasElement>('canvas')]
  const targetCanvases = [...target.querySelectorAll<HTMLCanvasElement>('canvas')]

  sourceCanvases.forEach((sourceCanvas, index) => {
    const targetCanvas = targetCanvases[index]
    if (!targetCanvas) return
    targetCanvas.width = sourceCanvas.width
    targetCanvas.height = sourceCanvas.height
    targetCanvas.getContext('2d')?.drawImage(sourceCanvas, 0, 0)
  })
}
