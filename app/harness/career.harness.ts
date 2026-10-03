// The career harness (Phase 21's criterion 3): the career bot plays four years (224 days)
// from every start, and this reads how far it climbs and whether it ever runs out of things
// to try. `npm run harness` runs it after the season; CAREER_SEEDS and CAREER_DAYS change it.
import { it } from 'vitest';
import type { BotRun } from '../src/sim/bot';
import { STARTS } from '../src/sim/climber';
import { contentOut, firstTry, linesOf, median, season, socialLines } from '../src/sim/harness';
import { JOBS } from '../src/sim/content/jobs';
import { ACTS } from '../src/sim/content/places';
import { BUSK, PACE, PSYCHE } from '../src/sim/dials';
import { ACT_PAID } from '../src/sim/content/story';
import { buskRate, practiceOf } from '../src/sim/busk';
import { namedDeeds } from '../src/sim/epilogue';

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
    // Tips at the middle of their weekday range.
    const pay = (r: number) => (a.cost.cash ?? 0) + j.raise * r + (j.tips ? (j.tips[0] + j.tips[1]) / 2 : 0);
    const hours = (a.cost.min ?? 60) / 60;
    const ranks = j.ranks.map((n, r) => `${n} $${pay(r)} ($${(pay(r) / hours).toFixed(2)}/h)`).join(' · ');
    out(`| ${j.name} | ${hours} h, ${j.posts ?? 7} a week${j.tips ? ', with tips' : ''} | ${ranks} |`);
  }
}

// Phase 22.5b, Evan's call: busking pays under every job an hour at first and over every job
// after hundreds of sets. Its rate on an ordinary crowd, a day's set at a time played 75%
// clean, against the jobs' first and top ranks.
function buskTable(): boolean {
  const hours = Object.entries(JOBS).map(([id, j]) => {
    const a = Object.values(ACTS).find((x) => x.job?.id === id && x.job.shifts === 1)!;
    const h = (a.cost.min ?? 60) / 60;
    const pay = (r: number) => ((a.cost.cash ?? 0) + j.raise * r + (j.tips?.[0] ?? 0)) / h;
    return { name: j.name, first: pay(0), top: pay(j.ranks.length - 1) };
  });
  const setsOn = (day: number) => day * practiceOf(0.75);
  const days = [1, 30, 100, 200, 300];
  out('\n## Busking: an hour on an ordinary crowd, played clean, by days of one set\n');
  out(days.map((d) => `day ${d} $${buskRate(setsOn(d)).toFixed(2)}`).join(' · '));
  const best = hours.reduce((a, b) => (b.top > a.top ? b : a));
  let d = 1;
  while (buskRate(setsOn(d)) <= best.top && d < 2000) d++;
  const low = Math.min(...hours.map((x) => x.first));
  out(
    `Passes ${best.name}'s top rank ($${best.top.toFixed(2)}/h) on day ${d} of busking; starts under the lowest first rank ($${low.toFixed(2)}/h).`,
  );
  return buskRate(0) < low && d >= 100 && d < 2000;
}

it('career', { timeout: 1_800_000 }, () => {
  payTable();
  const buskOk = buskTable();
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
  // Phase 16.4, criterion 2: the ending names at least five things the climber did. Read at
  // the end of the run; the career bot takes no calling and claims no path, which a player
  // would, so this is the floor.
  const named = all.map((r) => namedDeeds(r.state));
  say(
    Math.min(...named) >= 5,
    'The ending names at least five things each career did',
    `fewest ${Math.min(...named)}, median ${median(named)}, most ${Math.max(...named)}, across ${all.length} runs at day ${DAYS}.`,
  );
  // Phase 22.4d: psyche moves with the life, and a career that sits at the fire when it's
  // flat never lives at the bottom.
  const lowRun = (r: BotRun) => {
    let most = 0;
    let n = 0;
    for (const d of r.days) most = Math.max(most, (n = d.psyche < PSYCHE.bands[0]! ? n + 1 : 0));
    return most;
  };
  const longest = Math.max(...all.map(lowRun));
  const psyAt = AT.map((d) => median(all.map((r) => r.days[d - 1]!.psyche)).toFixed(0));
  say(
    longest <= 7,
    'Psyche never stays low for more than a week',
    `longest run low: ${longest} days; median psyche ${AT.map((d, i) => `d${d} ${psyAt[i]}`).join(', ')}.`,
  );
  say(
    buskOk,
    'Busking starts under every job an hour and passes every job after 100+ days of sets',
    `see the busking table; ${BUSK.notes} chords a set, one set a day.`,
  );
});

// Phase 16.6: the ending (Phase 16's criterion 1). Career bots play until they've hung it up,
// from every start, and a Late Bloomer each (the speed run). When each act ends, when the
// career does, and what it took in a player's hours at the stated pace (PACE). The hours are
// a dial's guess until testers time it; the days and taps are the bots'.
const ENDING_SEEDS = Number(process.env.ENDING_SEEDS ?? 2);
const ENDING_DAYS = 480;
const ACT_LINES = ACT_PAID.map((p) =>
  p
    .split('{cash}')
    .sort((a, b) => b.length - a.length)[0]!
    .trim()
    .slice(0, 24),
);

it('the ending', { timeout: 2_400_000 }, () => {
  out(`\n# The ending: ${ENDING_SEEDS} seeds per start, the career bot, to the day it hangs it up\n`);
  out('| start | origin | acts end (days) | ended | how | hours | taps a day | goes a day | refused |');
  out('|---|---|---|---|---|---|---|---|---|');
  type Row = {
    origin: string;
    acts: (number | null)[];
    ended: number | null;
    hours: number;
    daily: boolean;
    bad: number;
  };
  const rows: Row[] = [];
  for (const origin of [undefined, 'late'])
    for (const start of Object.keys(STARTS))
      for (let k = 0; k < ENDING_SEEDS; k++) {
        const r = season(`e-${start}-${k}`, {
          start,
          strategy: 'career',
          days: ENDING_DAYS,
          human: true,
          origin,
        });
        const acts = ACT_LINES.map((key) => {
          const l = r.lines.find((x) => x.includes(key));
          return l ? Number(l.match(/^\D*(\d+)/)?.[1]) : null;
        });
        const ret = r.state.life.retired;
        const days = r.days.filter((d) => !ret || d.day < ret.day);
        const taps = days.reduce((n, d) => n + d.taps, 0);
        const goes = days.reduce((n, d) => n + d.goes, 0);
        const hours = (taps * PACE.tapSec + goes * PACE.goSec) / 3600;
        const bad = r.refused.length + r.days.filter((d) => d.stuck).length;
        rows.push({
          origin: origin ?? 'none',
          acts,
          ended: ret?.day ?? null,
          hours,
          daily: r.days.every((d, i) => d.day === i + 1),
          bad,
        });
        out(
          `| ${start} | ${origin ?? '–'} | ${acts.map((d) => d ?? '–').join(' · ')} | ${ret ? `day ${ret.day}` : '–'} | ${ret ? (ret.forced ? 'body' : 'chose') : '–'} | ${hours.toFixed(1)} | ${(taps / days.length).toFixed(1)} | ${(goes / days.length).toFixed(1)} | ${r.refused.length} |`,
        );
      }
  out('\n## Targets\n');
  const say = (ok: boolean, what: string, how: string) => out(`- ${ok ? '✓' : '✗'} ${what}: ${how}`);
  const plain = rows.filter((r) => r.origin === 'none');
  // On The Line (Act V) your body waits on you: those careers go on, as they should.
  const onLine = (r: Row) => r.acts[3] !== null;
  const due = rows.filter((r) => !onLine(r));
  const ended = due.filter((r) => r.ended !== null);
  const timed = plain.filter((r) => r.ended !== null);
  const h = median(timed.map((r) => r.hours));
  say(
    ended.length === due.length && h >= 15 && h <= 25,
    'Creation to the ending takes 15 to 25 hours at the stated pace (criterion 1)',
    `${ended.length}/${due.length} careers not on The Line ended by day ${ENDING_DAYS} (${rows.length - due.length} on it, going on); median ${h.toFixed(1)} h (${Math.min(...timed.map((r) => r.hours)).toFixed(1)} to ${Math.max(...timed.map((r) => r.hours)).toFixed(1)}) at ${PACE.tapSec} s a tap and ${PACE.goSec} s a go [proposed, until testers time it].`,
  );
  const bad = rows.reduce((n, r) => n + r.bad, 0);
  say(
    bad === 0 && rows.every((r) => r.daily),
    'A career to its ending is never refused or stuck, expeditions and walls included',
    `${bad} refusals and stuck nights across ${rows.length} runs; one line a day in every run: ${rows.every((r) => r.daily)}.`,
  );
  const third = plain.filter((r) => r.acts[2] !== null).length;
  say(
    third * 4 >= plain.length * 3,
    'Most careers see the story to the end of Act III',
    `${third}/${plain.length}; median day ${median(plain.filter((r) => r.acts[2] !== null).map((r) => r.acts[2]!))}.`,
  );
  // Reported, not held: the acts past the window, and the Late Bloomer's speed run.
  const fourth = plain.filter((r) => r.acts[3] !== null).length;
  const late = rows.filter((r) => r.origin === 'late');
  out(
    `- (reported) Act IV finished: ${fourth}/${plain.length} of no origin, ${plain.filter((r) => r.acts[4] !== null).length} of them The Line too; Act V reached by a Late Bloomer before its body calls it: ${late.filter((r) => r.acts[3] !== null).length}/${late.length}.`,
  );
});

// Phase 17.7: the people (Phase 17's criteria 3 and 4), read off a player who reads
// everything: the career bot, sitting at the fire every night and with the locals, playing
// everyone's moments as they come due. Criterion 3: something authored and social it hasn't
// seen before, every week to day 300. Criterion 4: by day 100, the ambient lines (the fire,
// what's said at a send) come round less than half as often as v0.956's campfire outcomes,
// about seven times each by then (docs/audit/social.md §5.2, a Monte Carlo, inferred).
const PEOPLE_SEEDS = Number(process.env.PEOPLE_SEEDS ?? 2);
const PEOPLE_DAYS = 300;
const V0956_CAMPFIRE = 7;

it('the people', { timeout: 2_400_000 }, () => {
  const say = (ok: boolean, what: string, how: string) => out(`- ${ok ? '✓' : '✗'} ${what}: ${how}`);
  out(
    `\n# The people: ${PEOPLE_SEEDS} seeds per start, the career bot reading everything, ${PEOPLE_DAYS} days\n`,
  );
  const { social, ambient } = socialLines();
  const weeks = Math.floor(PEOPLE_DAYS / 7);
  const missed: number[] = [];
  const shows: number[] = [];
  const distinct: number[] = [];
  out('| start | weeks with something new | weeks without | ambient by day 100: shown · distinct |');
  out('|---|---|---|---|');
  for (const start of Object.keys(STARTS))
    for (let k = 0; k < PEOPLE_SEEDS; k++) {
      const run = season(`p-${start}-${k}`, {
        start,
        strategy: 'career',
        days: PEOPLE_DAYS,
        human: true,
        social: true,
      });
      const ls = linesOf(run);
      const seen = new Set<string>();
      const fresh = new Set<number>();
      for (const l of ls)
        if (social.has(l.text) && !seen.has(l.text)) {
          seen.add(l.text);
          fresh.add(Math.floor((l.day - 1) / 7));
        }
      const without = Array.from({ length: weeks }, (_, w) => w).filter((w) => !fresh.has(w));
      missed.push(without.length);
      const amb = ls.filter((l) => l.day <= 100 && ambient.has(l.text)).map((l) => l.text);
      shows.push(amb.length);
      distinct.push(new Set(amb).size);
      out(
        `| ${start} | ${weeks - without.length}/${weeks} | ${without.length ? without.map((w) => w + 1).join(', ') : '–'} | ${amb.length} · ${new Set(amb).size} |`,
      );
    }
  out('\n## Targets\n');
  say(
    missed.every((m) => m === 0),
    'Bots see new authored social content every week through day 300 (criterion 3)',
    `weeks without something new, per run: ${missed.join(', ')}.`,
  );
  const per =
    shows.reduce((a, b) => a + b, 0) /
    Math.max(
      1,
      distinct.reduce((a, b) => a + b, 0),
    );
  say(
    per < V0956_CAMPFIRE / 2,
    'Ambient lines repeat less than half as often as v0.956’s by day 100 (criterion 4)',
    `each ambient line shown ${f1(per)} times on average by day 100 (v0.956’s campfire outcomes: about ${V0956_CAMPFIRE}).`,
  );
});
