// Phase 25.6: the crew's texts back, as data. v0.956 had two or three each, turned in order
// by the day; these are walked by the seed, so the same one doesn't come back every few days.

// Why they're not out, in their own words.
export const BUSY: Record<string, string[]> = {
  hazel: [
    'Van day. The starter again. Don’t ask.',
    'Laundromat, then the library, then a nap I’ve earned.',
    'My sister’s calling at noon and she talks for three hours. Tomorrow.',
    'Fingers are cooked. I’m reading in the hammock and you can’t stop me.',
    'Fixing the awning. If you bring coffee I’ll let you hold the ladder.',
    'Rest day. A real one. I’m not even looking at the weather.',
  ],
  sage: [
    'Guiding clients all day. If I see one more figure eight tied wrong I’m moving to the city.',
    'Resting. My tips are shiny. Ask me tomorrow.',
    'Writing up beta for a route I haven’t even sent yet. It’s a sickness.',
    'Gym shift. Somebody has to tell the kids not to campus in sandals.',
    'Driving my cousin to the airport. Four hours each way. Pray for me.',
    'Hangboard and stretching. Glamorous. Don’t come.',
  ],
  mara: [
    'Working a double. Thursday?',
    'I’m going out with people who’ll actually push me today. No offense.',
    'On the board till six. Come watch if you want to feel bad.',
    'Physio. She says my shoulder is "interesting". That’s never good.',
    'Not today. I’m angry at my project and I need a day to get over it.',
    'Taping and filing. My skin’s a crime scene.',
  ],
  rico: [
    'Bro I’m SO sore. Tomorrow I’m a machine again.',
    'Helping my uncle move a couch up four floors. Pray for my forearms.',
    'Filming a send for my channel. Eleven views and climbing.',
    'Doing pull-ups in the garage and eating a whole rotisserie chicken. Living.',
    'Can’t, rest day, my phone says I’m overtrained, and the phone knows.',
    'New shoes. Breaking them in on the couch. It takes commitment.',
  ],
  tam: [
    'Not today. The knee says no, and I listen to it now.',
    'Taking the grandkids fishing. They’ll catch nothing and love it.',
    'Re-reading an old guidebook. Half these routes have new names now.',
    'Rest. At my age the rest days are the training.',
    'Fixing the porch. The rock will wait. It has so far.',
    'Writing letters. Nobody does that anymore. I do.',
  ],
};

// Off on a stint (lives.ts) or their arc's time away, hurt or travelling.
export const AWAY_TEXT = {
  hurt: [
    'Still hurt. Icing it and feeling sorry for myself. Go climb for me.',
    'Doctor says another couple of weeks. I say one. We’ll see who wins.',
    'Can’t grip a coffee cup yet. Tell me what you sent.',
  ],
  away: [
    'Out of town. Send me photos so I can be jealous.',
    'On the road. The rock here is weird and I love it.',
    'Away a while yet. Keep my spot at the fire warm.',
  ],
};

// Fallen out with someone in the crew (Phase 25.6), and still smarting.
export const SULK_TEXT = ['Busy.', 'Not this week.', 'I’ll let you know.'];

// Out today: where and when, said briefly.
export const OUT_TEXT = '{place}, {from} till {till}. You coming?';
export const LATE_TEXT = '{place} tomorrow from {from}. Get some sleep.';
