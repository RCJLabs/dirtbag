# Dirtbag 1.0: the 20-phase roadmap (web version)

*Written 28 Sep 2026 from the v0.956.0 audit ([AUDIT.md](AUDIT.md)). Scope: the HTML/PWA game. The Unreal project is covered only where it touches this plan (Phase 20).*

**Convention.** This follows the house style in the Unreal repo:
- Phases are numbered, and each has an explicit **Done when** gate.
- One **CURRENT MILESTONE** marker; work only on that phase.
- When its criteria pass: update its status, add a changelog line, move the marker and commit.

**The plan in one line.** Stop adding features. Make the codebase safe to change. Decide what the game is. Show the climbing. Deepen only what matters. Then ship a free first season and a paid full game, with Steam as the main bet.

**Effort figures** are full-time-equivalent weeks for one developer working at the current AI-assisted pace. They are estimates [INFERRED], not commitments. Commissioned art and music have their own lead times and can run in parallel.

## How the phases fit together

| Stage | Phases | Purpose | Rough effort |
|---|---|---|---|
| A. Make it safe to change | 1–4 | Source control, a safety net, load time, and pulling the simulation out of the UI | 8–14 weeks |
| B. Decide what the game is | 5–7 | Design bible and cut list, core-loop retune, the first hour | 5–8 weeks |
| C. Make it look like the game it is | 8–13 | Art direction, the climbing screen, crags, the town, the UI system, sound | 18–29 weeks |
| D. Get it in front of people | 14–15 | Desktop/Steam build, then the demo, store page and festival | 4–6 weeks |
| E. Make the full game worth paying for | 16–18 | Story spine and ending, the people, careers and jobs | 11–17 weeks |
| F. Ship | 19–20 | Monetization, store readiness, beta, launch and after | 5–8 weeks |

That adds up to about 51–82 weeks, roughly 12–19 months [INFERRED].

**Timing anchors:**
- The next Steam Next Fest is 22 Feb – 1 Mar 2027 (register by 10 Jan). That's too early for the rebuilt demo.
- **Target the June 2027 edition as a stretch, and October 2027 as the safe option.** A game only gets one Next Fest, so spend it on the best demo.
- Put the Steam "Coming Soon" page up at the end of Phase 9, once real climbing screenshots exist. Wishlists need months to build.

**What can overlap:**
- Phase 4 (sim extraction) runs in the background of Stage B.
- Commissioned art (Phase 8) runs alongside Phases 9–12.
- The writing for Phases 16–17 can start while waiting on art.

---
## Stage A — Make it safe to change

### Phase 1 — Source of truth   **<<< CURRENT MILESTONE**

**Goal.** Get the real source into version control, and build and deploy the game from it, before touching anything else.

**Why.** The repo holds only the compiled build: 59 commits of "Add files via upload" and "Update game to vX build". If the source lives on one machine or in chat history, one bad day loses the game. Until the source is in a repo, no one — Claude Code included — can make a reviewed, reversible change.

**Scope.**
- Create a **private** repo for the Vite/React source, or a `src/` workspace in a private copy of this repo. Keep `RCJLabs/dirtbag` as the public Pages output only.
- Tag the exact v0.956.0 source as `v0.956.0-baseline`. Verify that a clean clone builds a byte-equivalent `index.html` (diff it against the shipped build).
- Add GitHub Actions:
  - `ci.yml`: install, build, a smoke test that boots the game in headless Chromium, and a size report;
  - `deploy.yml`: on tag, build and publish to Pages. **Stop uploading builds through the web UI.**
- **Single-source the version** from `package.json` into the app, the service-worker cache name and the TWA workflow. Today it's hand-synced in four places, and three of them are stale (0.956.0, `dirtbag-v09560`, 0.821.0, 0.670.0).
- **Pin the build tools.** Pin `@bubblewrap/cli`, and assert `targetSdkVersion` in the TWA workflow.
- **Delete what's dead.** Remove the duplicate `/music/*.mp3` (byte-identical to the embedded tracks and never fetched), and add a favicon.
- Write `CLAUDE.md` and `README.md` for the source repo. Use the Unreal repo's style: commands, architecture rules, "start every session", and a pointer to this roadmap.

**Out of scope.** Any gameplay change.

**Done when.**
1. A fresh clone plus one command reproduces the live build.
2. A tag deploys to dirtbag.rcjlabs.com with no manual upload.
3. One version string drives the app, the service worker and the TWA.
4. The smoke test runs green in CI.

**Depends on:** nothing. **Effort:** ~1 week. **Main risk:** the "source" turns out to be partial (e.g. never fully committed). If so, recover it from the most complete local copy first, and use the prettified bundle as a last resort.

---

### Phase 2 — The safety net: saves, crashes, determinism, hotfixes

**Goal.** No player can lose a save to a bug again, and the known bugs that break trust are fixed.

**Why.** The audit reproduced two ways to lose everything:
- a malformed save is silently replaced with day 1 within 2.5 s;
- one null field blanks the screen on every launch.

Several bugs also corrupt progression or economy, including a skill clamp that turns a V8 climber into a V6. None of the later work matters if saves are fragile.

**Scope.**
- **Save hardening:**
  - never autosave until a load has *succeeded*;
  - quarantine a corrupt save to `…corrupt.<timestamp>` and show a recovery screen (export raw / restore backup / start new);
  - keep rolling backups (the previous autosave plus one snapshot per game day);
  - call `navigator.storage.persist()`;
  - show a toast when an autosave fails;
  - type-check every default key in the normaliser, including nested objects.
- **An error boundary** around the app. Its crash screen offers copy error + save / restore backup / reload. Feed `window.onerror` and `unhandledrejection` into a ring buffer, and include it in "Copy diagnostic info" with the user agent, viewport and storage estimate.
- **Save cadence.** Write on meaningful actions (end of an action, sleep, travel, purchase) and when the page is hidden, not on every 1 Hz clock tick. Trim `ticks` and `legacy`, or move them to an IndexedDB log. Target a save under 150 KB.
- **Versioned save format.** `{v, appVersion, seed, state}` plus a `MIGRATIONS[]` registry. Today's format becomes v0, and the current normaliser becomes migration 0→1. Test the loader against a corpus of real old saves.
- **Persist location.** Save the current zone and position, so a reload or an Android kill doesn't teleport you to the Lot.
- **Clock and app lifecycle.** Derive the clock pause from one "overlay open" value plus `document.hidden` (Settings currently leaks game time). Pause the music when the app is hidden. Make Android Back close the top overlay instead of the app.
- **Gate dev tools out of production** (`?dev`, the 🔧 panel and the World Editor). Keep them in local dev builds.
- **Service worker.** Check `res.ok` before caching, precache one HTML key, add an "Update ready — tap to restart" prompt, and derive the cache name from the build hash.
- **Hotfix batch.** The confirmed bugs from the audit that need no design decision:
  - the five 0–100 skill clamps and the "MAXED" toast at skill 100;
  - dog ticket immunity; barista craft feeding rescue craft; the club stipend paid nightly; the Collective camera perk;
  - motel and expedition night processing; the starvation check that ignores owned food; game over wiping settings;
  - the stray re-offered every trip; literal `’`/`*great*`; "out at Gym"; the "shoe guy" line; duplicate `viral` id;
  - Day 1 always "New Year's Send"; Sendsgiving before Halloween;
  - the rival state not reset on turnover; the Late Bloomer "Turning 28" dialog;
  - café-board expiry of completed challenges; DWS needing a pad; branded pad/glove checks;
  - stale hints (van $18, crag 35 energy/3 h); the Work panel's pay figure; the sponsor "/CYCLE" label.
  The full list is in `docs/audit/*.md`.
- **Seeded RNG.** Add named streams (worldgen/session/events) with the same algorithm and golden vectors as `Dirtbag-UE/Sim/DirtbagRng`. Move the climbing attempt, nightly events and rewards onto them first. That makes outcomes reproducible, bug reports replayable and Free Solo save-scum-proof.
- **Live-game UI quick wins.** Players are in the current build for months before the rebuild, so fix the cheap things now:
  - move toasts into a top lane that never captures taps (they currently cover the HOLD TO LOAD button);
  - add nameplates on buildings;
  - fix Town Map search routing (breadth-first search over the zone graph);
  - keep the HUD visible indoors;
  - fix the crash-pad hint;
  - make the colorblind setting cover the HUD;
  - give Moonstone and the Crucible their own crag scenes;
  - crossfade the music between zones.

  Skip any sprite re-signing if the Phase 11 rebuild is going ahead.
- **Update the in-game "What's new".** It is frozen at v0.691.

**Done when.**
1. The corrupt-save and null-field tests from the audit recover instead of wiping or blanking.
2. A 1,000-day headless bot run produces no NaN, no unbounded arrays and a save under 150 KB.
3. The same seed and actions give the same outcomes.
4. Every hotfix in the list has a regression test or a checked repro.
5. `?dev` does nothing on the production domain.

**Depends on:** Phase 1. **Effort:** ~2–3 weeks. **Main risk:** hotfixes change balance players are used to. Note them in "What's new" in the game's voice.

---

### Phase 3 — Cut the load

**Goal.** First load on a mid-range phone goes from ~11 s to under 3 s, and deploys stop costing each player 10–20 MB.

**Why.** Today the page is 15.3 MB (9.8 MB gzipped), and nothing paints until all of it arrives. Every zone change stalls for 150–470 ms at 4× CPU throttling. Renderer memory reaches ~400 MB, which risks Android killing the TWA.

**Scope.**
- **Split the build:**
  - `index.html` (~5 KB) with a real loading screen and progress;
  - a hashed `app.[hash].js`;
  - sprite atlases (WebP/PNG pages plus a JSON frame map), lazy-loaded per zone;
  - **music as separate files**, streamed for the current zone only.
- **Stop runtime PNG encoding of NPC looks.** Composite into `ImageBitmap`/`OffscreenCanvas`, or bake a look pool into atlases at build time. Lazy-load the 80 character-layer sheets for the creator only.
- **Precache with a hashed manifest**, e.g. Workbox `injectManifest` in CI. Code-only deploys should cost ~0.7 MB.
- **Measure in CI:** a size budget, and a Lighthouse or Playwright trace on a 4× CPU, 4G profile.

**Out of scope.** New art (Phase 8). The atlases here just pack the current sprites.

**Done when.**
1. Title in under 3 s and first paint in under 1.5 s on a 4G, 4× CPU profile.
2. No zone-change task over 100 ms at 4×.
3. Renderer memory stays under 250 MB after 10 zone changes.
4. A code-only deploy downloads under 1 MB.

**Depends on:** Phase 1. **Effort:** ~1–2 weeks. **Main risk:** asset-loading bugs on flaky networks. Test the offline path and the first-launch path.

---

### Phase 4 — Pull the sim out of the UI

**Goal.** A React-free, TypeScript simulation core that runs in Node, holds all the game rules, and is covered by tests and balance bots. The UI becomes a view over it.

**Why.**
- Today one 66K-line component holds 249 pieces of state, 86 effects and 473 `Math.random()` calls.
- It re-renders twice a second, with no memoization.
- Nothing can be unit-tested or balance-simulated without copying formulas by hand, which is what every auditor had to do.

Everything later in this plan (retuning, the climbing screen, the new town, the desktop build) needs the rules separated from the rendering. The Unreal repo already follows this rule: "the sim decides; the renderer stages."

**Scope** (strangler pattern: every step ships, and there is no freeze).
- **Workspace:**
  - `packages/sim`: typed state, `rng/`, `dials/`, `systems/`, `actions/`, `save/`;
  - `packages/content`: JSON tables with JSON Schema;
  - `packages/web`: React view.
- **Characterization tests first.** Snapshot today's pure functions over recorded states: the attempt resolver, quest engine, pricing, odds, the night pipeline and the game-over check. Add a Playwright smoke test that boots, starts a new game, walks, climbs, sleeps, saves and reloads.
- **Move the data** (156 tables, ~99% plain data) into `content/`. Replace the ~110 predicate functions with named, testable conditions.
- **Extract one feature per PR:** jobs, then food/needs, gym, crag attempts, the night pipeline, social, comps, media.
  - Handlers become `reduce(state, action) → {state, effects[]}`. Effects (toast, sound, journal entry, UI cue) are data that the view plays back.
  - **One `advanceNight()` function** serves sleep, the motel, expeditions, stints and flights. That ends the five disagreeing night paths.
  - The per-move attempt resolver returns a **timeline** (odds, pump and outcome for each move). This is the same contract as the Unreal `ResolveAttempt`, and Phase 9 stages it.
- **Dials.** Tunables move into dial objects, each with a comment saying what the number means and why it's set there.
- **One UI state machine.** `roam | panel(kind) | minigame(kind) | dialogue | gameover` replaces the ~200 modal booleans and payload states, and gives one source of truth for pausing.
- **A headless balance harness.** Bots with named play styles (worker, climber, media, exploiter) run full careers from a seed, then report grade curves, cash curves, injury rates, bond timelines and content-exhaustion days.

**Done when.**
1. The top-level component is under ~3K lines, and no game rule lives in the view layer.
2. Every system has unit tests; the characterization suite passes before and after.
3. A 414-day career runs headless in under 10 s.
4. The balance harness prints the audit's key curves from real code instead of hand-copied formulas.

**Depends on:** Phases 1–2. **Effort:** ~4–8 weeks, interleaved with Stage B. **Main risk:** scope creep into redesign. Extract first, change second; the characterization tests enforce this.

---

## Stage B — Decide what the game is

### Phase 5 — The design bible, the cut list and the business line

**Goal.** A short, binding document that says what Dirtbag 1.0 is, what it isn't, where the free demo ends, and which systems are kept, merged, deferred or cut.

**Why.** The build has about 500 state fields, 28 menu panels on day one and roughly 28 overlapping goal trackers. It has six fire games, eight jobs on one framework, four "who you are with the scene" axes, two permanent-damage systems and three calendars. It needs a spine and fewer, deeper systems more than it needs features. Presentation work (Stage C) shouldn't be spent on systems that are about to be cut.

**Scope.**
- **Pillars** (one page). The Unreal concept doc's pillars fit, trimmed:
  1. the life, not the score;
  2. your body is the save file;
  3. climbing is played, not passed;
  4. conditions are content;
  5. the scene remembers.
- **The spine.** Five acts that map onto the existing content and crag unlocks:
  1. *First Season* (≤V4)
  2. *The Local's Project and the Gauntlet* (V5–V7, the rival)
  3. *The Circuit* (V8–V11, the national team)
  4. *The Crucible* (V11–V15)
  5. *The Line* (the myth first ascent and retirement)
  
  Each act ends in a scene, not a toast. Phase 16 writes them; this phase fixes their gates and beats.
- **One calendar.** A year is four 14-day seasons (56 days), and age advances one year per calendar year. Retirement age and the length of your prime are retuned to match, e.g. a career of about 8–10 calendar years ≈ 450–560 days. Name the save migration.
- **The tracker collapse.**
  - **Life Goals** — the spine plus your calling's ambition.
  - **The Board** — one weekly board fed by café, club and daily sources, auto-claimed.
  - **The Record Book** — feats, each with its story card attached.
  
  Onboarding becomes Act I's first chapter.
- **The cut list** (a starting point; confirm in the bible):

  | Keep and deepen | Merge | Defer past 1.0 | Cut |
  |---|---|---|---|
  | Climbing model, per-move falls, projects and FAs | Water, propane and power → one "supplies" gauge | Deep gym management beyond a simplified business | Liar's dice, trivia (→ tutorial glossary), horseshoes, blackjack |
  | Body, load and injury model | Scars + marks → "old injuries" | World Series travel beyond 3 rounds | "Feed the fire" |
  | Partners, crew, rival, dog, locals | Clubs → faction membership perks | Photography economy beyond posts and prints | Music-hobby minigame (fold into crew night) |
  | Comps (opt-in, fixed-field tiers) | Hybrids + style mastery → "Mastery" | Localization | Garden trips (fold produce into farm visits) |
  | Stances and echoes, hitchhikers, knocks, epics | Three weekly boards + dailies → The Board | Deep-water solo beyond one crag | Grade-vote faction rep |
  | Sponsors (real vs brand), heat and discourse, documentary | Feats + milestones + story cards → Record Book | | Duplicate encounters (Gen-1 random layer) |
  | Van, parking spots, breakdowns | Barista, clerk and coach quizzes → 2 jobs with real layers | | Dead code: van meal, the `cookhome` branch, `soloed`, write-only flags |
  | Free Solo mode (with seeded rolls) | Six fire games → storytelling, cards with reads, crew night | | |

- **The business line.**
  - A **free first season**: Act I, Roadside + Granite Gorge, the Lot, the dog offer, one partner arc. It ends on a hook, such as the first sponsor call or the rival's challenge.
  - **One purchase** unlocks the rest: Steam $9.99 as the main bet; Android and iOS $4.99 one-time; an itch.io supporter edition.
  - No ads, no other purchases, no tracking.
  - Existing saves are grandfathered to the full game for free.
- **Legal renames before anything is sold:**
  - "Olympic"/"Olympics" (27 lines of text; US law protects it) → a fictional "the Games";
  - IFSC trivia → World Climbing;
  - "Access Fund" → a fictional charity or permission;
  - choose a distinctive full title and run a trademark knockout search in classes 9 and 41 ("Dirtbag" alone is crowded).
- **Style guide for the words.**
  - US English (the setting is American); convert ~90 British markers.
  - One quote style.
  - No stat dumps in prose: numbers go in UI chips.
  - Retire the verbal tics the audit counted.
  - Use the audit's "best 10 lines" as the reference register.
- **Decide what the Unreal project does in the meantime** (see Phase 20).

**Done when.**
1. The bible is committed, and every state field maps to a kept system or a migration note.
2. The day-1 menu drops from 28 tiles to ≤10, with progressive unlocks written down.
3. The demo boundary and prices are decided.
4. The legal renames are scheduled into Phase 2's or Phase 6's hotfix train.

**Depends on:** the audit. **Effort:** ~1–2 weeks. **Main risk:** reluctance to cut. The cut list is where most of the 1.0 schedule comes from.

---

### Phase 6 — Retune the core loop in the balance lab

**Goal.** Money, time, body and people create real trade-offs for the whole career, not just week 1. Tune it with the Phase 4 harness, not by feel.

**Why.** The audit's models agree:
- **Money** stops mattering around day 12–15. Media income reaches about $2,300 a day at 120k followers.
- **Relationships** max out in days. Romance runs from spark to "move in" in about four.
- **Injuries** land for 36–99% of new players in month one, because of the load model's cold start.
- **Survival meters** become chores or one-time purchases.
- **Jobs** out-train climbing past V8.

The Stick RPG hook — every day is a trade between earning and climbing — only exists in week 1.

**Scope.** Numbers are starting targets; tune them with bots.
- **Jobs.**
  - Promotions are gated by stats or grade plus reliability, not just attendance (e.g. Rescue Lead needs V6 and Head 150).
  - Each rank buys a perk a climber wants: a free gym, a gear discount, physio, or **leave for road trips**.
  - Each job posts **3–4 shifts a week**, so the week is planned around weather windows.
  - Add an autopilot shift at ×1.0 pay; the minigame stays as optional upside.
- **Skill sources.** Every flat source (job shifts, recipes, onsight, events) goes through the same diminishing curve as climbing, or becomes a temporary buff.
- **Media.** Content cash follows a curve (e.g. `12·√(followers/1000)·(grade+2)`), pays for crag sends only, and has a weekly cap by sponsor tier.
- **Costs.**
  - Replace the hidden grade multiplier on van life with **lifestyle tiers you choose** (dirtbag / comfortable / plush).
  - Show gym fees as day passes and memberships.
  - Winter is a season you prepare for: the heater costs fuel nightly.
  - Coffee has a crash, or diminishing returns after two a day.
- **Failure without cliffs.**
  - Show a pre-sleep warning with the math and one-tap fixes.
  - Keep a cash float the debt sweep can't take.
  - The starvation check eats food you own.
  - A **"rock bottom" continue** replaces the hard wipe: lose your upgrades and half your gear, debt forgiven, back at the Lot.
- **Body.**
  - Seed chronic load so the first week doesn't spike.
  - Show load on the climb panel; warm-up is the default.
  - The first injury bill before insurance is time and psyche, not $180.
- **People.**
  - Bond at most +1 per partner per day, not per attempt.
  - Fire rituals cost time and need the person present.
  - Arc and romance beats are ≥5–7 days apart; target a romance of 6–10 weeks and an arc of about a season.
- **Comps.**
  - Opt-in sign-up at the desk. Only registered no-shows are penalized, and seasons end on schedule.
  - Tiers have fixed fields: Local V1–V7, Regional V5–V11, National V9–V15, World V13–V18.
  - Ranking points decay slowly, and the score-multiplier stack is capped at ×1.3.
- **Rival.** Give the rival their own seeded curve, with streaks, injuries and a peak age, instead of a rubber band one grade ahead.

**Done when** the harness shows:
1. At day 30 and day 150, a working climber still faces at least one "can I afford this trip / this week off?" decision per week.
2. No strategy's income is more than 4× another's at day 200.
3. Climbing is the main source of skill at every grade.
4. First-month injury rate is under 35% for a warmed-up, moderate player.
5. A romance takes 6+ weeks.
6. Comps can be skipped at no cost.

**Depends on:** Phase 4 (the harness) and Phase 5 (decisions). **Effort:** ~2–3 weeks. **Main risk:** over-tightening makes the game feel stingy. Playtest the result, not just the curves.

---

### Phase 7 — The first hour

**Goal.** A new player understands the game, feels the fantasy, and sends outside inside 20 minutes, without being shown 28 panels or 40 numeric choices first.

**Why.** Today a new player sees all of this before ever climbing:
- a **permadeath mode choice** first;
- **six creation steps** of dense modifiers;
- a HUD with about 10 elements;
- a first objective **three zones away**;
- system popups (Paths on day 1);
- an auto-scheduled comp that penalizes them;
- **"New Year's Send"** on day 1.

The tutorial also points at the weakest job, which the sim shows going into debt around day 7.

**Scope.**
- **Creation.**
  - Offer **Quick start** (pick a portrait and a past; everything else is suggested) or **Build your climber** (the full six steps with synergy callouts).
  - Move the mode choice (Free Solo) to after the first season, or put it behind "Custom run".
  - Add a **name field**; it fixes the generation-2 "torch passes" beat.
- **Days 1–3.**
  - A lightly scripted first day: wake in the van, Hazel's hello, the nearest job in the same district, food, the gym.
  - The tutorial job is chosen by net pay per day, not by proximity.
- **Progressive disclosure.**
  - The menu grows as systems become relevant: Sponsors after the first offer, Mentee at V5, Expeditions at V7.
  - Tips fire on the first real occurrence, never on day 1.
- **Act I as the tutorial.** The "Your First Season" quest becomes the onboarding checklist, ending with the first outdoor send and the first night at the fire with a partner.
- **One guide voice.**
  - Hazel becomes the single onboarding voice.
  - Tips appear inline in the relevant panel instead of as modals.
  - The goal ladder folds into NEXT MOVE.
  - Suppress the SEND DAY, COMP and HOLIDAY alerts and random encounters on days 1–2.
- **Make the first crag trip possible.** Offer a pad rental at the crag, or a no-gear first line. Today every outdoor boulder needs a crash pad sold only at the mall's Gear Shop, so a new player can drive out and do nothing but warm up.
- **Teach the safety nets.** The first time hunger or cash gets low, surface Hustle → dumpster dive, and the debt ceiling.
- **Explain the numbers once, in voice:**
  - the grade is the average of five skills;
  - the send odds shown are before your execution;
  - rest days, load and skin.

**Done when** (5 cold testers who aren't climbers, and 5 who are):
1. 8/10 reach their first outdoor send within 20 minutes, unassisted.
2. 8/10 can say what they want to do next at minute 30.
3. No tester sees a system popup for something they haven't touched.
4. Average taps to the first send drop by at least 40% against v0.956.

**Depends on:** Phases 5–6. The town layout here is provisional until Phase 11. **Effort:** ~2–3 weeks. **Main risk:** re-doing it after the town rebuild. Keep the onboarding script data-driven, so the new town only changes coordinates.

---

## Stage C — Make it look like the game it is

### Phase 8 — Choose the look

**Goal.** Pick one art direction, one scale, one palette and one UI kit, and make every later screen follow them. Every asset must be owned, or licensed on clean terms.

**Why.** The current world has three structural problems:
- **Too many sources.** At least 8 visual sources are mixed: LimeZu Modern Exteriors and Interiors at ×1, ×2 and ×3, resampled non-pixel sprites, noise-texture ground, stamped dirt blobs, and CSS shapes.
- **No fixed scale.** Every sprite has its own height, so on one screen an art pixel ranges from 0.41 to 2.4 CSS px.
- **Signs that lie.** The gyms are an office tower labelled "G-NERIC CORP", and the gear shop says "HARDWARE".

Beyond looks, there are business and legal reasons:
- The "Modern" packs are ubiquitous, so reviewers may call the game an asset flip.
- The raw sheets sit in a public repo, which needs checking against LimeZu's no-redistribution terms.

The full diagnosis is in the audit, under *The map and the look*.

**Scope.**
- **Mock three directions** as one screen each, time-boxed to one week, and test them with ~10 climbers and ~10 non-climbers:
  - **(A)** a cohesion pass on the walkable town: one LimeZu family at one integer scale, authored in Tiled;
  - **(C)** the recommended option: a guidebook valley map with an illustrated place card and a crag topo;
  - **(B/D)** a commissioned-art sample, pixel or illustrated.
- **Default decision if the tests don't overturn it:** C. Use commissioned illustration for key art, place-card headers and portraits. Use a van-dashboard framing for the Van screen. The two walkable camp scenes use one tileset at one integer scale.
- **A style guide:**
  - palette tokens for day, night and the four seasons;
  - a type scale with ≥13 px body text and ≥11 px captions;
  - an icon set replacing the ~102 emoji currently used as icons;
  - a component spec for panel, card, pill, meter, button, modal, toast lane and journal page;
  - one UI language, replacing the current mix of dark-slate HUD and parchment panels.
- **Three finished target screens:** the valley map with a place card, a crag topo in session, and the Lot camp at night.
- **Commissions** for the key art (the Steam capsule) and the place-card and portrait illustrations.
- **A licence ledger**: every asset with its source, licence and receipt. Confirm every LimeZu pack still in use was bought, not the free version.

**Done when.**
1. The mocks are tested and a direction is chosen and written down.
2. The style guide and the three target screens are committed as design tokens and components.
3. The commissions have delivery dates.
4. The licence ledger has no open questions.

**Depends on:** Phase 5. **Effort:** ~2–4 weeks, plus commission lead time. **Main risk:** endless exploration. Hold to the time-box.

---

### Phase 9 — Put the climber on the wall

**Goal.** The attempt, the heart of the game, becomes something you watch and drive. You see the line on its topo, the climber moving hold to hold, pump you can see, and falls that land.

**Why.**
- **Nothing to watch.** Today an attempt is a list row, then a modal with a bar. Neither the climber nor the wall appears, and the minigames ignore the body the sim tracks.
- **Nothing to sell.** Trailers and screenshots need climbing on screen, and watchable climbing is what sells (PEAK, Cairn).
- **The Unreal question can be answered cheaply.** Its Phase 0 asks whether a minigame-driven session is tense and legible. That can be answered in 2D first, for a fraction of the cost.

**Scope.**
- **Staging.**
  - The session screen *is* the crag topo: the line drawn on the rock, bolts or gear, your high point, tick marks, and partner lines.
  - During an attempt, the view closes in on the current section.
  - A climber figure in the chosen style (a procedural 2D rig with two-bone IK arms and legs) moves along the per-move timeline Phase 4 produces.
  - Holds are typed (crimp, sloper, pinch, pocket, jug, crack), with a marked crux and rests.
- **Verbs.**
  - HOLD TO CLIMB becomes the backbone: hold to move, release to shake.
  - At the crux: hold-to-load for throws, a timing tap for latches, a tension hold for crimps.
  - Retire MASH as the power verb.
  - Widen the timing windows and add a touch-latency offset.
- **The sim drives the feel.** The pump bar starts at your real pump, skin narrows crimp windows, and energy and psyche change how steady the rig is.
- **Honest odds.**
  - A failed beat becomes an odds penalty on that move, not an automatic fall.
  - A smooth curve replaces the hard 13%/3% caps.
  - The route card shows a range: "38–71% · clean beats +25".
- **Payoff.**
  - Falls land on a pad, rope or water.
  - A short replay of the send.
  - A shareable **send card**: the topo with your line, grade, style and date, generated on the device with no server.
- **Fixes.**
  - The ✕ on a minigame counts as a bail.
  - The COLD START prompt appears only on outdoor lines.
  - Results show inline instead of as stacked cards.
  - Toasts never cover the controls.

**Done when** (the Unreal Phase 0 criteria, adapted for 2D):
1. A watcher who isn't the developer can tell how close an attempt was without reading a number.
2. A deliberately pumped attempt feels tense through the minigame alone.
3. The same route plays out visibly differently for two different climbers, with no animation changes.
4. A session of five goes produces 8 or fewer overlays in total.
5. The Steam "Coming Soon" page goes live with GIFs from this screen.

**Depends on:** Phases 4 and 8. **Effort:** ~4–6 weeks. **Main risk:** animation polish eats the schedule. The rig is procedural, and hold poses are data, not frames.

---

### Phase 10 — Make crags into places

**Goal.** Each crag is a place you recognize and plan a trip to: a topo with its lines, conditions you can see, and a road-trip map that connects them.

**Why.**
- Roadside Crag is a meadow with one rock pile, and every crag reuses the same pile.
- Moonstone and the Crucible render Roadside's green meadow even though you drive there through desert.
- Routes live in a list.
- The late game runs out of routes: 2 at V14 and none at V16.

**Scope.**
- **A topo for each of the 9 crags** in the Phase 8 style, with every route line drawn from data, and a crag-base camp scene for the social life.
- **Visible conditions:**
  - the shade line moving across the wall, which is the prime window made visible;
  - wet streaks after rain;
  - crowd markers and seasonal closures on the map;
  - rock type shown by the palette (granite, quartzite, sandstone, gneiss, limestone).
- **A road-trip map:**
  - crags as pins with fuel, time, permits and unlock requirements;
  - one-tap driving that keeps the drive scene and the roadside events;
  - a second, continental map later for big walls and expeditions.
- **Content:**
  - 8–10 new routes at V13–V17, and a second top-end crag;
  - a highball flag on routes, with pad and spotter decisions (this gives Moonstone its identity);
  - deep-water solo without the crash-pad bug.
- **Persistent gym walls.** A board problem stays up 3–4 weeks so gym projecting can carry over.

**Done when.**
1. All 9 crags have topos and road-trip pins.
2. Routes exist at every grade from V2 to V17.
3. Testers can point at the crag they want and say why (conditions, style, a project).

**Depends on:** Phases 8–9. **Effort:** ~3–5 weeks. **Main risk:** art volume. A topo is line work over one drawing per crag.

---

### Phase 11 — Replace the joystick town with a valley map

**Goal.** Every place is readable at a glance and reachable in one or two taps, and building the world stops being a construction project.

**Why.**
- **You flagged the map** as hard to build and inconsistent. The audit found the cause: 1,134 hand-placed props, per-sprite scales, 137 hand-tuned collision boxes, and layouts that round-trip through a chat window.
- **It's slow to use.** A day's loop is 30–80 taps plus 1–2 minutes of joystick walking, with no fast travel, no keyboard input and unlabeled buildings.
- **It pays back less over time.** By mid-game, play collapses into a Lot ↔ gym ↔ van loop.

**Scope.** This is the recommended direction C; the fallback follows.
- **A vector valley map in the guidebook style.**
  - The town appears as labelled blocks, alongside trails, the highway, parking markers and crag icons.
  - Pins for the destinations kept after the Phase 5 cut list, about 20–25.
  - The Town Map's search becomes the map itself: search, highlight the pin, travel.
- **Travel.**
  - Tap a pin. The van or climber animates along the road for a fixed time and fuel cost.
  - A **place card** opens: a header illustration, the restyled existing action sheet, and "Who's around" (regulars, partners, the rival).
  - **The clock advances on actions and travel only**, never while idle.
- **Two walkable camp scenes.**
  - The Lot at night: van, fire, dog, neighbours, Hazel, the caravan.
  - The crag base: partners, critters, crowds.
  - Both in one tileset at one integer scale, authored in Tiled with a collision layer, with day, night, weather and season palettes.
  - Keep the night light pools.
- **Retire:**
  - the town joystick, the 12 zone graph, the edge transitions, and the eight copy-pasted interior enter/exit functions;
  - the scatter data and collision tables;
  - the in-game World Editor and the `ext_` editor-only sprites.
- **The daily agenda.** An optional morning plan such as "Shift → Diner → Gym ×3 → Van", run as a sequence.
- **Adding a place becomes documented work:** a pin, a card entry in JSON, and one illustration, with CI checking for missing art.
- **Fallback (option A)**, if walking the whole town is essential to the Stick RPG feel for you:
  - 6 fixed-screen districts in one tileset at an integer scale, authored in Tiled with collision layers;
  - nameplates and signage that match function;
  - tap-to-go auto-pathing, with the joystick and keyboard optional.
  - Every other "Done when" below still applies.

**Done when.**
1. 4 of 5 testers find any destination within 5 seconds.
2. Any destination is at most two taps from anywhere.
3. A day-3 loop takes 20 taps or fewer, with no forced walking.
4. The clock doesn't move while the player is idle.
5. A new place can be added in under an hour, excluding the illustration.

**Depends on:** Phase 8, ideally with Phase 4's UI state machine. **Effort:** ~4–6 weeks. **Main risk:** losing the charm of wandering. Put ambience and people into the camps, the cards and the map: animated weather, night, season, and the van moving along the road.

---

### Phase 12 — The UI system and the desktop layout

**Goal.** Every screen is built from one component kit, works in portrait on a phone and in landscape on a desktop, meets basic accessibility, and gives the writing surfaces that respect it.

**Why.**
- **No UI system.** There are 4,613 inline style objects and no design tokens, ~183 modal layers, a 28-panel hub, and a van sheet with 16 actions.
- **Toasts fail the writing.** They cover controls, merge unrelated lines, drop anything past four, and show a 91-word stance result for at most 5.2 s. There is no message log.
- **Text is small and low-contrast.** 32% of font sizes are under 11 px, and some titles are 1.7:1 contrast.
- **No landscape layout.** A Steam release isn't credible in a portrait-only phone UI.

**Scope.**
- **Navigation.** Five tabs replace the 28-tile grid:
  - **Map**, which carries the Today card and NEXT MOVE;
  - **Climb**: projects, log, guidebook, training;
  - **You**: body, skills, paths, gear;
  - **People**: crew, rival, mentee, scene, family, feed;
  - **Life**: money, work, van, dreams.
  - A **Journal** button (diary, full message log, Record Book, quests) and Settings live in the top bar.
- **The "Tonight" panel** replaces about eight hidden meters: tonight's cost, runway, debt against the ceiling, sickness risk, load, fueling, teeth, the next bill and the forecast.
- **Text surfaces.**
  - A **toast lane** under the HUD that never captures taps and waits while a minigame or modal is open.
  - Long text (about 30 words or more) goes on a card the player dismisses.
  - A **message log** keeps the full text of every event.
- **Layouts.** Portrait phone, landscape tablet and desktop (1280×800 and up, including Steam Deck). Keep the HUD visible indoors, and respect safe-area insets.
- **Accessibility.**
  - Colorblind mode covers the HUD with shapes and icons, not colour alone.
  - Text size scales to 1.3× by reflow rather than zoom.
  - Reduced motion follows the operating system setting by default.
  - Screen-reader labels, visible focus, and WCAG AA contrast.
  - Settings carry across generations and game overs.
- **The component library** is built from Phase 8's tokens. Migrate one hub at a time, behind the UI state machine.

**Done when.**
1. No screen uses one-off inline styles.
2. Every flow works in portrait and in landscape.
3. Keyboard-only navigation reaches every control.
4. No text longer than about 30 words ever appears in a timed toast, and no toast overlaps an interactive control.
5. The message log holds the last 200 events in full.

**Depends on:** Phases 4 and 8. **Effort:** ~4–6 weeks. **Main risk:** a big-bang re-skin. Migrate hub by hub.

---

### Phase 13 — Sound and feel

**Goal.** Every action has feedback, the world has ambience, and the music is owned or cleanly licensed for a paid release.

**Why.**
- The music is one CC BY 4.0 album of 8 short tracks, about 11 minutes in total. It is credited correctly.
- CC BY 4.0 forbids technical restrictions (DRM), which is a question for store builds.
- Climbing sound (chalk, breath, rubber, the fall) is what sells the attempt.

**Scope.**
- **Commission or license an owned score.**
  - Per-place and per-crag themes, with crossfades.
  - Stings for sends and falls.
  - An acoustic or lo-fi palette probably suits dirtbag life and the guidebook look better than chiptune [INFERRED].
  - Today 9 of 12 zones share one 128-second loop, and Free Solo plays one track for the whole run.
- **Foley and SFX:** chalk, brushing, breath with pump, feet, the thud of a fall, the rope, the van starting, the fire, rain.
- **Feedback:** haptics on mobile, controller rumble on desktop, and UI sounds that match the kit.
- **Mix:** a mixing pass, a credits screen, and the "Bitwise" attribution kept wherever that music remains.

**Done when.**
1. Every verb has a sound.
2. Every district and crag has ambience.
3. The licence ledger covers all audio.
4. Music ducks under dialogue and pauses when the app is hidden.

**Depends on:** Phases 8–11. **Effort:** ~1–2 weeks of integration, plus commission lead time. **Main risk:** low.

---

## Stage D — Get it in front of people

### Phase 14 — Desktop and Steam build

**Goal.** A Steam build that plays well with mouse, keyboard or gamepad on Windows, macOS, Linux and Steam Deck.

**Why.** Steam is the main revenue bet in the market research. Today the game is portrait-only and touch-only, with no keyboard or gamepad input and no Back handling. It also relies on system emoji fonts.

**Scope.**
- **Electron wrapper.** Electron over Tauri: it's the same Chromium the game is tuned on, with more reliable media on Linux and Deck.
- **Save files** in the user-data folder for Steam Cloud (Auto-Cloud).
- **Input.**
  - Keyboard: WASD and arrows to move, plus hotkeys for the five hubs.
  - Gamepad: full navigation and minigame mappings.
  - Rebinding.
- **Steamworks** via `steamworks.js`. Map the Record Book to Steam achievements; they don't need a server.
- **Window modes**, a quit option, and bundled icon fonts.
- **A Deck compatibility pass**, targeting "Verified".
- **Build flags** make one codebase produce the demo and the full game.

**Done when.**
1. A controller-only playthrough of Act I is possible.
2. The build runs at 60 fps on a Deck.
3. Achievements and Cloud work in the Steam dev branch.
4. The demo build contains no full-game content, checked by a content diff in CI.

**Depends on:** Phase 12. **Effort:** ~2–3 weeks. **Main risk:** input edge cases in minigames. Test each verb on each device.

---

### Phase 15 — The demo, the store page and Next Fest

**Goal.** A polished free first season on web, Steam and Play, a store page that converts, and one well-timed Next Fest.

**Why.** For a solo developer, wishlists and a strong demo decide launch success. The free web build is already the right funnel; Stick RPG and A Dark Room grew this way.

**Scope.**
- **The demo** is Act I, ending on the hook from Phase 5. Saves carry into the full game through export/import (no server).
- **The Steam page:**
  - capsule and key art (from Phase 8);
  - a 60–90 s trailer that shows the loop (van → shift → crag → send → fire) with the climbing screen as the hero;
  - screenshots;
  - short and long descriptions in the game's voice, leading with the life, then the climbing, then the promise (free first season, no ads, offline).
- **Next Fest.** Target June 2027 as a stretch, October 2027 as safe; register by the deadline. Localize the store page and demo text into 2–3 languages if the budget allows. Cairn's localized demo kept it featured after English featuring ended.
- **Press kit, and outreach to climbing media and creators:**
  - outlets: Climbing, Gripped, UKClimbing, PlanetMountain;
  - mid-tier creators such as Bouldering Bobat, Hannah Morris, Catalyst, Hooper's Beta;
  - life-sim and cozy streamers, and Stick RPG nostalgia channels.
- **Physical-world hooks:** gym QR posters and film-tour screenings (REEL ROCK, Banff, Kendal).

**Done when.**
1. The demo is live on web and Steam, and on Play as a free download.
2. At least 7,000 wishlists before Next Fest (the "Popular Upcoming" threshold) [benchmark].
3. The press kit is sent to ≥30 outlets and creators.
4. Crash-free demo sessions on the Play and Steam dashboards exceed 99%.

**Depends on:** Phases 7–14. **Effort:** ~2–3 weeks. **Main risk:** timing. There's one Next Fest per game; don't burn it on an unfinished demo.

---

## Stage E — Make the full game worth paying for

### Phase 16 — The spine: story, acts and endings

**Goal.** A written main story across five acts with a real ending. Epilogues are built from the player's actual history, and legacy makes the next generation feel like a continuation.

**Why.**
- The only main quest ends at V4, around day 10.
- The V18 "impossible" line gets the same pop-up as any first ascent.
- Retirement is forced with no warning.
- Legacy wipes everything, including your named first ascents.

Players will ask "what am I working towards?" by hour 3.

**Scope.**
- **Acts II–V as authored chapters,** with 3–5 story beats each. They use existing systems (stances, the crew project, the documentary, the youth team, expeditions) as set-pieces. Each act ends in a scene, not a toast.
- **The Line.**
  - A bespoke finale for the myth first ascent: a naming ceremony at the fire, reactions from crew, rival and mentee drawn from bond data, and credits.
  - Then a choice: "Retire now — a perfect ending", or "Keep climbing".
- **Epilogues** keyed to calling rungs, paths, factions, stances, the dog and the crew. The data already feeds the tally screen.
- **Retirement** gets a visible countdown from about two years out. The Late Bloomer origin states its trade-off.
- **Legacy as a dynasty.** The forebear's named FAs stay on the topos under their name, and their gym is inherited, maybe in debt. Crew members age into mentors, and the heir gets a first quest of their own. Settings, mode and tutorial state carry over.

**Done when.**
1. A playthrough from creation to the ending takes about 15–25 hours at normal pace.
2. The ending names at least five specific things this player did.
3. Generation 2 starts with a distinct first quest and inherits visible history.

**Depends on:** Phases 5–6. The writing can start during Stage C. **Effort:** ~4–6 weeks. **Main risk:** scope. Write the acts at a fixed beat count.

---

### Phase 17 — The people

**Goal.** A cast players can tell apart, relationships that are earned and have milestones, and a town whose people change over time.

**Why.**
- The writing is the game's best asset, but the cast is blurry: 93 first names, three Priyas, three Theos, 11 NPCs sharing 6 sprites.
- Three partners are second-class, with no rifts, fire takes or party seats.
- The random pool is empty by about day 60, and authored arcs by about day 100.
- Choices are often cosmetic.

**Scope.**
- **Untangle the cast.**
  - Resolve every name collision.
  - Give each named NPC a unique look (the layered look generator exists).
  - Bring Tam, Ollie and Dell up to parity, or frame them explicitly as "elders" with their own rules.
- **Milestones.**
  - Romance beyond four beats: anniversaries, the first fight, a shared van decision, choosing between their opportunity and yours, a break-up with real text.
  - Crew drama where two partners fall out *because of you*.
- **Lives that change on real timers.** Ray retires and hands you his crag. Tam slows down. Frank's rig dies and he parks next to yours. Partners get injured, travel, and move away and come back.
- **Choices remember.**
  - Store each hitchhiker's last choice and branch the callbacks.
  - Romance and arc forks actually change availability.
- **Giving, not just receiving:** gifts, invitations ("take Junie out", "bring Frank to the fire"), and naming a route after someone.
- **Holidays and festivals as scenes** with your people in them; retire the stat toasts.
- **A family arc:** a handful of beats across a year, including a real "come home for good" branch.
- **More variety where players read most:** shopkeeper fillers, walker chats, campfire outcomes, busy-texts and send reactions, with 3–4× the lines. Retire the Gen-1 random layer and its duplicates.
- **Apply the words style guide from Phase 5:** US English, and no stat dumps in prose.

**Done when.**
1. No two named characters share a name or a look.
2. Every core character has ≥3 authored milestones and a resolution.
3. Bots see new authored social content every in-game week through day 300.
4. Ambient repeat rates at day 100 are under half of v0.956's.

**Depends on:** Phases 5–6. **Effort:** ~3–5 weeks, mostly writing. **Main risk:** writing volume. Prioritize the lines players see most.

---

### Phase 18 — Careers and jobs

**Goal.** Each career path — outdoor, competition, media, work — has a readable ladder, gameplay of its own and a capstone. Jobs are short, varied minigames with Stick-RPG-style goals.

**Why.**
- **Jobs.** The eight jobs share one framework, with five mechanics, most of them solved in a shift. The setter puzzle is the exception and the template.
- **Comps** are the best-built meta system, but rubber-banded and opt-out.
- **The owned gym** is a trophy whose profit can't be withdrawn.
- **Paths and traits** are exhausted by about V5.

**Scope.**
- **Jobs.**
  - Keep the setter puzzle as the model.
  - Give barista, clerk and coach real second layers: a queue and timing game; a real fitting puzzle using gear lean and brand data; a coach roster tied to the client's current project.
  - Fix the push-your-luck incentives in the warehouse and courier games.
  - Drop the copy-paste "regulars graduate" arc from four jobs.
  - Rank perks and leave, from Phase 6.
- **The competition ladder** runs Circuit → Nationals → "World Series" → "the Games". Opt-in, fixed fields, decaying points, with a capstone at the Games. League nights and the dyno comp use the real minigames instead of dice.
- **The media ladder:** real vs brand sponsors, heat, discourse and the documentary, with obligations that cost time and clash with climbing windows. A rival athlete competes for the same headline deal.
- **The outdoor ladder:** projects, first ascents, the crew project, expeditions and a guidebook of your own lines. The capstone is The Line.
- **The work and business ladder:**
  - Setter → head setter → your own gym, as a simplified business with an owner's draw, a daily profit-and-loss line in the morning report, and no traps.
  - Or guide → your own guiding outfit.
- **Identity across the whole career.** Rescale path gates and "MAXED" to the real skill curve, so tiers land at ~V4 / V9 / V14. Merge hybrids and style traits into Mastery.
- **Late-game money turns back into climbing:** fund an expedition team, sponsor a youth athlete, buy and bolt a crag (the land-trust system exists).

**Done when.**
1. Each ladder has a UI, ≥5 rungs and a capstone event.
2. Bot careers that focus on each path all reach a satisfying capstone before retirement.
3. No job minigame is solved in one shift: the optimal choice changes with conditions.
4. Gym profit is withdrawable.

**Depends on:** Phases 5–6, 9 and 12. **Effort:** ~4–6 weeks. **Main risk:** re-sprawl. Every addition must replace something on the cut list.

---

## Stage F — Ship

### Phase 19 — Monetization, store readiness and beta

**Goal.** The demo/full split works on every store, players can buy the full game without trust or privacy compromises, and two beta rounds have shaken out the launch bugs.

**Why.**
- Google Play won't let the existing free listing become paid.
- The TWA loads the public site, so a paywall inside it can be bypassed from any browser.
- The terms say "provided free", and the privacy text omits hosting.
- There's no crash reporting.

**Scope.**
- **Android.**
  - Move from the TWA to a **bundled wrapper**: Capacitor under the same package name and signing key, with a native Play Billing one-time purchase.
  - Or keep the TWA with the Digital Goods API and accept an honor-system gate.
  - Grandfather existing saves: a pre-change save means the full game.
- **iOS.** Capacitor plus StoreKit, with a non-consumable unlock and "Restore purchases". Test against App Store Guideline 4.2, and watch WebView memory.
- **Steam:** $9.99 premium, a launch discount, and regional pricing.
- **itch.io:** a DRM-free supporter edition, pay-what-you-want above the base price.
- **Legal and store paperwork.**
  - Update the privacy text: hosting, and store-processed purchases.
  - Update the terms to the paid model.
  - Fill in the IARC questionnaire (simulated gambling with in-game money, alcohol references, romance, death in Free Solo).
  - Play data-safety form.
  - Store listings with the music credit.
- **Opt-in crash reporting that keeps the promise.** A "Send report" button that opens a prefilled issue or email with the diagnostic bundle, seed and action log. Or opt-in self-hosted error reporting, disclosed.
- **Beta.** Two rounds: a Play closed track and a Steam playtest with ~50–200 players, including non-climbers. Keep a bug bash list with severity gates for launch.

**Done when.**
1. A purchase unlocks the full game on each store, and a restore works.
2. The demo can't reach full-game content without the unlock on bundled builds.
3. Legal text is updated.
4. Beta round 2 has no open critical or high bugs.
5. Crash-free sessions exceed 99.5%.

**Depends on:** Phases 14–18. **Effort:** ~3–4 weeks. **Main risk:** billing plugin quirks. Build the purchase flow early in the phase.

---

### Phase 20 — Launch, live updates, and the Unreal decision

**Goal.** Ship 1.0 on Steam, Play and web (+ iOS and itch), keep a post-launch rhythm a solo developer can sustain, and make the Unreal decision with real data.

**Why.** Launch is a beginning. A sim like this sells on its updates. The Unreal project's budget should follow evidence, not hope.

**Scope.**
- **Launch plan.**
  - Launch 2–4 months after Next Fest.
  - Coordinate with the climbing media calendar (Rocktoberfest, REEL ROCK, Kendal, Banff).
  - Line up launch-week creator coverage.
  - A "portion of launch week to a climbers' coalition" pledge fits the brand.
- **Post-launch cadence**, for example:
  - a 30-day patch;
  - a 90-day free content update (a new crag with a topo and 10–15 routes, or a new act beat);
  - seasonal in-game events that need no server.
  - A paid "Director's Cut"-style expansion is an option later (the Stick RPG 2 precedent).
- **Localization,** once content lives in JSON (Phase 4): 2–4 languages. Budget roughly $7–14k per language for ~90k words [estimate]; start with the store page and UI.
- **Pitch catalogues** after launch: Play Pass (a no-ads, no-IAP premium game fits its profile) and Apple Arcade if invited.
- **The Unreal gate.** After 90 days, review wishlist conversion, sales, review score and player feedback. Then decide on the Unreal project:
  - **(a)** continue from its Phase 0 with the TypeScript sim as the executable spec (shared RNG and golden vectors);
  - **(b)** fold 3D ambitions into a 2D sequel;
  - **(c)** shelve it.
  
  Until then, keep Unreal work to its Phase 0 experiment at most. Update its competitor analysis (Cairn, PEAK) and correct its "SAVE_VERSION 31" note.

**Done when.**
1. 1.0 is released on the planned stores.
2. The first two post-launch updates ship on schedule.
3. The Unreal decision is logged in `Dirtbag-UE/concepts/` with the data behind it.

**Depends on:** Phase 19. **Effort:** ~2 weeks for launch, then ongoing. **Main risk:** post-launch burnout. The cadence above is deliberately small.

---

## Changelog

- 2026-09-28 — Roadmap written from the v0.956.0 audit (`docs/AUDIT.md`). CURRENT MILESTONE set to Phase 1.
