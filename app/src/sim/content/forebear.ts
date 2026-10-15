// Phase 31.2: the old climber at the fire, in words. They tell it from what the family kept of
// their life (Career, Phase 31.1); a line is only said when the family kept what it names. An
// heir from before Phase 31 has only first ascents, so the lines without a need carry them.
// Filled: {forebear}, {you}, {hardest} (their hardest send outside), {fa} (a first ascent of
// theirs), {scar}, {summit} and {crew}.

import type { QuestKind } from '../heir';

export type ForebearNeed =
  'hardest' | 'fa' | 'scar' | 'summit' | 'crew' | 'body' | 'chose' | 'home' | 'oldHigh' | 'oldLow';

export interface ForebearLine {
  text: string;
  needs?: ForebearNeed;
}

// The first night: they've a chair at the fire now.
export const FOREBEAR_MEET =
  '{forebear} has a camp chair at the fire now, and a blanket they say they don’t need. “Sit. You smell like chalk and sunscreen. Good.”';

// In order, the first time round; then walked by the seed.
export const FOREBEAR_LINES: ForebearLine[] = [
  {
    text: '“Ask me about anything I sent. I don’t remember the names, but I remember every hold.”',
  },
  {
    text: '{forebear} pokes the coals. “{hardest} took me a season. Everybody says the crux is the move at the lip. Everybody’s wrong. It’s the rest before it.”',
    needs: 'hardest',
  },
  {
    text: '“I didn’t tell anyone about {fa} for a week. I wanted it to be mine a bit longer before it was everyone’s.”',
    needs: 'fa',
  },
  {
    text: '{forebear} works the stiffness out of their {scar} without seeming to notice. “Tape it before you need to. Not after. Nobody listens to that one.”',
    needs: 'scar',
  },
  {
    text: '“There’s a ledge high on {summit} where you can see the weather coming for an hour before it gets you. I watched it come. Then I went up anyway.”',
    needs: 'summit',
  },
  {
    text: '“{crew}. We were going to take over the valley. Mostly we took over this fire.”',
    needs: 'crew',
  },
  {
    text: '“The body called it. It was right, which was the annoying part.”',
    needs: 'body',
  },
  {
    text: '“I stopped on a good day. Everybody said I was mad. Stop on a good day, {you}. Then you get to keep it.”',
    needs: 'chose',
  },
  {
    text: '“I went home for a while. Turns out home is where you sleep. This is where you live.”',
    needs: 'home',
  },
  {
    text: '“The old guard will give you a hard time because of me. It’s how they say they liked me.”',
    needs: 'oldHigh',
  },
  {
    text: '“Some of the old guard won’t warm to you, and that one’s on me. We had words, years back. Climb clean and let them come round.”',
    needs: 'oldLow',
  },
  {
    text: '“You’re climbing like you’re late for something. You’re not. The rock’s been here a while.”',
  },
  {
    text: '{forebear} doesn’t say much tonight. They pass you the coffee pot and watch the fire, and that’s enough.',
  },
  {
    text: '“Hazel says you’re doing all right. Hazel never once said that about me, so don’t let it go to your head.”',
  },
  {
    text: '“Eat something green this week. I didn’t, for years, and my knees are still sending me the bill.”',
  },
];

// Phase 31.3: the line they give you the first night (Evan's call: the one they never sent;
// without one, their hardest send; for an heir from before Phase 31, their first ascent).
// {quest} and {crag} are filled from it.
export const QUEST_GIVE: Record<QuestKind, string> = {
  project:
    '“One thing.” {forebear} looks off toward {crag} in the dark. “{quest}. I had all the moves. I never had them all on the same day. You might.”',
  hardest: '“One thing. {quest}, at {crag}. Best thing I ever did. Go and do it better.”',
  fa: '“One thing. {quest}, at {crag}. I put it up. Go and find out if I sandbagged it.”',
};

// Its send, said then; and at the fire, the next time you sit with them.
export const QUEST_SENT =
  'You sent {quest}. Somewhere down at the Lot, {forebear} is going to hear about it before you can say.';
export const QUEST_TOLD =
  '“You sent it.” {forebear} doesn’t say anything else for a while. Then: “How was the top?”';

// Beta on a line they sent: {line}, its {crux}, and the way through ({beta}, {Beta}).
export const FOREBEAR_BETA =
  '{forebear} draws {line} in the dirt with a stick and taps {crux}. “{Beta}. I fell off there for a month before anyone told me.”';

// Nothing of theirs you're on that they can help with.
export const FOREBEAR_NO_BETA =
  '{forebear} shrugs. “Get on something I climbed and I’ll tell you what I know.”';
