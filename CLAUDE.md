# CLAUDE.md — Dirtbag (web)

Climbing life-sim: live out of your van, work shifts, push your grade from gym plastic to the crag. This repo is the **released** web game (dirtbag.rcjlabs.com, a PWA, also on Google Play as a TWA), its release pipeline, and the planning docs. Solo dev (Evan, RCJ Labs).

**What is and isn't here.** `index.html` is build output: one ~15 MB file (Vite + React 19, single-file build) with every track and sprite inlined as base64. The source it's built from is **not in this repo** — getting it into a private repo is the open item of Phase 1. Until it lands, gameplay and UI changes are blocked; the pipeline, service worker, manifests, TWA config and docs are fair game.

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

## Load-bearing rules

- **`index.html` is build output.** Never hand-edit it; the next build overwrites it and the edit never reaches the source. Never text-diff it (`.gitattributes` switches that off); use `npm run compare`.
- **One version.** `package.json` is the source; `npm run stamp` propagates it; `npm run check` fails on drift. The service-worker cache name derives from it (`0.956.0` → `dirtbag-v09560`). Any byte change to `service-worker.js` makes every installed player re-download the whole ~10 MB game, so it only changes with a release.
- **The site is an allowlist.** Only what `scripts/stage-site.mjs` lists ships. `.well-known/assetlinks.json` must always ship: without it the Play app loses domain verification and shows a browser address bar.
- **Nothing leaves the site.** The privacy page promises no network calls, and the smoke test fails on any cross-origin request. No analytics, CDNs or web fonts.
- **Asset licenses.** The sprites come from purchased LimeZu packs. Their itch.io pages mark "redistribute or resell" as not allowed, on top of a CC-style license label, so the terms are ambiguous; the license file inside each pack is the authority. The safe rule, and the one that holds here: this repo is public, so never commit extracted sprite or audio files to it. Raw art belongs in the private source repo. Music is "Bitwise" by tcarisland (CC BY 4.0); the credit stays on the title screen.
- **Pinned tools.** Playwright via `package-lock.json`; Bubblewrap (CLI and core — core owns the Android template) via `twa/package-lock.json`. Upgrade them deliberately, in their own commit. The TWA workflow fails if `targetSdkVersion` drops below Play's floor (`MIN_TARGET_SDK`, 36 since 31 Aug 2026).
- **Game-code rules live with the source.** Save discipline, seeded RNG, the sim/UI split and the voice rules are in `docs/ROADMAP.md` (Phases 2 and 4) and the Unreal repo's CLAUDE.md; they apply the day the source arrives.

## Style

- Scripts: Node 20+, ESM, no runtime dependencies. Small files, split by job. Comments explain *why*, not *what*.
- Commit messages describe the change and its reason. ROADMAP.md's changelog gets a line per milestone-relevant commit.
- Any player-facing text (release notes, store copy, "What's new"): dry, wry, second-person, climber-authentic, never jokey.
- The cloud container's network policy may block dirtbag.rcjlabs.com; live-site checks run in `deploy.yml` on GitHub's runners.
