// Phase 33: comps with rounds, measured (Phase 33's criterion 1). Nationals, the World
// Series and the Games climbed round by round with the career bots' human-ish hands, at every
// grade across each one's range: how often you go through each cut, make the final, the
// podium and the win, and where you place. COMP_SEEDS widens the sample.
import { it } from 'vitest';
import { needFor } from '../src/sim/climber';
import { compField, compSet, goesFor, gradesFor, placing, roundName, roundOf } from '../src/sim/comps';
import { COMP_TIERS } from '../src/sim/content/comps';
import { act, newGame } from '../src/sim/game';
import { median } from '../src/sim/harness';
import { humanHands, playGo } from '../src/sim/bot';
import { Rng } from '../src/sim/rng';
import type { GameState } from '../src/sim/types';

const SEEDS = Number(process.env.COMP_SEEDS ?? 12);
const out = (s = '') => process.stdout.write(`${s}\n`);
const pct = (n: number, of: number) => `${Math.round((100 * n) / Math.max(1, of))}%`;

const climber = (seed: string, g: number): GameState => {
  const s = act(newGame(seed), { t: 'create', name: 'Bot', start: 'allrounder' }).state;
  const n = needFor(g) + 1;
  return {
    ...s,
    climber: { ...s.climber, skills: { power: n, fingers: n, endurance: n, technique: n, head: n } },
  };
};

// One round climbed fresh: each problem gone at up to the goes its clock buys (Phase 33.2);
// the tops, their goes, and the place against the round's field.
function climbRound(s: GameState, tier: number, day: number) {
  let tops = 0;
  let goes = 0;
  for (const p of compSet(s.seed, tier, day))
    for (let g = 1; g <= goesFor(tier, roundOf(tier, day)); g++)
      if (
        playGo(
          { ...s, day, energy: 100, skin: 100 },
          p,
          humanHands(Rng.fromStream(s.seed, 'session').derive(`comp-${day}-${p.id}-${g}`)),
        ).sent
      ) {
        tops++;
        goes += g;
        break;
      }
  const field = compField(s.seed, tier, day);
  return { tops, place: placing({ name: s.climber.name, tops, goes }, field), of: field.length + 1 };
}

// A comp from its qualifier: each round climbed while you're through the cut; the round you
// went out in (or the final) and your place.
export function climbRounds(s: GameState, tier: number, start: number) {
  const cuts = COMP_TIERS[tier]!.rounds ?? [];
  for (let k = 0; ; k++) {
    const r = climbRound(s, tier, start + k);
    if (k === cuts.length || r.place > cuts[k]!) return { reached: k, place: r.place, tops: r.tops };
  }
}

it('Phase 33: comps in rounds, measured', { timeout: 3_600_000 }, () => {
  out('\n# Comps in rounds\n');
  for (const tier of COMP_TIERS.map((t, i) => (t.rounds ? i : -1)).filter((i) => i >= 0)) {
    const t = COMP_TIERS[tier]!;
    const cuts = t.rounds!;
    const [lo, hi] = gradesFor(tier, t.on);
    const names = cuts.map((_, k) => roundName(tier, k + 1));
    out(
      `\n## ${t.name}: ${t.field} climbers, V${lo} to V${hi}, ${cuts.map((c, k) => `${c} to the ${names[k]}`).join(', ')} (${SEEDS} comps a grade)\n`,
    );
    out(`| grade | ${names.map((n) => `through to the ${n}`).join(' | ')} | podium | won | place, median |`);
    out(`|---|${names.map(() => '---').join('|')}|---|---|---|`);
    for (let g = lo - 1; g <= hi + 1; g++) {
      const res = Array.from({ length: SEEDS }, (_, k) =>
        climbRounds(climber(`rounds-${tier}-${g}-${k}`, g), tier, t.on + k * t.every),
      );
      out(
        `| V${g} | ${names.map((_, k) => pct(res.filter((r) => r.reached > k).length, SEEDS)).join(' | ')} | ${pct(res.filter((r) => r.reached === cuts.length && r.place <= 3).length, SEEDS)} | ${pct(res.filter((r) => r.reached === cuts.length && r.place === 1).length, SEEDS)} | ${median(res.map((r) => r.place))} |`,
      );
    }
  }
});
