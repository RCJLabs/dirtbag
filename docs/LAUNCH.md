# Launch: what's left, in order (Phase 20.2)

The game's code is ready to launch. What's left is yours: the accounts, the stores, the testers and the day. This page puts it in order, says where each step is written up, and gathers what launch leaves open: the numbers marked [proposed] and the questions the bots couldn't settle, phase by phase since 26.

## Where things stand (19 Oct 2026)

- **The live site is v0.999.33,** your last tag (4 Oct 2026): the game through Phase 25, music in code.
- **main is 0.999.110:** Phases 26 to 45, 14, 15 and 19's code, What's new (20.1) and the crag day at Moonstone (20.3). Tagging it puts all of that live. A player coming back gets the What's new card once, with what's come since.
- **The gate is off** (`DIRTBAG_GATE` in `deploy.yml`): everyone has the whole game until you turn it on.
- **Steam:** `desktop/steam.json` holds 480, Valve's test app. Nothing has run with Steam itself yet.
- **Play:** the app is the site (TWA). The unlock's product, `full_game`, isn't made yet.
- **Phase 19 is still open** on its two criteria that are yours: the real stores' purchase and restore, and the beta.

## 1. Before the beta

1. **Tag main** (README → Releasing):
   - `git fetch origin main && git tag v0.999.110 origin/main && git push origin v0.999.110`, or a later version if main has moved.
   - For Play, then run **Build TWA** and upload it, with the newest note in `app/src/game/news.json` as its "What's new".
2. **Steam** (`desktop/STEAM.md`):
   - the full game's app and the demo's, both IDs in `desktop/steam.json`;
   - the 52 achievements with their icons (`desktop/steam/achievements.json` names them);
   - Auto-Cloud;
   - the depots, from **Build desktop**'s folders.
3. **Play:** the one-time product `full_game` and its price, and a licence tester (README → Releasing → Play's unlock).
4. **Where crash reports go:** `REPORT_TO` in `app/src/ui/crash.ts` is empty. The error screen offers the report to copy, but there's no mail button until it has an address. The privacy page already covers it.
5. **The press kit's bracketed lines** (`docs/PRESSKIT.md`): the dates, the store's link, a press address, a line or two about you, and the trailer's link.

## 2. The beta (`docs/BETA.md`)

- **Round 1,** as soon as the Steam playtest app exists:
  - Play's closed track and a Steam Playtest, 50–100 players, a third of them non-climbers;
  - the question: does a new player get from the first morning to a send without help, and where do they stop?
  - Licence testers try the unlock on the tester's link (`?gate=try`).
- **Round 2,** about a month before launch, on the release candidate: 100–200 players.
- **Launch waits** until round 2 has no open critical or high bugs.
- **During both rounds,** the questions in the last section are what to watch.

## 3. Steam, the demo and Next Fest (Phase 15's carried steps)

- **The Coming Soon page:**
  - the capsules (`npm run store:art`); the wide one is yours to pick, the highball or the Lot;
  - Steamworks' asset sizes and its short description's limit, checked before uploading.
- **The demo** up for Next Fest (June 2027); 7,000 wishlists is the target.
- **The press kit** to 30 or more outlets and creators.
- **On a Deck,** none of which has run yet:
  - 60 fps (Settings → Frame meter on);
  - the Deck's button names and Steam's floating keyboard;
  - the achievement calls;
  - the store page in Steam's overlay.
- **Whether Valve's Deck review takes the Xbox button names off a Deck** is unverified. On a Deck the game names the Deck's own buttons.
- **The desktop builds are unsigned** until there are certificates to sign them with.

## 4. The day (README → Releasing → At launch, the gate)

1. **The forms,** filled from `docs/PAPERWORK.md`:
   - Play's data safety, content rating and target audience;
   - Steam's content survey and legal fields;
   - itch.io's.
2. **The privacy page and the terms,** read: the terms' governing law, and the two data-safety points.
3. **The gate:** `DIRTBAG_GATE` to `'1'` in `deploy.yml`, then release with a tag. A climber who was here before keeps the whole game.
4. **Play's listing:** swap in the launch blocks from `docs/STORE.md` (At launch).
5. **Steam:** the full game out, the demo kept.
6. **itch.io:** **Build desktop**'s folders, DRM-free.
7. **When** (Phase 20):
   - two to four months after Next Fest, around the climbing calendar (Rocktoberfest, REEL ROCK, Kendal, Banff);
   - launch-week creators lined up;
   - the coalition pledge if you make one.

## 5. After

- **The rhythm:**
  - a patch at 30 days and a free content update at 90;
  - seasonal events that need no server. The crag day at Moonstone (20.3) is the first.
- **Each release's note** goes first in `app/src/game/news.json`. Players back after the update read it once, and Play takes it as it is.
- **The Unreal decision at 90 days** (Phase 20) reads wishlist conversion, sales, review score and what players say. All of that comes from the stores: the game sends nothing, so there's no telemetry to read.
- **Catalogues:** Play Pass, and Apple Arcade if invited. iOS isn't built; Phase 19 left it to 20.

## Open in code

- **The gate e2e** can count the font loads the page cuts off itself as failed requests. It went red once on #165's CI, and the hardening is proposed there. The same kind of fix (waiting for the network to go quiet before navigating) went into the day's e2e on #173.

## For the playtests: what the bots couldn't settle

Every number marked [proposed] is a guess the harness can't check. These are the questions each phase left open, in its own words where it could. `docs/ROADMAP.md` has each in full.

- **The first hour** (Phases 10–12): the testers' criteria were never met by testers: the first hour, the taps.
- **The music** (Phases 13, 25, 35): synthesized and still unheard. `/sounds.html` under `npm run dev` is where to listen; Phase 13's first two criteria wait on the same ear.
- **26, the gap:** crew drama falls mostly on Rico over Sage, and Tam is rarely a Regular.
- **27, the rock:** the Big Stone's four new names and grades, yours to edit. The call's psyche isn't in the harness (no bot calls a go).
- **28, the crew:**
  - the name comes early (day 22 at the median);
  - the first project goes fast;
  - the bots never say no to a favour;
  - Outdoors' target sits on a rate of about 60%.
- **29, the van:**
  - no bot takes parts, so the build-outs are untested;
  - Act II ends later since the van aged;
  - Outdoors 2 of 4.
- **30, age:**
  - Late Bloomers feel it most;
  - the ambassador's half stipend is a proposal;
  - a climber who coasts past 33 isn't measured.
- **31, after you:**
  - the old climber isn't drawn at the Lot;
  - Ray's word on the family never comes up in the harness;
  - the money, standing and fire dials are proposals.
- **32, the Hollow:**
  - the old hand's clue is luck;
  - the scene's shifts, the repeats' timing and the royalties are proposals;
  - settling a grade is words only.
- **33, comps:**
  - the comp bots end fewer acts since the calendar moved, and why isn't established;
  - the national team is a V12–V13 climber's;
  - a favourite still loses a final now and then.
- **34, money:**
  - a brand-terms player who works less isn't measured;
  - most photos sell at the cap by mid-career;
  - the piece's, the stand's and the film's numbers are proposals.
- **35, the road:**
  - the hitchhikers' rotation holds only weakly in the bots;
  - the bots take every first way, so the second ways aren't measured;
  - the media target's margin.
- **36, the games at the fire:** the [proposed] numbers and styles; the e2e plays each game, not every move.
- **37, the session:** the [proposed] numbers; no career bot joins one; most first sends are first-go sends.
- **38, the ghost:** its cap and look.
- **39, the classics:**
  - the picks and perks;
  - the bots become locals only at Roadside;
  - the Bluff and the Hollow need five settled lines of your own.
- **40, "What now?":** the numbers; no bot reads Hazel.
- **41, the forecast:**
  - "likely" from 0.75;
  - the week sheet no longer shows the true sky;
  - a day's call can flip-flop.
- **42, belaying:** the rope's numbers and the belay's cost; no bot belays.
- **43, the van laid out:** the van's size, the door's place and each footprint. It's fit only: no rule reads the plan.
- **44, the setter's wall:** the panel's size and its reach numbers; one set up at a time.
- **45, the problem of the day:**
  - `DAILY.under`, the climber 1.25 grades under the line, from guessed hands;
  - its send rate by grade (V6–9 the hardest);
  - no lock on a retry;
  - the editions draw different days.
- **Balance the harness still reads short:** Outdoors 1 of 4 and Comps 3 of 4 reach the top, as since Phase 30.
