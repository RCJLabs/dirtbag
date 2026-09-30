// Food, as data (Phase 22.3): what the market sells, and what the camp kitchen makes of it.
// Numbers are [proposed]. Ramen and the diner stay where they were; a recipe needs the
// kitchen (UPGRADE.kitchen) and its ingredients in the pantry.

export interface Ingredient {
  name: string;
  // A pack at the market: its price, and the servings in it.
  price: number;
  servings: number;
}

export const INGREDIENTS: Record<string, Ingredient> = {
  oats: { name: 'Oats', price: 4, servings: 4 },
  rice: { name: 'Rice', price: 4, servings: 4 },
  beans: { name: 'Beans', price: 4, servings: 4 },
  tortillas: { name: 'Tortillas', price: 4, servings: 4 },
  eggs: { name: 'Eggs', price: 6, servings: 4 },
  cheese: { name: 'Cheese', price: 6, servings: 4 },
  pasta: { name: 'Pasta', price: 4, servings: 4 },
  greens: { name: 'Greens', price: 6, servings: 4 },
};

export interface Recipe {
  name: string;
  // A serving of each.
  uses: string[];
  min: number;
  fed: number;
  energy?: number;
  skin?: number;
  // Fuels you: every window wider for the rest of the day (FOOD.fueled).
  fuels?: true;
  says: string;
}

export const RECIPES: Record<string, Recipe> = {
  oatmeal: {
    name: 'Oatmeal',
    uses: ['oats'],
    min: 15,
    fed: 30,
    energy: 4,
    says: 'Oats, water, a pinch of salt. It sticks to your ribs and the pot.',
  },
  ricebeans: {
    name: 'Rice and beans',
    uses: ['rice', 'beans'],
    min: 30,
    fed: 45,
    says: 'Rice and beans. Half the valley runs on it.',
  },
  burritos: {
    name: 'Breakfast burritos',
    uses: ['tortillas', 'eggs', 'cheese'],
    min: 30,
    fed: 50,
    fuels: true,
    says: 'Eggs and cheese in a warm tortilla. You eat two standing up.',
  },
  pasta: {
    name: 'Pasta and greens',
    uses: ['pasta', 'greens'],
    min: 40,
    fed: 45,
    skin: 3,
    fuels: true,
    says: 'Pasta with the greens wilted in. It tastes like a decision.',
  },
};

// The meals the variety count knows by name, beyond the recipes.
export const MEAL_NAME: Record<string, string> = {
  ramen: 'ramen',
  diner: 'the special',
  // Phase 22.5a: the hustle's meals.
  bins: 'what the bins had',
  forage: 'what the shore had',
  ...Object.fromEntries(Object.entries(RECIPES).map(([id, r]) => [id, r.name.toLowerCase()])),
};
