# Dirtbag v0.956.0: World Map, Presentation, UI/UX, Audio and Onboarding

**Auditor lane:** the town and crag maps, how they are rendered, the assets behind them, every UI surface, the HUD and toasts, onboarding, accessibility and audio. Cross-system notes are flagged where they touch economy, climbing or tech.

**Method.**
- Read the code in `bundle.pretty.js`. All line numbers below refer to that file.
- Evaluated the map and layout tables in node: `ns`, `To`, `yv`, `Uu`, `AE`, `tU`, `nU`.
- Decoded all 674 sprites from `window.__ASSETS__` and analysed their pixels in-browser: border opacity, colour count, and the "block size" (the nearest-neighbour upscale factor each sprite was exported at).
- **Played the live build in headless Chromium at 390×844, the typical portrait phone.** I also tested at 375×667, 430×932 and 1440×900 desktop. The dev teleport was used for the crag and night scenes.
- Screenshots and the scripts that made them are in `$SP/work-worldui/` (`shots/*.png`). They are referenced below by filename.

Labels: **[ESTABLISHED]** means read directly in code or data, or reproduced in the running build. **[INFERRED]** means my reasoning.

---

## 1. Summary

1. **The town is a hand-dressed DOM diorama, not a tile map.** [ESTABLISHED]
   - There are 12 walkable town zones, plus the crag (9 crag variants), the farm, the Olympic Village and 4 interiors. That is 19 zones and 52 interactive "buildings".
   - Every prop is an absolutely positioned `<img>` with an ad-hoc pixel height (`h`). It is placed at *fractional* coordinates inside a world sized from the viewport: 3.6×W by 2.2×H for street zones.
   - The shipped layout is 1,134 hand-placed props of 211 distinct sprites. There is no grid, no tiles and no prefabs.

2. **Why it looks inconsistent, quantified.**
   - **Mixed pixel sizes.** On one outdoor screen an "art pixel" renders anywhere from **0.41 CSS px** (Physio Clinic) to **2.4 CSS px** (farm soil beds). That is a ~6× spread. A cohesive pixel-art game holds this at one value; here the player's is 1.1.
   - **Four texel regimes mixed:**
     - 16-px art ×2: 428 sprites.
     - Native 1×: 84 sprites, including the whole diner set.
     - ×3: 108 sprites, the portraits and grocery crates.
     - Resampled non-pixel art: the legacy `tree`/`gas`/`warehouse`/… set, with up to 10,356 colours in a 192×91 sprite.
   - **Mixed smoothing and effects.**
     - Most of the world is drawn with bilinear smoothing, but critters, dog and cars use `pixelated`.
     - The ground is smooth noise textures: `me_cobble` has 17,395 colours.
     - Paths are 98 stamped soft dirt blobs, 69 of them in the park.
     - The lake is a CSS radial gradient.
     - Roads, lane dashes and crosswalks are CSS.
     - Every prop gets a CSS drop-shadow.
   - **Mixed perspectives.** Top-down parked cars sit next to a side-view fire truck that is only 1.24× a car's length.
   - **Layout depends on screen shape.** Because positions are fractional but sizes are fixed px, the same layout crowds on an iPhone SE and falls apart on desktop.

3. **Buildings don't say what they are.** [ESTABLISHED]
   - All 23 "tall" building types render **no name label** (`104552`).
   - Only about 6 of the 20 street-zone buildings carry a sign that matches their function.
   - The climbing gyms (Send City, The Cave, Your Gym), the Gallery and the Olympic venue are all the same "G-NERIC CORP" office tower.
   - The Gear Shop, Music Store, Swap Meet and National Team Store all say "HARDWARE".
   - The Grocery, Bookstore and Coffee Shop are the same house model.
   - A decorative, non-enterable "DINER" stands next to Send City, but the real Diner is in Old Town.

4. **The crag is the weakest scene.** [ESTABLISHED]
   - The crag is the fantasy's heart, yet it is drawn as a grass field with a pond and one 110×108 rock pile, rendered at about 2× the player's height. The "wall" for Wind River Walls and The Big Stone is the same pile.
   - Moonstone Boulders (desert) and The Crucible have no layout of their own, so they render the Roadside Crag's green meadow (`Uu[...] ?? Uu.local`, `56840`).
   - The climbing minigame itself is an abstract meter in a modal card: no climber, no wall.

5. **The UI is enormous and text-dense.** [ESTABLISHED]
   - There are ~183 fixed modal layers (≈150–180 distinct surfaces).
   - The hub menu has 28 panels in 3 tabs, plus Settings.
   - One generic building action sheet serves 52 buildings and 113 verbs.
   - There are ~700 toast call sites, 84 "celebration" stamps and 31 HUD alert types.
   - Type is small: 32% of 2,506 `fontSize` declarations are under 11 px, and the HUD bar labels are 8.5 px.
   - Two visual languages are mixed: a dark-slate web HUD and parchment pixel-frame panels.
   - Building-sheet titles inherit `#e2e8f0` on parchment, a **1.7:1 contrast ratio**.

6. **Toasts actively break interaction.** [ESTABLISHED, reproduced]
   - The text toast is fixed at `bottom:210`, sits at `zIndex 60` above every panel and minigame (46–48), and is tap-to-dismiss. It lands on top of the HOLD TO LOAD button and on encounter choices (`95730`; screenshots `mg_1.png`, `int_diner.png`).
   - Unrelated toasts are concatenated when the combined text is ≤46 words.
   - The queue silently drops anything beyond 4.
   - Real reading speed is ≈210 wpm only for 5-word lines. It rises to ≈310 wpm at 23 words and 450–630 wpm when queued or merged, not the flat "200 wpm" the changelog promises.

7. **Onboarding stacks eight guidance systems on day 1.** [ESTABLISHED]
   - The eight are: GET STARTED checklist, First-Season quest, goal ladder, Hazel, 12 tip modals, NEXT MOVE advisor, alerts, and the Calling "Ambition".
   - The player reads ~1,000+ words across 8 screens before moving, including an irreversible Normal/Free Solo choice.
   - The first teal marker sends them three zones to the Coffee Shop, though tapping the van next to them completes that step.
   - Day 1 also shouts "SEND DAY — drop everything and get on rock" at a player with no gear. Every outdoor boulder then needs a crash pad sold only at the *Shopping Center's* "Gear Shop", while the hint just says "Gear Shop".

8. **Accessibility settings exist but under-deliver.** [ESTABLISHED]
   - The colorblind toggle only recolours gear-condition bars, not the HUD it describes.
   - Text size maxes at 1.15× via CSS `zoom`.
   - High contrast is a global CSS filter.
   - Reduce-motion ignores the OS preference.
   - There is no keyboard movement on desktop web.
   - The HUD disappears entirely inside interiors.

9. **Audio is lean and correctly credited, but thin.** [ESTABLISHED]
   - A WebAudio synth provides 10 SFX and 3 ambience layers.
   - There are 8 music tracks from one album ("Bitwise", CC BY 4.0), with attribution on the title screen and in Settings → Sound, with links and a change note.
   - The music is only ~10 minutes in total, as 60–128 s loops.
   - 9 of the 12 town zones plus all interiors map to the same "main" track.
   - Tracks hard-cut and restart on every zone change.
   - Free Solo plays one track for the whole run.

10. **Recommendation.** Stop fighting the asset packs.
    - **Now (S):** fix toasts, label every building, fix signage, set `pixelated` rendering, fix the Town Map, and re-point the onboarding.
    - **Rebuild (M–L):** replace the 12-zone joystick town with a **topo-guidebook valley map**. Tap a pin, the van or climber travels, and an illustrated place card opens with the existing action list.
    - Keep two small walkable "camp" vignettes, the Lot and the crag base, in one tileset at one integer scale.
    - Give every crag a proper topo drawing, which doubles as the climbing-session screen.
    - This is the cheapest route to cohesion for a solo dev. It is mobile-readable, it is unmistakably *climbing*, and it transfers directly to the Unreal project's UI.

---

## 2. How it works

### 2.1 Rendering architecture [ESTABLISHED]

- **Tech.** React DOM with inline styles; there is no canvas world renderer. `Oe(name)` (10829) returns the base64 data-URL from `window.__ASSETS__`, and falls back to `/world/<name>.png`, which doesn't exist, so a missing sprite shows as a broken image.
- **World size.** `Wd(zone, vw, vh)` (11850) sets the world size in "world px":

  | Zone type | Width × height | At 390×844 |
  |---|---|---|
  | Street zones (`Bv`: 8 town zones + olyvillage) | 3.6·vw × 2.2·vh | **1404×1857** |
  | Lot, Notown, crag, farm | 2.2·vw × 2.2·vh | 858×1857 |
  | Park | 3.2 × 2.8 | — |
  | Lake | 2.6 × 2.6 | — |
  | Olympic Village | 4.2 × 3 | — |
  | Mall interior | 2.9 × 2.3 | — |
  | Other interiors | exactly one screen at camera 1.1 | — |

- **Camera.** `Gr` (38030) translates and scales the world with `UE = 0.55` outdoors (14841) and `zR = 1.1` in the diner, cafe and cabin (11569).
  - A street zone is therefore ~1.98 × 1.21 screens.
  - The same sprite is drawn **2× larger inside** than outside.
  - Player speed is `Mj = 410` world px/s (14514), which is ~225 CSS px/s on screen outdoors.
- **Prop placement.** Props (`v5`, 13452) are `<img style="height:h px; width:auto">`, placed at `left: fx·100%`, `top: fy·100%`, anchored by per-category offsets (`om`, 13407). Z-order is by `fy·1000`.
- **Smoothing.** Neither props nor buildings (`Aye`, 104567), the ground, nor the player sprite div (57476) set `image-rendering`. Only critters, dog, crag partner, cars, farm walkers and the drive scene use `pixelated`.
- **Shadows.** Every prop gets `filter: drop-shadow(0 2px 2px …)`. Buildings get a stronger shadow plus a blurred ellipse. That is 66–84 filtered elements per zone, out of 286–330 DOM nodes and 49–64 `<img>` (measured).
- **Ground.** The ground is the world div's `background-image` at native size (`aU`, 13260):
  - grass 512² for Lot, Trailhead, Park, Lake, crag and farm;
  - `me_cobble` 256² for 7 street zones;
  - `me_deadground` for Notown;
  - the mall floor for the mall and Olympic Village;
  - per crag, `oU` (13259): grass, sand, snow or dirt.
- **Roads.**
  - `fU` (13475) draws street-zone crossroads in CSS: tiled asphalt (64 px) and sidewalk (32 px), CSS-gradient lane dashes and crosswalks, and 2-px curb lines. The road is 168 world px wide.
  - `xye` (103411) is an older 26-px "road" tile with yellow dashes, still drawn in zones not in `r7`.
  - `kye` (103571) auto-draws brown dirt "driveways" from buildings to the road in non-`r7` zones.
  - `r7` (16198) = {lot, oldtown, downtown, midtown, trailhead, outskirts, park, lake, notown} is effectively the list of hand-finished zones. Uptown, Market, Plaza and Olympic Village still show the placeholder driveways (see `zone_uptown.png`, `zone_market.png`, `zone_plaza.png`).
- **One-off scene renderers.**

  | Function | Line | What it draws |
  |---|---|---|
  | `nye` | 102559 | Lot roundabout |
  | `rye`, `aye` | 102714, 102688 | Home Base path and fence |
  | `sye` | 102732 | Notown dirt road |
  | `iye` | 102751 | Notown fog vignette |
  | `lye`, `dye` | 102768, 102882 | Ghosts and wisps |
  | `cye` | 102926 | Park fence |
  | `hye` | 102996 | The lake: a CSS radial-gradient ellipse with green-circle lily pads |
  | `uye` | 103052 | Uptown parking lot |
  | `Zpe` / `eye` / `tye` | 102250–102356 | Interior walls, as CSS divs |
  | `yye` | 103235 | Returns `null`: dead |

### 2.2 World structure [ESTABLISHED]

**Zone graph (`ns`, 10833; grid built by `eU`, 11815):**

```
                 [Notown]
                    |
 [Market Row] - [Uptown] - [Grand Plaza]
      |             |            |
 [Old Town]  -  [Downtown] -  [Midtown]
      |             |            |
 [The Lot]   -  [Trailhead] - [Outskirts]
      |
 [Greenwood Park]
      |
 [Trout Lake]

 Off-grid (van / shuttle / teleport): The Crag (9 crags), The Folks' Farm, Olympic Village
 Interiors: Coffee Shop (Midtown), The Diner (Old Town), Shopping Center (Market Row),
            Home Base cabin (Lot, after the Home Base dream)
```

**Zone table** (decor counts from `yv`, 12105; NPC counts from `UU`, 14821; music from `sB`, 34780):

| Zone | World (×vw, ×vh) | Ground | Interactive buildings | Decor | Ambient NPCs | Music | Specials |
|---|---|---|---|---|---|---|---|
| The Lot | 2.2×2.2 | grass | Van, Campfire, Home Base (hidden until dream) | 48 | 3 | sanctuary | roundabout; Hazel |
| Old Town | 3.6×2.2 | cobble | Gear Shop, Warehouse, Diner (→interior) | 55 | 6 | main | hedge-garden collision hardcoded |
| Downtown | 3.6×2.2 | cobble | Send City, Office Job, Grocery | 60 | 6 | downtown | decorative "DINER" |
| Midtown | 3.6×2.2 | cobble | Music Store, Physio Clinic, Coffee Shop (→int) | 53 | 5 | main | café patio |
| Trailhead | 3.6×2.2 | grass | The Cave, Gas Station, Swap Meet | 64 | 5 | main | decorative barn |
| Outskirts | 3.6×2.2 | cobble | Courier Depot, Bookstore | 79 | 3 | main | 2 decorative buildings |
| Uptown | 3.6×2.2 | cobble | Police, Fire & Rescue | 46 | 4 | uptown | parking lot, court, dirt road north |
| Notown | 2.2×2.2 | deadground | — | 20 | 0 | notown | haunted mansion (decor), ghosts/wisps at night, quest ghost |
| Market Row | 3.6×2.2 | cobble | Shopping Center (→int), Gallery | 49 | 5 | main | garden prefab (no collision) |
| Grand Plaza | 3.6×2.2 | cobble | Hotel, Your Gym | 49 | 3 | main | clock tower (decor) |
| Greenwood Park | 3.2×2.8 | grass | — | 127 (70 ground decals) | 2 | main | fence, fountain, pond |
| Trout Lake | 2.6×2.6 | grass | Fishing Spot, Lake Overlook | 19 | 1 | main | CSS lake |
| The Crag (×9) | 2.2×2.2 | per crag | Crag, Van | 17–24 per layout (6 layouts) | crowd-driven | overworld | sea band at Psicobloc Cove |
| Farm | 2.2×2.2 | grass | Farmhouse, Barn, Van | 128 + 6 beds | Mom and Dad walkers | main | garden beds |
| Olympic Village | 4.2×3 | mall floor | 7 | 44 | 12 | main | |
| 4 interiors | 1 screen (mall 2.9×2.3) | floor tiles | 2–7 each | 10–151 | 0–8 | main | |

- **Buildings (`To`, 10854–11531):** 52 entries. 25 of them are in the 12 town zones. Of the 20 in street zones, **every one sits at `fy = 0.38`** (one at 0.40), in a single row on the north side of the east–west road.
  - The lower half of each street zone is benches, lamps (18–24 per street zone, **202 lamps total**), planters and NPC wander space.
  - Four zones (Old Town, Downtown, Market, Plaza) reuse the same hedge-garden-and-fountain prefab.
  - Visually the street zones are near-duplicates (compare `zone_oldtown.png`, `zone_downtown.png`, `zone_market.png`, `zone_plaza.png`).
- **Art mapping:** building art → sprite via `tU` (11862), and display height via `nU` (11900). The "tall" set `E3` (11939, 23 art keys) gets bottom anchoring **and no name label**.
- **Building signage vs function** [ESTABLISHED, sprites viewed]:

| Sprite (visible sign) | Used for |
|---|---|
| `me_bld_gym` / `oly_venue` / `me_bld_gallery` ("G-NERIC CORP" office tower) | **Send City gym, The Cave gym, Your Gym, The Gallery, Games Venue, Olympic Training Center** |
| `me_bld_shop` ("HARDWARE", hammer) | **Gear Shop, Music Store, Swap Meet, National Team Store** |
| `me_bld_cafe` / `_coach` / `_setter` (same house, 3 roof colours) | **Coffee Shop, Bookstore, Grocery**, plus a decorative copy in Outskirts |
| `me_bld_warehouse` = mall building with fruit ads | **Courier Depot, Athlete Transit**, plus Outskirts decor |
| `me_bld_hangar` (quonset) | Warehouse job |
| `me_bld_clinic` (hospital, helipad, "EMERGENCY") | Physio Clinic |
| `me_trailsign` ("Camping ⛺") | Lake Overlook |
| Correct: Diner, Police, Fire Station, Hotel, Shopping Center (+ sign sprite), Office ("LIME CORP"), gas pump | — |

- **Decorative buildings that look enterable but aren't:** the Downtown DINER, the Trailhead barn, the Outskirts red house and mall, the Plaza clock tower, and the Notown mansion.
- **Scatter data** (`yv`, 12105; crag `Uu`, 13281 plus 34747–34763): 1,134 placements with fields `{sprite, fx, fy, h, flip, ground, wall}`.
  - The `trees` and `rocks` arrays are empty everywhere except 2 farm rocks, so the legacy tree/rock renderers `hU`/`uU` (13415/13434) are vestigial.
  - Paths are built by stamping `me_camp_dirt` (384×288 soft blob) **98 times**: 69 in the park, 9 at the Trailhead, 7 in the Outskirts.
- **Crag scenes** (`Uu`): layouts exist for local, gorge, mesa, windriver (= bigwall), hollow and seacliff. **Moonstone and Crucible fall back to `Uu.local`** and to grass ground (`oU` lacks them). The crag sprite `Ype` (34739) is `me_cliff_g` everywhere except the mesa. The road-trip scene shows a desert palette for Moonstone, then you arrive in a green meadow.

### 2.3 Movement, controls, collision, interaction [ESTABLISHED]

- **Joystick only** (`zye`, 104836):
  - Fixed position, 116 px, bottom-left, 46 px throw, 12% dead zone.
  - Analog: speed scales with deflection.
- **There is no tap-to-move.** Tapping a distant building toasts "Walk over to it first." (`RA`, 54576).
- **There is no keyboard control:** no Arrow or WASD handlers. Desktop players drag the joystick with a mouse.
- **Main loop** (38070–38527) runs one `requestAnimationFrame` loop for player, NPCs, crag critters, dog, partner and cars. Collision `X()` (38115) tests the player's feet (+32 px) against:
  1. Building footprints `Mq[art]` (16204, 28 fixed px boxes), using the **original** `To` coordinates.
  2. Per-sprite fractional boxes `AE` (11966, **137 hand-tuned entries**) against the *static* decor data.
  3. Hardcoded rects: the hedge garden in Old Town and Downtown only, the lake ellipse as 4 rects, and the Home Base fence.

  If a move ends inside a box, the player is shoved down up to 480 px (38167). Of 920 non-ground props, 728 have collision; hedge arches, graves, the farm tractor and others don't.
- **Zone change:** reaching within `nn = 34` px of an edge that has a neighbour transitions (38150). The whole edge is an exit, whatever fences or roads are drawn. Entry is 80 px in at the matching lateral fraction, with a 320 ms cooldown (`Mp`, 39300).
- **Proximity:** a building is "near" within `nearPx` (default `OE = 64`, 14515). That shows the CTA pill "Enter <name> ›" at `bottom:156` (58172).
  - The label is always `Enter ${name}`: "Enter Fishing Spot", "Enter Lake Overlook", "Enter Gas Station". Each building's own `action` verb is ignored except for mall shops.
- **Interiors:** 8 copy-pasted enter/exit functions with hardcoded return coordinates (54407–54546).
- **Zone is not saved.** Every load starts in the Lot at (0.46, 0.5) (35890, 38063).

### 2.4 NPCs, regulars, critters, cars, dog [ESTABLISHED]

- **12 NPC slots** (`S5`, 14692) filled per zone by `AS` (36620ff).
  - Filler counts come from `UU`: 1–12 per zone, 0 in Notown.
  - Priority slots go to the mentee, quest givers, the rival, the caravan, the "local" regular and crew partner 2.
  - Filler looks are random `cl_` layer composites (`BE`/`TB`, 14697/14802).
  - NPCs roam `fy 0.57–0.89` with a stuck-escape routine, and occasionally toast ambient chatter (45 s cooldown, 35%, within 70 px; 22713).
- **5 scheduled regulars** (`ZF`, 11757): Margie at the diner on weekday mornings, Deshawn at the Trailhead, Junie Downtown, Ray at the Roadside crag on weekends, Priya in Midtown.
- **Crag critters:** 4 slots (`P5`) with species per crag (`NZ`, 20863).
- **Farm:** Mom and Dad use `ME` walkers.
- **`EE` wander critters** exist only for items added in World Edit mode. None are shipped in the layout.
- **Traffic:** 1 car per street zone follows `Cj` polylines (11585), cycling 8 colours.
- **Your dog** follows at a distance of 42 px (38207).
- **Two different dog sprites exist:** `dog_sheet` (52×46 frames) for your dog and `wdog_sheet` (92×78 frames) for the critter dog.

### 2.5 Time of day, weather, seasons, holidays [ESTABLISHED]

- **Clock.** The game clock is real-time: **1 real second = 1 game minute** (`Epe`, 33983, via a 1 s interval at 38651). It pauses while any of 22 modal states is open (38626).
- **Tints** (`fZ`, 20720):

  | Hours | Tint |
  |---|---|
  | 5–7 | dawn orange, α 0.30 |
  | 7–9 | α 0.18 |
  | 17–18 | α 0.16 |
  | 18–20 | orange, α 0.30 |
  | 20–5 | blue, α 0.14 |

- **Night** (`rx`, 20–5) adds a half-resolution canvas (`bye`, 103240). It fills `rgba(15,20,46,0.9)` and cuts radial "light holes" at every lamp, at street-zone buildings, at the campfire and at the player. It redraws whenever the player moves. It is the best-looking thing on the map (`night_oldtown.png`).
- **Weather:** a rain overlay (animated CSS gradients) with a 0.36 blue tint, and a "hot" orange tint of 0.13 (`gZ`, 20735).
- **Seasons have no visual effect on the map.** There is no snow, no autumn palette, and the ground is fixed per zone. Seasons show only as the HUD label (`As`, 20389).
- **Holidays:** only "nightsend" (Halloween) is rendered, and only in Notown at night: 7 ghosts plus 5 wisps and a forebear's gold ghost (57122–57134).

### 2.6 Road-trip drive scene (`Cye`, 103849) [ESTABLISHED]

- Full-screen parallax: 3 sprite layers, CSS sky, ridge, road and ground bands, and 6 biome palettes mapped per crag (`jye`, `_ye`).
- A drive is 3,536 units at 520/s, about 6.8 s, with a "Floor it ▸▸" skip.
- A roadside stop is picked by `pB` (103838) with `Math.random`: 25% none; otherwise 55% chance of an unseen stop.
- Stops grant stats, for example "hotspring +18 energy, +14 skin, +12 psyche" (`gB`, 103825). **Cross-system:** this is non-deterministic gameplay in the presentation layer.
- **The van shown here is the legacy `van.png`** (98×49, resampled, 1,925 colours, drawn 2× at 96 px). It is a beige bus. On the map the van is `me_camper`, a white RV. Your van is two different vehicles (`drive_2.png`).

### 2.7 World Edit Mode and the "Tiled exporter" [ESTABLISHED]

- **Access.** Settings → WORLD EDITOR → Edit mode (93500), **available to every player** and not dev-gated.
- **State** is React-only (35955–35959): `is` moved, `gc` deleted, `pc` resized, `lf` added. **Nothing persists.**
- **Operations:**
  - Handles on every prop and building (`V2`, 102357).
  - Move by tap-to-place.
  - Resize in ÷/×1.12 steps (8–400 px).
  - Delete.
  - "+ Add Item" from a **163-item palette in 11 categories**, including Beach and Halloween (`uB`, 102380).
- **"Copy Layout"** (36006–36020) emits `trees/rocks/decor` JSON plus building moves, with the literal instruction "paste into a chat to apply". **The authoring pipeline is: drag on a phone → copy JSON → paste into an AI chat → source edited → rebuild.**
- **Edits don't carry through the rest of the game.** Collision still uses the static data, so moved props leave invisible walls and added props are walkable. Interior exit spawns stay hardcoded.
- **The Tiled exporter is not in the shipped bundle.** It is only mentioned in changelog v0.689 (34301), where it found the broken `me_tree_d` reference. [INFERRED] It is an offline dev script. It shows the owner already sees tile-based authoring as the fix.

### 2.8 Assets: packs, scales, usage, and *why the map looks inconsistent*

**Inventory [ESTABLISHED]:** 674 PNGs, 4.74 MB base64, inlined in `index.html`. Base64 by prefix: `me_` 2,013 KB, `cl_` 564, `grass` 357, `ext_` 341, `char` 188, `npc` 174, `mall` 132, `farm` 109, `oly` 70, `portrait` 66.

**Texel regimes, measured per sprite as the largest k where the image is k×k nearest-neighbour blocks [ESTABLISHED]:**

| Regime | Count | Who |
|---|---|---|
| ×2 (16-px art exported at "32 px") | 428 | `me_` 155/177, `ext_` 104/104, `farm_` 32, npc/char sheets, `critter_`, `hw_`, `cabin_` 14/15, `mall_` 36/47, `ui_` |
| ×1 native (true 1:1 pixels, few colours) | ~60 | **all 10 `diner_`**, 13 of 21 `cafe_`, mall walls and counter, `me_camp_dirt`, `me_lawn`, grass, deadground |
| ×3 | 108 | 62 `portrait_`, 36 `pg_` (32-px heads ×3), 5 `mall_gr_` grocery pieces |
| Resampled / non-pixel-art (hundreds to thousands of colours) | ~24 | legacy `tree`, `pine`, `house`, `gas` (6,787 colours), `warehouse` (10,356), `hospital`, `office`, `store`, `shop_red`/`green`, `gym`, `diner`, `van`, `bush`, `flowers`, `tuft`, `cliff`, `tent`; `me_cobble` (17,395); `dirt`, `sand`, `road`; `me_grass_*` soft decals |

**Sources [INFERRED from style plus the title credit "art: LimeZu"]:**
- LimeZu **Modern Exteriors**: `me_`, `ext_`, cars, and probably `farm_` and `hw_`.
- LimeZu **Modern Interiors**: `cabin_`, `mall_`, the character generator (`cl_` body/eyes/outfit/hair/acc = 10/7/20/29/14) and premade NPC sheets.
- A 32-px portrait generator (`pg_`/`portrait_`).
- Two animal sets.
- The pixel-frame UI set (`ui_`).
- A finer-grained 1× set (`diner_`, most `cafe_`), either a different pack or custom.
- The legacy resampled "icon buildings" from an older map.
- Procedural noise ground textures.
- CSS-drawn shapes.

That is **at least 8 visual sources.**

**Usage [ESTABLISHED]:**
- 654 of 674 sprites are referenced somewhere.
- **149 are referenced only by the World Edit palette.** That includes all 104 `ext_`; ~14 of the 149 are cars and critters also built dynamically.
- 20 are never referenced: `bush`, `cafe_piano`, `cafe_sofa2`, `cliff`, `farm_cow`, `farm_duck`, `hospital`, `me_atm`, `me_bld_market_a/b`, `me_flowerbush_c/d`, `me_hedge`, `me_phonebooth`, `me_pot`, `store`, `tent`, `tuft`, `ui_btn`, `ui_panel`.
- **Byte-identical duplicates:**
  - `cl_body_00 = cl_body_01`, so one of the 10 skin choices in the creator does nothing;
  - `me_bld_hotel = oly_hotel` (38 KB twice);
  - `mall_ic_menu = mall_register`;
  - `rock = me_rock_a`, `boulder = me_boulder_b`, `pg_hair_00 = pg_hair_12`, `me_flowerbed = me_flowerbush_a`, `cafe_plant2 = mall_plant`, `crop_p_carrot = crop_p_radish`.

**Why it looks inconsistent: the causes, with numbers [ESTABLISHED unless marked]:**

1. **Every sprite is sized by an arbitrary pixel height.** On-screen size of one *art* pixel = `block × (h / native_h) × camera`. The player is 2 × 1.0 × 0.55 = **1.10 CSS px**. On the same outdoor screen:

   | Sprite | CSS px per art pixel |
   |---|---|
   | Physio Clinic | 0.41 |
   | Gym / Warehouse / Courier / Games Hotel | 0.57 |
   | Hotel / Gallery | 0.63 |
   | Office | 0.72 |
   | Café / Grocery / Bookstore / hangar | 0.79 |
   | Police | 0.93 |
   | Diner | 1.03 |
   | Hardware | 1.15 |
   | Gas pump | 1.38 |
   | Crag boulders | 1.75 |
   | Farm soil beds | 2.41 |

   Street lamps range 0.65–0.87 and trees 0.78–1.10. **The clinic's pixels are 2.7× finer than the character's; the soil beds' are 2.2× coarser.** Relative scale breaks the same way: a fire truck (`me_fire_truck` at 0.39×) is barely longer than a parked sedan (0.70×), and the Plaza clock tower is shorter than the hotel.

2. **Interiors mix densities inside one room.** The diner furniture is 1× art drawn at camera 1.1, so 1.1 CSS px per art pixel. The characters in it are 2× art, so 2.2. The grocery crates are 3× art.

3. **Smoothing differs by object type.** Buildings, props, ground and the player are bilinear-filtered at non-integer ratios (0.55 camera × arbitrary `h` × DPR 2–3). Critters, dog and cars are nearest-neighbour. The same screen mixes soft and crisp pixel art (`05_crop_van.png`, taken at DPR 3).

4. **Non-pixel art sits under pixel art.** The ground is noise textures, including a 17k-colour cobble. Paths are soft blobs, the lake is a CSS gradient, and roads and crosswalks are anti-aliased CSS gradients. Every sprite also gets a soft CSS drop-shadow on top of its baked pixel shadow.

5. **Perspective is mixed.** Top-down cars share the Uptown lot with side-view fire truck and police car. The drive scene puts ¾-view trees beside a side-view road.

6. **Fractional coordinates meet fixed-pixel sprites.** The world scales with the viewport but sprites don't, so compositions are aspect-ratio-dependent. On desktop the Lot's camp breaks apart: the dirt patches detach from the tent and fire (`vp_desktop_lot.png`, world 3168×1980). On an iPhone SE they overlap (`zone_vp_se_lot.png`).

7. **Sprites were chosen for availability, not meaning.** See the signage table. Six decorative buildings read as destinations.

8. **The zones are one template.** Eight street zones share the crossroads, the building row at `fy 0.38`, the 18–24-lamp grid and the garden prefab. Nothing distinguishes Old Town from Downtown at a glance.

9. **The authoring tools cause drift.** Placement is by fraction and pixel height with no grid. Collision (137 `AE` entries and 28 `Mq` boxes) and display heights (`nU`) are hand-tuned per sprite. Edits round-trip through an AI chat. [INFERRED] Every new building is a new tuning problem, which is exactly the "hard to build consistently" the owner reports.

### 2.9 The UI shell [ESTABLISHED]

**Navigation model:**
- Map, then a building CTA, then that building's **action sheet**: one component with per-building rows (`fj`, 54660–56477; 166 rows, **113 distinct verbs**; the Van alone has 16 actions, ~256 words).
- Or the bottom-right ☰, which opens the **hub menu** (58705).

**Hub menu** (58705) has 3 tabs:
- **YOU** (10): You, Paths, Project, Gear, Pack, Van, Sponsors, Work, Body, Stats.
- **WORLD** (10): The Scene, Map, Crew, Mentee, Rival, Roadside, Guidebook, Expeditions, Calendar, Weather.
- **ACTIVITY** (8): Quests, Feats, Ledger, Hustle, Camera, Feed, Log, Diary.
- Plus ⚙ Settings.

Every panel is a bottom sheet with a pixel frame (`xe`, 103076), "‹ Back" and "Exit ✕".

**Surface count:** 183 fixed layers at `zIndex ≥ 45`. By category:
- Shell and meta: ~20. Title, New/Load, 3 save slots, mode select, 6-step creator, intro, What's New, privacy, terms, diagnostics, export/import, reset, welcome-back, Run Over, retirement.
- Hub panels: 28, plus about 10 sub-panels such as Project and Life List, Contradiction, and Crew naming.
- 1 action sheet × 52 buildings.
- 9 job-shift minigames (route setting, coaching, gear shop, office, guiding, fire & rescue, courier, warehouse, morning bar) plus 6 workplace event chains and the salaried offer.
- ~12 climbing beats and minigames: cold start, hold-to-load, crimp, dyno, crack, power mash, balance, sport pump, racking, spot, warm-up, league night.
- ~6 comp and Olympics screens.
- ~13 social and hobby minigames: guitar, ukulele, harmonica, busking, cooking, fishing and its log, photography, poker, blackjack, liar's dice, cribbage, trivia, horseshoes.
- ~40 story and event modals, including 12 "beat" types in the single `wl` queue: approach, breakdown, compDexBeat, compResult, daySummary, dogPrompt, encounter, menteeBeat, questOffer, quirkReveal, sessionRecap, storyBeat.
- 5 dev and editor layers.

**Roughly 150–180 distinct surfaces.**

**HUD** (57590–58212). Around 12 widgets on day 1, about 30% of the screen at the top and 20% at the bottom:
- 4 stat bars (`e3`, 104763): 142 px wide, 18 px tall, **8.5 px labels**, pulsing red "LOW" states.
- A clock/season chip, a weather chip ("Prime → Fair ▸"), a send-season countdown, mute, cash/debt, and injury/sick chips.
- The GET STARTED/GOAL pill. On a 390-px phone it truncates to "Step insi… 0/7".
- Up to 31 alert types, collapsible into "N alerts". Tapping one gives a glossary explanation (`Upe`, 34899).
- The teal direction marker, the CTA pill, the joystick and ☰.
- On the crag: a condition strip (prime temps | window | crowd | partner).
- **Inside interiors all stats, clock and cash are hidden** (`!ka(Re)`, 57590, 57615, 57850). You shop at the diner without seeing your hunger or money.

**Toasts and other transient layers:**

| Layer | Where | Behaviour |
|---|---|---|
| Text toast `_` | fixed `bottom:210`, `zIndex 60`, 13.5 px bold, max 86% width, tap to dismiss (95730–95784) | Queue max `YE = 4`, oldest dropped (38592). Merges into the showing toast if combined ≤ `GU = 46` words, ×0.82 duration (38583). Duration `max(950, clamp(600 + 165·words, 1400, 5200) × [1, .7, .52, .4][queued])` (14810–14820). |
| NPC chatter | `bottom:272`, `zIndex 59` | |
| Quest toast (`ku`) | top | 3.6 s |
| Celebration stamps (`tt`) | — | 84 call sites |
| Floating numbers, confetti bursts | — | |

Toast reading speed from that formula:
- A 23-word toast shows 4.4 s (314 wpm).
- The same toast with one queued behind: 3.1 s (449 wpm).
- A 45-word merged toast: 4.3 s (~605 wpm).

There are **~700 toast call sites** in the App component.

**Text density and type:**
- 2,506 `fontSize` declarations. Mode: 11 px (386). **32% are under 11 px, 12.9% under 10 px, 49 under 9 px.** Town Map zone labels are 8.5 px; the "HOME" and "VAN ONLY" tags are 7–7.5 px.
- Measured panel words, excluding the ~86-word HUD: Crew ~490 (3.4 screens of scroll), Feats ~440, Quests ~410, You ~330 (2.3 screens), Guidebook ~260, Gear ~230, Paths ~220.
- Descriptions are rich, with inline colour-coded cost tokens via `ER()` (34005): "-$18", "Required", "+15%", "worn to 40%".

**Theming: two UI languages.**
- The HUD, alerts, drive scene, dev and editor use a Tailwind dark-slate palette: `#0b1220`, `#1e293b`, `#94a3b8`, amber, teal.
- Panels, toasts and the creator use parchment with pixel border-images (`ui_panel_m`, `ui_btn_m`) and brown text.
- Elements without explicit colour inherit the dark theme's `#e2e8f0` body colour. Example: the action-sheet title (96338) gives **1.73:1 contrast on the parchment `rgb(197,174,146)`** (`sheet_van.png`).
- Dark navy buttons also appear inside parchment panels (Crew).

**Portrait-phone assumptions:**
- The manifest and TWA lock portrait.
- Offsets are fixed px: joystick 44–160, CTA 156, festival 190, toast 210, chatter 272 from the bottom; pill 98, alerts 124+ from the top; center pills get `calc(100% − 184 px)`, which is only 136 px on a 320-px phone.
- The world is rebuilt from the viewport on every resize (ResizeObserver, 38067).
- There is no max-width frame on desktop, so the map and bottom sheets stretch across 1440 px. Measured: the hub menu sheet is 1440 px wide (`vp_desktop_lot.png`, `vp_desktop_menu.png`).
- The CTA ignores the safe-area inset (58178).

**Town Map** (92235–92680):
- A static schematic of the `eU` grid: zone tiles with coloured category dots, a "you are here" pin, "The Crag — VAN ONLY", a 10-colour key, and search.
- Search matches name, act or job name and prints the next compass step (`XN`, 34152).
- **Not tappable. No fast travel.**
- Rows with a single zone (Park, Lake) are stretched full-width (11846 trims them), and their road stub is drawn under *Trailhead*. The map implies Trailhead connects south. It doesn't; see Bugs.

### 2.10 Onboarding flow and guidance systems [ESTABLISHED]

Word counts are measured page text. Each includes ~60 words of HUD bleed-through. The total is ≈1,700 words raw, ≈1,200 net.

1. **Title** (96859). Credits line at the bottom.
2. **New / Load.**
3. **"How do you want to climb?" Normal vs Free Solo** (100374). 273 words, irreversible, permadeath outdoors.
4. **Creator, 6 steps** (100608–101450):

   | Step | Options | Words |
   |---|---|---|
   | Origin | 6 | 327 |
   | Build | 4 | 190 |
   | Style | 4 | 218 |
   | Calling | 4 | 220 |
   | Flaw | 5 | 172 |
   | "This is you" (look × 5 selectors, skills, synergy warnings) | — | 129 |

   That is 1,920 build combinations before the look. Card text is 10.5–11.5 px. A second, *hidden* quirk is rolled later.
5. **Intro card** (101450): the backstory line plus "Joystick to walk; stand by a building and tap to act; walk off an edge… teal markers…". 178 words.
6. **In the world on day 1**, alongside the new-quest toast, Hazel and the HUD alerts. In the tested save the alerts were HOLIDAY, SEND DAY ("drop everything and get on rock"), and COMP in 3 days (`hud_alerts_open.png`). The guidance systems running at once:
   - **GET STARTED checklist** `h$` (34106): enter, work, eat, sleep, gymsend, rest, cragsend. Each completion toasts its `why` line (38595).
   - **Teal markers** `qr` (53358): a building target per step from `zpe` (34144): enter→**cafe**, work→cafe, eat→diner, sleep→van, gymsend→gym, rest→van, cragsend→gas. Shown as a bobbing ▼ over the building, or an edge arrow with the building's name.
   - **"Your First Season" quest**, 5 stages ($60 cash → 3 sends → 2 outdoor sends → 15 rep → V4).
   - **Goal ladder `$R`** (33877): 15 goals, which replaces the pill after onboarding.
   - **Hazel** `mpe` (33601): 9 lines, fired on entering the Lot, at most once per day, sharing the daily encounter slot.
   - **Tips** `Ope` (34020): 12 contextual "SOMETHING NEW" modals, one at a time.
   - **NEXT MOVE advisor** (53268–53357): ~20 prioritized rules, shown **only inside the You panel**.
   - **Calling "AMBITION"**, plus the alerts.

### 2.11 Accessibility settings [ESTABLISHED]

Settings live at 92689–93545; defaults in `mv` at 14063–14072.

| Setting | What it actually does |
|---|---|
| Text size S/M/L | 0.9 / 1.0 / 1.15 via CSS `zoom` on the root, with the world counter-zoomed. The 8.5-px HUD labels become 9.8 px at most. |
| High contrast | `filter: contrast(1.32) brightness(0.9)` on the root, inverse filter on the world. Not a theme. |
| Colorblind ("Blue/yellow/red status bars") | **Only the gear-condition bars** (`NN`/`V4`, 33096, used 94053–94307). The HUD bars are unchanged. The HUD's "LOW" text suffix provides some redundancy. |
| Reduce motion | Pauses ghosts, rain and wisps, confetti and shake, and fades. Default **off**; ignores `prefers-reduced-motion` except for button press. Cue bob, low-stat pulse and the NPC "?" bob keep animating. |
| Keep screen awake | Wake Lock API; disabled when unsupported. |
| Fast cards | Shorter AI pauses at poker and dice. |
| Guided markers | Turns the teal markers on or off. |

- 46 `aria-label`s, 2 `role`s.
- Every control is a real `<button>` (good).
- The map is inaccessible to screen readers.
- There is no keyboard play.

### 2.12 Audio [ESTABLISHED]

- **SFX synth** (33691–33876), oscillator-only:

  | Sound | Line | Call sites |
  |---|---|---|
  | `Pa` success chime | 33759 | 5 |
  | `sn` fail, sawtooth G3→D3 | 33765 | 23 |
  | `ke` UI blip, square 880→1175 Hz | 33775 | **136** |
  | `Ye` fanfare | 33792 | **97** |
  | `wpe`, `kpe`, `vpe`, `Spe` jingles | — | 1 each |
  | `K4` 22 ms tick on every button pointerdown | 38528 | — |
  | `CR` footsteps on frames 0 and 3 | — | — |

- **Ambience** (`_pe`/`Tpe`, 33837–33876): looped white noise through a 520/340 Hz low-pass (wind), a 1.4 kHz high-pass (rain), and a 68 Hz hum in the 6 "city" zones.
- **Defaults:** SFX 0.85, ambience 0.5, music 0.32.
- **Music** (`aB`/`sB`, 34765–34795): one looping `<Audio>` element (36498).
  - Title → `opening` (~100 s).
  - Free Solo → `danger` (~120 s) **everywhere**.
  - Crag → `overworld` (~70 s).
  - Lot → `sanctuary` (~60 s).
  - Notown, Downtown, Uptown → their own (~60 s each).
  - **Everything else → `main` (~128 s).**
  - All tracks are 64 kbps, ~598 s total.
  - Changing zone swaps `src` (36495), so the track **restarts with no crossfade**.
  - The MP3s are inlined in `__AUDIO__` (8.36 MB base64) and also shipped in `/music` (6.1 MB), which is only used as a fallback.
- **Credits:** "music: “Bitwise” by tcarisland (CC BY 4.0) · art: LimeZu" on the title screen (96917). Settings → Sound has a full attribution with links to the author, OpenGameArt and the license, plus "converted to MP3 and loudness-normalised; otherwise unchanged" (92853–92896). **This satisfies CC BY 4.0's attribution elements** [ESTABLISHED]. Store-listing credit is not verifiable here.

---

## 3. Content inventory

| Item | Count |
|---|---|
| Zones | 19 (12 town, 1 crag scene × 9 crags, farm, Olympic Village, 4 interiors) |
| Interactive buildings | 52 (25 in town zones; 20 in street zones, all at `fy 0.38`) |
| Decor placements | 1,134 (12 town zones 669; farm 128; Olympic Village 44; interiors 199; crag layouts 94, + 11 Psicobloc Cove added at 34748); incl. 202 street lamps, 98 dirt-blob stamps |
| Distinct decor sprites placed | 211 |
| Crag scatter layouts | 6 for 9 crags (Moonstone and Crucible reuse Roadside) |
| Collision tables | 137 per-sprite fractions (`AE`) + 28 building boxes (`Mq`) + 3 hardcoded rect sets |
| Sprites | 674 (4.74 MB base64); 20 unreferenced; 149 editor-palette-only; 10 byte-duplicate pairs |
| Character layers | body 10, eyes 7, outfit 20, hair 29, accessory 14 (+ none) ≈ 609k looks; portraits 62 + 43 layer PNGs |
| World Edit palette | 163 items in 11 categories |
| NPC slots / regulars / critter species | 12 / 5 / 6 |
| Car paths | 9 zones |
| Road-trip biomes / stops | 6 / 12 (9 named + diner, fuel, "dirtbag") |
| Hub panels | 28 + Settings |
| Building action verbs | 113 distinct (166 rows) |
| Modal layers | 183 (z ≥ 45); ≈150–180 distinct surfaces |
| Toast call sites / celebration stamps / alert types | ~700 / 84 / 31 |
| Buttons in code | 546 (the comment in the CSS says 186; stale) |
| `fontSize` declarations | 2,506 (32% < 11 px) |
| Onboarding | 7 checklist steps, 5-stage quest, 15-rung goal ladder, 9 Hazel lines, 5 Hazel mentor lessons, 12 tip modals, ~20 advisor rules |
| SFX / ambience layers / music tracks | 10 / 3 / 8 (~10 min total) |
| Accessibility toggles | 7 (+ 3 volume sliders) |

---

## 4. Bugs and defects

### Confirmed [ESTABLISHED]

| # | Defect | Where | Failing scenario |
|---|---|---|---|
| B1 | **The text toast sits on top of every panel and minigame and captures taps.** | 95730 (`bottom:210`, `zIndex 60`, `onClick` dismiss) vs minigames at z 46–48 | Enter the crag on a fresh save and start a boulder. "Doors are how this world works…" covers HOLD TO LOAD (`mg_1.png`). Pressing it dismisses the toast instead of loading. Same on the Diner encounter choices (`int_diner.png`) and the session list (`climb_1.png`). [INFERRED] On timed beats (pump) this costs the move. |
| B2 | **Unrelated toasts are merged into one blob.** | 38583 (`GU = 46`) | "You slow down enough to look… The mirror keeps them… Doors are how this world works…" shown as one 45-word toast for 4.3 s (`climb_1.png`). |
| B3 | Toast queue silently drops the oldest beyond 4. | 38592 (`YE = 4`) | On a busy morning (day summary, bills, weather, quest) earlier messages vanish unread. |
| B4 | Toast timing is ≈210 wpm (5 words) to 310 wpm (23 words), and 450–630 wpm when queued or merged; the changelog promises 200. | 14810–14820 vs changelog v0.686 (34325) | A 23-word toast with one queued shows 3.1 s (449 wpm). |
| B5 | **Town Map search gives dead-end directions.** | `XN` 34152 plus the grid holes | At Trailhead (exits ←Lot ↑Downtown →Outskirts), searching "fish" gives "Fishing Spot · Trout Lake · ↓ south". There is no south exit. The same happens via Outskirts, Downtown and Midtown. Reproduced. |
| B6 | Town Map draws Park and Lake as full-width rows with the road stub under Trailhead. | 11846, 92327 | The player reads Trailhead as the way to the park (`panel_world_map.png`). |
| B7 | **No building labels on the 23 "tall" building types.** | 104552 (`!R && !A`) | Downtown shows a gray "G-NERIC CORP" tower with no "Send City" label (`view_downtown.png`). |
| B8 | **Signage contradicts function** (6 G-NERIC CORP uses, 4 HARDWARE, 3 identical houses). | `tU` 11862 | A new player looking for the climbing gym sees an office tower and walks past it. |
| B9 | **Decorative "DINER" in Downtown**, next to the gym. | `yv.downtown` `me_bld_diner` (fx .36) | The player walks up and nothing happens; the real Diner is one zone west. |
| B10 | **Crash-pad hint points to the wrong "Gear Shop".** | 55813 hint; Old Town shop wares 11007; pad only in `mall_ge` (11356) | "V2 Warm Boulder · need a crash pad — Gear Shop". The Old Town Gear Shop doesn't stock one; it's in the Shopping Center (Market Row), $90. |
| B11 | Moonstone Boulders and The Crucible render the Roadside meadow. | `Uu` lacks them (56840 fallback); `oU` lacks them | Drive through the desert palette, arrive at green grass, a pond and pines. |
| B12 | Colorblind toggle doesn't affect the HUD bars it describes. | 93004; `NN`/`V4` only in Inventory | Red/green-deficient player turns it on; the HUD's yellow/red/orange/teal bars are unchanged. |
| B13 | Action-sheet titles are unreadable (1.73:1). | 96338 inherits `#e2e8f0` | "Your Van", "The Crag" in white on tan (`sheet_van.png`, `climb_1.png`). |
| B14 | One of 10 skin options is a duplicate. | `cl_body_00 == cl_body_01` (md5) | "Skin 1/10 → 2/10" shows no change. |
| B15 | Van is two different vehicles. | drive scene `Oe("van")` 104230 vs map `me_camper` | White RV on the map, beige resampled bus on the road. |
| B16 | Hedge-garden collision only in Old Town and Downtown. | 38105 `H()` | The identical gardens in Market and Plaza are walk-through. |
| B17 | **HUD hidden in interiors.** | 57590/57615/57850 | Inside the diner you can't see hunger, cash or the clock while ordering food. |
| B18 | Zone not saved, so reloading at the crag returns you to the Lot free. | 35890, 38063; `driveback` costs fuel and hours (52202) and can roll a walk-out "epic" (storm or dark descent, 47609 → `Zle` 27354) | Drive out, climb, close the app, reopen: you are home with no fuel spent, no hours, no epic roll. Economy cross-note. |
| B19 | Every CTA says "Enter <name>". | 58199–58209 | "Enter Fishing Spot", "Enter Lake Overlook", "Enter Gas Station". |
| B20 | Music restarts and hard-cuts on zone change. | 36495 | Old Town → Downtown → Old Town replays "main" from 0:00 each time. |
| B21 | "What's New" stops at v0.691; the build is v0.956. | `tB` 34286–34288 | 265 versions of changes are invisible to players. |
| B22 | Tutorial "enter" marker sends the player 3 zones to the Coffee Shop, though any building interaction satisfies it. | `zpe.enter = "cafe"` 34144; `RA` calls `Zc("enter")` for any building (54593) | The player crosses Trailhead and Downtown while the van is 50 px away. |
| B23 | "cragsend" has **no marker** at default fuel. | 53361 (null when fuel ≥ need) | The final step shows nothing pointing to Van → Plan a road trip, and no gear warning. |
| B24 | Layouts break across aspect ratios. | Fractional `fx/fy` × `Wd` × fixed `h` | Desktop Lot: camp elements drift apart (`vp_desktop_lot.png`). iPhone SE: tent overlaps van. |
| B25 | World Edit Mode is available to every player; edits are session-only; collisions don't follow edits. | 93500; 35955; `X()` uses static data | A player drags the gym and hits an invisible wall where it was. |
| B26 | Dev tools unlock for anyone via `?dev`. | 36138–36150 | `dirtbag.rcjlabs.com/?dev` gives +$10k, V16 skills, teleports. Tech and economy note. |
| B27 | Quests panel title overlaps the frame's left border. | Panel header at ~59491 | Visible in `panel_activity_quests.png`. |
| B28 | Interior exit spawns are hardcoded. | 54425–54546 | Moving the Diner (edit mode) still spits you out at `oldtown (0.886, 0.56)`. |

### Suspected [INFERRED]

- **S1.** On devices with DPR 2.625 or 3, bilinear upscaling at non-integer ratios makes character sprites visibly soft and shimmer while walking, since the camera 0.55 × DPR is fractional. The DPR-3 capture shows the softness; shimmer needs a device test.
- **S2.** 66–84 CSS `drop-shadow` filters plus a full-screen canvas redraw every frame at night (the `bye` loop redraws whenever the player moves) may cost frames on low-end Android TWAs. Tech lane to profile.
- **S3.** Encounter modals fire on zone entry: 15% per entry, 1 per day (`YJ`, 19944; chain at 41300). Combined with toasts, the first minutes are modal-heavy. See §6.

---

## 5. Balance and pacing (world and UI)

- **Traversal.** Computed from world geometry at 390×844 and 410 world px/s. The route shapes were confirmed by the automated walks.

  | Trip | Real time |
  |---|---|
  | Cross a street zone horizontally | ~3.3 s |
  | Cross a street zone vertically | ~4.4 s |
  | Van → Diner | ~7 s |
  | Van → Send City | ~8 s |
  | Van → Coffee Shop | ~10 s |
  | Van → Shopping Center | ~11 s |
  | Van → Notown | ~18 s |

  At 1 real second = 1 game minute these trips cost only 7–18 game minutes. [INFERRED] Walking is cheap in time but costly in **attention**: joystick steering, collisions (the van box traps you, `stuck_oldtown.png`), unlabeled buildings and zone edges.
- **The real-time clock** runs only outside 22 modal states. A game day from 8:00 to 23:00 is ~15 real minutes if idle. Actions (shifts, sessions) jump hours instantly, so the clock mostly matters while walking.
- **Early game** (days 1–3):
  - The map *is* the game: 25 destinations across 12 zones.
  - The player is guided by eight overlapping systems.
  - Every building entry can raise an encounter, a toast, a tip, a Hazel line or a quest pill.
  - Measured in my runs: on day 1 a single building entry produced an encounter modal plus an onboarding toast on top of it.
- **Mid game:** play collapses to a Lot ↔ gym ↔ van (road trip) loop. The town's other 9 zones become errands: groceries, clinic, police tickets, mall gear.
- **Late game:** menus dominate (expeditions, Olympic Village, sponsors, gym ownership). The town never evolves with progression except the Home Base fence and cabin and Your Gym's existing building.
- [INFERRED] **The map's value declines over a run while its maintenance cost stays constant.** A node or hub map with unlockable areas would scale better with progression.

---

## 6. UX and clarity from the player's seat

A new player's first 20 minutes, as observed in the headless playthrough:

1. **Wall of choices before play.** The Normal/Free Solo decision comes before anything is known. Six creator screens of 10.5–11.5 px stat text follow ("+2 END +2 HEAD · ✦ FOR GOOD — …"). A lot of good writing, but ~1,000 words stand between PLAY and the first step.
2. **Day 1 sends conflicting signals.** The HUD says GET STARTED "Step insi…" (truncated). The alerts say SEND DAY "drop everything and get on rock", HOLIDAY, COMP in 3 days. A new-quest toast and "Coffee Shop ▶" arrow appear. The van is right there, but the arrow says go three zones east.
3. **Finding things.**
   - Buildings have no names and misleading signs.
   - The Town Map shows coloured dots, not names, until you search.
   - Tapping a building from afar only says "Walk over to it first."
   - Downtown's "DINER" is fake.
   - [INFERRED] This is the single biggest "where am I, what is this" moment.
4. **Interrupted interactions.** Toasts land mid-screen over the choices and controls you're using. Encounter modals fire on building entry. The HUD vanishes indoors.
5. **Getting to real rock.**
   - The last tutorial step has no marker.
   - The crag's session list shows every boulder as "need a crash pad — Gear Shop", in red.
   - The obvious Gear Shop (Old Town) doesn't sell one.
   - Sport routes need rope ($110) and harness ($65).
   - [INFERRED] A new player at the crag can do nothing but warm up, after spending fuel to get there. This is where many will quit or feel cheated. Economy and climbing agents should weigh a starter pad, a pad rental, or a no-gear first line.
6. **Climbing looks like a form.**
   - The crag is a rock pile in a meadow. The session is a list.
   - The move is a vertical LOAD meter in a card (`mg_hold_1.png`, "Barreled off!").
   - The move framing "THE HEADWALL · MOVE 1/3" is evocative, but nothing on screen shows a wall, a climber or height.
7. **Reading load.**
   - The body copy is 11–13 px.
   - The panels scroll 2–3 screens.
   - Multi-colour inline tokens are helpful but noisy.
   - The HUD's 8.5-px labels are below mobile legibility norms. Apple HIG's 11 pt minimum is a reasonable yardstick.
8. **Desktop web** (dirtbag.rcjlabs.com): stretched world, no keyboard control, full-width bottom sheets.

---

## 7. Overlaps, bloat, dead and vestigial systems

- **Two road systems:**
  - `xye` narrow road plus `kye` driveways (legacy), still drawn in Uptown, Market, Plaza and Olympic Village under the `fU` crossroads;
  - `fU` crossroads (current).
- **Tree and rock arrays** (`hU`/`uU`, `om.tree`/`om.rock`): all empty except 2 farm rocks. `yye` returns null.
- **Legacy resampled building icons** (~250 KB base64): mostly unused.
- **Editor-only `ext_` pack** (341 KB): shipped to every player for a dev tool.
- **Duplicate sprites:** 10 pairs, including a 38 KB hotel.
- **Music ships twice:** `__AUDIO__` plus `/music`.
- **Guidance systems:** 8, overlapping (see §2.10). The NEXT MOVE advisor, the best of them, is buried in the You panel.
- **Status surfaces:** HUD alerts (31 types), toasts, quest pills, celebrations, day summary, session recap, Diary and Feed all report overlapping events.
- **Hub panels:** 28, with overlaps:
  - Log vs Diary vs Stats vs Feats;
  - Ledger vs Work vs Hustle;
  - Van vs Gear vs Pack;
  - Scene vs Crew vs Rival vs Mentee;
  - Calendar vs Weather.
- **Two "Gear Shop"s; two dog sprites; two vans.**
- **Eight interior enter/exit functions**, copy-pasted with hardcoded coordinates.
- **Collision-by-table** (137 + 28 + hardcoded rects): a maintenance sink that a tilemap collision layer replaces.

---

## 8. Opportunities: IMPROVE / CHANGE / CUT / ADD

Ordered by priority within each group. Effort: **S** ≤ 2 days, **M** ≤ 2 weeks, **L** > 2 weeks, for a solo dev.

### IMPROVE: live-game quick wins (do these regardless of any rebuild)

1. **Toasts (S).**
   - Move them to a top lane below the HUD with `pointer-events: none`.
   - Hold the queue while any modal or minigame is open (reuse the 22-flag `US` gate).
   - Never merge unrelated lines.
   - Raise the queue limit and route overflow to the Diary.
   - Use ~300 ms/word with a 2.5 s floor, and fix the changelog claim.
2. **Name every building (S).** A pixel nameplate under each `E3` building, plus a category icon from the Map key colours.
3. **Fix signage (S–M).**
   - Remove the Downtown decorative DINER and the other decorative "destinations".
   - Give climbing gyms a unique sprite, even an edited sign: "SEND CITY", "THE CAVE".
   - Re-sign HARDWARE for the Gear Shop ("GEAR") and give the Music Store and Swap Meet distinct fronts.
   - Rename the mall store ("Summit Outfitters") and make the pad hint name it.
4. **Crisper rendering (S).** Set `image-rendering: pixelated` on the world container. Snap display heights so `h/native_h × block` is an integer multiple for each sprite family, targeting 1 art px = 2 world px. Cut the CSS drop-shadows on sprites that have baked shadows.
5. **Onboarding re-point (S).**
   - Aim "enter" at the van.
   - Add a cragsend marker to the Van → Plan a road trip.
   - Suppress SEND DAY, COMP and HOLIDAY alerts and random encounters until the checklist is done, or at least days 1–2.
   - Surface NEXT MOVE as the HUD pill after onboarding.
6. **Town Map (S).** Fix the Park/Lake alignment and the `XN` routing: BFS on the `ns` graph instead of grid deltas. Make results and zone tiles tappable to show directions.
7. **Accessibility (S–M).**
   - Make the colorblind toggle affect the HUD: shape or icon on each bar, colour-safe palette.
   - Default reduce-motion from `prefers-reduced-motion`.
   - Text size up to 1.3 via reflowing type tokens, not `zoom`.
   - Minimum 11 px for HUD labels, 13 px body.
   - Explicit title colours on parchment.
   - Keep the HUD in interiors.
   - Arrow/WASD movement on desktop.
8. **Housekeeping (S).**
   - Gate World Edit and `?dev` behind a build flag.
   - Update What's New.
   - Drop unused, legacy and editor-only sprites from the player bundle.
   - Dedupe the `cl_body` skin and the hotel sprite.
   - Save the current zone, or require the drive back.
   - Add Moonstone and Crucible scatter.
   - Use the building's `action` verb on the CTA.
9. **Music (S).** Crossfade between tracks, don't restart the same track, and give Park/Lake/Trailhead their own mood. Free Solo should alternate tracks.

### CHANGE: the visual and UI direction (the rebuild decision)

**Options weighed:**

| Option | What | Solo-dev cost | Mobile readability | Climbing theme | Sellability / distinctiveness | Ongoing cost per new place |
|---|---|---|---|---|---|---|
| A. Cohesion pass on the current walkable town | Same 12 zones, one LimeZu grid at integer scale, Tiled-authored, canvas renderer, correct signs, labels | M–L (3–8 wk) | Joystick plus unlabeled-at-a-distance buildings remain | Generic modern city; no climbing buildings in the pack | Low: LimeZu is ubiquitous on itch/Play [INFERRED] | High: sprite hunting and edits, collision, layout |
| B. Stick-RPG single-screen hub | 1–2 hand-composed screens, tap-to-go | M | Good, but 25 buildings on one phone screen means ~70-px buildings | Neutral | Medium | Medium |
| **C. Topo-guidebook valley map + illustrated place cards (recommended)** | Vector "guidebook approach map" of the valley (contours, highway, trails, P markers, crag icons, the town as labeled blocks). Tap a pin, see travel time and cost, the van/climber animates along the road, and a place card opens (header illustration + the existing action list). Two small walkable *camp* vignettes (the Lot at night, the crag base) in one tileset at one integer scale. **Per-crag topo drawings** double as the climbing-session screen. | M–L (6–10 wk incl. art) | Best: all destinations visible, big targets, no joystick, resolution-independent | **Native**: topos and approach maps are climbing's own visual language | High: distinctive store screenshots; reads "climbing game" in one glance | **Low: a pin + a card (+ a topo for a crag)** |
| D. Van-dashboard diegetic UI | Everything framed from the driver's seat | M | Constraining for town activities | Strong van-life flavour | High | Medium |
| E. Illustrated isometric diorama town | Commissioned painted town | L+ ($$) | Good | Neutral | High | High |

**Recommendation: C, built in phases, with D as an accent for the Van screen and A's quick wins applied now.** Reasons:

1. **It removes the cause, not the symptoms.** The map's job is a readable menu of 25 destinations plus ambience. C does that with one illustration style and no sprite scaling, collision tables, fractional layouts or AI-chat layout loop.
2. **Mobile-first.** Tap a pin and go. Nothing is hidden under the HUD. It's the same on every aspect ratio, including desktop and a future tablet.
3. **Theme and marketing.** Every climber owns guidebooks. A topo map, route lines with bolts and belays, and approach trails read as authentic and are instantly screenshot-able. Route topos also fix the crag's biggest failure: the climbing screen can show *the line*, the moves and your high point on it. That is the 2D analogue of the Unreal plan's "3D staging".
4. **It scales with progression.** New crags appear as pins, the Big Stone and expeditions open a second, continental map, and seasons repaint the palette. Night and weather tints and the light-pool effect carry over.
5. **It transfers to the Unreal project.** The UE design is "2D minigames, 3D staging" with a small stylized town. A guidebook/topo UI language (map, place cards, route topo with move counter and pump bar) can be the *same* UI system in both products, one brand. LimeZu pixel art cannot transfer.
6. **What you lose, and how to keep it.** Walking around goes. Keep it where it matters socially: the Lot camp (fire, dog, neighbours, Hazel) and the crag base (partners, critters, the dog), as small hand-authored vignettes in a single tileset at one integer scale. These can be authored in Tiled; the owner already has an exporter. NPC chance encounters move onto place cards as "Who's around", the pattern the café already uses at 55100–55129.

**Phasing and effort:**

| Phase | Work | Effort |
|---|---|---|
| C1 | SVG valley map with 25 pins (and later crags); tap-to-travel with time cost; route the existing action sheets from pins; delete joystick, collision and zone plumbing from the town. The camp vignettes can temporarily be the current Lot and crag scenes. | M |
| C2 | One UI theme ("guidebook paper": parchment, ink, one accent per category); type scale (≥13 px body, ≥11 px captions); bottom tab bar replacing the 28-item grid (below); toast lane and Today log. | M |
| C3 | Place-card header illustrations (~25) and a topo per crag (9) plus an animated session topo (climber dot, move markers, pump bar, fall/send staging). | M–L (commission or self-made flat vector) |
| C4 | Camp vignettes rebuilt in one tileset at one scale; day, night, weather and seasonal palettes on map and vignettes. | M |

**Navigation restructure** (applies to A or C): **5 tabs**, replacing the 28-panel grid.
- **Map**
- **Climb**: Projects, Log, Guidebook, Training
- **Body**: You, Body, Paths
- **People**: Crew, Rival, Mentee, Scene, Feed
- **Life**: Money (Ledger, Work, Hustle, Sponsors), Van (Van, Gear, Pack, Road trip, Expeditions, Dream), Story (Quests, Diary, Feats, Stats)
- Settings behind a gear icon.

The NEXT MOVE card sits permanently on the Map tab.

### CUT

- **Free Solo choice at new game (S).** Move it to after the first retirement or first season. The UE concept doc already defers Solo mode past 1.0.
- **Creator steps (S–M).** Keep Origin, Calling and Look up front. Derive Build, Style and Flaw, or put them behind "Customize" with sensible defaults.
- **Duplicate guidance (S).** Fold the goal ladder into NEXT MOVE. Show tips inline in the relevant panel rather than as modals. Hazel becomes the single onboarding voice.
- **Editor palette and `ext_` assets in the player build (S).** Legacy road renderers, empty tree/rock systems, unused sprites.
- **Decorative buildings** that look enterable.

### ADD

- **Tap-to-go (S–M, if option A is chosen).** Tap a building → auto-walk along a nav grid.
- **Keyboard controls and a desktop phone frame (S)**, if staying on the walkable map.
- **"Today" log (S).** A scrollable ticker of every toast, day summary and alert: the Diary, surfaced.
- **Seasonal palettes (S–M).** Grass tint per season, snow overlay in winter, autumn trees. The data already has `As`.
- **Crag identity (M).** Distinct scene or topo per crag using its rock type (`wo.rock`: granite, quartzite, sandstone), climate and the shade window. The prime window can visibly move as a shade line on the topo.
- **Audio (M).** Longer or more tracks. [INFERRED] An acoustic/lo-fi palette fits dirtbag life better than chiptune, which matches the pixel era but not a topo aesthetic. Add climbing foley (chalk, breath, clips) in the session screen. Keep the synth for UI.

---

## 9. What's strong and must be preserved

- **The writing voice** everywhere: toasts, Hazel, creator cards, alert glossary, roadside stops ("It is not. Probably."). The copy is the game's best asset.
- **The action-sheet model.** Verb + hint + inline cost tokens (`ER()`, 34005) such as "-$18/night + bills land too · full energy". 113 verbs presented clearly. Keep the pattern and restyle it.
- **The minigame verbs and move framing.** "THE HEADWALL · MOVE 1/3", HOLD TO LOAD / release, "Barreled off!". These are exactly what the UE Phase 0 is testing; stage them better, don't replace them.
- **Night lighting and weather overlays.** Cheap and atmospheric (`night_oldtown.png`). Carry the idea to any new map.
- **Glossary-on-tap for alerts** (`Upe`), the **NEXT MOVE advisor** (~20 rules), the **day summary** and the **session recap**.
- **Town Map search.** A good idea; make it route correctly and travel.
- **Interiors** (the Diner especially): the most cohesive art in the game.
- **Character layer system and portraits.** Great for UI faces and dialogue even if the world art changes.
- **Settings breadth for a solo dev.** Three volume channels, text size, reduce motion, high contrast, colorblind (once fixed), keep awake, fast cards, 3 save slots, export/import codes, diagnostics copy, privacy and terms in-app.
- **License hygiene.** Correct CC BY 4.0 attribution with links and a change note; the LimeZu credit on the title screen.
- **Tiny, cohesive UI SFX** (WebAudio synth) and the road-trip drive scene: charming, cheap, on-theme. Fix the van sprite.

---

### Evidence files (all in `$SP/work-worldui/shots/`)

| What | Files |
|---|---|
| Zone overviews | `zone_lot/oldtown/downtown/midtown/trailhead/outskirts/uptown/notown/market/plaza/park/lake.png` |
| Player view | `view_*.png` |
| Mixed pixel density at DPR 3 | `05_crop_van.png` |
| Aspect-ratio breakage | `vp_desktop_lot.png`, `zone_vp_se_lot.png` |
| Asset contact sheets | `sheet_bld.png`, `sheet_legacy.png`, `sheet_me_misc.png`, `sheet_ground.png`, `sheet_interior.png`, `sheet_mall.png`, `sheet_ext.png`, `sheet_chars.png`, `sheet_critters.png`, `sheet_ui.png` |
| Toast collisions | `mg_1.png`, `climb_1.png`, `int_diner.png`, `sheet_van.png` |
| Day-1 alerts | `hud_alerts_open.png` |
| Crag | `crag_local.png` |
| Minigame | `mg_hold_1.png` |
| Night | `night_oldtown.png` |
| Drive scene | `drive_2.png` |
| Town Map | `panel_world_map.png` |
| Panels | `panel_*.png` |
| Creator | `02_*.png` |
| Getting stuck on the van | `stuck_oldtown.png` |

Scripts that produced them: `lib.js`, `nav.js`, `tour*.js`, `ui*.js`, `dev*.js`, `analyze.js`, `scale.js`, `mapconst.js`. Per-sprite pixel analysis is in `analysis.json`.
