# Dirtbag audit: META-PROGRESSION
### Competitions, character identity, goals, endings/legacy

Scope: comps (circuit, national team, World Cup, Olympics, leagues, dyno comp, speed, gym hosting), rivals, character creation and identity, goals/quests/challenges/feats, factions/clubs/stances, retirement/legacy/modes.
All line numbers refer to `$SRC/bundle.pretty.js`. **[E]** = ESTABLISHED (read in code or data). **[I]** = INFERRED (my reasoning or simulation).
Throwaway models live in `$SP/work-meta/` (`ur_summary.js`, `pace.js`, `compsim.js`, `compsim2.js`).

> **Correction to the brief:** `im` (31399) is **not** the endings table. It is the **ORIGIN** table ("Sold It All", "Gym Rat", "Desert Local", "Ex-Gymnast", "Late Bloomer", "Trust-Fund Kid"). The game has **no table of ending types**. Its only terminal states are the RETIRED tally screen (101641) and the RUN OVER screen (102044: broke / starved / fell). **[E]**

---

## 1. Summary

1. **The spine is numeric only.** The HUD "GOAL" pill (57846–57915) walks a 15-rung ladder `$R` (33877): V1 → $200 → V3 → $500 → V5 → $1,500 → V7 … V17 → "first ascent of the impossible" (V18 `genesis` or 5.16a `sport_myth` at The Crucible). No narrative is attached to it. The only `cat:"main"` quest ("Your First Season", 34982) ends at V4, around day 10. After that, everything is a buffet of 15 side quests plus about 25 parallel progress systems. **[E]**
2. **There is no win state.** Sending the V18 myth line opens the same FA-naming modal as any other first ascent (49092–49109). The HUD then just says "The impossible is yours — find the next". The de facto ending is **retirement**: voluntary from age 30 (day 145), forced at 45 (day 415). It has a good tally screen (101641–102043), then wipes the save into a new generation. **[E]**
3. **Critical progression bug (cross-lane).** Five code paths clamp a skill to **0–100**, but the grade curve needs average skill ~100 for V5, ~320 for V10 and ~922 for V18 (`Nd`, 16190; dev panel 72022 "330 = ~V10"). The paths are league nights (37879, 37881), hitchhiker choices (44843), café regulars (44902) and a coaching session with your retired rival (50735). One King-of-the-Cave night silently drops a V8 player to about V6. **[E]**
4. **Comps are the best-built meta system and genuinely interactive.** Each attempt is a real-time minigame, rounds run on an 80-second clock with 7 goes, and structure goes quals → semis → finals, plus an 8-person speed bracket, observation and scouting. **But every field is rubber-banded to the player's own grade** (50290–50301, 43950–43977), so getting stronger never makes a tier easier. At National tier, and at the World Cup and Olympics, results depend on the Scene-path / Comp Beast score-multiplier stack (up to ×2.07), not on climbing. Simulation: national-tier win 0–2% without the stack vs 8–83% with it. **[E] mechanics, [I] sim**
5. **Comps are opt-out with a recurring penalty.** A 5-comp circuit is auto-scheduled from day 4–6 (29156). Every missed comp costs −2 rep and **−4 standing, unclamped** (40513–40515). The rival banks +60 points, the comp re-queues, and the season can never end unless you attend (40502–40506). A brand-new player who misses comp #1 becomes a "kook" (standing < 0, 17748). A Purist who never competes is taxed forever. **[E]**
6. **Character creation is rich and well-written**: 6 steps (Origin, Build, Style, Calling, Flaw, Look) plus a pre-run mode choice, with synergy warnings computed live (100653–100733). Hidden random talents and emergent quirks add depth. **Mechanically**, archetype is a head start that washes out by about V5 (diminishing returns `hi`, 28550). Origin, calling, flaw, talents and paths give permanent 5–35% modifiers. **Narratively**, every combination plays the same quests, comps and ladder. **[E]/[I]**
7. **Legacy is a thin reset, not a dynasty.** The heir keeps a skill seed (≤ (45 + 2×mentee grade) × 5 ≈ 275 points, roughly a V3.5 start), up to 2 boons and the signature moves (53047–53075, 53175–53214). **Everything else resets to day 1**: money, gear, crew, dog, gym, followers, feats, quests, onboarding, even the forebear's named first ascents (`faNames` is part of the default state, 14458). The retirement epitaph "You put up a first ascent that'll outlive you" (101658) is contradicted one screen later. **[E]**
8. **Goal-tracker sprawl.** About 28 progress systems exist. Many celebrate the same moment: first V10 can fire a feat (+22 rep), a story card, a ladder toast and possibly a calling rung. There are three weekly task boards with near-identical criteria (café `lH` 22300, weekly `jO` 22614, club `Ate` 22406), plus daily `SO`. "World Class" exists twice (17840 feat, 18059 milestone). **[E]**
9. **Continuity defects around the rival and the heir.** On rival turnover, `dexStage` is not reset (51958–51965), so a stranger greets you like an old friend. The alliance/partner slot is hard-wired to "Dex Calloway" (20761, 54387). The "Past the Rival" card hardcodes "Dex" (31974). Generation 1 has no name, so "THE TORCH PASSES" never fires in generation 2 (53072, 38696–38731). The Late Bloomer gets the broken "Turning 28" recommit dialog on day 1 (36581). **[E]**
10. **What to preserve:** the comp engine; the writing voice (retirement tally, national-team selection reasons at 29484–29602, rival post-comp beats at 39491–39551); emergent quirks; creation synergy warnings; paths with active abilities; stances with echoes; the diary (about 66 life-log sources).

---

## 2. How it works: mechanics, numbers, formulas

### 2.1 Clocks: two different "years" **[E]**
| Clock | Constant | Used by |
|---|---|---|
| Season = 14 days | `Bl=14` (20387); `Bt(d)=floor((d-1)/14)%4` | weather tables, "Send Season" quest |
| Calendar year = 56 days | `vv=Bl*4` (20629) | holidays `aZ` (20630), YEAR N IN REVIEW (36612–36630), Olympics cadence `S4=56` (29245) |
| Age year = 18 days | `Tr=18` (25975); `hn(d)=22+ageOffset+floor((d-1)/18)` (25977) | age, retirement, tax day, rival age `uC` (19360), dog age, the "A Year on the Road" story card (age ≥ 23 → day 19, 32005), the "Dirtbag Year" milestone (day ≥ 18, 18051) |

Consequence: you age about 3.1 years per calendar year. "A Year on the Road" fires on day 19, but "YEAR 1 IN REVIEW" fires on day 57.

### 2.2 Career timeline (22-year-old start) **[E]**
| Day | Event (line) |
|---|---|
| 1 | Creation; "Your First Season" auto-starts (needs day ≤ 3, 34985); GET STARTED 0/7 (34106) |
| 4–6 | Circuit comp #1: `oW` = day + 3 + rand(0..2) (29156); then every 6–8 days (`LC=6`, `PC=3`) |
| ~15 | Mentee available at V5 & rep 25 (`gA` 52962) *[I: day from pace model]* |
| 18–19 | "The Dirtbag Year" milestone and "A Year on the Road" story card |
| 56 | First Olympics: `max(day+21, ceil(day/56)*56)` (40283) |
| 57 | YEAR 1 IN REVIEW banner (36612) |
| 109 | Age 28 → "Turning 28" path recommit dialog (`EN=28` 32437; 36581) |
| 127 | Rival stops improving (rival age 31, `nJ`, 19354) |
| 145 | Age 30 → "Hang it up" appears at the van (`SI=30` 26089; 54915) |
| 181+ | Rival age ≥ 34 → retires with 2%/night chance (`oJ/Bl`=0.28/14, 51084); mean ≈ day 230 [I]; power/fingers decline from age 32 (`C2` 25979) |
| 235 | Age 35 → "elder" standing `_y` accrues (26068) |
| 415 | Age 45 → **forced retirement on next sleep, with no warning anywhere** (`use=45` 26091; only other reference 52516) |
Late Bloomer (`ageAdd:10`, 31457) starts at 32: retire button on day 1, forced retirement on day 235, recommit dialog on day 1.

### 2.3 Character creation (JG 53161; UI 100608–101330) **[E]**
Before creation, a mode screen offers **Normal** ("There is no free soloing in this game at all") or **Free Solo** (outdoor sport and big-wall pitches are soloed; a fall ends the run with "no next climber"; minigame windows are tighter via `Ou`/`Vz` 25441–25442) (100509–100600). `mode` has no other values.

| Step | Table | Options | Mechanical effect |
|---|---|---|---|
| Origin | `im` 31399 | 6 | Start cash $30–400; ±2–6 skills; permanent perk: +12% shift pay (Sold It All), +12% indoor gains (Gym Rat), −8% daily cost + Nerve T1 (Desert), +12% training + Crusher T1 (Ex-Gymnast), −35% insurance & start age 32 (Late Bloomer), −30% shop & −8 rep (Trust Fund); personality seeds |
| Build | `ZC` 31796 | 4 | `Wl` (31841): ±2–5.4% send odds by route type, clamped ±8% (Lanky dyno +4%/crimp −3.6%; Compact crimp +5.4%/technical +5%/dyno −3.75%; Powerful power +3.3%/endurance −3%) |
| Style (archetype) | `sm` 30700 | 4 | Starting skills only (Boulderer P12 F10 E4 T5 H6; Rope Gun E13 H11; Technician T13 F9; All-Rounder 8×5). No ongoing effect. |
| Calling | `jh`/`_3` 31864/31891 | 4 | Perk (Purist +15% gains from outdoor sends; Send-or-Bust +5% first-go & +10% injury; Lifer −20% nut & −25% injury; Influencer +50% followers & +30% content $); personality seed (±25–55, immediately crossing the ±40 effect thresholds in `gN` 32081); faction shifts `Ife` (30804); 3-rung "Ambition" worth +50/+95/+160 rep (48575–48984) |
| Flaw | `XC` 30726 | 5, mandatory | Gumby technique ×0.5; Hard Gainer power/fingers ×0.7; Fair-Weather ×0.5 gains below 50 energy; Happy Feet −10% technical; Tweaky Fingers ×1.8 finger injury (`hR` 31853, `oN`) |
| Look | cosmetic | — | **No name entry** (101153–101330) |
| (hidden) Talents | `QC` 31474 | 1 good of 6 + 1 bad of 5 (`fge` 31788) | ×1.35 or ×0.7 gains on one skill; Bomber ×0.55 / Glass ×1.7 injury. Revealed after 4 reps (`rge=4`). `zL` (31572) adds ×1.15/×1.25 if a talent aligns with a chosen path or calling. |
| (emergent) Quirks | `sge`/`dge` 31598/31670 | 8 | First quirk after 30 climbs, second after 90 (`ige`/`lge`; 51102–51108). Chosen from habit ratios: e.g. Comp Beast at 6+ comps (checked first), Stone Purist at ≥ 85% outdoor. `pickable` flags are unused. |
| Paths | `Es` 30589 | 5 × 3 tiers, max 2 paths (`gv=2`) | Manual claim (QG 53104). Tier gates: Power 30/75, Fingers 60/90, Head 30/55/85, 4 dyno / 4 crimp sends, 3 podiums / season title / 1k followers, 6 trips / 25 / 80 lot nights. Tier 3 grants a daily active ability (ZL 42212). Mastery +35 rep (`IW`). Dirtbag+Scene "contradiction": comp score ×0.92 (`Tfe`). |
| Auto traits | `kfe`/`jfe` 30644/30658 | 10 hybrids (two skills ≥ 60) + 6 style masteries (40 sends of a type) | +4–8% odds, ×1.1–1.15 gains, ×0.85 injury |
| Signatures | 44737–44750 | 2 | Named at 15 and 40 sends of a type; +10% odds on that type (`Iv`), +12 rep; **inherited** by heirs |
| Personality | `yt`, `gN`, `H1` 32034–32081 | 4 axes, ±100 | Effects at ±40: purism changes rep from rock vs plastic (`Uge`), social changes partner availability, boldness changes first-go odds vs injury, discipline gives gains ×(1 + d/500). Drifts with play (e.g. outdoor send purism +2, gym send −1). |

**Scale check [I]:** starting average skill ≈ 8 (V0.8). Gains are ×`hi(s)=1/(1+s/40)`, so two climbers 7 points apart converge. Solving ds/dt ∝ 1/(1+s/40), the archetype gap is ~2.4 skill points at s=100 and <1 at s=320. Archetype is early flavour only.

### 2.4 Goals and structure **[E]**
- **Onboarding** `h$` (34106): 7 actions (enter, work, eat, sleep, gym send, rest, crag send) shown as the HUD "GET STARTED n/7".
- **Goal ladder** `$R` (33877). Checked by `$pe` (33949) against **average skill** (`ot(skills) ≥ Nd(g)`), not against sends. After the summit: "The impossible is yours — find the next" (57860).
- **Quests** `ur` (34980–35735): 16 quests (1 main, 15 side), 41 stages, 48 objectives, about 2,500 words. The engine `Vpe` (35736) runs on every state change (`useEffect([e])`, 38692). Start conditions: `L$` (34808). Objectives: `JL` (34866), counting sends since the stage started (`u$` 34877). 13 side quests need a turn-in to a giver (spot / NPC / ghost). **No quest has a deadline or a failure state.**

| Quest | Gate | Arc summary (final reward) |
|---|---|---|
| Your First Season (main) | day ≤ 3 | $60 → 3 sends → 2 outside → 15 rep → skill-grade V4 ($40, 6 rep) |
| The Local's Project | rep 6 | 3 outside → 2× V6 outside → V7 outside ($120, 250 f) |
| Get Seen (Rhea) | 200 followers | 5 sends → V8 + 1.5k followers ($200) |
| The Lost Line (Verle) | V6 & rep 8 | 3 outside → Mesa + V9 there → **FA at Mesa = only open line `sm_open` V13** ($300) |
| The Rival's Gauntlet | V5, 1 comp, not allied | beat rival at 1 + 2 + 1 comps ($400, 900 f) |
| The Tower's Due (ghost) | Halloween day & V10 | 3× V10 outside → Obsidian pitch 3 → summit ($500, 1,200 f) |
| Chasing Light | 100 followers | camera → keeper shot + 1k f → mirrorless + 3k f ($250) |
| The Lake Record | visit lake | catch the Lunker ($140) |
| Send Season | Fall & V6 | 5 outside "this season" (not enforced) → V8 outside ($180) |
| The Vagabond | V5 | visit 4 crags → V7 outside ($220) |
| Sage's Project | Sage bond 3 & V6 | 2× V6 → V8 outside ($90 + bond) |
| Hazel's Pilgrimage | Hazel stage 5 | Wind River + V9 there ($100) |
| One More Thing | allied & V8 | Big Stone + V9 there ($150 + Dex bond) |
| The Lost Crag (Cormac) | Vagabond done | 2 outside → V9 outside → "find the canyon" (auto) → unlock Hollow |
| Old Guard (Petra) | visited Olympic Village | V9 indoors → V10 indoors ($60) |
| The Language of the Wall (Ana) | visited Olympic Village | eat at village diner → send at Games ($40, 700 f) |

- **Callings:** 4 × 3 rungs (e.g. Purist: V8 / V11 / V14 outdoors; Influencer: 1k with sponsor / 10k / 50k pro). Checked only inside the send handler (48575–48984).
- **Task boards:** café board `lH` (10; 4 offered per week by seeded hash, max 3 active `h2`, 7-day deadline, **manual claim at the café**, 47740–47775). Daily `SO` (7; auto). Weekly `jO` (5; auto). Club jobs `Ate` (16, 4 per club; auto-resolved at night, +14 club rep, −6 if expired, 51575–51592).
- **Feats** `f1` (17766): 29 in 5 categories. Rep 0–80 each (sum 529) plus psyche; +40 rep per completed category of ≥ 3 feats (36517–36539). "Fired" and "Clamped" (van booted) are required for their category bonuses.
- **Lifetime Milestones** `k8` (18031): 5, banner only, no reward (36558–36567).
- **Story moments** `mge` (31958): 8 story cards in `storySeen`, no reward.
- **Grade consolidation** `TO` (22658): 5 sends at a grade → +6 + 2×grade rep and +2 head.
- **Dreams** `G3` (23405): Dream Rig $2,800 (van cost ×0.5), War Chest $5,000 (expeditions ×0.5), Home Base $9,000 (no daily cost or bills).
- **Expeditions** `Gy` (23321): El Cap (V7, rep 60, $900, 10 d), Cerro Torre (V10/140/$2,200/16 d), Trango (V12/240/$4,500/24 d).
- **Own a gym:** `Mu` = $25,000 (23429).
- **Nemesis project:** player-declared siege line, +20 + 4×grade rep on the send (48999–49016).
- **Homecoming:** after ≥ 3 diary entries you arm it; your next outdoor send pays +$200, +15 rep, +400 followers, +20 psyche, once per life (45593–45602; 48843–48870).
- **One smart suggestion** `wA` (53268–53356): a priority chain of about 22 rules returning one line (urgent/warn/go/info). The fallback is "Chip at your goal: …".
- **Guidance layers:** 12 contextual tips `Ope` (34020), 21 HUD-chip glossary entries `Upe` (34899), 9 Hazel hints `mpe` (33601).

### 2.5 Competitions **[E]**
**Circuit.** Disciplines rotate each circuit season: `Pi(s)`: 1 = sport, 2 = speed, 3 = boulder (29272). Bouldering runs at The Cave; sport and speed at Send City (`hv` 29273). 5 comps per season (`gi`); the 5th is "Finals" with ×1.5 circuit points (`Mce`).
- **Entry** (50258–50333): $20 (`tW`; free with the Program Captain perk), ≥ 30 energy, costs 30 energy, 14 hunger, 6 hours.
- **Format.** Bouldering quals: 5 problems at player grade [−1, 0, 0, +1, +2], 7 goes (`$y`), **80-second real-time clock** (`aa`; ticking at 44466–44472). Sport: 3 routes [0, +1, +2], one go each, highpoint scoring (holds = 10 + 2×grade, +5 for a top). Speed: 2 runs with a reaction + L/R rhythm minigame (43870–43928), then an 8-person single-elimination bracket (QF/SF/F/bronze; 43797–43844).
- **Rounds.** Top 6 advance from quals (`v4`). National tier, Olympics and World Cup add semis (top 4, `zT`; `Ace=2`). Finals are 4 boulders or 2 routes at +1 grade (43950–44075, 44076–44153). Before finals you "observe" (+5% on the first try, `nW`). A pre-comp tape study gives +2% (`ET`).
- **Attempt odds** (HP 43635): `Vd(skills, problem, bonuses)` (25963) plus minigame quality (+0.15…+0.40; a failed minigame = auto-fail, 43596–43608, `OC`/`ZH` 25864–25865). **Hard caps:** 13% per attempt when 1.5+ grades above you, 3% at 2.5+.
- **Scoring** `rW` (29394): flash = 1.5 × pts (pts = grade + 1); top = pts − 0.1×(tries − 1) (min 40%); high zone 40%, low zone 20%. Opponents: `Yd(problems, grade)` expected score (29799) × 0.82–1.18 (local) or 0.9–1.18 (World Cup/Olympic); rival × 0.79–1.21.
- **Field.** 7 locals `Ll` (29413) at **player grade** +1, 0, −1, −2, −3, −4, −5, plus +1/+2 at Regional/National (`$s` 29256). The rival at `rivalGrade`.
- **Score multipliers** (44174–44181): Local Hero ×1.15, Circuit Champion ×1.12, Headliner ×1.10 (Scene path tiers); Comp Beast quirk ×1.15; legacy `scenemem` ×1.06; Scene tier-3 ability ×1.2 once per day; Dirtbag+Scene ×0.92. Maximum ≈ ×2.07.
- **Prizes** (`Lhe` 29823): 1st $120 +10 rep; 2nd–3rd $60 +5; top half $25 +2; else +1 rep. ×1 / 1.7 / 2.6 by tier. +4 rep for beating the rival.
- **Season prizes:** champion $300 × (1 + 0.04 × grade), +25 rep, +2,500 × (1 + 0.04 × grade) followers; 2nd $100 / 8 / 1,000; 3rd $50 / 4 / 500 (44384–44392).
- **National ranking points** per discipline: `Wce` (29235) = round(`_L`(place) × 1.5 if you reached the final round) + 150/80/40 for season 1st/2nd/3rd, × tier multiplier. `_L` = max(5, round(100 × (n − place)/(n − 1))). **Points never decrease** (no decrement anywhere; writes only at 40442, 44301, 44350, 44451).
- **Tiers by discipline rank:** Local < 350 ≤ Regional < 1,200 ≤ National. Rank titles `YC` (29163): Regional Climber 120, National Prospect 350, National Team 700, Olympic Hopeful 1,200, World-Class 2,200.
- **Missed comps** (40490–40518): each missed date costs rep −2, standing −4 (unclamped), rival +60 circuit points, and a new date is appended at the end, so the season never completes without attendance.

**National team** (40286–40389): reviewed only when `circuitSeason` increments, i.e. after you compete in a season final. Named at ≥ 700 (`Ov`). Holding it requires ≥ 560 (`fx`), with a judgement band 650–700 (`RL`) scored by `CL` (29484): coach read `HT` (29748) from World Cup attendance, trend, World Cup podiums/titles, age < 26 (+1) or ≥ 34 (−1). Stipend $180 per review (`T4`); +16 rep named, +6 renamed, −6 cut. There are 4 coaches `FC` with bios (29441).

**World Cup** (40390–40461, 50434–50511): team members only. 6 rounds (`whe`) at 10 venues `J3` (29616), starting day + 5 and 4–7 days apart. Travel $210–800 per round; −50 energy; +2 days. Field `zv` (29705): 12 NPCs at player grade +5 … −1; problems at +2 (`NT`). IFSC-style points `The` (29611). Round rewards (`Hhe` 29793): 1st $900, 26 rep, 220 natl, 2,600 followers … 6th $250. Season title: $1,800, +55 rep, +5,000 followers, +400 natl.

**Olympics** (40280–40285, 50409–50433, 50513–50578, 44309–44355): every 56 days. Qualify with ≥ 1,200 in a discipline (`Sr`). Declare at the venue **on the Games day itself** (the date rolls +56 the next day, 40283). Final 3 days later (`j4`); second discipline +3 (`aW`). Field `kx` (29236): 7 NPCs at player grade **+5 … +1**; problems at +1 (`v3`); quals → semis → final. Rewards `Bce` (29250): gold $2,500 / 70 rep / 6,000 f / 450 natl; silver $1,400/48/3,500/300; bronze $900/36/2,400/220; no medal $350/16/900/90. The first declaration moves you into the Olympic Village zone (50431). That records the zone in `visitedZones` (38685) and unlocks its 2 side quests, so attending is enough; no medal is needed.

**Other comps**
- **League nights** `DH` (24630): Thursday Night Redpoint (Send City, $8, best 5 of 14 random rolls) and King of the Cave (Tuesday, $5, ladder). Auto-resolved (I6 37838), ranked among 22–41 entrants, prizes $40/$20/$8, **skill gains clamped to 100** (bug B1).
- **Fall Festival dyno comp** (43248–43280): auto-resolved: `power×0.45 + head×0.2 + rand 46` vs 7 thresholds `(grade + k − 3)×3 + rand 42`. Trivially won past about V4 [I]. 1st $60 +4 rep +400 f.
- **Speed practice** (FP 43845): PB tracking, small power/technique gains.
- **Own-gym league** (fF/gF 53889–53986): 25 members, $220, 6-week table of your regulars.
- **Hosting a circuit round** (pF/yF 53987–54060): $2,200 bid, 45 members, equipment tier ≥ 1. If won, "run the clipboard": $34 × 26 = $884, +9 members, +7 rep.
- `heat`/`heatsWon` are **internet discourse**, not comp heats (44521–44550).

### 2.6 Rivals **[E]**
- Default rival: **Dex Calloway**, power, "nemesis" vibe (`KB` 19403). Generation 2+ rolls a random rival from 12 names `Fv` (19380). The rival's style targets the heir's **weakest** skill (`gJ` 19412, `XB`).
- **Rubber-band growth** (51900–51904): every 2 days (generation 0; every day after) `rivalGrade` +1 toward **player grade + 1**, capped at V17. Growth stops at rival age 31 (`iJ`). Rival age = 24 + (day − born)/18.
- **Injury:** 1% per night when the rival is ≥ V5; out 6–12 **weeks** (42–84 days) (51084–51090, 51917–51921). A grace choice changes rivalry.
- **Retirement:** at rival age ≥ 34, 2% per night. The role is coach / author / gone (`cJ` 19366): coach 40%, 65% if allied, 0% if rivalry < −6. The replacement starts at player grade − 3 and catches up in about 4 days (51922–51986). "Coach" unlocks a gym session with the ex-rival (50724–50744, **clamps the skill to 100**).
- **Races** (51128–51135, 51987–52017): 10% per night at player grade ≥ 3 if no race is running and not allied. 40% target an open FA line. 5-day window (`B8`). Losing an FA race means the rival names it (`Rpe`, 14 names) and it's gone forever; rivalry −5. Losing a send race: rivalry −2. Winning: +3.
- **Arc** (`s` 40654–40673): rivalry thresholds by vibe move you from stage 0 → 1 (3/4/6) → ally offer (5/6/8) → allied → "sent together" when `partners.dex` ≥ 5 (+12 head, +30 rep). A nemesis vibe gets a "heel" confrontation at rivalry ≥ 2.
- **Rivalry sources:** comps ±2 (44448); rival-ahead flips ±1 (39352); race +3/−2/−5; confrontations −2; "dry" replies to rival posts +1 (**unclamped**, 38955).
- **Flavour:** talk lines (`ik` 39459, `dk` 39647); post-comp beats in 8 variants (`lk` 39491); the retirement "THE RIVALRY" panel (101864–101912).

### 2.7 Factions, clubs, stances **[E]**
- **Factions** `Dv` (30739): gym, trad, comp, media, each starting at 50. Moved by the calling (`Ife`), sends (`zfe` 30794), comps, stances, clubs, grade calls (52946–52960), locals.
- **Faction effects:** labels (Beloved … Distrusted, `PW` 30786); "Where you stand" (`LW` 30774); crew-name options (21441–21448); trad < 38 raises discourse odds +80% (30051) and adds +45% hate comments (31334); elder standing +0.3 per trad point above 50 (26082); locals' psyche ±; **side deals and kit offers gated** (`qoe`/`cae` 51563–51573).
- **Clubs** `uae` (24787): Alpine (trad), The Program (comp), The Collective (media), Access Coalition (trad+gym). One at a time; ranks at club rep 0/30/65/95; dues $0–12 per week; perks such as training gains +15/30% (`Bz`), +2/4% on rock (`Hz`), followers ×1.3/1.7, stipends $12–15 per week, free permits, doubled donations. Leaving: club rep ×0.6 and faction −8 (37995–38008).
- **Stances** `WH` (25131): 5 dilemmas (chipped project, closure, retrobolt, stolen FA, trashed crag), each 3 options plus an unlockable 4th, faction deltas ±3–18, **7 echo events** later (`wae` 24924). Each stance adds +5 to elder standing (26077).

### 2.8 Retirement, legacy, modes **[E]**
- **Retire** (50935–50945): at the van from age 30 ("Hang it up"). Auto at 45 (52516).
- **Tally screen** (101641–102043): archetype, years, age, generation; HARDEST / SENDS / FAs; rep / pro / followers / podiums / trips; scars; signature; calling rungs ✓/○; "THE ROADS YOU TOOK" (paths, including roads never walked); a 6-way epitaph (101657–101667); THE RIVALRY; PASSING THE TORCH (mentee). Button: "CLIMB ON AS {mentee}" or "START A NEW CLIMBER".
- **New generation** `KG` (53047–53075): `{...mv (full default state), introSeen, legacyGen+1, legacySeed = clamp(max(prev, round(avgSkill×0.15)), 0, 45), legacyBoons = [mentee perk] + path-mastery memories, legacyLean = skill proportions, legacyStyle (never read), legacyName = mentee name, legacyMenteeGrade, legacyForebear = name (null in gen 1), signature(s)}`.
- **At creation** `JG` (53175–53214): heir skills = archetype + origin + round(5×(seed + 2×menteeGrade) × lean). Boons: `m_strong` +18 P/F, `m_tech` +24 T, `tendons` = Iron Tendons, plus odds boons read in the send code (48220–48251).
- **Mentee** (52963–53046): available at V5 & rep 25. 1 session per day, 2 hours, −8 energy. The boon locks at 20 sessions (`Gg`). Mentee grade = min(5, floor(sessions/3) + 1) (`Iu` 26194).
- **Game over** (102044–102100): "BUSTED" (debt), "TAPPED OUT" (starved), "GONE" (solo fall) → `fA` (52933) full reset including the bloodline.
- **Modes:** only `"normal"` and `"solo"` (46888–46890). The heir's `mode` resets to "normal" because KG spreads `mv`.

---

## 3. Content inventory **[E]**
| Content | Count | Where |
|---|---|---|
| Quests | 16 (1 main / 15 side), 41 stages, 48 objectives, ~2,500 words | `ur` 34980 |
| Goal ladder rungs | 15 | `$R` 33877 |
| Onboarding steps / tips / HUD glossary / Hazel hints | 7 / 12 / 21 / 9 | `h$`, `Ope`, `Upe`, `mpe` |
| Feats / lifetime milestones / story moments | 29 / 5 / 8 | `f1`, `k8`, `mge` |
| Challenges: café / daily / weekly / club | 10 / 7 / 5 / 16 | `lH`, `SO`, `jO`, `Ate` |
| Origins / archetypes / builds / callings / flaws | 6 / 4 / 4 / 4 / 5 | `im`, `sm`, `ZC`, `jh`, `XC` |
| Talents / quirks | 11 / 8 | `QC`, `sge` |
| Paths × tiers / all traits / legacy boons | 5×3 / 33 / 11 | `Es`, `AL`, `K_` |
| Factions / clubs × ranks / stances (options) / echoes | 4 / 4×4 / 5 (20) / 7 | `Dv`, `uae`, `WH`, `wae` |
| Dreams / expeditions | 3 / 3 | `G3`, `Gy` |
| Comp fields: local / World Cup / Olympic / rival names / national field / juniors / coaches | 7 / 12 / 7 / 12 / 6 / 10 / 4 | `Ll`, `zv`, `kx`, `Fv`, `natlField`, `Ice`, `FC` |
| World Cup venues / league nights / national-field headline events | 10 / 2 / 4 | `J3`, `DH`, `Dce` |
| Diary (life-log) entry sources | ~66 call sites, ~40 icons | `pt(...)` 17635 |
| Text volume (approx. words) | stances 1,560; echoes 1,220; paths/traits 670; team selection 530; retirement screen 500; clubs 400 | — |

---

## 4. Bugs and defects

### Confirmed **[E]**
| # | Sev | Defect | Lines | Failing scenario |
|---|---|---|---|---|
| B1 | **Critical** | Skill clamped to 0–100 in league nights (specialty skills + head), hitchhiker choices, café regulars and the ex-rival coaching session, while grades need skills of 100–922 | 37879, 37881, 44843, 44902, 50735 | A V8 climber (power ~250, fingers ~230, head ~180) enters King of the Cave: power, fingers and head are set to 100, average drops ~218 → ~146, **V8 → V6 in one evening**. The results card (`Ku`, 37926–37938) shows only score, place and prize, so the loss is invisible. The ex-rival session toast literally says "+13 fin" (or "+13 pwr", 50742–50743) while it lowers the skill. The late-game "Session with Dex" at the gym does the same to one skill (usually 400+ by then). |
| B2 | High | Comps are opt-out. Missing one costs −2 rep and −4 standing; standing is **not clamped** here, though clamped at 0–100 elsewhere | 40490–40518; `gK` 17747; labels `w8` 17748 | New player on day 5 hasn't found the gym comp. Next day: "Missed the comp — Dex banked the points…" (before meeting Dex); standing 0 → −4 = "kook" (diner ×1.08, `O5` 17758). Non-competitors lose ~4 standing per week forever. Expeditions (10–24 days) and World Cup trips trigger it too [I]. |
| B3 | High | A circuit season cannot end without attendance; a missed date is appended rather than consumed; national-team reviews only fire on season change | 40502–40506; 40286–40289 | A player who stops competing stays in "Sport Season 1" indefinitely; team reviews and World Cup never trigger. |
| B4 | Med | Age-28 recommit dialog is not gated on start age, `created`, or having any path | 36581–36583; 89437–89530 | A Late Bloomer (starts at 32) finishes creation and immediately sees "Turning 28 … ' have been your whole climbing life so far'" (empty list); "Reconsider" offers nothing to drop. |
| B5 | Med | Generation 1 is never named (no name field), so `legacyForebear` is null in generation 2 | 101153–101330; 53072; 38696–38731 | In generation 2 "THE TORCH PASSES" never fires. The Notown ghost line falls back to "the dirtbag you used to be". It only works from generation 3. |
| B6 | Low | Mentee-becomes-your-rival beat is unreachable: requires `legacyMenteeGrade ≥ 6`, but it is capped at 5; it also checks the *previous* generation's mentee | 51942; `xse=5` 26193; `sJ=6` 19359 | "You made this… {mentee} is the one to beat now" can never show. |
| B7 | Med | Rival turnover resets rival, grade, rivalry and alliance, but **not** `dexStage`, `partners.dex`, `compWins/Losses` or `rivalHurt`. The alliance/partner slot is hard-wired to "Dex Calloway" | 51958–51965; 52578–52590; `ts` 20761; `It` 21020; 21387; 54382–54387 | Dex retires after the "sent together" arc (dexStage 3). New rival "Juno Hale" is immediately greeted with friend lines (`ik` uses dexStage ≥ 2) and never gets an arc (40659 returns at stage 3). In generation 2, allying with the random rival adds "Dex Calloway" as your partner, with the rival's grade. |
| B8 | Low | "Past the Rival" story card hardcodes "Dex" | 31974 | Generation 2 rival "Silas Mott"; you pass him and read "Dex has been the measuring stick…". |
| B9 | Low | Rival-ahead toast says "passed" on a tie, and ping-pongs on every grade gain | 39346–39358 vs 51900–51904 | Gain a grade: "You've passed Dex" (you're equal). Two days later: "Dex pulled back ahead". Net rivalry 0, about 15 times per career. |
| B10 | Low | The injured rival still competes | 50295–50300 vs 51917–51921 | "Dex blew a pulley — out for 8 weeks"; he places 2nd at next week's comp. |
| B11 | Med | Café board challenges expire at the deadline even when **completed but unclaimed** | 52019–52022 (no completion check) vs 47751–47768 | Player finishes "Big Week" on day 6 while at a crag, returns on day 8: "Board challenge expired". The $80 and 14 rep are lost. |
| B12 | Low | Sport-grade labels in ladder, feats and quests disagree with the game's own conversion table `Y3/Kn` (22110–22131) | 33878–33891; 17823–17850; 18059; quest descriptions | Ladder says "V10 / 5.14a", but the game shows V10-index sport routes as **5.13c**. "V5 / 5.12d" (ladder) vs "V5 / 5.12a" (feat) vs 5.12b (table). "V4 / 5.11" (quest) vs 5.12a. "5.15c" is not in the table. |
| B13 | Low | "The Full Circuit" says "every crag you've unlocked" but always counts the Crucible (no `unlockCost`, min grade 11, routes V13+) | 18033–18040; crag list 22830 | A V10 player who has visited every paid crag still can't earn it. |
| B14 | Low | The retirement header prints the archetype id: "The ropegun", "The allrounder" | 101693 | Should use `B1(id).name`. |
| B15 | Low | The Collective's "A loaner camera" perk grants **Liquid Chalk**; the `camera` perk is never read | 24856; `Lz` 24920; `as(…)` reads 24912–24919 | Join The Collective: no camera, one chalk item. |
| B16 | Med | Retirement/new generation (and game over) reset `mode` **and all settings** (audio, text scale, colorblind, high contrast, reduce motion) because settings live in the save state | `KG` 53047; `fA` 52933; settings in `mv` 14061–14072 | A Free Solo player retires and the heir plays Normal. A low-vision player's text scale resets at every new generation. |
| B17 | Low | Generation 2+ replays onboarding (GET STARTED 0/7) and "Your First Season" | `onboard:[]` 14426; 34985 | Veteran player sees "Step inside somewhere — town is how you survive" again. |
| B18 | Med | "The Lost Line" finale requires the FA of the Mesa's only open line (`sm_open`, V13), which the rival can claim in an FA race | 35126–35186 (35172); races 51130–51134; `Cpe` 33938; 49092 | At V12+, Dex eyes an unclaimed Mesa line; the player misses the 5-day window; the rival names it; the quest can never complete. It also jumps from V9 to V13 in one stage. |
| B19 | Low | Hazel's "hz_work" hint checks `job === "none"` but jobless is `null` | 33609 | A broke, jobless player never gets Hazel's work nudge. |
| B20 | Low | "dry" replies to rival posts add rivalry without the ±20 clamp | 38955 | Spamming replies inflates rivalry past 20, fast-tracking the alliance arc. |
| B21 | Med | Olympic declaration window is a single day; declaring a second discipline on day 2 fails with "The Games haven't started yet." | 40282–40284; 50409–50412 | Tip `Upe.OLYMPICS` says "Declare for a second event once you're at the Games". Arrive on day 57 (Games were day 56) and they've moved to day 112. |
| B22 | Low | `f1` "Top Step — Win a comp" fires when you merely beat the rival | 17957–17963; `F` 44249; 44446 | Place 5th with Dex 6th → "Top Step". |
| B23 | Low | "The Lost Crag" final stage auto-completes: its objective is the flag granted by the previous stage | 35613–35658 (35646) | "Find the canyon" is ticked the moment it appears. |
| B24 | Low | 4 quest flags written and never read (`reel_done`, `lostline_topo`, `gauntlet_rolling`, `chasinglight_seen`); `legacyStyle` never read | 35111, 35163, 35209, 35325; 53069 | Dead hooks. |
| B25 | Med (UX) | Forced retirement at 45 has no warning or countdown | `use` referenced only at 26091 and 52516 | A player 2 goes from the V18 myth send sleeps on their 45th birthday and is retired mid-project. |
| B26 | Cosmetic | "The Long Game" feat (+60 rep) is granted at retirement, then wiped by `KG` | 18020–18026 | Visible only for a moment. |

### Suspected **[I]**
| # | Defect | Evidence |
|---|---|---|
| S1 | National field `trend` is added raw (±0.05–0.9 points per season) instead of scaling points, so the field is static except for one random headline per season | 51113–51116; `Dce` 29185 |
| S2 | National team "cut below 560" is effectively dead: discipline ranks never decrease, so after 700 you are always retained (only the band case via `CL` can cut) | 29547–29602; no decrements found |
| S3 | "Send Season" says "this season" but the quest engine has no deadline | 35374–35412; `Vpe` |
| S4 | Name collisions: all 6 national-field NPCs are also in the rival pool `Fv`; "Kai"/"Remy" are both local competitors and mentee names | 14145–14152, 19380–19393; `Ll` 29413; `TI` 26142 |
| S5 | World Cup economics: $210–800 travel per round vs ≈ 0% podium without the score stack (see 5.3) means each round loses money | `J3`, `Hhe`, sim |

---

## 5. Balance and pacing

### 5.1 Grade pace vs career length [I] (`pace.js`; crude: random route types, ±1 grade projects, one training session every 2 days; no injuries, rest, work or weather)
| Attempts/day | V5 | V8 | V10 | V12 | V15 | V17 | V18 |
|---|---|---|---|---|---|---|---|
| 3 | d18 | d53 | d93 | d150 | d274 | d384 | d449 |
| 4 | d14 | d40 | d70 | d114 | d207 | d292 | d341 |
| 6 (+daily training) | d9 | d26 | d46 | d75 | d136 | d191 | d224 |

Against a forced retirement on **day 415**, plus power/finger decline from day 181, the ladder's final goal (V18 FA) is marginal in one career for a normal player. It is impossible for a Late Bloomer (day 235).
Legacy does not help much: the heir's seed caps at 45 + 10 → ~275 skill points total (average +55, ~V3.5), so each generation restarts the long climb. The seed also caps at ~V10-level careers (`legacySeed` ≤ 45), so retiring at V17 transmits no more than retiring at V10.

### 5.2 Real-time mapping [I]
The map clock runs 1 game-minute per real second when no modal is open (38626–38654). Actions jump hours; sleep jumps to 07:00. Assuming 4–8 real minutes per game day:
- hour 1 ≈ day 8–15
- hour 10 ≈ day 75–150 (≈ V8–V12)
- hour 50 ≈ day 375–750 (at or past forced retirement → likely generation 2)

### 5.3 Comp winnability [I] (`compsim*.js`: Monte Carlo using `Vd`, `O2`, `Yd`, `rW`; greedy problem choice; 85% minigame success at +0.15–0.40; no nerve/trait/signature/phase bonuses)
| Player vs field | Local win / podium | National-tier win / podium | World Cup podium | Olympic final win |
|---|---|---|---|---|
| Balanced, exactly at nominal grade, no traits | 9–10% / 80–85% | 0% / ≤ 0.1% | 0% | 0% |
| +0.5 effective (floor bias), no traits | 23% / 94% | 0% / 3% | 0% | 0% |
| +1.5 effective (specialist on-style), no traits | 64% / 97% | 2% / 60% | 0.1% | 0.1% |
| +0.5, full score stack ×2.07 | 98% / 99.9% | 9–10% / 38–43% | 4–5% | 7% |
| +1.5, full score stack ×2.07 | 99% / 99.9% | 82% / 97% | 70% | 81% |

Readings:
- Local comps feel good; you podium most of the time.
- Reaching **1,200 in a discipline flips your circuit comps to National tier**: problems +2, field +2, versus you. Without the Scene stack you drop from podiums to mid-pack, with no way back, because points never decrease.
- International success is decided almost entirely by (a) the 1.15×1.12×1.10×1.15×1.06×1.2 multiplier stack and (b) specialization (`Vd` uses 0.65×primary + 0.35×secondary, while the field keys off `floor(average)`).
- Near V16–V18 the field clamps at V18 (`T(G+off,0,18)`), so the top of the game gets easier relative to the field.
- The Comp Beast quirk is checked **first** among quirks (`dge` 31670), so any player with 6+ comps at 30 climbs gets it.

### 5.4 Rep inflation [I from tables]
Sponsor tiers need rep 60/120/200/300 (`er` 29885, `ZT` 30297); turning pro needs 150 (`I2`). Meta rewards alone add:
- feats 529 + 160 category bonuses
- calling 305
- consolidation ~176 by V10 (6 + 2g per grade)
- 2 path masteries 70
- quests ~200 (stage + final rewards across all 16)
- Homecoming 15; Nemesis 20 + 4g

That is ~1,400 rep from bookkeeping systems, versus 1–10 rep per comp placing. Meta systems, not play style, drive the sponsor/pro economy (cross-lane: economy).

### 5.5 Trait gates are front-loaded [E math]
Path thresholds sit on the old 0–100 scale:
- Power 75 = oc(75) ≈ V4.2
- Fingers 90 ≈ V4.7
- Head 85 ≈ V4.5
- hybrids (two skills ≥ 60) ≈ V3.6

The "MAXED — Nothing left to prove" celebration fires at skill 100 (36585), which is V5-level in that stat. All skill-based identity milestones are exhausted in the first ~10% of the ladder. From V6 to V18 identity growth comes only from signatures (15/40 sends), style mastery (40 sends) and quirk #2 (90 climbs).

### 5.6 Rival pacing [E]
For ~126 days Dex is exactly one grade ahead of you (rubber band). Then he freezes at his age-31 grade, you pass him for good, and he retires around day 230. Nothing you do changes his curve (except his injury roll). The races (~every 10–15 days) and comps are the only real interaction.

---

## 6. UX and clarity from the player's seat

**Minute 5** (goal: survive the first day)
- Mode choice, then 6 creation screens of dense modifiers (the synergy callouts help a lot).
- On the map: HUD "GET STARTED 0/7 — Step inside somewhere", quest toast "New quest — Your First Season: Have $60 in hand" (instantly done for 4 of 6 origins, which start with $60–400), a suggestion line, and Hazel at the lot.
- The goal is clear: work, eat, sleep, find the gym.

**Hour 1** (≈ day 8–15; goal: V3–V5, cash, real rock, meet the rival)
- Onboarding done. The ladder reads "Climb your first grade V1 / lead 5.11" (label wrong, B12), then "$200", then "V3".
- First Season wants 2 outdoor sends, 15 rep and a V4 skill level.
- Comp #1 has already happened (day 4–6); if missed, "Dex banked the points" and you're a "kook".
- Also on screen: daily and weekly auto-challenges, the café board (4 offered), and possibly the Rival's Gauntlet or Local's Project leads.
- Goals are plentiful but scattered across 6+ trackers.

**Hour 10** (≈ day 75–150, ~V8–V12; goal: ambiguous buffet)
- Ladder: V10 → "V11 — earn the Crucible".
- Circuit season 3–4, possibly the national team and a first Olympic qualification in one discipline.
- 2 paths claimed (probably maxed), calling rung 1–2, sponsor tier 1–2, a dream fund, 3–6 side quests, club ranks, mentee sessions.
- Age-28 recommit (day 109) and "Hang it up" (day 145) appear.
- This is the densest, best stretch, but nothing ranks these goals for the player.

**Hour 50** (≈ day 375–750; goal: the V18 myth line before age 45, or generation 2)
- Either the ageing late game (decline, no forced-retirement warning, rival gone), or generation 2 replaying the same onboarding, First Season, 15 side quests, feats and comps with a new random rival.
- The world has forgotten the forebear, their FAs included.

**Spine or buffet?** A thin numeric spine (grade/cash ladder) under a large buffet. The story spine ends at V4.

**Ending?** No authored win. The V18 FA gets a generic FA modal. Retirement is the emotional ending and the screen is good, but it is mandatory at 45, optional from 30, and unconnected to the ladder.

**What players will bounce off**
1. **Silent skill loss (B1).** One league night can undo weeks.
2. **Auto-scheduled comps with a penalty (B2/B3)** for players who never opted in, including a message about someone they haven't met.
3. **Tracker overload.** Two HUD pills, a suggestion line, 21 HUD chip types, tips, toasts, quest leads, 3 boards plus dailies, feats, milestones, story cards, calling rungs and path badges, many celebrating the same event (first V10 fires up to 4 notifications).
4. **Rubber-banding.** Dex is always one grade ahead; comp fields scale with you, so progress never shows against the world until the trait stack kicks in.
5. **Legacy wipe.** After 30–60 hours of building a van, crew, dog, gym and name, the heir gets a ~V3.5 head start and the tutorial.
6. **Contradictory numbers.** Three different sport-grade conversions; two different "years".
7. **Late Bloomer** opens on a broken dialog (B4).

---

## 7. Overlaps, bloat, dead or vestigial systems

### 7.1 Goal/tracker matrix (about 28 systems) **[E]**
| System | Count | Reward | Completion UX |
|---|---|---|---|
| Onboarding | 7 | — | auto |
| Goal ladder | 15 | toast | auto (skill-average based, not send based) |
| Main quest | 1 | small | auto |
| Side quests | 15 | cash/rep/followers/skill/bond/crag | turn-in (13) or auto |
| Feats | 29 | rep + psyche | auto |
| Lifetime milestones | 5 | none | auto |
| Story moments | 8 | card | auto |
| Calling rungs | 12 | rep | auto (on sends) |
| Paths | 15 tiers | traits, ability | **manual claim** |
| Hybrid + style traits | 16 | traits | auto |
| Signatures | 2 | +10% odds | name prompt |
| Quirks / talents | 8 / 11 | modifiers | reveal |
| Café board | 10 | cash/rep | accept + **claim** (expires) |
| Daily / weekly | 7 / 5 | cash/rep | auto |
| Club jobs | 16 | cash + club rep | auto (night) |
| Grade consolidation | ∞ | rep + head | auto |
| Dreams / expeditions | 3 / 3 | perks / summits | manual |
| Nemesis | 1 at a time | rep + card | auto |
| Circuit / team / World Cup / Olympics | — | cash/rep/points | attend |
| Mentee / Hazel | 20 / 5 sessions | boon / trait | manual |
| Homecoming | 1 | burst | arm + send |
| Year recap | every 56 d | banner | auto |
| Diary | ~66 sources | — | auto |

### 7.2 Duplicates and overlaps **[E]**
- **Same moment, many trackers:**
  - First send: feat `send1` "Send It" + story card "First Send" + onboarding "gymsend" + First Season stage 2. The café challenge `lH.dyno` is *also* titled "Send It".
  - First flash: feat "First Try" and story card "First Try" (identical name and trigger).
  - First outdoor send: feat "On the Rock" + story card "On Real Rock" + onboarding "cragsend" + First Season + daily `d_crag`.
  - V5: feat "Solid" + story card "A Real Climber" + ladder "V5" (and First Season V4).
  - V10: feat "Strong" + story card "Double Digits" + ladder "V10".
  - V15: feat "World Class" **and** milestone "World Class" (identical check, 17840/18059) + ladder "V15".
  - First "year": milestone "The Dirtbag Year" (day 18) + story card "A Year on the Road" (day 19) + YEAR 1 recap (day 57).
- **Three weekly boards with the same verbs:**
  - "send N anywhere": `lH.vol5` / `jO.w_send15` / `Ate.cl_vol`
  - "N at V6+": `lH.g6` / `jO.w_g6` / `Ate.cl_gymhard` **and** `Ate.cl_send` (two identical club jobs with different titles)
  - "N outdoors": `lH.crag3` / `jO.w_crag5` / `Ate.cl_crag3` / `cl_myth` / `cl_boots`
  - "work 3 shifts": `lH.work3` / `Ate.cl_hands`
  - "N training sessions": `lH.train4` / `jO.w_train6` / `Ate.cl_train5`
- **Six trait sources feed the same four modifier slots** (odds by type, gain multiplier, injury multiplier, first-go): paths, hybrids, style mastery, origin/Hazel traits, club perks and legacy boons, plus quirks, talents and signatures on top.
- **Four "who you are with the scene" axes:** personality (4) × factions (4) × clubs (4) × stances (5). The calling seeds two of them, clubs are just faction memberships, and stances move factions.
- **Three "rank" readouts:** circuit standings, discipline ranking points with 6 `YC` titles, and World Cup standings, plus the national field list.
- **Three league systems:** league nights (`DH`), own-gym league, hosting a round.

### 7.3 Dead or vestigial **[E]**
- `sge.pickable` (never read; the UI says "Quirks aren't chosen").
- `legacyStyle`; 4 write-only quest flags.
- The mentee-rival swap (B6).
- The `camera` club perk (B15).
- National field `trend` (S1).
- The team "cut" threat (S2).
- The `k8` milestone reward (none).
- The dyno comp is an auto-roll in a game full of dyno minigames.

---

## 8. Opportunities (prioritized; effort S/M/L)

### P0: fix before anything else
1. **FIX B1 (S).** Remove the five `T(…,0,100)` skill clamps. Grep-verify no other clamp exists. Add a test that skills never decrease except through age decline.
2. **CHANGE comps to opt-in (S/M).** "Sign up at the desk" (register up to the day before). Only registered no-shows are penalized, and standing is clamped. Let a season end on its schedule whether or not you attended (your points are just lower). Suppress rival-named messages before `metRival`.
3. **FIX identity continuity (S).**
   - Add a name field at creation (enables `legacyForebear`).
   - Reset `dexStage`/`partners.dex`/`rivalHurt`/head-to-head on rival turnover.
   - Make the ally partner slot use the current rival's name.
   - Template "Dex" out of `mge.passrival`.
   - Fix the `sJ` vs `xse` mismatch (B6).
4. **FIX legacy resets (S).** Carry `mode`, all settings and `onboard` (skip the tutorial) into the heir. Don't auto-start "Your First Season" for generation 2+, or swap in an heir-specific first quest.
5. **FIX small defects (S):** B4 (gate the recommit dialog on `created`, start age < 28 and ≥ 1 path), B11 (claimable after the deadline, or auto-claim), B12 (generate all labels via `Ste`/`Kn`), B13, B14, B15, B19, B20, B21 (a 3-day declaration window), B22, B25 (a 2-year countdown banner from age 43).

### P1: structure (M)
6. **Merge the trackers into three layers:**
   - **Life Goals** (the spine; see 8.9).
   - **The Board**: one weekly board fed by café, club and daily sources, auto-claim, 3 slots. This replaces `lH`/`SO`/`jO`/`Ate` as four UIs.
   - **Record Book**: `f1` + `k8` + `mge`, with each feat carrying its `mge` story text as its unlock card.
   This cuts ~5 systems with no content loss.
7. **Fix the clocks.** Keep compressed aging (18 days per age-year is a sensible design for a playable career), but stop calling 18 days a "year". Retarget "A Year on the Road" and "The Dirtbag Year" to 56 days; label ages as "age" and 56-day cycles as "year".
8. **Comp difficulty that shows progress.** Fixed fields per tier:
   - Local: field V1–V7
   - Regional: V5–V11
   - National: V9–V15
   - World: V13–V18
   Promotion and relegation by ranking points that decay slowly (makes team selection real). Shrink the multiplier stack to ≤ ×1.3 total so execution and specialization decide results.
9. **Rival with an arc, not a rubber band.** The rival gets their own seeded progression curve with streaks, injuries and peak age, sometimes ahead and sometimes behind. Keep races and comps as the conflict. Let the retirement role (coach/author/gone) feed generation 2 (the ex-rival coaches your heir).
10. **Identity with late-game depth.** Rescale path gates to the real skill curve:
    - Tier 1 ≈ V4, tier 2 ≈ V9, tier 3 ≈ V14
    - Hybrids at two skills ≥ V8-level
    - "MAXED" at V15-level
    This spreads identity milestones across the whole career. Consider merging hybrids and style mastery into one "Mastery" track.
11. **Legacy as a dynasty.** Persist across generations:
    - the forebear's named FAs (on topos, with the forebear's name)
    - the forebear's gym (the heir inherits it as a building, maybe in debt)
    - crew members aged into mentors
    - a family "name" rank in the scene
    Let the heir keep a share of cash or gear. Give the heir a distinct first quest ("Their shadow", "The line your parent named").

### P2: add (L)
12. **An authored main arc over the ladder** (5 acts, crags as act gates, using existing content):
    - I "First Season" (≤ V4)
    - II "The Local's Project / The Gauntlet" (V5–V7, the rival)
    - III "The Circuit" (national team, V8–V11)
    - IV "The Crucible" (V11–V15; Hazel's Pilgrimage and the Tower as set-pieces)
    - V "The Line" (V17 → myth FA)
    Each act ends in a scene, not a toast.
13. **A real ending.** The myth FA gets a bespoke sequence (naming ceremony at the fire, crew/rival/mentee reactions pulled from existing bond data, credits), then offers "Retire now — a perfect ending" or "Keep climbing". Add epilogue variants keyed to calling rung completion, paths, faction standing and stances; the data already exists in the tally screen.
14. **Interactive side comps (M).** Make the Fall Festival dyno comp and the league nights use the existing dyno / 5-problem minigame loop at a shorter length.

### CUT without loss
- `k8` (fold into feats)
- duplicate feats/story cards (merge)
- `Ate.cl_send` (duplicate of `cl_gymhard`)
- `sge.pickable`, `legacyStyle`, write-only flags
- the dyno-comp auto-roll (replace or cut)
- `natlField.trend` (replace with decay) and the dead cut logic (after 8)
- the 3rd league system (merge hosting into gym ownership)

---

## 9. What's strong and must be preserved
- **The comp engine** (43635–44464, 50258–50578): per-problem minigames, a real-time clock, attempt allocation, zones, observation and scouting, semis/finals, the speed reaction+rhythm run and bracket, and the rival/field ticker feed. It is the most "game-like" meta system and fits "2D minigames, 3D staging".
- **The writing.** National-team selection reasons (`CL` 29484–29541: "a committee can read a graph as well as anyone"), World Cup venue blurbs, rival post-comp beats (39491–39551), the retirement tally ("You never walked Nerve, Crusher. Somebody else did."), stances and echoes. Dry, specific, second-person: exactly the brief's voice.
- **Emergent identity.** Quirks inferred from actual habits ("The scene will name it before you do"); hidden talents discovered through reps; personality drifting with behaviour; the crew naming you from your record.
- **Creation synergy callouts** (100653–100733) that tell you what your choices mean before you commit.
- **Paths as a 2-of-5 commitment** with named mastery lines (`DW` 30566) and the "roads not taken" line at retirement.
- **The rival as a character**, with vibes, races for FAs you can lose forever, grace choices on injury, and afterlives (coach/author/gone). The execution needs work (P1-9); the concept is excellent.
- **The Diary / life log** (~66 sources) and **Homecoming**: a cheap, emotionally effective memory system that legacy should build on.
- **Free Solo mode** as a clean, honest hardcore variant.
