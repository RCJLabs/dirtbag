// Phase 42: what they say once you've lowered them off. `clean` names your line and the beta
// they tell you on it, `none` is a clean belay with nothing on your line left to tell, and
// `hard` follows a hard catch. Anyone without lines of their own gets `BELAY_ANY`.
export interface BelaySays {
  clean: string;
  none: string;
  hard: string;
}

export const BELAY_SAYS: Record<string, BelaySays> = {
  hazel: {
    clean: 'Hazel, back on the ground: “Soft as you like. Now, {line}: {beta}. Nobody watches feet like me.”',
    none: 'Hazel, back on the ground: “Soft as you like. I’d tell you something about {line}, but you know it all.”',
    hard: 'Hazel rubs her hip. “That one I felt in my teeth. Watch the slack.”',
  },
  sage: {
    clean: 'Sage unties, already thinking. “Good catch. I’ve watched your goes on {line}: {beta}. Try it.”',
    none: 'Sage unties. “Good catch. There’s nothing on {line} I can tell you that you don’t know.”',
    hard: 'Sage, a little pale: “That was a hard one. Let’s both forget it happened.”',
  },
  mara: {
    clean: 'Mara pulls the rope through. “Fine catch. {line}: {beta}. You’re welcome.”',
    none: 'Mara pulls the rope through. “Fine catch.” From Mara, that’s a medal.',
    hard: 'Mara glares down from the wall. “Again, and I find someone else.”',
  },
  tam: {
    clean: 'Tam, lowering off: “Lovely. Ruth used to catch like that. On {line}: {beta}.”',
    none: 'Tam, lowering off: “Lovely catch. I’d give you something for {line}, but you’ve got it all.”',
    hard: 'Tam, quietly: “Bit sharp, that one. No harm done.”',
  },
};

export const BELAY_ANY: BelaySays = {
  clean: '{name}, back on the ground: “Good catch. {line}: {beta}.”',
  none: '{name}, back on the ground: “Good catch.”',
  hard: '{name} rubs a hip. “That was a hard one.”',
};
