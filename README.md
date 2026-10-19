# Dirtbag

A climbing life-sim. Live out of your van, work shifts, and push your grade from gym plastic to the crag.

**Play:** [dirtbag.rcjlabs.com](https://dirtbag.rcjlabs.com) — installable as an app from the browser, and on Google Play (`io.github.rcjlabs.dirtbag`).

## What's in this repository

- **The game, in `app/`**, built from source: park-poster landscapes and comic people all drawn in code, side-view scenes joined by a map, and beta-then-send climbing. From 0.960.0 on, its build is the site.
- **The release pipeline** that checks it, stages it, smoke-tests it, deploys it on a tag, and wraps it for Google Play.
- **v0.956**, the game it replaced, retired at 0.960.0. It isn't in the tree any more; commit `e098332` keeps it.

| Path | What it is |
|---|---|
| `app/` | The game: sim, renderer, UI, tests, and the build that makes the site. Its own package; see [`app/README.md`](app/README.md) |
| `privacy.html` | Privacy policy (the game collects and sends nothing; the stores handle purchases) |
| `terms.html` | Terms of use (Phase 19.3: a free first season, the full game bought from a store) |
| `.well-known/assetlinks.json`, `twa-manifest.json`, `twa/` | Google Play wrapper (TWA): domain verification, config, pinned build tools |
| `desktop/` | The desktop build for Steam (Electron): the game from `app/dist` in its own window, its save in a file Steam Cloud syncs, the Record Book as achievements; pinned Electron, packager and steamworks.js, a smoke test. Steamworks setup: [`desktop/STEAM.md`](desktop/STEAM.md) |
| `.github/workflows/` | CI, deploy on tag, Play bundle build, desktop build |
| `scripts/` | Checks, smoke test, staging, version stamping |
| `docs/` | The v0.956 audit and the roadmap |

## Working on it

```sh
npm ci && npm ci --prefix app
npx playwright install chromium
npm run build --prefix app   # the game, which is the site
npm run check                # one version everywhere, the build whole, the Play domain link intact
npm run stage                # the site exactly as it ships, in _site/
npm run smoke                # boots _site/ headless and plays the first minute
npm run size                 # what a player downloads, against the budget
```

The game has its own commands (tests, types, the e2e bot, the balance harness) in [`app/README.md`](app/README.md).

The desktop build (Phase 14.3), once the game is built:

```sh
npm ci --prefix desktop
npm test --prefix desktop             # its save file: written whole, never written over when unreadable
xvfb-run -a npm run smoke --prefix desktop   # opens, saves to its file, comes back, quits (any display will do)
npm start --prefix desktop            # play it
npm run pack --prefix desktop         # a folder for this platform, in desktop/out/
```

## Releasing

1. Set `version` in `package.json`, then run `npm run stamp`. If the release has news for players, put it first in `app/src/game/news.json` under that version: a player back after the update reads it once, and Play's "What's new" takes it as it is (`npm run check` holds it to Play's 500 characters).
2. Build the game (`npm run build --prefix app`), run `npm run check`, `npm run stage` and `npm run smoke`, and commit.
3. Tag and push: `git tag v0.960.0 && git push origin v0.960.0`. The Deploy workflow:
   - checks the tag against `package.json`;
   - builds the game and smoke-tests exactly the files it will publish;
   - deploys;
   - confirms the live site serves this commit, and smoke-tests it.
4. For a Play update, wait until the deploy is live: the bundle build fetches its icons from the site. Then run **Actions → Build TWA (AAB)** and upload the bundle in the Play Console, with the newest note in `app/src/game/news.json` as its "What's new". The build takes the version from `package.json`, and fails if the Android target SDK is below Play's current floor.

5. For a desktop build, run **Actions → Build desktop**: a folder each for Linux, Windows and macOS (Apple silicon), as artifacts, for Steam's depots. They're unsigned until there are certificates to sign them with.

**Play's unlock** (Phase 19.2): the Play Console needs a one-time product with the id `full_game` (the price is set there; the game shows Play's). Try it with a licence tester before launch. **Build TWA** hooks the purchase acknowledger into the app (`twa/acknowledge.mjs`); without it Play refunds every unlock after three days.

**At launch, the gate** (Phase 19.1): before the day, fill in the stores' forms from `docs/PAPERWORK.md` (Play's data safety and content rating, Steam's content survey) and have the privacy page and the terms read. On the day, set `DIRTBAG_GATE` to `'1'` in `deploy.yml` and release, and swap Play's listing for the launch blocks in `docs/STORE.md`. The site then plays the first season till the full game's unlocked; a climber who was here before keeps the full game. Rolling back to a release from before the flip opens the game to everyone while it's live; a climber who started while the gate was on is shut again once it's back on.

**Rolling back:** run the Deploy workflow by hand on the previous release's tag. v0.956 has no tag yet: creating `v0.956.0` on commit `e098332` deploys it, with its own files and its own copy of the workflow, so create that tag only to roll back. Players' saves from both games stay in their browsers either way.

**One-time setup before the first tag deploy** (repo Settings):
- **Pages → Build and deployment → Source:** set to "GitHub Actions". Until you do, Pages keeps deploying `main` the old way.
- **Environments → github-pages → Deployment branches and tags:** add a tag rule `v*`.

## Status

**Live:** the site is 0.999.33, the last release tagged (4 Oct 2026): the game through Phase 25, the whole valley and its five acts, with music made in code.

**On main, not yet released:**
- the deepening run (Phases 26–35);
- the desktop and Steam build, the demo and the store kit (14, 15);
- the gate, Play's unlock and the beta kit (19's code);
- the ten "Hands on" phases (36–45);
- What's new (20.1).

Tagging main puts all of it live (Releasing, above), and a player coming back gets What's new once.

**Now:** Phase 20, launch, live updates and the Unreal decision. Most of it is yours: the stores, the testers, the day. [`docs/LAUNCH.md`](docs/LAUNCH.md) has it in order, with what launch leaves open. The roadmap is [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Credits

- **Art:** drawn in code, no asset packs.
- **Fonts:** Patrick Hand, Patrick Hand SC and Big Shoulders Display, [SIL Open Font License](https://openfontlicense.org), self-hosted.
- **v0.956 (retired):** music "Bitwise" by tcarisland, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); art from LimeZu asset packs, used under their license. The asset files are not for redistribution.
- **Game:** © RCJ Labs.
