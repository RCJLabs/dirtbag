// The words (Phase 22.9c): v0.956's trivia, turned into the glossary it always was. Its
// technique, gear and culture questions are here as entries, with the words the rebuild
// leans on that it never asked about; its history questions aren't (facts about real people
// belong somewhere they can be checked). Grouped as the journal shows them, in order.

export type WordGroup = 'wall' | 'went' | 'kit' | 'grades' | 'life';

export const WORD_GROUP: Record<WordGroup, string> = {
  wall: 'On the wall',
  went: 'How it went',
  kit: 'Kit',
  grades: 'Grades',
  life: 'The life',
};

export interface Word {
  term: string;
  group: WordGroup;
  says: string;
}

export const WORDS: Word[] = [
  // On the wall: holds, moves, and the parts of a line.
  {
    term: 'Jug',
    group: 'wall',
    says: 'A big hold you can wrap your whole hand around. Where you rest, and shake out, and think.',
  },
  {
    term: 'Crimp',
    group: 'wall',
    says: 'A small edge held on the fingertips. Hard on tendons, and the reason fingers is its own skill.',
  },
  {
    term: 'Sloper',
    group: 'wall',
    says: 'A rounded hold with no edge, held by friction and open hands. Worse in the heat.',
  },
  { term: 'Pinch', group: 'wall', says: 'A hold squeezed between thumb and fingers.' },
  { term: 'Pocket', group: 'wall', says: 'A hole in the rock that takes one, two or three fingers.' },
  {
    term: 'Undercling',
    group: 'wall',
    says: 'A hold pulled upward from beneath, with your feet pushing against it.',
  },
  {
    term: 'Smear',
    group: 'wall',
    says: 'A foot pressed onto bare rock with no edge to stand on, trusting the rubber.',
  },
  {
    term: 'Heel hook',
    group: 'wall',
    says: 'Your heel hooked over a hold and pulled with the hamstring, like a third hand.',
  },
  {
    term: 'Toe hook',
    group: 'wall',
    says: 'The top of your toe hooked under a hold to keep your body on a steep wall.',
  },
  {
    term: 'Drop knee',
    group: 'wall',
    says: 'A knee turned in and down, which brings your hip to the wall and frees a hand to reach.',
  },
  {
    term: 'Deadpoint',
    group: 'wall',
    says: 'Catching a hold at the top of a move, in the instant you weigh nothing.',
  },
  {
    term: 'Dyno',
    group: 'wall',
    says: 'A jump for a hold, everything off the wall for a moment. Timing more than strength.',
  },
  {
    term: 'Mantle',
    group: 'wall',
    says: 'Pressing down on a ledge until you can get a foot up onto it. The way over most boulder tops.',
  },
  {
    term: 'Crux',
    group: 'wall',
    says: 'The hardest move or section of a line. Most lines have one; the mean ones have two.',
  },
  { term: 'Lip', group: 'wall', says: 'The edge where a steep wall or roof turns to the top.' },
  {
    term: 'Highball',
    group: 'wall',
    says: 'A boulder tall enough that falling off the top is a real fall. More pads, more spotters.',
  },
  {
    term: 'Pump',
    group: 'wall',
    says: 'Forearms filled tight and useless from holding on too long. It goes if you rest; it ends your go if you don’t.',
  },
  // How it went: send styles, and what climbers call a go.
  {
    term: 'Send',
    group: 'went',
    says: 'Climbing a line from the bottom to the top without falling or weighting the rope.',
  },
  {
    term: 'Onsight',
    group: 'went',
    says: 'A send on the first go, with no beta: nobody told you, and you never watched it done.',
  },
  { term: 'Flash', group: 'went', says: 'A send on the first go, with beta: you were told, or you watched.' },
  {
    term: 'Redpoint',
    group: 'went',
    says: 'A send after you’ve tried it before. Most hard sends are redpoints. The word is German, from Kurt Albert’s red dots.',
  },
  { term: 'Project', group: 'went', says: 'A line you keep coming back to and haven’t sent yet.' },
  {
    term: 'Beta',
    group: 'went',
    says: 'How a line goes: which holds, which hand, where your feet are. Asked for, watched, or learned by falling.',
  },
  { term: 'Go', group: 'went', says: 'One try at a line, from the ground.' },
  {
    term: 'First ascent',
    group: 'went',
    says: 'The first send of a line anyone’s done. FA, for short. Whoever does it names it.',
  },
  {
    term: 'Send train',
    group: 'went',
    says: 'Everyone at the crag sending the same line in a row once someone shows how it goes.',
  },
  // Kit.
  { term: 'Chalk', group: 'kit', says: 'Magnesium carbonate, for drying sweaty hands so they grip.' },
  {
    term: 'Crash pad',
    group: 'kit',
    says: 'A thick foam mat carried to the boulder and put down where you’ll land.',
  },
  {
    term: 'Quickdraw',
    group: 'kit',
    says: 'Two carabiners joined by a sling: one to the bolt, one to the rope.',
  },
  {
    term: 'Bolt',
    group: 'kit',
    says: 'A metal hanger drilled into the rock, which a sport line clips for protection.',
  },
  {
    term: 'Belay device',
    group: 'kit',
    says: 'What the belayer feeds the rope through, and what locks it when you fall.',
  },
  {
    term: 'Cam',
    group: 'kit',
    says: 'A spring-loaded piece that expands against the sides of a crack. Short for camming device.',
  },
  {
    term: 'Nut',
    group: 'kit',
    says: 'A metal wedge slotted into a narrowing crack. Also a stopper. Cheap, light, and fiddly to place.',
  },
  {
    term: 'Rack',
    group: 'kit',
    says: 'The cams, nuts and slings you carry up a trad line. What you place is what catches you.',
  },
  {
    term: 'Sticky rubber',
    group: 'kit',
    says: 'The soft rubber climbing shoes are soled with since the 1980s. It wears, and worn rubber slips.',
  },
  // Grades.
  {
    term: 'V-scale',
    group: 'grades',
    says: 'The grades boulders get in North America, from V0 up. Each one is a lot harder than the last.',
  },
  {
    term: 'YDS',
    group: 'grades',
    says: 'The Yosemite Decimal System, which grades roped climbs like 5.10a. The 5 means it’s climbing.',
  },
  {
    term: 'Sandbag',
    group: 'grades',
    says: 'A line graded easier than it is. Usually by the person who put it up.',
  },
  {
    term: 'Soft',
    group: 'grades',
    says: 'A line easier than its grade. Nobody says this about their own sends.',
  },
  // The life.
  {
    term: 'Dirtbag',
    group: 'life',
    says: 'Someone who lives cheap, out of a van or a tent, so the days go to climbing.',
  },
  { term: 'Crag', group: 'life', says: 'A climbing area outdoors.' },
  {
    term: 'Trad',
    group: 'life',
    says: 'Traditional climbing: you place your own protection as you go, and take it out after.',
  },
  {
    term: 'Sport',
    group: 'life',
    says: 'Climbing on lines with bolts already in the rock. You clip them as you go.',
  },
  { term: 'Spray', group: 'life', says: 'Beta nobody asked for. Also, talking about your own sends.' },
  {
    term: 'Rest day',
    group: 'life',
    says: 'A day you don’t climb, so your fingers and skin come back. Harder than it sounds.',
  },
];
