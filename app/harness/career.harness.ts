// The career harness (Phase 21's criterion 3): the career bot plays four years (224 days)
// from every start, and this reads how far it climbs and whether it ever runs out of things
// to try. `npm run harness` runs it after the season; CAREER_SEEDS and CAREER_DAYS change it.
import { it } from 'vitest';
import type { BotRun } from '../src/sim/bot';
import { STARTS } from '../src/sim/climber';
import { contentOut, firstTry, linesOf, median, season, socialLines } from '../src/sim/harness';
import { JOBS } from '../src/sim/content/jobs';
import { ACTS, PLACES } from '../src/sim/content/places';
import { HITCHERS } from '../src/sim/content/road';
import { TALK } from '../src/sim/content/people';
import { BUSK, PACE, PSYCHE, YEAR } from '../src/sim/dials';
import { DALE_VERDICT } from '../src/sim/content/garage';
import { ACT_PAID } from '../src/sim/content/story';
import { buskRate, practiceOf } from '../src/sim/busk';
import { namedDeeds } from '../src/sim/epilogue';
import { dayAtAge } from '../src/sim/ageing';
import { act } from '../src/sim/game';
import { oldStart, questDone, questOf } from '../src/sim/heir';
import { found } from '../src/sim/hollow';
import { settled } from '../src/sim/settle';
import { classicsAt, localPlaces, ticked } from '../src/sim/classics';
import { ROUTES } from '../src/sim/content/routes';

// Phase 30's criterion 1: how far under their best a 40-year-old may climb, in grades.
const PEAK_GAP = 1;

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
  // Phase 35.1 (Phase 35's criterion 2): over two years and more of drives, no hitchhiker comes
  // a third time before every one has come once.
  const early = all.filter((r) => {
    const n: Record<string, number> = {};
    return r.hitchers.some((id) => {
      n[id] = (n[id] ?? 0) + 1;
      return n[id] === 3 && HITCHERS.some((h) => !n[h.id]);
    });
  }).length;
  const came = all.map((r) => r.hitchers.length);
  const everyone = all.filter((r) => HITCHERS.every((h) => r.hitchers.includes(h.id))).length;
  say(
    early === 0,
    'No hitchhiker comes a third time before every one has come once (Phase 35, criterion 2)',
    `${early} of ${all.length} runs over ${DAYS} days (${(DAYS / YEAR.days).toFixed(0)} years); hitchhikers a run: median ${median(came)}, fewest ${Math.min(...came)}, most ${Math.max(...came)}; all ${HITCHERS.length} met in ${everyone}.`,
  );
  // Phase 29's criterion 2: the van ages into Dale's verdict for every career by year three,
  // and how each took it (the bot rebuilds when the money's there, else trades in when that
  // is, else limps on).
  const dayOf = (r: BotRun, text: string) => {
    const l = r.lines.find((x) => x.includes(text));
    return l ? Number(l.match(/^day (\d+)/)![1]) : null;
  };
  const verdicts = all.map((r) => ({
    heard: dayOf(r, DALE_VERDICT.slice(0, 20)),
    rebuilt: dayOf(r, ACTS['garage.rebuild']!.says!),
    used: dayOf(r, ACTS['garage.used']!.says!),
  }));
  const by = 3 * YEAR.days;
  const heard = verdicts.filter((v) => v.heard !== null && v.heard <= by);
  say(
    heard.length === all.length,
    `The van's verdict comes to every career by year three (day ${by})`,
    `${heard.length}/${all.length}; heard on day ${median(heard.map((v) => v.heard!))} (median), earliest ${Math.min(...heard.map((v) => v.heard!))}, latest ${Math.max(...heard.map((v) => v.heard!))}. Taken: ${verdicts.filter((v) => v.rebuilt).length} rebuilt (median day ${median(verdicts.flatMap((v) => (v.rebuilt ? [v.rebuilt] : [])))}), ${verdicts.filter((v) => v.used).length} traded in (median day ${median(verdicts.flatMap((v) => (v.used ? [v.used] : [])))}), ${verdicts.filter((v) => !v.rebuilt && !v.used).length} limping on by day ${DAYS}.`,
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
  // Phase 39's criterion 2: a career becomes a local somewhere, every classic at a crag ticked.
  const locals = all.map((r) => localPlaces(r.state));
  const crags = Object.keys(PLACES).filter((p) => PLACES[p]!.classics?.length);
  const ticks = (p: string) =>
    median(all.map((r) => classicsAt(r.state, p).filter((id) => ticked(r.state, id)).length));
  say(
    locals.some((l) => l.length > 0),
    'A career becomes a local somewhere (Phase 39, criterion 2)',
    `${locals.filter((l) => l.length).length}/${all.length} runs by day ${DAYS}; locals at ${crags.map((p) => `${p} ${locals.filter((l) => l.includes(p)).length}`).join(', ')}; classics ticked a run (median): ${crags.map((p) => `${p} ${ticks(p)}`).join(', ')}.`,
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
    // Phase 30.4: at 40, your level as a go has it, all round and on power lines, against the
    // best it had been; and the grade shown.
    at40: { grade: number; aged: number; peak: number; power: number; peakPower: number } | null;
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
        const d40 = dayAtAge(r.state, 40);
        const then = r.days.find((d) => d.day === d40);
        const before = r.days.filter((d) => d.day <= d40);
        const at40 = then
          ? {
              grade: then.grade,
              aged: then.aged,
              peak: Math.max(...before.map((d) => d.aged)),
              power: then.agedPower,
              peakPower: Math.max(...before.map((d) => d.agedPower)),
            }
          : null;
        rows.push({
          at40,
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
  // Phase 30's criterion 1: at 40, a climber is within a grade of the best they'd been, all
  // round, as a go has their skills (the bar set before it was measured).
  out('\n## The body at 40 (Phase 30)\n');
  out('| origin | grade shown | all round: at 40 · best before | power lines: at 40 · best before |');
  out('|---|---|---|---|');
  for (const r of rows.filter((x) => x.at40)) {
    const a = r.at40!;
    out(
      `| ${r.origin === 'none' ? '–' : r.origin} | V${a.grade} | ${a.aged.toFixed(2)} · ${a.peak.toFixed(2)} | ${a.power.toFixed(2)} · ${a.peakPower.toFixed(2)} |`,
    );
  }
  out('');
  const forty = rows.filter((x) => x.at40);
  const near = forty.filter((x) => x.at40!.peak - x.at40!.aged <= PEAK_GAP);
  say(
    forty.length > 0 && near.length === forty.length,
    `A 40-year-old climbs within ${PEAK_GAP} grade of their best, all round (Phase 30, criterion 1)`,
    `${near.length}/${forty.length}; the most below their best ${Math.max(...forty.map((x) => x.at40!.peak - x.at40!.aged)).toFixed(2)} all round, ${Math.max(...forty.map((x) => x.at40!.peakPower - x.at40!.power)).toFixed(2)} on power lines.`,
  );
  // Reported, not held: the acts past the window, and the Late Bloomer's speed run.
  const fourth = plain.filter((r) => r.acts[3] !== null).length;
  const late = rows.filter((r) => r.origin === 'late');
  out(
    `- (reported) Act IV finished: ${fourth}/${plain.length} of no origin, ${plain.filter((r) => r.acts[4] !== null).length} of them The Line too; Act V reached by a Late Bloomer before its body calls it: ${late.filter((r) => r.acts[3] !== null).length}/${late.length}.`,
  );
});

// Phase 31.4: the family (Phase 31's criterion 1). A career bot hangs it up once it's past
// 30, as a player might choose to, and the kid it coached climbs on as the career bot for two
// years, reading everything (the social bot): does the kid meet the old climber at the fire,
// and take beta on a line they sent?
const FAMILY_SEEDS = Number(process.env.FAMILY_SEEDS ?? 4);
const FAMILY_BEFORE = 200;
const FAMILY_DAYS = 112;

it('the family', { timeout: 2_400_000 }, () => {
  const say = (ok: boolean, what: string, how: string) => out(`- ${ok ? '✓' : '✗'} ${what}: ${how}`);
  out(
    `\n# The family: ${FAMILY_SEEDS} careers hung up after ${FAMILY_BEFORE} days, and the kid's first ${FAMILY_DAYS}\n`,
  );
  out(
    '| start | hung up | left | old guard: theirs → the kid’s | lines kept | the quest | met | asks: theirs · the quest | old guard’s word | quest sent |',
  );
  out('|---|---|---|---|---|---|---|---|---|---|');
  const rows: { met: boolean; theirs: number }[] = [];
  const starts = Object.keys(STARTS);
  for (let k = 0; k < FAMILY_SEEDS; k++) {
    const start = starts[k % starts.length]!;
    const f = season(`fam-${start}-${k}`, { start, strategy: 'career', days: FAMILY_BEFORE, human: true });
    const off = act(f.state, { t: 'retire' });
    const no = off.events.find((e) => e.k === 'refused');
    if (no && no.k === 'refused') {
      out(`| ${start} | couldn’t: ${no.why} | | | | | | | | |`);
      rows.push({ met: false, theirs: 0 });
      continue;
    }
    const handed = act(off.state, { t: 'heir' }).state;
    const kid = season(`fam-kid-${k}`, {
      start: starts[(k + 1) % starts.length]!,
      strategy: 'career',
      days: FAMILY_DAYS,
      human: true,
      // A player who reads everything (Phase 17.7), so the old guard's word is heard.
      social: true,
      from: handed,
    });
    const s = kid.state;
    const c = s.family!.career!;
    const met = kid.lines.find((l) => l.includes('has a camp chair at the fire now'));
    const metDay = met ? Number(met.match(/^day (\d+)/)?.[1]) - handed.day + 1 : null;
    const theirs = kid.forebear.filter((x) => x.theirs);
    const q = questOf(s);
    const word = ['ray', 'frank'].filter((w) => s.seen.includes(`kin-${w}`)).join(', ') || '–';
    out(
      `| ${start} | ${c.age}, ${c.how} | $${c.money} | ${c.old} → ${oldStart(c.old)} | ${c.sent.length} | ${q ? `${q.kind}: ${q.r.name}, V${q.r.grade}` : '–'} | ${metDay ? `day ${metDay}` : 'no'} | ${theirs.length} · ${kid.forebear.length - theirs.length} | ${word} | ${questDone(s) ? 'yes' : 'no'} |`,
    );
    rows.push({ met: !!metDay, theirs: theirs.length });
  }
  out('');
  const ok = rows.filter((r) => r.met && r.theirs > 0).length;
  say(
    rows.length > 0 && ok === rows.length,
    'An heir meets the old climber and takes beta on a line they sent (Phase 31, criterion 1)',
    `${ok}/${rows.length}.`,
  );
});

// Phase 32.5: the Hollow (Phase 32's criterion 1). A career bot that reads everything (so Ray's
// word is heard) and looks for the Hollow once it's asking: Ray on a weekend morning, the old
// hand asked on the road, the old guidebook at the shop, then the walk in from the Gorge; once
// it's found, a line there prepared and put up. Does it find the place and name a first ascent?
const HOLLOW_SEEDS = Number(process.env.HOLLOW_SEEDS ?? 4);
const HOLLOW_DAYS = 420;

it('the Hollow', { timeout: 2_400_000 }, () => {
  const say = (ok: boolean, what: string, how: string) => out(`- ${ok ? '✓' : '✗'} ${what}: ${how}`);
  out(`\n# The Hollow: ${HOLLOW_SEEDS} careers looking for it, ${HOLLOW_DAYS} days\n`);
  out('| start | old word | old hand | guidebook | walks | found | prepared | first ascents | settled |');
  out('|---|---|---|---|---|---|---|---|---|');
  const starts = Object.keys(STARTS);
  let ok = 0;
  for (let k = 0; k < HOLLOW_SEEDS; k++) {
    const start = starts[k % starts.length]!;
    const run = season(`hollow-${start}-${k}`, {
      start,
      strategy: 'career',
      days: HOLLOW_DAYS,
      human: true,
      social: true,
      hollow: true,
    });
    const s = run.state;
    const when = (what: string) => run.hollow.find((h) => h.what === what)?.day ?? '–';
    const walks = run.hollow.filter((h) => h.what === 'walk').length;
    const preps = run.hollow.filter((h) => h.what.startsWith('prep ')).map((h) => h.what.slice(5));
    const fas = Object.entries(s.firsts).filter(([id, f]) => !f.by && PLACES[ROUTES[id]?.place ?? '']?.wild);
    if (found(s) && fas.length) ok++;
    out(
      `| ${start} | ${when('old')} | ${when('hitch')} | ${when('book')} | ${walks} | ${when('found')} | ${preps.join(', ') || '–'} | ${fas.map(([id, f]) => `${f.name} (${id}, V${ROUTES[id]!.grade}, day ${f.day})`).join('; ') || '–'} | ${fas.filter(([id]) => settled(s, id)).length}/${fas.length} |`,
    );
  }
  out('');
  say(
    ok > 0,
    'A bot finds the Hollow and names a first ascent (Phase 32, criterion 1)',
    `${ok}/${HOLLOW_SEEDS}.`,
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
  // Phase 28.1: the day the crew got its name, or null.
  const named: (number | null)[] = [];
  // Phase 28.2: crew projects sent with the crew there, and the day of the first.
  const trains: number[] = [];
  const firstTrain: number[] = [];
  // Phase 28.3: favours asked of the crew, and theirs answered yes and no.
  const traded: boolean[] = [];
  out(
    '| start | weeks with something new | weeks without | ambient by day 100: shown · distinct | crew named | projects sent with the crew · first | favours asked · theirs yes · no |',
  );
  out('|---|---|---|---|---|---|---|');
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
      const crew = run.state.crewName;
      named.push(crew?.day ?? null);
      const sent = run.state.crewSends.filter((x) => x.train.length > 0);
      trains.push(sent.length);
      if (sent[0]) firstTrain.push(sent[0].day);
      const asked = run.actions.filter((a) => a.t === 'favour').length;
      const answer = (yes: boolean) =>
        run.actions.filter(
          (a) =>
            a.t === 'say' &&
            /^crew-favour-(belay|ride|loan)$/.test(a.node) &&
            TALK[a.talk]?.nodes[a.node]?.opts[a.opt]?.fx?.favour === (yes ? 'yes' : 'no'),
        ).length;
      traded.push(asked > 0 && answer(true) > 0);
      out(
        `| ${start} | ${weeks - without.length}/${weeks} | ${without.length ? without.map((w) => w + 1).join(', ') : '–'} | ${amb.length} · ${new Set(amb).size} | ${crew ? `day ${crew.day}, ${crew.name}` : '–'} | ${sent.length}${sent[0] ? ` · day ${sent[0].day}` : ''} | ${asked} · ${answer(true)} · ${answer(false)} |`,
      );
    }
  const days = named.filter((d): d is number => d !== null);
  out(
    `\nThe crew was named in ${days.length} of ${named.length} careers${days.length ? `, on day ${median(days)} at the median (${Math.min(...days)}–${Math.max(...days)})` : ''}.`,
  );
  out(
    `A crew project was sent with the crew there in ${firstTrain.length} of ${trains.length} careers${firstTrain.length ? `, the first on day ${median(firstTrain)} at the median (${Math.min(...firstTrain)}–${Math.max(...firstTrain)}), ${median(trains)} a career by day ${PEOPLE_DAYS}` : ''}.`,
  );
  out(`Favours went both ways in ${traded.filter(Boolean).length} of ${traded.length} careers.`);
  // Phase 28's criterion 1: all three in one career.
  const crewed = named.filter((d, i) => d !== null && trains[i]! > 0 && traded[i]).length;
  out('\n## Targets\n');
  say(
    crewed === named.length,
    'A social career names a crew, sends its project, and trades favours both ways (Phase 28, criterion 1)',
    `${crewed} of ${named.length} careers did all three.`,
  );
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
