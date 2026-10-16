// Phase 14.6: a control's button on the pad, shown beside it while the pad is the one in use
// (the screen's data-input). Named as an Xbox pad's are, which is what Steam Input hands a game
// by default.
export type PadButton = 'a' | 'b' | 'lb' | 'rb';
const NAME: Record<PadButton, string> = { a: 'A', b: 'B', lb: 'LB', rb: 'RB' };

export function PadHint({ b }: { b: PadButton }) {
  return (
    <span className="pad-hint" aria-hidden="true">
      {NAME[b]}
    </span>
  );
}
