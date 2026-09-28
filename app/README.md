# Dirtbag, rebuilt

The game rebuilt from source. It has a new look (park-poster landscapes, comic people and panels, all drawn in code), side-view scenes joined by a valley map, and beta-then-send climbing. The decisions and the milestones are in [`docs/ROADMAP.md`](../docs/ROADMAP.md), under "Direction and the rebuild". This is R0: the first morning, the drive, and The Pump, running on the architecture the whole game will use.

## Commands

```sh
npm ci                 # this package
npm ci --prefix ..     # the repo root: the pinned Playwright the e2e bot uses

npm run dev            # dev server
npm test               # sim and save tests (Vitest)
npm run typecheck      # the sim is checked with no DOM types, the rest with them
npm run format         # Prettier (CI runs format:check)
npm run build          # dist/
npm run size           # what a player downloads, against the budget
npm run e2e            # a bot plays the first day on dist/ in headless Chromium
```

## Layout

| Path | What lives there |
|---|---|
| `src/sim/` | The rules: state, actions, the clock, money and body, climbing, saves, the RNG. Plain TypeScript, no DOM. |
| `src/sim/content/` | Places, acts, roads, routes, beta, people and their lines, as data. |
| `src/sim/dials.ts` | Every tunable number, with what it means and why it's set there. |
| `src/view/` | The painters and the frame renderer: scenes, the map, the wall, people. Reads state, never changes it. |
| `src/game/` | The game loop, input, walking, driving and the attempt's timing; saves to localStorage. |
| `src/ui/` | React panels: HUD, speech bubbles, sheets, the climb panel. |
| `e2e/playthrough.mjs` | The bot that plays day 1 to day 2. |

## Rules

- **The sim decides; the view stages.** Every change to the game goes through `act(state, action) → { state, events }`. The view and UI read state and play back events.
  - Nothing in `src/sim` may touch the page, storage, the network, real time or `Math.random`, or import from `view`, `ui` or `game`.
  - `tsconfig.sim.json` has no DOM types, and `purity.test.ts` scans for the rest.
- **The clock moves only on actions.** Walking around a scene is free; nothing ticks while you stand still.
- **A go is a fixed-step model.** `stepAttempt` advances it by `STEP` (1/60 s), and `attemptInput` takes the finger going down or up. The same inputs always replay the same go (`climb.test.ts`).
- **Seeded randomness only**, through `sim/rng.ts`: mulberry32, FNV-1a over UTF-16 code units, and named streams. It is the same generator as `Dirtbag-UE/Sim/DirtbagRng`, and it checks the same golden vectors. If they move, every seed changes meaning, which is save-breaking.
- **Content is data.** A new place, route, beta or line is a data entry. `content.test.ts` checks that every reference resolves and every talk node is reachable.
- **Numbers in text are derived.** Prices, durations and body effects on buttons are formatted from the same numbers the rules use, so they can't drift.
- **Saves.**
  - The save is a versioned envelope around the state. To change the state's shape, bump `SAVE_VERSION`, register a migration in `MIGRATIONS`, and add a test that loads an old save.
  - The loader never repairs a save and never substitutes a fresh one. `game/persist.ts` moves a bad save aside, falls back to the last save from an earlier day, and says so.
- **Nothing leaves the site.** Fonts are bundled (OFL, from `@fontsource`), and the e2e bot fails on any off-site request.

## What R0 fakes

- Every number is a feel-slice placeholder. Balance comes in R2, with bots.
- There are three places, one climbable route, one friend and a dog.
- Climber stats don't affect a go yet. R1 adds v0.956's five skills to the windows and the pump rate.
- There is no sound, no app shell (manifest and service worker), and no settings.
