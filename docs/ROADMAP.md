# Dirtbag 1.0: the 20-phase roadmap (web version)

*Written 28 Sep 2026 from the v0.956.0 audit ([AUDIT.md](AUDIT.md)). Scope: the HTML/PWA game. The Unreal project is covered only where it touches this plan (Phase 20).*

**Convention.** This follows the house style in the Unreal repo:
- Phases are numbered, and each has an explicit **Done when** gate.
- One **CURRENT MILESTONE** marker; work only on that phase.
- When its criteria pass: update its status, add a changelog line, move the marker and commit.

**The plan in one line.** Stop adding features. Make the codebase safe to change. Decide what the game is. Show the climbing. Deepen only what matters. Then ship a free first season and a paid full game, with Steam as the main bet.

**Update, 28 Sep 2026: the game is being rebuilt.** The look, the camera and the climbing are decided, and together they replace enough of the game that it is being rebuilt in a new codebase rather than refactored. Read [Direction and the rebuild](#direction-and-the-rebuild) first. Phases it supersedes or reshapes carry a note at the top; the rest still apply to the new build.

**Effort figures** are full-time-equivalent weeks for one developer working at the current AI-assisted pace. They are estimates [INFERRED], not commitments. Commissioned art and music have their own lead times and can run in parallel.

## Direction and the rebuild

*Decided by Evan on 28 Sep 2026, after three rounds of look-book mockups and a playable feel slice.*

**The four decisions:**
1. **Tone: scrappy survival with a sport core.** Every day is a trade between earning and climbing, all season, not just in week 1 (the audit found the trade dies by day 12–15 today). The attempt is the star; the life around it feeds it and threatens it.
2. **Camera: side-view scenes joined by a valley map.**
   - Scenes exist where people are: the Lot, crag bases, later the gym. You tap to walk up to people and things.
   - Minor places are cards on the map.
   - No joystick and no commute. The clock moves only on actions and travel, never while you stand still.
3. **Climbing: beta, then send.**
   - Before a go you pick beta for each crux, and the beta sets the move you play there:
     - a tension hold: hold and release to keep a marker in a moving band;
     - a timing tap: tap twice on the beat;
     - a hold-to-load throw: charge, then let go in the band.
   - Between cruxes you hold to climb. Pump builds, and rests pay it back.
   - Pump, afternoon sun and thin skin narrow every window.
   - Better beta is earned: by falling at a crux, by watching someone, or by asking the right person.
4. **Look: the Mix.**
   - Park-poster landscapes: flat layers, no outlines.
   - Comic people and panels: clear line, one ink weight, speech bubbles.
   - All of it is drawn in code, so there are no sprite packs and no licence questions over the art.
   - Music stays the "Bitwise" album until Phase 13.

**Why rebuild instead of refactor.** The plan below assumed the v0.956 source would land in a repo and be refactored in place (Phase 4's strangler pattern). The four decisions replace the renderer, the world, the map and the climbing screen, which is most of what that refactor would have kept. What's worth keeping is underneath: grades, body, money, people, content and voice. The rebuild ports those.

**What doesn't change.**
- v0.956 is the spec. Its balance, content, names and voice are ported, not reinvented, except where the four decisions change them.
- v0.956 stays live and untouched until the rebuild's first season replaces it (R3).

**Where the rebuild lives.** In `app/` in this repo. It has its own package and lockfile and sits outside the site allowlist, so nothing about the live game changes until R3.
- A public repo is fine for the art now that it's code.
- The catch: anyone can build the full game from public source. Decide before Phase 19 whether paid content stays out of this repo.

### What the rebuild does to the phases

| Phase | Status |
|---|---|
| 1 Source of truth | Closed. The release pipeline is done. The v0.956 source is still wanted as a reference for porting, but it no longer blocks anything. The first tag deploy is still Evan's to run. |
| 2 Safety net | Its save, crash and determinism rules become the rebuild's foundation (R0). The v0.956 hotfix batch needs the old source; without it, v0.956 stays as it is until R3. |
| 3 Cut the load | Superseded. The new build has no sprites or base64 music; a size budget runs in CI instead. |
| 4 Sim out of the UI | Superseded. The new sim is separate from day one. The balance harness moves to R2. |
| 5 Design bible | Still needed. It runs alongside R1, and R2 needs it. This section is its first page. |
| 6 Retune the loop | Still needed, on the new sim, in R2. |
| 7 The first hour | Becomes R1's target. |
| 8 Choose the look | Done: the Mix. Its tokens and components are built in R0–R1. The Steam capsule art moves to Phase 15. |
| 9 Climber on the wall | Reshaped as beta-then-send and built from R0. Its Done-when criteria gate R2. |
| 10 Crags as places | Built on the rebuild (the board, conditions you can see, Moonstone) and closed by Evan's call. Its testers' criterion carries. |
| 11 Valley map | Built on the rebuild (the taps, place cards, adding a place, the daily plan) and closed by Evan's call. Criteria 2 to 5 pass; its testers' criterion carries. Released in 0.961.0 with Phase 10. |
| 12 UI system | Built on the rebuild (the Journal, the wide screen, keyboard and access, Tonight, no inline styles) and closed by Evan's call. The flows the e2e doesn't play in landscape or by keyboard carry to playtesting. |
| 13 Sound and feel | Built on the rebuild (effects and ambience made in code, the licence ledger, credits) and closed by Evan's call. Music, made in code, came in Phase 25 by Evan's call, to hear how it turns out; criteria 1 and 2 wait on an ear. |
| 14 Desktop and Steam, 15 Demo and store page | Moved after Phase 18 by Evan's call: the full game first. Phase 14 closed by Evan's call (16 Oct 2026), its Deck and Steam checks carried to him; Phase 15 closed the same day, its accounts and outreach carried to him. Then Phase 19, its code done (16 Oct 2026) and open on its real stores and its beta, which are his. |
| 21 The climber, 22 The life, 23 Who you are | Added by Evan's call after the gap check; they run before 16. Phase 21 is the current milestone. |
| 16 The spine | Next after 21–23. |
| 17–20 | Unchanged in intent. They target the new build. The order from here: 21, 22, 23, 16, 17, 18, then 14, 15, then 19 and 20. |
| 25 Finish the game | Added by Evan's call (4 Oct 2026) after Phase 18, and closed by it the same day: every carried feature built, and music made in code. The order from here: 14, 15, 19, 20. |
| 26–35 Deepen the game | Added by Evan's call (8 Oct 2026): ten phases that tune, deepen and add to the game. Phase 14 waits until he asks for it. The order: 26, 27, 28, 29, 33, 34, 30, 31, 32, 35. Phase 26 closed (13 Oct 2026), Phases 27, 28 and 29 (14 Oct 2026), and Phases 33, 34, 30, 31, 32 and 35 (15 Oct 2026). Then Phase 14, closed 16 Oct 2026. |
| 36–45 Hands on | Added by Evan's call (18 Oct 2026), before Phase 20: ten phases that make the game more its own and easier to play, and deepen it where it's thin. Phases 36, the games at the fire played in full, 37, the session, 38, a ghost of your best go, 39, each crag's classics, 40, "What now?" from Hazel, 41, the week's forecast and send temps, 42, belaying, played, 43, your van laid out, 44, the setter's wall, hands-on, and 45, the problem of the day, closed by his call (18 and 19 Oct 2026). Then Phase 20, launch, the current milestone. |

## The rebuild track

Effort figures are rough [INFERRED], as elsewhere in this plan.

### R0 — Foundation

**Status (28 Sep 2026): done.** All five criteria pass, and CI's new `app` job ran green on GitHub (run 7). What's in `app/`:
- **The sim.** 51 tests, including the Unreal golden vectors, and a replay test that plays a go twice from the same inputs and gets the same result.
- **The build.** 156.5 KB for a player to download, fonts included. v0.956 is 9.8 MB gzipped, but it also carries music and much more content, so the two sizes aren't a like-for-like comparison.
- **The bot.** It plays day 1 through to day 2 and reloads.

What R0 still fakes is listed in `app/README.md`. The biggest item: climber stats don't affect a go yet (that's R1).

**Goal.** The feel slice's content, running on the architecture the whole game will use.

**Scope.**
- **`app/`:** Vite, TypeScript, React for the panels over a canvas world, and Vitest. Versions are pinned.
- **`src/sim`, the rules, engine-free:**
  - No DOM, no `Math.random`, no wall clock. The sim's own tsconfig has no DOM types, and a test scans for the rest.
  - The seeded RNG uses the same algorithm and golden vectors as `Dirtbag-UE/Sim/DirtbagRng`, so a seed means the same thing in both games.
  - One door into the state: `act(state, action) → {state, events}`. The clock moves only there.
  - The attempt is a fixed-step model, so a go replays exactly from its inputs.
  - Content is data: places, acts, routes, beta, and people's lines. Cost labels are derived from the numbers, because the audit found hand-written hints drifting from the rules.
  - Every tunable is a dial with a comment on what it means.
  - Saves are versioned, with a migration registry. A corrupt save is quarantined, never replaced.
- **`src/view`:** the Mix painters (poster layers, the comic rig, the map, the wall), ported from the slice.
- **`src/ui`:** React HUD, bubbles, sheets, the climb panel and the toast lane.
- **Fonts are self-hosted**, since nothing may leave the site.
- **CI:** typecheck, unit tests, build, size budget, and a headless bot that plays the slice on the built app.

**Out of scope.** New content, balance, sound, the PWA shell (R1), deploying (R3).

**Done when.**
1. A fresh clone plus `npm ci && npm run build` in `app/` builds the game, and CI runs everything green.
2. The bot plays it through with no errors and no cross-origin requests: Hazel's tip, the drive, a fall at crux 1 that reveals the rock-over, the send, a diner shift, the evening at the fire, sleep, and a reload that comes back to the same morning.
3. Unit tests cover the RNG golden vectors (matching the Unreal harness), the clock and money, beta unlocks, attempt replay, and save round-trip, migration and quarantine.
4. Nothing in `src/sim` can touch the DOM, `Math.random` or the wall clock, and CI enforces it.
5. A player downloads under 250 KB, fonts included. *(The budget went to 300 KB by Evan's call on 30 Sep 2026, in Phase 22, to 340 KB on 1 Oct 2026, for Phase 24's scenes, to 360 KB on 3 Oct 2026, for Phase 17's writing, and to 400 KB on 3 Oct 2026, for Phase 18's minigames and ladders.)*

### R1 — The first week

**Goal.** Phase 7's first hour, and a week you'd want to play, on the new build.

**Scope.**
- **Places:** the Lot, the Diner (shifts), the gym (Send City: plastic, V0–V4, beta-then-send on problems), Roadside Crag with 6–8 lines, and a card or two (Coffee Shop, Gear Shop).
- **People:** Hazel, one partner, Scout.
- **Body v1:** energy, skin, food and sleep; the week's bills; debt with a floor.
- **Climber v1:** v0.956's five skills (power, fingers, technique, endurance, head) set the windows and the pump rate, and mileage builds them. This is where two climbers start playing the same route differently.
- **Conditions v1:** weather and the shade window each day, from the seeded RNG.
- **The app shell:** manifest, service worker with a hashed precache, install; resume mid-day after a reload; settings (reduced motion, text size).
- **Creation:** a name and a quick start.

**Plan (28 Sep 2026), from the audit and the v0.956 bundle.** Numbers are v0.956's unless marked as a deviation. Every deviation is logged here and, where it touches the spec, in the Unreal repo's `concepts/2D-SPEC-LOG.md`.

- **Your climber:**
  - v0.956's five skills and grade curve: grade = floor((−8 + √(64 + 9.6·average)) / 4.8).
  - Its four starts: Boulderer 12/10/4/5/6, Rope Gun 5/5/13/5/11, Technician 5/9/5/13/7 and All-Rounder 8s (power/fingers/endurance/technique/head). Plus a name.
  - Each beta has a style (crimp, power, endurance, technical, dyno, crack). The style's 65/35 skill mix, against the crux's grade, sets the window: about half as wide two grades over your head, and at most 1.4× below it.
  - Endurance sets the pump rate.
  - Every go earns skill through v0.956's XP formula and its diminishing curve: the route's style takes 60%, the beta you tried 40%.
  - *Deviation:* goes here are shorter than v0.956's two hours, so each teaches 60% as much, and a lap of a line you've sent teaches 30% of that. The lap discount stands in for v0.956's staleness until R2 ports it.
- **Places:**
  - The Lot.
  - Roadside Crag with v0.956's own lines. Three boulders: Warm Boulder V2, The Dyno V3, Crimpfest V4. Four sport routes: Roadside Warmup 5.11b, Roadside Route 5.11d, The Pump 5.12a, Local Testpiece 5.12b.
  - Send City: a side-view gym, with six problems (V0–V5) that change each week from the seed, styled and named from v0.956's lists.
  - *Deviation:* v0.956 drew a problem's name and style separately, so "Dyno Lunge" could be a crimp problem. Here each name belongs to the style it describes.
  - The Diner, for food, as in v0.956.
  - The Coffee Shop, with 3-hour shifts at $28, and coffee.
- **The Pump becomes the first week's project.** It's a V4-equivalent. The first outdoor send is a V2 boulder or the 5.11b.
- **Sage**, v0.956's technical, beta-sharing partner, turns up at the gym or the crag on some days. Climbing with Sage lets you watch a go: the third way to earn beta, after falling and asking.
- **Body:**
  - Fed, which is v0.956's hunger: −15 a night, −3 to −6 a go, −8 a shift. Under 35 your windows shrink, down to 70% at 0, and at 0 you can't climb. Work never needs food, so there's always a way back.
  - You eat at the Diner or cook at the van.
  - Energy and skin as now; sleep brings them back.
- **Money:**
  - $18 a night at the Lot, plus registration ($45) and insurance ($25) every seventh night.
  - *Deviation:* no game over. What you can't cover goes on the card, up to a $150 limit. Past it, purchases are declined and you sleep rough in the pullout with less energy back. The van still runs on fumes, so you're never stranded. Bills land regardless.
- **Conditions:**
  - The first season is fall, the send season.
  - Each day's weather is drawn from v0.956's weights (prime, fair, hot, rain) by the seeded generator, with a three-day forecast.
  - Rain closes the crag, which makes it a gym day. Hot days grease the wall from noon. Prime days widen the windows.
- **Deviations from the feel slice:**
  - The diner shift moves to the Coffee Shop, where v0.956 had it.
  - The gym sells a day pass ($14) rather than charging v0.956's $5 a go.
- **Shell:**
  - A name-and-start screen.
  - Settings (reduced motion, text size), kept outside the save so starting over doesn't reset them.
  - A manifest and a service worker.
  - Resume where you were.
- **The week in tests:** a bot plays seven days on the sim alone, and a replay test checks that the same seed and inputs give the same week.

**Done when.**
1. A seven-day loop plays start to finish, and the bot finishes a week.
2. 4 of 5 testers reach their first outdoor send within 20 minutes, unassisted.
3. A reload or an Android kill resumes in the same place, mid-day.
4. The same seed and the same inputs replay the same week.

**Status (29 Sep 2026): built; closed by Evan's call with two checks carried.**
- Evan moved on to R2 on 29 Sep. The two checks that need people go with it:
  - #2 (testers) folds into R2's criterion #2, the first-hour test.
  - The Android half of #3 moves to R3, when the rebuild ships in the Play app.
- The notes below are as of 28 Sep.
- **Passing:**
  - #1 and #4, in `week.test.ts`: the bot plays seven days for every start on several seeds, with nothing refused. The same seed and inputs rebuild the same week.
  - The reload half of #3, in the e2e: it plays two days, reloads mid-morning, and starts again offline.
- **Open:**
  - #2, the testers.
  - The Android half of #3: the rebuild has no TWA build yet.
- **What the bot says, as a first read:**
  - With human-ish hands (guessed, not measured), the first outdoor send comes on day 1 in 77 of 80 seeded weeks.
  - The Pump goes in week one about a third of the time: 10 of 20 weeks for the Boulderer, 2 of 20 for the Technician.
  - Perfect hands onsight almost everything, so difficulty is human precision against the window floor.
  - Content runs out around day 3 for a keen player. R2's second crag is needed.

**Depends on:** R0; Phase 5 alongside. **Effort:** ~3–5 weeks.

### R2 — The first season

**Goal.** The free demo Phase 5 defines, on the new build, balanced by bots rather than by feel.

**Scope.**
- Act I: from plastic to the first V5 project. Roadside Crag and Granite Gorge; the Lot at night; the dog offer; one partner arc; the rival's first appearance; the send card.
- Port the v0.956 systems the design bible keeps: load and injury, projects and first ascents, partners and bonds. The v0.956 source makes this exact; without it, port from the audit's line references into the prettified bundle.
- The balance harness (Phase 4's bots, on the new sim) and Phase 6's targets for a season.

**Plan (29 Sep 2026), from the audit and the v0.956 bundle.**
- Numbers and text are v0.956's unless marked.
- Phase 5's design bible isn't written. Where R2 needs a design call from it, the call is marked *[proposed]*: the build uses it until Evan rules.

- **Act I, the demo** *[proposed, from Phase 5's draft]*:
  - It runs from the first morning to your first V5 project, over fall and into winter (about four weeks).
  - It ends when you tie into a V5. The hook is Dex's challenge: a race for Roadside's open project.
  - Where the demo stops is Evan's call. Nothing in the rebuild locks until Phase 19.
  - *As built (R2.5):* Act I is v0.956's "Your First Season" quest, in its words:
    - Its five stages: $60 in hand, 3 sends anywhere, 2 outside, regulars with someone (v0.956 wanted 15 reputation, which the rebuild doesn't have), and climbing V4.
    - Its skill and cash rewards, and a card at the end.
    - It ends at V4, as v0.956's did, and the same night Dex's race starts: that's the hook.
    - A "Next" pill keeps the current goal on screen (Phase 7: say what you want to do next).
- **Places:**
  - **Roadside gets the rest of v0.956's lines:**
    - Finger Crack V4 (crack);
    - Highball Arête V5 (technical): the act's project, tall enough to test your head;
    - The Project V6 (power);
    - the open project, a V7 dyno you first-ascend and name.
    - Trad Arête waits for a gear system.
  - **Granite Gorge, v0.956's second crag:**
    - Access: it opens at V4 (v0.956's gate), it's 2 h out and shaded, and it's closed in spring for nesting raptors.
    - Boulders: Granite Slab V5, The Pinch V6, Serenity Crack V6, Gorge Dyno V7 (really V8: a sandbag), Crimp Cathedral V8, and an open project V9.
    - Sport: Gorge Intro 5.12b, Gorge Classic 5.12c and Power Endurance 5.13a.
    - Gorge Trad waits for gear.
- **Load and injury** (v0.956's model, with Phase 6's fixes):
  - **Load:** each go adds its energy cost × (1 + grade/9) × (0.6 + 0.4 × the share of the line climbed). At sleep, acute and chronic load update as exponentially weighted averages (α 1/4 and 1/14). *Deviation:* v0.956 added (12 + 2g) in the gym and (18 + 2g) outside for goes two hours long; these goes take minutes, so load follows each go's effort.
  - **The ratio (acute over chronic)** gates you:
    - over 1.3, each go carries v0.956's injury risk;
    - over 1.5, gains drop to 60%;
    - over 1.7, you're fried and can't climb.
  - **Injuries:** out 2–4, 6–9 or 13–18 days by tier. *Deviation:* the clinic takes a copay, $45 for tier 2 and $210 for tier 3, because the weekly insurance pays the rest; v0.956 charged $180 and $850.
  - *Fixes:*
    - chronic load starts seeded, so the first week can't spike it;
    - an unwarmed hard go carries v0.956's ×1.6, and an easy go first warms you up;
    - injury rolls come from the seeded session stream, so a replay replays them;
    - your first injury costs time, not money.
  - **On screen:** the You sheet shows load, and the beta sheet warns when your fingers are talking.
- **Projects and first ascents:**
  - Open lines are first-ascended by you. You name them from a list built from your record, and call the grade soft, true or stout, as in v0.956.
  - Dex can race you for one.
- **Windows above your grade** *(a fix the harness found)*:
  - R1's window scale bottomed out at 0.4 two and a half grades over, so a V4 could send the Gorge's V9 with enough goes.
  - Over your level, windows now close by e^(0.9 × margin): about 40% a grade.
  - With the harness's human-ish hands, a boulder goes about 60% a go one grade over, 15% at two, 5% at three and never at four.
- **Partners and bonds** (v0.956's):
  - Tiers: Stranger 0, Acquaintance 1, Regular 3, Partner 5, Ride-or-Die 7.
  - Bond is +1 a day climbing together (Phase 6's cap), and a partner turns up more as the tier rises.
  - Partners' grades track yours: Sage moves a grade every 20 days.
  - Sage's four-beat arc uses v0.956's text, at bonds 1, 3, 5 and 7, at least five days apart (Phase 6's spacing).
  - *As built (R2.4):*
    - A day counts toward the bond when you climb where a partner you've met is, not only on belay.
    - Each tier adds 7% to a partner's odds of turning up (v0.956: 11% on a lower base), so Ride-or-Die Sage turns up five days in six.
    - *[proposed]* Sage's guiding stint lasts a week, not v0.956's 16 days, so her arc fits Act I; her lines say less about how long.
    - *[proposed]* The blessing at beat two gives bond, since the rebuild has no reputation; the last beat needs real rock and takes two hours.
    - *[proposed]* A Regular will come out to the Gorge if you ask before 1 PM on a dry day, and belay you there.
    - The bots reach beat three around day 21 and the last beat between days 28 and 35.
- **The rival, Dex Calloway** (v0.956's: power, a nemesis):
  - *Fix (Phase 6):* his own seeded curve, with streaks, injuries and a peak, instead of v0.956's rubber band one grade ahead.
  - He first shows up when you send your first V4. He races you for the open project at the act's end.
  - *As built (R2.4):*
    - His curve: V5 around week three, a grade every three weeks or so after, a peak of V9–11 from the seed, two to three weeks off hurt, and good and bad weeks of about half a grade.
    - He's out two days in five (the crag when it's dry, else the gym), and he's where he saw your first V4 for the rest of that day.
    - Sage's grade moves as v0.956's did, a grade every 20 days from V4.
    - v0.956's overnight lines say when you pass Dex or he pulls ahead, when you pass Sage, and when Dex gets hurt and comes back.
    - *[proposed]* The race starts the night you're climbing V4 (when the Gorge opens, near the act's end), for v0.956's five days. If he wins, he names the line from v0.956's rival list, and your send becomes a second ascent. Bots that take the dare win about two races in three. Triggers tried first, a first V5 or V6 send outside, caught bots three grades short, and they lost every race.
- **The dog** *[proposed adaptation]*:
  - v0.956 offers a stray after your tenth crag trip. Here the stray is Scout, who's been asleep at the Lot all along; after your tenth trip out, he picks you.
  - Kibble ($6), play (bond) and ride-alongs. The bond perks come later.
  - *As built (R2.4):* v0.956's numbers: kibble fills him and adds 3 bond; the stick is an hour, once a day, for 10; every drive adds 2; a night takes 22 food. v0.956's crag and drive lines, by bond and hunger, with "they" made "he". He picks you on your tenth trip out, and you take him on at the Lot.
- **The send card:** on a first send, a card drawn on the device (the topo, your line, grade, style, date) to save or share. No server.
  - *As built (R2.5):*
    - A 1080 × 1920 PNG (a phone screen's shape, which is what stories and chats want). The line's own wall is repainted at the card's size, cropped to the line, with the line drawn as a guidebook photo-topo and you at the top. Under it: the name in the poster lettering; the grade and how it went ("Redpoint, go 6"); the crag and "Day 18, winter"; your name. A first ascent adds a corner ribbon and "First ascent: <you>"; one Dex got first reads "First ascent: Dex Calloway · Second: <you>".
    - Offered on the sent sheet after a line's first send, and any time after from a sent line's beta sheet.
    - "Send it on" uses the phone's share sheet where it takes files; "Save the image" downloads the PNG. The card shows as an image, so a long press saves it too. Nothing is uploaded; the e2e bot opens a card and still sees no off-site request.
    - *[proposed]* The card's footer letters "DIRTBAG" and dirtbag.rcjlabs.com, so a shared card says where it's from.
- **Phase 9 on the wall:**
  - How close a go was: this go's high point against your best, on the fall sheet and on the wall.
  - Pump you can feel: the climber shakes and the view tightens as the bar fills.
  - *As built (R2.5):*
    - The fall sheet draws the go as a bar: the line from the ground to the top, the cruxes underlined, this go filled in and your best before it ticked. Under it: "Your highest yet", "Level with your best", "Short of your best", or "Your first go on it". No numbers.
    - On the wall, a chalk band follows what this go has climbed, under the rope, and an X marks where it came off. (On a close-up boulder the climber covers the spot, so the flag and the bar carry it.)
    - Past 55 pump the climber shakes, harder as it fills. Past 45 the screen's edges darken, pulsing past 80. The pump bar pulses once it's hot. Reduced motion keeps the darkening and drops the shake and the pulse.
    - *[proposed]* Pace: you move through a line 8% faster for each grade you're over it, and 8% slower for each grade under, from 0.8× to 1.25×. Fewer seconds on the wall means less pump for the same moves, so the same route plays out differently for two climbers. v0.956 had no climb speed. The harness (12 seeds × 28 days) shows no measurable change to the season: same grades at every checkpoint, first V5 go around days 17.5–20.
- **The harness** (Phase 4's bots on the new sim):
  - Strategies: climber, worker and balanced, over 28- and 56-day runs.
  - It reports grade curves, runway (days you could go without working), injuries and when content runs out.
- **Season targets** (Phase 6's, for the first season):
  - a working climber can't take a week off at days 7, 14, 21 and 28 (runway under 7 days), but is never stuck;
  - first-month injuries under 35% for a warmed-up, moderate player;
  - climbing out-teaches setting shifts;
  - a median climber is on a V5 project by day 28.
  - *As measured (R2.5, 12 seeds × 28 days × every start and strategy; `npm run harness` prints these):*
    - ✓ Runway, balanced: median 2.3, 2.3, 2.6 and 3.4 days at days 7, 14, 21 and 28; the most any run had was 5.1. No stuck nights (hungry, or the card nearly maxed) and no refusals, for any strategy.
    - ✓ Injuries: 0 of 144 moderate runs in the first month; 4 of 144 cold, reckless ones (3%). *Caveat:* that passes with room to spare, and may be too gentle for the body to register as a trade-off. A playtest question.
    - ✓ Climbing against setting: an hour on the rock teaches 5.8–12.4 skill points (V0–V4), and a setting shift 0.75. The bots end the month at a median V3, so "every grade" means V0–V4 here.
    - ✓ First V5 go: median day 18–18.5 for every strategy.
    - *Found on the way:* by the fourth week about half the bots hit a wet day with the week's six gym problems sent and nothing new to try. A player can lap, rest or work. More gym problems, or a harder circuit once you've sent the set, would close it: Evan's call.

**Done when.**
1. Phase 9's criteria pass on the new wall: a watcher can tell how close a go was; a pumped go feels tense; two climbers play the same route differently.
2. Phase 7's first-hour criteria pass.
3. The harness shows a working climber still facing a "can I afford this week off?" choice at the end of the season.

**Status (29 Sep 2026): done; criteria 1 and 2 by Evan's call.** Built: R2.1 to R2.5.
- Criterion 3 passes in the harness (above).
- Criteria 1 and 2 (Phase 9's watchers, Phase 7's first hour) were accepted by Evan on 29 Sep as tested and watched. What they covered:
  - Phase 9: the reach bar, the chalk band, the pump shake and vignette, and pace;
  - Phase 7: the first hour, with Act I's goals on screen.
- The design calls marked *[proposed]* above stand as built until Evan rules on them: Sage's week away, the blessing's bond, the race's V4 trigger, Act I's "regular" stage, pace, and the card's footer.
- Carried open: injuries may be too gentle in the first month, and wet days in week four can leave nothing new to try (both above).

**Depends on:** R1 and Phase 5. **Effort:** ~6–10 weeks.

### R3 — Switch-over

**Goal.** The new build becomes dirtbag.rcjlabs.com and the Play app.

**Scope.**
- **Decide what happens to v0.956 players** (Evan's call). Either keep v0.956 playable at `/classic/` under its own service-worker scope, or retire it with notice and a save export.
- **Point the site pipeline at the new build:** check, smoke test, stage, deploy and the TWA. The version moves past 0.956, and the new service worker deletes the old cache.
- **Store copy:** listing, screenshots, and "What's new" in the game's voice.

**Decided (29 Sep 2026, Evan):**
- **v0.956 retires, and its saves are exported.** The site and the Play app become the rebuild; v0.956 isn't kept at `/classic/`. A v0.956 player keeps their career as a file, and can carry on in the rebuild under their old name, with their climbing capped.
- **The version is 0.960.0.** It continues the 0.9xx line: the rebuild ships a first season, not the finished game.

**Plan (29 Sep 2026):**
- **R3.1, the retirement path, in the rebuild:**
  - v0.956 kept everything in `localStorage` under `dirtbag-` keys: the career it was playing (`dirtbag-save-v3`), three manual slots, and the last "What's new" seen. The rebuild's keys are `dirtbag.`, so nothing collides.
  - When a v0.956 career is found, the creation screen says v0.956 has retired. It offers the career as a file (every `dirtbag-` key, byte for byte), prefills the old name, and offers "As you were": your own skills, capped.
  - Settings keeps the download for later. Nothing ever deletes v0.956's keys.
- **R3.2, the site becomes the rebuild:**
  - The version moves to 0.960.0.
  - The site is staged from `app/dist`, and check, smoke, size and deploy follow it.
  - The rebuild's worker ships as `service-worker.js`, so a returning player's browser updates in place and drops v0.956's cache.
  - The TWA manifest follows the new build.
  - v0.956's files leave the tree; the `v0.956.0` tag keeps them for a rollback.
- **R3.3:** store copy, "What's new", and the docs.

**Done when.**
1. A tag deploys the new build and the Play app updates.
2. A v0.956 player who opens the site isn't stranded: their career is still playable or exported.

*As built (R3.1):*
- The notice, the file (`dirtbag-v0956-career.json`: the format, when, and every `dirtbag-` key as v0.956 wrote it), the prefilled name, and "As you were". The e2e bot plays a v0.956 player in a browser of their own and checks all four, and that the old keys are untouched.
- *[proposed]* A carried climber comes across at no more than V3, scaled so their shape survives (strong fingers stay strong). V3 is the middle of Act I: a veteran skips the gym basics but still has the act's top grade and Dex's race to earn. The rebuild has nothing above V9 to climb anyway. Under the cap, they come across as they were. The You sheet calls them "An old hand".

*As built (R3.2):*
- **Version 0.960.0.** One version in `package.json`, stamped into both lockfiles, `app/package.json` and the TWA's `appVersionName`; `npm run check` fails on any drift.
- **The site is the build.** `npm run stage` copies `app/dist`, plus `privacy.html`, `CNAME` and `.well-known/assetlinks.json`: 21 files and about 550 KB, where v0.956 was 15 MB. v0.956's files and its tools (the build compare, the splitter, the old size report) left the tree; the `v0.956.0` tag keeps them.
- **The worker changes hands.**
  - The build's service worker ships as `service-worker.js`, v0.956's name, so an installed browser swaps workers in place. On activating it deletes v0.956's `dirtbag-v…` caches.
  - The game also asks for a new worker on every launch, because `register()` on a registered worker doesn't look, and the browser's own look can wait a day.
  - The new check caught a lost escape in the generated worker (`dirtbag-vd+`) that would have left v0.956's 10 MB behind.
- **The crossover, tested locally** with v0.956's own files:
  - The first visit after the deploy shows v0.956 from its cache.
  - About 2.5 s later the new worker installs and deletes `dirtbag-v09560`.
  - From the next launch it's the rebuild, retirement notice and all, offline included.
  - With reloads faster than the browser checks, v0.956's old worker serves the rebuild (cached, offline too) until a later check swaps them. Nobody is stranded either way.
- **The pipeline follows:**
  - the smoke test plays the rebuild's first minute (its clock moves on an action, not on time);
  - CI and Deploy build the game first;
  - Deploy's live check reads `version.json` and confirms `service-worker.js` is the rebuild's.
- **The shell:** the build draws `favicon.ico` too. The Play app's bars and splash take the game's `#15161a`.
- **The privacy page** describes this game: its settings, the send card, and the old-career file. v0.956's diagnostics and screen wake are gone.
- **Evan's steps:**
  1. push `v0.956.0`, so a rollback has somewhere to land;
  2. push `v0.960.0` to deploy;
  3. once it's live, run Build TWA and upload the bundle to Play.

*As built (R3.3):*
- `docs/STORE.md` holds the Play listing for 0.960.0, in the game's voice: an 80-character short description, the full description, and "What's new". The order follows the audit (the life, then the climbing, then the promise); every fact in it is checked against the build. `npm run check` holds each block to Play's limit.
- Eight 1080 × 1920 screenshots from the 0.960.0 build, listed there with captions. They were delivered with the release work rather than committed, since they're binary.

**Released (29 Sep 2026).** Evan published `v0.960.0` on `main` (`59bd69e`) at 16:17 UTC.
- Deploy run 1 passed its checks, and its live check: the site serves this commit and the rebuild's worker, and the live smoke test passed. Evan reports the release steps done.
- `v0.956.0` stays untagged on purpose. That tag's push deploys v0.956, so creating it on `e098332` is the rollback, not a safety step.
- The live crossover on a phone that had v0.956 installed is the one check left.

**Status (29 Sep 2026): built and merged (PR #11); closed by Evan's call with the release carried.** Evan moved on to Phase 10 the same day; the release steps below stay his, and R3's criterion 1 is met when they're done.

*The notes below are from before the merge.*

**Status before the merge: built; the release is Evan's.**
- Criterion 2 is built and tested before the deploy:
  - the e2e bot plays a v0.956 player who keeps their career and comes across;
  - a local crossover with v0.956's own files shows an installed browser swapping to the rebuild within seconds, offline included.
- Criterion 1 needs the release steps this session can't take. Tag pushes are refused here, and the Play Console is Evan's.
  1. Push `v0.956.0` on the commit before the switch, so a rollback has a target.
  2. Push `v0.960.0` to deploy the rebuild. Deploy then checks the live site serves this commit and its worker.
  3. Once it's live, run Build TWA and upload the bundle, with the "What's new" from `docs/STORE.md`.
- R3 closes when both tags are out and the Play app has updated. Then check the live crossover once: on a phone that has v0.956 installed, the first launch after the deploy may still show v0.956; the next shows the rebuild and the retirement notice.

**Depends on:** R2. **Effort:** ~1–2 weeks.

**Risks of the rebuild.**
- **It stalls at "almost as good as the old one".** That is how rewrites usually fail. Mitigations:
  - v0.956 stays live and untouched until R3;
  - R3 ships at the first season, not at full parity;
  - every milestone is playable;
  - rules are ported from v0.956's numbers, not redesigned, except where the four decisions change them.
- **Time.** Code-drawn art saves the commissions and the asset pipeline, but re-implementing the systems spends most of that back. Expect the 12–19 month total to hold rather than shrink [INFERRED].
- **Old saves.** v0.956 saves don't map onto the new state: the economy, places and climbing all differ. The default is a fresh start. Carrying over name and grade as a legacy import is possible [proposed, Evan's call].
- **Public source.** See "Where the rebuild lives" above.

## How the phases fit together

*The table and figures below predate the rebuild. The rebuild track replaces most of Stages A and C.*

| Stage | Phases | Purpose | Rough effort |
|---|---|---|---|
| A. Make it safe to change | 1–4 | Source control, a safety net, load time, and pulling the simulation out of the UI | 8–14 weeks |
| B. Decide what the game is | 5–7 | Design bible and cut list, core-loop retune, the first hour | 5–8 weeks |
| C. Make it look like the game it is | 8–13 | Art direction, the climbing screen, crags, the town, the UI system, sound | 18–29 weeks |
| E. Make the full game worth paying for | 21, 22, 24, 23, then 16–18 | The climber (gear, trad, training, crags past Act I), the life (van, body, food, hustle, games), expeditions as trips, who you are (origins, stances, Record Book); then the story spine and ending, the people, careers and jobs | 37–57 weeks |
| D. Get it in front of people | 14–15 | Desktop/Steam build, then the demo, store page and festival: after the full game, by Evan's call | 4–6 weeks |
| F. Ship | 19–20 | Monetization, store readiness, beta, launch and after | 5–8 weeks |

That adds up to about 56–90 weeks, roughly 13–21 months [INFERRED].

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

### Phase 1 — Source of truth

**Status (28 Sep 2026): closed by the rebuild.** The release pipeline is built. The rebuild changes what the open items below are worth:
- Items 1–3 were about building v0.956 from its source. The new build is built from source in CI by construction, and R0 drives its version from `package.json`. The v0.956 source is still worth putting somewhere private, as a reference for porting rules exactly in R2.
- Item 4 is done: Pages builds from Actions and the environment accepts tags. The first tag deploy was `v0.960.0`, on 29 Sep 2026 (Deploy run 1, green).
- Item 5 still stands before the next store release.

The status as it stood before the rebuild:

**Done**, in this repo:
- **CI (`ci.yml`), on every push:**
  - `npm run check`: one version everywhere, every referenced file exists, and the TWA domain link is intact.
  - A size report.
  - A headless Chromium smoke test that plays the first minute: boot, service worker, new game to town, save, clock, reload, offline start. It fails on any error, any failed request, or any request that leaves the site.
  - It was run against four deliberately broken builds. Each failed in under a second and named the cause.
- **Deploy on tag (`deploy.yml`):**
  - The tag must match `package.json` and the version compiled into `index.html`.
  - It smoke-tests the staged allowlist, deploys, confirms the live site serves the release, then smoke-tests the live site.
  - Rolling back means running the same workflow on an older tag.
  - Not yet exercised: it waits on the settings switch in item 4 below.
- **One version:** `package.json` sets the service-worker cache name and the TWA `appVersionName` through `npm run stamp`. `npm run check` fails on any drift, including the version compiled into the build.
- **Play toolchain pinned:**
  - Bubblewrap CLI and core 1.25.0 are pinned via `twa/package-lock.json`. Core owns the Android template.
  - The workflow asserts `targetSdkVersion` ≥ 36, Play's floor for updates since 31 Aug 2026.
  - The only bundle built so far (18 Jul) predates Bubblewrap 1.25, so it targets API 35 [INFERRED from that version's template]. It stays listed, but the next Play update has to come from the new workflow.
  - The first check run found the workflow broken for everyone since 15 Sep. Google removed the legacy SDK `tools` package, and `setup-android` still requested it. Fixed by installing `platform-tools` only.
  - Verified by an unsigned check run: it built a bundle with `targetSdkVersion` 36 and versionCode 1510275. July's bundle was 1405609, so codes keep increasing.
- **Dead weight out:**
  - Removed the duplicate `/music` folder: 6 MB, byte-identical to the embedded tracks, never fetched.
  - Added `favicon.ico`.
  - Marked `index.html` as generated, so git never text-diffs it.
  - Added `npm run compare`, which diffs two builds part by part, for the handoff below.
- **Docs:** `CLAUDE.md` and `README.md` for this repo. The source repo will need its own.

**Open**, and which Done-when criterion each blocks:
1. **Put the source in a private repo** (e.g. `RCJLabs/dirtbag-src`). Only Evan can do this; the source isn't on GitHub. Then tag it `v0.956.0-baseline` and run `npm run compare` on its build against this repo's `index.html`. Blocks criterion 1.
2. **Source CI** that builds `index.html` and hands it to this repo, so a release is "tag" rather than "upload, then tag". Blocks criterion 2.
3. **The app reads its version from `package.json`** at build time (a Vite `define`). Today that copy is checked, not driven. Blocks criterion 3.
4. **One-time settings, done by Evan:**
   - Pages source → GitHub Actions.
   - A `v*` tag rule on the `github-pages` environment.

   The first tag deploy then exercises `deploy.yml`.
5. **The next Play update:** run "Build TWA (AAB)" with signing on. Not a Done-when criterion, but due before the next store release.

Criterion 4 (the smoke test runs green in CI) is met.

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

*Rebuild note: the save, crash and determinism rules become R0's foundation. The hotfix batch needs the v0.956 source.*

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

*Rebuild note: superseded. The new build has no sprites or base64 music; R0 adds a size budget to CI.*

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

*Rebuild note: superseded. The new sim is separate from day one; the balance harness moves to R2.*

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
- **The cut list** (a starting point; confirm in the bible). *Evan's call, 29 Sep 2026: blackjack, Texas hold'em, liar's dice, horseshoes and busking (the music hobby) come back, in Phase 22, on terms that stop them farming bond; trivia and a garden with farm visits are maybes.*

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

*Rebuild note: this becomes R1's target, on the new build.*

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

*Rebuild note: done. The look is the Mix: park-poster landscapes with comic people and panels, drawn in code. Tokens and components are built in R0–R1; the Steam capsule art moves to Phase 15.*

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

*Rebuild note: reshaped as beta-then-send (see Direction) and built from R0. The criteria below gate R2.*

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

**On the rebuild (plan, 29 Sep 2026).** The scope above was written for v0.956's nine crags up to V17. The rebuilt game has the gym, Roadside Crag and Granite Gorge, and a first season that tops out at V9. Phase 10 grows it a place at a time, in slices:
- **10.1, the board at Send City.** A steep board beside the weekly wall, with harder problems (V4–V7) that stay up four weeks: v0.956's "persistent gym walls". It fills the gap R2's harness found, where by week four about half the bots hit a wet day with the week's set done and nothing new to try.
  - *As built (10.1):*
    - **The board.** Four problems, V4 to V7 left to right, each a one-crux library boulder of 6–9 moves drawn from steep styles: power and crimp twice as often as dyno and technical. All four reset together every four weeks (`BOARD_WEEKS`).
    - **Ids and saves.** Ids are `bd-{block}-{n}` on a new seed stream, `worldgen` → `sendcity-board-{block}`, logged for Unreal. An old id still resolves for its log. The state's shape doesn't change.
    - **On screen.**
      - The gym scene runs on past the wall to the board: a dark panel with a lit grid, its grades on the kicker, and "RESET EVERY 4 WEEKS" (from `BOARD_WEEKS`).
      - Its sheet lists the four problems: where you stand on each, and the days until the next set.
      - Face-on, a problem is its lit holds: green start, blue hands, yellow feet, a purple finish.
      - Down from a board problem, you land under the board.
      - The e2e bot opens the board and a problem, and checks where "Down" puts you.
    - **The harness** (12 seeds × 28 days × every start and strategy):
      - "Nothing new to try" went from 4–10 runs of every 12 to 3 of 144. In those 3, the climber had sent all four board problems by day 26–27; the next set goes up on day 29.
      - The median climber ends the month at V4, where it was V3.
      - The first V5 go comes about a day later (days 19–20), because the bots work the board's V4 first.
      - All four season targets still pass.
    - **Board grades run a grade stiff** (Evan's call, 29 Sep 2026). As first built, they climbed like the wall's: board V4s and wall V4s were both sent at a median climber grade of V3, and 3 runs sent the V7 at V4.
      - Now each board problem climbs like the grade above its label (`BOARD_STIFF`), as real boards run.
      - It says so on your first go: "Board grades: that's no V5. Nobody on the mats is surprised."
      - The board's card warns you before you pull on.
    - **The store copy** (`docs/STORE.md`) describes 0.960.0, which has no board. It gains the board with the release that carries it.
- **10.2, conditions you can see.** The shade line crossing the wall through the day (the prime window made visible), wet streaks after rain, and closures on the map.
  - *As built (10.2):*
    - *[proposed]* **The sun crosses a crag a line at a time.** It's a rules change, so the shade line can be honest.
      - Before, every line at a crag greased at the same minute. Now the sun takes two hours (`CLIMB.sunSweep`) to cross Roadside from the boulder field's far end to the road, and each line greases when it arrives (`sunOn`).
      - The crossing is centred on R1's single times (3 PM prime, 2 fair, noon hot), so the average line keeps its old time. `greaseFrom` now means the sun's first minute on the wall.
      - The Gorge stays in the shade.
      - Why this way round: the far end's projects lose their shade first, so projecting is a morning job, and the warm-ups by the road keep theirs longest, for someone who arrives after a shift. Run left to right first, the sun made day one's Warm Boulder greasy when the e2e bot got there at 2:53 PM, after a double shift.
    - **On screen.**
      - In the crag scene, warm light on the side the sun has crossed, with an edge that passes each line's foot at its sun time. A view test holds the scene's layout to the sun's path.
      - On a route's wall, the same edge crosses its sport lines, or the boulder's close-up.
      - Wet rock: darker and streaked the day after rain, more so in it.
      - On the map, CLOSED (the season) and SOAKED (rain) under a crag's pin.
      - The beta sheet says "in the shade till 4 PM", "in the sun, smaller windows", or "damp from the rain". The forecast gives the sun's crossing ("from 1 PM to 3 PM").
      - The e2e bot checks the Warm Boulder's shade on day one.
    - **The harness** (12 seeds × 28 days):
      - All four season targets pass. The first V5 go is at day 19 for every strategy.
      - 1 run of 144 has a day with nothing new to try.
      - Reckless bots' injuries read 7 of 144 (5%, small numbers); moderate bots', 0.
      - The bots don't plan around the shade, so the gain goes to a player who does.
- **10.3, Moonstone Boulders**, v0.956's next crag: desert quartzite, opens at V6, a permit to climb. Its scene and topos drawn in code, highballs with pad and spotter decisions (the audit's idea for its identity), and its road on the map. It's where Act II would start.
  - *As built (10.3a, Moonstone as a place):* 10.3 is in two parts: the place first, then highballs (10.3b).
    - **v0.956's terms.**
      - It opens at V6 (`minGrade`).
      - You pay $400 once, in cash in hand and not on the card, to open the trip for good. v0.956's unlockCost, "a $400 haul"; here it buys pads, water jugs and a guidebook. It's paid from the place card, and the game remembers it in a new `unlocked` list.
      - A $20 permit on every trip in. Unlike gas, it won't go on a maxed card.
      - Three hours and $30 of gas from the Lot, north up the highway past Roadside (two hours from there).
    - **Desert rock:** every window at Moonstone is × 0.92 (`CLIMB.desertFactor`), v0.956's desert −0.08 translated the way seeping's −0.07 was. It's sunny, so the sun crosses it as at Roadside.
    - **v0.956's nine lines:**
      - boulders: Tall Arête V6 (v0.956 called it Highball Arête, like a Roadside line, so it's renamed), Moonstone Mantel V7, The Egg V8, Hueco Pockets V9 (climbs like V8, as in v0.956), Moonstone Splitter V8, Lunar Roof V11, and an open V12 project;
      - sport lines on a spire: Desert Spire (5.13a) and Moonlight Arête (5.13c).
      - The highballs are drawn up to 22 ft.
    - **Save v4.** `unlocked` is new, so 0.960.0's saves (v3) migrate with none paid for. The migration is tested against a real v3 save written by 0.960.0's code.
    - **On screen.**
      - The scene: a desert noon, violet mesas, sand, and pale quartzite. A spire, square-fractured and rust-streaked, carries the two bolted lines, and the boulders stand on the sand.
      - Close-ups: desert boulders with scrub behind them, and the spire face-on.
      - A map pin where the highway leaves the valley.
      - The place card sells the haul, then shows the drive with gas and permit together.
    - **Open.**
      - The spire's two lines need a belayer, and nobody's schedule brings anyone to Moonstone yet. They're climbable data waiting on a road-trip partner, as the Gorge's bolts waited on Sage.
      - The bots don't go there. It's past the first month for all of them, so the harness is unchanged.
      - There's still no V10 boulder anywhere in the game, and v0.956 had none here either (criterion 3).
  - *As built (10.3b, highballs):* new design, kept as built by Evan's call (29 Sep 2026), month-one risk and all. v0.956 had no highball rule, only a generic "close call" for climbing without a pad, and a shop upsell for "a second crashpad for highballs".
    - **The rule.**
      - A `highball` flag goes on the tall boulders: Roadside's Highball Arête (18 ft, whose own line says the crux is where the pads stop helping), and Moonstone's Tall Arête, Splitter and project.
      - A fall off one can land badly. Nothing up to 8 ft; above that, each foot adds 1.2% (`HIGHBALL`), so a fall from 16 ft is about 1 in 10 and from 22 ft about 1 in 6.
      - The Moonstone haul's pads halve it. A partner there to spot you (`belayer`) halves it again.
      - A bad landing is an ankle, using v0.956's ankle names: jammed, rolled, broken, by how far over 8 ft you fell. Its days off and clinic bill are an injury's.
      - It rolls on its own label in the session stream, and only when overuse didn't already hurt you on that go.
    - **The decisions** are these: whether to own the pads, whether to wait for someone to spot you, and whether to go at all. The beta sheet shows the odds before you pull on ("a fall from the crux is 16 ft. The haul's pads, nobody spotting: about 1 in 21 lands badly").
    - **Not built: pad placement.** Every boulder here has one crux, so the pads always belong under it, and there's nothing to choose. If Evan wants placement, it needs boulders with two places to fall first.
    - **The harness.** Moderate bots now wait for a spotter while a crux fall is worse than 1 in 20. Reckless bots don't.
      - With Hazel spotting at Roadside, careful bots still come off Highball Arête enough that 10 of 144 runs end the month with a jammed ankle (7%; it was 0). Reckless bots: 15 of 144.
      - The target (under 35%) passes, and so do the other three.
      - R2 found 0% might be "too gentle to register as a trade-off". Whether 7% is right is a tuning call: the per-foot rate is one dial.

**Done when, on the rebuild** *[proposed; replaces the criteria above until Evan rules]*:
1. The gym and every crag in the game read as places: their own scene, lines drawn from data, and conditions you can see (shade, wet, closed).
2. Any day of the first season, in any weather, has something new to try: the harness's "nothing new to try" reads 0.
3. There are lines at every grade the first season reaches, V0 to V9. (Scoped to Act I by Evan's call, 29 Sep 2026: Moonstone is where Act II starts, and more crags come in later phases.)
4. Testers can point at where they want to go and say why (conditions, style, a project).

**Status (29 Sep 2026): 10.1–10.3 built; closed by Evan's call.** Criteria 1–3 pass on the build. Criterion 4 (testers) carries to the first tester round. The marker moved to Phase 11.
1. Met: the gym, Roadside, the Gorge and Moonstone each have a scene, lines drawn from data, and conditions you can see.
2. Met: 0 runs in 144 have a day with nothing new to try.
   - The harness counts only content running out. Before, a day the body kept you off the rock counted as nothing to try; now it's "resting", since the lines were still there.
   - The last run it caught was a V4 climber who had cleared the gym by day 25, the board's V7 included, then got a wet day. With the board a grade stiff, that V7 is a month-two project.
3. Met, as scoped: every boulder grade from V0 to V9 has lines. The weekly set covers V0–V5, Roadside V2–V7, the board V4–V7 and the Gorge V5–V9.
4. Needs testers.

With the stiff board, the harness (12 seeds × 28 days) shows:
- All four season targets pass.
- The first V5 go comes at day 19–19.5, but a few runs (up to 2 of 12 in some starts) don't tie into a V5 by day 28.
- An hour on the rock at V4 teaches 8.3 skill points, down from 10.1, since the board's V5 now climbs like a V6.
- Careful first-month injuries read 8 of 144 (6%); reckless, 15 of 144.

*As built (follow-ups, 29 Sep 2026):*
- **Moonstone's own sky.** v0.956 rolled every crag's weather from its climate. Out of the valley, Moonstone now gets its own sky, as a new place flag `ownSky`:
  - the season's odds, shifted by v0.956's desert terms (12 points more heat, 10 less rain, 2 less prime), on its own seed label;
  - over a year it rains less and bakes more than the valley, so a wet day at home can be a dry one out there.
  - Its place card says what it's doing ("Out there today: fair."), and once it's paid for, the forecast adds it to each day.
  - The Gorge keeps the valley's sky, which R2's season was tuned on; v0.956 rolled it apart too. v0.956's desert "soft after rain" and "washed clean" aren't carried: the day after rain seeps as it does in the valley.
- **The harness** counts a day the body kept you off the rock as "resting", not "nothing".
- **Roadside's card** said "Seven lines" of eleven. The count now comes from the data (`{lines}`), and a content check holds every place card's text to the placeholders it can fill.

---

### Phase 11 — Replace the joystick town with a valley map

*Rebuild note: reshaped. The map stays; the two walkable scenes become side-view scenes wherever people are, drawn in code rather than from a tileset.*

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

**On the rebuild (plan, 29 Sep 2026).** Most of the scope above is already how the rebuild works:
- a valley map drawn in code, with labelled pins;
- tap a pin, then drive: the van runs along the road for a fixed time and gas;
- side-view scenes you tap to walk around;
- a clock that moves only on actions and travel (criterion 4, which the smoke test already checks).

There's no joystick, zone graph or tileset to retire. What's left, in slices:
- **11.1, count the taps.** The e2e bot counts its taps on every trip and on a scripted day-3 loop (a shift, the crag, three goes, back, dinner, bed), and reports them against criteria 2 and 3. Anything over gets fixed.
  - *As built (11.1):*
    - **What counts:** every tap, click, key and walk the player makes, but not the hold button, which is the climbing itself. Picking a line, Go and walking off all count, so the loop's three goes cost 9 taps.
    - **The first count**, on the build as it was:
      - Trips: 3 taps from a scene by the map (Map, pin, drive), 2 by the crag's van, 1 from a card-only place's own card. Criterion 2 held as built.
      - The day-3 loop: 32 taps. 12 of them waited for bed at 6 PM after getting home at 1 PM: four "Lie around in the van" at an hour each, the walk to the fire, two sits there, and the walk back. The other 20 were the day.
    - *[proposed]* **Bed once it's dark, and one tap to get there.**
      - Bed opens at 5 PM, when the Lot turns to night and the fire's lit, not 6. The hour between could only be filled at the fire, on foot.
      - "Lie around till dark" takes the rest of the afternoon in one tap, at the old 4 energy an hour. Acts gain an `until` time, and `actCost` prices them the same for the rules and the button.
      - The trade: 6 PM made a bad day harder to skip, but only by taps. Skipping a day still costs what it did: the $18 spot, a shift not worked, a day of the season.
      - The harness doesn't move: all four targets pass, the first V5 go comes on days 19–19.5, and the injury counts are the same.
    - **The e2e** now plays three days on a pinned seed, so day three is prime and Roadside is open. Day two ends with the drive home and one tap to dark. Day three takes 20 taps. The run fails on a loop over 20, or a trip over three taps from a scene.
- **11.2, place cards.** Each card gets a header drawn from the place itself, and "Who's around": the people there now (partners, regulars, Dex). So before the drive you know whether there's a belayer, or a spotter for a highball.
  - *As built (11.2):*
    - **Read at the hour you'd arrive.** A card shows the place as you'd find it: now if you're there, otherwise after the drive. People keep hours, so "now" would promise a belayer who's gone by the time you park.
    - **Who's around** lists everyone who'll be there between then and the end of the day, with when: "Hazel, till 5 PM", "Sage, from 9 AM till 6 PM", "Hazel, till 8 AM, and from 5 PM".
      - Someone you haven't met is "someone you haven't met". You know Hazel from the first morning.
      - The sim reads each person's day a minute at a time (`staysAt`), so an invite's odd minute counts.
      - Only places with a scene list it. Nobody's day takes them to the diner or the café, and their regulars, Otis and Wren, are in those cards' own words.
    - **One more line at a crag with ropes or highballs**, on what the people there mean for you:
      - "A belayer and a spotter till 6 PM", "A belayer from 9 AM", or "Nobody to belay you: boulders only".
      - Partners whose stays overlap count as one stretch.
    - **The header**, a band at the top of the card:
      - A place with a scene is drawn from it, at the hour you'd arrive: whoever's there, the sun's edge, the wet, the night. It's framed where its people stand, through the same renderer as the screen with a wider view.
      - A scene's layers take 100–200 ms to paint here, more on a phone. So each header's painted background is kept per scene, time of day and size; only what's drawn over it changes with the hour. The card shows first and the header after, and drawing one never pushes the scene you're in out of its cache.
      - The diner and the café get fronts drawn in code: Otis in a booth with the paper, Wren on the bar. They're lit after dark, and it rains on them when it rains.
      - The scenes' far layers are now painted wide enough for a header's view. The screen sees the same pixels as before.
      - A layout test holds every place to a header (a scene or a front), and every scene to somewhere for its people to stand.
    - **The e2e** checks that the café's front and Roadside's header paint. It reads Roadside's card on day two ("Hazel, till 5 PM", then a belayer and a spotter till 5) and Send City's ("Someone you haven't met, from 9 AM till 6 PM"). Trips stay at 3 taps from a scene, and day three at 20.
    - The download grows 2.8 KB, to 201 KB of the 250 KB budget.
- **11.3, adding a place is documented work.**
  - Roads become a graph: a place needs roads to its neighbours only, and a trip anywhere else is the quickest way through them. Today every pair of places needs its own hand-typed road; Moonstone needed six.
  - A checklist goes in `app/README.md`.
  - CI checks that every place has a pin, a card, roads that reach everywhere, and a scene (or none, on purpose).
  - *As built (11.3):*
    - **Roads are a graph.** Each place has roads to its neighbours only: 11 roads, down from one for every pair (21). A drive anywhere else is the quickest way through them, by time, then by gas (`road`).
      - The network: town's six streets; the highway up to Roadside from the Lot, the café and the diner; and one road each for the far crags. The Gorge's dirt road and the desert road to Moonstone both leave the highway at Roadside.
      - Every trip made daily keeps its cost: town hops, town to Roadside and back, and v0.956's drives from the Lot to the Gorge (two hours, $22) and to Moonstone (three hours, $30).
      - Nine rare trips change, all to or from the Gorge or Moonstone:
        - Roadside to the Gorge: 60 min and $10 (was 70 and $12).
        - Roadside to Moonstone: $18 (was $20).
        - The gym to Moonstone: 190 min (was 175). The café and the diner to Moonstone: 10 min longer.
        - The gym and the diner to the Gorge: 5 min longer.
        - The Gorge to Moonstone: 180 min and $28 (was 190 and $32).
      - The harness reads the same on every target, and all of the e2e's clock and cash checks hold.
    - **Drives on the map follow the roads.** A place off the highway declares its side road in `SIDE_ROADS`: Old Town's spur, the Gorge's dirt road. A drive runs out along one side road, along the highway, and in along the other. Before, every drive went through the Old Town junction, so Roadside to Moonstone ran south to town and back.
    - **A checklist** in `app/README.md`, "Adding a place": the place, its acts, its roads, its lines, its pin and side road, its picture (a scene with its header frame, or a front), its people, the checks, the logs.
    - **CI's checks**, by name:
      - `content.test.ts`: every road joins two real places, once, and is the quickest way between its own ends (else nobody drives it). Every place reaches every other, the same both ways. v0.956's drives from the Lot keep their terms.
      - `layout.test.ts`: a pin and a header for every place, and a scene that's the place's own. Side roads start on the highway. Drives go pin to pin without running past either end or skipping road.
    - **A dry run of the checklist**, in a scratch copy that was then thrown away: a card-only "Gear Shop" in Midtown.
      - The data was 13 lines in `places.ts` (the place, one act, one road to the café), plus a one-line pin and a stand-in front.
      - With the data alone, the tests failed by name on the missing pin and header.
      - With the pin, they failed on a pin too far off the highway for a straight street. That failure now says to give it a side road.
      - Then everything passed, and the place worked in the game: its card, the drive there, and a drive from it to every other place, all worked out from its one road.
      - The front, the illustration, is the slow part, and the criterion leaves it out. The run was mine, not a person's, so its speed says nothing about theirs. What it shows is that the steps are complete and each gap gets named.
- **11.4, the daily agenda** (optional in the scope above): plan a day as a sequence ("shift → diner → gym → van") and run it, stopping at the first thing the day refuses.
  - *As built (11.4, Evan's call to build it):*
    - **A plan is a list of steps**: a place, and an act there (a shift, a meal, cooking, lying around, bed) or a climb. It runs in one go:
      - it drives to each place and does each act through `act()`, as a tap would, so the rules never know a plan ran them;
      - it waits at a climb while you climb, and **Go on** runs the rest;
      - it stops at the first thing the day refuses and says why. Bed ends the day, and the plan with it.
    - **Yesterday is the plan.** The game notes each day as you play it: every act, and a climb once a visit. "Plan the day", on the van, opens on yesterday. Take steps out, add them by where and then what; bed always stays last. "Run the plan" repeats it the next morning.
    - **What you can plan** comes from the data: a place's acts, and climbing where there's something to climb. It leaves out the moment Scout picks you, and a dog's errands when you have no dog.
    - **The plan lives beside the save**, like the settings (`dirtbag.plan`). The save's shape doesn't change. Starting over forgets it.
    - **A chip under the HUD** shows the step it's on, **Go on** after a climb, and why it stopped. It sits above any sheet, because a card-only place always has its card open.
    - **The e2e:**
      - Day four runs day three again as a plan: 13 taps, against day three's 20. That's 3 to start it, 9 for the three goes, and 1 to go on.
      - Day five lies around till dark, then runs the plan, which stops at the café: "Shifts start by 3 PM."
    - Size: 203 KB of the 250 KB budget.

**Done when, on the rebuild** *[proposed; replaces the criteria above until Evan rules]*:
1. 4 of 5 testers find any destination within 5 seconds. This carries to the tester round.
2. Any destination is two taps from the map (the pin, then the drive), and so three from a scene. The card between pin and drive shows the cost, the weather and who's there, so it stays. The e2e bot counts it.
3. A day-3 loop takes 20 taps or fewer, not counting the climbing itself. The e2e bot counts it.
4. The clock doesn't move while you're idle: true, and checked by the smoke test.
5. A new place without a scene takes under an hour: a checklist, the road graph and CI's checks make it a data change plus a pin.

**Status (29 Sep 2026): 11.1 to 11.4 built; closed by Evan's call, shipping as 0.961.0 with Phase 10.** Criterion 1 (testers) carries, as Phase 10's did. The marker moved to Phase 12.

**Released (29 Sep 2026).** Evan published `v0.961.0` on `main` (`afab5a5`, the merge of PR #12) at 17:36 UTC, carrying Phase 10 and Phase 11.
- Deploy run 2 passed its checks and its live check: the site serves this commit, and the live smoke test passed.
- The Play update (Actions → Build TWA (AAB), then the upload with 0.961.0's "What's new" from `docs/STORE.md`) is Evan's step.

**Status before closing: 11.1 to 11.4 built.** Criteria 2 and 3 pass on the build, counted by the e2e: 3 taps at most for a trip from a scene, day three in 20, and day four by the plan in 13. Criterion 4 passes (the smoke test). Criterion 5 passes by a dry run: a card-only place was 13 lines of data and a pin, with the tests naming each missing piece, and its front is the illustration the criterion leaves out. Criterion 1 carries to the testers.

---

### Phase 12 — The UI system and the desktop layout

*Rebuild note: folded into the rebuild, R0–R2.*

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

#### Phase 12 on the rebuild

*Planned 29 Sep 2026, with Evan's calls on navigation and landscape.*

**What the rebuild already covers.** The "Why" above is v0.956's. The rebuild's panels share one kit of tokens (colours, fonts, borders); 11 inline `style` props are left, mostly CSS variables for meters. Toasts queue one at a time, never catch a tap, and hold back while you drive. Reduced motion follows the system, and settings sit beside the save, so starting over keeps them. What's missing, by criterion:
1. A handful of inline styles.
2. **Landscape.** The game is one 360 × 740 portrait screen, scaled to fit and letterboxed. At 1280 × 800 it's a column about 390 px wide.
3. Keyboard: scenes (arrows, Space, M), sheets and the wall work; map pins and scene hotspots don't take focus.
4. Nothing caps a toast's length or sends a long line to a card.
5. There's no message log.

Also short of the scope: "large" text is about 1.15×, by a size step inside the fixed screen, not 1.3× by reflow. Nobody has measured contrast, and the meters are bars coloured low.

**Evan's calls.**
- **No tabs.** The five tabs were written to replace v0.956's 28-tile hub, which the rebuild doesn't have, and they'd cut against walking up to people and things in scenes. The **Journal** replaces them: one button in the HUD for the message log, you as a climber, your people, and the record.
- **Landscape widens the world.** The screen stays 740 logical pixels tall and grows as wide as the window allows, so a landscape screen shows more of each scene rather than a phone column with panels beside it. Sheets become a side panel in landscape, so the scene stays in view.

**Slices.**
- **12.1 Text surfaces.** The Journal and its message log: the last 200 events in full. A line over about 30 words goes to a card you dismiss, never a toast, and the e2e opens the log. Criteria 4 and 5.
- **12.2 The wide screen.** The logical width follows the window, 360 at the least and capped around 16:9. Scenes show more of themselves and pad past their ends; the HUD, goal pill and hints lay out on the width; sheets dock to the right in landscape. Then the map, whose valley needs painting wider, and the wall, board and gym views, which are composed for portrait. The e2e plays at 360 × 740 and at 1280 × 800. Criterion 2. The biggest slice: about 1–2 weeks [INFERRED].
- **12.3 Keyboard and access.** Map pins and scene hotspots reachable by keyboard, Escape to close, visible focus; the e2e plays a day without the pointer. `npm run check` computes the kit's contrast against WCAG AA. Text at 1.3× by reflow. Meters that say low by shape as well as colour. Criterion 3 and the accessibility scope.
- **12.4 Tonight.** The rebuild has far fewer meters than v0.956: tonight's cost, runway, the next bill, injury risk and tomorrow's forecast, on the van at night.
- **12.5 The last inline styles**, and `check` fails on new ones. Criterion 1.

**Unreal.** On hold, by Evan's call, until the conversion to the new game is done. Spec changes are still logged, per CLAUDE.md.

**Status (29 Sep 2026): 12.1 to 12.5 built; closed by Evan's call.** Criteria 1, 4 and 5 are met; 2 and 3 are met for what the e2e plays, and the rest of their flows carry to playtesting, as does a real Steam Deck, tablet and screen reader. Where each criterion stands is at the end of this section. The marker moved to Phase 13.
- The sim already kept a log of the last 200 lines in the save (`LOG_MAX`), with nothing showing it. The Journal shows it: your body in the HUD, or the goal pill, opens it, on "You" (the old "you" sheet) or "Lately" (the log, by day, newest first).
- A line over 30 words (`TOAST_WORDS`) goes on a card, "Right" to put it down, that waits until nothing else is open, as the end of Act I's card already did. None of today's toasted lines is that long: the longest texts are Sage's beats, which are speech bubbles.
- The e2e opens the log on day two and watches every toast of the run, reloads included; it fails on one over 30 words.
- The Journal is the body pill rather than a new HUD button: a portrait HUD has about 55 px free, and "Journal" doesn't fit there. In landscape (12.2) it can get its own.
- What the log doesn't hold: people coming and going, what a thing in a scene says when you tap it, and refusals. Those are toasts only. Criterion 5 reads "events"; these aren't in the sim's log, and adding them there would be a sim change.

12.2, the wide screen:
- **The screen.** It stays 740 logical pixels tall and is as wide as the window's shape: 360 in portrait (unchanged), 555 on a tablet held upright, 987 at 4:3, 1184 on a Steam Deck or a 16:10 laptop. It stops at `W_MAX`, 1248: the Lot, the narrowest scene, at the scenes' zoom, so no scene shows past its ends (a test holds every scene to it). A 16:9 monitor gets a sliver of frame each side.
- **Scenes** show more of themselves: 911 world pixels of the Lot's 960 on a Steam Deck, against 277 in portrait. The far layers are painted wide enough for it. Skies are painted as wide as the widest screen with the portrait stretch in the middle, their glow at one pixel to one, and the sun, moon and stars drawn live, crisp at any size. The gym's back wall repeats its trusses, windows and lamps outward.
- **The map** is painted wider around the same valley: past the portrait map's edges the valley walls crest and fall away into ridged country, with no seam, and the highway runs on north. Pins, drives and taps are the valley's, in the middle. The wide map is painted only once a screen is wider than portrait, so phones don't pay for it.
- **Walls close up** stay composed for portrait. On a wider screen the wall is a comic panel down the middle, over the crag you looked up from, dimmed and without you in it. Repainting every wall wider would mean recomposing about a dozen hand-placed topos; the panel keeps them as they are. If it reads as a phone column on a Steam Deck, this is the part to revisit.
- **Panels.** From 1080 across (`WIDE`), sheets dock at the right under the HUD, clear of the valley and of a wall's panel, and the world stays in view. Below that, sheets, the climb panel and the climber screen keep a phone's proportions, centred. A wide HUD gives the Journal its own button.
- **Toasts** moved down 10 px: they sat 5 px over the body pill, and the plan chip 3 px. The e2e now checks every toast of the run against every live control, and fails on an overlap; at the old spot it found 26.
- **The e2e** plays a first morning at 1280 × 800 after the portrait run: the screen's width and docking, Hazel's bubble over her, the Journal's button, the map's card docked clear of the valley, the drive, the Warm Boulder's wall and climb panel, and turning the window to portrait and back mid-go.
- **Not covered in landscape yet:** the gym and the board, the plan, the send card, the diner and the night. They use the same sheets and scenes, so they should work, but the bot hasn't played them there. Nobody has played it on a real Steam Deck or tablet, and the wide map's paint time on slow hardware isn't measured.
- **Criterion 2** is met on what the e2e covers; the rest of it is the list above.

12.3, keyboard and access:
- **The keyboard reaches the canvas.** Each thing in a scene (on screen) and each pin on the map has an invisible, labelled button over it: Tab lands on it with a ring, Enter walks you over and uses it, and a screen reader says what it is ("Warm Boulder, V2, sent"). A pointer passes straight through to the canvas, so taps don't change. Things off screen get a button once you walk them into view with the arrow keys; Enter still uses whatever's nearest. The things in scenes gained names in the content for it.
- **Escape** puts down what's open, the most recent first: a conversation, a sheet with a close button, then the map. **Enter at the wall** brings its beta sheet back, as a tap does.
- **One focus ring** on every control, 3 px, from a kit colour.
- **Contrast.** `npm run check` computes every text-on-ground pairing in the kit against WCAG AA. The accent red was 3.9:1 on the paper and is now `#ce422a`, 4.6:1: the same red, a shade deeper. The check fails on the old one.
- **Text at 1.3×.** The larger setting was about 1.15×, a size step; it's now 1.3× for all panel text, and panels reflow to fit. The HUD's pills stay at their size: a portrait HUD has no room to grow.
- **Low by shape.** A meter running low, a load bar running hot and the pump bar get stripes as well as red, for every player rather than behind a colourblind switch. Sent tags on the rock already say SENT.
- **The e2e plays a day by keyboard alone**, at the larger text, in a browser of its own that fails on any pointer event: making a climber, walking to Hazel and talking, the journal and Escape, the map by M and a pin by Tab, the drive, a go on the Warm Boulder on the space bar, the drive home, lying around till dark, and bed. At each step it checks nothing runs off the screen or scrolls sideways.
- **Toasts on the map** go to the band between Roadside and Send City, which no pin crosses, when no sheet is open; lines held during a drive are said after you arrive, not over the map. The e2e's toast check now counts map pins as controls. A thing in a scene isn't counted: a sport line's tap area is the whole wall, no lane misses it, and a toast never takes a tap.
- **Fixed on the way:** the screen's `wide` class was set by hand and React dropped it whenever the screen's other classes changed (a setting, or now the map), so a wide screen could stop docking its sheets.
- **Not covered by keyboard in the e2e:** the gym, the board, the plan, the send card, naming a first ascent, and Settings. They're ordinary buttons, so Tab reaches them, but the bot hasn't played them that way. Nobody has tried it with a real screen reader.
- **Criterion 3** is met on what the keyboard day covers.

12.4, Tonight:
- At night the van says what bed will do: the spot (or the pullout, when the card won't take it) and the energy back by morning, a hungry night's cost, the week's bills and when, the morning's cash and its runway (or what the card still takes), how your body will read, days still off the rock, and tomorrow's sky.
- It's `tonight()` in the sim, from the numbers sleep uses; a test holds sleep to its prediction on an ordinary night, a bills night and a night in the pullout. Runway moved there from the harness, so the player and the harness read the same one, and the harness's targets are unchanged.
- v0.956's "Tonight" had about eight meters (fueling, teeth, sickness and more); the rebuild doesn't have those, so it's five lines. The e2e checks it on the first night: $41 in the morning, which is what sleep leaves.

12.5, no one-off inline styles:
- A component sets only custom properties inline (a meter's level, a band's place, a button's box over the canvas), through `ui/vars.ts`; styles.css does the styling. The pump bar, the verb bands, the go's reach, the bubble and the skill bars moved over. `npm run check` fails on any other inline style in the game's UI; the dev-only figure sheet doesn't ship and isn't checked.

**Where the criteria stand:**
1. No one-off inline styles: met, and checked.
2. Every flow in portrait and landscape: met for what the e2e plays in landscape (a first morning, the map, a go, turning the window); the gym, the board, the plan, the send card and the night aren't played there yet.
3. Keyboard reaches every control: met for what the keyboard day plays (a whole day, from the climber screen to bed); the gym, the board, the plan, the send card, naming a first ascent and Settings aren't played by keyboard yet. No real screen reader has been tried.
4. No long text in a timed toast, none over a control: met, and checked on every toast of every run. Scene things, whose tap areas can be a whole wall, aren't counted; toasts never take a tap.
5. The message log holds the last 200 events in full: met for the sim's events. People coming and going, what a thing says when tapped, and refusals are toasts only.

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

#### Phase 13 on the rebuild

*Planned 29 Sep 2026, with Evan's calls.*

**Where it starts.** The rebuild has no sound at all: v0.956's "Bitwise" and its effects didn't come across.

**Evan's calls.**
- **Effects and ambience are made in code** (Web Audio), like the art: no files, no licences, nothing to download, offline from the start. Where a synthesised sound falls flat, a CC0 recording can replace it, written into the licence ledger.
- **Music is parked.** Licensing a library is a maybe, not a decision; so is commissioning. Recorded music would also need the 250 KB budget, or music loaded outside the offline cache, rethought.
- **Effects and ambience can ship without music.**

**Slices.**
- **13.1 The engine and feedback.** One mixer: volume and vibration in Settings, silent while the app is hidden, started on the first tap or key. Every verb has a sound, and the big moments of a go buzz on phones that can.
- **13.2 Ambience** for every place, ducked under dialogue: the Lot's morning and night, each crag's wind and weather, the gym, the diner and the café.
- **13.3 The licence ledger and credits.** Every sound and where it came from; a check that nothing unlisted ships; a credits screen.
- **13.4 Music**, when Evan decides.

**Status (29 Sep 2026): 13.1 to 13.3 built; closed by Evan's call.** Criterion 4 carries with music (13.4), which is parked; criteria 1 and 2 are met in code and tests and still wait on someone listening. The marker moved to Phase 16 (Phases 14 and 15 now come after 18).
- `src/audio/`: `cues.ts` names what each thing sounds like, `sound.ts` makes it. 23 cues: around the valley (a tap, steps, a speech bubble, the map, the van, eating, money in and out, bed, resting, the dog) and on the wall (pulling on, each move, each clip, the crux, clearing it, each crux verb as your hands play it, a throw's rising charge and release, breath as the pump builds, the fall, the landing, the send).
- An act sounds like what it does to you, from its data, so a new act has a sound without anyone choosing one. A test holds every act and every crux verb to one.
- Settings: sound on, quiet or off; vibration on or off. The sound suspends while the app is hidden. The ambience bus already ducks under dialogue, ready for 13.2.
- The e2e hears 20 of the 23 cues over its five days and fails if any goes quiet. Paying, Scout, and a hold-to-load's charge and throw aren't in those days.
- `npm run dev`, then `/sounds.html`: every cue rendered, with a player, for listening. Not part of the build.
- **Nobody has listened to it in the game yet.** The e2e proves each sound plays, not that it sounds right; the levels were set by measurement (peaks between 12% and 43% of full scale under a 0.9 master). Evan's ear is criterion 1's real test. 2.5 KB of the budget.

13.2, ambience:
- Each place says what it sounds like, in its data (`ambience` in `PLACES`): wind, birds, the fire, the Gorge's creek, a room, voices, cups, a hawk over Moonstone. `audio/beds.ts` turns it by the hour and the sky: birds give way to crickets outdoors at night, the Lot's fire comes up after dark, and rain comes in by itself, muffled on the roof indoors. The map is a little wind. A test holds every place to a sound.
- `audio/ambience.ts` plays it: looped noise through filters for the steady layers, wandering so wind gusts and voices come and go, and the now-and-then things scattered over them, each through a gain at its layer's level. A new place crossfades in; the ambience ducks under dialogue.
- Levels by measurement: the beds sit between −29 and −46 dB RMS, well under the effects.
- **A bug in 13.1's effects, found here:** each sound's gain started at Web Audio's default of 1 until its envelope began, so a noise burst starting between two samples could let its first one through at full volume, a click of up to 0.8. Envelopes now start at zero; 200 crackles in a row peak at 0.12.
- The e2e plays the ambience of the six places its days go (the Lot, Roadside, the café, the diner, the gym, the map) and fails if one's missing. The Gorge and Moonstone are held by the unit test.

13.3, the licence ledger and credits:
- `app/src/audio/ledger.json` lists all 34 sounds (24 cues, 10 layers of ambience) and where each comes from: all of them code. A recording would be listed with its file, author, licence (CC0 or CC BY 4.0) and source. A test holds every cue and layer to an entry; `npm run check` fails on any audio file in the source or the build that the ledger doesn't list.
- Settings has **Credits**: the game, the art and sound made in code, any recordings from the ledger, music (not yet), and the fonts under the SIL OFL. The e2e opens it.

**Where the criteria stand:** 1 (every verb has a sound) and 2 (every place has ambience) are met in code and tests, and wait on Evan's ear. 3 (the ledger covers all audio) is met and checked. 4 (music ducks under dialogue and pauses when hidden) waits on music; the ambience already does both.

---

## Stage E — Make the full game worth paying for

*Phases 21–23 were added by Evan's call (29 Sep 2026) after a gap check found v0.956 systems no phase covered. They run first, before Phase 16, which needs them.*

### Phase 21 — The climber: gear, trad, training, and the crags past Act I

*Added 29 Sep 2026 by Evan's call, from a gap check of v0.956 against the rebuild and the phases left: none of this had a phase. Numbered 21 so older numbers don't move; it runs before Phase 16.*

**Goal.** Everything a climber needs past the first season: a rack and what wears it out, trad lines, training that isn't a free exploit, and the crags, walls and expeditions from V10 to the myths.

**Why.**
- **Phase 16 needs it.** Its 15–25 hour playthrough and The Line need crags past Act I; the rebuild stops at Moonstone and an open V12 project.
- **Trad is blocked on gear.** Roadside's and the Gorge's trad lines wait for a rack (R2).
- **v0.956 had it:** 9 crags and 78 lines to V18 and two myths, 52 gear items with wear, 16 training protocols, 4 multi-pitch walls and 3 expeditions (`docs/audit/climbing.md` §2.3, §2.11, §2.14; `economy.md` §2.5).

**Scope** (the audit's verdicts: keep, and fix the exploits):
- **21.1 Gear.** A rack you buy, carry and wear out, checked by category (the audit's P0 fix): shoes, chalk, pads, rope and draws, crack gloves and tape, a trad rack. Far fewer than v0.956's 52 items. A shop, resoles, the swap meet. It changes the save.
- **21.2 Trad.** A third discipline: protection you place or run out on the way up, in beta-then-send's terms. Roadside's and the Gorge's trad lines.
- **21.3 Training.** A hangboard in the van and protocols at the gym, through the load model; phases that lock for days, a taper with a cooldown, prehab. Fewer protocols than v0.956's 16.
- **21.4 The crags past Act I,** one per slice through "Adding a place": Sandstone Mesa, The Big Stone, Wind River Walls, The Crucible and its myths, Psicobloc Cove (deep-water solo), The Hollow, and The Cave. Lines at every grade to V18, with no V16 hole this time.
- **21.5 Walls and expeditions.** Multi-pitch walls with bivies; expeditions as weather-window decisions with the odds shown.
- **21.6 The rest of the rock:** crowds and spray beta, the speed wall, Free Solo mode (seeded, permadeath, chosen at the start), and highball calls where they're missing.

**Done when.**
1. A trad line can be led, with placements that change the fall.
2. Gear wears, and worn gear changes a go the player can see.
3. There are lines at every grade from V0 to V18, and the harness's bots reach V10+ without running out of things to try.
4. A wall and an expedition can each be climbed and failed.
5. Training can't be farmed: the harness finds no protocol that beats climbing at any grade.

**Depends on:** Phases 9–11 (on the rebuild). **Effort:** ~8–12 weeks [INFERRED]; 21.4's crags are most of it (a scene and a topo each). **Main risk:** content volume. Each crag goes through the checklist in `app/README.md`.

**Status (29 Sep 2026): 21.1 built.** Evan's calls: every climber starts with worn shoes and half a bag of chalk; a sport go still borrows the belayer's rope; the kit is sold at a new gear shop in town; wear shows on the You page and the beta sheet.
- **The kit** (`sim/content/gear.ts`, `sim/kit.ts`, numbers in `KIT`): shoes that wear by the go and the grade, chalk by the block, tape for cracks, and a second pad. The rack, the rope and the hangboard come with the slices that use them (21.2, 21.3, 21.5), so nothing is sold before it does anything.
- **What it does to a go:** worn shoes make every crux 5% tighter and blown ones 13%, twice that on technical lines, and an empty chalk bag 5% more. It goes through the same factor as your skills and the day, so the beta sheet's window bars show it. Tape takes half the skin a crack costs, pulling on included. A second pad halves a highball's landing, as Moonstone's haul does.
- **The gear shop** (a card-only place a block from the café, with its own front and ambience): a resole when the rubber needs it, new shoes, chalk, tape, a pad; on weekends the swap meet sells used shoes and pads at 55%. It went through "Adding a place", and the tests named each missing piece until it was done.
- **Save v5,** migrated from a real 0.961.0 save (v4): climbers already out here get the starting kit.
- **The bots** stop at the shop for a resole and chalk when they can afford it. Phase 6's four targets still pass; the runway medians fell a little (days 14–28: 2.0, 2.0, 2.6 days, from 2.3, 2.5, 3.4), which is the kit costing something.
- **The e2e** drives from the café to the shop on day five, buys chalk and reads the kit on the You page. Day three's taps and day four's plan don't move.
- **Not in yet:** the rope and the hangboard (their slices). The rack came with 21.2.

**Status (29 Sep 2026): 21.2 built.** Trad is a third discipline, and criterion 1 passes: a lead where you place two pieces falls 8 ft onto them, and the same fall with none decks from 22 ft (seen in the browser, and held in `trad.test.ts`).
- **Placing** (numbers in `TRAD`): a trad line has stances instead of bolts, marked on the wall. Let go at one and you place a piece in 1.1 s, which costs pump where hanging would pay it back (about 7 points a piece against resting). Climb through and you've run it out. The climb panel says when a stance is coming, and how far you are over your last piece.
- **Falling:** a fall catches on the last piece you placed, as a sport fall does on the last bolt. A fall longer than the air under you ends on the ground: a deck, with an injury roll from 6 ft up (3.6% a foot, three times a highball's, with no pad). v0.956 had no trad play at all, only a rack choice before the go.
- **The lines:** Trad Arête (5.12b, Roadside, up the wall's right edge) and Gorge Trad (5.13a, the Gorge's corner), v0.956's two, built from the beta library as its sport lines are. A trad go takes 35 minutes; a send adds a little head, as v0.956's +3 did.
- **The rack:** $280 at the gear shop (v0.956's price), or 55% at the weekend swap meet. Leading trad needs one and a belayer. No save change: the kit map already takes any item.
- **A piece going in** has its own sound, made in code like the rest (`place` in the ledger).
- **The e2e** checks the shop has a rack. It doesn't lead a trad line: that needs a rack and a belayer at once, which the five days don't reach.
- **Not in yet:** the bots don't buy a rack, so the harness plays no trad (its numbers match 21.1's exactly). Pieces never pull out, and there's no gear quality: every piece holds.

**Status (29 Sep 2026): 21.3 built.** Criterion 5 passes as a harness target: at every grade the bots reach (V0–V5 over 56 days), the best protocol for that day's skills, in build, teaches under an hour on the rock: 67% at V0, 27–44% from V1 up.
- **Six protocols and prehab** (`sim/content/training.ts`, numbers in `TRAIN`), from v0.956's sixteen: max hangs, repeaters, and pull-ups and core on a hangboard at the van ($60 at the gear shop [proposed]); campus (from V4), 4x4s and ARC laps at the gym on a day pass. Each trains two skills, costs time, energy, food and some skin, and loads your body like a go of its energy times its intensity, so it counts toward the injury warning and the fried block.
- **A session teaches** a lesson that grows with your grade (half a fall's), through hi() like a go. One session a day. None while you taper, hurt or fried: v0.956 allowed all three.
- **Phases** [proposed]: base (where everyone starts, no commitment), build (sessions ×1.25, risk ×1.2), peak (every crux 4% wider, sessions ×0.7, risk ×1.3), deload (sessions half, risk ×0.6, a fifth off acute load each night). A chosen phase holds for 6 days, and peak ends itself in a deload after 7. That closes v0.956's bedtime deload and permanent peak.
- **Taper:** 3 days of no training, every crux 3% wider and 6% on the last day, then 14 days before the next. **Prehab:** 30 minutes at the van, no gear, 40% less injury risk for 8 days; allowed hurt.
- **Where:** a Train row on the van and the gym desk opens the sheet: the block you're in, each session with what it'd teach you today, the phase, the taper. Every number on it comes from `TRAIN`.
- **Save v6,** migrated from a real Phase 21.2 save (v5): everyone starts in base, never tapered.
- **The e2e** drives home from the shop on day five, opens the train sheet and does prehab. **The harness** records each day's morning skills for the check; the bots don't train, so Phase 6's targets read as before.
- **Not in yet:** a rep minigame (v0.956 had four; sessions here are a choice, not a play), coaching, and visualise/footwork/falls work for head: head still comes only from the rock. Past V5 the check is untested: the bots don't get there.

**Status (29 Sep 2026): 21.4, first crag built: Sandstone Mesa.** One crag per slice, as planned; the other six (The Big Stone, Wind River Walls, The Crucible, Psicobloc Cove, The Hollow, The Cave) are to come, and criterion 3 waits on them.
- **The crag,** through "Adding a place": v0.956's eleven lines with its names and grades (from the v0.956 bundle at `e098332`). Seven boulders from V7 to the open V13, with The Prow a sandbag (V9, really V10); Desert Lap 5.13a, Desert Enduro 5.13b and The Big Link 5.13d bolted; the Desert Trad Line 5.13d on gear.
- **Access** as v0.956 had it: V7 to get in, no haul to pay for, three hours from the Lot ($20 of gas past Roadside), desert rock (every window ×0.92), weather of its own, and shut in summer for the heat.
- **Its picture:** a scene of red desert sandstone with black varnish, a pale caprock and huecos; a close-up wall with The Big Link's bulge and the trad line's crack; a boulder look; a pin west off the highway on a dirt road.
- **A belayer:** nobody's day brings anyone to the Mesa, so Sage now takes an invite there, as she does to the Gorge (bond 3, V7). Moonstone's spire has no such invite, and Dex doesn't belay, so its two bolted lines can't be led at all. That gap predates this slice; the fix is the same invite plus a condition on the haul being paid for.
- **The bots** drive to the Mesa once they climb V7, after Roadside and the Gorge. In 56 days they reach V5, so none gets there yet.
- **Found on the way, not fixed:** past day 45 the balanced bots go broke. Around V5, with Roadside done, they drive to the Gorge daily ($44 of gas against a $56 shift) and fail its projects; by day 56 they're ~$150 in debt, with 81 stuck nights across the runs. It was the same at 21.3. The 28-day targets never see it. It's the mid-grade squeeze criterion 3 is about, and needs a call: cheaper gas, better pay, or more V5–V7 lines closer in.

**Status (29 Sep 2026): the squeeze, fixed by Evan's call: better pay as you're promoted, and crew you can invite to any crag.** Both pull a piece forward from later phases (promotions from Phase 18, invites from Phase 17).
- **Promotions** (`sim/content/jobs.ts`, `sim/jobs.ts`) [proposed numbers]: the café has five ranks, New hire to Veteran, at 12, 30, 54 and 84 shifts (a double counts two), each +$4 a shift; setting has four, Apprentice to Head setter, at 6, 16 and 30 shifts, each needing a grade too (V3, V5, V7), +$7 a shift. The shift that promotes you pays the old rate; the raise starts with the next. The row says your rank and what the next takes; the pay on it is the rules' own number. v0.956 promoted every three shifts on attendance alone.
- **Invites:** "Come climbing?" to Hazel (at the Lot in the morning, or at the crag) or Sage, before 1 PM and once a day, opens a list of every crag they'd come to. Each crag names the bond it takes (`invite` on the place): Roadside an Acquaintance, the Gorge a Regular, the Mesa and Moonstone a Partner; your grade for it, dry rock, and Moonstone's haul paid. That also fixes Moonstone's spire, which nobody could belay.
- **The harness** now runs eight weeks by default, so the squeeze stays in view. Over 56 days: no stuck nights (81 before); balanced runway 2.3, 3.7, 3.7 and 4.7 days at days 7–28, still under a week; everything else as before. A worker who barely climbs banks about $1,000 by day 56, which is what working instead of climbing should buy, but it's where v0.956's "money stops mattering" starts; worth watching when Phase 22 adds costs.
- **Save v7,** migrated from a real Phase 21.4 save (v6): no shifts counted, so everyone starts at the first rank.

**Status (29 Sep 2026): 21.4, second crag built: The Big Stone.**
- **The crag,** through "Adding a place": v0.956's five single pitches, names and grades from its bundle. Base Camp Boulder V6, The Warm-Up Wall V9 (really V10), The Splitter Pitch V10 (a 22 ft highball); The Trad Pitch 5.13d on gear, up a corner; Valley Classic 5.14a, bolted, through a roof. Its three multi-pitch walls come with 21.5.
- **Access** as v0.956 had it: V8, a $600 trip paid once in cash (as Moonstone's is), four hours from the Lot ($22 of gas past Roadside), shaded, weather of its own. Asking a partner out here takes Ride-or-Die, the first crag at that bond [proposed].
- **Its picture:** a granite big wall with no top in sight, a corner and a roof, a green meadow and pines; a close-up face for its two roped lines; a boulder look; a pin north of where the highway leaves the valley.
- **The bots** don't go: they don't pay for trips. Nothing in the harness changes.
- **Seen on the way:** the wet-rock overlay after rain is a flat translucent box over the wall's whole span, sky edge and ground included. It's the same at every crag; a pass on it belongs with the art, not here.

**Status (29 Sep 2026): 21.4, third crag built: Wind River Walls.**
- **The crag,** through "Adding a place": v0.956's nine lines, names and grades from its bundle. Boulders: Alpine Crimps V9, The Diamond V11 (really V10), Offwidth Horror V12, Thin Air V13, and an open V15. Bolted: Glacier Point 5.13c, Skyline Traverse 5.14a, Astroman 5.14c; Alpine Trad 5.14b on gear.
- **Access** as v0.956 had it: V9, an $800 trip paid once and a $35 permit every trip, four hours from the Lot on past the Gorge's dirt road ($14 of gas from the Gorge), shaded, its own weather, snowed in all winter. Ride-or-Die to bring a partner.
- **Its picture:** alpine granite against a deep sky with snow on the ranges, a crack and a corner, snow lying near the top of the close-up; a boulder look by the lake; a pin on the Gorge's road where it climbs out of the valley.
- **The map is filling up at the top:** five crags now sit in its top 150 px. The labels are clear, but the next far crags need to go somewhere else, or the map needs a way to show "out of the valley" places.

**Status (29 Sep 2026): 21.4, fourth crag built: The Crucible, and the grades run to V18 with no hole.**
- **The crag,** through "Adding a place": v0.956's lines, names and grades from its bundle. Boulders: The Reckoning V13, The Vise V14, Apparition V15 (really V14), Event Horizon V17. Bolted: Crucible Crux 5.14b, The Lifeline 5.14d, Threshold 5.15d. And its two myths, V18 and 5.16a.
- **One line v0.956 didn't have:** The Anvil, V16 [proposed]. v0.956 had no V16 anywhere; now every grade V0 to V18 has a line (the gym to V5, the crags from V2), and `crags.test.ts` holds it.
- **Myths** (a new rule, v0.956's revealAfter): a myth can't be read until you've sent the hardest known line under it, Event Horizon for the boulder and Threshold for the route. Until then its tag is "?", the wall shows no line, its sheet says only what it'll take, and the rules refuse a go. Both are open: the first ascent is yours to name. Their crux names and lines are v0.956's move-by-move descriptions.
- **Access** as v0.956 had it: V11, no trip to pay for, four hours from the Lot ($26 of gas), shaded, weather of its own. Ride-or-Die to bring a partner. East out of the valley over the pass above Midtown: the top of the map was full, and the south end sits under the goal chip.
- **Its picture:** black gneiss folded into pale bands under a flat grey sky, frost on the ground; a close-up face with the Lifeline's seam; a boulder look.
- **Criterion 3's first half** (lines at every grade from V0 to V18) now holds. The second half, bots reaching V10+ without running out of things to try, doesn't yet: the bots don't pay for trips, and in 56 days they reach V5.

**Status (30 Sep 2026): 21.4, fifth crag built: Psicobloc Cove, and deep-water solo.**
- **The crag,** through "Adding a place": v0.956's eight deep-water lines, names and grades from its bundle: Tide Pool Traverse V2, The Plunge V3, Saltwater Slab V4, Barnacle Crimps V5, Leap of Faith V6 (really V7), Overhanging Tide V7, Psicobloc Arête V8, The Deep End V9, from 12 to 45 ft.
- **Deep-water solo** (a new rule, v0.956's dws): a boulder problem up a sea cliff. A fall drops you into the sea and you swim back to the shelf: no pads, no landing roll, and no strain roll either, as in v0.956. The lines are drawn up the cliff like a wall's, not as boulders, with no bolts.
- **Access** as v0.956 had it: V4, no fee, two hours from the Lot out past Old Town ($14 of gas from the Diner), weather of its own, and open in summer only: a place can now be closed for several seasons, not just one. A Regular will come out with you.
- **Its picture:** a pale limestone sea cliff with tufas and orange streaks, a rock shelf along its foot and the sea under it; a close-up face with each line as tall as it is, the traverse along the waterline; a pin on the coast past Old Town.
- **The bots** go there once they climb V4, after Roadside and the Gorge, when it's open. The 56-day harness doesn't reach summer, so its numbers don't change.
- **Not quite right yet:** the scene chalks every line to the top of the cliff, even the 12 ft traverse (the close-up is right). The sea sounds like the Gorge's creek: ambience has no surf yet.

**Status (30 Sep 2026): 21.4, sixth place built: The Cave, a second gym.** The Hollow waits for the quest that finds it (Evan's call): it comes with the quests.
- **The Cave** (v0.956's "steep bouldering cave, no ropes, just hard plastic"): eight problems a week, V3 to V10, mostly power and crimps as v0.956's were, set out steep walls in a dark room at the trailhead below Roadside. Its own day pass; power and fingers come a fifth faster there (v0.956's specialty), as technique and endurance do at Send City.
- **The gym, generalized:** "the gym" in the rules is now any indoor place (`INDOOR` in `sim/content/gym.ts`), each with its pass, specialty and closing time. The training sessions run at either gym.
- **Coaching** (v0.956's Cave job): four hours at $34, training head and technique, from V5 [proposed]; three ranks, Assistant coach to Head coach, at 8 and 20 shifts and V6 and V8, +$8 a shift each.
- **Its picture:** a room scene (the sign, the desk, steep charcoal panels leaning out further the deeper in, eight tapes), the gym's close-up in the Cave's colours, and a pin at the trailhead hamlet where the map had a placeholder.
- **The bots** climb there from V3 when it has something new. Over 56 days: all five targets still pass; the first V5 go comes a little sooner (day 18 from 19–20); climbing's skill an hour at V3–V5 rises (12.7, 10.0, 8.8 from 11.1, 9.1, 8.0), and training's share of it falls. They still end at V5.

**Status (30 Sep 2026): 21.5 built: walls and expeditions. Criterion 4 passes in the tests.**
- **Walls** (v0.956's four, pitch by pitch): The Long Prow at Roadside (4 pitches, 5.11d to 5.12b; v0.956's "The Prow", renamed since the Mesa's boulder took the name), and at The Big Stone Golden Buttress (5), Obsidian Tower (7) and The Ascendant (8, to V18's sport grade). Each pitch is an ordinary go, through beta-then-send, in order, on a rope of your own ($150 at the gear shop). A fall leaves you at the pitch; after dark you can bivy on the ledge (no van spot, less sleep, and you wake where you stopped); rapping off or driving away starts you from the bottom next time. The first summit pays a magazine's fee for the photos (from `WALL`: $140 for the Prow); later ones pay nothing.
- **Expeditions** (v0.956's three): El Capitan, Cerro Torre and Trango Tower, from the van at the Lot, V7/V10/V12 to go, paid in cash. Each day out there is one call: lead, dig deep, rest, or call it off; storm days (seeded) allow only rest or going home. The summit pays and trains your head; anything short pays nothing. **The odds are shown:** before you pay, and every day after, the summit's chance for leading every fair day and for digging deep every one, worked out exactly over every storm and fall (`summitOdds`). A V9 climber gets about 48% leading and 81% digging on El Cap; a V7 about 13% and 32%. v0.956's went about one time in twenty.
- **Criterion 4:** `walls.test.ts` climbs a wall to the top and fails one (a fall, a retreat, a drive away), and runs 300 seeded expeditions against the exact odds (within 0.08), with summits and failures both.
- **Its picture:** each wall's name and grade high on its crag's rock, tapped to open it; each pitch has its own line on the close-up. An expedition is a sheet over the Lot.
- **Save v8,** migrated from a real v7 save: on no wall, away on nothing.
- **Not quite right yet** (Phase 24 takes the first two): an expedition has no scene of its own (the Lot's sky shows behind a storm), and the HUD's energy isn't the expedition's. The bots don't climb walls or go on expeditions, so the harness says nothing about their pay. Over 56 days the harness is unchanged: all five targets pass with the same numbers as the Cave (the rope costs them nothing because they never buy one).

**Status (30 Sep 2026): 21.6, first part built: crowds and spray beta.** 21.6 goes in four parts, as 21.4 did: crowds, the speed wall, Free Solo, then the highball calls still missing.
- **Crowds** (v0.956's, built from its model): each crag draws a crowd from how popular it is (Roadside and The Big Stone most, The Crucible least), ×1.7 at the weekend (v0.956's), by the hour (nobody at dawn or after dark, the most from late morning), by the sky (a prime day brings everyone out, heat keeps them home, wet rock empties it) and the day's seeded luck: empty, quiet, busy or packed. Roadside at noon is busy about a quarter of weekdays and packed on about a fifth of weekends; it's never packed on a weekday.
- **What a crowd does to you,** two things you can see and plan around, rather than v0.956's small odds terms: a **queue** (busy, 10 min in line for a rope; packed, 20 for a rope and 10 for a boulder; walls' pitches are above it), in the go's cost; and **beta**. At a busy or packed crag you can ask around (15 min) for a line's next beta, which makes a first-go send a flash, not an onsight. When it's packed, about two first goes in five get the beta shouted at them anyway, and the onsight goes with it: v0.956's "spray beta".
- **Where you see it:** the place card says who's out when you'd get there, before the drive; the beta sheet says what the queue is for that line and offers "Ask around"; strangers stand and sit at the foot of the lines, one when it's quiet, three when busy, five when packed.
- **The harness** (56 days): all five targets still pass. The queue costs the bots time: climbing's skill an hour falls about 8% at V0–V2 (V2 11.65 from 12.73) and little higher up. The first V5 go stays at day 18–18.5, and some runs now see V6. Injuries move within noise (warmed-up 3% from 2%, reckless 3% from 6%): the rolls land on different days.
- **Not yet:** crowds on the map's pins (Phase 10's crowd markers); send trains and crowd lines that quote your record (v0.956's) wait for Phase 17's people. The bots never ask around.

**Status (30 Sep 2026): 21.6, highball calls: every outdoor boulder from 16 ft up is a highball (Evan's call).**
- **By height, not by hand.** Phase 10.3b flagged five boulders by hand, and the crags 21.4 brought had problems as tall with no flag: a fall from 18 ft on The Wind River project cost nothing, while the same fall off Roadside's Highball Arête could jam an ankle. Now `isHighball` sets the flag from the height (`HIGHBALL.fromFt`, 16 ft) on every outdoor boulder except deep-water solos, and the content test holds it there, so a new crag's tall problems can't slip through.
- **Twelve more:** Crimp Cathedral (the Gorge), Moonstone Mantel and Hueco Pockets, The Prow, Desert Splitter and The Mesa project, The Warm-Up Wall (The Big Stone), Offwidth Horror and The Wind River project, The Vise, Event Horizon and the Crucible myth. Seventeen in all.
- **What they cost:** their cruxes sit 9–12 ft up, so a crux fall with one pad and nobody spotting lands badly 1–5% of the time (the Crucible myth 0.8%, Moonstone Mantel 4.6%), against 6–10% on the five tall ones. Pads and a spotter halve it each, as before, and the beta sheet shows it.
- **The Gorge now wants a spotter** as well as a belayer, and its place card says so. No crag is left with ropes and no highballs, so the "boulders only" line has nothing to say for now.
- **The harness** (56 days) reads the same as after crowds, to the decimal: every new highball is V7 or harder (Moonstone Mantel is the easiest), past the V5 the bots reach, so nothing they do changes. Their 1–5% crux landings are all under the careful bots' 1-in-20 line anyway.

**Status (30 Sep 2026): 21.6 built: the speed wall and Free Solo. 21.6 is done; Phase 21 waits on criterion 3.**
- **The speed wall** (v0.956's, at Send City, past the board): two grey lanes taller than the room, the same 20 red holds up each, a buzzer at the top. A run is three lights a second apart, go on the third, then a hand at a time: two buttons, or F and J. The same hand twice is a slip (a third of a second lost); a grab before the green is a false start. Your time is the seconds you took times a factor from your power and technique (2.8 at V0, 0.1 less a grade, never under 1.45), so a quick thumb and a strong climber both show. A PB is kept.
- **Not v0.956's exploit** (the audit's 20: free, no time, +1 power a run): a run needs the day pass, takes 10 minutes and a short go's energy and skin, loads you, and teaches power and technique on a training session's scale for the first three a day, false starts included, then nothing. The harness's "can't be farmed" target now includes it, at a fresh run's rate for a whole hour, and it stays under climbing at every grade.
- **Free Solo** [proposed] (v0.956's mode): a switch on the first screen, off by default and for good once you start, with what it means said beside it. Every outdoor sport line and wall pitch is climbed without a rope: no belayer, no rope for a wall, every crux window ×0.82 (v0.956's ×0.72 was against its dice), and a send teaches the head +2. Trad keeps its rack and boulders their pads. The beta sheet says so on every soloed line.
- **A fall ends it:** "Free Solo, over", with where, when and what you'd sent, and a new climber as the only way on. **Save-scumming can't undo it** (the audit's S7): the save knows you're on a solo from the moment you pull on, and a game that closes mid-solo opens on the fall.
- **Save v9,** migrated from a real v8 save: no runs, on a rope, alive.
- **Not yet:** the bots don't race or solo, so the harness says nothing about Free Solo's survival odds; the speed wall's comps (v0.956's) wait for Phase 18's comps; the run has no sound of its own beyond the game's taps.

**21.6 against the Done-when:** criteria 1 (trad), 2 (gear wear), 4 (walls and expeditions) and 5 (training can't be farmed, speed wall included) pass. Criterion 3's first half passes (lines at every grade V0–V18); its second half, the bots reaching V10+, is open: over 56 days they reach V5, and they don't pay for trips. Phase 21 stays the CURRENT MILESTONE until that's met or ruled on.

**Status (30 Sep 2026): the career bot, for criterion 3. Its first half passes; its second passes except on about one wet day a run. Evan's call.**
- **Why the season bots stop at V5:** they play 56 days, climb at six places, never pay for a trip, only work café shifts, and never ask anyone along. Left to run 200 days they reach V9 and run out of things to try from about day 100.
- **The career bot** (`strategy: 'career'` in `sim/bot.ts`; the season's three are unchanged, and so are their numbers):
  - takes the best-paying job it can get, by the hour, travel included: café shifts, doubles when it's short, coaching from V5, setting;
  - saves for the next trip its grade has opened, and buys it (Moonstone around day 70, The Big Stone around 120, Wind River around 160);
  - asks Hazel along, through her talk as a player would, to any crag the bond allows, before a working morning too;
  - picks the day's crag by the hardest line it can get on there, less a little for the drive (and for the gas, when it's short);
  - goes to every crag and both gyms.
- **The career harness** (`harness/career.harness.ts`, in `npm run harness`; 4 seeds × 4 starts × 224 days, human-ish hands, 30 s): every run reaches V10, median day 200 (194–214 by start); no refusals, no stuck nights; about 30 days a run the body says rest.
- **What still fails:** 9 of 16 runs hit a day (one, twice in one run) with nothing new to try before V10. Every one is the same day: the valley's wet, the climber's V7–V10, and every indoor problem is sent (the board tops out at V7, The Cave at V10, both weekly). It's content, not the bot. Two ways to close it: (a) rule the criterion met at this level, or (b) give the rain something past V9 indoors, such as v0.956's third gym, the Training Center (14 routes a week, never planned here), or harder sets at The Cave.
- **A finding about pace, not the criterion:** V10 on day ~200 against v0.956's typical player on day 80 (`docs/audit/climbing.md` §5.2). The first month is on Phase 6's targets; after it, work eats most mornings (the career bot works about 195 days in 224) and skill gains flatten with hi(). Whether that's the game's pace or too slow is a balance call for Evan, and Phase 22's economy will move it either way.

**Status (30 Sep 2026): Phase 21 closed by Evan's call, once the wet-day gap was closed. Every criterion passes.**
- **The gap, closed with content:**
  - **The Cave** sets V5 to V12 now, not v0.956's V3 to V10. The bots climb there from V5.
  - **The Training Center** is v0.956's third gym, where the comp team trains. It sets eight comp-style problems a week, V7 to V14: dynos most (run-and-jumps, double clutches, a lache), then slabs on volumes and compression, and a crimp line now and then. It has its own $20 pass [proposed], brings on power and technique a fifth faster, and wants V7 to get past the desk, like the Mesa. It sits on a Midtown side street west of the highway.
  - **Its picture** is a white comp hall under skylights, with big coloured volumes, neon tape, and a comp clock over the desk. The close-up wall is in its colours (gym close-ups now take their look by place).
- **Criterion 3, on the career harness** (4 seeds × 4 starts × 224 days): every run reaches V10, median day 162 (from 200); no run has a day with nothing new to try; no refusals, no stuck nights.
- **The season harness** (56 days) passes all five targets. With The Cave from V5, the V3–V4 bots climb elsewhere: climbing's skill an hour at V3 is 10.6 (from 12.4) and V4 8.9 (from 9.6); first-month injuries are 6% warmed-up and 8% reckless (from 3% and 3%), under the 35% ceiling; the first V5 go comes on day 18.5–19; no run ever has nothing new to try.
- **Carried forward:** the pace against v0.956's (V10 by about day 160 against its 80) goes to Phase 22's economy. Crowds on the map's pins, send trains, the bots' own races, solos and expeditions, Phase 24's trips, and The Hollow with the quests.

---

### Phase 22 — The life: the van, the body, food, the hustle, and the games

*Added 29 Sep 2026 by Evan's call, with Phase 21. Runs after it, before Phase 16.*

**Goal.** The survival layer under the climbing, as deep as v0.956's and without its busywork: every day still a trade between earning and climbing.

**Scope.**
- **The van:** fuel, parts that wear, breakdowns, upgrades and build-outs, parking spots, tickets.
- **The body, deeper:** treatments and insurance plans, old injuries (scars and marks merged), fear; sickness, teeth and the like merged into one supplies gauge that Tonight shows; psyche.
- **Food:** groceries, recipes and a cooking beat, fishing, with diminishing returns so food isn't a skill farm.
- **The hustle:** cans, dumpster runs, foraging, and busking (v0.956's music hobby, as a way to earn).
- **Events:** knocks on the van, walk-out epics, roadside stops, night events.
- **Scout's life:** perks, aging, the vet, the end.
- **Dreams:** the Dream Rig, the War Chest, Home Base.
- **The games, back by Evan's call:** blackjack, Texas hold'em, liar's dice and horseshoes at the fire and in town; maybe trivia; maybe a garden, with visits to the folks' farm. The audit cut them because all six paid the same reward (psyche, bond, rep), took no time and had no daily cap, so they farmed bond for free (`docs/audit/social.md` §2.9, §439). They come back on three terms: each takes time, each is capped by the day, and each pays something the others don't (poker keeps its reads on people). Blackjack and hold'em are simulated gambling for store ratings: the Play listing's content rating is updated before they ship.
- **Phase 6's leftovers:** weekly shift schedules, the autopilot shift, lifestyle tiers, winter prep.

**Done when.**
1. A season's runway still holds Phase 6's targets with the van's costs in.
2. No game, meal or hustle is a farm: the harness finds none that out-earns or out-bonds its time. *Busking is the exception, by Evan's call (30 Sep 2026): it pays under every job at first and over every job an hour after hundreds of sets. One set a day keeps a day's busking under a day's shift.*
3. Every event and game has a sound and an e2e step.

**Depends on:** Phase 21 (the van carries the rack). **Effort:** ~8–12 weeks [INFERRED].

**Plan on the rebuild (30 Sep 2026) [proposed].** Written from the audit (`docs/audit/core-loop.md` §2.2–2.8, §5.1–5.7, §8; `economy.md` §2.4–2.5, §8; `social.md` §2.6–2.9, §5, §8) against what the rebuild has: the van spot, weekly bills, gas by the drive, the card limit, three jobs with ranks, energy, skin, fed, load, injuries in three tiers, ramen and the diner, Scout, and the Tonight panel. There's no event system yet.

*The principles, from the audit's verdicts:*
- **Survival pressure that changes, not disappears.** v0.956's money stopped mattering after about day 15 (`economy.md` §1.1). Here every new cost is a choice with a visible trade: where to sleep, what to eat, whether to fix the van now.
- **No farms.** Everything takes time, is capped by the day, and pays through the same curves as climbing (`hi()`) or as a day's buff, never flat skill. The harness holds each one under an hour on the rock and under a shift's pay.
- **One night.** Every way a night passes (the van, a ledge, an expedition, a motel if one comes) goes through `sleep()`, so nothing skips the bills (v0.956's motel bug).
- **Tonight shows it.** Each new meter appears in the Tonight panel with its number and its fix; no hidden meters.
- **Seeded, and written.** Events come off one seeded deck. At most one a day. The vignettes keep v0.956's voice (the audit's keep list), and a bad outcome never pays more than a good one.

*The slices, in order.* Each goes through the harness, the e2e and a save migration where it changes the state.

- **22.1 The week and the money.**
  - Each job posts 3–4 shifts a week that you sign up for, so the week is planned around the weather (`economy.md` §8 #15). A signed-up no-show costs a warning, and three cost the job.
  - Jobs differ (Decision 1, Evan's call): some pay more an hour and some less, some take longer shifts and some shorter. Every job starts on low pay, and promotion is how you earn more.
  - Lifestyle tiers you choose replace v0.956's hidden grade multiplier: dirtbag, comfortable, plush. Each has its nightly cost, sleep and supplies.
  - The autopilot shift is moot here: shifts are already one tap.
- **22.2 The van.**
  - **Parts wear by the mile and the night:** three parts, not v0.956's six (tires, engine, battery [proposed]). A worn part raises the breakdown odds on a drive.
  - **Breakdowns** are written vignettes with v0.956's ways out: a tow, a spare, a bodge, limping home, or a friend.
  - **Repairs** happen at a garage in Midtown.
  - **Where you sleep** is a nightly choice:
    - the Lot ($18, and tickets in cash after too many nights in a row);
    - the Upper Trailhead (free, cold, far);
    - the truck stop (a shower, and a bad night);
    - a friend's driveway (bond, and a cooldown);
    - the Ridge (standing).
  - **Upgrades:** a bed, a camp kitchen, curtains, a tool kit, a tune-up, and a heater that burns propane every winter night. There's no passive income: v0.956's solar and power station paid the whole nut (`core-loop.md` §5.1).
  - **Winter** is a season you prepare for: the heater's fuel, insulation, a winter-kit goal.
- **22.3 Food.**
  - A pantry you stock at a Midtown market.
  - Recipes cooked at the van with the camp kitchen, as a short cooking beat. They give food and a day's buff (wider windows for the day), not v0.956's flat skill, which was a farm to V18 (`climbing.md` §5.3).
  - Variety matters: four of the same meal in a row raise sickness odds, and Tonight says so.
  - The lake (the map's dimmed pin) opens: fishing, food not cash, seeded catches by season and hour; a swim; water.
  - Coffee gets a crash after two a day.
  - Starving eats the pantry first.
- **22.4 The body, deeper.**
  - Insurance plans (none, catastrophic, full) replace the flat weekly premium.
  - A clinic: urgent care, physio (days off an injury, two hours, once a day), and cortisone (fast, at a risk).
  - Old injuries: v0.956's scars and marks, merged (`core-loop.md` §8 CUT 3). A tier-2+ injury can leave one: more risk in its style, and a flare that physio settles, felt only when you climb that style, so it isn't a chore.
  - Fear: after a deck, a bad landing or a tier-3 injury, that style's windows are tighter until you send one; the beta sheet says so.
  - One supplies gauge, merging water, propane and hygiene (`core-loop.md` §8 CUT 1). Refilled at the gas station, the gym's shower or the lake.
  - Sickness: a seeded nightly chance from winter, supplies, hunger and a same-meal diet; it takes teeth in with it.
  - Psyche (Decision 2, kept): a slow mood that variety and company raise (a new crag, a send, a night with people) and grind lowers (the same gym, shift after shift). It moves the windows a little, and no single ritual fixes it. Tonight shows it.
- **22.5 The hustle.** Cans, dumpster runs and foraging keep v0.956's thematic safety net. The game teaches it the first time you're hungry and broke. Busking in Old Town is a timing beat that pays by the crowd there (21.6's crowds), capped by the day, with lines of its own, not "Solid set." None out-earns a shift an hour.
- **22.6 Events.**
  - One seeded deck, at most one encounter a day.
  - Knocks on the van at night (by where you're parked); roadside stops and hitchhikers on drives (a hitchhiker remembers what you did, and may be the friend at your next breakdown); walk-out epics on late crag days (headlamp, weather, energy).
  - v0.956's Gen-1 one-liners stay cut (`social.md` §8 #11).
  - Each has a sound and an e2e step (criterion 3).
- **22.7 Scout's life.**
  - Perks at bond: settles at the fire; finds food overnight; watches the van, halving tickets. v0.956's bug let any dog block every ticket.
  - Aging in dog-years, vet scares with bills, and the end: v0.956's full lifecycle to his death and a farewell (Decision 3, kept).
  - No new stray for a month after.
- **22.8 Dreams.**
  - A protected savings pot the broke check counts.
  - The Dream Rig: van life halved, the upgrades done.
  - The War Chest: expeditions halved, ready for Phase 24.
  - Home Base: a cabin at the Lot, no van spot, a kitchen. It says exactly what it stops charging, unlike v0.956's "ever".
- **22.9 The games, by Evan's call.**
  - At the fire, with the people there: hold'em, blackjack, liar's dice, horseshoes. Each takes an hour or two and once a night, and pays something of its own:
    - hold'em keeps reads on each person, and what they know;
    - blackjack is money, with a buy-in cap;
    - liar's dice and horseshoes are bond with whoever's playing, at most once a night each.
  - Trivia becomes the glossary. The garden and farm visits are cut from Phase 22 (Decision 4), and their plan is kept for later: see "Saved for later" below.
  - Blackjack and hold'em are simulated gambling: the Play listing's content rating changes before they ship, and that's Evan's step in the Play Console.

*The decisions, as Evan called them (30 Sep 2026):*
1. **Pace and pay:** jobs differ in pay and in hours. Starting jobs pay less, and promotion is required to earn more. There is no pace target for the harness; it reports each job's pay an hour at each rank instead.
2. **Psyche:** kept, as a slow mood (22.4).
3. **Scout's end:** kept, v0.956's full lifecycle (22.7).
4. **The garden and the farm:** cut from Phase 22, with the plan saved for later.
5. **Van parts:** three (tires, engine, battery).

*Saved for later: the garden and the farm* (from v0.956, `core-loop.md` §2.6, `social.md` §2.5). The folks' farm, a drive out of the valley: a visit takes the day, helps with the chores for a little money, and brings home produce; the garden there has beds you plant and harvest on their own clocks. The audit's problem to solve first: eight hours for food dearer than the diner. It comes back when it pays in something the diner can't: family, a place to rest, seasons you can see.

**Status (30 Sep 2026): 22.1 built: the week and the money.** Save v10, 0.964.0.
- **Four jobs, posted by the week.** The café posts every day (it's the job that's always there); coaching and setting post 4 days a week, and the new Warehouse [proposed] 3, on days seeded by job and week. Tap the clock (or "Your week" in the van) for the schedule.
- **Sign-up.** You sign up for a posted shift from tomorrow up to 7 days ahead, one a day. Only signed-up shifts count toward promotion; today's are walk-ins, which pay the same and count nothing. A signed-up shift you don't work is a warning, and the third costs the job: back to its first rank, and off its schedule for 7 days.
- **Pay by rank** (Decision 1; the career harness prints this table now):

  | Job | Shift | Start | Top |
  |---|---|---|---|
  | Café | 3 h | $28 ($9.33/h) | $48 ($16.00/h) |
  | Coaching | 4 h | $34 ($8.50/h) | $68 ($17.00/h) |
  | Setting | 4 h | $28 ($7.00/h) | $58 ($14.50/h), and it trains |
  | Warehouse | 8 h | $52 ($6.50/h) | $103 ($12.88/h) |

  The café's raise came down from $7 to $5 after the first harness run: at $7 its top rank out-earned every job an hour.
- **How you live:** dirtbag (free), comfortable ($12 a night, +8 energy, +4 skin by morning), plush ($28, +15, +8) [proposed]. It's paid at the van after the spot, and only while the card covers it. Tonight shows it. Supplies join it in 22.4.
- **The bots** sign up for tomorrow when they'll be short in the morning. The harness passes every season target: balanced runway 2.3, 3.5, 3.6 and 4.5 days at days 7–28, no stuck nights. The career bots reach V10 in every run (median day 161) with no warnings.
- **A finding for Evan:** the career bots still spend their whole career at the café, to Veteran. They choose by today's pay an hour, and an assistant coach ($8.50/h) earns less than a café regular ($11.00/h), so they never start the coaching ladder. A player who looks ahead would. Whether a starting coach should pay more, or the bots should plan a ladder, is open.
- **Carried:** warnings never expire [proposed]. Nothing cancels your shifts when you leave on an expedition; each missed one is a warning. The page size is 243.6 of 250 KB.

**Evan's call on the jobs (30 Sep 2026), after 22.1:**
- A job that pays less an hour pays in something else: coaching your head, setting your technique, and now the warehouse your endurance (+2 a shift).
- The café pays least a shift ($28), and its shifts are the shortest (3 h). Cutting it to $25 left the harness's balanced bots stuck in their eighth week, so setting went from $28 to $30 instead.
- The Diner is a fifth job: 4 h at $30 plus $4–10 in tips (half again on a weekend), 5 shifts a week, ranks Busser to Floor manager. That's a little more a shift than the café, for a longer one.
- The career bots still choose by pay alone, so they stay at the café. The skill bonuses are for a player who wants them; the bots don't value them yet.

**Status (30 Sep 2026): 22.2a built: the van's parts, breakdowns and the garage.** Save v11, 0.965.0. 22.2 goes in three parts: 22.2a parts and breakdowns, 22.2b where you sleep, 22.2c upgrades and winter.
- **Three parts:** tires, engine and battery, 0 to 100. Tires and the engine wear by the minute driven, and the battery by the night. A flat battery gets a jump across town but not out of it, and a road part under 15 won't leave town either, except home or to the garage. Town is always in reach, so a broke climber can always get to a shift: the career harness found a bot stuck at the Lot with a flat battery and no money when the jump only reached the garage.
- **Breakdowns** happen only on drives of 20 minutes or more. The odds go with the square of the worst road part's wear, so a van you keep up never breaks down (v0.956's broke down on 17% of crag days even fresh). Roadside and back is about 0.6% with a part at 85, 7% at 50 and 18% at 20. It happens halfway, with a sound, and the drive stops there.
- **Ways out:**
  - a tow to the garage ($70, 1 h 30);
  - a bodge (1 h; it holds 3 times in 5, one try);
  - limping on (double time, −15 energy, and the part stays shot);
  - calling a friend (a partner at tier 2 or more: 2 h, and the part good for a while).
- **The garage** (Dale's, on the edge of Midtown) puts a part back to new for its price by wear: tires $140, engine $180, battery $90 from dead, never under $15.
- **Tuning found by the harness:** the first wear rates (0.06 and 0.04 a minute) cost a daily Roadside commuter about $25 a day. The balanced bots went broke by week two, with 194 stuck nights. At a quarter of that (about $5 a day), and with the bots bodging before they limp and saving for a worn part the way they save for the bills, every target passes again: balanced runway 2.3, 3.5, 3.3 and 3.8 days at days 7–28 with no stuck nights, and the career bots at V10 by day 162.5 with no refusals. That's Phase 22's criterion 1, so far.
- **E2e:** a save broken down on the road comes back to the breakdown, can't be closed without a way out, tows to the garage and gets new tires.
- **Carried:**
  - The climber bot (works only when it's nearly broke) has 5 stuck nights in 56 days, where it had none; a breakdown catches it with nothing saved.
  - The e2e loads a broken-down save rather than driving into a breakdown; the sim's tests cover the drive.
  - The page size is 246.9 of 250 KB, and 22.2b will need room: the budget is close.

**Status (30 Sep 2026): 22.2b built: where you sleep.** Save v12, 0.966.0.
- **Where you park** is a choice on the week sheet that stays until you change it. The night settles it, and Tonight shows it: the spot, the energy and the ticket odds. You wake at the Lot whichever you pick, with the drive back taken off the morning [proposed, all of it]:
  - **The Lot:** $18. From the fourth night in a row, a ticket: 5% a night, rising 5% a night to 25%, $25 each. v0.956 went to 40% with a boot at three.
  - **The Upper Trailhead:** free, $6 of gas and 25 minutes each way. −10 energy, −20 in winter.
  - **The truck stop:** $6 and $2 of gas, −12 energy.
  - **A friend's driveway:** a partner (tier 3), once every 4 nights. $2 of gas, +5 energy.
  - **The Ridge:** once you've made 25 trips out ("standing", until Phase 18 has some). $8 of gas and 40 minutes, +5 energy, −15 in winter.
- **A spot that won't have you tonight** falls back to the Lot, and says so. A card that won't cover it is the pullout, as before.
- **Bots** use a driveway when they can, the trailhead once the Lot's ticket odds start, and the Lot otherwise. Every harness target passes: balanced runway 3.2, 3.3, 3.4 and 4.0 days at days 7–28, no stuck nights; the career bots at V10 by day 160.
- **E2e:** the week sheet lists the spots, with the Lot chosen and the Ridge locked on day two.
- **Carried:** the page was 248.5 of 250 KB. Evan raised the budget to 300 KB for the rest of Phase 22.

**Status (30 Sep 2026): 22.2c built: upgrades and winter. 22.2 is done.** 0.967.0. No save change: every upgrade is a thing you own (`content/gear.ts`).
- **Dale fits six upgrades** at the garage, each once and for good [proposed numbers]:

  | Upgrade | Price | Effect |
  |---|---|---|
  | A real bed | $70 | +5 energy every van night |
  | Blackout curtains | $60 | 70% fewer tickets at the Lot |
  | A tool kit | $85 | A bodge holds 9 times in 10 |
  | A tune-up | $90 | 20% less gas |
  | A diesel heater | $45 (was $150) | No cold on a winter night, a tank of propane a night |
  | Insulation | $60 | Half the cold |

  None of them earns. The camp kitchen waits for 22.3's recipes.
- **Winter** (days 15–28 of every 56: the game starts in fall) takes 10 energy off every van night, on top of the Trailhead's and the Ridge's own chill, unless the heater's lit.
  - Propane is $18 a tank at the gear shop, 10 nights to a tank.
  - Five days before winter, a line says it's coming and where the fixes are.
  - Tonight shows the cold, or the heater burning.
- **The bots** buy upgrades with money past their cushion, the winter ones first, and keep propane in winter. A bot bug the harness found: they chose repairs before paying for any, so a forced tire job was followed by an engine service they could no longer afford.
- **Harness:** every target passes. Balanced runway 3.2, 3.3, 3.3 and 4.0 days, no stuck nights; the career bots at V10 by day 157.5; the first V5 go by day 19.5. That's Phase 22's criterion 1 with the whole van in.
- **Size:** 249.7 of 300 KB.
- **Carried:**
  - Winter falls in the first month, so a new climber meets it before they can afford a heater. That's the pressure the plan asked for, but it's worth a play.
  - v0.956's build-outs from scavenged materials aren't in; they want 22.5's hustle.
- **Evan's call (30 Sep 2026): a heater a player can afford before the first winter.** The season bots hold a median $83 on days 10–14 (balanced; $58 at the 25th percentile), so the heater went from $150 to $45. With a first tank ($18) that's $63. Every balanced bot and 47 of 48 climber bots now have one by day 16.
  - The bots buy it first, before winter, once no part needs the garage.
  - They no longer max the card on an urgent repair: a van that can't leave town still reaches a shift and the gym.
  - Every harness target passes. 0.967.1.

**Status (30 Sep 2026): 22.3a built: the pantry and the kitchen.** Save v13, 0.968.0. 22.3 goes in two parts: the pantry and the kitchen, then the lake.
- **The Market** is a new place in Midtown, across from the café. It sells eight ingredients in 4-serving packs at about $1–1.50 a serving [proposed].
- **A camp kitchen** ($80, from Dale) cooks four recipes at the van from the pantry:
  - oatmeal: +30 food, +4 energy;
  - rice and beans: +45 food;
  - breakfast burritos: +50 food, and fuels you;
  - pasta and greens: +45 food, +3 skin, and fuels you.

  **Fueled** means every window is 5% wider for the rest of the day: a day's edge, never a skill. v0.956's recipes gave flat skill, a farm to V18. Ramen needs no kitchen.
- **Variety:** the last four meals are remembered (ramen and the special too), and Tonight says when they've all been the same. The sickness it feeds is 22.4's.
- **Coffee:** past two cups a day, a cup costs 6 energy instead of giving it.
- **A hungry bedtime** eats up to two servings from the pantry, cold, first.
- **The bots** fit the kitchen after the heater, shop when the pantry's low, and cook the best meal they can. The career bots all fit one and cook 169 meals in 112 days, 153 of them fueling, and still reach V10 on the same day (161). The buff is no farm (Phase 22's criterion 2, for meals). Every harness target passes.
- **E2e:** the van sheet shows the pantry.
- **Carried:**
  - The cooking beat, a short minigame over the stove, isn't in: cooking is a tap.
  - The lake (fishing, a swim, water) is 22.3b.
  - The page is 251.6 of 300 KB.

**Status (30 Sep 2026): 22.3b built: the lake. 22.3 is done, but for the cooking beat.** 0.969.0. No save change.
- **The Lake**, the map's dimmed pin since R1, opens: a card-only place west of the Lot, down a dirt track past the creek.
- **Fishing:** two hours, once a day, and food, not cash [proposed].
  - Up to three trout, each +15 food, cooked on the shore.
  - Each fish's chance goes by season (half in summer and fall, 15% in winter) and by the hour: half again before 9 and from 5.
  - The catch is rolled when you cast, seeded by the day and the minute, so a reload can't reroll it.
  - At best it's a diner meal for two hours: no hustle out-earns a shift (Phase 22's criterion 2, tested).
- **A swim:** 45 minutes, +8 energy, once a day, not in winter.
- **Carried:**
  - Water at the lake waits for 22.4's supplies gauge.
  - The bots don't fish.
  - There's no e2e step at the lake: fishing and the swim are acts on a card, as at the diner.

**Status (30 Sep 2026): 22.4a built: insurance plans and the clinic.** Save v14, 0.970.0. 22.4 goes in four parts: insurance and the clinic; old injuries and fear; the supplies gauge and sickness; psyche.
- **Insurance** is a choice on the week sheet, paid with the week's bills. It replaces the flat $25 premium [proposed numbers]:

  | Plan | A week | A bad injury's bill |
  |---|---|---|
  | None | $0 | Double: $90, or $420 for the worst |
  | Catastrophic | $25 | $45, or $210: the plan everyone had, and new and migrated climbers are on it |
  | Full cover | $45 | A $20 copay; physio and cortisone at a quarter price |

  The first injury is still free.
- **The Clinic**, round the corner from the diner in Old Town:
  - **Physio:** 2 h, $40, once a day, takes a day off an injury.
  - **Cortisone:** 30 min, $60, halves the days left. The next injury within three weeks lands a tier worse, and says why.
- **Bots:** they take physio when hurt and there's money past their cushion. Every harness target passes.
- **E2e:** the week sheet offers the three plans, catastrophic chosen.
- **Carried:** v0.956's urgent care isn't separate: the clinic bill at the moment you're hurt is it.

**Status (30 Sep 2026): 22.4b built: old injuries and fear.** Save v15, 0.971.0.
- **Old injuries:** a tier-2 or tier-3 injury, when it heals, can leave a mark where it was (35% and 70%, seeded) [proposed]. That merges v0.956's scars and marks.
  - The area is fingers, shoulder, elbow or knee from a strain, or an ankle from a landing.
  - A mark makes injuries there 30% likelier for good, and ankle landings too.
  - Now and then (6% a go on a line that loads it) a mark flares: that style's windows are 10% tighter for three days, or until physio settles it.
  - A flare is felt only on those lines, so it isn't a chore.
- **Fear:** a bad landing, a deck or a tier-3 injury leaves you afraid of that line's style. Every window on that style is 10% tighter until you send one, and the send says so.
- **Where you see it:** the beta sheet says when fear or a flare tightens a line, and the journal lists old injuries and fears.
- Every harness target passes (injuries in the first month: 9%).
- **Carried:** no bot aims to send its feared style first. A player would.

**Status (30 Sep 2026): 22.4c built: supplies and sickness.** Save v16, 0.972.0.
- **Supplies** are one gauge for water and washing, 0 to 100 [proposed numbers].
  - It starts at 80 and drops 8 each night at the van.
  - It comes back at the lake (free, +40, not in winter), the market ($4 water and a wash kit, +30), the gym's shower (with a pass, +30) and the truck stop (+20 a night).
  - Tonight shows it, and a line warns when it's low.
  - **Where this differs from the plan:** propane stays the heater's, by the tank (22.2c), rather than folding into the gauge. The heater's already tuned around tanks, and one gauge driving both the cold and hygiene muddied the Tonight line.
- **Sickness** is a seeded chance each night at the van.
  - The odds: 1% base, +3% on a winter night without heat, +4% on low supplies, +4% going to bed hungry, +3% for four of the same meal.
  - A cold or a stomach bug lasts 2 to 4 days: 20 less energy back each night, and every window 15% tighter.
  - A toothache (only from low supplies) stays until a doctor sees it. A doctor at the clinic ($30 on your plan's share) halves what's left of a cold or a bug.
  - Tonight gives the odds when they're 5% or more.
- **The bots** buy water when supplies fall under 40 and see the doctor for a toothache. A balanced bot is sick about twice in 56 days, with no toothaches. Every harness target passes.
- **Carried:** teeth are the toothache. v0.956's separate tooth meter isn't back, and doesn't need to be.

**Status (30 Sep 2026): 22.4d built: psyche. 22.4 is done.** Save v17, 0.973.0.
- **Psyche** is a slow mood, 0 to 100, settled every night from the day that's ending [proposed numbers].
  - **Lifts:** a line you'd never sent (+4); a day at a crag (+2), or +6 the first time you're at that one; climbing with someone (+3); the fire at night (+2).
  - **Wears:** a shift (−3); and a run of days with nothing to lift it, a little more each day, to −4.
  - A day moves it at most 8 either way, and every night it drifts a tenth of the way back to 50. No one ritual holds it up: the fire every night settles at keen, short of psyched.
  - A new climber starts at 60, keen. At the ends it moves every window 5%.
- **Where you see it:** Tonight gives it in a word (low, flat, steady, keen, psyched) and says what moved it today. A line says so the morning it tips into low or psyched.
- **The bots** sit at the fire when they're under keen. Without it the career bots sank to low after day 100 (projecting at the limit, same gym, shifts); with it they hold steady. The season bots run keen: early on, most days bring a new send.
- Every harness target passes, and a new one: psyche never stays low for more than a week (longest 0 days; career median 52 at day 56, 63 at day 224).
- **Carried:**
  - Scout, a night with people at the fire, and events (22.6) don't lift it yet. Those slices can add their own lifts.
  - Nothing in the game reads psyche but the windows. Story beats that want it can.

**Status (30 Sep 2026): 22.5a built: cans, the bins and foraging.** Save v18, 0.974.0. 22.5 goes in two parts: the hustle's safety net, then busking, which needs a timing beat of its own (the climb's verbs are built around routes), and which the cooking beat can reuse.
- **The hustle,** each once a day, seeded by the day so a reload can't reroll it [proposed numbers, v0.956's where it had them]:
  - **Cans**, from the van by day: 2 h, 8 energy, $3 to $9.
  - **The bins** behind the market, after dark: 1 h, 4 energy; 78% of nights, 24 to 39 food, and a meal for the variety count.
  - **Foraging** at the lake by day: 2 h, 6 energy, 18 to 29 food, 40% of that in winter. v0.956 foraged in town too; here the shore is the one place.
- **Taught once:** the first time you're under 35 food with under $10, a line says where all three are. A new `seen` list keeps one-time lines from repeating.
- **None out-earns a shift an hour** (a new harness target, and a test). At best: cans $4.50/h, the bins $3.12/h, foraging $1.16/h, against the warehouse's $6.50/h, the worst shift. Food is priced at ramen's, the cheapest food money buys. Priced at the diner's special instead, a lucky night at the bins is worth $7.80/h: over the warehouse, under everything else.
- **The bots** collect cans when under $10 and hit the bins when hungry with no money for ramen. The climber bots collect cans about 8 times a season; the others almost never need to. Every harness target passes; the climber bots' one stuck night (a card at its limit, not hunger) stays.
- **Status (30 Sep 2026): 22.5b built: busking. 22.5 is done.** Save v19, 0.975.0. Evan's calls: it pays less than any job at first and, after hundreds of days of it, more an hour than any job, because you've become a good guitar player; it's at the Coffee Shop; and the crowds grow as you get better.
  - **A set** is a row on the Coffee Shop's card: 1 h, 5 energy, once a day, 8 AM to 8 PM, not in the rain. A marker crosses a bar eight times, and you strum (the button, Space or Enter) as it crosses the band: a clean chord in the middle, half of one near it. Each strum is a chord, synthesised in code.
  - **Your playing** comes from your sets, each counting half for turning up and half by how clean it was. It's 63% of the way after 150 sets and 95% after 450. Ranks: beginner, busker (25%), a regular (55%), local legend (85%), each said when you reach it and shown in the journal.
  - **Pay:** an hour on an ordinary crowd runs from $4 (under the warehouse's $6.50) to $24, times the crowd (lunch and early evening best, weekends ×1.3, the sky, the day's luck), times how clean the set was (a sloppy one earns 30%). At 75% clean, a set a day: $4.12 on day 1, $12.84 on day 100, $17.77 on day 200, passing head coach's $17/h on day 180.
  - **The crowd** grows with your playing: 2 people stop for a beginner on an ordinary day, 30 for a legend.
  - **Carried:** the bots don't busk (the harness reads the curve from the numbers). A set's line doesn't vary by crowd beyond the headcount yet. The cooking beat can now reuse the beat's panel.

**Status (30 Sep 2026): 22.6a built: the event deck, and knocks on the van at night.** Save v20, 0.976.0. 22.6 goes in three parts: knocks; roadside stops and hitchhikers on drives; walk-out epics.
- **The deck** is seeded, and deals at most one encounter a day, of any kind. An encounter waits for your answer: nothing else happens until you give one, as with a breakdown.
- **Knocks** are v0.956's ten, in its words, with three answers each, by where you're parked:
  - the Lot: the cop's flashlight, the wrong vehicle, a jump, the dumpster;
  - the truck stop: the wrong vehicle, a jump, the man in the hi-vis, the dumpster;
  - the trailhead: a jump, headlights at two, something in the food box;
  - the Ridge: the food box, the van moving in the wind, somebody else who knows the spot;
  - a friend's driveway: one in the morning, the friend at the passenger door, which moves your bond with them.
- **When:** v0.956's odds, 11% a night times the spot's (the Lot 1.4, the truck stop 1.2, the trailhead 0.9, the Ridge 0.6, a driveway 0.5), never within four nights of the last. The deck passes over the last three you've heard while the spot has others. About five a season at the Lot [INFERRED].
- **What an answer does:** energy (lost sleep), cash (the jump's $20, the truck stop's $11), supplies, bond, and psyche at half v0.956's scale, since the rebuild's moves slower. v0.956's standing, reputation, crafting materials and grime have no home here, so those effects are gone.
- **Where you see it:** going to bed, the knock (three raps, made in code) and its card: the situation and three answers, no ✕. The answer's line, then the morning.
- **The bots** answer with the first option. Every harness target passes.
- **E2e:** a planted night the seed's deck knocks on: bed, the knock heard, the card, an answer, day eight.
- **Also in this release, from Evan's phone:** the Market's and the Garage's names ran off the map's right edge (labelled to their left now, and a layout test holds every name on screen); and a card-only place had no ✕ while you were there (it closes onto the map now).

**Status (30 Sep 2026): 22.6b built: hitchhikers and roadside stops.** Save v21, 0.977.0.
- **On the road:** a drive to or from a crag that doesn't break down can meet someone, from day 3, within the one-encounter-a-day cap the knocks share [the day-3 start is proposed]. The encounter waits for you at the other end: a sound as you pull in (the side door, or tires onto gravel) and its card, no ✕. A plan waits on your answer, then carries on.
- **Hitchhikers:** v0.956's eight, in its words, 14% of such drives and five days apart; someone you've met 2.6 times likelier than a stranger [v0.956's numbers].
  - The first time: three answers, and a new fourth, driving past. Drive past and they're still a stranger.
  - The second time: their second meeting. It remembers what you did: the grifter's "ask for your forty back" is there only if you gave him forty.
  - v0.956 paid some answers in flat skill. Here the old hand's receipt is a real piece of beta at the crag you're driving to, and the busker's three chords are three sets of guitar practice. Standing, reputation and crafting materials are gone, as with the knocks.
  - **At a breakdown,** with no friend to call, a hitchhiker you picked up (never the grifter or the thief) comes the other way half the time, and fixes it as a friend would.
- **Roadside stops:** v0.956's nine finds (the overlook, the World's Largest Boulder, Ma's Pie Stop, the hot spring and the rest), 20% of such drives and three days apart [proposed; v0.956 offered one on three drives in four]. Pulling over is a 40-minute detour for psyche, and some energy, skin or food. A find you haven't seen first; after the first time, 40% of it. Its flat skill is psyche here.
- **The bots** answer with their first option. Every harness target passes. The climber bots' stuck nights went from 1 to 3 in 144 runs: the first answer to the grifter and the thief costs $40 and $55.
- **E2e:** the day-four plan's drive home meets this seed's runaway; the plan waits for the answer and carries on (an answer isn't counted against the day's taps). A planted morning drive to Roadside picks up the busker: the door heard, the card, three chords, and the crag.

**Status (30 Sep 2026): 22.6c built: walk-outs. 22.6 is done.** Save v22, 0.978.0.
- **Walk-outs** are v0.956's five epics, in its words: the dark, a storm, off route, the long cold, and a stuck rope. Each is three stages of three calls.
- **When:** driving away from a crag, before the drive, the walk back to the van can turn into one. It's unhurt only, ten days apart, and within the one-a-day cap. The odds are v0.956's: 5.5% a point of risk over 4, up to 45%.
  - Risk: late (+2 from 7 PM, +1 more from 9), late with no headlamp (+3), rain (+2), winter (+1), spent (+1 under 45 energy, +2 under 25), starving (+1), out of water (+1), and alone that day (+1).
  - A careful day never meets one. A late, spent, lightless, solo one does about a third of the time.
- **Which:** the weather first (storm), then a wall you're on (the rope), the winter dark (the cold), any dark (the walk out), and by day, off route.
- **The calls add up:** each adds risk, energy, food, skin and hours. The total decides how you get out:
  - at most 2, clean;
  - at most 6, rough;
  - past that, badly: a jammed or rolled ankle, with its bill.
  - Getting out is worth a little psyche whatever it cost. The hours pass, the ending says how it went, and the journal keeps the story. Then you drive. v0.956's "rattled" has no home here.
- **A headlamp** at the gear shop, $18 [proposed]: three points of risk off every late walk-out.
- **Where you see it:** the trail (boots and wind, made in code), and each stage's card, with no ✕.
- **The bots** answer with the first call, then drive. They're off the rock by dusk, so they rarely meet one [not measured]. Every harness target passes.
- **E2e:** a planted night at Roadside (day 4, half nine, spent, alone, no light) that this seed turns into The Walk Out: the trail heard, three careful calls, out clean, and in the journal. A planted drive to Roadside also pulls over at Balanced Rock. Every event now has a sound and an e2e step (criterion 3, for the events; the games are 22.9's).

**Status (30 Sep 2026): 22.7 built: Scout's life.** Save v23, 0.979.0. v0.956's lifecycle, its words and numbers (Decision 3, kept).
- **Perks, by bond,** each said the day it's earned (and none while he's hungry):
  - He settles at the fire (20): the fire's psyche +2.
  - He goes looking on his rounds (45): a quarter of nights, a serving of something for the pantry.
  - He watches the van (75): the Lot's tickets half as likely. v0.956's let any dog block every ticket.
- **Dog-years** are 18 days from the day he picked you.
  - He goes gray at 8, and his crag lines slow down with him. He slows down at 12. Each is said the morning it comes.
  - The vet: The Limp at 10 ($70) and The Lump at 13 ($130), billed that morning.
  - His card says his age and his stage (still a pup, in his prime, going gray, slowing down, old and yours).
- **The last day** is at 16, 288 days after he picked you, the morning it comes, at the van. It's v0.956's card with no ✕ and a low held chord, made in code.
  - Three ways to spend it: the crag one more time, the van doors open, or round everybody.
  - Then v0.956's closing line (by bond), and the journal keeps him: "Scout, 16 years. Spent it with the van doors open. Best dog in the valley and everybody knew it."
- **No new stray for 30 days after.** The next one has a name of his own (Moss, then Juniper, then Biscuit), and the Lot's dog lines use it. "Feed Scout" is "Feed the dog" now.
- **The bots** take him on and answer the last day with the first option. A career of 224 days likely sees one vet scare and not the end [INFERRED: he picks you around the tenth trip out]. Every harness target passes.
- **E2e:** a planted night before Scout turns 16: bed, the morning, the chord heard, the card, the van doors open, and the journal.
- **Carried:** the last day's choices cost nothing and move you nowhere, as v0.956's did. The scene's dog, and his speech mark, still say Scout for a later stray.

**Status (30 Sep 2026): 22.8 built: dreams.** Save v24, 0.980.0. v0.956's three, at its prices.
- **The jar:** a Dreams row at the van. Pick a dream, put cash in hand in the jar ($20, $100, or everything; never the card), tip it out, and claim the dream once the jar covers it. The card and the week's bills never touch the jar. The broke check (when the hustle's taught) counts it as yours. What it takes and what it holds are said, and the claim goes in the journal.
- **The Dream Rig, $2,800:** every spot half price for good, and every upgrade Dale fits, fitted.
- **The War Chest, $5,000:** every expedition half price.
- **Home Base, $9,000:** a cabin at the edge of the Lot. The Lot costs nothing to park at and gives no tickets, and there's a kitchen. It says what it stops charging, and that the weekly bills still come, where v0.956's said "ever".
- **How long, for Evan:** saving everything the worker bots put by ($16.33 a day over a season), the Rig is day 172, the War Chest day 307, Home Base day 552. A climbing player's is slower. v0.956's prices on the rebuild's economy make them long goals; the harness prints the line, as a guide, not a target.
- **The bots** don't save for dreams. Every harness target passes.
- **E2e:** a climber with $3,000 at the van picks the Rig, puts everything in, and claims it: every upgrade fitted, $200 left in the jar.

**Status (1 Oct 2026): 22.9a built: horseshoes and liar's dice.** Save v25, 0.981.0. 22.9b (blackjack and hold'em, after Evan's Play Console content rating) and 22.9c (the glossary) are next.
- **The fire at night:** tap it (or "The fire" at the van after dark) for a card: sit a while, as before, or a game. Hazel's there every night; Sage some nights (40%, Evan's call) once you're regulars. Each game is an hour and 3 energy, once a night.
- **Horseshoes:** four throws on busking's beat, a ringer (3) in the band and a leaner (1) near it, against everyone there; their throws come from the seed (a ringer 25% of the time, a leaner 35%) [proposed]. A clang that rings for a ringer and thuds for a miss.
- **Liar's dice:** five dice each, no wilds, one bid. Their opener is on the face they hold most of: what they hold, one more, or two (a bluff), 35/40/25% [proposed]. Call it, or raise (the least that beats it, on your best face); they call a raise that needs more than one of your dice. What's in your cup is the tell: holding none of their face, calling is right 64% of the time; one, 25%; two, never. Picking well wins about three hands in four. The hand holds the night until it's played, and saves.
- **What they pay** (Evan's call, 1 Oct 2026: kept): bond with whoever's playing, as a day climbing together does, and no faster: a person's bond moves once a day, climbing or at the fire, however many games. That's company, for psyche. v0.956's paid +1 bond to all three of Sage, Rico and Mara per game, with no time and no cap, the audit's bond farm (`docs/audit/social.md` §1.3); its psyche and rep bonuses aren't carried (Evan's call: not coming back).
- **The bots** don't play. Every harness target passes.
- **E2e:** half nine at the Lot with Hazel up: the van, the fire, four horseshoes thrown on the beat, back to the fire, and a hand of liar's dice called. Both heard, both once tonight, and Hazel's bond up one.

**Status (1 Oct 2026): 22.9b built: blackjack and hold'em, for money.** Save v26, 0.982.0. Simulated gambling: the Play listing's content rating changes before this ships (Evan's step in the Play Console). 22.9c, the glossary, is next.
- **Evan's calls (1 Oct 2026):** both play for cash under a nightly cap; hold'em is heads-up with three decisions a hand; blackjack is $40 a night at $5 a hand, with hit, stand and double, and no split.
- **Sitting down:** at the fire at night, from its card. You sit with what's in hand up to $40, the most a night can cost, and get up with what's in front of you. Each is an hour and 3 energy, once a night; nothing else happens till you get up, and it saves.
- **Blackjack:** dealt by whoever's at the fire. A fresh deck a hand, the dealer peeks and stands on every 17, 3:2 for a blackjack (to the dollar up: $8 on $5, which about pays back what no split costs), double on two cards. Up to 10 hands a night. Played by the book it's about even: +0.6% of what's wagered over 300 nights, $0.28 a night.
- **Hold'em:** heads-up with Hazel, or Sage when she's there. An ante each, then one bet a street ($2 before the flop, $4 on it, $4 on the turn and river together); you check, bet or fold, or call or fold their bet. Up to 6 hands a night. Their play weighs how often their hand would win against a random one (a 60-deal seeded sample) against their style (as built, by Evan's call): Hazel bets only good hands and bluffs one in twenty; Sage bets and calls looser and bluffs one in three.
- **Reads, and what they know:** after 5 hands with someone you get how they bet; after 12, how often they bluff and what to do about it, said when you earn it and shown at the table. They read you back: a bet of yours on the river that they call and beat goes down as caught, and once you've been caught on a quarter of your hands they call lighter.
- **It isn't a living:** over 120 nights, playing on your hand's odds wins about $1 a night against either; always calling loses $5–10 a night; always betting loses $4.56 a night to Hazel once she's caught you (and wins $1.35 off Sage, who calls light). A test holds every simple way of playing under a quarter of a café shift a night.
- **No bond** from cards: blackjack pays money, hold'em reads. Both count as company for psyche (Evan's call, 1 Oct 2026), so a night at cards lifts it as company does, without moving anyone's bond.
- **Also Evan's calls:** a $5 blackjack pays $8 (kept), and no insurance.
- **The bots** don't play. Every harness target passes.
- **E2e:** half nine at the Lot with $100: blackjack, a hand stood on and up again; hold'em with Hazel, a hand checked and called to the end, and up again. The cash comes back to your pocket, both are once tonight, and Hazel has a hand played on her.

**Status (1 Oct 2026): 22.9c built: the words, and 22.9 with it.** 0.983.0. No save change.
- **Trivia becomes the glossary:** a third page in the journal, Words, beside You and Lately. 45 entries in five groups (on the wall, how it went, kit, grades, the life), each a term and a sentence or two, in the game's voice. Every technique, gear and culture term v0.956's trivia asked about is there (a test holds it), with the words the rebuild leans on that it never asked: pump, crux, project, send train, highball, and the rest.
- **Not carried:** v0.956's history questions (who freed the Nose, who summited Everest without oxygen). Facts about real people belong somewhere they can be checked, and a quiz wasn't the point. Nor is it a fire game: the glossary is there whenever you want it, and nothing pays for reading it.
- **The harness** gets Phase 22's criterion 2 for the games: over 60 nights with Hazel and Sage both up, a night of every game moves anyone's bond by 1 at most, and no way of playing blackjack or hold'em earns what the worst-paid shift does an hour (blackjack by the book −$3.07/h on this seed; hold'em −$9.42 to −$0.73/h by strategy and opponent; the shift $6.50/h).
- **E2e:** the journal's Words page, grouped, after day one.

**Phase 22 against its Done-when (1 Oct 2026):** all three pass on the build. 1: a season's runway holds Phase 6's targets with the van's costs in (the harness's runway target). 2: no game, meal or hustle out-earns or out-bonds its time (the harness's hustle and games targets; busking by Evan's exception). 3: every event and game has a sound and an e2e step (22.6 for the events; horseshoes, liar's dice, blackjack and hold'em in 22.9a and 22.9b). Closed by Evan's call (1 Oct 2026); the CURRENT MILESTONE moves to Phase 24, then 23.

*Evan's calls at the close (1 Oct 2026):* the games' bond stays once a day per person however many games; v0.956's win bonuses don't come back; Sage is at the fire 40% of nights; a $5 blackjack pays $8; both card games count as company for psyche; the hold'em styles stand as built; no insurance; v0.956's history trivia stays out; the dreams keep v0.956's prices (the Rig about day 172 at the worker bots' rate, the War Chest 307, Home Base 552), as long goals.

*Carried:* the glossary's words, tappable where they appear (place cards, route sheets, the lines a go ends with), opening their entry. Evan's call: yes, in a later UI pass.

---

### Phase 24 — Expeditions as trips

*Added 30 Sep 2026 by Evan's call, after 21.5 built expeditions as a sheet of daily calls over the Lot. Numbered 24 so older numbers don't move. It runs after Phase 22 and before Phase 23 (Evan's call, 1 Oct 2026): a trip is packed with Phase 22's food and fuel, and leaves Phase 22's van behind. It could run straight after Phase 21 instead, at the cost of building packing twice.*

**Goal.** An expedition is a trip you plan, travel, live and come home from, somewhere that looks like nowhere else in the game, and its pitches are climbed, not rolled.

**Why.**
- **21.5 made the decision honest, not the trip.** The summit's odds are shown and the choices are real, but a day on El Capitan is a sheet over the Lot's sky, and a pitch is a dice roll against endurance.
- **It's the game's biggest set piece.** An expedition is the most money, time and risk a career puts on one bet, and v0.956 gave it one menu (`docs/audit/climbing.md` §2.14).

**Scope.**
- **A scene for each,** drawn in code: El Capitan's meadow and the wall above it, Cerro Torre's wind-scoured spire over the Patagonian ice cap, and a Karakoram glacier base camp under Trango. Day and night, clear and storm, with the weather on the wall where you can see it. A wall view of each: ledges, the portaledge, the haul line, and how high you are.
- **Planning,** from the Lot: when to go, against a forecast that's honest about how uncertain it is; what to pack, by weight, into a haul bag with a limit (food and water by the day, fuel, a portaledge, the rack); who comes, from your crew by bond, and what they're good for; permits and flights. The summit's odds update as you plan, and are shown every day after, as in 21.5.
- **Getting there:** travel days, the approach (the glacier trek, acclimatizing for Trango), and what the valley does while you're gone: rent, your job's leave (Phase 18's rank-based leave, or losing the shifts), Scout with friends.
- **On the wall:** each pitch a real go through beta-then-send, with its own cruxes and the altitude, cold and fatigue narrowing the windows; your partner leading in blocks; hauling; portaledge nights that cost food and water and give back less each night; the forecast changing under you; retreat at any ledge, and what it costs to go down.
- **What happens up there:** dropped gear, a stuck haul bag, rockfall, a storm that comes early, another party in trouble. Few, seeded and consequential, not a random-event table.
- **Coming home:** the story told at the fire, a card, a magazine's fee or a sponsor's (Phase 18), and a Record Book entry (Phase 23). A failed trip comes home with something too: a high point, beta for next time, a partner closer or further.
- **The Unreal spec** gets the trip's rules in `Dirtbag-UE/concepts/2D-SPEC-LOG.md`.

**Done when.**
1. Each expedition has its own scene and wall view, clear and storm, day and night.
2. An expedition can be planned, travelled, climbed and come home from, summit or not, and the e2e bot plays one through.
3. Its pitches are climbed through beta-then-send; the dice decide only the weather and what happens up there.
4. The summit's odds are shown while planning and every day after, and the harness checks them against the bots' own trips.
5. No expedition is a farm: the harness finds none that out-earns its time and cost at the grade it's offered.

**Depends on:** Phase 21 (21.5's walls, odds and save), Phase 22 (food, fuel, the van left behind). Uses Phase 18's leave and Phase 23's Record Book where they exist, and fills them in when they arrive. **Effort:** ~5–8 weeks [INFERRED]; the three scenes are most of it. **Main risk:** scope. Planning, packing and events can each become busywork; each earns its place by changing the summit's odds in a way the player can see.

**Plan on the rebuild (1 Oct 2026), with Evan's calls.**

*Two problems first:*
- **The download.** The game was 287.4 of its 300 KB budget at 0.984.0, and the painters are the heaviest code in it (the scenes module alone is about 12 KB compressed). Three expedition scenes and their wall views will likely add 12–20 KB, and loading them later doesn't help: the service worker precaches everything for offline play. *Evan's call: the budget goes to 340 KB.*
- **The odds.** 21.5's summit odds are exact because a pitch is one roll against endurance. Once pitches are climbed, a pitch's chance comes from your skills against its cruxes; the odds work it out from the same model the go uses, and the harness checks them against the bots' trips (criterion 4). This is the phase's riskiest engineering, so it goes first.

*The principles:*
- **The valley's walls, far away.** 21.5 already climbs Golden Buttress pitch by pitch with ledge nights. An expedition is a long wall somewhere else: each pitch a line with cruxes, climbed through beta-then-send, and altitude, cold and fatigue narrowing every window the way psyche does.
- **Dice for the weather and what happens up there,** nothing else.
- **Every planning choice moves the visible odds,** or it's cut.
- **Mechanics before art.** 24.1–24.5 play on the existing wall view, so the trip can be tested and tuned before the scenes.

*The slices:*
- **24.1 The wall: real pitches and honest odds.** Each objective's pitches as lines with cruxes. You and your partner lead in blocks: you climb yours, and theirs go by the seed against their grade, which the odds include (Evan's call). Hauling, portaledge nights from what you packed (each gives back less), retreat from any ledge at a cost. The odds each day. Save change.
- **24.2 Planning and packing.** When to go, against a forecast that's vaguer the further out it is. A haul bag with a weight limit: food and water by the day, fuel, the portaledge, the rack; too light and you run out, too heavy and the hauling slows you. Your partner, from the crew by bond (required on a rope; Free Solo goes alone, as the mode does). Permits and flights in the cost. The odds move as you choose.
- **24.3 Getting there, and the valley while you're gone.** Travel days; Trango's glacier walk-in and days to acclimatize. The weekly bills come; Scout stays with friends. Your job (Phase 18's leave isn't built): a trip blocks signing up for its dates, and shifts you'd signed up for drop without a warning if you booked a week or more ahead, and count as missed if you didn't (Evan's call).
- **24.4 What happens up there.** A few seeded events per objective: dropped gear, a stuck haul bag, rockfall, a storm that comes early, another party in trouble. Each a real choice with a visible cost, built as 22.6c's walk-outs are.
- **24.5 Coming home.** The story at the fire, a card, the pay (21.5's $2,400, $6,000 and $12,000, which the harness holds to no farm; Evan's call). A failed trip keeps its high point, the beta, and a partner closer or further. A stub for Phase 23's Record Book. Save change.
- **24.6–24.8 The scenes.** El Capitan, Cerro Torre and Trango, each with a wall view, day and night, clear and storm. Most of the phase's work.
- **24.9 The harness and the e2e.** The odds against the bots' trips; no objective out-earns its time and cost; the e2e bot plays a trip through.

*Evan's calls on the content (1 Oct 2026):*
- **Cerro Torre's ice:** the game has no ice or mixed climbing, and gets none. Its pitches are the styles there are (cracks, technical, endurance), with the cold and the wind narrowing them.
- **Cerro Torre's objective:** the Southeast Ridge. The Compressor Route's bolt ladder was chopped in 2012, and the line has been climbed by fair means since; a game set now names it that way.

**Status (1 Oct 2026): 24.1 built: the wall, real pitches, honest odds.** Save v27, 0.985.0.
- **The pitches:** each objective's are lines with a crux, named for the wall (El Cap's Stovelegs, the Great Roof and the Changing Corners; Cerro Torre's Col of Patience and the pitch "Where the Bolts Were"; Trango's Splitter and Summit Block), graded up to the objective's grade, in the styles the game has. They're climbed as goes, beta and all, on Roadside's wall until 24.6–24.8 paint their own. A pitch up there is a long one: 2 h 30 and 15 energy a go [proposed].
- **Blocks:** you lead two, your partner two, yours first; Free Solo leads them all. On your block you can lead, or hand the day to your partner (big-wall teams swap when someone's stuck); on theirs you second and haul. Their tries go on the seed against their grade, which moves with yours: Hazel a grade under you, Sage one over (Evan's call, 1 Oct 2026, confirming 24.1's proposal, as is handing over a pitch you're stuck on). Their numbers are v0.956's for a pitch (0.68 at grade, 0.1 a grade) knocked down to 0.4 at grade and two tries a day, or they carried a gate climber up El Cap nearly every time [proposed].
- **Who comes:** the closest of the people you climb with, at bond tier 2 or better (required on a rope; Evan's call); nobody close enough, and you can't go roped. 24.2 makes it a choice.
- **Up there:** each day is your block or theirs, or a storm to sit out. A night on the portaledge gives back 45 energy, 8% less every night, and the rations bring food back to 60; every day after the first narrows every window 1.5%, down to 82%; each objective narrows them too (El Cap 0.6, Cerro Torre and Trango 0.65), tuned so El Cap at its grade goes a little over half the time with Hazel and at its gate hardly ever, as 21.5's did [proposed]. Retreat from any ledge. Out of days, home with what you fixed.
- **The odds:** worked out from the go's own model. Each of your pitches is played on the seed 24 times by a climber's hands, at the start, middle and end of the trip (the days narrow it), then every day ahead, storm or not, is worked through exactly, taking your partner's day where it's the better bet. They're shown before you pay and every day after, as "choosing well each day".
- **Against the bots' trips** (the harness's new target, criterion 4): for a climber at each objective's grade roped to Sage, 100 trips each, El Cap shows 72% and the bots get 71%; Cerro Torre 52% and 43%; Trango 37% and 30%. The odds run a little high on the long ones: they choose perfectly each day, and the bots choose by a simpler rule. The target holds them within ten points.
- **Size:** 290.4 of 340 KB.
- **E2e:** a V9 climber with Hazel at the van: the expeditions, El Cap's odds with Hazel, away; storms sat out; pitch 1's beta on the wall; a day handed to Hazel; a night on the portaledge.

**Status (1 Oct 2026): 24.2 built: planning and packing.** Save v28, 0.986.0.
- **Booking:** the expedition's card is a planner now. You book a departure up to 7 days out and pay then: the trip, and food and water at $12 a day. Cancel for half back. Miss the day and the flight leaves without you, and the money with it. A booked trip shows on the van's card. [proposed]
- **The forecast:** each day from the one you'd leave is called storm or clear; right every time on the day itself, a coin toss 10 days out. The odds use what it says, Bayes and all, so a dry week ahead shows. [proposed]
- **The haul bag:** up to 80 kg. Food and water are 3 kg a day (twice that without a stove where the water's snow: Cerro Torre and Trango), the portaledge 9 kg, the stove 2 kg. Every kg over 35 costs 0.4 energy a night, hauling it; the bag lightens as you eat. No portaledge, and nights give back half. When the food and water run out, you come down. The planner starts from as much food as the bag takes. [proposed]
- **Who comes:** anyone close enough; tap through them. Their grade, and what it does to the odds, shows as you choose.
- **The odds** move with every choice: partner, day, food, portaledge, stove.
- **Against the bots' trips:** the bots now choose each day from the odds model too (leading or handing over, whichever it says is better), so they choose well, as the odds assume. El Cap shows 71% and the bots get 75%; Cerro Torre 52% and 46%; Trango 34% and 30%.
- **E2e:** the planner's odds and bag, booked, and away.

**Status (1 Oct 2026): 24.3 built: getting there, and the valley while you're gone.** 0.987.0. No save change.
- **Travel:** El Cap is a day each way (the drive to the Valley); Cerro Torre two (flights to El Chaltén and the walk in); Trango eight out (flights and a jeep to Skardu, then five days up the Baltoro, acclimatizing as you go) and six home [proposed]. The days pass on the way, the week's bills with them; the wall's first day is the day you get there, and the forecast and the odds start from it.
- **Your job** (Evan's call): booking a week or more ahead takes the shifts you'd signed up for in the trip off your week; less, and they're still yours, to miss with a warning each. You can't sign up for a day you're booked to be away. The planner says which.
- **Scout** stays with friends, as before.
- **Three leads a day** at most up there [proposed]. Measured: the bots on Trango, leading up to five a day after a week of travel off the rock, were hurt on 33 trips of 60, and the odds can't see an injury coming; at three, the odds hold.
- **The odds** also carry your skin through a long trip now: a go on the wall costs some, a night gives 22 back, and the odds read it at the third go of each day.
- **Against the bots' trips,** 300 each now (at 100, the bots' own luck moved Trango twelve points between runs): El Cap shows 65% and the bots get 66%; Cerro Torre 42% and 40%; Trango 30% and 25%.

**Status (1 Oct 2026): 24.4 built: what happens up there.** Save v29, 0.988.0.
- **Six events** [proposed], as data (`sim/content/wallevents.ts`): a cam dropped at the belay, the haul bag jammed under a flake, rockfall, a squall the forecast missed, another party in trouble (only with a partner on your rope), and the stove quitting (only where the water's snow and you brought one). Each has two calls, with what each costs beside it, formatted from the same numbers the rules use: energy, days of food and water, a pitch to fix again, psyche, bond with your partner, or the day.
- **When:** some mornings up there, 15% of them, never the first; never the same one twice a trip, two at most [proposed]. Seeded on the trip and the day. A call that loses the day is a night where you are, and the next morning can bring another.
- **The odds** count them: any morning but the first might be a day lost, until two have come. Without that the odds ran about eight points over the bots'.
- **Against the bots' trips** (300 each; the bots take the first call): El Cap shows 52% and the bots get 56%; Cerro Torre 32% and 34%; Trango 22% and 22%. The shown odds dropped from 24.3's 65/42/30 because events cost days and energy now.
- **Sound:** a crack high up, then a rumble, as the card comes up.
- **The scene behind the card** is still the Lot's, until 24.6–24.8 paint the walls.
- **Size:** 295.4 of 340 KB.
- **E2e:** any event that comes is answered with its first call; then the haul bag jams on the reload, the card shows each call's cost, and cutting the food loose leaves two days less in the bag.

**Status (1 Oct 2026): 24.5 built: coming home.** Save v30, 0.989.0.
- **The book:** every trip you come home from goes in it: which, the day you got back, how it ended (summit, rapped off, out of water, out of days), the pitches fixed, who was on the rope, the nights, what happened up there, and whether you've told it. It's the stub Phase 23's Record Book will read.
- **Your high point:** the most pitches fixed on an objective, from every trip there; the planner shows it, or that you've stood on top.
- **Your partner, closer or further** [proposed]: a summit together +2 bond, half the wall or more +1, the water run out on them −1; anything else, no change.
- **The trip's card,** on the way back to the Lot: how it ended and with whom, the nights, what happened up there, the pay, where it leaves your high point, your partner.
- **The story at the fire** [proposed]: once a trip, after dark, with someone there. Half an hour; +8 psyche for a summit, +4 for anything else; the people there count it as a day together (once a day, as the games do, so it can't stack with them).
- **The pay** stays 21.5's ($2,400, $6,000, $12,000); 24.9's harness checks it's no farm.
- **The beta** you worked out on the pitches you led is kept as any line's is (what you know, your picks, where you fell), so the next trip starts from it, and the odds, which play each go with your picks, show it. Nothing new was needed.
- **Not built: the drawn keepsake card.** The send card paints a line on its own wall, and the expeditions' walls are 24.6–24.8's; a summit card painted on Roadside's wall would be wrong. It comes with the scenes.
- **Size:** 296.8 of 340 KB.
- **E2e:** rap off; the trip's card ("You rapped off with 0 of 6 pitches fixed, with Hazel."); the book has it; that night at the fire, its story.

**Status (1 Oct 2026): 24.6 built: El Capitan's scene.** 0.990.0. No save change, no rule change.
- **The scene:** while you're on El Cap, the day's card sits over El Cap Meadow instead of the Lot: the wall above the forest, the Nose between the southwest face in the light and the southeast in shade, the Heart and the diorite North America on it, pines on the rim, the meadow to the road. Painted in code, once per light, into a screen-fixed canvas: there's no walking up there.
- **Day and night, clear and storm:** by moon, with stars and other parties' headlamps; under a storm, the summit in cloud and the rain falling; a storm at night, both.
- **Where you are:** your portaledge on the wall, as far up its line as the pitches you've fixed, with a lamp at night and the count beside it ("1 of 6").
- **Pressed into the top half of the screen,** where the day's card leaves it showing: the summit under the HUD, the wall's foot about where the card starts. In landscape the card docks to the side and the meadow shows.
- **The wall view:** El Cap's pitches are climbed on its own granite: a clean face, the corner and crack system, black streaks, the belay ledge with your partner on it (your partner belays up there now, not whoever's at the Lot), and under it the haul bag, the portaledge, and the meadow a long way down. A storm rains on it and the night darkens it, though you can't lead in either.
- **Cerro Torre and Trango** keep the Lot and Roadside's wall until 24.7 and 24.8.
- **Size:** 299.2 of 340 KB (El Cap: 2.4 KB).

**Status (2 Oct 2026): 24.7 built: Cerro Torre's scene.** 0.991.0. No save change, no rule change.
- **The scene,** from the moraine above Laguna Torre: the needle and its rime mushroom, the Southeast Ridge its left skyline from the Col of Patience beside El Mocho, Torre Egger and Standhardt to its right, the ice cap white behind them and the Fitz Roy group's teeth far off; under them the Torre glacier and its crevasses, the moraine, and the lake with its bergs (the lake shows in landscape).
- **Day and night, clear and storm:** a fine day has lenticular clouds stacked over the summits; a night, stars and the moon; a storm tears a plume off the summit, buries the towers in cloud and snows on you; a storm at night, all of it dark.
- **Snow, not rain,** wherever the water's snow: Cerro Torre's storms, on the scene and on the wall view, fall as wind-blown flakes. Trango's will too.
- **Where you are:** your portaledge on the Southeast Ridge, as high as the pitches you've fixed, with the count beside it.
- **The wall view:** its pitches climbed on the Torre's browner granite, rime plastered on the corner's edge and in the crack, ice in the corner's back, a snowy belay ledge, and the glacier far below.
- **Trango** keeps the Lot and Roadside's wall until 24.8.
- **Size:** 301.0 of 340 KB (Cerro Torre: 1.8 KB).

**Status (2 Oct 2026): 24.8 built: Trango's scene.** 0.992.0. No save change, no rule change.
- **The scene,** from base camp on the Trango glacier: the Nameless Tower, square-topped and golden, standing on its snowy shoulder with Eternal Flame up its south face; Great Trango's bulk to the left with snow on its top, the Monk and the Pulpit to the right; the Karakoram's snow peaks far and pale behind; the glacier striped with medial moraines converging on the tower, and base camp's tents on it (the glacier and camp show in landscape).
- **Day and night, clear and storm:** a deep altitude blue by day; stars thick at night and one tent lit; a storm buries the towers in cloud and snows; a storm at night, dark.
- **Where you are:** your portaledge up the approach gully, across the snow ledge and up the south face, as high as the pitches you've fixed.
- **The wall view:** golden granite, the splitter, a snowy belay ledge, and the glacier far below.
- **Every objective now has its own scene and wall view, clear and storm, day and night: Done-when criterion 1 passes.** A test holds every objective to a scene, and its storms to snow exactly where its water's snow.
- **Still open from 24.5:** the drawn keepsake card for a trip. It waited on these walls, which now exist; it's a candidate for 24.9 or a polish pass.
- **Size:** 302.4 of 340 KB (Trango: 1.4 KB; the three scenes 5.6 KB together, against the 12–20 KB the plan feared).

**Status (2 Oct 2026): 24.9 built: the harness and the e2e.** 0.993.0. No save change.
- **The harness found a farm, and 24.9 closes it** (Evan's call, 2 Oct 2026, confirming the proposal): a summit paid every time, so a climber a grade or two past an objective could fly back to it for money. Measured, 20 trips a grade: El Cap at V11 came to about +$1,175 a trip, Cerro Torre at V14 +$1,740, Trango at V16 +$1,510, several times a day of shifts. **A summit now pays once, the first time, as a wall does**; the amounts are Evan's ($2,400, $6,000, $12,000). The book (24.5) says whether you've stood on top, so no save change. Back up for it again and the top says nobody pays for the same photos twice; the expeditions list now says what the first summit pays, and that you've been paid.
- **The harness's new target (criterion 5):** for every objective, at every grade it's offered from its lowest to two past its own, 30 bot trips each: once a summit has paid, no trip out-earns a day of the worst-paid shift ($28). Every repeat loses money ($94 to $154 a day away). A first summit is a one-off, shown beside it: El Cap $57 a day at V9 and $208 at V11; Cerro Torre $24 at V12, $130 at V14; Trango −$22 at V14, $36 at V16.
- **The odds against the bots' trips** (criterion 4) hold: El Cap shows 52% and the bots get 56%, Cerro Torre 32% and 34%, Trango 22% and 22%.
- **A bug the e2e found, there since 24.1:** leading a pitch up there, the expedition's card stayed over the wall for the whole go, under the climb panel. The rule that keeps the day's card up now lets it down while you climb and while the stamp shows.
- **The e2e plays a trip through** (criterion 2): planned and booked, the day out, storms sat out, pitch 1 led through its beta and the go with the same hands that climb day three (it checks no card covers the wall), a night, something happening up there, rapped off, the road home, the trip's card, and its story at the fire.
- **Known, not fixed:** above an objective's grade, the bots beat the odds shown by 15 to 25 points (El Cap at V10: 75% shown, 90% got, from 20 trips). The odds undersell an easy trip, which isn't a farm and isn't what criterion 4 measures (it holds at each objective's grade); a candidate for a tuning pass.
- **The harness takes about 15 minutes now** (the season file's limit raised to 20).

**Phase 24 against its Done-when (2 Oct 2026):**
1. **Passes:** each objective has its own scene and wall view, clear and storm, day and night (24.6–24.8).
2. **Passes:** an expedition is planned, travelled, climbed and come home from, summit or not, and the e2e plays one through (24.9).
3. **Passes, with Evan's 24.1 call noted:** your pitches are climbed through beta-then-send, and the dice decide the weather and what happens up there; your partner's leads also go on the seed against their grade, as Evan decided.
4. **Passes:** the odds are shown while planning and every day after, and the harness holds them within ten points of the bots' trips at each objective's grade.
5. **Passes:** a summit pays once (24.9, Evan's call): no trip that's already paid out-earns a day of shifts at any grade it's offered.

**Phase 24 closed by Evan's call (2 Oct 2026),** with the pay-once rule confirmed. Carried: the drawn keepsake card for a trip (24.5), and the odds running low above an objective's grade (24.9), both for a polish pass. The CURRENT MILESTONE moves to Phase 23.

---

### Phase 23 — Who you are: origins, paths, stances, and the Record Book

*Added 29 Sep 2026 by Evan's call. Runs after Phases 22 and 24, before Phase 16, which keys its epilogues to all of it.*

**Goal.** A climber who's somebody: where they came from, what they're becoming, what they stand for, and a book of what they've done.

**Scope.**
- **Creation:** origins (the Late Bloomer and the rest), callings, flaws, talents: v0.956's six steps, kept short (R1 cut creation to a name and a start).
- **Paths, traits and Mastery** (hybrids and style merged), with thresholds in grades, not 0–100 relics.
- **Personality, factions and stances:** the ethics stances with their echoes and elder options; clubs folded into faction perks.
- **The Board and the Record Book:** one weekly board; feats, milestones and story cards in one book. Phase 14 maps the Record Book to Steam achievements.
- **The year:** a recap, and Homecoming.

**Done when.**
1. Two climbers made differently play differently in their first week, and the harness can tell them apart.
2. Every stance's echo lands later in the game.
3. The Record Book holds every feat v0.956 celebrated, merged, with its story.

**Depends on:** Phases 21–22. **Effort:** ~5–8 weeks [INFERRED].

**Plan on the rebuild (2 Oct 2026), with Evan's calls.**

*Two problems first:*
- **No reputation to hang it on.** v0.956 paid feats, callings, paths and stances in rep and followers, and faction standing came out of them. The rebuild has neither; they're Phase 18's (sponsors and media), not built. Everything here rewards in what exists (cash, psyche, bond, a line in Phase 16's epilogue) or is its own reward.
- **Creation's weight.** The audit's sharpest first-hour finding: forty numeric trade-offs before the first climb. R1 cut creation to a name and a start for it; this phase mustn't put them back.

*The principles:*
- **Identity mostly emerges from play:** talents revealed by reps, quirks named from your habits, paths claimed once earned.
- **Gates in grades across the whole career,** never v0.956's 0–100 scale that ran out by V5.
- **One layer per job:** the Record Book (feats, milestones and story cards in one), the Board (one weekly board, auto-claimed), and Life Goals (the spine, Phase 16's). The audit's ~28 trackers become three.
- **Content is data,** checked by tests; the harness tells two made climbers apart (criterion 1).

*Evan's calls (2 Oct 2026), taking every recommendation:*
1. **Creation:** a name, a start and an origin; the calling and the rest come later, in play.
2. **Flaws fold into origins:** each origin a perk with a stated cost, as the Late Bloomer's was.
3. **Build (body type) is cut:** its ±2–5% by route type never showed.
4. **Personality's four axes are cut:** callings, factions and stances cover them.
5. **Two factions now,** the old guard (trad and the locals) and the gym crowd; comp and media come with their phases.
6. **Paths:** Power, Fingers, Head, Style and Dirtbag now; Comp and Scene wait for comps and media. Tier 3 gives a passive edge and a title, not v0.956's once-a-day active.
7. **Rewards with no rep:** the book entry is its own; Board jobs pay small cash under the no-farm harness; callings and stances pay psyche now and feed Phase 16's epilogues.
8. **Hidden talents** revealed by reps stay.
9. **Homecoming** stays, once a life, paying cash and psyche for now.
10. **A year is 56 days** (the audit's clock fix).
11. **A climber carried across from v0.956** gets an origin that says so, and no talents re-rolled.

*The slices:*
- **23.1 The Record Book.** v0.956's 29 feats, 5 milestones and 8 story cards merged and de-duplicated, each feat with its story card; fed by what's already kept (sends, first ascents, the expedition book, the dogs). Stable ids for Phase 14's Steam achievements. Save change.
- **23.2 Origins, and what's in you.** An origin chosen at creation, each a perk and its cost; hidden talents revealed after reps. Designed against criterion 1's harness check from the start: an origin has to show in a first week. Save change.
- **23.3 Callings.** A temperament and its three-rung ambition, keyed to sends, taken up in play.
- **23.4 Paths and Mastery.** Two of five paths, tiers near V4, V9 and V14; hybrids and style mastery merged into one Mastery track; a quirk named from your habits.
- **23.5 The scene: factions and stances.** v0.956's five dilemmas and their echoes later; clubs folded in as faction perks.
- **23.6 The Board.** One weekly board.
- **23.7 The year.** A recap every 56 days, and Homecoming.
- **23.8 The harness and the e2e.** Two climbers made differently play differently in their first week, and the harness tells them apart; every echo lands; every feat v0.956 celebrated is in the book.

*The risk:* criterion 1 gets harder with every choice moved out of creation. With creation at a name, a start and an origin, the origin's perk and cost have to be big enough to show in week one; 23.2 tunes them against the harness, not by feel.

**Status (2 Oct 2026): 23.1 built: the Record Book.** Save v31, 0.994.0.
- **One book:** v0.956's 29 feats, 5 milestones and 8 story cards (42 entries, in three books that fired together) are 37 entries, each moment once: First Send took in "Send It" and the "First Send" card; World Class was a feat and a milestone; A Year on the Road took in "The Dirtbag Year". Each entry says which of v0.956's it took in, and a test holds the book to all 42.
- **27 entries the book holds now,** earned from what the game keeps: sends, grades, flashes and onsights, sending outside, first ascents, every open crag, passing Dex, getting hurt, a year (56 days), a shift (walk-ins count), a raise, being let go, $1,000 and $5,000, five kinds of kit, the Dream Rig, breaking down, a close partner, an expedition summit and a dog (the last two new). Each has its story card, v0.956's eight kept and the rest written for it.
- **10 wait** for systems not built (comps, media, sponsors, guidebooks, giving, retirement, and traits until 23.4), out of the book until they are.
- **One moment, one card:** the first boulder of the game can be an outdoor onsight, which is four entries at once; it's one card, the first entry's story, the rest named under it. The book is its own reward (Evan's call 7). Stable ids for Phase 14's Steam achievements.
- **The Record page** in the journal, newest first, "n of 27 in the book".
- **An old save** goes in the book with what it had already done, quietly, dated the day it loads.
- **Fixed on the way:** a walk-in shift didn't count as a shift for the book's check, so "Clocked In" came days late; it counts today's work now.
- **E2e:** takes each Record Book card as it comes (logged; one-offs, so not counted against Phase 11's tap budgets; by keyboard on the keyboard day), checks the first send is in the save, and opens the Record page.

**Status (2 Oct 2026): 23.2 built: where you came from, and what's in you.** Save v32, 0.995.0.
- **Six origins at creation,** v0.956's, chosen with a name and a start; Sold It All already picked. Each is a perk and its cost (Evan's call 2), and both are said on the button from the origin's own numbers: pay, gains indoors, outside or in sessions, power and fingers' spring, nights, insurance, what you buy, a weekly bill, start cash, and skills on top of the start's. All six sets of numbers are [proposed].
- **Every price shown is the one charged:** a shift's pay on the café's card, the night's spot and how you live on Tonight, the plan's premium at the clinic, all go through the same multipliers the rules use.
- **What's in you:** v0.956's 11 talents, one good and one bad dealt on the seed with an origin, hidden until the skill they touch has come on six points since you started (tendons show on a finger injury); then a note, and a line on the You page. Glass Tendons raise the odds of a tweak on crimps and cracks.
- **The first goal:** three origins start past Act I's $60, as Sold It All's $300 did in v0.956; it's done at the start for them.
- **A carried climber** says they came across, and nothing's re-dealt (Evan's call 11). Old saves load with no origin and nothing dealt.
- **Criterion 1, measured, not yet tuned:** bots by origin over a week (12 seeds, the balanced and climber strategies) end with the same sends ±1 and skill totals within ~15 of each other; the extra cash goes on the same purchases, so it barely shows at day 7. A bot plays every origin the same way; making two climbers play differently is 23.8's harness work. The default bot has no origin, so the harness's numbers don't move.
- **E2e:** picks Sold It All, checks its terms and the $191 start, and expects its pay through the run.

**Status (2 Oct 2026): 23.3 built: callings.** Save v33, 0.996.0.
- **Asked, not picked at creation** (Evan's call 1): once you've sent ten lines, Hazel asks at the fire what you're climbing for. Take one up for good, or put it off; it waits on the You page.
- **Three on offer,** v0.956's Purist, Send-or-Bust and Lifer, each a perk said from its own numbers: 15% more learned outside; cruxes 5% kinder on a line's first go, at 10% more chance of getting hurt; nights 20% cheaper and 25% less chance of getting hurt. The Influencer waits on followers and sponsors (Phase 18). All numbers [proposed], v0.956's where it had them.
- **The ambition:** three rungs each, counted from the day you took it up: a V8, V11 and V14 sent outside; a V6, V9 and V12 flashed outside; five, nine and thirteen grades consolidated (five lines sent at each, v0.956's rule). Each rung pays psyche (8, 12, 16) and a note, once; the You page shows the ladder. Phase 16's epilogues will read it.
- **Personality and faction seeds are cut** with personality (Evan's call 4).
- **Measured, by bot** (10 seeds, the balanced strategy): a Purist ends week one with ~12% more skill; a Lifer ~$20 more in hand; every Send-or-Bust bot meets its first rung in week one, but bots climb with perfect hands, so flashes come easier to them than to a player. By day 28 every Purist has its first rung, and the ten Lifers have seven rungs between them. The default bot takes no calling, so the harness doesn't move.
- **Not in the e2e:** its five days stop short of ten sends, so the offer is checked by the sim's tests and by eye (the card and the You page, previewed).

**Status (2 Oct 2026): 23.4 built: paths, mastery and a quirk.** Save v34, 0.997.0.
- **Five paths,** claimed on the You page a tier at a time, two at most: Crusher, Tendon, Nerve, Dirtbag (v0.956's) and Mover (new, for technique); Scene waits on comps. Each tier is gated on your grade, V4, V9 and V14, and a deed of its own (sends in its styles, flashes, or trips out). A tier you could claim is said once. Tier 3 is a title and its line, with a passive edge, not v0.956's once-a-day ability.
- **Mastery,** one track: a style mastered at 40 lines sent in it, and v0.956's ten hybrids, two skills both at V8's level. Comes on its own, with a note.
- **A quirk,** named from how you climb once you've had 30 goes: v0.956's tests (outside share, fresh or tired legs, the hour, lines well inside your grade, power and getting hurt, a long career). Comp Beast waits on comps. One quirk, not v0.956's two.
- **One kind of edge** for all of them, on the dials the rules already read: crux windows (by style, first go, indoors, the hour, your legs), gains, the odds of getting hurt, gas and nights. v0.956's "+n% odds" are windows ×(1+n). Every edge is said from its numbers. All numbers [proposed], v0.956's where it had them.
- **Fixed on the way:** an expedition's send chances were cached by skills and the day, so claiming a path or a mastery coming on left the odds shown stale until tomorrow; the cache keys on your edges now.
- **The harness moves,** because quirks and mastery come to every climber, bots too; every target still passes. The odds shown against the bots' trips: El Cap 54% / 60%, Cerro Torre 33% / 38%, Trango 24% / 24% (the harness now gives its made-up climbers the masteries they'd have).
- **Measured** (8 bots, 56 days): a bot hears of its first claimable tier on day 10 to 12; claimed paths barely move a bot's numbers (perfect hands); 7 of 8 balanced bots are named Stone Purist, because they climb outside almost always, so it's likely common for players who do too.

**Status (2 Oct 2026): 23.5 built: the scene, factions and stances.** Save v35, 0.998.0.
- **Two crowds** (Evan's call 5): the old guard (v0.956's trad, and the locals) and the gym crowd (its gym and comp kids), each from even. The You page says where you stand ("In with the old guard, but on the outs with the gym crowd") and each crowd's word, Distrusted to Beloved.
- **Five calls,** v0.956's dilemmas: a chipped project, a closure, a retrobolt, a stolen first ascent, a trashed crag. Put to you on arriving at a crag, now and then (none in the first fortnight; the bolting and the first ascent wait for you to be a local, and the first ascent for one of your own). Three answers; a fourth, the elder's, once the old guard listens to you. Each says what it does to whom.
- **Six echoes,** weeks later, for some answers: hold to what you said, or turn. Every call and echo goes in the journal, in your own words.
- **What standing gets you** (v0.956's clubs, folded in): the old guard's local knowledge, cruxes kinder outside, and at Beloved, permits on them; the gym crowd's coaching, sessions teach more. Taking up a calling moves the crowds, as it did in v0.956.
- **No rep, no followers** (Evan's call 7): a call moves standing, psyche and your legs; v0.956's media, purism and access fund have nowhere to go. All numbers [proposed], v0.956's where it had them.
- **Sends don't move the crowds,** unlike v0.956: its per-send drift would have both at Beloved within a season.
- **The harness moves a little** (bots answer every call with its first answer); every target passes. The e2e's five days end before the first call; the sim's tests cover them, and the sheet and the You page were checked by eye.

**Status (2 Oct 2026): 23.6 built: the Board.** Save v36, 0.999.0.
- **One weekly board** in place of v0.956's four (the café board, the daily and weekly challenges, the club jobs): 14 jobs, de-duplicated, three drawn on the seed each week. Sends anywhere, at your grade or a grade under it, outside, outside at a grade, of a style; training sessions; shifts.
- **Pitched at you:** a grade job asks for the grade you climb when the board goes up, so it means the same at V2 as at V12.
- **It pays itself** (the audit's auto-claim): the moment a job's done, its cash and a line; what isn't done lapses with the week, no penalty. The Board page in the journal shows the week's jobs, how far along each is, and the days left.
- **A bonus, not a living** (Evan's call 7): $8 to $18 a job [proposed]; a new harness target holds the best possible week ($54) under two days of the worst shift ($56). The bots took $14 to $15 a week off it.
- **The e2e** opens the Board page, and pays a job on day two: at V0, a grade job asks for V0, which is easy; it gets harder as you do.

**Status (2 Oct 2026): 23.7 built: the year and the Homecoming.** Save v37, 0.999.1.
- **A year is 56 days** (Evan's call 10), and the day the next begins, a card says what the last held, from what the game keeps: lines sent and the hardest, the crags, first ascents, expeditions home, the Record Book, the calls you made, what's in hand. A save already past a year counts it as said.
- **The Homecoming,** once a life (Evan's call 9): once two people are close (Regular or better), the You page offers it; tell them, and your next send outside, they're all at the bottom of it. v0.956's $200 and +20 psyche [proposed]. The audit's B6 is fixed: it counts people now, not diary entries.
- **No harness run:** bots never call a Homecoming, and a recap changes nothing.

**Status (2 Oct 2026): 23.8 built: criteria 2 and 3 pass; criterion 1 doesn't, and it's Evan's call how to make it.** 0.999.2.
- **Criterion 2 passes:** a new harness target has bots answer each call the way its echo comes back for and play on; every echo lands within a four-year career (most on the first seed; the latest on day 155).
- **On the way, three fixes:** calls only ever came on arriving by road, so a climber camped at a crag almost never saw one; they now come after a go too (the crag-day's roll, so no more often per day), and an echo can find you anywhere (two are set off the rock). A call could come while the van was broken down, and neither would let you answer the other (a stuck game); not any more. And answering any encounter left its outcome card, and anything queued behind it, waiting for the next thing you did; they come up now.
- **Criterion 3 passes,** as 23.1 left it: the Record Book holds all 42 of v0.956's feats, milestones and story cards, merged to 37 with their stories (10 waiting on unbuilt systems).
- **The e2e** plays a later life: day 57, a call answered with the elder's answer and in the journal, the first year's recap, a calling taken up, the Homecoming armed.
- **Criterion 1 fails, measured:** bots made with different origins, or different starts, play their first week almost identically. Classified by what they did (goes indoors and out, hours worked, sessions, drives, sends, cash), origins come out at 28% against 17% chance and starts at chance; with what the week taught them added, 32% and 30%. Why: week one is one crag of sixteen lines that everyone sends in much the same order, starts converge by day seven (a boulderer's power 12 against a technician's 5 on day one; 67 against 65 on day seven), and a bot plays every climber the same way. Making it pass is a design call, not a tuning one (see the 23.8 PR for the options).

**Status (2 Oct 2026): criterion 1 now passes, with Evan's A and B.** 0.999.3. All three of Phase 23's Done-when criteria pass; closing the phase is Evan's call.
- **A, the game: each origin starts its own first morning.** Sold It All has the café's morning shift already; the Gym Rat wakes in the gym car park with a day pass on; the Desert Local is at Roadside at first light; the Ex-Gymnast is at the gym, pass bought; the Late Bloomer has paid for full insurance; the Trust-Fund Kid has new shoes, a crash pad and a headlamp. Each says so, once, on the first morning. Nothing added to creation.
- **B, the bots: they play who they are.** Gym Rats and Ex-Gymnasts climb the gym first, crag or not; an Ex-Gymnast trains a session before climbing; a Trust-Fund Kid works only when the money's nearly gone; and every bot climbs what its start plays to among the easiest lines it hasn't sent (a boulderer boulders, a rope gun ties in, a technician goes for the technical lines), a project included.
- **The harness tells them apart** (a new target): a week's bots, described by what they did and went for first, are named by origin 87% of the time (chance 17%) and by start 48% (chance 25%). The boulderer and the all-rounder aren't told apart in week one: both go for the same lines. The target's bar (origins at twice chance, starts at half again) was set after the measurement, and says so.
- **The bots' line choice moves the harness a little:** first-month injuries 8% for a careful climber and 15% cold and reckless (3% and 8% before; the target is 35%); the first V5 go on day 18. Every target passes.

**Phase 23 closed by Evan's call (2 Oct 2026).** All three criteria pass. Carried: the boulderer and the all-rounder look the same in week one, and criterion 1's bar was set after the measurement. The CURRENT MILESTONE moves to Phase 16.

---

### Phase 16 — The spine: story, acts and endings   ✅ Closed

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

**Plan on the rebuild (2 Oct 2026), with Evan's calls.**

*Three problems first:*
- **The Line is out of reach of the hours.** Measured: the career bot reaches V14 around day 370 and V18 around day 900, and half the runs never get there in 900 days (8 runs, every start, human-ish hands). A day is 13 to 20 taps plus the climbing; at an unmeasured guess of 2 to 4 minutes a day, criterion 1's 15–25 hours is days 225 to 750. A V18 finale as the only ending would miss the window for almost everyone.
- **Nothing to end on yet.** The rebuild has no age, no retirement, no tally and no heir; dying soloing is its only ending.
- **Half the set-pieces aren't built.** Comps and the national team (v0.956's Act III), the documentary, the youth team, the mentee and an owned gym belong to Phases 17 and 18. The cast is Hazel, Sage, Dex and the dog.

*Evan's calls (2 Oct 2026), taking every recommendation:*
1. **Two endings.** Retirement is the ending everyone reaches inside the window, with a tally and an epilogue. The Line, a V18 myth's first ascent, is the best ending, for whoever gets there: the ceremony, then "retire now" or "keep climbing". No retune of the climbing curve.
2. **v0.956's age, with warning.** You start at 22 (the Late Bloomer at 32, its cost again) and age three years per 56-day year (v0.956's 18 days, called "age", never "year"). Retiring is offered from 30 (day ~145) and forced at 45 (day ~414, about V14–15), with a countdown from 43. No decline with age.
3. **The acts on what exists.** II The Local's Project (V4–V7: the Gorge, Moonstone, the Mesa, Dex's race), III The Road (V8–V10: the Big Stone, Wind River, El Cap, Cerro Torre), IV The Crucible (V11–V15: Obsidian Tower, Trango, Hazel's Pilgrimage), V The Line. Beats from v0.956's quests that run on what's built; comps get their slot with Phase 18.
4. **The heir is a kid you've coached,** named at retirement. A short creation (a start and an origin); inherits the van, your named first ascents on the topos under your name, and the Record Book as the family's; mode and settings carry. A first quest of their own: the line you named. Dex coaches them if you were allied. The gym waits on Phase 18.

*The slices:*
- **16.1 Age and retirement.** Age from the day and the origin; the countdown; "Hang it up" from 30; forced at 45; the tally ("A climbing life"): hardest, sends, first ascents, crags, trips, scars, the calling's rungs, the roads taken and not, the people, an epitaph from what you did. Save change.
- **16.2 Acts II–V.** The goal ladder generalised from Act I to five acts as content, each at a fixed beat count, each ending in a scene, not a toast. Save change.
- **16.3 The Line.** A myth's first ascent gets its own sequence: the naming at the fire, Hazel, Sage, Dex and the dog by their bond, credits, then the choice.
- **16.4 Epilogues,** keyed to the calling's rungs, paths, the crowds, stances, the dog, the people and the book; criterion 2's five things named from the save.
- **16.5 The next generation.** The heir, what carries, the forebear on the topos and in the book, their own first quest. Save change.
- **16.6 The harness and the e2e.** Criterion 1 measured (the bots' days to retirement, taps per day, and a stated minutes-per-day, carried to testers for the real hours); criterion 2 checked on bot careers; the e2e retires a climber and starts the heir.

*The risk:* criterion 1's hours rest on a minutes-per-day guess until someone plays it. The ending inside the window is retirement, so the 15–25 hours mostly sets the age clock; if testers play faster or slower, the clock's days are the dial.

**Status (2 Oct 2026): 16.1 built: age and retirement.** Save v38, 0.999.4.
- **Age,** v0.956's clock: 22 at the start, a year every 18 days (about three to the 56-day year); the Late Bloomer starts at 32 again, and its button says what that costs ("10 years fewer before your body calls it"). The You page says how old you are and what's coming. No decline with age.
- **Hanging it up** is yours from 30 (day 145; day 1 for a Late Bloomer), from the You page, asked first: it's for good.
- **Your body calls it at 45** (day 415; day 235 for a Late Bloomer), the first night in the van: never on a wall or away, it waits for you to get down. A morning line at 30, 43 and 44, and from 43 the You page counts the days.
- **The tally, "A climbing life":** your age and years on rock, who called it, an epitaph from what you did (v0.956's, less the rep and sponsors: a myth's first ascent, a summit, first ascents, V11 and up, or a life lived on rock), then only what happened: sends, inside and out, and the crags; the hardest; first ascents; summits; the calling's rungs; the roads you took and the ones you never walked; old injuries; the people close at the end; the dogs; the Record Book. A reload comes back to it; then a new climber. The heir is 16.5's.
- **The Record Book's "The Long Game"** comes in: retiring earns it, so the book holds 28.
- **An old save** past day 379 has its clock held back to 43 on loading, so nobody loads into their last night unwarned.
- **No harness run:** no bot retires, and the season (56 days) and career (224) end before 45. The Late Bloomer at 32 is v0.956's cost and is now on top of its less spring (0.88): that may be one cost too many, [proposed], for Evan.
- **E2e:** the day-five climber at day 380 sees the countdown, hangs it up, gets the tally, reloads to it, and starts again.

**Status (2 Oct 2026): 16.2 built: Acts II to V.** Save v39, 0.999.5.
- **Five acts, one ladder:** Act I as it was, then four more at a fixed count (5, 5, 5, 4), as content checked by tests, each stage asking for something that exists and said from its own numbers.
  - **II, The Local's Project (V4–V7):** three sends outside at V4; past Roadside to the Gorge; two at V6; Moonstone; the project, a V7 outside (v0.956's quest of that name).
  - **III, The Road (V8–V10):** The Big Stone; Send Season's V8; The Nose on El Cap; Hazel's Pilgrimage, a V9 at Wind River; a V10 outside.
  - **IV, The Crucible (V11–V14):** The Crucible; The Tower's Due, the Obsidian Tower topped; Cerro Torre; Trango; a V14 outside.
  - **V, The Line (V15–V18):** the Anvil's grade at The Crucible; a V17 outside; reading a myth (the line under it sent); a myth's first ascent.
- **Each act ends in a scene,** not a toast: what happened, then a line for each of Hazel, Sage and Dex who's close enough to be there, and its pay [proposed]: $120, $200, $300, $500, each said where it came from. A few stages train a skill, as Act I's did.
- **Evan's call on Act V:** forced retirement at 45 (day ~415, about V14) made The Line, V18 at day ~900 for the bots, unreachable. Now finishing Act IV puts your body on hold: in Act V there's no countdown and no forced end, and hanging it up stays yours. Most players will retire inside the window; The Line is the long game for whoever keeps going.
- **An old save** past Act I moves on, quietly, past the later stages it's already done (no cards, no pay for them), to the first it hasn't.
- **The race isn't a stage:** it only starts once you've met Dex, and a stage that waits on it could wait for ever.
- **E2e:** the later life is past Act I, and the You page shows "Act II, The Local's Project · 1 of 5 · Earn some trust". The act-end card is checked by the sim's tests, not played.

**After 16.2, Evan's calls (2 Oct 2026).** 0.999.6.
- **Act IV has one expedition:** Cerro Torre stays; Trango's stage is a V12 outside, and the stages run in grade order (The Crucible, Cerro Torre, V12, the Obsidian Tower, V14). Two expeditions were $6,700 between a player and the act's end.
- **The Late Bloomer starts at 26,** its only cost (the 12% slower power and fingers is gone): your body calls it on day 343, 72 days before anyone else's. It's the speed-run origin, and it must still be possible to reach the ending: measured, the Late Bloomer bots reach V13 around day 300 and are still V13 on day 343, where bots of no origin reach V14 between days 365 and 403. Reaching Act V (and the clock on hold) as a Late Bloomer takes a player about a tenth faster than the bots, which is inferred, not shown: no bot can get past Act III yet (they don't go on expeditions or climb walls; 16.6's).
- **The tally is plain text,** not the red of an outcome note.
- **The e2e's intermittent toast problem was the check, not the game:** a sheet scrolled down clips the rows above it, but their boxes still report where they'd be, up by the HUD where the toast is. It counts what you can see now.

**Status (2 Oct 2026): 16.4 built: epilogues.** 0.999.6.
- **What became of you,** on the tally before the numbers, from what the save kept: where you came from (each origin, said back), your hardest first ascent by name and crag, the summits, the path you went furthest on (its title at the top, or how far), the quirk the scene named you, your masteries, the calling and how many of its rungs, the first and last calls you made in your own words, either crowd at either end, Hazel, Sage and Dex by how close you got, the dog (with you, or the collar in the glovebox), the Homecoming, and the page of the Record Book you'd show people.
- **Criterion 2 passes:** each line says whether it names something you did; a new harness target holds every career bot's ending at five or more (fewest 6, at day 224), and the bots take no calling and claim no path, which a player would.
- **The people and the dog** moved out of the tally's numbers into the epilogue, so nobody's said twice.
- **E2e:** the tally after hanging it up has the Sold It All climber's origin said back and the Record Book's page.

**Status (2 Oct 2026): 16.3 built: The Line.** 0.999.7.
- **A myth's first ascent ends the story in its own sequence,** in place of the last act's card: **the naming** at the fire (the name you gave it, on a scrap of cardboard against the cooler, its grade and crag, and the pay); **who was there** (Hazel, Sage and Dex, each by how close you got, and the dog; alone at the fire if nobody is); **the credits**, under the story's last title; then **what now**: hang it up, "a perfect ending", or keep climbing, with your body still waiting on you.
- **After The Line, hanging it up is yours at any age** (a speed-run Late Bloomer could get there before 30 in principle).
- **No harness run:** the Act V pay was already there; the rest is how it's shown.
- **E2e:** a climber on Act V's last stage with the myth put up, close to Hazel and with the dog, walks a few steps; the naming, who was there, the credits and the choice play in order; they keep climbing, and the book's cards for the first ascent follow.

**Status (2 Oct 2026): 16.5 built: the next generation.** Save v40, 0.999.8.
- **The kid you coached climbs on** (Evan's call 4): from the tally, "Climb on as the kid you coached", or start a new climber with nothing carried. The kid is made on the next screen, a name, a start and an origin ("Who has Robin's keys?"), in the same world, the morning after you hung it up, at 22 on their own clock, with their own talents dealt.
- **What carries:** the van as it is and whatever you owned (the Dream Rig and the rest); the trips you paid for; the dog; how you climbed, a rope or none (the kid isn't offered Free Solo, it's the family's); the Record Book, as the family's; and your first ascents, on the topos and the send card under your name ("First ascent: Robin"). Not the money, the people, the sends or the expedition book: those are theirs to earn.
- **Dex coaches the kid** if he was a Regular or closer with you: sessions teach 15% more [proposed], said on the first morning and on the You page.
- **Their own first act, Their Shadow,** in place of Act I and at its pace, five stages: a first send, two outside (your tick marks at Roadside), a regular who learns their name, V4, then **a go on the line you named** (the one of yours easiest to get to; done at once if you left none). Then Acts II to V as anyone's.
- **Criterion 3 passes:** generation 2 starts with a first quest of its own and inherits what you can see: your lines on the topos, the book, the van, the dog, and a family row on the You page (generation, your lines, Dex's coaching). The kid's epilogue says who they climbed on after, and their line once they've sent it.
- **No harness run:** no bot retires, so none climbs on.
- **E2e:** the climber who hangs it up at 43 had put up "Second Wind"; their kid, Jo, a Desert Local, climbs on: the family row reads "Generation 2, after Robin. Their lines: Second Wind (V7, Roadside Crag)", the act "Act I, Their Shadow · 1 of 5 · The keys", and the save has the first ascent under Robin's name and the book kept.

**Status (2 Oct 2026): 16.6 built: the harness and the e2e.** 0.999.9. All three of Phase 16's criteria now pass; closing the phase is Evan's call.
- **The career bot plays the story:** when a stage asks for an expedition or a wall, it saves for it (the trip and the bills while it's away), books and climbs it the way the harness's expeditions always were (the loop now shared), and racks up walls with Hazel asked along, a bivy when the light goes, off it in the rain or after a day with nothing gained, at the wall's own grade, and not with its cushion gone. It leans toward the crag a stage names. It answers whatever's waiting when it gets home.
- **A game fix found on the way:** an invite lasted only its day, so a partner who bivied on a wall with you was gone in the morning and the next pitch had nobody to belay it: a two-day wall couldn't be finished. Whoever was on the wall with you is still there the next day.
- **Criterion 1 passes, at a stated pace:** a new harness section plays careers to the day they hang it up, from every start and as a Late Bloomer each. At 4 seconds a tap and 15 a go [proposed, PACE, until testers time it], creation to the ending takes 18.4 to 20.4 hours (median 19.3), every career not on The Line ends by day 480, none refused or stuck, one line a day. The bots average 27 to 32 taps and 3.3 to 4.1 goes a day.
- **The story, measured:** every career sees Act III end (median day 288); one in eight finishes Act IV, on day 415. No Late Bloomer reaches Act V before its body calls it at day 343: the speed run is still unshown at bot pace.
- **Criteria 2 and 3** pass as 16.4 and 16.5 left them (the epilogue names six or more things in every career; the heir's own first act and the family's history).
- **Found, not fixed (Phase 21's content, a balance call): the Crucible's hardest boulders are far too soft.** A V12 climber with human hands sends its V15 boulder 95% of goes, the V16 53%, the V17 17%, and the V18 myth, five moves and one crux, 9%; with careful hands (the meter read exactly, a skilled player's ceiling) all of them first go. The V18 sport myth (38 moves, two cruxes) doesn't go at all. So The Line can be done at V12, and once Act IV is done Act V falls in a day: the one bot that finished Act IV did The Line the same day.

**Climbing above your grade (3 Oct 2026), Evan's call: a limit, tighter windows, and more cruxes over your grade.** 0.999.10. All [proposed], in `OVER`.
- **Why the Crucible went soft:** the climber the harness called V12 had trained power to V15, and a window counted the style's own level however far past your grade it ran; and the meter steps at 60 a second, so a window narrower than a frame still passed whenever a frame landed in it.
- **One style carries you a grade and a half past your grade,** no further.
- **Past a grade over, windows close faster** (two grades over is now about a ninth of at-grade, where it was a sixth), **and at three over they're shut:** there's no window to hit.
- **The limit:** a line three or more grades over you, by the grade it's given (a sandbag keeps its secret), won't let you tie in: "Beyond you, for now. Come back a better climber." A new climber (about V0.8) is turned away from the gym's and Roadside's V4 and V5 until about V1.1; those windows were already about a twentieth of at-grade.
- **From a grade and a half over, a line climbs with more cruxes for you than the topo shows:** one, then two from two and a half. They go where the line has room, above the first bolt or piece, on the beta of the line's own crux nearest them, and a fall at one counts there. The beta sheet says so ("Over your grade, it climbs with 2 more cruxes than the topo shows"); the fall sheet says "Off at a move that’s a crux for you". From one grade over, where everyone projects, half the career bots hadn't finished Act III by day 415; from a grade and a half, all did.
- **Measured:** the career bot that's V11 with power at V15 sends Apparition (V15, truly V14) 42% of goes, and The Anvil, Event Horizon and both myths never, careful hands included (before: 95%, 53%, 17%, 9%, and every time with careful hands).
- **Harness:** every target passes. Criterion 1: median 19.4 h (19.2 to 20.4). Act III ends in every career (median day 281.5, where it was 288). The career bots reach V10 later (median day 178, was 162). On the way, one target failed: two of sixteen careers had a wet day with nothing to try at about V6, the crags soaked, the Cove out of season, the Mesa not yet open, the gym sent, and the Cave's week down to its V10 to V12, now beyond them (before, those counted as something to try at odds near nothing). Evan's call: the Cave sets V5 to V11 with two at V7, and none do now.
- **E2e:** the day-one climber sees The Pump climb with one more crux for them, and falls at the crimp rail as before.

**Phase 16 closed by Evan's call (3 Oct 2026).** All three criteria pass. Carried: the Late Bloomer's speed run (still not reached at bot pace) and Act IV finished by no bot inside the clock (0 of 8). The wet-day gap at V6, by Evan's call: the Cave sets V5 to V11 with two at V7, where it set V5 to V12, so a V6 has work there on a wet day. The CURRENT MILESTONE moves to Phase 17.

---

### Phase 17 — The people   ✅ Closed

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

**Plan on the rebuild (3 Oct 2026), with Evan's calls.**

*What's there (a survey of the rebuild against `docs/audit/social.md`):*
- **Three people and a dog.** Hazel (your neighbour at the Lot, there from day one), Sage (a partner, the only arc: four beats ending "partners for good") and Dex (the rival: his own grade curve, the first-ascent race, overnight news), and Scout. The knocks and the hitchhikers (v0.956's text) have no names. Bond runs on five tiers, a point a day climbing together. Four talk trees, 29 nodes.
- **v0.956's problem is turned round.** It had too many people, about 100 first names with 13 collisions and 11 NPCs on 6 sprites; the rebuild has too few. Criterion 1 holds trivially, and stays a rule as the cast grows.
- **Nothing yet** for romance, crew drama, life timers, gifts, holidays, walker chats, shopkeepers' lines, busy-texts, send reactions or v0.956's family back home. The hitchhikers do remember your choice (v0.956's didn't).
- **Looks are written by hand** (`view/paint/people.ts`), one each for you, Hazel, Sage and Dex, and five strangers. The "layered look generator" in the scope was v0.956's; at a cast of about ten, hand-written looks are the cheaper road.

*Three problems first:*
- **Criterion 3 is most of a career.** New social content every in-game week through day 300 is about 43 weeks; Sage's arc is done inside Act I. At a beat a week across the cast, that's 40-odd authored beats before the ambient lines.
- **Criterion 4 has no baseline.** v0.956's repeat rates are the audit's Monte Carlo (inferred), and the rebuild has none of those pools. The harness can measure the rebuild's own: every line the game says is in `BotRun.lines` with its day.
- **The harness stops short.** Career runs are 224 days; criterion 3 needs 300, which the ending section (to day 480) already plays.

*Evan's calls (3 Oct 2026), taking the recommendations on 1, 2 and 4; 3 is open:*
1. **Who comes back.** A cast of about eight, with no shared names: Hazel, Sage, Dex, plus v0.956's Ray (a local elder who retires and hands you his crag), Frank (a van-lifer whose rig dies and who parks next to yours), Mara and Rico (partners, rifts and romance), and Tam (an elder with his own rules, slowing down).
2. **Romance:** in, with Sage and one of Mara or Rico, past v0.956's four beats: an anniversary, the first fight, a shared van decision, their chance against yours, a break-up with real text. Forks change who's around.
3. **Life timers on the age clock** [proposed, open] (an age year is 18 days), so Ray's last season and Tam's slowing land inside a career, not after it.
4. **The family back home** as a short arc across a year, with "come home for good" as a way to hang it up: a third ending beside retirement and The Line.

*The slices:*
- **17.1 The cast:** the new people, a look each, where and when they turn up; a test that no two share a name or a look.
- **17.2 Milestones:** three or more and a resolution for each core character, Hazel and Dex included; the arcs' forks change availability.
- **17.3 Lives that change:** the timers, injuries and moves away and back.
- **17.4 Romance:** Sage and one of Mara or Rico.
- **17.5 Giving:** gifts, invitations ("bring Frank to the fire") and naming a line after someone.
- **17.6 Holidays and the family arc,** as scenes with your people in them.
- **17.7 Where players read most, and the harness:** walker chats, fire outcomes, busy-texts and send reactions; targets for criterion 3 (new authored lines every week to day 300) and criterion 4 (repeat rate at day 100 against the audit's figures).

*The risk:* writing volume, as the phase said. Lines players see most come first, at a fixed beat count a character.

**Evan's call on 3 (3 Oct 2026):** the life timers run on the age clock.

**Status (3 Oct 2026): 17.1 built: the cast.** 0.999.11. No save change.
- **Five more people,** v0.956's, each where and when they climb [proposed, `CAST`]:
  - **Ray,** Roadside's old hand, on the guardrail with a thermos on dry weekend mornings: he bolted half the wall and fell off the other half.
  - **Frank,** passing through for nine years, his box truck in the Lot on two evenings in five (one in five in winter), from the third night: the first two at the fire are Hazel's.
  - **Mara,** at the Gorge on dry days, the least around and the hardest climber: "Don't celebrate if you get it."
  - **Rico,** in the Cave most days and out at Moonstone on some dry ones, loud about all of it.
  - **Tam Okonkwo,** at the Mesa on dry mornings, done before the sandstone heats up, with five good seasons left, maybe (the timer is 17.3's).
- **Mara, Rico and Tam are partners,** as Hazel and Sage are: they belay, a day climbing near them counts, they turn up more as you get closer, and you can ask them out. Ray and Frank are locals: a sit once a day is worth a bond.
- **Each has a meeting and an ordinary day;** their milestones and resolutions are 17.2's.
- **Criterion 1 holds:** a test that no two people, in the cast or in town (Wren, Otis), share a name, and that no two looks, or shirts, match each other's or a stranger's.
- **Harness:** every target passes; the career bots, who don't talk to the new people but climb near them, reach V10 on a median day 176.5 (was 178), and Act III ends in every career (median day 298, was 281.5).
- **The download** is 338.3 KB of its 340 KB budget. The rest of Phase 17 is mostly writing: *Evan's call (3 Oct 2026), the budget goes to 360 KB.*

**Status (3 Oct 2026): 17.2 built: milestones.** 0.999.12. No save change.
- **An arc for everyone,** as Sage's always was: four beats each for Hazel, Dex, Mara, Rico, Tam, Ray and Frank, due at bonds 1, 3, 5 and 7 and five days apart, a speech mark over them when one's waiting. The fourth is the resolution, and makes them ride-or-die:
  - **Hazel:** her van's starter; her sister on the phone; her old project with one rusted bolt; the coffee pot, and "I'm not going anywhere." It plays at the crag, so the Lot's mornings stay the tip and the coffee.
  - **Dex:** "Spot me. If you're not busy"; his sponsor drops him; a day of trading goes on his project; two coffees, and why he trains now.
  - **Mara:** your lazy feet; a day on belay, saying nothing; her pulley; her send, and the hug she'd like you to forget.
  - **Rico:** the video of your fall, set to music; a tire or a week's food; the city gym; his send, and half the crag learning your name.
  - **Tam:** stand on the ledge till your hands stop; Ruth's rope; "You lead. I'll follow. That's the order now"; the top of the long route.
  - **Ray:** his first bolt; a rusted one replaced; the line he never sent; his hand-drawn topo of the wall.
  - **Frank:** the leak, gone; a card to a daughter who's nineteen now; a tow down the hill; the map he stops reading.
- **Every arc forks, and most forks change who's around** [proposed, `ARC`]: Hazel goes home to her sister's for five days, Dex off training for five, Mara keeps her distance for three after a no and is out twelve with her finger, Rico works four days for the money or goes fourteen to the city gym, Tam rests his knees four, Frank's truck is at the garage seven. Ray's comes with his last season (17.3). Presence now honours a stint away for Hazel and Dex too.
- **Dex can be known now:** a day at the same crag counts toward him, as it does for partners. Before, his bond never moved, so his close epilogue line and his coaching of your heir were out of reach.
- **Each new person has an epilogue line,** close or far, from your bond alone (the arcs needn't have finished).
- **Criterion 2:** a test that every core character has four beats, the last a resolution with an epilogue line, and that the forks change availability; Mara's and Hazel's arcs are played through.
- **Carried:** a partner who belays you before you've spoken to them meets you silently, so their first meeting never plays (Sage's always could; Mara and Tam belay). The bots don't play the new arcs; criterion 3's measurement is 17.7's.
- **The download:** 342.5 KB of 360.

**Status (3 Oct 2026): 17.3 built: lives that change.** Save v41, 0.999.13. On the age clock, 18 days to a year (Evan's call), all [proposed] in `LIFE`.
- **Ray's last season:** from the sixth year (day 91) he tells you, once, if you know him; from the seventh (day 109) he doesn't come out. That night his thermos is on the guardrail with a note, "It's your wall now", and his topo: every way up Roadside you hadn't found is yours (told, so a line you hadn't tried flashes, not onsights).
- **Tam's five good seasons,** as years of knowing him: from the third he comes out half as often and tells you why; from the fifth he's done, with a note on your windscreen.
- **Frank's rig** dies four years after you meet him, and he parks it next to yours: from then he's at the Lot every evening.
- **Partners off the rock for a stretch:** from the second year, each of Sage, Mara, Rico and Tam has a 35% chance a year of four to twelve days hurt or away, from the seed; you hear overnight when someone you know goes and comes back. Hazel's the constant.
- **A first meeting waits for your first word** (save v41: `talked`): a partner who belays you before you've spoken has met you, but their meeting plays when you first talk. An old save counts everyone it knew as spoken to, since it can't tell.
- **The moments you've heard** (`life`) are kept, so Ray's last season and Frank's truck play once.
- **Tests:** each timer, the stints (never Hazel, never the first year), the overnight news, Ray's topo, the meeting kept for the first word, and a real v40 save loading.
- **Harness:** every target passes, but partners away for stretches cost the career bots belays: Act III's median end moves from day 298 to 336 (8 of 8 still end it), V10 from day 176.5 to 179, and criterion 1's median from 19.4 to 20.1 hours. Worth watching as 17.4 to 17.7 add to it.
- **The download:** 343.8 KB of 360.

**Status (3 Oct 2026): 17.4 built: romance.** Save v42, 0.999.14. Evan's call: Sage and Mara. Numbers [proposed] in `ROMANCE`.
- **One a life.** The spark comes once each, to Sage or Mara, at a Partner's bond, after any of their own arc's beats that are due: lean in, or stay friends (and it isn't asked again). While you're with one, the other's spark doesn't come.
- **Five beats, a week apart, each forking:** the spark; the first fight (apologise, or dig in and they climb elsewhere for three days); one van or two (hers, yours, or both, parked close); their chance against yours (Sage's guiding season, Mara's expedition: go, and they're away three weeks, or ask them to stay); and together.
- **The end, with real words:** three weeks without a day climbing together, their time away not counted, and the next time you see them it's over, in a scene of its own. Then they keep their distance ten days and you're Regulars again; no romance after it, with anyone.
- **A year together** is noticed overnight, every year, on the age clock.
- **The epilogue** says whether you're still together or were for a while; the You page says "Together".
- **No harness run:** the bots don't talk, so no bot is ever in one; nothing they do changes.
- **The download:** 345.9 KB of 360.

**Status (3 Oct 2026): 17.5 built: giving.** Save v43, 0.999.15. Numbers [proposed] in `GIVE` and `content/gifts.ts`.
- **A gift a week for each of them,** from their ordinary talk, at its price on the button: good coffee for Hazel, a secondhand guidebook for Sage, the good chalk for Dex, finger tape for Mara, a burrito for Rico, a thermos for Tam, new bolts for Ray, a fan belt for Frank. A bond each, and their word for it; never more than a day climbing together is worth, and it costs money where a day out doesn't.
- **A line named for someone:** naming a first ascent, "For someone" lists everyone you're Regulars with or closer, each with a name of their own to start from (Hazel's "Coffee's On", Mara's "Don't Celebrate", Tam's "Five Good Seasons"). They hear about it, two bonds' worth, and the epilogue remembers it.
- **Frank to the fire:** on an evening his rig's in, ask him over; he sits with you and Hazel for the night, and the games count him in (he doesn't play cards for money).
- **Dex asked out,** as a partner is, at the same crags and the same bonds.
- **No harness run:** the bots don’t give, name lines for anyone or ask anyone to the fire, so nothing they do changes.
- **The download:** 347.3 KB of 360.

**Status (3 Oct 2026): 17.6 built: holidays and the family.** Save v44, 0.999.16. Numbers [proposed] in `HOLIDAY` and `FOLKS`; text in `content/folks.ts`.
- **Four holidays a year,** one each season on its middle day: Harvest, Longest Night, First Dry Rock, Midsummer. Slept at the Lot, it's a night at the fire in a card of its own, with a line for each of the people you're Regulars with or closer who are around (not away, not on a stint, not retired or stopped): a lift to psyche, and a day together with each. Nobody close, and it's a quieter card.
- **The family back home:** a call every two years on the age clock from the first, five in all. It's a missed call overnight, and waits on the phone in the van till you call back: your mum asking what you're eating, your dad's birthday, your sister's baby, your dad's scare, then the room that's still yours.
- **Home for good, a third ending:** the last call asks you home. Say yes and it's over, as hanging it up is, with its own words on the tally ("You went home for good") and first in the epilogue. "Not yet" keeps you climbing, and nobody asks again. Going home is never a call's first answer.
- **Tried first and changed:** the holidays and the calls came at bed, like a knock, and stopped the night for an answer; eighteen of the sim's tests and the e2e sleep on those nights, and a player would too. Now neither stops a night.
- **Harness:** every target passes; the bots sleep at the Lot on holidays like anyone, and get the lift: V10 on a median day 180.5, Act III ends in every career (median day 296.5, from 336, the holidays' days together making up for 17.3's stints).
- **The download:** 349.4 KB of 360.

**Status (3 Oct 2026): 17.7 built: the lines players read most, and the harness for criteria 3 and 4.** Save v45, 0.999.17. Numbers [proposed] in `FIRE_TALK`; text in `content/ambient.ts`.
- **A night at the fire is said by whoever's there:** Hazel (55 lines), Sage (30) and Frank (26), where it was one line. Ten of each are open from the night you meet, and one more each week you've known them, heard before any you've heard already, so the later ones belong to people who've known you a while. When all the open ones are heard, they come round in a seeded order, none twice till the rest have.
- **A send is said back** by whoever was with you (your belayer, or a partner or Dex at the crag): eight lines each for Hazel, Sage, Mara, Rico, Tam and Dex, once a day each.
- **A night on a big wall's portaledge** is said by whoever's up there with you: twelve lines each for Hazel, Sage, Mara, Rico, Tam and Dex, in order, then round again. A wall was the longest stretch the game went quiet.
- **Words (Phase 5's guide):** US English in Phase 17's text (mom, gray, neighbor).
- **Save v45:** `PersonLog.heard` and `ledge`, how many of their fire and portaledge lines you've heard; a real v44 save loads.
- **The harness reads everything:** a social bot (`social`) sits at the fire every night, plays everyone's moments as they come due (meetings, arcs, lives, romance; the first answer, never home) and calls home back. The other bots leave the people be, so their targets measure what they did. "The people" runs it to day 300, two seeds a start.
- **Criterion 4 passes:** by day 100 each ambient line has been shown 2.2 times on average, against about 7 for v0.956's campfire outcomes (the audit's Monte Carlo, inferred).
- **Criterion 3 nearly does:** 334 of 336 bot-weeks see something new. The two that don't (weeks 40 and 42, one run each) are a third big wall with the same partner, whose twelve portaledge lines the first two used up. More lines for the usual wall partners would close it, at about 1.5 KB.
- **Harness:** every other target passes, unchanged from 17.6 (V10 on a median day 180.5, Act III ends in every career, median day 296.5). Letting every bot play the people's moments cost a working climber three stuck nights and one career Act III, so only the social bot does.
- **The download:** 356.2 KB of 360.

**Then, by Evan's call: twenty portaledge lines each for Hazel, Sage, Mara, Rico and Tam** (Dex keeps twelve), the usual wall partners. Criterion 3 passes: every week to day 300 has something new in all 8 runs, and in 16 with eight seeds the lines weren't written against. 0.999.18. **The download:** 357.3 KB of 360.

**Phase 17 closed by Evan's call (3 Oct 2026).** All four criteria pass. 1: no two of the cast share a name or a look (17.1's test). 2: Hazel, Sage, Dex, Mara, Rico, Tam, Ray and Frank each have an arc of at least three beats and a resolution (17.2). 3: the social bot sees something new every week to day 300, 16 of 16 runs. 4: ambient lines come round 2.2 times each by day 100, against about 7 for v0.956 (the audit's figure, inferred). Carried: crew drama where two partners fall out because of you; walker chats, busy-texts and shopkeepers' fillers (17.7 wrote the fire, sends and the portaledge, the lines the bots read most); only the social bot plays the people's moments, so the other targets don't measure a player who does. The CURRENT MILESTONE moves to Phase 18. The download is 357.3 KB of 360, and Phase 18 adds text: the budget will need a call.

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

**Plan on the rebuild (3 Oct 2026), with Evan's calls.**

*What's there (a survey of the rebuild against the scope):*
- **Five jobs, no minigames.** Café (and its double), diner (with tips), coach, setter and warehouse (`content/jobs.ts`): a shift is one tap for its pay, ranks by shifts signed up for and worked (some gated by grade), warnings and the sack. The scope's "keep the setter puzzle, fix the warehouse and courier" is v0.956's; here every minigame is new. No clerk or courier, and no "regulars graduate" arc to drop. No leave.
- **Nothing yet** for comps, media, sponsors, followers, an owned gym, guiding, or buying a crag. Phase 23 left hooks waiting on them: the scene path and the comp-beast quirk (comps), the Influencer calling (followers and sponsors), and the Record Book's comp, Games, famous, sponsored and pro entries.
- **Done already:** path tiers gate at V4 / V9 / V14 (23.4), and Mastery comes from sends.
- **Busking** is the one piece of work with skill in it (a chord-timing set), and the model for how a minigame pays: worse than a job at first, better with practice.

*Three problems first:*
- **Taps.** Five minigames make a shift take longer. Phase 16's 15–25 hours and the e2e's day-three tap count both feel it. Every minigame gets a "just work it" tap that pays a plain shift; playing it well pays more.
- **Followers come back** (Evan's call, against Phase 23's): a media stat of its own. The two crowds' standing stays what it is.
- **Criterion 2 needs four bots:** a career bot for each ladder, played to its capstone inside the clock.

*Evan's calls (3 Oct 2026):*
1. **The download budget goes to 400 KB.**
2. **All five jobs get a minigame,** the setter's puzzle first as the template. No new jobs.
3. **The full media ladder, followers included:** followers, heat and discourse, real sponsors against brand ones, obligations that cost days and clash with climbing windows, a rival athlete for the headline deal, and the documentary.
4. **Business:** setter, then head setter, then your own gym, with an owner's draw and a line in the morning report. Late money buys and bolts a crag. The guiding outfit, sponsoring a youth athlete and funding an expedition team carry.

*The slices:*
- **18.1 The setter's puzzle:** the minigame framework (a shift's panel, "just work it", pay by how it went) and the first minigame; rank perks and leave.
- **18.2 Café and diner:** the café's queue and timing; the diner's tables and tips.
- **18.3 Coach and warehouse:** the coach's roster, tied to each client's project; the warehouse's push-your-luck, with the incentives fixed.
- **18.4 The comp ladder:** league nights, then the Circuit, Nationals, the World Series and the Games. Opt-in, fixed fields, points that decay, rounds on the real climbing; the Games as capstone. Opens the scene path, the comp-beast quirk and the comp records.
- **18.5 Media:** followers, heat and discourse, sponsors and obligations, the rival athlete, the documentary as capstone. Opens the Influencer and the fame records.
- **18.6 Your own gym, and a crag:** head setter to owner, the draw, the morning line; buy and bolt a crag.
- **18.7 The ladders:** one screen for all four (outdoor: projects, first ascents, the crew project, expeditions, a guidebook of your own lines, The Line); a career bot per ladder for criterion 2.

**Status (3 Oct 2026): 18.1 built: the setter's puzzle, and leave.** Save v46, 0.999.19. Numbers [proposed] in `PLAY`, `SETTING` and each job's `leave`; content in `content/setting.ts`; rules in `work.ts`.
- **A shift with a minigame opens it.** "Set problems for a shift" shows the day's brief and the bucket. "Just work the shift" is one tap inside and pays the shift. Played, it pays the shift and up to 40% more for a good set; a weak set pays the shift and no more.
- **The brief:** a wall (the slab, the vertical, the overhang, the roof, each suiting some kinds of move), the grade the desk wants (rising with your rank), and the week's crowd (beginners, the regulars, the comp team, kids' club), each wanting something different. A hand of thirteen moves' worth: seven for an apprentice, ten for the head setter, always with a rest.
- **Hang five in order,** with the set's grade and its checks live: the grade, one crux, a rest before it, no dyno straight after a dyno, three kinds of move, what suits the wall, what the crowd wants. The gym says how it went.
- **Not solved (criterion 3):** brute force over sixty days' briefs, more than half have a different best set, and none is best on more than a tenth. Best play scores about 0.6 for an apprentice and 0.8 for a setter, against 0.4 to 0.5 for holds picked at random. v0.956's flaw (at full craft, most random sets came out classic) has nothing to stand on: there's no craft stat, and the brief moves.
- **Leave, a rank's perk:** days a year at each job, more as you rise, none for the first rank. A signed-up shift you miss with leave left is called in, not a warning; trips booked at short notice use it too.
- **The bots don't play** the puzzle: they work the shift, so their pay is as it was. Leave changes their warnings only.
- **Harness:** every target passes, the rest unchanged; the climber bot (not a target) had one stuck night, against none before.
- **E2e:** day two's setting shift hangs five holds and checks the set's grade, live, and the pay with its bonus.
- **The download:** 359.9 KB of 400.

**Status (3 Oct 2026): 18.2 built: the café's rush and the diner's floor.** 0.999.20. No save change. Numbers [proposed] in `RUSH` and `FLOOR`; content in `content/setting.ts`; rules in `work.ts`.
- **A shift with a minigame keeps its plain row,** one tap as ever, and gets a row to play it beside it ("Set to the brief", "Work the rush", "Work the floor"). 18.1 put "just work it" inside the setter's sheet; day three's e2e, a café shift on Phase 11's 20-tap budget, had no tap to spare, so every job's plain shift stays a tap. The double has no play row.
- **The café's rush:** a queue of five to seven (more as you rise), each a drink (how long it takes to make, what it tips: not in proportion, so a pour-over's slow and pays and a mocha's the trap) and how long they'll wait; regulars wait longer and tip double. Tap the orders in the order you'll make them; each says when it's done, and whether they waited. Scored against the best order that queue allowed.
- **The diner's floor:** three waves of three or four tables (more as you rise), a party and a mood each, and the kitchen's pace for the day. Take on tables from each wave without seeing the next; a table stays through the next wave, and every table on your section makes the others wait, the fussy (who tip best) most, and more when the kitchen's slow. Scored against the best the floor allowed in hindsight. Tried first as tables packed into the shift's minutes, it was a knapsack the obvious rule (best tip a minute) solved at 98%; then as one pick of tables, which "add the table that helps most" solved at 99%. The waves are what make it a read.
- **Not solved (criterion 3), tested:** at the café, tips-first and who-gives-up-first score under the bonus's start (0.8 of the best); random play about 0.6. At the diner, every table and no fussy tables score about 0.5 to 0.67, under its start (0.65); choosing the best each wave with what you can see scores about 0.94.
- **Pay:** as 18.1, the shift and up to 40% more, from each game's start.
- **E2e:** day one looks at the rush before its double, plays a queue through, sees it scored, and leaves without working it. The diner's floor has unit tests but no e2e step: the e2e never waits tables.
- **No harness run:** nothing a bot does changes (they work shifts plain).
- **The download:** 362.4 KB of 400.

**Status (3 Oct 2026): 18.3 built: the coach's roster and the warehouse's picks.** Save v47, 0.999.21. Numbers [proposed] in `COACH` and `HAUL`; content in `content/setting.ts`; rules in `work.ts`.
- **The coach's roster:** clients who stay, two to four as you rise, each named, with a project (a crimpy line, a steep power problem, a balancy slab, a big dyno) one to three grades over them, how near they are, how tired, and whether they're scared of it today. A session gives each an hour: burns (fastest, and wearing; worth little tired, next to nothing scared), drilling the style (steady), working on the fear (clears it), or sending them home (rests them). Tiredness wears off a point a day; some days a client turns up scared. A send pays their thanks, six dollars a grade of the project, and a new client takes the slot, never with a name already on the roster.
- **Not solved (criterion 3), tested:** over forty sessions, reading each client (fear first, rest when tired, burns when fresh) sends 25; burns every time sends 5, drilling 16, and no one focus gets within three quarters of reading them. v0.956's roster was "pick the weakness"; here the right hour moves with the client's day.
- **The warehouse's picks, push-your-luck with the incentive fixed:** after the quota, picks on top, three on the board at a time, each paying something and weighing something. Each pick is its own action, so the sim rolls the drop and nothing's undone: the chance shows on each pick, rising with how worn out you are. A drop ends the run and costs some of what you'd picked: v0.956's cost only the crate in hand, so never stopping was always right. The day moves the stop: the heat (what a pick takes out of you) and the supervisor (how much a drop costs, from Marta's shrug to the area manager's everything). The forklift driver carries a quarter less. Picks left on the go are paid at the day's end.
- **Not solved, tested:** the best stop ranges from two picks to six by the day, and no fixed rule (the best pick for its weight, stopping at two, three, four or six) gets within nine tenths of the best play's expected take. The best play takes about $12 a shift on top of the $52.
- **The play rows:** "Coach your clients" and "Pick on the clock", beside the plain shifts; "Back to the picks" while they're on the go.
- **Seen, not in the e2e:** the e2e never coaches (it wants V5) or works the warehouse, so both sheets were checked by loading a save in headless Chromium and looking; the unit tests cover the rules. A first look found the warehouse's row shut once the shift was worked, with picks still on the go; it now goes back to them.
- **Save v47:** `coach` (the roster) and `haul` (picks on the go); a real v46 save loads.
- **No harness run:** the bots work shifts plain.
- **The download:** 365.6 KB of 400.

**Status (3 Oct 2026): 18.4 built: the comp ladder.** Save v48, 0.999.22. Numbers [proposed] in `COMP` and `content/comps.ts`; rules in `comps.ts`.
- **Five rungs, each on its own days at its own wall:** League night at Send City every week (V0 to V5, a field of 10); the Circuit at the Cave every two weeks (V4 to V10, 12); Nationals (V7 to V13, 16) and the World Series (V10 to V15, 20) at the Training Center every four weeks; and the Games there once a year (V12 to V17, 20), the capstone. Fees from $10 to $60, the Games by invitation; purses from $40 to $3,000 for a win.
- **Opt-in:** sign up at the desk on the day, before 1 PM; the entry's the wall for the day. Signed up, the wall's set is the comp's problems, as many as the wall has room for, easiest to hardest, climbed with the climbing as anything is. Anyone else, the bots included, finds the week's set: the comp doesn't steer a career that didn't enter it. The desk says when the next one is.
- **Scored as comps are:** a top counts in its first five goes; tops first, then fewest goes, against a fixed field drawn from the seed, each climber's tops from the grade they climb. The field doesn't move to meet you (v0.956's rubber-banded). Hand in your scorecard at the desk, or it's handed in at bed.
- **The ladder:** a place earns points, a win's worth down to a tenth of it in last; they fade by half every 56 days; each rung lets you in at its points. Stop competing and you slide back down.
- **Opened, as Phase 23 left waiting:** the Scene path (Competitor, three comps; Finalist, two podiums; Headliner, six, each kinder on a comp's problems); the Comp Beast quirk (two podiums); the Record Book's Game On, Top Step and a podium at the Games.
- **Not yet:** comps outside the ladder (the dyno comp, a bouldering league as a season-long table), and the ladders screen (18.7). The bots don't enter (18.7's ladder bots will).
- **Tried first:** the comp's problems on the wall for everyone that day. The bots climbed them unentered, and V10 came 17 days sooner and one career missed Act III's end; now they're on the wall only for an entrant.
- **Harness:** every target passes, unchanged from 18.1 (V10 on a median day 180.5, Act III in every career, median day 296.5).
- **Also:** a row's note no longer doubles a full stop ("on the house.. Apprentice").
- **Seen:** the desk on a league night, from a loaded save in Chromium; the e2e passes unchanged (its day four doesn't sign up). A real v47 save loads.
- **The download:** 368.5 KB of 400.

**Status (3 Oct 2026): 18.5 built: media.** Save v49, 0.999.23. Numbers [proposed] in `MEDIA` and `content/media.ts`; rules in `media.ts`. Evan's call: followers back.
- **Followers pay nothing on their own.** v0.956 paid cash for every first send by followers, gym problems included, and ran to $2,300 a day by day 200 (the audit, §1.2). Here sponsors pay, and want days for it.
- **A post a day, from what the day gave you:** each line first sent today, by its grade, more outside, on a first go, or a first ascent; a podium. Four ways to post it: as it was; the story (fewer follow, psyche up); bait the algorithm (more follow, the old crowd sours, threads come); the sponsor's ad (it pays). Engagement rises with posting and slips after a few quiet days; slumped, followers drift away.
- **Sponsors with followers:** Chalkbag Co. at 2,000, Apex Climbing at 8,000, Meridian at 30,000, each an email at the van. Keep it real, or full brand (half again the money, an ad each cycle, more threads). A cycle's asks, every 14 days: a send posted at your grade less one; from Apex, a shoot day at a crag they name; from Meridian, a comp too. Done, the stipend; missed, a warning; missed twice, you're dropped.
- **The rival for the headline deal:** Skye Maddox, a comp climber with a camera crew, her followers on a curve of their own (half of 60,000 by day 140). Meridian signs whoever's ahead when your numbers get there; lose it and they look again in four weeks.
- **A thread about you,** now and then, likelier with followers, brand terms and bait: send at your grade within a week and it goes quiet with a quarter more followers; let it run and some go.
- **The capstone, the film:** at Meridian with 40,000 followers, a filmmaker offers a season; a line a grade over yours, outside, in four weeks, and it airs.
- **Opened:** the Influencer calling (posts bring a quarter more; 2,000, 15,000 and 60,000 followers); the Record Book's Internet Famous (5,000), Sponsored, Going Pro (Meridian), and a new one, On Screen (the film).
- **The ladder, for 18.7:** known locally (1,000), each sponsor, the film: six rungs.
- **Your feed** is a row at the van: followers and how engaged, the sponsor's asks ticked off, a thread, the film, the rival's numbers once she matters, an offer to answer, and the four posts each with the followers it would bring. A shoot is a row at the crag's van.
- **Not measured:** the bots don't post, so the pace up the ladder (whether Meridian and the film land inside a career, and how often the rival wins) is unmeasured till 18.7's ladder bots. One small flash outside at middling engagement brings about 180.
- **Seen:** the feed with a sponsor and a thread, from a loaded save in Chromium; the e2e passes unchanged; a real v48 save loads.
- **Harness:** every target passes, unchanged.
- **The download:** 373.5 KB of 400.

**Status (3 Oct 2026): 18.6 built: your own gym, and a crag.** Save v50, 0.999.24. Numbers [proposed] in `OWN_GYM`, `GYM_SET` and `LAND`; rules in `business.ts`; the bluff in `content/places.ts` and `content/routes.ts`.
- **Send City, bought:** the desk offers it from senior setter; Marg sells to her head setter, for $6,000 in hand. Owning it ends setting shifts (you set your own wall now), and the owner's pass is the keys: the wall and the shower, every day.
- **A simple business with no traps:** members (60 to start) drift a tenth of the way each night toward what the wall and the upgrades draw. Each pays dues and brings walk-ins. Rent and the desk come out ($190 a day), plus a setter's $55 if you hire one. The wall goes stale a little every night. Set it yourself (4 hours; plainly, or to the brief with 18.1's puzzle, its score the wall's freshness), or hire a setter, who keeps it good enough.
- **What it pays,** settled after a month (measured on the night's rule, not by a bot):
  - The first night, about $17.
  - A plain set every day, about $80.
  - With a hired setter and nothing asked of you, about $95.
  - With all three upgrades and a wall set to the brief every day, about $570, at 200 members. That's probably too generous: a tuning call for when 18.7's bots can measure it.
  - Left alone with no setter, it loses about $75 a day once the wall's stale, and the bank sells within weeks.
- **The draw (criterion 4):** "Draw the till" moves the whole till to your cash. A short till is a line every morning, and you can cover it from your pocket at the desk. Past $600 short, the bank sells it for half the price less the shortfall. Selling up any time gets you 70% of the price plus the till.
- **The morning line:** "Send City yesterday: +$214, 128 members, the wall a good set. $1840 in the till."
- **Upgrades, once each, from your pocket:**
  - a training board ($1,500, about 25 more members)
  - a coffee corner ($1,200, 50¢ a member a day)
  - a new steep wall ($2,500, about 45 more members)
- **Miller's Bluff, a crag to buy:** limestone on a farm east of the Lot, never climbed, $9,000 to Ed Miller. It has nine lines, V6 to V15: six sport lines to bolt ($140 of hardware and 5 hours on a rope) and three boulders to clean (2 hours). Each is an open project once done: the first ascent, and its name, are yours. The land and its bolts pass to an heir; the gym doesn't (it's theirs to earn) [proposed].
- **Opened:** the Record Book's Your Own Four Walls (the gym) and The Back Forty (the bluff).
- **The ladder, for 18.7:** setting's four ranks, then owner, then 200 members at once.
- **Fixed after a look** (screens from loaded saves):
  - An owner had to buy a pass to shower.
  - The short-till line said "put money in" with no way to.
  - A coffee corner read "$0.5".
  - The unit test meant to show an owner climbs free never ran: it looked for the gym's problems in the wrong list. It runs now.
- **Not measured:** the bots don't buy a gym or land. When a career can afford either, and what the till pays over one, waits on 18.7's ladder bots.
- **Not done:**
  - The guiding outfit, a youth athlete and an expedition team carry (Evan's call).
  - The bluff's close-up is Roadside's wall shape in limestone, without chalk; its own shape is for an art pass.
- **Save v50:** `gym` and `bolted`; a real v49 save loads.
- **Seen:** the bluff from the road, the owner's desk, and the gym's sheet with a full till and a short one, all from loaded saves in Chromium. The e2e passes unchanged.
- **Harness:** every target passes, unchanged (V10 on a median day 180.5, Act III in every career, median day 296.5).
- **The download:** 378.5 KB of 400.

**Status (3 Oct 2026): 18.7 built; criterion 2 at 29 of 32 runs.** No save change, 0.999.25. Rules in `ladders.ts`; the bots in `bot.ts` (`focus`); the measure in `harness/ladders.harness.ts`. Evan's calls (3 Oct): compress the late curve, and tune the other three to 4/4.
- **One screen for the four ladders (criterion 1):** "Your ladders" at the van. Each ladder shows the rung you're on, the count, and what the next rung asks, all formatted from the rules' numbers.
  - **Outdoors:** the story's five acts, The Line on top.
  - **Comps:** League night, the Circuit, Nationals, the World Series, and the Games.
  - **Media:** 1,000 followers, Chalkbag Co., Apex Climbing, Meridian, and the film.
  - **Work and business:** four setting ranks, your own gym, and 200 members at Send City.
- **Criterion 2, two seeds per start, to retirement:**
  - **Comps 8/8,** the Games on a median day 218.
  - **Media 8/8,** the film on a median day 199.5.
  - **Business 8/8,** 200 members on a median day 342.
  - **Outdoors 5/8,** The Line on a median day 347.
    - At 6/8 the two misses were V18 and short of money for the late paid trips.
    - So, Evan's call: with a trip or a locked crag next in the story, the career bot now saves for it, before van upgrades.
    - That brought the finishes earlier (median day 379.5 before), but not more of them.
    - The misses stall in Act III for reasons that differ by seed. About two careers in three reach The Line.
- **The late curve (`CURVE`) [proposed]:**
  - It's unchanged to V10, so V10 still comes on day 178 (180.5 before).
  - Past V10, each grade costs a flat 26 skill. Before, V18 needed three careers' growth.
  - Plain careers now finish The Line in 4 or 5 of 8 runs, from none. Act III ends a median day 271, from 296.5. The ending still takes 18.5 hours.
- **Three bots, one per ladder,** besides the story:
  - **Comps:** enters every comp it's let into, and keeps those days free.
  - **Media:** posts nightly, does the shoots (driving out for them), and keeps the film's season, with no trips away and the film's crag first.
  - **Business:** sets until head setter, buys the gym, hires a setter, builds the upgrades, and sets to the brief by working the puzzle out the long way.
- **The career bot reads its story** (it played only the easiest unsent lines, and never reached the V14s):
  - It projects the lines the current goal names.
  - It trains the skill its next wall finds short, in a build phase, two to three goals out. Endurance stalled near a tenth of power in every career, because few lines are endurance.
  - It peaks for walls and goes up them fresh.
  - When the partner's day ends, it waits on the ledge rather than rapping off.
- **Rules fixed along the way:**
  - **Followers saturate.** They ran to 1.6 million by day 415, because a post summed every send and boosts compounded uncapped. Now a post tells the day's best send, and every gain thins toward a 150,000 ceiling, over the rival's 60,000.
  - **The film comes back** 56 days after it's shelved.
  - **A dropped sponsor waits 28 days** before calling again. It called back the same night.
- **Tuned toward 4/4, all [proposed]:**
  - Send City costs $4,500.
  - The Games invitation needs 200 points.
  - The film's line is at your grade. One over, the bots shelved it as often as not.
  - The comp ladder's top rung is the Games, entered. No bot places on its podium, which stays a Record Book entry.
- **Twelve more of Hazel's portaledge lines.** Longer wall careers ran through her twenty, and Phase 17's weekly target missed a week.
- **Seen:** the ladders sheet from a loaded save in Chromium.
- **Harness:** every other target passes.
- **The download:** 379.7 KB of 400.

**Phase 18 closed by Evan's call (3 Oct 2026).**
- **Criterion 1 passes:** four ladders, five rungs or more each, a capstone each, on one screen.
- **Criterion 2:** comps, media and business pass 8/8. Outdoors reaches The Line in 5 of 8, about two careers in three, accepted. The misses stall in Act III for reasons that differ by seed.
- **Criterion 3 passes:** no job's minigame is solved in a shift (18.1 to 18.3).
- **Criterion 4 passes:** the gym's till is drawn (18.6).
- **Carried:**
  - outdoors to playtesting, where a person reads the goals better than the bot
  - the guiding outfit, a youth athlete and an expedition team
  - comps outside the ladder (the dyno comp, a season-long league)
  - the bluff's own rock shape
  - the gym's top-end pay, and every [proposed] number in `OWN_GYM`, `LAND`, `MEDIA`, `COMP` and `CURVE`
- **Next:** the CURRENT MILESTONE moves to Phase 14, the desktop and Steam build. The download is 379.7 KB of 400.

---

### Phase 25 — Finish the game

*Evan's call (4 Oct 2026): every gameplay feature and phase before the Steam build. Stage D waits on this.*

**Goal.** Nothing in the game is a placeholder: every Record Book entry can be earned, and what the closed phases carried is built or cut by Evan's call.

**Scope.** What the closed phases carried, gameplay only:
- **The Record Book's three waiting entries:** Guidebook Author (guides), Known For It (a trait), Dirtbag Philanthropist (giving).
- **Phase 18's:** the guiding outfit, a youth athlete, an expedition team; comps outside the ladder (the dyno comp, a season-long league).
- **Phase 17's:** crew drama (two partners falling out because of you), walker chats, busy-texts, shopkeepers' small talk.
- **Phase 24's:** the drawn keepsake card for a trip.
- **Phase 22's:** tappable glossary words.
- **The bluff's own rock**, in place of Roadside's shape.
- **Music** (Phase 13), parked with its decision: Evan's.

**Not here:** balance that only playtesting can settle (outdoors at about two in three, the Late Bloomer's speed run, the boulderer and the all-rounder alike in week one, the odds above an objective's grade, the gym's top-end pay). Those carry to testers.

**Done when.**
1. Every Record Book entry has an aim: none waits on a system.
2. Each carried item is built, with tests, or cut by Evan's call.
3. The harness's targets still pass.

*The slices (Evan's calls, 4 Oct 2026: guide days then an outfit; a mentee you coach; fund a team's trip):*
- **25.1 The Record Book's last three:** guides, a trait, giving.
- **25.2 Guiding:** guide days, a sixth job with its own small game, then an outfit of your own.
- **25.3 The mentee:** a local kid you take on and coach over seasons; their grade passes to an heir.
- **25.4 An expedition team:** late money funds a young team's trip to an objective you've summited.
- **25.5 Comps outside the ladder:** the dyno comp, and a season-long bouldering league.
- **25.6 The people:** crew drama, walker chats, busy-texts, shopkeepers' small talk.
- **25.7 Polish:** the keepsake card for a trip, tappable glossary words, the bluff's own rock.

**Status (4 Oct 2026): 25.1 built: the Record Book's last three.** Save v51, 0.999.26. Numbers [proposed] in `GIVING` and `GUIDE`; rules in `giving.ts` and `guides.ts`.
- **Known For It** is earned when your habits name a quirk. Phase 23 made v0.956's traits quirks; its page was waiting on a name that already existed.
- **Giving,** after v0.956's food bank and access fund:
  - The food bank at the market: $50 once a week, for a little psyche (v0.956 gave +10 and five days of better odds).
  - The access fund at the gear shop: $40 once a week, and the old crowd's nod.
  - Dirtbag Philanthropist at $1,000 over a life. An heir's life starts its own tally.
- **Guides,** after v0.956's (a crag you knew well enough let you write one):
  - Send every line at a crag and put up one of your own there.
  - Then write at the van, five evenings of three hours.
  - Out, it pays $15 a week with the week's bills, a crag each (v0.956 paid up to $18 a day).
  - Guidebook Author on the first. A guide in print passes to an heir; one half-written doesn't.
- **Where:** "Your guides" at the van; a row each at the market and the gear shop.
- **Save v51:** `giving` and `guides`; a real v50 save loads.
- **No harness run:** the bots don't give or write.

**Status (4 Oct 2026): 25.2 built: guiding.** Save v52, 0.999.27. Numbers [proposed] in `GUIDING` and the `guide` job; rules in `guiding.ts`.
- **A sixth job:** the gear shop's guide service, from V6.
  - Ranks: Assistant guide, Guide, Lead guide.
  - A whole day out at Roadside: 5 hours, 26 energy, $50 and $18 more a rank.
  - Signed up for and posted like the rest, with "Plan the day" beside the plain shift.
- **Plan the day:** two clients, or three from Guide, each with a goal (harder as you rise, never past Roadside's hardest guidable line) and climbing a grade or two under it; some are nervous.
  - You put each on a different line, one rope to a line.
  - Too easy bores them.
  - Past their goal frightens them, and a nervous one won't leave the ground.
  - Their goal is the day of their life if they send it and a frightening one if they don't, so it's right only for a calm client a grade short.
- **Not solved (criterion 3), tested:**
  - Over 60 days, more than 20 different best plans.
  - Every fixed rule (their goal, their level, a grade under the goal) scores 0.88 to 0.89 of the best, and random play about 0.6.
  - Reading each client scores 1.00.
  - The bonus starts at 0.9, so only reading them pays.
  - Tried first, the goal for everyone scored 0.99: a failed go at the goal now costs the client's day.
- **The outfit:** at Lead guide, $3,000 at the shop starts your own.
  - One guide to start, up to three.
  - An open day at Roadside: $60 a guide, less $25 insurance.
  - A shut day, or any day in winter: the insurance alone.
  - The till is drawn as at Send City, and it sells for 60% of the price plus the till.
  - A line every morning. A new Record Book entry, Ropes for Hire.
- **Lines:** a guided day uses Roadside's lines up to grade 9, boulders included (Roadside has five roped lines, all V5 or under), and never the open project. Clients' grades show in both scales.
- **Not measured:** the bots don't guide, so the job's pay against the other five and the outfit's take are unmeasured. On paper the outfit makes about $155 a day with three guides on an open day.
- **Seen:** the day's plan and the outfit's sheet, from loaded saves in Chromium. A first look showed clients in V-grades against roped lines in YDS, and the open project on offer; both fixed.
- **Save v52:** `outfit`; a real v51 save loads.

**Status (4 Oct 2026): 25.3 built: the mentee.** Save v53, 0.999.28. Numbers [proposed] in `MENTEE`; rules in `mentee.ts`; words in `content/mentee.ts`.
- **A kid at Send City,** from V7 (v0.956's was V5): a row at the desk.
- **Sessions:** two hours at the gym, once a day, 8 energy.
  - Each one moves them along, slower as they grow (half as fast at V8), and never past your own grade.
  - 16 sessions to V5, 31 to V8, 44 to V10 (v0.956's capped at V5).
  - The desk says where they are and how far to the next grade.
- **Cost:** their shoes and comp fees, $15 a week with the bills.
- **Drift:** left alone two weeks, they're warned to be drifting to the comp team; four weeks, they've gone. You can also let them go.
- **Their story:** a line at 1, 5, 10, 20 and 35 sessions, and at V5, V8 and V10. A new Record Book entry, Pass It On, at V8.
- **To an heir:** a mentee at your retirement passes their grade on. The next climber starts with 4 skill a grade on each (a V8 mentee: +32 each, about a V2 head start on its own), and the mentee turns up at the Lot to coach them.
- **Save v53:** `mentee`, and the family's mentee; a real v52 save loads.
- **No harness run:** the bots don't mentor.
- **Seen:** the desk with a mentee, and a session, from a loaded save in Chromium.

**Status (4 Oct 2026): 25.4 built: an expedition team.** Save v54, 0.999.29. Numbers [proposed] in `TEAM`; rules in `team.ts`; words in `content/team.ts`.
- **Where:** a row on the Expeditions sheet for each objective you've stood on top of. v0.956's goal was a first-ascent team; this one goes where your notes are worth something.
- **Cost:** half again what your own trip there costs: $1,350 to El Cap, $3,300 to Cerro Torre, $6,750 to Trango.
- **Their odds:** the objective's weather (1 − its storm odds) times what you can tell them.
  - A base, more for each time you've topped out there and a little for each other trip, up to two of each.
  - With one summit of yours: 53% on El Cap, 36% on Cerro Torre, 29% on Trango. At most 78%, 53% and 42%.
  - The kid you coach leads it once they're V8, for a little more (86%, 59%, 46% at best), and isn't drifting or coachable while they're away.
- **Away:** as long as your own trip leaving that day (12, 20 and 38 days). One team at a time; the row shows them away and when they're due.
- **Home:** a line the night they're back: the summit, how many pitches they fixed, or that the weather never let them start. A summit is the old crowd's nod, and a new Record Book entry, Somebody Else's Summit.
- **Save v54:** `team` and `teams`; a real v53 save loads.
- **No harness run:** the bots don't fund teams. Forty seeded El Cap teams summit within 0.2 of the odds they left with (a test).
- **Seen:** the Expeditions sheet with two rows, then a team away, from a loaded save in Chromium.

**Status (4 Oct 2026): 25.5 built: comps outside the ladder.** Save v55, 0.999.30. Evan's calls: the dyno comp is the Fall Festival, yearly; the league is League night's season. Numbers [proposed] in `content/comps.ts` and `LEAGUE`; rules in `comps.ts`.
- **The Fall Festival dyno comp:** day 13 of every year (the fall) at Send City, signed up for at the desk like any comp.
  - Five throws from V2 to V10, each further than the last: one-crux dynos of three or four moves, climbed with the real go (v0.956 rolled dice).
  - A top counts in its first three goes. A field of 12, $15 to enter, $300, $150 and $75.
  - Off the ladder: no points, never a rung, not on the ladders screen. Its win also counts as Top Step's comp win.
  - Played by the bot's hands: a V3 climber sticks the first two, V6 four, V9 all five.
- **League night's season:** the year's eight Thursday nights.
  - The same nine faces all year (drawn once a year), each night rolling its own tops, so a table means something.
  - A night is worth 10 points for a win, one fewer a place down; your best six of eight count.
  - A "League table" row at Send City's desk, and the table itself.
  - Settled the night of the year's last League night if you were on it: your place, $250 for the top.
- **Two Record Book entries:** Big Throw (win the dyno comp) and Season Champion (top a season).
- **Underneath:** the comps list keeps the dyno comp at the end, so saved results keep their rungs; the ladder, its rungs, the Games' podium and the comp bot all read only the ladder's five.
- **Save v55:** `comps.seasons`; a real v54 save loads.
- **Harness:** League night's field is new, so it ran. The comp bot reaches the Games 4/4 on a median day 218, as in 18.7. The other comps draw their fields exactly as before. Outdoors shows 2/4 on these four seeds, the shortfall Evan accepted (5/8 in 18.7); its bot never enters a comp, so this change can't move it. The bots don't enter the dyno comp.
- **Seen:** Send City's desk on the dyno comp's day, and the League table, from a loaded save in Chromium. A first look showed the table in the warning color; it's plain lines now.

**Status (4 Oct 2026): 25.6 built: the people.** Save v56, 0.999.31. Evan's calls: crew drama is a choice, a rift and a mend; the crowd is tapped. Numbers [proposed] in `CREW`; rules in `crew.ts`, `texts.ts`, `keepers.ts` and `crowdtalk.ts`; words in `content/crew.ts`, `texts.ts`, `keepers.ts` and `crowd.ts`.
- **Crew drama,** once a life, from day 28.
  - The two of Sage, Mara, Rico and Tam you're closest to, both Regulars and around: the closer asks for the weekend you'd promised the other. Each asks in their own voice.
  - Go with them, or keep your word. Whoever you let down loses 2 bond and is away a week.
  - After that, they won't come where the other is. The crew's days never cross on their own (measured: Sage, Mara, Rico and Tam never share a place unasked), so it bites on invites: ask both to the same crag and one won't come.
  - Three weeks on, the one you picked asks about it. Getting them both to the fire works at 40%, 15% more a tier you've rebuilt with the one you let down. It mends (both +1 bond) or sets for good. Leaving it asks again three weeks later.
- **Busy texts:** "Text the crew" at the van. Each partner you know answers with where and when they'll be out, or why not, in their own words: six each, walked by the seed (v0.956 had two or three, turned by the day). A stint away or hurt, and a week's sulk after a falling-out, have their own lines. In the evening, with nothing left of today, they answer for tomorrow.
- **The shops' small talk:** the diner, the gear shop, the café, the market, the garage and the clinic each say what's going on today when you're there: their old line and five or six others, plus one to three only when true (rain, an injury, winter, a worn tire). Walked by the seed, a day at a time.
- **The crowd:** the strangers at a busy crag are tappable, and each has a line: 11 for any day, 6 more only when true (the heat, the cold, a prime day, and two that recognize you from V9 and V11). Five a day, then they're back on their own projects. They stand in front of the lines, so a tap on one is for them; the line above still opens its card. The screen reader names each "Someone in the crowd".
- **Save v56:** `crew`, and a partner's `avoid`; a real v55 save loads.
- **Harness:** every target as in 25.5: the social bot sees something new every week to day 300 in 8 of 8 runs; comps, media and business 4/4; outdoors the accepted 2/4 on four seeds. It doesn't report whether the social bot met crew drama, so how often a player does is unmeasured; the texts, the shops and the crowd are text only.
- **The e2e:** its café and diner checks read the old fixed lines; now Wren, and the Diner's card.
- **Seen:** the crew's texts at the van, the Gorge's crowd and a stranger's line, Mara's ask with its two answers, and the diner's line, from loaded saves in Chromium.

**Status (4 Oct 2026): 25.7 built: polish.** 0.999.32. No save change; view and UI only (`ui/card.ts`, `ui/gloss.ts`, `view/paint/wall.ts`).
- **The keepsake card for a trip:** the send card's painter, drawn on the pitch you got to on the objective's own wall, the summit's or your high point's, with its name ("The Nose", or "The Nose, pitch 3"), how far ("Summit", or "High point, 3 of 6"), where, when, and who was on the rope.
  - "Keep a card of it" on the trip's home card, and "A card of El Capitan" (the summit, or else your best) on the Expeditions sheet for every objective you've got a pitch up.
  - None for a trip that never left the ground.
- **Tappable glossary words** on place cards, route sheets, and the lines a go ends with: the first use of each word, three at most, opens a card with its entry, back to where you were or on to all the words.
  - Only lowercase uses (YDS and V-scale as written), so the game's names stay names: The Pump is a route, Send City a gym.
  - Left out as too common or part of a name: go, send, crag, soft, nut, lip, dirtbag.
- **Miller's Bluff's own rock:** grey limestone, bedded flat, never chalked, with water streaks, the tufa, the cow corner leaning out at its top, the pillar's two edges and the big roof a third of the way up, where its lines say they are; the field, a fence and a hay bale at its foot.
  - **A bug found on the way:** none of the bluff's six sport lines had a line drawn on any wall, so a go on one, once bolted, had nothing to climb. Each has one now, and a test holds every roped line to it.
- **Size:** 396.6 KB of 440 (+1.8 KB).
- **No harness run:** nothing the bots do changed.
- **Seen:** El Cap's summit card, the big roof's route sheet with "project" marked, its word card over the bluff's new wall, from loaded saves in Chromium.

**Phase 25 against its Done-when (4 Oct 2026):**
1. **Passes:** all 45 Record Book entries have an aim; none waits.
2. **Passes but for one:** every carried item is built, with tests (25.1–25.7). Music (Phase 13) is parked with its decision, which is Evan's: build it, or cut it.
3. **Passes:** the harness's targets, last run on 25.6, with outdoors at the 2 of 4 seeds Evan accepted (5 of 8 in 18.7).
- Closing Phase 25, and the call on music, are Evan's. Next after it, by the order set: Phase 14, the desktop and Steam build.

**Music (4 Oct 2026, Evan's call: synthesize it for now and see how it turns out).** 0.999.33. In `src/audio/moods.ts` (what plays where) and `music.ts` (the engine), all [proposed] by ear.
- **Six moods:** camp (the Lot by day), fire (the Lot at night, and a crag after dark or in winter), crag, town (the gyms and the shops), road (the map and driving), big (an expedition). Each has a key and scale, a loop of four chords, a tempo from 56 to 100, and how busy its tune is.
- **What plays:** the chords on a soft pad, a bass on the beat, a plucked tune made up four bars at a time and repeated with changes, and in town and on the road a soft kick and brush. In stretches of 16 to 32 bars with 25 to 60 seconds of quiet between, so it doesn't wear; a new place waits for the bar.
- **In the mix:** its own bus, under the ambience's level, ducking under talk and during a go; silent while the app's hidden, as everything is. "Music: On / Off" in Settings, on by default.
- **Heard by nobody yet:** rendered offline it doesn't clip and sits at a steady level, between the Lot's quiet bed and the Gorge's wind, louder than the Lot's. 30 seconds of each mood are on the dev sound sheet (`npm run dev`, /sounds.html). Whether it's any good is Evan's ear to say.
- **In the licence ledger:** made in code, so 50 sounds, no recordings.

**Phase 25 closed by Evan's call (4 Oct 2026).** All three criteria pass: every Record Book entry can be earned; every carried item is built, music in code included; the harness's targets pass (last run on 25.6). The CURRENT MILESTONE moves to Phase 14, the desktop and Steam build. The download is 398.2 KB of 440.

**Phase 25's systems, measured (4 Oct 2026, Evan's call).** `harness/late.harness.ts`, in `npm run harness`: no targets, numbers for Evan's calls. Comps climbed with the career bots' human-ish hands (the careful ones are near perfect: with them a V3 swept League night and a V8 the dyno comp). LATE_SEEDS widens the samples; these are 4 a cell.
- **Guiding** is in the band: a plain Lead guide shift is $17 an hour, with the head coach; the other jobs' top ranks run $13 to $17.
- **The outfit** with three guides makes $155 a day (median, real weather, winters shut), $660 a week, $5,283 a year, and pays back its $3,000 in 32 days; one guide barely covers the insurance ($35 a day, 204 days to pay back). Against keeping the job: three Lead guide shifts a week, $258 ($360 played well). For comparison, 18.6's gym with a hired setter makes about $95 a day for $6,000. Late money that runs itself, as the gym's does; whether both are too generous is the same call.
- **The mentee:** 16 sessions to V5 and 31 to V8 whoever coaches, 44 to V10 from a V12 coach; a V7 coach can't take one past V7 (by design: never past you). Shoes and fees to V8, $75. **An heir's head start is small and coarse:** from every start, a V5 mentee and a V8 one both make a V2 heir (from V0), a V10 one V3.
- **A team's trip** costs $2,533 a summit at El Cap with one summit of yours ($1,568 at best), $9,066 at Cerro Torre, $23,601 at Trango ($14,610 at best). Only the first summit is an entry in the book; after it, the old crowd's nod.
- **The dyno comp:** a V2 and a V4 never place; a V6 wins 1 year in 4 and podiums 2; a V8 wins 2 in 4; from V10 it's won every year, $285 after the fee. A mid-career thing, small money.
- **League night's season:** a V1 or V2 is mid-table and loses the fees; a V3 wins 1 season in 4, a V4 3 in 4, and from V5 every night of every season ($490 a season). An early-career thing, as its V0–V5 problems are.
- **Crew drama** came to 13 of 16 social careers by day 300 (median day 110), every time Rico asking over Sage, the only two of the four the bots make Regulars: Mara (the Gorge) and Tam (the Mesa) rarely get there. Mended in 10, set in 1, still a rift in 2. **A bot gap, fixed on the way:** the social bot didn't answer crew drama's beats, and Sage's own talk handled only her meeting and arc; it found it 0 times in 16 before. Every other harness target passes as before; ambient lines now come round 2.2 times by day 100 (2.1 before), the social bot's time on the drama, against v0.956's 7.
- **Not measured:** the guides' royalties and giving (text and small money); the outfit and gym against each other in one career (no bot runs either).

### Phases 26–35 — Deepen the game

*Evan's call (8 Oct 2026): Phase 14 waits until he asks for it. Until then, keep building the game: tune what's measured, deepen what's thin, tie the systems together, and add what's missing. Ten phases, some small and some large, drawn from a map of every system's depth, what the audit and the closed phases carried, and Phase 25's measurements.*

**The order:** 26, 27, 28, 29, 33, 34, 30, 31, 32, 35.
- 26 is cheap and acts on numbers already measured.
- 27 is the attempt, the star.
- 32 builds on 28's crew project and 34's money.
- 35 fits anywhere.

**Weigh first:**
- **Bots only.** No person has played a full career, and the testers' criteria are all still open: 10–12's, the Late Bloomer's speed run, the boulderer and the all-rounder in week one, outdoors at about two in three, the gym's top-end pay. Ten phases on bot-tested balance can deepen the wrong things. A week of 0.999.33 before Phase 27 would help.
- **The download.** 398.2 KB of 440. Phases 27 and 32 are mostly content and will likely need the budget raised [INFERRED].
- **One reversal.** Phase 34's photo sales undo part of Phase 5's "photography economy beyond posts and prints: defer past 1.0". The garden and the farm stay saved for later, with the audit's objection.

**Not here, considered:**
- **More expeditions or destination trips.** There are three objectives. The strongest runner-up.
- **The town's places as scenes,** the diner and the café with their regulars. A large art cost.
- **The garden and the farm.** Still saved (Phase 22).
- **Speed comps, grade votes** (cut in Phase 5), **a rival gym.**

### Phase 26 — Tune-up: act on the measurements   ✅ Closed

*Small. Phase 25's measurements, acted on. Nothing there has been changed yet.*

**Goal.** Each late system matters for longer than it does now, and the bots measure what a player meets.

**Scope.**
- **Crew breadth.**
  - Crew drama came to 13 of 16 social careers, always Rico asking over Sage. Mara (tied to the Gorge) and Tam (tied to the Mesa) rarely become Regulars.
  - Give each of them a way into the valley's days, a town hour or invites of their own, and draw the drama's pair from your closest two.
- **League night.**
  - From V5 a player wins every night of every season.
  - A season won moves you up to the A league the next year, with a stronger field and a bigger prize.
- **The dyno comp.**
  - From V10 a player wins every year.
  - The field grows with the years, as the festival gets known.
- **An heir's head start.**
  - A V5 mentee and a V8 one both make a V2 heir.
  - Scale it with the mentee's level, not in bands.
- **Smaller:**
  - The crowd stands clear of the lines' bases, so a tap there reaches the line.
  - The bot answers Sage's romance beats in social mode, and a due beat no longer costs a non-social bot its lesson. Her romance starts come before her lesson in her talk.
  - Carried from Phase 22: a warning expires after a while, and leaving on an expedition cancels the shifts it covers.
  - Phase 5's rename of "Olympic Medalist".

**Evan's calls:**
- whether the outfit ($155 a day) and the gym's top end are trimmed;
- what a team's repeat summits are worth.

**Done when.**
1. A re-run of the late harness finds crew drama across at least three different pairs.
2. A promoted V5 doesn't sweep the A league, and from V10 the dyno comp is won in fewer than four years of four.
3. V5, V8 and V10 mentees leave different heirs.
4. The harness's targets still pass.

**Status (8 Oct 2026): built.** Save v57, 0.999.34. Evan's calls (8 Oct 2026):
- the outfit and the gym stay as they are;
- a Record Book entry for team summits on every objective;
- the A league is for good;
- Mara goes to the Cave and Tam to the Gorge when their own crags are shut.

Numbers [proposed] in `LEAGUE.prizeA`, `MENTEE.heir`, `WORK.forgive` and the comp tiers.
- **Mara and Tam.** On a day they'd come out, Mara trains in the Cave when the Gorge is wet or shut for the raptors. Tam climbs the Gorge's shade when the Mesa is wet or too hot, if the Gorge is open. Before, each of them stood at a crag that was shut. Tam's first line no longer mentions sandstone, since you can meet him at the Gorge now.
- **The A league.** It runs on League night's nights, with problems V3 to V8, a field of its own and $500 for its season. It's yours from the year after you win a season, for good. It's read off the seasons you've settled, so nothing new is saved.
- **The dyno comp** grows a grade a year for its first three years, the throws and the field together: V2–V10 in the first year, V5–V13 from the fourth.
- **An heir's head start** is 0.4 of the mentee's grade, rounded, with the start's own shape kept. A V5 mentee makes a V2 heir, a V8 a V3, a V10 a V4 and a V12 a V5.
- **The crowd** stands in the gaps, clear of every line, boulder, the van and the cast, so a tap at a line's foot is for the line. Roadside has room for three strangers, so on a packed day it shows three, not five.
- **Warnings lapse** 28 days after the last one. The save keeps that day (v57), and the jobs sheet says when they lapse. A v56 save's warnings count from the day it loads.
- **The Record Book has 46 entries.** The new one is Everybody Else's Summits, a team up every objective. Olympic Medalist is now Games Medalist.
- **The bots** answer Sage's romance beats: the social bot the first way, the others as friends. Her romance comes before her lesson in her talk, so from Partner on they'd lost her lessons for good.
- **Dropped:** "an expedition cancels the shifts it covers". Phase 24.3 already settled it by Evan's call: book a week ahead and the shifts drop free; at short notice they count as missed.

**Measured** (the late harness, 4 seeds a cell):
- **Crew drama** came to 16 of 16 social careers (13 before), median day 113. Mara ends a Regular in all 16 (rarely before), Tam in 1. Three pairs: Rico over Sage 10, Sage over Rico 4, Rico over Mara 2.
- **The A league:** a promoted V4 or V5 is mid-table and wins no season; a V6 comes second. From V7 it wins every season, $945 to $1,020 a season.
- **The dyno comp,** won year by year: sampled four times in each of its first four years:
  - a V8 wins 2, 3, 0 and 0 of 4 (it won 2 in 4 before);
  - a V10 wins 4, 3, 2 and 2 of 4 (every one before);
  - a V12 wins 4, 4, 4 and 3;
  - a V14 wins every one.
- **Heirs:** V2, V3 and V4 from V5, V8 and V10 mentees, from every start.
- **The full harness:** every target passes but Outdoors, the accepted shortfall, which is now 3 of 4 (2 of 4 before).
  - The career bots reach V10 on a median day 179.5 (180.5 before).
  - Act III ends in every career, on a median day 274.5 (296.5 before). That's Sage's lessons coming back to the bots.

**Against its Done-when:** all four pass.
1. Crew drama falls on three pairs.
2. A promoted V5 doesn't sweep the A league, and from the second year a V10 doesn't win every dyno comp.
3. V5, V8 and V10 mentees leave different heirs.
4. The harness's targets pass as before.

**Phase 26 closed by Evan's call (13 Oct 2026),** with Phase 26b's money in a day. Carried: crew drama still falls mostly on Rico over Sage, and Tam is rarely a Regular, for playtesting. The CURRENT MILESTONE moves to Phase 27.

**Phase 26b, money in a day (13 Oct 2026, Evan's call, from playing it).** 0.999.35, no save change.

**The problem:** once the card is in the red it's hard to climb out, even working doubles, busking and collecting cans.
- A broke day costs about $31: the Lot, the week's bills, ramen.
- One shift a day, and a first-rank shift pays $28–30. That only treads water.
- A double clears about $24, so from the card's floor (−$150) it was 6–9 days of doubles and nothing else.

Evan's calls: day labor, crag tourists, selling kit, plasma and a second shift a day. Not borrowing from friends. Numbers [proposed] in `GIG`, `TOURISTS`, `PLASMA` and `KIT.sell`; rules in `gigs.ts`; the gigs and lines in `content/gigs.ts`.
- **A second shift:** two shifts a day at most, at two different jobs. A double, a warehouse day or day labor is the whole day. Sign-ups stay one a day, so a second shift is always a walk-in: it pays, and it doesn't count toward a raise.
- **Day labor:** a gig on the market's board on about 3 days in 7. A move in Old Town, a truck at the market, a trail crew day, the crafts fair, Ed Miller's hay in summer and fall, the motel's snow in winter. Start by 8:00, nine hours, $80, the whole day, no rank. The jobs sheet lists the week's gig days.
- **Crag tourists:** at a busy or packed crag, with a rope and a roped line you've sent there, about one day in two a family asks you to hang them a rope. An hour, $20 and up to $10 in tips, once a day. You're told when you get there, and you say yes from the van. It's the one earner that leaves the day for climbing.
- **Selling kit:** the gear shop buys back the rack, the rope and harness, a second pad, the hangboard or the headlamp, any day, at 40% of the price. It's money now, and whatever the kit climbed is shut to you till you buy it again.
- **Plasma:** at the clinic, Tuesdays and Fridays, once each. Two hours, $30, and the rest of the day's windows narrowed to 92%.
- **Fixed on the way:** the card's dial said a maxed card stops you driving. The rules never did: you drive on what's in the tank. The comment now says so.

**Measured** (the late harness, "Out of the hole": a V3 from −$150 in spring, nothing climbed, 4 seeds each), days to get back to $0, median (slowest):
- a café double every day: 7.5 (9);
- a café shift, then the diner or setting when either is posted: 4 (8);
- day labor when it's posted, a double when not: 4 (6);
- a double, and plasma on its days: 4 (4);
- selling the rack, then doubles: 2 (2).

An hour of each: day labor $9 (a first-rank café shift $9, the warehouse $7), a family's rope $20 and tips, plasma $15. The last two out-earn a shift an hour but are limited: busy crag days only, and twice a week. The hustle target (cans, bins, foraging under the worst shift) is unchanged. No bot uses the new earners, so every other target measures what it did: unchanged from Phase 26. V10 on a median day 179.5, Act III on a median day 274.5, and Outdoors, the accepted shortfall, 3 of 4.

### Phase 27 — The rock, by hand

*Large. The core, deepened.*

**Goal.** Each crag climbs like its rock, and no two lines at a crag ask for the same moves.

**Why.**
- 68 of the 83 single lines draw their cruxes from one library: two sequences a style, 12 in all.
- All 24 wall pitches share one shape and one line.
- Big Stone has five single lines.

**Scope.**
- **Each crag's rock in its cruxes:**
  - granite's friction and cracks;
  - sandstone soft after rain (carried from Phase 10);
  - tufas, with kneebar rests.
- **A hand-made crux on every classic** (about three a crag), and a library for each crag for the rest.
- **Wall pitches by kind:** crack, chimney, traverse, roof, slab, each with its own crux and lines.
- **Declare a flash** (the audit's climbing #12). Say it before the go: a send pays psyche and goes in the Record Book, and a fall costs the flash and some psyche.
- **Pads and a spotter** on boulders and highballs (the audit's climbing #21). Where a boulder has two places to fall, where the pad goes matters.
- More single lines at Big Stone.

**Evan's call:** which rock and which moves go where. This phase leans on his coaching most.

**Done when.**
1. The content test finds no crux sequence shared within a crag, and at least three pitch kinds on every wall.
2. A declared flash plays in tests and in the e2e.
3. The harness's grade progression stays inside Phase 6's bands.

*Evan's calls (13 Oct 2026):*
- **The rock leans on styles:** each rock's beta comes in the styles it favors, and v0.956's skin cost by rock comes back.
- **Sandstone is shut the day after rain.**
- **Calling a flash (or onsight)** stakes psyche both ways, with a Record Book entry for ten called sends.
- **On a highball you choose where the pad goes.**

*The rock map, proposed for Evan to edit:*
- Roadside: granite, crimps, cracks and slabs.
- The Gorge: granite, shaded, slabs, cracks and corners.
- Moonstone: quartzite, sharp edges and high slopey top-outs.
- The Mesa: sandstone, slopers, splitters and varnish crimps.
- The Big Stone: granite, corners, cracks and roofs.
- Wind River: alpine granite, thin cracks and cold edges.
- The Crucible: gneiss, incuts and compression.
- The Cove: limestone, tufas, pockets and steep jugs.
- Miller's Bluff: limestone, tufas, kneebars and pockets.

A signature line at each crag is hand-made: The Pump, The Classic (Gorge), Moonstone, The Prow, The Classic (Big Stone), Astroman, The Myth, The Deep, The Tufa.

*The slices:*
- **27.1 Rock as a rule:** each crag's rock, its skin, sandstone shut the day after rain, and Moonstone's pads kept at Moonstone.
- **27.2 The rock's beta:** a pool of moves for each rock. Within a crag no two cruxes share an obvious move or a pair. One hand-made signature line a crag. The gyms keep the plastic library.
- **27.3 Wall pitches by kind:** crack, corner, chimney, traverse, roof, slab and face, each with its own line, crux, rest and topo.
- **27.4 Calling it:** call the flash or the onsight on a first go.
- **27.5 The top-outs and the pad:** highballs get a top-out crux, and you choose which crux the pad goes under. Split from 27.4 (13 Oct 2026), since the top-outs need moves of their own and a balance pass.
- **27.6 More at the Big Stone,** and the close.

**Status (13 Oct 2026): 27.1 built: rock as a rule.** 0.999.36, no save change.
- **The rock:** each crag carries its rock (`PlaceDef.rock`). A go's skin outdoors is real rock's 1.35 times the rock's own (`ROCK.skin`): sandstone 1.25, quartzite 1.12, granite 1, gneiss 0.95, limestone 0.85. A crimp at the Mesa costs 12 skin, the same at the Bluff 8.
- **Sandstone after rain:** a sandstone crag that's seeping is shut: "The sandstone’s soft after rain. Holds snap when it’s wet." The place card says so before you drive, a go and a wall refuse, and Tam goes to the Gorge.
- **Pads:** the Moonstone haul's pads count only at Moonstone. They'd been counting at every crag once it was unlocked. A second pad of your own goes everywhere. The landing note says one pad, two pads, or the haul's.
- **The harness:** every target passes as before. The career bots reach V10 on a median day 181 (179.5 before) and end Act III on day 270.5 (274.5). Outdoors, the accepted shortfall, is 3 of 4, now on a median day 387 (374): the Mesa's wet days and its skin.

**Status (13 Oct 2026): 27.2 built: the rock's beta.** 0.999.37, no save change. The moves are in `content/rock.ts`; `inRock` in `content/routes.ts` applies them.
- **The moves.** Each rock has a pool of moves, 158 in all: 29 first ways and 12 earned on granite, 9 and 9 on quartzite, 14 and 10 on sandstone, 12 and 9 on gneiss, 20 and 6 on limestone. The other 28 are the signature lines'.
  - They're written for the rock: friction, crystals, ring-locks, offwidths and stems on granite; pockets and slopey lips on quartzite; varnish, huecos, ironstone and soft cracks on sandstone; razor incuts and compression on gneiss; tufas, kneebars and two-finger pockets on limestone.
- **Each line's cruxes** take a first way and an earned one from its rock, chosen to fit the crux by hand in `ROCK_LINES`.
  - Within a crag no two cruxes start the same way, and no two share a sequence. `content.test` holds every crag to that.
  - The test also checks that no outdoor crux still uses plastic moves, and that every move in a pool is used, and only at its rock's crags.
- **Difficulty stays put.** A move must have the same verb as the beta it replaces. It keeps that beta's window, drift, time in the band and skin cost, so the Local Testpiece's hand-tuned windows survive.
  - What changes is the name, the words, and the style it leans on. Sandstone's crimps are as often a pinch (power); quartzite's hard moves are as often a razor crimp.
  - A crimp-style move is crimpy, so thin skin narrows it.
- **The signature lines**, made by hand: the Gorge Classic, Moonlight Arête, The Prow, Valley Classic, Astroman (with a Harding slot), the myth above Threshold (its kneebar and its mono), The Deep End, and the bluff's tufa. The Pump was hand-made already.
- **What stays put:**
  - The gyms, the Cave, the Center and the comps keep the plastic library.
  - Beta ids are unchanged, so saves keep what they'd learned. The e2e's Pump heel-hook is the Pump's own.
  - The download is 412.6 KB of 440 (401.6 before).
- **The harness:** every target passes as before. A median climber's first V5 go is on day 19. The career bots reach V10 on a median day 181.5 (181 after 27.1) and end Act III on day 269.5 (270.5). Outdoors, the accepted shortfall, is 3 of 4 on a median day 387, unchanged.

**Status (13 Oct 2026): 27.3 built: wall pitches by kind.** 0.999.38, no save change.
- **Seven kinds** (`PITCH_KINDS` in `content/routes.ts`): face, crack, corner, chimney, traverse, roof and slab. A kind sets a pitch's length, where its crux sits, whether there's a rest, and its line on the beta sheet.
  - A chimney and a corner rest partway, and a slab at its stance. A roof, a crack, a traverse and a face give you nowhere to rest.
  - Each crux comes after about as much climbing as the old single shape's, counted from the belay or from the rest. So a pitch is still as hard as its grade.
  - Measured with the bot's hands, the grade at which a balanced climber sends a pitch half the time moves by 0.16 at most. That's the roofs, which got a little easier. No wall's hardest pitch got harder.
- **Each wall's kinds** follow its pitch names:
  - the Long Prow has a slab, a face, a roof and a crack;
  - Golden Buttress has five kinds, Obsidian Tower six and the Ascendant six;
  - every kind is used somewhere.
- **The moves:** 48 new granite moves written for the pitches (`content/rock.ts`), a first way and an earned one for each. For example:
  - pad, or stand in the dish, on a slab;
  - stem, or layback the edge, in a corner;
  - back and foot in the chimney;
  - bicycle the lip of a roof;
  - cross through on a traverse.
- **Pitches follow the crag's rule.** At Roadside and the Big Stone, single lines and wall pitches together, no crux repeats a first way or a sequence.
- **The topo.** A pitch's line follows its kind: a traverse goes across the face, a roof goes up to the roof and out to its lip, and a corner leans with the corner. Its feature is drawn on the rock under your line: a crack's seam, a chimney's slot, a corner's shadowed wall, the roof, or the traverse's break.
- **What stays put:** expeditions keep their pitches, as planned.
- **`content.test`:** every wall has at least three kinds, each pitch has its kind's shape, and any rest comes before the crux.
- **The download** is 417.3 KB of 440 (412.6 before).
- **The harness:** every target passes, with the same medians as 27.2:
  - first V5 go on day 19;
  - V10 on day 181.5;
  - Act III ended on day 269.5;
  - walls and expeditions with no refusals and no stuck nights;
  - Outdoors at 3 of 4 on day 387, the accepted shortfall.

**Status (13 Oct 2026): 27.4 built: calling it.** 0.999.39, save v58. Done-when 2 passes: a called first go that sends plays in the tests and in the e2e.
- **The call.** On a first go at a line you've never sent, the beta sheet offers "Call the onsight", or "Call the flash" once someone's told you the beta. It's off till you tap it, and it's a checkbox of its own, not a beta row.
  - The go carries it (`call: true`), and you say it out loud before you start.
  - Any other go has nothing to call, and the call is dropped.
- **How it ends:**
  - A called go that sends keeps the call in the log (`SendRecord.called`). The send sheet and the card say so: "Onsight, called".
  - A called go that falls says so on the fall sheet. The next go is a plain one.
- **Psyche, both ways (Evan's call):**
  - A called send is worth a send again (`PSYCHE.called`, 4).
  - A called go that falls costs as much (`PSYCHE.calledFell`, 4).
  - Both are settled outside the day's cap, since a good day out reaches the cap already and would swallow the win.
  - Tonight's sheet names them: "a send you called", "a call that didn't go".
- **The Record Book:** "Called It", for ten called sends, makes 47 entries.
- **Save v58:** a send can carry `called`. The migration from v57 changes nothing, since nothing before it was called. A real 0.999.38 save (`fixtures/save-v57.json`, 35 sends) loads as it was.
- **The bots** never call, so the harness doesn't move.
- **The e2e** calls the onsight on the Warm Boulder, sends it, and checks the sheet, the card and the save.
- **The download** is 418.0 KB of 440.

**Status (13 Oct 2026): 27.5 built: highball top-outs, and where the pad goes.** 0.999.40, no save change.
- **The top-out.** Every highball gets a second crux at its lip, "The top-out", two moves past where the line used to end (`topOut`, `TOP_OUT` in `content/routes.ts`).
  - The height stays, so the line's first crux now comes off lower, and the top-out is the worse fall.
  - Its 36 moves are written for each rock (`TOP_OUTS` in `content/rock.ts`): a granite mantel, a quartzite sloper, a sandy sandstone top, a cold gneiss lip, a grassy limestone top.
  - Four crux names changed to fit: the Highball Arête's and the Tall Arête's "The top", Moonstone Mantel's "The mantel" (its top-out is now the mantel) and "The last hard move". Two lines lost the move counts they'd hand-typed.
- **Difficulty:**
  - A top-out as hard as a crux at the line's grade made highballs up to 1.1 grades harder, because it decided the sends that the easier cruxes used to.
  - Its window is widened instead (`HIGHBALL.topOut`), since the line's grade is its crux's.
  - Measured with the bot's hands, no highball's half-send grade moves more than 0.2, and most don't move.
- **One fall height.** A fall off a crux comes from the move after it starts (`cruxFallMoves`), as the climb counts your high point. The landing roll, the beta sheet and the bot all use it now. The sheet and the bot used to take the crux's midpoint.
- **The pads.** With more than the one pad (your second, or the haul's at Moonstone), they cover one fall, and you choose which on the beta sheet.
  - It defaults to the worse fall, and the choice holds for the day's goes.
  - Each choice shows the odds at both falls.
  - The spotter, when there is one, is named and still halves every fall.
- **The bots** read the worse of the two falls, with the pads under it.
- **The harness:** every target passes.
  - First V5 go on day 19; V10 on day 179.5 (181.5).
  - Outdoors reached the top in 4 of 4 runs, on day 369.5 (it was 3 of 4, the accepted shortfall).
  - Act III's median moved from day 269.5 to 314, so I reran the ending with 6 seeds a start on main and on this branch:
    - Act III's median was 312 on main and 319 here. Career by career, the branch averages 13.6 days later, with a standard error of 14 days, so it's within the noise. The 269.5 had been a low draw from 8 careers.
    - Act IV finished 18 of 24 times, against 15 on main.
- **The download** is 421.3 KB of 440.

**Status (14 Oct 2026): 27.6 built: more at the Big Stone.** 0.999.41, no save change.
- **Four new single lines**, all granite, with names and grades [proposed]:
  - **Meadow Arête**, a V8 technical boulder in the meadow. It's the crag's first V8, the grade it opens at.
  - **The Erratic**, a V11 power boulder the glacier left at the wall's foot. At 18 ft it's a highball, so it tops out.
  - **The Big Stone project**, an open V13 crimp boulder at the end of the valley (Evan's call). The first to send it names it. A Big Stone guide of your own can now be written: the Big Stone had no open line before.
  - **The Apron**, 5.13b, bolts up the slab between Valley Classic and the corner. It has a rest, a polished crux, and a water streak near the chains, drawn on the close-up.
- **Their moves** are granite moves not yet used at the Big Stone. The Erratic's top-out is new: a polished mantel and a frost crack. The crag rule holds: no first way and no sequence repeats.
- **Measured** with the bot's hands, each new line's half-send grade sits where its style's lines do: Meadow Arête −0.5, The Erratic −1.3, the project −0.6, The Apron −0.4.
- **Also changed:**
  - the Big Stone test, which listed v0.956's five lines;
  - the layout's comment and tags: the Apron is line 2, the corner 3;
  - the README's count, which had been stale since well before this phase: 87 crag lines.
- **The harness:** every target passes.
  - First V5 go on day 19; V10 on day 179 (179.5 after 27.5).
  - Act III ended on day 317 (314 after 27.5; the 24-career median was 312 on main and 319 after 27.5).
  - Outdoors reached the top in 4 of 4 runs, on day 376.5 (369.5 after 27.5).
- **The download** is 421.9 KB of 440.

**Phase 27 against its Done-when (14 Oct 2026):** all three pass on the build.
1. `content.test` finds no crux sequence shared within a crag, wall pitches included, and at least three pitch kinds on every wall (since 27.2 and 27.3).
2. A called flash or onsight plays in the tests (`call.test.ts`) and in the e2e, which calls the onsight on the Warm Boulder and sends it (27.4).
3. The harness's targets, the grade progression among them, pass after every slice.

**Phase 27 closed by Evan's call (14 Oct 2026).** Carried: the Big Stone's four new names and grades stay [proposed] for Evan to edit; the bots don't call a go, so the call's psyche is in the tests and the e2e but not the harness. The CURRENT MILESTONE moves to Phase 28.

### Phase 28 — The crew

*Medium. New, from the audit's list of what to keep (`social.md`): the crew's name, its renown, a crew project, favours. The rebuild has none of them.*

**Goal.** Your partners are a crew with a name, a shared project and debts to each other.

**Scope.**
- **A name.** With two Regulars or more, you name the crew.
- **A crew project:** a hard line the crew works over weeks.
  - Each partner's go shows everyone a crux. It's the send train the glossary already names.
  - The crew's send goes in the Record Book.
- **Favours.**
  - Ask a Regular to cover a shift, lend a rack, or drive you.
  - They ask back on their own clock, and a no costs bond.
  - A favour two of them want is another way into crew drama.
- **Renown.** The crew's name turns up in the threads and in the old guard's lines.

**Done when.**
1. A social bot's career names a crew, sends its project, and trades favours both ways.
2. Old saves load into the new shape.

**Planned (14 Oct 2026), with Evan's calls:**
- **The project:** you pick it: any unsent line at a crag the crew can be called to, two grades or more above your hardest send.
- **The send train:** your send starts it. Each partner's go shows you a crux; when you send with the crew there, each of them sends after you.
- **Owing:** a Regular you owe two won't do a third till you've done one back. It's shown on the People list, with no hidden clock.
- **Renown:** lines only, counted from what the crew has done, never a number.
- **Slices:** 28.1 the name (save v59); 28.2 the project, crew days and the send train; 28.3 favours; 28.4 renown and the close.

**Status (14 Oct 2026): 28.1 built: the crew's name.** Save v59, 0.999.42.
- **The crew** is the partners you're a Regular with or closer, closest first. Tam leaves it once he's stopped coming out.
- **The beat:** with two of them, whichever you see first brings it up, once, in their own words.
  - "Name it" opens the naming sheet.
  - "Later" leaves a "Name the crew" button on the People list.
- **The name:** your own words, or one of four from your record: where you send most, your dog, the crowd you're in with (or neither), the van. It's 2 to 28 characters, and it stays named.
- **Shown:** the People list ("The crew: …, named on day N. Hazel, Sage and you.") and the crew's texts. The night lifts psyche like a send.
- **The bots:** every bot names it with the first suggestion. Sage's beat is answered by all of them, so it can't stand in front of her lessons.
- **Save v59:** `crewName`. A real 0.999.41 save loads, its crew close and ready to name.
- **The harness:** every target passes.
  - The crew was named in 8 of 8 social careers, on day 22 at the median (18 to 29).
  - V10 on day 178 (179 after 27.6); Act III ended on day 312.5 (317; its spread is about ±40 days); Outdoors 4 of 4, on day 376.5.
- **Early, as v0.956's was** [measured]. Two Regulars come in the first month, so the name comes before the crew has done much. The roadmap's rule says two. If it should wait, `CREW_NAME.min` or the tier is the dial.
- **The download** is 423.6 KB of 440.

**Status (14 Oct 2026): 28.2 built: the crew project and the send train.** Save v60, 0.999.43.
- **The project:** with the crew named, any line can be its project if it's:
  - unsent, at a crag the crew can be called to;
  - two grades or more over your hardest send of its kind (Evan's call).

  There's one at a time, and you can drop it.
- **A crew day:** called from the crew's texts, once a week across projects. Before the invite hour it's for today; after, for tomorrow.
  - Everyone who can make it comes.
  - The away, the not-close-enough and anyone keeping clear of a yes say no, so a falling-out bites here.
- **The crew goes first:** each of them there has a go and shows you a way through you didn't have, in their voice, as told beta. A first-go send after it is a flash.
- **The send train:** your send takes them up it after you (Evan's call). The night lifts like a send, and the Record Book has "Send Train" (48 entries). Sent alone, it's sent with no train.
- **The bots:** only the social bot runs a project. It picks the easiest line that qualifies, calls a day a week, and works the project on it.
- **Save v60:** `crewProject`, `crewDay`, `crewSends`. A real 0.999.42 save loads, its crew named and no project yet.
- **The harness:** every target passes.
  - A project was sent with the crew in 8 of 8 social careers: the first on day 30 at the median (26 to 93), and 5 a career by day 300.
  - V10 on day 178; Act III ended on day 312.5; Outdoors 4 of 4, on day 376.5.
- **The first one goes fast** [measured], about a crew day after the crew is named. Two grades over a month-one climber's best is a small step while they're improving quickly. Later projects take about two months each. `CREW_PROJECT.over` is the dial if it should feel like weeks from the start.
- **The download** is 426.1 KB of 440.

**Status (14 Oct 2026): 28.3 built: favours, both ways.** Save v61, 0.999.44.
- **You ask,** from the crew's texts, once a day each:
  - **cover your next shift:** off the schedule, no strike, no pay, no credit;
  - **lend a rack** for the day: Hazel, Mara or Tam;
  - **drive you:** Hazel, Sage, Mara or Tam. No gas, no wear, no breakdown, whatever state the van's in.

  It's owed back, or it squares what they owed you. You can owe any one of them two, and no third (Evan's call).
- **They ask,** once a fortnight each, on a day the seed picks: a belay, a ride, or a loan that comes back a week later. The Yes button shows the cost from the dials. A yes squares a debt or banks one; a no costs a point of bond.
- **Two want your day:** while nobody's fallen out, an ask for your time after a yes to another that day is crew drama's pick or keep. Hazel stays out: her talk has no mend.
- **Shown:** the People list and the favour sheet say who owes whom.
- **The bots:** every bot answers the asks, yes when it can afford it, so Sage's ask can't stand in front of her lessons. The social bot also asks for rides, racks and a covered shift on a crew day.
- **Save v61:** `owed`, `favour` and `lent` on a person. A real 0.999.43 save loads, its projects and trains kept.
- **The harness:**
  - Favours went both ways in 8 of 8 social careers. The crew was named and a project sent with it in 8 of 8.
  - V10 on day 179; Act III ended on day 326 (it moves ±40 between runs).
  - **Outdoors came out 3 of 4 (✗), median day 410.** Over 16 careers each it's the same on both sides: main reached the top in 9, at a median of day 371, and 28.3 in 10, at day 371.5. The four-career target sits on a rate of about 60%, so main's 4 of 4 was luck on the seeds. No change is needed for it, but the target is unreliable [measured].
- **The download** is 429.0 KB of 440.

**Status (14 Oct 2026): 28.4 built: renown.** No save change, 0.999.45.
- **Renown** (Evan's call: lines only, never a number) is counted from the crew's record: each project sent with the crew there, and each month it's had its name. It comes in three tiers, and the first arrives with the first send train.
- **The threads:** once the crew's known, the threads about you name it.
- **The old guard:** Ray on the rail and Frank by his stove each have a line per tier, said once ("Frank heard about Gorge Rats at the hardware store…").
- **The strangers and the shops:** six crowd lines and one each at the gear shop and the diner, by tier, with the crew's name filled in.
- **The bots:** the social bot hears the old guard out, so its sits with Ray and Frank go on.
- **The harness:** Phase 28's criterion 1 is a target now, and passes: 8 of 8 social careers named a crew, sent a project with it and traded favours both ways.
  - V10 on day 179; Act III ended on day 326.
  - Outdoors came out 3 of 4 again (✗), the same four careers as 28.3. As measured there, it's the same rate as main over 16.
- **The e2e** failed once at the horseshoes while the harness ran beside it: that step polls each animation frame, and a loaded machine skipped the band. Run alone, it passes.
- **The download** is 430.2 KB of 440.

**Phase 28 against its Done-when (14 Oct 2026):** both pass on the build.
1. A social bot's career names a crew, sends its project and trades favours both ways: 8 of 8 in the harness, now a target.
2. Old saves load into the new shape: real 0.999.41, 0.999.42 and 0.999.43 saves load into v59, v60 and v61, each with its test.

Carried, for playtesting or a call:
- The crew's name comes early (day 22 at the median), as v0.956's did.
- The first project goes fast, about a crew day after the name.
- The bots never say no to a favour.
- Outdoors' four-career target sits on a rate of about 60%.

**Phase 28 closed by Evan's call (14 Oct 2026),** with those four carried. The CURRENT MILESTONE moves to Phase 29. The download is 430.2 KB of 440.

### Phase 29 — The van, lived in

*Medium. Ties the hustle, the van, food and psyche together.*

**Goal.** What you scavenge builds the van, the van ages into a decision, and a meal is a thing you make.

**Why.**
- The hustle, the Board and cooking are single taps.
- The van never ages out (the audit's core loop, ADD 4).
- Carried from Phase 22: the cooking minigame, and psyche lifted by Scout, the fire and the events.

**Scope.**
- **Scavenging finds parts** for build-outs (a shelf, a solar panel, a heater, a better bed), each with an effect on supplies, winter nights or sleep.
- **The van ages.** When repairs cost more than it's worth, you choose: rebuild it, replace it (the dream van), or limp on.
- **Cooking at the van** is a short minigame. A good meal lifts recovery and psyche, as Scout and the fire do.
- **The Board** posts three bounties a week, and you pick one.

**Done when.**
1. The hustle has a choice with a trade-off.
2. The replacement decision comes to a bot career by year three.
3. Cooking plays in the e2e.

**Planned (14 Oct 2026), with Evan's calls:**
- **Age:** the van ages with miles driven.
- **Replacing:** a used van (fresh miles, no build-outs) or the Rig; rebuild and limp on are the other choices.
- **Build-outs:** new ones, from scavenged parts; the garage's cash upgrades stay.
- **The download budget** goes to 460 KB.
- **Slices:** 29.1 scavenging and build-outs; 29.2 the Board's bounties; 29.3 the van ages, and the decision; 29.4 cooking, and the close.

**Status (14 Oct 2026): 29.1 built: scavenging and build-outs.** Save v62, 0.999.46.
- **The free pile,** a new hustle at the Lot, by day, once a day. It takes the cans' time and sweat and finds one or two parts, not money. A broke morning is cash now or the van later: criterion 1's choice with a trade-off.
- **Build-outs from parts,** at the van, each built once:
  - **a shelf:** a quarter less supplies used a night;
  - **a solar panel:** the battery holds overnight;
  - **door seals:** less of a winter night's cold, on top of insulation;
  - **a bed platform:** more energy from a night's sleep, on top of the mattress.

  All four take about nine mornings at the pile.
- **The budget** is 460 KB (Evan's call).
- **Save v62:** `parts`. A real 0.999.45 save loads, its favours owed kept.
- **The bots** go to the pile only on a day they didn't climb, with energy to spare, and build in a set order.
  - **Measured:** at the pile every evening they could, the media bots' climbing paid for the lost rest. Over 16 careers each, 12 reached the top against main's 15. With the rule, it's 16 of 16.
  - **The cost of the rule:** the career bots climb nearly every day, so they rarely reach the pile: 0 or 1 parts by day 224, and nothing built. The build-outs are a player's choice the harness doesn't exercise [measured].
- **The harness:** every target passes but Outdoors, at the known 3 of 4.
  - V10 on day 179; Act III ended on day 303; Media 4 of 4.
  - The hustle rule holds; the pile pays parts, not cash.
- **The download** is 431.3 KB of 460.

**Status (14 Oct 2026): 29.2 built: the Board's bounties.** Save v63, 0.999.47.
- **The Board's three jobs are bounties** (Evan's calls). You take one on the Journal's Board page; the other two come down, and only yours pays.
  - **It counts from when you take it,** so a job already done is worth nothing taken late.
  - **It pays double the job's old worth,** dealt each week as one cash, one parts and one split bounty. A part counts as $4: what the cans pay for the time the pile takes to find one. So every week is money now or the van later.
  - The best a week can pay is $36 (it was $54, all three paying), under the cap of $56.
- **Save v63:** each job's pay, and the pick. The week's board comes down and goes up again as bounties on the next thing you do. A real 0.999.46 save loads, its parts kept.
- **The bots** take one the moment the board goes up, or when they're next free (not away on a trip, no answer owed): the one whose cash, times how much of the job they got done the week before, is most.
  - **Measured:** a bot that counted parts at what they'd fetch reached the top of Outdoors in 13 of 32 careers, against main's 20; on cash alone, 21. So the bots never take parts, and the build-outs stay a player's choice the harness doesn't exercise.
  - The first run also caught the bots asking for a bounty on El Capitan, refused 403 times across the full careers. They now wait until the day will have it.
  - The bots take $10 a week off the Board, down from about $14.
- **The e2e** takes a bounty on day two.
- **The harness:** every target passes but Outdoors, at the known 3 of 4.
  - V10 on day 180.5; Act III ended on day 310.5; Media 4 of 4.
  - The hustle rule and the Board's cap hold.
- **The download** is 431.9 KB of 460.

**Status (14 Oct 2026): 29.3 built: the van ages, and the decision.** Save v64, 0.999.48. Phase 29's criterion 2 passes.
- **Miles** (Evan's call): every drive adds its minutes at 45 mph to the clock; a friend's ride adds none. A new climber's van has 160,000 on it.
- **The engine's cap:** a service brings the engine back only so far, a point lower every 250 miles: 85 at the start. Tires and the battery still go back to new. A repair is billed for the points it puts back, so a service costs about what it did.
- **Dale's verdict:** the van's worth is its engine's share of $1,500. At the garage, once that's under a $900 rebuild, Dale puts it to you, once:
  - **rebuild** ($900, a day): the engine runs like one with 8,000 fewer miles; everything fitted stays;
  - **trade in for a used van** ($1,200 less your van's worth): fresh miles, and what's fitted stays with the old one, but the toolkit (Evan's call);
  - **the Dream Rig**, from the jar: now a new van too, fitted and built out, and Dale pays for the old one;
  - **limp on:** service it to a falling cap, and break down more.
- **Save v64:** the van's miles, the miles rebuilds took off, and the day Dale said it. Old saves start the clock now (Evan's call). A real 0.999.47 save loads, its bounty kept.
- **The bots** hear the verdict when it's due, then save for the cheaper way out. They rebuild when the cash covers it past their cushion, trade in when that covers a used van, and limp on otherwise.
  - **Criterion 2, measured:** all 16 career bots heard Dale by year three, between days 91 and 136 (median 105). All 16 traded in (median day 115); one rebuilt its second van, on day 221.
  - **The cost [measured]:** the trade-in lands as many careers reach the Moonstone. A bot short of the trip then gets to V8 and saves for The Big Stone and Wind River first. Over 32 careers to day 480, Act II ended on day 156 (median), against 100.5 on 29.2. 20 saw the story through, against 21.
  - Two bot changes measured worse and were dropped. Keeping the story's trip money back from the van: 16 of 32. Making the story's crag come before saving for the next unlock: Act II on day 85.5, but 15 of 32 saw the story through.
- **The e2e** checks the van's miles; its hand-built vans keep theirs.
- **The harness:** every target passes but Outdoors, at 2 of 4. The new verdict target passes, 16 of 16 by day 168.
  - V10 on day 182; Act III ended on day 339; Media 4 of 4.
  - Over 32 careers, Outdoors is 20 against main's 21.
- **The download** is 433.0 KB of 460.

**Status (14 Oct 2026): 29.4 built: cooking at the van.** No save change, 0.999.49. Phase 29's criterion 3 passes.
- **A recipe goes to the stove:** the beat panel the busking and the horseshoes use, five stirs as the marker crosses the band. Or "Just eat it" before the first stir, and it's the plain meal it always was. Ramen stays a tap.
- **Cooked right** (seven in ten of the stirs' worth, a half for a near one), it's a good meal: 5 more energy from tonight's sleep, wherever you sleep, and psyche lifted as much as the fire's, inside the day's cap. Once a day. Scorched, it's still dinner. [proposed numbers]
- **The bots** eat as they did, so the balance they measure doesn't move. The harness wasn't rerun: no bot's path touches it.
- **The e2e** cooks pasta and greens on the beat at seven at the Lot and checks the good meal, the pantry and the sounds.
- **The download** is 433.7 KB of 460.

**Phase 29's Done-when, checked (14 Oct 2026):**
1. **The hustle has a choice with a trade-off** (29.1): the free pile's parts or the cans' cash, for the same morning.
2. **The replacement decision comes to a bot career by year three** (29.3): 16 of 16, days 91 to 136, now a harness target.
3. **Cooking plays in the e2e** (29.4).

All three pass. Closing the phase is Evan's call. Carried caveats:
- the bots never take parts, so the build-outs are a player's choice the harness doesn't exercise;
- Act II ends later since the van aged (median day 156, against 100.5), with the story finished as often (20 of 32, against 21);
- Outdoors is 2 of 4 in the harness's four careers.

**Phase 29 closed by Evan's call (14 Oct 2026),** with those three carried. The CURRENT MILESTONE moves to Phase 33. The download is 433.7 KB of 460.

### Phase 30 — Getting older

*Medium. Age is only a deadline now: nothing about the body changes from 22 to 45.*

**Goal.** The body changes with the years, and a late career has somewhere to go.

**Scope.**
- **Recovery and skin slow** with age, and past a dial's age injuries heal slower.
- **Head and technique grow** with years climbed.
- **A runway** (the audit's core loop, ADD 4): clinics, setting comps, an ambassador's deal.
- **Insurance priced by age.**

**Evan's call:** how hard age bites, from his coaching. The risk is that it reads as a punishment [INFERRED].

**Done when.**
1. A 40-year-old bot climbs within a set number of grades of its peak.
2. Careers retired at 30 and at 45 both read well in the epilogue.

**Planned (15 Oct 2026), with Evan's calls:**
- **From the survey:** age is a deadline and nothing else. No skill, recovery, injury or price reads it; the epilogue never reads the age you stopped at, and some of its lines assume a long career that ran out ("ran out of time first" for a Late Bloomer who chose 30). A 40-year-old career bot is about V13 (day 325). v0.956 aged the skills a go used, not the grade it showed: head and technique +1% a year from 28, power and fingers −2.5% a year from 32 (floor 60%), endurance −2% from 34; injuries +3% likelier and 2.5% longer a year from 28; insurance flat.
- **The body's curve (Evan's call: gentle, with skill offsets, at half the sizes first proposed):** a go uses your skills as your age has them: power and fingers −1% a year from 33, never below 85%; endurance −0.7% a year from 35; head and technique +0.5% a year from 28, up to +8%. Above V10 a share of a skill is a lot of grade (the curve's top is linear, 26 points a grade), so the first proposal, −1.5% and +1%, came to 1.6 grades harder on power lines at 40 and 1.5 easier on technical ones; these come to about one harder and 0.9 easier, for a V13 climber. The odds a go shows are those odds; the grade shown is your skills as trained; the You page says what the years have done.
- **Recovery (Evan's call: slower, not likelier):** a night gives back 1% less energy and skin a year from 30 (15% less by 45); injuries last 3% longer a year from 35. The odds of getting hurt don't change.
- **The runway (Evan's call: all three, from 35):** clinics at the Cave for a Coach or better; setting a comp's problems for a Senior setter or better; ambassador terms for a sponsored climber, the send ask becoming a clinic or a stand. Paid like work, never more than a job's.
- **Insurance (Evan's call):** catastrophic and full cost 3% more a year from 30 (about +45% at 45); the cover's the same.
- **Slices:** 30.1 the body's curve; 30.2 recovery, healing and insurance; 30.3 the runway; 30.4 the epilogue at 30 and at 45, the harness's age table, and the close.

**Status (15 Oct 2026): 30.1 built: the body's curve.** No save change (your age is read off the day), 0.999.58.
- **A go uses your skills as your years have them** (`AGEING` in the dials, `ageing.ts`): power and fingers 1% less a year from 33, never below 85%; endurance 0.7% less a year from 35; head and technique 0.5% more a year from 28, up to 8%. It reaches the crux windows, the pump, the pace, the cruxes a line gains over your grade, the speed wall's time, and through the go itself the odds a summit's shown.
- **The grade you see** is your skills as trained, so it doesn't drop: the years show on the lines, not the number.
- **What it comes to,** for a V13 climber against the same climber at 25: at 35, power lines 0.31 grades harder and technical 0.54 easier; at 40, power 1.07 harder, crimps and dynos 0.38, endurance lines even, cracks 0.22 easier, technical 0.92 easier; at 45, power 1.84 harder, technical 1.04 easier. For a V10 climber about half that.
- **The You page** says what the years have done, from the dials ("At 40, the years have your power and fingers 7% down, endurance 3.5% down and head and technique 6% up").
- **The first proposal was halved** (Evan's call): at −1.5% and +1% a year it came to 1.6 grades harder on power lines at 40 and 1.5 easier on technical, because above V10 a share of a skill is a lot of grade.
- **The harness** passes every target it passed on main; Outdoors, already short, falls to 1 of 4 (2 on main): the ropegun finished Act III on day 397 (365) and ran out of clock. Across the endings, careers of no origin finish Act IV 5 of 8 (4 on main) and Act III by median day 320.5 (339); Late Bloomers, who start at 26 and so meet the curve sooner, reach Act V 0 of 8 (1) and finish Act III 3 of 8 (4).
- **The download** is 440.8 KB of 460.

**Status (15 Oct 2026): 30.2 built: recovery, healing and insurance by age.** No save change, 0.999.59.
- **A night gives back less** (Evan's call; `AGE_COST` in the dials): energy and skin 1% less a year from 30, 15% less by 45, on every night (the van, the ledge, an expedition's tent). The evening's Tonight sheet says the same number the night gives.
- **An injury lasts longer:** 3% a year from 35, 30% longer at 45, on every roll that hurts you (a go, a landing, a deck, the walk out of an epic). The odds of getting hurt don't read your age.
- **Insurance by age:** catastrophic and full cost 3% more a year from 30, 45% more at 45; the cover's the same. The insurance sheet and the week's bills show the price your age pays.
- **The You page** adds what a night and an injury cost ("A night gives back 15% less, and an injury lasts 30% longer").
- **Shape:** the premium moved from `identity.ts` to `clinic.ts`, next to the bills, so it can read your age without a loop of imports; `identity.ts` keeps your origin's share of it.
- **The harness** passes every target it passed on 30.1; Outdoors stays 1 of 4. The cost lands on Late Bloomers, who start at 26 and so live most of a career past 30: 1 of 8 finish Act III (3 on 30.1, 4 on main). Careers of no origin finish Act IV 4 of 8 (5 on 30.1, 4 on main) and Act III by median day 334.5 (320.5, 339). The first month's injuries are as on main (2% warmed up, 6% cold and reckless), as the odds don't read age.
- **The download** is 441.0 KB of 460.

**Status (15 Oct 2026): 30.3 built: the runway.** Save v69, 0.999.60.
- **A clinic** (Evan's call: from 35; `RUNWAY` in the dials, `runway.ts`): a weekend morning at the Cave, before noon, for a Coach or better or a climber with a sponsor. It fills from what you've climbed (two, and one more for every three grades of your hardest send, up to six) at $11 a head: $66 at the most, under a Head coach's shift.
- **Setting a comp:** the day before one, at its venue, for a Senior setter or better: a long day up a ladder for $85, about a Head setter's hour, and tomorrow's comp climbs on your problems.
- **Ambassador terms:** from 35 a sponsor's cycle asks for a clinic where it asked for a send; the clinic answers it, and the cycle pays half an athlete's stipend. The feed says so ("Apex Climbing, keep it real, as an ambassador: $80 on day 64 if this cycle's asks are done").
- **Why half:** the send at your grade less one was what dropped an older climber's sponsor. With a clinic in its place at the full stipend, the media bots kept their sponsors to the end, and one media career's media came to 105% of its shifts (Phase 34's criterion 1 failed, 3 of 4).
- **Paid like work, never more than a job's:** both pay as a shift does (the money table counts them as shifts), and a test holds them under the jobs' own pay.
- **Shown:** the rows are on the desks (the Cave's for a clinic, wherever a comp's on tomorrow for its set), from 35 and once you could, with why not when you can't.
- **Save v69:** the clinic as a sponsor's ask. A real 0.999.59 save, a sponsored career at 35, loads as it was, and its next cycle asks for a clinic.
- **The bots:** a sponsored bot runs the clinic its sponsor asks for the first weekend morning it can; the business bot, a senior setter past 35, sets League night the day before at its gym.
- **The harness** passes every target it passed on 30.2; Outdoors stays 1 of 4, and the money target holds (media at most 80% of a media career's shifts; 105% before the half stipend). The bots used the runway: the media bots ran 9 to 17 clinics a career and were dropped by a sponsor 0 to 2 times; the business bots set 31 to 38 League nights from 35.
- **The download** is 442.0 KB of 460.

**Status (15 Oct 2026): 30.4 built: the epilogue at 30 and at 45, and the age table.** No save change, 0.999.61.
- **The epilogue says when it ended and how** (`STOP_END`): one line, after the people, where going home's sits for a career that went home.
  - Chosen before the years started on your strength (33): "You hung it up at 30, with the grades still coming. People said you’d be back. You came back to watch."
  - Chosen after: "You hung it up at 38 on a good day, before the years could make the call for you."
  - The body's call: "At 45 your body made the call you kept putting off. The power went first, the way everyone says it does; the feet and the head stayed to the end."
- **A late bloomer who chose the day** no longer "ran out of time first": "You started late and stopped on your own terms, and you climbed like someone who could hear the clock." The old line stays for one the body ended.
- **Read through:** bot careers stopped at 30 (one with no origin, one a Late Bloomer) and one the body ended at 45. The other lines come from what the career did (sends, people, the record), so a short career's epilogue is shorter, not wrong. A test holds the stop line to the age and the cause.
- **The age table** (criterion 1, in the ending harness): at 40, each career's level as a go has it, all round and on power lines, against the best before then; the grade shown beside it.
- **The harness:** 29 of 30 targets pass. Outdoors is 1 of 4, as since 30.1 (2 on main before Phase 30). The ladders' tables are unchanged from 30.3.
- **The download** is 442.2 KB of 460.

**Phase 30's Done-when, checked (15 Oct 2026):**
1. **A 40-year-old bot climbs within a set number of grades of its peak:** passes. The number is `PEAK_GAP`, 1 grade; all 16 careers are within it at 40, the most below their best 0.09 of a grade all round and 0.35 on power lines.
   - Why so close: the bots train every week to 40, so their gains still outrun a 7% loss on power and fingers, and technique and head are 6% up by then. A climber who stops training meets the whole curve; no bot does, so the harness doesn't show it.
   - A power line reads power and fingers, the two skills age takes, so the gap shows most there. On that blend the bots sit at 17.1 to 25.6, near or past the top of the scale (V18).
2. **Careers retired at 30 and at 45 both read well in the epilogue:** passes on the read-through above, held by `stopend.test.ts`; "read well" is a judgement, and the samples are in the PR for Evan's.

**Phase 30 closed by Evan's call (15 Oct 2026).** Both criteria pass. Carried: Late Bloomers feel age most (Act III finished 1 of 8, 4 before the phase), not ruled on; the ambassador's half stipend is a proposal; criterion 1 is met by bots that never stop training, so a climber who coasts past 33 isn't measured; Outdoors is 1 of 4 since 30.1 (2 before). The CURRENT MILESTONE moves to Phase 31. The download is 442.2 KB of 460.

### Phase 31 — After you

*Medium. The heir has a five-goal act and a coarse head start. The audit (`meta.md` #11) asked for the family name in the scene, a share of the money and a first quest of the heir's own. An inherited gym stays out.*

**Goal.** The climber who retires stays in the valley, and the heir inherits more than a head start.

**Scope.**
- **The old climber stays.**
  - Some nights they're at the fire, with lines from their career: sends, scars, crew, expeditions.
  - They give beta on the lines they sent.
- **What the heir inherits:** a share of the money (a dial), a name the old guard knows, and a first quest from the old climber.
- **A family book:** the old Record Book beside the heir's.

**Done when.**
1. An heir's career meets the old climber and takes beta from them on a line they sent.
2. A save from before the phase, with an heir, loads.

**The survey (15 Oct 2026).** The handover (`heirOf`) keeps the first ascents (re-tagged `kin:`), the whole Record Book, the van, what was owned, the trips, bolts, guides in print, the dogs and the mode, and `family {gen, forebear, lines, coach, mentee?}`. It drops the sends and their beta, the crew, scars, expeditions, the money, the age and the old guard's regard. No fixture holds an heir and no bot plays one. Nobody else can join the fire (`atFire` hard-codes Hazel, Frank and Sage), and no line knows a family name. Nothing in the game is a one-off quest from a person.

**Evan's calls (15 Oct 2026), all as recommended:**
- **Money:** a share, capped: a quarter of the money at the end (cash and the dream's pot), at most two weeks of the café's shifts.
- **The old guard:** lines plus standing. Ray, Frank and the crowd know whose kid you are, and the kid's standing starts part of the way to the forebear's.
- **The quest:** the line they never sent (their most-tried unsent line), with their beta. It falls back to their hardest send, and for an heir from before the phase, to their first ascent.
- **The family book:** a fresh book for the kid, the forebear's beside it. Old heir saves split by the retirement day.

**Slices:** 31.1 what they leave (save v70); 31.2 the old climber at the fire; 31.3 the name and the quest; 31.4 the heir in the harness and the e2e, and the close.

**Status (15 Oct 2026): 31.1 built: what they leave.** Save v70, 0.999.62.
- **What the family keeps** (`family.career`, `careerOf` in `heir.ts`): the lines they sent outside (the gym's sets come down; a wall's pitches are kept), the one they tried most and never sent (the harder of two tried as often), their age and how it ended, scars, summits, the crew's name, where they stood with the old guard, and the money they left.
- **The money** (`FAMILY.share` 0.25 of cash and the pot, at most `FAMILY.shifts` (10) of the café's shifts' pay, `leaveCap`): a debt isn't passed on, and the cap is under the cheapest dream (a test holds it). Create's Start button shows the kid's cash. The first morning says it once: "There’s an envelope in the glovebox with $70 in it and Robin’s handwriting on the front: “Gas first.”"
- **The old guard:** the kid's standing starts `FAMILY.old` (half) of the way from 50 to the forebear's, either way.
- **The family book:** the forebear's Record Book goes to `family.books` and the kid's starts empty. The Record page lists each earlier generation's entries by title under the kid's own. Entries for what comes with the keys (the dog, a dream owned, land, a guide in print) go in the kid's book on the first morning. Days on the road count from the kid's first morning (`day` aims read `day − life.held` for a family).
- **Save v70:** migration 69 splits an heir's book at `life.held` (the forebear's last day): entries to that day go to the forebear's page, any generation before lumped in with them. No `career` for them, so the old climber will know only their first ascents. Fixture `save-v69.json`: a career bot with a first ascent hangs it up at 31, and Jo climbs on (written from main's code).

**Status (15 Oct 2026): 31.2 built: the old climber at the fire.** No save change, 0.999.63.
- **At the fire** (`forebear.ts`): at the Lot after dark, every night till you've sat with them once, then `FAMILY.fire` (half) of nights, seeded. They're on the fire's card ("Hazel and Robin, and a camp chair with your name on it") and the van's fire row, not drawn in the scene. A drawn figure would mean a person with a talk tree and a place in the People list, which a forebear isn't. Drawing them is a follow-up, Evan's call.
- **Sit with them** (`FAMILY.talk`, 30 min, once a night, and it's a night at the fire): the first time, "Robin has a camp chair at the fire now, and a blanket they say they don’t need. “Sit. You smell like chalk and sunscreen. Good.”" Then a story from what the family kept (`FOREBEAR_LINES`): their hardest send, a first ascent, the line they never sent, a scar, a summit, the crew, how it ended, where the old guard had them, and some that need nothing. A line is said only when the family kept what it names, each once before any comes round again.
- **Ask about a line** (`FAMILY.beta`, 20 min, once a night): on the line of theirs you've had most goes on (or the easiest, with none), the next beta you don't know, told, so a first go after it is a flash: "Robin draws The Pump in the dirt with a stick and taps the crimp rail. “High-step and rock over. I fell off there for a month before anyone told me.”" Their lines are the outdoor sends the family kept, first ascents among them; an heir from before the phase has the first ascents only.
- **Tests:** `forebear.test.ts` (presence, the first night, the stories against what was kept, beta on the most-worked line and none on your sends, the v69 heir).

**Status (15 Oct 2026): 31.3 built: the name and the quest.** No save change, 0.999.64.
- **The old guard's word** (`content/kin.ts`, Evan's call: lines plus standing): Ray and Frank each say whose kid you are, once (a talk beat after their first meeting, `kinBeat`), as the old guard had the forebear (`kinBand`: at or past 56 well, under 45 not, otherwise neither way; an heir from before the phase, neither way). "“You’re Robin’s kid.” Ray looks you over like a topo he doesn’t trust yet. “They never chipped a hold in their life. See you don’t either.”" Strangers at a crag and the diner, the gear shop and the garage say it too (`KIN_CROWD`, `KIN_KEEPERS`, `when: { kin: true }`). The standing itself carries from 31.1.
- **The quest** (`questOf` in `heir.ts`, Evan's call): the line they never sent; without one, their hardest send; for an heir from before the phase, their first ascent. Given the first night you sit with them: "“One thing.” Robin looks off toward Roadside Crag in the dark. “The Project. I had all the moves. I never had them all on the same day. You might.”" They give beta on it too. The You page's family row names it, and says when it's sent.
- **Its send:** a line at the send, their word at the fire the next time you sit with them ("“You sent it.” Robin doesn’t say anything else for a while. Then: “How was the top?”"), a Record Book entry ("Unfinished Business", `kinquest`), and an epilogue line (`QUEST_END`; a first ascent's is the repeat line the family already had).
- **Tests:** `kin.test.ts` (the old guard's word by band and once; the crowd and the shops; the quest's three kinds; given, sent, heard, the book and the epilogue; not a quest till given).

**Status (15 Oct 2026): 31.4 built: the heir in the harness and the e2e.** No save change, 0.999.65.
- **The bot plays a family:** `playDays` takes `from` (the handover's state; the kid is made there), and every evening at the Lot a family's kid sits with the old climber when they're at the fire and asks about a line (`forebearNight`; the run keeps each ask, and whether the line was one they sent). The social bot answers the old guard's word (`kin-` beats) as it does the other moments.
- **The family harness** (in `career.harness.ts`, criterion 1): four career bots, one from each start, play 200 days and hang it up (all at 33, by choice); the kid each one coached climbs on for 112 days as the social career bot.

| start | hung up | left | old guard: theirs → the kid’s | lines kept | the quest | met | asks: theirs · the quest | old guard’s word | quest sent |
|---|---|---|---|---|---|---|---|---|---|
| boulderer | 33, chose | $9 | 84 → 67 | 15 | project: The open project, V7 | day 1 | 19 · 1 | frank | no |
| ropegun | 33, chose | $37 | 78 → 64 | 21 | project: Lunar Roof, V11 | day 1 | 24 · 1 | frank | no |
| technician | 33, chose | $12 | 84 → 67 | 26 | hardest: Lunar Roof, V11 | day 1 | 30 · 0 | frank | yes |
| allrounder | 33, chose | $213 | 90 → 70 | 22 | project: The open project, V7 | day 1 | 26 · 1 | frank | no |

  - Every kid meets them the first night it's at the Lot after dark, and asks about one of their lines 19 to 30 times in two years; the quest is the kid's ask once or never (the bot asks on the line of theirs it has worked most, else the easiest).
  - Frank's word comes to every kid; Ray's to none: he's at Roadside on weekend mornings and the bots aren't, and he's gone after year six.
  - The forebears left $9 to $213: a career bot at 33 doesn't hold much cash. All four stood well with the old guard (78 to 90), so every kid starts past the local-knowledge perk (56).
  - One kid sent the quest, the forebear's hardest (Lunar Roof, V11), on its fifth go at V8 all round: a power line for a power climber, with the forebear's beta.
- **The e2e:** the hanging-it-up section now plays Jo's first night: Robin at the fire, the chair and the line they give, and an ask that teaches the next beta on one of Robin's lines (Warm Boulder), as told.
- **The harness:** 30 of 31 targets pass, the family's among them. Outdoors is 1 of 4, as since 30.1. The ladders' tables are unchanged from 30.4: the bot's change reaches only a family's kid.

**Phase 31's Done-when, checked (15 Oct 2026):**
1. **An heir's career meets the old climber and takes beta from them on a line they sent:** passes. The family harness: 4 of 4 kids meet them and ask about lines they sent (the table above); the e2e plays it.
2. **A save from before the phase, with an heir, loads:** passes since 31.1. The fixture `save-v69.json` (a real heir save from 0.999.61) loads, its Record Book split, plays on, and its old climber is at the fire with their first ascents (`inherit.test.ts`, `forebear.test.ts`, `kin.test.ts`).

**Phase 31 closed by Evan's call (15 Oct 2026).** Both criteria pass. Carried: the old climber isn't drawn at the Lot (the fire's card names them; a drawn figure is Evan's call); Ray's word on the family never comes up in the harness (weekend mornings at Roadside, gone after year six); the money, standing and fire dials are proposals, and the harness's forebears all stood well with the old guard, so every kid started past the local-knowledge perk; an heir's book gets what comes with the keys on the first morning (the dog, a dream owned, land, a guide in print). The CURRENT MILESTONE moves to Phase 32. The download is 446.5 KB of 460.

### Phase 32 — The Hollow

*Large. The Hollow waits for "the quest that finds it" (Phase 21). Phase 5 kept "projects and FAs" to deepen. The Bluff's bolting covers lines already drawn.*

**Goal.** A crag nobody has a topo for, found by a quest, where you put up lines and name them.

**Scope.**
- **The quest.** Clues come from an old-timer, a hitchhiker, and an old guidebook at the shop. The walk-in is an epic.
- **First ascents.**
  - Scope a line, clean it, bolt it or climb it on gear, and name it.
  - Its grade settles as others repeat it.
- **What an FA touches:**
  - your guidebook, whose royalties rise;
  - the scene, which argues over your bolts;
  - the crew project (28), which can live here.
- **A painter** for the Hollow.

**Done when.**
1. A bot finds the Hollow and names a first ascent.
2. The content test holds the Hollow's lines to the same rules as every other line.
3. The download stays within its budget, raised if Evan agrees.

**The survey (15 Oct 2026).** Nothing of the Hollow is built, and nothing can be hidden: every place has a pin and a road. v0.956's Hollow was a hidden slot canyon past the Gorge, "headstones nobody visits and rock nobody's touched in years": V8 to get in, five boulders V8–V12. Its quest's last stage completed itself (bug B23). First ascents are `open` lines named on the first send; grades never settle (your call only changes what's shown). Bolting is the Bluff's alone (land you own); guides pay a flat weekly royalty; the scene's stances never touch a line. The hooks there are: Ray's unsent line (arc beat 3, text only), the old-hand hitchhiker's second meeting, the epics' wrong gully, the shop's guidebook. 446.5 KB of 460.

**Evan's calls (15 Oct 2026), all as recommended:**
- **The quest:** from V9 outside, three clues in any order: Ray's unsent line (Frank's word, if Ray's gone), the old-hand hitchhiker, and an old guidebook at the shop. With all three, the walk-in epic past the Gorge: a clean ending finds it, a bad one sends you back to try again.
- **Bolts:** your choice, and the scene reacts. Crack lines go on gear or get bolted; face lines need bolts; boulders get cleaned. Bolting costs cash and a day. The old guard takes a bolted crack badly, the gym crowd likes bolts, and a stance at the fire argues it out.
- **Grades:** repeats settle every first ascent of yours: in the weeks after, others repeat it (seeded), and after a few the shown grade moves to what the line really is; you hear about it.
- **Royalties:** a guide pays its weekly royalty plus a little for each first ascent of yours in it, under the poorest job's week.

**Slices:** 32.1 the Hollow, the place; 32.2 the quest and the walk-in; 32.3 first ascents there (clean, bolt or gear; the scene reacts); 32.4 grades settle, royalties rise; 32.5 the bot, the harness, the e2e and the close.

**Status (15 Oct 2026): 32.1 built: the Hollow, the place.** No save change, 0.999.66.
- **The place** (`PLACES.hollow`): a slot canyon of red sandstone past the Gorge (45 minutes on, up a wash: 165 from the Lot), shaded all day, V8 to get in, no crowd ever, and the crew can be talked into it by a Partner (`invite` 5). It's `hidden`: on no map and no road you know of (`known` in `hollow.ts`) till it's found, when it goes in `unlocked`, as a paid trip does. There's nothing to buy and, until 32.2, no way to find it.
- **Hidden means hidden:** the travel refusal says only "There’s no road there you know of." Its pin, its dirt road and its tap on the map come once it's found (the road is drawn over the painted valley, so the map's art doesn't give it away); the day planner's places, the guides, the circuit in the Record Book, a sponsor's shoot and the invite list leave it out till then.
- **Seven lines, every one an open project** (the first to send it names it): three boulders on the floor (the crow traverse, V9; the headstone boulder, V10; the gap, V12), two cracks (the split and the black corner, trad) and two faces (the sunless wall and the leaning wall, sport). They're in the canyon's own sandstone moves, eleven first ways with none repeated, and the content test holds them to every line's rules (criterion 2).
- **The painter:** a canyon palette, the far walls close, the headstones between the traverse and the wall (four stones and a cross), the close-up wall (the strip of sky between the rims, water streaks, the split, the corner's seam and roof), the boulder look and the topos. +1.7 KB: the download is 448.2 KB of 460.
- **Tests:** `hollow.test.ts` (no road you know of however hard you climb; a drive like any other once found; shaded sandstone, nothing to buy; the lines open and in their rock).

**Status (15 Oct 2026): 32.2 built: the quest and the walk-in.** Save v71, 0.999.67.
- **Who'll tell you, and when** (`hollow.ts`, Evan's call): nobody, till you've sent a line outside at `HOLLOW.from` (V9, v0.956's; a gym's doesn't count). Then three people each know a piece, in any order:
  - **An old-timer's word:** Ray (his unsent line, from Phase 17's arc, was never at Roadside): "“That line I never sent,” Ray says, and stops. “It isn’t here. Past the Gorge there’s a wash with no sign on it. Follow it till the walls close in. Take your time in there.”" Once Ray's gone, Frank has it from him. A talk beat (`oldWord`).
  - **The old hand's receipt:** the hitchhiker whose sign has always said THE CANYON: "Ask about the canyon on his sign" draws the Gorge road, a wash, and the dead juniper where it forks: “Take the left. Everybody takes the right.” While it's due he's `HOLLOW.hitch` (four) times likelier on the road.
  - **The old guidebook** at the gear shop, a row there while it has something for you (20 minutes): a wash, a slot, a small cross, and NO in capitals in the margin, twice.
  - The third says it's enough: "Three people, three pieces: a wash past the Gorge, a left fork at a dead juniper, a cross in a margin. Enough to go and look."
- **The walk in** (Evan's call): from the van at the Gorge, with all three, by noon and with energy for a day of looking: a walk-out of its own (`epics.ts`, `hollow`), three stages, each with the way a clue points (the left fork, waiting in the slot as Ray said, the margin's headstones) and ways that don't. Clean or rough, you're standing in the Hollow, and it's on your map ("You’re standing in the Hollow. Nobody has a topo for this. You could make one."); bad, you walk back down in the dark, unhurt, the clues good for another try (`hollow.tries`). The van's row says which clues you hold from the first one.
- **Off the Map**, a Record Book entry for finding it.
- **Save v71:** `hollow: { clues, tries }`; migration 70 starts everyone with none. Fixture `save-v70.json` (a career bot at day 220, from main's code).
- **The bots:** the social bot answers the old-timer's word as it does the other moments (else Ray's later beats would wait behind it); the old hand's odds move once a bot climbs V9 outside. The career bot doesn't look for the Hollow yet (32.5).
- **Tests:** in `hollow.test.ts`: nobody tells you till V9 outside, Ray's word once and Frank's after him, the old hand's ask, the book and the third clue, the walk in's needs, found the way the clues point, walked out unhurt on a bad day, the v70 save.

**Status (15 Oct 2026): 32.3 built: first ascents in the Hollow: clean, bolt or gear; the scene reacts.** Save v72, 0.999.68.
- **Nobody's been up any of it** (`PlaceDef.wild`): the Hollow's lines want preparing before anyone can climb them, as the Bluff's do, but there's no land to own: being there is enough (`bolted`, `boltBlocked`).
- **What each takes** (Evan's call): a boulder is cleaned (`LAND.clean`: two hours, nothing to pay); a face is bolted (`LAND.bolt`: the hardware and a day on a rope). A crack is yours to call, two buttons on its sheet: **clean it for gear** (`LAND.clean`; it stays trad, and you'll want a rack), or **bolt it** (`LAND.bolt`; it goes in `boltedCracks` and climbs as sport: the crack's moves and cruxes, bolts where a sport line has them, no stances; `asSport`, read by `wallAt` and `routeOfId`, so the go, the sheets and the climb all see it). The topo still calls it a crack, and the go refusal names both ways.
- **The scene hears** (`HOLLOW.scene`, proposed against the stances' 4 to 18): a bolted face, the gym crowd +2; a bolted crack, the old guard −8 and the gym crowd +4; a crack cleaned for gear, the old guard +2. A boulder moves nobody.
- **The stance at the fire**, "You bolted a crack" (`hollowbolts`): only once a crack's bolted, and the first one the scene raises when a stance comes (its usual chance and gap). My lines, my call; pull the bolts (it goes on gear: the old guard +12, a day's energy, and `boltedCracks` cleared, the lines still prepared); nobody else was going to climb it; and the elder's, keep them and say why.
- **Save v72:** `boltedCracks`; migration 71 starts it empty (nobody had found the Hollow to bolt it). The validator holds each to a prepared crack in a wild place. Fixture `save-v71.json` (a career bot at day 220, from main's code).
- **Not changed:** the painted backdrop draws each line from its topo, so a bolted crack shows no bolt dots behind you (the Bluff's lines show theirs before they're bolted, the same way); the climb itself draws and clips its bolts. No bot prepares a line yet (32.5).
- **Tests:** in `hollow.test.ts`: nothing climbable till prepared, and no land to buy; a boulder cleaned and a face bolted; a crack on gear, the default, wanting a rack; a crack bolted, climbing as sport without one; the stance first and only with a bolted crack, and pulling the bolts; the validator; the v71 save.

**Status (15 Oct 2026): 32.4 built: grades settle, royalties rise.** Save v73, 0.999.69.
- **Repeats** (`settle.ts`, Evan's call): every first ascent of yours gets repeated, seeded per line: the first `SETTLE.gap` (7 to 21) days after you named it, each next as long again, and in a wild place (the Hollow) `SETTLE.wild` (two) times as long, since fewer people know the way. Somebody else's first ascent (Dex's, or the family's) has had its repeats already.
- **The grade settles:** after `SETTLE.repeats` (three) of them, `lineGrade` shows what the line is, not your call; till then, your call (soft, true or stout). Everywhere the grade's shown reads it.
- **You hear about it** (`content/settle.ts`), the night of the first repeat ("A pair from out of town repeated The Long Dark. You hear it third-hand at the Lot…"; in the Hollow, fresh chalk and nobody you'll meet) and of the one that settles it, by your call: as you called it, harder than your soft call ("The old guard approves of a humble call…"), or under your stout one ("…the price of an ego"). Each once (`FirstAscent.heard`), however long you were away: back after months, only the settling. The line's sheet says the repeats so far, or the grade it settled at. Words only: the call carries no standing (v0.956's gave or cost rep), a call for Evan.
- **Royalties** (`guides.ts`, Evan's call): a guide pays `GUIDE.royalty` ($15) a week and `GUIDE.perFa` ($3) for each first ascent of yours in it (those put up by the day it came out); all of them together never more than `poorestWeek()`, the least a first-rank shift pays (the café's) `GUIDE.week` (five) times: $140. Ten guides at $15 came to $150, so the cap binds on a full shelf even before first ascents. The guide's row and its last page say the week's pay and your lines in it.
- **Save v73:** `FirstAscent.heard`; migration 72 marks the repeats an old save's lines have had as heard, so a loaded career settles them quietly rather than hearing a season's word in one night. Fixture `save-v72.json` (a career bot at day 161, from main's code: one line settled, one not yet repeated).
- **Not exercised by a bot:** no bot writes a guide, so the cap is held by the tests only.
- **Tests:** `settle.test.ts`: the repeats' days, seeded and slower in the Hollow; the grade settling by call; the night's word once each, and only the settling after months away; the Hollow's word; the sheet's note; royalties per first ascent in the guide, on the week's bills, and the cap; the v72 save and the validator.

**Status (15 Oct 2026): 32.5 built: the bot finds the Hollow; the harness, the e2e, and the Done-when.** No save change, 0.999.70.
- **The bot** (`bot.ts`, `hollow` option, off by default so no other target moves): a career that reads everything (Ray's word needs the social bot), and once it's asking: to Roadside on a weekend morning Ray's there; the old guidebook at the shop; the old hand asked whenever he's on the road; with all three, the walk in from the Gorge, the least risky way at each fork (which is the way the clues point). Found, the Hollow joins its crags, pulling like the story's crag: the easiest line it could try is prepared (a boulder cleaned, a crack on gear if it has a rack, a face bolted if it has the money), one at a time, and sent and named as any first ascent is.
- **A rule fixed on the way:** cleaning a line costs nothing, but in debt the bolt action refused it ("The hardware's $0."), the Bluff's boulders included. It doesn't now, and the sheet's button agrees.
- **The harness's Hollow** (`career.harness.ts`, four careers, 420 days): 2 of 4 find it and name first ascents (criterion 1). The ropegun: Ray's word day 83, the book 79, the old hand 186, found 187; prepared the three boulders and the sunless wall, and put up the boulders (V9 to V12) by day 207, all three settled by day 420. The technician: all three clues by day 164, found 165; five first ascents (V9 to V12, the faces bolted), three settled by day 420. The other two stall, both worth knowing:
  - **The old hand is luck.** He's a hitchhiker (14% of crag drives, no more than one in five days, four times likelier while due), and a career that seldom drives to a crag can miss him for a year: the boulderer had Ray's word and the book by day 104 and never met him in 420 days. The others met him on days 164 to 257. A call for Evan: a surer way to the third clue.
  - **The Hollow is a long drive.** The all-rounder found it on day 282, cleaned the crow traverse that afternoon, and never got back: its mornings went to shifts, and after a shift the Hollow (165 minutes from the Lot) is out of reach. The bot's day, not a rule.
- **The full harness:** 31 of 32. Outdoors 1 of 4, as since 30.1; everything else as before.
- **The e2e** (the Hollow): the day-five climber at the Gorge with all three clues: the van's "Look for the canyon", the three calls the clues point to, standing in the Hollow (Off the Map in the Record Book), along the floor to the split, its sheet offering gear or bolts, cleaned for gear (the old guard warmer, nothing bolted).

**Phase 32's Done-when, checked (15 Oct 2026):**
1. **A bot finds the Hollow and names a first ascent:** passes. The harness's Hollow run: 2 of 4 careers, eight first ascents between them (the table above).
2. **The content test holds the Hollow's lines to the same rules as every other line:** passes since 32.1 (`content.test.ts` and `hollow.test.ts`: every line open, in its rock, its moves a line's).
3. **The download stays within its budget:** passes. 452.8 KB of 460, without raising it.

**Phase 32 closed by Evan's call (15 Oct 2026).** All three criteria pass. Carried: the old hand's clue is luck (he's a weighted hitchhiker, and one of the harness's four careers never met him in 420 days), and a surer trigger is Evan's call, one that belongs with Phase 35's road; the scene's shifts for preparing a line, the repeats' timing, the royalty per first ascent and the cap's five shifts are proposals; the cap binds on a full shelf before any first ascent (ten guides' $150 to $140); settling a grade is words only (the call carries no standing, as v0.956's did); no bot writes a guide, so the cap is held by tests alone. The CURRENT MILESTONE moves to Phase 35. The download is 452.8 KB of 460.
- **The harness:** 30 of 31 targets pass, as for 31.4 (Outdoors 1 of 4, as since 30.1); the ladders' tables are unchanged. The one number that moved: the median career's ending names 10 things where it named 11 (the fewest is still 7), from the old hand's odds moving which hitchhikers a bot meets.
- **The download** is 450.5 KB of 460 (+2.3 KB).

### Phase 33 — Comps with rounds

*Medium. Every comp is one round on one day, climbed like the gym, and there's no national team.*

**Goal.** A comp is a comp: rounds, rules, a field you know.

**Scope.**
- **Rounds.** From Nationals up, a qualifier and then the final the next day. The World Series adds a semi.
- **Comp rules:**
  - isolation, so no beta from watching;
  - a time limit on each problem.
- **A field that comes back** each year: rivals you get to know, Skye among them.
- **Selection.** The Nationals podium makes the team for the World Series.

**Done when.**
1. The harness's comp table measures the rounds.
2. The e2e plays a qualifier and a final.

**Planned (14 Oct 2026), with Evan's calls:**
- **The time limit** is a go budget per problem per round, its minutes shown from the dials.
- **Cuts:** small finals. Nationals 16 to 6; the World Series 20 to 12 to 6; the Games 20 to 8.
- **Selection:** the Nationals podium makes the team, and only the team enters the World Series until the next Nationals. The calendar puts Nationals first.
- **The field:** a roster of named rivals per tier, each with a grade by year; some move up; Skye in the Nationals and World Series fields.
- **Slices:** 33.1 rounds; 33.2 isolation and the time limit; 33.3 the field that comes back; 33.4 selection, the calendar, and the close.

**Status (14 Oct 2026): 33.1 built: rounds.** Save v65, 0.999.50. Phase 33's criterion 1 passes.
- **From Nationals up, a comp is rounds, a day apart.** Nationals: a qualifier of 16, then a final of 6. The World Series: 20, a semi-final of 12, a final of 6. The Games: 20, then a final of 8. League night, the A league, the Circuit and the dyno comp are one round, as before.
- **A round after the qualifier** sets 4 problems: the final from the middle of the comp's grades up, a semi-final from a quarter of the way.
- **The field is drawn once,** on the comp's first day. Each round rolls the tops of whoever's still in it, so the final's field is the one that came through the cut with you.
- **Through the cut,** the round is tomorrow's: no fee and no day pass, and sleep doesn't hand it in. Under it, your place in that round is your place in the comp, and the points and the purse are paid then. A round not climbed hands in empty.
- **Shown:** the desk's entry row says the rounds ("a qualifier; the top 6 to the final, a round a day"), the scorecard row names its round and the cut, and the evening after a qualifier shows the final you're through to.
- **Save v65:** the comp you're in has its round. A real 0.999.49 save loads mid–League night and hands in as it would have.
- **The bots** climb a round they're through to, and keep its day free of shifts and crew days.
- **The harness:** a new comps table (`comps.harness.ts`) climbs each comp round by round with the bots' hands at every grade of its range: through each cut, the podium, the win, the median place. At Nationals, a V9 makes the final 42% of the time and a V12 wins 67%; at the World Series, a V13 makes the final 75% of the time.
  - The main harness passes every target but Outdoors, at 2 of 4 as on main. The comp bots reach the Games by day 219.
- **The download** is 434.5 KB of 460.

**Status (14 Oct 2026): 33.2 built: comp rules, the clock and isolation.** No save change, 0.999.51.
- **The clock** (Evan's call: a go budget). A comp problem is on the clock 5 minutes a round in a qualifier and 4 in any round after, at a minute a go (`COMP.clock`, `COMP.perGo`): 5 goes a problem, then 4. Those goes are all you get. A go past them is refused ("Time's up on this one"), and a top in any of them counts. Before, a top counted in its first 5 goes, and you could keep going.
  - Every ladder comp runs the clock, League night and the Circuit included: for them the only change is that a sixth go is refused. The dyno comp keeps its 3 throws a dyno.
  - The field's goes in each round roll against that round's budget.
- **Isolation.** On a comp problem nobody gives you beta: not the crowd's shout, not asking around (refused, with the rule), not the crew. A lesson reads the wall as you find it and skips comp problems, which fixes Sage teaching the week's set in the middle of a comp. Asked there, she says she can't. Your own falls still show you another way.
- **Shown,** all from the dials: the clock at the desk's entry row, in the entry line, on the scorecard row and on the round you're through to; "Go 2 of 4 on the clock" on a comp problem's sheet, with the time's-up reason on its button; the locked beta card's hint says isolation. The Training Center's painted comp clock, a hand-typed "4:00", now reads the qualifier's minutes.
- **The bots** take at most 3 goes a problem a day, so the cap never binds them.
- **The harness:** the comps table moved little. At Nationals a V9 still makes the final 42% of the time, and a V12 now wins 50% (67% in 33.1: 6 of 12 against 8, with the final's field and you both on 4 goes); at the World Series a V13 still makes the final 75%. The main harness passes every target but Outdoors, at 2 of 4 as on main; the comp bots reach the Games by day 219.
- **Caveats:** the clock's minutes follow the World Cup's boulder rounds (5 in qualifiers, 4 after) [INFERRED: not checked against the current rules]. A gym go still costs 8 minutes of the day, so a "5-minute" problem can take 40 minutes of the in-game clock: the clock limits goes, not the day.
- **The download** is 435.0 KB of 460.

**Status (14 Oct 2026): 33.3 built: the field that comes back.** No save change, 0.999.52.
- **Rosters** (Evan's call: a roster per tier). The Circuit, Nationals, the World Series and the Games each have 5–7 named rivals (`ROSTER`), each with a grade in a career's first year and a trend (rising, steady or fading) that runs five years and then holds, give or take a seeded half-grade each year (`RIVALS`). Each rung's favourites sit at or just over its top grade. Skye Maddox is on the World Series roster and comes back for Nationals.
- **Moving up.** A rival goes up a rung for good the first year their grade is a grade past the top of their own rung's, and out of the one below. Across 12 careers: Nico Hale leaves the Circuit by year 3 in all 12, Mae Okafor leaves Nationals by year 3 in 9; Kai Mendez and Arjun Mehta go up by year 7 in all 12. Rory Kerr rises and never quite makes it.
- **A field** is the rung's rivals that year and fillers from the old pool to make up the numbers. Fillers are never named. League night, the A league and the dyno comp keep their fields.
- **Shown.** The desk's entry row names the three favourites and anyone up from the rung below this year ("Up from the Circuit this year: Nico Hale"). A comp handed in names who won it (a filler is "somebody nobody had on their sheet"), or who was second if you won, and the rival one place ahead of you; out before the final, only that.
- **The field's tops, go by go.** Stronger favourites alone didn't stop the top grade winning every time: a top's goes were drawn evenly from 1 to the clock's, so a favourite topped as slowly as anyone and lost on goes to a flash. Now each go has the chance that tops it in the round's goes as often as before, so a climber well over a problem tops it in a go or two. This is every comp's field, League night's included.
- **The comps table** (12 comps a grade), against 33.2:
  - Nationals: a V10 makes the final 25% of the time (58%), a V12 wins 25% (50%), a V13 wins 83% (100%).
  - The World Series: a V13 makes the final 42% (75%), a V14 wins 50% (75%), a V15 92% (100%).
  - The Games: a V15 makes the final 58% (83%); a V17 still wins every time.
  - So the middle of every rung is harder than it was. The comp bots reach the Games on day 218.5, median (219).
  - League night, the A league and the dyno comp (the late harness, against main): a V3 wins 0.8 League nights a season (2.5) and no season (1 of 4); a V8 makes the dyno comp's podium 6 times in 16 (10); a V14 wins it 13 times in 16 (16). The rest held.
- **The main harness** passes every target but Outdoors, at 2 of 4 as on main.
- **Caveat:** a filler's grade is drawn as before, so most of a field's strength change is the named favourites; how a field feels from the floor is a playtest question.
- **The download** is 436.0 KB of 460.

**Status (14 Oct 2026): 33.4 built: selection and the calendar.** No save change, 0.999.53. Phase 33's two Done-when criteria pass; closing it is Evan's call.
- **The calendar** (Evan's call: Nationals first). Nationals moves to day 8 of every four weeks (rounds 8 and 9) and the World Series to day 15 (15 to 17), a week after the Nationals that picks its team. No two comps share a day: League nights, the Circuit, the Games and the dyno comp all fall clear (a test walks four years of days).
- **Selection** (Evan's call). The World Series is for the national team, not let in by points: a podium at the last Nationals makes it, till the next. Making it says so with the World Series' day ("That podium puts you on the national team: The World Series, Mon, day 43."); off the podium while on the team, you're told you're off it. The Nationals entry row says the podium picks the team, and the ladders page says the World Series is for the team. The Games still wants 200 ladder points.
- **A round's morning** has its wall's pass in your day, as the entry did, so the desk no longer offers a finalist a pass they don't need (33.1's leftover).
- **The e2e plays a qualifier and a final** (Phase 33's criterion 2): a climber well over Nationals' grades enters at the desk on its morning, climbs the qualifier's eight problems on the climb panel, hands in and goes through; the next evening climbs the final's four, hands in, and is placed, with the team picked on a podium.
- **The comps table** on the new calendar moved with the days alone (12 comps a grade is a small sample): at Nationals a V11 makes the final 50% of the time and a V12 podiums 33%, so the team is a V12–V13 climber's; a V13 wins 83%.
- **The harness** passes every target but Outdoors, at 2 of 4 as on main. The comp bots still reach the Games by day 219 (one by day 330). The comp bots end fewer of the story's acts (median 3, from 5 in 33.3), and three of four hang it up by day 419. A run with the old points gate on the new calendar gives the same acts and days, so it's the calendar's new days, not selection, that moved them; why the days do it isn't established. Selection's own cost: one comp bot reaches the Games on day 330 rather than 218.
- **Caveat:** a save made mid-comp on the old calendar (through to a round on day 25 or 18) climbs that round's day as a one-round set and is placed among the whole field: it hands in, and nothing breaks.
- **The download** is 436.5 KB of 460.

**Phase 33 closed by Evan's call (15 Oct 2026).** Both criteria pass. Carried: the comp bots end fewer of the story's acts since the calendar moved (not selection; why isn't established); the national team is a V12–V13 climber's; a favourite still loses a final on the field's dice now and then. The CURRENT MILESTONE moves to Phase 34. The download is 436.5 KB of 460.

### Phase 34 — Money that means something

*Medium. Followers pay nothing; a job's ranks raise its pay and nothing else; costs don't grow with ambition. The audit's economy #8, #9, #16 and #17.*

**Goal.** Jobs, media and ambition each change what a climber can afford.

**Scope.**
- **Rank perks:**
  - the setter climbs free;
  - the shop's gear discount for its clerk;
  - fuel for the courier;
  - rescue cover for the guide.
- **Costs of ambition:** a physio on retainer, a coach for your own training, travel to comps.
- **Media that pays:** photos that sell, a magazine piece, trade shows for the sponsored, and a film you pay for.

**Evan's call:** the photo sales, which reverse part of Phase 5's deferral.

**Done when.**
1. The harness's money table shows media income in a media career, never more than a job's.
2. Every perk's text is formatted from its dial.

**Planned (15 Oct 2026), with Evan's calls:**
- **Rank perks on the jobs there are** (the clerk and the courier stay cut): the setter climbs free at Send City, then at every gym; the guide, who works out of the gear shop, pays its staff price; the warehouse has a fuel card; the Cave's coaches see its physio at a discount; the café's staff drink free and the diner's eat the special at the staff price. Each from a rank, each a dial.
- **Photos:** your sends sell. With a camera (new gear) or a partner shooting, a first send outside at or above a grade makes a photo that sells once to a magazine, priced from the grade and your followers, capped so it never out-earns a job.
- **Costs of ambition, opt-in:** a physio on retainer and a coach for your own training, each weekly and worth it only if used; and travel for Nationals, the World Series and the Games.
- **Trade shows and a film, both light:** a sponsor (Apex and up) asks for a trade show once a season (days away, a fee and followers, clashing with climbing); a film you commission of a send, a late money goal (followers and a Record Book entry).
- **Slices:** 34.1 rank perks; 34.2 the costs of ambition; 34.3 photos that sell and a magazine piece; 34.4 trade shows, the film, the money table and the close.

**Status (15 Oct 2026): 34.1 built: rank perks.** No save change, 0.999.54. Phase 34's criterion 2 passes.
- **The perks** (`PERKS` in the dials, `perks.ts`), each from a rank and read off it, never kept:
  - **Setting:** a Setter climbs free at Send City and a Senior setter at every gym: the day passes are in your day each morning, as the owner's is.
  - **Guiding:** a Guide pays the gear shop's staff price, 20% off; not the market's food or Dale's garage.
  - **The warehouse:** a Forklift driver has the fuel card, gas 25% off.
  - **Coaching:** a Coach sees the Cave's physio 50% off; nothing else at the clinic.
  - **The café:** a Regular drinks Wren's coffee on the house. **The diner:** a Server eats the special 50% off.
- **Shown:** a shift's row says the perks you have at that job and the next one, with the rank it takes ("At Guide, the staff price at the gear shop, 20% off"); prices on the shop, the clinic, the drives and the menus are the perk's. Every perk's words are formatted from its dial, and a test holds them to having no number of their own (criterion 2).
- **Caveat:** an act's "can the card take it" check still asks for the full price, so a staff-priced buy can be declined when the card is nearly maxed and the full price wouldn't fit.
- **A bot rule, from the perks:** the business bot, its passes now free and its savings sooner, bought Send City 49 days earlier and then, flush, booked one story expedition after another: 110 of 155 days away in one career, its wall stale, 199 members at a forced retirement. It now minds its gym till it's the busiest in the valley before it takes a story trip away, as the media bot does the film. With that, every business career makes 200 members (median day 273.5, from 340 on main) with four acts of the story.
- **The harness** passes every target but Outdoors, at 2 of 4 as on main.
- **The download** is 437.0 KB of 460.

**Status (15 Oct 2026): 34.2 built: the costs of ambition.** Save v66, 0.999.55.
- **Opt-in retainers** (Evan's call; `RETAINER` in the dials, `retainers.ts`), each paid a week at a time from the day it's taken on, the first week up front, and stopped when it's let go (nothing back):
  - **A physio on retainer,** at the clinic, $35 a week: physio free, and each session takes 2 days off an injury (1 paid by the visit).
  - **A coach of your own,** one of the Cave's, $45 a week: 25% more from every training session. Training still teaches less than climbing an hour at every grade the bots reach (61% at the most, before the coach).
  - Both rows say the week's price and what it does, formatted from the dials; the payments come with their own line on the night they're due.
- **Travel to the big comps,** paid with the fee: Nationals $100, the World Series $250, the Games $500 (the Games are still by invitation). The desk's row says the fee and the travel; a climber short of both is told what they come to. The comp bots count it before they enter.
- **Save v66:** the retainers, none. A real 0.999.54 save loads with neither and takes a physio on.
- **The bots** don't take retainers, which are a player's choice; they pay the travel.
- **A bot rule, from the travel:** the comp bot, entering on what it had in its pocket, came to Nationals short most months, and to the Games' 200 points never (1 of 4 reached the top, from 4 of 4). It now saves for the fortnight's dearest comp as it saves for a trip, with the World Series' cost on top before a Nationals it's strong enough for, and keeps it back from trips and the garage's upgrades (one bought a mattress on Nationals morning).
- **The harness** passes every target but Outdoors, at 2 of 4 as on main. The comp bots reach the Games 4 of 4, median day 219 as on main; the boulderer's and the ropegun's first Games on main's day, the technician's sooner (219, from 330), the allrounder's later (387, from 219).
- **The download** is 438.0 KB of 460.

**Status (15 Oct 2026): 34.3 built: photos that sell, and a magazine piece.** Save v67, 0.999.56.
- **A camera** at the gear shop, $220 (and sold back like the rest of your kit).
- **Photos** (Evan's call: your sends sell; `PHOTO` in the dials, `media.ts`): a first send outside at V5 or harder, on your camera or shot by one of the crew there, is a photo; not a wall's pitch or an expedition's, whose summits sell already, nor a gym's.
  - **Sold** from your feed, one a week, each photo once: $15 a grade from V5, doubled at 20,000 followers, half on a partner's phone, and never over $100.
  - **The cap** is under the poorest week any job pays (Setting's first rank: four shifts of $30), and a test holds it there.
  - The feed offers the best three to pitch, with who shot them and when, and counts the rest.
- **The piece** (`PIECE`): once a magazine has bought two of your photos, an editor asks for a page on the season, once a year, with two weeks to write it. An evening at the van, as a guide's pages are, for $150 and the followers a page brings; unwritten, it lapses with a line.
- **Every word** of it is formatted from the rules, and a test holds the templates to having no numbers.
- **Save v67:** no photos and no piece asked for. A real 0.999.55 save, a physio on retainer, loads with neither.
- **The bots:** the media bot buys the camera when the money's past its cushion, pitches its best photo whenever a magazine will take one, and writes the piece first thing at the van. Measured over its four careers: camera by day 73 to 94; 14 to 61 photos, 14 to 46 sold for $1,388 to $4,232 a career; five to eight pieces. Its shifts paid $17,267 to $26,867 over the same careers.
- **Caveat:** followers pass 100,000 in a media career, so most photos sell at the cap by mid-career: the grade and the followers set the price early, and the cap after.
- **The harness** passes every target but Outdoors, at 2 of 4 as on main. The media bots reach the film at median day 159.5 (161.5 on main), three of the four sooner with the photo money; every other ladder as on main.
- **The download** is 439.5 KB of 460.

**Status (15 Oct 2026): 34.4 built: trade shows, a film you pay for, and the money table.** Save v68, 0.999.57.
- **The stand** (Evan's call: trade shows, light; `SHOW` in the dials): from Apex up, each sponsor cycle asks for a day on its stand at the trade show, four days before the cycle ends, said with the cycle's other asks.
  - Worked from the feed on the day, by 10:00: the day goes on it, for about a shift's pay ($60 at Apex, $120 at Meridian) and the followers a stand brings.
  - Missed, it's an ask not done, so the cycle ends on a warning, unpaid. It clashes with climbing, and with a shift booked that day.
- **A film you pay for** (`FILM`): once a life, of your hardest first send outside at V10 or harder, for $2,500 to a crew from the city; it brings followers and the Record Book's "Paid for the Light". Ines's film stays the media ladder's top, and comes to you.
- **Money says where it came from:** a shift, a sponsor's cycle, an ad, a photo, a piece and a stand each pay with a tag the harness reads.
- **The money table** (criterion 1, in the ladders harness): each media career's pay by where it came from, against its shifts'. Over the four careers media paid 38% to 68% of what the shifts did: sponsors $3,860 to $6,060, photos $1,300 to $4,200, pieces $750 to $1,200, stands $1,980 to $2,700, no ads (the bot keeps it real), against shifts of $18,260 to $24,399. Its best week of media never beat its best week of shifts ($520 to $670, against $672). At $100 and $200 a stand, media reached 90% of the shifts in one career and a best week of $870, so the stand pays about a shift.
- **Every word** of the stand and the film is formatted from the rules, held by a test.
- **Save v68:** no film, and a sponsor's stand from its next cycle. A real 0.999.56 save, a Meridian career with photos sold and a piece asked for, loads and plays on.
- **The bots:** a sponsored bot works the stand and books no shift over it: 18 to 25 stands a media career, and its sponsor's warnings as on main (5 to 9, against 4 to 10). The media bot pays for the film once it's $500 past its cushion: three of the four did, on days 247 to 306.
- **The harness** passes every target but Outdoors, at 2 of 4 as on main. The media bots reach the film at median day 149.5 (159.5 before the stand); every other ladder's rows as on main.
- **The download** is 440.5 KB of 460.

**Phase 34's Done-when, checked (15 Oct 2026):**
1. **The harness's money table shows media income in a media career, never more than a job's:** passes. Media pays every media career less than its shifts do: 38% to 68%, 4 of 4.
2. **Every perk's text is formatted from its dial:** passes since 34.1, held by `perks.test.ts`; the retainers', the photos', the piece's, the stand's and the film's words are held the same way.

**Phase 34 closed by Evan's call (15 Oct 2026).** Both criteria pass. Carried: the money criterion is read on a career's totals (a sponsor's cycle lands in one night, so a week of media came within $2 of the best week of shifts); the bots keep it real and work shifts, so a brand-terms player who works less isn't measured; most photos sell at the cap by mid-career; the piece, the stand's and the film's numbers are proposals. The CURRENT MILESTONE moves to Phase 30. The download is 440.5 KB of 460.

### Phase 35 — The road and the year   ✅ Closed

*Small. The knocks have no follow-up. There are eight hitchhikers, and no pull toward the ones you haven't met (the audit's social #9). The roadside stops are one-line lifts. Holidays are fire cards (the audit's social #16).*

**Goal.** The road and the calendar remember you.

**Scope.**
- **Knocks that come back:** someone you helped turns up again.
- **More hitchhikers,** the ones you haven't met first.
- **Roadside stops with a choice.**
- **Holiday nights:** a Sendsgiving potluck, a Halloween night send, the solstice.
- **The music's second pass,** once Evan has heard it.

**Done when.**
1. The content tests cover the new pools.
2. In a two-year bot career, no hitchhiker comes a third time before every one has come once.

**The survey (15 Oct 2026).** Ten knocks (`content/knocks.ts`), three answers each, picked by spot with the last three skipped; nothing remembers your answer or who you helped. Eight hitchhikers (`content/road.ts`), each with a second-meeting card; a met one is 2.6 times *likelier* (`EVENTS.hitch.again`), the opposite of what this phase wants, and `deck.met` records only your first answer, so every meeting after the second replays it. Nine roadside stops, pull over or drive on, no choice inside one. The four holidays (Phase 17.6: Harvest, Longest Night, First Dry Rock, Midsummer, days 7, 21, 35 and 49 of the year) are a psyche morning card at the Lot. The music is synthesized (Phase 25, `src/audio/moods.ts`), heard by nobody yet. Save v73.

**Evan's calls (15 Oct 2026), all as recommended:**
- **Knocks:** the ones you helped come back, once, weeks later at the Lot, with a thank-you in their own voice (a gift, a favour, beta); turning one away is remembered with a line, not a punishment.
- **Hitchhikers:** four more (twelve in all); the ones you haven't met come first, and none comes a third time before everyone has come once (a meeting count). While his clue is due, the old hand stands at a pull-off on the Gorge road, so the Hollow's third clue isn't luck.
- **Stops:** every one gets two or three ways to spend the pull-over, each a trade, formatted from the dials.
- **Holidays:** a scene each for the same four: Harvest a Sendsgiving potluck (a dish from the pantry), Longest Night a headlamp session on the Lot's boulders, First Dry Rock the season's opener at Roadside, Midsummer the solstice fire; your people there, a choice or two and their lines.

**Slices:** 35.1 hitchhikers: the rotation, four more, the old hand at the pull-off; 35.2 stops with a choice; 35.3 knocks that come back; 35.4 holiday nights; 35.5 the music's second pass (on Evan's ear), the harness, the e2e and the close.

**Status (15 Oct 2026): 35.1 built: the hitchhikers' rotation, four more, and the old hand at the pull-off.** Save v74, 0.999.71.
- **The rotation** (`events.ts`, Evan's call): `deck.meets` counts every time a hitchhiker comes your way, picked up or driven past. Nobody comes twice more than whoever's come least (`hitchersDue`), so none a third time before everyone's first (criterion 2), and the ones who've come least are `EVENTS.hitch.fresh` (three) times likelier. Phase 22.6b's `again` (a met one 2.6 times likelier) is gone: it ran the other way.
- **Four more** (`content/road.ts`), each with a first meeting, a second and a friend at a breakdown: a mountain guide off six weeks in the big range (TOWN (SHOWER)), a gym setter on their first trip outside (ANYWHERE WITH ROCK), two people and a dog beside a van with its hood up (GARAGE?), and an off-duty ranger (TRAILHEAD). Twelve in all.
- **The old hand at the pull-off:** while his clue to the Hollow is due, he's on the Gorge road every drive to or from the Gorge whose day hasn't had its encounter, whenever the rotation lets him: the third clue isn't luck any more (Phase 32's carried call).
- **Save v74:** `deck.meets`; migration 73 counts each hitchhiker you'd met as come once. Fixture `save-v73.json` (a career bot at day 204, two hitchhikers met, from main's code).
- **The bots** record who came (`run.hitchers`); the career harness checks criterion 2 over its sixteen runs (four years each): it holds, but weakly: a career bot meets few hitchhikers (median 3 in four years, at most 6; it drives to a crag less than a player would), so no run gets near twelve. The unit test's two years of daily crag drives meets more than twelve and holds it too.
- **The harness:** 31 of 33. The Hollow is 4 of 4 now (it was 2 of 4): the old hand at the pull-off gave every career its third clue, on days 78 to 169. Outdoors is 0 of 4 (1 of 4 since 30.1). The media target is 3 of 4: the boulderer media career's media came to 101% of its shifts (80% in 32.5's run); nothing here touches media money, the career's path shifted (fewer shifts worked, more photos sold), and the margin was thin before. A call for Evan.
- **Tests:** `hitchers.test.ts`: twelve, each with both meetings and no number or straight quote in the words; none a third time before all once, by the rule and over two years of drives; the least-met first; every meeting counted, driven past or not; the old hand on every Gorge drive while due and his turn, and not otherwise; the v73 save.

**Status (15 Oct 2026): 35.2 built: roadside stops with a choice.** No save change, 0.999.72.
- **Two ways to spend every stop** (`content/road.ts`, Evan's call), each a trade of minutes (and now and then a few dollars) for what it gives: sit with the overlook's view or shoot it for the feed; top out the world's largest boulder or walk round it; stand under Balanced Rock or take the photo of you holding it up; breathe under the Lone Sentinel or sleep in its shade; the famous slice or just coffee at the counter; a proper soak or a quick dip; the ghost town's main street or its mine tailings; a minute at the shrine or a sling left on the cross; the fire lookout's stairs or a photo from the bottom. The first way is each stop as it was (forty minutes, the same effects), so the bots, who take the first answer, play as before; the second always differs in what it costs or gives.
- **The card** says each way's minutes and money (`costLabel`) and what it gives (`stopNote`: psyche, energy, skin and food as they'd land, a smaller share once you've been, and "followers" for a photo), formatted from the numbers; "Keep driving" is the last answer. A photo brings followers, as many as your audience does (`RoadFx.followers`). `EVENTS.stop.min` is gone: each way says its own.
- **What you hear:** the first time, the stop's name and blurb, then what you did, as two lines, each short enough for a toast (thirty words), so a stop never leaves a card to dismiss; after that, "Balanced Rock again." and what you did. A test holds every line under the toast's length.
- **The e2e** takes the photo at Balanced Rock (the card's ways and notes checked, followers up). Its first run caught the one long line going to a card. The download is 456.2 KB of 460.
- **Tests:** in `road.test.ts`: every stop two ways, each a different deal with no number or straight quote in its words; the quick dip's minutes and energy and its line; a photo's followers and a view's none; the card's note from the numbers.

**Status (15 Oct 2026): 35.3 built: knocks that come back.** Save v75, 0.999.73. The download budget goes to 470 KB (Evan's call, 15 Oct 2026; 456.2 KB after the stops).
- **Who comes back** (`content/knocks.ts`, Evan's call): five of the ten knocks have somebody to help, and their answers say who (`helped`): the jump-start (either way you get the cables out), the two from the wrong car (sorting them out), the headlights at two (going to say hello), the van at your spot (waving them in), the dumpster diver (asking what else is in there). Helped, they come back once, `EVENTS.knock.back` days on (14 to 28, seeded): the car you jumped with oranges and a thermos, one of the two with pastries and an apology, the road-trippers with a map from three states over, the van with a pot of chili and a second spoon, the diver with a pair of shoes your size. Two answers each, a thank-you in their voice (supplies, food, energy, psyche, a few dollars).
- **Turned away** (`away`): saying you have no cables, or pretending to be asleep when the van pulls into your spot, is remembered the night it's due, in a line, and that's all: "Somebody else had cables. They do not wave, and you do not blame them."
- **When:** at bed, the first due (`knockBackDue`): a return only on a night a knock could come (no encounter today, none in the last `knock.every` nights), and it takes that night's knock; a remembered line any night. The returns have no spots, so they never come by chance. Once a knock, ever: helping the same one twice brings them back once.
- **Save v75:** `deck.back` (`{id, opt, day, done?}`); migration 74 starts it empty. The validator holds each to a knock and an answer that has a return. Fixture `save-v74.json` (a career bot at day 201, from main's code).
- **The harness:** 31 of 33. The bots answer every knock the first way, which helps at the jump-start, the headlights and the shared spot, so they get returns now, and their nights moved: Comps went to 3 of 4 (4 of 4 in 35.1's run) and the Hollow to 3 of 4 (4 of 4); Outdoors is 2 of 4 (0 of 4); the media target is 4 of 4 again (the boulderer's media 81% of its shifts, against 101%), which bears out 35.1's reading of it as drift. No rule here touches comps, the Hollow or media.
- **Tests:** `knockback.test.ts`: who's remembered and who isn't, once a knock; the return weeks later at the door, once, its thank-you; waiting for a night a knock could come; the turned-away line and the night going on; returns never by chance, and one for every knock with somebody to help, words with no number or straight quote; the validator; the v74 save.

**Status (15 Oct 2026): 35.4 built: holiday nights, a scene each.** Save v76, 0.999.74.
- **The scene** (`content/folks.ts`, Evan's call): going to bed at the Lot on a holiday with your people about (`crew`, Regulars and closer, home and not away), the night opens at the fire before bed (`holidayScene`), an encounter like a knock: the holiday's line, its scene and a line from each of them who's there (Phase 17.6's), and three ways to spend it:
  - **Harvest, Sendsgiving:** a fork and an appetite (food); a dish from the pantry (two servings of what you have most of, more psyche and a bond with everyone); the cider nobody asks about (a few dollars).
  - **Longest Night, headlamps on the boulders:** stay by the fire; climb by headlamp (psyche, at energy and skin); hold the lamps for everyone else (a bond with everyone).
  - **First Dry Rock, the opener's eve:** toast the season; write the tick list on the cake board (a bond); turn in early for the opener at Roadside (energy).
  - **Midsummer, the solstice fire:** stay up for the sunrise (psyche, at energy); walk up the hill for the last light (a bond); turn in at a sensible hour (energy).
- **The rules:** the first way never needs anything (the bots take it); a dish needs two servings of something and the cider its few dollars (`holidayBlocked`), shut on the card with why. Each way is a day together with everyone there, as the holiday always was, plus its own effects, which the card says from the numbers (`holidayNote`). The scene is the night: no morning card after it. Alone, the holiday is the night it always was (its line and card in the morning, the lift). A holiday's scene takes the night's knock.
- **Save v76:** an encounter can be a holiday's scene; migration 75 changes nothing. Fixture `save-v75.json` (a career bot at day 201, a knock already come back, from main's code).
- **The harness:** 31 of 33: the bots take each scene's first way, so their holidays moved (the flat lift is now the way's own); the Hollow is 4 of 4 again, Comps 3 of 4 as in 35.3's run, Outdoors 1 of 4 (2 of 4); psyche never stays low a week.
- **The e2e:** the knock night (day seven, Harvest) now pins the climber's people below the holiday's tier, so it stays the knock it tests; a new Harvest section sleeps the same night with Hazel close and beans in the pantry: the potluck's card (Hazel's line, the dish's two servings), the dish, and morning.
- **Tests:** `holidays.test.ts`: the four scenes and none alone, elsewhere or on another night; three ways each, the first always open, words with no number or straight quote; a way spent with everyone there and no morning card; the dish from the pantry, and the dish and the cider shut without; the v75 save. `folks.test.ts`'s holiday night: its scene with people there, its card alone.

**Status (15 Oct 2026): 35.5 built: the content sweep and the Done-when.** No save change, 0.999.75. The music's second pass waits on Evan's ear (`/sounds.html`), so it is carried, not done.
- **The sweep** (`content.test.ts`): every line of the four pools (knocks and their returns, the twelve hitchhikers with their breakdown friends, the stops and driving past, the holidays with their scenes and who's there; 406 lines, old and new), held to the same rules: no number typed in, no straight quote, no doubled space, and no blank but the one the game fills (a friend's driveway names its host; the potluck names your dish). The references resolve too: one id each, a helped or turned-away answer that exists and isn't both, a return for every knock that helps and a knock for every return, the people at the fire in the cast. It caught one line, from before the phase: the headlights' "at 2 a.m." is "at two in the morning", as the rest of the pool spells it.
- **The harness** wasn't run again: nothing here moves a rule (one line of words), so 35.4's run on the same rules stands (31 of 33).

**Phase 35 against its Done-when (15 Oct 2026):** both pass.
1. The content tests cover the new pools: each slice's own (`hitchers.test.ts`, `road.test.ts`, `knockback.test.ts`, `holidays.test.ts`), and the sweep over the whole of every pool.
2. No hitchhiker comes a third time before every one has come once: the rule (`hitchersDue`), the unit test's two years of daily crag drives (more than twelve meetings), and the career harness's sixteen four-year careers all hold it. The harness's hold is weak: a career bot meets few hitchhikers (median 3 in four years), so none comes near the twelve.

Closing is Evan's call. Carried: the music's second pass (on his ear); the media target's margin (the boulderer's media 101% of its shifts in 35.1's run, 81% since); Outdoors 0 to 2 of 4 across the phase's runs, as since 30.1. After Phase 35 the deepening run (26–35) is done; Phase 14 waits until Evan asks for it, so the next milestone is his call.

**Phase 35 closed by Evan's call (15 Oct 2026).** Both criteria pass. Carried: the music's second pass (Phase 25's synthesized score, still unheard; `/sounds.html` is where to listen, and Phase 13's criteria 1 and 2 wait on the same ear); the hitchhikers' rotation holds only weakly in the bots (a median of three meetings in four years), so the unit test carries it; the bots take every knock's, stop's and scene's first way, so the returns they don't help, the stops' second ways, the dish and the cider are held by the unit tests and the e2e, not measured; the media target's margin (101% in 35.1's run, 81% since); Outdoors 0 to 2 of 4 across the phase's runs, as since 30.1. The deepening run (Phases 26–35) is done. The CURRENT MILESTONE moves to Phase 14, the desktop and Steam build. The download is 459.3 KB of 470.

### Phases 36–45 — Hands on

*Evan's call (18 Oct 2026), before Phase 20: "brainstorm more ways to improve the game. Going on making it distinct and unique, easy to understand and play, and building on the depth." Ten recommendations, taken as they came: start the first, queue the rest, and raise the download budget as needed.*

**The order:** 36, then 37 to 45 as listed.

**Weigh first:**
- **Phase 19 stays open** on its real stores and its beta (criteria 1 and 4), both Evan's. Nothing here waits on them, and nothing here touches the gate, Play's unlock or the paperwork.
- **The download.** 469.7 KB of 490 when the run started. Evan's call: raise it as needed. 36, 43 and 44 are the heaviest (drawn things to play); 37, 39, 40 and 41 the cheapest [INFERRED].
- **Saves.** 36.1 changes the save's shape (v77); 39 and 43 will, and 38 may [INFERRED].
- **Still bots only.** No person has played a full career; the beta is where that changes.

### Phase 36 — The games at the fire, played

*Medium to large. Liar's dice was one bid against one person; blackjack and hold'em are lines of text and a few buttons, ten and six hands a night (22.9a, 22.9b). Evan's ask (18 Oct 2026): make them "actual card games you can play with cards", and "play for as long as you want, like a mini game".*

**Goal.** The games at the fire are the real games, drawn and played by their full rules, for as long as the night lasts, or as long as you like from the glovebox.

**Evan's calls (18 Oct 2026), all as recommended:**
- **Liar's dice: Perudo, everyone in.** Five dice each under a cup, ones wild, bids going round everyone at the fire (Hazel, and Sage and Frank when they're there). Call a bid a lie, and whoever's wrong loses a die; the last cup with dice takes it. Still for bond, never money.
- **How long: the night, and a glovebox deck.** At the fire, game after game until it dies down (about 1 AM). Each round or hand takes its minutes, and the night's $40 cap at cards stays. And a deck in the glovebox: all three games for matchsticks against the cast, as long as you like, outside the career. No time passes and nothing carries over.
- **Hold'em: everyone at the fire, limit.** Fixed-limit hold'em with whoever's there (two or three others), blinds in place of antes, each person's style and reads as they are, and tells shown.
- **Blackjack: splits and your own bet.** Split a pair once; bet $5 or $10 a hand within the night's cap; the dealer stands on 17; a fresh deck each hand.

**Slices:**
- **36.1** Perudo at the fire, drawn (save v77).
- **36.2** Blackjack drawn: splits, your own bet, hand after hand until the fire's out.
- **36.3** Hold'em round the fire: limit, everyone in, blinds, tells.
- **36.4** The glovebox deck: all three games for matchsticks, outside the career.
- **36.5** The e2e, the harness and the close.

**Done when** [proposed]:
1. Each game plays by its full rules, in the unit tests and the e2e.
2. The fire's rule still holds: no game out-bonds a day climbing together or out-earns a shift an hour (the harness).
3. The glovebox never touches the career's save.
4. The download stays inside its budget, raised as needed (Evan's call).

**Status (18 Oct 2026): 36.1 built: Perudo at the fire.** Save v77, 0.999.91.
- **The rules** (`sim/perudo.ts`). You sit with everyone at the fire, five dice each (`GAMES.dice.n`), the cups rolled from the seed a round at a time, and you open the first round. Ones count for every face and are never bid. A bid beats the last with more of any face, or as many of a higher one. Call the bid on the table and every cup comes up: fewer than it says and the bidder loses a die, as many or more and the caller does. The loser opens the next round (the next seat on, if that was their last die); an empty cup is out; the last cup with dice takes the game. Out yourself, the others play it out to a winner.
- **The others** (`content/perudo.ts`) bid from their own cups, with the chance that the dice nobody's seen make up the rest (a third each: the face or a one). Each has a style [proposed]:
  - Hazel bids what's in her cup and lets a lot go;
  - Sage pushes faces she hasn't got and calls early;
  - Frank doesn't bluff and doesn't believe you either.

  Each style is three numbers: how unlikely a bid must look before they call it, how often they raise on a face they haven't got, and how far under what they expect they open. The table shows each person's read.
- **The night.** A game takes a round's minutes (`GAMES.dice.min`, six) and the energy to sit down; each round after takes its minutes. Liar's dice isn't once a night any more (horseshoes still is): play game after game, or get up mid-game. At `GAMES.late`, 1 AM [proposed], the fire's down to coals (`fireOut`): no game at it starts, and a round in play is the last. Bond with everyone playing, once a day, as before.
- **The table** (`ui/Perudo.tsx`, on the fire's card):
  - the others' cups across the fire, each with its dice left, drawn in code;
  - the round's bids in order;
  - your cup lifted, the dice that count for the face you've picked lit (a one is drawn wild);
  - your bid as a count (a stepper from the least that beats the table) and a face (the five dice to pick from), started on the face you hold most of, with what's in your cup and how many dice you can't see;
  - "Call it a lie";
  - every cup up on a call, the dice that count lit, the loser's seat marked, and what happened in words;
  - "Next round" (who opens it), "Another game", "Get up".

  Every button is a button, so the keys and a pad move round it as round any sheet.
- **Save v77:** `table` is the Perudo table (the seats and their dice, whose turn, the bid and the round's bids, the round and the game, the last call's cups, who took it). Migration 76 puts away a hand of the old one-bid game on the go; nothing hung on it. Fixture `save-v76.json` (a career bot at day 201, from main's code). The validator holds dice to 1–6, faces bid to 2–6, and seats to the table.
- **Measured** (`gamesAtFire`, the season harness's games line). Over 300 games with Hazel and Sage, a game takes about 70 minutes, and a player who reads their own cup the way they do takes 37% (a fair share is a third). A player who calls anything past a third of the dice, cup unread, takes about 10%. The most bond anyone moved in a night of every game is still one.
- **The e2e:** at the fire after the horseshoes, it bids a count up from the one offered, plays the round out to a call (calling past a third of the dice, raising as offered otherwise), checks the cups come up drawn, plays another round, and gets up. Hazel's bond moves once for both games, the clock moves, and both games are heard.
- **Tests:** `perudo.test.ts`:
  - the rules (ones wild, what beats what, who a call costs, who opens next, the last cup);
  - the others' bids, legal and the same from the same cups;
  - their styles told apart over 1,200 spots (Sage calls and bluffs more than Hazel);
  - your bid going round in order to you or a call;
  - whole games to the last cup, a die gone and a round's minutes with each call;
  - the night's limit, and bond once a day over two games;
  - the words (no number typed in, only the blanks the table fills);
  - the save, broken tables refused, and the v76 fixture with and without an old hand.

  `fire.test.ts` loses the old game's tests and gains the fire's limit.
- **The download:** 473.4 KB of 490.

**Status (18 Oct 2026): 36.2 built: blackjack drawn, with splits and your own bet.** Save v78, 0.999.92.
- **Your bet** (`GAMES.bj.bets`): $5 or $10, picked between hands and kept from hand to hand, from what's in front of you. You still sit down once a night with what's in hand, up to the night's $40 (`GAMES.bj.cap`), and get up with the rest.
- **Hand after hand.** No ten-hand limit any more: sitting down is the energy, each hand takes its minutes (`GAMES.bj.min`, four [proposed]), and at the fire's close (`GAMES.late`, 36.1) no hand is dealt and no seat is taken; a hand in play is finished.
- **Splits** (`sim/cards.ts`, `isPair`): a pair, two cards of a rank, splits once, the second hand at the same bet. The first hand gets its second card at the split, the second when you get to it. Each is played in turn (doubling on two cards allowed) and paid on its own. Twenty-one in two after a split pays even, not 3:2. Aces split take a card each, and that's them. The dealer peeks for a blackjack as before, and stands on every 17; a fresh deck each hand.
- **The table** (`ui/Cards.tsx`, on the fire's card): the cards drawn in code, the red suits in the accent (the suits are the game's own marks, `ui/marks.ts`); the dealer's hole card face down till the hand's played, with what the dealer shows; your hand, or both once split, the one you're playing outlined, each with its total ("soft 17", "bust", "blackjack") and its bet; Hit, Stand, Double and Split with what they cost; and once a hand's played it stays on the table, face up, each hand marked with what it won or lost, until the next deal. Then the bet, Deal, and Get up.
- **Save v78:** a blackjack hand is your hands (one, or two once split), each with its bet, the one you're playing, and what each paid once it's over. Migration 77 carries a hand on the go into the new shape as your one hand. Fixture `save-v77.json` (from main's code).
- **Measured** (`gamesAtFire`): blackjack by the book with splits, at $10 a hand, hand after hand till the chips or the fire run out, comes to −$2.10 an hour over 60 nights and +$0.17 over 300: about even, against the worst shift's $6.50. Bond still moves at most once a night.
- **The e2e:** at the fire, the $10 bet, two hands stood on, the cards drawn and the played hand left up, the clock moved, and up again with what's in front of you.
- **Tests:** `cards.test.ts`: the bet (one of the table's, from what's in front of you); hand after hand, a hand's minutes each, to the fire's close; the played hand left on the table with nothing more on it; doubling; a split played in turn and paid on its own, once; aces split; about even by the book; a v77 hand on the go carried into the new shape, and broken hands refused.
- **The download:** 475.4 KB of 490.

**Status (18 Oct 2026): 36.3 built: hold'em round the fire, everyone in, fixed limit.** Save v79, 0.999.93.
- **The table** (`sim/holdem.ts`): you and everyone at the fire who plays (Hazel, Sage some nights, Frank when he's over), two cards each from a fresh deck a hand. Blinds of $1 and $2 (`GAMES.holdem.blinds`) in place of the ante, the button a seat on each hand (heads-up, the button posts the small blind and moves first before the flop). Four streets: the small bet ($2) before the flop and on it, the big one ($4) on the turn and the river (`GAMES.holdem.bets`), four bets a street at most (`raises`). A raise reopens the betting; the big blind gets its option.
- **Your all in:** short of a call, you call with what's in front of you, and play for the money that matched yours from every seat; the rest is theirs to fight over. Their money is never counted, and never runs out.
- **The others** play their styles (`content/cards.ts`) against the field still in, scaled to a fair share of it. They call a bet with a hand that beats the field `call` of a fair share, bet or raise one that beats it `bet` of one (a re-raise wants more), and bluff `bluff` of the hands they'd check; they call you lighter once you've been caught on the river, as before. **Frank** joins with a style of his own [proposed]: he bets only the goods, calls when he doesn't believe you, and hardly bluffs.
- **Tells:** once you've the second read on someone (twelve hands), a bet or a raise of theirs shows a tell: Hazel squares her chips before a real bet and goes back to her tea after a bluff; Sage stops talking, or keeps talking a little faster; Frank looks at his cards a second time, or not at all. Right `GAMES.holdem.tell` of the time (eight in ten [proposed]).
- **The night:** sitting down is the energy, each hand its minutes (`GAMES.holdem.min`, five [proposed]); no six-hand limit; at the fire's close no hand is dealt. Still one seat a night, with what's in hand up to the night's $40, and up with the rest. The reads come as before: how they bet at five hands, how often they bluff and what to do about it at twelve.
- **The table, drawn** (`ui/Cards.tsx`): the board a street at a time (empty places for the cards to come); the others' seats across the fire, their cards face down (up at a showdown), the button, what they last did and put in; any tell under them; your cards with your best hand once the flop's out, and what you've put in; Fold, Check or Call, Bet or Raise, each with its cost (a call you can't cover says it's all in); the hand left on the table when it's over, with who showed what and who took it; Deal and Get up; and at the foot, your reads on each of them, or how many hands to the next.
- **Save v79:** the hand is the seats, the board, the street, the button, the bets and the hand's moves, and who took it once it's over. Migration 78 puts away a heads-up hand on the go and gives back your half of its pot. Fixture `save-v78.json` (from main's code). The validator holds the seats, the board's five cards, the street, the turn and the result to the table.
- **Measured** (`gamesAtFire`, 60 nights with Hazel and Sage, hand after hand till the chips or the fire run out): always betting loses $68.87 an hour, always calling $28.28, and playing the odds against the field makes $2.13, against the worst shift's $6.50. Bond still moves at most once a night.
- **The e2e:** at the fire after blackjack, hold'em with everyone there: a hand checked and called to its end, the board drawn, and up with what's in front of you; Hazel's had the hand played on her.
- **Tests:** `holdem.test.ts` (19): the blinds and the button heads-up and three-handed; a street ending when everyone's matched and moved, the big blind's option; a raise reopening the betting, four bets the most and a raise past it a call; the last one in taking the pot unshown; the best hand at a showdown, and a split; your all in for the money that matched yours; their moves legal and seeded; their styles told apart; tells only with the second read, right about eight in ten; a night at the table end to end; the fire's close and the blinds; the reads; being caught; no simple way to play makes much of a shift; the save, and a v78 heads-up hand put away. `cards.test.ts` keeps the hands' values and blackjack.
- **Words:** the paperwork's gambling answer now says hold'em is everyone at the fire (`docs/PAPERWORK.md`); the answers don't change.
- **The download:** 477.4 KB of 490.

**Status (18 Oct 2026): 36.4 built: the glovebox deck.** No save change, 0.999.94.
- **Where:** "The glovebox deck" on the van's card, at the Lot or at a crag, any time of day.
- **The table** (`sim/glovebox.ts`): a copy of the climber with the glovebox's flag, its own seed each time the deck comes out, and a box of matches for its cash (`GAMES.glove.sticks`, 40 [proposed]). With the flag, the people at the table are the cast (`GLOVE_CAST`: Hazel, Sage and Frank [proposed], met or not), and where, when, once a night and the fire's close don't apply (`atFire`, `gameBlocked`, `cardsBlocked`, `fireOut`). The games are the fire's own, played through `act` by the same rules: Perudo; blackjack with its bets and splits; hold'em with its blinds, styles, reads and tells.
- **Outside the career** (`game/game.ts`, `Ui.glove`): the copy lives in the UI's state, never in the save, and goes back in the glovebox when its card closes. Nobody tires at it, and its clock is its own: the career's clock, cash, bond and reads don't move. What you know of each of them from the fire comes with you (the reads, and the tells once you've the second), and nothing learned in the glovebox goes back.
- **The matchsticks:** the tables count matchsticks where the fire counts dollars, and show no minutes. What you don't take to a card table stays in the box. Each card game is shut when the box can't cover its least (blackjack's lower bet, hold'em's big blind), and a new box is there once either is.
- **The card** (`ui/Glovebox.tsx`): the three games, who's in, the matchsticks left, and a new box when you're short. Each game opens the fire's own table, drawn as at the fire, in the glovebox's words ("so far", "back in the box").
- **Tests:** `glovebox.test.ts` (5): the copy (its seed, the box, nothing on); the fire's limits lifted (by day at the gym, past 1 AM, again the same night); all three games played on it, as often as you like; the climber it was copied from untouched, byte for byte; a new box once short of a game.
- **The e2e** (Phase 36's criterion 3): a morning at the Lot, the van, the glovebox deck, a bid at liar's dice, a blackjack hand stood on and a hold'em hand called down, no dollars or minutes on any of them, and the deck put away: the career's save is the same, byte for byte.
- **The download:** 478.6 KB of 490.

**Status (18 Oct 2026): 36.5 built: the games in full in the e2e, the harness, and the close.** No save change, 0.999.95.
- **The e2e** (criterion 1): after 36.4's turn at each game in the glovebox, each by its full rules, where the clock's no object:
  - liar's dice to its last cup, calling every bid it's handed (on the e2e's seed, out of dice after five rounds, and the others play it out);
  - blackjack until a hand's doubled and a pair's split;
  - hold'em with a raise called down, then a fold to a bet in a later hand.

  The fire's own sections still play each game there, with the clock (36.1 to 36.3).
- **A fix it found:** out of dice with more than one cup still in, the others play the game out without you (`playedOut`), and their cups stay as they were when you went out, so the last line said "last cup standing" under full cups. It now starts "They play it out without you." (`PERUDO.wonWithout`); `perudo.test.ts` holds both endings.
- **The harness** (criterion 2), the season harness on this build, every target passing (12 of 12). The most bond anyone moved in a night of every game is one. Liar's dice takes about 70 minutes a game with Hazel and Sage, and reading your own cup takes 38% (a fair share is a third). Blackjack by the book makes −$2.10 an hour. Hold'em always betting makes −$68.87, always calling −$28.28, and playing the odds +$2.13. The worst shift is $6.50.
- **The download:** 478.6 KB of 490.

**Phase 36 against its Done-when (18 Oct 2026):** all four pass.
1. Each game plays by its full rules, in the unit tests and the e2e: `perudo.test.ts` (18), `cards.test.ts` (11), `holdem.test.ts` (19), `glovebox.test.ts` (5); the e2e plays each game at the fire with the clock, and in full in the glovebox.
2. The fire's rule still holds: the harness, above.
3. The glovebox never touches the career's save: the e2e's byte-for-byte check after every game in it, and `glovebox.test.ts`.
4. The download stays inside its budget: 478.6 KB of 490, the budget unchanged.

**Closing Phase 36 is Evan's call.** Carried:
- **The [proposed] numbers and styles:**
  - the three Perudo styles;
  - the fire's close at 1 AM;
  - a round's six minutes, a blackjack hand's four, a hold'em hand's five;
  - the tells right eight times in ten;
  - Frank's hold'em style;
  - the glovebox's 40 matchsticks, and its cast, fixed, met or not.
- **Criterion 2 isn't measured in a career:** no career bot plays the fire's games, so it's held by the harness's nights at the fire (`gamesAtFire`).
- **At the fire, the e2e plays each game but not every move:** a round of liar's dice to its call, two blackjack hands stood on, a hold'em hand checked and called down. The rest of the rules are played in the glovebox, through the same `act`.

**Phase 36 closed by Evan's call (18 Oct 2026).** All four criteria pass. Carried, as listed under 36.5: the [proposed] numbers and styles (the glovebox's box and cast among them); criterion 2 held by the harness's nights at the fire, not a career; the fire's e2e plays each game but not every move. The CURRENT MILESTONE moves to Phase 37. The download is 478.6 KB of 490.

### Phase 37 — The session

*Small to medium. Planned with Evan's calls (18 Oct 2026).*

**Goal.** A day at the boulders with the locals is a shared puzzle.

**Scope.** Three or four locals take turns on one problem with you. Every fall shows that crux's beta to everyone there. Share what you've found (bond, renown) or keep it (a better shot at the day's first send).

**Evan's calls (18 Oct 2026), all as recommended:**
- **Who:** whoever of Dex, Sage, Rico, Mara and Tam is at the crag, and nameless locals ("a kid in a beanie") to make three or four. Bond goes to the cast; the nameless locals' regard is the old guard's standing (`scene.old`, "the purists and the locals").
- **Where and when:** any boulder problem at a crag when the crowd's busy or packed (mostly weekends), by day. Roadside and the Gorge in the demo, every boulder crag in the full game; deep-water solos out. One session a day.
- **Falls:** everyone's falls at a crux, theirs and yours, count toward its hidden beta; whoever's fall turns it up has found it. Yours you share or keep; a local shares theirs or not, by their style. Watching costs your onsight, not your flash.
- **What it pays:** share: +1 bond with each of the cast there, on top of the day together (once a day), and the old guard's standing. Keep: nothing now, but they don't have it, so they send later. The day's first send pays psyche and standing, and a Record Book entry the first time.

**From the survey (18 Oct 2026):**
- **One find a crux.** An outdoor problem hides one move a crux, earned by falling there once or twice (`unlock`); a highball has a second crux at the top-out. So a session's puzzle is one find, or two.
- **Your go is played** (`climb.ts`); `done` records the crux you came off, and your falls there unlock its move.
- **No locals yet.** Strangers are on screen only. Of the cast, Dex, Sage, Rico, Mara and Tam boulder; only Dex and Sage have grade curves (`CURVES`), the rest a grade over or under yours (`PersonDef.grade`, as on an expedition).
- **Bond already moves.** A day climbing with any of the cast gives +1, once a day (`climbedWith`).
- **The name.** "Session" is taken in the code (training sessions, the bot's `session()`, an RNG stream), so the code calls it the sesh.

**Slices:**
- **37.1** The session (save v80): who's there, the rounds (theirs seeded from their grade against the problem's, yours played), falls adding up to a find, share or keep, the day's first send and what each pays; the card, from the beta sheet.
- **37.2** The e2e, the harness's measure of sharing against keeping, and the close.

**Done when** [proposed]: a session plays in the e2e; sharing and keeping each pay what they say, from the dials.

**Status (18 Oct 2026): 37.1 built: the session.** Save v80, 0.999.96.
- **Joining** (`sim/sesh.ts`, the `sesh` action): "Join the session" on a boulder's beta sheet, outside, on a busy or packed day, by day, on a problem you haven't sent, once a day. Not on a rope, a deep-water solo, a comp's problem or plastic.
- **Who's on it** (`seatsFor`, seeded by the problem and the day):
  - first the cast who boulder and are here (Dex, Sage, Rico, Mara, Tam, in that order, met);
  - then nameless locals drawn from `LOCALS` (`content/sesh.ts`), to make three on a busy day and four on a packed one (`SESH.seats`).

  A local climbs from two grades under the problem to one over (`SESH.spread`), and shares what they find six times in ten (`SESH.shares`) [proposed]. The cast share as their words say: Sage, Rico and Mara do, Dex and Tam don't [proposed]. Nobody sessions it more than a grade over the problem, the cast included [proposed]: well over it, they'd flash it before anyone else had a go.
- **The rounds:**
  - you've got next go when you join; your go is played as any go, without the queue or the crowd's shouting;
  - after it, the others have their round (`theirRound`, `SESH.round` 10 minutes [proposed]);
  - or sit a round out and watch.

  Each of them goes at a comp's chance from their grade against the problem's (`COMP.steep`), spread over six goes (`SESH.goes`) [proposed]. Knowing the problem's hidden moves is worth a grade to them (`SESH.knows`) [proposed].
- **Falls add up to a find, once a session:**
  - everyone's falls at a crux count toward its hidden move, and the fall that reaches the move's count turns it up for whoever took it;
  - a move you work out with your own falls is your find too;
  - each move is found once a session: whoever didn't hear it climbs without it.
- **Share or keep.** A move of yours (found today, or brought from another day) waits on your answer before your next go:
  - **Tell them:** they all have it; +1 bond with each of the cast there the first time today, on top of the day together (`SESH.share.bond`), and +2 with the old guard each time (`SESH.share.old`) [proposed].
  - **Keep it:** nothing now; they climb without it.

  A local's find is shared with everyone or kept, by their style. A move they tell you, you've watched: it costs the onsight, not the flash, as does a round sat out before your first go.
- **The day's first send:**
  - yours pays +3 psyche (a lift inside the day's cap) and +3 with the old guard (`SESH.first`) [proposed], and puts First to the Top in the Record Book the first time (`seshFirsts`; Steam's list has it, 52 entries);
  - a local's first send pays you nothing;
  - your send ends your session; the session breaks up once everyone else is up it, and the night clears it.
- **The card** (`ui/sheets.ts`, `{k:'sesh'}`): who's on it and how they're getting on (sent, still on it, knows something), the last round in words, and your move: Your go (its cost, then their round's), Sit a round out (with what watching costs before a first go), Walk away; or, with a find waiting, Tell them (what it pays, from the dials) and Keep it. The fall sheet in a session has Back to the session where Rest would be; the beta sheet has Back to the session while it's on.
- **Save v80:** `sesh` (the problem, the day, the seats, the falls, the finds, the first send, the round and its words) and `seshFirsts`. Migration 79 sets them empty. Fixture `save-v79.json`, made by main's code from the v78 fixture.
- **Tests:** `sesh.test.ts` (13):
  - who's on it, seeded;
  - where and when (a rope, a quiet day, the dark, sent, the gym, once a day);
  - falls adding up to a find once, and a local sharing or keeping it;
  - your find, sharing (bond and the old guard) and keeping (nothing);
  - a move brought from another day;
  - watching costing the onsight, not the flash;
  - the first send's pay and the Record Book;
  - a local's first send paying you nothing;
  - the move's worth to them;
  - their round after your go, and the night;
  - the save, a broken session refused, and the v79 fixture;
  - the words.

  The old saves' tests expect the two new fields; the store copy and Steam's list count 52 entries.
- **The download:** 482.3 KB of 490 (+3.7).

**Status (18 Oct 2026): 37.2 built: the session in the e2e, measured, retuned, and the close.** No save change, 0.999.97.
- **The e2e** (criterion 1): day 39 on its seed is a busy morning at Roadside with Dex and Sage there:
  - it joins the session on the Warm Boulder from its beta;
  - it comes off at the crux on the first go, which turns up the move, and the card asks;
  - it tells them, and checks the save against what the card said that pays: the old guard's standing and each of the cast's bond;
  - then it goes till the session's decided, and checks the day's first send's pay if it's yours, or nothing if a local beat you to it (on its seed: Dex, Sage and a local are on it, the crag puts a stance to you between goes, and you send it first).

  Its first try stopped on a stance the crag put to you between goes, as any call can come; the player answers it and gets back to the session through the problem's beta. The section sets today's call aside in its save, as other sections set up theirs.
- **The measure** (`seshMeasure`, criterion 2): 120 busy mornings on Crimpfest, a climber half a grade under it, always telling or always keeping. About a third of sessions turn up the move on your first go's fall; the rest are a first-go send, or a find nobody gets to. Measured on 37.1's dials, keeping never bought a first send (none sharing, 3% keeping, after a find): a local a grade over the problem, or the cast capped there, sent within a round or two either way.
- **Retuned, [proposed]** (`SESH`): nobody sessions a problem over its grade (`spread` −2 to 0), the move is worth two grades to them (`knows`), and their chance is spread over twelve goes (`goes`). After a find, the first send is now 10% sharing and 26% keeping. Sharing pays its bond (+0.24 a session) and the old guard (+0.5 a session) over keeping. The harness holds both: its new line passes, and so do the other twelve.
- **The download:** 482.2 KB of 490.

**Phase 37 against its Done-when (18 Oct 2026):** both pass.
1. A session plays in the e2e: joined, a find turned up and told, the goes to the end.
2. Sharing and keeping each pay what they say, from the dials: the unit tests hold each pay to its dial (`sesh.test.ts`), the e2e holds telling to what the card says, and the harness measures the trade: telling pays standing and bond, keeping buys the first send after a find.

**Closing Phase 37 is Evan's call.** Carried:
- **The [proposed] numbers:** the seats, the round's minutes, the spread, the shares, the move's worth, the goes, and what sharing and the first send pay.
- **No career bot joins a session,** so its pay isn't measured inside a career, only on the harness's mornings.
- **A first-go send is most first sends** (about seven in ten in the measure, at half a grade under). The choice to share or keep arises only after a find, about a third of sessions.

**Phase 37 closed by Evan's call (18 Oct 2026).** Both criteria pass. Carried, as listed above: the [proposed] numbers, the retune's cap among them (nobody sessions a problem over its grade, the cast included); no career bot joins a session; most first sends are first-go sends, and the choice to share or keep comes up in about a third of sessions. The CURRENT MILESTONE moves to Phase 38. The download is 482.2 KB of 490.

### Phase 38 — A ghost of your best go

*Small to medium. Planned with Evan's calls (18 Oct 2026); changes the save (v81).*

**Goal.** A project shows you how far you've come on it.

**Scope.** On a line you're working, your best go so far climbs beside you, faint, to where it fell. Built on the high point the wall already flags (`view/render.ts`).

**Evan's calls (18 Oct 2026), all as recommended:**
- **What it replays:** your best go at its pace. It stops where that go stopped and comes off where it fell, so you see where you're quicker or slower. The best is the highest, and of two as high, the quicker there. The save keeps a short list of times a line (v81).
- **Where:** every unsent line you've had a go on, indoors and out, sessions and comps included (it's your own go, not anyone's beta). On by default, with a switch in Settings.
- **After a send:** it's gone, and its times leave the save. Laps climb alone.

**From the survey (18 Oct 2026):**
- **The high point** is the move you were on when you came off (`RouteLog.hi`, from `fall` in `sim/climb.ts`). The wall flags it.
- **A go runs on its own clock** (`Attempt.t`, stepped at `STEP`):
  - you move only while you hold, at one speed for the whole go (`CLIMB.climbRate` times your pace, fixed at the tie-in);
  - you hang still at a rest, a placement or a crux;
  - a cleared crux puts you past it in a moment.

  `goResult` hands the go to `done`.
- **Laps:** a sent line can be climbed again (`style: 'repeat'`).
- **Settings** are the device's (`game/persist.ts`), not the save's.
- **Sets come down:** a gym's problems carry their week in their ids (the board's carry its block), and a comp's carry its day. Their logs stay in the save for good.

**Done when** [proposed]: the ghost climbs to the best go's high point and no further; a save from before loads.

**One slice, 38.1:** the pace, the best go, the drawing, the switch, save v81, the tests and the e2e.

**Status (18 Oct 2026): 38.1 built: the ghost.** Save v81, 0.999.98.
- **The pace** (`sim/climb.ts`):
  - a go keeps `[t, pos, …]` at each point where you started or stopped moving, counted from your first move, so standing at the bottom isn't counted;
  - where a cleared crux puts you past it, two points at the same moment;
  - the last point is where you came off;
  - at most `GHOST.keys` (48) points [proposed], the last always where you came off;
  - a go that sends, or never leaves the ground, keeps none.
- **The best go** (`done`, `sim/ghost.ts`):
  - kept on the line (`RouteLog.ghost`) when it's the highest so far, or as high and quicker;
  - gone with the send, and a lap keeps none;
  - a high point from before v81, which has no pace, climbs evenly at your pace now, up into the move it came off, until a go as high takes its place;
  - at night, a set's problem that has come down (the week's set, the board's block, a comp's day) takes its ghost with it (`stillUp`); a crag's line keeps its ghost.
- **The wall** (`view/render.ts`): the ghost climbs its pace beside your go, left of the line and faint, drawn whole so its limbs don't show through each other. Then it comes off and fades over a fall's time.
- **Settings:** "Your best go": climbs beside you, faint, or hidden. On by default.
- **Save v81:**
  - the line's `ghost` is optional, and it's checked: an even list, with time only running forward;
  - migration 80 changes nothing;
  - fixture `save-v80.json`, made by main's code from v79.
- **Tests:**
  - `ghost.test.ts` (9):
    - the pace of a played go on The Pump: a rest, A cleared, off B's throw;
    - none for a send or a go that never moved;
    - the cap;
    - the ghost climbing to where it came off and no further (criterion 1);
    - the best go kept;
    - gone with the send, none on a lap;
    - a high point from before;
    - a set's problem's ghost going with it;
    - the save (criterion 2).
  - Settings: the switch, and settings from before it.
- **The e2e:** the session's first go at the Warm Boulder keeps its pace, from the first move to where it came off, no higher than the high point; it goes with the send.
- **Seen on the dev server:** the ghost climbs ahead to the crux, waits there as that go did, comes off and fades. With the switch off, it's hidden.
- **The download:** 483.2 KB of 490 (+1.0).

**Phase 38 against its Done-when (18 Oct 2026):** both pass.
1. **The ghost climbs to the best go's high point and no further:**
   - over a played go, `ghostAt` never passes where the go came off, and that's never past the high point (`ghost.test.ts`);
   - the e2e holds the kept pace to the high point.
2. **A save from before loads:** the v80 fixture loads as v81, its high points shown as even climbs (`ghost.test.ts`).

**Closing Phase 38 is Evan's call.** Carried:
- **[proposed]:** the 48 points, and the ghost's look (how faint, how far aside).
- **The bots keep ghosts but never see them,** so no harness measures the ghost. Nothing in the rules reads it.
- **A high point from before v81** climbs at an even pace, not that go's.
- **The e2e checks the save, not the drawing.** The drawing was checked on the dev server, in screenshots.

**Phase 38 closed by Evan's call (18 Oct 2026).** Both criteria pass. Carried, as listed above: the [proposed] cap and look; the bots keep ghosts nothing reads, so no harness measures it; a high point from before v81 climbs evenly; the e2e checks the save, not the drawing. The CURRENT MILESTONE moves to Phase 39. The download is 483.2 KB of 490.

### Phase 39 — Each crag's classics

*Small. Planned with Evan's calls (18 Oct 2026). No save change, though the queue guessed one.*

**Goal.** Every crag has its must-dos, and ticking them means something.

**Scope.** Five starred lines on each crag's place card. Tick them all and you're a local there, with small perks. Your own first ascents can become classics once their grades settle (32.4).

**Evan's calls (18 Oct 2026), all as recommended:**
- **Which lines:** five a crag, hand-picked in its content, spread across its grades and kinds so a newcomer can tick the easy ones first. Where unclimbed lines leave fewer (the Bluff, the Hollow), there are fewer, until your first ascents fill them.
- **What a local gets:**
  - on a busy day, no waiting for a line there;
  - the crowd there answers when you ask for beta;
  - a Record Book entry, the first time you're a local anywhere.
- **Your first ascents:** once one's grade settles (three repeats), it's a classic at its crag on top of the set ones, and it counts toward being a local there.

**From the survey (18 Oct 2026):**
- **Ten crags, 7 to 12 lines each** (the Big Stone's wall pitches aside), so five is half or more of a crag.
- **24 lines are still to be climbed:** every line at the Bluff (9) and the Hollow (7), and each crag's open project (8). None of them can be a classic until it's climbed.
- **Nothing is kept per crag:** standing is the valley's (`scene.old`, `scene.gym`).
- **Where the perks hook in:**
  - a busy crag's queue (`queueMin`, `CROWD.queue`);
  - asking around for beta (`canAsk`), which needs a busy or packed crowd.

**Done when** [proposed]: the content test gives every crag its five; a bot career becomes a local somewhere; a save from before loads.

**One slice, 39.1:** the classics, being a local, the card, the Record Book, the tests, the harness's line and the e2e.

**Status (18 Oct 2026): 39.1 built: each crag's classics.** No save change, 0.999.99.
- **The classics** (`PlaceDef.classics`, hand-picked [proposed]):
  - **Roadside:** the Warm Boulder, Crimpfest, The Pump, Highball Arête, Local Testpiece;
  - **the Gorge:** Granite Slab, Gorge Classic, Serenity Crack, Crimp Cathedral, Gorge Trad;
  - **Moonstone:** Tall Arête, The Egg, Desert Spire, Hueco Pockets, Lunar Roof;
  - **the Mesa:** Desert Varnish, The Prow, Desert Enduro, Powerhouse, Desert Trad Line;
  - **the Big Stone:** Base Camp Boulder, The Apron, The Splitter Pitch, The Trad Pitch, Valley Classic;
  - **Wind River:** Alpine Crimps, Glacier Point, The Diamond, Alpine Trad, Astroman;
  - **the Crucible:** The Reckoning, Crucible Crux, The Vise, The Lifeline, Threshold;
  - **the Cove:** Tide Pool Traverse, Saltwater Slab, Leap of Faith, Overhanging Tide, The Deep End;
  - **the Bluff and the Hollow:** none; every line there is still to be climbed.
- **The rules** (`sim/classics.ts`):
  - a crag's classics are its five, then your first ascents there whose grades have settled;
  - any send ticks one;
  - a local has every classic ticked, at least `CLASSICS.list` (5) of them. Where the lines are still to be climbed, your settled first ascents make up the five.
  - Worked out from your sends and first ascents: nothing new is kept.
- **A local:**
  - no queue at that crag on a busy or packed day;
  - asking around there works on a quiet day too (`canAsk`), though not on an empty one;
  - the act that makes you one says so, once;
  - the Record Book's "A Local", its 53rd entry. Steam's list, `desktop/STEAM.md` and the store copy follow.
- **Shown:**
  - the crag's card: how many are ticked, and which are still to go; your own among them; room for more where lines are still to be climbed; "You're a local here";
  - a classic's beta sheet: "One of Roadside Crag's classics."
- **Tests:**
  - the content test (criterion 1): every crag's five are climbable lines there, across at least three grades and more than one kind where it has more than one, the easiest within a grade of the crag's easiest; none where every line is unclimbed;
  - `classics.test.ts` (6): the list and your settled first ascents; a local, and one short; a crag of unclimbed lines filled from yours; no queue; asking on a quiet day; the line once, the Record Book, and a save that was already a local (no line, the entry on its next act).
- **The harness** (criterion 2): the career bots, 16 runs of 224 days: 9 become a local somewhere, all at Roadside, one at Moonstone too. Median classics ticked a run: Roadside 5, Moonstone 3, the Gorge 2, the Mesa 1. The career harness's other seven targets hold.
- **The e2e:** Roadside's card lists its classics, none ticked; the Warm Boulder's sheet says it's one.
- **Seen on the dev server:** Roadside's card with three ticked: "The classics, 3 of 5 ticked. Still to go: Highball Arête and Local Testpiece."

**Phase 39 against its Done-when (18 Oct 2026):** all three pass.
1. **The content test gives every crag its five:** five at every crag with lines to climb; none at the Bluff and the Hollow, where every line waits for its first ascent.
2. **A bot career becomes a local somewhere:** 9 of 16 career runs, by day 224.
3. **A save from before loads:** nothing in the save changed. The v80 fixture loads as before, and a save that was already a local gets the entry on its next act, with no line.

**Closing Phase 39 is Evan's call.** Carried:
- **[proposed]:** the forty picks, and the local's two perks as built (no queue on a busy day; asking around on a quiet one).
- **The bots become locals only at Roadside, and once at Moonstone.** They don't go after classics; they send what they send. No boulderer becomes one anywhere: two of Roadside's five are sport.
- **The Bluff and the Hollow need five of your own lines, settled,** before anyone's a local there.

**Phase 39 closed by Evan's call (18 Oct 2026).** All three criteria pass. Carried, as listed above: the [proposed] picks and perks; the bots become locals only at Roadside (and once at Moonstone), and no boulderer does; the Bluff and the Hollow need five of your own settled lines. The CURRENT MILESTONE moves to Phase 40. The download is 484.0 KB of 490.

### Phase 40 — "What now?" from Hazel

*Small. Planned with Evan's calls (18 Oct 2026). No save change.*

**Goal.** A new player always knows a good next move, and why.

**Scope.** Three suggested moves, each with a one-line reason drawn from the state (the rent's due Friday; the Gorge is dry; Sage is at the Cave). It fades after Act I unless you ask for it.

**Evan's calls (18 Oct 2026), all as recommended:**
- **Where:** a "What now?" button beside the goal chip opens Hazel's card with three moves. Through Act I it's lit each morning; after Act I it stays, but waits to be asked.
- **Which first:** what's pressing (bills due, low energy or skin, an injury), then the story's next goal, then what's good today (a dry crag, a friend around, a line nearly had).
- **What a move does:** it's a button that takes you there: a place's card, a line's sheet, or the journal's goal.

**From the survey (18 Oct 2026):**
- **The goal chip** (`ui/Goal.tsx`) shows the story's next goal (`currentGoal`, `goalDesc`), and `actOf` says which act you're in.
- **The week's bills** come out at the end of every seventh day (`weeklyBills`).
- **A shift needs** posting, your schedule, the hour and the energy (`unmet` on its act).
- **The cast's whereabouts:** `whereNow`.
- **The day's sky** at each crag: `conditionsAt`.

**Done when** [proposed]: every reason comes from the state, never typed in (a test); the e2e's first week sees it.

**One slice, 40.1:** the moves, the card, the button, the tests and the e2e.

**Status (18 Oct 2026): 40.1 built: "What now?" from Hazel.** No save change, 0.999.100.
- **The moves** (`sim/whatnow.ts`, words in `content/whatnow.ts`), up to `WHATNOW.moves` (3) [proposed], never two to one place:
  - **needs:**
    - an injury, the clinic;
    - spent, the van;
    - skin gone, a shift while it grows back;
    - the bills `WHATNOW.billsWithin` (2) days off [proposed] with less than they come to, a shift, saying the bill, your cash and the day;
  - **the story's next goal,** in its own words:
    - money, a shift;
    - sends, the easiest unsent line here, else the gym or Roadside;
    - a crag, that crag;
    - a Regular, the friend you're closest to, where they are now;
    - anything else, the journal;
  - **chances:**
    - a line here you came off within `WHATNOW.near` (2) moves of the top [proposed];
    - a friend somewhere else;
    - a crag in prime shape that'll have you;
    - a shift going, its pay and hours from the act (one you're signed up for today first).
- **The button** (`ui/WhatNow.tsx`), over the goal chip:
  - lit through Act I till you've asked that day (`whatNowLit`); after Act I, there unlit;
  - the day you asked is the session's, not the save's, so a reload lights it again.
- **Hazel's card** (`{k: 'whatnow'}`): her line, then each move as a row with its reason, opening a place's card, a line's sheet (`lookUp`), or the journal's goal.
- **Tests** (`whatnow.test.ts`, 7):
  - needs first, each reason carrying the state's facts (the injury's name, the bill, the cash, the day);
  - the story's goal in its words, to the line, the gym, Roadside or the friend;
  - chances: a line nearly had, a prime crag;
  - a signed-up shift first, its pay and hours from the act;
  - three at most, in order, never two to one place;
  - lit till asked in Act I, not after;
  - the words hold no number, no straight quote, no doubled space (criterion 1).
- **The e2e** (criterion 2): on the first morning the button's lit; Hazel's card names the story's goal and two or three moves; asked, it stops asking.
- **Seen on the dev server:** a new climber's first morning: "Go to Send City" (the goal), "Go to Roadside Crag" (cold and dry), "A shift at Coffee Shop" ($31 for 3 h, the origin's bonus in).

**Phase 40 against its Done-when (18 Oct 2026):** both pass.
1. **Every reason comes from the state:** the reasons are templates filled from the state, the words carry no number of their own, and the tests hold each fact to the state's (`whatnow.test.ts`).
2. **The e2e's first week sees it:** the first morning, lit, opened, asked.

**Closing Phase 40 is Evan's call.** Carried:
- **[proposed]:** the three moves, the two days' warning for the bills, the two moves for a line nearly had.
- **The moves only take you there.** None acts by itself, so a shift or a sleep is still the place card's second tap.
- **No bot reads Hazel,** so how much her advice helps isn't measured; the bots' own choices stand.
- **"Lit" is the session's,** so a reload in Act I lights it again the same day.

**Phase 40 closed by Evan's call (19 Oct 2026).** Both criteria pass. Carried, as listed above: the [proposed] numbers; a move only takes you there; no bot reads Hazel; "lit" is the session's; a label reads flat where a place's name has no article ("A shift at Coffee Shop"). The CURRENT MILESTONE moves to Phase 41. The download is 485.7 KB of 490.

### Phase 41 — The week's forecast and send temps

*Small. Planned with Evan's calls (19 Oct 2026). No save change.*

**Goal.** The weather is something to plan around, not just weather.

**Scope.** A five-day forecast for the valley at the café, vaguer further out. Cold, dry days give better friction. Expeditions already have their forecast call (`forecastCall`).

**Evan's calls (19 Oct 2026), all as recommended:**
- **Where:** the café's card shows the valley's next five days, and the week's plan marks each day's forecast.
- **How sure:** each day reads as a call and how sure it is ("Prime, likely", "Rain, maybe"). Tomorrow's comes true about nine times in ten, five days out about six in ten, on the expeditions' curve. The harness checks that it comes true as often as it says.
- **Friction:** by the day, shown. As now, a prime day widens every window; the beta sheet says so in words built from the dials, and the plan marks those days.

**From the survey (19 Oct 2026):**
- **The sky** is a pure function of the seed and the day, from each season's odds (`skyOn`; `skyAt` for a place with its own sky).
- **What it does to a go:** every window outdoors is ×1.1 on a prime day, ×0.9 on a hot one (not on shaded rock), and ×0.92 the day after rain (`conditionsAt`). The numbers were typed into `weather.ts`.
- **The game already told the future:** the week sheet (the HUD's day button) showed the true sky three days out, and Tonight showed tomorrow's.
- **The expeditions' forecast** (`forecastCall`) calls storm or clear, right `1 − lead/20` of the time (95% tomorrow), drawn afresh each day.
- **The week's plan:** the week sheet's schedule, a row a day for a week. The day plan (`game/plan.ts`) covers one day only.

**Done when** [proposed]: the forecast comes true as often as it says (the harness); friction shows in a go's odds and on the plan.

**One slice, 41.1:** the calls, where they show, the friction words, the harness's check, the tests and the e2e.

**Status (19 Oct 2026): 41.1 built: the forecast and send temps.** No save change, 0.999.101.
- **The calls** (`sim/forecast.ts`, dials `FORECAST`):
  - **Reach:** one a day for the next `FORECAST.days` (5). Today's is the sky itself.
  - **Accuracy:** right `near` (0.9) of the time tomorrow, falling in a straight line to `far` (0.6) five days out. That's the expeditions' shape with the valley's own numbers; the expeditions' curve is unchanged.
  - **A wrong call** is one of the season's other skies, as likely as the season makes it, so a winter forecast never calls hot.
  - **How sure:** the chance a call is right, given what it calls, worked out from those odds. A call of a sky the season seldom has is wrong more often. It's said as "likely" from `FORECAST.likely` (0.75) [proposed] up and "maybe" below, never as a number.
  - **Each day's calls are drawn afresh,** as the expeditions' are, so the call for a day can change as it comes closer.
  - **A place with its own sky** gets its own calls, of its own sky.
- **Where it shows:**
  - **The café's card** (there, or from the map): the radio's line, filled from the dials ("Tomorrow's call comes true about nine times in ten; five days out, about six."), then the five days, each a call and what it would do to the rock.
  - **The week sheet** (the week's plan):
    - today as it is, then tomorrow and the day after as called, read as if the calls hold;
    - each paid-for crag out of the valley, as called there;
    - each schedule day the radio reaches, marked with its call; a prime day's name is in the accent, with what it does for every window.
  - **Tonight:** tomorrow as called, no longer the day itself.
- **Friction** (criterion 2): the rules are unchanged; their numbers moved to the dials (`CLIMB.sky {prime 1.1, hot 0.9, seep 0.92}`). They're said in words (`ui/forecast.ts`; "window" is a word the sim's purity test keeps out of the sim):
  - the beta sheet's note (`#friction`) says what today's sky does to every window on the line ("Cold and dry: every window 10% wider."); shaded rock never mentions the heat;
  - the week sheet says the same of each prime day.
- **The harness** (criterion 1): the season harness's twelfth target. It counts every call over four years of mornings in 40 worlds, the valley's and each place's with its own sky (627,200 calls). Came true / said:
  - by days out: 1, 90.1 / 90.0%; 2, 82.6 / 82.5%; 3, 75.0 / 75.0%; 4, 67.5 / 67.5%; 5, 60.0 / 60.0%;
  - by word: "likely" 84.3 / 84.3%, "maybe" 64.4 / 64.3%.

  The season harness passes all 14 of its targets.
- **Tests** (`forecast.test.ts`, 7):
  - the curve, today to five days out;
  - five calls from tomorrow, the same however often asked, and today's the sky;
  - calls change as the day comes closer;
  - never a sky the season doesn't have;
  - a place with its own sky gets its own calls;
  - right as often as it says, by days out and by word, on a smaller sample;
  - a call reads the way a day does.
- **The e2e:** day one's café shows the radio and its five calls; day one's prime day at the Warm Boulder shows its friction; Tonight shows tomorrow as called; day two's schedule shows the calls.
- **The download:** 486.9 KB of 490; no raise needed.

**Phase 41 against its Done-when (19 Oct 2026):** both pass.
1. **It comes true as often as it says:** within a tenth of a point at every distance and for each word (the season harness's twelfth target).
2. **Friction shows in a go's odds and on the plan:** the beta sheet's note says what the day does to every window, from the dials the go uses, and the week's schedule marks the prime days.

**Closing Phase 41 is Evan's call.** Carried:
- **[proposed]:** "likely" from 0.75.
- **The future isn't free any more.** The week sheet and Tonight used to show the true sky; now they show the radio's call, so a player who learned to trust them will sometimes be wrong.
- **You don't need the café to read it.** Its card shows the forecast from the map too, and the week sheet marks every day, so the café is where it's said in full, not the only place to learn it.
- **A day's call can flip-flop.** Each morning's calls are drawn afresh, so watching a day's call over several mornings tells you more than any one call says. The chance a call states is for that call alone.
- **No bot reads the forecast,** so the harness measures that it's honest, not that it helps.

**Phase 41 closed by Evan's call (19 Oct 2026).** Both criteria pass. Carried, as listed above: "likely" from 0.75 [proposed]; the week sheet and Tonight no longer show the true sky; you don't need the café to read the forecast; a day's call can flip-flop; no bot reads it. The CURRENT MILESTONE moves to Phase 42. The download is 486.9 KB of 490.

### Phase 42 — Belaying, played

*Small to medium. Planned with Evan's calls (19 Oct 2026). No save change.*

**Goal.** Holding someone's rope is something you do, not a line of text.

**Scope.** A short timing game: pay out, take in, catch softly. It builds trust and better beta from whoever you held.

**Evan's calls (19 Oct 2026), all as recommended:**
- **When:** at the crag, "Belay them" with any partner who'd belay you, once a day each; and when one of the crew asks a belay as a favour (Phase 28.3), that's the game too.
- **The game:** keep the slack right. A rope meter: as they climb and clip the slack drifts; hold to take in, let go to pay out, and keep it in the band. Once a go they fall: brake, and give a little as the rope comes tight for a soft catch.
- **What it gives:** a clean belay counts as the day together, the same one bond, never on top of it, so it can't out-bond climbing together. They tell you a beta on the line you've worked most there. A hard catch gets no beta, and they say so.

**From the survey (19 Oct 2026):**
- **Belaying was a precondition and a line:** a partner at the crag lets you tie in (`belayer`), and a go with anyone you know there makes it a day together, one bond once a day (`climbedWith`).
- **The crew's belay favour** costs an hour and some energy on a yes, and nothing is played. Rico's "belay" is a spot: he boulders.
- **The minigames to borrow from:** the beat panel's outcome reaches the sim as one action (`busk`'s accuracy), and the climb's hold is a fixed-step model stepped by the frame loop (`stepAttempt`).
- **Beta from people:** `sprayable` lists the moves you don't know on a line, in order.

**Done when** [proposed]: the e2e plays it; it can't out-bond a day climbing together (the harness).

**One slice, 42.1:** the rope, the panel, the talk option and the favour, the tests, the harness's measure and the e2e.

**Status (19 Oct 2026): 42.1 built: belaying, played.** No save change, 0.999.102.
- **The rope** (`sim/belay.ts`, dials `BELAY` [proposed]): a fixed-step model like a go's.
  - **The meter** runs from no slack to all the rope out. Their climbing takes up `climb` a second, your hand off pays out `pay`, and holding takes in `take`.
  - **A clip** pulls `clip.pull` in `clip.s` seconds, and `clip.back` of it comes back once it's in. The clips are the line's bolts; a line without bolts has `clips` placements.
  - **The fall:** once a go, somewhere `fall` of the way up, the slack runs at `drop` a second. Letting go within `soft` seconds of the rope coming tight is a soft catch.
  - **Clean:** a soft catch, with the slack in the `band` for at least `clean` of the climb.
  - **The line they climb** is the unsent roped line you've worked most there (anywhere, for a favour asked away from a crag), else the easiest roped line there.
- **The belay** (`{t: 'belay'}`):
  - at the crag: a partner who'd belay you, there with you, on an open day, with something on a rope, before dark, with the energy; it costs `BELAY.min` and `BELAY.energy`, once a day each (`belayed-<who>`);
  - as their favour: the yes paid for it, so it costs nothing more;
  - either way it's the day together (`climbedWith`, never on top of one);
  - **clean:** they tell you the next move you don't know on your line (told), in their words (`content/belay.ts`); with nothing left to tell, they say so;
  - **hard:** no beta, and their grumble.
- **Where it starts:**
  - **at the crag:** "Want a belay?" on the talk of Hazel (at the crag), Sage, Mara and Tam, while it's allowed (`Cond.belay`), with its cost from the dials;
  - **their favour:** a yes to a belay puts the rope in your hands; Rico's stays a spot (`PersonDef.boulders`).
- **The panel** (`ui/BelayPanel.tsx`):
  - their height and the slack on meters, with the band, and what they're doing (climbing, clipping, falling);
  - "Take in", which reads "Brake" on the fall, held by pointer, Space, Enter, or A and the right trigger;
  - when they're down, what they said and the way out.
  - While it's up, the HUD, the dock and the plan chip step back, and back does nothing till they're down.
- **The harness** (criterion 2): the season harness's target 13. On 60 open mornings at Roadside with Hazel:
  - each moves her bond by one: a go together, a clean belay, a go then a belay, a belay then a go;
  - a bot's hands, a person's misses and all, belay clean 73% of the time.

  The season harness passes all 15 of its targets.
- **Tests** (`belay.test.ts`, 12):
  - a perfect hand is clean, an idle one isn't;
  - braking through the fall, or giving too soon, catches hard;
  - a clip pulls slack and gives some back;
  - a bot's hands miss like a person's, the same hands the same belay;
  - the cost, once a day, the day together and never on top;
  - a clean belay's beta on the line you've worked most and its words, a hard catch's grumble, a slack belay unclean;
  - the refusals;
  - the talk option only while allowed, opening the rope;
  - the favour's yes opening the rope at no extra cost, and refused without it;
  - Rico's spot;
  - the words.
- **The e2e** (criterion 1): day 39's open morning at Roadside, with the Pump your most-worked line and Hazel's favour answered this window, so she makes the crag's offer. "Want a belay?" from her; the hand reads the meter and holds Space; the catch; in the save, the half hour, the day together, and on a clean belay the Pump's beta. The run before this PR came out clean, and she told the Pump's high-step.
- **The download:** 489.2 KB of 490; the next phase will need the budget raised.

**Phase 42 against its Done-when (19 Oct 2026):** both pass.
1. **The e2e plays it:** Hazel's rope, held on Space to the catch, and the save checked either way it comes out.
2. **It can't out-bond a day climbing together:** a belay is that day together or nothing (the season harness's target 13).

**Closing Phase 42 is Evan's call.** Carried:
- **[proposed]:** the rope's numbers, and the half hour and four energy a belay costs.
- **The day together is often had already:** a go at the crag with them there counts too, so on those days a belay adds no bond and its worth is the beta. That's the "never on top" call working as meant.
- **No bot belays.** A bot's yes to a belay favour pays the hour without playing the rope, so the harness measures the belay directly rather than over careers.
- **They don't climb on screen:** the panel's meters carry it, and the wall shows the rope but not them on it.
- **Rico's ask stays a spot.**
- **The e2e's hand** reads the meter on a timer, so its belay can come out clean or hard; it checks the save either way.

**Phase 42 closed by Evan's call (19 Oct 2026).** Both criteria pass. Carried, as listed above: the rope's numbers and the belay's cost [proposed]; on a day already climbed together, a belay's worth is the beta; no bot belays; they don't climb on screen; Rico's ask stays a spot. Also open: the gate's e2e counted font loads the page cut off itself as failed requests, which went red once on #165's CI (a re-run passed); the proposed hardening is on #165. The CURRENT MILESTONE moves to Phase 43. The download is 489.2 KB of 490; Evan's call raises the budget to 500 KB in 43.1.

### Phase 43 — Your van, laid out

*Medium. Planned with Evan's calls (19 Oct 2026). Save v82.*

**Goal.** The van is a place you've built.

**Scope.** The build-outs (29.1) as a floor plan on a grid: where the shelf, the panel, the mattress and the kitchen go, and what fits.

**Evan's calls (19 Oct 2026), all as recommended:**
- **What takes room:** on the floor, the bed (on its platform or not), the shelf, the kitchen and the heater; the solar panel on a grid of the roof. The seals, the insulation, the curtains and the tune-up aren't placed: they're in the walls, the windows and the engine.
- **What placing does:** fit only. Footprints, no overlap, and the bed needs its length; where a piece goes changes no rule. A new van, or the Rig with its longer floor, starts its own plan.
- **A save from before:** laid out for you. The migration puts what it owns in a default arrangement, which you can move.
- **The download budget** goes to 500 KB.

**From the survey (19 Oct 2026):**
- **What's in the van is `s.gear`:** the garage's upgrades (`UPGRADE`: the mattress `bed`, the curtains, the tool kit, the tune-up, the heater, the insulation, the kitchen) and the build-outs from parts (`BUILD`: the shelf, the solar panel, the seals, the bed platform), built at the van (`lot.<id>`).
- **Where they come and go:** the Rig's claim fits everything; Home Base gives the kitchen; a used van keeps nothing fitted but the tool kit (`FITTED`).
- **Nothing had a place:** the van card listed the build-outs still to build, and no screen showed the van's inside.

**Done when** [proposed]: every build-out can be placed; a save from before loads with its build-outs laid out.

**One slice, 43.1:** the plan's rules and the save, the sheet, the tests and the e2e.

**Status (19 Oct 2026): 43.1 built: the van, laid out.** Save v82, 0.999.103.
- **The plan** (`sim/vanplan.ts`, dials `VAN_PLAN` [proposed]):
  - **The floor** is `len` (8) cells long and `wide` (3) across, about half a metre a cell; the Rig's is `rig` (10) long. The sliding door's cells (`door`) on the near side stay clear. The roof is the floor's size.
  - **Footprints, long by across:** the bed 4 by 3, the kitchen and the shelf 2 by 1, the heater 1 by 1, and the solar panel 3 by 2, on the roof.
  - **A spot** (`{x, y, r}`) fits inside the van, off the door (for the floor's pieces), and on nothing else on its layer. Anything can turn (`r`) but the bed, which needs its length.
  - **The bed** is always there and stays in. The rest can come out to make room, and still work while they wait.
  - **`{t: 'place', piece, at}`** moves, turns or takes out a piece (`at: null`). A spot it doesn't fit is refused, with why: outside the van, the door, or something already there. It takes no time.
  - **After anything** (`syncPlan`, in `act`'s tail): what you no longer have comes off the plan. What you've got that isn't on it, and wasn't taken out, goes in where it fits: its own spot first, then the first free one from the front.
  - **A new van starts its own plan:** the used van and the Rig's claim lay theirs out afresh (`defaultPlan`).
- **Save v82:** `vanPlan`, a spot or null (out) for each piece you have.
  - The migration lays out what a save owns as a new van would be: the bed across the back, the kitchen and the shelf along the far wall at the front, the heater in the front corner by the door, and the panel mid-roof.
  - Fixture `save-v81.json` (day 201, everything fitted), made by main's code.
- **The sheet** ("Lay out the van" on the van card):
  - **The grids:** the floor and the roof, the door marked. Each piece is drawn to its footprint and named, and a turned piece reads along its length.
  - **Placing:** tap a piece, then where its top-left corner goes; a tap near an edge pulls it inside. "Turn it", "Take it out" (not the bed), and "Put back" for anything out.
  - **Words:** the bed's line says what you sleep on. The van card's row says where things go, or what's out waiting for a spot.
- **Tests** (`vanplan.test.ts`, 7):
  - what fits where: inside, the door, overlap, the roof its own layer, and a piece never in its own way;
  - turning, and the bed can't;
  - everything you could own fits at once, in the van and in the Rig, and a new climber's van has the bed only;
  - moving, turning and refusing, at no time;
  - taken out stays out, and the bed stays in;
  - what you build goes in, and what you lose comes off;
  - the v81 fixture loads laid out.
- **The e2e:** a morning at the Lot with a kitchen and a shelf. "Lay out the van" from the van card; the kitchen turned; the shelf out, then back in the gap; the bed moved along, never turned or out; the door refused. Each is in the save as it's done, and none of it costs a minute.
- **The download:** 491.6 KB of 500 (+2.4), the budget raised from 490 by Evan's call.

**Phase 43 against its Done-when (19 Oct 2026):** both pass.
1. **Every build-out can be placed:** passes for each that takes room, by Evan's call. The shelf and the solar panel are placed; the platform is under the bed, and goes where the bed goes; the seals are in the walls, so aren't placed. Every piece you could own has a spot at once, in the van and in the Rig (the test), and each one moves, turns where it can, comes out and goes back (the test; the e2e on the sheet).
2. **A save from before loads with its build-outs laid out:** passes. The v81 fixture loads with everything it owns on the plan, sound.

**Closing Phase 43 is Evan's call.** Carried:
- **[proposed]:** the van's size, the door's place, and each footprint.
- **Fit only,** by his call: no rule reads where anything is. A layout that matters (the heater by the bed, the kitchen by the door) would be a later call.
- **The scene's van is unchanged:** only the sheet shows the inside.
- **No bot lays anything out,** since it changes no rule.
- **By controller,** the cells are buttons that focus moves over, so A picks and places. The e2e plays it by pointer only.

**Phase 43 closed by Evan's call (19 Oct 2026).** Both criteria pass. Carried, as listed above: the van's size, the door's place and each footprint [proposed]; fit only, so no rule reads the plan; the scene's van is unchanged; no bot lays anything out; the e2e plays the sheet by pointer only. Still open from Phase 42: the gate e2e's hardening against font loads the page cuts off itself (proposed on #165). The CURRENT MILESTONE moves to Phase 44. The download is 491.6 KB of 500.

### Phase 44 — The setter's wall, hands-on

*Medium to large. Planned with Evan's calls (19 Oct 2026). Two slices; 44.2 changes the save.*

**Goal.** Setting is setting: holds on a wall.

**Scope.** The setting puzzle (18.1, `content/setting.ts`) becomes placing holds on a drawn panel, with the grade shown live as you go.

**Evan's calls (19 Oct 2026):**
- **The panel:** holds on a grid, and reach counts. The bucket's holds go on a drawn panel, bottom to top. Each hold is a move, as before, and a long reach between two holds makes that move harder. The brief stays: the wall, the grade wanted, the week's crowd. (As recommended.)
- **The grade:** today's, plus reach, shown live after every hold, with the brief's checks. (As recommended.)
- **After a set:** it stays up for the week, a climbable problem on the gym's wall until the reset, named by you. (His pick, over the recommended "the pay and the gym's word".)

**From the survey (19 Oct 2026):**
- **The puzzle today** (18.1, `sim/work.ts`): five moves hung in order from a bucket of 7 to 10 by rank, against a brief seeded by the day (the wall, the grade wanted) and the week (the crowd). It's scored on the grade, the flow, the wall and the crowd, and the score buys up to `PLAY.top` of the shift's pay on top. Bots never play shifts; the business bot's own wall takes the best order.
- **The gym's problems are made from the seed:** six a week (`sc-<week>-<n>`, V0 to V5), drawn by their slot, not from data. Every problem anywhere is found by `routeById(seed, id)` alone, at 28 call sites. A set you make isn't in the seed, so it can only be climbable if its id carries it.

**Done when** [proposed]: the e2e sets a problem on the panel (44.1) and climbs it on the wall (44.2); a set's pay still comes from the shift's, the bonus never more than `PLAY.top` of it (a test), as the harness's pay rule has it.

**Slices:**
- **44.1, the panel:** holds on squares, reach, the grade live. No save change.
- **44.2, the set stays up:** its id carries its holds; it's named as it's hung, and gets its own spot on the gym's wall till the reset, drawn as you set it and climbable. Save v83.

**Status (19 Oct 2026): 44.1 built: the setter's panel.** No save change, 0.999.104.
- **The panel** (dials `SETTING.panel` [proposed]):
  - `cols` (5) squares across by `rows` (7) up, about 60 cm a square.
  - The first hold goes in the bottom `start` (2) rows, reached from the floor. Each after it goes higher, one to a row, so they're climbed in the order of their height.
  - **Reach:** a move spanning `long` (2.5) squares or more is a big move, a step harder; `huge` (3.5) or more, two (never past a crux, 3); past `most` (4.5), nobody reaches it (`spanOf`, `spanBump`, `setMoves`).
  - The grade and the checks score the moves as climbed (`scoreSet` with the squares). `setRefused` says what's wrong: off the panel, a start out of reach of the floor, a hold not higher, one too far.
  - A set without squares climbs straight up the middle, a row at a time, with no move long enough to count. That's as before, so the business bot's own wall and any old play score as they did.
- **The sheet:**
  - the panel, the bottom rows shaded;
  - pick a hold from the bucket, then its square; a hold put on a taken row sends the old one back;
  - each hold shows its number up the climb and any step its reach adds; lines run up the climb, a big move in the accent; "Take it off";
  - the checks, the verdict and "Hang it" as before, refused with why.
- **Tests** (`work.test.ts`, 4 new):
  - straight up, as before;
  - the steps, capped, and the grade and the one crux moved by a reach;
  - the refusals;
  - a set hung from the panel on a shift, paid the shift and the bonus for the set as climbed, the bonus never more than its share.
- **The e2e:** day two's setting shift on the panel. Five holds go up from the bottom, the third a long reach (one big move); the grade is live; the pay and the bonus are checked.
- **The download:** 493.0 KB of 500 (+1.4).

**Status (19 Oct 2026): 44.2 built: the set stays up.** Save v83, 0.999.105.
- **Its id carries it** (`sim/yourset.ts`): `ys-<day>-` and then each hold as its place in the bucket's list and its square, across and up, three characters a hold. The bucket's list is append-only now (a test holds its order), and the panel's sides stay under ten squares.
  - `routeById` rebuilds it from the id alone, as it does the gym's own problems from the seed. A set from weeks ago still resolves for its log.
- **The problem** (`setRoute`): a boulder with one crux, the move to its hardest hold, named for that hold. It's graded as the panel graded it, in that hold's style (or the first that isn't a rest's), at the gym, 13 ft.
- **Up on the panel** (save v83, `setUp`: its id and its name):
  - a set hung on a shift, or on your own wall, goes up under the name you gave it (tidied, cut to `SETTING.name.max`; too short, and it's the first idea), and says so;
  - it's on the wall after the week's six and before the board while its week lasts (`stillUp`, `setUpNow`, `wallAt`), and comes down with the reset. A new set takes its place;
  - it goes by its name wherever a line's name is shown through `lineName`;
  - not on a comp day: the comp's set has the wall.
- **The names:** three ideas a set, from its crux hold, the wall and the week's crowd (`SET_NAMES`, `setNameIdeas`). The sheet has the name field and the ideas as chips, and says which set comes down for it.
- **Drawn:**
  - **the scene:** a bare panel of ply at the end of the wall (`SET_X`), your holds on it in their own tape while it's up, with its grade tag, and a tap on it while it's up;
  - **the close-up:** your holds face-on, on their squares, the start and the finish taped (`paintSetWall`, `setTopo`), and the climber's line up them.
- **Save v83:** `setUp`, null for a save from before. Fixture `save-v82.json` (day 201), made by main's code.
- **Tests** (`yourset.test.ts`, 9):
  - the id carries its day, holds and squares, and gives them back; the bucket's order is held;
  - a set is a problem like the gym's: one crux, graded as the panel graded it, a style for every hold;
  - up when it's hung, the name tidied, the first idea for a short one;
  - on the wall after the six, by its name, climbed and sent, then down with the week, its log still finding it;
  - down for the next set; up from your own wall too;
  - the v82 fixture loads with nothing up.
- **The e2e:** day two's set is named "First Light" as it's hung, and the save check finds it up. A new section, "Your set on the wall": a set of yours up this week, walked to at the end of the wall, its sheet by its name, sent, and in the save.
- **The download:** 494.5 KB of 500 (+1.5).

**Phase 44 against its Done-when (19 Oct 2026):** both pass.
1. **The e2e sets a problem on the panel and climbs it on the wall:** day two's set goes up on the panel with a big move and a name. A set of yours is walked to on the panel, climbed and sent.
2. **A set's pay still comes from the shift's:** the bonus is never more than `PLAY.top` of the shift's pay, for sets across the panel (the test). No bot plays shifts, so the harness's pay figures don't move.

**Closing Phase 44 is Evan's call.** Carried:
- **[proposed]:** the panel's size and its reach numbers.
- **One set up at a time:** each set you hang replaces the last.
- **Names:** a set's name lives only while it's the one up. An old set's log falls back to "Your set".
- **Only you climb it:** the crowd and the bots don't.
- **By controller:** the panel's squares are buttons focus moves over, but the e2e plays it by pointer.
- **The download is 494.5 KB of 500:** Phase 45 will likely need the budget raised.

**Phase 44 closed by Evan's call (19 Oct 2026).** Both criteria pass. Carried, as listed above: the panel's size and its reach numbers [proposed]; one set up at a time; an old set's name isn't kept; only you climb your set; the panel by controller isn't in the e2e. Still open from Phase 42: the gate e2e's hardening against font loads the page cuts off itself (proposed on #165). The CURRENT MILESTONE moves to Phase 45. The download is 494.5 KB of 500; Evan's call raises the budget to 510 KB in 45.1.

### Phase 45 — The problem of the day

*Medium [INFERRED]. Planned with Evan's calls (19 Oct 2026). Two slices; no save change (the day keeps its own slot).*

**Goal.** One day to play, the same for everyone, and something to show for it.

**Scope.** A one-day scenario on a seed fixed by the date, offline (no server: nothing leaves the site), in its own save slot, ending on a send card to share.

**Evan's calls (19 Oct 2026),** all as recommended:
- **The day:** one line, one day. The date picks a crag and a line in your edition: one day there, first light to dark, in the day's weather. Send it in as few goes as you can.
- **The climber:** one for everyone, made for the day at the line's level, the same on every device.
- **What you keep:** a card to save or share. It's the send card with the date, the line and your goes (or how close you got), saved as an image or shared through the device's share sheet. The game itself sends nothing.

**From the survey (19 Oct 2026):**
- **Saves** (`game/persist.ts`) sit under one key per edition (`dirtbag.save`, `dirtbag.demo.save`), with a fallback and quarantine keys beside them, and the plan and settings beside those.
- **Nothing in the sim reads a clock,** so the date has to come in from the page.
- **Every line resolves from the seed and its id,** so a day is a seed (`day:<date>`) and a state made from it.
- **The send card** (`view/paint/card.ts`, `ui/card.ts`) is drawn in code at 1080×1920 and goes out through the share sheet or a download (Phase 37), with no network.
- **The service worker** matches requests with `ignoreSearch` and falls back to the page offline, so `?day` is served offline just as `/` is.

**Done when** [proposed]: the same date gives the same day on every device (a test); it never touches the career's save.

**Slices:**
- **45.1, the day:** the draw, the climber, the slot, the page's day mode, its sheet, the ways in, the tests and the e2e. No save change. Budget 510 KB (Evan's call).
- **45.2, the card:** the day's card (the date, the line, your goes or high point) to save or share, and the close.

**Status (19 Oct 2026): 45.1 built: the day.** No save change, 0.999.106.
- **The draw** (`sim/daily.ts`, `dayOf`, `dailyState`):
  - A date (YYYY-MM-DD, one that's on the calendar) seeds the day as `day:<date>`.
  - From the seed's world stream comes a boulder at a crag your edition has and the map shows, never an open project. Lines are taken in the order of their ids.
  - It also draws a day of the year (2 to 56) when the line can be climbed at first light: in season, dry, the crag open. A line that can't be climbed on any of them hands over to the next.
- **The climber** is `You`, the same for everyone, with every skill `DAILY.under` (1.25) grades below the line [proposed]. Measured with the bot's human-ish hands over 150 dates:
  - **At the line's own grade,** they flashed it 39 days in 40.
  - **1.25 under,** they sent it 7 days in 10, in 3 goes at the median (1 to 13), flashing 1 day in 7. The days it didn't go ended on skin, mostly.
  - **By grade:** V2–5 76%, V6–9 60%, V10+ 87%.
  - **From 1.5 under,** the line gains a crux for you (`OVER.cruxFrom`), and sends fell to 2 in 5.
- **The day:**
  - You start fresh at first light at the crag, standing at the line.
  - It's over when the line goes, or when nothing more can be tried on it (`dayOver`: dark, energy, skin, hurt or fried).
  - The result (`dayResult`) is the goes it took (a lap after doesn't count), the send's style, and the high point.
- **Its own slot** (`game/storage.ts`, `useSlot`):
  - The save, its fallback and the plan go under `dirtbag.day.` (`dirtbag.demo.day.` in the demo). Settings stay the player's.
  - The slot keeps one day; another date's day takes its place.
- **The page** (`?day`, `game/day.ts`): today by this device's calendar, or `?day=YYYY-MM-DD` for a day asked for. The Game's day mode:
  - **off:** career cards, Steam achievements and plans;
  - **not today's:** talk, the van and the map ("Not today. Today’s about the one line."). Settings leave out the save files and v0.956's career, and the week sheet shows only today's sky;
  - **the HUD:** the date and no money, and "The day" in place of the map;
  - **the dock:** a chip with the line and how it's going.
- **The day's sheet** opens with the page: the date, the line and crag, the climber against it, the goes so far, the rules, and "To the line".
  - When the day's over, it replaces the fall or send sheet: the send and its go, or "Not today" with why and the high point drawn.
  - Its rows: "Back to your own climber" (or "Start a climber of your own"), Settings, and after a send with time left, "Stay out".
- **The ways in:** Create ("Or skip all that…") and the map's corner.
- **The tests:**
  - `daily.test.ts` (4):
    - the same date gives the same day, with goldens pinned for two dates in the full game and one in the demo (criterion 1);
    - a boulder in the edition, climbable at first light, for a climber 1.25 under it;
    - the demo's crags in the demo;
    - a day played to its end by human-ish hands, with no call put to you and laps not counted.
  - `persist.test.ts`: the day's slot leaves every career key as it was, settings are shared, and the demo's day stays the demo's (criterion 2).
  - `day.test.ts` (2): the device's date, and how `?day` is read.
- **The smoke:** a new step, "offline day": `?day` boots from the worker's cache, in its own slot.
- **The e2e:** a new section, "The problem of the day":
  - a career's save beside it, and 19 Oct 2026's day opened (Hueco Pockets, V9, at Moonstone; a V7 climber);
  - to the line; a go come off on purpose, and the day going on; goes till it's over, and the slot's result;
  - the career's save the same to the byte; opened again, the same day; back to the career;
  - then 20 Oct, begun too tired for a second go: over on the fall.
  - The demo's e2e: its 19 Oct is The Pinch at Granite Gorge, under the demo's keys.
- **The download:** 497.0 KB of 510 (+2.5), with the budget raised by Evan's call.

**Status (19 Oct 2026): 45.2 built: the day's card.** No save change, 0.999.107.
- **The card** (`dayCardOf` in `ui/card.ts`): once the day's over, the day's sheet has "A card of it". It's the send card, drawn on the device at 1080 × 1920 from the line's own wall and topo, with:
  - **its name and grade,** and how it went: "Redpoint, go 3" (a flash is "Flash, go 1"), or on a day it didn't go, "High point 6 of 9, 3 goes", with you drawn at the move you got to and the line going on above;
  - **the crag and the date,** "Moonstone Boulders · 19 October 2026", and "The problem of the day" where a career's card has your name.
- **Saved or sent on** as any send card is (Phase 37): "Save the image" (`dirtbag-2026-10-19-hueco-pockets.png`), or "Send it on" through the device's share sheet where it has one. Its words go with it: "The problem of the day, 19 October 2026: Hueco Pockets, V9, at Moonstone Boulders. Redpoint, go 3." The game sends nothing.
- **The caption** now shrinks the grade and how it went to fit the card, for any card; a career's card that fit before is drawn as it was.
- **Tests** (`card.test.ts`, 2 new): a sent day's card, its words and its file, and none while the day's on; a day that didn't go, its high point and goes, drawn up there.
- **The e2e:** each day's card after its end. 19 Oct's is drawn at full size, its words checked, and saved as a file. 20 Oct's says its high point in one go.
- **The download:** 497.3 KB of 510 (+0.3).

**Phase 45 against its Done-when (19 Oct 2026):** both pass.
1. **The same date gives the same day on every device:** `daily.test.ts` pins two dates' days in the full game and one in the demo. A new boulder at a crag moves them on the build that adds it, and the test is where that shows.
2. **It never touches the career's save:** the slot test leaves every career key as it was, and the e2e plays two days with a career's save beside them and finds it the same to the byte.

**Closing Phase 45, the last of the ten, is Evan's call.** Carried:
- **[proposed]:** `DAILY.under` (the climber 1.25 grades under the line), and its uneven send rate by grade (V6–9 the hardest).
- **Days change with content:** a new boulder at a crag changes every date's day on the build that adds it.
- **No retry,** but no lock either: reopening resumes the day, while clearing the site's data or a private window starts it over. There's no leaderboard to protect.
- **The two editions** draw different days on the same date (the demo's from its own crags).
- **The card carries no link** to the day. The site's name is printed on it.

**Phase 45 closed by Evan's call (19 Oct 2026),** the last of the ten "Hands on" phases. Both criteria pass. Carried, as listed above: `DAILY.under` [proposed] and its uneven send rate by grade; days that move with new content; no lock on a retry; the editions' different days. The card stays without a link, by his call: it prints the site's name, and a link would often mislead, since the demo and a locked copy draw the date's day from the demo's crags. The CURRENT MILESTONE moves to Phase 20. The download is 497.3 KB of 510.

## Stage D — Get it in front of people

*Moved here by Evan's call (29 Sep 2026): the whole game gets built first, and the Steam build, the demo and the store page come after it. The phase numbers stay as they were, so older references still find them.*

### Phase 14 — Desktop and Steam build   ✅ Closed

*Waited until Evan asked for it (8 Oct 2026) while Phases 26–35 came first. Started by his call after Phase 35 (15 Oct 2026).*

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

**The survey (15 Oct 2026).** The scope above was written against v0.956; the rebuild has moved under it.
- **Input:** one window key handler (`ui/App.tsx`): Space/Enter to climb, use, strum; F/J or the arrows on the speed wall; the arrows walk a scene; M the map; Escape closes the talk, the sheet, the map. Every crux verb is one `press(bool)`. Pointer events throughout (the mouse already works). No gamepad, no focus movement beyond Tab (a sheet focuses its first button), no hotkeys for the HUD, no rebinding, no Back. Scene things and map pins are invisible labelled buttons over the canvas (`ui/Hots.tsx`), so nearly everything is already a button; the name on the first screen is the one thing that needs typing.
- **Layout:** the wide screen exists (360 wide in portrait, up to 1248 in landscape, sheets docked from 1080), but both manifests lock portrait. There's no free walking, so "WASD to move" is the arrows that walk a scene.
- **Glyphs:** no emoji left; the fonts are bundled (latin subset). ✓ ✕ ← and the card suits fall outside it and likely draw from a system font [INFERRED].
- **Saves:** `dirtbag.save` (and `.prev`, quarantined copies, settings, the plan) in localStorage, each module with its own `store()`; synchronous callers; no export or import of the current save.
- **The Record Book:** 51 entries, ids stable "for Steam" (`content/record.ts`), earned in `act()`; an heir's book starts empty, the old one kept in `family.books`.
- **Build flags:** only the version. No demo, no Act I-only build, no paid gating; content is imported statically everywhere. The demo is defined in Phase 5: Act I, Roadside and the Gorge, the Lot.
- **The browser's assumptions:** the service worker (skipped unless the manifest is there), share and vibrate (feature-detected), `<a download>`. No fullscreen, no quit.
- **Packaging:** no Electron, Tauri or Steamworks anywhere. Electron 44 and steamworks.js 0.4 are on the registry, and Electron's release downloads reach this container.
- **Frames:** one `requestAnimationFrame` loop (`App.tsx`), dt capped; nothing measures frame time.

**Evan's calls (15 Oct 2026), all as recommended:**
- **A controller moves focus:** the D-pad or stick moves to the nearest button that way (scene things, pins, sheet rows), A presses, B is back, A or a trigger the climb's hold. The keyboard's arrows get it too.
- **Saves:** on the desktop, a save file in the user-data folder (Steam Auto-Cloud syncs it), behind one storage seam; every build, the web's too, gets Export and Import save (the demo's carry-over needs it in Phase 15).
- **Steamworks behind a stub:** wired through steamworks.js against Valve's public test app (480), the Record Book's ids mapped to achievements; the real app ID drops in when Evan has one, and criterion 3's check in the Steam dev branch is his.
- **The demo:** a build flag here makes the Act I demo from the same code, with a content diff in CI (criterion 4). Whether paid content leaves this public repo stays the call before Phase 19.

**Slices:** 14.1 focus moves: keys and a controller; 14.2 saves: one seam, export and import; 14.3 the desktop build (Electron, the save file, window modes, quit, a smoke test); 14.4 Steamworks behind a stub (achievements, Cloud's file); 14.5 the demo flag and the content diff; 14.6 the Deck pass (its screen, the glyphs, a frame meter, rebinding) and the close. Criteria 2 (60 fps on a Deck) and 3 (achievements and Cloud in the Steam dev branch) need Evan's hardware and account; the slices build to them and hand him the check.

**Status (15 Oct 2026): 14.1 built: focus moves, by keys and a controller.** No save change, 0.999.76.
- **Focus moves** (`ui/spatial.ts`, `ui/nav.ts`, Evan's call): the arrows, the D-pad or the stick move focus to the nearest button that way, among what's on top: a sheet, a conversation, the first screen, or the screen (the HUD, the scene's things, the map's pins). A candidate must lie wholly past the middle of where focus is, so a tall thing standing beside you never counts as above you; each pixel off the line of travel counts double. Where nothing lies that way, the key does what it did (a long sheet scrolls). Left and Right still walk a scene with nothing open; mid-go, the hold is all there is.
- **A controller** (`ui/pad.ts`, `ui/input.ts`): read once a frame, since the browser sends no events for a gamepad's buttons; a held direction repeats after 0.4 s, then every 0.13 s; the stick's lean has a gap (on past half, off under 0.35) so it doesn't flicker. A presses, and with nothing focused uses what's nearest or opens the wall's beta sheet, as Space does; A or the right trigger holds on a go and strums; B is Escape; the bumpers or the D-pad are the speed wall's hands; Start the journal, Select the map, Y the plan. The focus ring shows while the controller is the one in use (a browser shows it only for keys).
- **Keys:** M, J and P are the map, the journal and the plan, never from a text field (M in a scene used to open the map mid-word naming a crew). The arrows move focus in a sheet or a conversation, where Left and Right used to walk the scene underneath.
- **The first screen** offers a name, for a player who can't type one: "Pick one for me", then "Another" (`NAME_IDEAS`, none of them anyone you'll meet in the valley or at a comp).
- **The e2e:** a day by controller alone on a Steam Deck's shape (1280 by 800): a name picked, the Technician, Hazel, the journal on Start and away on B, the map on Select, Roadside's pin and the drive, the Warm Boulder, a go held on A, the way down, home, the van and bed. A pointer or a key anywhere fails it. Its D-pad presses toward each thing as a player who can see it would, and tries the other way when it comes round, so everything it needs is reachable. Its first run found the crag's wall lines, which stand full height between the boulders: Left from The Dyno is the Roadside Warmup's line, and Left again the Warm Boulder.
- **Criterion 1 (a controller-only playthrough of Act I):** every control is a button (the scene's things and the map's pins as invisible ones), and what the canvas takes by a tap (walking to a spot, the wall) has the stick and A, so a controller reaches everything a tap does; the e2e plays a day of it, not all of Act I. Busking, horseshoes, cooking and the speed wall are mapped (A, the bumpers) but not played by the e2e's controller.
- **Not yet:** whether a browser lets a controller's press start the sound, as a tap or a key does, is unverified [INFERRED: probably not]; the desktop build (14.3) can allow it. Rebinding is 14.6.

**Status (16 Oct 2026): 14.2 built: saves, one seam, export and import.** No save change, 0.999.77.
- **One seam** (`game/storage.ts`, Evan's call): the save, the plan and the settings go through one `store()`, the browser's localStorage unless the game is handed another (`keepIn`) before it boots, which the desktop build (14.3) will do with a store backed by a file Steam Cloud syncs. v0.956's keys stay off it: they were only ever in a browser's localStorage, and `legacy.ts` reads them there.
- **Export** (`game/savefile.ts`): the save exactly as the game keeps it, as a file named for who and when (`dirtbag-robin-day-12.json`), from Settings' new "Your save".
- **Import:** from Settings, or from the first screen ("Already climbing?"). The file loads by the same rules as any save (migrated if it's old); one that won't (not JSON, not a Dirtbag save, from a newer build, over 4 MB) is turned away with why, and nothing changes. One that will says who it holds ("Robin, day 12, V3") and whom it takes the place of, and waits for a yes. Then the save goes in (`persist.replace`): the climber it replaces is kept aside (`dirtbag.save.replaced`, which nothing reads yet), the earlier day's fallback is cleared so a broken save can never fall back to somebody else, and the page starts again from the file, as it would from any save. Once it's in, nothing in the page writes over it.
- **Tests:** `savefile.test.ts` (the name; a save read back, an old one migrated; what isn't a save turned away, with why); `persist.test.ts` (a save from a file in place, the replaced one kept, no fallback to it; the save and the plan kept wherever the game is told, nothing in the browser).
- **The e2e:** Robin out as a file from Settings (its name and contents checked), the game started over, a notes file turned away from the first screen, then Robin's file: who it holds, and Robin back.
- **An e2e race, fixed:** four sections (Nationals' final, the haul bag and the night after El Cap, the heir's night at the fire) changed the save by hand and then reloaded; a save the old page made on its way out could land on top, and once did: the final came back as the qualifier's morning. The change now goes in as the page reloads, before the game boots (`reloadWith`).
- **Not yet:** a controller can't work a file picker (the desktop build's dialogs are 14.3's); the replaced climber can only be had back by hand.

**Status (16 Oct 2026): 14.3 built: the desktop build.** No save change, 0.999.78.
- **`desktop/`** (Evan's call: Electron): its own package and lockfile, like `twa/`, with Electron 44.5.1 and `@electron/packager` 20.3.0 pinned (the newest 44 more than two weeks old). The game is the site's build, served from `app://` out of `app/dist` (or a copy packed beside the app): no network, and no service worker (Chromium won't have one on that scheme). It opens at 1280 by 800, a Steam Deck's screen, or wherever it was last, full-screen if it was; F11 toggles it. One copy at a time; no new windows, no navigating away. Chromium's autoplay switch is set so sound can start without a tap, since a controller's press may not count as one (set, not yet heard working).
- **The save file** (`desktop/store.js`, Evan's call): the game's keys in `dirtbag.json` in the user-data folder (on Windows `%APPDATA%/Dirtbag`), for Steam Cloud to sync. Every write goes to a temporary file and is renamed over the old one, so a crash mid-write never leaves half a save; a write the disk refuses changes nothing and the game says it couldn't save; a file that won't read is moved aside, never written over. The page reaches it through a sandboxed preload's five calls (`window.dirtbagDesktop`), and only the game's own page may use them; the game hands it to 14.2's seam before it boots (`game/desktop.ts`).
- **Settings, on the desktop:** the window, full screen or not, and Quit ("Your game is saved as you play").
- **Checks:** `desktop/store.test.mjs` (kept and read back; an unreadable file moved aside; a refused write changes nothing); `desktop/smoke.mjs` under a virtual display: it opens on the game, a new climber lands in the file and nowhere in the browser's storage, no worker, a relaunch starts where it left off, Quit from Settings closes it and the window's kept, and nothing is asked of anywhere but `app://`. It passes on the repo's Electron and on a packed Linux build. CI gets a third job, `desktop`, that runs both (with Ubuntu 24.04's hold on the sandbox's user namespaces lifted, so it runs sandboxed). `npm run check` adds that the desktop's runtime files name no address, and the version is stamped into `desktop/` too.
- **Packing:** `npm run pack --prefix desktop` (the game copied in, `@electron/packager`'s folder, which is what a Steam depot takes); **Actions → Build desktop** packs Linux, Windows and macOS (Apple silicon) as artifacts. The Windows and Mac jobs haven't run yet: their first run is the first test of them.
- **Not yet:** the builds are unsigned (SmartScreen and Gatekeeper warn until Evan's certificates sign them, and the Mac one is notarized); Electron's own icon until there's art for one; the Steamworks partner site's Auto-Cloud path is Evan's to set (14.4 writes it down); no Intel Mac build.

**Status (16 Oct 2026): 14.4 built: Steamworks behind a stub.** No save change, 0.999.79.
- **Steamworks** (`desktop/steam.js`, Evan's call: behind a stub): `steamworks.js` 0.4.0 (MIT, the binding the scope named; two years old, but N-API, and it loads in Electron 44), pinned as the desktop's one runtime dependency, its native module and Steam's library packed outside the archive. With Steam running and an app ID (`desktop/steam.json`: 480, Valve's test app, till Dirtbag has its own) it starts; otherwise every call does nothing. Steam's overlay switches on only when Steam started the game (`SteamAppId`), since its switches put the GPU in-process.
- **Achievements** (`app/src/game/achievements.ts`): one per Record Book entry, named for its stable id in capitals (`FIRSTSEND`), through the bridge's sixth call (`achieve`; names checked against Steam's pattern, the game's own page only). Each unlocks as it's written into the book, and at every launch everything the save's family has ever earned (an heir's forebears included), so what came offline or on the web before a carry-over comes through.
- **For the Steamworks site** (`desktop/STEAM.md`): the app ID; the 51 achievements, listed in `desktop/steam/achievements.json` from the book (a test fails if the list falls behind it); the icons they need; the ones worth hiding (`HOLLOW`); Steam Cloud's Auto-Cloud roots for `dirtbag.json` on each platform; the depots and launch options; the overlay.
- **Checks:** `achievements.test.ts` (one name each, in Steam's pattern; a family's books counted; the list in step with the book); the desktop smoke adds the stub (Steam off: no unlocks, a bad name turned away); a packed Linux build passes the smoke, and with the app ID set and no Steam running unlocks nothing and stays up. `npm run check` reads `steam.js` for addresses too.
- **Not yet:** criterion 3 (achievements and Cloud in a Steam dev branch) needs the real app ID, the achievements entered, and their icons: Evan's. Nothing here has run with Steam itself.

**The demo, Evan's calls (16 Oct 2026), all as recommended:**
- **The strip:** places and story. The demo build physically lacks the later crags (their lines, walls, rock, scenes), Acts II to V, the endings and The Line, expeditions and the Hollow, and CI greps the demo build for them. Comps past League night, job ranks and the like stay in, shut by the flag.
- **The end:** after Dex's race. Act I as built, then the race week, with the Gorge open at V4 as it is now, so both of Phase 5's crags are played.
- **At the end:** a last card in the game's voice, Export your save (it loads in the full game: the same save), and the demo stops there, with Start over.
- 14.5 goes in two: **14.5a** the demo's build and rules, **14.5b** the strip and its content diff.

**Status (16 Oct 2026): 14.5a built: the demo's build and its rules.** No save change, 0.999.80.
- **The flag** (`sim/edition.ts`): `npm run build:demo` (`--mode demo`) sets `__DEMO__` and builds into `dist-demo/`; the full build, the tests and the harness play the whole game. Tests play the demo's rules with `asDemo(true)`.
- **Its places** (`content/demo.ts`): the Lot, the town (the gym, the café, the diner, the warehouse, the shops, the clinic, the lake, the market, the garage), Roadside and the Gorge. `known()` knows nothing else, so the map pins only those and the sim won't drive anywhere else.
- **Its story:** Act I, as built. After its card there's no next goal (the pill goes, and the journal's story row says Act I's done), and the race week runs as it always does: Dex is met on your first V4 send, his race starts that night, and the Gorge is open.
- **Its end** (`demoOver`): the morning after the race is decided, by Dex's first ascent overnight or by your send, once Act I's done. A day plays out either way, so the end never lands on top of the send that won it. A climber who reaches V4 without sending one hasn't met Dex yet, and plays on at Roadside and the Gorge till the send brings the race. Then the last card ("That’s the season"): the season, how the race went, the full game picking up from this morning; Export your save and Start over; it doesn't close, and the sim takes no more actions.
- **Checks:** `demo.test.ts` (its places, and no drive elsewhere; Act I and no story after; the end the morning after, Dex's way or yours, and not before Act I's done; nothing after; the full game untouched); `e2e/demo.mjs` on the demo build (the first screen says it's the demo; the map has its twelve places and none of the full game's; a climber the morning after Dex took the line gets the last card, which won't close, exports a save the full game reads, and starts over). CI's app job builds the demo and plays both ends.
- **Not yet (14.5b):** the demo build still carries everything, only shut: the strip and its content diff (criterion 4) are next. A full-game save opened in the demo is treated as a demo save (past Act I and the race, it's on its last card); once the strip lands, one that names a stripped place won't load, and is turned away.

**Status (16 Oct 2026): 14.5b built: the strip and the content diff.** No save change, 0.999.81.
- **The strip** (Evan's call: places and story): what lies past Roadside and the Gorge is in `*.full.ts` modules, each imported by its plain twin, and the demo's build swaps each for a `*.demo.ts` twin with the same exports and nothing in them (`app/build/demo.ts`, a Vite resolver in demo mode only; `twins.test.ts` keeps every pair's exports in step). Out of the demo: the later crags' lines and the Big Stone's walls (`routes.full.ts`); their words, names and cards (`places.full.ts`; the shells keep their rules under a blank name, for the people and the weather that still reckon with them); their rock, and the granite moves only the Big Stone's and Wind River's lines climb (`rock.full.ts`); Acts II to V, what each pays and The Line's scene (`story.full.ts`); the expeditions (`expeditions.full.ts`); the Hollow's quest, its walk-in, its stance at the fire and its Record Book entry (`hollow.full.ts`); and in the view, the later crags' layouts and sign lines (`layout.full.ts`), their scenes, palettes and rock (`scenes.full.ts`), their close-up walls (`wall.full.ts`) and the expeditions' scenes (`expeds.full.ts`). The makers they're built with (`libraryBoulder`, `first`, `fill`) are handed in, so nothing in a `.full` module runs before its twin.
- **Shut where the shells could show:** in the demo nobody is anywhere it doesn't go (Rico's Cave and Moonstone days, Tam's Mesa mornings: away, so their texts say so); no guide, invite or shoot for a crag it hasn't got; no hanging it up ("Hanging it up comes later, in the full game"), since the endings are the full game's; Act I's card is Act I's, never The Line's.
- **A full game's save** (14.5a's promise): the demo turns away a save from somewhere, with a line, a wall or a trip it hasn't got ("That file won’t load: it’s from the full game, past where the demo goes"), at Import and at boot, before the save's checked, rather than play half of it. Its own saves load as they did, and go to the full game as they did.
- **The content diff (criterion 4):** `npm run diff:demo` (`harness/demo.diff.ts`) reads the full game's own content, the later lines, walls, places and rock, Acts II to V and The Line, the expeditions, the Hollow, and every string the `.full` modules spell out (the painters' colours among them), and looks for each in `dist-demo/`: 3,066 strings, none there. A string the demo's own source also uses (a gym problem called The Prow, a button called Keep climbing) isn't counted; a short one counts only as a string of its own. Run on the full build, it finds 3,050 of them. `npm run play:demo` has bots play the demo's rules and content to its end (four seeds, over on days 16 to 23, nothing refused). CI's app job runs both, around the demo build.
- **Tests:** `demo.test.ts` adds the people (eight weeks of everyone's days, all in the demo's places) and the full game's save turned away; the full game's 1,120 tests and the e2e are unchanged. The full build is 463.4 KB of 470 (0.8 KB of wrappers).
- **Not yet:** lines in pools the demo keeps still name the later crags in passing (a crowd line about Moonstone, Dex's FA names, the crew-name suggestions), and their names are in the demo as words, though none is a place you can see or go. Where the demo will live is Phase 15's: it keeps the same `dirtbag.` keys as the full game, so a demo and the full game sharing an origin (or a desktop user-data folder) would meet one save, and the demo would move the full game's aside as one it can't play. Give it its own origin and its own Steam app (its own folder), or its own keys, before it ships.

**14.6, planned (16 Oct 2026, from the survey):** in two. **14.6a**: the marks the fonts lack, drawn; the minigames whole by controller (cooking's skip, focus after a run, the scene quiet while busking), with the pad's button shown beside a minigame's controls; a frame meter in Settings; the controller day plays the stove and the speed wall. **14.6b**: rebinding (the pad's buttons and the keys, in Settings); Steam's floating keyboard for the text fields on a Deck (`showFloatingGamepadTextInput`, in steamworks.js 0.4.0); the Done-when check and the close (Evan's call).

**Status (16 Oct 2026): 14.6a built: marks, minigames by controller, a frame meter.** No save change, 0.999.82.
- **The marks the fonts lack** (`ui/Glyph.tsx`, `ui/marks.ts`): the bundled hands (Patrick Hand and its small caps) have no ✓ ✕ ○ ← or card suits, so a system without a font for them showed another font's, or a box (a Deck's fonts aren't a phone's). They're drawn now, in the text's colour and size, and read out as the character: the close buttons, the plan's ✕, the checklists, the calling's and the path's rungs, the wall's next pitch, and every card a hand of blackjack or hold'em names, in sheets, toasts and the journal (`glyphs()`). `glyphs.test.ts` reads the fonts' own character maps and fails on any character the game's code spells out that neither the fonts nor the drawn marks cover (it found a combining-mark range written out literally in the save file's name, now escaped). The e2e fails on any of the marks left as text, on any screen it passes.
- **Minigames by controller:** B (or Escape) before the first stir is "Just eat it", which no controller could reach; when busking, horseshoes, the stove or the speed wall ends, focus waits on the way out, so A takes it (it was nowhere, and A could land on the scene behind); the scene's things stay quiet while busking, as they do on the speed wall. While the pad is the one in use, a minigame's controls show their button beside them: A to strum, stir, throw or hold; B to skip the stove; LB and RB on the speed wall's hands (Xbox's names, which Steam Input hands a game by default).
- **The frame meter** (Settings, off by default; `ui/meter.ts`): over the last second, frames a second, the slowest frame and how many ran past half again a 60 Hz frame, in the corner, written straight into its line twice a second so it costs nothing to look at. It's for Evan's check of criterion 2 on a Deck.
- **The e2e's controller day** goes on: that evening the stove, five stirs on A and the dish eaten on A; a second dish skipped on B; the next morning the speed wall at Send City, walked to on the stick, raced on the bumpers, done on A; then the frame meter switched on from Settings and read (60 fps headless). Its helper now tells apart buttons that say the same (Settings has an On for each thing it sets). The download is 464.8 KB of 470 (1.4 KB for the marks, the meter and the hints).
- **Not yet (14.6b):** rebinding; Steam's on-screen keyboard; the Done-when check. Whether Valve's Deck review takes Xbox's button names or wants a Deck's (L1 and R1 for the bumpers) is unverified; 14.6b can ask Steam whether it's running on a Deck.

**Status (16 Oct 2026): 14.6b built: rebinding, Steam's keyboard, and the Done-when check.** No save change, 0.999.83.
- **Rebinding** (Settings → Controller and Keys; `game/binds.ts`): each role (press, hold and strum; back; the plan; the journal; the map; the speed wall's two hands) takes the button or key its row is given: the row waits ("Press a button", "Press a key"), the next press is its, and whichever role had that button or key takes the old one, so nothing is ever left unreachable. The D-pad, the stick and the arrows always move (and stop the waiting), Enter always presses, the right trigger is always a second hold, and the guide button is Steam's. J stays both the journal and the speed wall's right hand, since the wall's hands are only read on the wall. Kept in Settings (a kept set that puts two roles on one button falls back to the defaults); "Put the controls back as they were". The pad's hints beside a minigame's controls name whatever button the role has.
- **A button given a role while it's held** isn't a press of that role: a role goes down only when its button does (the e2e found Back, just moved to X and still held, putting Settings down on the next frame).
- **On the desktop:** the bridge asks Steam whether it's running on a Deck, and there the buttons are named as the Deck prints them (L1, R1, L2, R2, L3, R3, View, Menu); a text field reached by the pad shows Steam's floating keyboard under it (`showFloatingGamepadTextInput`, steamworks.js 0.4.0; Steam shows it only where its overlay is up, which a copy Steam started has). Both are a quiet no without Steam, and the desktop smoke checks that.
- **The e2e's controller day** goes on: Back moved to X in Settings by controller (the row waits, X given), B then does nothing, X puts Settings down (and it's kept), then the controls put back and B is Back again.
- **Size:** 466.3 KB. The budget goes to 490 KB (Evan's call, 16 Oct 2026), for Phase 15's demo.
- **Tests:** `binds.test.ts` (a role given a button, the old holder swapped; the D-pad, the right trigger and the guide refused; keys swapped within the roles read together, J both; kept and broken settings; the names); `pad.test.ts` (a role read from its button; a button given a role while held isn't pressed).

**Done when, checked (16 Oct 2026):**
1. **A controller-only playthrough of Act I is possible: passes, by construction and in part by the e2e.** Every control is a button the pad's focus reaches (the scene's things and the map's pins as invisible ones); what a tap does on the canvas has the stick and A; nothing outside the climb, busking and speed-wall panels takes a pointer, and those three have the pad's buttons; text fields have a name on offer, suggestions, or Steam's keyboard. The e2e plays by controller alone a day (a name, Hazel, the journal, the map, a drive, a go held on A, bed), the stove both ways, the speed wall, Settings' meter and a rebinding; it doesn't play all of Act I (its shifts and its six goals) by controller.
2. **60 fps on a Deck: Evan's,** with the frame meter (Settings) to read it. Headless Chromium here reads 60 fps, slowest 17 ms, none slow, which says nothing about a Deck's GPU.
3. **Achievements and Cloud in the Steam dev branch: Evan's,** once Dirtbag has an app ID, the achievements are entered with their icons, and Auto-Cloud is set (`desktop/STEAM.md`).
4. **The demo build contains no full-game content, checked by a content diff in CI: passes** (14.5b: 3,066 strings, none in the demo; CI's app job).

Phase 14's two criteria that can pass here pass; the other two are Evan's hardware and account. Closing the phase is his call.

**Status (16 Oct 2026): 14.5c built: the demo's own keys, and carrying on from it.** Evan's call (16 Oct 2026, as recommended): separate keys as the guarantee, separate homes as the practice. No save change, 0.999.84.
- **The demo's keys** (`game/storage.ts`, `ours()`): the demo keeps its save, its fallback, its quarantine, its plan and its settings under `dirtbag.demo.`; the full game keeps `dirtbag.`. They can share a site or a desktop folder and never meet: the demo can't set a full game's climber aside as a save it can't play (14.5b's flag), and it never sees one but by Import, which turns it away. v0.956's `dirtbag-` keys stay apart from both.
- **Carrying on from the demo:** where the full game finds a demo climber beside it (the two shared a store), its first screen offers "Carry on from the demo" (who, from the save, and "the full game picks up from that morning"); the demo's copy stays where it is. Export and Import stay the way across from anywhere else.
- **Separate homes, as practice** (for Phase 15): the web demo at its own address (a subdomain is a separate origin; a path on dirtbag.rcjlabs.com isn't), and a desktop demo packed under its own name (its own user-data folder), so the carry-over above is a bonus where they meet, not the plan.
- **Checks:** `persist.test.ts` (the demo boots past a full game's climber without touching it, writes only `dirtbag.demo.` keys, and finds no demo climber of its own; the full game finds its climber and the demo's beside it; nothing that isn't a demo climber is offered); the demo e2e checks the demo's keys are all `dirtbag.demo.`; the full e2e plants a demo climber beside the game and carries on with it from the first screen.

**Phase 14 closed by Evan's call (16 Oct 2026).** Criteria 1 and 4 pass. Criteria 2 and 3 are carried to Evan:
- **2, 60 fps on a Deck:** run it on the hardware with Settings → Frame meter on.
- **3, achievements and Cloud in the Steam dev branch:** needs a real app ID in `desktop/steam.json` (480, Valve's test app, until then), the 51 achievements entered with their icons, and Auto-Cloud set (`desktop/STEAM.md`).

Also carried:
- Nothing has run on a real Deck or with Steam itself: not the Deck's button names, Steam's floating keyboard, or the achievement calls.
- Whether Valve's Deck review takes Xbox button names off a Deck is unverified; on a Deck the game names the Deck's own buttons.
- Controller-only Act I is shown by construction plus the e2e's controller day, not by a full Act I played on a pad.
- The demo's kept pools still name the later crags in passing.

The CURRENT MILESTONE moves to Phase 15, the demo, the store page and Next Fest. The download is 466.4 KB of 490.

---

### Phase 15 — The demo, the store page and Next Fest   ✅ Closed

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

**The survey (16 Oct 2026).** Most of this phase isn't code:
- **Not code:** the Steam app and its demo app (Steam Direct, $100), the Coming Soon page, the wishlists, the press outreach, and the Next Fest registration are Evan's.
- **No crash reporting:** neither store's dashboard sees a JavaScript error inside a TWA or Electron [inferred, not verified], and the game sends nothing anywhere. It also has no error screen: a render crash leaves a blank page.
- **Next Fest dates disagree:** the market audit lists 22 Feb – 1 Mar 2027 (register by 10 Jan); this phase said June 2027 as a stretch.
- **The demo has nothing to funnel to yet:** the full game is free on the web and Play, so a demo beside it funnels nothing until Phase 19 makes the full game paid.
- **No translation layer:** the game has none.
- **What's already built:** the demo's build and its rules (Act I, the last card, export and import, the carry-over) came in 14.5.

**Evan's calls (16 Oct 2026), all as recommended:**
- **Next Fest:** June 2027. The Coming Soon page goes up as soon as there's art and copy for it.
- **The demo on the web and Play waits for Phase 19's split.** Until then the free full game is the funnel there. The Steam demo comes now. Criterion 1's web and Play parts move to Phase 19.
- **Crashes:** an error screen ("your save is safe", reload, export, and the error to copy or send from the player's own mail), with nothing sent by the game. Criterion 4 becomes: no crash in the bots' and the e2e's runs, demo included.
- **Localization:** the store page only, later, by paid native translators near Next Fest. The game stays English.

**Slices:**
- **15.1** the store page kit: Steam's capsules and library art drawn by the game's own painters, screenshots from the build for Steam and Play, and the copy for both;
- **15.2** the error screen and the opt-in report;
- **15.3** the Steam demo: its own pack, name, folder and app ID, and its last card pointing to the full game's page;
- **15.4** the press kit, a page that stages the trailer's shots, and the close.

**Done when, as Evan's calls leave it:**
1. The demo is live on Steam. Web and Play move to Phase 19.
2. At least 7,000 wishlists before Next Fest (Evan's).
3. The press kit is sent to ≥30 outlets and creators (Evan's).
4. No crash in the bots' and the e2e's runs of the demo and the full game, and a crash shows the error screen, not a blank page.

**Status (16 Oct 2026): 15.1 built: the store page kit.** No change to the game, 0.999.84.
- **Steam's art** (`app/src/dev/store.ts`, `npm run dev`, then `/store.html`): every capsule, the library's art, the page background and the community icon, at Steamworks' sizes, drawn by the game's own painters.
  - **The highball:** the climber big near the top of Roadside's highball at golden hour, the title in the signs' poster face beside it. For the capsules.
  - **The Lot at night:** the vans, the lights, you and Hazel at the fire, Scout. For the hero and the background.
  - The wide capsules come both ways for Evan to pick; the highball is recommended (it says climbing at a list's size).
- **`npm run store:art`** writes them, and the screenshots, to `app/store-art/` (not committed). The screenshots are played on the build:
  - the first morning, the map, Roadside's card, the Warm Boulder's beta, a go on it and its send, and the send card;
  - then the v75 fixture's career at night, its journal and its Record Book;
  - at 1920 × 1080 for Steam and 1080 × 1920 for Play, toasts waited out.
- **The copy** (`docs/STORE.md`): Steam's short description and About This Game, written new; Play's listing brought up from 0.960 (it said V5 and Moonstone at V6); which file goes in which slot.
  - `npm run check` holds Steam's short description to 300 characters, beside Play's limits.
  - `storecopy.test.ts` holds every number and name in the copy to the content: the $41 start, the nine crags by name (the Hollow kept off), five acts ending on The Line, V18, the 51 entries, the comps, the expeditions.
- **Unverified:** the sizes and the 300-character limit are Steamworks' as of 2026 from memory; check its page before uploading. Valve's rules for what a capsule may carry (the title, no other text) were followed as remembered.

**Status (16 Oct 2026): 15.2 built: the error screen.** No save change, 0.999.85.
- **A crash says so** (`ui/crash.ts`), where a render crash left a blank page. It's plain DOM over everything, outside React, since React may be what broke. The screen:
  - says something broke, and that the save is as it was after the last move (it's written after every move, never mid-way);
  - offers a reload, and the save as a file (`persist.rawSave`: the save as kept, not loaded, in case the loading is what broke);
  - shows what went wrong, all of it (the build, demo or not, web or desktop, the browser, the error and its stack), with nothing from the save, to copy.
- **Two kinds of crash** (`main.tsx`):
  - A render that throws has torn the page down: React's `onUncaughtError`, and only a reload brings it back.
  - An error thrown outside React (the frame loop, a handler) also offers "Carry on".
  - Not crashes: the browser's resize-observer notice, another site's script, and a promise left to fail (the game goes on, as it did).
- **Emailing it** waits on an address: `REPORT_TO` in `ui/crash.ts` is empty, so the mail button isn't shown. It's web-only until the desktop's bridge can hand a `mailto:` to the system.
- **The privacy page** says what a report holds, and that the game sends nothing.
- **Checks:** `crash.test.ts` (what a report says, what isn't a crash); the e2e breaks the game on purpose (the screen, the save as a file, the report without the climber's name, carrying on, the game answering after). React's path was checked once by hand, by a component made to throw; it isn't in the e2e (nothing in the game can be made to throw on purpose).

**Status (16 Oct 2026): 15.3 built: the Steam demo.** No save change, 0.999.86.
- **One desktop code, two editions** (`desktop/edition.js`). `npm run pack:demo` packs `app/dist-demo` with `edition.json` beside `main.js`; a dev run or a test is told (`DIRTBAG_EDITION`). The demo:
  - is "Dirtbag Demo": its folder, its executable and its window's title (the page's own title no longer renames the window);
  - keeps its own user-data folder beside the full game's, which stays where it was;
  - starts Steam as `demoAppId` (`steam.json`, 480 until it has its own).
- **The last card's way to the full game:** on the desktop, "The full game on Steam" opens its store page in Steam's overlay (`overlay.activateToStore`, steamworks.js 0.4.0). Without Steam, a toast says Steam isn't running. A browser's demo doesn't offer it.
- **The error screen's mail** goes through the bridge on the desktop (`mail`: a `mailto:` link only, handed to the system), so once `REPORT_TO` is set the desktop can send it too.
- **The game's icon** on the executables and the Linux window (`desktop/icons.mjs`, drawn at pack time by the site's icon painter): an `.ico`, an `.icns` and a PNG, in place of Electron's.
- **A dev run serves the repo's build of its edition,** never a copy a pack left behind; the pack tidies its copy and edition away.
- **CI and packing:** CI's desktop job builds the demo and plays its first minute in the desktop build, through to its last card; **Build desktop** packs both editions.
- **Docs:** `desktop/STEAM.md` covers the demo's app, depots and Auto-Cloud (`Dirtbag Demo`), and the icon.
- **Checks:** `edition.test.mjs`; `npm run smoke:demo` (the title, the first screen, its keys in its file, the bridge's store page and mail saying no when they should, the last card and its Steam row); a packed demo on Linux smoked the same (its default user-data folder `Dirtbag Demo`); the demo e2e checks a browser offers no Steam page.
- **Unverified:** the store page has never run with Steam; where the overlay is off, Steam may show the page in its client or not at all.

**Status (16 Oct 2026): 15.4 built: the press kit, the trailer's beats, and the Done-when check.** No change to the game, 0.999.86.
- **The press kit** (`docs/PRESSKIT.md`): a fact sheet, made in code (the art, the sound, the music; the open typefaces), and what's in the kit. `npm run store:art` assembles it with Steam's About This Game from `docs/STORE.md`, the logo and icon, the capsules both ways, and the shots for Steam and a phone, into `app/store-art/dirtbag-presskit/` and a zip (`scripts/zip.mjs`: no dependencies, the same files make the same zip). The bracketed lines are Evan's: the dates, the store link, a press address, a line about him. `storecopy.test.ts` holds the kit's typefaces to the bundle and its "no recordings" to the licence ledger.
- **The trailer's beats** (`/trailer.html` under `npm run dev`, `src/dev/beats.ts`): six saves, a click each, from the v75 career put where the beat is on a dry, open day: the Lot in the morning, a shift's start, Roadside in the afternoon, the highball fresh (its send and card), Moonstone's hardest problem, the fire at night. The save that was there is kept and put back. `beats.test.ts` holds each to the save's rules; each was loaded in the game at 1920 × 1080.
- **The shot list** (`docs/STORE.md`, The trailer): the loop's order, the climbing as the hero, the opening and the close, the music's rule. Play's What's new brought to 0.999.86.

**Done when, checked (16 Oct 2026), as Evan's calls left them:**
1. **The demo is live on Steam: ready, Evan's to put up.** The demo packs as its own app (15.3); it needs the Steam app, the demo app, their IDs in `steam.json`, the depots and Auto-Cloud. Web and Play are Phase 19's.
2. **7,000 wishlists before Next Fest: Evan's.** The Coming Soon page has its art, screenshots and copy (15.1).
3. **The press kit sent to ≥30 outlets and creators: Evan's.** The kit is ready (15.4), its bracketed lines his.
4. **No crash in the bots' and the e2e's runs, and a crash shows the error screen: passes.** The full harness (16 careers to day 224, and 16 to their endings by day 480; 10 of 10 tests) had no refusal and no stuck night; `play:demo` plays the demo to its end; the e2e and `e2e:demo` fail on any page error and passed; the error screen (15.2) shows on a crash, in the e2e on purpose.

Phase 15's code is done; criteria 1 to 3 are Evan's accounts and outreach, and run to Next Fest (June 2027). Closing the phase is his call.

**Phase 15 closed by Evan's call (16 Oct 2026),** its code done. Criterion 4 passes. Carried to Evan, running to Next Fest (June 2027):
- **1:** the Steam app and the demo app, their IDs in `desktop/steam.json`, the depots and Auto-Cloud, and the demo up;
- **2:** the Coming Soon page and 7,000 wishlists;
- **3:** the press kit's bracketed lines, and the kit sent to 30 or more outlets and creators.

Also carried:
- the address crash reports go to (`REPORT_TO`, empty);
- the wide capsules' pick (the highball or the Lot);
- Steamworks' asset sizes and its short description's limit, checked before uploading;
- the store page in Steam's overlay, never yet run with Steam.

The CURRENT MILESTONE moves to Phase 19, monetization, store readiness and beta.

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

**The survey (16 Oct 2026):**
- **The web and Play are the full game, free,** and the Play app is a TWA over the public site: a paywall there is in every browser's reach.
- **The demo's build exists** (14.5): stripped of the full game's content, with keys of its own. Its rules are a switch the full game can play under too (`asDemo`, the tests' way since 14.5).
- **Moving Android to Capacitor loses saves:** its storage isn't the site's, so every Play player's climber stays behind in Chrome unless they export it first [inferred from how WebView storage is scoped, not tried].
- **Play Billing with no server** checks a purchase on the phone only (Digital Goods' `listPurchases`); anyone who can edit the app's storage can unlock it.
- **The terms say "provided free"; the privacy page leaves out hosting.** Crash reporting came in 15.2 as the error screen.
- **The public repo** (Phase 14's question): an honor gate ships the full game's content to every browser anyway, so the source being public adds nothing to what's already reachable. Nothing moves out of the repo unless Evan says.

**Evan's calls (16 Oct 2026), all as recommended:**
- **The web:** at launch the site plays the first season till the full game's unlocked; a climber from before the gate keeps the full game. An honor gate.
- **Android:** the TWA stays, with the Digital Goods API for a one-time unlock through Play Billing. Saves stay where they are.
- **iOS:** after launch (Phase 20).
- **Prices,** as the market audit set them: Steam $9.99 with a 10–20% launch discount; the Android unlock $4.99; itch.io pay-what-you-want from $9.99.

**Slices:**
- **19.1** the gate, off until launch: the full game's build plays the demo's rules till it's unlocked, and a climber from before keeps the full game;
- **19.2** Play's unlock in the Android app (Digital Goods and Payment Request, restore, acknowledge; Bubblewrap's Play Billing), and the locked last card's ways to the full game;
- **19.3** the paperwork: privacy and terms for a paid game, the IARC and data-safety answers, Play's listing for a free first season and an unlock;
- **19.4** the beta kit (the report with the seed and the last actions, `docs/BETA.md` with its severity gates) and the close.

**Done when, as Evan's calls leave it:**
1. A purchase unlocks the full game on each store, and a restore works: Steam's is the full edition; Play's is the unlock, restored from Play; itch.io's is the DRM-free build. iOS moves to Phase 20.
2. Without an unlock, the full game's gated build never goes past the first season, and the demo's own build holds none of the full game's content. On the web it's an honor gate, by Evan's call.
3. Legal text is updated.
4. Beta round 2 has no open critical or high bugs.
5. No crash in the bots' and the e2e's runs, and a crash shows the error screen (as Phase 15's criterion 4: no dashboard sees one).

**Status (16 Oct 2026): 19.1 built: the gate, off until launch.** No save change, 0.999.87.
- **The gate** (`app/src/game/unlock.ts`) settles at start-up, before the game boots, whether this is the full game or its demo's rules till it's unlocked (`asDemo`). It's a build switch, `__GATE__`: `DIRTBAG_GATE=1` turns it on (`deploy.yml`, `'0'` until launch, Evan's to flip); `npm run build:gated` builds it on into `app/dist-gated` for its e2e.
- **Off (now):** everyone plays the full game, and a climber here (a save, or the morning before it, with a name; or a v0.956 career) is marked as here before the gate (`dirtbag.unlock`).
- **On (at launch):** its first start marks anyone with a climber who wasn't, then remembers it has (`dirtbag.gate`). A climber started after that plays the first season to its last card, and isn't marked even by a build from before the flip, put back for a rollback. The unlock goes down before the mark, so a start cut short errs toward the player.
- **Always open:** the desktop's full edition (bought on Steam). The demo's build stays the demo.
- **One climber, one set of keys:** the locked full game keeps the full game's keys (`dirtbag.`); only the demo's build has its own. So an unlock carries the same climber on from the same morning. The key switch follows the demo's build (`DEMO_BUILD`), the rules the runtime switch (`DEMO`).
- **The guidebooks' crags** are asked each time (`guideCrags()`), since the full game only knows at start-up which rules it plays.
- **Checks:** `unlock.test.ts` (off and on, before and after, a v0.956 career, a store that won't keep or read, junk unlocks, the desktop, the locked game's keys); `npm run e2e:gate` on the gated build: a climber from before keeps the whole valley; one after gets the first season's places and its last card; unlocked, the same climber carries on from the same day with the whole valley. In CI.
- **Not yet:** the locked last card still says to export the save for the full game; its ways to unlock (Play's, the store links) are 19.2's. A full game's save brought in by file to a locked browser is turned away, as the demo turns it away.

**Found building 19.2 (16 Oct 2026), and Evan's call.** Version 2 of the Digital Goods API has no `acknowledge()`: Chrome's guide leaves acknowledging to a server, and Play refunds a purchase nobody acknowledges within three days [Chrome's and ChromeOS's docs, read through search]. A consumed purchase acknowledges itself, but then drops out of `listPurchases()`, so it can't be restored. **Evan's call: the app acknowledges on the phone**, from native code hooked into the project Bubblewrap generates. No server, nothing leaves the site, and Play's list restores the unlock on any phone.

**Status (16 Oct 2026): 19.2 built: Play's unlock in the Android app.** No save change, 0.999.88.
- **The page** (`app/src/game/play.ts`): Play through the Digital Goods API (`getDigitalGoodsService('https://play.google.com/billing')`) and Payment Request (`sku: full_game`, the one-time product Evan makes in the Play Console).
  - **Its price** is Play's, in the player's currency (`getDetails`, `Intl.NumberFormat`).
  - **A purchase counts** once Play lists it (`listPurchases`), never on the payment sheet's word. Then it's kept as the gate's `play` unlock and the page starts again from the same save, unlocked (`Game.reopen`).
  - **At start-up,** while locked, a purchase Play already lists (a new phone, Chrome's data cleared) opens the game at once. On the last card, "You've bought it already" asks again.
- **The app** (`twa/PlayAcknowledger.java`, hooked in by `twa/acknowledge.mjs` after `bubblewrap update` in `build-twa.yml`): when the app starts (`Application`), and on every call the page makes through the Digital Goods API (`DelegationService.onExtraCommand`), it acknowledges each paid purchase that isn't yet. It uses Play Billing 8.3.0, pinned beside Bubblewrap's `androidbrowserhelper:billing:1.2.0`. `twa-manifest.json` turns on Bubblewrap's Play Billing, and with it notifications: Bubblewrap exports the delegation service, which Chrome reaches the app through (the Digital Goods API included), only with notifications on, and refuses Play Billing without them (found by the first **Build TWA** run). That declares the notification permission; the game never asks for it, so no player is asked.
- **The locked last card:**
  - **In the Android app:** the unlock at Play's price, and "You've bought it already".
  - **Elsewhere:** the store pages in `STORES` (`game/unlock.ts`, empty until Evan fills them at launch).
  - The app shows no other store (Play's payments policy). It knows it's the app by the referrer Chrome gives its first load, remembered for the tab, or by reaching Play.
- **Checks:**
  - `play.test.ts`, against a fake Play: the price, a purchase only once listed, cancel and failure, restore at start-up and by hand, the app known past a reload.
  - `e2e:gate` in the app, with a faked Play: the unlock at Play's price; nothing found; a cancel; a purchase reopening the game unlocked; a new phone restored at start-up.
  - `twa/acknowledge.test.mjs` renders Bubblewrap's own templates offline and checks the hooks go in, twice changes nothing, and a template that moved on stops the build. In CI.
  - `npm run check` fails if `build-twa.yml` stops running the hook between generating the project and Gradle.
- **Unverified:**
  - The Java compiles: an unsigned **Build TWA** run on the branch generated the project, hooked the acknowledger in, and built the release bundle against the real Play Billing 8.3.0 and android-browser-helper. It hasn't run on a phone.
  - Nothing has been bought for real: that needs the product in the Play Console and a licence tester on a phone.
  - Whether `listPurchases()` lists a pending purchase (paid in cash, not yet cleared) isn't known. If it does, the game unlocks before Play has the money; the app acknowledges only once it's paid.

**Status (16 Oct 2026): 19.3 built: the paperwork.** No change to the game, 0.999.89 (the site's pages change).
- **`privacy.html`, brought up to date:**
  - what the game keeps (the unlock among it);
  - the host: GitHub Pages sees an IP address and a browser when files load;
  - each store's part in a purchase (Google Play in the Android app, Steam with its achievements and Cloud, itch.io);
  - the notification permission the Android app declares and never uses;
  - the save as a file;
  - deleting your data by platform. It used to say uninstalling the Android app removes the save; the save is the browser's, so it may stay [inferred].
- **`terms.html`, new.** There were no terms in the rebuild; v0.956's "provided free" left with its bundle. They cover:
  - the licence to play, and that the public source isn't a licence to copy (the repo has no licence: © RCJ Labs, all rights reserved);
  - purchases under each store's terms and refunds;
  - climbers from before the gate;
  - saves being the player's to keep;
  - "not climbing instruction";
  - no warranty, with consumer law left standing.
  - **No governing law: Evan's to name.**
- **Shipping:** both ship (`stage-site.mjs`), and `npm run check` fails if either goes missing or they stop linking each other.
- **The forms** (`docs/PAPERWORK.md`): Play's data safety (none collected, with two points for Evan to confirm: Play Billing's purchase history, and the host's logs), the IARC questionnaire, target audience, and Steam's content survey and legal fields, each answer with its evidence in the code.
  - **Simulated gambling:** the fire's blackjack and hold'em are played for in-game cash, which IARC counts as simulated gambling. A child audience is out under Play's Families policy.
  - **The rest is mild, in text:** alcohol references and a few drinks handed or brought, injuries, an opt-in Free Solo death without blood, a romance as far as a kiss, "hell" three times.
- **Play's listing at launch** (`docs/STORE.md`, At launch): the short and full descriptions and "What's new" for a free first season and an unlock, under Play's limits (`npm run check`) and held to the content's facts (`storecopy.test.ts`).
- **Done-when 3 (legal text updated): passes, for Evan's review.** Not legal advice; the terms' governing law and the two data-safety points are his.

**Found writing the beta plan (16 Oct 2026), and Evan's call.** The Android app always shows the live site, where the gate is off till launch, so no licence tester could try Play's unlock before then. **Evan's call: a tester's link.**

**Status (16 Oct 2026): 19.4 built: the beta kit.** No save change, 0.999.90.
- **The error screen's report** ends on where the game was (the day, the hour, the place, the save's seed) and the last twelve moves (`game/trail.ts`, `Game.trail()`). They're kept in memory as dispatched, a walk folded into one line, any name the player typed left out (the climber's, a first ascent's, the crew's). The privacy page and the screen's own words say so.
- **A tester's link** (`?gate=try`, `trying` in `game/unlock.ts`): the gate shuts for that tab alone, as on launch day for a climber not from before. Only Play's unlock opens it, and it marks nothing. A licence tester can buy and restore in the Android app before the gate is on for anyone (`docs/BETA.md`).
- **Found building it: a locked game set a real climber aside.** In the full game, locked, a full game's save was refused at start-up, and a refused save is quarantined; under the link, a tester's own climber would have been. Now only the demo's own build turns a full save away (`save.ts`). The locked full game loads it, and a climber who's been past where the demo goes waits at the last card (`demoOver`, asked once a state), where it can be unlocked. A full save brought in by file at launch does the same, where 19.1 turned it away.
- **Settings ends on the build's version,** for testers' reports.
- **`docs/BETA.md`:**
  - the two rounds: Play's closed track and a Steam Playtest, 50–200 players, a third non-climbers;
  - the tester's link, step by step;
  - the invitation's words, where reports go, and what one holds;
  - the severities: critical and high block launch;
  - weekly triage, and the bug list.
- **`.github/ISSUE_TEMPLATE/beta-bug.yml`:** a tester's issue, asking for no save (the repository is public).
- **Checks:**
  - `trail.test.ts` (a move as a line, typed names left out, a walk folded, the cap);
  - `crash.test.ts` (the report's trail);
  - `unlock.test.ts` (the link: this tab's, past a reload; it shuts a climber from before, marks nothing, and opens only to Play's unlock);
  - `demo.test.ts` (the demo's build turns a full climber away; the locked full game loads and holds them);
  - the e2e's crash section (the day, the seed, the moves, the create move without its name);
  - `e2e:gate` on today's build: a tester's own climber two hundred days in, the link, the last card with the save untouched, bought, open again; and without the link the site open to everyone.

**Done when, checked (16 Oct 2026), as Evan's calls left them:**
1. **A purchase unlocks the full game on each store, and a restore works: the code's ready; the real stores are Evan's.**
   - **Steam:** the full edition is the purchase, always open (the desktop smoke).
   - **Play:** the unlock and its restore pass against a faked Play (`e2e:gate`), and the acknowledger compiles in **Build TWA**. A real purchase and restore wait on `full_game` in the Play Console and a licence tester on the tester's link.
   - **itch.io:** its DRM-free build is **Build desktop**'s folders, Evan's to upload.
   - iOS is Phase 20's.
2. **Without an unlock, the gated build never goes past the first season, and the demo's own build holds none of the full game's content: passes.** `e2e:gate` (a climber after the gate gets the first season and its last card; a full climber waits at the last card) and `diff:demo`. On the web it's an honor gate, by Evan's call.
3. **Legal text is updated: passes** (19.3), for Evan's review: the terms' governing law, and the two data-safety points.
4. **Beta round 2 has no open critical or high bugs: Evan's.** The kit is ready: `docs/BETA.md`, the report, the tester's link, the issue template.
5. **No crash in the bots' and the e2e's runs, and a crash shows the error screen: passes.**
   - The full harness, 10 of 10 in 16 minutes: 16 careers to day 224 and 16 to their endings, with no refusal and no stuck night.
   - Two balance lines inside it still read short, as they have since Phase 30: Outdoors 1 of 4 and Comps 3 of 4 reach the top. Phase 19 moved no balance.
   - `play:demo` plays the demo to its end.
   - The e2e, `e2e:demo` and `e2e:gate` fail on any page error, and passed.
   - The error screen shows on a crash, in the e2e on purpose.

**Phase 19's code is done.** Criteria 1 (the real stores) and 4 (the beta) are Evan's: his accounts, his testers, his launch. Closing the phase is his call.

**Phase 19 stays open (18 Oct 2026)** on criteria 1 and 4, while Phases 36–45 come first by Evan's call: "before all the phase 20 stuff". The CURRENT MILESTONE moves to Phase 36.

---

### Phase 20 — Launch, live updates, and the Unreal decision   **<<< CURRENT MILESTONE**

*Next after the ten "Hands on" phases, by Evan's call (19 Oct 2026). Most of it is his: the stores, the timing, the coverage, the gate. The code side is planned with his calls.*

**Evan's calls (19 Oct 2026):** the code side before launch is three things: What's new in the game, a launch checklist, and a seasonal event that needs no server. Not 1.0's version yet: that waits for his word.

**Slices:**
- **20.1, What's new:** the game's notes by version, newest first, in one file. A player back after an update reads them once, and Play's "What's new" takes the newest as it is.
- **20.2, the launch checklist:** `docs/LAUNCH.md`, his steps in order and every carried [proposed] number and playtest question in one place; README's status brought up to date.
- **20.3, a festival:** a yearly event at a crag, on the game's own calendar, with its own scene, people and a choice. Planned with his calls (below).

**Status (19 Oct 2026): 20.1 built: What's new.** No save change, 0.999.108.
- **The notes** (`game/news.json`): a paragraph a version, newest first. The newest is Play's "What's new" as it is.
  - `npm run check` holds each to Play's 500 characters, in order, none past the build, and no straight quotes.
  - STORE.md's hand-kept block moved in as the 0.999.86 note.
- **When they show:** the save says which version of the game last wrote it (`savedBy`).
  - Back after an update with notes since that version: a card, once, when nothing else is open, with up to three notes, newest first.
  - It has to be read ("Right"), which writes the save as this build's, so it doesn't come back.
  - A new player sees none, nor does the day, nor the demo, which takes an empty twin since the notes name the whole valley.
- **The first note,** 0.999.108, is for a player back from the live site's 0.999.33: Phases 26 to 45 in 483 characters.
- **In Settings:** "What's new", to read the latest again.
- **Tests:**
  - `news.test.ts` (3): versions in order; what shows since a save's version (at most three, none past the build, the newest alone for a save that doesn't say); every note fits Play.
  - `persist.test.ts`: `savedBy`.
- **The e2e:** a new section, "What's new": a save last written by 0.999.33, the card and its two notes, read, the save now this build's, gone on reload, and there again from Settings.
- **The download:** 498.1 KB of 510 (+0.8).

**Status (19 Oct 2026): 20.2 built: the launch checklist.** Docs only.
- **`docs/LAUNCH.md`:** your steps in order, each with where it's written up:
  - before the beta: the tag, Steam's apps, achievements, Cloud and depots, Play's product, where crash reports go, the press kit's brackets;
  - the beta's two rounds;
  - Steam, the demo and Next Fest;
  - the day: the forms, the privacy page and terms, the gate, Play's listing, itch.io, when;
  - after: the rhythm, each release's note, the Unreal decision, catalogues.
- **What launch leaves open:**
  - in code: the gate e2e's hardening, proposed on #165;
  - for the playtests: every phase's [proposed] numbers and the questions the bots couldn't settle, since Phase 26, with the first hour and the music from before.
- **README's status,** which still said 0.961.0 and Phase 22: now the live site's 0.999.33, what main holds that isn't released, and Phase 20.

**Evan's calls for 20.3 (19 Oct 2026),** all as recommended:
- **What:** a crag day, like Adopt a Crag and the Hueco Rock Rodeo: the old guard's trail work in the morning, a scramble comp on the boulders after (most problems in the time), a fire that night. Three ways in, the first free: pitch in, enter the scramble, or just climb the busy crag.
- **When and where:** winter, at Moonstone, around day 25 of the year (winter has only Longest Night, on day 21). Full game only: Moonstone is past the demo.
- **What it gives:** standing with the old guard for the trail work; a prize for the scramble's podium, gear or cash under a week of shifts as every prize is; bond at the fire with whoever's there. All from dials.

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
- 2026-09-28 — Phase 1, part 1: the release pipeline for the built game.
  - CI: static checks, size report, headless smoke test.
  - Deploy on tag.
  - One version, in `package.json`.
  - Bubblewrap pinned by lockfile, with targetSdk ≥ 36 asserted.
  - Duplicate `/music` removed; favicon added; `CLAUDE.md` and `README.md` written.
  - The Play build's SDK setup was broken by Google removing the `tools` package; now fixed.
  - The marker stays on Phase 1, because the source is still missing.
- 2026-09-28 — Direction decided (tone, camera, climbing, look) and the rebuild track added (R0–R3). Phase 1 closed; affected phases annotated. CURRENT MILESTONE moved to R0.
- 2026-09-28 — R0 built in `app/`. The feel slice now runs on an engine-free sim (seeded RNG matching Unreal, fixed-step attempts, versioned saves with quarantine) under the Mix renderer. CI job added. The marker stays on R0 until that job is green on GitHub.
- 2026-09-28 — R0 done: the `app` job is green on GitHub. CURRENT MILESTONE moved to R1.
- 2026-09-28 — Characters redrawn as solid comic figures (one outline per figure, cuffed beanie, hemmed sleeves and trousers).
- 2026-09-28 — R1 sim: v0.956's skills, starts and XP; beta styles set the windows; Roadside's seven lines; Send City's weekly set; fed, bills and the card; seeded weather; Sage's schedule and lessons. Save v2 with a migration tested against a real R0 save.
- 2026-09-28 — R1 on screen: Send City, boulders and their close-ups, people by their hours, rain, the creation screen, You and forecast sheets, settings. The e2e bot plays two days.
- 2026-09-28 — R1 shell and week: the manifest, icons drawn in code, and a generated service worker (the e2e restarts offline); the week bot and the replay test. Criteria #1 and #4 pass. #2 (testers) and the Android half of #3 wait on people and a device, so the marker stays on R1.
- 2026-09-29 — R1 closed by Evan's call: testers fold into R2's first-hour criterion, and the Android check moves to R3. CURRENT MILESTONE moved to R2. R2's plan written from the audit and the v0.956 bundle, with the design calls R2 needs from Phase 5 marked as proposals.
- 2026-09-29 — R2 harness: bots with human-ish hands play whole seasons under three strategies and report grade, runway, injuries and when content runs out (`npm run harness`).
- 2026-09-29 — R2 load and injury: v0.956's acute:chronic model with Phase 6's fixes (seeded chronic load, warm-ups, seeded rolls, a free first injury). Save v3.
- 2026-09-29 — R2 crags: Roadside's other four lines, its open project yours to first-ascend, name and grade; Granite Gorge (opens at V4, shut in spring, shaded all day, one sandbag), with its own scene, wall and map road. The harness then showed a V4 bot sending the Gorge's V9: windows above your grade were far too wide, fixed in the next commit.
- 2026-09-29 — R2 windows: above your grade they now close about 40% a grade (R1's floor let a V4 send the Gorge's V9), and the harness's hands vary their reaction time from go to go, so tension cruxes stop being all-or-nothing. The bots' displayed grade at day 42 drops from V5 to V4; their first V5 project comes around day 14. R2's rules so far are logged in Dirtbag-UE's spec log.
- 2026-09-29 — R2 partners: v0.956's bond tiers, earned a day at a time climbing where a partner is; partners who turn up more as the bond grows; Sage's four-beat arc in v0.956's words, five days apart, with a week away guiding; and asking her out to belay at the Gorge. A speech mark shows when someone has something to say; the You sheet lists the people you've met.
- 2026-09-29 — R2 rival: Dex Calloway on his own seeded curve (streaks, a stretch hurt, a peak), met over your first V4, and v0.956's first-ascent race for the open project, set off once you're climbing V4. The harness bot learned to pick beta by how forgiving it is for its hands, to take the dare, and to name its first ascents; bot runs now keep every line.
- 2026-09-29 — R2 Scout: the Lot's stray picks you on your tenth trip out. Kibble, the stick and ride-alongs at v0.956's numbers and in its words; he sits by the van at the crag and has a row on the You sheet. R2.4 (people) is built; R2.5 (Act I, the send card, the wall's feel, tuning, docs) is next.
- 2026-09-29 — R2 Act I: v0.956's first-season quest as the demo's goal ladder, in its words and with its rewards, a "Next" pill on screen, and an end-of-act card; it ends at V4, the night Dex's race begins.
- 2026-09-29 — R2 wall feel (Phase 9): the fall sheet draws how far a go got against your best; a chalk band and an X on the wall; pumped climbers shake and the screen's edges close in; and, proposed, climbers move through a line at a pace set by how far over or under its grade they are. Fixed "A 11-foot catch".
- 2026-09-29 — R2 send card: a first send gets a card painted on the device from the line's own wall and topo (name, grade, how it went, the crag and the day, you at the top, a ribbon for a first ascent), to share or save as a PNG. Nothing is uploaded. The wall, boulder and gym painters now paint into any canvas, so the card is crisp at its size.
- 2026-09-29 — R2 targets: the harness checks Phase 6's first-season targets and passes all four. Its bots now log time on the rock, what it taught them, and any stuck night. It also found wet days in week four with nothing new to try once the gym set is done. R2 is built; criteria 1 and 2 wait on watchers and testers.
- 2026-09-29 — R2 closed by Evan's call: criteria 1 and 2 accepted as tested and watched; the proposed design calls stand as built until he rules. CURRENT MILESTONE moved to R3.
- 2026-09-29 — R3 decided (Evan): v0.956 retires with its saves exported, and the rebuild ships as 0.960.0. R3.1: the rebuild tells a v0.956 player the old game has retired, keeps their career as a file, and lets them come across under their old name, capped at V3 (proposed).
- 2026-09-29 — R3.2: the site becomes the game's build, at 0.960.0. The build's worker takes v0.956's name and clears its cache, and a local crossover test shows a v0.956 browser swapping to the rebuild within seconds, offline included. Smoke, check, stage, CI and Deploy follow the build. v0.956's files leave the tree; its tag keeps them.
- 2026-09-29 — R3.3: the Play listing and "What's new" for 0.960.0 in `docs/STORE.md`, held to Play's limits by `npm run check`, and eight screenshots from the build. R3 is built; the tags and the Play upload are Evan's.
- 2026-09-29 — R3 merged (PR #11) and closed by Evan's call with the release carried as his steps (the v0.956.0 and v0.960.0 tags, then the Play upload). CURRENT MILESTONE moved to Phase 10, planned on the rebuild: the board at Send City, conditions you can see, and Moonstone Boulders.
- 2026-09-29 — Phase 10.1: the board at Send City. Four problems, V4–V7, that stay up four weeks, on a new seed stream logged for Unreal. It has its own scene, sheet, face-on wall and e2e step. "Nothing new to try" in the harness falls from about half the runs to 3 of 144; the season targets still pass.
- 2026-09-29 — Phase 10.2: conditions you can see. The sun crosses Roadside end to end in two hours and greases each line as it arrives (proposed). The scene and walls show its edge, wet rock shows after rain, and the map tags closed and soaked crags. The season targets pass.
- 2026-09-29 — Phase 10.3a: Moonstone Boulders as a place. v0.956's terms: V6, a $400 haul paid once, a $20 permit each trip. Nine lines, a desert scene with a quartzite spire, its road and map pin. Save v4 adds the trips you've paid for, migrated from a real v3 save. Highballs (10.3b) are next.
- 2026-09-29 — Phase 10.3b: highballs (proposed). A fall off a tall boulder can land you badly, by height, halved by the Moonstone haul's pads and again by a partner spotting. The beta sheet shows the odds. Careful bots wait for a spotter; 7% of moderate runs now end month one with a jammed ankle. Phase 10's slices are built; its criteria 2–4 aren't met, so the marker stays.
- 2026-09-29 — Phase 10 follow-ups: Moonstone gets its own desert sky (v0.956's per-crag weather), on its card and the forecast. The harness counts only content, not injuries, as "nothing new to try": 1 run in 144 is left, and it hinges on the board-stiffness call. Roadside's card counts its lines from the data.
- 2026-09-29 — Evan's calls: the board runs a grade stiff, criterion 3 is scoped to Act I (V0–V9), and highball risk stays as built. With the stiff board, the harness reads 0 runs in 144 with nothing new to try. Phase 10's criteria 1–3 pass; 4 waits on testers.
- 2026-09-29 — Phase 10 closed by Evan's call: criteria 1–3 pass on the build, and criterion 4 (testers) carries. CURRENT MILESTONE moved to Phase 11, planned on the rebuild: count the taps, place cards, adding a place as documented work, and the daily agenda.
- 2026-09-29 — Phase 11.1: count the taps. On a pinned seed, the e2e bot counts every trip (3 taps at most from a scene, 2 by the crag's van) and a day-3 loop. The loop took 32 taps, 12 of them waiting for bed at 6 PM. Bed now opens at dark (5 PM), and lying around till dark is one tap (proposed). Day three: 20 taps. Criteria 2 and 3 pass; the season targets don't move.
- 2026-09-29 — Phase 11.2: place cards. Every card has a header showing the place as you'd find it after the drive: its scene, with whoever's there, the light, the wet and the night; the diner and the café get fronts drawn in code. Places with a scene list who's around then, and till when. At a crag with ropes or highballs, a line says whether that means a belayer or a spotter. The e2e checks both.
- 2026-09-29 — Phase 11.3: adding a place is documented work. Roads are a graph: 11 roads to neighbours instead of one for every pair, and a drive is the quickest way through them. Daily trips and v0.956's drives from the Lot keep their costs. Nine rare trips to or from the Gorge and Moonstone shift; Roadside to the Gorge is now an hour and $10. Drives on the map follow the roads, so Roadside to Moonstone no longer runs south through town. An "Adding a place" checklist is in `app/README.md`, and the tests name what a place is missing.
- 2026-09-29 — Phase 11.4, by Evan's call: the daily plan. Yesterday, as you played it, is today's plan: one tap runs its drives and errands, it waits while you climb, and it stops at the first thing the day refuses, saying why. You plan on the van and edit by where, then what; bed stays last. The e2e runs day four as a plan in 13 taps (day three took 20), and day five's plan stops at the café.
- 2026-09-29 — 0.960.0 released: Evan published `v0.960.0` on `main`, and Deploy run 1 went green, live check included. `v0.956.0` is left untagged on purpose, because its push would deploy v0.956; creating it on `e098332` is the rollback. The docs now say so.
- 2026-09-29 — Phase 11 closed by Evan's call: criteria 2 to 5 pass on the build, and criterion 1 (testers) carries. Phase 10 and 11 ship together as 0.961.0, with the store's "What's new" and the full description updated for them. CURRENT MILESTONE moved to Phase 12; what the rebuild left of it gets planned next.
- 2026-09-29 — 0.961.0 released: Evan published `v0.961.0` on `main` (`afab5a5`), and Deploy run 2 went green, live check included. Phase 10 and 11 are live; the Play update is Evan's.
- 2026-09-29 — Phase 12 planned on the rebuild, with Evan's calls: a Journal instead of the five tabs, and landscape widens the world rather than framing a phone column. Slices 12.1 (text surfaces) to 12.5. Unreal is on hold until the conversion is done.
- 2026-09-29 — Every send after a line's first is now a repeat, by Evan's call; it was named "Redpoint" however many times you'd sent it. The log keeps the first send's style, so saves don't change.
- 2026-09-29 — Phase 12.1: the Journal. Your body in the HUD opens it: you as a climber, and "Lately", the sim's 200-line log that nothing showed until now. A line over 30 words goes on a card, not a toast, and the e2e fails on any toast longer. Day three's taps don't move.
- 2026-09-29 — Phase 12.2: the wide screen. A landscape window widens the screen to up to 1248 across instead of framing a phone: scenes and skies show more, the map paints ridged country around the valley, walls close up are panels over their crag, and sheets dock at the right from 1080 across. Toasts moved off the HUD, and the e2e checks every one against every control. A landscape morning joins the e2e.
- 2026-09-29 — Phase 12.3: keyboard and access. Scenes' things and the map's pins take the keyboard and a screen reader, Escape puts things down, one focus ring, text at a true 1.3×, low meters striped, and the accent deepened to pass the new WCAG AA check in `npm run check`. The e2e plays a day by keyboard alone at the larger text.
- 2026-09-29 — Phase 12.4 and 12.5: the van says what tonight will do (from `tonight()`, which sleep is held to), and inline styles are down to custom properties, checked by `npm run check`. Phase 12's slices are all built; closing it is Evan's call.
- 2026-09-29 — Phase 12 closed by Evan's call: criteria 1, 4 and 5 met; 2 and 3 met for what the e2e plays, the rest carried to playtesting. CURRENT MILESTONE moved to Phase 13, sound and feel; it gets planned on the rebuild next.
- 2026-09-29 — Phase 13 planned on the rebuild, with Evan's calls: effects and ambience made in code, CC0 recordings where they fall flat, music parked, and effects shippable without it. 13.1: the sound engine and a sound for every verb, volume and vibration in Settings, silent while hidden. The e2e hears 20 of the 23 cues.
- 2026-09-29 — Phase 13.2 and 13.3: every place has ambience, from its data, turned by the hour and the sky; the licence ledger lists all 34 sounds, `npm run check` fails on unlisted audio, and Settings has credits. A click in 13.1's effects (envelopes starting at full volume) is fixed.
- 2026-09-29 — Phase 13 closed by Evan's call: criteria 1–3 met, criterion 4 carried with the parked music decision. CURRENT MILESTONE moved to Phase 14, the desktop and Steam build.
- 2026-09-29 — Evan's call: finish building the game before the Steam build and the demo. Phases 14 and 15 (Stage D) move after Phase 18, keeping their numbers; the order is now 16, 17, 18, 14, 15, 19, 20. CURRENT MILESTONE moved to Phase 16, the spine: story, acts and endings.
- 2026-09-29 — A gap check of v0.956 against the rebuild and the phases left found systems nothing covered. Evan's calls: three phases added before Phase 16, numbered 21 (the climber: gear, trad, training, crags past Act I, walls and expeditions), 22 (the life: van, body, food, the hustle, events, and the games) and 23 (who you are: origins, paths, stances, the Record Book); and blackjack, hold'em, liar's dice, horseshoes and busking come back from the cut list (trivia and a garden maybe). The order is now 21, 22, 23, 16, 17, 18, 14, 15, 19, 20. CURRENT MILESTONE moved to Phase 21.
- 2026-09-29 — Phase 21.1: your kit. Shoes that wear, chalk, tape and a second pad; worn kit tightens every crux through the same factor the beta sheet shows; a gear shop in town with resoles and a weekend swap meet; save v5 from a real 0.961.0 save; bots keep their kit up and Phase 6's targets still pass.
- 2026-09-29 — Phase 21.2: trad. Stances where you choose to place a piece (for pump) or run it out; falls catch on what you placed, and with nothing low enough you deck, with an injury roll; Trad Arête and Gorge Trad; a rack at the gear shop and the swap meet; a sound for a piece going in.
- 2026-09-29 — Phase 21.3: training. Six protocols and prehab at the van (a hangboard) and the gym, through the load model; one session a day, none tapering, hurt or fried; phases that hold for 6 days and a peak that ends in a deload; a taper with a 14-day cooldown; save v6; a harness target holding every protocol under climbing's rate at every grade reached.
- 2026-09-29 — Phase 21.4: Sandstone Mesa. v0.956's eleven lines (V7 to an open V13, three bolted, one trad), V7 to get in, closed in summer, desert rock and its own weather; a red-sandstone scene, wall and boulder look; a pin on a desert road; Sage will come out to belay; the bots drive there from V7.
- 2026-09-29 — Promotions and invites (Evan's call on the V5 squeeze): café and setting ranks that raise a shift's pay, setting's gated by grade; Hazel and Sage can be asked out to any crag, by bond; save v7; the harness runs eight weeks, with no stuck nights.
- 2026-09-29 — Phase 21.4: The Big Stone. v0.956's five single pitches (V6 to 5.14a, one trad, one bolted), V8 and a $600 trip, four hours out, shaded; a granite big-wall scene, face and boulder look; Ride-or-Die to bring a partner.
- 2026-09-29 — Phase 21.4: Wind River Walls. v0.956's nine lines (V9 to an open V15; three bolted to 5.14c, one trad), V9, an $800 trip and a $35 permit, four hours out past the Gorge, shaded, shut in winter; an alpine scene, face and boulder look.
- 2026-09-29 — Phase 21.4: The Crucible. v0.956's lines V13 to its two V18 myths, and The Anvil (V16) so no grade is missing; myths that can't be read until the line under them is sent; V11, four hours east over the pass, shaded; a gneiss scene, face and boulder look.
- 2026-09-30 — Phase 21.4: Psicobloc Cove. v0.956's eight deep-water solos, V2 to V9; a fall is a splash with no landing or strain roll; V4, two hours out on the coast, open in summer only; a sea-cliff scene, face and shelf; the bots go there from V4.
- 2026-09-30 — Phase 21.4: The Cave. A second gym, eight problems a week V3 to V10, its own pass and a power-and-fingers specialty; indoor places generalized; coaching with three ranks; the bots climb there from V3. The Hollow waits for its quest.
- 2026-09-30 — Phase 21.5: walls and expeditions. v0.956's four walls climbed pitch by pitch with bivies, on a rope from the gear shop; its three expeditions as a day-by-day call with the summit's odds worked out and shown; save v8. Criterion 4 passes in the tests.
- 2026-09-30 — Evan's call: Phase 24 added, expeditions as trips: a scene for each, planning and packing, getting there, pitches climbed through beta-then-send, and coming home. It runs after Phase 22 and before 23 [proposed]; the order is now 21, 22, 24, 23, 16, 17, 18, 14, 15, 19, 20.
- 2026-09-30 — Phase 21.6: crowds and spray beta. Each crag's crowd from its draw, the weekend, the hour, the sky and the day; a queue for the ropes in the go's cost; beta from the crowd, asked for or shouted at you, at the cost of the onsight; strangers at the base.
- 2026-09-30 — Phase 21.6: highball calls, by Evan's call: every outdoor boulder from 16 ft up is a highball, set from its height and held by a test. Twelve more, seventeen in all; the Gorge now wants a spotter.
- 2026-09-30 — Phase 21.6: the speed wall at Send City (a reaction start, alternate hands, a PB; time, a pass and a daily cap on what it teaches) and Free Solo (chosen at the start; outdoor sport lines and wall pitches without a rope; a fall ends the run, and reloading can't take it back); save v9. 21.6 done; Phase 21's criterion 3 (bots to V10+) still open.
- 2026-09-30 — Phase 21, criterion 3: a career bot (best job, trips saved for, Hazel asked along, the hardest crag it can use) and a four-year career harness. Every run reaches V10 (median day 200) with no refusals or stuck nights; 9 of 16 hit about one wet day with nothing indoors past V9. Closing Phase 21 waits on Evan's call on that gap.
- 2026-09-30 — 0.962.0 prepared for Evan to test: Phase 21 so far (gear, trad, training, the crags past Act I, walls and expeditions, crowds, highballs, the speed wall, Free Solo). Merged to main; the release tag is Evan's.
- 2026-09-30 — 0.962.1: the map fits the valley between the HUD and the buttons (MAP_FIT), so The Big Stone and Sandstone Mesa no longer hide under the HUD on a phone (Evan's report); the map's toast moves to the new gap.
- 2026-09-30 — 0.962.2, from Evan's testing: the pump bar's hot pulse animates its colour, not a filter (phone Chrome drew the filtered layer as a striped red box over the climb panel); sound quieter (master 0.5 on, 0.15 quiet, from 0.9 and 0.35; ambience a notch under the effects); the gyms sound like gyms: falls onto the pads, chalk claps and hands on holds, less room rumble, and voices that come and go instead of a breeze.
- 2026-09-30 — Phase 21 closed by Evan's call. The wet-day gap is closed with content: The Cave sets V5 to V12, and the Training Center (v0.956's third gym) sets eight comp-style problems a week, V7 to V14, from V7. The career bots reach V10 in every run (median day 162) and never run out of things to try. 0.963.0. CURRENT MILESTONE moved to Phase 22, the life; it gets planned on the rebuild next.
- 2026-09-30 — Phase 22 planned on the rebuild [proposed]: nine slices (the week and the money, the van, food, the body, the hustle, events, Scout's life, dreams, the games) on the audit's principles (pressure that changes, no farms, one night, Tonight shows it, seeded and written), with five decisions for Evan before their slices: pace, psyche, Scout's end, the garden and farm, and van parts.
- 2026-09-30 — Evan's calls on Phase 22's decisions: jobs differ in pay and hours, starting low with promotion the way up (no pace target); psyche kept as a slow mood; Scout's full lifecycle kept; the garden and farm cut, their plan saved for later; three van parts.
- 2026-09-30 — Phase 22.1 built: shifts posted by the week and signed up for ahead (only those count toward a raise; three no-shows cost the job), the Warehouse as a fourth job, pay that starts low and roughly doubles by the top rank, and how you live (dirtbag, comfortable, plush) paid nightly. Save v10. 0.964.0.
- 2026-09-30 — Phase 22.2a built: the van's three parts wear with driving and nights; a worn van breaks down on drives out of town (never a kept-up one), with a tow, a bodge, limping on or a friend; Dale's garage in Midtown puts parts back. Wear retuned to about $5 a day after the harness. Save v11. 0.965.0.
- 2026-09-30 — Evan's call on the jobs: each pays in something besides money (coaching head, setting technique, the warehouse endurance); the café pays least a shift and is shortest; a Diner job, a little more a shift in tips for a longer one. Setting $28 → $30.
- 2026-09-30 — Phase 22.2b built: where you sleep, a standing choice among the Lot (tickets from the fourth night running), the Upper Trailhead, the truck stop, a friend's driveway and the Ridge, each with its cost, drive and night; Tonight shows it. Save v12. 0.966.0.
- 2026-09-30 — Evan's call: the size budget goes from 250 KB to 300 KB. Phase 22.2c built: six van upgrades at the garage (bed, curtains, tool kit, tune-up, heater, insulation), none of them income; winter nights cost energy unless the heater's burning propane, with a warning before. 22.2 done. 0.967.0.
- 2026-09-30 — Evan's call: the heater costs $45 (from $150), within reach before the first winter; the bots buy it first. 0.967.1.
- 2026-09-30 — Phase 22.3a built: the Market, a camp kitchen and four recipes (two fuel you: wider windows for the day, never a skill), the last four meals counted for variety, coffee crashing past two, and a hungry bedtime eating the pantry first. Save v13. 0.968.0.
- 2026-09-30 — Phase 22.3b built: the lake opens, with fishing (food, not cash, seeded by season and hour, once a day) and a swim. 0.969.0.
- 2026-09-30 — Phase 22.4a built: insurance plans (none, catastrophic, full cover) replace the flat premium and set the clinic's bills; the Clinic in Old Town has physio (a day off an injury, once a day) and cortisone (half off, and the next injury in three weeks a tier worse). Save v14. 0.970.0.
- 2026-09-30 — Phase 22.4b built: old injuries (a healed tier-2+ injury may leave a mark: more risk there, and flares physio settles) and fear (after a landing, a deck or the worst injury, that style's windows tighter until you send one). Save v15. 0.971.0.
- 2026-09-30 — Fixes from Evan's phone: the van's lit windows spilled past the cab's roof (now clipped to the body), and a tap on the van while standing by it opened its sheet and let the same tap's click pick a row (it cooked ramen). A sheet now ignores a click whose press came before it opened; an e2e step taps the van on a touch screen. 0.971.1.
- 2026-09-30 — Phase 22.4c built: one supplies gauge (water and washing) refilled at the lake, the market, the gym and the truck stop; a seeded nightly chance of a cold, a bug or a toothache from the cold, low supplies, hunger and a samey diet; a doctor at the clinic. Save v16. 0.972.0.
- 2026-09-30 — Phase 22.4d built, and 22.4 with it: psyche, a slow mood that a new send, a new crag, company and the fire lift, and shifts and samey days wear down, drifting back to even every night; it moves every window up to 5%, and Tonight says it in a word. Bots sit at the fire when flat. Save v17. 0.973.0.
- 2026-09-30 — Phase 22.5a built: the hustle's safety net, once a day each: cans from the van, the bins behind the market after dark, and foraging at the lake, seeded by the day; taught once, the first time you're hungry and broke. None out-earns a shift an hour (a new harness target). Bots use cans and the bins when broke. Save v18. 0.974.0.
- 2026-09-30 — Phase 22.5b built, and 22.5 with it: busking outside the Coffee Shop, a set of eight strums a day, by Evan's calls: under every job an hour at first, over every job after about 180 days of sets, and bigger crowds as you get better. Criterion 2 notes busking as his exception. Save v19. 0.975.0.
- 2026-09-30 — Two fixes from Evan's phone: the map's Market and Garage names no longer run off the edge, and card-only places close onto the map. Phase 22.6a built: the seeded event deck, one encounter a day at most, and v0.956's ten knocks on the van at night, by where you're parked, each holding the night until you answer. Save v20. 0.976.0.
- 2026-09-30 — Phase 22.6b built: v0.956's eight hitchhikers (who remember what you did, and may be the one at your next breakdown) and nine roadside stops, on drives to and from the crags, sharing the knocks' one-a-day cap; nothing before day 3. Plans wait on an answer. Save v21. 0.977.0.
- 2026-09-30 — Phase 22.6c built, and 22.6 with it: v0.956's five walk-out epics (the dark, a storm, off route, the cold, a stuck rope), three stages of calls that add up to getting out clean, rough or hurt; triggered leaving a crag late, spent, alone, in rain or winter; a headlamp at the gear shop. Every event has a sound and an e2e step. Save v22. 0.978.0.
- 2026-09-30 — Phase 22.7 built: Scout's life, v0.956's lifecycle: perks by bond (the fire, finds on his rounds, halved tickets), dog-years, going gray, two vet scares with bills, and at 16 his last day, spent your way and kept in the journal; no new stray for a month after, and the next has a name of his own. Save v23. 0.979.0.
- 2026-09-30 — Phase 22.8 built: dreams, v0.956's three at its prices (the Dream Rig, the War Chest, Home Base), saved for in a jar at the van that the card and the bills never touch and the broke check counts; Home Base says exactly what it stops charging. Save v24. 0.980.0.
- 2026-10-01 — Phase 22.9a built: horseshoes on busking's beat and liar's dice a bid at a time, at the fire at night with Hazel and (some nights) Sage; each an hour, once a night, and bond with whoever's playing no faster than a day climbing together (v0.956's paid everyone, uncapped). Save v25. 0.981.0.
- 2026-10-01 — Phase 22.9b built, by Evan's calls: blackjack ($5 hands, $40 a night, hit, stand and double) and heads-up hold'em (cash under the same cap, three decisions a hand) at the fire. Hold'em keeps reads on each person at 5 and 12 hands, and they read you back. Neither is a living. Simulated gambling: the Play content rating changes before it ships. Save v26. 0.982.0.
- 2026-10-01 — Phase 22.9c built, and 22.9 with it: trivia becomes the glossary, a Words page in the journal with every term v0.956's trivia asked and the ones the rebuild leans on; its history questions aren't carried. The harness holds the games to criterion 2. Phase 22's three Done-when criteria pass on the build; closing it is Evan's call. 0.983.0.
- 2026-10-01 — Phase 22 closed by Evan's call, with his calls on 22.8 and 22.9's open questions (the games' once-a-day bond kept, Sage 40%, $8 blackjacks, no insurance, cards count as company for psyche, the dreams' prices kept); tappable glossary words carried to a later UI pass. CURRENT MILESTONE moved to Phase 24, expeditions as trips; it gets planned on the rebuild next.
- 2026-10-01 — Phase 24 planned on the rebuild, with Evan's calls: the valley's walls, far away (real pitches, climbed in blocks with a partner), odds from the go's own model, mechanics before the scenes; the download budget to 340 KB; Cerro Torre's pitches in the existing styles, and its objective the Southeast Ridge; a trip blocks sign-ups, and booking a week ahead drops your shifts without a warning; 21.5's pay kept, under the harness's no-farm check.
- 2026-10-01 — Phase 24.1 built: expedition pitches are lines climbed as goes, led in blocks with a partner whose grade moves with yours, and handed over when you're stuck; portaledge nights give back less each time, and the days narrow every window; the summit odds come from the go's own model, and the harness holds them within ten points of the bots' trips. Save v27. 0.985.0.
- 2026-10-01 — Phase 24.2 built: expeditions are booked up to a week out against a forecast that's vaguer the further out it is, with a partner you choose and a haul bag you pack (food and water by the day, the portaledge, a stove where the water's snow), the odds moving with every choice; Evan confirmed 24.1's partner grades and handing over a pitch. Save v28. 0.986.0.
- 2026-10-01 — Phase 24.3 built: travel days each way (Trango's walk-in acclimatizes), the trip taking your signed-up shifts off with a week's notice and leaving them to miss without, no sign-ups while you're booked away; three leads a day on the wall; the odds carry your skin through the trip and the harness checks them over 300 trips. 0.987.0.
- 2026-10-01 — Phase 24.4 built: six things that happen up on a wall (a dropped cam, a jammed haul bag, rockfall, a squall, another party in trouble, a dead stove), some mornings, never twice a trip, each two calls with their costs shown; the odds count them as days that might be lost. Save v29. 0.988.0.
- 2026-10-01 — Phase 24.5 built: coming home. Every trip goes in the book (the Record Book's stub), with your high point on each objective; your partner closer or further for how it went; the trip's card on the way home; its story at the fire, once. The drawn keepsake card waits for 24.6–24.8's walls. Save v30. 0.989.0.
- 2026-10-01 — Phase 24.6 built: El Capitan's scene, day and night, clear and storm, with your portaledge on the wall as high as you've got; its pitches climbed on its own granite, your partner belaying from the ledge. 0.990.0.
- 2026-10-02 — Phase 24.7 built: Cerro Torre's scene from above Laguna Torre, day and night, clear and storm (lenticulars on a fine day, a plume and snow in a storm), your portaledge on the Southeast Ridge; its pitches on rimed granite over the glacier; storms snow where the water's snow. 0.991.0.
- 2026-10-02 — Phase 24.8 built: Trango's scene from base camp on the Trango glacier, day and night, clear and storm, your portaledge up Eternal Flame; its pitches on golden granite over the glacier. Every objective has its scene: criterion 1 passes. 0.992.0.
- 2026-10-02 — Phase 24.9 built: the harness found summits paid every time and a climber past an objective could farm it, so a summit pays once, as a wall does [proposed]; a new target holds every repeat trip under a day of shifts at every grade; the e2e leads a pitch and plays a trip through, and found the expedition card covering the wall on every lead since 24.1 (fixed). All five Done-when criteria pass; closing Phase 24 is Evan's call. 0.993.0.
- 2026-10-02 — Phase 24 closed by Evan's call, confirming 24.9's rule that a summit pays once; the keepsake trip card and the odds above an objective's grade carry to a polish pass. CURRENT MILESTONE moved to Phase 23, who you are; it gets planned on the rebuild next.
- 2026-10-02 — Phase 23 planned on the rebuild, with Evan's calls: creation is a name, a start and an origin (flaws folded into origins; build and personality cut); identity emerges in play (talents, callings, paths with grade gates, quirks); two factions now; no rep, so rewards are the book, small cash, psyche and the epilogue; a year is 56 days; eight slices from the Record Book to the harness.
- 2026-10-02 — Phase 23.1 built: the Record Book. v0.956's 42 feats, milestones and story cards merged to 37 entries, each with its story; 27 earned from what the game keeps, 10 waiting on unbuilt systems; one moment gives one card; a Record page in the journal; old saves fill it quietly. Save v31. 0.994.0.
- 2026-10-02 — Phase 23.2 built: six origins at creation, each a perk and a cost said from its own numbers [proposed]; 11 hidden talents dealt with one, shown once their skill has come on; a carried climber came across with nothing dealt. Bots by origin differ only modestly in week one; tuning that is 23.8's. Save v32. 0.995.0.
- 2026-10-02 — Phase 23.3 built: callings, asked at the fire after ten sends rather than at creation; the Purist, Send-or-Bust and the Lifer, each a perk and a three-rung ambition counted from the day you take it up, paying psyche [proposed]; the Influencer waits on followers. Save v33. 0.996.0.
- 2026-10-02 — Phase 23.4 built: five paths claimed a tier at a time on grade gates near V4, V9 and V14, two at most; one Mastery track of style mastery and v0.956's hybrids; a quirk named from your habits after 30 goes; all one kind of edge on the existing dials [proposed]. Expedition send chances now key on your edges. Save v34. 0.997.0.
- 2026-10-02 — Phase 23.5 built: two crowds, the old guard and the gym crowd; v0.956's five calls put to you at the crag, with the elder's answer once the old guard listens, and six echoes weeks later; clubs folded in as perks of standing [proposed]. Save v35. 0.998.0.
- 2026-10-02 — Phase 23.6 built: one weekly board of three jobs from v0.956's four boards, de-duplicated, pitched at your grade, paying itself small cash the moment a job's done [proposed]; a harness target keeps the best week under two days of the worst shift. Save v36. 0.999.0.
- 2026-10-02 — Phase 23.7 built: a recap card every 56-day year, from what the game keeps; the Homecoming once a life, once two people are close, paying v0.956's cash and psyche on your next send outside [proposed]. Save v37. 0.999.1.
- 2026-10-02 — Phase 23.8: a harness target that every echo lands (it does, after calls also come after a go and echoes anywhere); a stuck game (a call on a broken-down van) and queued cards after an answer fixed; an e2e later life. Criterion 1 measured and failing: climbers made differently play week one almost the same; Evan's call how to fix. 0.999.2.
- 2026-10-02 — Phase 23, criterion 1 by Evan's A and B: each origin starts its own first morning; bots play their origin and their start; a harness target tells week-one climbers apart (origins 87%, starts 48%). All three criteria pass; closing the phase is Evan's call. 0.999.3.
- 2026-10-02 — Phase 23 closed by Evan's call; the boulderer and the all-rounder alike in week one carry. CURRENT MILESTONE moved to Phase 16, the spine; it gets planned on the rebuild next.
- 2026-10-02 — Phase 16 planned on the rebuild, with Evan's calls: two endings (retirement inside the hours, The Line for whoever reaches V18, measured at ~day 900); v0.956's age clock with a countdown, retiring from 30, forced at 45; Acts II–V on the crags and trips that exist, comps later; the heir a kid you've coached. Six slices.
- 2026-10-02 — Phase 16.1 built: age on v0.956's clock (22, a year every 18 days, the Late Bloomer 32); hanging it up from 30, asked first; your body calls it at 45, with a countdown from 43; the tally of a climbing life with an epitaph from what you did; The Long Game in the Record Book; old saves held back to 43. Save v38. 0.999.4.
- 2026-10-02 — Phase 16.2 built: Acts II to V as content on the crags, walls, expeditions and myths, each ending in a scene with whoever's close; Evan's call that Act V puts your body on hold, since forced retirement came before The Line; old saves move on quietly. Save v39. 0.999.5.
- 2026-10-02 — After 16.2, Evan's calls: Act IV with one expedition; the Late Bloomer starts at 26, the speed-run origin, with time its only cost; the tally in plain text. The e2e's toast check now counts only what a sheet shows. 0.999.6.
- 2026-10-02 — Phase 16.4 built: the epilogue, from the save (origin, first ascents, summits, paths, quirk, masteries, calling, calls made, crowds, people, the dog, the Homecoming, the book); criterion 2 passes, every career bot's ending naming five or more things it did. 0.999.6.
- 2026-10-02 — Phase 16.3 built: The Line, a myth's first ascent ending the story in its own sequence (the naming at the fire, who was there, the credits, then hang it up or keep climbing); after it, retiring is yours at any age. 0.999.7.
- 2026-10-02 — Phase 16.5 built: the next generation; the kid you coached climbs on in the same world with the van, the trips, the dog, the mode, the family's Record Book and your lines on the topos, Dex coaching if he was close, and a first act of their own ending on a go on your line; criterion 3 passes. Save v40. 0.999.8.
- 2026-10-02 — Phase 16.6 built: the career bot plays the story's expeditions and walls; a wall partner stays the night (a fix); criterion 1 measured at a stated pace (median 19.3 h to the ending); all three criteria pass. Found: the Crucible's hardest boulders go far below their grade, so The Line is doable at V12. 0.999.9.
- 2026-10-03 — Climbing above your grade, Evan's call: one style counts only a grade and a half past your grade; windows close faster past a grade over and shut at three; a line three grades over refuses the go; from a grade and a half over, a go has one or two more cruxes. The Crucible's V16 to V18 no longer go for a V11. The Cave sets V5 to V11 with two at V7 (Evan's call), so a V6 has work on a wet day. 0.999.10.
- 2026-10-03 — Phase 16 closed by Evan's call; the Late Bloomer's speed run and Act IV inside the clock carry; the Cave sets V5 to V11 with two at V7 (Evan's call), closing a wet-day gap at V6. CURRENT MILESTONE moved to Phase 17, the people, planned on the rebuild with Evan's calls: a cast of about eight, romance with Sage and one more, and the family back home as a third ending.
- 2026-10-03 — Phase 17.1 built: Ray, Frank, Mara, Rico and Tam, each where and when they climb, with a look and a first meeting; Mara, Rico and Tam partners; Evan's call that the life timers run on the age clock. 0.999.11.
- 2026-10-03 — Phase 17.2 built: an arc of four beats, ending in a resolution, for Hazel, Dex, Mara, Rico, Tam, Ray and Frank, forks that send people away for a while, Dex known by days at the same crag, and an epilogue line for each newcomer; the download budget to 360 KB (Evan's call). 0.999.12.
- 2026-10-03 — Phase 17.3 built: on the age clock, Ray's last season and retirement (his topo yours), Tam slowing then done, Frank's rig dead and parked by yours, partners off the rock for stretches with news overnight; a first meeting waits for your first word. Save v41. 0.999.13.
- 2026-10-03 — Phase 17.4 built: romance with Sage or Mara (Evan's call), one a life: the spark, the first fight, one van or two, their chance against yours, together; a year counted overnight; an end in a scene after three weeks apart; the epilogue and the You page say so. Save v42. 0.999.14.
- 2026-10-03 — Phase 17.5 built: giving; a gift a week for each of the cast, a first ascent named for someone close (the epilogue remembers), Frank to the fire, Dex asked out. Save v43. 0.999.15.
- 2026-10-03 — Phase 17.6 built: four holidays a year as nights at the fire with your people in them; the family back home in five calls returned from the van; home for good, a third ending. Save v44. 0.999.16.
- 2026-10-03 — Phase 17.7 built: the fire said by whoever's there, a line opening each week you've known them; sends said back; nights on a wall's portaledge; a social bot for criteria 3 (334 of 336 bot-weeks see something new) and 4 (2.2 shows a line by day 100, against v0.956's 7). Save v45. 0.999.17.
- 2026-10-03 — Twenty portaledge lines each for the usual wall partners; criterion 3 passes in 16 of 16 runs. Phase 17 closed by Evan's call; crew drama, walker chats, busy-texts and shopkeepers' fillers carry. CURRENT MILESTONE moved to Phase 18. 0.999.18.
- 2026-10-03 — Phase 18 planned on the rebuild with Evan's calls: the budget to 400 KB; a minigame for all five jobs; the full media ladder, followers back; your own gym and buying a crag, with guiding carried.
- 2026-10-03 — Phase 18.1 built: the setter's puzzle (a brief a shift, five holds hung in order, scored on the grade, flow, wall and crowd; never solved, never worse than working it) and leave by rank. Save v46. 0.999.19.
- 2026-10-03 — Phase 18.2 built: the café's rush (a queue made in the order you choose) and the diner's floor (tables taken on a wave at a time); a play row beside each plain shift. 0.999.20.
- 2026-10-03 — Phase 18.3 built: the coach's roster (clients who stay, each an hour a session, a send's thanks) and the warehouse's picks (push-your-luck where a drop costs what you'd picked, the day moving the stop). Save v47. 0.999.21.
- 2026-10-03 — Phase 18.4 built: the comp ladder, League night to the Games, opt-in, a fixed field, points that fade; the Scene path, Comp Beast and three Record Book entries opened. Save v48. 0.999.22.
- 2026-10-03 — Phase 18.5 built: media; a post a day from what you did, sponsors with asks and stipends (followers alone pay nothing), a rival for the headline deal, threads answered by sending, and the film; the Influencer and four Record Book entries opened. Save v49. 0.999.23.
- 2026-10-03 — Phase 18.6 built: Send City bought by its head setter, its till drawn, covered or sold (criterion 4), the morning's line, upgrades and your own wall; Miller's Bluff bought, its nine lines bolted or cleaned and open for first ascents; two Record Book entries. Save v50. 0.999.24.
- 2026-10-03 — Phase 18.7 built: the ladders screen, a career bot per ladder and their harness; the grade curve compressed past V10 (Evan's call); followers saturate; the gym, the Games and the film tuned. Criterion 2: comps, media and business 8/8, outdoors 5/8. 0.999.25.
- 2026-10-03 — Phase 18 closed by Evan's call: criteria 1, 3 and 4 pass; criterion 2 passes for comps, media and business, and outdoors at 5 of 8 is accepted. CURRENT MILESTONE moved to Phase 14, the desktop and Steam build.
- 2026-10-04 — Phase 25 added by Evan's call: every gameplay feature before the Steam build; CURRENT MILESTONE moved to it from Phase 14. 25.1 built: guides, giving and a trait, the Record Book's last three entries. Save v51. 0.999.26.
- 2026-10-04 — Phase 25.2 built: guiding, a sixth job with its own day to plan, and an outfit of your own at Lead guide; Phase 25's slices planned with Evan's calls. Save v52. 0.999.27.
- 2026-10-04 — Phase 25.3 built: the mentee, a kid you coach at Send City from V7 whose grade passes to an heir as a head start; a Record Book entry. Save v53. 0.999.28.
- 2026-10-04 — Phase 25.4 built: an expedition team, a young pair's trip you pay for to an objective you've summited, their odds from your trips there and its weather; a Record Book entry. Save v54. 0.999.29.
- 2026-10-04 — Phase 25.5 built: comps outside the ladder, the Fall Festival dyno comp once a year and League night's season table (Evan's calls); two Record Book entries. Save v55. 0.999.30.
- 2026-10-04 — Phase 25.6 built: the people (Evan's calls): crew drama, a choice, a rift and a mend; the crew's texts back; the shops' small talk; a word from the crowd at a busy crag. Save v56. 0.999.31.
- 2026-10-04 — Evan's call: the download budget goes from 400 KB to 440 KB for 25.7 (394.8 KB after 25.6).
- 2026-10-04 — Phase 25.7 built: polish: a keepsake card for a trip, tappable glossary words, Miller's Bluff's own rock (and the line its six sport lines never had). Phase 25's criteria pass but for music, Evan's call. 0.999.32.
- 2026-10-04 — Music, made in code (Evan's call: synthesize it and see how it turns out): six moods by place and hour, in stretches with quiet between, ducked under talk and goes, a Music setting. Phase 25 closed by Evan's call; CURRENT MILESTONE moved to Phase 14, the desktop and Steam build. 0.999.33.
- 2026-10-04 — Phase 25's systems measured (Evan's call): a harness with no targets, numbers for the calls; the social bot taught crew drama, which it had never met (13 of 16 careers now). No numbers changed.
- 2026-10-08 — Evan's call: Phase 14 waits until he asks for it. Phases 26–35 added to deepen the game: a tune-up from the measurements, the rock by hand, the crew, the van lived in, getting older, after you, the Hollow, comps with rounds, money that means something, the road and the year. CURRENT MILESTONE moved to Phase 26.
- 2026-10-08 — Phase 26 built (Evan's calls: the outfit and gym stay, a Record Book entry for team summits on every objective, the A league for good, Mara in the Cave and Tam at the Gorge when their crags are shut). Crew drama in 16 of 16 social careers across three pairs; the A league from a season won; the dyno comp grows for three years; heirs graded by the mentee; the crowd clear of the lines; warnings lapse; the bots get Sage's lessons back. Its criteria pass; closing it is Evan's call. Save v57. 0.999.34.
- 2026-10-13 — Phase 26b, money in a day (Evan's calls, from playing it): a second shift a day at another job, day labor on the market's board, a family's rope at a busy crag, selling kit back at the gear shop, plasma at the clinic. From −$150, back to $0 in 2 to 4 days rather than 7 or 8. No save change. 0.999.35.
- 2026-10-13 — Phase 26 closed by Evan's call; CURRENT MILESTONE moved to Phase 27, the rock, by hand, planned with Evan's calls (the rock leans on styles, sandstone shut after rain, calling a flash, placing the pad). 27.1 built: each crag's rock, its skin, sandstone shut the day after rain, Moonstone's pads kept at Moonstone. 0.999.36.
- 2026-10-13 — Phase 27.2 built: the rock's beta. Every outdoor line's cruxes in moves written for its rock, 158 of them, none repeated as a crux's first way within a crag; the signature lines by hand; difficulty kept, the verb checked and the numbers carried from the beta each move replaces. 0.999.37.
- 2026-10-13 — Phase 27.3 built: wall pitches by kind. Seven kinds (face, crack, corner, chimney, traverse, roof, slab) set each pitch's length, crux and rest; 48 granite moves written for them; topos and the rock drawn by kind; no crux's first way or sequence repeats at a crag, its wall pitches counted. Each pitch within 0.16 of a grade of where it was. 0.999.38.
- 2026-10-13 — Phase 27's 27.4 split in two (the top-outs and the pad are now 27.5, the Big Stone and the close 27.6). 27.4 built: calling the flash or the onsight before a first go, psyche staked both ways outside the day's cap, "Called It" for ten called sends. Save v58. 0.999.39.
- 2026-10-13 — Phase 27.5 built: every highball tops out (a second crux at the lip, 36 rock moves, its window widened so no highball moves more than 0.2 of a grade); one fall height for the roll, the sheet and the bot; the extra pads cover the fall you choose, or the worse. No save change. 0.999.40.
- 2026-10-14 — Phase 27.6 built: four more lines at the Big Stone (Meadow Arête V8, The Erratic V11, an open V13 project by Evan's call, The Apron 5.13b), granite moves and a new top-out; Phase 27's three Done-when criteria pass; closing it is Evan's call. No save change. 0.999.41.
- 2026-10-14 — Phase 27 closed by Evan's call; CURRENT MILESTONE moved to Phase 28, the crew.
- 2026-10-14 — Phase 28 planned with Evan's calls (you pick the project, your send starts the train, two favours owed and no third, renown in lines only). 28.1 built: the crew's name, brought up by the crew once two are Regulars, named from your record or your own words. Save v59. 0.999.42.
- 2026-10-14 — Phase 28.2 built: the crew project (you pick it, two grades over your best), a crew day a week by text, the crew's goes showing you the way, and the send train when your send goes (Evan's calls); Send Train in the Record Book. Save v60. 0.999.43.
- 2026-10-14 — Phase 28.3 built: favours both ways (a shift covered, a rack, a ride; their belays, rides and loans), two owed and no third (Evan's call), and a clash of two asks as another way into crew drama. Outdoors' four-career target came out 3 of 4, the same rate as main over 16. Save v61. 0.999.44.
- 2026-10-14 — Phase 28.4 built: renown in lines only (Evan's call): the threads, Ray and Frank, the crowd and the shops say the crew's name more the more it's done. Phase 28's two Done-when criteria pass; closing it is Evan's call. No save change. 0.999.45.
- 2026-10-14 — Phase 28 closed by Evan's call; CURRENT MILESTONE moved to Phase 29, the van, lived in.
- 2026-10-14 — Phase 29 planned with Evan's calls (the van ages with miles; a used van or the Rig to replace it; new build-outs from parts; the budget to 460 KB). 29.1 built: the free pile, parts for a shelf, a solar panel, door seals and a bed platform; the bots go to the pile only on days off the rock. Save v62. 0.999.46.
- 2026-10-14 — 29.2 built: the Board's bounties (Evan's calls: double a job's worth, counted from when you take it, one cash, one parts and one split a week). The bots take cash only, measured on Outdoors. Save v63. 0.999.47.
- 2026-10-14 — 29.3 built: the van ages with miles, its engine's cap falls, and Dale puts it to you (rebuild, a used van, the Rig, or limp on). Every career bot hears it by year three (criterion 2). Save v64. 0.999.48.
- 2026-10-14 — 29.4 built: a recipe at the van plays the beat panel, and a meal cooked right adds to the night's sleep and psyche; the e2e cooks one (criterion 3). Phase 29's Done-when all pass; closing is Evan's call. 0.999.49.
- 2026-10-14 — Phase 29 closed by Evan's call; CURRENT MILESTONE moved to Phase 33, comps with rounds.
- 2026-10-14 — Phase 33 planned with Evan's calls (a go budget for the time limit; small finals; the Nationals podium makes the team; a roster of rivals per tier). 33.1 built: comps from Nationals up in rounds, a day apart; the comps harness measures them. Save v65. 0.999.50.
- 2026-10-14 — 33.2 built: comp rules. A clock on each problem (5 minutes in a qualifier, 4 after, a go a minute) caps its goes; isolation keeps everyone's beta off comp problems, and Sage no longer teaches the week's set mid-comp. No save change. 0.999.51.
- 2026-10-14 — 33.3 built: the field that comes back. Named rivals on each rung from the Circuit up, with grades by year, some going up a rung; Skye at the World Series and Nationals; the desk names the favourites and a comp names its winner. The field's tops roll go by go, so the top grade no longer wins every time. No save change. 0.999.52.
- 2026-10-14 — 33.4 built: Nationals first on the calendar and nothing on the same day; the Nationals podium makes the team, and only the team climbs the World Series; a finalist's morning has the pass. The e2e plays a qualifier and a final (criterion 2). Phase 33's Done-when both pass; closing is Evan's call. No save change. 0.999.53.
- 2026-10-15 — Phase 33 closed by Evan's call; CURRENT MILESTONE moved to Phase 34, money that means something.
- 2026-10-15 — Phase 34 planned with Evan's calls (perks on the jobs there are; your sends' photos sell; opt-in retainers and comp travel; trade shows and a film, light). 34.1 built: rank perks for the setter, the guide, the warehouse, the coach, the café and the diner, each said from its dial (criterion 2); the business bot minds its gym till it peaks. No save change. 0.999.54.
- 2026-10-15 — 34.2 built: the costs of ambition: a physio on retainer and a coach of your own, each weekly and opt-in, and travel to Nationals, the World Series and the Games. Save v66. 0.999.55.
- 2026-10-15 — 34.3 built: photos that sell (a camera, or one of the crew shooting; one a week to a magazine, capped under the poorest job's week) and a magazine piece once a year; the media bot uses both. Save v67. 0.999.56.
- 2026-10-15 — 34.4 built: a day on the sponsor's stand each cycle from Apex up; a film of your hardest line, paid for once; money tagged by where it came from, and the harness's money table (criterion 1). Phase 34's Done-when both pass. Save v68. 0.999.57.
- 2026-10-15 — Phase 34 closed by Evan's call; CURRENT MILESTONE moved to Phase 30, getting older.
- 2026-10-15 — Phase 30 planned with Evan's calls (a gentle curve with skill offsets, halved after measuring; slower recovery and healing; the runway from 35; insurance by age). 30.1 built: a go uses your skills as your years have them, said on the You page. No save change. 0.999.58.
- 2026-10-15 — 30.2 built: a night gives back less from 30, an injury lasts longer from 35, insurance costs more from 30; the odds of getting hurt don't move. No save change. 0.999.59.
- 2026-10-15 — 30.3 built: the runway from 35: a clinic at the Cave, a comp's problems set the day before, and a sponsor's ambassador terms (a clinic where it asked for a send); paid like work, under a job's. Save v69. 0.999.60.
- 2026-10-15 — 30.4 built: the epilogue says when a career ended and how, and a late bloomer who chose the day didn't run out of time; the ending harness's age table (criterion 1). No save change. 0.999.61.
- 2026-10-15 — Phase 30 closed by Evan's call; CURRENT MILESTONE moved to Phase 31, after you.
- 2026-10-15 — 31.1 built: what the old climber leaves: a share of the money, capped; half their standing with the old guard; what they did, kept for the family; their Record Book beside the kid's fresh one. Save v70. 0.999.62.
- 2026-10-15 — 31.2 built: the old climber at the fire: there the first night after dark and some nights after; a story from what the family kept; beta on a line they sent. No save change. 0.999.63.
- 2026-10-15 — 31.3 built: the old guard knows whose kid you are (Ray, Frank, the crowd, the shops); the line the old climber never sent, given at the fire, sent, and in the book. No save change. 0.999.64.
- 2026-10-15 — 31.4 built: the bot plays a family; the family harness (criterion 1, 4 of 4); the e2e's night at the fire with Robin. Phase 31's Done-when both pass. 0.999.65.
- 2026-10-15 — Phase 31 closed by Evan's call; CURRENT MILESTONE moved to Phase 32, the Hollow.
- 2026-10-15 — 32.1 built: the Hollow, a hidden slot canyon past the Gorge: seven open lines in its own sandstone, its painter, and no road you know of till it's found. 0.999.66.
- 2026-10-15 — 32.2 built: the Hollow's quest: an old-timer's word, the old hand's receipt and the old guidebook, from V9 outside; with all three, the walk in up the wash from the Gorge. Save v71. 0.999.67.
- 2026-10-15 — 32.3 built: first ascents in the Hollow: boulders cleaned, faces bolted, cracks cleaned for gear or bolted, your call; the old guard and the gym crowd hear about it, and the fire argues a bolted crack. Save v72. 0.999.68.
- 2026-10-15 — 32.4 built: your first ascents get repeated, and after a few the grade is the line's, not your call; you hear about it. A guide pays a little more for each line of yours in it, all of them under the poorest job's week. Save v73. 0.999.69.
- 2026-10-15 — 32.5 built: a bot looks for the Hollow, finds it and puts up lines there (the harness: 2 of 4, criterion 1); cleaning a line in debt no longer refused; the e2e walks in and cleans the split for gear. Phase 32's Done-when all pass. 0.999.70.
- 2026-10-15 — Phase 32 closed by Evan's call; CURRENT MILESTONE moved to Phase 35, the road and the year.
- 2026-10-15 — 35.1 built: the hitchhikers you haven't met come first, and none a third time before everyone's come once; four more on the road; the old hand waits at the Gorge pull-off while his clue to the Hollow is due. Save v74. 0.999.71.
- 2026-10-15 — 35.2 built: every roadside stop has two ways to spend it, each a trade of minutes for what it gives, the card saying which from the numbers; a photo for the feed brings followers. No save change. 0.999.72.
- 2026-10-15 — 35.3 built: the people you help at the van door come back once, weeks later, with a thank-you; the ones you turn away are remembered in a line. Save v75. The download budget to 470 KB (Evan's call). 0.999.73.
- 2026-10-15 — 35.4 built: the four holidays are a scene at the fire when your people are about: the Sendsgiving potluck, headlamps on the boulders, the opener's eve, the solstice fire; three ways to spend each night. Save v76. 0.999.74.
- 2026-10-15 — 35.5 built: the content tests hold every line of the road and the year to one set of rules, old lines and new; one old knock line spelled out. Phase 35's Done-when both pass; the music's second pass waits on Evan's ear. 0.999.75.
- 2026-10-15 — Phase 35 closed by Evan's call; the deepening run (Phases 26–35) is done. CURRENT MILESTONE moved to Phase 14, the desktop and Steam build.
- 2026-10-15 — 14.1 built: the arrows and a controller move focus to the nearest button that way; A presses and holds, B puts things down, Start, Select and Y (M, J and P on a keyboard) are the journal, the map and the plan; the first screen offers a name; the e2e plays a day by controller alone. No save change. 0.999.76.
- 2026-10-16 — 14.2 built: the game's keys go through one seam the desktop build can hand a file to; Export and Import save, from Settings and the first screen, a file that won't load turned away with why, one that will asking first. No save change. 0.999.77.
- 2026-10-16 — 14.3 built: the desktop build: the game in an Electron window from `app://`, its keys in a file in the user-data folder for Steam Cloud, full screen and Quit; a smoke test in CI, and a workflow that packs Linux, Windows and macOS. No save change. 0.999.78.
- 2026-10-16 — 14.4 built: Steamworks behind a stub: the Record Book's entries unlock as Steam achievements (each as it's earned, and everything ever earned at launch), Steam's overlay when Steam starts the game, and `desktop/STEAM.md` for the Steamworks site (the app ID, the 51 achievements, Auto-Cloud's paths). No save change. 0.999.79.
- 2026-10-16 — Evan's calls for the demo: strip the places and the story; end after Dex's race; a last card, the save to export, and stop.
- 2026-10-16 — 14.5a built: the demo build (`npm run build:demo`): Act I and Dex's race week at the Lot, in town, at Roadside and the Gorge; no story after Act I; over the morning after the race is decided, on a last card with the save to export. No save change. 0.999.80.
- 2026-10-16 — 14.5b built: the demo's build lacks the full game: the later crags' lines, walls, words, rock, layouts and scenes, Acts II to V and The Line, the expeditions and the Hollow, swapped for empty twins; nobody in the demo is anywhere it doesn't go; a full game's save is turned away; CI's content diff finds none of 3,066 full-game strings in the demo's build. No save change. 0.999.81.
- 2026-10-16 — 14.6a built: the marks the fonts lack (✓ ✕ ○ ← and the suits) drawn, and a test against the fonts' own character maps; B skips the stove, focus waits on the way out of every minigame, and a pad's button shows beside a minigame's controls; a frame meter in Settings; the controller day plays the stove and the speed wall. No save change. 0.999.82.
- 2026-10-16 — 14.6b built: rebinding the pad's buttons and the keys in Settings, a role going down only with its button; on the desktop, a Deck's button names and Steam's floating keyboard for text fields. Done-when 1 and 4 pass; 2 and 3 are Evan's (a Deck, the Steam app). No save change. 0.999.83.
- 2026-10-16 — The download budget to 490 KB (Evan's call), for Phase 15's demo; 466.3 KB after Phase 14.
- 2026-10-16 — 14.5c built: the demo keeps its keys under `dirtbag.demo.`, so it never meets the full game's save; the full game offers to carry on with a demo climber it finds beside it. No save change. 0.999.84.
- 2026-10-16 — Phase 14 closed by Evan's call: controller-only Act I and the demo's content diff pass; 60 fps on a Deck and achievements and Cloud in the Steam dev branch are carried to Evan's hardware and account. CURRENT MILESTONE moved to Phase 15, the demo, the store page and Next Fest.
- 2026-10-16 — Phase 15 planned with Evan's calls: Next Fest June 2027; the demo on Steam now, on the web and Play with Phase 19's split; an error screen in place of crash dashboards; the store page localized later. 15.1 built: Steam's capsules and library art drawn by the game's painters, screenshots for Steam and Play from the build (`npm run store:art`), and the copy for both, its facts held to the content by a test.
- 2026-10-16 — 15.2 built: a crash shows an error screen, not a blank page: the save is safe, a reload, the save as a file, and what went wrong (nothing from the save) to copy; carrying on past an error outside React. The privacy page says so. No save change. 0.999.85.
- 2026-10-16 — 15.3 built: the desktop code packs the demo as "Dirtbag Demo", with its own user-data folder and Steam app, its last card opening the full game's store page in Steam's overlay; the error screen's mail through the desktop's bridge; the game's icon on the executables. CI plays the demo's desktop build. No save change. 0.999.86.
- 2026-10-16 — 15.4 built: the press kit (`docs/PRESSKIT.md`, zipped by `store:art` with the art and shots), the trailer's beats a click each (`/trailer.html`), and the shot list. Done-when: criterion 4 passes (the full harness, the demo's bots, both e2es); 1 to 3 are Evan's (the Steam apps, wishlists, outreach). No change to the game.
- 2026-10-16 — Phase 15 closed by Evan's call, its code done: criterion 4 passes; the Steam apps, the wishlists and the press outreach (1 to 3) carried to Evan, to Next Fest. CURRENT MILESTONE moved to Phase 19, monetization, store readiness and beta.
- 2026-10-16 — Phase 19 planned with Evan's calls: the web plays the first season at launch, and climbers from before keep the full game; Android keeps the TWA, with Play's unlock through Digital Goods; iOS after launch; the audit's prices. 19.1 built: the gate, off until launch (`game/unlock.ts`, `DIRTBAG_GATE`): the full game's build plays the demo's rules till it's unlocked, on the same keys; climbers here are marked as from before, and the first gated start marks the rest; `e2e:gate` on a gated build, in CI. No save change. 0.999.87.
- 2026-10-16 — 19.2 built: Play's unlock in the Android app. The page buys through the Digital Goods API and Payment Request at Play's price, counts it once Play lists it, and restores it at start-up and by hand; the app acknowledges each purchase on the phone (Evan's call, since version 2 of the API has no acknowledge and Play refunds what isn't), from `twa/PlayAcknowledger.java` hooked into Bubblewrap's project by `twa/acknowledge.mjs`. The locked last card offers it in the app, and store pages elsewhere. No save change. 0.999.88.
- 2026-10-16 — 19.3 built: the paperwork. The privacy page brought up to date (the host, each store's part in a purchase, the Android app's unused notification permission, deleting by platform); terms of use written new (`terms.html`, shipped beside it, both checked); the stores' forms answered from the code (`docs/PAPERWORK.md`: Play's data safety, the IARC questionnaire with its simulated gambling, the target audience, Steam's content survey); Play's listing for launch in `docs/STORE.md`. No change to the game. 0.999.89.
- 2026-10-16 — 19.4 built: the beta kit. The error screen's report ends on where the game was and the last twelve moves (`game/trail.ts`; no typed names); a tester's link (`?gate=try`) shuts the gate for one tab so Play's unlock can be tried before launch; the locked full game no longer sets a full climber's save aside at start-up, it holds them at the last card (`demoOver`; only the demo's build refuses one); Settings shows the version; `docs/BETA.md` (two rounds, the link, reporting, severities that gate launch) and a beta issue template. Phase 19's Done-when checked: 2, 3 and 5 pass; 1's real stores and 4's beta are Evan's. 0.999.90.
- 2026-10-18 — Evan's call, before Phase 20: ten more phases, 36–45, to make the game more its own and easier to play (the games at the fire played in full, the session, a ghost of your best go, each crag's classics, "What now?" from Hazel, the forecast and send temps, belaying played, the van laid out, the setter's wall by hand, the problem of the day); the download budget raised as needed. Phase 19 stays open on its real stores and its beta, his. CURRENT MILESTONE moved to Phase 36, planned with his calls: Perudo with everyone at the fire; game after game till the fire's out, and a glovebox deck outside the career; limit hold'em with everyone; blackjack with splits and your own bet.
- 2026-10-18 — 36.1 built: liar's dice is Perudo, with everyone at the fire, drawn: five dice each under a cup, ones wild, bids round the fire, a call costing whoever's wrong a die, the last cup taking it; Hazel, Sage and Frank each bid in their own style from their own cups; game after game till the fire's out at 1 AM; bond once a day as before. Save v77. 0.999.91.
- 2026-10-18 — 36.2 built: blackjack drawn, with your own bet ($5 or $10) and a pair split once (aces a card each), hand after hand till the fire's out, each hand its minutes; the played hand left face up on the table till the next deal. Save v78. 0.999.92.
- 2026-10-18 — 36.3 built: hold'em round the fire with everyone who plays, fixed limit: $1 and $2 blinds and the button going round, four streets with a raise reopening the betting, your all in for the money that matched yours, Frank at the table, and each person's tells once you've the second read on them; hand after hand till the fire's out, drawn. Save v79. 0.999.93.
- 2026-10-18 — 36.4 built: the glovebox deck, on the van's card any time: liar's dice, blackjack and hold'em against Hazel, Sage and Frank for a box of matches, on a copy of the climber that's never saved, so no time passes and nothing carries over. No save change. 0.999.94.
- 2026-10-18 — 36.5 built: each of the fire's games by its full rules in the e2e, in the glovebox (liar's dice to the last cup, blackjack doubled and split, hold'em raised and folded); out of dice with others still in, the last line says they play it out without you; the season harness on the build, 12 of 12. Phase 36's Done-when all pass; closing it is Evan's call. 0.999.95.
- 2026-10-18 — Phase 36 closed by Evan's call: all four criteria pass. CURRENT MILESTONE moved to Phase 37, the session.
- 2026-10-18 — Phase 37 planned with Evan's calls: the cast who boulder and nameless locals; busy days at the boulders, once a day; falls adding up to a find, shared or kept; bond, the old guard and the day's first send. 37.1 built: the session, joined from a problem's beta, its rounds, finds, share or keep, and First to the Top in the Record Book. Save v80. 0.999.96.
- 2026-10-18 — 37.2 built: a session played in the e2e (a find told, its pay checked against the card's words, the goes to the end); the harness measures sharing against keeping, and the dials are retuned so that keeping a find buys a better shot at the first send (26% against 10%); nobody sessions a problem over its grade. Phase 37's Done-when pass; closing it is Evan's call. 0.999.97.
- 2026-10-18 — Phase 37 closed by Evan's call: both criteria pass. CURRENT MILESTONE moved to Phase 38, a ghost of your best go.
- 2026-10-18 — Phase 38 planned with Evan's calls: your best go at its pace, on every line you're working, gone once it's sent. 38.1 built: each go keeps its pace; a line keeps its best go's till it's sent; the wall draws it, faint, beside your next go; a switch in Settings; a set that comes down takes its ghosts. Save v81. Phase 38's Done-when pass; closing it is Evan's call. 0.999.98.
- 2026-10-18 — Phase 38 closed by Evan's call: both criteria pass. CURRENT MILESTONE moved to Phase 39, each crag's classics.
- 2026-10-18 — Phase 39 planned with Evan's calls: five hand-picked classics a crag; a local waits for nothing on a busy day, finds the beta on a quiet one, and earns an entry; your settled first ascents join the list. 39.1 built: the classics, the card, the Record Book's 53rd entry; no save change. Phase 39's Done-when pass; closing it is Evan's call. 0.999.99.
- 2026-10-18 — Phase 39 closed by Evan's call: all three criteria pass. CURRENT MILESTONE moved to Phase 40, "What now?" from Hazel.
- 2026-10-18 — Phase 40 planned with Evan's calls: a "What now?" button by the goal chip; needs, then the story, then chances; each move takes you there. 40.1 built: Hazel's card of three moves, every reason from the state; lit through Act I's mornings till asked. No save change. Phase 40's Done-when pass; closing it is Evan's call. 0.999.100.
- 2026-10-19 — Phase 40 closed by Evan's call: both criteria pass. CURRENT MILESTONE moved to Phase 41, the week's forecast and send temps.
- 2026-10-19 — 41.1: the valley's forecast and send temps, to Evan's calls. The café's radio calls the next five days, right nine times in ten tomorrow and six in ten five days out, and says how sure ("Prime, likely"). The week sheet marks each day's call, Tonight calls tomorrow, and the beta sheet says what the day's sky does to every window. The season harness's target 12: it comes true as often as it says. Both Done-when criteria pass. 0.999.101, no save change.
- 2026-10-19 — Phase 41 closed by Evan's call: both criteria pass. CURRENT MILESTONE moved to Phase 42, belaying, played.
- 2026-10-19 — 42.1: belaying, played, to Evan's calls. "Want a belay?" at the crag, and the crew's belay favour, put a partner's rope in your hands. Keep the slack in the band as they climb and clip, then brake and give for a soft catch. A belay is the day together, never on top of one; a clean belay gets you a beta on your line, and a hard catch gets you their grumble. The season harness's target 13: it can't out-bond a day climbing together. Both Done-when criteria pass. 0.999.102, no save change.
- 2026-10-19 — Phase 42 closed by Evan's call: both criteria pass. CURRENT MILESTONE moved to Phase 43, your van laid out.
- 2026-10-19 — 43.1: the van, laid out, to Evan's calls. "Lay out the van" opens its floor and roof as grids: the bed, the kitchen, the shelf and the heater on the floor, the solar panel on the roof. Move, turn or take out anything but the bed, which stays in and needs its length; the door stays clear, and nothing sits on anything. Where things go changes no rule. A new van or the Rig starts its own plan, and a save from before loads laid out. Both Done-when criteria pass. Save v82, 0.999.103; the download budget 500 KB, by his call.
- 2026-10-19 — Phase 43 closed by Evan's call: both criteria pass. CURRENT MILESTONE moved to Phase 44, the setter's wall, hands-on.
- 2026-10-19 — Phase 44 planned with Evan's calls: holds on a grid where reach counts, today's grade plus reach shown live, and a set that stays up for the week, a climbable problem you name. 44.1: the setter's panel. The bucket's holds go on squares from the bottom up, and a long reach makes a move harder; the grade and the brief's checks follow every hold. 0.999.104, no save change.
- 2026-10-19 — 44.2: the set stays up. A set you hang goes up on a panel at the end of Send City's wall under the name you give it, a problem like the gym's own, its holds where you put them, climbable till the week's reset; its id carries it. Both Done-when criteria pass. Save v83, 0.999.105.
- 2026-10-19 — Phase 44 closed by Evan's call: both criteria pass. CURRENT MILESTONE moved to Phase 45, the problem of the day.
- 2026-10-19 — Phase 45 planned with Evan's calls (one line, one day; one climber for everyone; a card to save or share). 45.1 built: the day, drawn from the date, played in its own slot, with its sheet, the ways in, the tests, the smoke's offline day and the e2e. Budget 510 KB. 0.999.106.
- 2026-10-19 — Phase 45.2 built: the day's card, its date, line and goes or high point, saved or sent on from the device. Phase 45's Done-when both pass; closing it, the last of the ten, is Evan's call. 0.999.107.
- 2026-10-19 — Phase 45 closed by Evan's call, the last of the ten: both criteria pass, and the day's card stays without a link. CURRENT MILESTONE moved to Phase 20, launch, live updates and the Unreal decision.
- 2026-10-19 — Phase 20 planned with Evan's calls: the code side before launch is What's new, a launch checklist and a seasonal event with no server; 1.0 waits for his word. 20.1 built: What's new, from one notes file that Play takes too. 0.999.108.
- 2026-10-19 — 20.2 built: the launch checklist (`docs/LAUNCH.md`), and README's status brought up to date. Evan's calls for 20.3: a crag day at Moonstone in winter, trail work and a scramble, standing, a prize and the night.
