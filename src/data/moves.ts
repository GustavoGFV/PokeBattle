import type { MoveDefinition } from '../domain/models.ts'
import { getTypeColor, type ElementType } from './types.ts'

const BASE_MOVES: Record<string, MoveDefinition> = {
  // --- NORMAL ---
  'tackle': { id: 'tackle', name: 'Tackle', type: 'Normal', category: 'physical', power: 15, range: 120, uses: 10, movement: { kind: 'dash', distance: 150, passesThrough: false }, animation: { kind: 'dash', color: getTypeColor('Normal') } },
  'quick-attack': { id: 'quick-attack', name: 'Quick Attack', type: 'Normal', category: 'physical', power: 18, range: 150, uses: 10, movement: { kind: 'dash', distance: 200, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Normal') } },
  'extreme-speed': { id: 'extreme-speed', name: 'Extreme Speed', type: 'Normal', category: 'physical', power: 26, range: 200, uses: 10, movement: { kind: 'dash', distance: 250, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Normal') } },
  'hyper-beam': { id: 'hyper-beam', name: 'Hyper Beam', type: 'Normal', category: 'special', power: 35, range: 400, uses: 10, knockbackScale: 0.5, animation: { kind: 'projectile', color: getTypeColor('Normal') } },
  'body-slam': { id: 'body-slam', name: 'Body Slam', type: 'Normal', category: 'physical', power: 23, range: 140, uses: 10, knockbackScale: 0.3, movement: { kind: 'dash', distance: 160, passesThrough: false }, animation: { kind: 'dash', color: getTypeColor('Normal') } },
  'skull-bash': { id: 'skull-bash', name: 'Skull Bash', type: 'Normal', category: 'physical', power: 24, range: 260, uses: 10, movement: { kind: 'dash', distance: 300, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Normal') } },
  'headbutt': { id: 'headbutt', name: 'Headbutt', type: 'Normal', category: 'physical', power: 21, range: 220, uses: 10, movement: { kind: 'dash', distance: 275, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Normal') } },
  'soothe': { id: 'soothe', name: 'Soothe', type: 'Normal', category: 'support', healing: 21, uses: 10, animation: { kind: 'burst', color: getTypeColor('Normal') } },
  'focus': { id: 'focus', name: 'Focus', type: 'Normal', category: 'support', uses: 10, effect: { stat: 'attack', stages: 1, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Normal') } },
  'swords-dance': { id: 'swords-dance', name: 'Swords Dance', type: 'Normal', category: 'support', uses: 10, effect: { stat: 'attack', stages: 2, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Normal') } },
  'double-edge': { id: 'double-edge', name: 'Double-Edge', type: 'Normal', category: 'physical', power: 30, range: 160, uses: 10, movement: { kind: 'dash', distance: 200, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Normal') } },
  'recover': { id: 'recover', name: 'Recover', type: 'Normal', category: 'support', healing: 40, uses: 10, animation: { kind: 'burst', color: getTypeColor('Normal') } },

  // --- FIRE ---
  'flamethrower': { id: 'flamethrower', name: 'Flamethrower', type: 'Fire', category: 'special', power: 24, range: 320, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Fire') } },
  'fire-blast': { id: 'fire-blast', name: 'Fire Blast', type: 'Fire', category: 'special', power: 30, range: 350, uses: 10, animation: { kind: 'burst', color: getTypeColor('Fire') } },
  'flare-blitz': { id: 'flare-blitz', name: 'Flare Blitz', type: 'Fire', category: 'physical', power: 28, range: 350, uses: 10, movement: { kind: 'dash', distance: 430, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Fire') } },
  'fire-punch': { id: 'fire-punch', name: 'Fire Punch', type: 'Fire', category: 'physical', power: 20, range: 100, uses: 10, knockbackScale: 0.2, animation: { kind: 'punch', color: getTypeColor('Fire') } },
  'fire-spin': { id: 'fire-spin', name: 'Fire Spin', type: 'Fire', category: 'special', power: 18, range: 280, uses: 10, animation: { kind: 'burst', color: getTypeColor('Fire') } },
  'ember-bolt': { id: 'ember-bolt', name: 'Ember Bolt', type: 'Fire', category: 'special', power: 21, range: 320, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Fire') } },
  'warm-up': { id: 'warm-up', name: 'Warm Up', type: 'Fire', category: 'support', uses: 10, effect: { stat: 'attack', stages: 1, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Fire') } },
  'flare-rush': { id: 'flare-rush', name: 'Flare Rush', type: 'Fire', category: 'physical', power: 25, range: 350, uses: 10, movement: { kind: 'dash', distance: 430, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Fire') } },
  'cinder-rest': { id: 'cinder-rest', name: 'Cinder Rest', type: 'Fire', category: 'support', healing: 22, uses: 10, animation: { kind: 'burst', color: getTypeColor('Fire') } },

  // --- WATER ---
  'hydro-pump': { id: 'hydro-pump', name: 'Hydro Pump', type: 'Water', category: 'special', power: 28, range: 340, uses: 10, knockbackScale: 0.3, animation: { kind: 'projectile', color: getTypeColor('Water') } },
  'surf': { id: 'surf', name: 'Surf', type: 'Water', category: 'special', power: 24, range: 300, uses: 10, animation: { kind: 'burst', color: getTypeColor('Water') } },
  'water-gun': { id: 'water-gun', name: 'Water Gun', type: 'Water', category: 'special', power: 17, range: 270, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Water') } },
  'aqua-tail': { id: 'aqua-tail', name: 'Aqua Tail', type: 'Water', category: 'physical', power: 22, range: 180, uses: 10, animation: { kind: 'burst', color: getTypeColor('Water') } },
  'aqua-jet': { id: 'aqua-jet', name: 'Aqua Jet', type: 'Water', category: 'physical', power: 18, range: 160, uses: 10, movement: { kind: 'dash', distance: 220, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Water') } },
  'tidal-arc': { id: 'tidal-arc', name: 'Tidal Arc', type: 'Water', category: 'special', power: 20, range: 300, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Water') } },
  'mist-mend': { id: 'mist-mend', name: 'Mist Mend', type: 'Water', category: 'support', healing: 27, uses: 10, animation: { kind: 'burst', color: getTypeColor('Water') } },
  'undertow': { id: 'undertow', name: 'Undertow', type: 'Water', category: 'special', power: 12, range: 220, uses: 10, effect: { stat: 'speed', stages: -1, target: 'opponent' }, animation: { kind: 'projectile', color: getTypeColor('Water') } },
  'bubble-bash': { id: 'bubble-bash', name: 'Bubble Bash', type: 'Water', category: 'physical', power: 16, range: 185, uses: 10, animation: { kind: 'burst', color: getTypeColor('Water') } },

  // --- GRASS ---
  'solar-beam': { id: 'solar-beam', name: 'Solar Beam', type: 'Grass', category: 'special', power: 30, range: 380, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Grass') } },
  'energy-ball': { id: 'energy-ball', name: 'Energy Ball', type: 'Grass', category: 'special', power: 24, range: 300, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Grass') } },
  'leaf-blade': { id: 'leaf-blade', name: 'Leaf Blade', type: 'Grass', category: 'physical', power: 24, range: 160, uses: 10, animation: { kind: 'slash', color: getTypeColor('Grass') } },
  'razor-leaf': { id: 'razor-leaf', name: 'Razor Leaf', type: 'Grass', category: 'special', power: 19, range: 280, uses: 10, animation: { kind: 'slash', color: getTypeColor('Grass') } },
  'vine-whip': { id: 'vine-whip', name: 'Vine Whip', type: 'Grass', category: 'physical', power: 18, range: 180, uses: 10, animation: { kind: 'slash', color: getTypeColor('Grass') } },
  'petal-blizzard': { id: 'petal-blizzard', name: 'Petal Blizzard', type: 'Grass', category: 'physical', power: 22, range: 290, uses: 10, animation: { kind: 'burst', color: getTypeColor('Grass') } },
  'synthesis': { id: 'synthesis', name: 'Synthesis', type: 'Grass', category: 'support', healing: 30, uses: 10, animation: { kind: 'burst', color: getTypeColor('Grass') } },
  'spore-mend': { id: 'spore-mend', name: 'Spore Mend', type: 'Grass', category: 'support', healing: 28, uses: 10, animation: { kind: 'burst', color: getTypeColor('Grass') } },
  'bark-shell': { id: 'bark-shell', name: 'Bark Shell', type: 'Grass', category: 'support', uses: 10, effect: { stat: 'defense', stages: 2, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Grass') } },
  'leaf-dart': { id: 'leaf-dart', name: 'Leaf Dart', type: 'Grass', category: 'special', power: 16, range: 290, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Grass') } },

  // --- ELECTRIC ---
  'thunderbolt': { id: 'thunderbolt', name: 'Thunderbolt', type: 'Electric', category: 'special', power: 24, range: 320, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Electric') } },
  'thunder': { id: 'thunder', name: 'Thunder', type: 'Electric', category: 'special', power: 30, range: 350, uses: 10, animation: { kind: 'burst', color: getTypeColor('Electric') } },
  'volt-tackle': { id: 'volt-tackle', name: 'Volt Tackle', type: 'Electric', category: 'physical', power: 28, range: 300, uses: 10, movement: { kind: 'dash', distance: 350, passesThrough: true }, knockbackScale: 0.4, animation: { kind: 'dash', color: getTypeColor('Electric') } },
  'thunder-punch': { id: 'thunder-punch', name: 'Thunder Punch', type: 'Electric', category: 'physical', power: 20, range: 100, uses: 10, animation: { kind: 'punch', color: getTypeColor('Electric') } },
  'spark-jab': { id: 'spark-jab', name: 'Spark Jab', type: 'Electric', category: 'physical', power: 19, range: 165, uses: 10, animation: { kind: 'slash', color: getTypeColor('Electric') } },
  'static-field': { id: 'static-field', name: 'Static Field', type: 'Electric', category: 'special', power: 22, range: 310, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Electric') } },
  'charge-up': { id: 'charge-up', name: 'Charge Up', type: 'Electric', category: 'support', uses: 10, effect: { stat: 'specialAttack', stages: 1, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Electric') } },
  'quick-current': { id: 'quick-current', name: 'Quick Current', type: 'Electric', category: 'special', power: 14, range: 270, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Electric') } },

  // --- FIGHTING ---
  'close-combat': { id: 'close-combat', name: 'Close Combat', type: 'Fighting', category: 'physical', power: 30, range: 110, uses: 10, knockbackScale: 0.3, animation: { kind: 'punch', color: getTypeColor('Fighting') } },
  'aura-sphere': { id: 'aura-sphere', name: 'Aura Sphere', type: 'Fighting', category: 'special', power: 24, range: 340, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Fighting') } },
  'mach-punch': { id: 'mach-punch', name: 'Mach Punch', type: 'Fighting', category: 'physical', power: 18, range: 120, uses: 10, movement: { kind: 'dash', distance: 180, passesThrough: false }, animation: { kind: 'punch', color: getTypeColor('Fighting') } },
  'dynamic-punch': { id: 'dynamic-punch', name: 'Dynamic Punch', type: 'Fighting', category: 'physical', power: 28, range: 90, uses: 10, knockbackScale: 0.5, animation: { kind: 'punch', color: getTypeColor('Fighting') } },
  'quick-jab': { id: 'quick-jab', name: 'Quick Jab', type: 'Fighting', category: 'physical', power: 16, range: 94, uses: 10, knockbackScale: 0.22, animation: { kind: 'punch', color: getTypeColor('Fighting') } },
  'cross-punch': { id: 'cross-punch', name: 'Cross Punch', type: 'Fighting', category: 'physical', power: 20, range: 100, uses: 10, knockbackScale: 0.26, animation: { kind: 'punch', color: getTypeColor('Fighting') } },
  'iron-fist': { id: 'iron-fist', name: 'Iron Fist', type: 'Fighting', category: 'physical', power: 27, range: 92, uses: 10, knockbackScale: 0.3, animation: { kind: 'punch', color: getTypeColor('Fighting') } },
  'fighter-guard': { id: 'fighter-guard', name: 'Guard Up', type: 'Fighting', category: 'support', uses: 10, effect: { stat: 'defense', stages: 1, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Fighting') } },

  // --- PSYCHIC ---
  'psychic': { id: 'psychic', name: 'Psychic', type: 'Psychic', category: 'special', power: 25, range: 320, uses: 10, animation: { kind: 'burst', color: getTypeColor('Psychic') } },
  'zen-headbutt': { id: 'zen-headbutt', name: 'Zen Headbutt', type: 'Psychic', category: 'physical', power: 22, range: 140, uses: 10, movement: { kind: 'dash', distance: 180, passesThrough: false }, animation: { kind: 'dash', color: getTypeColor('Psychic') } },
  'psycho-cut': { id: 'psycho-cut', name: 'Psycho Cut', type: 'Psychic', category: 'physical', power: 20, range: 250, uses: 10, animation: { kind: 'slash', color: getTypeColor('Psychic') } },
  'calm-mind': { id: 'calm-mind', name: 'Calm Mind', type: 'Psychic', category: 'support', uses: 10, effect: { stat: 'specialAttack', stages: 1, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Psychic') } },

  // --- DRAGON ---
  'dragon-claw': { id: 'dragon-claw', name: 'Dragon Claw', type: 'Dragon', category: 'physical', power: 23, range: 150, uses: 10, animation: { kind: 'slash', color: getTypeColor('Dragon') } },
  'dragon-pulse': { id: 'dragon-pulse', name: 'Dragon Pulse', type: 'Dragon', category: 'special', power: 25, range: 330, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Dragon') } },
  'outrage': { id: 'outrage', name: 'Outrage', type: 'Dragon', category: 'physical', power: 30, range: 180, uses: 10, movement: { kind: 'dash', distance: 220, passesThrough: true }, animation: { kind: 'burst', color: getTypeColor('Dragon') } },
  'draco-meteor': { id: 'draco-meteor', name: 'Draco Meteor', type: 'Dragon', category: 'special', power: 35, range: 380, uses: 10, animation: { kind: 'burst', color: getTypeColor('Dragon') } },
  'dragon-dance': { id: 'dragon-dance', name: 'Dragon Dance', type: 'Dragon', category: 'support', uses: 10, effect: { stat: 'speed', stages: 1, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Dragon') } },

  // --- GHOST ---
  'shadow-ball': { id: 'shadow-ball', name: 'Shadow Ball', type: 'Ghost', category: 'special', power: 23, range: 310, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Ghost') } },
  'shadow-claw': { id: 'shadow-claw', name: 'Shadow Claw', type: 'Ghost', category: 'physical', power: 20, range: 140, uses: 10, animation: { kind: 'slash', color: getTypeColor('Ghost') } },
  'shadow-sneak': { id: 'shadow-sneak', name: 'Shadow Sneak', type: 'Ghost', category: 'physical', power: 18, range: 200, uses: 10, movement: { kind: 'dash', distance: 260, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Ghost') } },

  // --- DARK ---
  'crunch': { id: 'crunch', name: 'Crunch', type: 'Dark', category: 'physical', power: 23, range: 120, uses: 10, animation: { kind: 'burst', color: getTypeColor('Dark') } },
  'dark-pulse': { id: 'dark-pulse', name: 'Dark Pulse', type: 'Dark', category: 'special', power: 24, range: 300, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Dark') } },
  'sucker-punch': { id: 'sucker-punch', name: 'Sucker Punch', type: 'Dark', category: 'physical', power: 20, range: 160, uses: 10, movement: { kind: 'dash', distance: 200, passesThrough: false }, animation: { kind: 'dash', color: getTypeColor('Dark') } },

  // --- GROUND & ROCK ---
  'earthquake': { id: 'earthquake', name: 'Earthquake', type: 'Ground', category: 'physical', power: 28, range: 280, uses: 10, knockbackScale: 0.4, animation: { kind: 'burst', color: getTypeColor('Ground') } },
  'earth-power': { id: 'earth-power', name: 'Earth Power', type: 'Ground', category: 'special', power: 24, range: 300, uses: 10, animation: { kind: 'burst', color: getTypeColor('Ground') } },
  'stone-edge': { id: 'stone-edge', name: 'Stone Edge', type: 'Rock', category: 'physical', power: 26, range: 250, uses: 10, animation: { kind: 'slash', color: getTypeColor('Rock') } },
  'rock-slide': { id: 'rock-slide', name: 'Rock Slide', type: 'Rock', category: 'physical', power: 22, range: 280, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Rock') } },
  'rock-slam': { id: 'rock-slam', name: 'Rock Slam', type: 'Rock', category: 'physical', power: 23, range: 195, uses: 10, animation: { kind: 'burst', color: getTypeColor('Rock') } },
  'stone-skin': { id: 'stone-skin', name: 'Stone Skin', type: 'Rock', category: 'support', uses: 10, effect: { stat: 'defense', stages: 2, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Rock') } },
  'dust-mend': { id: 'dust-mend', name: 'Dust Mend', type: 'Rock', category: 'support', healing: 19, uses: 10, animation: { kind: 'burst', color: getTypeColor('Rock') } },
  'fault-line': { id: 'fault-line', name: 'Fault Line', type: 'Ground', category: 'special', power: 21, range: 265, uses: 10, animation: { kind: 'burst', color: getTypeColor('Ground') } },

  // --- ICE ---
  'ice-beam': { id: 'ice-beam', name: 'Ice Beam', type: 'Ice', category: 'special', power: 24, range: 320, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Ice') } },
  'blizzard': { id: 'blizzard', name: 'Blizzard', type: 'Ice', category: 'special', power: 30, range: 360, uses: 10, animation: { kind: 'burst', color: getTypeColor('Ice') } },
  'ice-punch': { id: 'ice-punch', name: 'Ice Punch', type: 'Ice', category: 'physical', power: 20, range: 100, uses: 10, animation: { kind: 'punch', color: getTypeColor('Ice') } },

  // --- FLYING ---
  'brave-bird': { id: 'brave-bird', name: 'Brave Bird', type: 'Flying', category: 'physical', power: 28, range: 300, uses: 10, movement: { kind: 'dash', distance: 380, passesThrough: true }, animation: { kind: 'dash', color: getTypeColor('Flying') } },
  'hurricane': { id: 'hurricane', name: 'Hurricane', type: 'Flying', category: 'special', power: 28, range: 340, uses: 10, animation: { kind: 'burst', color: getTypeColor('Flying') } },
  'aerial-ace': { id: 'aerial-ace', name: 'Aerial Ace', type: 'Flying', category: 'physical', power: 20, range: 160, uses: 10, animation: { kind: 'slash', color: getTypeColor('Flying') } },
  'air-slash': { id: 'air-slash', name: 'Air Slash', type: 'Flying', category: 'special', power: 21, range: 300, uses: 10, animation: { kind: 'slash', color: getTypeColor('Flying') } },
  'wind-cut': { id: 'wind-cut', name: 'Wind Cut', type: 'Flying', category: 'special', power: 19, range: 305, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Flying') } },
  'tailwind': { id: 'tailwind', name: 'Tailwind', type: 'Flying', category: 'support', uses: 10, effect: { stat: 'speed', stages: 2, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Flying') } },
  'gust': { id: 'gust', name: 'Gust', type: 'Flying', category: 'special', power: 16, range: 275, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Flying') } },

  // --- STEEL & POISON & BUG & FAIRY ---
  'iron-tail': { id: 'iron-tail', name: 'Iron Tail', type: 'Steel', category: 'physical', power: 24, range: 140, uses: 10, animation: { kind: 'slash', color: getTypeColor('Steel') } },
  'flash-cannon': { id: 'flash-cannon', name: 'Flash Cannon', type: 'Steel', category: 'special', power: 23, range: 330, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Steel') } },
  'meteor-mash': { id: 'meteor-mash', name: 'Meteor Mash', type: 'Steel', category: 'physical', power: 26, range: 130, uses: 10, knockbackScale: 0.3, animation: { kind: 'punch', color: getTypeColor('Steel') } },
  'iron-defense': { id: 'iron-defense', name: 'Iron Defense', type: 'Steel', category: 'support', uses: 10, effect: { stat: 'defense', stages: 2, target: 'self' }, animation: { kind: 'burst', color: getTypeColor('Steel') } },
  
  'sludge-bomb': { id: 'sludge-bomb', name: 'Sludge Bomb', type: 'Poison', category: 'special', power: 24, range: 290, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Poison') } },
  'poison-jab': { id: 'poison-jab', name: 'Poison Jab', type: 'Poison', category: 'physical', power: 21, range: 110, uses: 10, animation: { kind: 'punch', color: getTypeColor('Poison') } },
  
  'x-scissor': { id: 'x-scissor', name: 'X-Scissor', type: 'Bug', category: 'physical', power: 22, range: 130, uses: 10, animation: { kind: 'slash', color: getTypeColor('Bug') } },
  'bug-buzz': { id: 'bug-buzz', name: 'Bug Buzz', type: 'Bug', category: 'special', power: 24, range: 280, uses: 10, animation: { kind: 'burst', color: getTypeColor('Bug') } },
  
  'moonblast': { id: 'moonblast', name: 'Moonblast', type: 'Fairy', category: 'special', power: 26, range: 320, uses: 10, animation: { kind: 'projectile', color: getTypeColor('Fairy') } },
  'play-rough': { id: 'play-rough', name: 'Play Rough', type: 'Fairy', category: 'physical', power: 24, range: 140, uses: 10, animation: { kind: 'burst', color: getTypeColor('Fairy') } }
}

// Map common move prefixes to element types
function guessType(moveId: string): ElementType {
  const m = moveId.toLowerCase()
  if (m.includes('thunder') || m.includes('volt') || m.includes('electro') || m.includes('spark') || m.includes('zap')) return 'Electric'
  if (m.includes('water') || m.includes('hydro') || m.includes('surf') || m.includes('aqua') || m.includes('bubble') || m.includes('liquid') || m.includes('tidal') || m.includes('mist')) return 'Water'
  if (m.includes('fire') || m.includes('flame') || m.includes('ember') || m.includes('blaze') || m.includes('heat') || m.includes('inferno') || m.includes('cinder')) return 'Fire'
  if (m.includes('grass') || m.includes('leaf') || m.includes('seed') || m.includes('solar') || m.includes('petal') || m.includes('giga') || m.includes('wood') || m.includes('bark') || m.includes('spore')) return 'Grass'
  if (m.includes('ice') || m.includes('blizzard') || m.includes('freeze') || m.includes('frost') || m.includes('glacier') || m.includes('icicle')) return 'Ice'
  if (m.includes('punch') || m.includes('kick') || m.includes('combat') || m.includes('chop') || m.includes('force') || m.includes('mach') || m.includes('fighter')) return 'Fighting'
  if (m.includes('poison') || m.includes('sludge') || m.includes('toxic') || m.includes('acid') || m.includes('gunk') || m.includes('venom')) return 'Poison'
  if (m.includes('earth') || m.includes('ground') || m.includes('mud') || m.includes('sand') || m.includes('dig') || m.includes('bone') || m.includes('fault')) return 'Ground'
  if (m.includes('rock') || m.includes('stone') || m.includes('boulder') || m.includes('meteor') || m.includes('dust')) return 'Rock'
  if (m.includes('fly') || m.includes('wing') || m.includes('aerial') || m.includes('air') || m.includes('drill') || m.includes('bird') || m.includes('wind') || m.includes('gust') || m.includes('tail')) return 'Flying'
  if (m.includes('psychic') || m.includes('psy') || m.includes('mind') || m.includes('zen') || m.includes('tele') || m.includes('confusion')) return 'Psychic'
  if (m.includes('shadow') || m.includes('ghost') || m.includes('spook') || m.includes('curse') || m.includes('nightmare') || m.includes('phantom')) return 'Ghost'
  if (m.includes('dragon') || m.includes('draco') || m.includes('outrage')) return 'Dragon'
  if (m.includes('dark') || m.includes('crunch') || m.includes('bite') || m.includes('sucker') || m.includes('foul') || m.includes('night')) return 'Dark'
  if (m.includes('steel') || m.includes('iron') || m.includes('metal') || m.includes('flash-cannon') || m.includes('gear')) return 'Steel'
  if (m.includes('fairy') || m.includes('moon') || m.includes('dazzl') || m.includes('charm') || m.includes('kiss')) return 'Fairy'
  if (m.includes('bug') || m.includes('scissor') || m.includes('leech') || m.includes('swarm') || m.includes('web')) return 'Bug'
  return 'Normal'
}

export const MOVES: Record<string, MoveDefinition> = new Proxy(BASE_MOVES, {
  get(target, prop: string) {
    if (prop in target) return target[prop]
    if (typeof prop !== 'string' || prop === 'then') return undefined

    const type = guessType(prop)
    const name = prop
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    const generated: MoveDefinition = {
      id: prop,
      name,
      type,
      category: 'special',
      power: 22,
      range: 280,
      uses: 10,
      animation: { kind: 'projectile', color: getTypeColor(type) },
    }
    target[prop] = generated
    return generated
  },
  has() {
    return true
  },
})