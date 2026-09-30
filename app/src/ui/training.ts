// The train sheet's words: each phase and where your block stands, from the numbers the
// rules use (TRAIN), so the sheet can't promise what a session won't do.
import {
  PHASE_NAME,
  phaseLock,
  prehabbed,
  taperDay,
  taperWait,
  TRAIN,
  type GameState,
  type PhaseId,
} from '../sim';

const pct = (x: number) => `${Math.round(Math.abs(x) * 100)}%`;
const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

export function phaseNote(ph: PhaseId): string {
  const p = TRAIN.phases[ph];
  switch (ph) {
    case 'base':
      return 'Where everyone starts. Nothing extra either way, and no commitment.';
    case 'build':
      return `Sessions teach ${pct(p.train - 1)} more. Every go and session is ${pct(p.risk - 1)} likelier to hurt.`;
    case 'peak':
      return `Every crux ${pct(p.windows - 1)} wider, for ${days(TRAIN.peakDays)} at most, then a deload. Sessions teach ${pct(1 - p.train)} less, and you're ${pct(p.risk - 1)} likelier to get hurt.`;
    case 'deload':
      return `Sessions teach ${pct(1 - p.train)} less and you're ${pct(1 - p.risk)} less likely to get hurt. Each night takes ${pct(1 - TRAIN.phases.deload.acute)} off your recent load.`;
  }
}

// Where your block stands: the phase and its lock, a taper, prehab.
export function blockLine(s: GameState): string {
  const ph = s.training.phase;
  const lock = phaseLock(s);
  const bits = [
    ph === 'base'
      ? 'Base: no phase on.'
      : `${PHASE_NAME[ph]}, day ${s.day - s.training.since + 1}${lock ? `. Locked ${days(lock)} more` : ''}.`,
  ];
  const t = taperDay(s);
  if (t) bits.push(`Tapering, day ${t} of ${TRAIN.taper.days}.`);
  if (prehabbed(s)) bits.push(`Prehab covers you ${days(s.training.prehab - s.day + 1)} more.`);
  return bits.join(' ');
}

export const taperNote = (): string =>
  `${days(TRAIN.taper.days)} with no training. Every crux ${pct(TRAIN.taper.windows - 1)} wider, ${pct(TRAIN.taper.last - 1)} on the last day. Then ${days(TRAIN.taper.cooldown)} before the next.`;

export const prehabNote = (): string =>
  `Bands and wrist curls. ${pct(1 - TRAIN.prehab.risk)} less likely to get hurt for ${days(TRAIN.prehab.days)}.`;
