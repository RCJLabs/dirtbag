# Dirtbag, rebuilt

The game rebuilt from source. It has a new look (park-poster landscapes, comic people and panels, all drawn in code), side-view scenes joined by a valley map, and beta-then-send climbing. The decisions and the milestones are in [`docs/ROADMAP.md`](../docs/ROADMAP.md), under "Direction and the rebuild".

This is the game as it ships from 0.960.0 (the roadmap's R3): the first season, Act I, from gym plastic to your first V5 project. Its build is the site: the repo root's `npm run stage` publishes `dist/`.
- **Act I:** v0.956's first-season quest as a goal ladder, in its words: five stages with a "Next" pill on screen, ending at V4 with a card. Dex's race for the open project starts that night.
- **Places:**
  - Roadside Crag: seven boulders and four sport lines, including an open project you first-ascend, name and grade.
  - Granite Gorge: it opens at V4 and shuts in spring. Six boulders and three sport lines, one of them a sandbag.
  - Moonstone Boulders (Phase 10.3, after 0.960.0): desert quartzite up the highway, from V6. You pay once for the haul and a permit every trip. It has its own desert sky: drier and hotter than the valley's. Seven boulders, highballs among them, and two sport lines on a spire that nobody comes out to belay yet.
  - Highballs (Phase 10.3b, proposed): a fall off a tall boulder can land you badly, more from higher. The haul's pads and a partner spotting each halve it, and the beta sheet shows the odds.
  - Send City: a weekly set, V0 to V5, and a board whose four problems, V4 to V7, stay up four weeks and run a grade stiff (Phase 10.1, after 0.960.0).
  - The Diner and the Coffee Shop.
- **Conditions you can see** (Phase 10.2, after 0.960.0): the sun crosses Roadside from its far end to the road over two hours, greasing each line as it gets there, and you can see its edge coming. Wet rock after rain, and closed or soaked crags tagged on the map.
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
- **The journal** (Phase 12.1, after 0.961.0): tap your body in the HUD. You as a climber, and "Lately": the last 200 things that happened, in full. A line too long for a toast comes on a card instead.
- **v0.956's players:** v0.956 retired at 0.960.0. Someone who played it is told so, can keep their old career as a file, and can carry on under their old name, their climbing capped at V3.
- **The shell:** the game installs and plays offline.
- **Your kit** (Phase 21.1, after 0.961.0): shoes that wear by the go, chalk, tape for cracks, a second pad, all from the gear shop in town (resoles, and a swap meet on weekends). Worn kit tightens every crux; the You page and the beta sheet say how much.
- **The van** (22.2a): tires, engine and battery wear with driving and nights (`sim/van.ts`, `VAN` in `sim/dials.ts`); a worn van breaks down on drives out of town, with its ways out, and the garage in Midtown puts parts back. Where you park for the night (22.2b) is `sim/spots.ts`, with `SPOTS` in `sim/dials.ts`. The garage's upgrades and winter (22.2c) are gear (`content/gear.ts`), with `UPGRADE` and `WINTER` in `sim/dials.ts`; `nightAt` works out the cold. Food (22.3) is data in `sim/content/food.ts`, with `FOOD` in `sim/dials.ts`. Insurance and the clinic (22.4a) are `sim/clinic.ts`, with `PLANS` and `CLINIC` in `sim/dials.ts`; old injuries and fear (22.4b) are `sim/scars.ts`, with `SCARS` and `FEAR`; supplies and sickness (22.4c) are `sim/sick.ts`, with `SUPPLIES` and `SICK`; psyche (22.4d) is `sim/psyche.ts`, with `PSYCHE`; the hustle (22.5a) is `sim/hustle.ts`, with `HUSTLE`; busking (22.5b) is `sim/busk.ts`, with `BUSK`, and its beat is `ui/BuskPanel.tsx`. The event deck (22.6) is `sim/events.ts`, with `EVENTS`; its knocks are data in `sim/content/knocks.ts`, its hitchhikers and roadside stops in `sim/content/road.ts`, and its walk-outs in `sim/content/epics.ts`. Scout's life (22.7) is `sim/scout.ts`, with `DOG`; his lines are `sim/content/dog.ts`. Dreams (22.8) are `sim/dreams.ts`, with `DREAM`, and `sim/content/dreams.ts`. The games at the fire (22.9) are `sim/fire.ts`, with `GAMES`; horseshoes throw on busking's beat, and liar's dice is the fire's card. Cards (22.9b) are `sim/cards.ts`, with `GAMES.bj` and `GAMES.holdem`; how each person plays hold'em is `sim/content/cards.ts`. The glossary (22.9c) is data in `sim/content/glossary.ts`, shown as the journal's Words page. Expeditions (Phase 24) are `sim/expeditions.ts`, with `EXPED`; their pitches are lines in `sim/content/expeditions.ts` (`EXPED_ROUTES`), climbed as goes, and the summit odds come from playing them (`sendChance`, `summitOdds`).
- **Work and crew** (after 21.4): shifts earn promotions and each rank pays more (`sim/content/jobs.ts`). Since 22.1 each job posts its shifts by the week (`sim/jobs.ts` `postedIn`); you sign up ahead from the week sheet, only signed-up shifts count toward a raise, and no-shows cost warnings, then the job. How you live (`LIFESTYLE` in `sim/dials.ts`) is paid at the van every night; ask Hazel or Sage out to any crag your bond with them covers (`invite` on each place).
- **Trad** (Phase 21.2, after 0.961.0): Trad Arête and Gorge Trad, led on a rack from the gear shop. Let go at a stance to place a piece, for pump, or climb through and run it out; a fall catches on your last piece, and with nothing low enough you deck (`TRAD` in `dials.ts`).
- **Training** (Phase 21.3, after 0.961.0): Train on the van (with a hangboard) or at the gym desk. Six protocols and prehab, one session a day, through the load model; phases that hold for days, a taper with a cooldown (`sim/training.ts`, `sessions.ts`, `TRAIN` in `dials.ts`). The harness holds every protocol under an hour on the rock.
- **Sound** (Phase 13.1, after 0.961.0): every verb has one, made in code with Web Audio (`src/audio/`), like the art. Volume and vibration in Settings. `npm run dev`, then `/sounds.html`, to hear them all. Every place has ambience, from its data (`ambience` in `PLACES`), turned by the hour and the weather. Every sound is in the licence ledger (`src/audio/ledger.json`); Settings has credits. No music yet.
- **Tonight** (Phase 12.4, after 0.961.0): at night the van says what bed costs, what's left in the morning, how your body will read and tomorrow's sky, from the numbers sleep uses (`sim/tonight.ts`).
- **Keyboard and access** (Phase 12.3, after 0.961.0): Tab reaches everything, the things in scenes and the map's pins included; Escape puts down what's open; text goes to 1.3×; the panel colours meet WCAG AA (`npm run check`).
- **Any window** (Phase 12.2, after 0.961.0): portrait is a phone screen; a wider window widens the world, up to about 16:9, with sheets docked at the right from 1080 across. Walls close up stay portrait, as a panel over their crag.

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
npm run e2e            # a bot plays five days on dist/ in headless Chromium (counting day three's taps, running day four as a plan) and reloads offline, then a v0.956 player crosses over
npm run harness        # bots play whole seasons, then four-year careers; prints the tables and their targets
```

## Layout

| Path | What lives there |
|---|---|
| `src/sim/` | The rules: state, actions, the clock, money and body, climbing, saves, the RNG. Plain TypeScript, no DOM. |
| `src/sim/content/` | Places, acts, roads, routes, beta, people and their lines, as data. `gym.ts` makes Send City's weekly set and its board from the seed. |
| `src/sim/kit.ts`, `content/gear.ts` | Your kit: what it is, what a go does to it, and what it does to a go (`KIT` in `dials.ts`). |
| `src/sim/training.ts`, `sessions.ts`, `content/training.ts` | Your training block (phase, taper, prehab) and a session: what it costs, teaches and loads (`TRAIN` in `dials.ts`). |
| `src/sim/climber.ts`, `weather.ts`, `presence.ts` | Skills and the grade curve; each day's sky; where people are. All pure functions of the state or the seed. |
| `src/sim/bot.ts` | A player that isn't one: plays whole days through `act()`, with perfect or human-ish hands, under three strategies (climber, balanced, worker). |
| `src/sim/harness.ts`, `harness/` | The balance harness: bots play 56-day seasons across every start and strategy, and print grade, money, runway and injuries against Phase 6's first-season targets. Then the career bot plays four years (224 days) from every start, against Phase 21's grade target (`career.harness.ts`). |
| `src/sim/story.ts`, `content/story.ts` | Act I: the goal ladder, as data, and how far along it you are. |
| `src/sim/curves.ts` | Other climbers' grades over the season: Sage's steady climb, and Dex's streaks, injury and peak. |
| `src/sim/dials.ts` | Every tunable number, with what it means and why it's set there. |
| `src/view/` | The painters and the frame renderer: scenes, the map, the wall, people. Reads state, never changes it. `header.ts` draws a place card's header from the place's scene, or from its front in `paint/fronts.ts` for a place without one. |
| `src/game/` | The game loop, input, walking, driving and the attempt's timing; saves to localStorage. `legacy.ts` reads a retired v0.956 career and keeps it as a file, never writing to it. `plan.ts` is the day's plan: its steps, what can be planned where, and yesterday as you played it, kept beside the save. |
| `src/ui/` | React panels: HUD, speech bubbles, sheets, the climb panel, the goal pill. `card.ts` words the send card; `view/paint/card.ts` paints it. `who.ts` words a place card's "Who's around". |
| `build/pwa.ts` | The installable shell, made at build time: the manifest and icons (drawn in code, `favicon.ico` too), and a service worker that precaches exactly this build. The worker is `service-worker.js`, v0.956's name, so a browser that installed v0.956 swaps workers in place, and it clears v0.956's cache. |
| `e2e/playthrough.mjs` | The bot that plays five days in the browser, on a pinned seed, and checks the game starts offline. It counts the taps on every trip and on day three against Phase 11's budgets, runs day four as a plan, and has day five's plan stopped by the day. |

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

## Adding a place

A place is data, a pin and a picture. In order:

1. **The place.** An entry in `PLACES` (`src/sim/content/places.ts`):
   - `name`;
   - `ambience`: what it sounds like (wind, birds, a room, voices…), each 0 to 1;
   - `away` and `here`, the card's lines (`{spot}` and the other `TEXT_VALUES` fill in; so does `{lines}`, the count of its lines);
   - `acts`, the ids of what you can do there;
   - `scene`: its side-view scene, or `null` for a place you only see as a card.
   - A crag also takes `crag: true`, and its `sun` path: every line, from the end the sun reaches first. As needed, add `shaded`, `desert`, `ownSky` (weather of its own), `closed` (a season), `minGrade` with `locked`, `unlock` (paid once), `permit` (every trip) and `pads`.
2. **Its acts** in `ACTS`, in the same file: what each costs, what it needs, what it says. Ids are `place.act`.
3. **Its roads** in `ROADS`, in the same file: one to each neighbour, with minutes and gas (v0.956's where it has them). Every other drive goes through them, the quickest way.
4. **Its lines**, for a crag: `src/sim/content/routes.ts`, with `place` set.
5. **Its pin** in `MAP_PINS` (`src/view/layout.ts`): where it is, which side its label sits, and its kind. A place more than a couple of blocks off the highway also needs its side road in `SIDE_ROADS` (`src/view/valley.ts`), starting where it leaves the highway. The drive animates along it.
6. **Its picture**, the card's header:
   - With a scene: an entry in `SCENES` (`src/view/layout.ts`), with the `frame` its header looks at. A crag also needs its `CRAGS` layout (wall, lines, boulders, sign) and its painter in `paint/scenes.ts`.
   - Without a scene: a front in `src/view/paint/fronts.ts`.
7. **Its people**, if anyone's day brings them there: `sim/presence.ts`, and where they stand in `SPOTS`.
8. **Check.** Run `npm test`. These fail by name if something's missing:
   - `content.test.ts`: acts that don't exist; a road to nowhere, a duplicate, one that's never the quickest way, or a place no road reaches; text that can't be filled.
   - `layout.test.ts`: no pin, no header, a scene that isn't the place's, a scene narrower than the widest screen sees (960, the Lot's width), a side road that doesn't start on the highway, a drive that runs past its ends, a crag line with nowhere on screen.
   - `sun.test.ts`: a sun path that misses a line or doubles back.

   If the place changes a season (a crag in Act I's grades, a job), run `npm run harness` too. The season's bots climb at Roadside, the Gorge, the Cove, the Mesa, the Cave and Send City (`BOT_PLACES` in `sim/bot.ts`); the career bot goes anywhere (`CAREER_PLACES`). A crag they should use goes into those lists.
9. **Log it.** Add a changelog line in `docs/ROADMAP.md`. A new rule, or a change to one, also goes in `Dirtbag-UE/concepts/2D-SPEC-LOG.md`.

## What it still fakes

- **Balance.**
  - The harness fits the season's shape: runway, the first V5 project around day 19–20, injuries, and climbing against setting. `npm run harness` prints the targets.
  - The bots' human-ish hands are guesses, not measurements: scatter on the load and timing meters, and about 200 ms of lag on the tension band, varied from go to go (`HUMAN` in `sim/bot.ts`).
- **Feel.** Phase 9's criteria (a watcher can tell how close a go was; a pumped go feels tense) and Phase 7's first hour need people, not bots.
- **Content.**
  - Seventy-four crag lines (five of them trad, eight deep-water solos), V0 to V18 with no grade missing, six gym problems a week at Send City and the board's four, eight a week at The Cave (V5–V12), and eight comp problems a week at the Training Center (V7–V14).
  - Before the board, about half the bots hit a wet day in week four with nothing new to try. With the board a grade stiff, none of 144 runs do. The harness counts only content running out, not days the body said no.
- **Injuries** are rare in the first month: none for bots that warm up and heed the warning, and 3% for reckless ones. That meets Phase 6's ceiling, but it may be too gentle to register as a trade-off. It's a playtest question.
- **Design calls** marked *[proposed]* in the roadmap are Evan's to rule on: Sage's week away, the blessing's bond, the race's V4 trigger, Act I's "regular" stage, pace, and the card's footer.
- **Not in yet:** comps, media, and jobs beyond the café, setting, coaching and the warehouse. The bots don't lead trad yet (they never buy a rack), and they don't climb walls, go on expeditions, ask the crowd for beta, race the speed wall or play Free Solo.
- **Expeditions are sheets.** A day on El Capitan is a choice on a sheet over the Lot: no scene of its own, and the Lot's sky, not the storm.
- **Saves.** Save v37 adds the years recapped and the Homecoming; v36 the week's board; v35 where you stand with the scene and the calls you've made; v34 your paths, what you've mastered, your quirk and the habits it's named from; v33 what you're climbing for; v32 where you came from and what's in you; v31 the Record Book; v30 the book of expeditions you've come home from; v29 what's happened up there on an expedition under way; v28 a booked trip and the haul bag on one under way; v27 ropes an expedition to a partner and counts its portaledge nights; v26 a seat at cards and your reads on people; v25 a hand of liar's dice on the go; v24 your dream and its jar; v23 the dogs you've lost; v22 the day of your last walk-out; v21 the hitchhikers you've met and the stops you've found; v20 the event deck and the encounter you're in; v19 your sets outside the café; v18 the one-time lines you've had; v17 psyche and the crags you've been to; v16 supplies and sickness; v15 old injuries' marks, a flare and fears; v14 your insurance plan and the day of your last cortisone shot; v13 the pantry, the last meals and the day you were fueled; v12 where you park and your nights at the Lot; v11 the van's parts and a breakdown you're sat beside; v10 the shifts you've signed up for, warnings, the jobs that let you go and how you live; v9 your speed-wall PB, Free Solo, and the solo you're on; v8 the wall you're on and the expedition you're away on; v7 shifts worked; v6 (Phase 21.3) your training block; v5 (Phase 21.1) your kit; v4 (Phase 10.3) the trips you've paid for. Each loads from a real save of the version before, through a tested migration.
- **The switch-over, live.** The crossover (a browser with v0.956 installed meeting this build) was tested locally, not yet on the real site. On the first visit after the deploy, v0.956 shows once from its own cache. Within a few seconds the new worker takes over and deletes v0.956's cache, and from the next launch it's this game.
