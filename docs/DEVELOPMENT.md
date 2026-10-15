# Field Circuit Development Guide

This guide describes the current architecture and the contracts to follow when adding creatures, moves, types, competitors, or sprite animations.

## Start and Verify

Use Node.js 22.12 or newer.

```sh
npm install
npm run dev
npm test
npm run build
```

The game runs entirely in the browser. Only match wins, losses, and draws are written to local storage; there is no backend or network save.

## Architecture

| Location | Responsibility |
| --- | --- |
| `src/data/` | Pokémon (`Dex/*.json` loaded by `pokemons.ts`), move, type, and trainer definitions |
| `src/domain/models.ts` | Shared battle and content types |
| `src/domain/combat.ts` | Move choice, damage, effectiveness, and stat effects |
| `src/domain/assets.ts` | Sprite/portrait path resolution (O(1) indexed Vite globs) and `AnimData.xml` parsing |
| `src/domain/sprites.ts` | Pixel-sprite validation, frame fallback, and playback duration |
| `src/game/BattleEngine.ts` | Match state, movement, actions, and results |
| `src/game/arena.ts` | World bounds, challenger marks, entrance timings, `clampToArena` |
| `src/game/score.ts` / `storage.ts` | Safe local match-record and custom-trainer persistence |
| `src/ui/MenuController.ts` | Trainer selection and team editing |
| `src/ui/ArenaRenderer.ts` | Canvas drawing, sprite-sheet cropping, ground anchoring, and attack visuals |
| `src/main.ts` | Connects menu, battle engine, HUD, and animation loop |
| `tests/` | Combat, data-integrity, lifecycle, and sprite-contract tests |
| `tests/fixtures/` | Test-only mock creatures (never part of the shipped data) |

Keep rules and content out of rendering code. Keep browser APIs out of pure domain helpers so they can be tested directly with Node.

## Battle Flow

The engine moves through `ready`, `entrance`, `running`, `paused`, and `ended`. During `entrance`, trainers walk to their marks (`TRAINER_ARRIVAL_MS`); Pokémon stay unspawned until then and appear with a summon effect before the match starts (`ENTRANCE_DURATION_MS`). `BattleEngine.update(deltaMs)` advances simulation and animation clocks while running. Combat actions are resolved at a fixed interval and ordered by adjusted speed. Pokémon positions are clamped to `ARENA` every tick, and creatures always face their opponent horizontally.

Each move has a finite use count and may define `power`, `healing`, `effect`, `range`, `movement`, and `animation`. The AI filters attacks by range, then scores healing, useful effects, type effectiveness, and move strength. Knockback is controlled per move with `knockbackScale`.

## Types and Dual Typing

`src/data/types.ts` contains the 18 type definitions. The offensive chart is the source of truth: `strongAgainst`, `notVeryEffectiveAgainst`, and `noEffectAgainst`. Weaknesses, resistances, and immunities are derived from those rows to avoid maintaining duplicate matchup tables.

A creature's `type` is its primary type; optional `secondaryType` adds a second defensive multiplier. `getTypeMultiplier` multiplies effectiveness across defending types. Thus weakness × weakness is 4×, weakness × resistance is 1×, double resistance is 0.25×, and any immunity makes the result 0×. `calculateDamage` preserves immunity as zero instead of applying the minimum damage floor.

## Menu Screens and Localization

`MenuController` owns four tabs (trainers, about, credits, updates). Static text goes through `t()` from `src/utils/i18n.ts`; add keys to `language-en.ts` and `language-pt.ts` (a missing Portuguese key fails `tsc`). Release notes live in `src/data/updates.ts` and contributors in `src/data/contributors.ts`.

## Sound Effects

`src/game/sfx.ts` synthesizes per-type hit blips (`HIT_PROFILES`) and the summon/start/victory/defeat cues (`CUES`) with WebAudio. `BattleEngine` stores `type` and `critical` on `state.lastImpact`; `main.ts` `playBattleSounds` plays each cue once per phase/impact change. It is separate from the music player and does nothing if WebAudio is unavailable.

## Future Releases

`UpdatesTab` fetches `future-releases.json` (repo root, `main` branch, via raw.githubusercontent.com) through `src/data/futureReleases.ts`. Keep the file valid JSON; items missing a `title` are skipped.

## Add Content

### Creature

Add an entry to the matching `src/data/Dex/<region>_pokemons.json` (unique `id`, primary `type`, optional `secondaryType`, all six stats, up to four move IDs). Add a sprite folder under `src/data/PokemonSprites/<Name>/` with `Walk-Anim.png`, `Attack-Anim.png`, `Faint-Anim.png`, `Portrait.png`, and `AnimData.xml`. Trainer rosters in `src/data/TrainerSprites/TrainerList.json` must reference existing creatures. Never add test mocks to `src/data/`; put them in `tests/fixtures/`.

### Move

Add a `MoveDefinition` to `src/data/moves.ts` and assign its ID to a creature. Set a valid type and positive integer `uses`. Damage moves should define `power` and `range`; healing moves define `healing`; buffs/debuffs define `effect`. Dashes use `movement`, and custom impact visuals use `animation`. A punch can set `animation.kind: 'punch'` and a reduced `knockbackScale`.

### Type

Add the type name to `ELEMENT_TYPES` and one offensive row to `OFFENSIVE_CHART` in `src/data/types.ts`. Add its effectiveness relationships there once; defensive lists are derived. Update the type palette in `src/game.css` and add tests for both outgoing and incoming matchups.

### Competitor

Add an entry to `src/data/TrainerSprites/TrainerList.json` with a name, region, and six valid creature names. The roster desk renders trainers in order and appends the Custom card automatically.

## Sprite Animation Contract

Pokémon use PMD sprite sheets: `Walk-Anim.png`, `Attack-Anim.png`, and `Faint-Anim.png` with eight direction rows (down, down-right, right, up-right, up, up-left, left, down-left). `AnimData.xml` is parsed by `fast-xml-parser` in `assets.ts`; `FrameWidth`, `FrameHeight`, and `Duration` values are positive numbers (one duration tick = 40 ms) and `<CopyOf>` chains are resolved recursively. The renderer crops frames from those dimensions, clamps the source rectangle to the image, and anchors every animation to the foot position measured from the Walk sheet. Without any sheet, the optional pixel-grid `PixelSprite` below is used as a fallback.

A `PixelSprite` has base `rows`, `body`, and `accent` values. Rows must have equal width and use only these symbols:

- `.`: transparent
- `1`: outline
- `2`: body color
- `3`: accent color
- `E`: eye

Colors must be six-digit hex values. Every frame in one animation sequence must use the same width and height. `validateSpriteDefinition` checks the base frame, animation names, directions, rows, colors, frame sizes, loop values, and positive frame duration. The renderer validates registered creatures at startup; tests validate the complete registry.

Animations are keyed by `idle`, `walk`, `attack`, `hurt`, or `summon`. Directional entries use `up`, `down`, `left`, or `right` and override the shared state animation, which overrides the base grid. `frameDurationMs` is the time per frame. `loop` defaults to true for `idle` and `walk`, and false for other states. The engine uses sequence duration to determine when one-shot states finish.

```ts
animations: {
  idle: { frames: [idleA, idleB], frameDurationMs: 180 },
  attack: { frames: [attackA, attackB], frameDurationMs: 70, loop: false },
},
directionalAnimations: {
  left: {
    walk: { frames: [leftWalkA, leftWalkB], frameDurationMs: 110 },
  },
},
```

If adding another image-based sprite format, implement an adapter in `src/ui/` while preserving the state/direction contract and its fallback behavior.

## Debugging Checklist

- A creature or move is missing: check the IDs in `POKEMONS` (Dex JSON), `MOVES`, and the trainer roster.
- A matchup looks wrong: check the attacking type's three offensive lists in `OFFENSIVE_CHART`; dual defense multiplies each result.
- A sprite jitters or falls back: check equal frame dimensions, glyphs, six-digit colors, direction names, and the animation's frame duration.
- An attack ends too early: check frame count and `frameDurationMs`; one-shot playback uses their product as its state duration.
- Storage fails: verify the UI still loads; score read/write errors are caught and fall back to an in-memory default.

Run the focused tests with `npm test`; always run `npm run build` before considering a change complete.
