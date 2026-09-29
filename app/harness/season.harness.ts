// Prints the season harness's tables: every start and strategy over several seeds, with the
// curves Phase 6's targets are written against, then those targets, passed or failed.
// `npm run harness` (it takes a while).
import { it } from 'vitest';
import type { BotRun, Strategy } from '../src/sim/bot';
import { gradeOf, STARTS } from '../src/sim/climber';
import { ACTS } from '../src/sim/content/places';
import { PROTOCOLS } from '../src/sim/content/training';
import { newGame } from '../src/sim/game';
import { sessionGains } from '../src/sim/sessions';
import { TRAIN } from '../src/sim/dials';
import { checkpoints, contentOut, firstInjury, firstTry, median, season } from '../src/sim/harness';

const SEEDS = Number(process.env.SEEDS ?? 12);
// Eight weeks: the first month is Phase 6's, and the second is where the mid-grades squeeze
// (Phase 21.4 found the bots going broke at V5 from day 45, which 28 days never saw).
const DAYS = Number(process.env.DAYS ?? 56);
const AT = [7, 14, 21, 28, 42, 56].filter((d) => d <= DAYS);
const out = (s = '') => process.stdout.write(`${s}\n`);
const f1 = (x: number) => (Number.isNaN(x) ? '–' : x.toFixed(1));
const STRATEGIES: Strategy[] = ['climber', 'balanced', 'worker'];

it('season', { timeout: 600_000 }, () => {
  out(`\n# Season harness: ${SEEDS} seeds × ${DAYS} days, human-ish hands\n`);
  const all: Record<Strategy, BotRun[]> = { climber: [], balanced: [], worker: [] };
  const reckless: BotRun[] = [];
  for (const strategy of STRATEGIES) {
    out(`## ${strategy}\n`);
    out(
      `| start | refused | ${AT.map((d) => `d${d} grade · $ · runway · worked`).join(' | ')} | first V5 go | nothing new to try | hurt by d28 | reckless |`,
    );
    out(`|---|---|${AT.map(() => '---').join('|')}|---|---|---|---|`);
    for (const start of Object.keys(STARTS)) {
      const runs = Array.from({ length: SEEDS }, (_, k) =>
        season(`h-${start}-${k}`, { start, strategy, days: DAYS, human: true }),
      );
      all[strategy].push(...runs);
      const cps = runs.map((r) => checkpoints(r, AT));
      const cells = AT.map((_, i) => {
        const c = cps.map((x) => x[i]!);
        return `V${f1(median(c.map((x) => x.grade)))} · $${median(c.map((x) => x.cash)).toFixed(0)} · ${f1(median(c.map((x) => x.runway)))}d · ${f1(median(c.map((x) => x.workDays)))}/7`;
      });
      const v5 = runs.map((r) => firstTry(r, 5) ?? 99);
      // Runs that hit a day with nothing unsent within reach for an unhurt climber (so far,
      // always a wet day with the gym's lines done), and from when.
      const dry = runs.map((r) => contentOut(r)).filter((d): d is number => d !== null);
      const refused = runs.reduce((n, r) => n + r.refused.length, 0);
      const hurt = runs.filter((r) => (firstInjury(r) ?? 99) <= 28).length;
      const wild = Array.from({ length: SEEDS }, (_, k) =>
        season(`h-${start}-${k}`, { start, strategy, days: Math.min(DAYS, 28), human: true, reckless: true }),
      );
      reckless.push(...wild);
      const wildHurt = wild.filter((r) => (firstInjury(r) ?? 99) <= 28).length;
      out(
        `| ${start} | ${refused} | ${cells.join(' | ')} | ${median(v5) >= 99 ? '–' : `day ${median(v5)}`} (${v5.filter((d) => d < 99).length}/${SEEDS}) | ${dry.length}/${SEEDS}${dry.length ? `, day ${median(dry)}` : ''} | ${hurt}/${SEEDS} | ${wildHurt}/${SEEDS} |`,
      );
    }
    out('');
  }
  targets(all, reckless);
});

// Phase 6's targets for a first season, from R2's plan, read off the runs.
function targets(all: Record<Strategy, BotRun[]>, reckless: BotRun[]): void {
  out('## Targets\n');
  const say = (ok: boolean, what: string, how: string) => out(`- ${ok ? '✓' : '✗'} ${what}: ${how}`);
  const pct = (n: number, d: number) => `${n}/${d} (${Math.round((100 * n) / d)}%)`;

  // 1. A working climber can't take a week off at days 7 to 28, but is never stuck.
  const weeks = [7, 14, 21, 28].filter((d) => d <= DAYS);
  const bal = all.balanced;
  const runways = weeks.map((d) => bal.map((r) => checkpoints(r, [d])[0]!.runway));
  const under = runways.every((w) => median(w) < 7);
  const stuck = (runs: BotRun[]) => runs.reduce((n, r) => n + r.days.filter((d) => d.stuck).length, 0);
  const refused = (runs: BotRun[]) => runs.reduce((n, r) => n + r.refused.length, 0);
  say(
    under && stuck(bal) === 0 && refused(bal) === 0,
    'A working climber (balanced) can’t take a week off at days 7, 14, 21 and 28, and is never stuck',
    `median runway ${runways.map((w) => `${f1(median(w))}d`).join(', ')} (most any run had: ${f1(Math.max(...runways.flat()))}d); ${stuck(bal)} stuck nights, ${refused(bal)} refusals. Stuck nights for the others: climber ${stuck(all.climber)}, worker ${stuck(all.worker)}.`,
  );

  // 2. First-month injuries under 35% for a warmed-up, moderate player.
  const moderate = STRATEGIES.flatMap((k) => all[k]);
  const hurt = moderate.filter((r) => (firstInjury(r) ?? 99) <= 28).length;
  const wild = reckless.filter((r) => (firstInjury(r) ?? 99) <= 28).length;
  say(
    hurt / moderate.length < 0.35,
    'First-month injuries under 35% for a warmed-up, moderate player',
    `${pct(hurt, moderate.length)}; cold and reckless: ${pct(wild, reckless.length)}.`,
  );

  // 3. Climbing is the main source of skill at every grade: an hour on the rock teaches more
  // than an hour setting problems, at each grade the bots reached.
  const set = ACTS['gym.set']!;
  const setRate = Object.values(set.trains ?? {}).reduce((n, v) => n + v, 0) / ((set.cost.min ?? 1) / 60);
  const byGrade = new Map<number, { min: number; gain: number }>();
  for (const r of moderate)
    for (const d of r.days) {
      if (!d.climbMin) continue;
      const b = byGrade.get(d.grade) ?? { min: 0, gain: 0 };
      b.min += d.climbMin;
      b.gain += d.climbGain;
      byGrade.set(d.grade, b);
    }
  // Grades with under ten hours on the rock across every run are too thin to judge.
  const rates = [...byGrade.entries()]
    .filter(([, b]) => b.min >= 600)
    .sort(([a], [b]) => a - b)
    .map(([g, b]) => ({ g, rate: b.gain / (b.min / 60) }));
  say(
    rates.every((x) => x.rate > setRate),
    'Climbing out-teaches setting shifts at every grade',
    `skill an hour on the rock ${rates.map((x) => `V${x.g} ${x.rate.toFixed(2)}`).join(', ')}; setting ${setRate.toFixed(2)} (flat).`,
  );

  // 5. Training can't be farmed (Phase 21.3): at each grade the bots reached, an hour of the
  // best protocol, in build (the phase that teaches most), on the skills the bots woke up
  // with that day, teaches less than an hour on the rock did.
  const trainRates = rates.map(({ g, rate }) => {
    const days = moderate.flatMap((r) => r.days.filter((d) => d.climbMin && d.grade === g));
    // Campus waits for its grade, as the rules make it.
    const best = Object.entries(PROTOCOLS)
      .filter(([id]) => id !== 'campus' || g >= TRAIN.campusGrade)
      .map(([id, p]) => {
        const per = days.map((d) => {
          const s = { ...newGame('h'), climber: { name: 'h', start: 'allrounder', skills: d.skills } };
          s.training = { ...s.training, phase: 'build' as const };
          const got = sessionGains(s, p);
          return Object.values(got).reduce((n, v) => n + v, 0) / (p.min / 60);
        });
        return { id, rate: per.reduce((n, v) => n + v, 0) / (per.length || 1) };
      })
      .sort((x, y) => y.rate - x.rate)[0]!;
    return { g, rate, best };
  });
  say(
    trainRates.every((x) => x.best.rate < x.rate),
    'Training can’t be farmed: no protocol out-teaches climbing at any grade',
    `best session an hour, in build, against the rock: ${trainRates.map((x) => `V${x.g} ${x.best.id} ${x.best.rate.toFixed(2)} (${Math.round((100 * x.best.rate) / x.rate)}%)`).join(', ')}.`,
  );

  // 4. A median climber is on a V5 project by day 28.
  const v5 = STRATEGIES.map((k) => ({ k, day: median(all[k].map((r) => firstTry(r, 5) ?? 99)) }));
  say(
    v5.every((x) => x.day <= 28),
    'A median climber is on a V5 project by day 28',
    `first V5 go, median: ${v5.map((x) => `${x.k} day ${x.day >= 99 ? '–' : x.day}`).join(', ')}.`,
  );
  out(
    `\n(Ending grades, all moderate runs: median V${median(moderate.map((r) => gradeOf(r.state.climber.skills)))}.)`,
  );
}
