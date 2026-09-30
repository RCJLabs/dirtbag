// The jobs, as data: each one's ranks, how many shifts each rank takes, what it adds to a
// shift's pay, and, for setting, the grade a rank needs. v0.956 promoted you every three
// shifts on attendance alone; here a rank takes longer, and setting wants you climbing.
// jobs.ts reads your record against these.
//
// Phase 22.1, by Evan's call: jobs differ in pay and in hours, every one starts low, and
// promotion is how you earn more: the top rank pays 1.7 to 2 times the first. The harness
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
  // Shifts it posts a week, on days seeded by the week (jobs.ts). None: every day.
  posts?: number;
}

export const JOBS: Record<string, JobDef> = {
  // Three hours at $28, the best start an hour, the slowest ladder and the smallest raises.
  // The café always needs someone on the morning shift: it's the job that's there when
  // nothing else is.
  cafe: {
    name: 'Coffee Shop',
    place: 'cafe',
    ranks: ['New hire', 'Regular', 'Senior barista', 'Shift lead', 'Veteran'],
    at: [0, 12, 30, 54, 84],
    raise: 5,
  },
  // Coaching at The Cave [proposed]: you start at V5, and head coach wants you climbing V8.
  // Four hours at $34, and the fastest ladder to the best pay an hour, if you climb.
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
  // shift and the least an hour, and a day with nothing left in it.
  warehouse: {
    name: 'Warehouse',
    place: 'warehouse',
    ranks: ['Floor hand', 'Picker', 'Forklift driver', 'Lead'],
    at: [0, 10, 25, 45],
    raise: 17,
    posts: 3,
  },
};
