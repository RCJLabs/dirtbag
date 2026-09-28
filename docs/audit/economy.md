# Dirtbag audit: Jobs, money and the economy (incl. sponsorship and media careers)

Auditor: economy. Source: `$SRC/bundle.pretty.js` (v0.956.0). Line numbers refer to that file.
Labels: **[ESTABLISHED]** means read directly in code or data. **[INFERRED]** means my reasoning, projection or simulation.
Scripts used (reproducible): `$SP/work-economy/{extract,minigames,setter,model,gym,counts,fish}.js`.

---

## 1. Summary

1. **Money is a real constraint only in week 1.** [ESTABLISHED formulas / INFERRED model] A new player's costs are about $65–90 a day: van life $18×(1+0.08×grade), food, a $45/week registration, repairs, tickets, and a hidden **$5 per gym attempt**. Any job clears that on day 1. A barista overtime shift pays $69 on day 1. Warehouse overtime pays $115 on day 1 and $384 at Veteran rank. **Veteran takes 12 shifts** (rank every 3 shifts), and the employer-rep pay bonus caps after 3 shifts. By about day 12 a worker earns 5–6× their costs. From then on money is a score, except for the big sinks.
2. **Media income runs away.** [ESTABLISHED formula, INFERRED magnitudes] Every *first send*, **including gym problems**, pays `followers/1000 × (grade+2)` in cash (`Gue` 30303, applied at 48329 with no gym check). Gym problems get new IDs every 7 days (`Rte=7`, 22249), so they are a renewable weekly first-send pool. At 25k followers and V9 this is about $440/day. At 120k followers and V11 it is about **$2,300/day**, which is 20× a worker's pay. Followers are uncapped: sponsor deliveries give +1k/3k/8k/18k per 16-day cycle, and a "prove it" heat event gives +35%.
3. **Jobs are an uncapped, undiminished strength source.** [ESTABLISHED] Job minigames add skill *flat* (52096–52103): warehouse about +4 power and +2.8 fingers, courier +4–6 endurance, coach roster +5 head and +2 technique. Climbing gains are divided by `1+skill/40` (28550). At V10 one sent climb gives about +2.4. A warehouse shift gives +6.8 and **pays** $226–384. Late in the game, working is the best way to train power, fingers and endurance. Recipes are also flat (+3–5 skill for about $16).
4. **All 8 jobs share one framework and differ only in their minigame.** [ESTABLISHED] The framework is: base pay +$15 per rank, 5 ranks with 3 shifts each, +8 employer rep a shift (pay bonus capped at +25%), craft +1 a shift up to 12, a minigame pay multiplier of 0.35–2.0×, two "regular" NPCs who graduate for a one-off $55–90, and an elite event at max craft. The minigames range widely:
   - **Setter** (a route-composition puzzle) is genuinely good.
   - **Warehouse and courier** are push-your-luck games, but "never stop" is the dominant strategy.
   - **Rescue** stops mattering once stats get it to "clean".
   - **Office** is a meter you solve once.
   - **Barista, coach and clerk** are read-and-match quizzes you solve once.
5. **The only real "earn vs climb" tension is energy and hours, and money can buy energy.** [ESTABLISHED] You get one shift and one gig or guiding day per calendar day. Coffee gives +16 energy for $4, with no cap and no crash (52163–52169). Sleeping after 6 days without a shift gets you fired. There are no stat or grade gates on promotion. The only job gates are setter V8 and rescue V4; guiding needs V5 and rep 20.
6. **Confirmed defects in this subsystem:**
   - Barista craft never grows, and barista shifts raise *rescue* craft instead (52059–52073).
   - Owned-gym profit goes into a `balance` the player can never withdraw (52600, 54350).
   - The club stipend is paid **nightly** although the perk says "$15/$12 a week" (51617, 24839/24858).
   - The Collective's "loaner camera" perk gives Liquid Chalk (24920).
   - The Work panel's "PAY / SHIFT" leaves out the rank bonus (97884).
   - The "What a night costs" panel always shows "Dream Rig owned ×18" (97724).
   - The sponsor card says "$/CYCLE" for a stipend that is paid daily (99013).
   - Seasonal stints silently get you fired and lose your sponsor and brand deals (52838–52900).
   - Owning any dog makes you 100% immune to parking tickets (51145).
7. **The owned gym ($25k) is a trophy, not a business.** [ESTABLISHED] A fully built gym nets about $800/day into an unusable balance. The only cash that reaches you comes from comp nights (which lose money below 32 members), league nights ($45–224/week) and circuit hosting ($884 per won bid, with a $2,200 deposit at risk). "Premium" pricing loses $30/day out of the box, and 14 days in the red means foreclosure.
8. **There are few money sinks, and the costs grow slowly.** [INFERRED] Everything worth buying totals about $90k: the gym and its upgrades about $60k, dreams $16.8k, a gear kit about $1.4k, expeditions (which are net positive), and surgery $4.2k. The only cost that scales is van life, ×1.8 at V10, under a hidden "Living larger (grade)" multiplier. A media player at day 200 covers every sink in about 3 weeks.
9. **The flavour writing is excellent and should be kept.** Ad pitches (t6), the discourse threads, sponsor tiers with "real" vs "brand" terms, the salaried "sell-out" option, the "squeeze" crunch, stints and the setter's wall all read well. The systems underneath need a re-tune and fewer copy-paste jobs, not a rewrite of the tone.
10. **Top 5 fixes.**
    - Curve and cap content cash, and exclude gym sends or make gym sends pay followers only.
    - Put job skill gains behind the same diminishing returns as climbing.
    - Gate job ranks on stats or grade, and make rank buy perks and leave that matter to a climber, not just money.
    - Make the gym profit withdrawable.
    - Fix the eight display and logic bugs above.

---

## 2. How it works

### 2.1 The daily money loop (everything is charged at sleep)

The `case "sleep"` block runs roughly 51438–51700. Each night, in order:

| Item | Formula / amount | Line | Tag |
|---|---|---|---|
| Van life ("the nut") | `round(18 × o3(grade) × solarBuildout(0.85) × calling.nut × origin.nut(desert .92) × cheapskate quirks)`, where `o3=min(1+0.08·grade, 3)`. Dream Rig halves the base to 9. Home Base makes it 0. | 51629–51658, 16235, 24238 | EST |
| If you can't pay van life | the shortfall goes to debt, energy is only 80, hunger −5 | 51651–51657 | EST |
| Registration | $45 when `day % 7 == 0` (skipped with Home Base) | 51683–51697, 16393–16394 | EST |
| Health insurance | Catastrophic $25/wk or Full $55/wk (Late Bloomer ×0.65), billed on the same day | 51685–51690, 16652–16654 | EST |
| Random van repair | 6%/night after day 6 (×0.4 with the Tool Kit): $55–95 | 51261–51263, 16403–16406 | EST |
| Parking ticket (The Lot) | p = clamp((consecutiveLotNights−1)×0.1, 0, 0.4) × pK(standing: 1.3/1/0.7/0.5) × (Blackout Curtains 0.3). $25 each; 3 unpaid means a **boot** ($60 impound). Any dog blocks it (bug). | 51142–51146, 51671–51681, 16397–16402, 17759 | EST |
| Water | 3 L/night; if the tank is short, $3 of bottled water | 51445–51449 | EST |
| Hunger | −15/night (−8 with the $70 Memory Foam Bed) | 51442, 33233–33234 | EST |
| Van battery | −1.5/night (dead battery means no driving) | 51443, 16764 | EST |
| Debt interest | `ceil(debt × 3%)` per night, paid from cash if possible, otherwise added to debt | 51465–51471, 16389 | EST |
| Taxes | 20% of the year's **prize money only** (comps, podium and kit bonuses, appearance fees), charged when `day % 18 == 9` (a "year" is 18 days) | 52315–52322, 16395–16396, 25975 | EST |
| Passive income | Solar Setup +$8, Power Station +$10, sponsor stipend (daily), brand deals (daily), club stipend (daily; bug), guidebook royalties (≤$18/day), doc film cheque (per 14-day season, ≤$265) | 51444, 51453–51464, 51486–51526, 51617, 22812–22824, 16636–16644 | EST |
| Job no-show | warning at 3 days without a shift, **fired at 6** (employer rep −40, a "black mark") | 51828–51840, 18085–18086 | EST |
| Sponsor grace | dropped if days since your last climb exceed 6/7/8/9 by tier (rep −15) | 51454, 51849–51858, 29891ff | EST |

**Debt is negative cash with a cliff.** [ESTABLISHED]
- Any positive cash auto-pays debt at once (useEffect 36441–36446).
- Game over "broke" happens when `debt ≥ 100 + 3·standing + 2·rep (+400 if sponsored)` (`Wu` 16390, `q2` 33973).
- A fresh character's ceiling is about **$100**.

**Money UI.** [ESTABLISHED] The morning report shows `cashDelta` (52430). The money panel (97695–97767) itemises "What a night costs" and "Coming due", with runway = cash ÷ nut (31768). Runway ignores food and bills.

### 2.2 Jobs: the shared framework

**Buildings.** [ESTABLISHED] The job buildings are defined in `To`, lines 10928–11171:

| Job (building id) | Where | Base pay | Energy | Hunger | Hours | Take-job gate | Building says it trains |
|---|---|---|---|---|---|---|---|
| Office (`job`) | Downtown | $38 | 18 | 8 | 4 | none | – |
| Route Setting (`gym`, Send City) | Downtown | **$28** | 22 | 10 | 4 | **V8** (`bK=8`, 18058–18060) | TEC 3 |
| Coaching (`cave`) | Trailhead | $34 | 18 | 10 | 4 | none | HEAD 2, TEC 1 |
| Shop Clerk (`shop`) | Old Town | $30 | 14 | 8 | 4 | none (+20% shop discount, `LB` 18060) | – |
| Barista (`cafe` / `cafe_bar`) | Midtown | $28 | 12 | 8 | 3 | none | – |
| Courier | Outskirts | $52 | 34 | 16 | 5 | none | END 3 |
| Warehouse | Old Town | $58 | 38 | 16 | 6 | none | PWR 3, FIN 2 |
| Fire & Rescue | Uptown | $55 | 34 | 14 | 6 | **V4** | HEAD 2, END 2 |

**Pay per shift** (52038–52051):
```
pay = round( (base + 15·(rank−1))                 // b8, tK=15 (17621)
           × (1 + clamp(empRep/100, −.25, +.25))   // s3 — caps at rep 25, i.e. after ~3 shifts (17630)
           × (1 + max(−purism,0)/500)              // hN — pragmatists earn up to +20% (32063); every shift is purism −2
           × origin.pay )                          // "Sold It All" ×1.12 (31406)
      × minigame.payMult                            // 0.35–2.02 depending on job
      × randomEvent                                 // 30%: +$15 / ×0.6 short / +$8 late / rough (18068–18084) → E≈×0.97
      × (overtime ? 1.7 : 1)                        // sM; energy ×1.5, hunger ×1.3, +2h (18062–18064)
```

**Rules around the shift.** [ESTABLISHED]
- **Frequency:** one shift per calendar day, overtime included (`lastWorkDay`, 50950).
- **Minimum condition:** energy ≥ 30 (≥ 45 for overtime) and hunger > 0.
- **Psyche:** −8 per shift (−13 overtime), −3 more if discipline ≤ −40, plus or minus the minigame result.
- **Rank:** New Hire → Regular → Senior → Lead → Veteran (`HB`, 17618). You are promoted every **3 shifts** (`m8=3`), so 12 shifts to the top.
- **Promotion needs nothing else:** attendance only. There are no stat or grade gates beyond the take-job gates.
- **Employer rep:** +8 a shift plus the minigame's standing (−8..+10), clamped −60..100.
- **Rehire:** at rep ≥ 60 ("trusted regular") you are rehired at rank 2. At ≤ −20 you have a black mark.
- **Craft:** +1 a shift up to 12 (`xQ`, 19132–19167). Craft adds +0.01–0.02 per point to minigame scores (or −3%/−3.5% to drop and crash risk). At 12 it unlocks an "elite" event: special project, prodigy, big order, elite rescue call, fragile crate, or priority rush.
- **Titles:** after 10 or more shifts with at least 65% "good" days you get a one-time toast ("the back that never calls in", 18267–18276). It has no mechanical effect and is shown once.

**Salaried.** [ESTABLISHED] The office offers a salary once `empRep.job ≥ 8` (**after one office shift**, `GQ=8`, 44498–44508). The offer repeats 24 days after a decline.
- Pays $72/day passively.
- Psyche −1/day, but never below 30.
- **Blocks:** climbing sessions, driving, training, guiding and comps (`o2` checks at 38998, 50999, 50065, 40083, 50260).
- **Does not block:** working shifts or taking odd-job gigs. A salaried player can still clock an overtime shift, for up to about $450/day with no climbing.
- Quitting gives +5 psyche.

**Turning pro.** [ESTABLISHED] Requires a signed sponsor and rep ≥ 150 (50582–50599). It clears your job. Afterwards:
- A repeat outdoor send pays $8.
- A first send pays (grade+1)×7 outdoors or ×3 in the gym, ×3 for a myth route (`oue`, 29884).

Nothing stops a pro from taking a job again, and `pro` survives losing the sponsor. [ESTABLISHED by absence of checks in `eh()` 54595 and the `takejob` reducer 52122]

### 2.3 The eight job minigames

These are the results of `minigames.js` and `setter.js`. The EV column is the expected pay multiplier. [INFERRED from simulation of the ESTABLISHED formulas]

| Job | Mechanic (lines) | Decision space | Pay mult range and EV | Skill output | Verdict |
|---|---|---|---|---|---|
| **Setter** | Compose a 5-move route from 12 moves (intensity 0–3, kind tech/power/dyn/cryptic) for a random wall style (5) and target grade (`3+rank+rand(0..2)`). Choose "proud line" or "crowd-pleaser". Scored on grade accuracy, flow (a crux, a rest, variety, no back-to-back throws, not monotone), style fit and repetition (`cM` 18117–18146; UI 81700–82010 shows a live grade and a ✓ on moves that fit). The set stays on the wall 7 days; the town "climbs it" (`WK`); setterRep drives an apprentice, head setter (×1.15), guest sets at the Cave ($70×mult) and league nights. | Real. A legible puzzle with live feedback. | Bucket 0.7/1.0/1.25/1.6 × crowd 1.1 or proud 0.9 × head 1.15, **max 2.02**. At craft 0 the best reachable is "classic" (0.88–0.975). At craft 12, 25–41% of *random* sequences are classic. | TEC 1–6 | **Best job minigame.** Depth ceiling drops at max craft. |
| **Warehouse** | Pick pace (steady ×0.7 fatigue, ×0.85 pay; hustle ×1.3/×1.3), then pick 1 of 3 items (6 kinds, pay 4–16, fatigue 4–14) up to 6. Drop risk `(fatigue/100)^2.4 × .62 × weight × (1−.03·craft)`; stop any time (19083–19110, 46178–46304). | Push-your-luck, but a drop only forfeits the item in hand, so never stopping is optimal. | Steady greedy **1.20** (craft 0) to **1.58** (craft 12, fragile crate). Hustle full-send **1.50–1.73** with 56–65% drops. "Call it early at fatigue 45" is 0.99–1.30. | PWR 2–5, FIN 1–3 | Good toy, broken incentive: the game praises quitting early ("no shame") but punishes it. |
| **Courier** | 8-hour budget; pick runs (pay 6–21, 1–3 h, near/mid/far) from 3 offers plus standing accounts. Crash risk 1.2/3.2/6% × pace (0.8/1.5) × weather × craft (47291–47420, 19186–19250). | Knapsack plus push-your-luck. | Steady 0.80–1.06; **hustle best $/h 1.22 → 1.51** with 15–19% crashes. A crash keeps earnings so far. | END 2–6 | Decent; hustle dominates. |
| **Rescue** | A call (severity 1–3, elite 4) and 2 random "beats" × 3 options (progress/risk), stance (urgent/by the book), call (commit/air/hold). `W = j + R·.02 − A·.03 − sev·.03`, with competence `j = .45 + (head+end)·.004 + rep·.0004 + craft·.01` (19297–19320, 46086–46177). | Looks meaningful. | Once head+endurance ≈ 80 (j ≥ 0.8) **every** choice gives "clean" (1.4); ×1.6 on elite calls. | HEAD 0–2, END 0–2 | Choices stop mattering by early-mid game. |
| **Office** | 5 flavour tasks, each "Knuckle down" (focus −22, +focus/100) or "Phone it in" (+12 focus, +0.15); stance grind/coast (18870–18920, 45996–46085). | A deterministic meter; one optimum. | Best KpKKK/grind **1.32** (1.43 at craft 12, −8 psyche). Best psyche-neutral KppKK/coast 1.15. | none | Solved in one sitting. The special project (+$130, 18-day deadline) is a nice arc. |
| **Barista** | 3 customers, each a "tell" (6 kinds), pick the drink from 3 (18291–18370, 37472–37510). | Read and match; the text gives the answer. | 3/3 = **1.5**; craft never grows (bug). | none | Trivial after one shift. |
| **Coach** | 3 clients: a tell (6) → pick the cue (4 options) + approach (send/patient). **Roster:** up to 3 private clients; pick a focus: weakness = 1, strength = .55, other = .35 (45655–45830, 18380–18660). | Quiz; roster is "pick weakness". | Quiz all-right: send **1.66**, patient 1.52. **Roster: 0.75 + craft·.02 means guaranteed ×1.6 at craft ≥ 4, plus a $25×mult (≈$40) fee.** | HEAD 1–6, TEC 0–3 | The roster is a solved dominant option. The "graduate a client 4 grades" arc is nice. |
| **Clerk** | 3 customers plus regulars: pick right / upsell / 2 wrong; stance sales (×1.18 pay) or service (45831–45995, 18724–18822). | Quiz with a moral twist. | Honest sales 1.18. **Always upsell = 1.70 (the max)** at standing −8 and psyche −7 per shift. | none | Moral trade-off is fine, but money is abundant, so it doesn't bite. |

**Reskins.** [INFERRED]
- Barista, coach and clerk are the same read-and-match quiz.
- Rescue and guiding (`FN` 33559) are the same beats × options + stance + call engine.
- Warehouse and courier are both accumulate-until-bust.
- Every job has the same "regulars" side-arc: setter regulars and apprentice, shop regulars, courier accounts, warehouse crew, rescue partner, coach roster, guide regulars. Each graduates for a one-off $55–90 plus standing or rep.

### 2.4 Other ways to earn

| Source | Mechanics | Pay | Line | Tag |
|---|---|---|---|---|
| **Odd-jobs board** | 3 random of 14 gigs, filtered by grade, rep and season; **1 per day**, shared with guiding (`lastGigDay`). Flat skill +1–2 on some. | $18–68 | 33235–33442, 40051–40080 | EST |
| **Guiding** | Unlocks at V5 and rep 20. 2–3 clients; weather escalation; 2 beats + stance + bail. 26 energy, 5 h. Regulars graduate for +$80. | `50 + goalGrade·14 + U(0..19) + rep/10` × (1.3/1.0/0.6/0.3). About **$120 at V6, $220 at V11**. | 33576–33595, 40081–40272 | EST |
| **Seasonal stints** (Season Board) | One per season, day ≥ 15, 20-day cooldown. Skips 12–21 days. Skills ×(1−decay), skin, psyche and burnout changes. **No living costs are charged**, but debt compounds. | Guide Season $780/16d (skills −1.5%); Alaska Boat $1,600/21d (skills −14%, burnout +12); Fire Lookout $620/14d (psyche +14, burnout −20); Dish Pit $520/12d | 16416–16489, 52821–52901 | EST |
| **The squeeze (crunch)** | When cash ≤ $25 on day ≥ 20, 50% per night, once per 28 days: a $110–190 bill. Options: sell your best spare gear (45%), take a graveyard shift (+$70, −34 energy), call a bonded friend, or put it on the tab. | – | 47821–47827, 52741–52820, UI 74011–74127 | EST |
| **Daily / weekly / board challenges** | Daily $14–35, weekly $90–150, board (3 at once, 7 days) $30–100, club board $20–60 | about **$55–70/day** if met | 22300–22627, 22569 | EST |
| **Content cash** | Every first send (gym or crag): `followers/1000 × (grade+2)` if followers ≥ 500. First crag sends also get a post prompt (+12–55% cash, +30–70% followers). | scales linearly with followers | 30302–30303, 48328–48346, 41591–41618 | EST |
| **Sponsor stipend** | Daily, by tier $25/45/78/120 ("real" deal 65%). Delivery bonus $40/80/150/250 plus 1k/3k/8k/18k followers per 16-day cycle. | – | 29885–29985, 44640–44688, 51455 | EST |
| **Brand side-deals** | Ridgeline Chalk $4, Nomad & Co. $9, Ferrata $6, KINETIK energy drink $38/day. Renewed every 60 days at ×0.5–2.2 by rep and followers. Lapse after 10 days without climbing. | – | 24543–24629, 51486–51526 | EST |
| **Shoe kit deals** | 5 brands. 35–50% off that brand's items, free replacement pair when condition ≤ 22, $15–70 bonus per first send at or above a grade, podium comp. Dropped after 12 days in rival rubber. | – | 24696–24785, 51527–51561, 48336–48344 | EST |
| **Sponsored ads** | Tier ≥ 2 obligation: straight fee $140/280/500 plus 1.2k/3k/7k followers ×engagement; "honest" ×0.4 fee, ×0.5 followers; kill = strike. | – | 29986–30032, 41619–41683 | EST |
| **Photography** | 1 h, 6 energy, 8% phone power per shot; followers = quality×110. Print = `18 × clamp(q,.4,3) × (keeper 2.4)`: $7–130. Commissions $55–125 within 6 days. Cameras $70/$320/$800 (×1.15/1.35/1.6). | – | 25769–25850, 42816–43086 | EST |
| **Documentary** | Offered from day 30. Interview trust; premiere; per-14-day-season cheque `min(420, (40+26·reach)·{1,.6,.28}·{hero 1.35})`, **≤ $265/season** | – | 16490–16644 | EST |
| **Comps** | $20 entry. Local 1st $120, 2nd–3rd $60; national places $900…$140 plus sponsor podium ×1/2/4/3/5/8 plus appearance fee `clamp((rep−140)·1.2 + followers/900, 0, 260)`. Taxable. | – | 29785–29843, 50258–50280 | EST |
| **Expeditions** | Cost $900/2,200/4,500 (War Chest halves it); summit pays $2,400/6,000/12,000 plus rep and 4k/12k/30k followers | – | 23321–23374 | EST |
| **Minor** | Fishing (≈$5–10 a catch, 2 h), busking tips, barn chores ($10–25 at 40%), dad's gas money, guidebook royalties (≤ $18/day), quest rewards (17 cash rewards, $2,950 total) | – | various | EST |

### 2.5 Spending

**Food.** [ESTABLISHED]
- Diner: $10 × O5(standing), from 1.08 down to 0.85, for +50 hunger (16237–16238, 17758).
- Groceries: 13 ingredients at $3–8 (28120–28134).
- Recipes: 10, each **+2–5 flat skill** with a cooking timing minigame (28136–28303, 45175–45305). Limited only by "hunger < 98".
- Coffee: $4 for +16 energy, unlimited. Apparel: $18 for +10 energy.
- Consumables: $2–7 (16244–16379).
- The Camp Kitchen ($110) perk text says "$5 a plate", but the van menu only offers recipe cooking. The $5/+25 van-meal path (52140–52151) is unreachable.

**Gym entry.** [ESTABLISHED] **$5 per attempt** at any gym, unless you are the Send City setter (`Dae` 25411, 47978, deducted per attempt at 48463). No menu or hint discloses it; it appears only as an error when you are broke (47991).

**Gear.** [ESTABLISHED]
- Catalogue `Xt` (32519–33042): 52 items in 10 categories, prices $0–360, $4,928 in total.
  - A usable starter kit costs about $385–455.
  - A "best" kit costs about $1,400.
- Pricing: `price × (clerk 0.8) × (1 − kit discount .35–.5) × (trust-fund 0.7)` (`Vk` 18061).
- Wear:
  - Shoes lose `wear(1.4–4.6) × (1+0.035·grade)` per attempt.
  - Pads lose the same per crag attempt (48548–48571).
  - Worn (< 40) gear gives only part of its bonus; blown (< 15) gear gives a *negative* bonus (`a6` 33079).
- Upkeep: resole $35, re-foam pad $45 (33067–33072).
- Swap meet: buy used at 55% with condition 60; sell at `40% × condition` (49299–49345).
- Other shopping: books and instruments $14–60 (7). Club rank perks give free gear.

**Workbench.** [ESTABLISHED] 10 recipes turn scavenged materials into aftercare items, a med kit, sole patches and more. Repairs raise `gearRepairs`, which lowers max condition `100 − n·Use`; gear becomes "finished" when max ≤ 55 (26349–26370, 26892–27019).

**Van.** [ESTABLISHED]
- **Fuel** costs $0.50 per % of the tank (49925–49940). Crag round trips use 24–90% (`wo` 22831).
- **Parts** (6: battery, tires, brakes, belt, alternator, starter; $45–130) wear by `wearPerLeg × fuel%`. Patch for $15–30, or buy spares at the gas station (16701–16773).
  - Parts cost about $0.88 per % of fuel.
  - So a round trip costs about $1.4 per %: local crag ≈ $33, the Crucible ≈ $124.
- **Upgrades** `vR` (33195–33230), 9 items totalling $925:
  - **Solar $130 = +$8/day; Power Station $120 = +$10/day.** These are the best returns in the game, paying back in 12–16 days.
  - Tool Kit ×0.4 repair chance; Blackout Curtains ×0.3 tickets; Efficient Tune-Up ×0.7 fuel; Heater; Bed; Pull-up bar; Kitchen.
- **Build-outs** `fL`: 4, made from materials. The solar build-out makes van life ×0.85.
- **Parking spots** `Mv`, 5 (27773–27875): The Lot (free, tickets), Upper Trailhead (3% fuel = $1.50), Ridge, Truck Stop (shower), Friend's Driveway.

**Health.** [ESTABLISHED]
- Insurance:
  - Catastrophic: $25/wk, $40 copay.
  - Full: $55/wk, adds surgery at $950 instead of **$4,200** after 30 days on the plan.
- Other costs: physio $35, PRP $600, psych $45, dental $90/650/950 (or pulling the tooth for $160/220) (16650–16667, 24523, 32336–32340, 56150–56229).

**Other.** [ESTABLISHED]
- Charity: $50 food bank (+10 psyche, 5-day odds buff). Access fund: $40 (49942–50012).
- Club dues: $0–12 every 7 days (51596–51603).
- Crag unlocks: $400/600/800. Permits: $20–35 (22831ff).
- World Cup airfare: $210–800 per round (29616ff).
- Comp entry: $20.

**Dreams.** `G3` 23405–23427, with a protected savings pot at 39210–39260:
- Dream Rig $2,800: van life ÷ 2.
- War Chest $5,000: expeditions ÷ 2.
- Home Base $9,000: no van life or bills, a free cabin kitchen.
- Claiming gives rep +30/60 and followers +1.5k/5k. [ESTABLISHED]

**Owning a gym.** [ESTABLISHED]
- **Price and setup:** **$25,000** (`Mu` 23429). Price tiers budget/standard/premium, set mix, equipment $4k/$8k, campaigns $800/$2k, staff hire $2k/$3.5k with wages $25/$35 a day, 5 wings $2.8k–6.5k with upkeep $4–20/day (23430–23843).
- **Daily tick** (47914–47960):
  - Members move 15% toward (target + wings) × competition factor (0.62–1.5, from 2 rival gyms' random moves) × season (−14% to +10%).
  - Net = members × rate + café − $180 overhead − upkeep − wages (+$15 when hands-off).
- **Where the money goes:** net is added to `ownGym.balance` (52600). Cash comes back to you only from comp nights (54313), league nights (53919), circuit hosting (54030) and the gym floor.
- **Risk:** 14 days in the red means foreclosure and −8 standing.
- **Incidents:** 6 of them, 3.5% a day after the first 14 days.
- **Youth team:** $1,200, plus a $30/day hired coach.

### 2.6 Sponsors, social media and the "pro" career

- **Tiers** `er` (29885–29960). You qualify when rep ≥ 60/120/200/300 **or** followers ≥ 8k/22k/55k/130k (`ZT` 30297). [ESTABLISHED]

  | Tier | Brand | Stipend | Podium | Grace |
  |---|---|---|---|---|
  | 1 | Chalkbag Co. | $25 | $60 | 6 days |
  | 2 | Apex Climbing | $45 | $175 | 7 days |
  | 3 | Vertex Alpine | $78 | $420 | 8 days |
  | 4 | Meridian | $120 | $800 | 9 days |

- **Deal terms.** "Keep it real" pays 65%, makes goals ×0.75, gives +5 rep, purism +6 and trad +12. "Full brand" pays 100%, makes goals ×1.25, purism −6, media +12, trad −10 (42973–43009, 29964–29971). [ESTABLISHED]
- **Cycle obligation** (16 days; `TW` 30256): clip at V(grade−1)+, photo at a named location, ad (tier ≥ 2), comp appearance (tier ≥ 2), rep +15/25/40/60, or followers +800/2.5k/6k/14k. Delivering pays $40/80/150/250 plus 1k/3k/8k/18k followers plus 3–12 rep. **Two misses and you are dropped** (44640–44688). [ESTABLISHED]
- **Heat** (a thread about you): chance `1.2% × (1 + followers/25k + engagement≥80 ? .5) × (1 + trad<38 ? .8 + recent straight ad ? .6)`, capped at 6% a day (30047–30054). Stances:
  - **Prove it:** re-send at that grade before the deadline for **+35% followers** and +12 rep; failing costs −6%.
  - **Fight** or **ignore.**
  (44521–44639) [ESTABLISHED]
- **Discourse:** only **3** scene threads (grade war, parking row, sponsor announcement) with 2 sides each (31082–31176). [ESTABLISHED]
- **Posts** `OL`: 5 styles (straight, beta, story, bait the algorithm, keep it off the internet), trading followers and cash against rep, psyche and purism (31178–31260).
  - Engagement decays 2.5 a night after 6 days without a post.
  - Below 32 engagement and 14+ days silent, you lose 0.6% of followers a night (30810–30816).
  [ESTABLISHED]

---

## 3. Content inventory (economy lane)

| Content | Count | Where |
|---|---|---|
| Shift jobs | 8 (plus salaried office) | `To` 10928–11171 |
| Job ranks | 5 × 3 shifts | 17618 |
| Job minigames | 8 distinct UIs, 5 distinct mechanics | see 2.3 |
| Setter moves / wall styles / set names | 12 / 5 / 16 | 18087–18225 |
| Coach tells, cues and temperaments / roster archetypes / pro athletes | 6 / 8 / 6 | 18380–18660 |
| Clerk customer templates (+ elite + 4 regular stages) | 6 | 18724–18846 |
| Office tasks (flavour) / special projects | 10 / 4 | 18849–18896 |
| Rescue calls (+ elite) / beats × options / partners | 6 (+2) / 5×3 / 4 | 18936–19014 |
| Warehouse items (+ fragile) / crew | 6 (+1) / 2 | 19083–19110 |
| Courier runs (+ rush) / standing accounts | 6 (+1) / 4 | 19111–19245 |
| Barista customers and drinks / overheard crag lines | 6 / 5 | 18291–18370 |
| Odd-job gigs | 14 (4 seasonal) | 33235 |
| Guide clients: names / blurbs / decision beats | 14 / 6 / 5 | 33450–33541 |
| Seasonal stints | 4 | 16416 |
| Gear items / categories / brands | 52 / 10 / 5 | 32519, 32458 |
| Van upgrades / build-outs / parts / bench recipes / materials | 9 / 4 / 6 / 10 / 8 | 33195, 27020, 16701, 26892, 26881 |
| Ingredients / recipes / consumables | 13 / 10 / 15 | 28120, 28136, 16244 |
| Books and instruments / cameras | 7 / 4 | 28304, 25826 |
| Sponsor tiers / shoe kit brands / side-deals / ad pitches | 4 / 5 / 4 / 7 | 29885, 24696, 24543, 29986 |
| Heat kinds / discourse threads / post styles / comment lines | 5 / 3 / 5 / about 45 | 30056–30126, 31082, 31178, 31291 |
| Challenges: daily / weekly / board / club board | 7 / 5 / 10 / 16 | 22300–22627 |
| Clubs × ranks | 4 × 4 | 24787 |
| Dreams / expeditions | 3 / 3 | 23405, 23321 |
| Gym: price tiers, mixes, equipment, campaigns, staff roles × traits, wings, incidents, rival gyms × moves, league formats, youth kids | 3, 3, 3, 2, 2×4, 5, 6, 2×6, 4, 14 | 23430–23971 |
| Quests with cash rewards | 17 ($2,950) | 34980–35736 |

---

## 4. Bugs and defects

### Confirmed [ESTABLISHED]

| # | Defect | Lines | Failing scenario |
|---|---|---|---|
| B1 | **Barista craft never increases; barista shifts increase rescue craft.** The craft chain in `case "work"` has branches for setter, coach, clerk, office, warehouse and courier, and an `else` that writes `rescueCraft`. There is no `baristaCraft` branch, and the return object (52525–52531) never writes `baristaCraft`. | 52059–52073 | Work 12 barista shifts. The bar says "bar craft 0/12" (81553, 98030) forever, and the +0.02/craft bonus in `XK` never applies. Switch to Fire & Rescue: you already have rescue craft 12 and get elite calls on day 1. |
| B2 | **Owned-gym profit can't be withdrawn.** The daily net goes to `ownGym.balance` (52600). The only other code that touches `balance` is "Cover the shortfall" when it is negative (54350–54364). All upgrades are paid from personal cash (53561–53597, 53858–53886). | 52593–52606 | A fully built gym shows "BALANCE $24,000" after a month. The player can't spend a cent of it. |
| B3 | **Club stipend paid nightly, not weekly.** `gae()` returns 15 (Program Captain) or 12 (Collective Named) and is added on every sleep inside `if (g.club)`. Dues, by contrast, are gated to every 7 days. | 51617–51618 vs 24839, 24858 | Collective "Named" says "$12 a week" and pays $84 a week. |
| B4 | **The Collective's "loaner camera" perk gives Liquid Chalk.** `Lz.camera = "chalk_liquid"` is pushed into `gear` with no chalk stock, so it gives no odds bonus and no camera upgrade. | 24856, 24920, 37975–37988 | Join The Collective: "A loaner camera. It's better than yours." `camera` stays at 0 (phone). |
| B5 | **Work panel "PAY / SHIFT" leaves out the rank bonus.** It uses `work.pay × s3(rep)` (97884); the money summary wage does the same (31760). The building menu correctly uses `b8()` (54599). | 97884, 31760 | A Veteran warehouse worker sees "$73" in the Work panel; the real base is $148 (×1.7 overtime, ×1.2–1.7 minigame). |
| B6 | **Nightly cost breakdown always lists "Dream Rig owned ×18".** `Fu().dailyCost !== 1` is always true (the value is 18, 9 or 0). | 97724–97725 | A new player opens "What a night costs" and sees a green "Dream Rig owned ×18" row. |
| B7 | **The van's "-$18/night" hint is static.** The real nut is `18 × (1+0.08·grade) × modifiers`. | 10877, 11067, 54667 | At V5 the van says $18 but the morning report charges $25; at V11, $34. |
| B8 | **Sponsor card says "$X/CYCLE" and shows the brand-deal figure even on a "real" deal.** The stipend is paid daily at 65% on real deals. The offer screen correctly says "/day" (78420). | 99013 vs 51455 | Signed "Keep it real" with Vertex: the card says "$78/CYCLE"; you actually get $51 a day. |
| B9 | **Seasonal stints silently fire you and end your sponsorship.** `GG` advances the day 12–21 days without touching `lastShiftDay` or `lastClimbDay`. The confirm text mentions only skills, comps and "no coming back early". | 52838–52900, 98333–98336; effects at 51828–51837, 51851–51858, 51487–51493 | Sponsored warehouse Veteran ships out on the Alaska Boat. On the first sleep back: fired (−40 employer rep, black mark), Vertex drops you (−15 rep), and every brand deal lapses. |
| B10 | **Any dog makes you immune to parking tickets.** `rand<K && (g.dog \|\| (Z2(g.dog,"watch") && rand<$U))` short-circuits to "barked off" for every dog. The "watch" perk and its 50% roll are dead code. | 51145, 14551, 14605 | Adopt the dog (offered after 10 crag trips, `kU` 14538) at bond 0: no ticket at The Lot, ever again. |
| B11 | **The debt game-over ignores the dream fund.** `q2` checks `debt ≥ ceiling` only, even though the money panel's "net" includes the dream fund. | 33973, 51465–51470, 31766 | $2,000 saved in the dream fund, $0 cash; registration + van life + a $90 repair pushes debt past $100 and the run ends, with $2,000 untouched. |
| B12 | **The Camp Kitchen perk text is stale.** It promises "$5 a plate", but the van offers recipe cooking only. The $5/+25 van-meal branch is unreachable. | 33201, 54810, 52140–52151 | Buy the kitchen expecting cheap plates; you get "pick a recipe, cook with your groceries". |
| B13 | **"Salaried at {current job}"** reads e.g. "Salaried at Warehouse", because the salary is offered from office rep regardless of your current job. You can also keep working that job's overtime shifts while salaried. | 44498–44508, 92205–92214 | Do one office shift, go back to the warehouse, and accept the salary: $72/day plus $384 overtime shifts. |
| B14 | **Gear "house bonus" notes promise type-specific bonuses** ("+5% on power & steep"), but `epe` applies `houseBonus` to every route. | 32464–32498, 33160–33163 | A full Talon kit adds +5% on a slab. |

### Suspected / design-level [INFERRED; needs a playtest to confirm impact]

- **S1. The salary offer fires after a single office shift.** `GQ=8` is exactly one shift's +8 rep (19266). This is probably a tuning slip; 60 ("trusted regular") would be more sensible.
- **S2. Push-your-luck incentives are inverted.** In both the warehouse and courier games, a bust keeps everything already loaded or delivered. "Hustle and never stop" is therefore optimal (EV 1.50–1.73 against 0.99–1.30 for stopping early). The copy celebrates quitting early ("no shame in quitting ahead").
- **S3. The random shift event (30%) stacks on the minigame.** "Slow day ×0.6" can wipe out a perfect set or a full truck. It reads as arbitrary.
- **S4. Crunch "Put it on the tab"** can push a day-20 player with low rep straight past the $100–200 debt ceiling. The next sleep is game over, and the button doesn't warn (74100–74119).
- **S5. Arbitrage loop.** Trust-Fund origin (×0.7) + Shop Clerk (×0.8) + Talon kit (×0.5) buys Talon shoes at 28% of list. The swap meet buys back new-condition gear at 40%. That is **+12% of list per buy/sell loop, repeatable**; the Talon Apex yields about +$22 a loop.
- **S6. All-nighters.** The day rolls over at midnight without sleeping (`Ve` 44751). Registration and insurance bill only in the sleep handler on `day%7==0`, so staying up that night skips the bill. Unlimited coffee refills the energy.
- **S7. The owned gym only ticks when you sleep**, so there are no ticks during stints or expeditions. With "Premium" pricing the gym loses $30/day as bought, which is a trap option.

---

## 5. Balance and pacing

### 5.1 Daily costs (Lot vs Upper Trailhead, a work day plus 3 gym attempts) [INFERRED from ESTABLISHED constants; model.js]

| Grade | Lot total | Van life | Food | Bills | Repairs | Tickets | Gym fees | Gear wear | Trailhead total |
|---|---|---|---|---|---|---|---|---|---|
| V0 | $71 | 18.0 | 10.2 | 6.4 | 4.5 | 10 | 15 | 7.2 | $63 |
| V5 | $79 | 25.2 | 10.2 | 6.4 | 4.5 | 10 | 15 | 7.2 | $70 |
| V11 | $87 | 33.8 | 10.2 | 6.4 | 4.5 | 10 | 15 | 7.2 | $79 |

Crag days add about $33–124 per round trip in fuel and parts, plus $20–35 permits.

The **hidden gym fee ($5/attempt) is the second-largest daily cost.** Of all the jobs, only the V8-gated setter avoids it.

### 5.2 Pay per job at Veteran (12+ shifts, rep capped, craft 12, EV minigame) [INFERRED from ESTABLISHED formulas]

| Job | Regular shift | Overtime shift | $/energy (OT) | $/hour (OT) | Day-1 regular shift |
|---|---|---|---|---|---|
| Warehouse | $226 | **$384** | 6.7 | 48 | $68 |
| Courier | $205 | $349 | 6.8 | 50 | $62 |
| Coach (roster, +$25 fee; really ≈$40) | $207 | $335 | 12.4 | 56 | $66 |
| Rescue (V4+) | $195 | $332 | 6.5 | 41 | $59 |
| Setter (V8+) | $188 | $319 | 9.7 | 53 | $37 |
| Clerk, always upsell | $186 | $315 | **15.0** | 53 | $49 |
| Office | $166 | $283 | 10.5 | 47 | $48 |
| Barista | $160 | $272 | **15.1** | 54 | $41 |
| Clerk, honest | $142 | $241 | 11.5 | 40 | $34 |

- **Warehouse overtime** is the richest single action.
- **Barista overtime** (18 energy, 5 h) is the most climbing-friendly: $272 for 18% of your day's energy.

### 5.3 Strategy snapshots (net per day) [INFERRED model; grade, rep and follower trajectories are assumptions]

| Strategy / day | Income | Cost | Net | Income ÷ cost |
|---|---|---|---|---|
| **S1 work-heavy** (warehouse OT + gig + 2 gym attempts), day 1 | $142 | $68 | +$74 | 2.1× |
| S1, day 5 | $208 | $69 | +$139 | 3.0× |
| S1, day 30 (Veteran) | $429 | $73 | +$356 | 5.9× |
| S1, day 200 (+ guiding) | $549 | $80 | +$469 | 6.9× |
| **S1b barista OT + 5 gym attempts**, day 1 | $89 | $90 | −$1 | 1.0× |
| S1b, day 30 | $340 | $98 | +$242 | 3.5× |
| **S2 climb-heavy, no job** (gig or guiding, challenges, "real" sponsor), day 1 | $47 | $90 | **−$43** | 0.5× |
| S2, day 10 (V3) | $82 | $89 | −$7 | 0.9× |
| S2, day 30 (V6, guiding, Chalkbag) | $248 | $103 | +$144 | 2.4× |
| S2, day 200 (V11, Meridian real, 25k followers) | $850 | $120 | +$731 | 7.1× |
| **S3 media/sponsor**, day 1 (0 followers) | $27 | $81 | −$54 | 0.3× |
| S3, day 30 (5k followers, Chalkbag brand) | $217 | $103 | +$115 | 2.1× |
| S3, day 90 (25k, Apex, KINETIK) | $599 | $114 | +$485 | 5.3× |
| S3, day 200 (120k, Meridian, all deals ×2.2) | **$2,668** | $122 | **+$2,546** | 21.9× |

Days of net income needed per purchase:

| Purchase | Worker at day 30 | Climber at day 30 | Media at day 200 |
|---|---|---|---|
| Starter kit ($385) | 1.1 | 2.7 | 0.2 |
| Dream Rig ($2,800) | 7.9 | 19.4 | 1.1 |
| Home Base ($9,000) | 25 | 63 | 3.5 |
| Own gym ($25,000) | 70 | 174 | 9.8 |
| Gym fully built out ($59,600) | 167 | 414 | 23 |

### 5.4 Answers to the brief

**When does money stop mattering?** [INFERRED]
- **Worker:** after 3–5 shifts (days 3–5), when income is at least 3× costs; at Veteran (about day 12), 6×.
- **Non-worker climber:** days 1–10 run at a loss of about −$43/day against a $30–400 origin stake and a debt ceiling of about $100. They must take gigs daily or a job; otherwise the "broke" game over arrives around days 5–8.
  - From V5 and rep 20 (guiding, about days 15–25) they net about +$100–150/day.
- **Media player:** from about 5k followers (about day 30). By about 25k (day 90 or so), daily income beats every single sink.

After that, money only gates the dreams and the gym. None of those change the climbing loop, apart from Home Base removing costs that no longer matter.

**Is there Stick-RPG tension between earning and climbing?** [INFERRED] Only in week 1, and then only through energy and hours.
- A barista overtime shift costs 18 energy and pays more than a day's costs.
- Energy can be bought at $0.25 a point (coffee).
- One shift a day is a hard cap, but you never need more than one.
- The one genuine friction is being **fired after 6 days away**. It punishes road trips and stints rather than creating daily choices.
- There are no promotion requirements to chase: rank is attendance, and the rep bonus maxes out in 3 shifts.

**Is any strategy dominant?** [INFERRED]
1. **Early game:** warehouse overtime (money plus flat power and fingers), or barista overtime if you want to climb the same day.
2. **Mid and late game:** building followers. Content cash per first send includes gym problems that reset weekly, so income scales linearly with followers without a cap, and sponsor deliveries hand out 8–18k followers a cycle.
3. **Strength:** heavy jobs and recipes add skill that climbing's diminishing returns can't match past about V8 (see below). The optimum is to do everything at once: keep a heavy job, climb gym first sends for content cash, and guide.

**Skill points from one action, by grade** [ESTABLISHED formulas `ED` 28547, `hi` 28550, `Nd` 16194; INFERRED comparison]:

| Grade (avg skill) | One sent climb (primary / secondary) | Warehouse shift | Courier shift | Coach roster | Chicken & Greens ($16) |
|---|---|---|---|---|---|
| V2 (26) | +6.6 / +3.3 | +4.0 PWR +2.8 FIN | +4–5 END | +5 HEAD +2 TEC | +3–5 PWR |
| V8 (218) | +3.0 / +1.5 | same, flat | same | same | same |
| V12 (442) | +2.1 / +1.0 | same, flat | same | same | same |

**Consequence** [INFERRED]: a player who only works in the warehouse for 200 days would have power ≈ 1,000 and fingers ≈ 560. Power-route odds use `0.65·power + 0.35·fingers`, which gives `oc(846) ≈ V17`. That is, they would be good at hard power boulders without ever climbing much. The climbing auditor should confirm this with the full odds stack.

### 5.5 Early, mid and late pacing notes

- **Early (days 1–10).** Good pressure. The van-life bill, $45 registration on day 7, tickets from the third Lot night and $5 gym attempts force a job, which matches the onboarding ("Have $60 in hand"). But:
  - Overtime on day 1 removes the pressure almost at once.
  - Solar ($130, +$8/day) and the Power Station ($120, +$10/day) can erase the base nut entirely for a $250 origin stake.
- **Mid (days 10–60).** Money is abundant. Jobs keep running as a daily ritual with no new goals: Veteran is reached, craft is maxed, regulars have graduated. Sponsor obligations and the heat system are the most interesting money-adjacent decisions here.
- **Late (60+).** Money is a score. The gym is the only big sink, and it pays nothing back. The KINETIK "sell-out" deal ($38–84/day, trad −20) is the right kind of choice, but at that point money no longer tempts anyone.

---

## 6. UX and clarity from the player's seat

- **Hidden charges:** the $5 gym fee per attempt (never shown before it is charged) and the grade-scaled van life (the hint says $18). Parking tickets show up only as a ticket in the morning report. [ESTABLISHED]
- **Contradictory numbers:**
  - The Work panel's pay per shift excludes rank (B5).
  - The sponsor card says "/CYCLE" (B8).
  - The club perks say "a week" (B3).
  - The camera perk (B4) and the kitchen perk (B12) are wrong.
  - "Dream Rig owned ×18" (B6).
  - "Van registration & insurance $45" shows registration only (97762).
  [ESTABLISHED]
- **Unexplained payouts:**
  - The minigames show an outcome bucket and "Paycheck ×", but the random shift event then silently multiplies it again (S3).
  - Content cash from gym sends appears as "+$N" in the send toast with no explanation that it scales with followers.
  [ESTABLISHED/INFERRED]
- **Invisible consequences:**
  - Stints don't warn about firing or losing the sponsor (B9).
  - The squeeze doesn't show the debt ceiling (S4).
  - Salaried status doesn't say you can still work shifts.
  [ESTABLISHED]
- **Rank has no visible goal.** The Work panel shows "SHIFTS IN: n toward next", and it keeps counting at the top rank. There is no "what Lead unlocks" preview, because nothing is unlocked except $15. [ESTABLISHED 98008]
- **The quiz minigames repeat daily.** A regular player spends about 30–60 s a day on a solved barista or clerk quiz. There is no "clock in on autopilot" option. [INFERRED]
- **Good UX to keep:**
  - The setter's live grade estimate and ✓ style-fit markers.
  - The money panel's "What a night costs" and "Coming due" sections (after fixing B6).
  - Morning-report cash deltas.
  - The job hint line (`+$X · n/3 to promo · Energy −E · ends HH:MM`).
  [ESTABLISHED]

---

## 7. Overlaps, bloat, dead or vestigial systems

- **Dead code or data** [ESTABLISHED]:
  - The building `work.trains` values (warehouse, courier, rescue, gym, cave) are overridden by minigame skill outputs. The `else if (Ft.trains)` branch never runs, because every job has a minigame (52104–52110); they survive only as hint text.
  - The van `eat` $5 branch is unreachable (B12).
  - The dog "watch" perk is unreachable (B10).
  - Job titles (`gM`, 18267) are one toast with no stored or visible effect.
  - `jobShifts` keeps counting at Veteran.
- **Overlapping income channels:**
  - Four "one per day" work slots overlap: job, gig **or** guiding (shared `lastGigDay`), guest set/league night (these count as the job).
  - Beyond those, many small streams sit side by side: comp appearance fees, sponsor podium, kit podium, kit per-send bonus, brand deals, ads, stipends, club stipends, royalties, doc cheques, photo prints, commissions, busking, fishing, barn chores.
  - Most are under $20/day and invisible next to content cash. That is breadth without meaningful choice. [INFERRED]
- **Reskinned job arcs:** 7 near-identical "regular NPC → graduation bonus" arcs (setter regulars, shop regulars, courier accounts, warehouse crew, rescue partner, coach roster, guide regulars). Each is 2 NPCs with a trust number. [ESTABLISHED structure, INFERRED judgement]
- **Owned gym versus coaching:** the owned gym duplicates much of the coaching and setting career (setter staff, youth team, league) instead of extending it. The head-coach "stable" pays no money at all (53706–53850). [ESTABLISHED]
- **Salaried:** a whole state machine for "stop playing and gain $72/day". It fits the theme but is thin. [INFERRED]

---

## 8. Opportunities (prioritised)

### IMPROVE / fix (do first)

1. **Fix B1–B14 (S).**
   - Barista craft: add a `baristaCraft` branch and write it in the return object.
   - Club stipend: gate it with the dues interval.
   - Collective perk: grant `camera: max(camera,1)`.
   - Work-panel pay: use `b8()`.
   - Dream row: `dailyCost < 18`.
   - Stint warning, and keep your job with "unpaid leave" at Lead rank or above.
   - Dog: `g.dog && Z2(...)`.
   - Include the dream fund in the broke check, or auto-draw from it.
   - Sponsor card: "/day" at the real rate.
2. **Show the gym fee (S).** Put "Entry $5 per burn" in the gym menu. Better, **change it to a day pass** ($12/day, unlimited burns) plus a **monthly membership** ($120/28 days) sold at the desk. That is a Stick-RPG-style purchase decision, and it removes the hidden per-click tax.
3. **Make the owned-gym balance withdrawable (S/M)** with an owner's draw (e.g. up to 50% of positive balance per week). Show daily P&L in the morning report. Retune: Premium should not lose money as bought, and comp nights should break even at 20 members.
4. **Correct the push-your-luck incentives (S).**
   - Warehouse: a drop loses 50% of the load.
   - Courier: a crash loses the day's tips (keep base only).
   Stopping early then becomes the right call at high fatigue.
5. **Remove the random shift event from minigame shifts, or make it a pre-shift "the floor is slammed today" modifier you can see (S).**

### CHANGE (balance, M)

6. **Curve content cash.** For example `cash = 12 × sqrt(followers/1000) × (grade+2)`, crag first sends only (the gym gives followers, not cash). Add a weekly cap tied to sponsor tier. At 120k followers this cuts day-200 media income from about $2,300/day to about $150/day. Media stays the best late career without being 20× everything else.
7. **Diminishing returns on job and recipe skill.** Multiply job and recipe skill gains by the same `hi(skill)` used for climbing, or cap them at `Nd(grade)+X`. Keep jobs as an early boost ("the warehouse builds grip"), not a late-game substitute for climbing.
8. **Slow the job ladder and give it goals.** Replace "3 shifts per rank" with a stat, grade or reliability gate per rank, and give each rank a perk that matters to a climber. This is the Stick RPG hook. Examples:

   | Job | Rank gates | Top-rank perk |
   |---|---|---|
   | Warehouse Lead | Power 120, 20 shifts with no drops | – |
   | Rescue Lead | V6 + Head 150 | insurance subsidy and free physio |
   | Setter | V8 + setterRep 25 | free entry at every gym; set your own "project" on the wall |
   | Clerk Senior | 8 "right fit" sales | gear discount 20% → 35% |
   | Courier | – | fuel discount and van-part discount |
   | Office Lead | 5 missed-free weeks | the salaried option |
   | Coach | V7, graduate a client | youth team and stable |
   | Barista | – | café "regular's corner" beta tips (crag condition forecasts) |

9. **Scale costs with ambition, not grade.** Replace the hidden `o3` "living larger" multiplier with explicit choices (better food tiers with a small odds buff, gear upkeep at higher grades, travel). Add recurring costs to the late-game identity: sponsor content crew, comp travel (the WC airfare already exists), physio retainers, and a coach for your own training.
10. **Rank-based leave instead of firing.** From Senior up, "request 3–10 days off" from the job menu. Lead and above keep the job through stints and expeditions. This keeps the Stick-RPG "show up" pressure early without punishing late-game road trips.

### CUT or CONSOLIDATE (M)

11. **Merge the three quiz jobs** (barista, clerk, coach) into two with more varied content, or give each a real second layer:
    - Barista: a queue and timing game.
    - Clerk: a real fitting puzzle using the gear catalogue's lean and brand data.
    - Coach: keep the roster, but make focus choice interact with the client's current project.
12. **Collapse micro-income streams** under $10/day (club stipend, royalties, busking tips, fishing cash, barn cash) into flavour-first rewards, or roll them into weekly "odd money" so the morning report stays readable.
13. **Drop the per-job "regulars → graduate" template** from at least 4 jobs. Keep it where it is the job's heart: setter apprentice, coach roster, guide regulars.

### ADD (M/L)

14. **An autopilot shift option (S).** Pay ×1.0, no minigame, for players who want to climb. The minigame stays as optional upside, which turns daily tedium into a choice.
15. **Weekly shift schedule (M).** Each job posts 3–4 shifts a week (e.g. Warehouse Mon/Wed/Fri/Sat), and overtime is rare. The player plans the week like Stick RPG's hour budget: crag weather windows against shift days. This creates the missing earn-vs-climb tension without making money scarce.
16. **Late-game money goals that feed back into climbing (L).**
    - Fund a first-ascent expedition team.
    - Sponsor a youth athlete (links to the existing youth and stable systems).
    - Buy a crag and bolt it: an access and landowner arc linking to the Coalition.
    - Commission a film.
    Each should convert money into rep, legacy or climbing opportunities, not just status.
17. **Sponsor career depth (M).** Obligations that cost time (shoot days, trade shows) and conflict with climbing windows. Rival athletes compete for the same headline deal. "Brand safety" consequences tie into the heat system that already exists.

---

## 9. What's strong and must be preserved

- **The setter minigame.** It is a genuinely designed, legible composition puzzle: live grade, style ✓, "Shaping up: Quality". The persistent wall is climbed by the town, with setter regulars, an apprentice, head setter, guest sets and league nights. It is the template for what every job could be. [ESTABLISHED 18087–18225, 45388–45620, 81700–82010]
- **Real vs brand sponsorship** (65% pay and easier goals against full pay and harder goals, with purism and faction consequences). Also the **ad pitch** dilemma (straight, honest or kill) with the dry "take" lines, e.g. "It is a timer. Your phone already has a timer." It is the best writing and the best money decision in the game. [ESTABLISHED 29885–29960, 29986–30029]
- **The heat and discourse systems** as consequences of fame, especially "prove it": go back and redo the line on camera. [ESTABLISHED 44521–44639]
- **The squeeze (crunch)**: a dignified, flavourful money-crisis event with meaningful options (sell your best spare, graveyard shift, call in a favour, the tab). Keep it; add the debt-ceiling warning. [ESTABLISHED 52741–52820]
- **Seasonal stints** as an explicit trade of time for money and fitness ("Fitness base wrecked · 21 days gone") with season flavour. Keep them; fix the silent firing. [ESTABLISHED 16416–16489]
- **Salaried as "selling out"**, and the "Dirtbag Year" achievement for never taking it. It is thematic, even if thin mechanically.
- **Per-distance van wear and the parking-spot map** (Lot, Trailhead, Ridge, Truck Stop, Friend's driveway): Stick-RPG-style life texture with a real cost model. [ESTABLISHED 16701–16773, 27773–27875]
- **The money panel** ("What a night costs", "Coming due", runway) and the morning report's cash delta. Once the numbers are fixed, this is the right level of transparency for a life sim.
- **The tone**: job flavour lines, customer tells, rescue calls, office tasks, and the brand blurbs (KINETIK, Nomad & Co., Ferrata) all match the brief's "dry, wry, second-person, climber-authentic".
