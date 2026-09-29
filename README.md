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
| `privacy.html` | Privacy policy (the game collects and sends nothing) |
| `.well-known/assetlinks.json`, `twa-manifest.json`, `twa/` | Google Play wrapper (TWA): domain verification, config, pinned build tools |
| `.github/workflows/` | CI, deploy on tag, Play bundle build |
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

## Releasing

1. Set `version` in `package.json`, then run `npm run stamp`.
2. Build the game (`npm run build --prefix app`), run `npm run check`, `npm run stage` and `npm run smoke`, and commit.
3. Tag and push: `git tag v0.960.0 && git push origin v0.960.0`. The Deploy workflow:
   - checks the tag against `package.json`;
   - builds the game and smoke-tests exactly the files it will publish;
   - deploys;
   - confirms the live site serves this commit, and smoke-tests it.
4. For a Play update, wait until the deploy is live: the bundle build fetches its icons from the site. Then run **Actions → Build TWA (AAB)** and upload the bundle in the Play Console. The build takes the version from `package.json`, and fails if the Android target SDK is below Play's current floor.

**Rolling back:** run the Deploy workflow by hand on the previous release's tag. v0.956 has no tag yet: creating `v0.956.0` on commit `e098332` deploys it, with its own files and its own copy of the workflow, so create that tag only to roll back. Players' saves from both games stay in their browsers either way.

**One-time setup before the first tag deploy** (repo Settings):
- **Pages → Build and deployment → Source:** set to "GitHub Actions". Until you do, Pages keeps deploying `main` the old way.
- **Environments → github-pages → Deployment branches and tags:** add a tag rule `v*`.

## Status

The live site is 0.961.0, released 29 Sep 2026: the rebuilt game's first season, Act I, from gym plastic to your first V5 project (0.960.0, R3), plus Phase 10 (Send City's board, conditions you can see, Moonstone Boulders) and Phase 11 (the valley's roads, place cards, the daily plan). A v0.956 player who opens the new game is told v0.956 has retired, can keep their career as a file, and can carry on under their old name. The current milestone is Phase 14, the desktop and Steam build ([`docs/ROADMAP.md`](docs/ROADMAP.md)).

## Credits

- **Art:** drawn in code, no asset packs.
- **Fonts:** Patrick Hand, Patrick Hand SC and Big Shoulders Display, [SIL Open Font License](https://openfontlicense.org), self-hosted.
- **v0.956 (retired):** music "Bitwise" by tcarisland, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); art from LimeZu asset packs, used under their license. The asset files are not for redistribution.
- **Game:** © RCJ Labs.
