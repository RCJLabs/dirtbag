# CLAUDE.md — Dirtbag (web)

Climbing life-sim: live out of your van, work shifts, push your grade from gym plastic to the crag. This repo holds the **released** web game (dirtbag.rcjlabs.com, a PWA, also on Google Play as a TWA), its release pipeline, the planning docs, and **the rebuild** in `app/`. Solo dev (Evan, RCJ Labs).

**What is and isn't here.**
- **v0.956, the live game.** `index.html` is build output: one ~15 MB file (Vite + React 19, single-file build) with every track and sprite inlined as base64. Its source is **not in this repo**, so v0.956's gameplay can't change here; its pipeline, service worker, manifests and TWA config can.
- **The rebuild, `app/`.** The game rebuilt from source: engine-free sim, the Mix renderer (poster landscapes, comic people, all drawn in code), React panels. It has its own package and lockfile, sits outside the site allowlist, and isn't deployed until the roadmap's R3. Gameplay and UI work happens here.

## Start every session

1. Read `docs/ROADMAP.md`. Find the `CURRENT MILESTONE` marker.
2. Work ONLY on that milestone unless told otherwise. Propose a plan before multi-file changes.
3. When the milestone's "Done when" criteria pass: update its status in ROADMAP.md, add a changelog line, advance the CURRENT MILESTONE marker, and commit.

`docs/AUDIT.md` is the v0.956 audit the roadmap was written from. `docs/audit/*.md` hold the per-system evidence, with line refs into the prettified bundle (regeneration steps in `docs/audit/README.md`). When a design question feels open, it has usually been answered there.

## Commands

- `npm ci` once; then `npx playwright install chromium` (skip in the cloud container — its preinstalled Chromium matches the pinned Playwright 1.56.1).
- `npm run check` — static checks: one version everywhere, every referenced file exists, the TWA domain link is intact. Must pass before every commit.
- `npm run smoke` — headless Chromium plays the first minute: boot, service worker, new game to town, save, clock, reload, offline start; fails on any error, failed request or request that leaves the site. Must pass before any commit that touches the site files.
- `npm run size` — what a player downloads, by part (music, sprites, JS).
- `npm run stamp` — after changing `package.json` `version`: writes the service-worker cache name and the TWA `appVersionName`.
- `npm run compare -- a.html b.html` — part-by-part diff of two builds (tracks, sprites, JS, CSS, shell).
- `npm run stage` — copies the deployable allowlist into `_site/` (what `deploy.yml` publishes).

Releasing and rolling back: `README.md` → Releasing.

**The rebuild (`cd app`):** `npm ci` (and `npm ci` at the root, for Playwright), then:
- `npm test` — the sim's tests plus the save-layer tests. Must pass before any commit that touches `app/src`.
- `npm run typecheck` — three configs; `tsconfig.sim.json` checks `src/sim` with no DOM types.
- `npm run format:check` (or `npm run format`) — Prettier, as CI runs it.
- `npm run build`, then `npm run size` (player download against the budget) and `npm run e2e` (a bot plays the first day on the build). Run both before any commit that changes what a player sees.
- `npm run dev` — local dev server.

## Load-bearing rules

- **`index.html` is build output.** Never hand-edit it; the next build overwrites it and the edit never reaches the source. Never text-diff it (`.gitattributes` switches that off); use `npm run compare`.
- **One version.** `package.json` is the source; `npm run stamp` propagates it; `npm run check` fails on drift. The service-worker cache name derives from it (`0.956.0` → `dirtbag-v09560`). Any byte change to `service-worker.js` makes every installed player re-download the whole ~10 MB game, so it only changes with a release.
- **The site is an allowlist.** Only what `scripts/stage-site.mjs` lists ships. `.well-known/assetlinks.json` must always ship: without it the Play app loses domain verification and shows a browser address bar.
- **Nothing leaves the site.** The privacy page promises no network calls, and the smoke test fails on any cross-origin request. No analytics, CDNs or hosted web fonts: the rebuild bundles its fonts (OFL) from `@fontsource`, and its e2e bot fails on any off-site request too.
- **Asset licenses.** The rebuild's art is code; keep it that way unless an asset's licence is written down. The v0.956 sprites come from purchased LimeZu packs. Their itch.io pages mark "redistribute or resell" as not allowed, on top of a CC-style license label, so the terms are ambiguous; the license file inside each pack is the authority. The safe rule, and the one that holds here: this repo is public, so never commit extracted sprite or audio files to it. Raw art belongs in the private source repo. Music is "Bitwise" by tcarisland (CC BY 4.0); the credit stays on the title screen.
- **Pinned tools.** Playwright via `package-lock.json` (the rebuild's e2e uses the same one); the rebuild's toolchain (Vite, TypeScript, React, Vitest, Prettier) at exact versions in `app/package-lock.json`; Bubblewrap (CLI and core — core owns the Android template) via `twa/package-lock.json`. Upgrade them deliberately, in their own commit. The TWA workflow fails if `targetSdkVersion` drops below Play's floor (`MIN_TARGET_SDK`, 36 since 31 Aug 2026).
- **The rebuild's rules** (details in `app/README.md`):
  - **The sim decides; the view stages.** Rules live in `app/src/sim`: no DOM, no `Math.random`, no wall clock, no imports from the layers above. `tsconfig.sim.json` and `purity.test.ts` enforce it. Every state change goes through `act(state, action)`.
  - **Seeded RNG, shared with Unreal.** `sim/rng.ts` matches `Dirtbag-UE/Sim/DirtbagRng` and its golden vectors. If they move, it's save-breaking: log the decision.
  - **Content is data.** Places, acts, routes, beta and lines live in `sim/content/`, checked by `content.test.ts`. Adding content never touches rules.
  - **No hand-typed numbers in text.** Prices, times and effects in the UI are formatted from the same numbers the rules use.
  - **Saves.** Change the state's shape only by bumping `SAVE_VERSION` and registering a migration, with a test that loads an old save. A save that won't load is quarantined, never overwritten.
  - **The 2D game is the spec** for the Unreal version: spec changes get logged in `Dirtbag-UE/concepts/2D-SPEC-LOG.md`.

## Style

- Scripts: Node 20+, ESM, no runtime dependencies. Small files, split by job. Comments explain *why*, not *what*.
- The rebuild: TypeScript, Prettier-formatted, same comment rule. Dials (`sim/dials.ts`) say what each number means and why it's set there.
- Commit messages describe the change and its reason. ROADMAP.md's changelog gets a line per milestone-relevant commit.
- Any player-facing text (release notes, store copy, "What's new"): dry, wry, second-person, climber-authentic, never jokey.
- The cloud container's network policy may block dirtbag.rcjlabs.com; live-site checks run in `deploy.yml` on GitHub's runners.
