// Phase 34.2: the retainers, said. Prices and effects are filled from the dials (RETAINER).

export const RETAINER_SAYS = {
  physio: {
    take: 'Keep a physio on retainer',
    drop: 'Let the physio go',
    note: 'Physio free, {days} days off an injury a session.',
    kept: 'On retainer: physio free, {days} days off an injury a session.',
    taken: 'The physio writes you into the book: seen when you need it, as often as you need it.',
    dropped: 'You come off the physio’s book. The next visit is paid at the desk.',
    bill: 'The physio’s retainer: {cash}.',
  },
  coach: {
    take: 'Take on a coach',
    drop: 'Let the coach go',
    note: 'One of the Cave’s coaches on your training: {gain} more from every session.',
    kept: 'Coached: {gain} more from every session.',
    taken: 'One of the coaches looks at your hangboard log and sighs. You start Monday.',
    dropped: 'You thank the coach and go back to the program you wrote yourself.',
    bill: 'Your coach: {cash}.',
  },
};
