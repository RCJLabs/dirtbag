// Expeditions, as v0.956 had them (docs/audit/climbing.md §2.3): the big objectives far
// from the valley, weeks away, with the weather deciding as much as you do. A grade to be
// allowed, a cost up front in cash, a number of pitches to fix and days to do it in, the
// chance any day is a storm, and what the summit pays. v0.956 also wanted reputation; the
// rebuild has none yet, so the grade gate stands alone.

export interface ExpeditionDef {
  name: string;
  region: string;
  objective: string;
  // v0.956's grade for the objective, on the V scale your skills are measured on.
  grade: number;
  // The lowest grade that'll take you: v0.956's gradeReq.
  gradeReq: number;
  pitches: number;
  days: number;
  stormOdds: number;
  cost: number;
  pays: number;
  blurb: string;
}

export const EXPEDITIONS: Record<string, ExpeditionDef> = {
  elcap: {
    name: 'El Capitan',
    region: 'Yosemite, USA',
    objective: 'The Nose',
    grade: 9,
    gradeReq: 7,
    pitches: 6,
    days: 10,
    stormOdds: 0.18,
    cost: 900,
    pays: 2400,
    blurb:
      'Three thousand feet of golden granite, the most famous big wall on Earth. A week living on portaledges.',
  },
  cerrotorre: {
    name: 'Cerro Torre',
    region: 'Patagonia, Argentina',
    objective: 'the Compressor Route',
    grade: 12,
    gradeReq: 10,
    pitches: 8,
    days: 16,
    stormOdds: 0.44,
    cost: 2200,
    pays: 6000,
    blurb:
      'A fang of rime ice in the worst weather on the planet. You will wait out storms, and the good days are everything.',
  },
  trango: {
    name: 'Trango Tower',
    region: 'Karakoram, Pakistan',
    objective: 'Eternal Flame',
    grade: 14,
    gradeReq: 12,
    pitches: 11,
    days: 24,
    stormOdds: 0.56,
    cost: 4500,
    pays: 12000,
    blurb:
      'A twenty-thousand-foot granite spire at the edge of the world. Weeks in, and one shot at the top.',
  },
};
