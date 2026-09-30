// The career harness (Phase 21's criterion 3): the career bot plays four years (224 days)
// from every start, and this reads how far it climbs and whether it ever runs out of things
// to try. `npm run harness` runs it after the season; CAREER_SEEDS and CAREER_DAYS change it.
import { it } from 'vitest';
import type { BotRun } from '../src/sim/bot';
import { STARTS } from '../src/sim/climber';
import { contentOut, firstTry, median, season } from '../src/sim/harness';
import { JOBS } from '../src/sim/content/jobs';
import { ACTS } from '../src/sim/content/places';

const SEEDS = Number(process.env.CAREER_SEEDS ?? 4);
const DAYS = Number(process.env.CAREER_DAYS ?? 224);
const AT = [56, 112, 168, 224].filter((d) => d <= DAYS);
const out = (s = '') => process.stdout.write(`${s}\n`);
const f1 = (x: number) => (Number.isNaN(x) ? '–' : x.toFixed(1));

// The first day the climber's grade reached `g`, or null.
const firstGrade = (r: BotRun, g: number): number | null => r.days.find((d) => d.grade >= g)?.day ?? null;

// Phase 22.1, Decision 1: no pace target; every job's pay a shift and an hour, by rank.
function payTable() {
  out('\n## Pay by rank: a shift, and an hour of it\n');
  out('| job | shift | ranks |');
  out('|---|---|---|');
  for (const [id, j] of Object.entries(JOBS)) {
    const a = Object.values(ACTS).find((x) => x.job?.id === id && x.job.shifts === 1)!;
    const pay = (r: number) => (a.cost.cash ?? 0) + j.raise * r;
    const hours = (a.cost.min ?? 60) / 60;
    const ranks = j.ranks.map((n, r) => `${n} $${pay(r)} ($${(pay(r) / hours).toFixed(2)}/h)`).join(' · ');
    out(`| ${j.name} | ${hours} h, ${j.posts ?? 7} a week | ${ranks} |`);
  }
}

it('career', { timeout: 1_800_000 }, () => {
  payTable();
  out(`\n# Career harness: ${SEEDS} seeds × ${DAYS} days, the career bot, human-ish hands\n`);
  out(
    `| start | refused | stuck | ${AT.map((d) => `d${d} grade · $`).join(' | ')} | V10 on | first V10 go | trips bought | nothing new | resting | warnings · top rank |`,
  );
  out(`|---|---|---|${AT.map(() => '---').join('|')}|---|---|---|---|---|---|`);
  const all: BotRun[] = [];
  for (const start of Object.keys(STARTS)) {
    const runs = Array.from({ length: SEEDS }, (_, k) =>
      season(`c-${start}-${k}`, { start, strategy: 'career', days: DAYS, human: true }),
    );
    all.push(...runs);
    const cells = AT.map((d) => {
      const at = runs.map((r) => r.days[d - 1]!);
      return `V${f1(median(at.map((x) => x.grade)))} · $${median(at.map((x) => x.cash)).toFixed(0)}`;
    });
    const v10 = runs.map((r) => firstGrade(r, 10) ?? 999);
    const go10 = runs.map((r) => firstTry(r, 10) ?? 999);
    const trips = runs.map((r) => r.state.unlocked.length);
    const nothing = runs.map((r) => r.days.filter((d) => d.where === 'nothing').length);
    const resting = runs.map((r) => r.days.filter((d) => d.where === 'resting').length);
    const refused = runs.reduce((n, r) => n + r.refused.length, 0);
    const stuck = runs.reduce((n, r) => n + r.days.filter((d) => d.stuck).length, 0);
    const day = (xs: number[]) => (median(xs) >= 999 ? '–' : `day ${median(xs)}`);
    const warned = runs.map((r) => r.lines.filter((l) => l.includes("You didn't show")).length);
    const let_go = runs.reduce((n, r) => n + r.lines.filter((l) => l.includes('lets you go')).length, 0);
    // The highest rank the run reached at any job, named.
    const top = runs.map((r) => {
      const [job, n] = Object.entries(r.state.jobs).sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
      const j = JOBS[job];
      if (!j) return 'none';
      let k = 0;
      j.at.forEach((at, i) => (n >= at ? (k = i) : null));
      return `${j.ranks[k]} (${j.name})`;
    });
    out(
      `| ${start} | ${refused} | ${stuck} | ${cells.join(' | ')} | ${day(v10)} (${v10.filter((d) => d < 999).length}/${SEEDS}) | ${day(go10)} | ${median(trips)} | ${median(nothing)} days | ${median(resting)} days | ${median(warned)}${let_go ? `, ${let_go} let go` : ''} · ${top[0]} |`,
    );
  }
  out('\n## Targets\n');
  const say = (ok: boolean, what: string, how: string) => out(`- ${ok ? '✓' : '✗'} ${what}: ${how}`);
  const v10 = all.map((r) => firstGrade(r, 10) ?? 999);
  const reached = v10.filter((d) => d < 999).length;
  // Before V10, a day with nothing unsent within reach anywhere is the content running out.
  const dry = all.filter((r) => {
    const out = contentOut(r);
    const at = firstGrade(r, 10) ?? 999;
    return out !== null && out < at;
  }).length;
  say(
    median(v10) < 999 && dry === 0,
    'The career bots reach V10+ without running out of things to try',
    `median V10 on day ${median(v10) >= 999 ? '–' : median(v10)}, ${reached}/${all.length} runs there by day ${DAYS}; ${dry} runs had a day with nothing new before it.`,
  );
  const bad = all.reduce((n, r) => n + r.refused.length + r.days.filter((d) => d.stuck).length, 0);
  say(
    bad === 0,
    'A career is never refused or stuck',
    `${bad} refusals and stuck nights across ${all.length} runs.`,
  );
});
