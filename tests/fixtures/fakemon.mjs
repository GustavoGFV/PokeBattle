import { POKEMONS } from '../../src/data/pokemons.ts'

// Test-only creatures. Importing this module registers them in the shared registry for the
// current test process only; they are never part of the shipped game data or any UI list.
const FAKEMON = {
  cinderkit: {
    name: 'Cinderkit',
    type: 'Fire',
    stats: { hp: 120, speed: 90, defense: 50, attack: 85, specialDefense: 60, specialAttack: 80 },
    moves: ['flare-rush', 'ember-bolt', 'warm-up', 'cinder-rest'],
  },
  bramblet: {
    name: 'Bramblet',
    type: 'Grass',
    stats: { hp: 130, speed: 70, defense: 75, attack: 70, specialDefense: 80, specialAttack: 70 },
    moves: ['vine-whip', 'spore-mend', 'bark-shell', 'leaf-dart'],
  },
  brawlkin: {
    name: 'Brawlkin',
    type: 'Fighting',
    stats: { hp: 140, speed: 85, defense: 70, attack: 110, specialDefense: 70, specialAttack: 50 },
    moves: ['iron-fist', 'quick-jab', 'cross-punch', 'fighter-guard'],
  },
  flintbit: {
    name: 'Flintbit',
    type: 'Rock',
    stats: { hp: 125, speed: 65, defense: 90, attack: 85, specialDefense: 70, specialAttack: 60 },
    moves: ['rock-slam', 'stone-skin', 'dust-mend', 'fault-line'],
  },
  fawndle: {
    name: 'Fawndle',
    type: 'Flying',
    stats: { hp: 110, speed: 95, defense: 60, attack: 75, specialDefense: 65, specialAttack: 80 },
    moves: ['wind-cut', 'tailwind', 'gust', 'soothe'],
  },
}

for (const [id, data] of Object.entries(FAKEMON)) {
  POKEMONS[id] ??= { id, size: 1.0, region: 'Kanto', ...data }
}
