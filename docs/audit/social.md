# Dirtbag audit — PEOPLE, EVENTS & WRITING

Auditor lane: partners/crew, romance, locals & regulars, youth/mentee/family, dog, hitchhikers, every event table, social minigames & hobbies, storytelling/epics, writing quality, consequence, missing content.
All line numbers refer to `$SRC/bundle.pretty.js`. **[ESTABLISHED]** = read in code/data. **[INFERRED]** = reasoning, estimate or simulation.
Throwaway extraction/simulation scripts: `$SP/work-social/` (`extract.js` evaluates any data table; `count.js`, `sim.js`, `trivia.txt`).

---

## 1. Summary

1. **The writing is the game's best asset — and its most under-served one.** About **30,000 words** of authored social/event text across ~65 tables (+2,200 words of quests), roughly **210 authored decision points with ~460 choices**, plus ~600 ambient lines. The later-written content (hitchhikers, night knocks, stances/echoes, cafe regulars, partner rifts, gym regulars, the dog's life and death) is consistently dry, wry, second-person and climber-true. **[ESTABLISHED]**
2. **The depth is front-loaded, and the random pool runs out.** The authored arcs (7 partner arcs × 4 beats, 3 romances × 4, Hazel ×5, 15 cafe beats, 8 chats per local) can all be finished in 2–6 weeks of game time. The town's random-encounter pool is **seen-once** (`seen_<id>` flags, 39379) and is empty by about **day 55–70**. After that the player lives in ambient pools of 2–3 lines that repeat every day. **[ESTABLISHED/INFERRED]**
3. **Relationship pacing is broken by bond inflation.** You get **+1 bond per climbing attempt** with a partner (48409–48410). On top of that, the six fire games cost **no time and have no daily cap** (46305–46454, 96665–96676). Each liar's-dice, trivia or horseshoes game gives +1 bond to Sage, Rico *and* Mara, even if you have never met them or they are in a rift. The result: Ride-or-Die (bond 7) in about 2 crag days, and romance from "spark" to **"DIRTBAGS FOR LIFE" in about 4 days**. **[ESTABLISHED mechanics; timeline INFERRED at ~4 attempts per crag day]**
4. **Many choices are cosmetic.** In romance, stages 2–4 play out the same whichever option you pick (41171–41220). Partner-arc forks reconverge: Sage leaves for 16 days either way (40749–40771), and Ollie's "take the team" changes nothing about his availability. Hitchhiker callbacks ignore what you chose last time: `hitchMet` stores only a count (44846). **[ESTABLISHED]**
5. **Where the game remembers, it is excellent.** Examples: stances that echo back ≥30 days later (24924–25128); the documentary cut driving 6 later callbacks (19799–19943); rifts from unpaid favours, neglect or repeated shilling, mended by belaying the person 3 times (21521–21587, 41779–41880); crew chemistry that matures (21099–21320); locals and the crowd quoting your latest send, ad, dog or injury (17719, 26780, 30142); diary entries told as campfire stories (27270–27323, 45103); past hitchhikers rescuing your broken-down van (17225, 39921); and a full dog life from adoption to farewell (14518–14706, 52219–52514, 62818). **[ESTABLISHED]**
6. **Confirmed bugs in this lane (details in §4):**
   - **Any dog gives 100% immunity to parking tickets** (51145, an operator-precedence bug).
   - A declined stray dog is **re-offered on every crag trip**, and a new stray appears on the drive after your dog dies.
   - The literal text `\u2019` shows up in Maureen's dialogue (17268, 17278), and a literal `*great*` in the documentary premiere text (43328).
   - The Homecoming says "You've shaped **N lives**" where N is the number of diary entries, so it unlocks after any 3 (85141).
   - Keepers say "out at **Gym**"; the crowd says "You're **the shoe you have never liked guy**" (30192).
   - Hazel is re-introduced as an unnamed stranger (33653).
   - Two events share the id `viral` and block each other.
   - Discourse topics repeat.
   - A caravan-friend's personal story can be skipped for good.
7. **The presentation throws the writing away.** The longest, best passages go into a toast that auto-hides after at most **5.2 s**: stance results up to 91 words, caravan and local "personal" stories of 40–62 words. Reading them in time needs 12–17 words/second. With more than 4 toasts queued, the oldest are dropped (38592). There is no message log. **[ESTABLISHED]**
8. **The voice is split two ways.**
   - *By era:* early content (WJ/HJ/QJ, holidays, festivals, the original four partners' reactions) is gamey stat-dump ("Free dinner. Dirtbag gold. +25 hunger.").
   - *By dialect:* later content is excellent but British-inflected (fortnight, car park, crisps, bin bag, torch, "a tip", metres, "Thirty-four degrees"). The setting itself is American: $, feet and miles, mom/dad, YDS/V-grades, Halloween, "Sendsgiving".
   - Straight and curly quotes are mixed within the same tables. **[ESTABLISHED]**
9. **The cast is big but blurry.**
   - ~100 distinct first names, with at least 13 collisions between *different* people: **three Priyas, three Theos**, two each of Kit, Junie, Sol (filmmaker vs mentee), Wren, Sunny, Cormac, Esme, Marisol, Wes, Kai and Remy. Marge (diner keeper) and Margie (diner regular) both work the same diner.
   - 11 named NPCs share **6 generic sprites**.
   - Tam, Ollie and Dell have no rifts, no romance, no fire commentary, no party-game seat and no poker table-talk. **[ESTABLISHED]**
10. **A sellable life-sim still needs:**
   - a story spine beyond the 5-stage "Your First Season" tutorial;
   - relationship milestones and conflict beyond 4 beats;
   - NPCs whose lives actually change (Ray's "last season" and Tam's "five good seasons" never happen);
   - holidays that are events rather than a stat toast;
   - gifts and invitations *to* NPCs;
   - a family arc;
   - a coherent clock — an age "year" is **18 days** while the calendar year is **56 days**, so dog ages, story ages and dialogue about years and seasons drift apart. **[ESTABLISHED/INFERRED]**

---

## 2. How it works (mechanics, numbers, formulas)

### 2.1 Encounter arbitration (the "one thing per day" rule)
- Every zone change runs a priority chain and stops at the first hit (41300–41313):
  1. van breakdown `Xc`
  2. hitchhiker `zp`
  3. Hazel tip `n5` (Lot only)
  4. Hazel mentor `hg`
  5. rival `s`
  6. partner arc `f`
  7. romance `D`
  8. partner spot-request `x`
  9. random encounter `sk`
  
  Every one of these sets `lastEncounterDay`, so **at most one encounter per game day**. **[ESTABLISHED]**
- The random encounter `sk` (39360) fires at **15%** per zone change (`YJ`, 19944).
  - At the crag with a partner and not on a rest day: 45% (`kZ`) of hits draw a **UJ** partner moment. UJ can repeat.
  - Otherwise, in town: 35% (`GJ`) draw **qJ** "on the road" events; the rest draw **HJ + PJ**, filtered by `where`.
  - HJ/PJ/qJ are **seen-once** (`seen_<id>` pushed to `encFlags`, 39414) and gated by `min` (skill-derived grade), `cragOnly`, `needs`/`blocks` flags and `when()` (z9, 19946).
  - When the pool is empty the function returns and nothing happens. **[ESTABLISHED]**
- Rest days strip `noRest` options and append "You told yourself today was a rest day." (39389–39396). **[ESTABLISHED]**

### 2.2 Partners (`ts`, 20743) and crew
| id | name | bonus | fav style | perk | base availability `LZ` (21022) | grade track `jx` (21348): rel/days-per-grade/cap |
|---|---|---|---|---|---|---|
| sage | Sage | .06 | technical | beta | .42 | 0 / 20d / 13 |
| rico | Rico | .05 | power | psych | .55 | −3 / 14d / 14 (closes gap) |
| mara | Mara | .07 | crimp | crusher | .34 | +2 / 12d / 16 |
| dex | Dex Calloway (the rival slot) | .08 | power | edge | .28 | uses `rivalGrade` |
| tam | Tam Okonkwo | .06 | endurance | psych | .30 | −1 / 26d / 11 |
| ollie | Ollie Reyes | .05 | dyno | crusher | .62 | −2 / 8d / 17 (closes gap) |
| dell | Wendell Pike | .07 | crack | beta | .38 | −3 / 34d / 9 |

- **Bond tiers** `hm` (21004): Stranger 0 · Acquaintance 1 · Regular 3 · Partner 5 · Ride-or-Die 7. Bond is **uncapped**; tiers stop at 7. **[ESTABLISHED]**
- **Bond sources** **[ESTABLISHED]**:

  | Source | Bond gained | Line |
  |---|---|---|
  | Each crag attempt with that partner | +1 | 48409 |
  | Spotting catch | +1 (+1 more if they send) | 41281 |
  | Belaying their project | +2 (`X8`) | 41816 |
  | Fire hang | +1 to each crew member present | 49890 |
  | Pot for everybody | +1 to each | 45210 |
  | Liar's dice / trivia / horseshoes | +1 each to Sage, Rico and Mara | 46363, 46413, 46451 |
  | Blackjack / poker / cribbage | +1 to the partner at the table | 46728, 47067, 47213 |
  | UJ moments | −2 to +4 | 19957 |
  | Fire "takes" (`rH`) | −2 to +2 | 21589 |
  | Arc beats | +1 at some beats, then set to ≥7 at the finale | 40696–41099 |
- **Availability** `FZ` (21063; reasons in `a2`, 21071):
  - `odds = clamp(LZ + tierIndex×0.11 + crewTier×0.03 − owed×0.30, 0.02, 0.97)`. On "THE DAY" everyone's odds are ≥ 0.86 − owed×0.06.
  - The daily roll is hash-seeded (`$t(id-crew-day)`).
  - Refusals quote `K9` busy-texts, which rotate by `day % length`, 2–3 per partner (21030–21066). **[ESTABLISHED]**
- **Favours and rifts** (21521–21587, 51750–51764):
  - A crag outing adds 1 to `partnerOwed` **only while that partner is below Partner tier (bond <5)** (`Y5`, 21097; 51037–51040; capped at 2, 51793). A cash-crunch loan from a partner also adds 1 (52803).
  - Because bond rises +1 per attempt, most partners pass bond 5 during the second outing. But any owed count already banked **does not clear** on reaching Partner, so the 21-day debt rift can still fire on a Ride-or-Die partner unless you "square up" by belaying them.
  - A rift opens overnight when any of these holds:
    - **debt**: owed ≥2 for ≥21 days;
    - **neglect**: bond ≥5 and no outing for ≥50 days;
    - **repeat**: a second "straight" ad after that partner already took offence at the first.
  - A rift costs **−3 bond** (`Ree`) and the partner is unavailable.
  - Mending takes 3 "belay their project" days (3 h, −18 energy each) with 3 escalating reconciliation lines (`$ee`).
  - Rifts exist **only for Sage, Mara, Rico and Dex** (`Object.keys(pC)`, 51751). Tam, Ollie and Dell can be used for free. **[ESTABLISHED]**
- **Crew chemistry** (`UZ`, 21099):
  - 15 authored pairings, each with odds/psyche/skill/burnout/energy modifiers and a note.
  - `crewRapport` +1 per 2-partner outing, per fire pair and per pot.
  - As rapport rises to 12 (`Sv`), bad pairs (dex+mara −5%, dex+rico, mara+rico) improve, and at full rapport their note switches to a "figured each other out" line (`JZ`).
  - Fire lines (`Q9`/`J9`) exist only for pairs among Sage/Rico/Mara/Dex. **[ESTABLISHED]**
- **Crew name** (`bee`/`xee`, 21400–21458): offered once you have ≥2 non-rival partners at Regular (≥3 bond) with total bond ≥12. You get up to 4 names built from your record (crag, van, hardest tick, dog, factions, sponsor, standing). +10 standing, +10 psyche. **[ESTABLISHED]**
- **Crew renown** `v$` = Σbond×1.5 + Σrapport×1.2 + project (40/20/work×12) + standing×0.4. Tiers at 45 / 95 / 170. It feeds availability (+3% per tier) and crowd lines. **[ESTABLISHED]**
- **Crew project** (41684–41777, 49018): pick a hard line and work it together; the beta fills in over 24 work units (`P3`). A partner can send it before you ("THEY GOT IT"). **[ESTABLISHED]**
- **Partner grades, projects and ticks** (51716–51749):
  - Each partner's grade tracks yours: target = your grade + `rel` + min(3, close×bond), capped. They move one grade every `rate` days (×2.2 when dropping).
  - Each partner picks a project at their grade +1; after ≥6 goes with you belaying, they send it 45% of the time.
  - You can be *passed*: "You climb harder than Sage now…" (51772). A lovely living-world touch. **[ESTABLISHED]**
- **Partner arcs** `Kee` (21904–22060):
  - 4 beats per partner, 28 in all.
  - Trigger: at the crag with that partner, bond ≥ [1,3,5,7] (`Iee`), 60% chance (`Dee`), no minimum spacing between beats.
  - Stage-2/3 forks give different stats (40674–41100); every arc ends in the same finale. **[ESTABLISHED]**
- **Fire commentary** `rH` (21589–21733): 8 topics each for Sage/Mara/Rico/Dex (shill, honest ad, sponsor, heat, viral, pro, injury, mentee, dog, hard send). Each fires once, 55% when available at a fire (49820). **[ESTABLISHED]**
- **Other rosters (jobs lane):** `oX` = 6 pro athletes who "walk in" to a coach's stable at 6%/day (18433). `dC` = 8 coaching-client archetypes (18612). **[ESTABLISHED]**

### 2.3 Romance (`Vee` 21848; logic 41122–41220, 44707–44735; UI 95361)
- **Candidates:** Sage, Rico and Mara only (`dO`, 21799).
- **Trigger:** at the crag with that partner as crag partner; bond ≥ `Bee` [5,6,8,10] for stages 1–4; 60% chance (`Hee`); the daily encounter slot must be free. **[ESTABLISHED]**
- **Choices:** only option index 1 at stage 1 declines ("Keep it about the climbing" / "Laugh it off" / "Respect the wall"), and that decline is **permanent** (`romanceDeclined` is never cleared). At stages 2–4 **both options advance identically**. **[ESTABLISHED]**
- **Stage rewards** `qee` (21841):
  - stage 1: +2 head, +4 rep
  - stage 2: +2 head, +6 rep, +200 followers
  - stage 3: +3 head, +8 rep, +500 followers
  - stage 4: **+5 head, +15 rep, +1,400 followers**, bond set ≥8
  - While together: +3% send odds when climbing with them (`Lee`). **[ESTABLISHED]**
- **Upkeep:**
  - Climbing together or a date refreshes `romanceLastDay`.
  - After 14 days (`Pee`) without contact: "rough patch". At 26 days: breakup, −4 head, 20-day cooldown.
  - Time spent `partnerAway` doesn't count against you.
  - After the cooldown the same 4 beats replay from stage 1 as if first time.
- **Dates** `t_` (21812):
  - Diner $18/2 h, cafe $8/1 h, lake free/3 h.
  - +8 psyche, or +12 when strained, scaled by grime; one date per day.
  - 2 lines per venue, **6 lines total**. **[ESTABLISHED]**

### 2.4 Locals, regulars, keepers, caravan
- **Shop keepers** `cK` (17646), logic `hK` (17719):
  - Marge (diner), Deke (gear shop), Wanda (swap meet), Hank (grocery).
  - The line shown on entering, in priority order:
    1. intro — first visit, only if day ≤5;
    2. absence — ≥10 days since your last visit;
    3. notice — your best new tick since last visit, preferring outdoor ones;
    4. dog line — 30% if you have a dog;
    5. filler + rep lines.
  - 39 lines in total. **[ESTABLISHED]**
- **Town locals** `ZF` (11757) + `Oie` (26567):
  - Margie (diner, weekday 6–11), Deshawn (trailhead, daily 7–17), Junie (downtown, 15–21), Ray (Roadside crag, weekends), Priya (midtown, weekdays 9–5).
  - One chat per day each. Tiers at 3 chats (regular) and 8 (friend).
  - **The 8th chat delivers a "personal" monologue plus a one-time gift**: rep 4–16, standing 6–14, psyche 8–16, faction shifts, and Deshawn's $40 (41882–41922).
  - Trad-faction reputation adds a cold or warm follow-up line.
  - Once a crew name exists, each local has a crew line (`BI`). **[ESTABLISHED]**
- **Caravan** `Qo` (26433):
  - Frank, Rosa (+ Milo, 4) and Kit (they).
  - Parked in the Lot on 40% of nights (20% in winter) (`vie`, 26432; 51127).
  - Tiers at 3 and 8 hangs; the "personal" story plays on exactly the 8th hang (`sT`, 26798).
  - They drop in at your pot or fire and sit at your poker/blackjack table. **[ESTABLISHED]**
- **Cafe regulars** `b$` (17231):
  - Maureen, Priya, Theo, Dee, Cal — each with hours and 72% presence (`BB`, 17609).
  - 3 authored beats, then a repeating "loop" beat; one sit per day, 1 h.
  - A "perk" string at 4 sits is **text only** (44886, 55120).
  - At 10 total sits: "You are one of the ones who is in here now" (+6 psyche). **[ESTABLISHED]**
- **Gym regulars** (own-gym only): `F3` (4) + `jC` (9, three "mix" flavours of 3). Each is a 3-stage vignette advanced by "walk the floor" (54266). Piper's 3rd stage unlocks the youth team. **[ESTABLISHED]**
- **Youth team** (54062–54190):
  - 14 kids (`zH`), sessions every few days; you coach or hire a coach from 4 names (`x_`).
  - Session lines `w_` (5); comp lines `k_` (3).
  - **Graduates enter the national comp field** (54156–54164) — a strong cross-system callback. **[ESTABLISHED]**
- **Mentee** (52962–53046):
  - Offered at grade ≥5 and rep ≥25; name drawn from `TI` (12 names).
  - Daily 2 h sessions; mentee grade = min(5, floor(sessions/3)+1).
  - Milestones `Sse`: outdoor at session 6, first proud send at 12, local comp at 18, injury comeback at 22.
  - "Raised" at 20 sessions (`Gg`); feeds the legacy restart.
  - Choices are small stat trades (rep vs psyche). **[ESTABLISHED]**
- **Hazel** (mentor):
  - 9 contextual tips `mpe` (33601), one per Lot visit, until the mentorship starts.
  - 5 mentor stages `G2` (33648): trigger at the crag at grade ≥3, 72% chance (`ype`), no spacing — so **the whole mentorship can finish in 5 consecutive crag days**. **[ESTABLISHED]**

### 2.5 Family and farm
- `family` starts at 55 and decays 0.4 per night (`Ese`). Above 65: +2 psyche/night; below 25: −2 psyche/night (52291–52296). Birthday: +6. **[ESTABLISHED]**
- **Call home** (49361): 1 h, +8–12 family; 4 random lines, or an 18% chance to recall a diary entry.
- **Farm visit** (37332): costs fuel; one line from `gle`, with conditional variants for injury, low family, FA, hard send, pro, 5k followers, age ≥38. 40% chance of produce or gas money.
- **Barn chore:** +5 family; 6 lines (`ble`).
- **Cook with the folks:** uses garden produce.
- There are **no family events or arc**. **[ESTABLISHED]**

### 2.6 The dog (14518–14706; 38020; 44938; 51145–51180; 52219–52514; 62818)
- **Offer:** on the 10th cumulative crag trip (`kU`, 52192). The player names the dog ("Scout" by default).
- **Upkeep and bond:**
  - `fed` drops 22 per night; kibble costs $6 and gives +3 bond.
  - Play: +10 bond, +5 psyche, once a day, 1 h.
  - Every drive: +2 bond.
  - **Bond never decays.** Hunger only swaps in hungry flavour lines and disables the perks.
- **Abilities:** Settle at bond 20 (+2 psyche on a lit fire), Find It at 45 (overnight scavenge chance 0.45→0.62), Watch at 75 (meant as 50% ticket protection — see bug B1).
- **Life stages** (one dog-year = `Tr` = 18 days):

  | Stage | Dog years | Days after adoption |
  |---|---|---|
  | gray | 8 | 144 |
  | senior | 12 | 216 |
  | vet scare 1 ($70) | 10 | 180 |
  | vet scare 2 ($130) | 13 | 234 |
  | **death** (on sleep) | **16** | **288** |

  Death opens a full-screen farewell with 3 choices (`Ij`) and writes a diary entry. `dogsGone` is shown in Stats. **[ESTABLISHED]**
- **Ambient lines:** ~28 context lines (crag, fire, drive × hungry, old, bond tier), 5 play lines, 2 vet scares, 3 farewells, keeper dog lines. **[ESTABLISHED]**

### 2.7 Hitchhikers (`aC` 16887, callbacks `ox` 17094)
- **Trigger:** entering or leaving the crag, ≥5 days since the last one, 14% chance (`FV`/`UV`, 39899–39911).
- Pick weighting: hitchers you've already met get **2.6× weight** (`qV`, `QV`, 17216).
- A met hitcher always plays the `ox` callback, which **ignores your earlier choice**; `hitchMet` stores only a count (44846).
- If ≥2 friendly hitchers have been met, a van breakdown has a 34% chance of one of them pulling in to fix it for free (39921, 39955). **[ESTABLISHED]**

### 2.8 Event catalogue
| Table | Content | Trigger / rate | Items | Choices | Repeat rule | Line |
|---|---|---|---|---|---|---|
| `WJ` | overnight one-liners | 35%/night (`NJ`) | 16 | 0 | random with replacement | 19461 |
| `HJ` | early random encounters (10 town, 10 crag; 5 crag-only) | 15%/zone change, town share 65% | 20 | 40 | seen once | 19520 |
| `PJ` | documentary aftermath | same pool; only after honest/hero cut premieres | 6 | 12 | once (`blocks`) | 19799 |
| `UJ` | partner moments at crag | 45% of crag rolls with a partner | 4 | 8 | **repeatable** | 19957 |
| `qJ` | "on the road" life events | 35% of town rolls | 13 | 26 | seen once; 2 callback chains | 20034 |
| `QJ` | tap-a-stranger chats (+4 fan tiers, gearhead) | tap walkers; 3 rewarded/day (`L8`) | 8 (+5 dynamic) | 15 | **infinite** | 20307, 39689–39900 |
| `ZB` | seasonal festivals | day 7 of each 14-day season | 4 | 18 acts | every 56 days | 20405 |
| `rZ` | holidays | fixed day-of-year (56-day year) | 7 | 0 (auto gift) | every 56 days | 20631 |
| `ade` | night knocks by sleeping spot | ≥4 nights apart; 11% × spot (Lot 1.4, truck stop 1.2, trailhead 0.9, ridge 0.6, driveway 0.5) | 10 | 30 | random with replacement | 27878 |
| `yD` | walk-out epics (dark/storm/lost/cold/stuck) | drive back from crag, ≥10 days apart, not injured; P = clamp((risk−4)×0.055, 0, 0.45) | 5 kinds × 3 stages | 45 | kind picked by conditions | 27372, 47609 |
| `x4` | hike minigame stages | on a hike | 5 | 10 | per hike | 28428 |
| `EO` | approach decisions by terrain | every crag approach | 14 | 28 | every approach | 23110 |
| `AH` | own-gym crises | after 14 days of ownership, 3.5%/day; if ignored for 4 days, auto-resolves to the second (usually cheap/bad) option (47940–47942) | 6 | 12 | random with replacement | 23655, 23973 |
| `WH` | stances (chip, closure, retrobolt, FA theft, trashed crag) | crag action, ≥14 days apart, 22%, local tier ≥1–2 | 5 | 15 + 5 "elder" | once each | 25131, 42791 |
| `wae` | stance echoes | ≥30 days after the stance, ≥25 between echoes, 40%/night | 7 | 14 | once each | 24924 |
| `b$` | cafe regulars | sit at the cafe, 1/day | 5 people × (3 beats + loop) | 40 | beats once, loop forever | 17231 |
| `aC`/`ox` | hitchhikers and callbacks | see 2.7 | 8 + 8 | 24 + 16 | callback repeats verbatim | 16887 |
| `WB` | documentary sit-down questions | during Sol's season | 5 | 15 | once each | 16507 |
| `o6` | feed "discourse" (grade war, parking row, sponsor sniping) | from day 25, ≥20 days apart, 30%/night | 3 | 6 | **random with replacement** | 31082, 47843 |
| `Sse` | mentee milestones | mentee sessions 6/12/18/22 | 4 | 8 | once | 26198 |
| `mpe` | Hazel tips | Lot visit before mentorship | 9 | 0 | once | 33601 |
| `G2` | Hazel mentorship | crag, grade ≥3, 72% | 5 | accept/decline | once | 33648 |
| `Vee` | romance beats | see 2.3 | 12 | 24 | once (replays after breakup) | 21848 |
| `Kee` | partner arcs | see 2.2 | 28 | 39 | once | 21904 |
| `ur` | quests (1 main "Your First Season", 15 side) | conditions | 16 (41 stages) | — | once | 34980 |

### 2.9 Minigames and hobbies (the fire and the town)
- **Firepit menu** (56312–56444):
  - dog play, **Cribbage, Liar's Dice, Trivia, Horseshoes, Texas Hold'em, Blackjack**, scavenge, field repair, feed/build fire, pot for everybody, storytelling, tarp;
  - up to 13 entries.
  - **None of the six games advances the clock or has a daily cap** (46305–46454, 46647–47121, 96665–96676). **[ESTABLISHED]**
- **Liar's dice / trivia / horseshoes:**
  - Always seat Sage, Rico and Mara (`Ko`, 15632) unless one is `partnerAway`, which only Sage's arc ever sets.
  - Liar's dice and trivia: +14 psyche, +8 psyche and +3 rep on a win (15606, 15634).
  - Horseshoes: +12 psyche, then +3 psyche and +2 rep per match won.
  - +1 bond each to all three.
  - Trivia draws on **64 questions** (16 each: history, technique, gear, culture), and only avoids repeats within a single game. **[ESTABLISHED]**
- **Blackjack** (15391–15589):
  - Single deck, freshly shuffled every hand; dealer stands on all 17s; 3:2 blackjack; double on any two; one split; split aces get one card; dealer peeks.
  - Bets $1/$2/$5 on $20/$50/$100 buy-ins.
  - Psyche on leaving = clamp(3 + net/10, −8, 10); +1 bond with your crag partner.
  - These rules are roughly break-even for a basic-strategy player. **[ESTABLISHED rules / INFERRED EV]**
- **Hold'em** (14978):
  - Four seats: your partner or a caravan neighbour, 1–2 others, plus fillers from the trail-name pool `oa`.
  - All three buy-ins ($20/$50/$100) use **the same 1/2 blinds**, so "High" only means a deeper stack.
  - After 5 and 12 hands against a named opponent, `pokerHands` unlocks reads on their play (14995). A nice memory hook.
  - 21 table-talk lines (`oq`), none for Tam, Ollie or Dell. **[ESTABLISHED]**
- **Cribbage:** to 61 against your crag partner; +8 psyche for a win, +3 for a loss; +1 bond (47187). **[ESTABLISHED]**
- **Music** (42443–43216):
  - Tap-rhythm minigame on guitar ($60), harmonica ($14) or ukulele ($32).
  - Practice gives skills (effect × accuracy mult × diminishing `hi`) with no daily cap.
  - Busking: 1 h; tips = 16 × accuracy × zone (1 / 0.7 / 0.45) × mastery.
  - Cafe gigs every 3 days once you have 24 sessions and 40 "cred": 2 h, $32–$78.
  - **No narrative content:** result lines are "Nailed the riff! / Solid set. / Rough strums." **[ESTABLISHED]**
- **Reading** (45319–45357):
  - 4 books at $15–22; each read is 2 h and grants the book's full skill effect × `hi(skill)` plus +14 psyche.
  - **Re-reading the same book is unlimited.** 15 reading sessions earns the Well-Read trait.
  - From 5 sessions, reading adds campfire story variants (`wde`, 8 lines). **[ESTABLISHED]**
- **Spotting** (41263–41298): a timing bar when a partner asks for a spot (40% chance at crag arrival with a partner); +1 or +2 bond, +1 rep. **[ESTABLISHED]**
- **Fishing:** 13 species (`X3`, 25514); a quest hook ("The Lake Record"). Mechanics belong to another lane. **[ESTABLISHED]**
- **Storytelling** (45103–45162):
  - Each diary entry (`legacy`) can be told once at a lit fire with ≥1 listener, one story per night.
  - Reward: rep 2 + story age in 18-day "years" (max +4) + 3 if it's an epic (+2 more if a bad one); psyche 4 + listeners; −4 psyche and +3 rattle for a bad epic.
  - After 12 stories (`Ole`) you become "the one they ask" (+5 standing).
  - Reaction pools: 3–4 lines each for fresh / old / epic / bad-epic / plain stories. **[ESTABLISHED]**
- **Epics:** worse outcomes pay **more** rep (clean 2 / rough 5 / bad 9, `bD` 27767). A bad outcome also applies an injury. The story line depends on the outcome tier, not the path you took (45084). **[ESTABLISHED]**

---

## 3. Content inventory

### 3.1 Counts (extracted by evaluating each table; `work-social/count.js`) **[ESTABLISHED]**
| Layer | Tables | Units | Choices | Words |
|---|---|---|---|---|
| Random encounters | WJ, HJ, PJ, UJ, qJ, QJ | 16 + 20 + 6 + 4 + 13 + 8 = 67 | 101 | 2,789 |
| Calendar | ZB, rZ | 4 festivals (18 acts), 7 holidays | 18 | 724 |
| Night and road | ade, yD, x4, EO, Mv lines | 10 knocks, 5 epics (15 stages), 5 + 14 decisions, 15 bivy lines | 113 | 3,381 |
| Scene politics | WH, wae, o6, AH, WB | 5 stances, 7 echoes, 3 feed debates, 6 gym crises, 5 interview questions | 67 | 4,151 |
| Strangers | aC, ox | 8 hitchers + 8 callbacks | 40 | 2,227 |
| Regulars | b$, cK, Qo, Oie+zie+BI, F3, jC | 5 cafe (20 beats), 4 keepers, 3 caravan, 5 locals, 13 gym regulars (39 stages) | 40 | 6,359 |
| Partners | BZ, K9, UZ, Q9, J9, pC, $ee, rH, rO, Kee, oq | 7 partners: 94 reactions, 17 busy texts, 15 pair notes, 11 fire lines, 12 rift + 12 mend, 32 takes, 10 belay sends, 28 arc beats, 21 poker lines | 39 | ~5,100 |
| Romance | Vee, t_ | 12 beats, 6 date lines | 24 | 646 |
| Mentor, mentee, family, dog | mpe, G2, Sse, fle, ble, WE, Dj, Ij, dog lines | 9 + 5 + 4 + 4 + 6 + 5 + 2 + 3 + ~28 | 16 | ~2,000 |
| Quests | ur | 16 quests / 41 stages | — | 2,182 |
| Trivia | Kj | 64 questions | 256 | — |
| **Total** | ~65 tables | **~211 authored decision points, ~460 choices (plus 64 trivia questions), ~600 ambient lines** | | **~30,000** |

### 3.2 Cast
- **~100 distinct first names** (93 in the rosters I scripted, plus physios and comp fields).
  - 7 partners; Hazel; Sol (filmmaker).
  - 5 locals, 4 keepers, 5 cafe regulars, 3 caravan (+ Milo).
  - 13 gym regulars, 14 youth kids, 4 youth coaches.
  - 12 mentee names, 8 trail names, 12 rival names, 6 national-field names, 2 warehouse crew, quest givers.
- **Name collisions** **[ESTABLISHED]**:

  | Name | People who share it |
  |---|---|
  | **Priya** ×3 | laptop cafe regular (17309), physio local Priya Raghavan (11805), coaching client (18615) |
  | **Theo** ×3 | barista (17384), coaching client (18622), mentee pool (26144) |
  | Kit | caravan (26508) and youth kid, 14 (23931) |
  | Junie | 16-year-old V9 local and 13-year-old youth kid |
  | Sol | filmmaker and mentee pool |
  | Wren | youth kid and mentee pool |
  | Sunny | youth coach and trail name |
  | Cormac | youth coach and Lost Crag quest-giver |
  | Esme | coaching client and national-field name |
  | Marisol | physio on the `i9` roster (19002) and gym regular (24029) |
  | Wes | physio on the `i9` roster (19004) and coaching client (18643) |
  | Kai, Remy | mentee pool (26144) and circuit field (`Ll`) |

  The `i9` physio Priya (19007) is plausibly the same person as the local Priya Raghavan.

  Near-collision: **Marge** (diner keeper, 17648) and **Margie** (diner regular, 11759) work the same building, and both tell you to eat the eggs.
- **Sprites:** 5 bespoke (sage, rico, mara, dex, hazel). The other 11 named NPCs share `npc_1`–`npc_6`: Tam/Margie use npc_5; Ollie/Priya npc_4; Dell/Junie/Kit npc_6; Ray/Rosa npc_3 (`SZ` 20816, `ZF` 11757, `Qo` 26433). A layered, name-hashed look generator already exists (`Hj`, 14797) but isn't used for them. **[ESTABLISHED]**

### 3.3 Writing quality — voice audit
- **Register.** Three generations of writing are visible:
  - **Gen 1 (early):** WJ, HJ, QJ, rZ, ZB, the original BZ lines for Sage/Rico/Mara/Dex, and the original 4 partner arcs. Stat-dump endings ("+2 technique."), clichés ("Dirtbag gold", "Good for the soul", "Dirtbag economics", each ×2), exclamation-heavy. Sage's reactions are generic coaching ("Clean. That beta paid off.", 20947).
  - **Gen 2 (middle):** romance, dates, caravan, keepers. Warmer, sometimes rom-com ("Is it weird I kinda live here now?", 21877) or saccharine ("That's not nothing — that's everything.", 26496).
  - **Gen 3 (late, the target register):** ade, aC/ox, b$, WH/wae, pC/$ee/rH, the Tam/Ollie/Dell material, F3/jC, dog lifecycle, WB, PJ. Consistently dry, second-person, specific, funny without jokes. **[ESTABLISHED by reading; generation attribution INFERRED]**
- **Dialect split.** British markers appear in 23 of the tables in this lane:
  - fortnight ×5, car park ×4, rubbish ×4, skip ×4, torch ×2, crisps, petrol, bin bag/liner ×4, laundrette, headtorch, dressing gown, hi-vis, rota, village hall, verge, junction, fella, "cup of tea", "Aye" (about 60 clear markers, plus a soft preference for "properly" ×20);
  - spellings apologise/realise/recognise/colour/favour;
  - metric units ("two hundred metres", "forty metres", "Forty kilometres") next to feet and miles elsewhere;
  - "Thirty-four degrees" in Celsius (23701);
  - "The base of the crag is a **tip**" (25315), which US players won't parse.

  The world itself is American: $, gas station, mom/dad, V/YDS grades, Halloween, "Sendsgiving", diner, Tuesday crowd. **[ESTABLISHED]**
- **Typography.** Straight and curly quotes are mixed *within* tables (Kee 100 straight vs BZ 114 curly; pC curly quotes with straight apostrophes). Hyphens stand in for dashes in 2 family lines (27145, 27169). **[ESTABLISHED]**
- **Verbal tics that surface over long play:** "genuinely" ×28, "the whole thing" ×26, "somehow worse" / "which is worse" ×9, "not nothing" ×5, the "which from X is a standing ovation / hug / parade / whole speech" formula ×8+, "like it owes (her/you/them) money" ×3, "Ride or die" ×16 (five of seven arc finales end on it). **[ESTABLISHED counts]**
- **Tone breaks:**
  - The ghost quest "The Tower's Due": "on the night the veil thins… The spirit won't send a gym rat to the same death" (35234, 35248).
  - Ray's pronoun hack: "There he is. Or she. Or whatever…" (26693).
  - The crowd calls the player "guy" (30192).
  - Mara's finale: "You're a crusher now." Forged." (22009) contradicts her established "Good. Don't celebrate." **[ESTABLISHED]**

**Best 10 lines (preserve this register)** **[ESTABLISHED]**
1. "It is the thing you have done together ten thousand times and it is the last one." (dog farewell, 14577)
2. "They found you at a crag and stayed, which was the whole of their opinion on the matter." (62868)
3. "He does not recognise you. That is somehow the worst part of it: you were not memorable, you were just the one that worked." (grifter callback, 17190)
4. "Rico stopped texting about three weeks ago and you did not notice, which is somehow the entire problem in one sentence." (rift, 21539)
5. "“How much?” You tell her. Mara nods slowly. “That's less than I thought. That's the part that annoys me.”" (21626)
6. "“So it is the same. It is exactly the same and nobody told me.”" (Cal the writer, on projecting, 17563)
7. "You do have cables. You listen to them try three more vans and lie there feeling exactly as good about it as you would expect." (night knock, 27943)
8. "It tastes like a candle and you have never bought one." (sponsored protein bar, 30027)
9. "You turn somebody's worry into a story about believing in yourself. Somewhere, that somebody deserves better." (doc interview, 16589)
10. "“I'm going out with people who'll actually push me today. No offense.” None taken. Some taken." (Mara busy-text, 21056)

Runners-up: "Pain is information. It is not a personality." (26724); "“Hard for me.” He says it without a shred of apology" (16933); "…you have become the person who decides, and that the person who decides is never the person on the sharp end." (25259); "He calls it his shed. It is his shed." (24054).

**Worst 10 lines (fix or cut)** **[ESTABLISHED]**
1. Maureen: "He was very happy though, wasn\u2019t he." — the escape is double-escaped in source, so the player sees the six characters `\u2019` (17268; also "beginner\u2019s luck", 17278).
2. Documentary premiere: "It is a \*great\* send reel" — literal markdown asterisks (43328).
3. Keepers: "Heard you stuck V2 out at **Gym**. Pie's on the house today." / "Heard you sent {route} out at Gym. V0's no joke." (17658, 17709; gym ticks carry `where:"Gym"`, 48538).
4. Crowd: "Hey. You're the shoe you have never liked guy." — the product string is spliced into "the ___ guy" (30192 + 30013); also "the smartwatch that scores your sends guy".
5. "Free dinner. Dirtbag gold. +25 hunger." (19568) and "Tried harder. Sent angrier. +2 power." (19550) — Gen-1 stat-dump register.
6. Hazel's first mentor beat: "An old crusher's been watching you from the boulders… She ambles over and spits." (33653) — caricature voice, and it re-introduces a character who already said "I'm Hazel" (33605).
7. Mara's arc finale: "She catches you in a headlock. “THAT'S what I'm talking about. You're a crusher now.” Forged." (22009).
8. Ray: "There he is. Or she. Or whatever — the one who actually comes back." (26693).
9. Quest: "The spirit won't send a gym rat to the same death." (35248).
10. Rico reacting to *any* of 7 sponsored products: "They PAID you? To say WORDS? About a **DRINK**?" (21660); similarly Mara's "It's a V6." for any viral clip (21664).

Honourable mentions: "Sage and Rico are all at the fire." (21307; only called with ≥2 people); trivia "What decade is climbing gyms becoming widespread in the US generally credited to?" (15896); "Thirty-four degrees outside" (23701).

---

## 4. Bugs & defects

### Confirmed **[ESTABLISHED]**
| # | Defect | Where | Failing scenario |
|---|---|---|---|
| B1 | **Any dog = total parking-ticket immunity.** The expression is parsed as `(g.dog \|\| (Z2(dog,"watch") && rand<0.5)) ? noTicket : ticket`, so the "Watch" ability (bond 75, meant as 50%) is meaningless | 51145 | Adopt a pup (bond 0, even unfed) and sleep in the Lot 10 nights: 0 tickets. Normally tickets run 10/20/30/40% from the 3rd consecutive night ($25 each; boot at 3; 16397–16401). The dog barks off every ticket instead (52241). Cross-system: economy |
| B2 | **A declined stray dog is re-offered on every crag trip.** "Walk away" just closes the modal; only adopting sets `dogOffered` | 67686, 38022, 52192 | Decline on trip 10 → the same "It creeps in close…" modal on trips 11, 12, 13… |
| B3 | **A new stray appears the drive after your dog dies.** Death resets `dogOffered`, and the cumulative trip count is already ≥10 | 52506, 52192 | Morning after the farewell scene, drive to the crag: "presses its head into your palm like it's been waiting years for someone to stop." No grief interval |
| B4 | **Literal `\u2019`** in two cafe lines (double-escaped in source) | 17268, 17278 | Sit with Maureen; beats 2 and 3 show `wasn\u2019t`, `beginner\u2019s` |
| B5 | Literal `*great*` markdown in plain React text | 43328 | Premiere the hero cut with a strong reel |
| B6 | **Homecoming counts diary entries as "lives shaped."** `legacy` is the whole Diary (sends, dogs, stances, epics…), and the unlock threshold is 3 (`Q7`, 17639) | 85141–85143, 45594, 48843–48872 | Three diary entries by ~day 10–15 → Diary shows "You've shaped 3 lives out here… everyone still around shows up"; the payoff (+$200, +15 rep, +400 followers) fires on the next outdoor send and toasts 3 random diary lines |
| B7 | Keepers and locals quote gym ticks as "out at Gym" / "at Gym" | 17658/17677/17709; 26444–26650; 17728; 48538 | Climb only in the gym for 3 days, then visit the diner |
| B8 | Crowd line splices the product phrase into "the ___ guy": ungrammatical for 4 of 7 products, and genders the player | 30192, 29986–30028 | Take the "shoe", "watch", "app" or "gun" ad "straight" |
| B9 | **Hazel re-introduced as a stranger.** `hz_hello` always fires first (`when: () => true`), then mentor stage 0 describes "An old crusher… She ambles over" | 33605, 33653, 40519 | Every normal playthrough |
| B10 | Duplicate event id `viral` in HJ and qJ; the seen-flag of one hides the other | 19687, 20182, 39379 | See the town "clip making the rounds" → the qJ version never appears |
| B11 | **Hitchhiker callbacks ignore your first choice** (count-only memory) | 17094–17214, 44846 | Tell the grifter you have nothing → the callback offers "Stop, and ask for your forty back." Drop the runaway without advice → she thanks you for "the thing you told her about the cold." The thief callback assumes cams were stolen |
| B12 | 3rd+ meeting with a hitcher replays the same callback verbatim (≈1 per 100 days; see §5) | 17221–17223 | The kid came "nineteenth out of forty" again |
| B13 | **A caravan friend's "personal" story can be skipped for good.** The ridge knock "Wave them in" increments a random caravan member's hang count without running the crossing check, which only fires when the count hits exactly 8 | 45006, 45022, 26802 | Frank at 7 hangs → ridge knock "Wave them in" (a stranger) → Frank = 8 → the next real hang is #9, so the story never plays |
| B14 | Discourse topic chosen with replacement (3 topics), so the same debate recurs and adds a duplicate stance entry | 47852, 38976 | By day 100 the sim averages 3.9 debates but only 2.4 distinct (§5.2) |
| B15 | Epic "story" line depends only on the outcome tier, not the options taken | 45084, 27440–27762 | "Sit down and wait for the moon", clean result → Diary says "the night you walked out by phone light" |
| B16 | Rival-slot partner "Dex": `s2` shows the *current rival's* name, but 27 authored lines name "Dex" outright (BZ, K9, UZ, Q9, J9, pC, $ee, rH, rO, Kee, oq), and roughly 35 more lines keyed to the `dex` slot use he/him | 21771 (`s2`), 51942–51958, 19412 | After rival retirement or a legacy generation, ally the new rival (e.g. Vera Lyle, "she") → the partner card says "Vera", the fire says "Dex… he" |
| B17 | Rival successor built from your mentee gets a **random gender** (`H<0.5 ? "he":"she"`) after being "they" throughout | 51948 | Mentee becomes rival; pronoun flips |
| B18 | Comma-operator slip `(g.rivalGen === 0, "their")` — always "their" | 51968 | Harmless text, but a sign of untested branches |
| B19 | "★ ride-or-die — your tightest partner" shown on *every* partner whose arc is complete | 95357–95358 | Finish two arcs → two "tightest" partners |
| B20 | "…are all at the fire" with exactly two names | 21307 | Any 2-partner fire |
| B21 | Poker Low/Mid/High buy-ins all use 1/2 blinds | 14978–14982 | "High" is only a deeper stack |
| B22 | **Day 1 is always "New Year's Send"** (+$50, +20 psyche) | 20632–20640 (`newyear`, doy 0), 20630 (`aZ`), 40462–40486 | Every new game gets +$50 on day 1. That's +167% for the "desert" origin ($30), +111% for "gymnast" ($45), +83% for "gymrat" ($60); origin cash values are in `im`, 31399. A holiday toast also lands in the middle of the tutorial. Cross-system: economy |
| B23 | **Holiday order:** Sendsgiving on day-of-year 38, "Halloween Night Send" on 41 — reversed from the real calendar | 20669–20686 | Fall season, days 39 and 42 |
| B24 | Owed favours persist after the partner reaches Partner/Ride-or-Die, and the debt-rift text hard-codes "I've come out for you **eleven times**" | 21523 (`pC.sage.debt`), 51037–51040, 51793–51796, 21584 | Go out with Sage twice (bond 0→4→8; owed banks to 2 on the way), never belay her → day +21: rift at bond 8, with Sage citing eleven outings |

### Suspected / edge **[INFERRED]**
- **S1. Encounter modal can clip.** The card has `overflow:"hidden"` and no `overflowY:auto`/max-height (81074–81081), while the dog-death modal does scroll (62832). Long titles (the rival-meet text is ~95 words + 3 options) may clip on short or landscape viewports.
- **S2. Romance and rift don't talk to each other.** A partner in a rift can't be invited, so the romance silently decays to "IT ENDED" (26 days). No authored line acknowledges the link.
- **S3. Arcs make promises the systems don't keep.** Ollie's "He's out at the crag less now" (41005) has no mechanical effect. Sage's two choices at stage 2 are both "she leaves 16 days" (40749–40771).
- **S4. Rescuers who couldn't drive.** Rescue text has hitchers who had no ride "pull in behind you" (39955): the 19-year-old kid, the runaway with the bin liner.

---

## 5. Balance & pacing

### 5.1 Bond inflation (the core pacing problem) **[ESTABLISHED numbers; timeline INFERRED]**
- **Gates that bond drives:** arc stages at bond 1/3/5/7; romance at 5/6/8/10; crew naming at ≥2 partners ≥3 with Σ≥12; driveway sleeping spot; availability +11% per tier.
- **Rate of gain:** a crag day with 4 attempts beside a partner is +4 bond, +1–2 more from a spot or UJ moment. So:
  - **Ride-or-Die (7) in ~2 crag days.**
  - Arc stages then fire at 60% per crag day with that partner → **a whole arc in ~1–2 weeks**.
  - **Romance:** first beat at bond 5, finale at bond 10 → all four beats (including "Ask her to move in") in ~4 consecutive crag days.
  - **Hazel:** 5 stages in 5 crag days (72% each, no spacing).
- **Fire games farm it for free:** e.g. 7 trivia games in one evening = +7 bond to each of Sage, Rico and Mara, +~100 psyche (capped), and rep on wins. A brand-new player on day 1 can reach Ride-or-Die with three people they have never met.
- **Psyche is therefore trivially maxable** (cross-system: psyche gates burnout and send odds elsewhere).
- **Owed/rift pressure is the only brake, and it barely bites.** Favours accrue only while a partner is below bond 5, which they pass during the second outing. From then on outings are free, apart from whatever was banked (B24). Neglect (50 days apart at bond ≥5) is the one lasting pressure.
- Rifts apply to 4 of 7 partners.

### 5.2 Exposure and repetition (Monte Carlo, `work-social/sim.js`) **[INFERRED]**
Assumptions: 50% crag days; 5 zone changes on town days; 70% of nights in the Lot, 30% at the trailhead; 3 walker chats a day; a fire hang every other night.

| Layer | Day 30 | Day 100 | Day 200 | What the player notices |
|---|---|---|---|---|
| Walker chats (QJ, 8 kinds) | ~90 taps | ~300 | ~600 | Every kind seen **~10×** by day 30 — the most-repeated text in the game |
| Keeper fillers (3–4 per keeper) | each ~7× | ~25× | — | Daily |
| Campfire hang outcomes (~7 generic) | 15 hangs, each ~2× | 50 hangs, ~7× | — | "Someone broke out a guitar… Good for the soul." |
| Partner busy texts (2–3 each, rotate by day) | cycling | cycling | — | Same text every 2–3 days |
| Send reactions (2–3 per type per partner) | many repeats | — | — | Every send |
| Overnight WJ (16) | 10.5 shown / 7.8 unique | 35 / 14.2 | 70 / 15.8 | Repeats within the first month |
| Night knocks (Lot 4 + trailhead 3) | 3.0 / 2.4 | 9.8 / 5.0 | 19.5 / 6.2 | Each Lot knock ~2× by day 100 |
| Town random pool (~15 unconditional HJ/qJ) | 8.3 seen | **15 — exhausted ~day 55–70** | exhausted | Town encounters stop |
| Hitchhikers | 1.7 | 5.5 (3.3 distinct, 2.1 callbacks, 0.7 verbatim) | 11 (4.9 distinct, 2.9 verbatim) | The 2.6× weight means you keep meeting the same 3–5 people; ~3 never appear |
| Discourse (3 topics) | 0.9 | 3.9 (2.4 distinct) | 8.2 | Repeat likely by day 100 |
| Holidays (7) | 3 | 13 (each ~2×) | 25 | Same toast and gift each time |
| Festivals (4) | 2 | 7 | 14 | Same acts every 56 days |
| Authored arcs (partners, romance, Hazel, cafe, locals) | mostly in progress | mostly finished | finished | After ~day 60 almost no new character beats except stances/echoes and quests |

**Verdict [INFERRED]:**
- **Day 30** feels alive: new arcs, cafe beats, local notices, first hitchers.
- **Day 100:** the authored character content is spent. The player sees second cycles of holidays and festivals, verbatim hitcher callbacks, and daily ambient repeats.
- **Days ~100–300:** the only new social events are occasional stances/echoes, discourse repeats and quests. The dog's gray/senior/death beats (days ~160–310) are the one long-arc payoff.

### 5.3 Other numbers **[ESTABLISHED]**
- **Romance as a follower engine:** a full romance gives **+2,100 followers, +33 rep and +12 head** (`qee`, 21841). That beats a viral-clip event (+1,200 followers, 19692/20190). Odd incentive (cross-system: media/economy).
- **Local gifts:** rep 4–16 and standing 6–14 each, ~50 rep across 5 locals. Caravan personal stories: +psyche only.
- **Epics** reward bad outcomes with more rep (2 → 5 → 9), and telling a bad epic adds rep again. Recklessness pays in rep terms.
- **Family pressure is negligible:** decay 0.4/day; one call (+8–12) buys ~25 days.
- **Dog upkeep:** $6 per feed, fed −22/night. A neglected dog loses its perks but never its bond, and never leaves.
- **Reading and instruments:** unlimited repeats. E.g. the Regional Guidebook gives +3 technique / +3 endurance per 2 h forever (diminishing via `hi`) plus +14 psyche. Cross-system with the climbing auditor's progression findings.
- **Cafe perks** are cosmetic. Keeper "pie's on the house" is flavour only.
- **Time model:**
  - Age and dog years use `Tr` = 18 days (25975; `hn`, 25976).
  - Seasons are 14 days and the holiday year is 56 days (`Bl`, 20387; `vv`, 20629).
  - A player ages ~3 years between New Year's Sends. A dog dies at "16 years" after ~5 holiday cycles.
  - Tam's "five good seasons" = 70 days. Story ages ("years") count in 18-day units.

### 5.4 Consequence audit: do choices matter later? **[ESTABLISHED]**
| Remembered well (choice → later effect) | Where |
|---|---|
| Stance option → echo event 30+ days later that makes you hold or turn (6 of 20 stance options have echoes, plus the grade-war feed debate) | `WH` 25131 → `wae` 24924, `Sae` 25119 |
| Documentary interview honesty → trust → honest or hero cut → 6 different aftermath encounters | `WB` 16507, 38825 → `PJ` 19799 |
| Help the stranded van / leave the found pad → they come back later (the only 2 `sets`/`needs` chains among the 43 HJ/qJ/UJ/PJ encounters) | 19620 → 20038; 20269 → 20060 |
| Ads taken straight vs honest → partner takes, crowd lines, and a "repeat" rift if you shill again | `rH` 21589, `Bue` 30189, `Aee` 21573 |
| Favours, neglect → rifts; turning up 3 times → reconciliation + diary line | 21521–21587, 41779–41880 |
| Who you bring together → crew chemistry grows and bad pairs heal | 21099–21320 |
| Your record → locals, keepers, fans and crowd quote your latest send, FA, dog, injury, sponsor, crew name | 17719, 26780, 26798, 30142, 39769 |
| Everything in the Diary → campfire stories, and older stories weigh more | 27270–27323, 45103 |
| Hitchers you met → they rescue your broken-down van | 17225, 39921–39955 |
| Mentee → can become your rival; youth-team kids → join the national field | 51942–51951, 54156 |

| Cosmetic or forgotten | Where |
|---|---|
| Romance stages 2–4: both options identical | 41171–41220 |
| Partner-arc forks: stats differ, story reconverges; "he's out at the crag less now" not modelled | 40674–41100 |
| Hitchhiker callbacks don't know what you chose | 44846 |
| HJ/QJ/WJ choices: +2 technique vs +2 head style trades, never referenced again | 19520, 20307 |
| Mentee milestone choices: rep vs psyche | 26198 |
| Cafe "perks", keeper "pie on the house" | 44886, 17658 |
| Walk-out story text ignores the path you took | 45084 |
| Holidays: no choice at all | 40462 |
| Stance options without echoes ("Name whoever did it", "Tell the manager", "Bolt it", "Correct the record", all of `trashed`) | 24924 vs 25131 |

---

## 6. UX / clarity from the player's seat

1. **Toasts eat the best writing.**
   - Duration = clamp(600 + 165 ms/word, 1,400, 5,200) × queue factor [1, .7, .52, .4] (14810–14820). The toast is bold, centred, 86% wide, with no max height (95731–95751). With >4 queued, the oldest are dropped (38592).
   - 26 of 87 measured result texts are ≥35 words. Needed reading speed at the 5.2 s cap:

     | Text | Words | Words/sec needed |
     |---|---|---|
     | Stance results (e.g. "Settle it.") | up to 91 | 17.5 |
     | Caravan personal stories | 62 | 11.9 |
     | Local personal stories | 40–51 | 7.7–9.8 |

   - Comfortable reading is ~4 words/second. Tapping the toast *advances* it; there's no pause.
   - Stance results use a toast (37037), while echo results use the modal "— a moment —" card (38863, 73601). This is inconsistent, and the more important beat gets the worse treatment.
2. **No message history.** The Diary keeps one-line summaries, never the text. A missed personal story is gone.
3. **Permanent decisions with no warning.** "Laugh it off" / "Keep it about the climbing" permanently removes that romance (41167/41184). Nothing tells the player.
4. **Party games** quietly seat people you haven't met (or have fallen out with). Rico and Mara are "in" every night even when their busy-text says "Working a double" or "I'm on the board till six".
5. **Crowded firepit menu** (up to 13 rows, 56312–56444): six near-identical social games plus crafting and cooking.
6. **Who is who?** Three Priyas, three Theos, Marge vs Margie, and shared sprites (§3.2). A new player can't tell Tam from Margie at a glance.
7. **The rift timer is hidden.**
   - The partner card does show the favour state: availability %, "they'd be doing you a favour, and you'd owe it", a red "you owe them N, and they've stopped picking up", and a "Belay them on their project" action (95180–95213). Busy-texts append "(You still owe them N.)" (21093).
   - What's missing is the clock: nothing says a debt rift lands 21 days after you first owe 2, or a neglect rift after 50 days apart. The first explicit signal is the rift itself.
   - The copy "they've stopped picking up" is also stronger than the mechanic (−30% availability per favour owed).
8. **Strong systems live only in menus.** Crew chemistry (95216+), partner grade tracks and projects (95006) and arc progress (95357) are visible in the partner card. Poker reads show only in the table log. Hitcher rescues are never explained. None of this is surfaced in the world (e.g. a partner mentioning they're a grade up on you), so many players won't notice it.

---

## 7. Overlaps, bloat, dead or vestigial

- **Duplicate encounters** **[ESTABLISHED]**:
  - HJ `beta`/`psyche`/`rival` ≈ QJ `beta`/`psyche`/`spray`, with identical result strings: "Stayed chill, stayed fresh. +5 energy.", "Climbed with something to prove. +2 head.", "Take the beta… +2 technique."
  - HJ `viral` ≈ qJ `viral` (same premise, same id).
  - WJ "Cops rapped on the van at 4am" ≈ qJ `moved` ≈ ade `cop`.
  - WJ "side door popped" ≈ qJ `breakin`.
  - WJ "Flat tire. $30" ≈ qJ `compflat`.
- **Early placeholders superseded by richer systems** **[ESTABLISHED]**:

  | Early HJ / holiday | Later, richer system |
  |---|---|
  | HJ `festival` | 4 seasonal festivals |
  | HJ `film` | Winter Film Festival |
  | HJ `swap` | Swap Meet building and Spring market swap |
  | HJ `bonfire` | the whole campfire system |
  | HJ `trailday` + holiday "Crag Cleanup Day" | stance `trashed` |
  | HJ `rival` | the rival system |
- **x4 hike vs EO approach:** identical mishap strings ("…in the brush — backtracked, gassed.", "Slipped on a wet rock — soaked and rattled.") (28438 vs 23130; 28459 vs 23140). **[ESTABLISHED]**
- **Six fire games** with the same reward shape (psyche + bond + rep). Only poker has any memory (reads). Recommend 2–3, each with a distinct social function. **[INFERRED]**
- **Vestigial or misleading names** **[ESTABLISHED]**:
  - Grocery building id `"setter"` (10969; Hank's `buildingId: "setter"`).
  - `legacy` means Diary, yet is labelled "lives shaped" in the Homecoming.
  - Cafe `perk` strings do nothing.
  - `hitchSketch` is written (44847) but never read anywhere in the bundle (only other reference is the default at 14392). The "you picked up somebody sketchy" counter is dead state.
- **Second-class partners:** Tam, Ollie and Dell lack rifts (`pC`), fire takes (`rH`), romance (`dO`), party seats (`Ko`), fire chemistry lines (`J9`/`Q9`) and poker lines/profiles (`oq`/`XE`). Half the partner systems silently skip three of seven partners. **[ESTABLISHED]**

---

## 8. Opportunities (prioritized)

### IMPROVE (fix what's there)
1. **[S] Hotfixes:**
   - B1: add `g.dog &&` and wrap the watch clause.
   - B2/B3: set `dogOffered` on decline, and add a grief cooldown of ≥28 days before a new stray.
   - B4/B5: fix the escapes and asterisks.
   - B6: count people, or rename the Homecoming copy and raise its threshold.
   - B7: map "Gym" to "the gym" or skip gym ticks.
   - B8: add a `short` product noun to `t6` and drop "guy".
   - B9: rewrite G2[0] to open "Hazel's been watching you…".
   - B10: rename one `viral` id.
   - B13: run `sT` in the knock path, or make the crossing trigger `>= 8 && !crossed`.
   - B14: remember weighed topics.
   - B16: template the rival-slot partner's name and pronouns.
   - B20–B23: small text and calendar fixes.
   - B24: clear owed favours on reaching Partner, and template the favour count in rift texts.
2. **[M] Slow relationships down and make them earned.**
   - Bond at most +1 per partner per *day*, not per attempt.
   - Fire games cost 1–2 h and require the person to be present (use `pL`/availability), with bond once per night.
   - Add minimum spacing (≥5–7 days) between arc beats, romance beats and Hazel stages.
   - Target: a romance takes ~6–10 weeks; an arc ~1 season.
3. **[M] Give long text a proper surface.**
   - Route every result over ~30 words (stances, personal stories, gifts, mentee milestones, arc outcomes) through the existing "— a moment —" card (73601), which needs a tap to dismiss.
   - Add a scrollable **message log / journal** holding full text.
   - Make toasts pause on touch.
4. **[S] Make choices remember.**
   - Store `hitchMet[id] = {n, lastChoice}` and branch the `ox` callbacks. The data is tiny, and the three continuity errors disappear.
   - Same for romance stages (2 outcomes per stage) and Sage/Ollie arc forks (stay-vs-go should change `partnerAway`/availability).
5. **[S] One style pass.**
   - Pick a dialect: US English (recommended, given the setting). Convert the ~60 clear British markers and the metric units.
   - Normalize curly quotes.
   - Kill Gen-1 stat-dump endings: show numbers in the UI chip, not in prose.
   - Cap the tics ("genuinely", "the whole thing", "standing ovation").
   - Retire "Ride or die" from 4 of 5 finales.
6. **[S] Untangle the cast.**
   - Rename collisions (Priya ×3, Theo ×3, Kit, Junie, Sol, Wren, Sunny, Cormac, Esme, Marisol, Wes, Kai, Remy, Marge/Margie).
   - Give every named NPC a unique layered look via `Hj(name)` (14797 already exists).

### CHANGE (design)
7. **[M] Partner parity.** Give Tam, Ollie and Dell rifts, fire takes, party seats and (optionally) romance, or explicitly frame them as "elders" with different mechanics. Right now they are free to exploit.
8. **[M] Replace the six fire games with three social rituals that do different jobs:**
   - storytelling (exists: memory);
   - cards with reads (exists: poker learns people);
   - a "crew night" that advances chemistry and triggers `J9`/`Q9`/`rH` lines.
   - Cut liar's dice and trivia, or turn trivia into the tutorial glossary it already is ("What's a jug?").
9. **[M] Reweight hitchers to favour the unmet** (for example ×0.5 for met, and callbacks only once), and add 6–8 more hitchers. Keep the rescue callback.
10. **[S] Fix the clock** (with the world/UI and meta auditors): one "year" = one 4-season cycle. Otherwise NPC time talk, dog years and story ages will keep contradicting the calendar.

### CUT
11. **[S] Retire the Gen-1 random layer:**
    - Delete WJ one-liners that duplicate qJ/ade.
    - Merge HJ into qJ-quality events or cut it.
    - Remove QJ walker duplicates; keep fans, gearhead and the dynamic crowd lines (`Bue`), which are better.
    - Cut the HJ festival/film/swap/bonfire/trailday placeholders.
12. **[S] Reconsider the ghost quest's framing** (35234). Keep the Obsidian Tower objective, but make the "fallen climber" a memorial or logbook rather than a spirit.

### ADD (what a life-sim needs)
13. **[L] A main story spine.** Today there is one 5-stage tutorial quest plus 15 side errands. Proposal: 3–4 acts across the first year:
    - Act 1: arrive and get a partner;
    - Act 2: the crew and a scene conflict (access, the closure, the rival);
    - Act 3: a defining project or expedition with your crew;
    - Act 4: legacy (mentee, gym, the Homecoming).

    Use existing systems (stances, crew project, documentary, youth team) as the beats, and write an ending.
14. **[L] NPCs whose lives change, driven off real timers:**
    - Ray's last season → he retires and hands you his crag (the "gift" becomes an event).
    - Tam slows down and eventually stops.
    - Frank's rig dies and he parks next to yours.
    - Rosa's Milo has the birthday he invited you to.
    - Kit's one-year anniversary.
    - Partners get injured, go on trips, move away and come back.
15. **[M] Relationship milestones and conflict:**
    - Romance beyond 4 beats: anniversaries, the first fight, a shared van decision, choosing between a partner's opportunity and yours, a break-up with real text.
    - Crew drama where two partners fall out *because of you*.
16. **[M] Holidays as events:**
    - Each of the 7 holidays gets a scene with partners, locals and the caravan: a Sendsgiving potluck with everyone you know, a Halloween night-send quest.
    - Festivals should show your people there.
17. **[M] Give, not just receive:** gifts to locals, partners and family (food, gear, beta, a named route); invitations (take Junie out, bring Frank to the fire).
18. **[M] A family arc:**
    - A handful of scripted beats across a year: dad's tractor, a sibling's wedding, a parent's health scare, "come home for good" as a real branch.
    - Family currently exists only as a decaying bar.
19. **[S] More ambient variety in the most-seen pools:** keeper fillers (3 → 10+ each, seasonal and state-aware), walker chats, campfire outcomes, busy-texts, send reactions. At ~3 walker taps a day these are 90% of the text a player reads.

---

## 9. What's strong and must be preserved

- **The Gen-3 voice.** Hitchhikers and their callbacks, night knocks and bivy spots, cafe regulars, stances and echoes (moral choices that come back 30+ days later, with "elder" options unlocked by age and standing), rift and mending texts, the documentary interview and its aftermath, gym regulars' 3-stage vignettes, the sponsored-ad copy, the dog's whole life. This is a distinctive, sellable writing identity; use it as the style guide. **[ESTABLISHED]**
- **Memory systems:**
  - the town and crowd quoting your record (`Bue` 30142; keepers, locals and caravan "notice" lines);
  - `rH` one-time partner takes on your choices;
  - the favour economy and rifts;
  - crew chemistry that matures;
  - partners whose grades and projects move, who can pass you and send their own lines while you belay;
  - poker reads that grow with hands played;
  - the diary → campfire storytelling loop;
  - youth-team graduates entering the national field;
  - past hitchers rescuing your van. **[ESTABLISHED]**
- **The dog lifecycle.** Adoption → abilities → gray muzzle → vet scares → a farewell with three ways to spend the last day. It's the model for how every long relationship in the game should work. **[ESTABLISHED]**
- **Crew identity:** a crew name built from your actual record ("the Van Crew — Because of the van. Because it is always the van."), crew renown, the crew project, and a partner sending *your* crew line. **[ESTABLISHED]**
- **Night and road texture:** bivy spots with distinct knock pools, and walk-out epics that become stories you tell later. **[ESTABLISHED]**
