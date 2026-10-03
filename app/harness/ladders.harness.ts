// The ladders harness (Phase 18's criterion 2): a career bot for each ladder, from every
// start, played to the day it hangs it up. Outdoors is the career bot as it is (the story is
// its ladder); the others climb theirs besides it. When each reaches the top, and what the
// focus cost the story. LADDER_SEEDS changes the seeds per start.
import { it } from 'vitest';
import type { BotRun } from '../src/sim/bot';
import { STARTS } from '../src/sim/climber';
import { median, season } from '../src/sim/harness';
import { LADDERS, type LadderId } from '../src/sim/ladders';
import { newGame } from '../src/sim/game';

const SEEDS = Number(process.env.LADDER_SEEDS ?? 1);
const DAYS = 480;
const out = (s = '') => process.stdout.write(`${s}\n`);

// The first day a run stood on a ladder's top rung, or null.
function topDay(r: BotRun, i: number, rungs: number): number | null {
  return r.days.find((d) => (d.ladders[i] ?? 0) >= rungs)?.day ?? null;
}
const best = (r: BotRun, i: number) => Math.max(0, ...r.days.map((d) => d.ladders[i] ?? 0));

it('the ladders', { timeout: 3_600_000 }, () => {
  const s0 = newGame('ladders');
  out(
    `\n# The ladders: ${SEEDS} seed${SEEDS > 1 ? 's' : ''} per start, a career bot per ladder, to the day it hangs it up\n`,
  );
  out('| ladder | start | top reached (day) | best rung | story acts | retired |');
  out('|---|---|---|---|---|---|');
  const rows: { id: LadderId; top: number | null; acts: number }[] = [];
  LADDERS.forEach((l, i) => {
    const rungs = l.rungs(s0).length;
    for (const start of Object.keys(STARTS))
      for (let k = 0; k < SEEDS; k++) {
        const r = season(`lad-${l.id}-${start}-${k}`, {
          start,
          strategy: 'career',
          days: DAYS,
          human: true,
          focus: l.id === 'outdoor' ? undefined : l.id,
        });
        const top = topDay(r, i, rungs);
        const acts = best(r, 0);
        rows.push({ id: l.id, top, acts });
        out(
          `| ${l.name} | ${start} | ${top ? `day ${top}` : '–'} | ${best(r, i)} of ${rungs} (${l.rungs(r.state)[Math.max(0, best(r, i) - 1)]}) | ${acts} | ${r.state.life.retired ? `day ${r.state.life.retired.day}` : '–'} |`,
        );
      }
  });
  out('\n## Targets\n');
  const say = (ok: boolean, what: string, how: string) => out(`- ${ok ? '✓' : '✗'} ${what}: ${how}`);
  for (const l of LADDERS) {
    const mine = rows.filter((r) => r.id === l.id);
    const made = mine.filter((r) => r.top !== null);
    say(
      made.length === mine.length,
      `${l.name}: the bot focused on it reaches the top before it hangs it up (criterion 2)`,
      `${made.length}/${mine.length}${made.length ? `; median day ${median(made.map((r) => r.top!))}` : ''}; the story's acts ended, median ${median(mine.map((r) => r.acts))}.`,
    );
  }
});
