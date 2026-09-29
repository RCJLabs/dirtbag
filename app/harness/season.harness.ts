// Prints the season harness's tables: every start and strategy over several seeds, with the
// curves Phase 6's targets are written against. `npm run harness` (it takes a while).
import { it } from 'vitest';
import type { Strategy } from '../src/sim/bot';
import { STARTS } from '../src/sim/climber';
import { checkpoints, contentOut, firstInjury, firstTry, median, season } from '../src/sim/harness';

const SEEDS = Number(process.env.SEEDS ?? 12);
const DAYS = Number(process.env.DAYS ?? 28);
const AT = [7, 14, 21, 28, 42, 56].filter((d) => d <= DAYS);
const out = (s = '') => process.stdout.write(`${s}\n`);
const f1 = (x: number) => (Number.isNaN(x) ? '–' : x.toFixed(1));

it('season', { timeout: 600_000 }, () => {
  out(`\n# Season harness: ${SEEDS} seeds × ${DAYS} days, human-ish hands\n`);
  for (const strategy of ['climber', 'balanced', 'worker'] as Strategy[]) {
    out(`## ${strategy}\n`);
    out(
      `| start | refused | ${AT.map((d) => `d${d} grade · $ · runway · worked`).join(' | ')} | first V5 go | nothing left | hurt by d28 | reckless |`,
    );
    out(`|---|---|${AT.map(() => '---').join('|')}|---|---|---|---|`);
    for (const start of Object.keys(STARTS)) {
      const runs = Array.from({ length: SEEDS }, (_, k) =>
        season(`h-${start}-${k}`, { start, strategy, days: DAYS, human: true }),
      );
      const cps = runs.map((r) => checkpoints(r, AT));
      const cells = AT.map((_, i) => {
        const c = cps.map((x) => x[i]!);
        return `V${f1(median(c.map((x) => x.grade)))} · $${median(c.map((x) => x.cash)).toFixed(0)} · ${f1(median(c.map((x) => x.runway)))}d · ${f1(median(c.map((x) => x.workDays)))}/7`;
      });
      const v5 = runs.map((r) => firstTry(r, 5) ?? 99);
      const out5 = runs.map((r) => contentOut(r) ?? 99);
      const refused = runs.reduce((n, r) => n + r.refused.length, 0);
      const hurt = runs.filter((r) => (firstInjury(r) ?? 99) <= 28).length;
      const wild = Array.from({ length: SEEDS }, (_, k) =>
        season(`h-${start}-${k}`, { start, strategy, days: Math.min(DAYS, 28), human: true, reckless: true }),
      ).filter((r) => (firstInjury(r) ?? 99) <= 28).length;
      out(
        `| ${start} | ${refused} | ${cells.join(' | ')} | ${median(v5) >= 99 ? '–' : `day ${median(v5)}`} (${v5.filter((d) => d < 99).length}/${SEEDS}) | ${median(out5) >= 99 ? '–' : `day ${median(out5)}`} | ${hurt}/${SEEDS} | ${wild}/${SEEDS} |`,
      );
    }
    out('');
  }
});
