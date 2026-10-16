# Beta — two rounds before launch (Phase 19.4)

Phase 19's fourth Done-when: **beta round 2 has no open critical or high bugs.** This is the kit for getting there: who plays, on what, how they report, and which bugs hold up launch. Running the rounds is Evan's.

## The rounds

| | Round 1 | Round 2 |
|---|---|---|
| **When** | As soon as the Steam playtest app exists | About a month before launch, on the release candidate |
| **Who** | 50–100 players: climbers, and at least a third who've never climbed | 100–200, the same mix; round 1's players invited back |
| **Android** | Play's closed testing track. The app shows the live site, so this is the current game. Licence testers try the unlock with the tester's link (below). | The same, on the candidate deployed to the live site, the gate still off. Licence testers buy and restore again. |
| **Desktop** | A Steam Playtest (Steamworks → Playtest), from **Build desktop**'s folders | The same, on the candidate |
| **The question** | Does a new player get from the first morning to a send without help? Where do they stop playing? | Is anything still broken that a player would hit? |

The web needs no round of its own: the Android app is the site, and the desktop is the same build in Electron.

## The tester's link: Play's unlock before launch

The Android app always shows the live site, and the gate is off there until launch, so the unlock never shows. To try it:

1. Add the testers' Google accounts as **licence testers** (Play Console → Setup → License testing). Their purchases are test purchases and cost nothing.
2. Make sure the one-time product `full_game` exists and is active.
3. On the phone, tap a link to **`https://dirtbag.rcjlabs.com/?gate=try`** (from an email or a note). With the app installed, it opens in the app. If it opens in Chrome instead, long-press it and open it in the app.
4. That tab plays as if it were launch day and the climber here weren't from before (`game/unlock.ts`, `trying`). A climber past the first season stops at the season's last card, which offers **Unlock the full game** at Play's price, and **You've bought it already**.
5. **Buy** it: the game opens again, unlocked, on the same climber. **Restore:** clear the app's site data (or use a second phone), sign in with the same account, open the link again. The game should open at start-up, or with "You've bought it already" on the last card.

The link shuts the gate for that tab only and marks nothing; closing the app ends it. A real climber is never set aside: a save from past the first season loads and waits at the last card (19.4). Don't tap **Start over** on that card unless you mean it. It starts a new climber in place of yours, as it always has. Export your save first if in doubt.

## How testers report

**The words for the invitation:**

> Thanks for climbing. When something's wrong, we want to know what you were doing and what you expected. If the game breaks, it shows a screen called "Something broke": tap **Copy it** and paste it into your report. It says what went wrong and your last few moves, and no name you typed. If the game didn't break but something's off, say what you did, what happened, and what you expected. Your save, as a file (Settings → Export your save), helps us see it for ourselves; send it only by email, never in a public post.

**Where reports go:**
- **Most testers:** a form on Steam's playtest page, or email to `REPORT_TO` once it has an address (`ui/crash.ts`; the error screen's mail button appears with it).
- **Testers comfortable with GitHub:** an issue from the **Beta bug** template (`.github/ISSUE_TEMPLATE/beta-bug.yml`). The repository is public, so the template asks for no save.

**What a report holds** (`ui/crash.ts` and `game/trail.ts`, 19.4):
- the build;
- web or desktop, and the browser;
- the error and its stack;
- the day and the hour;
- where the climber was, and the save's seed;
- the last twelve moves, any name the player typed left out (walking is one line).

**Finding a bug again:** load the tester's save, which is as it was after their last move; the moves say what came next.

## Severity, and what holds up launch

| Severity | What it means | Launch |
|---|---|---|
| **Critical** | A save lost or corrupted; a purchase taken and not unlocked, or unlocked and refunded; the game won't start; anything that sends data off the device | Blocks |
| **High** | A crash a player can hit in normal play; a softlock (no way forward but a reload or a new climber); a store rule broken (the Android app showing another store, say); the first season can't be finished | Blocks |
| **Medium** | Wrong but recoverable: a rule that misbehaves, a sheet that can't be reached by controller, text that overflows, a balance hole a tester found | Fix if there's time; list in the launch notes if not |
| **Low** | Cosmetic, wording, a nicer way to do something | After launch |

**Triage:** once a week during a round. Each report gets a severity and an owner (Evan), and a critical one gets an answer within a day. A bug fixed on the branch stays open until its fix is on the live site, or in the Steam build, that testers play.

**The gate:** launch waits until round 2 has no open critical or high bugs (Done-when 4), and the bots and the e2e run clean (Done-when 5).

## The bug bash list

One list for both rounds, kept as GitHub issues with the `beta` label and a `severity:` label each. Or kept privately, if testers' reports carry anything that shouldn't be public. A closed bug names the release that fixed it.
