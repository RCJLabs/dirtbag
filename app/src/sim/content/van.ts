// What a breakdown says (Phase 22.2a): how each part goes on the road, and how a bodge ends.
// v0.956 wrote a situation and four outcomes for six parts; three parts keep its voice.

export const BREAKDOWN_LINE: Record<'tires' | 'engine', string> = {
  tires:
    'A bang, then the steering pulls hard right. The rear tire is in strips on the shoulder, and the spare is flat too. Of course it is.',
  engine:
    'The temperature needle climbs, the engine coughs twice, and then it’s just you, the ticking of hot metal, and a lot of road.',
};

export const BODGE_HELD: Record<'tires' | 'engine', string> = {
  tires: 'A plug kit, a hand pump and an hour of swearing. It holds. You drive on, not fast.',
  engine: 'Hose tape, the last of your water, and a zip tie where a clamp should be. It holds. For now.',
};

export const BODGE_FAILED: Record<'tires' | 'engine', string> = {
  tires: 'The plug holds for about a mile, then sighs out. Back on the shoulder.',
  engine: 'It starts, it runs, it stops. Whatever you fixed wasn’t the thing.',
};
