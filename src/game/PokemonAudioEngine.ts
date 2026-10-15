/**
 * 32-Bit Pokémon Music Synthesizer for Pokémon Battle.
 * Authentic GBA / SNES sound engine inspired by Pokémon FireRed and Pokémon Emerald.
 * Features 4-channel polyphony:
 *   - Voice 1: Lead Instrument (Detuned Dual-Oscillator Hoenn Brass / GBA Pulse / Flute) with ADSR & vibrato
 *   - Voice 2: Harmony Pad & Counter-Melody (Warm filtered string chords / bells)
 *   - Voice 3: 32-Bit Bass (Rich punchy analog sub-bass with low-pass envelope)
 *   - Voice 4: Percussion (32-bit Kick, Snare, Hi-Hats, and Crash)
 * Provides 100% genuine real-time tab volume control via Web Audio GainNode.
 */

export interface TrackData {
  id: string
  title: string
  game: string
  scene: 'menu' | 'battle'
  bpm: number
  leadInst: 'brass' | 'flute' | 'pulse' | 'bell'
  lead: Array<[number, number]>       // [frequency, ticks]
  harmony: Array<[number, number]>    // [frequency, ticks]
  bass: Array<[number, number]>       // [frequency, ticks]
  drums: Array<[DrumType, number]>    // [drum, ticks]
}

export type DrumType = 'none' | 'kick' | 'snare' | 'hat' | 'crash' | 'roll'

// Frequency Map (Hz)
const N: Record<string, number> = {
  REST: 0,
  // Octave 2
  C2: 65.41, Cs2: 69.30, D2: 73.42, Ds2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Gs2: 103.83, A2: 110.00, As2: 116.54, B2: 123.47,
  // Octave 3
  C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
  // Octave 4
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  // Octave 5
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77,
  // Octave 6
  C6: 1046.50, Cs6: 1108.73, D6: 1174.66, Ds6: 1244.51, E6: 1318.51, F6: 1396.91, Fs6: 1479.98, G6: 1567.98, Gs6: 1661.22, A6: 1760.00, B6: 1975.53,
}

/* ==========================================================================
   MENU TRACKS (7 Tracks: FireRed, Emerald & Classic Themes)
   ========================================================================== */

const MENU_TRACKS: TrackData[] = [
  {
    id: 'fr_title',
    title: 'Title Screen Fanfare & March',
    game: 'Pokémon FireRed',
    scene: 'menu',
    bpm: 118,
    leadInst: 'brass',
    lead: [
      [N.G4, 4], [N.B4, 4], [N.D5, 4], [N.G5, 4],
      [N.Fs5, 4], [N.E5, 4], [N.D5, 8],
      [N.C5, 4], [N.B4, 4], [N.A4, 4], [N.G4, 4],
      [N.A4, 4], [N.B4, 4], [N.A4, 8],
      [N.G4, 4], [N.B4, 4], [N.D5, 4], [N.G5, 4],
      [N.A5, 4], [N.B5, 4], [N.G5, 8],
      [N.E5, 4], [N.G5, 4], [N.D5, 8],
      [N.C5, 4], [N.B4, 4], [N.A4, 4], [N.G4, 4],
    ],
    harmony: [
      [N.B3, 8], [N.D4, 8], [N.D4, 8], [N.B3, 8],
      [N.E3, 8], [N.G3, 8], [N.Fs3, 8], [N.D4, 8],
      [N.B3, 8], [N.D4, 8], [N.C4, 8], [N.B3, 8],
      [N.C4, 8], [N.B3, 8], [N.A3, 8], [N.B3, 8],
    ],
    bass: [
      [N.G3, 8], [N.D3, 8], [N.B3, 8], [N.D3, 8],
      [N.C3, 8], [N.G3, 8], [N.D3, 8], [N.Fs3, 8],
      [N.G3, 8], [N.D3, 8], [N.G3, 8], [N.B3, 8],
      [N.C3, 8], [N.D3, 8], [N.G3, 8], [N.G3, 8],
    ],
    drums: [
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['crash', 4],
    ],
  },
  {
    id: 'em_littleroot',
    title: 'Littleroot Town (Nostalgic Breeze)',
    game: 'Pokémon Emerald',
    scene: 'menu',
    bpm: 92,
    leadInst: 'flute',
    lead: [
      [N.Fs4, 4], [N.A4, 4], [N.D5, 6], [N.Cs5, 2],
      [N.B4, 4], [N.A4, 4], [N.Fs4, 8],
      [N.G4, 4], [N.A4, 4], [N.B4, 4], [N.A4, 4],
      [N.Fs4, 4], [N.E4, 4], [N.D4, 8],
      [N.Fs4, 4], [N.A4, 4], [N.D5, 6], [N.E5, 2],
      [N.Fs5, 4], [N.D5, 4], [N.A5, 8],
      [N.G5, 4], [N.Fs5, 4], [N.E5, 4], [N.D5, 4],
      [N.Cs5, 4], [N.E5, 4], [N.D5, 8],
    ],
    harmony: [
      [N.D4, 8], [N.Fs4, 8], [N.G4, 8], [N.D4, 8],
      [N.E4, 8], [N.Fs4, 8], [N.A3, 8], [N.Fs3, 8],
      [N.D4, 8], [N.Fs4, 8], [N.B4, 8], [N.Fs4, 8],
      [N.G4, 8], [N.Fs4, 8], [N.E4, 8], [N.D4, 8],
    ],
    bass: [
      [N.D3, 8], [N.A2, 8], [N.G2, 8], [N.D3, 8],
      [N.E3, 8], [N.D3, 8], [N.A2, 8], [N.D3, 8],
      [N.D3, 8], [N.A2, 8], [N.B2, 8], [N.Fs2, 8],
      [N.G2, 8], [N.A2, 8], [N.D3, 8], [N.D3, 8],
    ],
    drums: [
      ['hat', 4], ['none', 4], ['hat', 4], ['none', 4],
      ['hat', 4], ['none', 4], ['snare', 4], ['none', 4],
      ['hat', 4], ['none', 4], ['hat', 4], ['none', 4],
      ['hat', 4], ['none', 4], ['snare', 4], ['none', 4],
    ],
  },
  {
    id: 'fr_pallet',
    title: 'Pallet Town (Peaceful Roots)',
    game: 'Pokémon FireRed',
    scene: 'menu',
    bpm: 104,
    leadInst: 'bell',
    lead: [
      [N.G4, 4], [N.B4, 4], [N.D5, 6], [N.C5, 2],
      [N.B4, 4], [N.A4, 4], [N.G4, 8],
      [N.A4, 4], [N.B4, 4], [N.C5, 4], [N.B4, 4],
      [N.A4, 4], [N.G4, 4], [N.A4, 8],
      [N.G4, 4], [N.B4, 4], [N.D5, 6], [N.E5, 2],
      [N.D5, 4], [N.B4, 4], [N.G5, 8],
      [N.E5, 4], [N.D5, 4], [N.C5, 4], [N.B4, 4],
      [N.A4, 4], [N.D5, 4], [N.G4, 8],
    ],
    harmony: [
      [N.B3, 8], [N.G3, 8], [N.C4, 8], [N.B3, 8],
      [N.D4, 8], [N.C4, 8], [N.B3, 8], [N.A3, 8],
      [N.B3, 8], [N.G3, 8], [N.G4, 8], [N.B3, 8],
      [N.C4, 8], [N.B3, 8], [N.A3, 8], [N.B3, 8],
    ],
    bass: [
      [N.G3, 8], [N.D3, 8], [N.C3, 8], [N.G2, 8],
      [N.D3, 8], [N.A2, 8], [N.G2, 8], [N.D3, 8],
      [N.G3, 8], [N.D3, 8], [N.E3, 8], [N.B2, 8],
      [N.C3, 8], [N.D3, 8], [N.G3, 8], [N.G2, 8],
    ],
    drums: [
      ['hat', 4], ['none', 4], ['hat', 4], ['none', 4],
      ['kick', 4], ['none', 4], ['snare', 4], ['none', 4],
      ['hat', 4], ['none', 4], ['hat', 4], ['none', 4],
      ['kick', 4], ['none', 4], ['snare', 4], ['none', 4],
    ],
  },
  {
    id: 'fr_center',
    title: 'Pokémon Center Recovery Waltz',
    game: 'Pokémon FireRed / Emerald',
    scene: 'menu',
    bpm: 122,
    leadInst: 'bell',
    lead: [
      [N.C5, 2], [N.E5, 2], [N.G5, 4], [N.C6, 4], [N.B5, 2], [N.A5, 2],
      [N.G5, 4], [N.E5, 4], [N.F5, 4], [N.G5, 4],
      [N.A5, 4], [N.F5, 4], [N.E5, 4], [N.D5, 4],
      [N.C5, 6], [N.D5, 2], [N.E5, 4], [N.G4, 4],
      [N.C5, 2], [N.E5, 2], [N.G5, 4], [N.C6, 4], [N.B5, 2], [N.A5, 2],
      [N.G5, 4], [N.C6, 4], [N.B5, 4], [N.A5, 4],
      [N.G5, 4], [N.E5, 4], [N.D5, 4], [N.G4, 4],
      [N.C5, 8], [N.REST, 8],
    ],
    harmony: [
      [N.E4, 8], [N.G4, 8], [N.A4, 8], [N.G4, 8],
      [N.F4, 8], [N.D4, 8], [N.C4, 8], [N.E4, 8],
      [N.E4, 8], [N.G4, 8], [N.E4, 8], [N.F4, 8],
      [N.G4, 8], [N.F4, 8], [N.E4, 8], [N.C4, 8],
    ],
    bass: [
      [N.C3, 4], [N.G3, 4], [N.E3, 4], [N.G3, 4],
      [N.A2, 4], [N.E3, 4], [N.D3, 4], [N.G2, 4],
      [N.F2, 4], [N.C3, 4], [N.G2, 4], [N.D3, 4],
      [N.C3, 4], [N.G3, 4], [N.C3, 8],
      [N.C3, 4], [N.G3, 4], [N.E3, 4], [N.G3, 4],
      [N.A2, 4], [N.E3, 4], [N.F2, 4], [N.C3, 4],
      [N.G2, 4], [N.D3, 4], [N.G2, 4], [N.B2, 4],
      [N.C3, 8], [N.REST, 8],
    ],
    drums: [
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
    ],
  },
  {
    id: 'em_route104',
    title: 'Route 104 (Breezy Coastal Horns)',
    game: 'Pokémon Emerald',
    scene: 'menu',
    bpm: 130,
    leadInst: 'brass',
    lead: [
      [N.C5, 2], [N.F5, 4], [N.G5, 2], [N.A5, 4], [N.G5, 2], [N.F5, 2],
      [N.C5, 4], [N.D5, 2], [N.E5, 2], [N.F5, 4], [N.G5, 4],
      [N.A5, 4], [N.Bb5, 2], [N.A5, 2], [N.G5, 4], [N.F5, 4],
      [N.G5, 6], [N.A5, 2], [N.G5, 8],
      [N.C5, 2], [N.F5, 4], [N.G5, 2], [N.A5, 4], [N.C6, 4],
      [N.Bb5, 4], [N.A5, 2], [N.G5, 2], [N.F5, 4], [N.D5, 4],
      [N.C5, 4], [N.F5, 4], [N.A5, 4], [N.G5, 4],
      [N.F5, 8], [N.REST, 8],
    ],
    harmony: [
      [N.A4, 8], [N.C5, 8], [N.Bb4, 8], [N.A4, 8],
      [N.F4, 8], [N.G4, 8], [N.E4, 8], [N.C5, 8],
      [N.A4, 8], [N.C5, 8], [N.D5, 8], [N.Bb4, 8],
      [N.A4, 8], [N.C5, 8], [N.A4, 8], [N.F4, 8],
    ],
    bass: [
      [N.F3, 2], [N.F3, 2], [N.C3, 2], [N.F3, 2], [N.Bb2, 2], [N.Bb2, 2], [N.F2, 2], [N.Bb2, 2],
      [N.F3, 2], [N.F3, 2], [N.C3, 2], [N.F3, 2], [N.C3, 2], [N.C3, 2], [N.G2, 2], [N.C3, 2],
      [N.F3, 2], [N.F3, 2], [N.C3, 2], [N.F3, 2], [N.Bb2, 2], [N.Bb2, 2], [N.D3, 2], [N.Bb2, 2],
      [N.F3, 2], [N.C3, 2], [N.G2, 2], [N.C3, 2], [N.F2, 8], [N.F3, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'fr_lavender',
    title: 'Lavender Town (Haunting 16-Bit Chimes)',
    game: 'Pokémon FireRed',
    scene: 'menu',
    bpm: 96,
    leadInst: 'bell',
    lead: [
      [N.C6, 2], [N.G5, 2], [N.B5, 2], [N.Fs5, 2],
      [N.C6, 2], [N.G5, 2], [N.B5, 2], [N.Fs5, 2],
      [N.Eb5, 4], [N.D5, 4], [N.C5, 4], [N.B4, 4],
      [N.C5, 4], [N.Eb5, 4], [N.D5, 8],
      [N.C6, 2], [N.G5, 2], [N.B5, 2], [N.Fs5, 2],
      [N.C6, 2], [N.G5, 2], [N.B5, 2], [N.Fs5, 2],
      [N.G5, 4], [N.Fs5, 4], [N.F5, 4], [N.E5, 4],
      [N.Eb5, 4], [N.G5, 4], [N.C5, 8],
    ],
    harmony: [
      [N.Eb4, 8], [N.D4, 8], [N.C4, 8], [N.B3, 8],
      [N.C4, 8], [N.Eb4, 8], [N.D4, 8], [N.G3, 8],
      [N.Eb4, 8], [N.D4, 8], [N.C4, 8], [N.B3, 8],
      [N.Eb4, 8], [N.F4, 8], [N.C4, 8], [N.C4, 8],
    ],
    bass: [
      [N.C3, 8], [N.B2, 8], [N.C3, 8], [N.B2, 8],
      [N.C3, 8], [N.Eb3, 8], [N.G2, 8], [N.G2, 8],
      [N.C3, 8], [N.B2, 8], [N.C3, 8], [N.B2, 8],
      [N.Eb3, 8], [N.F2, 8], [N.C3, 8], [N.C2, 8],
    ],
    drums: [
      ['hat', 8], ['hat', 8], ['hat', 8], ['snare', 8],
      ['hat', 8], ['hat', 8], ['hat', 8], ['snare', 8],
    ],
  },
  {
    id: 'em_oldale',
    title: 'Oldale Town & Rustboro Stroll',
    game: 'Pokémon Emerald',
    scene: 'menu',
    bpm: 108,
    leadInst: 'flute',
    lead: [
      [N.D5, 2], [N.B4, 2], [N.G4, 4], [N.A4, 2], [N.B4, 2], [N.C5, 4],
      [N.D5, 4], [N.E5, 2], [N.D5, 2], [N.B4, 4], [N.G4, 4],
      [N.A4, 4], [N.B4, 2], [N.A4, 2], [N.G4, 4], [N.E4, 4],
      [N.D4, 6], [N.E4, 2], [N.G4, 8],
      [N.D5, 2], [N.B4, 2], [N.G4, 4], [N.A4, 2], [N.B4, 2], [N.C5, 4],
      [N.D5, 4], [N.G5, 4], [N.Fs5, 4], [N.E5, 4],
      [N.D5, 4], [N.B4, 2], [N.C5, 2], [N.B4, 4], [N.A4, 4],
      [N.G4, 8], [N.REST, 8],
    ],
    harmony: [
      [N.B3, 8], [N.C4, 8], [N.D4, 8], [N.B3, 8],
      [N.C4, 8], [N.B3, 8], [N.A3, 8], [N.B3, 8],
      [N.B3, 8], [N.C4, 8], [N.B3, 8], [N.C4, 8],
      [N.D4, 8], [N.C4, 8], [N.B3, 8], [N.G3, 8],
    ],
    bass: [
      [N.G3, 4], [N.D3, 4], [N.C3, 4], [N.G2, 4],
      [N.B2, 4], [N.D3, 4], [N.G2, 4], [N.B2, 4],
      [N.C3, 4], [N.G2, 4], [N.A2, 4], [N.D3, 4],
      [N.G2, 4], [N.D3, 4], [N.G2, 8],
      [N.G3, 4], [N.D3, 4], [N.C3, 4], [N.G2, 4],
      [N.B2, 4], [N.G2, 4], [N.C3, 4], [N.C2, 4],
      [N.D3, 4], [N.A2, 4], [N.D3, 4], [N.Fs2, 4],
      [N.G2, 8], [N.REST, 8],
    ],
    drums: [
      ['hat', 4], ['none', 4], ['snare', 4], ['none', 4],
      ['kick', 4], ['none', 4], ['snare', 4], ['none', 4],
      ['hat', 4], ['none', 4], ['snare', 4], ['none', 4],
      ['kick', 4], ['none', 4], ['snare', 4], ['crash', 4],
    ],
  },
  {
    id: 'em_slateport',
    title: 'Slateport City (Oceanic Harbor)',
    game: 'Pokémon Emerald',
    scene: 'menu',
    bpm: 136,
    leadInst: 'brass',
    lead: [
      [N.C5, 2], [N.E5, 2], [N.G5, 4], [N.A5, 2], [N.G5, 2], [N.E5, 4],
      [N.D5, 2], [N.E5, 2], [N.F5, 4], [N.G5, 4], [N.E5, 4],
      [N.C5, 2], [N.E5, 2], [N.G5, 4], [N.C6, 4], [N.B5, 2], [N.A5, 2],
      [N.G5, 4], [N.D5, 4], [N.C5, 8],
    ],
    harmony: [
      [N.G4, 8], [N.C5, 8], [N.A4, 8], [N.G4, 8],
      [N.G4, 8], [N.C5, 8], [N.B4, 8], [N.G4, 8],
    ],
    bass: [
      [N.C3, 2], [N.C3, 2], [N.G2, 2], [N.C3, 2], [N.A2, 2], [N.A2, 2], [N.E2, 2], [N.A2, 2],
      [N.F2, 2], [N.F2, 2], [N.C3, 2], [N.F2, 2], [N.G2, 4], [N.G3, 4], [N.C3, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'fr_evolution',
    title: 'Evolution & Victory Fanfare',
    game: 'Pokémon FireRed',
    scene: 'menu',
    bpm: 124,
    leadInst: 'bell',
    lead: [
      [N.G4, 2], [N.C5, 2], [N.E5, 2], [N.G5, 4], [N.E5, 2], [N.G5, 4],
      [N.A5, 2], [N.B5, 2], [N.C6, 4], [N.G5, 4], [N.E5, 4],
      [N.F5, 2], [N.G5, 2], [N.A5, 4], [N.G5, 2], [N.F5, 2], [N.E5, 4],
      [N.D5, 4], [N.G4, 4], [N.C5, 8],
    ],
    harmony: [
      [N.E4, 8], [N.G4, 8], [N.A4, 8], [N.G4, 8],
      [N.F4, 8], [N.E4, 8], [N.F4, 8], [N.E4, 8],
    ],
    bass: [
      [N.C3, 4], [N.G2, 4], [N.C3, 4], [N.E3, 4],
      [N.F3, 4], [N.C3, 4], [N.G2, 4], [N.B2, 4],
      [N.A2, 4], [N.E3, 4], [N.F2, 4], [N.C3, 4],
      [N.G2, 4], [N.G3, 4], [N.C3, 8],
    ],
    drums: [
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['crash', 4],
    ],
  },
  {
    id: 'fr_route1',
    title: 'Route 1 (Starting the Journey)',
    game: 'Pokémon FireRed',
    scene: 'menu',
    bpm: 120,
    leadInst: 'flute',
    lead: [
      [N.C5, 2], [N.D5, 2], [N.E5, 4], [N.G5, 4], [N.E5, 2], [N.D5, 2],
      [N.C5, 4], [N.A4, 4], [N.G4, 8],
      [N.A4, 2], [N.B4, 2], [N.C5, 4], [N.D5, 4], [N.E5, 4],
      [N.D5, 6], [N.E5, 2], [N.D5, 8],
      [N.C5, 2], [N.D5, 2], [N.E5, 4], [N.G5, 4], [N.C6, 4],
      [N.B5, 4], [N.A5, 2], [N.G5, 2], [N.E5, 8],
      [N.F5, 4], [N.E5, 4], [N.D5, 4], [N.G4, 4],
      [N.C5, 8], [N.REST, 8],
    ],
    harmony: [
      [N.E4, 8], [N.G4, 8], [N.F4, 8], [N.E4, 8],
      [N.F4, 8], [N.A4, 8], [N.G4, 8], [N.F4, 8],
      [N.E4, 8], [N.G4, 8], [N.A4, 8], [N.C5, 8],
      [N.A4, 8], [N.G4, 8], [N.F4, 8], [N.E4, 8],
    ],
    bass: [
      [N.C3, 4], [N.G2, 4], [N.C3, 4], [N.G2, 4],
      [N.F2, 4], [N.C3, 4], [N.G2, 4], [N.D3, 4],
      [N.F2, 4], [N.C3, 4], [N.G2, 4], [N.D3, 4],
      [N.G2, 4], [N.D3, 4], [N.G2, 8],
      [N.C3, 4], [N.G2, 4], [N.C3, 4], [N.E3, 4],
      [N.F3, 4], [N.C3, 4], [N.C3, 4], [N.G2, 4],
      [N.F2, 4], [N.G2, 4], [N.A2, 4], [N.B2, 4],
      [N.C3, 8], [N.REST, 8],
    ],
    drums: [
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['hat', 4],
      ['kick', 4], ['hat', 4], ['snare', 4], ['crash', 4],
    ],
  },
]

/* ==========================================================================
   BATTLE TRACKS (7 Tracks: FireRed, Emerald & Legendary Encounters)
   ========================================================================== */

const BATTLE_TRACKS: TrackData[] = [
  {
    id: 'fr_wild',
    title: 'Wild Pokémon Battle',
    game: 'Pokémon FireRed',
    scene: 'battle',
    bpm: 156,
    leadInst: 'pulse',
    lead: [
      // Intro descending chromatic flurry
      [N.B5, 1], [N.As5, 1], [N.A5, 1], [N.Gs5, 1], [N.G5, 1], [N.Fs5, 1], [N.F5, 1], [N.E5, 1],
      [N.Ds5, 1], [N.D5, 1], [N.Cs5, 1], [N.C5, 1], [N.B4, 1], [N.As4, 1], [N.A4, 1], [N.Gs4, 1],
      // Main Battle Loop
      [N.B4, 2], [N.D5, 2], [N.Cs5, 2], [N.B4, 2], [N.Fs4, 2], [N.G4, 2], [N.A4, 2], [N.B4, 2],
      [N.D5, 2], [N.Cs5, 2], [N.B4, 2], [N.A4, 2], [N.B4, 4], [N.Fs4, 4],
      [N.E5, 2], [N.Fs5, 2], [N.G5, 4], [N.Fs5, 2], [N.E5, 2], [N.D5, 4],
      [N.Cs5, 2], [N.D5, 2], [N.E5, 4], [N.D5, 2], [N.Cs5, 2], [N.B4, 4],
      [N.B4, 2], [N.Fs5, 4], [N.E5, 2], [N.D5, 2], [N.Cs5, 2], [N.B4, 4],
      [N.A4, 2], [N.B4, 2], [N.Cs5, 4], [N.D5, 2], [N.E5, 2], [N.Fs5, 4],
    ],
    harmony: [
      [N.Fs4, 16],
      [N.D4, 8], [N.Fs4, 8], [N.G4, 8], [N.Fs4, 8],
      [N.B3, 8], [N.D4, 8], [N.A3, 8], [N.Fs3, 8],
      [N.G3, 8], [N.B3, 8], [N.D4, 8], [N.B3, 8],
      [N.A3, 8], [N.Cs4, 8], [N.Fs4, 8], [N.D4, 8],
    ],
    bass: [
      [N.B2, 4], [N.B2, 4], [N.B2, 4], [N.B2, 4],
      [N.B3, 1], [N.B3, 1], [N.B3, 1], [N.B3, 1], [N.G3, 1], [N.G3, 1], [N.G3, 1], [N.G3, 1],
      [N.A3, 1], [N.A3, 1], [N.A3, 1], [N.A3, 1], [N.Fs3, 1], [N.Fs3, 1], [N.Fs3, 1], [N.Fs3, 1],
      [N.E3, 1], [N.E3, 1], [N.E3, 1], [N.E3, 1], [N.G3, 1], [N.G3, 1], [N.G3, 1], [N.G3, 1],
      [N.Fs3, 1], [N.Fs3, 1], [N.Fs3, 1], [N.Fs3, 1], [N.B3, 1], [N.B3, 1], [N.B3, 1], [N.B3, 1],
      [N.B3, 2], [N.D3, 2], [N.G3, 2], [N.E3, 2], [N.A3, 2], [N.Fs3, 2], [N.B3, 4],
    ],
    drums: [
      ['roll', 16],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'fr_trainer',
    title: 'Trainer Battle (Duel of Destiny)',
    game: 'Pokémon FireRed',
    scene: 'battle',
    bpm: 160,
    leadInst: 'brass',
    lead: [
      // Dramatic Stabs
      [N.D5, 2], [N.REST, 2], [N.D5, 2], [N.REST, 2], [N.D5, 2], [N.E5, 2], [N.F5, 4],
      [N.G5, 2], [N.REST, 2], [N.G5, 2], [N.REST, 2], [N.A5, 4], [N.B5, 4],
      // Main driving melody
      [N.A4, 2], [N.D5, 2], [N.F5, 2], [N.E5, 2], [N.D5, 2], [N.Cs5, 2], [N.D5, 2], [N.E5, 2],
      [N.F5, 4], [N.G5, 4], [N.A5, 4], [N.F5, 4],
      [N.G5, 2], [N.A5, 2], [N.Bb5, 4], [N.A5, 2], [N.G5, 2], [N.F5, 4],
      [N.E5, 2], [N.F5, 2], [N.G5, 4], [N.F5, 2], [N.E5, 2], [N.D5, 4],
      [N.Cs5, 4], [N.E5, 4], [N.D5, 8],
    ],
    harmony: [
      [N.F4, 8], [N.G4, 8], [N.Bb4, 8], [N.Cs5, 8],
      [N.D4, 8], [N.A4, 8], [N.Bb4, 8], [N.A4, 8],
      [N.G4, 8], [N.D5, 8], [N.A4, 8], [N.F4, 8],
      [N.E4, 8], [N.A4, 8], [N.F4, 8], [N.D4, 8],
    ],
    bass: [
      [N.D3, 2], [N.D3, 2], [N.D3, 2], [N.D3, 2], [N.G3, 2], [N.G3, 2], [N.A3, 4],
      [N.D3, 1], [N.D3, 1], [N.D3, 1], [N.D3, 1], [N.F3, 1], [N.F3, 1], [N.G3, 1], [N.G3, 1],
      [N.A3, 1], [N.A3, 1], [N.G3, 1], [N.G3, 1], [N.F3, 1], [N.F3, 1], [N.E3, 1], [N.E3, 1],
      [N.G3, 1], [N.G3, 1], [N.F3, 1], [N.F3, 1], [N.E3, 1], [N.E3, 1], [N.D3, 1], [N.D3, 1],
      [N.A2, 4], [N.Cs3, 4], [N.D3, 8],
    ],
    drums: [
      ['crash', 4], ['snare', 4], ['kick', 4], ['roll', 4],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'em_gym',
    title: 'Gym Leader Battle (Hoenn Trumpets)',
    game: 'Pokémon Emerald',
    scene: 'battle',
    bpm: 168,
    leadInst: 'brass',
    lead: [
      // Iconic Hoenn Brass Fanfare
      [N.E5, 2], [N.G5, 2], [N.B5, 4], [N.E6, 4], [N.D6, 2], [N.B5, 2],
      [N.A5, 4], [N.G5, 2], [N.A5, 2], [N.B5, 8],
      [N.G5, 2], [N.A5, 2], [N.B5, 4], [N.D6, 4], [N.C6, 2], [N.B5, 2],
      [N.A5, 4], [N.B5, 2], [N.C6, 2], [N.D6, 8],
      [N.E6, 4], [N.D6, 2], [N.C6, 2], [N.B5, 4], [N.G5, 4],
      [N.A5, 4], [N.G5, 2], [N.Fs5, 2], [N.E5, 8],
      [N.Fs5, 4], [N.G5, 4], [N.A5, 4], [N.B5, 4],
      [N.E5, 8], [N.REST, 8],
    ],
    harmony: [
      [N.B4, 8], [N.G4, 8], [N.D5, 8], [N.B4, 8],
      [N.E5, 8], [N.B4, 8], [N.Fs5, 8], [N.D5, 8],
      [N.C5, 8], [N.G5, 8], [N.E5, 8], [N.B4, 8],
      [N.D5, 8], [N.C5, 8], [N.B4, 8], [N.G4, 8],
    ],
    bass: [
      [N.E3, 2], [N.E3, 2], [N.B2, 2], [N.E3, 2], [N.G3, 2], [N.G3, 2], [N.D3, 2], [N.G3, 2],
      [N.C3, 2], [N.C3, 2], [N.G2, 2], [N.C3, 2], [N.D3, 2], [N.D3, 2], [N.A2, 2], [N.D3, 2],
      [N.C3, 2], [N.C3, 2], [N.G2, 2], [N.C3, 2], [N.B2, 2], [N.B2, 2], [N.Fs2, 2], [N.B2, 2],
      [N.A2, 2], [N.B2, 2], [N.C3, 2], [N.D3, 2], [N.E3, 8], [N.E2, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'em_magma_aqua',
    title: 'Team Magma & Aqua Grunt Clash',
    game: 'Pokémon Emerald',
    scene: 'battle',
    bpm: 162,
    leadInst: 'pulse',
    lead: [
      // Sinister chromatic drive
      [N.C5, 2], [N.Cs5, 2], [N.C5, 2], [N.B4, 2], [N.C5, 2], [N.Cs5, 2], [N.D5, 2], [N.Ds5, 2],
      [N.E5, 2], [N.F5, 2], [N.Fs5, 2], [N.G5, 2], [N.Ab5, 4], [N.G5, 4],
      // Main motif
      [N.C5, 4], [N.Eb5, 4], [N.D5, 2], [N.C5, 2], [N.B4, 4],
      [N.C5, 4], [N.D5, 4], [N.Eb5, 4], [N.G5, 4],
      [N.Ab5, 4], [N.G5, 2], [N.F5, 2], [N.Eb5, 4], [N.D5, 4],
      [N.C5, 2], [N.D5, 2], [N.Eb5, 4], [N.C5, 8],
    ],
    harmony: [
      [N.Eb4, 8], [N.G4, 8], [N.Ab4, 8], [N.G4, 8],
      [N.G4, 8], [N.Ab4, 8], [N.G4, 8], [N.F4, 8],
      [N.F4, 8], [N.Eb4, 8], [N.D4, 8], [N.B3, 8],
      [N.C4, 8], [N.Eb4, 8], [N.C4, 8], [N.G3, 8],
    ],
    bass: [
      [N.C3, 1], [N.C3, 1], [N.C3, 1], [N.C3, 1], [N.C3, 1], [N.C3, 1], [N.G2, 2],
      [N.Ab2, 2], [N.G2, 2], [N.F2, 2], [N.G2, 2],
      [N.C3, 2], [N.C3, 2], [N.Eb3, 2], [N.G2, 2],
      [N.Ab2, 2], [N.Ab2, 2], [N.G2, 2], [N.G2, 2],
      [N.F2, 2], [N.F2, 2], [N.Eb2, 2], [N.D2, 2],
      [N.C3, 4], [N.G2, 4], [N.C2, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['roll', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'fr_champion',
    title: 'Champion Rival Battle (Final Showdown)',
    game: 'Pokémon FireRed',
    scene: 'battle',
    bpm: 174,
    leadInst: 'brass',
    lead: [
      // Rapid climatic opening
      [N.G5, 2], [N.F5, 2], [N.Eb5, 2], [N.D5, 2], [N.C5, 2], [N.Bb4, 2], [N.A4, 2], [N.G4, 2],
      [N.A4, 2], [N.Bb4, 2], [N.C5, 2], [N.D5, 2], [N.Eb5, 4], [N.F5, 4],
      // Furious melody
      [N.G5, 4], [N.Bb5, 4], [N.A5, 2], [N.G5, 2], [N.Fs5, 4],
      [N.G5, 4], [N.A5, 4], [N.Bb5, 4], [N.D6, 4],
      [N.C6, 4], [N.Bb5, 2], [N.A5, 2], [N.G5, 4], [N.Fs5, 4],
      [N.G5, 2], [N.A5, 2], [N.Bb5, 4], [N.A5, 4], [N.G5, 4],
      [N.Eb6, 4], [N.D6, 4], [N.C6, 4], [N.Bb5, 4],
      [N.A5, 4], [N.D5, 4], [N.G4, 8],
    ],
    harmony: [
      [N.Bb4, 8], [N.D5, 8], [N.C5, 8], [N.A4, 8],
      [N.D5, 8], [N.Eb5, 8], [N.D5, 8], [N.Bb4, 8],
      [N.Eb5, 8], [N.D5, 8], [N.Bb4, 8], [N.A4, 8],
      [N.Bb4, 8], [N.A4, 8], [N.G4, 8], [N.D4, 8],
    ],
    bass: [
      [N.G3, 1], [N.G3, 1], [N.G3, 1], [N.G3, 1], [N.G3, 1], [N.G3, 1], [N.D3, 2],
      [N.Eb3, 1], [N.Eb3, 1], [N.F3, 1], [N.F3, 1], [N.G3, 2], [N.D3, 2],
      [N.G2, 2], [N.G3, 2], [N.Eb2, 2], [N.Eb3, 2],
      [N.F2, 2], [N.F3, 2], [N.D2, 2], [N.D3, 2],
      [N.C3, 2], [N.C3, 2], [N.D3, 2], [N.D3, 2],
      [N.G2, 8], [N.G2, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'em_frontier',
    title: 'Battle Frontier (Brain Battle)',
    game: 'Pokémon Emerald',
    scene: 'battle',
    bpm: 165,
    leadInst: 'pulse',
    lead: [
      [N.A4, 2], [N.C5, 2], [N.E5, 4], [N.A5, 4], [N.Gs5, 2], [N.A5, 2],
      [N.B5, 4], [N.C6, 4], [N.B5, 2], [N.A5, 2], [N.G5, 4],
      [N.F5, 4], [N.E5, 2], [N.D5, 2], [N.E5, 4], [N.F5, 4],
      [N.G5, 4], [N.A5, 4], [N.E5, 8],
      [N.A5, 4], [N.C6, 4], [N.B5, 2], [N.A5, 2], [N.G5, 4],
      [N.F5, 4], [N.G5, 2], [N.F5, 2], [N.E5, 4], [N.D5, 4],
      [N.C5, 4], [N.D5, 4], [N.E5, 4], [N.Gs4, 4],
      [N.A4, 8], [N.REST, 8],
    ],
    harmony: [
      [N.C5, 8], [N.E5, 8], [N.D5, 8], [N.B4, 8],
      [N.A4, 8], [N.C5, 8], [N.B4, 8], [N.G4, 8],
      [N.C5, 8], [N.D5, 8], [N.A4, 8], [N.F4, 8],
      [N.E4, 8], [N.E4, 8], [N.C4, 8], [N.A3, 8],
    ],
    bass: [
      [N.A3, 2], [N.A2, 2], [N.E3, 2], [N.A2, 2], [N.G3, 2], [N.G2, 2], [N.D3, 2], [N.G2, 2],
      [N.F3, 2], [N.F2, 2], [N.C3, 2], [N.F2, 2], [N.E3, 2], [N.E2, 2], [N.B2, 2], [N.E2, 2],
      [N.F2, 2], [N.F3, 2], [N.G2, 2], [N.G3, 2], [N.A2, 2], [N.A3, 2], [N.E2, 2], [N.E3, 2],
      [N.D2, 2], [N.D3, 2], [N.E2, 4], [N.A2, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'fr_gym',
    title: 'Gym Leader Battle (Kanto Triumph)',
    game: 'Pokémon FireRed',
    scene: 'battle',
    bpm: 162,
    leadInst: 'brass',
    lead: [
      [N.B4, 2], [N.D5, 2], [N.Fs5, 4], [N.B5, 4], [N.A5, 2], [N.G5, 2],
      [N.Fs5, 4], [N.E5, 4], [N.Fs5, 4], [N.G5, 4],
      [N.A5, 4], [N.B5, 4], [N.Cs6, 4], [N.D6, 4],
      [N.Cs6, 4], [N.B5, 4], [N.As5, 8],
      [N.B5, 4], [N.D6, 4], [N.Cs6, 2], [N.B5, 2], [N.A5, 4],
      [N.G5, 4], [N.Fs5, 2], [N.E5, 2], [N.D5, 4], [N.Cs5, 4],
      [N.B4, 4], [N.Fs5, 4], [N.D5, 4], [N.Fs5, 4],
      [N.B4, 8], [N.REST, 8],
    ],
    harmony: [
      [N.Fs4, 8], [N.B4, 8], [N.D5, 8], [N.B4, 8],
      [N.A4, 8], [N.Fs4, 8], [N.G4, 8], [N.Fs4, 8],
      [N.G4, 8], [N.B4, 8], [N.Fs4, 8], [N.D4, 8],
      [N.E4, 8], [N.Fs4, 8], [N.D4, 8], [N.B3, 8],
    ],
    bass: [
      [N.B3, 2], [N.B2, 2], [N.Fs3, 2], [N.B2, 2], [N.G3, 2], [N.G2, 2], [N.D3, 2], [N.G2, 2],
      [N.A3, 2], [N.A2, 2], [N.E3, 2], [N.A2, 2], [N.Fs3, 2], [N.Fs2, 2], [N.Cs3, 2], [N.Fs2, 2],
      [N.G2, 2], [N.G3, 2], [N.A2, 2], [N.A3, 2], [N.B2, 2], [N.B3, 2], [N.Fs2, 2], [N.Fs3, 2],
      [N.E2, 2], [N.E3, 2], [N.Fs2, 4], [N.B2, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'em_rayquaza',
    title: 'Rayquaza & Deoxys (Clash of Titans)',
    game: 'Pokémon Emerald',
    scene: 'battle',
    bpm: 176,
    leadInst: 'brass',
    lead: [
      [N.E5, 2], [N.G5, 2], [N.Bb5, 2], [N.Db6, 2], [N.C6, 2], [N.Bb5, 2], [N.Ab5, 2], [N.G5, 2],
      [N.E5, 4], [N.Bb5, 4], [N.A5, 2], [N.G5, 2], [N.E5, 4],
      [N.F5, 2], [N.Ab5, 2], [N.B5, 4], [N.C6, 2], [N.B5, 2], [N.Ab5, 4],
      [N.G5, 2], [N.Bb5, 2], [N.Db6, 4], [N.E6, 8],
      [N.D6, 4], [N.Bb5, 2], [N.G5, 2], [N.Ab5, 4], [N.F5, 4],
      [N.E5, 8], [N.REST, 8],
    ],
    harmony: [
      [N.G4, 8], [N.Bb4, 8], [N.Ab4, 8], [N.E4, 8],
      [N.F4, 8], [N.Ab4, 8], [N.G4, 8], [N.Db5, 8],
      [N.Bb4, 8], [N.G4, 8], [N.Ab4, 8], [N.E4, 8],
    ],
    bass: [
      [N.E3, 1], [N.E3, 1], [N.E3, 1], [N.E3, 1], [N.Bb2, 2], [N.G2, 2],
      [N.Ab2, 2], [N.F2, 2], [N.E2, 4],
      [N.F3, 1], [N.F3, 1], [N.Ab2, 2], [N.G2, 2], [N.Db3, 2],
      [N.E3, 2], [N.Bb2, 2], [N.E2, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['roll', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'fr_mewtwo',
    title: 'Mewtwo & Legendary Showdown',
    game: 'Pokémon FireRed',
    scene: 'battle',
    bpm: 168,
    leadInst: 'pulse',
    lead: [
      [N.C5, 2], [N.Eb5, 2], [N.Fs5, 4], [N.G5, 4], [N.Eb5, 2], [N.C5, 2],
      [N.B4, 4], [N.D5, 4], [N.F5, 4], [N.Ab5, 4],
      [N.G5, 2], [N.Eb5, 2], [N.C5, 4], [N.Ab4, 2], [N.C5, 2], [N.Eb5, 4],
      [N.D5, 4], [N.B4, 4], [N.C5, 8],
      [N.Eb5, 4], [N.G5, 4], [N.C6, 4], [N.B5, 4],
      [N.Ab5, 4], [N.F5, 4], [N.G5, 8],
      [N.Eb5, 2], [N.F5, 2], [N.G5, 4], [N.C5, 8],
    ],
    harmony: [
      [N.Eb4, 8], [N.G4, 8], [N.F4, 8], [N.D4, 8],
      [N.Eb4, 8], [N.C4, 8], [N.D4, 8], [N.B3, 8],
      [N.G4, 8], [N.C5, 8], [N.Ab4, 8], [N.G4, 8],
      [N.Eb4, 8], [N.F4, 8], [N.C4, 8], [N.C4, 8],
    ],
    bass: [
      [N.C3, 2], [N.C3, 2], [N.G2, 2], [N.C3, 2], [N.B2, 2], [N.B2, 2], [N.F2, 2], [N.B2, 2],
      [N.Ab2, 2], [N.Ab2, 2], [N.Eb2, 2], [N.Ab2, 2], [N.G2, 4], [N.B2, 4], [N.C3, 8],
      [N.C3, 2], [N.Eb3, 2], [N.G3, 2], [N.B2, 2], [N.Ab2, 2], [N.F2, 2], [N.G2, 8],
      [N.Eb2, 2], [N.F2, 2], [N.G2, 4], [N.C3, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
  {
    id: 'fr_victory_road',
    title: 'Victory Road (The Final March)',
    game: 'Pokémon FireRed / Emerald',
    scene: 'battle',
    bpm: 158,
    leadInst: 'brass',
    lead: [
      [N.D5, 4], [N.F5, 2], [N.G5, 2], [N.A5, 6], [N.Bb5, 2],
      [N.A5, 4], [N.F5, 4], [N.D5, 8],
      [N.G5, 4], [N.A5, 2], [N.Bb5, 2], [N.C6, 6], [N.D6, 2],
      [N.C6, 4], [N.A5, 4], [N.F5, 8],
      [N.D6, 4], [N.C6, 2], [N.Bb5, 2], [N.A5, 4], [N.G5, 4],
      [N.F5, 4], [N.E5, 4], [N.D5, 8],
      [N.A4, 4], [N.Cs5, 4], [N.D5, 8],
    ],
    harmony: [
      [N.F4, 8], [N.A4, 8], [N.F4, 8], [N.D4, 8],
      [N.G4, 8], [N.Bb4, 8], [N.A4, 8], [N.F4, 8],
      [N.Bb4, 8], [N.A4, 8], [N.G4, 8], [N.F4, 8],
      [N.E4, 8], [N.A4, 8], [N.F4, 8], [N.D4, 8],
    ],
    bass: [
      [N.D3, 2], [N.D3, 2], [N.A2, 2], [N.D3, 2], [N.F3, 2], [N.F3, 2], [N.C3, 2], [N.F3, 2],
      [N.G3, 2], [N.G3, 2], [N.D3, 2], [N.G3, 2], [N.A2, 2], [N.A2, 2], [N.E2, 2], [N.A2, 2],
      [N.Bb2, 2], [N.Bb2, 2], [N.F2, 2], [N.Bb2, 2], [N.A2, 2], [N.A2, 2], [N.D3, 4],
      [N.A2, 4], [N.Cs3, 4], [N.D3, 8],
    ],
    drums: [
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['hat', 2],
      ['kick', 2], ['hat', 2], ['snare', 2], ['crash', 2],
    ],
  },
]

/* ==========================================================================
   32-BIT ULTRA HIGH-DEFINITION POKÉMON AUDIO SYNTHESIZER ENGINE
   ========================================================================== */

export class PokemonAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private reverbSend: GainNode | null = null
  private currentScene: 'menu' | 'battle' = 'menu'
  private menuTrackIndex: number = 0
  private battleTrackIndex: number = 0
  private isPlaying: boolean = false
  private volume: number = 0.3 // 30% default volume to prevent jumpscares
  private stepTimer: number | null = null

  // 4-Channel Tracker Sequence State
  private leadIndex: number = 0
  private harmonyIndex: number = 0
  private bassIndex: number = 0
  private drumIndex: number = 0

  private leadWait: number = 0
  private harmonyWait: number = 0
  private bassWait: number = 0
  private drumWait: number = 0

  private noiseBuffer: AudioBuffer | null = null

  constructor(initialVolume: number = 0.3) {
    this.volume = Math.max(0, Math.min(1, initialVolume))
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new AudioCtx()

      // Master Gain for 0-100% Volume Bar
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)

      // 32-Bit Studio Master Dynamics Limiter
      this.compressor = this.ctx.createDynamicsCompressor()
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime)
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime)
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime)
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime)
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime)

      // 32-Bit Stereo Spatial Reverb Bus (Feedback Delay Network)
      this.reverbSend = this.ctx.createGain()
      this.reverbSend.gain.setValueAtTime(0.18, this.ctx.currentTime)

      const delayL = this.ctx.createDelay()
      delayL.delayTime.setValueAtTime(0.082, this.ctx.currentTime)
      const delayR = this.ctx.createDelay()
      delayR.delayTime.setValueAtTime(0.118, this.ctx.currentTime)

      const reverbFilter = this.ctx.createBiquadFilter()
      reverbFilter.type = 'lowpass'
      reverbFilter.frequency.setValueAtTime(2400, this.ctx.currentTime)

      const feedback = this.ctx.createGain()
      feedback.gain.setValueAtTime(0.32, this.ctx.currentTime)

      this.reverbSend.connect(delayL)
      this.reverbSend.connect(delayR)
      delayL.connect(reverbFilter)
      delayR.connect(reverbFilter)
      reverbFilter.connect(feedback)
      feedback.connect(delayL)
      feedback.connect(delayR)
      reverbFilter.connect(this.masterGain)

      this.compressor.connect(this.masterGain)
      this.masterGain.connect(this.ctx.destination)

      this.generateNoiseBuffer()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  private generateNoiseBuffer(): void {
    if (!this.ctx) return
    const length = Math.floor(this.ctx.sampleRate * 0.25)
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1
    }
    this.noiseBuffer = buffer
  }

  setVolume(volumeFraction: number): void {
    this.volume = Math.max(0, Math.min(1, volumeFraction))
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime)
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
      } catch {}
    }
  }

  getVolume(): number {
    return this.volume
  }

  getCurrentTrack(): TrackData {
    return this.currentScene === 'menu'
      ? MENU_TRACKS[this.menuTrackIndex % MENU_TRACKS.length]
      : BATTLE_TRACKS[this.battleTrackIndex % BATTLE_TRACKS.length]
  }

  getPlaylist(scene: 'menu' | 'battle' = this.currentScene): TrackData[] {
    return scene === 'menu' ? MENU_TRACKS : BATTLE_TRACKS
  }

  getTrackIndex(scene: 'menu' | 'battle' = this.currentScene): number {
    return scene === 'menu' ? this.menuTrackIndex : this.battleTrackIndex
  }

  playMenu(trackIndex?: number, randomize: boolean = false): void {
    this.currentScene = 'menu'
    if (trackIndex !== undefined) {
      this.menuTrackIndex = (trackIndex + MENU_TRACKS.length) % MENU_TRACKS.length
    } else if (randomize) {
      this.menuTrackIndex = Math.floor(Math.random() * MENU_TRACKS.length)
    }
    this.startTrack()
  }

  playBattle(trackIndex?: number, randomize: boolean = false): void {
    this.currentScene = 'battle'
    if (trackIndex !== undefined) {
      this.battleTrackIndex = (trackIndex + BATTLE_TRACKS.length) % BATTLE_TRACKS.length
    } else if (randomize) {
      this.battleTrackIndex = Math.floor(Math.random() * BATTLE_TRACKS.length)
    }
    this.startTrack()
  }

  nextTrack(): TrackData {
    if (this.currentScene === 'menu') {
      this.menuTrackIndex = (this.menuTrackIndex + 1) % MENU_TRACKS.length
    } else {
      this.battleTrackIndex = (this.battleTrackIndex + 1) % BATTLE_TRACKS.length
    }
    this.startTrack()
    return this.getCurrentTrack()
  }

  prevTrack(): TrackData {
    if (this.currentScene === 'menu') {
      this.menuTrackIndex = (this.menuTrackIndex - 1 + MENU_TRACKS.length) % MENU_TRACKS.length
    } else {
      this.battleTrackIndex = (this.battleTrackIndex - 1 + BATTLE_TRACKS.length) % BATTLE_TRACKS.length
    }
    this.startTrack()
    return this.getCurrentTrack()
  }

  stop(): void {
    this.isPlaying = false
    if (this.stepTimer !== null) {
      window.clearTimeout(this.stepTimer)
      this.stepTimer = null
    }
  }

  togglePlay(): boolean {
    if (this.isPlaying) {
      this.stop()
      return false
    } else {
      this.startTrack()
      return true
    }
  }

  isActive(): boolean {
    return this.isPlaying
  }

  private startTrack(): void {
    this.stop()
    this.isPlaying = true
    this.leadIndex = 0
    this.harmonyIndex = 0
    this.bassIndex = 0
    this.drumIndex = 0

    this.leadWait = 0
    this.harmonyWait = 0
    this.bassWait = 0
    this.drumWait = 0

    this.initContext()
    this.tick()
  }

  /* --------------------------------------------------------------------------
     32-BIT MULTI-VOICE HIGH-DEFINITION SYNTHESIZER VOICES
     -------------------------------------------------------------------------- */

  /** 32-Bit Spatial Stereo Routing to Master Bus + Reverb Send */
  private routeAudio(gain: GainNode, pan: number = 0, reverbAmount: number = 0.2): void {
    if (!this.ctx || !this.compressor) return

    const panner = (this.ctx as any).createStereoPanner ? (this.ctx as any).createStereoPanner() : null
    if (panner) {
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime)
      gain.connect(panner)
      panner.connect(this.compressor)
      if (this.reverbSend && reverbAmount > 0) {
        const send = this.ctx.createGain()
        send.gain.setValueAtTime(reverbAmount, this.ctx.currentTime)
        panner.connect(send)
        send.connect(this.reverbSend)
      }
    } else {
      gain.connect(this.compressor)
      if (this.reverbSend && reverbAmount > 0) {
        const send = this.ctx.createGain()
        send.gain.setValueAtTime(reverbAmount, this.ctx.currentTime)
        gain.connect(send)
        send.connect(this.reverbSend)
      }
    }
  }

  /** Voice 1: 32-Bit Lead (Detuned Triple-Oscillator Brass, Flute, Celesta Bells, Pulse) */
  private playLead(freq: number, durationMs: number, inst: TrackData['leadInst']): void {
    if (!this.ctx || !this.masterGain || freq <= 0 || this.volume <= 0.001) return

    try {
      const t = this.ctx.currentTime
      const durSec = Math.max(0.04, durationMs / 1000)

      if (inst === 'brass') {
        // 32-Bit DS/Sinnoh Brass: Triple detuned sawtooths + Sub-octave warmth + Resonant Filter
        const osc1 = this.ctx.createOscillator()
        const osc2 = this.ctx.createOscillator()
        const oscSub = this.ctx.createOscillator()
        const filter = this.ctx.createBiquadFilter()
        const gain = this.ctx.createGain()

        osc1.type = 'sawtooth'
        osc2.type = 'sawtooth'
        oscSub.type = 'sawtooth'

        osc1.frequency.setValueAtTime(freq, t)
        osc2.frequency.setValueAtTime(freq * 1.005, t)     // +8 cents detune for stereo thickness
        oscSub.frequency.setValueAtTime(freq * 0.5, t)     // Sub-octave fundamental for body

        // Gentle 5.5Hz Vibrato LFO
        const lfo = this.ctx.createOscillator()
        const lfoGain = this.ctx.createGain()
        lfo.frequency.setValueAtTime(5.5, t)
        lfoGain.gain.setValueAtTime(freq * 0.008, t)
        lfo.connect(lfoGain)
        lfoGain.connect(osc1.frequency)
        lfoGain.connect(osc2.frequency)
        lfo.start(t)
        lfo.stop(t + durSec)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(800, t)
        filter.frequency.exponentialRampToValueAtTime(3200, t + 0.03) // Dynamic brass bite
        filter.frequency.exponentialRampToValueAtTime(1800, t + durSec)
        filter.Q.setValueAtTime(3.2, t)

        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.24, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec * 0.95)

        osc1.connect(filter)
        osc2.connect(filter)
        oscSub.connect(filter)
        filter.connect(gain)
        this.routeAudio(gain, -0.15, 0.22)

        osc1.start(t)
        osc2.start(t)
        oscSub.start(t)
        osc1.stop(t + durSec)
        osc2.stop(t + durSec)
        oscSub.stop(t + durSec)
      } else if (inst === 'flute') {
        // 32-Bit Acoustic Woodwind: Dual Sine/Triangle + Breath transient + Vibrato
        const osc1 = this.ctx.createOscillator()
        const osc2 = this.ctx.createOscillator()
        const filter = this.ctx.createBiquadFilter()
        const gain = this.ctx.createGain()

        osc1.type = 'sine'
        osc2.type = 'triangle'
        osc1.frequency.setValueAtTime(freq, t)
        osc2.frequency.setValueAtTime(freq * 1.002, t)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(2600, t)

        const lfo = this.ctx.createOscillator()
        const lfoGain = this.ctx.createGain()
        lfo.frequency.setValueAtTime(5.2, t)
        lfoGain.gain.setValueAtTime(freq * 0.006, t)
        lfo.connect(lfoGain)
        lfoGain.connect(osc1.frequency)
        lfo.start(t)
        lfo.stop(t + durSec)

        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.26, t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec * 0.93)

        osc1.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)
        this.routeAudio(gain, -0.1, 0.28)

        osc1.start(t)
        osc2.start(t)
        osc1.stop(t + durSec)
        osc2.stop(t + durSec)
      } else if (inst === 'bell') {
        // 32-Bit Studio Celesta & Chimes: Dual-harmonic bell synthesis (f and 2.76f ratio)
        const osc1 = this.ctx.createOscillator()
        const osc2 = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc1.type = 'sine'
        osc2.type = 'sine'
        osc1.frequency.setValueAtTime(freq, t)
        osc2.frequency.setValueAtTime(freq * 2.76, t) // Acoustic inharmonic bell overtone

        gain.gain.setValueAtTime(0.25, t)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec * 0.96)

        osc1.connect(gain)
        osc2.connect(gain)
        this.routeAudio(gain, 0.15, 0.35)

        osc1.start(t)
        osc2.start(t)
        osc1.stop(t + durSec)
        osc2.stop(t + durSec)
      } else {
        // 32-Bit Antialiased Pulse
        const osc = this.ctx.createOscillator()
        const filter = this.ctx.createBiquadFilter()
        const gain = this.ctx.createGain()

        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, t)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(3600, t)

        gain.gain.setValueAtTime(0.22, t)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec * 0.92)

        osc.connect(filter)
        filter.connect(gain)
        this.routeAudio(gain, -0.12, 0.18)

        osc.start(t)
        osc.stop(t + durSec)
      }
    } catch {}
  }

  /** Voice 2: 32-Bit Lush Stereo Harmony Pad & Strings */
  private playHarmony(freq: number, durationMs: number): void {
    if (!this.ctx || !this.masterGain || freq <= 0 || this.volume <= 0.001) return

    try {
      const t = this.ctx.currentTime
      const durSec = Math.max(0.04, durationMs / 1000)
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc1.type = 'sawtooth'
      osc2.type = 'sawtooth'
      osc1.frequency.setValueAtTime(freq, t)
      osc2.frequency.setValueAtTime(freq * 1.006, t) // Lush stereo chorus spread

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1600, t)
      filter.Q.setValueAtTime(1.2, t)

      gain.gain.setValueAtTime(0.001, t)
      gain.gain.linearRampToValueAtTime(0.14, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec * 0.96)

      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gain)
      this.routeAudio(gain, 0.25, 0.26)

      osc1.start(t)
      osc2.start(t)
      osc1.stop(t + durSec)
      osc2.stop(t + durSec)
    } catch {}
  }

  /** Voice 3: 32-Bit Deep Analog Electric Bass */
  private playBass(freq: number, durationMs: number): void {
    if (!this.ctx || !this.masterGain || freq <= 0 || this.volume <= 0.001) return

    try {
      const t = this.ctx.currentTime
      const durSec = Math.max(0.04, durationMs / 1000)
      const osc = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      // Snappy pitch punch envelope on note attack
      osc.frequency.setValueAtTime(freq * 1.15, t)
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.015)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1200, t)
      filter.frequency.exponentialRampToValueAtTime(450, t + durSec * 0.6)
      filter.Q.setValueAtTime(2.0, t)

      gain.gain.setValueAtTime(0.38, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec * 0.92)

      osc.connect(filter)
      filter.connect(gain)
      this.routeAudio(gain, 0.0, 0.06) // Centered sub-bass

      osc.start(t)
      osc.stop(t + durSec)
    } catch {}
  }

  /** Voice 4: 32-Bit High-Definition Stereo Percussion */
  private playPercussion(type: DrumType, durationMs: number): void {
    if (!this.ctx || !this.masterGain || type === 'none' || this.volume <= 0.001) return

    try {
      const t = this.ctx.currentTime
      if (type === 'kick') {
        // 32-Bit Punchy Studio Kick Drum: Dual-stage pitch sweep
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(160, t)
        osc.frequency.exponentialRampToValueAtTime(54, t + 0.035)
        osc.frequency.exponentialRampToValueAtTime(28, t + 0.09)

        gain.gain.setValueAtTime(0.42, t)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11)

        osc.connect(gain)
        this.routeAudio(gain, 0.0, 0.06)
        osc.start(t)
        osc.stop(t + 0.11)
      } else if (type === 'snare') {
        // 32-Bit Snare: Multi-sample Noise Burst + Body tone transient
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = this.ctx.createBiquadFilter()
          filter.type = 'highpass'
          filter.frequency.setValueAtTime(1100, t)

          const noiseGain = this.ctx.createGain()
          noiseGain.gain.setValueAtTime(0.26, t)
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13)

          // Body transient oscillator
          const bodyOsc = this.ctx.createOscillator()
          const bodyGain = this.ctx.createGain()
          bodyOsc.type = 'triangle'
          bodyOsc.frequency.setValueAtTime(220, t)
          bodyOsc.frequency.exponentialRampToValueAtTime(110, t + 0.04)
          bodyGain.gain.setValueAtTime(0.18, t)
          bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)

          noise.connect(filter)
          filter.connect(noiseGain)
          bodyOsc.connect(bodyGain)

          const snareMaster = this.ctx.createGain()
          noiseGain.connect(snareMaster)
          bodyGain.connect(snareMaster)

          this.routeAudio(snareMaster, 0.08, 0.22)

          noise.start(t)
          bodyOsc.start(t)
          noise.stop(t + 0.13)
          bodyOsc.stop(t + 0.05)
        }
      } else if (type === 'hat') {
        // 32-Bit Metallic Stereo Hi-Hat
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = this.ctx.createBiquadFilter()
          filter.type = 'highpass'
          filter.frequency.setValueAtTime(7500, t)

          const gain = this.ctx.createGain()
          gain.gain.setValueAtTime(0.15, t)
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045)

          noise.connect(filter)
          filter.connect(gain)
          this.routeAudio(gain, -0.16, 0.12)

          noise.start(t)
          noise.stop(t + 0.045)
        }
      } else if (type === 'crash') {
        // 32-Bit Shimmering Crash Cymbal with Stereo Space
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = this.ctx.createBiquadFilter()
          filter.type = 'bandpass'
          filter.frequency.setValueAtTime(5500, t)
          filter.Q.setValueAtTime(1.5, t)

          const gain = this.ctx.createGain()
          gain.gain.setValueAtTime(0.32, t)
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)

          noise.connect(filter)
          filter.connect(gain)
          this.routeAudio(gain, 0.22, 0.45)

          noise.start(t)
          noise.stop(t + 0.42)
        }
      } else if (type === 'roll') {
        this.playPercussion('snare', durationMs)
      }
    } catch {}
  }

  /* --------------------------------------------------------------------------
     TRACKER STEP SEQUENCER TICK
     -------------------------------------------------------------------------- */

  private tick(): void {
    if (!this.isPlaying) return

    const track = this.getCurrentTrack()
    const tickDurationMs = (60 / track.bpm / 4) * 1000 // sixteenth note tick duration

    // Channel 1: Lead Melody
    if (this.leadWait <= 0 && track.lead.length > 0) {
      const [freq, durTicks] = track.lead[this.leadIndex % track.lead.length]
      if (freq > 0) {
        this.playLead(freq, durTicks * tickDurationMs, track.leadInst)
      }
      this.leadWait = durTicks
      this.leadIndex = (this.leadIndex + 1) % track.lead.length
    }
    this.leadWait -= 1

    // Channel 2: Harmony Pad & Counter-Melody
    if (this.harmonyWait <= 0 && track.harmony.length > 0) {
      const [freq, durTicks] = track.harmony[this.harmonyIndex % track.harmony.length]
      if (freq > 0) {
        this.playHarmony(freq, durTicks * tickDurationMs)
      }
      this.harmonyWait = durTicks
      this.harmonyIndex = (this.harmonyIndex + 1) % track.harmony.length
    }
    this.harmonyWait -= 1

    // Channel 3: Bassline
    if (this.bassWait <= 0 && track.bass.length > 0) {
      const [freq, durTicks] = track.bass[this.bassIndex % track.bass.length]
      if (freq > 0) {
        this.playBass(freq, durTicks * tickDurationMs)
      }
      this.bassWait = durTicks
      this.bassIndex = (this.bassIndex + 1) % track.bass.length
    }
    this.bassWait -= 1

    // Channel 4: Percussion
    if (this.drumWait <= 0 && track.drums.length > 0) {
      const [drumType, durTicks] = track.drums[this.drumIndex % track.drums.length]
      this.playPercussion(drumType, durTicks * tickDurationMs)
      this.drumWait = durTicks
      this.drumIndex = (this.drumIndex + 1) % track.drums.length
    }
    this.drumWait -= 1

    this.stepTimer = window.setTimeout(() => this.tick(), tickDurationMs)
  }
}
