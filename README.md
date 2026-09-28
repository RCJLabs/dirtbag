# Dirtbag

A climbing life-sim. Live out of your van, work shifts, and push your grade from gym plastic to the crag.

**Play:** [dirtbag.rcjlabs.com](https://dirtbag.rcjlabs.com) — installable as an app from the browser, and on Google Play (`io.github.rcjlabs.dirtbag`).

## What's in this repository

The live web build and its release pipeline. The game's source code is not here.

| Path | What it is |
|---|---|
| `index.html` | The whole game in one self-contained file (Vite + React; music and sprites inlined). Build output. |
| `service-worker.js`, `manifest.webmanifest`, `icons/`, `favicon.ico` | App shell and offline support |
| `privacy.html` | Privacy policy (the game collects and sends nothing) |
| `.well-known/assetlinks.json`, `twa-manifest.json`, `twa/` | Google Play wrapper (TWA): domain verification, config, pinned build tools |
| `.github/workflows/` | CI, deploy on tag, Play bundle build |
| `scripts/` | Checks, smoke test, size report, build compare, deploy staging |
| `docs/` | The v0.956 audit and the 20-phase roadmap |

## Working on it

```sh
npm ci
npx playwright install chromium
npm run check   # version agrees everywhere, referenced files exist, TWA link intact
npm run smoke   # boots the game headless and plays the first minute
npm run size    # what a player downloads, by part
```

## Releasing

1. Build the game from source and copy the new `index.html` here.
2. Set `version` in `package.json` to the version compiled into that build, then run `npm run stamp`.
3. Run `npm run check` and `npm run smoke`, then commit.
4. Tag and push: `git tag v0.957.0 && git push origin v0.957.0`. The Deploy workflow checks the tag against the build, runs the smoke test on exactly the files it will publish, deploys, then confirms the live site serves the new version and smoke-tests it.
5. For a Play update, run **Actions → Build TWA (AAB)**. It takes the version from `package.json`, and it fails if the Android target SDK is below Play's current floor.

**Rolling back:** run the Deploy workflow by hand on the previous tag.

**One-time setup before the first tag deploy** (repo Settings):
- **Pages → Build and deployment → Source:** set to "GitHub Actions". Until you do, Pages keeps deploying `main` the old way.
- **Environments → github-pages → Deployment branches and tags:** add a tag rule `v*`.

## Status

v0.956.0. The roadmap is in [`docs/ROADMAP.md`](docs/ROADMAP.md); its current milestone is Phase 1, "Source of truth". CI, tag deploys, a single version source and a pinned Play toolchain are in place. Getting the source into a repository is still open.

## Credits

- **Music:** "Bitwise" by tcarisland, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Art:** LimeZu asset packs, used under their license. The asset files are not for redistribution.
- **Game:** © RCJ Labs.
