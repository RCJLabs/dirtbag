# Core Daily Loop, Needs, Survival, Van Life, Food & Health: Audit (Dirtbag v0.956.0)

**Scope:** the time model, needs and meters, cash, debt and fail states, van life, food and health. Other lanes (climbing, jobs and economy, comps and meta, social, world and UI, tech) are touched only where they cross this one.
**Evidence:** `src/bundle.pretty.js`. `Lnnnnn` is a line in that file. Simulations are in `$SP/work-coreloop/` (`sim2.js`, `traj.js`, `acwr.js`, `injury2.js`, `early.js`).
**Labels:** **[E]** means ESTABLISHED (read in the code or data). **[I]** means INFERRED (my reasoning, a simulation, or a design judgement).

---

## 1. Summary

1. **The loop runs on actions, not on the clock.** Hunger and energy change only when you act. They never drain as time passes. The real-time clock adds one game minute per real second on the map, and it moves only the hour. Sleep always wakes you at 07:00 with full energy, however late you went to bed. The real limits are energy, cash, psyche and roughly 18 once-per-day actions. Time is not one of them. **[E]**
2. **Money pressure is front-loaded into days 1–10, then it goes away.** Van life costs $18/night (rising to $44 with grade) plus $45 registration a week. Job pay rises from $28–58 to $110–148 a shift after about 12 shifts. In the sim, the tutorial cafe path is in debt around days 4–8, then earns about +$60/day. The warehouse path has about $1,500 by day 22. A run with no job goes BUSTED by about day 7. After about day 15, cash stops being a survival issue unless the player turns pro. **[E]** constants, **[I]** sim.
3. **Fail states are cliffs, with no warning before the fall.** BUSTED means debt ≥ $100 + 3×standing + 2×rep. TAPPED OUT means hunger 0 with cash under $10. Nine or more handlers add debt without checking, so the run ends at the next sleep. Debt automatically takes every dollar of cash, so a player in debt always has $0. One climb that empties hunger, or one night in bed hungry and broke, ends the run. Game over wipes the whole save, including volume and accessibility settings. **[E]**
4. **Health is the deepest and most meaningful survival system.** It has an acute:chronic load model, 23 injuries in 3 tiers, diagnosis costs, physio trust, cortisone/PRP/surgery trade-offs, permanent marks that flare up, and insurance with waiting periods. The load model's cold start and its penalty for irregular schedules put new players in the injury band often. The sim puts the chance of an injury by day 28 at **36–99%**. $180 tier-2 bills land in 12–92% of runs, and for cash-poor aggressive starts **~32% of runs end BUSTED by day 28**. The climb panel never shows load. **[E]** model, **[I]** sim.
5. **Mid-game, psyche is the real daily limit.** Work costs 8 psyche a shift, falls cost 3, and nightly regen is 9 × a staleness factor, which falls to about 3 if you keep climbing at one venue. A naive "work, then the same gym" player spends 53 of 60 days below 35 psyche and is blocked from climbing on about 50 of them. The fix players find is a fixed ritual: nightly campfire (+16), switching venues and rest days. That turns psyche into a checklist. **[I]** sim on **[E]** constants.
6. **Several meters are busywork or broken:**
   * Water drops 3 L a night and refills for $2.
   * Propane is consumed only by the heater in winter. Cooking checks for it but never uses it.
   * Phone power gates only photos.
   * Fire fuel never burns down.
   * Grime is solved for good by parking at the truck stop.
   * Parking tickets never happen to anyone who owns a dog (bug).
   * Family drops 0.4 a night and needs one phone call a month.

   **[E]**
7. **"A night passes" has at least five code paths, and they disagree.**
   * **Sleep:** about 40 steps.
   * **Motel ($40):** skips bills, the van cost, debt interest, healing, load, sickness, the forecast queue and forced retirement.
   * **Expeditions (12–28 days) and seasonal work stints:** jump the day counter without running the night steps, and without updating `lastClimbDay`. Summit El Cap and you come home to a dropped sponsor and a firing from your job. World Cup flights also skip 2 days, but stay inside the sponsor's grace window.
   * **Midnight via the clock or long actions:** runs no processing at all, which contradicts the tutorial line *"Sleep is the only thing that moves the calendar."*

   **[E]**
8. **The calendar contradicts itself.** A season is 14 days and "Year N in Review" comes every 56. Age, taxes and dog years tick every 18 days, so you age about 3 years per seasonal year. Forced retirement at 45 falls on day 415, or day 235 for the Late Bloomer origin. **[E]**
9. **A typical day takes about 30–45 taps plus 1–2 minutes of joystick walking at day 3, and about 50–80 taps at day 30.** Day 30 adds a crag trip, road encounters, cooking, the campfire and 1–3 overnight modals. There is no fast travel, no action queue and no auto-walk. **[I]**, estimated from the UI flows.
10. **Keep:** the overnight report, the pre-climb condition banner, the Body/Load explainer, the breakdown/knock/epic/hitchhiker vignettes, the Hustle safety net, the injury "receipts" and the voice. See §9.

---

## 2. How it works

### 2.1 Time model **[E]**

| Element | Rule | Ref |
|---|---|---|
| Clock state | `day`, `hour`, `minute`. A new game starts on day 1 at 08:00. | L14001–14010 |
| Real-time ticker | `Epe` adds 1 minute per real second, rolling over minute→hour→day. It runs only while `US.current` is true: map visible, no sheet or modal open, not game over, not on an expedition. **60 real s = 1 game hour; 24 real min = 1 game day.** | L33983–33987, L38626–38655 |
| Action time | `Ve(s, h)` adds h hours and wraps days. It does nothing else. | L44751–44756 |
| Sleep | `at = 7 − hour` (+24 if ≤0), so you always wake at 07:00. Sleep at 02:00 and you wake at 07:00 on the same calendar day. Energy is set to 100, or the bivy's `rest` value, however long you slept. | L51438–51440, L51645–51648 |
| Seasons | `Bl = 14` days each. Spring, Summer (hot), Fall (send season) and Winter (50% rain). Weather weights at L20389–20394. | L20387–20394 |
| "Year in Review" | every `vv = Bl×4 = 56` days | L20629, L36612–36627 |
| Age | `hn(day) = 22 + ageOffset + floor((day−1)/18)`. `Tr = 18` days per year of age. | L25974–25977 |
| Taxes | due when a sleep lands on a day where `day % 18 == 9`: 20% of prize money "this year" | L16395–16396, L52315–52322 |
| Dog age | `floor((day − adoptedDay)/18)` | L14611 |
| Run end | **Forced retirement when a sleep lands at age ≥45** (`use`). That is day 415 by default, and day 235 for the Late Bloomer origin (+10 age). Voluntary retirement opens at age 30 (day 145). | L26089–26091, L52516, L50935–50945, L31457 |

**How long actions take** **[E]:**

| Action | Hours | Energy | Hunger | Cash | Ref |
|---|---|---|---|---|---|
| Gym attempt | 1 | −12 × (0.6–1.0) | −8 | −$5 (free with the gym job) | L25411–25415, L48437–48441 |
| Crag attempt | 2 | −18 × (0.6–1.0) | −8 | 0 | same |
| Work shift (by job) | 3–6 | −12 to −38 | −8 to −16 | +$28–58 at level 1 | L10938–11169 |
| Overtime | +2 h | ×1.5 | ×1.3 | ×1.7 pay | L18067–18069 |
| Diner meal | 1 | −3 | +50 | −$10 × standing multiplier (0.85–1.08) | L52139–52152, L17758 |
| Coffee (cafe/mall) | **0** | **+16** | −2 | −$4 | L52162–52167 |
| Recipe cook | 1 | +5 to +15 | +35 to +70 | pantry ingredients | L45282–45304 |
| Warm-up | 1 | −8 | – | – (and −4 skin) | L50909–50924 |
| Drive to crag / back | crag hours (1–4) | −3 / 0 | – | fuel $0.50 per unit | L52169–52213 |
| Campfire | 2 | – | – | – (+16 psyche) | L49781–49924 |
| Fishing cast | 2 | −4 | – (catch can be eaten) | +$0–55 | L42912–42946, L25703–25707 |
| Rest day | **0** ("the day stays yours") | +35/+18/+10 by style | −8 | – | L49619–49742 |
| Motel | to 07:00 | set to 100 | −15 | −$40 | L49744–49779 |
| Farm visit | 8 | −6 | – | −14 fuel | L37332–37353 |

**Once-per-day limits** make up the daily checklist. There are about 18: work, rest day, campfire, call home, date, cafe sit, dog play, physio, barn chores, charity, medicine, telling stories, potluck, aftercare, "last go", farm visit, mentor session and warm-up. **[E]**, from the `*Day` fields and their guards.

**No time-of-day gating.** The gym, jobs, diner, shops and motel are open 24/7 (a grep found no closing-hour checks). Hour matters only for crag send windows, cafe regulars' hours, fishing and photo light, and epic risk after dark. **[E]**

### 2.2 What happens overnight: the sleep pipeline **[E]**

The pipeline runs in the order below and is invoked as `gn(bld, "sleep")`. Pre-rolls are at L51076–51300; the switch case is at L51438–51850; post-processing is at L52214–52641.

| # | Step | Numbers | Ref |
|---|---|---|---|
| 1 | Hunger drain | −15, or −8 with the Memory Foam Bed | L51442, L33233–33234 |
| 2 | Van battery wear | −1.5 | L51443, L16764 |
| 3 | Solar / Power Station income | +$8 / +$10 each morning | L51444, L51453, L33232, L16700 |
| 4 | Water | −3 L. If you have under 3 L, you pay $3 for bottled water instead. | L51445–51449 |
| 5 | Winter heater propane | −6 a night in winter, heater only | L51451 |
| 6 | Phone power | −6, or +12 net with solar | L51452 |
| 7 | Sponsor stipend, or drop if days since `lastClimbDay` > grace (6–9) | | L51454–51455, L51842–51856 |
| 8 | Guidebook royalties, film cheque | | L51456–51463 |
| 9 | **Debt interest 3%** of debt. Paid from cash if possible, otherwise added to debt. | `d7 = 0.03` | L51464–51470 |
| 10 | Surgery release, deals, shoe kit, clubs | | L51471–51598 |
| 11 | **Nightly van cost** `fh = round(18 × solarBuildout 0.85 × dream (rig 0.5, homebase 0) × min(1 + 0.08×grade, 3) × calling × origin × quirks)`. Paid: energy is set to the bivy's rest value (92–100). Can't pay: cash goes to 0, the shortfall goes to debt, energy is set to 80, and hunger drops another 5. | V0 $18 … V18 $44 | L51628–51658 |
| 12 | Bivy fuel and grime, caffeine crash | | L51641, L51659–51662 |
| 13 | Random night event (35%): 16 events | | L51092, L19461–19519 |
| 14 | Lot nights, rough nights, parking ticket, boot | | L51671–51680 |
| 15 | **Every 7th day:** registration $45 (skipped with the homebase dream), insurance $25 or $55, and a random repair $55–95 (6% a night from day 6, ×0.4 with the tool kit) | | L51678–51693 |
| 16 | Weather queue shifts; season-change line | | L51694–51712 |
| 17 | Partner and rival simulation, job no-show warning (3 days) or firing (6 days) | | L51713–51838 |
| 18 | Grime lines at 60 ("ripe") and 80 ("feral") | | L51839–51847 |
| 19 | **Injury healing:** −1 day only if `todayLoad == 0`. Tier 3 needs rehab. A healed injury may leave a mark. | | L51859–51896 |
| 20 | **Load update** `acute += (load − acute)/4`, `chronic += (load − chronic)/14`, then `todayLoad` resets to 0 | | L51897–51899, L32440 |
| 21 | Rival, crag access and challenge deadlines | | L51900–52037 |
| 22 | **Game-over check** `q2` (see §2.4) | | L52217 |
| 23 | Dog: finds, vet bills, old age; rain-leak cost; tooth progression; sickness onset or recovery | | L51184–51248, L52218–52254 |
| 24 | Burnout ±, engagement, **fueling** ±, **family** −0.4, birthday, taxes | | L52257–52322 |
| 25 | **Skin regen** +55 (+25 with salve) × fueling factor × consecutive-days factor | | L52401–52406 |
| 26 | **Psyche** +9 × staleness factor (+5 with the bed build-out), + dog +5–11, − sick 6, − tooth 2/5, ± family 2, + birthday 8, + bivy −2 to +8 | | L52451–52466 |
| 27 | Morning summary modal: cash delta, sends, skin, lines | | L52414–52436, L74476 |

### 2.3 Needs and meters **[E]**

| Meter (start) | Drains | Refills | Thresholds and effects | Visible? |
|---|---|---|---|---|
| **Energy** (100) | Climb −12/−18 per attempt; work −12 to −38; −3 for eating or driving; sickness ×0.6 on waking | Sleep sets it to 100 (80 on a rough night); rest day +35; **coffee +16 for $4 with no time and no cap**; consumables +6 to +24; campfire and fishing do not refill | Can't work under 30; can't climb under 12 (gym) or 18 (crag); **climbing odds penalty below 50**, up to −18% (`lv` L26337) | HUD bar (warns under **30**, L57603) |
| **Hunger** (80) | Sleep −15/−8; climbing −8 per attempt; work −8 to −16; rest day −8; hobbies −2/−4. **No drain from time passing.** | Diner +50 ($10); recipes +35 to +70; dumpster dive +24–39 (78% success, 1 h, free); forage +10–29 (2 h); fish +8–40; farm cooking up to +60; protein bar +18 ($3) | 0 blocks climbing and work; **hunger 0 with cash under $10 ends the run**; odds penalty below 35, up to −15% | HUD bar (warns under 35) |
| **Cash** | See §2.4 and §5 | Jobs, stipends, fish, cans | Auto-swept into debt (L36438) | HUD "$" and "−$debt" |
| **Fueling** (80) | −3 a night if hunger was under 30 at bedtime | +4 a night if hunger was over 55 at bedtime; farm meal +10 | Below 50: injury risk up to ×1.5 and skin regen down to ×0.5 (`RI`/`Ase` L26303–26305); line when crossing 50 | **No bar.** Only the pre-climb banner (L26842) and a sleep line |
| **Psyche** (70) | Work −8 (−13 overtime); fall −3; sick −6 a night; tooth −2/−5; family under 25: −2 | Nightly +9×staleness factor; campfire +16; rest day +22; new crag drive +24 / known crag +12×factor; send +5 (+8 first send)×factor, +15 flat for a new grade; fishing +12; swim +6; hobbies +14; dog +5–11 a night; motel +18 | **Under 12 blocks climbing**; odds −16% at 0 and +3% at 100 (`HI` L26815); under 40 drives burnout | HUD bar (warns under 35) |
| **Venue staleness `stale`** (0) | +1 per attempt at the same venue, up to 10 | −3 on the first attempt at a different venue | Factor 0.34–1.0 on psyche from sends, drives and sleep (`nT` L26417). **Never decays overnight.** | "PLATEAU" alert (per-skill `staleness`), and a tip at 7 |
| **Burnout** (0) | +3 a night if psyche is under 40 | −4 a night if psyche is over 65; shrink −6/−8 | Odds penalty up to −5% (`t$`), training gain ×(1 − 0.35×b/100); message at 72 | Body page only |
| **Rattled** (0) | Fall at or above your grade +12; layoff of 10+ days +10; scare +18 | Send at/above your grade −6; fall below your grade −4; shrink −8; physio "book" work | Odds −10% at 100 (`e$` L32030). **No overnight decay.** | Overlay on the psyche bar |
| **Skin** (100) | Per attempt: 5–15 × rock multiplier (outdoors ×1.35); crack ×0.5 with gloves | Sleep +55×factors; rest day +55; tape to 60 | Under 40 costs odds (crimp −20%, crack −22%); under 25 risks a split | HUD bar |
| **Family** (55) | −0.4 a night | Call home +8–12 (1 h); farm visit +22; folks +6; barn +5; farm meal +6; birthday +6 | Over 65: +2 psyche a night; under 25: −2 | "Family Back Home" block in the crew/relationships panel (L94880–94915) |
| **Pump** (0) | +6–40 per attempt | Shake-out −34 (0.5 h); short rest −34 (1 h); long rest −68 (2 h) | 92 or more blocks climbing | Climbing UI |
| **Load** (acute, chronic) | `todayLoad += (baseEnergy + 2×grade) × completion` per attempt | Overnight exponential averages (α ¼ and 1/14); rest day ×0.6 on acute; physio ×0.7 | See §2.7 | Player sheet and Body page; **not on the climb panel** |

**HUD** (L57590–57845): four bars (energy, hunger, skin, psyche with a rattled overlay); day, season, clock and weather→forecast; send-season countdown; $cash and −$debt; injury and sick pills.

**Alerts** (L56492–56752) cover taxes, bills (registration ≤2 days away), propane, water and battery, low fuel, tickets and boot, the job, PT, plateau and more. **There is no alert for hunger, starvation risk, debt versus ceiling, sickness risk, fueling, burnout or load.**

### 2.4 Cash, debt and fail states **[E]**

* **Game-over test** `q2(needs, debt, mealCost, ceiling)` (L33973):
  * `debt ≥ ceiling` → **"broke"**.
  * Otherwise `hunger ≤ 0 && cash < mealCost` → **"starved"**.
  * `mealCost` is $10, or $5 with the kitchen (`Gk` L16384).
  * The ceiling is `Wu = 100 + 3×standing + 2×rep + 400 if sponsor-signed` (L16390).
* **Where `q2` runs:** after climbing (L48466), comps, World Cups and the Olympics (L50271, L50448, L50521), and after the big switch (sleep, work, eat, coffee, apparel, drive, take job) (L52217).
* **Handlers that add debt with no check** (the run ends at the next checked action, usually sleep):
  * imaging $240 (L49433)
  * cortisone $180 (L49450)
  * PRP $600 (L49467)
  * breakdown tow $60 + 2×fuel (L39960–39968)
  * failed field fix $45 (L40006–40022)
  * limp home $10 (L40031)
  * shop repair on credit (L44962–44993)
  * crunch "put it on the tab" (L52813)
  * urgent care $180/$850 (L48594–48599, L48716)
* **Auto-sweep:** a layout effect moves every dollar into debt while both are positive (L36438–36446). In debt, cash is always $0. You can't buy a diner meal ($10), a gym entry ($5) or medicine.
* **Rough nights:** see step 11 in §2.2. Energy is 80 and hunger takes an extra −5, so hunger ≤20 at bedtime with under $18 means hunger 0 with $0: **TAPPED OUT**.
* **The crunch:** from day 20, once per 28 days, if cash ≤ $25 at bedtime there is a 50% chance of a $110–190 bill. The causes are an alternator, a head gasket, a transmission and so on. Options:
  * sell your most valuable spare gear at 45%
  * a graveyard shift (+$70, −34 energy)
  * a favour from a partner with bond 7 or more (costs nothing, you owe them)
  * the tab

  (L47818–47824, L52741–52820, L16407–16411)
* **Game-over screens** (L102044–102100): BUSTED ("sold the van, took a desk job"), GONE (free-solo fall) and TAPPED OUT ("hitched a ride home"). **START OVER** runs `fA` = `{...defaultSave, introSeen:true}` (L52933), which wipes the legacy, the mentee, the settings and everything else.
* **Hustle menu, available anywhere** (L58963, L61677–61695):
  * collect cans: 2 h, $3–9
  * dumpster dive: 1 h, 78% for +24–39 hunger
  * forage and water: 2 h, +10–21 hunger in town or +18–29 outdoors

  This is the real anti-starvation safety net, but only if the player finds it before hunger reaches 0.
* **Modes** (L100525–100600): Normal ("none of it can kill you") or Free Solo (outdoor sport routes and big walls without a rope; one fall ends the run). There is no difficulty or survival-pressure setting.

### 2.5 Van life **[E]**

**Fuel.** The tank starts at 80 of 100. Fuel costs $0.50 a unit and can be partially filled (L49925–49941). A one-way crag trip costs 12–45 units, ×0.7 with the Efficient Tune-Up and ×0.6 for the roaddog trait (L24323, L22831ff). The drive out is blocked if the tank is short. The drive back always succeeds ("Coasted back on fumes"), so **fuel can never strand you** (L52202–52212).

**Supplies:**
* **Water:** 30 L to start, 40 L cap (L32281). −3 L a night, or $3. Refill for $2 instantly at the gas station, or free at the lake in 1 h (L50690–50703). A jug wash uses 8 L.
* **Propane:** 70 to start. **Consumed only by the diesel heater in winter** (−6 a night). A swap costs $18 (L50704–50711).
* **Phone power:** 80 to start. −6 a night, +12 per drive, +30 per hour plugged in at a cafe. **It gates only photography**, at −8 a photo (L47534–47538, L50713–50722).

**Grime.** +6 a night, +5 if you climbed that day, −3 if it rains (L51413–51416).
* Thresholds: "lived-in" at 25, "ripe" at 60 (social and standing gains ×0.75), "feral" at 80 (×0.5; dates suffer) (L32300–32320, L39703, L41133).
* Fixes: gym shower (1 h, to 0), truck-stop shower ($8, to 0), swim (2 h, −50), jug wash (1 h, −32, 8 L).
* **Parking at the truck stop removes 8 grime every night** (L27843).

**Van parts** (`tc` L16701–16762): battery, tires, brakes, belt, alternator and starter.
* Wear per fuel unit: 0.07–0.32 (tires wear fastest). The battery also loses 1.5 a night.
* **Parts at 18 or below block every trip except the local crag; a battery at 0 blocks all driving** (L51013–51021).
* Repair options (L16860–16874, L50014–50047):
  * Spare parts at the gas station: $45–130.
  * Patch: $15–30 for +25–35.
  * Shop repair: 155% of the part price × the damaged fraction, with a $18 minimum.

**Breakdowns** (`Xc` L39913–39933). The check fires on **every zone change into or out of the crag**, from day 5, at most one encounter a day.
* Chance `clamp(0.06 + 0.0026×fuel + Σ risk×wear, 0, 0.45)`, halved with the roaddog trait. A part takes −55.
* Resolutions (`V6` L39934–40050):
  * a hitchhiker you've met fixes it
  * tow: $60 + 2×fuel
  * fit a spare: 1 h
  * bodge with materials to 52%
  * pay a passer-by $45 (4 h)
  * limp home: 12 h, $10, −28 energy
* Vignettes: 6 parts, each with a situation, a note, and tow, DIY, limp and bodge text (`qk` L16774–16852).
* **[I] With fresh parts, a local crag day has about a 17% breakdown chance.** After about 10 unmaintained local trips it is about 45%.

**Upgrades** (`vR` L33195–33230):

| Upgrade | Price | Effect |
|---|---|---|
| Memory Foam Bed | $70 | Overnight hunger drain 15 → 8 |
| Camp Kitchen | $110 | Recipes; starvation threshold $5 |
| Solar | $130 | +$8/day, +18 power |
| Pull-up Bar | $90 | Train power at the van |
| Blackout Curtains | $95 | Tickets ×0.3 |
| Tool Kit | $85 | Random repair ×0.4 |
| Efficient Tune-Up | $75 | Fuel ×0.7 |
| Diesel Heater | $150 | Winter sickness protection; uses propane |
| Power Station | $120 | +$10/day |

Solar and the Power Station together pay +$18 a day and cover the whole V0 nightly cost. **[E]**

**Build-outs** (`fL` L27020–27057) are made from scavenged materials in 2-hour sessions:
* **Bed Platform:** +5 psyche a night.
* **Insulation:** winter sickness ×0.25.
* **Solar Rig:** nightly cost ×0.85.
* **Gear Rack:** approach effect.

The names overlap with the shop's Memory Foam Bed and Solar Setup.

**Where you park** (`Mv` L27773–27875). You pick a spot once and it persists (L45030–45037).

| Spot | Rest | Psyche | Tickets | Winter exposure | Fuel/night | Knock multiplier | Requirement |
|---|---|---|---|---|---|---|---|
| The Lot | 100 | 0 | **yes** | 1.0 | 0 | 1.4 | – |
| Upper Trailhead | 100 | +2 | no | 1.35 | 3 | 0.9 | **none** |
| Ridge | 100 | +6 | no | 1.5 | 6 | 0.6 | local (tier 2) at some crag |
| Truck Stop | 92 | −2 | no | 0.7 | 1 | 1.2 | none; **−8 grime a night** |
| Friend's Driveway | 100 | +8 | no | 0.35 | 1 | 0.5 | partner bond 6+ or caravan; 4-day cooldown |

**Tickets** apply only at the Lot. Chance `clamp((consecutiveLotNights − 1) × 0.1, 0, 0.4) × (curtains 0.3) × standing factor (0.5–1.3)`. Each ticket is recorded, not charged. The third ticket brings the boot; clearing it costs $25 per ticket plus $60 impound at the Police Station (L51142–51146, L51671–51680, L49348–49354). **Any dog blocks every ticket.** See bug B1.

**Knocks.** 10 events × 3 options, filtered by spot. Chance 11% × the spot's knock multiplier, with a 4-day cooldown (L27876–28110, L51137–51140, L44995–45029).

**Hitchhikers.** 8 characters with repeat meetings. 14% on a crag zone change, 5-day cooldown (L39899–39912, L16887–17229).

**Epics** ("The Walk Out" and others). 5 kinds × 3 stages × 3 options, triggered on the drive back.
* Risk score: late hour, no headlamp, rain, winter, low energy/hunger/water, and climbing solo.
* Chance `clamp((score − 4) × 0.055, 0, 0.45)`, 10-day cooldown. A bad outcome is an injury.
* (L27324–27766, L47609–47626, L45038–45097)

### 2.6 Food **[E]**

* **Diner:** $10 for +50 hunger. The same action runs the Ice Cream Parlor and the Village Diner, so all three log as "diner" (L52139–52152).
* **The van meal ($5 for +25) is dead code.** No UI exposes an "eat" action at the van or the crag van (L54665–54943, L54944–55080).
* **Grocery** (`bL` L28120–28134): 13 ingredients at $3–8, bought one unit at a time, × the standing price multiplier.
* **Recipes** (`ide` L28136–28231): 10 recipes giving +35–70 hunger, +5–15 energy, and +2–3 of a skill (power, fingers, endurance, technique or head).
  * They unlock at cooking skill 0–12 (L28233–28245).
  * Cooking is a 3-tap timing minigame. The result is burnt ×0.6, decent ×1, great ×1.25 or perfect ×1.45, plus a skill bonus of +1 or +2 (L28258–28303, L45182–45305).
  * Cooking needs the Camp Kitchen or the Home Base cabin. The game checks for 8 propane and 3 L of water **but never consumes either** (L47695–47700; bug B5).
  * **The cost per point of hunger matches the diner:** Eggs & Rice is $7 for 40 hunger (~$0.18 a point); Chicken & Greens is $16 for 50 hunger plus 3 power.
* **Potluck:** needs a fire and company. It uses double the ingredients and gives psyche, bond and rep (L45164–45281).
* **Campfire / fire:**
  * Hanging at the fire: 2 h, +16 psyche, once a day, with 10 random outcomes, one of which is a free dinner (+15 hunger) (L49781–49924).
  * Building your own fire costs 2 wood and protects you from winter sickness that night. "Feed the fire" costs 1 wood and adds 3 fuel, **but the fuel never burns down** (L37424–37440, L27228; bug B6).
* **Garden (the folks' farm):**
  * 6 beds, 3 pre-planted. Crops: radish $4/3 days, carrot $6/5, pepper $8/6, tomato $8/6, strawberry $10/8. Each harvest yields 2 (L27196–27202).
  * Getting there takes 14 fuel and 8 hours (L37332–37353).
  * Cooking the harvest gives up to +60 hunger, +10 fueling, +6 family and +3 psyche (L37378–37400).
  * **The cost per point of hunger is worse than the diner:** $0.25–0.67 before travel.
* **Fishing** (`X3` L25514–25699): 13 catches (10 fish, 2 trophies, 1 boot), including seasonal, night, dawn and prime-only fish.
  * Each cast is 2 h and −4 energy. A catch gives +12 psyche (+8 more for a trophy); a miss gives +6.
  * A landed fish always pays **$0–55 and** can then be eaten (+8–40 hunger) or kept as 1–2 fillets. It is a real-time tap minigame (L42813–42957, L25700–25737).
* **Consumables** (`JR` L16244–16379): 15 items. Nine are craftable aftercare or tape items at $0. Six are food and drink:
  * coffee to-go ($4, +16 energy, crash 4)
  * energy drink ($6, +24 energy, +4 psyche, +3% odds, crash 10)
  * protein bar ($3, +18 hunger)
  * electrolytes ($5, +10 energy, +2% odds)
  * banana ($2, +8 hunger, +6 energy)
  * recovery shake ($7, +12 hunger, +6 skin, +4 psyche)
* **Meal variety** (`recentMeals`, last 5): if the last 4 are identical, sickness risk rises +9% a night and toothache risk doubles (L51214–51225, L51185–51187).
  * **Eating only at the diner triggers this.** The diner, ice cream and village diner all log as "diner".
  * Variety comes only from recipes, dumpster diving, foraging or the farm.

### 2.7 Health **[E]**

**Load (acute:chronic ratio).**
* Per attempt, `todayLoad += round((12 at the gym or 18 at the crag + 2×grade) × completion)` (L48503). Overnight: `acute += (load − acute)/4` and `chronic += (load − chronic)/14` (L32440).
* The ratio `Gi = acute/chronic` is used only once chronic > 6; below that it reads as 1 (L32107).
* Bands (L32441–32450): ≤1.3 safe; 1.3–1.5 "pushing"; over 1.5 "overreaching"; **over 1.7 blocks climbing** with "You're fried" (L47986–47987).
* **Per-attempt injury chance** `clamp((ratio − 1.3) × 0.3, 0, 0.4) × style (crimp 1.5, crack 1.3, power/dyno 1.2)`, multiplied further by:
  * training phase: base 0.8, build 1.2, peak 1.45, deload 0.2
  * no warm-up: 1.6; "last go": 1.5
  * scars: +14% each
  * age: +3% a year over 28
  * boldness, prehab (0.6), fueling, marks, cortisone and others

  (L48504–48523, L32109–32113, L28552–28585)

**Injuries** (`BL` L32114–32156).
* Tiers: 1 (7 kinds, 2–4 days), 2 (8 kinds, 6–9 days), 3 (8 kinds, 13–18 days), all ×(1 + 2.5% a year over 28).
* Severity roll: `(ratio − 1.3) × style × warm-up × phase + rand(0.4)` (L32183–32192).
* Regions are weighted by how far over the band you are (L32157–32164).
* Odds penalty: tier 1 −14%, tier 2+ −32% (L32236).
* **Tiers 1–2 don't block climbing.** Climbing on an injury stops it healing at night and raises the odds it becomes a permanent mark (`hurtClimbs`).
* Tier 3 means comeback steps (rest and physio, 5 sessions) and a grade cap of your grade minus 4. Climbing above the cap risks re-injury: 50% for −2 steps and +3 days (L47997–48028, L16678–16683).

**Urgent care on a tier-2+ injury.**
* **$180 (tier 2) or $850 (tier 3)**, or a $40 copay with insurance that is at least 7 days old.
* Any unpaid part goes to debt, sets `undertreated` and adds 5 days. A med kit saves 2 days.
* (L48594–48614, L16671–16673)

**Treatment:**

| Treatment | Cost | Effect | Ref |
|---|---|---|---|
| Diagnose | $55 (free at physio trust 60+) | Until diagnosed, the HUD pill shows "?" instead of the days left | L49404–49419, L57803–57808 |
| Imaging | $240 / $40 insured | Diagnosis | L49421–49440 |
| Cortisone | $180 / $40 | Days drop to 2. Risk ×1.8 for 28 days, and +8% a shot for good. | L49442–49460, L16663–16670 |
| PRP | $600 | 50% chance to cut days to 55% | L49461–49475 |
| Physio | $35 minus trust×0.14, 2 h, once a day | −2 days (−3 at trust 60+). If healthy: acute ×0.7, prehab at trust 75+ (injury ×0.6 for 8 days), region care | L49540–49617 |
| Aftercare (splint, sling, etc.) | – | Up to 2–3 days off, once a day, from the van | L32342–32393, L54674–54687 |
| Rest day | – | Injury −1 day on top of the night's −1 | L49651–49656 |

**Permanent damage comes in two parallel systems:**
* **`scars`:** up to 6. Added by 30–70% of tier-2+ injuries and by close calls. Each scar adds 14% injury risk (capped at +70%) and costs −3% odds on the matching styles (cap −12%) (L32409–32434, L48530–48531).
* **`marks`:** from `q_` when an injury heals.
  * Chance: base 2%/12%/35% by tier × (1 + 0.12 × hurt climbs) × (1 + 0.05 × each year over 30) × (1 + 0.4 × marks already in the region) × (0.5 for a clean comeback) × (1.8 if undertreated), capped at 85%.
  * Each mark flares by +2 a day since your last PT (×1.4 in winter). At 55 or more it is "talking" and costs up to −20% on the skill for that region (L26026–26060, L99676–99702).
  * PT at the van takes 1 h and resets the clock for 21 days (L50747–50768).
  * **Surgery** removes a mark: $4,200, or $950 on the full plan after 30 days. Success is 25–90% by age, other marks and years. 11 days in a sling, then power, fingers and endurance ×0.94 (L37130–37170, L24523–24540).

**Sickness at sleep** (L51214–51248). Only when not already sick.
* Nightly chance: `0.03` + `0.16` if it is winter without warmth (heater with propane, a fire, the homebase or the hut) × (insulation 0.25, tarp 0.5) × bivy exposure + `0.12` if energy was under 25 or hunger under 20 at bedtime + `0.09` for a monotonous diet.
* Tier 2 (3–4 days, no climbing) comes from winter plus exhaustion or monotony, or a 25% roll. Otherwise tier 1 (2 days, −12% odds).
* Effects: waking energy ×0.6, −6 psyche a night.
* Recovery: −1 a night (−2 if warm or well fed); rest day −2/−3; medicine $14 (−2 a day); motel −2.
* A taped split can get infected (22%).
* (L32322–32327, L50873–50899)

**Teeth** (L51184–51212):
* Onset: 0.6% a night from day 20, ×2 with a monotonous diet.
* Stage 1 becomes stage 2 after 16 days; stage 2 becomes stage 3 after 12 more.
* Stage 2: −2 psyche a night. Stage 3: −5 psyche a night and energy ×0.85.
* Fixes: filling $90, root canal $650, emergency $950, or extraction $160–220. Insurance never covers dental (L32328–32340, L49476–49505).
* **There is no HUD pill or alert.** The only signs are lines in the morning summary.

**Mental health:**
* **Shrink:** $45, 1 h, burnout −6/−8, rattled −8, fear reduction and "steady head" for comps (L41991–42027, L19082–19093).
* Fear after a tier-3 injury: a flinch on the matching style, fixed by Visualization, physio "book" work or facing it on the wall.

**Insurance** (L49507–49538, L16652–16659):

| Plan | Weekly premium | Covers |
|---|---|---|
| Catastrophic | $25 | Bills, imaging and shots at a $40 copay after 7 days |
| Full | $55 | The same, plus surgery ($950 instead of $4,200) after 30 days |

Premiums are charged at every 7th-day sleep; the motel skips them. The Late Bloomer origin pays ×0.65.

### 2.8 A typical day, action by action **[I]**, from the UI flows

**Flow.** Walk with the joystick to a building. Tap the contextual **Enter** pill (L58172–58190). The action sheet opens (`fj`). Tap an action. Some actions open a minigame. A toast or modal follows.
* The diner and the cafe have **interiors**, so it is door → walk to the counter → tap → exit (L54575–54594).
* There is no fast travel and no action queue.
* Walking costs about 1–3 game-minutes per zone because the clock runs.

**Day 3.** New climber, V0–V1, cafe job, $20–60, van at the Lot.

1. Morning summary modal → dismiss (1).
2. Lot → Old Town → Downtown → Midtown, three zone edges, about 10–15 s of joystick.
3. Enter the cafe (1). Walk to the bar (joystick). Enter (1). "Work a shift" (1). Barista minigame: 3 customers × 1 pick + result (4). Exit (1).
4. Midtown → Downtown gym (1).
   * First attempt at each new route: pick the route (1), first-look modal (1), 1–3 hold/release beats (1–3), result (1).
   * × 3 attempts = about 12–18 taps. Each costs $5.
5. Downtown → Old Town diner: Enter (1), counter (1), order (1), exit (1).
6. → Lot → van (1) → Sleep (1). About 40% of nights add a night-event line or modal (1–3).

**Total: about 30–45 taps and 1–2 minutes of walking. In game, 07:00 → about 21:00.** Tension: cash ($18 a night, $45 due on day 7), the 1.7 load block around day 3–5, and psyche falling from work.

**Day 30.** V3–V5, a promoted job at $70–110 a shift, $500–1,500 banked, maybe the Kitchen, Solar and a dog.

1. Summary (1).
2. Shift and minigame (~6).
3. Van: "Plan a road trip" (2).
4. Drive animation and roadside stop (1–2).
5. Possible breakdown, hitchhiker or encounter modal (2–5).
6. At the crag: warm-up (1); 3–5 attempts × 4–6 taps, including trad, dyno and endurance minigames.
7. Drive back, with a possible 3-stage epic (3–4).
8. Evening: campfire (1); recipe cook with the timing minigame (5); PT or aftercare, feed the dog, call home (3–5).
9. Sleep, with a knock event (2), night event or crunch.

**Total: about 50–80 taps.** Tension: psyche and staleness, load spikes from an irregular schedule, van wear, winter sickness and gear wear. Cash is no longer an issue.

**Day 300.** Age 38, V10–V14, sponsor or pro, thousands banked.

* The nightly nut is about $35, plus $45 a week registration and $55 a week insurance. All of it is automatic and insignificant.
* The daily loop looks like day 30, plus sponsor obligations and deals.
* **The tension has moved to the body.** Injury risk is ×1.3 and healing takes ×1.25 as long. Marks flare every 20 days without PT. Power and fingers are ×0.85, endurance ×0.92. Forced retirement at day 415 is 115 days away.
* Survival matters again only for a pro, where income depends on sends (`oue` L29884), or after a big uninsured bill.

---

## 3. Content inventory (this lane) **[E]**

| Area | Count | Ref |
|---|---|---|
| Map buildings (all zones) | about 50 | L10854–11560 |
| Van action sheet at the Lot | up to about 32 conditional entries | L54665–54943 |
| Once-per-day actions | about 18 | §2.1 |
| Night random events | 16 (8 good, 8 bad), about 275 words | L19461–19513 |
| Knock events | 10 × 3 options (30 outcomes), about 1,340 words | L27878–28109 |
| Parking spots | 5, with 15 flavour lines | L27773–27875 |
| Van parts, breakdown vignettes | 6 parts × 4 texts, 4 resolutions | L16701–16852 |
| Crunch causes | 5 | L52741–52749 |
| Hitchhikers | 8, plus 16 repeat-meeting options, about 2,500 words | L16887–17229 |
| Epics | 5 kinds × 3 stages × 3 options (45 options), about 1,800 words | L27372–27765 |
| Van upgrades / build-outs | 9 / 4 | L33195, L27020 |
| Materials; craftable items | 8; 10 recipes | L26881–26983 |
| Groceries / recipes / cook qualities | 13 / 10 / 4 | L28120, L28136, L28258 |
| Crops / fish / consumables | 5 / 13 / 15 | L27196, L25514, L16244 |
| Hustles | 3 | L61677 |
| Injury kinds / regions / tiers | 23 / 9 / 3 | L32114, L32269 |
| Comeback steps | 3 regions × 3 steps | L26002–26019 |
| Aftercare items | 7 | L32342 |
| Niggle lines | 9 regions × 2 | L32193 |
| Scar types | 6 | L32401 |
| Region-care drills | 9 | L19015 |
| Sickness kinds | 5 (head cold, flu, stomach bug, run down, infected split) | L51232–51236, L51256–51259 |
| Tooth stages | 3, with 6 narrative lines | L51184–51212 |
| Shrinks / physios | 3 / list `i9` | L19070, L19001 |
| Family | 4 folks lines + 7 contextual lines, 6 barn-chore lines, 5 call-home outcomes | L27144–27194, L49361–49402 |
| Tips (survival-relevant) | 7 of 12 (load, skin, psyche, gear, injury, skin days, stale) | L34020–34105 |
| Onboarding steps | 7 | L34106–34142 |

---

## 4. Bugs and defects

### Confirmed **[E]**

| ID | Defect | Ref | Failing scenario |
|---|---|---|---|
| **B1** | **Any dog grants total immunity to parking tickets.** `Math.random() < K && (g.dog \|\| (Z2(g.dog,"watch") && Math.random() < $U) ? (Mn = true) : (gk = true))`. The `\|\|` short-circuits on any dog. The "Watch" trick (bond 75, "knows a uniform from a person") and its 50% roll are meaningless. | L51142–51146, L14551, L14603 | Adopt a pup at bond 0 and unfed, stay at the Lot for 30 nights: zero tickets, and every night reads "barked a meter cop off". Intended: only a Watch-trained dog, at 50%. |
| **B2** | **The motel bypasses nearly all nightly processing.** It sets energy 100, grime 0, psyche +18, skin, sickness −2 and advances to 07:00. It skips the van cost, registration, insurance, random repairs, debt interest, sponsor pay and drop, injury healing, the acute/chronic update (`todayLoad` carries over), sickness onset, tooth, burnout, fueling, family, taxes, the birthday, **forced retirement**, the job no-show check, and staleness decay. | L49744–49779 vs L51438–52641 | (a) Take the motel on the night of each day-6 sleep to skip the $45 registration: $40 instead of $63. (b) Insurance premiums are skipped the same way. (c) Past 45, keep using motels and you never retire. (d) Load from two days is applied as one. |
| **B3** | **The motel breaks the forecast queue.** It re-rolls `forecast` for tomorrow from the season and does not shift `forecast2/3`, so the 3-day forecast the player planned around is discarded. | L49771–49773 vs L51702–51707 | Forecast reads Prime, then Rain, then Fair. Sleep at the motel: tomorrow is re-rolled and could be anything. |
| **B4** | **Expeditions don't update `lastClimbDay`.** Start +2 days, each pitch or rest day +1, end +3. At the next sleep: the sponsor drops you ("N days without a climb"), deals lapse (10 days), the job fires you for no-show (6 days) and romance may strain. | L39035–39199 (no `lastClimbDay`), L51455, L51472–51477, L51824–51838 | Summit El Cap (10 days), sleep. "Chalkbag Co. … (13 days without a climb.)" and "You no-showed 13 days — fired". |
| **B5** | **Cooking never uses propane or water.** The kitchen and hearth path checks `propane ≥ 8` and `water ≥ 3` and then opens the recipe picker (`gY`/`pY`), which consumes only pantry items. The switch `case "cookhome"` that does consume water and propane (+60 hunger, free) is **unreachable**, because every UI call passes an explicit action. So propane is consumed only by the winter heater, the PROPANE alert almost never fires, and the Hearth hint "cook over the fire · free" is misleading. | L47695–47700, L45175–45305, L52153–52161, L11232–11242 | Cook 50 recipes with the kitchen: propane stays at 70% forever. |
| **B6** | **Fire fuel never burns down.** It is set to 5 when built and raised by 3 (max 8) when fed. Nothing ever decrements it, and a fire counts only on the day it was built. "Feed the fire (−1 firewood · Nh left)" spends wood for nothing. | L37424–37440, L27228, L54724–54739 | Build a fire at 18:00 and don't feed it: it is still "lit" at 23:59. At 00:01 it is gone, fuel or no fuel. |
| **B7** | **"Forage & water" claims to refill water but doesn't.** The text says "filled the jugs at the spring" and "topped off your water", but `water` is untouched. | L44808–44826 | 10 L in the jugs → forage → still 10 L. |
| **B8** | **The rain-leak cost can make cash negative.** It is applied after the shortfall-to-debt step, with no clamp, so the HUD shows "$-6". | L52237, L22069–22078 | Sleep in rain with $18 against an $18 nightly cost and no heater (25%): wake with −$4 to −$9. |
| **B9** | **Pad-building takes no time.** `Ve(n, Ry);` is computed and thrown away, and the state update has no hour or day, but the text says "2 hours on the pad". Van build-outs do this correctly. | L37631, L37638–37650 vs L37601–37616 | Build a pad 3 times at 10:00 and it is still 10:00. |
| **B10** | **Shake-out adds 0.5 h, so hours become fractional.** `Y1` floors the hour but not the minutes, so the displayed clock runs 30 min behind until the next sleep. The short rest says "Ten minutes" but costs 1 h. | L50929, L25873, L44751, L33974–33980; L37444–37458 | Shake out at 14:00: the internal hour is 14.5 and the HUD shows "2:00 PM". Every later action is off by 30 min. |
| **B11** | **Midnight passes without a night.** The ticker and `Ve` wrap `day` with no processing, contradicting the onboarding line "Sleep is the only thing that moves the calendar". Day-indexed events (registration on day%7, taxes on day%18==9, seasons, age and retirement) can be skipped or decoupled from sleeps. Idle time on the map ages the character. | L33983–33987, L44751–44756, L34125 | Stay up through two midnights with coffee (+16 energy for $4, no time) and fishing. One registration or tax day never triggers. Or leave the app idle on the map with "keep screen awake" on: +1 day and +1/18 year every 24 min. |
| **B12** | **The calendar contradicts itself.** Age, taxes and dog age use an 18-day year. Seasons and "YEAR N IN REVIEW" use a 56-day year, and the tax toast says "prize money this year" every 18 days. | L25975, L16396, L14611 vs L20387, L20629, L36612 | Between "Year 1 in Review" (day 57) and "Year 2" (day 113) you have three birthdays. |
| **B13** | **Debt-adding actions don't check for game over.** The run ends at the next sleep with no warning. The shop lets you borrow **up to exactly** the ceiling (`> ceiling` is refused), but BUSTED is `≥ ceiling`, and interest pushes you over that night anyway. | L44969, L33973; handler list in §2.4 | Debt $60, ceiling $110. Van repair on the book to $110 → sleep → interest +$4 → BUSTED. |
| **B14** | **The starvation check ignores food you own.** Hunger 0 with cash under $10 is TAPPED OUT, even with a full pantry, produce, fish fillets or protein bars. | L33973 | In debt (so $0), hunger 6, 10 eggs and 3 protein bars in the pack. One crag attempt (−8 hunger): run over. |
| **B15** | **Game over wipes the settings.** `fA` resets to the default save, so mute, the three volumes, text scale, colorblind, high contrast, reduce motion and keep-awake all reset. | L52933–52935, L14063–14072 | A colorblind player with 1.3× text dies and restarts at 1.0× with the default palette. |
| **B16** | **The van meal ($5, +25 hunger) is dead code.** No UI exposes "eat" at the van. `Gk` (starvation threshold $5 with the kitchen) still refers to it. | L51063–51066, L52139–52152, L16384 | – |
| **B17** | **Rest-style fields are unused.** `W1.hours` (4/3/2) and `W1.healInjury` (true only for Mobility) are never read. All styles heal 1 day, and "Mobility — helps a tweak heal" has no special effect. | L28858–28886, L49619–49742 | Choose Mobility for the healing: identical to Full Rest, minus 25 energy. |
| **B18** | **Bivy fuel is deducted every night with no check.** It clamps at 0, so you can "drive" 6 fuel units to the Ridge every night on an empty tank. | L51641, L45035 | Choose the Ridge with 10 fuel, stay for 5 nights: fuel 0, still parked at the Ridge. |
| **B19** | **Two different blocks both say "You're fried".** One is load over 1.7; the other is psyche under 12. And the low-energy block at the gym says **"Too pumped to pull on"**, which is also the pump block's text. | L47985–47988, L47993, L47984, L47998 | At 10 energy, the gym says "Too pumped". The player shakes out; nothing changes. |

### Suspected or minor **[I]**

* **S1.** Some night events assume you are in the van at the Lot, but they fire wherever you sleep: at the cabin, the driveway or the crag. Examples: "Cops rapped on the van at 4am", "The tent zipper finally gave out", and a gear theft that can take your most expensive rope. That event has a 2.2% chance per night, about 9 per career. (L19461–19519, L51092)
* **S2.** The trait requirement reads "25 nights in the lot", but the counter `roughNights` counts every rough spot except the Driveway, and sleeping at the crag van doesn't count at all. (L30636–30637, L51674)
* **S3.** "That is as much as a body carries. Everything from here is borrowed." at 6 scars implies a consequence; mechanically the list just stops growing. (L98690–98693, L48530)
* **S4.** Homebase says "No more rent, bills or van-life cost — ever", but insurance and the random van repair ($55–95) still charge. (L23425, L51678–51693)
* **S5.** `hitchSketch` and `tapeJobs` are written but never read. (L44847, L37416)
* **S6.** The rest day at the crag has no "hours", but "restshort" and "restlong" do. The same word "rest" means two different mechanics. (L37441, L49619)
* **S7.** The HUD's energy warning is at 30, but the climbing odds penalty starts at 50, so a player at 45 energy is losing about 2% per attempt with no warning colour. (L57603, L26293)

---

## 5. Balance and pacing

### 5.1 Money curve **[E]** constants, **[I]** sims (`sim2.js`, `traj.js`; 2,000 runs, 60 days)

Nightly nut by grade: V0 $18 · V2 $21 · V4 $24 · V6 $27 · V8 $30 · V10 $32 · V12 $35 · V14 $38 · V16 $41 · V18 $44. Plus $45 a week in registration (about $6.40 a day).

Shift pay, level 1 → level 5 with maximum employer rep (reached after 12 shifts; L17615–17627):

| Job | Level 1 | Level 5 |
|---|---|---|
| Cafe | $28 | $110 |
| Office | $38 | $123 |
| Warehouse | $58 | $148 |
| Courier | $52 | $140 |

Median net worth (cash minus debt) by day:

| Strategy | d4 | d7 | d10 | d15 | d22 | d30 | d60 |
|---|---|---|---|---|---|---|---|
| Tutorial: cafe + 4 gym attempts, with psyche management | −5 | −33 | +39 | +247 | +629 | +1,147 | +2,876 |
| Warehouse + 3 gym attempts, with psyche management | +109 | +208 | +417 | +835 | +1,533 | +2,448 | +5,477 |
| No job, 3 gym attempts | – | **100% BUSTED, median day 7** | | | | | |

* **Days 1–10:** a real squeeze. The first $45 bill lands on day 7. The cafe path runs 1–2 rough nights and dumpster dives while in debt.
* **After about day 12:** income exceeds costs by $60–100 a day. Money stops being survival and becomes a progression budget (gear, crags, dreams); the economy lane covers those sinks. The sim leaves those sinks out, so real-world surpluses are lower. The *survival* conclusion stands.
* **Passive income erases the nut:** Solar plus the Power Station earns $18 a day. With the Rig dream the V0 nut is $9.

### 5.2 Energy is money
Cafe or mall coffee is +16 energy for $4, with **no time cost and no daily cap** (L52162–52167, hint "no time lost" L55141–55145). A rest day is +35 energy with no time cost (L49619). Once cash is plentiful, energy stops limiting how much you can do in a day; what's left is one shift a day, psyche, skin, pump and load. **[E]**

### 5.3 Psyche governs the day **[I]**, sim on **[E]** constants

| Player | Days with psyche under 35 (of 60) | Climb-blocked days | Rest days | End burnout |
|---|---|---|---|---|
| Naive: cafe + the same gym, no psyche actions | 52.8 | **49.7** | 0 | 100 |
| Rests when psyche drops below 25 | 21.3 | 16.1 | 16.1 | 90 |
| Rests, nightly campfire, switches gyms | 0 | 4.1 | 4.1 | 0 |

The system works as a variety forcer. The tips "Psyche is the other tank" and "The same wall stops feeding you" explain it well. But the reliable answer is a fixed daily ritual (campfire +16, which staleness doesn't reduce), so the decision collapses into a chore.

### 5.4 Injury exposure early on **[I]** (`acwr.js`, `injury2.js`, `early.js`; 20,000 runs)

The ratio is scale-invariant: 1 attempt a day and 10 attempts a day look the same once you've adapted. What it punishes is ramp-up and irregularity. Because the ratio is fixed at 1 until chronic > 6, then switches on, it jumps to **2.0–3.2 on days 2–9** whatever the volume.

| Player | Injury by d28 | Tier-2+ bill | Run over by d28 |
|---|---|---|---|
| 2 attempts, 60% of days, always warms up | 36–47% | 12–18% | ~0% |
| 3 attempts, 70% of days, warms up half the time | 72–84% | 42–47% | ~0% with a $60 start (promoted wage absorbs the $180) |
| 4 attempts, 85% of days, never warms up, $30 start | 99% | 92% | **31.6% BUSTED** |

The model's constants are all read from the code. The assumed play patterns are mine. Even at the low end, a first-month injury is the norm. The Body page explains exactly why (L98560–98700), but the climb panel's condition banner covers 9 factors and **leaves out load** (L26830–26880).

### 5.5 Sickness **[I]**, from **[E]** constants

Per 56-day year with the default diner diet, Lot sleeping and no heater: **8.7 sick days, versus 4.5 with a varied diet**. In winter at the Lot, onset is 19% a night (28% with a monotonous diet, 48% at the Ridge when depleted), so **30–50% of winter days are sick days**. A $150 heater drops that to 3% for the rest of the run. That is a one-time fix, not an ongoing decision.

### 5.6 Van wear **[I]**

Local crag round trip: 24 fuel = $12, plus about $7 of tire wear and about $3 of other wear. The breakdown chance rises from about 17% a day to about 45% a day after 10 unmaintained trips. For a crag-focused player the van is a real, continuing cost and the one survival system that stays mid-game. The breakdown modal is a good decision the first few times and repetitive after that.

### 5.7 Tension at day 3, 30 and 300 **[I]**

* **Day 3:** cash, the first bill, the first "You're fried" (load), work eating psyche, learning the map. Survival is meaningful and legible.
* **Day 30:** cash is solved. The tension is psyche and staleness, load spikes and injuries, winter sickness if you haven't bought the heater, van wear if you crag, and gear wear. Most survival meters are background chores.
* **Day 300:** cash is irrelevant (except for a pro). The body is the game: age multipliers, marks that need PT every 20 days, scars and the retirement countdown. The survival sim has turned into maintenance.

**Does survival stay meaningful?** Partly. Health (load, injuries, marks, aging) stays meaningful and gets deeper. Money, food, water, propane, power, grime, family and tickets go trivial or rote by about day 15. They are either solved permanently by one purchase or spot choice (heater, truck stop, trailhead, dog, solar) or they become a daily ritual (campfire, coffee, call home, PT).

**Busywork:**

| Meter or action | Why |
|---|---|
| Water | $2 or 1 h to fix; consequence $3 |
| Propane | Only the heater uses it |
| Phone power | Only gates photos |
| Feed the fire | Does nothing |
| Grime | Solved by parking at the truck stop |
| Lot tickets | Solved by the Trailhead spot or any dog |
| Family | One call a month |
| Fueling | Invisible and self-solving |
| The garden | 8 h round trip, food at 1.3–3× diner cost |
| Daily campfire | +16 psyche, a free ritual rather than a choice |
| PT for marks | Thematic, but a 20-day chore |

The van menu's 30-plus entries magnify the chore feel.

---

## 6. UX and clarity from the player's seat

1. **Run-ending states give no warning.** There is no pre-sleep check ("Tonight costs $X; you have $Y; debt will be $Z of your $C ceiling"), no HUD alert for debt near the ceiling, and no alert for starvation risk. The two most common deaths (rough night while hungry; injury bill → debt) happen at the moment of *sleeping*, which players treat as safe. **[E]** (the `Vt` list L56492–56752 has no such alert).
2. **The debt auto-sweep isn't explained on the HUD.** You earn $58, it vanishes, and you can't buy dinner. The Ledger explains the ceiling (L97595–97620), but it is two taps deep in the menu. **[E]**
3. **Game over is final and wipes everything, including settings.** For a PWA or Play title, a run that ends on day 9 from a $180 urgent-care bill will read as unfair. **[E]** (B15) **[I]** (perception)
4. **Load, the biggest injury driver, is missing where you decide to climb.** The condition banner covers energy, hunger, warm-up, skin, shoes, pad, rattled, burnout and fueling, but not load (L26830–26880). Load appears only on the player sheet (L91345–91400), the clinic's "Your File" (L79730) and a one-time tip. **[E]**
5. **Fueling and teeth have no persistent readout,** yet fueling scales injury risk by up to 1.5× and skin regen by 0.5×, and a tooth left alone costs $90 → $650 → $950. There are only morning-summary lines. **[E]**
6. **"Sleep is the only thing that moves the calendar"** (L34125) is untrue (B11). The idle clock also ages the character, and a player can't see that it's running unless they watch the HUD clock. **[E]**
7. **Messages are confusing:** "You're fried" means two different things; the low-energy block says "Too pumped" (B19); the energy warning sits at 30 while the penalty starts at 50 (S7). **[E]**
8. **Walking friction.** Routine loops (work → eat → climb → sleep) need joystick walks across 3–8 zone edges plus interior zones for the diner and cafe. There is no fast travel, no "go to" from the menu, and no queue. **[I]**
9. **The van sheet is a kitchen sink.** Up to about 32 entries (sleep, parking, aftercare, bench, call home, farm, photo, fire, deals ×2, kit ×2, rig header, wash, tape, PT, cook, dog ×2, meds, road trip, expedition, dream fund, charity, van check, sponsor, salary ×2, turn pro, retire, train and rest, hobbies, Olympic village) in one scrolling list (L54665–54943). **[E]**
10. **Good explanation exists, but it's scattered.** The tips (L34020–34105), the Body page's "what is loading the dice" (L98560–98700), the Ledger and the pre-climb banner are all well written, but there is no single "tonight / tomorrow" planner. **[E]**
11. **Onboarding points at the weakest job.** The tutorial targets the cafe ($28, L34144). It is the path that goes into debt around day 7 in the sim. The first quest asks for "$60 in hand" (L34992), which the cafe path reaches late. **[I]**

---

## 7. Overlaps, bloat, dead or vestigial systems

| Item | Status | Notes and refs |
|---|---|---|
| `scars` vs `marks` | **Overlap** | Two parallel "permanent damage" systems with different rules, caps and UI. Scars: +14% risk each, −3% style odds, cap 6, "Old damage". Marks: flare, PT, surgery, "The Receipts". Players won't hold both models in their head. L32409–32434 vs L26026–26060 |
| Memory Foam Bed vs Bed Platform; Solar Setup vs Solar Rig | **Overlap** | Same names, different effects (hunger vs psyche; +$8/day vs −15% nut). L33195 vs L27020 |
| Van meal $5/+25 | **Dead** | B16 |
| `case "cookhome"` (+60 hunger, uses water and propane) | **Dead** | B5 |
| Propane | **Near-vestigial** | Heater only |
| Water | **Low-stakes tax** | $2 fixes about 13 nights |
| Phone power | **Single-purpose** | Photography only |
| Fire fuel, "Feed the fire" | **Broken or vestigial** | B6 |
| `W1.hours`, `W1.healInjury` | **Dead fields** | B17 |
| `hitchSketch`, `tapeJobs` | **Write-only** | S5 |
| Lot tickets | **Trivially avoided** | Trailhead has no requirement; dog bug B1 |
| Family meter | **Thin** | −0.4 a night; its only effect is ±2 psyche a night; calling home monthly holds it |
| Fueling | **Invisible** | Duplicates "eat properly"; players never see it move |
| Garden | **Low value, high time** | 8 h trip; worse food economics than the diner |
| Motel, expedition, stint and flight day-jumps | **Parallel night paths** | B2, B3, B4, B11 |
| Two calendars | **Inconsistent** | B12 |
| DEV TOOLS (+$1k/+$10k, clear debt, needs, days) | **Shipped behind `?dev`** | Trivializes every survival system; the tech lane owns it. L36138–36151, L71856–72260 |
| Crunch event | **Kicks the player while they're down** | Fires only when cash is at or below $25. It is the most likely cause of a mid-game BUSTED. L47818–47824 |

---

## 8. Opportunities

Effort: S = under a day, M = days, L = a week or more. Ordered by priority within each group.

### IMPROVE (fix what exists)

1. **[S] Pre-sleep safety check.** If tonight's shortfall plus interest would reach the ceiling, or hunger would hit 0 with no money, show a confirm with the math and one-tap fixes: "Dumpster dive (1h)", "Eat a protein bar", "Sell X". This removes the most unfair deaths without changing the balance. (B13, B14, §6.1)
2. **[S] Starvation should eat what you own.** Before running the check, auto-consume pantry, produce, fish or consumables, or define starvation as hunger 0 with no edible food and no cash. (B14)
3. **[S] Debt float.** Sweep only the cash above a $15–20 food float, or let the player choose. Add a HUD "DEBT x/ceiling" alert at 60% and above. (§2.4, §6.2)
4. **[M] One `advanceNight(state, context)` pipeline.** Sleep, motel, expedition days, stints and flights all call it with context flags: `{paid: van|motel|none, heal: bool, bills: bool}`. This fixes B2, B3, B4 and B11, and it is the natural home for a unit-tested simulation core (see CLAUDE.md's "sim decides"). Expeditions must set `lastClimbDay` for each pitch day.
5. **[S] Fix the dog ticket check.** Change it to `g.dog && Z2(g.dog,"watch") && rand < 0.5` (and require the dog to be fed). (B1)
6. **[S] Show load on the climb panel.** Add a load line to the condition banner, e.g. "Loaded — ACWR 1.6 · +9% tweak risk per go". Make **warm-up** a default toggle; unwarmed attempts are currently ×1.6. (§6.4)
7. **[S–M] Soften the load cold start.** Seed `chronic` at a baseline (e.g. 20) for new characters, or replace `chronic > 6 ? a/c : 1` with a smooth blend. The day 2–9 spikes and the first-month injury rate drop, while spikes still matter later. (§5.4)
8. **[S] A cheaper first injury.** Before day ~20, or before first insurance eligibility, route the first tier-2 bill through a "free clinic" or "a friend drives you" beat that costs time and psyche rather than $180. (§5.4)
9. **[S] Game over keeps the settings.** Merge the settings back in after `fA`. **[M]** Offer a "rock bottom" continue instead of a hard wipe: lose the van upgrades and half the gear, restart at the Lot with the debt forgiven. That fits "every climber has a winter like this". (B15)
10. **[S] Clean up the text:** separate "fried" messages; energy block ≠ "pumped"; forage fills water (or stop saying so); pad build takes 2 h; the short rest is 10 minutes; move the energy warning to 50 or show a graded colour; S2, S3 and S4 copy. (B7, B9, B10, B19, S2–S4, S7)
11. **[S] Cap or crash the coffee.** Give the building coffee the to-go crash, or apply diminishing returns after 2 a day. (§5.2)
12. **[S] Clamp cash at 0** for the rain leak. Round fractional hours. (B8, B10)

### CHANGE (rethink the design)

1. **[M] Pick one calendar.** Either make a year 4 seasons (56 days) and age 1 a year, which gives roughly a 23×56-day career and needs a new retirement age, or keep 18-day years and label seasons as "months". This is save-breaking for age, so it needs a migration. (B12)
2. **[M] Replace the grade-scaled nut with lifestyle tiers.** The player chooses dirtbag, comfortable or plush van life, each with its own cost, psyche, grime and sickness profile. That turns the automatic scaler into a decision. (§5.1)
3. **[M] Keep money pressure alive through the mid-game.** Coordinate with the economy lane: slower promotions, a real rent-like cost for the parked van (permit zones), or survival costs tied to ambitions (road trips cost food, fuel and parts proportionally). The goal is that at day 30 "can I afford this trip?" is still a question. (§5.1, §5.7)
4. **[M] Make winter a season to prepare for, not a one-off purchase.** Heater fuel should cost real money each night. Insulation, the tarp and fires should stack as choices. Add a "winter kit" goal around day 40. (§5.5)
5. **[S] Rebalance the parking spots.** The Lot is free and central; every other spot costs fuel. Put a meaningful requirement or cost on the Trailhead. Charge tickets as cash, as well as counting them, so parking stays a nightly decision rather than a one-time setting. (§2.5)
6. **[M] Turn the campfire from a ritual into a choice.** Make it the social hub, with psyche from company rather than a flat +16. Or make the flat bonus conditional (first night at a new spot, after a hard day). (§5.3)

### CUT (merge or remove)

1. **[S] Merge water, propane and power into one "supplies" gauge** that restocks at the gas station and drains a little each night. Or cut water and power outright. Three meters with near-zero decisions add clutter. (§7)
2. **[S] Remove "Feed the fire"**, or give fire real hourly burn with warmth only while it burns. (B6)
3. **[M] Merge scars and marks** into one "old injuries" system (flare, PT and surgery, with region odds penalties). (§7)
4. **[S] Deduplicate upgrade names** (Bed/Bed Platform, Solar/Solar Rig). (§7)
5. **[S] Fold family into relationships or psyche,** or give it teeth: a quarterly visit that matters, or consequences below 25 beyond −2 psyche. (§7)
6. **[S] Remove dead code and fields:** the van meal, the dead cookhome case, `W1.hours`/`healInjury` (or implement them), `hitchSketch`, `tapeJobs`. (B5, B16, B17, S5)

### ADD

1. **[M] A "Tonight" or rig panel on the van:** tonight's cost, runway in nights, debt and ceiling, sickness risk (winter, diet, depleted), load status, fueling, tooth, the next bill, the forecast. One screen replaces about 8 hidden meters. (§6.5, §6.10)
2. **[M] Plan-the-day queue and fast travel.** "Go to" from the menu (auto-walk or cut), plus an optional morning agenda ("Shift → Diner → Gym ×3 → Van") executed as a sequence. This cuts about 40% of taps and the walking. (§2.8, §6.8)
3. **[M] Split the van sheet into tabs:** Sleep & Camp, Body, Rig, Money & Deals, Life. (§6.9)
4. **[M] Late-game survival hooks:**
   * The van gets old and a replacement decision comes due (van age, not just parts).
   * Tie injury insurance to age.
   * Aging-body routines get richer.
   * "Pro" makes survival depend on sends: surface a pro "runway".

   (§5.7)
5. **[S] Onboarding points at the right safety nets.** Teach Hustle → Dumpster dive the first time hunger drops below 35 and cash is under $10. Teach the ceiling the first time debt appears. Tutorial job choice should show "net per day" (pay − nightly cost). (§6.11)
6. **[S] Pause the clock when idle.** Pause after N seconds without input, or when the tab is hidden, so AFK doesn't age the character. (B11)

---

## 9. What's strong and must be preserved

* **The overnight report.** The morning summary turns about 40 nightly systems into a readable story of what the night cost and gave (L52414–52436, L74476ff). This is the right presentation for a sim that settles overnight.
* **The pre-climb condition banner** (L26830–26880). It surfaces the single worst factor, in voice ("Under-fueled — eat something…"). Extend it (add load); don't replace it.
* **The injury model and its explanation.** Acute:chronic load, tiers, diagnosis as an information cost ("?" days), physio trust, the cortisone/PRP trade-offs, marks that "talk" and need PT, age scaling, and the Body page's "what is loading the dice" (L98560–98700). The deepest and most thematic survival system, and it stays relevant late.
* **Vignettes with real choices, in the right voice:**
  * breakdowns: 6 parts × tow/DIY/limp/bodge
  * knocks: 10 × 3
  * epics: 5 × 3 stages
  * hitchhikers: 8, with repeats
  * crunch options: sell gear, graveyard shift, ask a friend, the tab

  All are dry, second-person and specific ("Park on a hill every single time, for as long as you can stand it."). Keep them all.
* **The Hustle menu** (cans, dumpster, forage). A dignified, thematic safety net: being broke is survivable if you know about it.
* **Rest days that don't consume the day** ("The day is still yours"). Humane, and a real training concept.
* **Psyche and staleness as a variety driver.** "The same wall stops feeding you" is a genuinely good systemic idea. The problem is only the flat-bonus rituals that bypass it.
* **Parking-spot identity** (Lot, Trailhead, Ridge, Truck Stop, Driveway, with lines and unlock requirements) and **the dog** (psyche, finds and its life arc). Rich flavour worth rebalancing, not cutting.
* **Tips copy** (L34020–34105) and **the first-season quest** (L34980–35052). They set the register for the rebuild.
