// The jobs, as data: each one's ranks, how many shifts each rank takes, what it adds to a
// shift's pay, and, for setting, the grade a rank needs. v0.956 promoted you every three
// shifts on attendance alone; here a rank takes longer, and setting wants you climbing.
// jobs.ts reads your record against these.

export interface JobDef {
  // What you are at each rank, from the first.
  ranks: string[];
  // Shifts worked to reach each rank (a double counts two).
  at: number[];
  // The grade each rank needs, if it needs one.
  grade?: number[];
  // Dollars a rank adds to a shift's pay, per rank above the first.
  raise: number;
}

export const JOBS: Record<string, JobDef> = {
  cafe: {
    ranks: ['New hire', 'Regular', 'Senior barista', 'Shift lead', 'Veteran'],
    at: [0, 12, 30, 54, 84],
    raise: 4,
  },
  // v0.956 gated setting at V8; here you start on the tape and climb the ranks as you climb.
  set: {
    ranks: ['Apprentice setter', 'Setter', 'Senior setter', 'Head setter'],
    at: [0, 6, 16, 30],
    grade: [0, 3, 5, 7],
    raise: 7,
  },
};
