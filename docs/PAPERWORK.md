# Paperwork — the stores' forms, answered from the game (Phase 19.3)

The answers each store's forms ask for, and the evidence in the code behind each one, so filling them in is transcribing. They're the game's as of 0.999.89 (16 Oct 2026). When the game changes what it shows or keeps, change this with it.

None of this is legal advice. The privacy page and the terms were written for a solo developer's offline game sold through three stores. Have them read by someone qualified if you want certainty, above all the terms, which name no governing law: that's your jurisdiction to name.

## The pages

- **`privacy.html`** (served at `/privacy.html`). It covers:
  - what the game keeps on the device, the unlock among it;
  - the host (GitHub Pages sees an IP address and a browser when files load);
  - each store's part in a purchase (Google Play in the Android app, Steam, itch.io);
  - the notification permission the Android app declares and never uses;
  - the optional features;
  - deleting your data in a browser, in the Android app and on a computer.
- **`terms.html`** (served at `/terms.html`, new). It covers:
  - the licence to play, and that the public source isn't a licence to copy it;
  - purchases through each store, under its refund policy;
  - honouring climbers from before the gate;
  - that saves are the player's to keep safe;
  - that the game isn't climbing instruction;
  - no warranty, with consumer law left standing.
- **Shipping:** both ship beside the game (`scripts/stage-site.mjs`), and `npm run check` fails if either is missing or they stop linking each other.

**URLs for the forms:** `https://dirtbag.rcjlabs.com/privacy.html` and `https://dirtbag.rcjlabs.com/terms.html`.

## Google Play

### Data safety

**Recommended answer: the app collects and shares no user data.** Under Play's definitions, the app itself sends nothing off the device:
- the game makes no network calls of its own (`npm run smoke` and the e2e fail on any request off the site);
- the save, the settings and the unlock stay in the browser's storage on the phone.

Two things to check before you submit, because Play's help doesn't settle them:
- **Google Play's billing.** Payment details never reach the app. The purchase goes to Google, and the game keeps only a yes on the phone. A third-party guide says to declare "Purchase history" only if your app or backend records purchases; this one records none [unverified against Google's own wording].
- **The host's logs.** GitHub Pages sees each device's IP address when the game's files load, and may log it for security. The privacy page says so. Whether a static host's access logs count as collection by the app is a judgement call; most TWA listings don't declare it [inferred].

The rest of the form follows:
- **Encryption in transit:** the site is HTTPS only.
- **Account deletion:** there are no accounts.

### Content rating (the IARC questionnaire)

Answer as below; the rating each region gives comes out of the questionnaire, not from here. Category: **Game**.

- **Violence:**
  - Climbing injuries are described in text: "A pop you hear before you feel. {Kind}, on {route}." (`sim/content/injuries.ts:49`).
  - There's an optional Free Solo mode, chosen at the first screen, where one fall ends the climber (`ui/Create.tsx:175`). It's shown as a cartoon figure easing down the wall, a small mark where it came off, and an end card (`view/paint/people.ts:724`, `view/render.ts:641`, `ui/sheets.ts` "Free Solo, over"). No blood, no body, no impact.
  - No fighting, no weapons.
  - **Answers:** realistic violence: no. Depictions of death: yes, non-graphic, text and a cartoon, opt-in. Blood: no.
- **Fear:** mild tension, in text. Someone knocks on the van at night (`sim/content/knocks.ts:40`), a storm on a wall (`sim/content/epics.ts:145`), hitchhikers who steal (`sim/content/road.ts:344`). Nothing supernatural. **Answer:** no frightening content beyond mild tension.
- **Sexuality:** a romance (once a life, with Sage or Mara), as far as a kiss: "and kisses you" (`sim/content/romance.ts:191`), a choice "Kiss her" (`romance.ts:23`). No sexual content, no nudity, no innuendo. **Answer:** sexual content: no; romance and kissing referenced.
- **Language:** "hell" three times ("a hell of a drive", `story.full.ts:81`; two route names in `content/gym.ts`). Nothing stronger anywhere. **Answer:** mild language.
- **Controlled substances:**
  - Alcohol is referenced, and the player is sometimes handed or brings a drink in a story choice: "They hand you a beer for turning up" (`content/knocks.ts:119`), "Bring the cider nobody asks about" (`content/folks.ts:75`). There's no drunkenness and no mechanic for it.
  - No tobacco, no drugs.
  - Coffee restores energy (`content/places.ts:977`).
  - A cortisone shot is a treatment for injury (`content/places.ts:631`).
  - **Answers:** alcohol: referenced, used by the player in a few choices, no intoxication. Tobacco: no. Drugs: no.
- **Gambling:** **simulated gambling, yes.**
  - At the fire at night: blackjack and heads-up hold'em, played for the player's in-game cash. The buy-in a night is capped (`GAMES.bj.cap`, `GAMES.he.cap` in `sim/dials.ts`). The cash is won or lost (`sim/game.ts:3727`, `3738`).
  - The cash can't be bought with real money and can't be cashed out.
  - Liar's dice and horseshoes are for nothing but bond.
  - **Answers:** real-money gambling: no. Simulated gambling: yes.
- **Crude humour, discrimination:** none (no slurs, no stereotyping).
- **Interactivity:**
  - No chat, no online play, no user-generated content shared by the app, no location.
  - The player types names (the climber, a first ascent, the crew) that stay on the device.
  - A send card can be passed on through the phone's own share sheet, by the player.
  - **Answers:** users interact: no. Shares location: no. Unrestricted internet: no. Digital purchases: yes (one, the full game).

### Target audience and content

- **Target age:** 13 and over is the recommendation; the choice is yours. Simulated gambling for game cash, an optional death, alcohol references and a romance make it no app for under-13s. A child audience would bring Play's Families policy, which forbids simulated gambling.
- **Appeals to children:** no.
- **Ads:** no.
- **In-app purchases:** yes, one (the unlock, at launch).
- **Other declarations** (news, health, financial features, government): none apply.

### The listing at launch

The launch versions of the short and full descriptions and "What's new" are in `docs/STORE.md` (At launch), held to Play's limits by `npm run check`. Play shows the price and "Contains in-app purchases" itself.

## Steam

### The content survey (Mature Content)

- **Recommended:** tick none of the boxes. There's no frequent violence or gore, no nudity or sexual content, and nothing adults-only.
- **Describe it, in the survey's free text:** "Card games (blackjack and hold'em) played at a campfire for in-game money, which can't be bought or cashed out. References to alcohol. An optional mode in which one fall ends your climber, shown without blood. Climbing injuries, in text. A romance, as far as a kiss."
- **To check:** whether Valve wants the simulated gambling under General Mature Content. Its survey's current wording decides; I haven't read it [unverified].

### Legal fields

- **Privacy policy URL:** `https://dirtbag.rcjlabs.com/privacy.html`.
- **EULA:** Steam's Subscriber Agreement covers a game with no EULA of its own. The terms page can go in as a custom EULA, but needn't. Leaving it off keeps the purchase flow standard.

## itch.io

itch.io has no rating form. On the page:
- link the privacy page and the terms;
- in the description, mention the card games for in-game money and the optional Free Solo mode, as above.

## Notes for later

- **No word filter on typed names.** The climber's, a first ascent's and the crew's names are free text with no filter. Nothing shares them but the player (the send card through the phone's share sheet, a save file), so no form asks; it would matter if anything ever went online.
- **When `REPORT_TO` gets an address** (the error screen's mail button), the privacy page already covers it: the player sends the report from their own mail app.
