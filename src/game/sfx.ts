import type { ElementType } from '../data/types.ts'

interface HitProfile {
  wave: OscillatorType
  from: number
  to: number
  durationMs: number
  noise: number
}

// Short chiptune-style blips; pitch sweep, wave shape and noise amount vary per attack type.
export const HIT_PROFILES: Record<ElementType, HitProfile> = {
  Normal: { wave: 'square', from: 220, to: 110, durationMs: 90, noise: 0.15 },
  Fire: { wave: 'sawtooth', from: 180, to: 420, durationMs: 140, noise: 0.5 },
  Water: { wave: 'sine', from: 600, to: 220, durationMs: 150, noise: 0.2 },
  Electric: { wave: 'square', from: 1200, to: 300, durationMs: 100, noise: 0.1 },
  Grass: { wave: 'triangle', from: 320, to: 520, durationMs: 120, noise: 0.25 },
  Ice: { wave: 'triangle', from: 1400, to: 900, durationMs: 130, noise: 0.05 },
  Fighting: { wave: 'square', from: 140, to: 60, durationMs: 110, noise: 0.45 },
  Poison: { wave: 'sawtooth', from: 260, to: 150, durationMs: 150, noise: 0.15 },
  Ground: { wave: 'sawtooth', from: 90, to: 45, durationMs: 160, noise: 0.5 },
  Flying: { wave: 'sine', from: 500, to: 800, durationMs: 110, noise: 0.3 },
  Psychic: { wave: 'sine', from: 400, to: 900, durationMs: 170, noise: 0 },
  Bug: { wave: 'square', from: 700, to: 500, durationMs: 70, noise: 0.2 },
  Rock: { wave: 'square', from: 120, to: 70, durationMs: 120, noise: 0.6 },
  Ghost: { wave: 'triangle', from: 300, to: 120, durationMs: 190, noise: 0.1 },
  Dragon: { wave: 'sawtooth', from: 200, to: 80, durationMs: 180, noise: 0.3 },
  Dark: { wave: 'sawtooth', from: 150, to: 60, durationMs: 150, noise: 0.35 },
  Steel: { wave: 'square', from: 900, to: 450, durationMs: 100, noise: 0.35 },
  Fairy: { wave: 'sine', from: 900, to: 1500, durationMs: 140, noise: 0 },
}

const MASTER_GAIN = 0.05

type Cue = 'start' | 'summon' | 'victory' | 'defeat'

// [frequency Hz, duration ms] per note; 0 = rest.
const CUES: Record<Cue, { wave: OscillatorType; notes: ReadonlyArray<readonly [number, number]> }> = {
  start: { wave: 'square', notes: [[392, 90], [392, 90], [523, 220]] },
  summon: { wave: 'triangle', notes: [[330, 70], [494, 70], [659, 140]] },
  victory: { wave: 'square', notes: [[523, 110], [659, 110], [784, 110], [1047, 320], [0, 60], [784, 120], [1047, 380]] },
  defeat: { wave: 'sawtooth', notes: [[392, 200], [349, 200], [311, 200], [262, 520]] },
}

/** Lightweight WebAudio synth for hit effects and jingles; independent of the music player. */
export class SfxPlayer {
  private ctx: AudioContext | null = null
  private noise: AudioBuffer | null = null

  playCue(cue: Cue): void {
    const ctx = this.getContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    const { wave, notes } = CUES[cue]
    let at = ctx.currentTime
    for (const [freq, ms] of notes) {
      const end = at + ms / 1000
      if (freq > 0) {
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(MASTER_GAIN, at)
        gain.gain.exponentialRampToValueAtTime(0.0001, end)
        gain.connect(ctx.destination)
        const osc = ctx.createOscillator()
        osc.type = wave
        osc.frequency.value = freq
        osc.connect(gain)
        osc.start(at)
        osc.stop(end)
      }
      at = end
    }
  }

  play(type: ElementType, critical = false): void {
    const ctx = this.getContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    const profile = HIT_PROFILES[type] ?? HIT_PROFILES.Normal
    const now = ctx.currentTime
    const end = now + profile.durationMs / 1000
    const peak = critical ? MASTER_GAIN * 1.5 : MASTER_GAIN

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(peak, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    gain.connect(ctx.destination)

    const osc = ctx.createOscillator()
    osc.type = profile.wave
    osc.frequency.setValueAtTime(profile.from, now)
    osc.frequency.exponentialRampToValueAtTime(profile.to, end)
    osc.connect(gain)
    osc.start(now)
    osc.stop(end)

    if (profile.noise > 0) {
      const source = ctx.createBufferSource()
      source.buffer = this.getNoise(ctx)
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = profile.noise
      source.connect(noiseGain).connect(gain)
      source.start(now)
      source.stop(end)
    }
  }

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    try {
      this.ctx = new Ctor()
    } catch {
      return null
    }
    return this.ctx
  }

  private getNoise(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate)
      const data = this.noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    return this.noise
  }
}
