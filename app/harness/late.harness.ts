// Phase 25's systems, measured (Evan's call, 4 Oct 2026): what the bots never touched, put to
// numbers. Guiding against the other jobs; the outfit's take; the mentee's pace and what it
// leaves an heir; a team's cost per summit; the dyno comp and League night's season, climbed
// with the bot's hands at every grade; and how often crew drama comes to a social career.
// No targets: these are measurements for Evan's calls. LATE_SEEDS widens the samples.
// Phase 26: the A league, the dyno comp as it grows, the heir's graded head start, and which
// pairs crew drama falls on.
import { it } from 'vitest';
import { gradeOf, needFor, STARTS } from '../src/sim/climber';
import { compField, compSet, goesFor, leagueNights, leagueTable, placing } from '../src/sim/comps';
import { A_LEAGUE, COMP_TIERS, DYNO_COMP } from '../src/sim/content/comps';
import { EXPEDITIONS } from '../src/sim/content/expeditions';
import { ACTS } from '../src/sim/content/places';
import { JOBS } from '../src/sim/content/jobs';
import { GUIDING, LEAGUE, MENTEE, PLAY, YEAR } from '../src/sim/dials';
import { gradesFor } from '../src/sim/comps';
import { act, newGame } from '../src/sim/game';
import { outfitDay } from '../src/sim/guiding';
import { median, season } from '../src/sim/harness';
import { heirStart, menteeAfter } from '../src/sim/mentee';
import { humanHands, playGo } from '../src/sim/bot';
import { Rng } from '../src/sim/rng';
import { teamCost, teamOdds } from '../src/sim/team';
import { playBonus } from '../src/sim/work';
import { conditionsAt, seasonOf } from '../src/sim/weather';
import type { GameState, Skills, TripLog } from '../src/sim/types';

const SEEDS = Number(process.env.LATE_SEEDS ?? 4);
const out = (s = '') => process.stdout.write(`${s}\n`);
const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const pct = (p: number) => `${Math.round(p * 100)}%`;
const at = (g: number): Skills => {
  const n = needFor(g) + 1;
  return { power: n, fingers: n, endurance: n, technique: n, head: n };
};
const climber = (seed: string, g: number): GameState => {
  const s = act(newGame(seed), { t: 'create', name: 'Bot', start: 'allrounder' }).state;
  return { ...s, energy: 100, skin: 100, climber: { ...s.climber, skills: at(g) } };
};

// A comp climbed with human-ish hands (the career bots'; careful ones are near perfect): each problem gone at up to its goes, the tops and
// the goes they took, and where that lands against the field.
function climbComp(s: GameState, tier: number, day: number) {
  const set = compSet(s.seed, tier, day);
  let tops = 0;
  let goes = 0;
  for (const p of set)
    for (let g = 1; g <= goesFor(tier); g++)
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
  return { tops, goes, place: placing({ name: s.climber.name, tops, goes }, field), of: field.length + 1 };
}

it('Phase 25’s systems, measured', { timeout: 3_600_000 }, () => {
  out('\n# Phase 25’s systems, measured\n');

  // ---- The jobs at their top rank ----
  out('## The jobs, a plain shift at the top rank\n');
  out('| job | top rank | pay | hours | an hour | played well, up to |');
  out('|---|---|---|---|---|---|');
  const jobs = Object.values(ACTS).filter((a) => a.job && a.job.shifts === 1);
  const rows = jobs.map((a) => {
    const j = JOBS[a.job!.id]!;
    const tips = j.tips ? (j.tips[0] + j.tips[1]) / 2 : 0;
    const pay = (a.cost.cash ?? 0) + (j.raise ?? 0) * (j.ranks.length - 1) + tips;
    const hours = (a.cost.min ?? 60) / 60;
    const from = a.job!.id === 'guide' ? GUIDING.from : PLAY.from;
    return { id: a.job!.id, rank: j.ranks.at(-1)!, pay, hours, played: pay + playBonus(pay, 1, from) };
  });
  for (const r of rows)
    out(
      `| ${r.id} | ${r.rank} | ${money(r.pay)} | ${r.hours} | ${money(r.pay / r.hours)} | ${money(r.played)} |`,
    );
  const guide = rows.find((r) => r.id === 'guide')!;
  const others = rows.filter((r) => r.id !== 'guide');
  out(
    `\nGuide at Lead guide: ${money(guide.pay / guide.hours)} an hour against the others’ median ${money(median(others.map((r) => r.pay / r.hours)))} (lowest ${money(Math.min(...others.map((r) => r.pay / r.hours)))}, highest ${money(Math.max(...others.map((r) => r.pay / r.hours)))}).\n`,
  );

  // ---- The outfit ----
  out('## The outfit, a day at a time over real weather\n');
  const O = GUIDING.outfit;
  const posts = JOBS.guide!.posts ?? 3;
  out('| guides | a day, median | a week | a year | pays back its price in |');
  out('|---|---|---|---|---|');
  for (let n = 1; n <= O.guides; n++) {
    const days: number[] = [];
    for (let k = 0; k < SEEDS; k++)
      for (let d = 1; d <= YEAR.days * 2; d++) {
        const c = conditionsAt(`late-${k}`, d, GUIDING.crag);
        days.push(outfitDay(n, c.open && !c.closed && seasonOf(d) !== 'winter'));
      }
    const mean = days.reduce((a, b) => a + b, 0) / days.length;
    out(
      `| ${n} | ${money(median(days))} | ${money(mean * 7)} | ${money(mean * YEAR.days)} | ${mean > 0 ? `${Math.ceil(O.price / mean)} days` : 'never'} |`,
    );
  }
  out(
    `\nKeeping the job instead: ${posts} Lead guide shifts a week at ${money(guide.pay)}, ${money(posts * guide.pay)} a week (up to ${money(posts * guide.played)} played well), and the days free.\n`,
  );

  // ---- The mentee ----
  out('## The mentee\n');
  out('| your grade | sessions to V5 | to V8 | to V10 | weeks of shoes and fees to V8 |');
  out('|---|---|---|---|---|');
  for (const yours of [7, 9, 12]) {
    const to: Record<number, number | null> = { 5: null, 8: null, 10: null };
    let lv = 1;
    for (let n = 1; n <= 400; n++) {
      lv = menteeAfter(lv, yours);
      for (const g of [5, 8, 10]) if (to[g] === null && lv >= g) to[g] = n;
    }
    const show = (n: number | null) => (n === null ? 'never' : String(n));
    out(
      `| V${yours} | ${show(to[5]!)} | ${show(to[8]!)} | ${show(to[10]!)} | ${to[8] ? `${Math.ceil(to[8] / 7)} (${money(Math.ceil(to[8] / 7) * MENTEE.weekly)})` : '–'} |`,
    );
  }
  out('\n| an heir’s start | grade | with a V5 mentee | V8 | V10 |');
  out('|---|---|---|---|---|');
  for (const start of Object.keys(STARTS)) {
    const s = act(newGame(`heir-${start}`), { t: 'create', name: 'Heir', start }).state;
    const sk = s.climber.skills;
    const up = (g: number) => gradeOf(heirStart(sk, g));
    out(`| ${start} | V${gradeOf(sk)} | V${up(5)} | V${up(8)} | V${up(10)} |`);
  }

  // ---- Teams ----
  out('\n## A team’s trip\n');
  out(
    '| objective | cost | odds, one summit of yours | best | with your mentee leading | cost a summit, one / best |',
  );
  out('|---|---|---|---|---|---|');
  for (const id of Object.keys(EXPEDITIONS)) {
    const trip = (end: TripLog['end']): TripLog => ({
      id,
      day: 1,
      end,
      high: 1,
      partner: null,
      nights: 1,
      seen: [],
      told: true,
    });
    const s0 = newGame(`team-${id}`);
    const one = { ...s0, book: [trip('summit')] };
    const best = { ...s0, book: [trip('summit'), trip('summit'), trip('bail'), trip('bail')] };
    const kid = { ...best, mentee: { name: 'Fen', level: 10, sessions: 50, since: 1, last: 1, told: [] } };
    const cost = teamCost(one, id);
    out(
      `| ${EXPEDITIONS[id]!.name} | ${money(cost)} | ${pct(teamOdds(one, id))} | ${pct(teamOdds(best, id))} | ${pct(teamOdds(kid, id))} | ${money(cost / teamOdds(one, id))} / ${money(cost / teamOdds(kid, id))} |`,
    );
  }

  // ---- The dyno comp ----
  // Phase 26: it grows for its first years, so each year is sampled on its own.
  const D = COMP_TIERS[DYNO_COMP]!;
  const YEARS = 4;
  out(
    `\n## The Fall Festival dyno comp, thrown with human-ish hands (${SEEDS} a year, years 1 to ${YEARS}: V${gradesFor(DYNO_COMP, D.on).join('–V')} the first, V${gradesFor(DYNO_COMP, D.on + (YEARS - 1) * YEAR.days).join('–V')} the last)\n`,
  );
  out('| grade | throws stuck, median | won, year by year | podium | purse a year, average |');
  out('|---|---|---|---|---|');
  for (const g of [2, 4, 6, 8, 10, 12, 14]) {
    const years = Array.from({ length: YEARS }, (_, y) =>
      Array.from({ length: SEEDS }, (_, k) =>
        climbComp(climber(`dyno-${g}-${y}-${k}`, g), DYNO_COMP, D.on + y * YEAR.days),
      ),
    );
    const res = years.flat();
    const purse = res.reduce((a, r) => a + (D.purse[r.place - 1] ?? 0), 0) / res.length;
    out(
      `| V${g} | ${median(res.map((r) => r.tops))} of ${D.side!.n} | ${years.map((ys) => `${ys.filter((r) => r.place === 1).length}/${SEEDS}`).join(', ')} | ${res.filter((r) => r.place <= 3).length}/${res.length} | ${money(purse - D.fee)} after the fee |`,
    );
  }

  // ---- League night's season ----
  out(`\n## League night’s season, every night entered (${SEEDS} seasons each)\n`);
  out('| grade | nights won, of 8 | season place, median | seasons won | prize money a season, average |');
  out('|---|---|---|---|---|');
  const L = COMP_TIERS[0]!;
  for (const g of [1, 2, 3, 4, 5, 6]) {
    let nightsWon = 0;
    const places: number[] = [];
    let money_ = 0;
    for (let y = 0; y < SEEDS; y++) {
      let s = climber(`league-${g}-${y}`, g);
      const results: GameState['comps']['results'] = [];
      for (const d of leagueNights(y)) {
        const r = climbComp(s, 0, d);
        results.push({ tier: 0, day: d, place: r.place, of: r.of });
        if (r.place === 1) nightsWon++;
        money_ += (L.purse[r.place - 1] ?? 0) - L.fee;
      }
      s = { ...s, comps: { ...s.comps, results } };
      const table = leagueTable(s, y, leagueNights(y).at(-1)!);
      const place = table.findIndex((r) => r.you) + 1;
      places.push(place);
      if (place === 1) money_ += LEAGUE.prize;
    }
    out(
      `| V${g} | ${(nightsWon / SEEDS).toFixed(1)} | ${median(places)} of ${L.field} | ${places.filter((p) => p === 1).length}/${SEEDS} | ${money(money_ / SEEDS)} |`,
    );
  }

  // ---- Phase 26: the A league ----
  out(`\n## The A league, every night entered, a season won the year before (${SEEDS} seasons each)\n`);
  out('| grade | nights won, of 8 | season place, median | seasons won | money a season, average |');
  out('|---|---|---|---|---|');
  const A = COMP_TIERS[A_LEAGUE]!;
  for (const g of [4, 5, 6, 7, 8, 10]) {
    let nightsWon = 0;
    const places: number[] = [];
    let cash = 0;
    for (let y = 1; y <= SEEDS; y++) {
      let s = climber(`aleague-${g}-${y}`, g);
      s = { ...s, comps: { ...s.comps, seasons: [{ year: y - 1, place: 1, of: 10 }] } };
      const results: GameState['comps']['results'] = [];
      for (const d of leagueNights(y)) {
        const r = climbComp(s, A_LEAGUE, d);
        results.push({ tier: A_LEAGUE, day: d, place: r.place, of: r.of });
        if (r.place === 1) nightsWon++;
        cash += (A.purse[r.place - 1] ?? 0) - A.fee;
      }
      s = { ...s, comps: { ...s.comps, results } };
      const place = leagueTable(s, y, leagueNights(y).at(-1)!).findIndex((r) => r.you) + 1;
      places.push(place);
      if (place === 1) cash += LEAGUE.prizeA;
    }
    out(
      `| V${g} | ${(nightsWon / SEEDS).toFixed(1)} | ${median(places)} of ${A.field} | ${places.filter((p) => p === 1).length}/${SEEDS} | ${money(cash / SEEDS)} |`,
    );
  }

  // ---- Crew drama ----
  out(`\n## Crew drama in social careers (${SEEDS} seeds a start, 300 days)\n`);
  out('| start | seed | crew drama | Regulars of the four at the end |');
  out('|---|---|---|---|');
  let fired = 0;
  let runs = 0;
  const pairs = new Set<string>();
  const regulars: Record<string, number> = { sage: 0, mara: 0, rico: 0, tam: 0 };
  for (const start of Object.keys(STARTS))
    for (let k = 0; k < SEEDS; k++) {
      const r = season(`crew-${start}-${k}`, {
        start,
        strategy: 'career',
        days: 300,
        human: true,
        social: true,
      });
      runs++;
      const c = r.state.crew;
      if (c) {
        fired++;
        pairs.add(`${c.a} over ${c.b}`);
      }
      const regs = ['sage', 'mara', 'rico', 'tam'].filter((w) => (r.state.people[w]?.bond ?? 0) >= 3);
      for (const w of regs) regulars[w]!++;
      out(
        `| ${start} | ${k} | ${c ? `day ${c.day}: ${c.a} over ${c.b}, ${c.stage}` : '–'} | ${regs.length ? regs.join(', ') : 'none'} |`,
      );
    }
  out(
    `\nCrew drama came to ${fired} of ${runs} social careers, ${pairs.size} pairs: ${[...pairs].join('; ')}.`,
  );
  out(
    `Regulars at the end, of ${runs}: ${Object.entries(regulars)
      .map(([w, n]) => `${w} ${n}`)
      .join(', ')}.`,
  );
});
