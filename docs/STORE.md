# Store copy — Steam and Google Play, 0.999.86

The listings for the game, in its voice: dry, wry, second-person, climber-authentic, never jokey. Every fact in them is the build's, and the ones with a number or a name are held to it by `app/src/storecopy.test.ts`: the $41 start, the crags and their names, the five acts, V18 at the top, the 51 entries in the Record Book. When the game changes, change this with it.

The order follows the audit's advice (`docs/audit/market.md` §4.3): the life first, then the climbing, then the promise. Real people and brands stay out of it (§5); the expeditions' mountains are places, not brands.

`npm run check` holds each block to its store's limit: on Play, 80 characters for the short description, 4,000 for the full one and 500 for "What's new"; on Steam, 300 for the short description. Steam sets no limit on "About This Game" that this copy comes near.

## Steam

### Short description

```text steam-short
You’ve got a van, $41, and a gym pass you can’t really afford. Dirtbag is a climbing life-sim about the trade you make every day: a shift, or a day on the rock. Live at the Lot, work when you have to, and climb from gym plastic to the hardest lines in the valley.
```

### About This Game

```text steam-about
You’ve got a van, $41, and a gym pass you can’t really afford. Dirtbag is a climbing life-sim about the trade you make every day: a shift, or a day on the rock.

THE LIFE
Sleep in the van at the Lot. Cook at the van, or eat ramen again. Pick up shifts at the café and the diner, set problems at the gym for a free pass, and later coach and guide. The bills come every week, whether you sent anything or not. The van gets older with every mile, and one day it will ask you what it’s worth.

THE CLIMBING
Every crux has more than one way through it. Before a go you choose your beta, then you climb it: hold to climb, load a throw and let go in the band, stay in tension, or tap on the beat. Pump builds, skin wears thin, and the sun works its way across the crag, greasing each line it reaches. Fall at a crux often enough and you’ll find another way. Watch someone who knows it and you might learn a better one. Place your own gear on the trad lines, haul up the walls a pitch at a time, and name the first ascents you make. Other people repeat them, and the grades you gave them settle to what they are.

THE PLACES
Send City, the gym, with a new set every week. Roadside Crag, the first rock you’ll touch. Then Granite Gorge, Moonstone Boulders, Psicobloc Cove, Sandstone Mesa, The Big Stone, Wind River Walls and The Crucible, each one waiting till you climb hard enough to need it. Miller’s Bluff, if you can buy it. El Capitan, Cerro Torre and Trango Tower, if you can find the money and a partner. And somewhere past the Gorge, a canyon that isn’t on the map.

THE PEOPLE
Hazel knows everyone at the fire. Sage will climb with you if you keep showing up. Dex wants the first ascent you’ve been working, and he isn’t going to wait. Get close enough to a few of them and you’re a crew, with a name, a project, and favours owed both ways. The old guard notices. A stray called Scout sleeps by the vans. Keep heading out to climb and he might decide he’s yours.

THE YEARS
Five acts, from your first season on gym plastic to The Line. League night, then the Circuit, then Nationals, the World Series and the Games, in rounds, against a field that comes back every year. You get older. The body notices before you do. When you stop, someone younger picks up where you left off, and you’re the one at the fire with the beta.

THE RECORD BOOK
Fifty-one entries, each with a few lines about the day you earned it. Send something for the first time and the game draws you a card of it: your line, your grade, the day.

THE PROMISE
The first season is free as a demo, and your climber carries on from it. No ads, no accounts, no tracking. Plays offline. Mouse, keyboard or a controller, every button yours to move. Your save is a file on your machine, and it goes where you take it.
```

The demo line ("The first season is free as a demo") is for when the demo is up beside the page (Phase 15.3). Add a Steam Cloud line once criterion 3 of Phase 14 is checked in the Steam dev branch, not before.

### Capsules and library art

`npm run build --prefix app && npm run store:art --prefix app` draws them into `app/store-art/steam/` (not committed), from the game's own painters (`app/src/dev/store.ts`; to look at them, `npm run dev --prefix app`, then `/store.html`). The sizes are Steamworks' graphical assets as of 2026: check its page before uploading, since Valve changes them.

| File | Size | Where it goes |
|---|---|---|
| `header-highball.png` or `header-lot.png` | 920 × 430 | Header capsule |
| `small-highball.png` or `small-lot.png` | 462 × 174 | Small capsule |
| `main-highball.png` or `main-lot.png` | 1232 × 706 | Main capsule |
| `vertical.png` | 748 × 896 | Vertical capsule |
| `library-capsule.png` | 600 × 900 | Library capsule |
| `library-header-highball.png` or `library-header-lot.png` | 920 × 430 | Library header |
| `library-hero.png` | 3840 × 1240 | Library hero (no title: Steam lays the logo over it) |
| `library-logo.png` | 1280 × 720 | Library logo, clear behind |
| `page-background.png` | 1438 × 810 | Page background |
| `community-icon.png` | 184 × 184 | Community icon |

The wide capsules come two ways. **The highball** (recommended): the climber big near the top of Roadside's highball at golden hour, the title beside them. It says climbing at the size a capsule is seen in a list. **The Lot**: the vans at night, the fire, Hazel and Scout. It says the life, and it's the hero and the page's background either way. One set throughout, so the page reads as one thing.

### Screenshots

1920 × 1080, from the build, in `app/store-art/steam/`, in this order:

1. `08-lot-night.png`: the Lot at night, two hundred days in.
2. `05-climbing.png`: on the Warm Boulder, partway up.
3. `04-beta.png`: the Warm Boulder's beta sheet.
4. `10-record-book.png`: the Record Book, the entries in the game's own words.
5. `03-place-card.png`: the valley's map, Roadside's card: who's there, what it costs to get there.
6. `07-card.png`: the send card.
7. `01-lot-morning.png`: the first morning.
8. `09-journal-you.png`: a climber two hundred days in.

`02-map.png` and `06-sent.png` are there to swap in.

### The trailer

60 to 90 seconds that show the loop (van, shift, crag, send, fire) with the climbing as the hero, gameplay from the first two seconds, no talking head (the market audit: §1 on Jusant, §4.1). Cut by Evan; the shots come from the game:

1. `npm run dev --prefix app`, then `/trailer.html`: each beat loads a career two hundred days in, where the beat is, on a dry day, and opens the game (`app/src/dev/beats.ts`). The save that was there is kept, and the page's last button puts it back.
2. Chrome at 1920 × 1080, full screen (F11), Settings → Frame meter off, sound on. Record each beat at 60 fps (OBS or the like).
3. The beats, in the loop's order:
   - **The Lot, a morning:** walk to the fire, past Scout.
   - **A shift at the café:** the drive from the map, the money, the clock.
   - **Roadside, afternoon:** the wall, the people at the foot of it.
   - **The highball, sent:** the beta, the climb close up, the card. The hero shot.
   - **At the limit, Moonstone:** the pump and the cruxes on the hardest problem out there.
   - **The fire, at night:** the lights, the crew, the dog.
4. Open on the climb (the first two seconds), then the loop; close on the title (`library-logo.png`) over the Lot at night (`library-hero.png`) and "Free first season · Wishlist on Steam".

Music: the game's own, made in code (Phase 25), under its own credit, or none. No bought tracks without their licence written down (CLAUDE.md).

## Google Play

### Short description

```text short
Live in your van, work shifts, and climb from gym plastic to V18. Free, no ads.
```

### Full description

```text full
You’ve got a van, $41, and a gym pass you can’t really afford. Dirtbag is a climbing life-sim about the trade you make every day: a shift at the café, or a day on the rock.

THE LIFE
Sleep in the van at the Lot. Cook ramen. Pick up shifts when the money runs low, set problems at the gym for a free pass, and keep enough on the card for gas. The bills come every week, whether you sent anything or not. The van gets older with every mile.

THE CLIMBING
Every crux has more than one way through it. Before a go you choose your beta, then you climb it: hold to climb, load a throw and let go in the band, stay in tension, or tap on the beat. Pump builds, skin wears thin, and the sun works its way across the crag, greasing each line it reaches. Fall at a crux often enough and you’ll find another way. Watch someone who knows it and you might learn a better one. Place gear on the trad lines, haul up the walls, and name the first ascents you make.

THE PLACES
Send City, the gym, with a new set every week. Roadside Crag, the first rock you’ll touch. Then Granite Gorge, Moonstone Boulders, Psicobloc Cove, Sandstone Mesa, The Big Stone, Wind River Walls and The Crucible, each one waiting till you climb hard enough to need it. Miller’s Bluff, if you can buy it. And somewhere past the Gorge, a canyon that isn’t on the map.

THE PEOPLE
Hazel knows everyone at the fire. Sage will climb with you if you keep showing up. Dex wants the first ascent you’ve been working, and he isn’t going to wait. Get close enough to a few of them and you’re a crew, with a name and favours owed both ways. A stray called Scout sleeps by the vans. Keep heading out to climb and he might decide he’s yours.

THE YEARS
Five acts, from gym plastic to The Line. Comps in rounds, a field that comes back every year, and a body that gets older. Send something for the first time and the game draws you a card of it: your line, your grade, the day.

THE PROMISE
Free. No ads, no accounts, no tracking. Plays offline. Your save stays on your phone, and nothing is sent anywhere. You can take it with you as a file.

If you played the old version (0.956): it has retired. Your career is still on your phone. The game will keep it as a file, or carry you across under your old name.
```

### What’s new in 0.999.86

```text whats-new
Your climber can leave as a file and come back: Settings has Export your save, and the first screen has Import a save. A controller works on every screen now, its buttons yours to move in Settings. The marks the handwriting never had, the ticks, the crosses and the suits, are drawn now instead of guessed at. And if the game breaks, it says so instead of going blank, with your save where you left it.
```

### At launch (Phase 19)

When the gate goes on (`DIRTBAG_GATE` in `deploy.yml`), the listing changes with it: the first season free, the rest one purchase inside the game. These replace the three blocks above on the day; until then they'd describe a game that isn't live. The price isn't in the words: Play shows it, and "Contains in-app purchases", itself.

```text short-launch
Live in your van, work shifts, climb from gym plastic to V18. First season free.
```

```text full-launch
You’ve got a van, $41, and a gym pass you can’t really afford. Dirtbag is a climbing life-sim about the trade you make every day: a shift at the café, or a day on the rock.

THE LIFE
Sleep in the van at the Lot. Cook ramen. Pick up shifts when the money runs low, set problems at the gym for a free pass, and keep enough on the card for gas. The bills come every week, whether you sent anything or not. The van gets older with every mile.

THE CLIMBING
Every crux has more than one way through it. Before a go you choose your beta, then you climb it: hold to climb, load a throw and let go in the band, stay in tension, or tap on the beat. Pump builds, skin wears thin, and the sun works its way across the crag, greasing each line it reaches. Fall at a crux often enough and you’ll find another way. Watch someone who knows it and you might learn a better one. Place gear on the trad lines, haul up the walls, and name the first ascents you make.

THE PLACES
Send City, the gym, with a new set every week. Roadside Crag, the first rock you’ll touch. Then Granite Gorge, Moonstone Boulders, Psicobloc Cove, Sandstone Mesa, The Big Stone, Wind River Walls and The Crucible, each one waiting till you climb hard enough to need it. Miller’s Bluff, if you can buy it. And somewhere past the Gorge, a canyon that isn’t on the map.

THE PEOPLE
Hazel knows everyone at the fire. Sage will climb with you if you keep showing up. Dex wants the first ascent you’ve been working, and he isn’t going to wait. Get close enough to a few of them and you’re a crew, with a name and favours owed both ways. A stray called Scout sleeps by the vans. Keep heading out to climb and he might decide he’s yours.

THE YEARS
Five acts, from gym plastic to The Line. Comps in rounds, a field that comes back every year, and a body that gets older. Send something for the first time and the game draws you a card of it: your line, your grade, the day.

THE PROMISE
The first season is free, all of it. Unlock the rest once, inside the game, and the same climber carries on from the same morning. No ads, no accounts, no tracking, and nothing else to buy. Plays offline. Your save stays on your phone, and the game sends nothing anywhere. You can take it with you as a file.

If you played the old version (0.956): it has retired. Your career is still on your phone. The game will keep it as a file, or carry you across under your old name.
```

```text whats-new-launch
The first season stays free, and the rest of the valley is one purchase now, made once through Google Play, and the same climber carries on from the same morning. If you were climbing here before today, nothing changes: your climber keeps the whole game.
```

### Screenshots

1080 × 1920 (9:16, which Play can feature), from the build, in `app/store-art/play/`, in this order:

1. `01-lot-morning.png`: the first morning. *Caption:* "$41, a van, and a gym pass you can’t afford."
2. `04-beta.png`: the Warm Boulder's beta. *Caption:* "Every crux has more than one way through."
3. `05-climbing.png`: on the wall. *Caption:* "Pump builds. The rock doesn’t care."
4. `03-place-card.png`: Roadside's card. *Caption:* "See who’s there before you drive."
5. `send-card.png`: the send card itself, 1080 × 1920. *Caption:* "Your send, drawn on your phone."
6. `08-lot-night.png`: the Lot at night. *Caption:* "The fire’s where the beta is."
7. `10-record-book.png`: the Record Book. *Caption:* "The Record Book keeps what you did."
8. `02-map.png`: the valley. *Caption:* "Nine crags, and one nobody’s mapped."

The screenshots aren't committed (they're binary). Remake them from the build when the game changes.
