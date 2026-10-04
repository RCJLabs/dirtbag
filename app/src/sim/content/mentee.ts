// Phase 25.3: the mentee, as data. Who they might be, and what's said as they grow.

// A kid at Send City; none share a name with the cast, the clients or the guides' guests.
export const MENTEES = ['Juno', 'Rosa', 'Ezra', 'Maya', 'Otto', 'Fen'];

// Said on taking one on.
export const MENTEE_TAKEN =
  '{name} has been watching you on the board for a month. Today they ask, without looking at you, whether you ever coach. You do now.';

// After so many sessions.
export const MENTEE_SESSIONS: Record<number, string> = {
  1: '{name} watches you climb like they’re memorizing a phone number. You show them how to hang off straight arms.',
  5: '{name} sends something they fell off all month and looks at you, not the wall.',
  10: '{name}’s mom picks them up and thanks you like you’ve done something. You suppose you have.',
  20: '{name} tells a kid half their size to trust their feet. You hear your own voice and try not to laugh.',
  35: '{name} beta-sprays you on your own project. They’re right.',
};

// On reaching a grade.
export const MENTEE_GRADES: Record<number, string> = {
  5: '{name} sends their first V5 and doesn’t celebrate until they’re in the parking lot.',
  8: '{name} flashes a V8 at League night. Three people ask who coaches them.',
  10: '{name} sends a V10. You weren’t there. They texted you first.',
};

// Drifting, and gone.
export const MENTEE_DRIFT =
  '{name} hasn’t seen you at the gym in two weeks. They’ve started climbing with the comp team instead.';
export const MENTEE_GONE =
  '{name} climbs with the comp team now. They wave when they see you, which is something.';
export const MENTEE_LET =
  'You tell {name} you can’t keep it up. They say it’s fine, the way kids say it’s fine.';

// To the next climber, from the one you coached.
export const MENTEE_HEIR =
  '{mentee} turns up at the Lot, older, with a crash pad and a long memory. {forebear} coached them; they coach you.';
