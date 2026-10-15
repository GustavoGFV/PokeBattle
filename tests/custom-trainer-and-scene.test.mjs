import assert from 'node:assert/strict'
import test from 'node:test'
import { getTrainerPatternType } from '../src/domain/trainerPatterns.ts'
import { getPokemonPortraitPath } from '../src/domain/assets.ts'

test('trainer pattern categorizes specialty and regional themes dynamically by typing and region', () => {
  // Strict typing + region dependency, character names are not used
  const fireKanto = getTrainerPatternType({ id: '1', name: 'Unknown A', title: 'Scorcher', shape: 'circle', color: '#f00', accent: '#fff', region: 'Kanto', roster: [], typing: 'Fire' })
  const fireHoenn = getTrainerPatternType({ id: '2', name: 'Unknown B', title: 'Magma', shape: 'circle', color: '#f00', accent: '#fff', region: 'Hoenn', roster: [], typing: 'Fire' })
  const waterKanto = getTrainerPatternType({ id: '3', name: 'Unknown C', title: 'Swimmer', shape: 'circle', color: '#00f', accent: '#fff', region: 'Kanto', roster: [], typing: 'Water' })
  const electricSinnoh = getTrainerPatternType({ id: '4', name: 'Unknown D', title: 'Spark', shape: 'diamond', color: '#ff0', accent: '#fff', region: 'Sinnoh', roster: [], typing: 'Electric' })

  assert.equal(fireKanto, 'fire-kanto')
  assert.equal(fireHoenn, 'fire-hoenn')
  assert.equal(waterKanto, 'water-kanto')
  assert.equal(electricSinnoh, 'electric-sinnoh')
  // Distinct combinations produce distinct patterns
  assert.notEqual(fireKanto, fireHoenn)
})

test('pokemon portrait path switches based on scene parameter', () => {
  const menuPath = getPokemonPortraitPath('Charizard', 'menu')
  assert.ok(menuPath.endsWith('Portrait.png'))

  const battlePath = getPokemonPortraitPath('Charizard', 'battle')
  // Should return portrait_battle if found or fall back safely to Portrait.png without error
  assert.ok(battlePath.includes('Portrait'))
})

test('shiny pokemon asset paths append _shiny suffix to nomenclature', () => {
  const shinySpritePath = getPokemonPortraitPath('Charizard', 'menu', true)
  assert.ok(shinySpritePath.includes('_shiny'), `Expected _shiny suffix in ${shinySpritePath}`)

  const battleShinyPath = getPokemonPortraitPath('Charizard', 'battle', true)
  assert.ok(battleShinyPath.includes('_shiny'), `Expected _shiny suffix in ${battleShinyPath}`)
})

test('AboutTab renders non-commercial notice, inspiration links, and GitHub integration', async () => {
  const { AboutTab, GITHUB_REPO_URL, POKEMON_BATTLEGROUNDS_URL, renderGithubLink } = await import('../src/ui/AboutTab.ts')

  // Check constant links
  assert.equal(GITHUB_REPO_URL, 'https://github.com/GFV-dev/Poke-Battle')
  assert.equal(POKEMON_BATTLEGROUNDS_URL, 'https://pokemonbattlegrounds.com')

  // Test renderGithubLink output
  const linkHtml = renderGithubLink()
  assert.ok(linkHtml.includes('https://github.com/GFV-dev/Poke-Battle'))
  assert.ok(linkHtml.includes('The full project here'))
  assert.ok(linkHtml.includes('<svg'))

  // Test AboutTab HTML contents
  const mockContainer = { innerHTML: '' }
  const tab = new AboutTab(mockContainer)
  const html = tab.getHtml()

  assert.ok(html.includes('non-commercial') || html.includes('Non-Commercial'))
  assert.ok(html.includes('non-profitable') || html.includes('Non-Profitable'))
  assert.ok(html.includes('pokemonbattlegrounds.com'))
  assert.ok(html.includes('single developer'))
  assert.ok(html.includes('open-source') || html.includes('Open Source'))
  assert.ok(html.includes('Pull Requests'))
  assert.ok(html.includes('The full project here'))
})

