# Dirtbag: Market Research Report

**Prepared for:** Evan / RCJ Labs
**Date:** 2026-09-28
**Covers:** the 2D game (dirtbag.rcjlabs.com v0.956, free offline portrait PWA plus Google Play TWA `io.github.rcjlabs.dirtbag`) and the early Unreal reimagining (`Dirtbag-UE`, Phase 0).

---

## How to read this report

**Method and limits.** Web search worked. Direct page fetching did not. This session's egress policy blocked every domain I tried to fetch: store.steampowered.com, wikipedia.org, gamedeveloper.com, pushsquare.com, wnhub.io, itch.io, opengameart.org and howtomarketagame.com. So figures come from search-engine summaries of the linked pages, retrieved on 2026-09-28. The links are the pages those summaries describe. Open them to check any number before you quote it publicly or build a spreadsheet on it.

**Labels used:**
- **Sourced:** a claim with a link and no label. It comes from the linked page as the search result summarised it.
- **[Estimate]:** a number from a third-party model (SteamSpy, Gamalytic, VG Insights, games-stats and similar trackers) or from my own arithmetic. Treat these as orders of magnitude.
- **[Inference]:** my own reasoning, not a fact from a source.
- **[Unverified]:** something I couldn't confirm, or a number that came from a low-reliability aggregator.

The repo findings (Olympic strings, credits, privacy policy) came from reading the local build. Paths are in Appendix A.

---

## Executive summary

1. **Climbing games are selling right now, but every hit sells the act of climbing, not the life around it.** PEAK ($7.99) sold 11M+ copies. Cairn ($29.99) sold 500k+ within about two months of its January 2026 launch. A solo dev's A Difficult Game About Climbing made about $2M gross [Estimate]. Each of these sells physics, co-op or survival on the wall. None of them sells the van, the shifts, the money, the partners or the sandbagged grade. That space is still empty, and it is what Dirtbag already is [Inference].
2. **The climbing audience is real, engaged and finite.**
   - North America has 900+ climbing gyms, a net gain of 4.7% in 2025.
   - The US had about 6.4M indoor-climbing participants in 2023.
   - The world federation claims about 25M regular climbers globally.
   - About three-quarters of the Climbing Wall Association's 2026 survey respondents climb twice a week or more.

   Games that appeal only to climbers stay small, though. New Heights, a realistic climbing sim, has about 250 Steam reviews. **Climbers are the entry point. Life-sim and cozy players decide how big the game can get** [Inference]. Your own UE plan says the same thing ("Niche ceiling", `concepts/DIRTBAG-PLAN.md`).
3. **Recommended model: a free first season, then one purchase for the full game, with no ads, no extra IAP and no tracking.**
   - **Steam at $9.99** is the main revenue bet.
   - **A $4.99 one-time unlock on Android and iOS.** This copies Grand Mountain Adventure: first mountain free, one purchase, no ads, 20M+ downloads.
   - **An itch.io supporter edition.**

   The free browser build becomes the demo and the main marketing tool.
4. **Google Play has two constraints:**
   - **The listing can't go paid.** Play doesn't let a published free app become paid, so the existing listing needs an in-app unlock.
   - **The TWA can't gate content.** It loads the public website, so anything "unlockable" is also reachable in any browser. For a real gate, ship Android as a bundled native wrapper under the same package name and signing key, or accept an honor-system gate [Inference].

   **Fees are lower now.** Since 2026-06-30, Google's fee in the US/UK/EEA is 10% on your first $1M a year, plus a 5% billing fee if you use Play Billing. That's about 15% in total.
5. **Steam timing:**
   - **October 2026 Next Fest is closed.** Registration ended 2026-08-31.
   - **The next realistic one is 22 Feb – 1 Mar 2027.** Registration closes 2027-01-10.
   - **Put the Coming Soon page up now,** because wishlists take time to build.

   **Benchmarks:**
   - About 7k wishlists gets a game onto "Popular Upcoming".
   - Median first-week sales are about 0.15× the wishlist count.
   - The median Next Fest demo in October 2025 gained fewer than 500 wishlists. The top 10% gained about 3k.
6. **The free, no-signup, no-ads browser build works as a link everywhere:**
   - **Reddit:** r/climbing has about 1.6M members and r/bouldering about 488k.
   - **Gyms:** QR posters at the front desk.
   - **Climbing media:** Climbing.com and Gripped both reviewed Crux, a small mobile climbing puzzle game.
   - **Film tours:** REEL ROCK 20 opens 22 Oct 2026. Kendal Mountain Festival runs 19–22 Nov 2026.
7. **Legal risks found in the shipping build:**
   - **"Olympic" is the top fix before you sell.** It appears in a location name ("Olympic Village"), an achievement ("Olympic Medalist"), a reputation tier ("Olympic Hopeful") and "Road to the Olympics". US law gives the USOPC exclusive commercial rights to the word, without needing to show confusion.
   - **The trivia is out of date.** It names the IFSC, which renamed itself World Climbing on 2025-12-10.
   - **"Dirtbag" on its own can't be owned as a name.** DIRTBAG trademarks already exist, "dirtbag MAHJONG" is on Steam, and there's the Dirtbag Diaries podcast. Use a distinctive full title and run a clearance search.
   - **LimeZu's paid packs allow commercial use.** They don't allow resale or redistribution, and the free versions are for private or non-commercial use only.
   - **The CC BY 4.0 music is already credited correctly.** Two things to watch are the licence's clause against technical restrictions (DRM) and false YouTube copyright (Content ID) claims.
8. **The UE plan's competitor analysis is out of date.** `concepts/DIRTBAG-PLAN.md` (2026-08-15) mentions Jusant and New Heights but not Cairn or PEAK. Its argument that "nothing like it exists" in 3D needs a refresh. Sell the 2D game first, and let its wishlists and sales decide how much to put into UE [Inference].

---

## 1. Comparable games

Each entry lists the business model, price, platform, public reception or sales, and one lesson for Dirtbag. Colony and base-builders like Surviving Mars are left out, as the brief asked: the fantasy and the audience are different.

### 1.1 The life-sim ancestors and text-heavy life-sims

| Game | Model / price | Platform | Reception / sales | One lesson for Dirtbag |
|---|---|---|---|---|
| **Stick RPG** (2003; *Complete* 2005, XGen Studios) | Free Flash game on portals | Browser (Newgrounds, XGen) | 1M plays in its first month. A fan wiki claims 37M+ plays [Unverified]. Founder Skye Boyes went full-time on the back of it. ([XGen](https://en.wikipedia.org/wiki/XGen_Studios), [Flash wiki](https://flashgaming.fandom.com/wiki/Stick_RPG)) | A free, instant, browser-playable sandbox of stats, jobs, money and days is a distribution engine. **Dirtbag's free PWA plays this role today, so keep a generous free slice.** |
| **Stick RPG 2** (2010) / **Director's Cut** | Free web version plus a **paid Director's Cut**. $19.95 list, often discounted to about $7.99. On Steam since about 2014. | PC/Mac, Steam | About 1k Steam reviews, 86% positive ([Steambase](https://steambase.io/games/stick-rpg-2-directors-cut/steam-charts)). About $360k Steam revenue [Estimate, [games-stats](https://games-stats.com/steam/game/stick-rpg-2-directors-cut/)]. The Director's Cut adds 25 careers, new areas, quests and saving ([XGen](http://www.xgenstudios.com/stick-rpg-2/), [Steam forum](https://steamcommunity.com/app/307640/discussions/0/3041607080050621182/)). | "Free web plus a paid expanded edition" works when the paid edition has obviously more. It also shows the ceiling for a portal-era life-sim: hundreds of thousands of dollars, not millions [Inference]. |
| **BitLife** (2018, Candywriter) | Free-to-play with ads, which were about 62% of revenue at the 2020 acquisition. IAP includes God Mode at about $9.99 and Bitizenship at about $7.99 [Unverified, [fan wiki](https://bitlife-life-simulator.fandom.com/wiki/Bitizenship)]. | iOS / Android | 42M downloads, about $26M revenue in 2019, 1.2M daily and 7.8M monthly active users. Stillfront bought Candywriter for $74.4M up front, plus up to $120.6M in earn-outs ([Game Developer](https://www.gamedeveloper.com/business/stillfront-group-acquires-casual-game-maker-candywriter-for-74-4-million), [PocketGamer.biz](https://www.pocketgamer.biz/stillfront-group-acquires-bitlife-developer-candywriter/), [ads share](https://medium.com/@SEgames/stillfront-group-acquires-bitlife-developer-candywriter-92eb08532a5d)). | Text life-sims can go mass-market on **shareable, absurd life stories**. The money there comes from ads and IAP, which require tracking, and that's exactly what Dirtbag's privacy stance rules out. **Borrow the shareable-story hook, not the monetisation.** |
| **Reigns** (2016, Nerial / Devolver) | Premium, $2.99 | iOS / Android / Steam | 600k sold in about a month, 2M by 2019, mostly on mobile ([PocketGamer.biz](https://www.pocketgamer.biz/news/63976/tinder-esque-indie-strategy-reigns-600000-downloads/), [Game Developer](https://www.gamedeveloper.com/business/-i-reigns-i-sells-big-on-mobile-proves-premium-games-can-still-be-king)) | Short, voice-driven, text-heavy choices **can sell at a premium price on mobile** when the hook fits in one sentence. |
| **A Dark Room** (Doublespeak) | Free web original, then premium on iOS | Web, iOS, Android | Went viral with no Apple featuring. It reached #1 among paid apps on the US App Store (reportedly for 18 days) and #2 on Google Play. $697k gross and 2.26M downloads over two years ([Game Developer](https://www.gamedeveloper.com/business/a-two-year-look-at-the-sales-of-chart-topping-ios-title-i-a-dark-room-i-), [Pocket Gamer](https://www.pocketgamer.com/a-dark-room/the-co-creator-of-top-selling-ios-game-a-dark-room-shares-its-sales-numbers-and/)) | The exact path Dirtbag is on: **a free web original funnelling into a paid mobile edition.** |
| **Kingdom of Loathing** (2003–) / **West of Loathing** (2017) | KoL: free, no ads, funded by donations ($10 buys a "Mr. Accessory"). WoL: premium, deliberately priced at about $10 instead of $20. | Browser; PC | Donations paid for full-time staff ([Engadget](https://www.engadget.com/2010-11-16-the-game-archaeologists-fear-and-loathing-in-the-kingdom-joshi.html)). WoL beat its 50k lifetime sales target within weeks ([Campo Santo](https://quarterly.camposanto.com/behind-west-of-loathing-with-zack-johnson-a63669a76ec), [pricing](https://www.gamedeveloper.com/business/why-i-west-of-loathing-i-s-devs-priced-their-20-game-at-just-10)). About $1.1M gross [Estimate]. | **A distinctive voice builds a paying community.** Dirtbag's dry, wry voice is its strongest defence against copycats. A "support the dev" option fits the privacy stance. |
| **Citizen Sleeper** (2022, solo dev) | Premium, about $19.99 [Unverified] | PC / consoles | 1M players; the dev "really thought this game was going to be niche" ([GWO](https://gameworldobserver.com/2024/09/12/citizen-sleeper-1-million-players-jump-over-the-age)) | A game about **precarious work and scraping by** can reach well beyond its niche, which is thematically close to shifts versus sessions. |
| **Lake** (2021, Gamious) | Premium, $19.99 | PC / consoles | Very Positive on Steam, about 5.7k reviews; Metacritic 70 ([Steambase](https://steambase.io/games/lake/reviews), [Metacritic](https://www.metacritic.com/game/lake/)) | A small slice-of-life job loop (delivering mail) plus a town full of characters sells on warmth, even when critics are lukewarm. |

### 1.2 Climbing games

| Game | Model / price | Platform | Reception / sales | One lesson for Dirtbag |
|---|---|---|---|---|
| **Cairn** (The Game Bakers, 29 Jan 2026) | Premium $29.99 (Deluxe $36.99) ([MonsterVine](https://monstervine.com/2025/12/cairn-release-date-ps5-steam-january-2026/)) | PC (Steam, Epic, GOG) / PS5 | 100k copies on day one, 300k in the first week, 500k+ by about two months ([PSU](https://www.psu.com/news/the-game-bakers-confirms-cairn-has-now-sold-300000-units/), [WN Hub](https://wnhub.io/news/finance/item-50427)). 94% positive from 13.8k Steam reviews; Metacritic 82–85 ([Mix Vale](https://www.mixvale.com.br/2026/02/04/cairn-for-ps5-reaches-an-85-on-metacritic-and-becomes-the-most-acclaimed-game-of-the-beginning-of-the-year-en/)). The demo was downloaded 600k times, rated 99% positive, and appeared in **18 Steam festivals**. About 500k wishlists before launch ([GameDiscoverCo](https://newsletter.gamediscover.co/p/how-cairn-grabbed-500k-demo-downloads)). | **Climbing plus resource management on the wall is proven.** A demo released a year before launch, a long festival circuit and a localised demo all compounded. Cairn stayed on the Spanish, Russian and Chinese Steam front pages after English featuring ended. |
| **PEAK** (Aggro Crab + Landfall, June 2025) | Premium $7.99 ([Noisy Pixel](https://noisypixel.net/peak-coop-climbing-game-launch-steam/)) | PC | 1M in 6 days, 10M by August 2025, 11M+ later ([PC Gamer](https://www.pcgamer.com/games/im-gonna-crash-out-new-climbing-game-peak-has-sold-1-million-copies-in-less-than-a-week-outperforming-its-developers-most-popular-game/), [GamesRadar](https://www.gamesradar.com/games/co-op/after-a-few-months-of-work-led-to-11-million-copies-sold-on-steam-peak-devs-embrace-what-many-companies-refuse-to-learn-were-not-going-to-continually-have-a-graph-go-up/)). Built quickly, mostly during a month-long team retreat, for under $200k ([Game Developer](https://www.gamedeveloper.com/production/how-co-op-climbing-hit-peak-achieved-2-million-sales-for-less-than-200-000-)). | **Climbing as a social, funny theme can reach the mass market,** helped by a low price and clips streamers want to share. Dirtbag can't copy the co-op, but it can copy the price discipline and the watchable moments. |
| **Jusant** (Don't Nod, Oct 2023) | Premium, about $24.99 ([PC Gamer](https://www.pcgamer.com/jusant-review/)); widely reported as a day-one Game Pass launch [Unverified here] | PC / PS5 / Xbox | Metacritic 83; 93% positive from about 4.1k Steam reviews ([Metacritic](https://www.metacritic.com/game/jusant/), [GG.deals](https://gg.deals/game/jusant/)). Sold "well below expectations", with a €24M write-down shared with Banishers ([GameSpot](https://www.gamespot.com/articles/dont-nod-pausing-two-projects-after-jusant-banishers-ghosts-of-new-eden-flop/1100-6526667/), [GWO](https://gameworldobserver.com/2024/10/16/dont-nod-layoffs-restructuring-jusant-banishers-write-downs)). | **Critical acclaim didn't turn into sales.** Meditative climbing without a strong loop had weaker commercial pull. Dirtbag's trailer has to show the loop, not the mood [Inference]. |
| **New Heights: Realistic Climbing and Bouldering** (Early Access Jul 2023, 1.0 on 26 Feb 2026) | Premium $21.99 | PC | About 248 Steam reviews, 89% positive. Built by climbers, with 280+ routes on real crags from Fontainebleau to Hanshelleren ("Silence") ([GG.deals](https://gg.deals/game/new-heights/), [site](https://newheightsgame.com/)). | **Realism for climbers alone is a small market.** By the usual 30–60 sales per review rule of thumb, that's roughly 7–15k units [Estimate]. Sell the culture and the life, not simulation fidelity. |
| **Climber: Sky is the Limit** (Nov 2022) | Premium, plus a free trial that has since been delisted | PC | 69% positive from 142 reviews ("Mixed"). Reviewers complained about linear, pre-planned paths ([Steam](https://store.steampowered.com/app/1231840/Climber_Sky_is_the_Limit/), [SteamDB](https://steamdb.info/app/1963500/)). | **Players punish a lack of agency.** Dirtbag's many interlocking choices are the right answer to that. |
| **Crux / Crux: The Great Outdoors** (one-person developer) | Crux: free with no ads, extra gym packs sold. The Great Outdoors: premium $3.99. | iOS / Android (+ Steam) | Covered by **Climbing.com, Gripped and Kotaku** ([Climbing](https://www.climbing.com/news/rock-climbing-video-game-crux/), [Gripped](https://gripped.com/news/i-played-the-new-climbing-smartphone-game-crux-heres-what-to-know/), [Kotaku](https://kotaku.com/mobile-game-crux-lets-you-rock-climb-without-going-to-t-1845024500)) | **Climbing media will cover a small climbing game made by a climber.** That's free press Dirtbag should use. |
| **Getting Over It** (2017) | Premium $7.99 | PC / iOS / Android | About 2.9–3M copies [Estimate, [Gamalytic](https://gamalytic.com/game/240720)] | **Watchable failure sells.** Falls and near-sends need to be clip-able. |
| **A Difficult Game About Climbing** (Mar 2024, solo dev Pontypants) | Premium $9.99 | PC | About 200–280k copies and about $2M gross [Estimate, [GameRevenueData](https://gamerevenuedata.com/games/a-difficult-game-about-climbing/)] | **A solo dev, a climbing theme and a $9.99 price can reach seven figures** when the game is fun to watch. |

### 1.3 Cozy, premium mobile and outdoor-lifestyle games

| Game | Model / price | Platform | Reception / sales | One lesson for Dirtbag |
|---|---|---|---|---|
| **Stardew Valley** (2016) | Premium: $14.99 on PC, $4.99 on mobile (current list price; verify) ([TouchArcade](https://toucharcade.com/2020/06/04/stardew-valley-ios-android-price-discount-2020/)) | Every platform | 41M sold by December 2024 (26M on PC, 7.9M on Switch). **50M+ by February 2026** ([GamesRadar](https://www.gamesradar.com/games/simulation/cozy-farming-sim-stardew-valley-has-sold-over-41-million-copies-as-of-right-now-with-over-half-on-pc-and-almost-8-million-on-the-switch/), [VGChartz](https://www.vgchartz.com/article/467162/stardew-valley-sales-top-50-million-units/)) | A deep daily loop, relationships and years of free updates sell for a decade. **It also sets the mobile price anchor for a deep life-sim at $4.99.** The widely reported four-plus solo years are a scope warning: Dirtbag's loop is already built, so polish it rather than widen it. |
| **A Short Hike** (2019, adamgryu) | Premium $7.99 | PC / Switch / itch | About 440k–1.1M copies on Steam [Estimate, [games-stats](https://games-stats.com/steam/game/a-short-hike/), [SPA](https://www.steampageanalyzer.com/games/1055540)]. Started in December 2018 as a small art project and shipped in 2019 ([press kit](https://ashorthike.com/press/)). | **Small, finished, warm and cheap can beat sprawling.** Ship a tight "season", not the whole mountain. |
| **Kinder World** (Lumi Interactive) | Free-to-play: cosmetic IAP (artist-designed plant pots), an optional subscription, **no rewarded ads**. Raised a $10M seed round with a16z. | iOS / Android | 1M+ Android downloads ([AppBrain](https://www.appbrain.com/app/kinder-world-cozy-plant-game/com.LumiInteractive.KinderWorldGreen), [GamesHub](https://www.gameshub.com/news/features/mobile-games-developers-talk-monetisation-free-to-play-34813/), [Mobilegamer](https://mobilegamer.biz/lumi-to-take-on-calm-and-headspace-with-wellness-game-kinder-world/)) | **A cozy game can earn money without ads** if purchases never touch the core loop. It needs VC money, servers and live-ops, though, which a solo dev can't sustain. |
| **Balatro** (mobile, Sept 2024) | Premium $9.99, plus an Apple Arcade "+" version | iOS / Android | About $1M in its first 7 days on mobile ([PocketGamer.biz](https://www.pocketgamer.biz/balatro-approaches-1-million-in-seven-days-on-mobile/)). 5M units sold across all platforms by January 2025 ([GWO](https://gameworldobserver.com/2025/01/21/balatro-another-1-5-million-copies-total-5m-units)). | **Premium at $9.99 on mobile works** for a game with obvious depth. Balatro is an outlier, not a baseline. |
| **Wylde Flowers** (Studio Drydock) | Apple Arcade exclusive first (Feb 2022), then premium on Steam and Switch | iOS, then PC / Switch | 270k+ Arcade downloads; Apple Arcade Game of the Year ([GamesHub](https://www.gameshub.com/news/news/wylde-flowers-steam-and-switch-release-24912/)) | **A catalogue deal can fund a cozy life-sim before it goes premium.** Apple Arcade is invite-only and curated, though. |
| **Grand Mountain Adventure** (Toppluva, skiing) | **First mountain free, then one purchase unlocks everything. No ads, no microtransactions.** | iOS / Android | 20M+ downloads; the series says 30M players ([Play](https://play.google.com/store/apps/details?id=com.toppluva.grandmountain2&hl=en_US), [site](https://www.toppluva.com/GrandMountainAdventure/)) | **This is the mobile template for Dirtbag:** an outdoor-sport game with a free first area and a single unlock, no ads, with no ads or tracking. |
| **Lonely Mountains: Downhill** (Megagon / Thunderful, 2019) | Premium | PC / consoles | 3M+ players by December 2021 ([site](https://lonelymountains.com/)) | An outdoor sport presented with care, with no licences or realism claims, reaches general players. |
| **Van-life sims** (VanLife Simulator, Vanlife Camping Simulator, Van Life) | Premium | PC | Generic "simulator" products ([Steam](https://store.steampowered.com/app/2711690/VanLife_Simulator/), [Steam](https://store.steampowered.com/app/2882410/Vanlife_Camping_Simulator/)). Sales not found [Unverified]. | **Nobody owns "van life with a purpose".** Dirtbag's van exists to get you to the climbing, which makes it a character rather than a renovation checklist [Inference]. |
| **RV There Yet?** (Nuggets Entertainment, Oct 2025) | Premium $7.99 | PC | 1.3M copies in about a week; 4.5M+ by December 2025. Built as a jam game in about three months ([Game Developer](https://www.gamedeveloper.com/business/rv-there-yet-has-cruised-towards-1-3-million-sales-in-just-one-week), [PC Gamer](https://www.pcgamer.com/games/adventure/co-op-smash-hit-rv-there-yet-gets-an-unplanned-content-update-for-an-unplanned-game-as-the-comedy-vehicle-sim-surpasses-4-5-million-copies-sold/)) | Road-trip and vehicle themes can go viral when they're social and funny. A single-player life-sim needs other hooks. |

### 1.4 Sports-career sims

| Game | Model / price | Platform | Reception / sales | One lesson for Dirtbag |
|---|---|---|---|---|
| **Football Manager 26** (SEGA / Sports Interactive) | Premium $59.99. FM25 was cancelled. FM26 Mobile is Netflix-exclusive. | PC / console; mobile via Netflix | ([Goal](https://www.goal.com/en-ca/news/football-manager-2026-release-date-price-where-to-buy/blt53749c2f63cd6f91), [What's on Netflix](https://www.whats-on-netflix.com/news/netflix-games/football-manager-25-canceled/), [Netflix Tudum](https://www.netflix.com/tudum/articles/football-manager-26-mobile-game-news)) | **Depth plus "one more season" keeps prices high.** Even the genre leader stumbled on a technology rebuild, which is a cautionary tale for the UE rebuild [Inference]. |
| **Out of the Park Baseball 27** | Premium: $49.99 on Steam, $44.99 direct | PC | 27 consecutive yearly editions; 82% positive from 483 reviews ([GameDaily](https://gamedaily.com/games/out-of-the-park-baseball-27-out-now-launch), [OOTP](https://www.ootpdevelopments.com/out-of-the-park-baseball-home-buy-now/)) | **A niche sim with loyal fans can sustain a small studio for decades.** Selling direct as well as through stores helps margins. |
| **Motorsport Manager** (Playsport Games) | Premium mobile series, for example MM4 at $6.49, plus a free-to-play spin-off | iOS / Android (+ PC via SEGA, 2016) | The free-to-play spin-off has 8.6M downloads; the premium MM4 has about 200k ([AppBrain](https://www.appbrain.com/app/motorsport-manager-game-2025/com.playsportgames.mmo), [AppBrain](https://www.appbrain.com/app/motorsport-manager-4-racing/com.playsportgames.mmm2023)) | **A premium mobile manager series can last,** but free versions get about 40× the downloads. That's why a free first season matters. |
| **Retro Bowl** (New Star Games) | Free with ads; a **$0.99 "Unlimited" unlock**; coaching credits for sale; an ad-free Apple Arcade version | iOS / Android / Switch | 40M+ downloads; reached #1 on the US App Store with **zero spent on user acquisition** ([PocketGamer.biz](https://www.pocketgamer.biz/new-star-games-simon-read-retro-bowl-making-of/), [AppBrain](https://www.appbrain.com/app/retro-bowl/com.newstargames.retrobowl), [wiki](https://retro-bowl.fandom.com/wiki/Unlimited_Version)) | **A generous free game plus a tiny unlock can go viral.** It began as a high-school life-sim prototype. |
| **Pro Wrestler Story** (Kairosoft). No exact "Pro Wrestling Story" title turned up; this is the closest match. | Premium: about $6.99 on iOS [Unverified], about $8.99 on Steam (2025) | iOS / Android / Steam | 64% positive from 37 Steam reviews ([GG.deals](https://gg.deals/game/pro-wrestler-story/)) | **Kairosoft sells a catalogue of small premium career sims.** Each one is modest, but together they make a business. |
| **Wrestling Empire** (MDickie, solo dev) and text booking sims (**Pro Wrestling Sim**) | MDickie: free with ads plus a "Pro" unlock. Pro Wrestling Sim: premium, Early Access. | Mobile / Switch / PC | Wrestling Empire has 5M+ Google Play installs. MDickie claims 200M+ downloads across his games [Unverified] ([Play](https://play.google.com/store/apps/details?id=com.MDickie.WrestlingEmpire&hl=en_US), [ITR](https://itrwrestling.com/features/interview-with-mdickie/), [Steam](https://store.steampowered.com/app/1157700/Pro_Wrestling_Sim/)) | **A solo dev with a deep simulation underneath scrappy visuals can own a niche.** |

### 1.5 Web-first games that sold a paid edition (the closest structural comparisons)

| Game | What happened | Lesson |
|---|---|---|
| **Cookie Clicker** | The web version stayed free. The Steam version ($4.99, September 2021) added music, cloud saves and mods. About 2.8M paid units and about $21.9M gross [Estimate, [calc](https://steam-revenue-calculator.com/app/1454400/cookie-clicker)]. About 90k reviews, Overwhelmingly Positive. | **A game can be free on the web and still sell on Steam,** but only with a large existing web audience and clear extras. |
| **Melvor Idle** (solo dev) | Free web version, then a single paid purchase across Steam and mobile. 1M+ players by 1.0; Jagex published it with "no microtransactions" ([Jagex](https://www.jagex.com/news/melvor-idle-version-1-0-launches-on-pc-and-mobile), [PC Gamer](https://www.pcgamer.com/jagex-to-publish-runescape-inspired-melvor-idle/)). | **One price everywhere** can reach a million players. |
| **Universal Paperclips** | Free on the web, $1.99 on mobile ([Wikipedia](https://en.wikipedia.org/wiki/Universal_Paperclips)). | The web version spreads the game; the mobile version collects money from the people who loved it. |

### 1.6 What the comparisons say together

- **The price band for narrative and life-sim indies on PC is $7.99–$19.99.**
  - Games that are small, warm or funny cluster at $7.99–$9.99: A Short Hike, PEAK, Getting Over It, A Difficult Game About Climbing.
  - Content-heavy narrative sims sit at $19.99: Lake, Citizen Sleeper, and Stick RPG 2's list price.
  - Dirtbag's 2D presentation (bought pixel art, portrait UI) argues for **$9.99** [Inference].
- **On mobile, it's "free first, then unlock"** (Grand Mountain Adventure, Retro Bowl, A Dark Room, Crux), with upfront premium as the exception (Balatro).
- **The climbing theme is hot, but the hits sell spectacle.** Dirtbag's differentiator is the life around climbing: the calendar, the money, the body and the people. That's a life-sim pitch with authentic climbing texture. It isn't a climbing-sim pitch [Inference].

---

## 2. The audience

### 2.1 Numbers

| Metric | Figure | Source / reliability |
|---|---|---|
| North American climbing gyms | **900+** in 2025. 53 opened and 41 net new (+4.7%). 73% of operators reported worse economic conditions. | [CBJ Gyms & Trends 2025](https://climbingbusinessjournal.com/gyms-and-trends-2025/), [Athletic Business](https://www.athleticbusiness.com/operations/budgeting/article/15817979/study-climbing-gym-numbers-slip-in-2025-revenues-flat) |
| US indoor climbing participants | About **6.36M** (2023 peak) | [Statista](https://www.statista.com/statistics/763788/climbing-sport-indoor-boulder-participants-us/) (paywalled; figure from search summary) |
| Global regular climbers | About **25M** (a figure attributed to the IFSC; some sources say 35M) | Widely repeated federation figure; primary source not retrieved [Estimate] |
| UK | About **1M** people climb indoors each year, about 100k regularly (Association of British Climbing Walls, via press). **300+** public climbing walls. | [BMC](https://thebmc.co.uk/en/your-climbing-counts), [UKC feature](https://www.ukclimbing.com/articles/features/social_climbers_-_the_evolving_indoor_climbing_industry-10953), [press](https://www.mancunianmatters.co.uk/news/17012022-bouldering-why-the-sport-has-millions-climbing-up-the-walls/) [Unverified] |
| How engaged climbers are | Climbing Wall Association 2026 survey of 5,000+ climbers in the US and Canada: **about three-quarters climb twice a week or more** (about 60% in 2019). Ages are broadening toward 35–54, and household incomes are rising. | [CWA, Apr 2026](https://www.cwapro.org/blog/what-seven-years-of-climber-data-tell-us-about-where-indoor-climbing-is-headed) |
| Gender (indoor) | Roughly 40–50% women; sources disagree | Mixed aggregators [Unverified] |
| Olympic visibility | Paris 2024 had 4 climbing medal events and 68 athletes, up from 40 in Tokyo. **LA 2028 has 6 medal events (boulder, lead and speed, each for men and women) and 76 athletes, at a US home Games.** | [World Climbing](https://www1.ifsc-climbing.org/olympics/paris-2024), [LA28](https://la28.org/en/newsroom/los-angeles-2028-medal-event-program-and-athlete-quota.html), [UKC](https://www.ukclimbing.com/news/2025/04/separate_medals_for_boulder_and_lead_at_la_2028_olympics-73942) |
| Federation name | The IFSC became **World Climbing** on 2025-12-10; the World Cup became the World Climbing Series in 2026. | [Gripped](https://gripped.com/news/the-ifsc-has-changed-their-name-to-world-climbing/), [PlanetMountain](https://www.planetmountain.com/en/news/competitions/international-federation-of-sport-climbing-changes-name-to-world-climbing.html) |
| YouTube creators | See the list below this table. | See links below |
| TikTok | #climbing: about 8.1B views and 588k posts. #rockclimbing: about 2.2B views. | [tiktokhashtags.com](https://tiktokhashtags.com/hashtag/climbing/) [Unverified third-party] |
| Reddit | r/climbing about **1.6M**, r/bouldering about **488k**, r/CozyGamers about 441k, r/cozygames about 115k. r/incremental_games: size not retrieved. | [GummySearch](https://gummysearch.com/r/climbing/), [reddapi](https://reddapi.dev/subreddits/bouldering/insights), [GummySearch](https://gummysearch.com/r/CozyGamers/) [Estimate; may be dated] |
| Mountain Project | "3M+ climbers" when REI bought it in 2015. Recent ad-index estimate: about 1.39M visits a month. Now owned by onX. | [CBJ](https://climbingbusinessjournal.com/rei-buys-mountain-project/), [Kochava](https://media-index.kochava.com/ad_partners/mountain-project), [onX](https://www.onxmaps.com/backcountry/onx-backcountry-is-now-powered-by-mountain-project) [Estimate] |
| theCrag | About 1.48M routes and 5.05M ascents logged. Its gym product has "100k+ users". | [theCrag](https://www.thecrag.com/en/article/about), [gym](https://www.thecrag.com/en/article/gymsolution) |
| Vertical-Life / 8a.nu (merged) | About **500k active users** logging routes (vendor claim). 8a.nu has 5.4M ascents and 1.1M routes. | [Vertical-Life](https://gym.vertical-life.info/vertical-life-app/), [8a.nu](https://www.8a.nu/news/welcome-to-vertical-life-web) [Vendor claim] |
| KAYA | No public user numbers found | [Crunchbase](https://www.crunchbase.com/organization/kaya-climb) [Unverified] |

**YouTube creator subscriber counts:**
- **Magnus Midtbø: about 3.7M.** He hit 2M in November 2023 ([Social Blade](https://socialblade.com/youtube/handle/magmidt), [PlanetMountain](https://www.planetmountain.com/en/news/climbing/magnus-midtbo-reaches-2-million-subscribers-on-youtube.html)).
- Adam Ondra: about 515k. EpicTV: about 403k. Geek Climber: about 305k. Wide Boyz: about 215k. Mellow: about 123k ([Feedspot](https://videos.feedspot.com/climbing_youtube_channels/)).
- Bouldering Bobat: about 223k in April 2026 ([Social Blade](https://socialblade.com/youtube/handle/boulderingbobat)).
- Hannah Morris: about 171–180k ([Advnture](https://www.advnture.com/features/hannah-morris-bouldering)).
- Catalyst Climbing (Louis Parkinson): about 177k in late 2024.
- Emil Abrahamsson and Hooper's Beta: 100k+ each ([Benable](https://benable.com/Nettieclimbs/_-youtube-channels-for-rock-climbers)).

Most of these counts come from trackers and may be dated.

### 2.2 Who they are, and the overlap with cozy and life-sim players

- **Climbers:** mostly 20s–40s and getting older, with rising incomes. The gender split is far more even than core gaming. They climb often and talk about it constantly: grades, beta, gyms, trips ([CWA](https://www.cwapro.org/blog/what-seven-years-of-climber-data-tell-us-about-where-indoor-climbing-is-headed)).
- **Cozy and life-sim players:** the Family/Farm Sim genre (Stardew, The Sims, Animal Crossing) was **69% female** in Quantic Foundry's panel ([Quantic Foundry](https://quanticfoundry.com/2017/01/19/female-gamers-by-genre/), 2017 data). "Cozy" is the fastest-rising keyword among successful Steam games: it appeared in 0.4% of $100k+ titles in 2022 and 3.1% in 2025 ([PC Gamer on GameDiscoverCo](https://www.pcgamer.com/games/life-sim/the-cozy-game-boom-is-the-clearest-trend-on-steam-over-five-years-of-data/)).
- **The overlap is plausible but unmeasured.** Both groups skew adult, educated and more gender-balanced than core gaming. No source measures how many climbers play life-sims [Inference]. The overlap is strongest around themes Dirtbag already has: van, dog, campfire, friends, and the bittersweet pull between work and passion.
- **A third audience worth naming: Stick RPG and BitLife nostalgia players.** That's a big group of 25–40-year-olds who remember Stick RPG. "Stick RPG, but you're a dirtbag climber" is a hook that works without any climbing knowledge [Inference].

### 2.3 Rough market-size sketch [Estimate]

- If **0.1–0.5% of US indoor climbers** bought Dirtbag, that would be roughly **6k–32k units**. That assumes the game reaches them, which is the whole marketing problem.
- **Cross-checks:**
  - New Heights: about 250 reviews, so roughly 7–15k units.
  - Stick RPG 2 Director's Cut: about 1k reviews, so roughly 30–60k units over about 12 years.
  - A Difficult Game About Climbing: about 200–280k, reached by appealing to general players.
- **Conclusion:** selling only to climbers probably tops out in the **low tens of thousands of units**. Reaching 100k+ requires landing with life-sim, cozy and Stick RPG/BitLife players [Inference]. Your UE plan already says this ("Niche ceiling").

---

## 3. Business model options (for a solo dev, 2026)

### 3.1 Store economics in 2026

| Store | Upfront cost | Store's cut | Notes |
|---|---|---|---|
| **Steam** | $100 per app, refunded once the game earns $1k | 30% (25% above $10M, 20% above $50M) ([presskit.gg](https://presskit.gg/field-guides/how-much-does-steam-take)) | Built around wishlists and festivals. There's no rule against a game also being free elsewhere; Cookie Clicker is the precedent. |
| **Google Play** (US/UK/EEA since 2026-06-30) | $25 one-time registration ([ref](https://www.iconikai.com/blog/google-play-developer-account-fee-2026)) | **10% service fee on the first $1M a year**, plus a **5% billing fee** if you use Play Billing. Alternative billing and external web links avoid the 5% ([Android Dev Blog](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html), [9to5Google](https://9to5google.com/2026/06/24/google-play-store-external-billing-june-30/), [Play Help](https://support.google.com/googleplay/android-developer/answer/16954621?hl=en)) | **A published free app can't be changed to paid**; you'd need a new package name ([Play Help](https://support.google.com/googleplay/android-developer/answer/6334373?hl=en)). New in 2026: **Game Trials** for paid games, where players try first and keep their progress when they buy. Also new: wishlists and "buy once, play anywhere" across mobile and PC ([TechCrunch](https://techcrunch.com/2026/03/11/google-play-is-adding-new-paid-and-pc-games-game-trials-community-posts-and-more/)). The Epic v. Google settlement terms are still in court ([Coda](https://www.coda.co/blog/epic-v-google-policy-update-2026/)). |
| **Apple App Store** | $99 a year (well known) | 15% under the Small Business Program ([Appbot](https://appbot.co/blog/app-developers-apple-google-small-business-programs/)) | Commission on US purchases made through outside links is in active litigation, with a Supreme Court review granted on 2026-06-30. Apple has proposed 15%, or 5% for small businesses ([TechCrunch](https://techcrunch.com/2026/08/14/apple-proposes-to-take-a-15-cut-of-purchases-made-outside-the-app-store/)). Guideline 4.2 rejects "repackaged websites" ([Apple](https://developer.apple.com/app-store/review/guidelines/)). |
| **itch.io** | Free | **10% by default; you choose anywhere from 0 to 100%,** plus about 2.9% + $0.30 payment processing. "Creator Day" drops itch's cut to 0% ([itch docs](https://itch.io/docs/creators/payments), [itch](https://itch.io/updates/introducing-open-revenue-sharing)). | Hosts HTML5 games natively and supports pay-what-you-want. Weak discovery for paid sales. |

### 3.2 The options

**A. Premium mobile (paid upfront listing).**
- **The market:** free-to-play accounts for **96% of mobile downloads**. Premium releases are rising, though: up 77% in 2025 to about 750 titles ([gamedev.net on AppMagic](https://gamedev.net/news/premium-mobile-games-are-back-with-releases-up-77-in-2025-r4367/)).
- **Android is harder.** In 2015 only **5%** of Monument Valley's Android installs were paid, against 40% on iOS ([Game Developer](https://www.gamedeveloper.com/business/-i-monument-valley-i-only-5-percent-of-android-installs-were-paid)). Google's new Game Trials partly fix try-before-you-buy.
- **Dirtbag's current listing is free and can't be made paid.** A paid listing would be a second app.
- **Fit: weak as the main mobile model.** Possibly workable for iOS later.

**B. Free demo plus a one-time unlock (the Grand Mountain Adventure model).** **Best fit for mobile.**

*Evidence:*
- Grand Mountain Adventure: 20M+ downloads, one purchase, no ads.
- Retro Bowl's $0.99 unlock.
- A Dark Room: free web original, then paid.

*Constraints for the current TWA:*
- **Billing works.** Play Billing in a TWA uses the **Digital Goods API plus the Payment Request API**, enabled with Bubblewrap's `playBilling` option (Chrome 101+) ([Chrome docs](https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing), [ChromeOS.dev](https://chromeos.dev/en/publish/pwa-play-billing), [sample](https://github.com/chromeos/pwa-play-billing)).
- **Google wants a server check.** Its guidance is to verify purchase tokens on a backend before granting the unlock. Dirtbag has no server by design, so a client-only check is weaker and spoofable. Whether client-side acknowledgement works in API v2 needs testing [Unverified].
- **The TWA shows the live public site.** The TWA manifest says 0.670 while the web build is 0.956, so Play users get whatever the site serves. Any content gated in the TWA is served to every browser too, and **the gate becomes a localStorage flag** [Inference].
- **Robust option:** ship Android as a **locally bundled wrapper**, such as Capacitor with a native billing plugin. Keep the same package name and signing key. The public web build then becomes a content-limited demo [Inference].
- **iOS has no TWA equivalent.** It needs a bundled wrapper plus StoreKit, a one-time (non-consumable) purchase and a "restore purchases" button. A full offline game with native feel should get past Guideline 4.2, but that's a risk to test [Inference].

**C. Steam premium.** **Best fit for the main revenue.**

*Benchmarks:*
- About **7k wishlists** gets a game onto Popular Upcoming ([How To Market A Game](https://howtomarketagame.com/benchmarks/), [presskit.gg](https://presskit.gg/field-guides/how-many-wishlists-to-launch)).
- Median **first-week conversion is about 0.15×** for games with 25k+ wishlists, and 0.17× for 10k+. Games priced **above $10** reportedly convert at about 0.10× ([GameDiscoverCo](https://newsletter.gamediscover.co/p/the-state-of-steam-wishlist-conversions), [summary](https://gamedevreports.substack.com/p/gamediscoverco-the-state-of-steam)).

*Next Fest reality:*
- October 2025: the median game added about 18 followers, meaning fewer than 500 wishlists. The top 10% added about 3k; the top 5% about 7k ([GameDiscoverCo](https://newsletter.gamediscover.co/p/who-won-october-2025s-steam-next)).
- June 2025: the top 1% added 30k+.
- **One Next Fest per game.** It must be unreleased, with a Coming Soon page and a demo.
- **Next usable edition: 22 Feb – 1 Mar 2027.** Register by 2027-01-10, demo build due 2027-01-25 ([Steamworks](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027)). October 2026 registration closed 2026-08-31 ([Steamworks](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/2026october)).

*Work needed:*
- **A landscape desktop layout and a mouse pass.** A portrait-only phone UI will look like a port on PC and Steam Deck [Inference].
- A desktop wrapper (Electron or Tauri).
- Steam Cloud saves and achievements, both native Steam features that need no server of yours.

**D. itch.io.**
- **Good for:**
  - a DRM-free supporter edition;
  - pay-what-you-want above a floor;
  - hosting the free browser demo;
  - bundles;
  - keeping the CC BY soundtrack available without DRM (see §5.5).
- **Weakness:** little discovery for paid sales.
- **Fit:** secondary storefront.

**E. Ads and IAP.**
- **This clashes directly with the privacy policy:** "collects nothing, sends nothing, has no servers… No analytics, advertising, or third-party trackers" (`privacy.html`).
- Google's own AdMob disclosure says its SDK **collects IP address, device and account identifiers, product interactions and diagnostics** ([AdMob data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)). That would have to be declared in Play's Data safety form and Apple's privacy labels.
- **Ad revenue needs scale.** BitLife's ad-heavy model runs on tens of millions of installs. A niche game's ad revenue would be small, and it would give up its cleanest selling point: no ads, no tracking, offline [Inference].
- **IAP beyond a single unlock** (consumables, currency) needs server-side receipt validation and live-ops.
- **Not recommended.**

**F. Subscription catalogues and funding.**
- **Google Play Pass** is alive in 2026. It pays royalties based on engagement, and its titles can opt into Google Play Games on PC ([Play Pass](https://google.play/business/programs/googleplaypass/), [Game Developer](https://www.gamedeveloper.com/game-platforms/devs-that-sign-on-to-play-pass-are-paid-by-the-time-players-spend-in-their-games)). **A no-ads, no-IAP premium game is the Play Pass profile.** Pitch it after launch.
- **Apple Arcade** is curated and invitation-only, and leans cozy in 2026 ([iDrop News](https://www.idropnews.com/news/new-apple-arcade-games-2026/257766/)). Treat it as opportunistic.
- **Netflix** pulled 21 indie games in July 2025 and pivoted to mainstream, party and IP-linked games ([Variety](https://variety.com/2025/gaming/news/hades-mobile-game-leaving-netflix-1236439474/)). **Don't plan around it.**

**G. Direct support (the Kingdom of Loathing style).** A voluntary "buy the dev a chalk bag" option, such as an itch.io supporter tier, fits the voice and the privacy stance. It's a supplement, not a model.

### 3.3 Recommendation: one game, one free season, one price per store

**The line.** Split the game into a **free "first season"** and **the full game**.

- **Free first season:** gym plastic to the first crag, with the core loop, the van, the dog and a partner. It ends on a cliffhanger, such as your first project or a sponsor's first call.
- **Full game:** crags, expeditions, competitions (renamed, see §5.2), sponsors, ethics arcs and legacy.
- **Saves carry over.** Add save export and import (a file or code the player moves themselves, no server) so a demo save continues in the paid version.

**Where and how much:**

| Store | Offer | Price | Why |
|---|---|---|---|
| **Steam** (main bet) | Premium, with the first season as the Steam demo | **$9.99** list, 10–20% launch discount | Comparable games cluster at $7.99–$9.99. GameDiscoverCo reports lower conversion above $10. Bought pixel art and a 2D UI read as a $10 game, not $20 [Inference]. Consider $12.99 only if you can show "40+ hours". |
| **Android** (existing listing) | Free download, **one-time unlock** | **$4.99** | Play won't allow a free-to-paid switch, and a single unlock is the Grand Mountain Adventure model. Stardew's $4.99 mobile price is the anchor. About $4.24 net per sale in the US/UK/EEA with Play Billing. |
| **iOS** (new) | Free download, one-time unlock | **$4.99** | Same model; 15% under the Small Business Program. |
| **itch.io** | DRM-free full build, pay what you want above $9.99; free browser demo embedded | $9.99+ | The supporter channel; keeps the CC BY assets DRM-free. |
| **Web** (dirtbag.rcjlabs.com) | Free first season, with links to Steam, Google Play, the App Store and itch | Free | Marketing and demo. Static links need no tracking. |

**How, keeping the privacy stance:**
1. **Build two versions from one codebase:**
   - a **demo** version that ships only first-season content (web, plus the store downloads before unlock);
   - a **full** version (Steam, itch, and mobile after unlock).
2. **Android:** move from the TWA to a **bundled wrapper** under `io.github.rcjlabs.dirtbag`, signed with the same key, with a local billing plugin. That makes the gate real and keeps "no network requests" true, since everything is local. If that's too much work, keep the TWA with the Digital Goods API and accept an honor-system gate [Inference].
3. **Store purchases go through Google, Apple and Valve, never through your server.** Add one plain sentence to the privacy policy saying so. Don't add analytics SDKs. Use the stores' own aggregate dashboards (Play Console installs, Steam wishlists and UTM-tagged store links) to measure [Inference].
4. **Grandfather existing players.** If a pre-change save exists on the device, unlock the full game for free. No server needed, and it avoids a "you took my game away" backlash [Inference].
5. **Don't add:** ads, energy timers, premium currency, gacha, or live-ops that need servers.
6. **After launch:** pitch Play Pass, and consider Google Play Games on PC. If the game has a quiet period, a paid "Director's Cut" content drop is the Stick RPG 2 precedent.

**Why this over the alternatives [Inference]:**
- It keeps the game's strongest selling points: free to try, offline, no ads, no tracking.
- It puts the paywall where the comparable games prove people pay: after they're hooked.
- It concentrates effort on one Steam launch, the biggest premium indie market.
- It uses the free web build as the funnel, the way A Dark Room and Stick RPG did.
- **Option B from §1.5**, keeping the full game free on the web and selling a Steam convenience edition like Cookie Clicker, is viable only with a *large* existing web audience. Dirtbag has **no analytics**, so that audience size is unknown. Check the Play Console install numbers before considering it.

**What this means for the Unreal project [Inference].** The 2D game is sellable in 2026–27; the UE reimagining is years away (`ROADMAP.md`: Phase 0). Update the UE competitor analysis (`concepts/DIRTBAG-PLAN.md`) to cover Cairn (a 2026 3D climbing game about managing resources on the wall) and PEAK. Treat the 2D Steam launch's wishlists, conversion and reviews as the go/no-go evidence for UE budget. That matches the repo's own rule that "the 2D game is the spec" and the concept doc's recommendation of PC-first for 3D.

### 3.4 Revenue scenarios [Estimate: arithmetic, not a forecast]

**Steam assumptions:**
- $9.99 list price.
- About **$4.50–$5.50 net per unit** after discounts, regional pricing, refunds and Valve's 30%.
- First week = 0.15× wishlists.
- First year = about 3× the first week. This rule of thumb varies widely.

| Scenario | Wishlists at launch | First-week units | First-year units | First-year net (Steam) |
|---|---|---|---|---|
| Low | 3,000 | ~450 | ~1,400 | ~$6–8k |
| Base | 15,000 | ~2,250 | ~6,700 | ~$30–37k |
| High | 50,000 | ~7,500 | ~22,500 | ~$100–125k |

**Mobile:** the install base is unknown because there are no analytics; check Play Console. Assuming a 1–4% unlock rate at about $4.24 net, 50k installs at 2% gives 1,000 unlocks, about $4.2k. **Mobile is the long tail; Steam is where the upside is.**

---

## 4. Marketing channels

### 4.1 Channel by channel

**The free browser build is the call to action everywhere.** "Play it in your browser, no signup, no ads" is welcome in communities that ban store-link promotion, and it gives creators something to try on the spot [Inference].

1. **Climbing media.**
   - **General outlets:** Climbing (Outside), Gripped, UKClimbing, PlanetMountain, Lacrux (DE), Evening Sends.
   - **Gym trade:** Climbing Business Journal, for the gym angle.
   - **Podcasts:** The Nugget, and similar.
   - **Evidence it works:** Climbing.com and Gripped both reviewed Crux, and Climbing.com runs articles on the "dirtbag" life, for example "[Is it still possible to be a dirtbag climber?](https://www.climbing.com/community/dirtbagging-isnt-dead-just-changed/)" and "[Dirtbagging Is Dead](https://www.climbing.com/news/dirtbagging-is-dead/)".
   - **Pitch:** *"A solo dev built the game version of that debate. It's free in your browser."*
   - **Approach The Dirtbag Diaries** (Duct Tape Then Beer) carefully. The shared word is both an opportunity and a naming risk (§5.1).
2. **Gyms.**
   - **Reach:** 900+ North American gyms and 300+ UK walls, and gyms already work with apps (Vertical-Life, theCrag, KAYA).
   - **Tactics:**
     - QR posters and "rest day" cards at the front desk;
     - a route-setter collab ("set the in-game gym's route of the month");
     - a shout-out on the gym's own social accounts.
   - **For chains and operators:** the **CWA Summit** trade show, held 15–17 Apr 2026 in Salt Lake City; the 2027 dates are unconfirmed ([CWA](https://www.cwapro.org/events/2026-cwa-summit)).
   - **Measuring without in-game tracking:** Steam's store-side UTM analytics on per-gym links (a standard Steamworks feature; not re-verified) [Inference].
3. **Climbing creators.**
   - **Top tier:** Magnus Midtbø (about 3.7M subscribers) is a long shot.
   - **Realistic targets are mid-tier (100–500k):** Bouldering Bobat, Hannah Morris, Catalyst Climbing, Hooper's Beta, Emil Abrahamsson, Wide Boyz, Geek Climber and EpicTV.
   - **Formats that fit Dirtbag's mechanics:**
     - "Pro climber rates the game's grades." The sandbagging system, where a public grade hides a truer one, is built for arguments.
     - "Can a V10 climber survive the van life?"
   - **Also pitch life-sim and cozy streamers and Stick RPG nostalgia creators.** They're how you get past the niche ceiling.
4. **Reddit.**
   - **Subreddits:**
     - climbing: r/climbing (about 1.6M), r/bouldering (about 488k), r/climbharder;
     - van life: r/vandwellers and r/VanLife (sizes not retrieved);
     - cozy: r/CozyGamers (about 441k) and r/cozygames (about 115k), for a "cozy-adjacent: van, dog, campfire" angle;
     - general: r/WebGames (free browser game), r/incremental_games (**only partly relevant**: Dirtbag is a life-sim with progression, not an idle game, so pitch the stat-growth loop honestly), r/IndieDev and r/SoloDevelopment.
   - **Rules vary by subreddit and many restrict self-promotion,** so read each sidebar first ([guide](https://redship.io/blog/reddit-self-promotion-rules)).
   - **What works:** a personal "I built a game about dirtbagging" post with a GIF and the free link.
5. **TikTok, Shorts and Reels.**
   - Climbing content is huge on TikTok (#climbing about 8.1B views [Unverified]).
   - **Plain talking-head devlogs lost much of their organic reach in early 2025.** Gameplay-first clips with a strong visual in the first two seconds did better, and **creators reposting your trailer** mattered more than your own account (the YAPYAP case) ([presskit.gg](https://presskit.gg/field-guides/tiktok-indie-game-marketing), [Acorn](https://acorngames.gg/blog/2025/8/10/the-indie-devs-guide-to-mastering-tiktok-in-2025)).
   - **Clips to make:** the sandbag reveal, the pump-bar save, the rent-versus-trip dilemma, the dog.
6. **Steam festivals and showcases.**
   - **Next Fest, 22 Feb – 1 Mar 2027:** your one shot.
   - **Themed festivals:** Steam runs about 22 a year; **Steam Sports Fest is 8–15 Nov 2026** ([Gaming Amigos](https://www.gamingamigos.com/post/steam-fest-2026-schedule)). Check eligibility rules for unreleased games.
   - **Curator-run festivals:** Cairn appeared in 18, including Earth Appreciation Fest and Indie Live Expo.
   - **Localise the demo.** Cairn's localised demo stayed featured in other languages after English featuring ended.
   - **Wholesome Direct:** submissions for the June show closed 2026-03-20, and the next deadline will probably be around March 2027 ([Wholesome Games](https://x.com/_wholesomegames/status/2028551199029403927)). Dirtbag is cozy-adjacent, not pure cozy, so this is a stretch [Inference].
7. **Climbing festivals and film tours.** The game's own "a climbing film tour is screening at the brewery tonight" event mirrors the real thing, which makes an easy cross-promotion hook.
   - **Formats:** a QR slide or flyer at screenings; raffles through local hosts (often gyms); a partnership with a local climbers' coalition.
   - **Cause tie-in:** a "portion of launch week to Access Fund or the local coalition" pledge is on-brand [Inference].

### 4.2 Dated calendar

| When | Event | Relevance |
|---|---|---|
| 7–11 Oct 2026 | **Rocktoberfest**, Red River Gorge, KY ([RRGCC](https://rrgcc.org/rrgcc-events/), [guide](https://www.redriverbasecamp.com/blog/festivals/rocktoberfest-2026)) | Coalition-run festival; flyers, raffle |
| from 22 Oct 2026 (Boulder opening) | **REEL ROCK 20** world tour ([REEL ROCK](https://reelrocktour.com/), [calendar](https://reelrocktour.com/pages/tour-calendar)) | Screenings are often hosted by gyms, a good fit for QR slides |
| 8–15 Nov 2026 | **Steam Sports Fest** (date from schedule roundups; verify on Steamworks) | Themed festival (check eligibility) |
| 19–22 Nov 2026 | **Kendal Mountain Festival**, UK: 25k+ attendees, 150+ films ([programme](https://kendalmountainfestival.eventive.org/schedule), [info](https://kentsbankholiday.co.uk/kendal-mountain-festival/)) | UK climbers and media |
| Dec 2026 – spring 2027 | **Banff Centre Mountain Film Festival World Tour**: about 550k attendees in 600 communities across 40 countries (venue listing) ([Banff](https://www.banffcentre.ca/banffmountainfestival/tour), [venue](https://www.capitolcentre.org/all-events/theatre-events/banff-centre-mountain-film-festival-world-tour-2026)) | The largest audience of outdoor enthusiasts |
| 17 Dec 2026 – 4 Jan 2027 | Steam Winter Sale | Wishlist traffic |
| **10 Jan 2027** | **Next Fest registration deadline** ([Steamworks](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027)) | Must hit |
| 22 Feb – 1 Mar 2027 | **Steam Next Fest** | The demo's big moment |
| ~March 2027 | Wholesome Direct submissions (inferred from the 2026 pattern) | Cozy-adjacent pitch |
| Spring 2027 | CWA Summit (dates unconfirmed) | Gym operators |
| May 2027 | Mountainfilm, Telluride ([Mountainfilm](https://www.mountainfilm.org/films/dirtbag-the-legend-of-fred-beckey/)) | Film and culture crowd |
| July 2027 | International Climbers' Festival, Lander, WY (33rd edition was 9 July 2026) ([listing](https://www.wasatchmountainclub.org/calendar/2026/July/9/rock-climb-33rd-annual-international-climbers-festival-lander-wy)) | Core dirtbag culture |
| July 2028 | **LA 2028 Olympics**: 6 climbing medal events, US home Games | Peak US attention; time a sale or update for it, **without using "Olympic"** (§5.2) |

The American Alpine Club has ended its Craggin' Classic festival series ([AAC](https://americanalpineclub.org/craggin-classics)).

### 4.3 Positioning lines to test [Inference]

- "Stick RPG, but you live in a van and your rent competes with your project."
- "A climbing life-sim. The grades are sandbagged. So is your bank account."
- Store short description: lead with the **life** (van, shifts, partners, dog), then the **climbing** (gym to crag, sends and falls), then the **promise** (free first season, no ads, offline).

---

## 5. Risks

### 5.1 The name "Dirtbag"
- **Existing US trademarks containing DIRTBAG:**
  - DIRTBAG for an energy bar, owned by Dirtbag, LLC ([uspto.report](https://uspto.report/TM/90094849));
  - DIRTBAG owned by a bag maker ([Trademark Elite](https://www.trademarkelite.com/trademark/trademark-detail/88807642/DIRTBAG));
  - PRIVILEGED DIRTBAG for clothing ([Legalhoop](https://www.legalhoop.com/trademark/detail/97231630/PRIVILEGED%20DIRTBAG));
  - **DIRTBAG BASEBALL in the education and entertainment category, class 41** ([Trademarkia](https://trademark.trademarkia.com/dirtbag-baseball-77361312.html)).

  I found no DIRTBAG mark covering games in class 9 (software) or class 41 (entertainment), but **I couldn't query the USPTO database directly** [Unverified].
- **Other uses of the name:**
  - **"dirtbag MAHJONG" on Steam** ([Steam](https://store.steampowered.com/app/3488460/dirtbag_MAHJONG/));
  - **The Dirtbag Diaries** outdoor podcast, running since 2007 ([site](https://dirtbagdiaries.com/));
  - the 2017 film *Dirtbag: The Legend of Fred Beckey* ([site](http://dirtbagmovie.com/));
  - a "Dirtbag Development" training app on Google Play ([Play](https://play.google.com/store/apps/details?id=com.trainerize.dirtbagdevelopment&hl=en_US)).
- **Risk:** medium.
  - **Legal:** low while the game stays fictional and doesn't imitate existing branding.
  - **Search and discoverability:** high. The bare word is generic slang ("a contemptible person"), a song title and a college team nickname [Inference].
- **Mitigation:**
  - **Pick a distinctive full title,** for example "Dirtbag: [subtitle]".
  - Run a knockout search on the USPTO, EUIPO and UKIPO databases in classes 9 and 41.
  - Consider an intent-to-use trademark filing. The USPTO base fee is **$350 per class** since 2025-01-18 ([USPTO](https://www.uspto.gov/trademarks/fees-payment-information/summary-2025-trademark-fee-changes)).
  - Secure the domain and social handles.
  - Don't echo The Dirtbag Diaries' visual branding.

### 5.2 "Olympic" and other protected terms in the current build (HIGH)
- **What's in the build** (`index.html`):
  - location: "Olympic Village";
  - achievement: "Olympic Medalist";
  - reputation tier: "Olympic Hopeful";
  - labels: "★ Road to the Olympics", "Next Olympic Games" and "Olympic-qualified in…".
- **The law:** 36 U.S.C. § 220506 gives the USOPC the **exclusive right to "Olympic", "Olympiad" and related terms in commercial use, without having to prove likelihood of confusion, and with the usual trademark defences unavailable** ([LII](https://www.law.cornell.edu/uscode/text/36/220506), [DMLP](https://www.dmlp.org/blog/2012/olympic-citius-altius-fortius-pan-american-us-olympic-committees-exclusive-rights)).
- **How it's enforced:** the USOC sent a cease-and-desist to Ravelry's knitting "Ravelympics" in 2012. The knitters renamed their event ([NPR](https://www.npr.org/sections/thetwo-way/2012/06/21/155508908/after-knitters-get-in-a-twist-usoc-apologizes-for-cease-and-desist-letter)).
- **Why it matters now:** selling the game makes the use commercial. Other countries give their Olympic committees similar protection [Inference].
- **Fix:**
  - Rename to a fictional multi-sport event, such as "the Games" or an invented name.
  - Remove the Olympic rings or anything like them.
  - Search the build for all "Olymp" strings.
- **Also fix:** trivia naming the **IFSC** as the governing body. It became **World Climbing** on 2025-12-10 ([Gripped](https://gripped.com/news/the-ifsc-has-changed-their-name-to-world-climbing/)). This is a credibility issue, not a legal one.

### 5.3 Real crags, routes, people and brand-like names
- **Places:** El Capitan and Yosemite (expedition text, trivia), Cerro Torre, Trango Tower, Half Dome, Joshua Tree, Indian Creek, Hueco, Patagonia.
  - **Using real place names descriptively is generally fair use** ([INTA](https://www.inta.org/fact-sheets/fair-use-of-trademarks-intended-for-a-non-legal-audience/)).
  - **Iconic names can still be registered marks for particular goods and services.** In Yosemite, the concessionaire Delaware North held marks such as THE AHWAHNEE, CURRY VILLAGE and even the slogan "GO CLIMB A ROCK". The dispute ended with a roughly **$12M** settlement in 2019 ([Cooley](https://www.cooley.com/news/insight/2019/2019-07-22-yosemite-trademark-settlement-restores-historic-names)).
  - **Apple has filed "El Cap" and California place names for software** ([MacRumors](https://www.macrumors.com/2014/05/30/future-os-x-names-discovered/)).
  - **Risk:** low as in-game locations; higher if a real place name appears in the **title, logo or store banner**. Keep real names inside the game and don't imply National Park Service endorsement [Inference].
- **People in trivia:** Alex Honnold, Tommy Caldwell, Lynn Hill, Hans Florine and others.
  - **Factual trivia is low risk.** Using a real person's likeness or implying their endorsement in marketing is not.
  - *Keller v. EA* went against EA when real athletes' likenesses were recreated in their own sport ([Loeb](https://www.loeb.com/en/insights/publications/2013/08/keller-v-electronic-arts-inc-in-re-ncaa-studenta__)). *Noriega v. Activision* was dismissed because the use was transformative ([Goldman](https://blog.ericgoldman.org/archives/2014/11/manuel-noriega-loses-right-of-publicity-suit-against-activision-guest-blog-post.htm)).
  - Keep real people out of store pages and ads.
- **In-game brands are fictional.** Talon, Roost, Sabor, Grit, Kestrel, KINETIK, Nomad & Co., Ferrata Hardware and Ridgeline Chalk are good choices. A few collide with real outdoor or consumer brands in other categories: Osprey sells a "Talon" pack, "Kestrel" is a well-known weather-meter brand, and "Nomad" sells phone accessories [Inference; not searched individually].
  - **Risk:** low inside the game; higher if they're ever used on **merch**. Run a quick check before any merch.

### 5.4 Purchased asset packs (LimeZu)
- **What the licence says:**
  - **Allowed:** editing and using the assets in commercial or non-commercial projects.
  - **Not allowed:** reselling or redistributing the assets, even edited.
  - **Credit:** a search summary says credit with a link is required; the game credits "art: LimeZu" on the title screen. Confirm the wording in each pack's LICENSE or README file.
  - **Free versions are for private or non-commercial use only** ([Modern Interiors](https://limezu.itch.io/moderninteriors), [free version note](https://limezu.itch.io/moderninteriors/devlog/207713/free-version-overview), [Modern Exteriors](https://limezu.itch.io/modernexteriors), [Modern UI](https://limezu.itch.io/modernuserinterface)).
  - **AI:** LimeZu distinguishes AI-assisted map building from training AI models on the art.
  - **GameDev Market** copies of the same packs carry a different "Pro Licence" ([GameDev Market](https://www.gamedevmarket.net/asset/modern-interiors-rpg-tileset-16x16)).
- **Actions:**
  1. List every pack used and confirm each was **bought, not the free version**. Keep receipts and each pack's licence file.
  2. Add a link to the "art: LimeZu" credit.
  3. Never ship the raw sprite sheets as a separate download.
  4. **Commission custom key art and store banners.** LimeZu's "Modern" packs are very widely used, so Steam reviewers may call it an **asset flip** [Inference].
  5. The pixel art won't carry into the Unreal version anyway.

### 5.5 Music licence (CC BY 4.0)
- **Current state is good.**
  - The track is "Bitwise — An Eight-Bit Video Game Soundtrack" by tcarisland, from OpenGameArt, licensed CC BY 4.0 ([OpenGameArt](https://opengameart.org/content/bitwise-an-eight-bit-video-game-soundtrack)).
  - The game credits the title, author, source and licence with links. It notes the changes made (converted to MP3 and loudness-normalised), which matches Creative Commons best practice ([CC attribution practices](https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution)).
  - CC BY 4.0 **allows commercial use** with attribution ([licence](https://creativecommons.org/licenses/by/4.0/)).
- **Watch-outs:**
  1. **Keep the attribution** in the game and add it to the store pages.
  2. **No technical restrictions downstream.** CC 4.0 forbids DRM that stops recipients using the licensed material. CC's own wiki notes that App Store FairPlay protection **may** count ([CC wiki](https://wiki.creativecommons.org/wiki/4.0/Technical_protection_measures)). Mitigations: skip Steam's DRM wrapper, keep the tracks freely available (web or itch.io), or **commission an owned soundtrack** for the paid release. An owned soundtrack is the safest option and a marketing asset too [Inference].
  3. **False Content ID claims** sometimes hit CC music on YouTube and Twitch; the music-off slider helps streamers [Inference].

### 5.6 Business and platform risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Solo-dev time split between the Unreal Phase 0 and shipping the paid 2D game** | High [Inference] | Finish selling 2D first. Treat UE as R&D until 2D launch data is in. |
| **Backlash when a free game gains a paywall** | Medium | Grandfather existing saves, keep the free season generous, and explain it in the game's voice. |
| **Weak unlock on a client-only web gate** | Medium | Separate demo and full builds; bundled mobile wrapper; accept honor-system losses at $4.99. |
| **Platform rules in flux** (Google fees changed 2026-06-30; Apple link-out case at the Supreme Court; Netflix cut indies in 2025) | Medium | Use simple native billing, no dependence on one catalogue, and re-check fees each year. |
| **Niche ceiling and a crowded cozy genre** ("cozy" games rose from 0.4% to 3.1% of $100k+ titles) | Medium | Position life-sim first and climbing-authentic second, and lean on the Stick RPG and BitLife hooks. |
| **Portrait UI on Steam and Steam Deck** | Medium | A landscape layout is a precondition for Steam. |
| **Privacy claims drifting** (any SDK breaks "collects nothing") | Low | Keep a no-SDK policy; update the privacy page to mention store-processed purchases. |
| **Android piracy of a premium build** | Low–Medium | Unlock model plus a low price; accept some loss. |

---

## Appendix A: Evidence from the repos

- `index.html`
  - **Credits:** music "Bitwise" by tcarisland (CC BY 4.0, OpenGameArt link, change note); "art: LimeZu".
  - **"Olympic" strings:** "Olympic Village", "Olympic Medalist", "Olympic Hopeful", "★ Road to the Olympics", "Next Olympic Games", "Olympic-qualified in…".
  - **Trivia:** IFSC as governing body; real climbers; El Capitan, Yosemite, Patagonia and others.
  - **Expeditions:** El Capitan, Cerro Torre, Trango Tower.
  - **Fictional brands:** Talon, Roost, Sabor, Grit, Kestrel, KINETIK, Nomad & Co., Ferrata Hardware, Ridgeline Chalk.
  - **In-game "climbing film tour" event.**
- `privacy.html`: "collects nothing, sends nothing, and has no servers… No analytics, advertising, or third-party trackers… No network requests."
- `twa-manifest.json`: package `io.github.rcjlabs.dirtbag`, host dirtbag.rcjlabs.com, `appVersionName` 0.670.0. The TWA loads the live site, so gating content has to happen on the public web.
- `Dirtbag-UE/ROADMAP.md`: Phase 0 (Session Proof) is current.
- `Dirtbag-UE/concepts/DIRTBAG-PLAN.md`: flags the "niche ceiling"; says "nothing like it exists", naming Jusant and New Heights but not Cairn or PEAK.
- `Dirtbag-UE/concepts/DIRTBAG.md`: recommends PC-first (Steam) for 3D, since "the 2D game already owns mobile".

## Appendix B: Method notes

- WebSearch was used throughout. WebFetch was **blocked by the egress policy** for every domain tried (listed at the top), and some Google domains were also denied. No policy denials were routed around.
- Sales figures from SteamSpy-style trackers (Gamalytic, games-stats, steam-revenue-calculator, GameRevenueData, SteamPageAnalyzer) are **model estimates**.
- Subreddit and creator counts come from third-party trackers and may lag.
- Legal points are general information from public sources, **not legal advice**. Get a trademark clearance opinion before you file or launch under the final title.
- Knowledge cutoff: my own background knowledge predates today (2026-09-28). Everything time-sensitive above was checked by search on the report date.
