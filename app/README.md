# Dirtbag, rebuilt

The game rebuilt from source. It has a new look (park-poster landscapes, comic people and panels, all drawn in code), side-view scenes joined by a valley map, and beta-then-send climbing. The decisions and the milestones are in [`docs/ROADMAP.md`](../docs/ROADMAP.md), under "Direction and the rebuild".

This is R1: the first week.
- **Your climber:** you make a climber from v0.956's four starts, and its five skills set every crux's window.
- **Places:** Roadside's seven lines, Send City's weekly set, the Diner and the Coffee Shop.
- **The week's rules:** hunger, weekly bills and a card instead of a game over. The weather comes from the seed, and Hazel and Sage keep their own hours.
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
npm run e2e            # a bot plays two days on dist/ in headless Chromium, then reloads offline
```

## Layout

| Path | What lives there |
|---|---|
| `src/sim/` | The rules: state, actions, the clock, money and body, climbing, saves, the RNG. Plain TypeScript, no DOM. |
| `src/sim/content/` | Places, acts, roads, routes, beta, people and their lines, as data. `gym.ts` makes Send City's weekly set from the seed. |
| `src/sim/climber.ts`, `weather.ts`, `presence.ts` | Skills and the grade curve; each day's sky; where people are. All pure functions of the state or the seed. |
| `src/sim/bot.ts` | A player that isn't one: plays whole days through `act()`, with perfect or human-ish hands. The week test uses it; R2's balance harness will. |
| `src/sim/dials.ts` | Every tunable number, with what it means and why it's set there. |
| `src/view/` | The painters and the frame renderer: scenes, the map, the wall, people. Reads state, never changes it. |
| `src/game/` | The game loop, input, walking, driving and the attempt's timing; saves to localStorage. |
| `src/ui/` | React panels: HUD, speech bubbles, sheets, the climb panel. |
| `build/pwa.ts` | The installable shell, made at build time: the manifest, icons drawn in code, and a service worker that precaches exactly this build. |
| `e2e/playthrough.mjs` | The bot that plays two days in the browser, then checks the game starts offline. |

## Rules

- **The sim decides; the view stages.** Every change to the game goes through `act(state, action) → { state, events }`. The view and UI read state and play back events.
  - Nothing in `src/sim` may touch the page, storage, the network, real time or `Math.random`, or import from `view`, `ui` or `game`.
  - `tsconfig.sim.json` has no DOM types, and `purity.test.ts` scans for the rest.
- **The clock moves only on actions.** Walking around a scene is free; nothing ticks while you stand still.
- **What isn't stored is derived from the seed.** The weather, where people are, and the gym's set are pure functions of the seed, the day and the clock, so nothing about them can drift in a save.
- **A go is a fixed-step model.** `stepAttempt` advances it by `STEP` (1/60 s), and `attemptInput` takes the finger going down or up. The same inputs always replay the same go (`climb.test.ts`).
- **Seeded randomness only**, through `sim/rng.ts`: mulberry32, FNV-1a over UTF-16 code units, and named streams. It is the same generator as `Dirtbag-UE/Sim/DirtbagRng`, and it checks the same golden vectors. If they move, every seed changes meaning, which is save-breaking.
- **Content is data.** A new place, route, beta or line is a data entry. `content.test.ts` checks that every reference resolves and every talk node is reachable.
- **Numbers in text are derived.** Prices, durations and body effects on buttons are formatted from the same numbers the rules use, so they can't drift.
- **Saves.**
  - The save is a versioned envelope around the state. To change the state's shape, bump `SAVE_VERSION`, register a migration in `MIGRATIONS`, and add a test that loads an old save.
  - The loader never repairs a save and never substitutes a fresh one. `game/persist.ts` moves a bad save aside, falls back to the last save from an earlier day, and says so.
- **Nothing leaves the site.** Fonts are bundled (OFL, from `@fontsource`), and the e2e bot fails on any off-site request.

## What R1 fakes

- **Balance.**
  - Numbers are v0.956's where it had them, and placeholders elsewhere. R2 fits them with bots.
  - The week bot's "human" hands (about 50 ms of scatter, 200 ms of lag on the tension band) are guesses, not measurements. With perfect hands it onsights nearly everything, so difficulty rests on human precision.
- **Content.** Seven crag lines, and six gym problems a week. A keen player runs out of new lines in about three days, and so does the bot.
- **Sage** teaches the next unknown beta on your most-tried line where you are. You can't point at a line yet.
- **Not in yet:** sound, gear, injury and load, projects, and partner arcs (R2).
- **Deployment.** The service worker and manifest work in the build and in the e2e, but the rebuild isn't deployed until R3.
