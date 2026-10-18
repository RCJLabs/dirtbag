# The desktop build on Steam

What the repo does (Phase 14.3, 14.4 and 15.3), and what's yours to do on the Steamworks site.

## The app ID

`steam.json` holds two: `appId`, the full game's, and `demoAppId`, the demo's (a Steam demo is an app of its own under the game's). Both are `480`, Valve's public test app, until Dirtbag has its own. Put the real ones there and commit them. Without Steam running (a dev run, the smoke test, a copy started outside Steam), the game plays the same and unlocks nothing.

## Achievements

One per Record Book entry: 53, listed in `steam/achievements.json` with the API name, the display name and the description to enter under **Stats & Achievements**. The API names are the entries' ids in capitals (`FIRSTSEND`), and the ids are stable, so an entry can't be renamed out from under Steam. When the book changes, `WRITE=1 npx vitest run src/game/achievements.test.ts` in `app/` rewrites the list, and the test fails until you do.

- Each needs an icon, locked and unlocked: art to make.
- Worth hiding (Steam's "hidden" box): `HOLLOW` (Off the Map, a place the game doesn't show till you find it), and any you'd rather not spoil.
- The game unlocks an entry when it's written into the book, and at every launch unlocks everything the save's family has ever earned, an heir's forebears included. So one earned offline, or on the web before the save was carried over, comes through the next time Steam's running.
- With the test app (480), nothing unlocks: Spacewar's achievements have other names. Criterion 3 is checked on the real app ID, in a dev branch.

## Steam Cloud

The save is one file, `dirtbag.json`, in the user-data folder. Under **Steam Cloud → Auto-Cloud**, a root path per platform:

| Platform | Root | Subdirectory | Pattern |
|---|---|---|---|
| Windows | `WinAppDataRoaming` | `Dirtbag` | `dirtbag.json` |
| macOS | `MacAppSupport` | `Dirtbag` | `dirtbag.json` |
| Linux and Steam Deck | `LinuxXdgConfigHome` | `Dirtbag` | `dirtbag.json` |

Only that file: `window.json` (where the window was) belongs to the machine, and the rest of the folder is Chromium's own. A save is around 100 KB; a quota of 10 MB and a few files is plenty. Settings and the plan ride in the same file, so they follow the save.

## Depots

**Actions → Build desktop** packs Linux, Windows and macOS (Apple silicon) folders as artifacts; each is one depot. Launch options: `Dirtbag.exe` on Windows, `Dirtbag` on Linux, `Dirtbag.app` on macOS. The Steam Deck can run the Linux build natively, or the Windows one under Proton.

Unsigned for now: SmartScreen and Gatekeeper warn until the builds are signed (and the Mac one notarized), which needs your certificates.

## The Deck: button names and the keyboard

Phase 14.6b: the game asks Steam whether it's running on a Deck (`utils.isSteamRunningOnSteamDeck`) and there names the pad's buttons as the Deck prints them (L1, R1 and so on, not LB, RB). A text field reached by the pad (a climber's name, a first ascent's, the crew's) asks for Steam's floating keyboard under it (`utils.showFloatingGamepadTextInput`), as Deck Verified wants; Steam shows it only where the overlay is up (below). Neither has run on a Deck yet.

## The demo

Phase 15.3: the same desktop code packs the demo. `npm run build:demo --prefix app`, then `npm run pack:demo`: it copies `app/dist-demo` in and writes `edition.json` (`{"edition":"demo"}`) beside `main.js` for the packed copy (both gone from the repo's folder once it's packed). The demo then:

- is **"Dirtbag Demo"**: its folder (`Dirtbag Demo-<platform>`), its executable (`Dirtbag Demo.exe`, `Dirtbag Demo`, `Dirtbag Demo.app`) and its window's title;
- keeps its **own user-data folder**, `Dirtbag Demo` beside the full game's `Dirtbag`, so its `dirtbag.json` is its own (14.5c's keys already keep the two apart in one file);
- starts Steam as **`demoAppId`**;
- on its **last card**, offers the full game's store page in Steam's overlay (`overlay.activateToStore` with `appId`). Without Steam it says Steam isn't running.

`npm run smoke:demo` plays the demo's first minute in the desktop build (CI does, after the full game's); `node smoke.mjs --demo "out/Dirtbag Demo-linux-x64/Dirtbag Demo"` plays a packed one. **Build desktop** packs both, each platform's artifact holding the two folders.

On the Steamworks site: create the demo app under Dirtbag's, put its ID in `demoAppId`, upload the demo's folders as its depots (launch options as above, under the demo's name), and give it Auto-Cloud with the subdirectory `Dirtbag Demo` in place of `Dirtbag`. It needs no achievements: the Record Book's land when the climber carries on in the full game (14.4 unlocks everything the save has earned at launch).

**Unverified:** the store page in the overlay hasn't run with Steam. Where the overlay is off (a copy Steam didn't start), Steam may show the page in its client or not at all.

## The icon

The executables and the Linux window take the game's own icon, drawn at pack time by the site's icon painter (`icons.mjs`, from `app/build/pwa.ts`): an `.ico` (16 to 256) for Windows, an `.icns` (128 to 1024) for macOS, a 512 PNG for Linux. Steam's own icons (the client icon, the community icon) are uploaded on the Steamworks site: `npm run store:art --prefix app` draws the community icon (`docs/STORE.md`).

## The overlay

Steam's overlay (Shift+Tab, the Deck's on-screen keyboard) is switched on only when Steam starts the game (it sets `SteamAppId`): its switches put Chromium's GPU work in-process, so a copy started any other way doesn't take them.
