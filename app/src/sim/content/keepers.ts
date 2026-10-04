// Phase 25.6: the shops' small talk, as data: what you find going on at each one in town,
// the place's own line among them. Some only when they'd be true (rain, an injury, the
// season, a worn tire). v0.956 had three or four a keeper, seen about once a week each.

import type { Cond } from '../cond';

export interface KeeperLine {
  text: string;
  when?: Cond;
}

export const KEEPERS: Record<string, KeeperLine[]> = {
  diner: [
    { text: 'Old Town. Otis is reading the paper. There’s a HELP WANTED sign by the register.' },
    { text: 'The waitress tops up your coffee before you’ve asked and calls you hon. Everyone’s hon.' },
    {
      text: 'Otis is doing the crossword in pen and wants a six-letter word for stubborn. Otis looks at you.',
    },
    {
      text: 'The cook leans out of the hatch. "You the climber? My nephew climbs. He fell off a roof once." He seems proud of both.',
    },
    { text: 'The pie case is empty but for one slice of rhubarb nobody trusts.' },
    {
      text: 'Otis asks if you’ve fallen off anything good lately. Otis asks every time, and likes the answer every time.',
    },
    { text: 'The jukebox has played the same song four times. Nobody’s owning up to it.' },
    {
      text: 'Rain on the windows, and every booth full of climbers pretending they aren’t checking the forecast.',
      when: { sky: 'rain' },
    },
    {
      text: 'Otis looks at your taped hand and slides the ketchup over so you don’t have to reach.',
      when: { injured: true },
    },
    {
      text: 'The heaters are on and the windows have fogged. The cook has chili going, which is a kindness.',
      when: { season: 'winter' },
    },
  ],
  shop: [
    { text: 'A bell on the door. Two guys by the cams, arguing about a route neither’s done.' },
    { text: 'The guy at the register is resoling a pair of shoes older than you, and humming.' },
    {
      text: 'Someone’s trying on shoes two sizes too small and saying they feel great. They don’t look great.',
    },
    { text: 'A sign on the chalk bin, in marker: ONE BAG PER CUSTOMER. WE SEE YOU, RICO.' },
    {
      text: 'The guy at the register asks what you’re projecting and nods like he’s sent it. He hasn’t, and you both know.',
    },
    { text: 'The used rack has a rope with a core shot and a tag that says AS IS. Somebody will buy it.' },
    {
      text: 'A guidebook on the counter, open to a page where somebody has written NO in the margin, twice.',
    },
    {
      text: 'He sees the tape and points you at the finger splints without a word. Solidarity.',
      when: { injured: true },
    },
    {
      text: 'A rain day: the shop is full of climbers touching things they won’t buy.',
      when: { sky: 'rain' },
    },
  ],
  cafe: [
    { text: 'Midtown. Wren is on the bar.' },
    { text: 'Wren draws a leaf in somebody’s latte and frowns at it like it owes money.' },
    { text: 'Wren asks if you want the usual. You didn’t know you had one. Apparently you do.' },
    { text: 'Wren has a new playlist and calls it jazz. It’s mostly a saxophone arguing with itself.' },
    { text: 'A man with a laptop has nursed one cortado since nine. Wren is counting.' },
    { text: 'Wren slides a day-old muffin across the counter. "On the house. It was going to the birds."' },
    { text: 'The steamer screams. Wren doesn’t flinch. Wren never flinches.' },
    {
      text: 'Rain on the windows, the line out the door, and Wren unbothered in the middle of it.',
      when: { sky: 'rain' },
    },
  ],
  market: [
    { text: 'Crates of greens out front, and a cashier who’s seen your van.' },
    {
      text: 'The cashier rings up your beans and asks if you’ll ever buy a vegetable. You buy an onion. It counts.',
    },
    {
      text: 'Somebody’s kid is crying in the cereal aisle. Somebody’s kid is always crying in the cereal aisle.',
    },
    { text: 'The bruised fruit is half price. You and the bruised fruit understand each other.' },
    { text: 'A notice by the door: LOST, ORANGE CAT, ANSWERS TO NOTHING.' },
    { text: 'The cashier has started bagging your groceries the dirtbag way: one bag, the bread on top.' },
    { text: 'Free cheese samples at the deli. You go round twice. Nobody stops you.' },
    {
      text: 'Soup cans stacked by the door, and a sign in marker: IT’S COLD, WE KNOW.',
      when: { season: 'winter' },
    },
  ],
  garage: [
    { text: 'A radio on a shelf, a calendar from 2019, and Dale under somebody’s truck.' },
    {
      text: 'Dale wipes off a wrench and asks how the van’s running. Dale already knows. Dale can hear it from here.',
    },
    { text: 'A ball game on the radio, and Dale losing money on it, by the face.' },
    { text: 'A sign over the bench: WE FIX ANYTHING. A smaller one under it: MOSTLY.' },
    { text: 'A dog asleep on a stack of tires, and by the dust, it has been for years.' },
    {
      text: 'Dale tells you about a van that did four hundred thousand miles. It’s a story about hope, Dale says.',
    },
    { text: 'A car up on the lift with its wheels off, and Dale eating a sandwich under it.' },
    {
      text: 'Dale kicks your front tire on the way past and makes a noise. Not a good noise.',
      when: { worn: 'tires' },
    },
  ],
  clinic: [
    { text: 'A waiting room full of runners, and a poster of the knee nobody reads.' },
    { text: 'The receptionist knows your name now. It’s not the kind of regular you wanted to be.' },
    {
      text: 'A runner in the corner ices a knee and reads a magazine about running. No lessons have been learned.',
    },
    { text: 'A poster says LISTEN TO YOUR BODY. Your body is saying a lot of things.' },
    { text: 'The doctor walks past, sees your forearms, and sighs like she’s read the chart already.' },
    { text: 'One fish in the tank in the waiting room. It looks like it’s had a long season too.' },
    {
      text: 'The receptionist looks at your hand and moves you up the list, which is how you know it looks bad.',
      when: { injured: true },
    },
  ],
};
