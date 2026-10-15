import './game.css'
import './menu.css'
import musicConfig from './data/music.json'
import { POKEMONS } from './data/pokemons.ts'
import { TRAINERS } from './data/trainers.ts'
import { getCreatureTypes, TYPE_CHART } from './data/types.ts'
import { BattleEngine, type BattleSetup } from './game/BattleEngine.ts'
import { loadScore, recordResult } from './game/score.ts'
import { ArenaRenderer, type ArenaTheme } from './ui/ArenaRenderer.ts'
import { MenuController } from './ui/MenuController.ts'
import { getTrainerSpritePath } from './domain/assets.ts'
import { MusicController } from './ui/MusicController.ts'

const app = document.querySelector<HTMLDivElement>('#app')!

const SESSION_MATCH_KEY = 'poke_match_count'
let matchCount = Math.max(1, Number(sessionStorage.getItem(SESSION_MATCH_KEY) || 1))

function formatMatch(num: number): string {
  return `MATCH ${String(num).padStart(2, '0')}`
}

app.innerHTML = `
  <header class="masthead">
    <a class="wordmark" href="#" aria-label="Poke Battle home">
      <span class="wordmark-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" fill="#0d1424"/>
          <path d="M 4 32 A 28 28 0 0 1 60 32 Z" fill="#ee1515"/>
          <path d="M 12 20 A 24 24 0 0 1 52 20 A 26 26 0 0 0 12 20 Z" fill="#ffffff" opacity="0.3"/>
          <path d="M 4 32 A 28 28 0 0 0 60 32 Z" fill="#f8fafc"/>
          <rect x="2" y="29" width="60" height="6" fill="#0d1424"/>
          <circle cx="32" cy="32" r="13" fill="#0d1424"/>
          <circle cx="32" cy="32" r="8" fill="#f8fafc" stroke="#233454" stroke-width="1.5"/>
          <circle cx="32" cy="32" r="4.5" fill="#f8fafc" stroke="#0d1424" stroke-width="1"/>
        </svg>
      </span>
      POKÉ BATTLE
    </a>
    <div class="masthead-meta" id="masthead-meta"><span class="live-indicator"></span> POKÉ LEAGUE <span class="meta-divider">/</span> ${formatMatch(matchCount)}</div>
    <div class="header-actions"><button id="return-menu" class="return-menu" type="button" hidden>ROSTER</button><div class="scoreboard" aria-label="Player match record"><span>RECORD</span><strong id="record">0 <i>W</i> / 0 <i>L</i></strong></div></div>
  </header>

  <div id="music-root"></div>

  <div id="menu-root"></div>

  <main class="battle-shell" id="battle-screen" hidden>
    <section class="battle-hud" aria-label="Battle status">
      <article class="combatant combatant--sun" id="sun-panel"></article>
      <div class="match-clock" aria-live="off">
        <span class="arena-info" id="arena-info">Arena: The Moss Court ✳</span>
        <span class="clock-label">ELAPSED</span>
        <strong id="timer">00:00</strong>
        <span class="round-label" id="phase-label">READY</span>
      </div>
      <article class="combatant combatant--moon" id="moon-panel"></article>
    </section>

    <section class="arena-wrap" aria-label="Battle arena">
      <div class="arena-rail"><span id="arena-title">FIELD 00 <b>/</b> THE MOSS COURT</span><span class="arena-weather" id="arena-weather">CLEAR SKIES <i>✳</i></span></div>
      <canvas id="arena" role="img" aria-label="Top-down arena showing both pokémons moving and battling"></canvas>
      <div class="arena-caption"><span>ROUND <b id="round-number">01</b></span><span>LIVE FIELD FEED <b class="feed-dot"></b></span></div>
      <div class="arena-finish-overlay" id="arena-finish-overlay" hidden>
        <h2 class="finish-title" id="finish-title">MATCH COMPLETED</h2>
        <p class="finish-subtitle" id="finish-subtitle">CHOOSE AN OPTION TO PROCEED</p>
        <div class="finish-actions">
          <button id="arena-continue-button" class="battle-button battle-button--continue" type="button"><span aria-hidden="true">▶</span> CONTINUE</button>
          <button id="arena-return-button" class="battle-button battle-button--return" type="button"><span aria-hidden="true">↩</span> RETURN TO MENU</button>
        </div>
      </div>
    </section>

    <section class="match-controls" aria-label="Match controls">
      <div class="control-copy"><span class="control-kicker">AUTONOMOUS DUEL</span><strong id="match-message">Six pokémons each. One field at a time.</strong></div>
      <div class="control-actions">
        <div class="speed-control" role="group" aria-label="Battle speed">
          <button class="speed-option is-selected" data-speed="1" aria-pressed="true">1×</button>
          <button class="speed-option" data-speed="2" aria-pressed="false">2×</button>
        </div>
        <button id="battle-button" class="battle-button" type="button"><span aria-hidden="true">▶</span> BEGIN BOUT</button>
        <button id="continue-button" class="battle-button battle-button--continue" type="button" hidden><span aria-hidden="true">▶</span> CONTINUE</button>
        <button id="end-return-button" class="battle-button battle-button--return" type="button" hidden><span aria-hidden="true">↩</span> RETURN TO MENU</button>
      </div>
    </section>

    <section class="battle-feed" aria-label="Battle history and lineup">
      <div class="feed-column">
        <div class="feed-header"><span class="feed-title">ACTION FIELD CALLS</span><span class="feed-count" id="feed-count">AWAITING FIRST CALL</span></div>
        <ol class="feed-list" id="battle-feed"></ol>
      </div>
      <div class="roster-overview">
        <div class="roster-panel">
          <div class="roster-header"><span>SUN BENCH</span></div>
          <ol class="roster-strip" id="sun-roster"></ol>
        </div>
        <div class="roster-panel">
          <div class="roster-header"><span>MOON BENCH</span></div>
          <ol class="roster-strip" id="moon-roster"></ol>
        </div>
      </div>
    </section>
  </main>
`

const trainers = TRAINERS
const menuRoot = document.querySelector<HTMLElement>('#menu-root')!
const battleScreen = document.querySelector<HTMLElement>('#battle-screen')!
const returnMenuButton = document.querySelector<HTMLButtonElement>('#return-menu')!
const music = new MusicController(document.querySelector<HTMLElement>('#music-root')!, musicConfig)
const canvas = document.querySelector<HTMLCanvasElement>('#arena')!
const renderer = new ArenaRenderer(canvas)
let engine = new BattleEngine()
const battleButton = document.querySelector<HTMLButtonElement>('#battle-button')!
const continueButton = document.querySelector<HTMLButtonElement>('#continue-button')!
const endReturnButton = document.querySelector<HTMLButtonElement>('#end-return-button')!
const arenaFinishOverlay = document.querySelector<HTMLElement>('#arena-finish-overlay')!
const finishTitle = document.querySelector<HTMLElement>('#finish-title')!
const finishSubtitle = document.querySelector<HTMLElement>('#finish-subtitle')!
const arenaContinueButton = document.querySelector<HTMLButtonElement>('#arena-continue-button')!
const arenaReturnButton = document.querySelector<HTMLButtonElement>('#arena-return-button')!
const arenaTitle = document.querySelector<HTMLElement>('#arena-title')
const arenaWeather = document.querySelector<HTMLElement>('#arena-weather')
const arenaInfo = document.querySelector<HTMLElement>('#arena-info')
function updateMatchHeader(matchNum: number = matchCount): void {
  const meta = document.querySelector<HTMLElement>('#masthead-meta')
  if (meta) {
    meta.innerHTML = `<span class="live-indicator"></span> POKÉ LEAGUE <span class="meta-divider">/</span> ${formatMatch(matchNum)}`
  }
}

function updateArenaThemeUI(theme: ArenaTheme, matchNum: number = matchCount): void {
  if (arenaTitle) {
    arenaTitle.innerHTML = `FIELD ${String(matchNum).padStart(2, '0')} <b>/</b> ${theme.name.toUpperCase()}`
  }
  if (arenaWeather) {
    arenaWeather.innerHTML = `${theme.weather.toUpperCase()} <i>${theme.weatherIcon}</i>`
  }
  if (arenaInfo) {
    arenaInfo.textContent = `Arena: ${theme.name} ${theme.weatherIcon}`
  }
}
updateMatchHeader(matchCount)
updateArenaThemeUI(renderer.getCurrentTheme(), matchCount)

let currentSetup: BattleSetup = {
  sun: trainers[0] ?? {
    id: 'sun',
    name: 'Red',
    title: 'CHAMPION',
    shape: 'circle',
    color: '#e53e3e',
    accent: '#f6e05e',
    sprite: 'Red',
    region: 'Kanto',
    roster: ['charizard', 'blastoise', 'venusaur'],
  },
  moon: trainers[1] ?? {
    id: 'moon',
    name: 'Blue',
    title: 'RIVAL',
    shape: 'square',
    color: '#3182ce',
    accent: '#90cdf4',
    sprite: 'Blue',
    region: 'Kanto',
    roster: ['blastoise', 'charizard', 'venusaur'],
  },
}

const timerElement = document.querySelector<HTMLElement>('#timer')!
const phaseElement = document.querySelector<HTMLElement>('#phase-label')!
const recordElement = document.querySelector<HTMLElement>('#record')!
const matchMessage = document.querySelector<HTMLElement>('#match-message')!
const feedElement = document.querySelector<HTMLOListElement>('#battle-feed')!
const feedCount = document.querySelector<HTMLElement>('#feed-count')!
const speedOptions = [...document.querySelectorAll<HTMLButtonElement>('.speed-option')]
let speed = 1
let lastFrame = 0
let lastHudUpdate = 0
let lastRenderedLog = 0
let resultRecorded = false

const record = loadScore()
recordElement.innerHTML = `${record.wins} <i>W</i> / ${record.losses} <i>L</i>`
const menu = new MenuController(menuRoot, trainers, renderer, startMatch)
menu.render()
renderRosters()
renderHud()
renderFeed()

function returnToMenu(): void {
  engine.pause()
  battleScreen.hidden = true
  menuRoot.hidden = false
  returnMenuButton.hidden = true
  arenaFinishOverlay.hidden = true
  document.body.classList.remove('in-match')
  matchCount = 1
  sessionStorage.setItem(SESSION_MATCH_KEY, '1')
  updateMatchHeader(matchCount)
  music.showMenu()
  window.scrollTo({ top: 0, behavior: 'auto' })
  menu.render()
}

function continueMatch(): void {
  const player = currentSetup.sun
  const candidates = trainers.filter((c) => c.id !== player.id)
  const pool = candidates.length > 0 ? candidates : trainers
  const nonCurrent = pool.filter((c) => c.id !== currentSetup.moon.id)
  const finalPool = nonCurrent.length > 0 ? nonCurrent : pool
  const randomOpponent = finalPool[Math.floor(Math.random() * finalPool.length)]

  const nextSetup: BattleSetup = {
    sun: { ...player, roster: [...player.roster], customMoves: player.customMoves ? { ...player.customMoves } : undefined },
    moon: { ...randomOpponent, roster: [...randomOpponent.roster] },
  }
  matchCount += 1
  sessionStorage.setItem(SESSION_MATCH_KEY, String(matchCount))
  startMatch(nextSetup, true)
}

returnMenuButton.addEventListener('click', returnToMenu)
endReturnButton.addEventListener('click', returnToMenu)
arenaReturnButton.addEventListener('click', returnToMenu)

continueButton.addEventListener('click', continueMatch)
arenaContinueButton.addEventListener('click', continueMatch)

battleButton.addEventListener('click', () => {
  if (engine.state.phase === 'running') {
    engine.pause()
  } else if (engine.state.phase === 'paused') {
    engine.resume()
  } else if (engine.state.phase === 'ready') {
    engine.start()
  } else if (engine.state.phase === 'entrance') {
    engine.skipEntrance()
  } else {
    arenaFinishOverlay.hidden = true
    continueButton.hidden = true
    endReturnButton.hidden = true
    const theme = renderer.paintBackdrop()
    matchCount += 1
    sessionStorage.setItem(SESSION_MATCH_KEY, String(matchCount))
    updateMatchHeader(matchCount)
    updateArenaThemeUI(theme, matchCount)
    engine.restart()
    engine.start()
    resultRecorded = false
    lastRenderedLog = 0
  }
  renderHud()
})

for (const option of speedOptions) {
  option.addEventListener('click', () => {
    speed = Number(option.dataset.speed)
    for (const button of speedOptions) {
      const selected = button === option
      button.classList.toggle('is-selected', selected)
      button.setAttribute('aria-pressed', String(selected))
    }
  })
}

document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now()
})

function startMatch(setup: BattleSetup, isContinuation = false): void {
  currentSetup = setup
  const theme = renderer.paintBackdrop()
  if (!isContinuation) {
    matchCount = 1
    sessionStorage.setItem(SESSION_MATCH_KEY, '1')
  }
  updateMatchHeader(matchCount)
  updateArenaThemeUI(theme, matchCount)
  engine = new BattleEngine(Math.random, setup)
  engine.start()
  resultRecorded = false
  lastRenderedLog = 0
  menuRoot.hidden = true
  battleScreen.hidden = false
  returnMenuButton.hidden = false
  arenaFinishOverlay.hidden = true
  continueButton.hidden = true
  endReturnButton.hidden = true
  document.body.classList.add('in-match')
  if (!isContinuation) {
    music.showBattle(false)
  }
  window.scrollTo({ top: 0, behavior: 'auto' })
  renderRosters()
  renderHud()
  renderFeed()
}

function renderRosters(): void {
  const teams = [
    { selector: '#sun-roster', ids: engine.state.teams.sun.roster, team: engine.state.teams.sun },
    { selector: '#moon-roster', ids: engine.state.teams.moon.roster, team: engine.state.teams.moon },
  ]

  for (const { selector, ids, team } of teams) {
    const list = document.querySelector<HTMLOListElement>(selector)!
    list.innerHTML = ids
      .map((id, index) => {
        const pokemon = POKEMONS[id]
        if (!pokemon) return ''
        const typeTags = getCreatureTypes(pokemon.type, pokemon.secondaryType)
          .map((type) => `<span class="roster-type type-${type.toLowerCase()}">${type}</span>`)
          .join('')
        return `<li class="roster-creature" data-side="${team.side}" data-index="${index}"><span class="roster-order">0${index + 1}</span><span class="roster-name">${pokemon.name}</span><span class="roster-types">${typeTags}</span></li>`
      })
      .join('')
  }
}

function renderHud(): void {
  renderCombatant('sun')
  renderCombatant('moon')

  const minutes = Math.floor(engine.state.elapsedMs / 60000)
  const seconds = Math.floor((engine.state.elapsedMs % 60000) / 1000)
  timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  phaseElement.textContent = engine.state.phase.toUpperCase()

  if (engine.state.phase === 'ready') {
    battleButton.innerHTML = '<span aria-hidden="true">▶</span> BEGIN BOUT'
    matchMessage.textContent = 'Six pokémons each. One field at a time.'
    continueButton.hidden = true
    endReturnButton.hidden = true
    arenaFinishOverlay.hidden = true
  } else if (engine.state.phase === 'entrance') {
    battleButton.innerHTML = '<span aria-hidden="true">»</span> SKIP ENTRANCE'
    matchMessage.textContent = 'The challengers are taking their marks.'
    continueButton.hidden = true
    endReturnButton.hidden = true
    arenaFinishOverlay.hidden = true
  } else if (engine.state.phase === 'running') {
    battleButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> PAUSE MATCH'
    matchMessage.textContent = 'The field is live. Matchups decide the tempo.'
    continueButton.hidden = true
    endReturnButton.hidden = true
    arenaFinishOverlay.hidden = true
  } else if (engine.state.phase === 'paused') {
    battleButton.innerHTML = '<span aria-hidden="true">▶</span> RESUME MATCH'
    matchMessage.textContent = 'Match paused. The field is holding.'
    continueButton.hidden = true
    endReturnButton.hidden = true
    arenaFinishOverlay.hidden = true
  } else {
    battleButton.innerHTML = '<span aria-hidden="true">↻</span> RUN IT BACK'
    const winnerName =
      engine.state.winner === 'draw'
        ? 'EVEN FIELD'
        : `${engine.state.teams[engine.state.winner!].trainer.name} Wins!`
    matchMessage.textContent = winnerName

    continueButton.hidden = false
    endReturnButton.hidden = false
    arenaFinishOverlay.hidden = false
    finishTitle.textContent = winnerName
    finishSubtitle.textContent =
      engine.state.winner === 'sun'
        ? 'VICTORY ACHIEVED · PROCEED TO NEXT TRAINER'
        : engine.state.winner === 'moon'
        ? 'DEFEAT · CONTINUE OR RETURN TO MENU'
        : 'EVEN BOUT · CONTINUE OR RETURN TO MENU'
  }

  document.querySelector('#round-number')!.textContent = String(
    Math.min(engine.state.teams.sun.index, engine.state.teams.moon.index) + 1,
  ).padStart(2, '0')

  for (const side of ['sun', 'moon'] as const) {
    const list = document.querySelector<HTMLOListElement>(side === 'sun' ? '#sun-roster' : '#moon-roster')!
    for (const item of [...list.children]) {
      const index = Number((item as HTMLElement).dataset.index)
      item.classList.toggle('is-active', index === engine.state.teams[side].index && engine.state.phase !== 'ended')
      item.classList.toggle('is-defeated', index < engine.state.teams[side].index)
    }
  }
}

function renderCombatant(side: 'sun' | 'moon'): void {
  const team = engine.state.teams[side]
  const pokemon = POKEMONS[team.active.pokemonId || team.active.creatureId]
  if (!pokemon) return
  const hpPercent = Math.max(0, (team.active.hp / pokemon.stats.hp) * 100)
  const panel = document.querySelector<HTMLElement>(side === 'sun' ? '#sun-panel' : '#moon-panel')!
  const trainer = team.trainer || team.competitor
  const pokemonTypes = getCreatureTypes(pokemon.type, pokemon.secondaryType)
  const typeTags = pokemonTypes.map((type) => `<span class="type-tag type-${type.toLowerCase()}">${type}</span>`).join('')
  const typeDescription = pokemonTypes.map((type) => TYPE_CHART[type].label).join(' / ')
  const trainerName = trainer.sprite || (trainer.id === 'red' ? 'Red' : null)
  const trainerHtml = trainerName
    ? `<span class="trainer" style="padding:0;overflow:hidden;background:#18241f;"><img src="${getTrainerSpritePath(trainerName, 'Portrait')}" alt="${escapeHtml(trainer.name)}" style="width:100%;height:100%;object-fit:cover;image-rendering:pixelated;" onerror="this.style.display='none'" /></span>`
    : `<span class="trainer trainer--${trainer.shape}" style="--competitor-color:${trainer.color};--competitor-accent:${trainer.accent}" aria-label="${escapeHtml(trainer.name)}"></span>`
  const playerName = `${escapeHtml(trainer.name.toUpperCase())} / ${escapeHtml(trainer.title)}`
  const alignment = side === 'sun' ? 'panel-copy' : 'panel-copy panel-copy--right'
  const portrait = side === 'sun' ? 'portrait-sun' : 'portrait-moon'

  const portraitCanvasHtml = `<canvas class="creature-portrait" id="${portrait}" width="96" height="96" role="img" aria-label="${pokemon.name}, ${pokemonTypes.join(' and ')} type"></canvas>`
  const statsCopyHtml = `
    <div class="${alignment}">
      <div class="competitor-name">${playerName}</div>
      <div class="creature-title"><h1>${pokemon.name}</h1></div>
      <div class="creature-types">${typeTags}<span class="type-note">${typeDescription}</span></div>
      <div class="health-track" role="meter" aria-label="${pokemon.name} health" aria-valuemin="0" aria-valuemax="${pokemon.stats.hp}" aria-valuenow="${team.active.hp}"><span style="width:${hpPercent}%"></span></div>
      <div class="health-meta"><span>VITALS</span><strong>${Math.max(0, team.active.hp)} <i>/</i> ${pokemon.stats.hp}</strong></div>
    </div>
  `

  panel.innerHTML = side === 'sun'
    ? `${trainerHtml}${statsCopyHtml}${portraitCanvasHtml}`
    : `${portraitCanvasHtml}${statsCopyHtml}${trainerHtml}`

  const portraitCanvas = document.querySelector<HTMLCanvasElement>(`#${portrait}`)!
  renderer.drawPortrait(portraitCanvas, pokemon, 'battle')
}

function renderFeed(): void {
  const logEntries = engine.state.log
  feedElement.innerHTML = logEntries
    .map((entry) => `<li><span class="feed-time">${formatTime(entry.time)}</span><span>${escapeHtml(entry.message)}</span></li>`)
    .join('')
  feedCount.textContent = logEntries.length ? `${logEntries.length} FIELD CALLS` : 'AWAITING FIRST CALL'
  feedElement.scrollTop = feedElement.scrollHeight
}

function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function animate(now: number): void {
  const delta = lastFrame === 0 ? 0 : Math.min(now - lastFrame, 80)
  lastFrame = now

  if (speed === 2) {
    engine.update(delta)
    engine.update(delta)
  } else {
    engine.update(delta)
  }

  if (now - lastHudUpdate >= 50) {
    lastHudUpdate = now
    renderHud()
  }

  if (engine.state.log.length !== lastRenderedLog) {
    lastRenderedLog = engine.state.log.length
    renderFeed()
  }

  if (engine.state.phase === 'ended' && !resultRecorded) {
    resultRecorded = true
    const updated = recordResult(engine.state.winner ?? 'draw')
    recordElement.innerHTML = `${updated.wins} <i>W</i> / ${updated.losses} <i>L</i>`
  }

  renderer.render(engine.state, now)
  requestAnimationFrame(animate)
}

requestAnimationFrame(animate)
