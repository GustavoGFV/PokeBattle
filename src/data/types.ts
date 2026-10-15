export const ELEMENT_TYPES = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'] as const

export type ElementType = typeof ELEMENT_TYPES[number]

export interface TypeDefinition {
  label: string
  strongAgainst: ElementType[]
  notVeryEffectiveAgainst: ElementType[]
  noEffectAgainst: ElementType[]
  weakTo: ElementType[]
  resists: ElementType[]
  immuneTo: ElementType[]
}

type OffensiveChartRow = Pick<TypeDefinition, 'label' | 'strongAgainst' | 'notVeryEffectiveAgainst' | 'noEffectAgainst'>

const OFFENSIVE_CHART: Record<ElementType, OffensiveChartRow> = {
  Normal: { label: 'Steady force', strongAgainst: [], notVeryEffectiveAgainst: ['Rock', 'Steel'], noEffectAgainst: ['Ghost'] },
  Fire: { label: 'Open flame', strongAgainst: ['Grass', 'Ice', 'Bug', 'Steel'], notVeryEffectiveAgainst: ['Fire', 'Water', 'Rock', 'Dragon'], noEffectAgainst: [] },
  Water: { label: 'Deep current', strongAgainst: ['Fire', 'Ground', 'Rock'], notVeryEffectiveAgainst: ['Water', 'Grass', 'Dragon'], noEffectAgainst: [] },
  Electric: { label: 'Live voltage', strongAgainst: ['Water', 'Flying'], notVeryEffectiveAgainst: ['Electric', 'Grass', 'Dragon'], noEffectAgainst: ['Ground'] },
  Grass: { label: 'Wild growth', strongAgainst: ['Water', 'Ground', 'Rock'], notVeryEffectiveAgainst: ['Fire', 'Grass', 'Poison', 'Flying', 'Bug', 'Dragon', 'Steel'], noEffectAgainst: [] },
  Ice: { label: 'Frozen edge', strongAgainst: ['Grass', 'Ground', 'Flying', 'Dragon'], notVeryEffectiveAgainst: ['Fire', 'Water', 'Ice', 'Steel'], noEffectAgainst: [] },
  Fighting: { label: 'Close combat', strongAgainst: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'], notVeryEffectiveAgainst: ['Poison', 'Flying', 'Psychic', 'Bug', 'Fairy'], noEffectAgainst: ['Ghost'] },
  Poison: { label: 'Toxic touch', strongAgainst: ['Grass', 'Fairy'], notVeryEffectiveAgainst: ['Poison', 'Ground', 'Rock', 'Ghost'], noEffectAgainst: ['Steel'] },
  Ground: { label: 'Ground force', strongAgainst: ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'], notVeryEffectiveAgainst: ['Grass', 'Bug'], noEffectAgainst: ['Flying'] },
  Flying: { label: 'High wind', strongAgainst: ['Grass', 'Fighting', 'Bug'], notVeryEffectiveAgainst: ['Electric', 'Rock', 'Steel'], noEffectAgainst: [] },
  Psychic: { label: 'Mind force', strongAgainst: ['Fighting', 'Poison'], notVeryEffectiveAgainst: ['Psychic', 'Steel'], noEffectAgainst: ['Dark'] },
  Bug: { label: 'Wild swarm', strongAgainst: ['Grass', 'Psychic', 'Dark'], notVeryEffectiveAgainst: ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Steel', 'Fairy'], noEffectAgainst: [] },
  Rock: { label: 'Stone strike', strongAgainst: ['Fire', 'Ice', 'Flying', 'Bug'], notVeryEffectiveAgainst: ['Fighting', 'Ground', 'Steel'], noEffectAgainst: [] },
  Ghost: { label: 'Spectral force', strongAgainst: ['Psychic', 'Ghost'], notVeryEffectiveAgainst: ['Dark'], noEffectAgainst: ['Normal'] },
  Dragon: { label: 'Ancient force', strongAgainst: ['Dragon'], notVeryEffectiveAgainst: ['Steel'], noEffectAgainst: ['Fairy'] },
  Dark: { label: 'Night force', strongAgainst: ['Psychic', 'Ghost'], notVeryEffectiveAgainst: ['Fighting', 'Dark', 'Fairy'], noEffectAgainst: [] },
  Steel: { label: 'Forged edge', strongAgainst: ['Ice', 'Rock', 'Fairy'], notVeryEffectiveAgainst: ['Fire', 'Water', 'Electric', 'Steel'], noEffectAgainst: [] },
  Fairy: { label: 'Fey magic', strongAgainst: ['Fighting', 'Dragon', 'Dark'], notVeryEffectiveAgainst: ['Fire', 'Poison', 'Steel'], noEffectAgainst: [] },
}

export const TYPE_CHART: Record<ElementType, TypeDefinition> = Object.fromEntries(
  ELEMENT_TYPES.map((type) => [type, {
    ...OFFENSIVE_CHART[type],
    weakTo: ELEMENT_TYPES.filter((attacking) => OFFENSIVE_CHART[attacking].strongAgainst.includes(type)),
    resists: ELEMENT_TYPES.filter((attacking) => OFFENSIVE_CHART[attacking].notVeryEffectiveAgainst.includes(type)),
    immuneTo: ELEMENT_TYPES.filter((attacking) => OFFENSIVE_CHART[attacking].noEffectAgainst.includes(type)),
  }]),
) as Record<ElementType, TypeDefinition>

export function getCreatureTypes(primary: ElementType, secondary?: ElementType): ElementType[] {
  return secondary && secondary !== primary ? [primary, secondary] : [primary]
}

export function getTypeMultiplier(attacking: ElementType, defending: ElementType | readonly ElementType[]): number {
  const defendingTypes = Array.isArray(defending) ? defending : [defending]
  const attackType = OFFENSIVE_CHART[attacking]

  return defendingTypes.reduce((multiplier, defendingType) => {
    if (attackType.noEffectAgainst.includes(defendingType)) return 0
    if (attackType.strongAgainst.includes(defendingType)) return multiplier * 2
    if (attackType.notVeryEffectiveAgainst.includes(defendingType)) return multiplier * 0.5
    return multiplier
  }, 1)
}

export const TYPE_COLORS: Record<ElementType, string> = {
  Normal: '#a8a77a',
  Fire: '#ef4444',
  Water: '#3b82f6',
  Electric: '#facc15',
  Grass: '#48bb78',
  Ice: '#70ccdc',
  Fighting: '#c22e28',
  Poison: '#a33ea1',
  Ground: '#e2bf65',
  Flying: '#a98ff3',
  Psychic: '#f95587',
  Bug: '#a6b91a',
  Rock: '#b6a136',
  Ghost: '#735797',
  Dragon: '#6f35fc',
  Dark: '#705746',
  Steel: '#b7b7ce',
  Fairy: '#d685ad',
}

export function getTypeColor(type: ElementType): string {
  return TYPE_COLORS[type] ?? '#a8a77a'
}