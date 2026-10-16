# The desktop build on Steam

What the repo does (Phase 14.3 and 14.4), and what's yours to do on the Steamworks site.

## The app ID

`steam.json` holds it: `480`, Valve's public test app, until Dirtbag has its own. Put the real one there and commit it. Without Steam running (a dev run, the smoke test, a copy started outside Steam), the game plays the same and unlocks nothing.

## Achievements

One per Record Book entry: 51, listed in `steam/achievements.json` with the API name, the display name and the description to enter under **Stats & Achievements**. The API names are the entries' ids in capitals (`FIRSTSEND`), and the ids are stable, so an entry can't be renamed out from under Steam. When the book changes, `WRITE=1 npx vitest run src/game/achievements.test.ts` in `app/` rewrites the list, and the test fails until you do.

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

## The overlay

Steam's overlay (Shift+Tab, the Deck's on-screen keyboard) is switched on only when Steam starts the game (it sets `SteamAppId`): its switches put Chromium's GPU work in-process, so a copy started any other way doesn't take them.
