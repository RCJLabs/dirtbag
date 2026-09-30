// The jobs, as data: each one's ranks, how many shifts each rank takes, what it adds to a
// shift's pay, and, for setting, the grade a rank needs. v0.956 promoted you every three
// shifts on attendance alone; here a rank takes longer, and setting wants you climbing.
// jobs.ts reads your record against these.
//
// Phase 22.1, by Evan's call: jobs differ in pay and in hours, every one starts low, and
// promotion is how you earn more: the top rank pays 1.6 to 2 times the first. A job that
// pays less an hour pays in something else: coaching your head, setting your technique, the
// warehouse your endurance. The harness
// prints every job's pay an hour at every rank (career.harness.ts); there's no pace target.

export interface JobDef {
  // What the job is called on the week's schedule, and the place you work it.
  name: string;
  place: string;
  // What you are at each rank, from the first.
  ranks: string[];
  // Shifts worked to reach each rank (a double counts two). Only shifts you signed up for
  // count: a walk-in pays, and that's all.
  at: number[];
  // The grade each rank needs, if it needs one. The first rank's is what it takes to be
  // taken on at all.
  grade?: number[];
  // Dollars a rank adds to a shift's pay, per rank above the first.
  raise: number;
  // Tips on top, seeded by the day: a weekday's range, and half again on a weekend.
  tips?: [number, number];
  // Shifts it posts a week, on days seeded by the week (jobs.ts). None: every day.
  posts?: number;
}

export const JOBS: Record<string, JobDef> = {
  // Evan's call (30 Sep 2026): the café pays least a shift, and its shifts are the shortest:
  // three hours at $28. (Cut to $25, the harness's balanced bots got stuck in their eighth
  // week, so setting went up to $30 instead.) It always needs someone on the morning shift:
  // the job that's there when nothing else is.
  cafe: {
    name: 'Coffee Shop',
    place: 'cafe',
    ranks: ['New hire', 'Regular', 'Senior barista', 'Shift lead', 'Veteran'],
    at: [0, 12, 30, 54, 84],
    raise: 5,
  },
  // Evan's call: the diner pays a little more than the café, in tips, for a longer shift:
  // four hours at $30 and $4 to $10 in tips, more at the weekend [proposed numbers].
  diner: {
    name: 'The Diner',
    place: 'diner',
    ranks: ['Busser', 'Server', 'Head server', 'Floor manager'],
    at: [0, 10, 24, 42],
    raise: 6,
    tips: [4, 10],
    posts: 5,
  },
  // Coaching at The Cave [proposed]: you start at V5, and head coach wants you climbing V8.
  // Four hours at $34, and the fastest ladder to the best pay an hour, if you climb. Evan's
  // call: its bonus is your head (and some technique), from telling people to trust their feet.
  coach: {
    name: 'Coaching',
    place: 'cave',
    ranks: ['Assistant coach', 'Coach', 'Head coach'],
    at: [0, 8, 20],
    grade: [5, 6, 8],
    raise: 17,
    posts: 4,
  },
  // v0.956 gated setting at V8; here you start on the tape and climb the ranks as you climb.
  // The worst pay an hour, and the only job that trains you.
  set: {
    name: 'Setting',
    place: 'gym',
    ranks: ['Apprentice setter', 'Setter', 'Senior setter', 'Head setter'],
    at: [0, 6, 16, 30],
    grade: [0, 3, 5, 7],
    raise: 10,
    posts: 4,
  },
  // Phase 22.1 [proposed]: the warehouse out by the river. Eight hours from dawn, the most a
  // shift and the least an hour, and a day with nothing left in it. Evan's call: eight hours
  // on your feet hauling is endurance.
  warehouse: {
    name: 'Warehouse',
    place: 'warehouse',
    ranks: ['Floor hand', 'Picker', 'Forklift driver', 'Lead'],
    at: [0, 10, 25, 45],
    raise: 17,
    posts: 3,
  },
};
