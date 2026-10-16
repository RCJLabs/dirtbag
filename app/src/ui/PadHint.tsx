// Phase 14.6: a control's button on the pad, shown beside it while the pad is the one in use
// (the screen's data-input). Whichever button Settings gave the role (14.6b), named as an Xbox
// pad's are, which is what Steam Input hands a game by default, or as a Deck's on a Deck.
import { buttonName, type PadRole } from '../game/binds';
import { onDeck } from '../game/desktop';

export function PadHint({ b, binds }: { b: PadRole; binds: Record<PadRole, number> }) {
  return (
    <span className="pad-hint" aria-hidden="true">
      {buttonName(binds[b], onDeck)}
    </span>
  );
}
