// People and what they say. A conversation picks its opening node from `start` (the first
// entry whose condition holds), then follows the options. Options can cost time, teach
// beta, set a daily flag, run an act, or add a line; `next` continues the conversation.
// Text may use {goes} (goes today, all routes) with {goes|go|goes} for the plural.

import type { Cond } from '../cond';
import type { Delta } from '../types';

export interface TalkFx {
  cost?: Delta;
  learn?: string; // "route/beta", learned by being told
  today?: string;
  act?: string;
  line?: string;
}

export interface TalkOpt {
  label: string;
  primary?: boolean;
  when?: Cond;
  fx?: TalkFx;
  next?: string;
}

export interface TalkNode {
  text: string;
  opts: TalkOpt[];
}

export interface TalkDef {
  who: string;
  start: { when?: Cond; node: string }[];
  nodes: Record<string, TalkNode>;
}

export const PEOPLE: Record<string, { name: string }> = {
  hazel: { name: 'Hazel' },
};

const SIT: TalkOpt[] = [
  { label: 'Sit a while', primary: true, fx: { act: 'lot.sit' } },
  { label: 'Not tonight' },
];

export const TALK: Record<string, TalkDef> = {
  'hazel-lot': {
    who: 'hazel',
    start: [
      { when: { night: true, sentToday: 'pump' }, node: 'night-sent' },
      { when: { night: true, wentToday: 'pump' }, node: 'night-goes' },
      { when: { night: true }, node: 'night' },
      { when: { knows: 'pump/B2' }, node: 'known' },
      { node: 'morning' },
    ],
    nodes: {
      'night-sent': { text: 'You sent it. Now you need a new one.', opts: SIT },
      'night-goes': { text: "{goes} {goes|go|goes} today. How's the skin?", opts: SIT },
      night: { text: "Fire's warm. Sit.", opts: SIT },
      known: { text: "Heel on the lip. Trust the pinch. That's all I've got.", opts: [{ label: 'Thanks' }] },
      morning: {
        text: "You're staring at The Pump again. I can tell from here.",
        opts: [
          { label: 'Ask about the roof', primary: true, fx: { learn: 'pump/B2' }, next: 'roof' },
          {
            label: 'Just coffee',
            when: { notToday: 'coffee' },
            fx: { cost: { min: 10, energy: 5 }, today: 'coffee' },
            next: 'coffee',
          },
          { label: 'Just coffee', when: { today: 'coffee' }, next: 'no-coffee' },
        ],
      },
      roof: {
        text: 'Everyone throws right at the roof. Everyone comes off right at the roof. Hook your left heel on the lip and cross to the pinch.',
        opts: [{ label: 'Got it', primary: true, fx: { line: 'New beta: heel-hook the lip.' } }],
      },
      coffee: { text: "She pours you half a cup. It's mostly grounds.", opts: [{ label: 'Thanks' }] },
      'no-coffee': { text: "Pot's empty. You had the good half.", opts: [{ label: 'Fair' }] },
    },
  },
  'hazel-crag': {
    who: 'hazel',
    start: [
      { when: { sentToday: 'pump' }, node: 'sent' },
      { when: { wentToday: 'pump' }, node: 'goes' },
      { node: 'start' },
    ],
    nodes: {
      sent: { text: "That's the one. Lower off, I'm hungry.", opts: [{ label: 'OK' }] },
      goes: { text: 'Clean catch. Rest up, go again.', opts: [{ label: 'OK' }] },
      start: { text: "Rope's flaked. Go look at it.", opts: [{ label: 'OK' }] },
    },
  },
};

// Things you can look at. `night` falls back to `day`; `nightAct` runs an act instead.
export const THINGS: Record<string, { day: string; night?: string; nightAct?: string }> = {
  scout: { day: 'Scout thumps his tail twice and goes back to sleep.' },
  'hazel-van': { day: "Hazel's van. Curtains still shut.", night: "Hazel's van. The lantern's on." },
  fire: { day: 'Coals and a coffee pot. Hazel got up first.', nightAct: 'lot.sit' },
};
