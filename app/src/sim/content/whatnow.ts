// Phase 40: "What now?" from Hazel. Her three moves' words: each a button and a reason, the
// reason filled from the state, never a fact typed in (whatnow.test.ts holds them to it).
export const WHAT_NOW = {
  title: 'What now?',
  open: 'Hazel, over her coffee: “If you’re asking, here’s what I’d do.”',
  none: 'Hazel shrugs. “Whatever you like. You’ve earned a day of it.”',
  hurt: {
    label: 'See the clinic',
    why: 'That {kind} isn’t getting better on its own. The clinic’s in town.',
  },
  spent: { label: 'Back to the van', why: 'You’re spent. Nothing good gets climbed like this.' },
  skin: {
    label: 'A shift at {place}',
    why: 'Your skin’s done for today. Earn something while it grows back.',
  },
  bills: {
    label: 'A shift at {place}',
    why: 'The week’s bills come out {when}: {bills}, and you’ve {cash}.',
  },
  goal: {
    shift: { label: 'A shift at {place}', why: 'Next on your list: {goal}. You’ve {cash}.' },
    line: { label: 'Try {line}', why: 'Next on your list: {goal}. {line} is right here.' },
    place: { label: 'Go to {place}', why: 'Next on your list: {goal}.' },
    person: { label: 'Find {name} at {place}', why: 'Next on your list: {goal}. {name}’s at {place} now.' },
    page: { label: 'What’s next', why: 'Next on your list: {goal}.' },
  },
  friend: { label: 'Climb with {name}', why: '{name}’s at {place} now. Go and say hello.' },
  prime: { label: 'Go to {place}', why: '{place} is cold and dry today: the best friction all week.' },
  close: { label: 'Back on {line}', why: 'You were {n} off the top of {line} last time.' },
  shift: { label: 'A shift at {place}', why: '{place} has a shift going: {pay} for {time}.' },
  tonight: 'tonight',
  on: 'on {day}',
};
