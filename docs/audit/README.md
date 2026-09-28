# Audit evidence: Dirtbag v0.956.0

These are the working reports behind [../AUDIT.md](../AUDIT.md) (the synthesis) and [../ROADMAP.md](../ROADMAP.md) (the 20-phase plan). Each report was written for one lane of the game. They hold the details the synthesis leaves out: formulas, constants, line references, simulations, bug repro steps and full opportunity lists.

| Report | Lane | Highlights |
|---|---|---|
| [core-loop.md](core-loop.md) | Time, needs, survival, van life, food, health | The sleep pipeline step by step; fail states; five disagreeing night paths; first-month injury simulation; busywork meters |
| [climbing.md](climbing.md) | Skills, grades, routes, attempts, minigames, training, conditions, progression | The odds function and its ~45 modifiers; minigame windows and mix; progression simulation (days and real hours per grade); exploits |
| [economy.md](economy.md) | Jobs, money, sponsors, media, costs, sinks | Pay formulas; per-job minigame analysis; income/expense model for three strategies; runaway media income |
| [meta.md](meta.md) | Comps, rivals, character creation, goals, factions, legacy | Comp engine and winnability simulation; the ~28 trackers; the skill-clamp bug; legacy carry-over |
| [social.md](social.md) | Partners, romance, locals, events, minigames, writing | Event catalogue with triggers and repeat rules; bond inflation; content exhaustion by day; best and worst 10 lines |
| [world-ui.md](world-ui.md) | Map, rendering, assets, UI, onboarding, accessibility, audio | Why the map looks inconsistent, with numbers; building signage audit; UI surface inventory; the valley-map recommendation |
| [tech.md](tech.md) | Build, saves, performance, RNG, service worker, stores, licensing | Reproduced save-loss cases; load and memory measurements; target architecture and migration path |
| [market.md](market.md) | Comparable games, audience, business model, marketing, legal risks | Pricing and store economics in 2026; Next Fest dates; trademark and licence risks; revenue scenarios |

Screenshots used in the synthesis are in [img/](img/).

## Reading the line numbers

The repo ships only the compiled build, so the auditors worked from a prettified copy of the JavaScript bundle inside `index.html`. Line numbers such as `(51145)` or `L51145` refer to that file. `$SRC/bundle.pretty.js` means the same file. To regenerate it from the v0.956.0 `index.html`:

```
sed -n '18,169p' index.html > bundle.min.js
npx prettier@3.8.1 --parser babel --print-width 120 bundle.min.js > bundle.pretty.js
```

Local identifiers are minified: `Vd`, `H$` and `Xpe` are minifier names, not source names. Strings, object keys, save-state fields and data tables are intact, so every reference can be found by searching for nearby text. Line numbers won't match the original source files.

`$SP/work-*/` refers to the auditors' scratch space. Their simulation and extraction scripts were throwaway, reproduce formulas already quoted in the reports, and are not committed.

## How much to trust each claim

- Every claim is labelled:
  - **[ESTABLISHED]**: read in the code or data, or reproduced in the running build.
  - **[INFERRED]**: reasoning, simulation or estimate.
- The lead auditor spot-checked the headline claims against the code: the skill clamps, the grade curve, the dog/ticket bug, gym content cash, and the odds function. One apparent finding from the hands-on session, "95% send odds for a new climber", came from a dev-panel skill grant and was discarded. The reports themselves were not line-by-line re-verified.
- Simulations use constants read from the code, but the play patterns are assumptions. Treat day counts and hours as shapes, not promises.
- `market.md` figures come from web-search summaries of the linked pages, dated 2026-09-28; the pages themselves couldn't be fetched. Check a number at its source before quoting it. The legal notes are general information, not legal advice.
