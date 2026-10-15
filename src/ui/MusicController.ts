import { PokemonAudioEngine } from '../game/PokemonAudioEngine.ts'
import { t, onLanguageChange } from '../utils/i18n.ts'

export interface MusicConfig {
  menuPlaylistUrl?: string
  battlePlaylistUrls?: string[]
}

export type MusicScene = 'menu' | 'battle'

export function getSpotifyPlaylistUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value)
    const match = url.hostname === 'open.spotify.com' ? url.pathname.match(/^\/playlist\/([a-zA-Z0-9]+)\/?$/) : null
    return match ? `https://open.spotify.com/playlist/${match[1]}` : null
  } catch {
    return null
  }
}

export function pickBattlePlaylist(urls: readonly string[], random: () => number = Math.random): string | null {
  const valid = urls.map(getSpotifyPlaylistUrl).filter((u): u is string => u !== null)
  if (valid.length === 0) return null
  const index = Math.min(valid.length - 1, Math.floor(random() * valid.length))
  return valid[index]
}

export class MusicController {
  private readonly root: HTMLElement
  private readonly audioEngine: PokemonAudioEngine
  private currentScene: MusicScene = 'menu'
  private hasInteracted: boolean = false
  private volumePercent: number = 20
  private lastNonZeroVolume: number = 20
  private suppressAutoplay: boolean = false

  constructor(root: HTMLElement, _config?: MusicConfig) {
    this.root = root

    // Default volume strictly to 30% to prevent jumpscares
    const savedVol = localStorage.getItem('poke_music_vol')
    this.volumePercent = savedVol !== null ? Math.max(0, Math.min(100, Number(savedVol))) : 30
    this.lastNonZeroVolume = this.volumePercent > 0 ? this.volumePercent : 30

    // Initialize 32-bit Ultra High-Definition Web Audio Engine
    this.audioEngine = new PokemonAudioEngine(this.volumePercent / 100)

    this.setupAutoplayTriggers()
    onLanguageChange(() => {
      this.suppressAutoplay = true
      this.render()
    })
    this.showMenu()
  }

  private setupAutoplayTriggers(): void {
    const trigger = () => {
      if (this.hasInteracted) return
      this.hasInteracted = true
      if (!this.audioEngine.isActive()) {
        if (this.currentScene === 'menu') {
          this.audioEngine.playMenu(undefined, true)
        } else {
          this.audioEngine.playBattle(undefined, true)
        }
      }
      this.audioEngine.setVolume(this.volumePercent / 100)
      this.updateUI()
    }
    window.addEventListener('click', trigger, { passive: true })
    window.addEventListener('pointerdown', trigger, { passive: true })
    window.addEventListener('keydown', trigger, { passive: true })
    window.addEventListener('touchstart', trigger, { passive: true })
  }

  showMenu(isContinuation: boolean = false): void {
    const wasMenu = this.currentScene === 'menu'
    this.currentScene = 'menu'

    if (!isContinuation || !wasMenu || !this.audioEngine.isActive()) {
      this.audioEngine.playMenu(undefined, true)
    }
    this.render()
  }

  showBattle(isContinuation: boolean = false): void {
    const wasBattle = this.currentScene === 'battle'
    this.currentScene = 'battle'

    // When continue button is clicked, keep playing seamlessly without restarting
    if (!isContinuation || !wasBattle || !this.audioEngine.isActive()) {
      this.audioEngine.playBattle(undefined, true)
    }
    this.render()
  }

  nextTrack(): void {
    this.audioEngine.nextTrack()
    this.render()
  }

  prevTrack(): void {
    this.audioEngine.prevTrack()
    this.render()
  }

  togglePlay(): void {
    this.audioEngine.togglePlay()
    this.updatePlayStateUI()
  }

  private setAudioVolume(val: number): void {
    this.volumePercent = Math.max(0, Math.min(100, Math.round(val)))
    if (this.volumePercent > 0) {
      this.lastNonZeroVolume = this.volumePercent
    }
    localStorage.setItem('poke_music_vol', String(this.volumePercent))

    // Directly control the browser tab audio volume via Web Audio GainNode
    this.audioEngine.setVolume(this.volumePercent / 100)

    const slider = this.root.querySelector<HTMLInputElement>('#poke-volume-slider')
    const valLabel = this.root.querySelector<HTMLElement>('#poke-volume-label')
    const icon = this.root.querySelector<HTMLElement>('#poke-volume-icon')

    if (slider) slider.value = String(this.volumePercent)
    if (valLabel) valLabel.textContent = `${this.volumePercent}%`
    if (icon) icon.textContent = this.getVolumeIcon(this.volumePercent)
  }

  private getVolumeIcon(val: number): string {
    if (val === 0) return '🔇'
    if (val < 40) return '🔈'
    if (val < 75) return '🔉'
    return '🔊'
  }

  private updatePlayStateUI(): void {
    const active = this.audioEngine.isActive()
    const playToggle = this.root.querySelector<HTMLButtonElement>('#poke-play-toggle')
    const visualizer = this.root.querySelector<HTMLElement>('.poke-native-visualizer')
    if (playToggle) {
      playToggle.textContent = active ? '⏸' : '▶'
      playToggle.title = active ? t('music.pause') : t('music.play')
    }
    if (visualizer) {
      visualizer.classList.toggle('is-paused', !active)
    }
  }

  private updateUI(): void {
    const track = this.audioEngine.getCurrentTrack()
    const playlist = this.audioEngine.getPlaylist(this.currentScene)
    const index = this.audioEngine.getTrackIndex(this.currentScene)

    const headerDisplay = this.root.querySelector<HTMLElement>('#poke-track-header')
    if (headerDisplay) {
      headerDisplay.textContent = `[${index + 1}/${playlist.length}] ${track.title}`
    }

    const titleEl = this.root.querySelector<HTMLElement>('#poke-track-title')
    if (titleEl) {
      titleEl.textContent = track.title
    }

    const gameEl = this.root.querySelector<HTMLElement>('#poke-track-game')
    if (gameEl) {
      gameEl.textContent = `${track.game} • ${t('music.audio32')}`
    }

    const countPill = this.root.querySelector<HTMLElement>('#poke-track-count')
    if (countPill) {
      countPill.textContent = `${index + 1} / ${playlist.length}`
    }

    this.updatePlayStateUI()
  }

  private render(): void {
    const track = this.audioEngine.getCurrentTrack()
    const playlist = this.audioEngine.getPlaylist(this.currentScene)
    const index = this.audioEngine.getTrackIndex(this.currentScene)
    const isPlaying = this.audioEngine.isActive()
    const skipAutoplay = this.suppressAutoplay
    this.suppressAutoplay = false

    const existingDock = this.root.querySelector<HTMLDetailsElement>('.poke-music-dock')
    const isOpen = existingDock ? existingDock.open : true

    this.root.innerHTML = `
      <details class="poke-music-dock spotify-music-dock" ${isOpen ? 'open' : ''}>
        <summary>
          <span class="music-note" aria-hidden="true">♫</span>
          <span class="spotify-now-playing-label" id="poke-track-header">
            [${index + 1}/${playlist.length}] ${track.title}
          </span>
          <b class="music-badge">${t('music.badge')}</b>
        </summary>

        <div class="poke-music-panel spotify-music-panel">
          <!-- Track Info & Visualizer -->
          <div class="poke-track-card">
            <div class="poke-native-visualizer ${isPlaying ? '' : 'is-paused'}">
              <span class="bar bar-1"></span>
              <span class="bar bar-2"></span>
              <span class="bar bar-3"></span>
              <span class="bar bar-4"></span>
            </div>
            <div class="poke-track-details">
              <strong class="poke-track-title" id="poke-track-title">${track.title}</strong>
              <div class="poke-track-meta">
                <span class="poke-track-game" id="poke-track-game">${track.game} • ${t('music.audio32')}</span>
                <span class="poke-track-count" id="poke-track-count">${index + 1} / ${playlist.length}</span>
              </div>
            </div>
          </div>

          <!-- Controls: Prev, Play/Pause, Next Track (Symbols Only) -->
          <div class="poke-audio-controls">
            <button type="button" class="poke-btn poke-btn--prev" id="poke-btn-prev" title="${t('music.prevTrack')}" aria-label="${t('music.prevTrack')}">
              ⏮
            </button>
            <button type="button" class="poke-btn poke-btn--play" id="poke-play-toggle" title="${isPlaying ? t('music.pause') : t('music.play')}" aria-label="${t('music.playPause')}">
              ${isPlaying ? '⏸' : '▶'}
            </button>
            <button type="button" class="poke-btn poke-btn--next" id="poke-btn-next" title="${t('music.nextTrack')}" aria-label="${t('music.nextTrack')}">
              ⏭
            </button>
          </div>

          <!-- Volume Bar with Mute and Exact Percentage -->
          <div class="spotify-controls-bar poke-volume-controls">
            <div class="spotify-volume-bar">
              <button type="button" class="spotify-volume-icon-btn" id="poke-volume-icon" title="${t('music.mute')}" aria-label="${t('music.mute')}">
                ${this.getVolumeIcon(this.volumePercent)}
              </button>
              <input type="range" class="spotify-volume-slider" id="poke-volume-slider" min="0" max="100" value="${this.volumePercent}" title="${t('music.volumeTitle', { n: this.volumePercent })}" aria-label="${t('music.volumeAria')}">
              <span class="spotify-volume-label" id="poke-volume-label">${this.volumePercent}%</span>
            </div>
            <span class="poke-audio-quality-tag">${t('music.stereo')}</span>
          </div>
        </div>
      </details>
    `

    // Setup volume slider listener: immediately modifies browser tab audio volume
    const slider = this.root.querySelector<HTMLInputElement>('#poke-volume-slider')
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = Number((e.target as HTMLInputElement).value)
        this.setAudioVolume(val)
      })
    }

    // Setup mute toggle on speaker icon click
    const iconBtn = this.root.querySelector<HTMLButtonElement>('#poke-volume-icon')
    if (iconBtn) {
      iconBtn.addEventListener('click', () => {
        if (this.volumePercent > 0) {
          this.setAudioVolume(0)
        } else {
          this.setAudioVolume(this.lastNonZeroVolume || 30)
        }
      })
    }

    // Play/Pause button (symbols only)
    const playToggle = this.root.querySelector<HTMLButtonElement>('#poke-play-toggle')
    if (playToggle) {
      playToggle.addEventListener('click', () => {
        this.togglePlay()
      })
    }

    // Next Track button (symbols only)
    const nextBtn = this.root.querySelector<HTMLButtonElement>('#poke-btn-next')
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextTrack()
      })
    }

    // Previous Track button (symbols only)
    const prevBtn = this.root.querySelector<HTMLButtonElement>('#poke-btn-prev')
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.prevTrack()
      })
    }

    // Autoplay trigger
    setTimeout(() => {
      this.audioEngine.setVolume(this.volumePercent / 100)
      if (!skipAutoplay && !this.audioEngine.isActive()) {
        if (this.currentScene === 'menu') {
          this.audioEngine.playMenu()
        } else {
          this.audioEngine.playBattle()
        }
      }
    }, 60)
  }
}

// Backward-compatibility alias
export { MusicController as SpotifyMusicController }
