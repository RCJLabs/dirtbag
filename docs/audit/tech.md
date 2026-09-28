# Dirtbag — Technical Health & Ship-Readiness Audit

Scope: repo/build, runtime architecture, save system, RNG, dev/debug surface, performance, store/sell readiness,
licensing, and a target architecture + migration path (informed by `Dirtbag-UE`).
Line refs are to `$SRC/bundle.pretty.js` unless a file is named. **[ESTABLISHED]** = read in code/data or measured;
**[INFERRED]** = reasoning. Measurements: headless Chromium 1194 (Playwright) against a local static server
serving the repo root, 390×844 mobile viewport. "4×" = CDP CPU throttling at 4× (the Lighthouse convention for a
mid/low-range Android phone). Probe scripts: `$SP/work-tech/{measure,profile,mem,trace,corrupt,brick,clockpause,savecost}.js`.

---

## 1. Summary

1. **A 15.3 MB single HTML file, with no source in git.** [ESTABLISHED] The file is 8.36 MB of base64 MP3, 4.72 MB of base64 PNG and 2.24 MB of JS. Gzipped it is 9.81 MB. Nothing paints until the whole file has been downloaded and parsed. After the bytes arrive, reaching the title screen costs **2.6 s of main-thread work at 4×**, with long tasks up to 593 ms. The 8 MP3s in `/music` are byte-identical copies of the embedded ones and are never fetched (6.27 MB of dead weight). The visible git history is 59 commits of the form "Add files via upload" / "Update game to vX build", all compiled output.
2. **A corrupt save is silently wiped.** [ESTABLISHED, tested] `Ipe` (34218) returns a fresh game on any parse or normalise error. The autosave (36447) then overwrites the real save within 400 ms, even on the title screen. A day-412 save was replaced by day 1 in under 2.5 s, from truncated JSON and also from a single `gear: null`. There is no backup, no save version field and no quarantine.
3. **No error boundary: one bad field can leave the game permanently blank.** [ESTABLISHED, tested] `achievements: null` or `ticks: null` in the save gives a blank screen on every launch. The player cannot reach Settings to export or reset. The only way out is clearing site data, which loses the save.
4. **The game rewrites the whole save every second.** [ESTABLISHED, measured] A 1 Hz interval advances the clock (38650). Each tick re-renders the whole 66K-line `Xpe` (2 commits/s) and runs `JSON.stringify` + `localStorage.setItem` of the full save (1 write/s). At 4× that costs 0.16 ms for a fresh 10 KB save, 27 ms at 391 KB and 90 ms at 1 MB. `ticks[]` and `legacy[]` are never trimmed, so a late-game save will stutter once a second. Autosave failures (quota) are swallowed silently.
5. **Settings does not pause the game clock.** [ESTABLISHED, tested] `Gx` is missing from the 22-flag pause conjunction at 38626–38649. The clock went 8:04 → 8:10 in 6 s with Settings open, and 8:03 → 8:03 with the menu open. Save/Load/Import, the changelog and the privacy text all sit inside Settings, so reading them costs game time.
6. **Zone changes freeze the game for 150–470 ms at 4×.** [ESTABLISHED, measured] The main cause is a synchronous 1792×256 canvas composite plus PNG `toDataURL` for each new NPC look, called from inside the rAF loop (`vB` 14727, call at 38413). Each composite costs 20–97 ms at 4×; 15 of them across 5 zone changes added up to 816 ms. They are cached forever. Renderer RSS went from 279 MB at the title screen to 397 MB after 9 zone changes. The worst-case decoded sprite memory is 230 MB, 147 MB of it from the 80 preloaded character-layer sheets.
7. **Offline and update layer has defects.** [ESTABLISHED] The service worker serves navigations cache-first, so the first launch after a deploy shows the old version, with no update prompt. It caches navigation responses without checking `res.ok`, so a captive-portal or 404 page can replace the cached game. It precaches the 15 MB page twice (Cache Storage measured at 31.0 MB). Each deploy re-downloads about 10–20 MB per player.
8. **Debug surface ships to players.** [ESTABLISHED] `?dev` unlocks a dev panel (+$10k, V16 skills, teleport). The flag persists, and in the TWA any link to `dirtbag.rcjlabs.com/?dev` opens inside the app. The World Editor sits in player Settings, with copy that says "paste it into a chat". There is no crash reporting, analytics, keyboard or gamepad input, landscape layout, Android Back handling or i18n. The text is about 90K words of inline English.
9. **Ship blockers by store.** [INFERRED]
   - Play: the TWA works. It needs a pinned Bubblewrap/targetSdk, a content-rating questionnaire (simulated gambling, alcohol, romance, death in Free Solo) and a privacy-text fix to mention hosting. Any paid model conflicts with the free web build, and in-app purchases would need Digital Goods API / Play Billing.
   - Steam / Deck: needs an Electron wrapper, keyboard and gamepad input, a landscape/scaled UI and file saves for Steam Cloud.
   - Licensing: the raw LimeZu sprites sit in a public repo; verify this against LimeZu's licence. "Olympic" is used 26 times; this is a trademark question. Music attribution for "Bitwise" (CC BY 4.0) is done correctly.
10. **Recommended path: stabilize, then strangle — no freeze.** Put the source in git with CI, harden saves, and add an error boundary and a fixed service worker (all S effort). Then split assets, add a versioned save with a migration registry, and do a TypeScript conversion that extracts a React-free `sim/` core. Its seeded named-stream RNG would be bit-identical to Dirtbag-UE's `DirtbagRng`, with shared golden vectors. Add JSON content tables, a UI state machine, tests and CI. Note that Dirtbag-UE's docs say the 2D game is "at SAVE_VERSION 31" (`concepts/DIRTBAG.md:95`), but **the shipped build has no save version at all**.

---

## 2. How it works — mechanics, numbers, formulas

### 2.1 Repo & build artefact

| Item | Value | Status |
|---|---|---|
| `index.html` | 15,341,924 B, 186 lines | [ESTABLISHED] |
| line 4 `window.__AUDIO__` | 8,355,579 B (8 MP3 data-URIs); gzip-6 5.85 MB, brotli-11 5.65 MB | [ESTABLISHED] |
| line 5 `window.__ASSETS__` | 4,747,131 B (674 PNG data-URIs; 3.54 MB raw PNG); gzip 3.28 MB | [ESTABLISHED] |
| lines 17–170 module script | 2,237,693 B JS (React **19.2.7** + app); gzip 0.68 MB, brotli 0.53 MB | [ESTABLISHED] |
| Whole file on the wire | **9.81 MB gzip-6** / 9.39 MB brotli-11 | [ESTABLISHED] |
| `/music/*.mp3` | 8 files, 6,266,407 B, **byte-identical to the embedded tracks** (SHA-1 match). They are only reached through `rB`'s fallback `Gpe + e` (34765–34779), which can never trigger because all 8 keys exist in `__AUDIO__` | [ESTABLISHED] |
| Music | 8 tracks, ≈11.1 min total (1.0–2.13 min each), 44.1 kHz joint-stereo VBR ~56–64 kbps | [ESTABLISHED] |
| `<meta charset>` / `<title>` | come *after* 13 MB of inline data (html lines 6, 16). The page relies on the HTTP charset header; Chrome's `file://` test still decoded UTF-8 correctly | [ESTABLISHED] |
| favicon | no `<link rel=icon>` → `/favicon.ico` 404 on every load | [ESTABLISHED] |
| Git | Shallow clone, 59 commits, 2026-07-11 → 07-27, all "Add files via upload" / "Update game to v0.9xx build". The `.git` pack is 25.8 MB. No source, no build config, no tests | [ESTABLISHED] |

`Oe(name)` (10829) returns `__ASSETS__[name] ?? "/world/${name}.png"`. The absolute fallback path is a leftover from dev and would 404 under an itch.io-style sub-path [ESTABLISHED code / INFERRED impact]. Of the 674 sprites, 461 are referenced literally and 207 through dynamic prefixes (`cl_`, `pg_`, `me_car_`, `critter_`, `npc_`). Only 6 (78 KB b64: bush, cliff, hospital, store, tent, tuft) have no reference found, so dead art is negligible [ESTABLISHED].

### 2.2 Runtime architecture

- **Single root component.** `GF.createRoot(#root).render(<StrictMode><Xpe/></StrictMode>)` (104899). `Xpe` spans 35,846–102,104:
  - about 20.9K lines of hooks and handlers (35,846–56,744);
  - about 45.4K lines of returned JSX (56,745–102,104), with 4,912 `jsx()` calls and 462 top-level `cond &&` render blocks.

  App code has 4,613 inline `style:{}` objects and 14 `className`s [ESTABLISHED].
- **Hook counts in `Xpe`** [ESTABLISHED]: 249 `useState` (75 boolean, 126 `null`-initialised "modal with payload", 48 other), 86 `useEffect`, 2 `useLayoutEffect`, 172 `useRef`. The whole app has zero `useMemo`, `useCallback`, `React.memo`, `useReducer` or `useContext`.
- **Game state.** One object `e`, set by `i`, initialised from `Ipe` (35848). It has 498 top-level fields (81 arrays, 82 objects, 335 primitives) per the default `mv` (13998–14511); default JSON is 9.06 KB. Settings (`muted`, volumes, `textScale`…) live inside the save. A mirror ref `$.current = e` is written *during render* (36426–36427) and read 577 times by handlers and loops, which avoids stale closures [ESTABLISHED].
- **Location is not game state.** Current zone `Re` = `useState(Ej)` with `Ej = "lot"` (35890, 14512). Player position `Dn.current` is a ref. Neither is saved [ESTABLISHED].
- **Update style.** 187 functional updates `i(x => …)` vs 209 "snapshot" writes `i({ ...<snapshot>, … })`, where the snapshot usually comes from `$.current` (e.g. busking 42466–42479) [ESTABLISHED]. Section 4 covers the lost-update risk.
- **Clock.** `setInterval(1000)` calls `i(o => Epe(o))` when `US.current` is true (38650–38655). `Epe` adds 1 game minute (33983–33988): **1 real second = 1 game minute**. The measurement matched: 8:05 → 8:15 in 10 s [ESTABLISHED]. `US.current` is a 22-term conjunction of "no overlay open" flags recomputed every render (38626–38649). It does not include document visibility.
- **Frame loops.** One world loop in `useEffect(…, [])` (38070–38527) moves the player, 12 NPC walkers, 6 critters, dog, partner and cars by writing `style.transform` / `backgroundPosition` straight to refs. That avoids React per frame (good). It has no screen gate, so it keeps simulating behind full-screen panels. Collision `X(P,V)` scans all buildings and decor for each entity on each call (38115–38141). There are 30 rAF sites in `Xpe` (minigame bars 41217–41342, etc.), and each effect returns `cancelAnimationFrame` [ESTABLISHED].
- **Timers.** Inside `Xpe`: 3 `setInterval` (all cleared), 121 `setTimeout` against 25 `clearTimeout`. Most are fire-and-forget UI delays. `Xpe` never unmounts, so none of this leaks, but late timeouts can apply to a changed context. There are 5 add/remove event-listener pairs [ESTABLISHED].
- **State-driven effects.** Three effects depend on the whole `e`: autosave (36447), tips (38608, `Ope.find(o => o.when(e))`) and the quest engine (38692, `Vpe(e)` over all `ur` arcs). The achievements scan `f1.filter(n => !e.achievements.includes(n.id) && n.check(e))` runs **in the render body** (36517). All of these run on every clock tick [ESTABLISHED].
- **Audio.**
  - SFX are synthesised in WebAudio (33691–33876): one `AudioContext`, oscillator blips, and a looping 2 s noise buffer for wind and rain.
  - Music is one `HTMLAudioElement` whose `src` is swapped between data-URIs by zone (`sB` 34780–34795; `Yc` 36486–36496; created 36497–36513).
  - The only `visibilitychange` listener is the wake lock's (36475). Nothing pauses music when the app is backgrounded [ESTABLISHED code; INFERRED behaviour].
- **Input.** Movement is only the on-screen joystick `zye` (104836), which uses pointer events. App code has no keyboard movement, no Gamepad API and no `popstate`/`history` handling (the only hits are React internals). There is no responsive or orientation logic: no `innerWidth`/`matchMedia`, portrait only [ESTABLISHED].
- **Character looks.**
  - `WU` (14709) preloads all `qi` layers as `new Image()` at mount: 10 body + 7 eyes + 20 outfits + 29 hair + 14 accessories = **80 sheets at 1792×256**.
  - `NU` (14755) preloads 43 portrait layers.
  - `vB` (14727) composites a look onto a 1792×256 canvas and calls `toDataURL("image/png")`, caching the result in `HE: Map` (14706). `HE` is unbounded.
  - `BU` does the same for 96×96 portraits [ESTABLISHED].

### 2.3 Save system

| Key | Written by | Content |
|---|---|---|
| `dirtbag-save-v3` (`DR`, 13997) | autosave effect 36447–36454: 400 ms debounce on every change of `e`; `catch {}` swallows errors | the full `e` as JSON |
| `dirtbag-slot-{1,2,3}` (`f6`, 34678) | `Npe` (34700); UI `bG` 46855 | a full copy of `e` |
| `dirtbag-slot-{n}-meta` (`s6`, 34679) | `Npe` / `oB` (34680, which backfills meta by parsing the full slot during render) | `{name, day, grade, cash, savedAt}` |
| `dirtbag-whatsnew-seen` (`eB`, 34226) | 46792 | last seen version string |
| `dirtbag-dev` | 36145, 72265 | `"1"` = dev tools on |

- **Load.** `Ipe` (34218–34224): `JSON.parse` → `H$` → state. On any exception it returns `mv`, the default object itself (not a copy) [ESTABLISHED].
- **Normalise.** `H$` (34172–34217) does a shallow `{...mv, ...save}` plus about 10 ad-hoc repairs: `equipped`/`chalkStock`/`kit`/`deals` types, `discRank` from `natlPts`, `equippedShoes` → `equipped.shoes`, the old `climbing` number → 5 skills, `lastShiftDay`/`lastClimbDay`/`created`/`calling`/`onboard` backfills, and job renames setter→gym and coach→cave. There is **no version number anywhere**. The key suffix `-v3` is the only schema signal, and no code reads v1 or v2 keys [ESTABLISHED].
- **Nested objects are not backfilled.** Because the merge is shallow, a save's `needs` replaces `mv.needs` whole. Tested: a save with `needs` but no `cash` loads and persists `cash: null` [ESTABLISHED, tested]. The codebase compensates with about 1,500 defensive reads: 727 `?? 0`, 159 `?? []`, 156 `?? {}` and 483 optional-chaining guards [ESTABLISHED].
- **Export and import.**
  - Export: `Lpe` = `JSON.stringify({dirtbag:1, state})` (34722). It is uncompressed and has no checksum; it is copied to the clipboard with a `textarea`/`execCommand` fallback (46745–46769).
  - Import: `Ppe` (34723–34737) checks only that `dirtbag === 1`, `state` is an object, `state.day` is a number and `state.needs` is an object, then runs `H$`. A bad code gets "That doesn't look like a Dirtbag save code — paste the whole thing." (46832). Import needs a double tap and replaces the current run (46830–46847).
- **Slots.** Three slots (100419), with double-tap overwrite and delete. Load slot → `H$` (34709). "New game" = `{...mv}` (46886) and "Start over" = `{...mv, introSeen:true}` (52934). Both are shallow copies that share nested default objects with `mv` [ESTABLISHED].
- **Diagnostics.** `pG` (46796–46829) copies the version, day, grade, cash, rep, zone, crag, save size and 10 flags. It has no user agent, errors, storage estimate or seed.
- **Storage status (measured).** `navigator.storage.persisted()` = **false**, and the game never calls `persist()` [ESTABLISHED].

### 2.4 RNG

- In app code (after line 10,812): **473 `Math.random()` calls, 385 of them inside `Xpe`**. Examples: climb attempts pre-roll `E = b.map(() => Math.random())` then resolve with the pure `VD(moves, oddsFn, beats, rolls)` (41478–41479, 29105–29119); nightly events are several independent `Math.random() < p` checks in the sleep handler (47821–47882); NPC looks come from `BE` (14697).
- Seeded or hash helpers: `$t` = Java-style string hash `h = h*31 + c` (24415); `Lt(x) = fract(sin(x)·43758.5453)` (24420), a GLSL-style hash; `sa` = the murmur3 `fmix32` finaliser (22221). Counts: 59 `$t`, 51 `Lt`, 23 `sa` [ESTABLISHED].
- What is deterministic: weather per `(crag, day)`, `_x = Lt(day*101 + $t(cragId))` (24424–24431); various day-keyed flavour picks (e.g. dog lines 14681). What is not: everything that decides outcomes (sends, falls, events, rewards, NPC generation) [ESTABLISHED].
- There is no `crypto`, no RNG state in the save and no seed.

### 2.5 Dev & debug surface

- **`?dev` / `?dev=1`** sets `localStorage["dirtbag-dev"]="1"` (36138–36151); `?dev=0|off` clears it. A 🔧 tab opens a panel (71856–72286) with: +$1k/+$10k, clear debt, fill/drain needs, heal, skills to V10/V16/+100, +50 rep, +2k followers, sponsor offer, claim dreams, all gear, unlock crags, grant mentee, teleport to any crag (hidden ones included), Olympic Village with qualification, and day/time shifts [ESTABLISHED].
- **World Editor.** Settings → "WORLD EDITOR / Edit mode" (93500–93529) is **not** behind the dev flag. It drags, adds, deletes and resizes decor, trees, rocks and buildings, then copies a layout diff "paste into a chat to apply" (35972–36028). Edits live only in UI state (`is/lf/gc/pc`, 35956–35959) and are lost on reload [ESTABLISHED].
- **Error boundaries.** None in app code: every `componentDidCatch`/`getDerivedStateFromError` hit is inside React (lines < 10,812). There is no `window.onerror` or `unhandledrejection` handler, and **no `console.*` calls in app code**, so the console is clean [ESTABLISHED].

### 2.6 Service worker, PWA & TWA

- **`service-worker.js`** [ESTABLISHED]:
  - `CACHE='dirtbag-v09560'`, bumped by hand (line 4).
  - The shell precaches `./` **and** `./index.html` (6–7), i.e. two copies of 15 MB, plus the manifest and icons.
  - Install uses `allSettled` + `skipWaiting` (16–21). Activate deletes old caches and calls `clients.claim` (23–28).
  - Navigations: return the cached `index.html` immediately while `fetch(req)` refreshes the cache in the background, **without checking `res.ok`** (34–44).
  - Other GETs: cache-first, caching only `200/basic` responses (48–56).
- **`manifest.webmanifest`**: `start_url ./index.html`, `display standalone`, `orientation portrait`, 4 icons (any + maskable). No screenshots or shortcuts [ESTABLISHED].
- **`twa-manifest.json`**: package `io.github.rcjlabs.dirtbag`; `appVersionName "0.670.0"` and `appVersionCode 670` are stale (the game is 0.956.0); `minSdkVersion 23`; `fallbackType customtabs`; `enableNotifications false`; `orientationLockEnabled true` [ESTABLISHED].
- **`.github/workflows/build-twa.yml`** is manual (`workflow_dispatch`) [ESTABLISHED]:
  - The `versionName` input defaults to **`'0.821.0'`**, also stale (line 12).
  - Node 20, JDK 17, `android-actions/setup-android@v3`.
  - `npm install -g @bubblewrap/cli` is **unpinned**, so the target SDK and template change silently.
  - The keystore comes from a secret.
  - `versionCode = (now − 1.7e9)/60` gives about 1.5 M today; monotonic, and under the 2.1 B cap.
  - `bubblewrap update --skipVersionUpgrade`, then `gradlew bundleRelease`, `jarsigner` with the upload key, and an AAB artifact upload.
  - Play upload is manual. The workflow edits `twa-manifest.json` only on the runner, never in the repo.
- **`.well-known/assetlinks.json`**: `handle_all_urls` for the package with **two SHA-256 fingerprints**, presumably the upload key and the Play app-signing key, which is the correct setup. `.nojekyll` is present, so the dot-folder is served [ESTABLISHED].
- **`CNAME`** = `dirtbag.rcjlabs.com`. It was created and deleted 4× on 07-16/17, which looks like domain-setup churn [ESTABLISHED].

---

## 3. Content inventory (technical)

| Thing | Count / size | Ref |
|---|---|---|
| Embedded sprites | 674 PNG, 57,415,861 px → **229.7 MB RGBA if all decoded** | `assets_line` |
| … `me_*` (Modern Exteriors-style) | 177 sprites, 1.54 MB PNG, 25.4 MB decoded | |
| … `cl_*` character layers | 80 sheets 1792×256, 0.43 MB PNG, **146.8 MB decoded** | qi 14695 |
| … walker sheets | `npc_*` = 10 images, of which 8 are 1792×256 sheets (npc_1–6, mom, dad; 14.7 MB decoded); named sheets sage/rico/mara/hazel/dex = 5 × 1792×256 (9.2 MB decoded) | |
| … `char_dirtbag` | 1 sheet 1792×1280 = 9.2 MB decoded | gU 14517 |
| … images > 1024 px on a side | 94 | |
| Music tracks | 8 (≈11.1 min), 6.27 MB MP3 | aB 34766 |
| Save fields | 498 top-level (81 arrays / 82 objects / 335 scalars) | mv 13998 |
| Large data tables | 156 tables, ≈13.8K lines (largest: `ur` quests 756, `Xt` gear 524, `Kj` 466, `yD` 393, `tB` changelog 391, `b$` 377) | tables_map |
| Function-valued table fields | ≈110 (`check` 34, `when` 33, `req` 17, `met` 12, `test` 8, …). Everything else is plain data and JSON-able | 15590–35845 |
| User-facing English text | ≈86–92K words in ≈8.7–10.5K string literals (heuristic count); ≈35K words inline in `Xpe` | strings.js |
| Inline English plural ternaries (`n===1?"":"s"`) | 80; `Intl.*` 0; `toLocaleString` 46 | |
| Emoji used as icons | 346 uses, 102 distinct (✕ 82, ★ 51, ✓ 36 …) | |
| `Math.random()` sites | 473 (385 in `Xpe`) | |
| React hooks in `Xpe` | 249 state / 86 effect / 2 layout / 172 ref / 0 memo | |
| Modal-ish states | 75 booleans + 126 nullable payload states; 462 conditional render blocks | |
| rAF loops / intervals / timeouts | 30 / 3 / 121 | |
| localStorage keys | 5 kinds (save, 3 slots + 3 metas, whats-new, dev) | 34678 |
| Defensive fallbacks | ≈1,525 (`?? 0/[]/{}` + optional chaining) | |
| Real-world names | "Olympic(s)" 26×, trivia names (Honnold, Caldwell, Lynn Hill…), "Access Fund" (55513), Patagonia (founder trivia + a region), IFSC | 15645ff |

---

## 4. Bugs & defects

### Confirmed (reproduced or directly readable)

| # | Defect | Ref | Failing scenario |
|---|---|---|---|
| B1 | **Corrupt save → silent total wipe.** `Ipe` returns `mv` on any exception; the unconditional autosave effect writes it back 400 ms after mount, even on the title screen | 34218–34224, 36447–36454 | **Tested:** a day-412 save that was truncated JSON, or valid JSON with `gear:null` (H$ throws on `i.gear.includes` at 34184), was replaced by a day-1 default within 2.5 s. "Continue" disappeared. No backup exists. |
| B2 | **Render exception → blank screen on every launch.** No error boundary; the render body reads fields unguarded (e.g. `e.achievements.includes` at 36517) | 36517, 104899 | **Tested:** `achievements:null` or `ticks:null` gave an empty `#root` on load, after Continue and after reload. The player cannot open Settings to export or reset. Import (`Ppe`) validates only `day`/`needs`, so a hand-edited or cross-version code can brick the install. |
| B3 | **Settings doesn't pause the clock.** `Gx` (settings open) is absent from the pause conjunction | 38626–38649, 36954 | **Tested:** menu open 8:03→8:03; Settings open 8:04→8:10 in 6 s. Save/Load/Export/Import/changelog/privacy/terms all live in Settings; 10 real minutes there = 10 game hours. Autosave keeps firing the whole time. |
| B4 | **1 Hz full-state autosave + extra render.** The clock tick changes `e`, so autosave runs about every 1,000 ms. `Or(Date.now())` then sets another state, forcing a second commit | 36447–36454, 38650 | **Measured:** 2.0 commits/s, 1.0 `setItem`/s (10.6 KB/s on a fresh save). Cost at 4×: 111 KB → 6 ms, 391 KB → 27 ms, 1 MB → 90 ms per second, i.e. a dropped frame every second once saves grow. |
| B5 | **Autosave failure is silent** | 36449–36451 | When quota is exceeded or storage is disabled, play continues with no persistence. On the next launch, progress since the last good write is gone. (Slot saves do toast "Save failed — storage may be full", 46862.) |
| B6 | **Unbounded save arrays.** `ticks` appends on every send (48734) and first ascent (53394); `legacy` is appended at ≈30 sites; neither is trimmed (unlike `recentMeals`, `setLog`, `wxLog`, `scenePosts`, `clips`, `projLog` via `yce` 29067) | 48734, 53394, 36553ff | Main save + 3 full slot copies all count against one origin quota of ~5–10 MB. The emoji and curly quotes in `legacy` force 2-byte storage. [INFERRED] roughly 600 KB saves with 3 filled slots approach a 5 MB quota. |
| B7 | **Shallow migration doesn't backfill nested fields** | 34173 | **Tested:** `needs` without `cash` → `cash:null` persisted. Any new key added to `needs/habits/vanParts/spares/factionRep/clubRep/sendsByType/styleXP/discRank/personality` is `undefined` for existing players unless every read uses `?? 0`. |
| B8 | **H$ mutates the shared defaults.** For a save lacking `equipped`/`chalkStock`, `i.equipped` *is* `mv.equipped`, and lines 34183–34186 write `.shoes`/`.chalk` into it. `Ipe` returns `mv` itself when there's no save, and New Game uses the shallow `{...mv}` | 34175–34186, 34223, 46886 | Low probability (legacy saves only), but defaults can bleed into later "New Game" runs in the same session. |
| B9 | **Zone and position not persisted** | 35890, 14512 | Any reload, or Android killing the backgrounded TWA (plausible at 280–400 MB renderer RSS), respawns you at The Lot, even mid-crag-day. `currentCrag` persists while the scene does not. |
| B10 | **SW caches failed or foreign navigation responses** | sw:37–40 | [INFERRED scenario] Launch on hotel Wi-Fi: the captive-portal HTML (or a GitHub 404/5xx during a deploy) is `put` as `./index.html`. The next offline launch shows that page instead of the game until a good fetch overwrites it. |
| B11 | **SW precaches the 15 MB page twice** | sw:6–7 | **Measured** Cache Storage 30,973,950 B. On install and on every CACHE bump, the URL not used for navigation is downloaded again (up to +9.8 MB gzip). |
| B12 | **Stale-version first launch, no update UX** | sw:34–44 | After a deploy, launch N shows the old build. The new SW `skipWaiting` + `claim`s under the old page, and the new build appears on launch N+1, or N+2 if the 10-min HTTP cache served the old HTML to `cache.add` [INFERRED]. |
| B13 | **Dev cheats in production** | 36138–36151, 71856–72286 | `https://dirtbag.rcjlabs.com/?dev` gives +$10k, V16 and teleport. It persists in localStorage, and assetlinks `handle_all_urls` means a shared link opens the Play build with cheats on. This matters the moment achievements, leaderboards or a paid tier exist. |
| B14 | **World Editor in player Settings** | 93500–93529, 36013–36020 | A player can drag buildings, sees "Copied … paste it into a chat" and loses the edits on reload. |
| B15 | **Zone-change hitches** | 14727–14749 via 38413 | **Measured at 4×:** long tasks 467/375/262/227/169/149 ms across 5 transitions; 15 composites × 20–97 ms (816 ms total) of synchronous PNG encoding inside rAF. Each unique look adds a ~42 KB data URL to `HE` for good plus a 1.84 MB decoded bitmap. |
| B16 | **What's-new frozen at 0.691** | tB 34286; 46779–46795 | The game is 0.956, so returning players have seen no release notes for about 265 versions. `nB=parseFloat` (34677) will also mis-order a future `0.1000` vs `0.999`. |
| B17 | **Version drift** | 34225; sw:4; yml:12; twa-manifest | `0.956.0` / `dirtbag-v09560` / default `0.821.0` / `0.670.0 (670)` are four manually synced values, three of them stale. |
| B18 | **Privacy wording is inaccurate** | 34243; privacy.html | "No network requests of any kind / no calls to any server". The game is served by GitHub Pages and the SW re-fetches `index.html` on every launch (sw:37), so GitHub sees IP and user agent. Play data-safety most likely stays "no data collected", but the text should mention hosting. |
| B19 | **Terms say "provided free"** | 34264 | Must change before any paid SKU. |
| B20 | **favicon 404** on every page load | index.html | Cosmetic, and shows up in consoles and Lighthouse. |

### Suspected (mechanism in code; not reproduced end-to-end)

| # | Defect | Ref | Scenario |
|---|---|---|---|
| S1 | Other overlays also missing from the pause list: slot modal `lc`, import `Ju`, changelog `Ih`, docs `sf`, dev tools `Rc`, World Editor `el`, what's-new `Mx`, tip card `Fl` | 38626–38649 | The clock keeps running behind them, same as B3. |
| S2 | The clock runs while hidden. The 1 s interval has no visibility gate | 38651 | In a browser tab: about 1 game-min/s for the first ~5 min hidden, then Chrome's intensive throttling (~1/min). In the TWA the page is frozen after a while. Either way game hours pass while the player isn't looking. |
| S3 | Music keeps playing after leaving the app. No `visibilitychange`/`pagehide` handler touches the music element | 36497–36516 | Android Chrome keeps playing audio-only media for a background page, with a media notification. Verify on device. |
| S4 | The Android Back button exits the game (no history entries per overlay) | — | The player presses Back to close a shop panel and the TWA closes. The last 400 ms of state may be unsaved. |
| S5 | Lost updates from snapshot writes. `i({...r,…})` built from `$.current` replaces the whole state and drops functional updates queued in the same batch (e.g. the clock tick, the debt autopay layout effect at 36438) | e.g. 42466 | Usually only a lost game-minute, but the class of bug grows with each new effect. |
| S6 | Force-quit rerolls. Outcomes rolled into UI state (event modals, pending choices) before a persisted state change can be rerolled by killing the app | 47821–47882 | Mild exploit; also sets up save-scum. |
| S7 | Save-scumming undermines Free Solo permadeath ("no comeback", 100580). Slots, Load and Import stay available, and rolls are `Math.random` at action time | 34678–34737, 41480–41500 | Save to a slot → solo a route → fall → Load slot. The same trick rerolls any bad send or event. |
| S8 | Storage eviction and browser switching. The save is best-effort (`persisted:false`, measured), and TWA storage lives in the provider browser | — | Clearing Chrome's site data, low-storage eviction, or changing the default browser to another TWA provider all make the Play app open with no save [INFERRED from platform behaviour]. For Safari browser-tab play, script-writable storage can be deleted after 7 days without interaction. |
| S9 | The world loop and 123 layer preloads keep burning CPU and memory behind full-screen UI (title, menus) | 38070, 14709 | Battery and thermals on phones [INFERRED]. |

---

## 5. Balance & pacing — performance and scaling budgets (early / mid / late game)

### 5.1 First launch on a mid-range Android phone

| Phase | Number | Basis |
|---|---|---|
| Download (nothing painted meanwhile) | 9.81 MB gzip → **3.9 s @20 Mbps, 7.8 s @10 Mbps, 15.7 s @5 Mbps, ≈49 s @ Lighthouse "Slow 4G" 1.6 Mbps** | [ESTABLISHED size; arithmetic]. GitHub Pages serves gzip [INFERRED]. |
| SW install side-download | up to +9.81 MB (second shell URL) | B11 |
| Text decode + HTML tokenize + execute the two 13 MB data scripts | ≈1.3–1.6 s @4× (trace: ParseHTML 1,055 ms incl. 605 ms script blocks; TextResourceDecoder 282 ms) | [ESTABLISHED, traced] |
| Compile + evaluate module (React + 2 MB app) | ≈0.65 s @4× (compileModule 307 ms + evaluateModule 343 ms) | [ESTABLISHED] |
| First render + effects + 123 image preloads | ≈1.1 s @4× (scheduler tasks) | [ESTABLISHED] |
| Image decoding (mostly off the main thread) | ≈1.4 s CPU @4× across 420 decode events | [ESTABLISHED] |
| **Bytes-local → title screen** | **2.59 s @4×** (0.71 s @1×); 4–5 long tasks of 98–593 ms | [ESTABLISHED, 2 runs] |
| End-to-end on 4G at 9 Mbps, 4×, uncompressed local server | first paint 15.2 s, title 16.8 s. With gzip, expect ≈ 8.7 + 2.6 ≈ **11 s** | [ESTABLISHED / INFERRED] |
| Repeat launch (SW cache) | ≈2.6 s @4× CPU + disk read of 15 MB | [INFERRED] |
| JS heap at title | 22 MB, of which ≈13 MB is base64 strings pinned by `window.__ASSETS__`/`__AUDIO__`. V8 also retains the 13 MB script source | [ESTABLISHED / INFERRED] |
| Renderer RSS | 103 MB (blank) → **279 MB title → 272 MB world → 397 MB after 9 zone changes** | [ESTABLISHED]. Headless, software raster, so indicative only. |

### 5.2 Steady state (free roam, fresh save, 4×)

| Cost | Per second | Notes |
|---|---|---|
| React commits | 2.0 | clock tick + "last saved" stamp |
| React scheduler work (`xt`) | ≈27 ms (≈13 ms per commit) | ≈3 ms per commit unthrottled [INFERRED from 4× scaling] |
| rAF world loop (`r` + collision `X`) | ≈25–27 ms | ≈0.45 ms per frame |
| GC | ≈7–9 ms | |
| Native rendering "(program)" | ≈300 ms (**≈30 % of main thread**) | Style, paint and composite for infinite CSS animations (walk/bob/idle/neon/smoke/rain keyframes at html lines 96–167) plus per-frame transform writes [INFERRED attribution] |
| Autosave | 0.16 ms @ 10 KB | grows with save size (5.4) |

### 5.3 Zone transition (4×)
Long tasks of 149–467 ms. NPC-look composites cost 20–97 ms each (≈54 ms mean), with 3 per zone on average. The trace blames the rest on mounting the new zone's DOM and decoding its sprites [ESTABLISHED/INFERRED]. From the player's seat, every edge crossing hitches for roughly half a second on a mid-range phone.

### 5.4 Save growth (the late-game tax)

| Save | JSON size | stringify + setItem @4×, paid every second of free roam | parse @4× (load) |
|---|---|---|---|
| Fresh | 10 KB | 0.16 ms | 0.2 ms |
| ~500 ticks + 300 journal | 111 KB | 6 ms | 1.5 ms |
| ~2,000 ticks + 1,000 journal | 391 KB | **27 ms** (misses a 60 fps frame) | 5 ms |
| ~5,000 ticks + 3,000 journal | 1,032 KB | **90 ms** (visible 1 Hz stutter) | 13 ms |

[ESTABLISHED synthetic measurement; tick ≈130 B and journal entry ≈150–250 B follow the shapes at 53378–53404 and `pt` at 17635.] Quota: 4 full copies (main + 3 slots) in 2-byte storage. At a ~5 MB quota, 3 filled slots plus a ~600 KB save risks silent autosave failure (B5).

---

## 6. UX / clarity from the player's seat (technical UX)

- **First impression.** On the web or itch.io: 4–50 s of a **blank white page** (the body background is set in a `<style>` after the data scripts, and there is no loader or progress bar). In the TWA the splash screen covers the same wait. Nothing tells the player the game is 10 MB.
- **Updates.** Players run yesterday's build on the first launch after a patch and get no "update ready" prompt. Release notes stopped at 0.691.
- **Losing everything.**
  - One corrupt byte or one malformed field wipes the run (B1), or leaves the app permanently blank (B2).
  - Clearing Chrome data or switching browsers silently removes the Play app's save (S8).
  - "Export save — a backup that survives anything" (93281) is the only real protection, and it is manual and clipboard-based.
- **Time leaks.** Settings, and probably other panels, burn game time (B3, S1). Backgrounding may too (S2).
- **Teleport on resume.** After Android reclaims the app, you wake up at The Lot (B9).
- **Stutter.** A half-second freeze on every zone edge (B15). Late-game saves add a 1 Hz hitch (5.4).
- **Phone conventions.**
  - Back exits the app (S4).
  - Music may follow you out of the app (S3).
  - `user-scalable=no` blocks pinch zoom. The in-game text-scale setting mitigates this.
- **Desktop.** At 1600×900 the map stretches while sprites and HUD stay phone-sized (characters ≈20 px tall). Moving requires mouse-dragging an on-screen joystick; there is no keyboard (`work-tech/desktop_1600x900.png`) [ESTABLISHED].
- **Diagnostics.** "Copy diagnostic info" is a good idea but too thin for real bug reports: no device or user agent, no last error, no seed or replay, no save.

---

## 7. Overlaps, bloat, dead or vestigial systems

1. **`/music/*.mp3` (6.27 MB)** duplicates `__AUDIO__` byte for byte and is never fetched. Cut it, or better, make these the only copies and stream them (section 8).
2. **Four copies of every asset.** Base64 in the HTML, the same base64 as JS heap strings, the same again as V8-retained script source, then decoded bitmaps; the SW adds two cached HTML copies on top. About 45 MB of storage and memory overhead for a 9.8 MB download [INFERRED from measured components].
3. **Dev panel and World Editor** ship to players (B13, B14).
4. **Three ad-hoc hash/PRNG helpers** (`$t`, `Lt`, `sa`) alongside 473 raw `Math.random()` calls. None is seedable per run.
5. **Two sources of truth for legal text**: in-game `Dpe`/`Wpe` (34227–34285) and `privacy.html`. They already disagree slightly in scope.
6. **Stale changelog system** (`tB`, 391 lines ending at 0.691) is still shipped and wired to a "What's new" modal that can never fire.
7. **Version constants in four places** (B17).
8. **Styling is 4,613 inline style objects with no design tokens.** A visual overhaul, which the owner is considering, means touching thousands of call sites; this is the largest hidden cost of a re-skin.
9. **`Oe` fallback `/world/*.png`, `WU`/`NU` eager preloads, `HE`/`LE` unbounded caches.** These are vestiges of a dev setup and of "compose at runtime" choices that a build-time atlas would replace.
10. **Pause-list conjunction (22 flags) plus about 200 modal states.** This is a hand-rolled state machine that already drifted (B3). Every new panel is another chance to forget the list.
11. **`StrictMode` in production.** Harmless (no double-invoke in prod), just noise.

---

## 8. Opportunities — IMPROVE / CHANGE / CUT / ADD

Effort: **S** ≤ 2 days, **M** ≤ 2 weeks, **L** > 2 weeks (solo dev).

### P0 — Stabilize (ship within 1–2 weeks, no gameplay change)

| # | Type | Action | Effort |
|---|---|---|---|
| 1 | ADD | **Source in git (private) + CI build** that reproduces today's single-file output. Stop web-UI uploads. Deploy Pages from CI (`actions/deploy-pages`). Single-source the version from `package.json` into the app, SW and TWA. | S |
| 2 | IMPROVE | **Save safety:** (a) never autosave until a load has *succeeded*; (b) on parse or normalise failure, move the raw string to `dirtbag-save-v3.corrupt.<ts>`, show a recovery screen (Export raw / Try backup / Start new) and never overwrite; (c) rolling backups: keep the previous autosave and a once-per-game-day snapshot; (d) call `navigator.storage.persist()`; (e) toast on autosave failure; (f) type-check arrays and objects in `H$` for every `mv` key (a generic "if typeof differs, take the default" loop over `mv` fixes B1, B2 and B7 for top-level and nested fields). | S |
| 3 | ADD | **Error boundary** around `Xpe` with a crash screen: Copy error + save, Load last backup, Reload. Add a `window.onerror`/`unhandledrejection` ring buffer feeding "Copy diagnostic info" (plus user agent, viewport, storage estimate, save size). | S |
| 4 | IMPROVE | **Service worker:** check `res.ok && res.type==='basic'` before any `put`; precache one HTML key; use stale-while-revalidate with an in-app "Update ready — tap to restart" toast (post a message from the SW when new HTML arrives); derive the cache name from the build hash. Better: Workbox `injectManifest` in CI. | S |
| 5 | CUT | Gate the **dev panel and World Editor** behind `import.meta.env.DEV` (dead-code eliminated in prod). Keep a local dev build for Evan. | S |
| 6 | IMPROVE | **Clock pause** derived from one `overlay !== null` value plus `document.hidden`. Pause music on `visibilitychange` and resume on return. Flush the save on `pagehide`/`visibilitychange:hidden`. | S |
| 7 | IMPROVE | **Save cadence:** write on meaningful actions (end of action, sleep, travel, purchase) and on hide, not on every minute tick. Drop the `Or(Date.now())` re-render; compute "last saved" only while Settings is open. | S |
| 8 | IMPROVE | **Bound `ticks`/`legacy`.** Keep full history, but move it to an IndexedDB append log (or compress older entries). Keep the save under ~150 KB. | S–M |
| 9 | IMPROVE | **Persist zone and position** in the save (B9). | S |
| 10 | IMPROVE | **Android Back:** push a history entry when an overlay opens; `popstate` closes the top overlay; Back on the root screen shows a "Quit?" confirm. | S |
| 11 | IMPROVE | Housekeeping: fix the privacy text (hosting on GitHub Pages; IP/user agent seen by the host) and the terms ("provided free"); add a favicon; move `<meta charset>`/`<title>` to the top; pin `@bubblewrap/cli`; assert `targetSdkVersion` in CI; drop the stale defaults. | S |

### P1 — Load, memory and save format (weeks 2–5)

| # | Type | Action | Effort |
|---|---|---|---|
| 12 | CHANGE | **Split the artefact:** `index.html` (~5 KB) + hashed `app.[hash].js` (0.68 MB gz) + sprite atlases (WebP/PNG pages with a JSON frame map; ~3.3 MB, lazy per zone) + **music as separate files streamed on demand** (only the current zone's track, ~0.5–1.2 MB). Add a real loading screen with progress. **Target:** first paint < 1.5 s and title < 3 s on 4G and a mid-range phone; a code-only deploy costs about 0.7 MB instead of 9.8–19.6 MB per player. | M |
| 13 | CHANGE | **Character looks:** stop runtime PNG encoding. Either composite into `ImageBitmap`/`OffscreenCanvas` (no `toDataURL`) and draw walkers on canvas, or bake the NPC look pool into atlases at build time. Lazy-load layer sheets for the character creator only. Removes B15, the 147 MB worst case and `HE` growth. | M |
| 14 | ADD | **Versioned save + migration registry** (the Dirtbag-UE rule): `{v, appVersion, seed, rng, state, meta}`; `MIGRATIONS[n](s) → s'`; the current unversioned format is v0 and `H$` becomes migration 0→1; schema validation (zod) after migrating; unit tests that load a corpus of real old saves. | M |
| 15 | IMPROVE | **Storage:** IndexedDB (idb-keyval) for main save, slots and backups, with atomic A/B writes (generation counter + checksum). localStorage stays as fallback. | M |
| 16 | IMPROVE | **Export codes:** `CompressionStream('deflate')` + base64url + CRC32 + version prefix (`DB2:`), about 5–10× shorter; the import validates with the schema *before* replacing the run. | S |
| 17 | ADD | **Opt-in crash reporting** that keeps the "collects nothing by default" promise: either a "Send report" button that opens a pre-filled GitHub issue or email with the diagnostic bundle, or opt-in Sentry/GlitchTip with no PII. Update Play data-safety if network reporting is enabled. | S–M |

### P2 — Re-architecture (strangler, months 2–4, no rewrite freeze)

#### Target architecture

The structure below applies Dirtbag-UE's rules (engine-free sim core, named RNG streams, data-driven content, dial structs, versioned saves, test harness), translating "engine-free" to "React-free":

```
dirtbag/                         (private repo, pnpm workspace, TypeScript strict)
  packages/sim/                  # NO React, NO DOM, NO window — runs in Node for tests & balance bots
    src/state/GameState.ts       # typed state (today's 498 fields, grouped: needs, body, career, social, world…)
    src/rng/                     # FNV-1a over UTF-16 + mulberry32, named streams worldgen/session/events,
                                 #   Derive(label) per day/route/attempt — bit-identical to Dirtbag-UE DirtbagRng
    src/dials/                   # SessionDials-style constant objects, each with a "why" comment
    src/systems/                 # clock, needs, jobs, climbing (VD resolver), weather, quests (Vpe), injury…
    src/actions/                 # reduce(state, action, ctx) → { state, effects[] }  (effects = toast/sfx/journal/ui-cue)
    src/save/                    # serialize, MIGRATIONS registry, schema (zod), checksum
    test/                        # vitest: golden RNG vectors (shared with test_main.cpp), per-system tests,
                                 #   characterization tests, 1,000-day bot soak (no NaN, bounded arrays, save < 150 KB)
  packages/content/              # JSON tables (routes, gear, jobs, events, quests, dialogue) + JSON Schemas;
                                 #   predicates as named ids resolved in sim (e.g. "when":"grade>=5") — no code in data
  packages/web/                  # React (or Preact) view. Store = sim state via useSyncExternalStore + selectors
    src/ui/machine.ts            # one UI state machine: roam | panel(kind) | minigame(kind) | dialogue | gameover
    src/render/                  # world renderer (DOM today → canvas/PixiJS when the new art lands)
  assets/                        # source PNG/ASE + audio → build: atlases, hashed files, audio transcodes
  .github/workflows/             # ci.yml (typecheck, lint, unit, e2e smoke, size budget, Lighthouse CI)
                                 # deploy.yml (Pages on tag) · twa.yml (pinned Bubblewrap) · (later) steam.yml
```

Key design choices:

- **Deterministic rolls.** `rng = streams(seed).session.derive(\`attempt:${routeId}:${day}:${n}\`)`. Reloading a save reproduces the same outcome, which fixes S6 and S7 without banning slots. Bug reports become "seed + action log", and balance bots become reproducible.
- **Effects as data.** Today handlers interleave `i()`, `_()` toasts, `ke()`/`Ye()` sounds and modal setters. In the sim, handlers return `effects[]` and the UI plays them. This is the web mirror of UE's "`ResolveAttempt` returns a timeline, presentation stages it".
- **Subscriptions.** A clock tick updates only the HUD clock selector; the 66K-line re-render disappears.
- **Shared spec with the UE project.** Dirtbag-UE's `CLAUDE.md` says "the 2D game is the spec", but today the spec is a minified bundle. A TS sim with the same RNG and golden vectors is a spec that UE can diff against.

#### Migration path (every step ships; the live game keeps updating)

| Step | What | Why it's safe | Effort |
|---|---|---|---|
| M0 | P0 items 1–11 | pure hardening | S×11 ≈ 2 wks |
| M1 | Turn on TS incrementally (`allowJs` + `checkJs`), then rename leaf modules first. The top-level pure helpers and 156 tables (15,590–35,845 equivalents in source) move *verbatim* into `sim/` and `content/` files. | a mechanical move; the bundle output stays the same | M |
| M2 | **Characterization tests before refactoring:** harvest today's pure functions (`VD`, `Vpe`, `H$`, `Epe`, `q2`, pricing, odds) and snapshot their outputs over recorded states; add a Playwright smoke test (boot → new game → walk → climb → sleep → save → reload). | locks behaviour | M |
| M3 | Save v1 + registry + IndexedDB + backups (P1 14–16) | old saves migrate through v0→1 | M |
| M4 | Asset split and atlases (P1 12–13) | the renderer API is unchanged | M |
| M5 | **Strangle `Xpe` by feature**, one PR per feature: jobs → food/needs → gym → crag attempts → sleep/day-end → social → comps → media. Each feature's handler logic becomes `sim/actions/<feature>.ts`; the component calls `dispatch()`. Swap `Math.random` for the seeded streams per feature, keeping distributions identical (verify with bot-season histograms before/after). | ~20 small, reversible PRs | L |
| M6 | UI state machine replaces the 75 boolean and 126 payload modal states and the pause conjunction; split the JSX into screen components with selector subscriptions; add design tokens or CSS modules to get rid of inline styles (prep for the re-skin). | behaviour covered by M2 tests | L |
| M7 | Renderer swap to canvas/PixiJS with integer scaling, *when the new art direction is decided*. It consumes sim state and atlases; this unlocks desktop layouts and removes most of the 30 % "(program)" cost. | the sim is already out of React | L |

### P3 — Sell-readiness by store

| Store | Gap list | Effort |
|---|---|---|
| **Google Play (TWA, exists)** | Pin Bubblewrap and verify `targetSdkVersion` meets the current Play rule (35 since Aug 2025; check the 2026 bump in Play Console). IARC questionnaire: simulated gambling (poker/blackjack/liar's dice with in-game cash, "bet" ×72), alcohol references (beer ×11), romance (×36), death (Free Solo), police. Target audience 13+/16+ and **not** Families. Data safety: "no data collected" matches the code, but update the privacy text for hosting. **Monetisation:** a paid Play listing conflicts with the free site. Choose one: (a) Play = paid, web = demo (gate content by build flag); or (b) free + one "Supporter / full game" IAP through the **Digital Goods API + Play Billing** (Bubblewrap `features.playBilling`; web purchases through Stripe are not allowed inside the TWA for digital goods). Automate internal-track upload (service account). | S–M |
| **itch.io** | Easiest: upload today's HTML (limits are fine) as a free web demo or "pay what you want". Needs P1-12 so it doesn't sit on a blank iframe for 10 s. Sell the downloadable desktop build separately. | S |
| **Steam** | Electron recommended over Tauri (Linux/Deck WebKitGTK is slower and its codecs are riskier; Electron is the same Chromium the game is tuned on). `steamworks.js` for achievements (map the existing `f1` achievements) and Steam Cloud (write saves to files in userData; use Auto-Cloud). Required: **keyboard + gamepad** movement and menu navigation (Deck Verified), a landscape/scaled layout at 1280×800+, a windowed/fullscreen toggle, a quit option, bundled emoji or sprite icons (the 102 emoji depend on system fonts, which Linux/Deck may lack). Strip dev tools. | L (mostly UI/input) |
| **iOS** | Now: Safari "Add to Home Screen" works as a PWA; storage is safer when installed. App Store: Capacitor (WKWebView) + StoreKit IAP; watch WKWebView memory on older iPhones (today's 280–400 MB renderer is a risk); audio unlock rules. | M |
| **Analytics / telemetry** | None today, which fits the promise. If wanted: opt-in, aggregate-only (e.g. self-hosted Plausible/Umami events: session length, day reached, churn point), disclosed in data safety. | S |
| **i18n** | About 90K words inline plus 80 English plural ternaries and US grade systems (V/YDS only; no Font/French grades). Order: extract UI chrome (≈35K words in `Xpe`) to ICU MessageFormat, then content tables. Professional translation runs roughly $7–14K per language at $0.08–0.15/word [INFERRED]. Defer until the sim/content split (M5), because content in JSON makes this much cheaper. | L |
| **Licensing** | (1) **LimeZu sprites**: credited ("art: LimeZu", 96917). The raw sheets are in a **public** repo (per brief) as one base64 blob, and git history keeps every version. **Verify** LimeZu's terms on redistribution and public repos. If in doubt, make the source repo private (Pages from a private repo needs a paid GitHub plan; Cloudflare Pages or Netlify also work) and ship atlases, not raw pack files. The live site will still expose whatever it serves, which is inherent to web games. (2) **Music**: "Bitwise" by tcarisland, CC BY 4.0. Attribution is present on the title screen and in Settings → Audio, with title, author, source, licence links and a modification note (92853–92897), which meets TASL. Also add it to store listings and credits. (3) **"Olympic/Olympics"** (26×; Olympic Village, medals): a protected mark (IOC; USOPC in the US). Verify or rename ("the Games", "World Championships") before a commercial launch. (4) Real names (Honnold, Caldwell, Lynn Hill…) appear only in trivia, which is nominative, low risk. "Access Fund" (a real charity) is used as a donation target; consider a fictional one or get consent. (5) React (MIT) licence headers are retained. No web fonts. | S (checks) |

---

## 9. What's strong and must be preserved

1. **Zero-backend, zero-collection, offline-first PWA.** The privacy promise is genuine: no fetches, analytics or trackers in app code, and no `console.*` noise. That is a real selling point; keep any telemetry opt-in.
2. **Frame loop outside React.** The world rAF loop writes transforms through refs (38070–38527), minigame bars do the same (41217–41342), and every rAF effect cleans up. Keep this pattern in any renderer.
3. **Extraction-friendly pure code already exists.** The attempt resolver `VD` takes injected rolls (29105); `Vpe` is a pure quest engine (35736); `Epe`, `q2`, pricing and odds helpers are module-level. The 13.8K lines of tables are ~99 % plain data (only ≈110 predicate fields). The sim core is mostly already written; it's just trapped.
4. **Defensive reads** (~1,500 fallbacks). This is why most corrupted fields degrade instead of crashing. Keep that discipline even after schemas land.
5. **Save UX bones are there:** 3 slots with metadata, export/import codes, "last saved" display, diagnostics copy, reset. They need hardening, not redesign.
6. **Attribution and legal hygiene:** the CC BY credit is done right; privacy, terms and "not affiliated" text are in-game; the climbing-safety disclaimer is good.
7. **TWA pipeline in CI** with secret-held keystore, monotonic versionCode and correct two-fingerprint `assetlinks.json`.
8. **Accessibility settings** (reduce motion, colorblind, high contrast, text scale S/M/L, keep-awake, per-channel volume) and `prefers-reduced-motion` CSS.
9. **Tiny dependency surface:** React 19 only. Nothing to audit, nothing to update in a hurry.
10. **Cross-project leverage.** Dirtbag-UE's mulberry32 + FNV-1a (UTF-16) RNG was designed to match a JS reference bit for bit. A TS sim core with the same golden vectors (`Sim/tests/test_main.cpp`) makes the web game the executable, testable spec the UE project says it depends on. Note that the UE docs' claim that the 2D game is "at SAVE_VERSION 31" (`concepts/DIRTBAG.md:95`) is **not true of the shipped build**: it has no save version, only an unversioned shallow merge (`H$`). Reconcile before the UE port relies on it.
