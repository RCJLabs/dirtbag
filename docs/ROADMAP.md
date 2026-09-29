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
| 13 Sound and feel | Built on the rebuild (effects and ambience made in code, the licence ledger, credits) and closed by Evan's call. Criterion 4 (music) carries with the music decision; criteria 1 and 2 wait on an ear. |
| 14 Desktop and Steam, 15 Demo and store page | Moved after Phase 18 by Evan's call: the full game first. |
| 21 The climber, 22 The life, 23 Who you are | Added by Evan's call after the gap check; they run before 16. Phase 21 is the current milestone. |
| 16 The spine | Next after 21–23. |
| 17–20 | Unchanged in intent. They target the new build. The order from here: 21, 22, 23, 16, 17, 18, then 14, 15, then 19 and 20. |

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
5. A player downloads under 250 KB, fonts included.

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
| E. Make the full game worth paying for | 21–23, then 16–18 | The climber (gear, trad, training, crags past Act I), the life (van, body, food, hustle, games), who you are (origins, stances, Record Book); then the story spine and ending, the people, careers and jobs | 32–49 weeks |
| D. Get it in front of people | 14–15 | Desktop/Steam build, then the demo, store page and festival: after the full game, by Evan's call | 4–6 weeks |
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

### Phase 21 — The climber: gear, trad, training, and the crags past Act I   **<<< CURRENT MILESTONE**

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
2. No game, meal or hustle is a farm: the harness finds none that out-earns or out-bonds its time.
3. Every event and game has a sound and an e2e step.

**Depends on:** Phase 21 (the van carries the rack). **Effort:** ~8–12 weeks [INFERRED].

---

### Phase 23 — Who you are: origins, paths, stances, and the Record Book

*Added 29 Sep 2026 by Evan's call. Runs after Phase 22, before Phase 16, which keys its epilogues to all of it.*

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

---

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

## Stage D — Get it in front of people

*Moved here by Evan's call (29 Sep 2026): the whole game gets built first, and the Steam build, the demo and the store page come after it. The phase numbers stay as they were, so older references still find them.*

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
