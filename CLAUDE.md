# CLAUDE.md — Dirtbag (web)

Climbing life-sim: live out of your van, work shifts, push your grade from gym plastic to the crag. This repo holds the game (dirtbag.rcjlabs.com, a PWA, also on Google Play as a TWA), built from source in `app/`; its release pipeline; and the planning docs. Solo dev (Evan, RCJ Labs).

**What is and isn't here.**
- **The game, `app/`.** Rebuilt from source over the roadmap's R0–R3: engine-free sim, the Mix renderer (poster landscapes, comic people, all drawn in code), React panels. Since 0.960.0 it *is* the site: `npm run stage` copies its build (`app/dist`) and a short allowlist into `_site/`. Gameplay and UI work happens here.
- **v0.956, retired at R3.** The old single-file build (~15 MB, its source never in this repo) left the tree. Commit `e098332` on `main` keeps it. Rolling back is creating the `v0.956.0` tag there, since that tag's push deploys it; so the tag doesn't exist yet, on purpose. Its players' saves stay in their browsers: the game offers them as a file, and can carry a climber across (`app/src/game/legacy.ts`).

## Start every session

1. Read `docs/ROADMAP.md`. Find the `CURRENT MILESTONE` marker.
2. Work ONLY on that milestone unless told otherwise. Propose a plan before multi-file changes.
3. When the milestone's "Done when" criteria pass: update its status in ROADMAP.md, add a changelog line, advance the CURRENT MILESTONE marker, and commit.

`docs/AUDIT.md` is the v0.956 audit the roadmap was written from. `docs/audit/*.md` hold the per-system evidence, with line refs into the prettified bundle (regeneration steps in `docs/audit/README.md`). When a design question feels open, it has usually been answered there.

## Commands

- `npm ci && npm ci --prefix app` once; then `npx playwright install chromium` (skip in the cloud container — its preinstalled Chromium matches the pinned Playwright 1.56.1).
- `npm run build --prefix app` — builds the game, which is the site. `check` and `stage` need it.
- `npm run check` — static checks: one version everywhere; the build whole (its links, the worker's precache list, the manifest's icons, the worker still clearing v0.956's cache); the TWA domain link intact. Must pass before every commit.
- `npm run stage` — copies the build and the allowlist into `_site/` (what `deploy.yml` publishes).
- `npm run smoke` — headless Chromium plays the first minute on `_site/`: boot, the service worker, a new climber, the save, the clock (moved by an action), reload, offline start. It fails on any error, failed request or request that leaves the site. Must pass before any commit that touches the site or its pipeline.
- `npm run size` — what a player downloads, by part, against the budget.
- `npm ci --prefix twa && node --test twa/acknowledge.test.mjs` — the Play app's purchase acknowledger hooks into the project Bubblewrap generates (its own templates, rendered offline). Run before any commit that touches `twa/` or `twa-manifest.json`.
- `npm run stamp` — after changing `package.json` `version`: writes it into the lockfiles, `app/package.json`, `desktop/package.json` and the TWA's `appVersionName`.
- **The desktop build (`desktop/`, Phase 14.3):** `npm ci --prefix desktop`, then `npm test --prefix desktop` (its save file, its edition) and `xvfb-run -a npm run smoke --prefix desktop` (opens on the built game, saves to its file, comes back, quits; nothing asked of anywhere but `app://`). The demo's edition (15.3): `xvfb-run -a npm run smoke:demo --prefix desktop` on `app/dist-demo`, and `npm run pack:demo` packs it as "Dirtbag Demo". Run the tests and both smokes before any commit that touches `desktop/` or the game's storage.

Releasing and rolling back: `README.md` → Releasing.

**The game (`cd app`):** `npm ci` (and `npm ci` at the root, for Playwright), then:
- `npm test` — the sim's tests plus the save-layer tests. Must pass before any commit that touches `app/src`.
- `npm run typecheck` — three configs; `tsconfig.sim.json` checks `src/sim` with no DOM types.
- `npm run format:check` (or `npm run format`) — Prettier, as CI runs it.
- `npm run build`, then `npm run size` (player download against the budget) and `npm run e2e` (a bot plays five days on the build, counting day three's taps and running day four as a plan, then a v0.956 player crosses over). Run both before any commit that changes what a player sees.
- `npm run play:demo`, `npm run build:demo`, then `npm run diff:demo` and `npm run e2e:demo` (Phase 14.5): bots play the demo to its end; the demo build in `dist-demo/`; none of the full game's content in it; its first morning (its places only) and its last card. Run all four before any commit that touches the demo's rules (`sim/edition.ts`, `sim/demo.ts`, `content/demo.ts`), what it shows, or any `*.full.ts` module.
- `npm run build:gated`, then `npm run e2e:gate` (Phase 19.1): the full game with its gate on, in `dist-gated/`; a climber from before keeps the full game, one after gets the first season and its last card, and an unlock carries them on; in the Android app, with Play faked (19.2), the unlock bought and restored. Run both before any commit that touches the gate (`game/unlock.ts`), Play's unlock (`game/play.ts`) or the demo's rules.
- `npm run dev` — local dev server.
- `npm run store:art` (after `npm run build`) — Steam's capsules and library art, drawn by the game (`/store.html` under `npm run dev`), the store screenshots for Steam and Play, played on the build, and the press kit (`docs/PRESSKIT.md`'s words, a zip), into `store-art/` (not committed). The copy is `docs/STORE.md`; `src/storecopy.test.ts` holds its facts, and the kit's, to the content. The trailer's beats load from `/trailer.html` under `npm run dev` (`src/dev/beats.ts`).

## Load-bearing rules

- **The site is the build.** Never hand-edit `app/dist` or `_site`: change the source and rebuild.
- **One version.** `package.json` is the source; `npm run stamp` propagates it; `npm run check` fails on drift.
- **The worker's name is load-bearing.** The build's service worker ships as `service-worker.js`, the name v0.956's had, so every browser that installed v0.956 finds the new worker at the URL it already checks and swaps in place. Its cache name is a hash of the build, so a deploy that changes the game replaces the cache. Never rename the file, and keep its cleanup of v0.956's `dirtbag-v…` caches.
- **The site is an allowlist.** Only the build and what `scripts/stage-site.mjs` lists (the privacy page, the terms, CNAME, `.well-known`) ship. `.well-known/assetlinks.json` must always ship: without it the Play app loses domain verification and shows a browser address bar.
- **Nothing leaves the site.** The privacy page promises no network calls of the game's own (Google Play's and Steam's, on the device, are the stores'), and the smoke test fails on any cross-origin request. When what the game keeps or calls changes, `privacy.html` changes with it; `terms.html` covers the purchase. No analytics, CDNs or hosted web fonts: the rebuild bundles its fonts (OFL) from `@fontsource`, and its e2e bot fails on any off-site request too.
- **Asset licenses.** The game's art and sound are code; keep them that way unless an asset's licence is written down. v0.956's sprites came from purchased LimeZu packs whose terms are ambiguous (the license file inside each pack is the authority), and this repo is public: never commit extracted sprite or audio files to it. v0.956's music was "Bitwise" by tcarisland (CC BY 4.0); if any music comes back, its credit goes on screen.
- **v0.956's keys are read-only.** `dirtbag-` keys in a player's localStorage belong to their retired v0.956 career. The game reads them to offer the file and the carry-over, and never writes or deletes them. Its own keys are `dirtbag.`; the demo's are `dirtbag.demo.` (`game/storage.ts`), so a demo and the full game sharing a site or a folder never touch each other's save.
- **Pinned tools.** Playwright via `package-lock.json` (the rebuild's e2e uses the same one); the rebuild's toolchain (Vite, TypeScript, React, Vitest, Prettier) at exact versions in `app/package-lock.json`; Bubblewrap (CLI and core — core owns the Android template) via `twa/package-lock.json`; Electron, `@electron/packager` and `steamworks.js` via `desktop/package-lock.json`. Upgrade them deliberately, in their own commit. The TWA workflow fails if `targetSdkVersion` drops below Play's floor (`MIN_TARGET_SDK`, 36 since 31 Aug 2026).
- **The game's rules** (details in `app/README.md`):
  - **The sim decides; the view stages.** Rules live in `app/src/sim`: no DOM, no `Math.random`, no wall clock, no imports from the layers above. `tsconfig.sim.json` and `purity.test.ts` enforce it. Every state change goes through `act(state, action)`.
  - **Seeded RNG, shared with Unreal.** `sim/rng.ts` matches `Dirtbag-UE/Sim/DirtbagRng` and its golden vectors. If they move, it's save-breaking: log the decision.
  - **Content is data.** Places, acts, routes, beta and lines live in `sim/content/`, checked by `content.test.ts`. Adding content never touches rules.
  - **The demo strips the full game.** What lies past Roadside and the Gorge (the later crags' words, lines, walls, rock, layouts and scenes; Acts II to V and The Line; the expeditions; the Hollow) lives in `*.full.ts` modules, each with a `*.demo.ts` twin the demo's build takes instead. New content there goes in a `.full` module, or CI's content diff fails.
  - **No hand-typed numbers in text.** Prices, times and effects in the UI are formatted from the same numbers the rules use.
  - **Saves.** Change the state's shape only by bumping `SAVE_VERSION` and registering a migration, with a test that loads an old save. A save that won't load is quarantined, never overwritten.
  - **The gate** (Phase 19.1, `game/unlock.ts`): off until launch (`DIRTBAG_GATE` in `deploy.yml`, Evan's to flip). A climber from before it keeps the full game: never clear `dirtbag.unlock`, and keep the gate's first start marking them. The locked full game keeps the full game's keys, so an unlock carries the same climber on.
  - **Play's unlock is acknowledged by the app** (Phase 19.2): the page can't, and Play refunds what isn't within three days. `build-twa.yml` runs `twa/acknowledge.mjs` between `bubblewrap update` and Gradle; `npm run check` fails without it. The Android app never shows another store's page (Play's payments policy).
  - **The 2D game is the spec** for the Unreal version: spec changes get logged in `Dirtbag-UE/concepts/2D-SPEC-LOG.md`.

## Style

- Scripts: Node 20+, ESM, no runtime dependencies. Small files, split by job. Comments explain *why*, not *what*.
- The game: TypeScript, Prettier-formatted, same comment rule. Dials (`sim/dials.ts`) say what each number means and why it's set there.
- Commit messages describe the change and its reason. ROADMAP.md's changelog gets a line per milestone-relevant commit.
- Any player-facing text (release notes, store copy, "What's new"): dry, wry, second-person, climber-authentic, never jokey.
- The cloud container's network policy may block dirtbag.rcjlabs.com; live-site checks run in `deploy.yml` on GitHub's runners.
