# Dirtbag, rebuilt

The game rebuilt from source. It has a new look (park-poster landscapes, comic people and panels, all drawn in code), side-view scenes joined by a valley map, and beta-then-send climbing. The decisions and the milestones are in [`docs/ROADMAP.md`](../docs/ROADMAP.md), under "Direction and the rebuild".

This is the game as it ships from 0.960.0 (the roadmap's R3): the first season, Act I, from gym plastic to your first V5 project. Its build is the site: the repo root's `npm run stage` publishes `dist/`.
- **Act I:** v0.956's first-season quest as a goal ladder, in its words: five stages with a "Next" pill on screen, ending at V4 with a card. Dex's race for the open project starts that night.
- **Places:**
  - Roadside Crag: seven boulders and four sport lines, including an open project you first-ascend, name and grade.
  - Granite Gorge: it opens at V4 and shuts in spring. Six boulders and three sport lines, one of them a sandbag.
  - Send City: a weekly set, V0 to V5, and a board whose four problems, V4 to V7, stay up four weeks (Phase 10.1, after 0.960.0).
  - The Diner and the Coffee Shop.
- **Your body:** v0.956's acute:chronic load with Phase 6's fixes: a seeded start, warm-ups, seeded injury rolls, and a first injury that costs time, not money. Hunger, weekly bills and a card instead of a game over.
- **People:**
  - Bonds and tiers, earned a day at a time.
  - Sage's four-beat arc, and asking her out to the Gorge.
  - Dex Calloway on his own seeded curve, and the first-ascent race.
  - Scout, the Lot's stray.
- **On the wall** (Phase 9):
  - How far a go got against your best, on the fall sheet and on the wall.
  - Pump you can see: the climber shakes and the screen's edges close in.
  - Climbers move at a pace set by their grade.
- **The send card:** a PNG of your line, drawn on the device, to save or share.
- **v0.956's players:** v0.956 retired at 0.960.0. Someone who played it is told so, can keep their old career as a file, and can carry on under their old name, their climbing capped at V3.
- **The shell:** the game installs and plays offline.

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
npm run e2e            # a bot plays two days on dist/ in headless Chromium and reloads offline, then a v0.956 player crosses over
npm run harness        # bots play whole seasons; prints the tables and Phase 6's first-season targets
```

## Layout

| Path | What lives there |
|---|---|
| `src/sim/` | The rules: state, actions, the clock, money and body, climbing, saves, the RNG. Plain TypeScript, no DOM. |
| `src/sim/content/` | Places, acts, roads, routes, beta, people and their lines, as data. `gym.ts` makes Send City's weekly set and its board from the seed. |
| `src/sim/climber.ts`, `weather.ts`, `presence.ts` | Skills and the grade curve; each day's sky; where people are. All pure functions of the state or the seed. |
| `src/sim/bot.ts` | A player that isn't one: plays whole days through `act()`, with perfect or human-ish hands, under three strategies (climber, balanced, worker). |
| `src/sim/harness.ts`, `harness/` | The balance harness: bots play 28-day seasons across every start and strategy. It prints grade, money, runway and injuries, then passes or fails Phase 6's first-season targets. |
| `src/sim/story.ts`, `content/story.ts` | Act I: the goal ladder, as data, and how far along it you are. |
| `src/sim/curves.ts` | Other climbers' grades over the season: Sage's steady climb, and Dex's streaks, injury and peak. |
| `src/sim/dials.ts` | Every tunable number, with what it means and why it's set there. |
| `src/view/` | The painters and the frame renderer: scenes, the map, the wall, people. Reads state, never changes it. |
| `src/game/` | The game loop, input, walking, driving and the attempt's timing; saves to localStorage. `legacy.ts` reads a retired v0.956 career and keeps it as a file, never writing to it. |
| `src/ui/` | React panels: HUD, speech bubbles, sheets, the climb panel, the goal pill. `card.ts` words the send card; `view/paint/card.ts` paints it. |
| `build/pwa.ts` | The installable shell, made at build time: the manifest and icons (drawn in code, `favicon.ico` too), and a service worker that precaches exactly this build. The worker is `service-worker.js`, v0.956's name, so a browser that installed v0.956 swaps workers in place, and it clears v0.956's cache. |
| `e2e/playthrough.mjs` | The bot that plays two days in the browser, then checks the game starts offline. |

## Rules

- **The sim decides; the view stages.** Every change to the game goes through `act(state, action) → { state, events }`. The view and UI read state and play back events.
  - Nothing in `src/sim` may touch the page, storage, the network, real time or `Math.random`, or import from `view`, `ui` or `game`.
  - `tsconfig.sim.json` has no DOM types, and `purity.test.ts` scans for the rest.
- **The clock moves only on actions.** Walking around a scene is free; nothing ticks while you stand still.
- **What isn't stored is derived from the seed.** The weather, where people are, and the gym's sets are pure functions of the seed, the day and the clock, so nothing about them can drift in a save.
- **A go is a fixed-step model.** `stepAttempt` advances it by `STEP` (1/60 s), and `attemptInput` takes the finger going down or up. The same inputs always replay the same go (`climb.test.ts`).
- **Seeded randomness only**, through `sim/rng.ts`: mulberry32, FNV-1a over UTF-16 code units, and named streams. It is the same generator as `Dirtbag-UE/Sim/DirtbagRng`, and it checks the same golden vectors. If they move, every seed changes meaning, which is save-breaking.
- **Content is data.** A new place, route, beta or line is a data entry. `content.test.ts` checks that every reference resolves and every talk node is reachable.
- **Numbers in text are derived.** Prices, durations and body effects on buttons are formatted from the same numbers the rules use, so they can't drift.
- **Saves.**
  - The save is a versioned envelope around the state. To change the state's shape, bump `SAVE_VERSION`, register a migration in `MIGRATIONS`, and add a test that loads an old save.
  - The loader never repairs a save and never substitutes a fresh one. `game/persist.ts` moves a bad save aside, falls back to the last save from an earlier day, and says so.
- **Nothing leaves the site.** Fonts are bundled (OFL, from `@fontsource`), and the e2e bot fails on any off-site request.

## What it still fakes

- **Balance.**
  - The harness fits the season's shape: runway, the first V5 project around day 19–20, injuries, and climbing against setting. `npm run harness` prints the targets.
  - The bots' human-ish hands are guesses, not measurements: scatter on the load and timing meters, and about 200 ms of lag on the tension band, varied from go to go (`HUMAN` in `sim/bot.ts`).
- **Feel.** Phase 9's criteria (a watcher can tell how close a go was; a pumped go feels tense) and Phase 7's first hour need people, not bots.
- **Content.**
  - Twenty crag lines, six gym problems a week, and the board's four.
  - Before the board, about half the bots hit a wet day in week four with nothing new to try. Now 3 runs in 144 do, each with all four board problems sent. The board's next set comes on day 29.
  - The board's grades climb like the wall's, not stiff the way real boards run: 3 runs sent its V7 at V4 *[proposed: Evan's call]*.
- **Injuries** are rare in the first month: none for bots that warm up and heed the warning, and 3% for reckless ones. That meets Phase 6's ceiling, but it may be too gentle to register as a trade-off. It's a playtest question.
- **Design calls** marked *[proposed]* in the roadmap are Evan's to rule on: Sage's week away, the blessing's bond, the race's V4 trigger, Act I's "regular" stage, pace, and the card's footer.
- **Not in yet:** sound, gear (the trad lines wait for it), comps, media, and jobs beyond the café and setting.
- **Saves.** Save v3 is still growing, and freezes when R2 ships. A save from an earlier R2 build can fail to load: it's moved aside, not lost.
- **The switch-over, live.** The crossover (a browser with v0.956 installed meeting this build) was tested locally, not yet on the real site. On the first visit after the deploy, v0.956 shows once from its own cache. Within a few seconds the new worker takes over and deletes v0.956's cache, and from the next launch it's this game.
