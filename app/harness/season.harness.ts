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
import { BOARD, HUSTLE, SPEED, TRAIN } from '../src/sim/dials';
import { bestWeek } from '../src/sim/board';
import { DREAMS } from '../src/sim/content/dreams';
import { JOBS } from '../src/sim/content/jobs';
import { speedGains } from '../src/sim/speed';
import {
  checkpoints,
  contentOut,
  echoLanding,
  expedCalibration,
  expedFarm,
  firstInjury,
  firstTry,
  gamesAtFire,
  median,
  season,
} from '../src/sim/harness';

const SEEDS = Number(process.env.SEEDS ?? 12);
// Eight weeks: the first month is Phase 6's, and the second is where the mid-grades squeeze
// (Phase 21.4 found the bots going broke at V5 from day 45, which 28 days never saw).
const DAYS = Number(process.env.DAYS ?? 56);
const AT = [7, 14, 21, 28, 42, 56].filter((d) => d <= DAYS);
const out = (s = '') => process.stdout.write(`${s}\n`);
const f1 = (x: number) => (Number.isNaN(x) ? '–' : x.toFixed(1));
// The season's three: the career bot has its own harness (career.harness.ts).
type Seasonal = Exclude<Strategy, 'career'>;
const STRATEGIES: Seasonal[] = ['climber', 'balanced', 'worker'];

it('season', { timeout: 1_200_000 }, () => {
  out(`\n# Season harness: ${SEEDS} seeds × ${DAYS} days, human-ish hands\n`);
  const all: Record<Seasonal, BotRun[]> = { climber: [], balanced: [], worker: [] };
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
function targets(all: Record<Seasonal, BotRun[]>, reckless: BotRun[]): void {
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
      // The speed wall (21.6), at a fresh run's rate, as if every run of the hour taught.
      .concat(
        (() => {
          const per = days.map((d) => {
            const s = { ...newGame('h'), climber: { name: 'h', start: 'allrounder', skills: d.skills } };
            return Object.values(speedGains(s)).reduce((n, v) => n + v, 0) / (SPEED.min / 60);
          });
          return [{ id: 'speed', rate: per.reduce((n, v) => n + v, 0) / (per.length || 1) }];
        })(),
      )
      .sort((x, y) => y.rate - x.rate)[0]!;
    return { g, rate, best };
  });
  say(
    trainRates.every((x) => x.best.rate < x.rate),
    'Training can’t be farmed: no protocol, and not the speed wall, out-teaches climbing at any grade',
    `best session an hour, in build, against the rock: ${trainRates.map((x) => `V${x.g} ${x.best.id} ${x.best.rate.toFixed(2)} (${Math.round((100 * x.best.rate) / x.rate)}%)`).join(', ')}.`,
  );

  // 4. A median climber is on a V5 project by day 28.
  const v5 = STRATEGIES.map((k) => ({ k, day: median(all[k].map((r) => firstTry(r, 5) ?? 99)) }));
  say(
    v5.every((x) => x.day <= 28),
    'A median climber is on a V5 project by day 28',
    `first V5 go, median: ${v5.map((x) => `${x.k} day ${x.day >= 99 ? '–' : x.day}`).join(', ')}.`,
  );
  // 5. Phase 22's criterion 2, for the hustle (22.5a): at its best, none pays what the
  // worst-paid shift does an hour. Food is priced at ramen's, the cheapest food money buys.
  const shiftHour = Math.min(
    ...Object.values(ACTS)
      .filter((a) => a.job && a.job.shifts === 1)
      .map((a) => ((a.cost.cash ?? 0) + (JOBS[a.job!.id]!.tips?.[0] ?? 0)) / ((a.cost.min ?? 60) / 60)),
  );
  const ramen = ACTS['lot.cook']!.cost;
  const perFood = -(ramen.cash ?? 0) / (ramen.fed ?? 1);
  const hustles = {
    cans: HUSTLE.cans.cash[1] / (HUSTLE.cans.min / 60),
    bins: (HUSTLE.bins.fed[1] * perFood) / (HUSTLE.bins.min / 60),
    forage: (HUSTLE.forage.fed[1] * perFood) / (HUSTLE.forage.min / 60),
  };
  const used = (runs: BotRun[], re: RegExp) =>
    runs.reduce((n, r) => n + r.lines.filter((l) => re.test(l)).length, 0) / runs.length;
  say(
    Object.values(hustles).every((h) => h < shiftHour),
    'No hustle out-earns a shift an hour',
    `at best, cans $${hustles.cans.toFixed(2)}/h, the bins $${hustles.bins.toFixed(2)}/h, foraging $${hustles.forage.toFixed(2)}/h; the worst shift $${shiftHour.toFixed(2)}/h. Cans and bins a season, per run: ${STRATEGIES.map((k) => `${k} ${used(all[k], /bag of cans/).toFixed(1)} and ${used(all[k], /bins/i).toFixed(1)}`).join(', ')}.`,
  );
  // 6. Phase 22's criterion 2, for the games at the fire (22.9): none out-bonds a day climbing
  // together (one a day), and none out-earns the worst-paid shift an hour, however it's played.
  const games = gamesAtFire('h-games', 60);
  const money = [games.bj, ...Object.values(games.holdem)];
  say(
    games.bondDay <= 1 && money.every((x) => x < shiftHour),
    'No game at the fire out-bonds a day climbing together or out-earns a shift an hour',
    `most bond anyone moved in a night of every game: ${games.bondDay}; blackjack by the book $${games.bj.toFixed(2)}/h; hold'em ${Object.entries(
      games.holdem,
    )
      .map(([k, v]) => `${k} $${v.toFixed(2)}/h`)
      .join(', ')}; the worst shift $${shiftHour.toFixed(2)}/h.`,
  );
  // 7. Phase 24's criterion 4: the summit odds shown are the odds the bots get, within ten
  // points, for a climber at each objective's grade roped to Sage. 300 trips each: at 100 the
  // bots' own luck moved Trango by twelve points between runs.
  const cal = expedCalibration(Number(process.env.TRIPS ?? 300));
  say(
    cal.every((c) => Math.abs(c.shown - c.got) <= 0.1),
    'The summit odds shown are the odds you get: within ten points of the bots’ trips',
    `${cal.map((c) => `${c.id} at V${c.grade}, shown ${Math.round(100 * c.shown)}%, the bots ${Math.round(100 * c.got)}%`).join('; ')}.`,
  );
  // 8. Phase 24's criterion 5: no expedition is a farm. A summit pays once (24.9), so a trip
  // that's already paid can't out-earn a day of the worst-paid shift at any grade it's
  // offered at; a first summit is a one-off, shown beside it.
  const shiftDay = Math.min(
    ...Object.values(ACTS)
      .filter((a) => a.job && a.job.shifts === 1)
      .map((a) => (a.cost.cash ?? 0) + (JOBS[a.job!.id]!.tips?.[0] ?? 0)),
  );
  const farm = expedFarm(Number(process.env.FARM ?? 30));
  say(
    farm.every((f) => f.again < shiftDay),
    'No expedition is a farm: once a summit has paid, no trip out-earns a day of shifts',
    `the worst shift $${shiftDay.toFixed(0)} a day; per day away, first summit / again: ${farm
      .map(
        (f) => `${f.id} V${f.grade} $${f.first.toFixed(0)} / $${f.again.toFixed(0)} (${f.days.toFixed(1)}d)`,
      )
      .join(', ')}.`,
  );
  // 9. Phase 23.6: the Board is a bonus, not a living. A week's best board (its three best-
  // paying jobs) pays under BOARD.capDays days of the worst shift; what the bots took off it
  // a week, beside it.
  const boardPaid = (r: BotRun) =>
    r.lines
      .map((l) => l.match(/\$(\d+) off the board/))
      .filter((m) => !!m)
      .reduce((n, m) => n + Number(m![1]), 0) /
    (DAYS / 7);
  say(
    bestWeek() < BOARD.capDays * shiftDay,
    `The Board isn’t a living: a week’s best board pays under ${BOARD.capDays} days of the worst shift`,
    `best week $${bestWeek()}, against $${BOARD.capDays * shiftDay}; the bots took, a week, median: ${STRATEGIES.map((k) => `${k} $${median(all[k].map(boardPaid)).toFixed(0)}`).join(', ')}.`,
  );
  // 10. Phase 23's criterion 2: every echo lands later in the game, for a bot that answers
  // its call the way it comes back for, within a four-year career.
  const echoes = echoLanding(Number(process.env.ECHO_SEEDS ?? 8), 224);
  say(
    echoes.every((e) => e.echo !== null),
    'Every stance’s echo lands later in the game',
    `${echoes.map((e) => (e.echo === null ? `${e.id} never` : `${e.id}: call day ${e.call}, echo day ${e.echo}`)).join('; ')}.`,
  );
  // Phase 22.8: how long a dream takes, at what the worker bots put by: their median cash at
  // the season's end, a day at a time. A guide, not a target.
  const perDay = median(all.worker.map((r) => r.state.cash)) / DAYS;
  out(
    `\n(Dreams, saving what the worker bots save, $${perDay.toFixed(2)} a day: ${DREAMS.map((d) => `${d.name} ${perDay > 0 ? `day ${Math.ceil(d.cost / perDay)}` : 'never'}`).join(', ')}.)`,
  );
  out(
    `\n(Ending grades, all moderate runs: median V${median(moderate.map((r) => gradeOf(r.state.climber.skills)))}.)`,
  );
}
