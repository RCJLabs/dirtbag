# Dirtbag v0.956: CLIMBING subsystem audit

Auditor: climbing agent. Source: `$SRC/bundle.pretty.js` (all line refs are to this file).
Label key: **[ESTABLISHED]** means I read it in code or data. **[INFERRED]** means it is my reasoning, a model, or a guess about player impact.
Simulation scripts are in `$SP/work-climbing/` (`sim2.js`, `seq.js`, `routes.js`, `odds.js`, `mix.js`, `acwr.js`, `exped.js`, `variants*.js`).

---

## 1. Summary

1. **The sim is deep and mostly coherent.** Five skills feed one grade through a quadratic curve (grade = floor(oc(average of 5 skills)), capped at V18). About 45 additive odds terms feed one odds function. There is a per-move fall model, a real acute:chronic workload (ACWR) injury model, and aging. Content: 78 fixed outdoor routes on 9 crags, 3 gyms that regenerate weekly, 4 multi-pitch walls, 3 expeditions and 16 training protocols. [ESTABLISHED]
2. **An attempt is a minigame gate, then a dice roll.** Each attempt runs 1–5 real-time minigames. Failing any one means a guaranteed fall. Passing adds +0.12 to +0.40 to the odds, and then a dice roll decides. At your own grade, passing the minigames is what matters, because the dice already sit at about 85–95% with gear and the bonus. Above your grade a hard cliff decides everything: at R ≤ −1.5 grades odds are capped at 13%, and at R ≤ −2.5 at 3%, whatever you do. [ESTABLISHED]
3. **The verbs the design is built around are rare.** HOLD TO CLIMB is about 6% of minigames at Send City, 0% in the Cave and 2% outdoors. MASH is 53% of Cave minigames and 29% of outdoor ones. A boulder averages 3–4 minigame beats. The pump, skin, energy and psyche the sim tracks never enter the minigames. [ESTABLISHED]
4. **Progression timing (simulated medians).** V3 takes 5–8 in-game days, V5 12–20, V8 28–57, V10 46–92, V12 70–134 and V15 134–266. V18 is reached (day ~240–380) only by engaged or optimizing players or heavy cooks. Typical players are forced to retire at age 45 (day 414) at about V15–16. At roughly 4.5 real minutes per in-game day, that is V10 in about 4–7 h, V15 in about 10–20 h, and a full career in about 31 h. [INFERRED, modelled from code formulas]
5. **Curve shape.** Week 1 is too fast (about a grade every 2 days). The mid-game is good (a grade every 10–14 days). The late game is grindy and short of content: 2 routes at V14 and none at V16. From about V10, flat chores (a cooked meal gives +2–5, a job shift +1–5) earn more skill than sending at your limit, because only climbing and training XP are diminished by `hi(skill)`. [ESTABLISHED formulas / INFERRED magnitude]
6. **P0 bugs:**
   - Three code paths clamp a skill to a maximum of 100: the old-rival coaching session (50735), hitchhiker choices (44843) and cafe regulars (44902). For a mid- or late-game climber this silently deletes 100–800 points while the toast says "+13 fingers".
   - A "MAXED — Nothing left to prove" toast fires at skill 100, which is about V5 (36585).
   - Several other values are still tuned for a 0–100 skill scale: endurance stops cutting pump above 100 (25880) and stops cutting approach cost above 100 (23318), and every path trait unlocks by skill 90 (30595–30617). [ESTABLISHED]
7. **Exploits empty out the decision systems.**
   - "Tape up" is free and unlimited (50900).
   - You can declare a rest day after a full climbing day: it instantly cuts load and heals, and training is still allowed.
   - Taper is free and can be chained forever. Training phase switches are free, so a player can go to deload at bedtime.
   - The ✕ button on every minigame gives a free retry.
   - Toggling a grade vote farms faction rep.
   - Speed-wall runs cost no time.
   - "Get Beta" gives +40% instantly.

   [ESTABLISHED]
8. **UX problems.**
   - The "X% send" figure leaves out the minigame bonus and hides the cliff.
   - "Grade = average of 5 skills" is never explained.
   - There are three different V→YDS conversions.
   - The aging and forced-retirement clock is invisible; the Late Bloomer origin silently loses 44% of the career.
   - The "stay warm" and "window" labels contradict what those actions do. [ESTABLISHED]
9. **Decisions, and how this compares to the design intent.** Real decisions exist: which route and style, beta, conditions, "One more go", the trad rack choice, wall anchors, and expedition dig-deep. The flash declaration, though, is a false choice, and the micro-buffs (read the line, brush, tick, tape, warm-up, taper) are chores rather than decisions. Against the intent ("player drives the attempt with real-time verbs, sim arbitrates"), the 2D game plays as quick-time-event (QTE) gates followed by a dice roll. The verbs are skill-expressive but cut off from the sim's state. [INFERRED]
10. **Keep:** the quadratic grade curve with `hi()` diminishing returns; per-type skill mixes; the per-move fall log ("Off at the gaston — move 4 of 7", high points, beta per move); the ACWR model; the rich conditions; onsight/flash/redpoint semantics; FA naming and grade consensus; the ethics "stances"; and the writing voice. [INFERRED]

---

## 2. How it works: mechanics, numbers, formulas

### 2.1 Skills → grade [ESTABLISHED]
- **Skills.** Five skills: `power, fingers, endurance, technique, head`. Default is 0 (14000). Character creation sets them:
  - Archetypes (30700–30724) sum to 37–40 (All-Rounder is 8/8/8/8/8).
  - Origins add −5 to +6 (31399–31471).
  - A random talent pair: one good skill ×1.35 (or 1.1) and one bad skill ×0.7 on gains (QC 31474, `fge` 31788).
- **Grade curve** (16190–16196):
  - `Nd(g) = 8g + 2.4g²` is the skill average needed for grade g.
  - `oc(avg) = (−8 + √(64 + 9.6·avg)) / 4.8` is the continuous grade.
  - `st = min(floor(oc), 18)` is the displayed grade. `ot(skills)` = average of the 5 (25963).
  - Thresholds: V1 = 10, V3 = 46, V5 = 100, V8 = 218, V10 = 320, V12 = 442, V15 = 660, V18 = 922. Each grade costs more than the last (V0→1 costs +10, V17→18 costs +92).
- **The grade is the average of all 5 skills,** including head. A lopsided climber shows a lower V than their best style.
- **Per-route strength.** Each route type blends two skills, 65% primary + 35% secondary (`Yl` 25897):
  - crimp = fingers/technique
  - power = power/fingers
  - endurance = endurance/technique
  - technical = technique/head
  - dyno = power/head
  - crack = technique/fingers

  So a specialist climbs above their displayed V in their own style.
- **No cap on skills and no passive decay.** Losses happen only through:
  - "stints" (away jobs), which decay skills by 1.5–14% (`GG` 52838);
  - surgery, which costs −6% power/fingers/endurance (51473);
  - aging multipliers on *effective* skills (below);
  - chronic-injury marks, up to −20% on power/fingers/endurance (`$v` 26044);
  - the clamp bugs (§4).
- **Aging** (25975–25991):
  - Age = 22 + ageOffset + floor((day−1)/**18**). The age-year is 18 days, but the calendar year is 56 days (14-day seasons, `Bl` 20387).
  - Effective skills (`Cn`, used for all odds and minigame windows):
    - technique/head: +1%/yr over 28, up to +15%;
    - power/fingers: −2.5%/yr over 32, floor ×0.6;
    - endurance: −2%/yr over 34, floor ×0.7.
  - The displayed grade and goals use *raw* skills (`vu` 53263), so a 40-year-old sees "V14 in you" but climbs power routes like about V12.5.
  - **Forced retirement at age 45** (`use=45` 26091, applied on sleep at 52516) means day 415 for a normal start and day 235 for Late Bloomer (ageAdd 10, 31457). The retire option unlocks at 30 (`SI`).

### 2.2 Grade systems [ESTABLISHED]
- There is one internal index, 0–18. Boulders show `V{n}`. Sport routes show `Kn(n) = Y3[n]` (22110–22131): 5.10a, 5.10d, 5.11b, 5.11d, 5.12a–d (4–7), 5.13a–d (8–11), 5.14a–d (12–15), 5.15b, 5.15d, 5.16a. The scale is compressed at both ends.
- **The game uses three conversions that disagree:**
  - `Kn`: V10 = 5.13c.
  - The goal ladder `$R` (33877–33893): V10 = 5.14a, V7 = 5.13b, V3 = 5.12a.
  - The "World Class" milestone (18060): "V15 / 5.15c". `Kn(15)` = 5.14d and the goal ladder says 5.15b.
- **trueGrade.** Seven routes are sandbagged or soft (e.g. Gorge Dyno V7→8, The Prow V9→10, Apparition V15→14). Odds use trueGrade. After your first go the game reveals it ("That's no V7 — locals have been sandbagging it", 48833) and logs it in `gradeConsensus`.
- **Grade votes.** After sending you can vote soft/fair/stiff. The displayed consensus moves 50% toward your vote (`Qee` 22034), and votes shift faction rep (`FG` 52936).
- **FA grade call.** On a first ascent you pick −1/0/+1 ("soft/true/stout", 67522). Undergrading gives +3 rep. Overgrading has a 60% chance of −4 rep, otherwise +6 (53374–53377). The boulder cap is 40, so a V18 myth can be called "V19".

### 2.3 Route and crag data [ESTABLISHED]
Crags (`wo` 22831–23048; extracted with `routes.js`):

| Crag | Rock | Unlock | Cost | Fuel (one way) / drive | Climate / closure | Routes | Range |
|---|---|---|---|---|---|---|---|
| Roadside Crag | granite | V0 | – | 12% / 1 h | neutral; season mods | 12 (6B, 4S, 1 trad, 1 open) | V2–V7 |
| Granite Gorge | granite | V4 | – | 22% / 2 h | shaded; **closed spring** (raptors) | 10 | V5–V9 |
| Moonstone Boulders | quartzite | V6 | $400 + $20 permit/trip | 30% / 3 h | desert | 9 | V6–V12 |
| Sandstone Mesa | sandstone | V7 | – | 35% / 3 h | desert; **closed summer** | 11 | V7–V13 |
| Wind River Walls | granite | V9 | $800 + $35 permit | 40% / 4 h | shaded; **closed winter** | 9 | V9–V15 |
| The Big Stone | granite | V8 | $600 | 38% / 4 h | shaded | 5 + 3 multi-pitch walls | V6–V12 |
| The Crucible | gneiss | V11 | – | 45% / 4 h | shaded | 9 incl. 2 myths | V13–V18 |
| Psicobloc Cove | limestone | V4 | – | 26% / 2 h | **open summer only** | 8 deep-water solo (DWS) | V2–V9 |
| The Hollow (hidden) | – | V8 + quest | – | 24% / 2 h | shaded | 5 | V8–V12 |

- **Totals.** 78 routes: 38 boulders, 19 sport, 5 trad, 8 DWS, 6 open projects (unclimbed, you FA and name them), 2 myths (V18 "genesis" and 5.16a "sport_myth"; each unlocks after the hardest known line at the Crucible).
- **Types.** power 17, crimp 16, technical 16, dyno 12, crack 9, endurance 8.
- **Grade coverage.** V2–V9: 3–10 routes per grade. V10–V13: 5–7. **V14: 2. V15: 3. V16: 0. V17: 2. V18: 2 (myths).**
- **Gyms** (`yC` 22143, regenerated each 7-day week with seeded names and types, `iH` 22259):
  - Send City: V0–V6 boulders plus sport grades 1–6.
  - The Cave: V3–V10 boulders only. Its boulder types are 3/6 power, 2/6 crimp, 1/6 dyno.
  - The Training Center (Olympic village only): V5–V12 boulders plus sport 5–10.
  - Each gym has specialty skills that get ×1.2 gains (Send City: technique/endurance; Cave: power/fingers).
- **Multi-pitch walls** (`IH` 24244): The Prow (Roadside, 5.12b, 4 pitches); Golden Buttress (5.13b, 5), Obsidian Tower (5.14b, 7) and The Ascendant (5.16a, 8) at The Big Stone. They need rope and harness. Each pitch is 1 h and 9 energy (6 with a partner), with no skin, pump or injury roll. You can bivy on a ledge. Summit pays once: $40 + 12·grade + 10·pitches, 8 + 2·grade rep, and 200 + 40·grade followers (41519).
- **Expeditions** (`Gy` 23321):

  | Expedition | Grade | Pitches / days | Storm odds | Cost | Rep / grade req | Pays |
  |---|---|---|---|---|---|---|
  | El Capitan | 9 | 6 / 10 | 18% | $900 | 60 / V7 | $2,400 |
  | Cerro Torre | 12 | 8 / 16 | 44% | $2,200 | 140 / V10 | $6,000 |
  | Trango | 14 | 11 / 24 | 56% | $4,500 | 240 / V12 | $12,000 |

- **Approach** (`ene` 23053, `EO` 23110). Each crag has 1–3 legs, each with a push or save choice (energy × mult, mishap risk). A crag you know can be "walked on autopilot" (`pP` 42703).

### 2.4 The attempt flow, step by step [ESTABLISHED] (`gn` climb branch 47961–49220)
1. **Gates:**
   - rain, seasonal closure, lost access, surgery;
   - declared rest day;
   - energy ≥ 12 (gym) or 18 (crag, 14 with a "psych" partner);
   - hunger > 0, psyche ≥ 12, gym fee $5 (waived if you set at the gym);
   - gear: pad for boulders, rope and harness for sport, rack + rope + harness for trad, gloves for cracks;
   - tier-3 injury "comeback cap"; sick tier ≥ 2;
   - ACWR ratio > 1.7 ("You're fried");
   - pump ≥ 92 (48046–48048).
2. **First time on a route** opens the "COLD START" modal: "Go for the flash" or "Suss it out" (77020–77070, `be` 41344).
3. **Trad** opens the "RACKING UP" choice: bombproof (+0.05, +4 energy) or sparse (−0.05, ×1.35 rep, +6 psyche, more close calls). **No minigame is played for trad at all.** The ±0.05 is passed in as the "bonus" (41349, 30324–30326).
4. **Dyno-type route (boulder or sport):** one *dyno catch* (47983).
5. **Sport:** endurance type gets **HOLD TO CLIMB**; other types get one minigame of their type (47991).
6. **Other boulders and DWS:** the *move sequence* `jr` (29006) builds 1–15 moves. Beat moves (crux plus any move with weight ≥ 0.12, 1–5 beats) each launch a minigame of that move's kind (`cj` 45359). A beat of kind "dyno" or "endurance" falls through to the **hold-to-load** default. Replicating `jr` gives **3.9 beats on crimp, 3.7 on power, 4.4 on technical, 3.5 on endurance, 1 on crack and 1 on dyno boulders** (`seq.js`).
7. **Results.** Any failed beat means the attempt ends as a fall at that move (48113–48127). If every beat passes, the bonuses are averaged and the dice resolve.

### 2.5 The odds function and its inputs [ESTABLISHED]
`Vd(skills, route, mods)` (25964):
```
mix = 0.65·primary + 0.35·secondary        (effective, age-adjusted skills)
R   = oc(mix) − (trueGrade ?? grade)
A   = 0.5 + (R<0 ? 0.42 : 0.30)·R + mods
if R ≤ −1.5: A = min(A, 0.13);  if R ≤ −2.5: A = min(A, 0.03)
floor = 0.05 / 0.025 / 0.01 / 0.003 by R band;  clamp(A, floor, 0.95)
```
Odds by R (`odds.js`):

| mods | R = −2 | −1.5 | −1.49 | −1 | −0.5 | 0 | +1 |
|---|---|---|---|---|---|---|---|
| none | 1% | 3% | 3% | 8% | 29% | 50% | 80% |
| gear +0.17 | 1% | 4% | 4% | 25% | 46% | 67% | 95% |
| gear + full beta (+0.57) | 13% | **13%** | **44%** | 65% | 86% | 95% | 95% |
| + a good minigame (+0.84) | 13% | **13%** | **71%** | 92% | 95% | 95% | 95% |

The mods are summed in `xa` (48194–48262). Magnitudes:

- **Gear** (`kR` 33164). Shoes +0.04 to +0.12 (× condition and break-in, + lean +0.05). Chalk bag +0.04 to 0.06. Chalk +0.02 to 0.06 (consumable). Pad +0.08 on *any* outdoor climb. Crack gloves on cracks.
- **Beta** (`_T` 28890). +0.05 per beta point, 0–8, so up to **+0.40**.
- **Conditions, outdoors only:**
  - weather × climate (`J1` 24389): prime +0.12, hot −0.12; desert −0.08; shaded +0.06 (+0.10 when hot);
  - golden-hour window, a daily 2–3 h slot per crag (`C_`): +0.08;
  - time-of-day heat (`Z5`): ±0.09;
  - after rain (`R_`): seeping −0.07, damp −0.04, washed clean +0.04;
  - crowd (`Boe` 24517): +0.03 / 0 / −0.015 / −0.03;
  - crag tier (regular/local/legend): +0.02/+0.03;
  - send-train heat: up to +0.08;
  - season at Roadside only (`B9`): −0.06 to +0.05;
  - a rare "perfect day" (`Y8`): +0.07.
- **Partner** (`i2` 21779). +0.05 to 0.08, +0.01 per shared session (max +0.06), +0.03 on their favourite style. Rapport +0.02, romance +0.03, two-partner combos (`e_`).
- **Body state:**
  - injury −0.14/−0.32 and sickness −0.12/−0.30;
  - energy < 50: up to −0.18; hunger < 35: up to −0.15; not warmed up: −0.07 (`lv` 26337);
  - skin < 40: up to −0.20 on crimp, −0.22 on crack (`AI`);
  - **pump: up to −0.34** (`uI` 25884);
  - psyche +0.03 to −0.16 (`HI`), rattled up to −0.10, fear up to −0.10, burnout up to −0.05.
- **Identity:**
  - traits (`Py`): +0.04 to 0.10 per type;
  - signature moves: +0.10 each, up to 2 (`N2`);
  - style balance (`Cv`): +0.07 to −0.12, and a neglected style is "anti-style" at −12%;
  - scars: up to −0.12;
  - body type: ±0.08 (`Wl`);
  - boldness on a first go: +0.0015·b, i.e. **up to +0.15** (`rN` 32015); loner alone: up to +0.08;
  - quirks, legacy boons (+0.03/+0.04), path "abilities" (+0.12/+0.15), first-go traits.
- **Session:**
  - training phase: peak +0.08, deload −0.05;
  - taper +0.03 (last day +0.06);
  - "window" +0.05 / "cooked" −0.06 (`Bse` 26321);
  - last go +0.06;
  - read the line +0.06 / −0.04; brush +0.03; tick mark +0.02;
  - life milestones +0.02 each (max +0.10);
  - holiday +0.04; charity +0.03; energy drinks +0.02 to 0.03;
  - random **flow** (+0.10, chance up to about 30% near your limit when fresh; `Pie` 26819).
- **Minigame bonus** (see 2.6): +0.12 to +0.40 on success.
- **Execution floor** (`cfe` 30360). If average minigame quality ≥ 0.78 and you are above the grade by d, odds get a floor of `((q−0.78)/0.22)·d·0.3`.

### 2.6 The seven climbing minigames [ESTABLISHED] (params 25420–25866, loops 41335–43634, UI 76820–81060)
Window sizes shrink as R (skill mix minus grade) falls. Values at R = 0 and R = −2:

| Verb | Used for | Rule | Window at R=0 → R=−2 | Success bonus |
|---|---|---|---|---|
| **Dyno catch** | dyno routes | tap when the ping-pong marker (900 ms period) is at centre | **±28 ms → ±18 ms** | 0.15–0.40 by closeness |
| **HOLD TO CLIMB** | sport endurance, endurance pitches | hold: height +27%/s, pump +`N_`%/s (34–74); release: pump −42%/s; 14 s limit | pumpRise 56 → 66 %/s | 0.12–0.35 by `1 − final pump` |
| **Hold-to-load** (default) | endurance boulders, dyno-kind beats | hold, bar +1.1/s, release inside 0.70 ± band; **same 636 ms every time** | ±86 ms → ±47 ms | 0.15–0.40 |
| **Crimp needle** | crimp | keep a needle (±0.95/s) in a band around a random centre; fill 1.0 in 5.2 s | band ±0.093 → ±0.048 | 0.15–0.40 by speed |
| **Slab balance** | technical | cursor always moves (hold right / release left), track a drifting target; 6 s | ±0.072 → ±0.038 | 0.15–0.40 |
| **MASH** | power | tap +0.12, decay −0.55/s, reach threshold in 1.9 s | 0.79 (~15 taps) → 0.86 (~16 taps) | 0.15–0.40 |
| **Jam** | crack | tap in band on a 640 ms oscillation; 3 hits before 2 slips; 9 s | ±30 ms → ±17 ms | 0.15–0.40 |

- **Free Solo mode** multiplies bands by 0.72 and adds +0.07 to MASH thresholds (`Ou`/`Vz` 25441).
- **What the minigames ignore.** None of them read pump, skin, energy or psyche. The HOLD TO CLIMB pump bar starts at 0 every time (41383).
- **Share of minigames by verb** (`mix.js`, 52 weeks of gym sets plus all outdoor routes):
  - Send City: slab 30%, crimp 28%, MASH 18%, load 12%, dyno 6%, **HOLD 6%**;
  - the Cave: **MASH 53%**, crimp 36%, dyno 5%, load 3%, slab 3%;
  - outdoors: MASH 29%, crimp 27%, slab 21%, load 7%, dyno 7%, jam 5%, **HOLD 2%**.

### 2.7 Resolution, falls, send types [ESTABLISHED]
- **Per-move model** (`VD` 29105). The overall odds w are spread over moves by weight: each move survives with probability w^weight, adjusted on beat moves by the minigame bonus. A fall is logged at a specific move ("Off at the bad left crimp — move 4 of 7", "NEW HIGH POINT linked 5/7"). Routes with a single minigame (sport, dyno, trad) roll once, and a fall there counts as full progress (ks = 1, 48289).
- **Send types** (48365–48368):
  - first-go send outdoors, alone: **onsight**;
  - first-go send in the gym or with a partner: **flash**;
  - first send after earlier attempts: **redpoint**;
  - later sends: repeats.
- **Rewards:**
  - rep on first sends: (1+g)·2 outdoors, ×1 in the gym; onsight ×1.6; declared flash ×1.4; trad +10 (48470);
  - redpoint cash: **$10 + $10·g** (48459);
  - onsight: +4+g head, flat (48457);
  - trad send: +3 head.
- **Falls:**
  - psyche −3; rattled +12 at or above your limit (−4 below);
  - "close call" chance of 14–40% (bold, padless, or sparse trad) → +18 rattled, −10 psyche, 12% chance of a shoulder scar (48306–48316);
  - DWS falls splash down;
  - flapper chance when skin < 25 (up to 0.45 × 1.7 on a crimp move), which sets skin to 3 (`Jse` 26379).
- **Consolidation.** Five different first sends at a grade gives +2 head and 6+2g rep (`TO` 22658).
- **The goes counter** (`goesToday`, 48662) drives `Bse`: goes 2–5 give +5%, beyond that −1.2% per go down to −6%. It only applies if fewer than 2 hours have passed since the last go.

### 2.8 Costs and recovery per go [ESTABLISHED]

| | Gym | Crag |
|---|---|---|
| Energy | 12 × vs | 18 × vs (vs = 0.6 + 0.4 × fraction climbed) |
| Time | **1 h** | **2 h** |
| Hunger | −8 | −8 |
| Load | (12 + 2g)·vs | (18 + 2g)·vs |

- **Skin per go** (`Fse` 26345): base crimp 12, crack 15, endurance 10, power 8, dyno 7, technical 5; ×1.35 outdoors; × rock (sandstone 1.25, quartzite 1.12, granite 1, gneiss 0.95, limestone 0.85); crack gloves ×0.5. Recovery is +55/night (+25 with salve), minus up to 12% for consecutive days on (52400). A rest day gives +55.
- **Pump per go** (`hI` 25877): `clamp(16·type·(1+0.06g)·(1−min(end,100)/260), 6, 40)`, ×1.6 for sport. Recovery:
  - shake: −34 pump, 30 min;
  - short rest: −34 pump, 1 h, +4 energy;
  - long rest: −68 pump, 2 h, +10 energy;
  - **ending the session: pump reset to 0** (36957, 39021).
- **Warm-up:** −8 energy, −4 skin, 1 h. It removes the −7% and the ×1.6 injury multiplier.
- **"One more go"** (offered when energy or skin < 35 or it is after 6 pm, once a day): +6% odds, −8 skin, ×1.4 flapper and ×1.5 injury risk (37460).

### 2.9 Skill growth (XP) [ESTABLISHED] (48412–48458, constants 28544–28550)
```
Tu   = ED(g, sent) · f5 · u5 · (gym ? origin.gainIn : calling.skillOut) · Zre(styleXP)
ED   = sent ? 8 + 1.4g : 4 + 0.7g
f5   = sent ? 1 : 0.45 + 0.55·progress
u5   = (sent && g ≥ currentGrade) ? 1 + 0.4·(g − cur + 1) : 1        (repeats count too)
primary   += round(Tu · talents · traits · quirks · discipline(1+d/500) · hi(skill) · phase · ACWR(0.6 if >1.5) · gymSpecialty(1.2) · staleness)
secondary += round(Tu/2 · … · hi(skill))                              (no staleness)
hi(s) = 1 / (1 + s/40)   → 1.0 at V0, 0.29 at V5, 0.11 at V10, 0.057 at V15, 0.042 at V18
```
- **Style balance.** `Zre` is ×0.85 for over-specialized styles and up to ×1.45 for neglected ones. `Cv` gives the odds side (+7% to −12%).
- **Staleness** (`zD` 28601), keyed per primary skill by stimulus (`c:type:venue` or `t:protocol`):
  - repeating a stimulus: +0.1 staleness (gain ×(1 − 0.5·stale), down to ×0.5);
  - switching: −0.45 staleness, and a switch from stale ≥ 0.55 gives a ×1.6 "breakthrough".
- **Flat, undiminished sources** (no `hi()`):
  - onsight: +4+g head;
  - solo: +8+g head;
  - consolidation: +2 head;
  - Dex as partner: +2 head per go;
  - expedition summit: +8 head;
  - **job shifts:** warehouse +3 power/+2 fingers, setting +1–6 technique, coaching +2 head/+1 technique, courier +3 endurance, rescue +2/+2 (10938–11144, 45410);
  - **cooked meals:** +2–3, +0–2 for quality (28136, 45286);
  - random events and encounters: +1–4 (19468, 20322).

### 2.10 Projects and beta [ESTABLISHED]
- **State.** `projects[id] = {beta 0–8, sent, moves, solved, highMove, ticked}` (48361). `projLog` keeps up to 20 goes per route across up to 40 routes (29067), with move, conditions and partner, and feeds the "The file on it" dossier. After 4 or more logged goes, a send writes a legacy line ("went down on go N, X days after...").
- **Learning.** Each fall solves the next move with p = clamp(0.25 + 0.55·Vd₀, 0.12, 0.8), +0.22 with a beta partner (Sage or Dell) and +0.1 with siegecraft. Beta = round(solved/moves × 8).
- **Get Beta** (50626) is available once beta ≥ 1. It costs $15 + 6g, or is **free with a crag partner**, and sets beta to 8 (**+40%**) with every move wired.
- **Prep:**
  - Read the line: free, p = 0.55 + 0.12R, +0.06 / −0.04 on the next go.
  - Brush the holds: −4 energy, +0.03 on the next go.
  - Tick mark: free, +0.02 until sent.

  Read and brush reset after each go.
- **Nemesis project.** The player commits to one line; the game tracks burns and seasons and pays +20 + 4g rep on the send (73356, 49001). There are also field notes (`Xee` 22032), a life list, crew projects (at least 2 grades above you), and rival races and FA races.

### 2.11 Training [ESTABLISHED]
- **Protocols.** 16 in `ID` (28617), each with primary/secondary weights 0.3–1.6, load 2–22, energy 6–22, 1–2 h, and a location: van (hangboard or pull-up bar needed) or gym:
  - max hangs, repeaters, density;
  - pull-ups, campus, core;
  - ARC, 4x4s;
  - run, ride, swim;
  - footwork, falls, visualize;
  - prehab (injury ×0.6 for 8 days);
  - stretch.
- **Gain formula:** `8 · coach(1.15/1.3) · weight · … · hi · phase · ACWR · gymSpec · burnout · origin(1.12) · staleness · (0.6 + 0.7·quality)`. Quality comes from 4 rep-minigames (hold, tap, pace, precise; `tce` 28837). Training is free in the gym (no entry fee), and **the "fried" block does not apply to it**.
- **Phases** (`Jd` 28552):

  | Phase | Gain | Injury | Odds | Extra |
  |---|---|---|---|---|
  | Base | ×1 (×1.15 endurance/technique) | ×0.8 | – | |
  | Build | ×1.2 (×1.38 power/fingers) | ×1.2 | – | |
  | Peak | ×1.15 | ×1.45 | +0.08 | |
  | Deload | ×0.5 | ×0.2 | −0.05 | acute ×0.8 each night |

  You can switch at any moment for free (91209).
- **Rest types** (`W1` 28858; `rest` 49619):

  | Type | Energy | Acute cut | Extra |
  |---|---|---|---|
  | Full | +35 | −40% | |
  | Active | +18 | −22% | +1 technique |
  | Mobility | +10 | −18% | heals injury |

  All three also give +55 skin and +22 psyche, and apply an extra load-model (EWMA) step. **No time passes.** Climbing is blocked for the rest of that day.
- **Taper** (88744). Four days of +0.03, +0.06 on day 4. No restrictions, no cooldown.

### 2.12 Load, injury and fear [ESTABLISHED]
- **Load model.** Acute and chronic loads are exponentially weighted averages (EWMA) of daily load with α = 1/4 and 1/14 (`MN` 32440), applied at sleep. Ratio `Gi` = acute/chronic, but only once chronic > 6.
  - Ratio > 1.7: **climbing blocked**.
  - Ratio > 1.5: gains ×0.6.
  - Ratio > 1.3: injury chance per go = min(0.4, 0.3·(ratio − 1.3)) × type (crimp 1.5, power/dyno 1.2, crack 1.3) × phase × unwarmed 1.6 × last-go 1.5 × age (+3%/yr over 28) × scars × boldness × traits × prehab 0.6 × underfeeding up to 1.5 (48506–48523).
- **Severity** (`uR` 32183). Tier 1 is 2–4 days, tier 2 is 6–9 days plus a $180 clinic bill, and tier 3 is 13–18 days plus $850, rehab, **fear** (−7% on crimps or dynos until faced) and a possible permanent scar.
- **Chronic "marks"** (−5% to −20% effective strength) come from climbing while injured, and PT keeps them quiet.

### 2.13 Conditions [ESTABLISHED]
- **Seasons** are 14 days each (`Bt` 20388). Weather weights in prime/fair/hot/rain order (`As`):
  - spring .35/.45/.05/.15
  - summer .10/.35/.45/.10
  - fall .45/.40/.05/.10
  - winter .20/.30/0/.50

  Roadside uses the global weather with a 3-day forecast. Other crags use a deterministic per-day hash with climate tweaks (`_x` 24424).
- **Crowds** (`Yg` 25379) depend on crag popularity, weekend ×1.7, hour, weather and season. A busy crag produces spray beta (+1 beta) and send trains.
- **Closures:**
  - seasonal (above);
  - "access threats": 10 days to raise 100 points via trail days (22 points each) or $40 donations (18 each). Failing shuts the crag for 24 days (52024);
  - a poached-closure stance shuts it for 21 days;
  - buying the land into trust ($23–25k, `$_` 24531) makes a crag never close.
- **Stewardship** gives standing and faction rep.

### 2.14 Other disciplines [ESTABLISHED]
- **Free Solo mode** (a choice at run start, 100538–100604). Every *outdoor sport route* and every wall pitch is soloed:
  - you pass if minigame quality ≥ `OW` = 0.92 − 0.09·(grade margin), minimum 0.4 (30370);
  - failing is **game over** (48196);
  - success gives +8+g head (flat), (1+g)·6+20 rep and 150+50g followers, but no tick, no "sent" flag and no other skills;
  - boulders keep pads, DWS keeps water, and the gym ropes up.
- **DWS:** no injury roll, splash falls.
- **Trad:** rack choice, no minigame.
- **Crack:** gloves required.
- **Highballs:** only the generic close-call rule; there is no highball flag on routes.
- **Speed:** Send City's speed wall has a reaction start and a climb (`FP` 43845): −7 energy, +4·hi power and +1.6·hi technique, and a PB. **No time cost.** Speed also appears in comps.
- **Dyno comp** (fall festival): pure dice, `power·0.45 + head·0.2 + rand·46` against 7 rivals at `(V+z−3)·3 + rand·42` (43248).
- **Expeditions:** each day is lead (22 energy), dig deep (+14 energy, +0.28) or rest in camp. Pitch odds are `clamp(Vd(endurance route)+0.18(+0.28), 0.45, 0.97)` (`c_` 23394), and the UI shows the odds.
- **Ethics stances** (`WH` 25131): chip / closure / retrobolt / FA dispute / trashed crag, each with 3 options plus an elder option.

### 2.15 Travel [ESTABLISHED]
- **Drive** (51000–51045, 52176–52214). Fuel is crag% each way at $0.50 per % (Roadside round trip $12, Crucible $45). Road Dog ×0.6 and the "efficient" upgrade ×0.7. Each drive costs −3 energy and the crag's hours. There is van-part wear per leg and a 25% roadside-scrap find.
- **Blockers:** van breakdowns block every crag except Roadside; a boot clamp blocks driving.
- **On arrival:** a first visit gives +24 psyche; later visits give 12·nT(stale). A partner joins with p = 0.6 + social/250.
- **Crag tier** from visits, ticks and FAs: regular 6, local 20, legend 48. It gives +2%/+3% odds and lets you write a guidebook.

---

## 3. Content inventory [ESTABLISHED]

| Item | Count |
|---|---|
| Crags | 9 (1 hidden, quest-unlocked at V9) |
| Fixed outdoor routes | 78 (38 B, 19 S, 5 trad, 8 DWS, 6 open, 2 myths); 7 sandbagged or soft |
| Gym sets | 3 gyms: Send City 13, Cave 8, Training Center 14 routes per week; 26 boulder names, 12 sport names |
| Multi-pitch walls | 4 (24 pitches) |
| Expeditions | 3 |
| Move-name pool | 36 moves + 3 rests (`sce` 28891) |
| Climbing minigames | 7, plus 4 training-rep kinds, speed wall, approach choices, expedition choices |
| Training protocols / phases / rest types | 16 / 4 / 3 |
| Partners with climbing perks | 7 |
| Climbing traits (`AL`) | 33 (5 paths × 3 tiers, 10 hybrids, 6 style traits…) |
| Talents / body types / callings / archetypes / origins / flaws | 11 / 4 / 4 (3 rungs each) / 4 / 6 / 5 |
| Guidebook histories (`ky`) | 9 |
| Ethics stances (`WH`) | 5 × 3–4 options (+ 5 echo texts, `wae`) |
| Goal ladder | 15 rungs (V1…V17 + summit) |
| Life milestones | 5 |

---

## 4. Bugs and defects

### Confirmed [ESTABLISHED]
1. **P0. Skills clamped to 100.**
   - Where: old-rival coach session `T(skills[K]+13, 0, 100)` (50735); hitchhiker choices (44843); cafe regulars (44902).
   - Scenario: at about day 127 the rival retires, and 40–65% of the time becomes the gym coach (`cJ` 19366). A V9 player (fingers ~266) taps "Session with Dex" (hint: "your old rival coaches here now"). Fingers drop to 100 (−166). Crimp odds drop by about 2.5 grades. The toast says "+13 fingers".
   - The same happens with any hitchhiker or cafe option worth +1 or +2 skill once that skill is above 100 (from about V5 on).
2. **"MAXED — Nothing left to prove" fires at skill ≥ 100** (36585), about V5. Skills keep growing to around 900, so the celebration is wrong by a factor of about 9.
3. **Other 0–100 relics.**
   - Endurance stops cutting pump accumulation above 100 (`T(end,0,100)` 25880).
   - Endurance stops cutting approach energy above 100 (23318).
   - Every path trait unlocks by skill 30–90 (30595–30617) and hybrids at 60/60, so all skill-gated trait progression is finished by about V5.
4. **"Tape up" is free and unlimited.** It gives +22 skin up to 60, repeatably, with no Tape Roll consumed and no time (50900–50907). The hint says "spend a Tape Roll" (55455).
5. **Rest day after climbing** (49619; offered at 88785 with no `lastClimbDay` check).
   - Climb all day, declare "Full Rest": +35 energy, +55 skin, +22 psyche, acute −40% plus an extra EWMA step, injury heals a day, and **no time passes**.
   - Training is still allowed afterwards, because the train handler (50063) ignores `restDay`.
   - Done nightly, this cancels the ACWR model entirely (my exploiter sim: 0 injuries, 1 fried day in 414).
6. **Taper is a free permanent buff.** +3%, with +6% on day 4, re-declarable immediately, and training is not restricted (22057, 88744).
7. **Training phase has no commitment** (91209). Peak can stay on forever (+8%), and switching to Deload before sleep trims acute ×0.8 each night (51898).
8. **The "window" mechanic can't work as labelled.**
   - The window bonus needs `hour − lastGoHour < 2` (26321).
   - A crag go takes 2 h, so the bonus is **never** reachable outdoors.
   - In the gym, "Chalk up, get back on — stay warm" (1 h, 37441) always puts you at 2 h, i.e. "gone off the boil" (55470).
   - Meanwhile "Shake out" (0.5 h) does keep you warm. The labels are the reverse of the effects.
9. **Branded gear not recognized.**
   - `gear.includes("pad")` (48310): owning pad_talon, pad_grit, pad_kestrel, pad_sabor or pad_rig still counts as "no pad" for close-call risk.
   - `gear.includes("crackgloves")` (48675): branded gloves don't halve crack skin loss, despite their perk text.
10. **DWS routes demand a crash pad** (gear check 47996–48011), and the list shows "boulder · need a crash pad" for Psicobloc Cove. The pad also adds +8% there.
11. **Free minigame abort.** All 7 minigames show ✕ "Back off the climb" until the result appears (76857, 77212, 77550, 78031, 78225, 80719, 80922). It cancels with no energy, time or log cost, so any crimp, slab, crack or HOLD attempt that is going badly can be retried for free.
12. **"Go for the flash" dominates "Suss it out."** The flag `Lr` only adds benefits: +5 psyche, ×1.3 followers, ×1.4 rep, and beta ≥ 2 on a fall (48297, 48334, 48360, 48477). Suss it out has no upside.
13. **Grade-vote farming** (52936–52960). Toggling "stiff" on a sandbagged route gives +2 trad faction each time. Un-voting costs nothing.
14. **Stale building hint.** "The Crag: -35 energy · +6 climb · 3h" (11055); the real cost is 18 energy and 2 h per go.
15. **Three V→YDS conversions** (22110 vs 33877 vs 18060). "V7 / 5.13b — earn the Mesa" in the goals, but a V7 sport route displays as 5.12d.
16. **"A full year on the road" after 18 days.** The `dirtbagyr` milestone (18051) and `year` story (32005) use the 18-day age-year, while the calendar year is 56 days.
17. **Pump bookkeeping ignores partial goes and rest moves.** State pump uses full `hI` (48733), while the session summary uses `hI·vs − rest` (48811). A fall on move 1 costs as much pump as a full send, and "no-hands rest" moves do nothing.
18. **Chipped holds have no mechanical effect** (37012, 48534). "It goes at your limit, easily" is text only; route odds are unchanged. Only the tick name gets "(chipped)".
19. **The `soloed` save field is never written** (14293). Solo-mode sends set no tick and no "sent", so easy sport solos can be farmed for flat +8+g head, rep and followers, with near-zero risk thanks to the patient HOLD technique (VC ≥ 0.4).
20. **Speed-wall runs take zero game time and no gym fee** (43845–43868). That is +1 power per run until power ~280, i.e. +14 power/day for energy alone.
21. **Dyno-comp scale mismatch** (43249–43255). Skills grow quadratically but rival scores grow linearly, so the win is guaranteed from about V5 (at V8, your minimum score of 142 beats the rivals' maximum of 75).
22. **Expedition grade requirements mislead.** El Capitan says "V7", but the objective is grade 9 and odds bottom out at 45%/pitch. My policy sim (`exped.js`, 10 days, storms, energy 22/36 per lead, +48/+32 per rest) gives:
    - at V7: about 5% leading only, about 13% digging deep. Expected value is −$590 to −$790 per $900 trip;
    - at V9 (p≈.68, dig .96): about 58%;
    - at V10 and above: about 79%.

    Cerro Torre at its V10 requirement is about 6%.
23. **Late Bloomer is silently short.** Origin text says "Started at 32… less spring". In fact retirement is forced at day 235 (vs 415), and power/fingers start decaying at the first age-year tick (day 19, −2.5% per 18 days). Sim: career peaks at about V13.
24. **"Fried" blocks climbing but not training.** The high-intensity protocols (campus, max hangs) stay available at ratio > 1.7 (48046 vs 50063).
25. **FA "Call it stout" on a V18 myth logs "V19"** (boulder clamp 40, 67526 / 53374), past the game's stated ceiling.

### Suspected [INFERRED]
- **Early "You're fried" blocks.** Any steady climbing from a cold start blocks you around days 3–6 and again around days 8–14, with 2–12% per-go injury risk on days 7–24 (`acwr.js`). This is likely confusing and a churn point in hour one. Needs a playtest.
- **Walk-out pump reset.** Ending the session resets pump to 0 (39021), which makes "shake out" and pump management optional. Probably intended as per-session pump, but it is free.
- **Dyno and crack windows** of ±28–30 ms at your own grade (±17–18 ms at R = −2) are likely to feel unfair on touch screens with 30–80 ms input latency.
- **Flash declaration on weekly gym sets.** Weekly regenerated gym routes force the COLD START modal on every new route, up to about 13 modals per week at Send City.

---

## 5. Balance and pacing

### 5.1 Simulation method [INFERRED model of ESTABLISHED formulas]
`sim2.js` replicates:
- `Nd`/`oc`/`st`, `Vd` (with caps), `ED`/`f5`/`u5`/`hi`;
- talents, discipline growth, phase, ACWR (gain ×0.6, block, injury), staleness, `Zre`/`Cv`;
- aging `C2` and the forced retirement at day 414;
- per-route beat counts from the real `jr` (seeded hash);
- weekly gym sets (the real `yC` hash) and the real outdoor route list with unlock grades and costs, seasonal closures and weather weights;
- energy, time and pump per go, beta learning and buying, onsight head, consolidation, work-shift flat gains, and training sessions.

Per-beat minigame pass rates are my assumption (average player: crimp .88, slab .85, MASH .80, load .95, jam .55, dyno .55, HOLD .97; ±0.035–0.07 per grade of R; good player higher). I ran 200–300 seeds per profile.

### 5.2 Results: in-game days to reach a grade (median, 10th–90th percentile)

| Profile | V3 | V5 | V8 | V10 | V12 | V15 | V18 | Final |
|---|---|---|---|---|---|---|---|---|
| Typical (average minigames, Base, office job, 5 gym / 4 crag goes, trains every other day, weekend crags) | 8 | 20 (15–27) | 51 (42–70) | 80 (71–102) | 122 (107–143) | 266 (239–306) | never | V16 |
| Typical + 1 cooked meal/day | 6 | 17 | 48 | 75 | 110 | 213 | 378 (90%) | V18 |
| Typical + 2 meals/day | 5 | 16 | 46 | 70 | 99 | 184 | 305 | V18 |
| Good player, greedy route choice, Base | 4 | 16 | 46 | 69 | 95 | 178 | 326 | V18 |
| Engaged (good, Peak, setter job, daily training) | 4 | 19 | 52 | 90 | 128 | 196 | 321 (88%) | V18 |
| Exploiter (rest-day trick, taper, speed wall, warehouse, 2 trainings) | 5 | 12 | 28 | 46 | 71 | 134 | 243 | V18 |
| Late Bloomer (typical play) | 8 | 20 | 52 | 83 | 126 | never (retires day 235) | never | V13 |

**Real time.** I estimate about 4.5 real minutes per in-game day [INFERRED], range 3.5–6. Per day that is roughly:
- walking 1–2 min;
- 5 goes × ~15 s, since a boulder go is about 3 minigames × ~3 s plus menus;
- the job minigame, 0.5–1 min;
- modals and sleep, about 0.5 min.

The in-game clock runs at 1 game-minute per real second while you roam (38651).

| Grade | Real time (typical) | Real time (fast player) |
|---|---|---|
| V3 | ~35 min | ~20 min |
| V5 | ~1.5 h | ~55 min |
| V8 | ~3.8 h | ~2.1 h |
| V10 | ~6 h | ~3.5 h |
| V12 | ~9 h | ~5.3 h |
| V15 | ~14–20 h | ~10 h |
| V18 | out of reach for typical players | ~18–25 h |

A whole career is about 31 h.

### 5.3 Verdict by phase [INFERRED]
- **Early (V0–V5): too fast and too frictional at once.**
  - V1 on day 2 and V3 inside the first week; `hi()` is near 1 and one Send City session gives about +20 skill.
  - The same new player hits "You're fried" around day 3 because of the ACWR cold start.
  - Every skill-gated trait (paths, hybrids) and the "MAXED" toasts all land by about V5, so the reward schedule is front-loaded and then goes quiet.
- **Mid (V5–V12): the best part of the curve.** About 10–14 days (~1 h) per grade. New crags open at V4, V6, V7, V8, V9 and V11, each a real trip with fuel, permit and unlock money. There are enough routes (5–10 per grade).
- **Late (V12–V18): grindy, short on content, fighting the clock.**
  - `hi()` falls to 0.08–0.04, so a limit send gives about 2–3 skill points after rounding.
  - Routes run out: V14 has 2 and V16 has 0.
  - Aging erodes effective power and fingers from day 181.
  - Forced retirement at day 414.
  - Most late progress comes from things other than climbing. At V15, one cooked meal (+2–5) beats one limit send (+2.3 primary), and a warehouse shift (+5) equals two sends.
- **Satisfying, grindy or too fast?** Too fast early, good in the middle, grindy and chore-driven late. V18 "first ascent of the impossible" (the final goal) is unreachable for typical players before they are forced to retire, and nothing warns them.

### 5.4 Per-action skill yield (primary, before rounding; `odds.js`) [ESTABLISHED formulas]

| Grade | Limit send | Send at g+1 | Fall | Max hangs | Meal (flat) | Warehouse shift (flat) |
|---|---|---|---|---|---|---|
| V5 | 6.0 (+3.0 secondary) | 8.4 | 1.6 | 3.5 | 2–5 | 5 |
| V10 | 3.4 (+1.7) | 4.7 | 0.9 | 1.4 | 2–5 | 5 |
| V15 | 2.3 (+1.2) | 3.1 | 0.6 | 0.7 | 2–5 | 5 |

### 5.5 Other balance notes
- **The odds cliff at R = −1.5** is the real grade gate. The playable window is about 1.5 grades above your skill mix, and inside it gear (+0.17), beta (+0.40) and the minigame (+0.26 average) push dice odds to the 0.95 ceiling. So "at-grade" sends come down to minigame pass rates, and everything above the window is a flat 13%.
- **Get Beta** (+40%, free with a partner) turns a redpoint into one fall plus one tap. The move-by-move beta system underneath it is good and mostly bypassed.
- **The crag is less efficient than the gym.** A crag go takes 2 h and 18 energy, a gym go 1 h and 12 energy, so the gym gives about 1.6× more XP per day. Crags win on unlocks, rep, redpoint cash ($10 + $10g), onsight head and route variety. That is an acceptable trade, but players need to know it.
- **Expeditions** only pay off from about V9–V10. El Cap summits about 58% of the time at V9 and about 79% at V10 and above, for +$2,400, +80 rep and +4,000 followers. At the listed V7 requirement it is 5–13%. Energy and storm days cap success even when per-pitch odds are high.
- **Solo mode** is likely *easier* for patient players, because repeatable flat-head farming on easy sport solos out-earns normal climbing [INFERRED].

---

## 6. UX and clarity from the player's seat

1. **The number on the route is not the chance of sending.** The list shows `Vd` without the minigame bonus (55669–55757). A clean execution adds 12–40 points, and a failed beat means a guaranteed fall. Players can't tell whether 45% means "hard" or "easy if I execute".
2. **The cliff is invisible.** A route shows 44% (or 71% in practice); the next one shows 13%. Nothing says "out of your league until your crimp mix reaches V8.5".
3. **"Grade = average of all five skills" is never explained.** The You panel shows raw numbers (91023) and "V9 in you". Head-poor climbers will be confused about why they are stuck.
4. **Aging and retirement are hidden.** There is no countdown and no "career day X of 414". The Late Bloomer text hides a 44% shorter career.
5. **Six verbs are never taught together.** Their difficulty scales invisibly with skill. Dyno and jam windows of about ±28 ms feel random on phones [INFERRED].
6. **MASH fatigue.** In the Cave, half of all minigames are mashing: about 3–4 mash rounds per power problem, 5–7 problems a day, for 40+ in-game days [INFERRED from `mix.js`].
7. **Modal load per attempt.** COLD START on every new route, including weekly gym sets; then 1–5 minigames with 0.75 s result cards each; then toasts and a banner. A day of 5 goes means about 20 overlays.
8. **Contradictory labels.**
   - "Chalk up, get back on — stay warm" actually ends the window.
   - "Suss it out — no stakes" is strictly worse.
   - "Tape up — spend a Tape Roll" spends nothing.
   - "MAXED" at V5.
   - The crag building says 35 energy / 3 h.
   - Three grade conversions.
9. **Good clarity worth keeping:**
   - route hints ("your style / anti-style / suits your build / local testpiece");
   - fall messages naming the move;
   - "NEW HIGH POINT linked 5/7";
   - dossiers;
   - expedition odds shown up front;
   - day-start card with skin recovered;
   - bars that turn red when they start costing you (changelog v0.6xx).

---

## 7. Overlaps, bloat, dead or vestigial systems

- **Too many small odds terms.** About 45 additive terms (§2.5), many worth 0.02–0.04. Most are invisible, can't be learned, and are drowned out by beta (+0.40) and the minigame (+0.40) [INFERRED]. Candidates to merge: crowd, crag tier, perfect day, holiday, life milestones, standing tip, charity, consumables.
- **Free-buff chores rather than decisions:** read the line, brush, tick mark, tape, warm-up, taper, phase switching, flash declaration, rest-day-after-climb. An informed player always does all of them [ESTABLISHED effects / INFERRED behaviour].
- **Overlapping recovery systems:** shake, short rest, long rest, session-end reset, rest day (3 types), deload, taper, prehab, mobility and PT. Pump alone has four ways to fall.
- **Dead or vestigial:**
  - `soloed` (never written);
  - chipped holds (no mechanical effect);
  - the "MAXED@100" celebration and the other 0–100 relics;
  - the crag building hint;
  - `lastGoHour` window outdoors (unreachable);
  - `highMove` stays at 0 on single-roll routes.
- **Duplicate beat content.** A 4-beat power boulder is 4 identical MASH rounds. Off-type moves exist (`cce`), but only on routes with 5 or more moves, and "dyno"/"endurance" beats all collapse into the same hold-to-load minigame.
- **Weekly gym sets are throwaway.** New IDs every 7 days wipe projects, beta and the "file", so gym projecting can't persist.

---

## 8. Opportunities (prioritized; effort S/M/L)

### Now: fix (P0/P1, S)
1. **Remove the skill clamps** at 50735, 44843 and 44902 (use +amount with no ceiling, or scale by `hi`). Add a save migration that can't restore lost points but can log them. **S**
2. **Rescale or remove the 0–100 relics:**
   - "MAXED" toast becomes a per-grade milestone;
   - `hI` and `i_` should use `hi()`-style curves rather than `T(x,0,100)`;
   - path, hybrid and trait thresholds should be expressed as grades or fractions of `Nd(g)`. **S–M**
3. **Close the exploits:**
   - tape consumes a Tape Roll;
   - a rest day is only allowed if you haven't climbed today, blocks training, and takes hours;
   - taper gets a cooldown and caps training load;
   - phases lock for 5–7 days;
   - ✕ after a minigame starts counts as a bail (energy, pump, log), or is removed;
   - grade votes lock after the first cast;
   - speed runs cost 0.5 h and the gym fee. **S**
4. **Gear checks by category.** `Zn(gear,"pad")` and `Zn(gear,"crackgloves")` at 48310 and 48675; DWS no longer needs a pad. **S**
5. **One grade table.** Pick one V↔YDS mapping (the goal ladder's is closest to real-world charts), and use it in `Kn`, goals and milestones. **S**
6. **Honest labels:** fix the window logic (use real elapsed time or a go counter), relabel rest and shake, and rewrite the crag hint and the El Cap requirement (make it V9, or show the summit odds). **S**

### Next: make the climbing moment match the design intent (P1, M)
7. **Let the verbs read the sim:**
   - HOLD TO CLIMB's pump starts at the sim pump, and its rise uses skin, energy and psyche;
   - crimp band narrows with low skin;
   - MASH threshold rises with fatigue;
   - the load window tightens when you are pumped.

   The player then *feels* the eighth go. **M**
8. **Make HOLD TO CLIMB the backbone of routes, with at most 2–3 beats per boulder, verbs varied by the move.** Retire MASH as the power verb and replace it with a hold-to-load plus release-timing throw. Widen dyno and jam windows to ≥ ±60 ms and add a touch-latency offset. **M**
9. **Replace "failed beat = guaranteed fall" with a large odds penalty on that move** (the `VD` per-move model already supports this). The sim then really arbitrates, and "Off at the crux, move 5 of 7" becomes the common, readable outcome. **M**
10. **Replace the −1.5/−2.5 hard caps with a smooth logistic.** Show the *true* send estimate: a clean-execution range, e.g. "38–71% · clean beats +25" (see the UE plan's `ResolveAttempt` timeline). **M**
11. **Rework beta.** "Get Beta" becomes +1–2 moves solved per purchase or per partner session, keeping the move-by-move learning; siege is the game. **S–M**
12. **Make the flash decision real.** Declaring gives the bonuses, but a failed declared flash costs psyche and burns the onsight for the season. "Suss it out" gives +1 solved move. **S**

### Then: pacing and content (P1/P2, M–L)
13. **Put flat skill sources through `hi()`,** or make them temporary buffs (meals give +odds for the day). That makes climbing the main engine of late progression. **S**
14. **Slow week 1** (raise the `hi()` constant for the first grades, or start skills near V0.5 and raise `n3`). **Add 6–10 routes at V13–V17** (no V16 routes today) and a second top-end crag. **M**
15. **Surface the career clock:** "Season X, Year Y, age Z, N seasons of prime left"; a retirement warning at 40; the Late Bloomer trade-off written into its card. Consider lengthening the 18-day age-year to the 56-day calendar year, which also fixes "a full year" at day 18. **S–M**
16. **Soften the early ACWR cold start:** chronic seeded at a baseline, or the fried block only after day 7, with a tutorial card explaining load. **S**
17. **Persistent gym projects:** a board or wall problem that stays up 3–4 weeks. The COLD START modal only appears on outdoor lines. **S**

### Cut or merge (P2)
18. Merge read, brush and tick into one "Prep the line" action (+0.05, 15 min). Cut holiday, standing-tip, life-milestone and charity odds terms, or fold them into one "stoke" term. **S**
19. Cut the dyno-comp dice or replace it with the dyno minigame. Cut chipped-holds mechanics or make them real (the crux becomes a jug and the grade drops). **S**

### Add (P2/P3)
20. A **per-move attempt timeline from the sim** (odds, pump and outcome per move), acted out by the presentation layer. This matches the UE rebuild plan and would make 2D replays and "the file on it" richer. **L**
21. **Highball and landing decisions:** pad placement and spotter, driven by a route-level `highball` flag. It gives Moonstone its identity. **M**
22. A **session planner** (warm-up, projects, "last go", rest). It turns the existing micro-systems into one clear decision screen. **M**

---

## 9. What's strong and must be preserved [INFERRED judgments grounded in ESTABLISHED code]
- **The grade model.** `Nd(g) = 8g + 2.4g²` with `hi()` diminishing returns is legible, monotone and easy to tune; the V18 cap and myths make a clear ceiling.
- **Per-type skill mixes** (65/35), style-balance XP (`Zre`/`Cv`), body-type and style tags on routes. Identity comes from how you climb.
- **The per-move fall model** (`jr` + `VD`): named moves, weighted cruxes, high points, move-by-move beta, rests, off-type moves, dossiers. This is the best storytelling engine in the climbing loop.
- **The training-science layer:** ACWR load with a real 1.3 threshold, injury tiers, rehab, fear, scars, prehab, age-driven recovery. Keep the model and fix the exploits.
- **Conditions:** climate × weather, golden-hour windows, seeping after rain, crowds and spray beta, send trains, seasonal closures, access threats and land trusts. Every crag day feels specific.
- **Semantics and culture:** onsight, flash and redpoint defined by partner-shared beta; sandbag reveals; grade consensus; FA naming and soft/stout calls; ethics stances with elder options; guidebook histories; the writing voice ("There is no rope and there is nothing else to say.").
- **Expeditions as weather-window decision games** with visible odds.
- **Skill-scaled minigame windows.** Getting stronger literally widens your margins. Keep the principle and change the verbs and inputs.
