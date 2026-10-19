// Save files: a versioned envelope around the state, a migration registry, and a strict
// validator. The loader never repairs a save it doesn't understand and never returns a
// fresh game in its place: it says why it failed, and the caller keeps the bytes.
//
// Changing the shape of GameState means: bump SAVE_VERSION, register MIGRATIONS[old] that
// turns an old state into the new shape, and add a test that loads a real old save.

import { CARRIED, SKILLS, STARTS } from './climber';
import { GEAR } from './content/gear';
import { PLACES } from './content/places';
import {
  AGE,
  FACTION,
  OWN_GYM,
  LIFESTYLE,
  PLANS,
  SETTING,
  SETTLE,
  SPOTS,
  TRAIN,
  VAN_AGE,
  YEAR,
} from './dials';
import { JOBS } from './content/jobs';
import { ROUTES, WALLS } from './content/routes';
import { EXPEDITIONS } from './content/expeditions';
import { PEOPLE } from './content/people';
import { WALL_EVENTS } from './content/wallevents';
import { INGREDIENTS, MEAL_NAME } from './content/food';
import { KNOCKS } from './content/knocks';
import { HOLIDAYS } from './content/folks';
import { HITCHERS, STOPS } from './content/road';
import { EPICS } from './content/epics';
import { recordById } from './content/record';
import { CAME_ACROSS, ORIGINS } from './content/origins';
import { TALENTS } from './content/talents';
import { CALLINGS } from './content/callings';
import { HYBRIDS, MASTERY, PATHS, QUIRKS } from './content/paths';
import { ECHOES, STANCES } from './content/scene';
import { BOARD_JOBS } from './content/board';
import { newMastery } from './paths';
import { newlyEarned } from './record';
import { DEMO_END } from './content/demo';
import { fromFullGame } from './demo';
import { DEMO_BUILD } from './edition';
import { aimMet, currentGoal } from './story';
import { repeatsOf } from './settle';
import { defaultPlan, PIECES } from './vanplan';
import { setOf } from './yourset';
import { ACT_I } from './content/story';
import type { GameState, LogLine, PersonLog, RouteLog, SendRecord } from './types';

export const SAVE_VERSION = 83;
const FORMAT = 'dirtbag';

export interface SaveFile {
  format: typeof FORMAT;
  v: number;
  // The build that wrote it, for bug reports. Loading never depends on it.
  app: string;
  state: GameState;
}

// MIGRATIONS[n] turns a version-n state into version n+1. Each one is history: it writes
// the values the new shape started with, as literals, so retuning a dial later never
// changes what an old save loads as.
export type Migration = (state: unknown) => unknown;
export const MIGRATIONS: Record<number, Migration> = {
  // v1 (R0) -> v2 (R1): hunger, a climber with v0.956's skills, and the people you've met.
  // The name stays empty, so the game asks who you are before it goes on.
  1: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return {
      ...x,
      fed: 80,
      climber: {
        name: '',
        start: 'allrounder',
        skills: { power: 8, fingers: 8, endurance: 8, technique: 8, head: 8 },
      },
      people: {},
    };
  },
  // v2 (R1) -> v3 (R2): training load, seeded at a light day's load as a new game's is; no
  // injury, and none so far; no first ascents, no race on, no trips out, no dog, and Act I
  // from its first goal (checked on the next action, so an old save catches up). (v3 grows with R2 until R2's build ships;
  // from then on it's history like the rest.)
  2: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return {
      ...x,
      load: { acute: 20, chronic: 20, today: 0 },
      injury: null,
      hurt: 0,
      firsts: {},
      race: null,
      trips: 0,
      dog: null,
      goals: 0,
    };
  },
  // v3 (0.960.0) -> v4 (Phase 10.3): no trips paid for yet. Moonstone opens on its own terms.
  3: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, unlocked: [] };
  },
  // v4 (0.961.0) -> v5 (Phase 21.1): the kit a new climber starts with, the shoes they drove
  // out in and half a bag of chalk, for climbers who were already out here.
  4: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, gear: { shoes: 60, chalk: 30 } };
  },
  // v5 (Phase 21.2) -> v6 (Phase 21.3): a training block, in base since the day you load it,
  // never tapered, no prehab.
  5: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, training: { phase: 'base', since: isInt(x.day) ? x.day : 1, taper: null, prehab: 0 } };
  },
  // v6 (Phase 21.3) -> v7: shifts worked, counted from here. v6 never counted them, so
  // everyone starts at the first rank.
  6: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, jobs: {} };
  },
  // v7 -> v8 (Phase 21.5): on no wall, and away on no expedition.
  7: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, wall: null, expedition: null };
  },
  // v8 -> v9 (Phase 21.6): no speed runs yet, and climbing on a rope, as everyone did.
  8: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, speed: { pb: null, runs: 0, day: 0 }, mode: 'rope', soloing: null, dead: null };
  },
  // v9 -> v10 (Phase 22.1): no shifts signed up for, no warnings, on every job's schedule,
  // and living as everyone did: a dirtbag.
  9: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, shifts: [], strikes: {}, benched: {}, lifestyle: 'dirtbag' };
  },
  // v10 -> v11 (Phase 22.2a): the van's parts, worn from the miles already on it, and not
  // broken down.
  10: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, van: { tires: 70, engine: 70, battery: 70 }, breakdown: null };
  },
  // v11 -> v12 (Phase 22.2b): parked at the Lot, as everyone was, with the count of nights in
  // a row starting from here, and no driveway yet.
  11: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, spot: 'lot', lotNights: 0, driveway: 0 };
  },
  // v12 -> v13 (Phase 22.3): an empty pantry, no meals remembered, and not fueled.
  12: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, pantry: {}, meals: [], fueled: 0 };
  },
  // v13 -> v14 (Phase 22.4a): on the catastrophic plan, which is what the flat premium was,
  // and never jabbed.
  13: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, insurance: 'catastrophic', jab: 0 };
  },
  // v14 -> v15 (Phase 22.4b): no marks, no flare, no fear. Old injuries before now left none.
  14: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, scars: [], flare: null, fear: [] };
  },
  // v15 -> v16 (Phase 22.4c): supplies at a new climber's, and well.
  15: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, supplies: 80, sick: null };
  },
  // v16 -> v17 (Phase 22.4d): psyche even. No crags listed: a crag you've logged a line at
  // counts as one you've been to (game.ts arriveAt), so an old climber's aren't new.
  16: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, psyche: { level: 50, stale: 0 }, crags: [] };
  },
  // v17 -> v18 (Phase 22.5a): no one-time lines had yet.
  17: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, seen: [] };
  },
  // v18 -> v19 (Phase 22.5b): no sets played yet.
  18: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, guitar: 0 };
  },
  // v19 -> v20 (Phase 22.6a): an empty deck, and nobody at the door.
  19: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, deck: { last: 0, knock: 0, seen: [] }, encounter: null };
  },
  // v20 -> v21 (Phase 22.6b): nobody picked up yet, no stops found.
  20: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const deck = isObj(x.deck) ? x.deck : {};
    return { ...x, deck: { ...deck, hitch: 0, stop: 0, stops: [], met: {} } };
  },
  // v21 -> v22 (Phase 22.6c): no walk-outs yet.
  21: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const deck = isObj(x.deck) ? x.deck : {};
    return { ...x, deck: { ...deck, epic: 0 } };
  },
  // v22 -> v23 (Phase 22.7): no dog lost yet. A dog you have keeps the day he picked you, and
  // ages from it.
  22: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, dogs: [] };
  },
  // v23 -> v24 (Phase 22.8): no dream picked, an empty jar.
  23: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, dream: { pick: null, pot: 0, owned: [] } };
  },
  // v24 -> v25 (Phase 22.9a): no hand of dice on the go.
  24: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, table: null };
  },
  // v25 -> v26 (Phase 22.9b): not sat at cards, and no reads on anyone.
  25: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, cards: null, reads: {} };
  },
  // v26 -> v27 (Phase 24.1): an expedition you're away on keeps its day and its pitches, and
  // ropes up with Hazel if you know her (alone if not); 21.5's energy on the wall goes, since
  // up there it's your own.
  26: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const e = x.expedition;
    if (!isObj(e)) return x;
    const people = isObj(x.people) ? x.people : {};
    const { energy: _gone, ...rest } = e;
    void _gone;
    return {
      ...x,
      expedition: {
        ...rest,
        partner: 'hazel' in people ? 'hazel' : null,
        nights: Math.max(0, Number(e.day) - 1),
      },
    };
  },
  // v27 -> v28 (Phase 24.2): nothing booked; a trip under way packed food and water for every
  // day it has left, the portaledge, and the stove where the water's snow.
  27: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const e = x.expedition;
    if (!isObj(e)) return { ...x, booked: null };
    const def = EXPEDITIONS[String(e.id)];
    return {
      ...x,
      booked: null,
      expedition: {
        ...e,
        food: Math.max(0, (def?.days ?? 0) - Number(e.day)),
        ledge: true,
        stove: !!def?.melt,
      },
    };
  }, // v28 -> v29 (Phase 24.4): a trip under way has had nothing happen to it yet.
  28: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const e = x.expedition;
    return isObj(e) ? { ...x, expedition: { ...e, seen: [] } } : x;
  }, // v29 -> v30 (Phase 24.5): no trips in the book yet. One under way goes in when it's over.
  29: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, book: [] };
  }, // v30 -> v31 (Phase 23.1): the Record Book, holding what you'd already done, as of the
  // day you load it. No cards for those: they go in quietly.
  30: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const s = { ...x, record: {} } as unknown as GameState;
    const record: Record<string, number> = {};
    for (const r of newlyEarned(s)) record[r.id] = s.day;
    return { ...x, record };
  }, // v31 -> v32 (Phase 23.2): a climber from before origins has none, and nothing's dealt
  // them now; their talents would show against the skills they have today.
  31: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const c = x.climber;
    const skills = isObj(c) && isObj(c.skills) ? { ...c.skills } : {};
    return { ...x, origin: null, talents: { ids: [], known: [], from: skills } };
  },
  // v32 -> v33 (Phase 23.3): no calling yet, and not yet asked; a climber who's sent enough
  // is asked on the first thing they do.
  32: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, calling: { id: null, since: 0, rungs: [], offered: false } };
  },
  // v33 -> v34 (Phase 23.4): no paths yet; the styles already sent deep enough are mastered,
  // quietly; habits count from today, so a quirk's named on goes the game has seen.
  33: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const fresh = {
      ...x,
      paths: { tiers: {}, told: [] },
      mastery: [],
      quirk: null,
      habits: { goes: 0, outdoor: 0, fresh: 0, tired: 0, evening: 0, dawn: 0, easy: 0, power: 0 },
    };
    return { ...fresh, mastery: newMastery(fresh as unknown as GameState) };
  },
  // v34 -> v35 (Phase 23.5): even with both crowds, no calls made yet.
  34: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return {
      ...x,
      scene: { old: FACTION.start, gym: FACTION.start, stances: [], echoes: [], last: 0, echoLast: 0 },
    };
  },
  // v35 -> v36 (Phase 23.6): no board yet; this week's goes up on the first thing you do.
  35: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, board: { week: 0, jobs: [], shifts0: 0, sessions: 0 } };
  },
  // v36 -> v37 (Phase 23.7): the years already done count as recapped, quietly (no card for a
  // year that ended before the game could say so); no Homecoming yet.
  36: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const day = isInt(x.day) ? x.day : 1;
    return { ...x, year: { recapped: Math.floor((day - 1) / YEAR.days), home: 'none' } };
  },
  // v37 -> v38 (Phase 16.1): a clock for the life. A save already past the countdown's start
  // has its clock held back to it, so nobody loads into their last night unwarned; the age
  // you are on loading counts as said.
  37: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const day = isInt(x.day) ? x.day : 1;
    const start = AGE.start + (typeof x.origin === 'string' ? (ORIGINS[x.origin]?.fx.age ?? 0) : 0);
    const warnDay = (AGE.warn - start) * AGE.days + 1;
    const held = Math.max(0, day - warnDay);
    const told = start + Math.floor(Math.max(0, day - 1 - held) / AGE.days);
    return { ...x, life: { held, told, retired: null } };
  },
  // v38 -> v39 (Phase 16.2): the story goes on past Act I. A save that's finished it moves on,
  // quietly, past every later stage it's already done (no cards, no pay for what came
  // before the story could say so), to the first it hasn't.
  38: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const s = { ...x } as unknown as GameState;
    if (!isInt(s.goals) || s.goals < ACT_I.length) return s;
    for (let g = currentGoal(s); g && aimMet(s, g.aim); g = currentGoal(s)) s.goals += 1;
    return s;
  },
  // v39 -> v40 (Phase 16.5): no family yet; every climber so far is the first of theirs.
  39: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, family: null };
  },
  // v40 -> v41 (Phase 17.3): everyone you'd met, you'd spoken to as far as the game knew
  // (their first meeting played or was skipped for good); nobody's life has moved on yet.
  40: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const people = isObj(x.people) ? x.people : {};
    return {
      ...x,
      people: Object.fromEntries(
        Object.entries(people).map(([id, p]) => [id, isObj(p) ? { ...p, talked: true } : p]),
      ),
    };
  },
  // v41 -> v42 (Phase 17.4): nobody's with anyone yet, and no spark's been offered.
  41: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, romance: null };
  },
  // v42 -> v43 (Phase 17.5): two new optional fields, a gift's day and a line's honoree;
  // nobody's been given anything yet, and no line's named for anyone.
  42: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x };
  },
  // v43 -> v44 (Phase 17.6): nobody's called from home yet.
  43: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, folks: { calls: 0 } };
  },
  // v44 -> v45 (Phase 17.7): two new optional fields; nobody's fire or portaledge lines have
  // been heard in order yet, so everyone's start from their first.
  44: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x };
  },
  // v45 -> v46 (Phase 18.1): nobody's taken leave yet.
  45: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, leave: {} };
  },
  // v46 -> v47 (Phase 18.3): nobody coached yet, and no picks on the go.
  46: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, coach: null, haul: null };
  },
  // v47 -> v48 (Phase 18.4): no comps yet.
  47: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, comps: { on: null, points: [], results: [] } };
  },
  // v48 -> v49 (Phase 18.5): nobody following you yet, no sponsor, nothing posted.
  48: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return {
      ...x,
      media: {
        followers: 0,
        engagement: 40,
        posted: 0,
        bait: -99,
        sponsor: null,
        offer: null,
        heat: null,
        doc: null,
        lost: null,
      },
    };
  },
  // v49 -> v50 (Phase 18.6): no gym of your own, nothing bolted.
  49: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, gym: null, bolted: [] };
  },
  // v50 -> v51 (Phase 25.1): nothing given yet, no guides.
  50: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, giving: { total: 0, food: 0, access: 0 }, guides: {} };
  },
  // v51 -> v52 (Phase 25.2): no guiding outfit.
  51: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, outfit: null };
  },
  // v52 -> v53 (Phase 25.3): nobody to coach yet.
  52: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, mentee: null };
  },
  // v53 -> v54 (Phase 25.4): no team away, none come home.
  53: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, team: null, teams: [] };
  },
  // v54 -> v55 (Phase 25.5): no League night season settled yet.
  54: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    if (!isObj(x.comps)) throw new Error('comps is not an object');
    return { ...x, comps: { ...x.comps, seasons: [] } };
  },
  // v55 -> v56 (Phase 25.6): no crew drama yet; nobody's fallen out (a new optional field).
  55: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, crew: null };
  },
  // v56 -> v57 (Phase 26): warnings expire. A save's standing warnings count from the day it
  // loads into, since the day they were given wasn't kept.
  56: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const day = isInt(x.day) ? x.day : 1;
    const strikes = isObj(x.strikes) ? x.strikes : {};
    return { ...x, struck: Object.fromEntries(Object.keys(strikes).map((job) => [job, day])) };
  },
  // v57 -> v58 (Phase 27.4): a first send can be one you called (a new optional field on a
  // send). Nothing before it was called, so nothing changes.
  57: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return x;
  },
  // v58 -> v59 (Phase 28.1): the crew's name. Nobody had named one.
  58: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, crewName: null };
  },
  // v59 -> v60 (Phase 28.2): the crew project. Nobody had one, called a crew day, or sent one.
  59: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, crewProject: null, crewDay: null, crewSends: [] };
  },
  // v60 -> v61 (Phase 28.3): favours, owed and asked, and loans to the crew (new optional
  // fields on a person). Nobody had asked or lent, so nothing changes.
  60: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return x;
  },
  // v61 -> v62 (Phase 29.1): scavenged parts. Nobody had picked over the free pile.
  61: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, parts: 0 };
  },
  // v62 -> v63 (Phase 29.2): the Board's jobs became bounties, so the week's board comes down
  // and goes up again, dealt its pay, the next thing you do (as v36 put the first one up).
  62: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, board: { week: 0, jobs: [], shifts0: 0, sessions: 0, pick: null } };
  },
  // v63 -> v64 (Phase 29.3): the van's miles. The clock starts now, at a new climber's (Evan's
  // call), so nobody loads into a dying engine.
  63: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const van = isObj(x.van) ? x.van : {};
    return { ...x, van: { ...van, miles: VAN_AGE.start, rebuilt: 0, verdict: null } };
  },
  // v64 -> v65 (Phase 33.1): a comp you're in is in a round; every comp was one round till now.
  64: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const c = isObj(x.comps) ? x.comps : {};
    return { ...x, comps: { ...c, on: isObj(c.on) ? { ...c.on, round: 0 } : (c.on ?? null) } };
  },
  // v65 -> v66 (Phase 34.2): a physio and a coach on retainer; nobody had either.
  65: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, retainers: { physio: null, coach: null } };
  },
  // v66 -> v67 (Phase 34.3): photos of your sends, and the year's piece; nobody had either.
  66: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const m = isObj(x.media) ? x.media : {};
    return { ...x, media: { ...m, photos: [], piece: null } };
  },
  // v67 -> v68 (Phase 34.4): a film you paid for; nobody had one. (A sponsor's stand is a new
  // ask, from the next cycle on.)
  67: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const m = isObj(x.media) ? x.media : {};
    return { ...x, media: { ...m, film: null } };
  },
  // v68 -> v69 (Phase 30.3): an ambassador's clinic is a sponsor's ask from 35, from the next
  // cycle on; nothing to change in a save.
  68: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return x;
  },
  // v69 -> v70 (Phase 31.1): a family's Record Books, apart. A kid's book held their
  // forebear's entries as well as their own; the ones up to the day the forebear hung it up
  // (where the kid's clock starts) go to the forebear's page, any generation before lumped in
  // with them. What the forebear did beyond their first ascents wasn't kept: no career.
  69: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const f = x.family;
    if (!isObj(f)) return x;
    const held = isObj(x.life) && typeof x.life.held === 'number' ? x.life.held : 0;
    const theirs: Record<string, unknown> = {};
    const mine: Record<string, unknown> = {};
    for (const [id, d] of Object.entries(isObj(x.record) ? x.record : {}))
      (typeof d === 'number' && d <= held ? theirs : mine)[id] = d;
    return { ...x, record: mine, family: { ...f, books: [{ name: f.forebear, record: theirs }] } };
  },
  // v70 -> v71 (Phase 32.2): the Hollow's clues; nobody had any, or had looked.
  70: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, hollow: { clues: [], tries: 0 } };
  },
  // v71 -> v72 (Phase 32.3): cracks bolted in a wild place; nobody had found one to bolt.
  71: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, boltedCracks: [] };
  },
  // v72 -> v73 (Phase 32.4): repeats settle your first ascents. Those already repeated are
  // heard of, quietly, so a loaded career isn't told a season's word in one night.
  72: (x) => {
    if (!isObj(x) || !isObj(x.firsts)) throw new Error('state is not an object');
    const s = x as unknown as GameState;
    const firsts = Object.fromEntries(
      Object.entries(s.firsts).map(([id, f]) => {
        const n = f.by ? 0 : repeatsOf(s, id);
        return [id, n ? { ...f, heard: n } : f];
      }),
    );
    return { ...x, firsts };
  },
  // v73 -> v74 (Phase 35.1): how often each hitchhiker has come. Those you'd met came at least
  // once; nobody counted the rest, so once it is.
  73: (x) => {
    if (!isObj(x) || !isObj(x.deck) || !isObj(x.deck.met)) throw new Error('state is not an object');
    return {
      ...x,
      deck: { ...x.deck, meets: Object.fromEntries(Object.keys(x.deck.met).map((id) => [id, 1])) },
    };
  }, // v74 -> v75 (Phase 35.3): knocks that come back. Nobody you helped before was counted.
  74: (x) => {
    if (!isObj(x) || !isObj(x.deck)) throw new Error('state is not an object');
    return { ...x, deck: { ...x.deck, back: [] } };
  },
  // v75 -> v76 (Phase 35.4): an encounter can be a holiday's scene at the fire. Nobody was
  // in one before; nothing to change.
  75: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return x;
  },
  // v76 -> v77 (Phase 36.1): liar's dice is Perudo now, every cup at the fire. A hand of the
  // old one-bid game left on the go is put away; nothing hung on it.
  76: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, table: null };
  },
  // v77 -> v78 (Phase 36.2): a blackjack hand is your hands (two once a pair's split), each with
  // its bet, the one you're playing, and what they paid once it's over. A hand on the go
  // carries on as your one hand.
  77: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const c = x.cards;
    if (!isObj(c) || !isObj(c.bj)) return x;
    const { you, bet, ...rest } = c.bj;
    return { ...x, cards: { ...c, bj: { ...rest, you: [{ cards: you, bet }], at: 0, paid: null } } };
  },
  // v78 -> v79 (Phase 36.3): hold'em is everyone at the fire now. A heads-up hand on the go is
  // put away, and what you'd put in it, half its pot, comes back in front of you.
  78: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const c = x.cards;
    if (!isObj(c) || !isObj(c.he)) return x;
    const back = isNum(c.he.pot) ? c.he.pot / 2 : 0;
    return { ...x, cards: { ...c, chips: (isNum(c.chips) ? c.chips : 0) + back, he: null } };
  },
  // v79 -> v80 (Phase 37): the session, today's on a boulder problem and the ones you sent
  // first in. No save before it was in one.
  79: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, sesh: null, seshFirsts: 0 };
  },
  // v80 -> v81 (Phase 38): a line keeps the pace of your best go on it, for its ghost. No go
  // before it kept one: a high point from before climbs at an even pace till you go again.
  80: (x) => x,
  // v81 -> v82 (Phase 43): the van laid out. A save from before gets what it owns placed for
  // it, as a new van would be.
  81: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    const gear = isObj(x.gear) ? (x.gear as Record<string, number>) : {};
    const dream =
      isObj(x.dream) && isStrs(x.dream.owned) ? { pick: null, pot: 0, owned: x.dream.owned } : undefined;
    return { ...x, vanPlan: defaultPlan({ gear, dream: dream as GameState['dream'] }) };
  },
  // v82 -> v83 (Phase 44.2): a set you hang stays up on the panel. Nobody had one up before.
  82: (x) => {
    if (!isObj(x)) throw new Error('state is not an object');
    return { ...x, setUp: null };
  },
};

export type LoadResult = { ok: true; state: GameState; from: number } | { ok: false; why: string };

export function toSave(state: GameState, app: string): string {
  const file: SaveFile = { format: FORMAT, v: SAVE_VERSION, app, state };
  return JSON.stringify(file);
}

// `target` is the version this build reads; tests lower the bar to exercise migrations.
export function fromSave(
  raw: string,
  migrations: Record<number, Migration> = MIGRATIONS,
  target: number = SAVE_VERSION,
): LoadResult {
  let file: unknown;
  try {
    file = JSON.parse(raw);
  } catch {
    return { ok: false, why: 'not JSON' };
  }
  if (!isObj(file) || file.format !== FORMAT) return { ok: false, why: 'not a Dirtbag save' };
  const v = file.v;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return { ok: false, why: 'no version' };
  if (v > target)
    return { ok: false, why: `written by a newer build (save v${v}, this build reads v${target})` };
  let state: unknown = file.state;
  for (let n = v; n < target; n++) {
    const m = migrations[n];
    if (!m) return { ok: false, why: `no migration from v${n}` };
    try {
      state = m(state);
    } catch (e) {
      return { ok: false, why: `migration from v${n} failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  // The demo's build turns a full game's climber away: its keys are its own, and it has none of
  // the content. The full game playing the demo's rules till it's unlocked (19.1) loads it, and
  // the climber stops at the season's last card, where it can be unlocked (19.4: never a
  // refusal at start-up, which would set a real climber aside).
  if (DEMO_BUILD && fromFullGame(state)) return { ok: false, why: DEMO_END.fullSave };
  const errors = validate(state);
  if (errors.length) return { ok: false, why: `invalid: ${errors.slice(0, 3).join('; ')}` };
  return { ok: true, state: state as GameState, from: v };
}

// ---- validation: every field, its type and its range ----

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isInt = (x: unknown): x is number => isNum(x) && Number.isInteger(x);
const isStrs = (x: unknown): x is string[] => Array.isArray(x) && x.every((e) => typeof e === 'string');
// Phase 31.1: a forebear's life, as the family keeps it.
const isCareer = (c: unknown): boolean =>
  isObj(c) &&
  isStrs(c.sent) &&
  (c.project === null || typeof c.project === 'string') &&
  isInt(c.age) &&
  (c.how === 'chose' || c.how === 'body' || c.how === 'home') &&
  isStrs(c.scars) &&
  isStrs(c.summits) &&
  (c.crew === null || typeof c.crew === 'string') &&
  isNum(c.old) &&
  isInt(c.money) &&
  c.money >= 0;

export function validate(x: unknown): string[] {
  const err: string[] = [];
  const need = (ok: boolean, what: string) => {
    if (!ok) err.push(what);
  };
  if (!isObj(x)) return ['state is not an object'];
  need(typeof x.seed === 'string', 'seed');
  need(isInt(x.day) && x.day >= 1, 'day');
  need(isInt(x.min) && x.min >= 0, 'min');
  need(isInt(x.cash), 'cash');
  need(isNum(x.energy) && x.energy >= 0 && x.energy <= 100, 'energy');
  need(isNum(x.skin) && x.skin >= 0 && x.skin <= 100, 'skin');
  need(isNum(x.fed) && x.fed >= 0 && x.fed <= 100, 'fed');
  need(typeof x.at === 'string' && x.at in PLACES, 'at');
  need(x.x === null || isNum(x.x), 'x');
  need(isStrs(x.today), 'today');
  err.push(...validateClimber(x.climber).map((e) => `climber.${e}`));
  const l = x.load;
  need(
    isObj(l) &&
      isNum(l.acute) &&
      l.acute >= 0 &&
      isNum(l.chronic) &&
      l.chronic >= 0 &&
      isNum(l.today) &&
      l.today >= 0,
    'load',
  );
  const inj = x.injury;
  need(
    inj === null ||
      (isObj(inj) &&
        typeof inj.kind === 'string' &&
        (inj.tier === 1 || inj.tier === 2 || inj.tier === 3) &&
        isInt(inj.until)),
    'injury',
  );
  need(isInt(x.hurt) && x.hurt >= 0, 'hurt');
  need(
    isObj(x.firsts) &&
      Object.values(x.firsts).every(
        (f) =>
          isObj(f) &&
          typeof f.name === 'string' &&
          (f.call === -1 || f.call === 0 || f.call === 1) &&
          isInt(f.day) &&
          (f.by === undefined || typeof f.by === 'string') &&
          (f.for === undefined || (typeof f.for === 'string' && f.for in PEOPLE)) &&
          (f.heard === undefined || (isInt(f.heard) && f.heard >= 0 && f.heard <= SETTLE.repeats)),
      ),
    'firsts',
  );
  const race = x.race;
  need(race === null || (isObj(race) && typeof race.route === 'string' && isInt(race.until)), 'race');
  need(isInt(x.trips) && x.trips >= 0, 'trips');
  need(isInt(x.goals) && x.goals >= 0, 'goals');
  need(isStrs(x.unlocked) && x.unlocked.every((id) => id in PLACES), 'unlocked');
  need(
    isObj(x.gear) &&
      Object.entries(x.gear).every(
        ([id, n]) => id in GEAR && isNum(n) && n >= 0 && (GEAR[id]!.kind !== 'wears' || n <= 100),
      ),
    'gear',
  );
  const tr = x.training;
  need(
    isObj(tr) &&
      typeof tr.phase === 'string' &&
      tr.phase in TRAIN.phases &&
      isInt(tr.since) &&
      tr.since >= 1 &&
      (tr.taper === null || (isInt(tr.taper) && tr.taper >= 1)) &&
      isInt(tr.prehab) &&
      tr.prehab >= 0,
    'training',
  );
  need(isObj(x.jobs) && Object.entries(x.jobs).every(([id, n]) => id in JOBS && isInt(n) && n >= 0), 'jobs');
  need(
    Array.isArray(x.shifts) &&
      x.shifts.every(
        (e) => isObj(e) && typeof e.job === 'string' && e.job in JOBS && isInt(e.day) && e.day >= 1,
      ),
    'shifts',
  );
  const perJob = (o: unknown) =>
    isObj(o) && Object.entries(o).every(([id, n]) => id in JOBS && isInt(n) && n >= 0);
  need(perJob(x.strikes), 'strikes');
  need(perJob(x.struck), 'struck');
  need(perJob(x.benched), 'benched');
  need(
    isObj(x.leave) &&
      Object.entries(x.leave).every(
        ([id, d]) => id in JOBS && Array.isArray(d) && d.every((n) => isInt(n) && n >= 1),
      ),
    'leave',
  );
  const isClient = (c: unknown) =>
    isObj(c) &&
    typeof c.name === 'string' &&
    ['crimp', 'power', 'technical', 'dyno'].includes(c.style as string) &&
    isInt(c.gap) &&
    isInt(c.progress) &&
    isInt(c.tired) &&
    typeof c.scared === 'boolean';
  need(
    x.coach === null ||
      (isObj(x.coach) &&
        Array.isArray(x.coach.clients) &&
        x.coach.clients.every(isClient) &&
        isInt(x.coach.next) &&
        isInt(x.coach.last)),
    'coach',
  );
  need(
    x.haul === null ||
      (isObj(x.haul) &&
        isInt(x.haul.day) &&
        isInt(x.haul.picks) &&
        isInt(x.haul.fatigue) &&
        isInt(x.haul.pay)),
    'haul',
  );
  const rt = x.retainers;
  need(
    isObj(rt) && (rt.physio === null || isInt(rt.physio)) && (rt.coach === null || isInt(rt.coach)),
    'retainers',
  );
  const c = x.comps;
  need(
    isObj(c) &&
      (c.on === null ||
        (isObj(c.on) &&
          isInt(c.on.tier) &&
          isInt(c.on.day) &&
          isInt(c.on.round) &&
          c.on.round >= 0 &&
          isObj(c.on.tops) &&
          Object.values(c.on.tops).every(isInt))) &&
      Array.isArray(c.points) &&
      c.points.every((p) => isObj(p) && isInt(p.day) && isInt(p.pts)) &&
      Array.isArray(c.results) &&
      c.results.every((r) => isObj(r) && isInt(r.tier) && isInt(r.day) && isInt(r.place) && isInt(r.of)) &&
      Array.isArray(c.seasons) &&
      c.seasons.every((x) => isObj(x) && isInt(x.year) && isInt(x.place) && isInt(x.of)),
    'comps',
  );
  const md = x.media;
  const isTask = (t: unknown) =>
    isObj(t) &&
    typeof t.done === 'boolean' &&
    ((t.kind === 'send' && isInt(t.grade)) ||
      (t.kind === 'shoot' && typeof t.place === 'string' && t.place in PLACES) ||
      t.kind === 'comp' ||
      t.kind === 'ad' ||
      t.kind === 'clinic' ||
      (t.kind === 'show' && isInt(t.day)));
  need(
    isObj(md) &&
      isInt(md.followers) &&
      md.followers >= 0 &&
      isNum(md.engagement) &&
      isInt(md.posted) &&
      isInt(md.bait) &&
      (md.sponsor === null ||
        (isObj(md.sponsor) &&
          isInt(md.sponsor.tier) &&
          (md.sponsor.terms === 'real' || md.sponsor.terms === 'brand') &&
          isInt(md.sponsor.due) &&
          isInt(md.sponsor.strikes) &&
          Array.isArray(md.sponsor.tasks) &&
          md.sponsor.tasks.every(isTask))) &&
      (md.offer === null ||
        (isObj(md.offer) &&
          (md.offer.kind === 'doc' || (md.offer.kind === 'sponsor' && isInt(md.offer.tier))))) &&
      (md.heat === null || (isObj(md.heat) && isInt(md.heat.grade) && isInt(md.heat.due))) &&
      (md.doc === null ||
        (isObj(md.doc) &&
          ((isInt(md.doc.grade) && isInt(md.doc.due)) || isInt(md.doc.aired) || isInt(md.doc.shelved)))) &&
      (md.lost === null || isInt(md.lost)) &&
      Array.isArray(md.photos) &&
      md.photos.every(
        (p) =>
          isObj(p) &&
          typeof p.route === 'string' &&
          isInt(p.day) &&
          typeof p.by === 'string' &&
          (p.sold === undefined || isInt(p.sold)),
      ) &&
      (md.piece === null ||
        (isObj(md.piece) &&
          isInt(md.piece.asked) &&
          isInt(md.piece.due) &&
          (md.piece.wrote === undefined || isInt(md.piece.wrote)))) &&
      (md.film === null || (isObj(md.film) && typeof md.film.route === 'string' && isInt(md.film.day))),
    'media',
  );
  const gy = x.gym;
  need(
    gy === null ||
      (isObj(gy) &&
        [gy.since, gy.members, gy.till, gy.last, gy.peak, gy.set].every(isInt) &&
        isNum(gy.quality) &&
        typeof gy.setter === 'boolean' &&
        Array.isArray(gy.upgrades) &&
        gy.upgrades.every((u) => typeof u === 'string' && u in OWN_GYM.upgrades)),
    'gym',
  );
  // Phase 32.3: a wild place's lines too; and its bolted cracks, among them and cracks.
  const wildOrLand = (id: unknown) =>
    typeof id === 'string' &&
    (!!PLACES[ROUTES[id]?.place ?? '']?.land || !!PLACES[ROUTES[id]?.place ?? '']?.wild);
  need(Array.isArray(x.bolted) && x.bolted.every(wildOrLand), 'bolted');
  need(
    Array.isArray(x.boltedCracks) &&
      x.boltedCracks.every(
        (id) =>
          typeof id === 'string' &&
          Array.isArray(x.bolted) &&
          x.bolted.includes(id) &&
          ROUTES[id]?.disc === 'trad' &&
          !!PLACES[ROUTES[id]!.place]?.wild,
      ),
    'boltedCracks',
  );
  const gv = x.giving;
  need(isObj(gv) && [gv.total, gv.food, gv.access].every((n) => isInt(n) && n >= 0), 'giving');
  need(
    isObj(x.guides) &&
      Object.entries(x.guides).every(
        ([id, g]) =>
          !!PLACES[id]?.crag &&
          isObj(g) &&
          isInt(g.pages) &&
          g.pages >= 0 &&
          (g.out === null || isInt(g.out)),
      ),
    'guides',
  );
  const of = x.outfit;
  need(
    of === null ||
      (isObj(of) && [of.since, of.guides, of.till, of.last].every(isInt) && (of.guides as number) >= 1),
    'outfit',
  );
  need(typeof x.lifestyle === 'string' && x.lifestyle in LIFESTYLE, 'lifestyle');
  need(typeof x.spot === 'string' && x.spot in SPOTS, 'spot');
  need(
    isObj(x.pantry) && Object.entries(x.pantry).every(([id, n]) => id in INGREDIENTS && isInt(n) && n >= 0),
    'pantry',
  );
  need(isStrs(x.meals) && x.meals.every((m) => m in MEAL_NAME), 'meals');
  need(isInt(x.fueled) && x.fueled >= 0, 'fueled');
  need(typeof x.insurance === 'string' && x.insurance in PLANS, 'insurance');
  need(isInt(x.jab) && x.jab >= 0, 'jab');
  const MARKS = ['fingers', 'shoulder', 'forearm', 'leg', 'ankle'];
  const STYLES = ['crimp', 'power', 'endurance', 'technical', 'dyno', 'crack'];
  need(isStrs(x.scars) && x.scars.every((m) => MARKS.includes(m)), 'scars');
  const fl = x.flare;
  need(
    fl === null || (isObj(fl) && typeof fl.area === 'string' && MARKS.includes(fl.area) && isInt(fl.until)),
    'flare',
  );
  need(isStrs(x.fear) && x.fear.every((f) => STYLES.includes(f)), 'fear');
  need(isNum(x.supplies) && x.supplies >= 0 && x.supplies <= 100, 'supplies');
  const sk = x.sick;
  need(
    sk === null || (isObj(sk) && ['cold', 'bug', 'toothache'].includes(sk.kind as string) && isInt(sk.until)),
    'sick',
  );
  const ps = x.psyche;
  need(
    isObj(ps) && isInt(ps.level) && ps.level >= 0 && ps.level <= 100 && isInt(ps.stale) && ps.stale >= 0,
    'psyche',
  );
  need(isStrs(x.crags) && x.crags.every((c) => PLACES[c]?.crag), 'crags');
  need(isStrs(x.seen), 'seen');
  need(isNum(x.guitar) && x.guitar >= 0, 'guitar');
  const dk = x.deck;
  need(
    isObj(dk) &&
      isInt(dk.last) &&
      isInt(dk.knock) &&
      isStrs(dk.seen) &&
      isInt(dk.hitch) &&
      isInt(dk.stop) &&
      isStrs(dk.stops) &&
      isObj(dk.met) &&
      isInt(dk.epic) &&
      Object.entries(dk.met).every(([id, i]) => HITCHERS.some((h) => h.id === id) && isInt(i)) &&
      // Phase 35.1: how often each has come.
      isObj(dk.meets) &&
      Object.entries(dk.meets).every(([id, n]) => HITCHERS.some((h) => h.id === id) && isInt(n) && n >= 1) &&
      // Phase 35.3: the knocks owed a return, each one a knock that can have one.
      Array.isArray(dk.back) &&
      dk.back.every(
        (b) =>
          isObj(b) &&
          isInt(b.opt) &&
          isInt(b.day) &&
          (b.done === undefined || b.done === true) &&
          KNOCKS.some((k) => k.id === b.id && (k.helped?.includes(b.opt as number) || k.away?.opt === b.opt)),
      ),
    'deck',
  );
  const en = x.encounter;
  const ids = {
    knock: KNOCKS,
    hitch: HITCHERS,
    stop: STOPS,
    epic: EPICS.map((e) => ({ id: e.kind })),
    wall: WALL_EVENTS,
    stance: Object.keys(STANCES).map((id) => ({ id })),
    echo: Object.keys(ECHOES).map((id) => ({ id })),
    // Phase 35.4: a holiday's scene at the fire, by its season.
    holiday: Object.keys(HOLIDAYS).map((id) => ({ id })),
  } as Record<string, { id: string }[]>;
  const tb = x.table;
  const dice = (d: unknown) => Array.isArray(d) && d.every((v) => isInt(v) && v >= 1 && v <= 6);
  const seat = (i: unknown, t: { seats: unknown[] }) => isInt(i) && i >= 0 && i < t.seats.length;
  const bidOk = (b: unknown, t: { seats: unknown[] }) =>
    isObj(b) && isInt(b.n) && b.n >= 1 && isInt(b.face) && b.face >= 2 && b.face <= 6 && seat(b.by, t);
  need(
    tb === null ||
      (isObj(tb) &&
        Array.isArray(tb.seats) &&
        tb.seats.length >= 2 &&
        tb.seats.every((p) => isObj(p) && typeof p.who === 'string' && dice(p.dice)) &&
        seat(tb.turn, tb as { seats: unknown[] }) &&
        (tb.bid === null || bidOk(tb.bid, tb as { seats: unknown[] })) &&
        Array.isArray(tb.said) &&
        tb.said.every((b) => bidOk(b, tb as { seats: unknown[] })) &&
        isInt(tb.round) &&
        isInt(tb.game) &&
        (tb.shown === null ||
          (isObj(tb.shown) &&
            bidOk(tb.shown, tb as { seats: unknown[] }) &&
            seat(tb.shown.caller, tb as { seats: unknown[] }) &&
            seat(tb.shown.loser, tb as { seats: unknown[] }) &&
            isInt(tb.shown.count) &&
            Array.isArray(tb.shown.cups) &&
            tb.shown.cups.every(dice))) &&
        (tb.over === null || typeof tb.over === 'string')),
    'table',
  );
  const cd = x.cards;
  const cards = (d: unknown) => Array.isArray(d) && d.every((v) => isInt(v) && v >= 0 && v <= 51);
  const bjOk = (h: unknown) =>
    h === null ||
    (isObj(h) &&
      Array.isArray(h.you) &&
      h.you.length >= 1 &&
      h.you.length <= 2 &&
      h.you.every((y) => isObj(y) && cards(y.cards) && isNum(y.bet) && y.bet > 0) &&
      isInt(h.at) &&
      h.at >= 0 &&
      h.at <= h.you.length &&
      cards(h.dealer) &&
      isInt(h.next) &&
      (h.paid === null || (Array.isArray(h.paid) && h.paid.length === h.you.length && h.paid.every(isNum))));
  const seatIn = (i: unknown, h: { seats: unknown[] }) => isInt(i) && i >= 0 && i < h.seats.length;
  const heOk = (h: unknown) =>
    h === null ||
    (isObj(h) &&
      Array.isArray(h.seats) &&
      h.seats.length >= 2 &&
      h.seats.every(
        (p) =>
          isObj(p) &&
          typeof p.who === 'string' &&
          cards(p.hole) &&
          (p.hole as unknown[]).length === 2 &&
          typeof p.in === 'boolean' &&
          isNum(p.put) &&
          isNum(p.total) &&
          typeof p.acted === 'boolean' &&
          typeof p.all === 'boolean',
      ) &&
      cards(h.board) &&
      (h.board as unknown[]).length === 5 &&
      isInt(h.street) &&
      h.street >= 0 &&
      h.street <= 4 &&
      seatIn(h.button, h as { seats: unknown[] }) &&
      seatIn(h.turn, h as { seats: unknown[] }) &&
      isNum(h.bet) &&
      isInt(h.bets) &&
      isNum(h.pot) &&
      Array.isArray(h.said) &&
      h.said.every((m) => isObj(m) && seatIn(m.by, h as { seats: unknown[] }) && typeof m.did === 'string') &&
      (h.won === null ||
        (isObj(h.won) &&
          Array.isArray(h.won.by) &&
          h.won.by.every((i) => seatIn(i, h as { seats: unknown[] })) &&
          isNum(h.won.back) &&
          typeof h.won.shown === 'boolean')));
  need(
    cd === null ||
      (isObj(cd) &&
        (cd.game === 'bj' || cd.game === 'holdem') &&
        typeof cd.who === 'string' &&
        isNum(cd.chips) &&
        isInt(cd.hands) &&
        bjOk(cd.bj) &&
        heOk(cd.he)),
    'cards',
  );
  need(
    isObj(x.reads) && Object.values(x.reads).every((r) => isObj(r) && isInt(r.hands) && isInt(r.caught)),
    'reads',
  );
  const sx = x.sesh;
  const strs = (v: unknown) => Array.isArray(v) && v.every((b) => typeof b === 'string');
  need(
    sx === null ||
      (isObj(sx) &&
        typeof sx.route === 'string' &&
        isInt(sx.day) &&
        Array.isArray(sx.seats) &&
        sx.seats.length >= 1 &&
        sx.seats.every(
          (p) =>
            isObj(p) &&
            typeof p.who === 'string' &&
            isNum(p.grade) &&
            strs(p.knows) &&
            typeof p.sent === 'boolean' &&
            typeof p.shares === 'boolean',
        ) &&
        isObj(sx.falls) &&
        Object.values(sx.falls).every((n) => isInt(n) && n >= 0) &&
        Array.isArray(sx.found) &&
        sx.found.every(
          (f) =>
            isObj(f) &&
            typeof f.beta === 'string' &&
            typeof f.by === 'string' &&
            (f.shared === null || typeof f.shared === 'boolean'),
        ) &&
        (sx.first === null || typeof sx.first === 'string') &&
        isInt(sx.round) &&
        sx.round >= 0 &&
        strs(sx.said)),
    'sesh',
  );
  need(isInt(x.seshFirsts) && x.seshFirsts >= 0, 'seshFirsts');
  const vp = x.vanPlan;
  need(
    isObj(vp) &&
      Object.entries(vp).every(
        ([id, sp]) =>
          PIECES.includes(id) &&
          (sp === null ||
            (isObj(sp) &&
              isInt(sp.x) &&
              sp.x >= 0 &&
              isInt(sp.y) &&
              sp.y >= 0 &&
              (sp.r === 0 || sp.r === 1))),
      ),
    'vanPlan',
  );
  const su = x.setUp;
  need(
    su === null ||
      (isObj(su) &&
        typeof su.id === 'string' &&
        setOf(su.id) !== null &&
        typeof su.name === 'string' &&
        su.name.length > 0 &&
        su.name.length <= SETTING.name.max),
    'setUp',
  );
  const dr = x.dream;
  const DREAMS = ['rig', 'warchest', 'homebase'];
  need(
    isObj(dr) &&
      (dr.pick === null || DREAMS.includes(dr.pick as string)) &&
      isNum(dr.pot) &&
      dr.pot >= 0 &&
      isStrs(dr.owned) &&
      dr.owned.every((o) => DREAMS.includes(o)),
    'dream',
  );
  need(
    Array.isArray(x.dogs) &&
      x.dogs.every((d) => isObj(d) && typeof d.name === 'string' && isInt(d.years) && isInt(d.day)),
    'dogs',
  );
  const tl = isObj(en) ? en.tally : undefined;
  need(
    en === null ||
      (isObj(en) &&
        typeof en.kind === 'string' &&
        (en.kind === 'farewell'
          ? typeof en.id === 'string' && isObj(x.dog)
          : !!ids[en.kind]?.some((k) => k.id === en.id)) &&
        (en.kind !== 'epic' ||
          (isInt(en.stage) &&
            isObj(tl) &&
            ['risk', 'energy', 'fed', 'skin', 'psyche', 'hours'].every((k) => isNum(tl[k]))))),
    'encounter',
  );
  need(isInt(x.lotNights) && x.lotNights >= 0, 'lotNights');
  need(isInt(x.driveway) && x.driveway >= 0, 'driveway');
  const pct = (v: unknown) => isNum(v) && v >= 0 && v <= 100;
  const van = x.van;
  need(
    isObj(van) &&
      ['tires', 'engine', 'battery'].every((k) => pct(van[k])) &&
      isInt(van.miles) &&
      van.miles >= 0 &&
      isInt(van.rebuilt) &&
      van.rebuilt >= 0 &&
      (van.verdict === null || isInt(van.verdict)),
    'van',
  );
  const bd = x.breakdown;
  need(
    bd === null ||
      (isObj(bd) &&
        (bd.part === 'tires' || bd.part === 'engine') &&
        typeof bd.to === 'string' &&
        bd.to in PLACES &&
        isInt(bd.rest) &&
        bd.rest >= 0 &&
        typeof bd.bodged === 'boolean'),
    'breakdown',
  );
  const w = x.wall;
  need(
    w === null || (isObj(w) && typeof w.id === 'string' && w.id in WALLS && isInt(w.next) && w.next >= 0),
    'wall',
  );
  const e = x.expedition;
  need(
    e === null ||
      (isObj(e) &&
        typeof e.id === 'string' &&
        e.id in EXPEDITIONS &&
        isInt(e.day) &&
        e.day >= 1 &&
        isInt(e.pitch) &&
        e.pitch >= 0 &&
        (e.partner === null || (typeof e.partner === 'string' && e.partner in PEOPLE)) &&
        isInt(e.nights) &&
        e.nights >= 0 &&
        isInt(e.food) &&
        e.food >= 0 &&
        typeof e.ledge === 'boolean' &&
        typeof e.stove === 'boolean' &&
        Array.isArray(e.seen) &&
        e.seen.every((v) => typeof v === 'string')),
    'expedition',
  );
  const book = x.book;
  need(
    Array.isArray(book) &&
      book.every(
        (t) =>
          isObj(t) &&
          typeof t.id === 'string' &&
          t.id in EXPEDITIONS &&
          isInt(t.day) &&
          ['summit', 'bail', 'water', 'time'].includes(t.end as string) &&
          isInt(t.high) &&
          t.high >= 0 &&
          (t.partner === null || (typeof t.partner === 'string' && t.partner in PEOPLE)) &&
          isInt(t.nights) &&
          t.nights >= 0 &&
          isStrs(t.seen) &&
          typeof t.told === 'boolean',
      ),
    'book',
  );
  need(
    x.origin === null || (typeof x.origin === 'string' && (x.origin in ORIGINS || x.origin === CAME_ACROSS)),
    'origin',
  );
  const tals = x.talents;
  need(
    isObj(tals) &&
      isStrs(tals.ids) &&
      tals.ids.every((id) => id in TALENTS) &&
      isStrs(tals.known) &&
      tals.known.every((id) => (tals.ids as string[]).includes(id)) &&
      isObj(tals.from) &&
      SKILLS.every((k) => typeof (tals.from as Record<string, unknown>)[k] === 'number'),
    'talents',
  );
  const cl = x.calling;
  need(
    isObj(cl) &&
      (cl.id === null || (typeof cl.id === 'string' && cl.id in CALLINGS)) &&
      isInt(cl.since) &&
      cl.since >= 0 &&
      Array.isArray(cl.rungs) &&
      cl.rungs.every((d) => isInt(d) && d >= 0) &&
      cl.rungs.length <= (cl.id ? CALLINGS[cl.id as string]!.rungs.length : 0) &&
      typeof cl.offered === 'boolean',
    'calling',
  );
  const pt = x.paths;
  need(
    isObj(pt) &&
      isObj(pt.tiers) &&
      Object.entries(pt.tiers).every(
        ([id, n]) => id in PATHS && isInt(n) && n >= 0 && n <= PATHS[id]!.tiers.length,
      ) &&
      isStrs(pt.told),
    'paths',
  );
  need(isStrs(x.mastery) && x.mastery.every((k) => k in MASTERY || k in HYBRIDS), 'mastery');
  need(x.quirk === null || (typeof x.quirk === 'string' && x.quirk in QUIRKS), 'quirk');
  const sc = x.scene;
  need(
    isObj(sc) &&
      isNum(sc.old) &&
      sc.old >= 0 &&
      sc.old <= 100 &&
      isNum(sc.gym) &&
      sc.gym >= 0 &&
      sc.gym <= 100 &&
      Array.isArray(sc.stances) &&
      sc.stances.every(
        (y) =>
          isObj(y) &&
          typeof y.id === 'string' &&
          y.id in STANCES &&
          isInt(y.opt) &&
          y.opt >= 0 &&
          y.opt <= 3 &&
          isInt(y.day),
      ) &&
      Array.isArray(sc.echoes) &&
      sc.echoes.every(
        (y) =>
          isObj(y) &&
          typeof y.id === 'string' &&
          y.id in ECHOES &&
          typeof y.turned === 'boolean' &&
          isInt(y.day),
      ) &&
      isInt(sc.last) &&
      isInt(sc.echoLast),
    'scene',
  );
  const brd = x.board;
  need(
    isObj(brd) &&
      isInt(brd.week) &&
      brd.week >= 0 &&
      Array.isArray(brd.jobs) &&
      brd.jobs.every(
        (j) =>
          isObj(j) &&
          typeof j.id === 'string' &&
          j.id in BOARD_JOBS &&
          isInt(j.grade) &&
          isInt(j.cash) &&
          j.cash >= 0 &&
          isInt(j.parts) &&
          j.parts >= 0 &&
          typeof j.paid === 'boolean',
      ) &&
      isInt(brd.shifts0) &&
      isInt(brd.sessions) &&
      (brd.pick === null ||
        (isObj(brd.pick) &&
          isInt(brd.pick.i) &&
          brd.pick.i >= 0 &&
          brd.pick.i < brd.jobs.length &&
          isInt(brd.pick.base))),
    'board',
  );
  const yr = x.year;
  need(
    isObj(yr) &&
      isInt(yr.recapped) &&
      yr.recapped >= 0 &&
      (yr.home === 'none' || yr.home === 'armed' || (isInt(yr.home) && yr.home >= 0)),
    'year',
  );
  const lf = x.life;
  need(
    isObj(lf) &&
      isInt(lf.held) &&
      lf.held >= 0 &&
      isInt(lf.told) &&
      lf.told >= 0 &&
      (lf.retired === null ||
        (isObj(lf.retired) &&
          isInt(lf.retired.day) &&
          typeof lf.retired.forced === 'boolean' &&
          (lf.retired.home === undefined || typeof lf.retired.home === 'boolean'))),
    'life',
  );
  need(isObj(x.folks) && isInt(x.folks.calls) && x.folks.calls >= 0, 'folks');
  const fm = x.family;
  need(
    fm === null ||
      (isObj(fm) &&
        isInt(fm.gen) &&
        fm.gen >= 2 &&
        typeof fm.forebear === 'string' &&
        Array.isArray(fm.lines) &&
        fm.lines.every((l) => typeof l === 'string') &&
        typeof fm.coach === 'boolean' &&
        (fm.mentee === undefined ||
          (isObj(fm.mentee) && typeof fm.mentee.name === 'string' && isInt(fm.mentee.grade))) &&
        (fm.career === undefined || isCareer(fm.career)) &&
        Array.isArray(fm.books) &&
        fm.books.every(
          (b) =>
            isObj(b) &&
            typeof b.name === 'string' &&
            isObj(b.record) &&
            Object.values(b.record).every((d) => isInt(d)),
        )),
    'family',
  );
  const hw = x.hollow;
  need(
    isObj(hw) &&
      Array.isArray(hw.clues) &&
      hw.clues.every((c) => c === 'old' || c === 'hitch' || c === 'book') &&
      new Set(hw.clues).size === hw.clues.length &&
      isInt(hw.tries) &&
      hw.tries >= 0,
    'hollow',
  );
  const mt = x.mentee;
  need(
    mt === null ||
      (isObj(mt) &&
        typeof mt.name === 'string' &&
        isNum(mt.level) &&
        [mt.sessions, mt.since, mt.last].every(isInt) &&
        Array.isArray(mt.told) &&
        mt.told.every(isInt)),
    'mentee',
  );
  const cw = x.crew;
  need(
    cw === null ||
      (isObj(cw) &&
        typeof cw.a === 'string' &&
        cw.a in PEOPLE &&
        typeof cw.b === 'string' &&
        cw.b in PEOPLE &&
        isInt(cw.day) &&
        ['rift', 'mended', 'set'].includes(cw.stage as string)),
    'crew',
  );
  const cn = x.crewName;
  need(
    cn === null || (isObj(cn) && typeof cn.name === 'string' && cn.name.trim().length >= 2 && isInt(cn.day)),
    'crewName',
  );
  const cp = x.crewProject;
  need(cp === null || (isObj(cp) && typeof cp.route === 'string' && isInt(cp.day)), 'crewProject');
  need(x.crewDay === null || isInt(x.crewDay), 'crewDay');
  need(isInt(x.parts) && (x.parts as number) >= 0, 'parts');
  need(
    Array.isArray(x.crewSends) &&
      x.crewSends.every(
        (c) =>
          isObj(c) &&
          typeof c.route === 'string' &&
          isInt(c.day) &&
          Array.isArray(c.train) &&
          c.train.every((w) => typeof w === 'string' && w in PEOPLE),
      ),
    'crewSends',
  );
  const tm = x.team;
  need(
    tm === null ||
      (isObj(tm) &&
        typeof tm.id === 'string' &&
        tm.id in EXPEDITIONS &&
        Array.isArray(tm.names) &&
        tm.names.length === 2 &&
        tm.names.every((n) => typeof n === 'string') &&
        [tm.left, tm.back].every(isInt) &&
        isNum(tm.odds)),
    'team',
  );
  need(
    Array.isArray(x.teams) &&
      x.teams.every(
        (t) =>
          isObj(t) &&
          typeof t.id === 'string' &&
          t.id in EXPEDITIONS &&
          isInt(t.day) &&
          typeof t.summit === 'boolean' &&
          isInt(t.high),
      ),
    'teams',
  );
  const ro = x.romance;
  need(
    ro === null ||
      (isObj(ro) &&
        typeof ro.who === 'string' &&
        ro.who in PEOPLE &&
        isInt(ro.stage) &&
        ro.stage >= 1 &&
        isInt(ro.since) &&
        isInt(ro.beatDay) &&
        optInt(ro.over)),
    'romance',
  );
  const hb = x.habits;
  need(
    isObj(hb) &&
      ['goes', 'outdoor', 'fresh', 'tired', 'evening', 'dawn', 'easy', 'power'].every(
        (k) => isInt(hb[k]) && (hb[k] as number) >= 0,
      ),
    'habits',
  );
  const rec = x.record;
  need(isObj(rec) && Object.entries(rec).every(([k, v]) => !!recordById(k) && isInt(v) && v >= 0), 'record');
  const bk = x.booked;
  need(
    bk === null ||
      (isObj(bk) &&
        typeof bk.id === 'string' &&
        bk.id in EXPEDITIONS &&
        isInt(bk.day) &&
        (bk.partner === null || (typeof bk.partner === 'string' && bk.partner in PEOPLE)) &&
        isInt(bk.food) &&
        bk.food >= 0 &&
        typeof bk.ledge === 'boolean' &&
        typeof bk.stove === 'boolean'),
    'booked',
  );
  const sp = x.speed;
  need(
    isObj(sp) &&
      (sp.pb === null || (isNum(sp.pb) && sp.pb > 0)) &&
      isInt(sp.runs) &&
      sp.runs >= 0 &&
      isInt(sp.day),
    'speed',
  );
  need(x.mode === 'rope' || x.mode === 'solo', 'mode');
  need(x.soloing === null || (typeof x.soloing === 'string' && x.soloing in ROUTES), 'soloing');
  const dd = x.dead;
  need(dd === null || (isObj(dd) && typeof dd.route === 'string' && isInt(dd.day) && isNum(dd.hi)), 'dead');
  const dog = x.dog;
  need(
    dog === null ||
      (isObj(dog) && typeof dog.name === 'string' && isInt(dog.since) && pct(dog.fed) && pct(dog.bond)),
    'dog',
  );
  if (!isObj(x.people)) err.push('people');
  else for (const [id, p] of Object.entries(x.people)) need(isPerson(p), `people.${id}`);
  if (!isObj(x.routes)) err.push('routes');
  else
    for (const [id, r] of Object.entries(x.routes))
      err.push(...validateRoute(r).map((e) => `routes.${id}.${e}`));
  if (!Array.isArray(x.log)) err.push('log');
  else x.log.forEach((l, i) => need(isLogLine(l), `log[${i}]`));
  return err;
}

function validateClimber(x: unknown): string[] {
  if (!isObj(x)) return ['not an object'];
  const err: string[] = [];
  if (typeof x.name !== 'string') err.push('name');
  if (typeof x.start !== 'string' || !(x.start in STARTS || x.start === CARRIED)) err.push('start');
  const k = x.skills;
  if (!isObj(k)) err.push('skills');
  else
    for (const id of ['power', 'fingers', 'endurance', 'technique', 'head'])
      if (!isNum(k[id]) || (k[id] as number) < 0) err.push(`skills.${id}`);
  return err;
}

const optInt = (x: unknown) => x === undefined || isInt(x);
const isPerson = (x: unknown): x is PersonLog =>
  isObj(x) &&
  isInt(x.bond) &&
  x.bond >= 0 &&
  isInt(x.last) &&
  x.last >= 0 &&
  optInt(x.since) &&
  optInt(x.arc) &&
  optInt(x.beatDay) &&
  optInt(x.away) &&
  (x.ahead === undefined || typeof x.ahead === 'boolean') &&
  (x.talked === undefined || typeof x.talked === 'boolean') &&
  optInt(x.life) &&
  (x.sparked === undefined || typeof x.sparked === 'boolean') &&
  optInt(x.gave) &&
  optInt(x.heard) &&
  optInt(x.ledge) &&
  (x.avoid === undefined || (typeof x.avoid === 'string' && x.avoid in PEOPLE)) &&
  optInt(x.owed) &&
  optInt(x.favour) &&
  (x.lent === undefined || (isObj(x.lent) && isInt(x.lent.cash) && isInt(x.lent.due))) &&
  (x.invite === undefined ||
    (isObj(x.invite) &&
      isInt(x.invite.day) &&
      typeof x.invite.place === 'string' &&
      x.invite.place in PLACES &&
      isInt(x.invite.from)));

function validateRoute(x: unknown): string[] {
  if (!isObj(x)) return ['not an object'];
  const err: string[] = [];
  const need = (ok: boolean, what: string) => {
    if (!ok) err.push(what);
  };
  const r = x as Partial<Record<keyof RouteLog, unknown>>;
  need(isStrs(r.known), 'known');
  need(isStrs(r.told), 'told');
  need(isObj(r.pick) && Object.values(r.pick).every((v) => typeof v === 'string'), 'pick');
  need(isObj(r.falls) && Object.values(r.falls).every((v) => isInt(v) && v >= 0), 'falls');
  need(isInt(r.goes) && r.goes >= 0, 'goes');
  need(isInt(r.goesToday) && r.goesToday >= 0, 'goesToday');
  need(isNum(r.hi) && r.hi >= 0, 'hi');
  need(r.ghost === undefined || isPace(r.ghost), 'ghost');
  need(r.sent === null || isSend(r.sent), 'sent');
  need(typeof r.sentToday === 'boolean', 'sentToday');
  return err;
}

// Phase 38: a go's pace, [t, pos, …] from its first move to where it came off. Time only runs
// forward.
const isPace = (x: unknown): boolean =>
  Array.isArray(x) &&
  x.length >= 4 &&
  x.length % 2 === 0 &&
  x.every((v, i) => isNum(v) && v >= 0 && (i % 2 === 1 || i === 0 || v >= (x[i - 2] as number)));

function isSend(x: unknown): x is SendRecord {
  return (
    isObj(x) &&
    isInt(x.day) &&
    isInt(x.go) &&
    (x.style === 'onsight' || x.style === 'flash' || x.style === 'redpoint') &&
    (x.called === undefined || x.called === true)
  );
}

function isLogLine(x: unknown): x is LogLine {
  return isObj(x) && isInt(x.day) && isInt(x.min) && typeof x.text === 'string';
}
