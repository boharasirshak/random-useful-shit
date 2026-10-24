// Menu data. Generated from apps/web-prototype/calorie-calculator/script.js (FOODS), then owned here.
// Chick-fil-A: chick-fil-a.com (official) where readable, else MyFoodDiary.
// Panda: pandaexpress.com/nutritioninformation (official, Oct 2026). Base = 12 oz.
// Sodium (mg): Chick-fil-A official. Panda's site blocks scripts, so its sodium is from pandaexpressmenus.com
// (matches the official chart), scaled by calories to these portions; Quinoa Fried Rice uses Fried Rice's.
// Macros: official per item. Other sizes are scaled by calories from the official one (nuggets 12 ct, strips 4 ct,
// fries S/L); drinks are all sugar, so carbs = kcal / 4.
// ids are stable: logs store ids, so rename `name` freely but never change an `id`.

export type Restaurant = 'cfa' | 'panda' | 'shake' | 'custom';
export type Category = 'entree' | 'base' | 'side' | 'appetizer' | 'drink' | 'sauce' | 'shake' | 'custom';
export type MenuItem = {
  id: string;
  restaurant: Restaurant;
  name: string;
  kcal: number | null; // null = user-set (protein shake)
  category: Category;
  image?: string; // path under assets/menu/
  p?: number; c?: number; f?: number; // protein, carbs, fat in grams (not set for the shake: you set that)
  na?: number; // sodium, mg
};

export const MENU: MenuItem[] = [
  { id: 'cfa-chicken-sandwich', restaurant: 'cfa', name: "Chicken Sandwich", kcal: 420, category: 'entree', image: 'chick-fil-a/sandwich.png', p: 29, c: 41, f: 16, na: 1470 },
  { id: 'cfa-spicy-chicken-sandwich', restaurant: 'cfa', name: "Spicy Chicken Sandwich", kcal: 450, category: 'entree', image: 'chick-fil-a/spicy-sandwich.png', p: 28, c: 44, f: 18, na: 1740 },
  { id: 'cfa-deluxe-sandwich', restaurant: 'cfa', name: "Deluxe Sandwich", kcal: 490, category: 'entree', image: 'chick-fil-a/deluxe.png', p: 32, c: 43, f: 21, na: 1710 },
  { id: 'cfa-spicy-deluxe-sandwich', restaurant: 'cfa', name: "Spicy Deluxe Sandwich", kcal: 540, category: 'entree', image: 'chick-fil-a/spicy-deluxe.png', p: 34, c: 46, f: 24, na: 1890 },
  { id: 'cfa-grilled-chicken-sandwich', restaurant: 'cfa', name: "Grilled Chicken Sandwich", kcal: 390, category: 'entree', image: 'chick-fil-a/grilled-sandwich.png', p: 28, c: 45, f: 11, na: 765 },
  { id: 'cfa-grilled-chicken-club', restaurant: 'cfa', name: "Grilled Chicken Club", kcal: 520, category: 'entree', image: 'chick-fil-a/grilled-club.png', p: 37, c: 45, f: 22, na: 1055 },
  { id: 'cfa-nuggets-8-ct', restaurant: 'cfa', name: "Nuggets (8 ct)", kcal: 250, category: 'entree', image: 'chick-fil-a/nuggets.png', p: 27, c: 11, f: 11, na: 1210 },
  { id: 'cfa-nuggets-12-ct', restaurant: 'cfa', name: "Nuggets (12 ct)", kcal: 380, category: 'entree', image: 'chick-fil-a/nuggets.png', p: 40.5, c: 16.5, f: 16.5, na: 1820 },
  { id: 'cfa-grilled-nuggets-8-ct', restaurant: 'cfa', name: "Grilled Nuggets (8 ct)", kcal: 130, category: 'entree', image: 'chick-fil-a/grilled-nuggets.png', p: 25, c: 1, f: 3, na: 440 },
  { id: 'cfa-grilled-nuggets-12-ct', restaurant: 'cfa', name: "Grilled Nuggets (12 ct)", kcal: 200, category: 'entree', image: 'chick-fil-a/grilled-nuggets.png', p: 37.5, c: 1.5, f: 4.5, na: 660 },
  { id: 'cfa-chick-n-strips-3-ct', restaurant: 'cfa', name: "Chick-n-Strips (3 ct)", kcal: 310, category: 'entree', image: 'chick-fil-a/strips.png', p: 29, c: 16, f: 14, na: 870 },
  { id: 'cfa-chick-n-strips-4-ct', restaurant: 'cfa', name: "Chick-n-Strips (4 ct)", kcal: 410, category: 'entree', image: 'chick-fil-a/strips.png', p: 38.5, c: 21, f: 18.5, na: 1150 },
  { id: 'cfa-grilled-cool-wrap-no-dressing', restaurant: 'cfa', name: "Grilled Cool Wrap (no dressing)", kcal: 350, category: 'entree', image: 'chick-fil-a/cool-wrap.png', p: 42, c: 29, f: 13, na: 750 },
  { id: 'cfa-waffle-fries-s', restaurant: 'cfa', name: "Waffle Fries (S)", kcal: 320, category: 'side', image: 'chick-fil-a/waffle-fries.png', p: 4, c: 34, f: 18, na: 190 },
  { id: 'cfa-waffle-fries-m', restaurant: 'cfa', name: "Waffle Fries (M)", kcal: 420, category: 'side', image: 'chick-fil-a/waffle-fries.png', p: 5, c: 45, f: 24, na: 240 },
  { id: 'cfa-waffle-fries-l', restaurant: 'cfa', name: "Waffle Fries (L)", kcal: 600, category: 'side', image: 'chick-fil-a/waffle-fries.png', p: 7, c: 64, f: 34, na: 340 },
  { id: 'cfa-mac-and-cheese-m', restaurant: 'cfa', name: "Mac & Cheese (M)", kcal: 450, category: 'side', image: 'chick-fil-a/mac-cheese.png', p: 20, c: 28, f: 29, na: 1190 },
  { id: 'cfa-kale-crunch-side', restaurant: 'cfa', name: "Kale Crunch Side", kcal: 170, category: 'side', image: 'chick-fil-a/kale-crunch.png', p: 4, c: 13, f: 12, na: 250 },
  { id: 'cfa-fruit-cup-m', restaurant: 'cfa', name: "Fruit Cup (M)", kcal: 70, category: 'side', image: 'chick-fil-a/fruit-cup.png', p: 1, c: 16, f: 0, na: 0 },
  { id: 'cfa-chick-fil-a-sauce', restaurant: 'cfa', name: "Chick-fil-A Sauce", kcal: 140, category: 'sauce', image: 'chick-fil-a/cfa-sauce.png', p: 0, c: 6, f: 13, na: 170 },
  { id: 'cfa-polynesian-sauce', restaurant: 'cfa', name: "Polynesian Sauce", kcal: 110, category: 'sauce', image: 'chick-fil-a/polynesian.png', p: 0, c: 14, f: 6, na: 210 },
  { id: 'cfa-garden-herb-ranch-sauce', restaurant: 'cfa', name: "Garden Herb Ranch Sauce", kcal: 140, category: 'sauce', image: 'chick-fil-a/garden-herb-ranch.png', p: 0, c: 1, f: 11, na: 170 },
  { id: 'cfa-sweet-tea-m', restaurant: 'cfa', name: "Sweet Tea (M)", kcal: 120, category: 'drink', image: 'chick-fil-a/sweet-tea.png', p: 0, c: 31, f: 0, na: 0 },
  { id: 'cfa-unsweet-tea-m', restaurant: 'cfa', name: "Unsweet Tea (M)", kcal: 0, category: 'drink', image: 'chick-fil-a/sweet-tea.png', p: 0, c: 0, f: 0, na: 0 },
  { id: 'cfa-lemonade-m', restaurant: 'cfa', name: "Lemonade (M)", kcal: 220, category: 'drink', image: 'chick-fil-a/lemonade.png', p: 0, c: 55, f: 0, na: 0 },
  { id: 'cfa-diet-lemonade-m', restaurant: 'cfa', name: "Diet Lemonade (M)", kcal: 50, category: 'drink', image: 'chick-fil-a/lemonade.png', p: 0, c: 12.5, f: 0, na: 10 },
  { id: 'cfa-bottled-water', restaurant: 'cfa', name: "Bottled Water", kcal: 0, category: 'drink', image: 'chick-fil-a/water.png', p: 0, c: 0, f: 0, na: 0 },
  { id: 'panda-orange-chicken', restaurant: 'panda', name: "Orange Chicken", kcal: 560, category: 'entree', image: 'panda-express/the-original-orange-chicken.png', p: 19, c: 63, f: 25, na: 900 },
  { id: 'panda-black-pepper-chicken', restaurant: 'panda', name: "Black Pepper Chicken", kcal: 200, category: 'entree', image: 'panda-express/black-pepper-chicken.png', p: 15, c: 9, f: 12, na: 810 },
  { id: 'panda-kung-pao-chicken', restaurant: 'panda', name: "Kung Pao Chicken", kcal: 270, category: 'entree', image: 'panda-express/kung-pao-chicken.png', p: 20, c: 16, f: 14, na: 820 },
  { id: 'panda-grilled-teriyaki-chicken', restaurant: 'panda', name: "Grilled Teriyaki Chicken", kcal: 280, category: 'entree', image: 'panda-express/grilled-teriyaki-chicken.png', p: 38, c: 13, f: 9, na: 640 },
  { id: 'panda-mushroom-chicken', restaurant: 'panda', name: "Mushroom Chicken", kcal: 180, category: 'entree', image: 'panda-express/mushroom-chicken.png', p: 13, c: 12, f: 9, na: 690 },
  { id: 'panda-honey-sesame-chicken-breast', restaurant: 'panda', name: "Honey Sesame Chicken Breast", kcal: 420, category: 'entree', image: 'panda-express/honey-sesame-chicken-breast.png', p: 16, c: 44, f: 20, na: 560 },
  { id: 'panda-string-bean-chicken-breast', restaurant: 'panda', name: "String Bean Chicken Breast", kcal: 210, category: 'entree', image: 'panda-express/string-bean-chicken-breast.png', p: 15, c: 15, f: 10, na: 590 },
  { id: 'panda-sweetfire-chicken-breast', restaurant: 'panda', name: "SweetFire Chicken Breast", kcal: 360, category: 'entree', image: 'panda-express/sweetfire-chicken-breast.png', p: 15, c: 40, f: 15, na: 300 },
  { id: 'panda-beijing-beef', restaurant: 'panda', name: "Beijing Beef", kcal: 480, category: 'entree', image: 'panda-express/beijing-beef.png', p: 14, c: 46, f: 27, na: 670 },
  { id: 'panda-broccoli-beef', restaurant: 'panda', name: "Broccoli Beef", kcal: 190, category: 'entree', image: 'panda-express/broccoli-beef.png', p: 17, c: 14, f: 7, na: 660 },
  { id: 'panda-black-pepper-sirloin-steak', restaurant: 'panda', name: "Black Pepper Sirloin Steak", kcal: 200, category: 'entree', image: 'panda-express/black-pepper-sirloin-steak.png', p: 17, c: 15, f: 8, na: 670 },
  { id: 'panda-honey-walnut-shrimp', restaurant: 'panda', name: "Honey Walnut Shrimp", kcal: 340, category: 'entree', image: 'panda-express/honey-walnut-shrimp.png', p: 13, c: 28, f: 20, na: 350 },
  { id: 'panda-eggplant-tofu', restaurant: 'panda', name: "Eggplant Tofu", kcal: 310, category: 'entree', p: 8, c: 23, f: 21, na: 470 },
  { id: 'panda-super-greens-entree', restaurant: 'panda', name: "Super Greens (entree)", kcal: 45, category: 'entree', image: 'panda-express/super-greens.png', p: 3, c: 5, f: 2, na: 300 },
  { id: 'panda-chow-mein', restaurant: 'panda', name: "Chow Mein", kcal: 520, category: 'base', image: 'panda-express/chow-mein.png', p: 14, c: 89, f: 12, na: 750 },
  { id: 'panda-fried-rice', restaurant: 'panda', name: "Fried Rice", kcal: 610, category: 'base', image: 'panda-express/fried-rice.png', p: 15, c: 109, f: 13, na: 840 },
  { id: 'panda-white-steamed-rice', restaurant: 'panda', name: "White Steamed Rice", kcal: 570, category: 'base', image: 'panda-express/white-steamed-rice.png', p: 11, c: 129, f: 0, na: 0 },
  { id: 'panda-quinoa-fried-rice', restaurant: 'panda', name: "Quinoa Fried Rice", kcal: 600, category: 'base', p: 15, c: 91, f: 19, na: 820 },
  { id: 'panda-super-greens', restaurant: 'panda', name: "Super Greens", kcal: 180, category: 'base', image: 'panda-express/super-greens.png', p: 8, c: 17, f: 9, na: 780 },
  { id: 'panda-chicken-egg-roll', restaurant: 'panda', name: "Chicken Egg Roll", kcal: 200, category: 'appetizer', image: 'panda-express/chicken-egg-roll.png', p: 6, c: 20, f: 10, na: 390 },
  { id: 'panda-chicken-potstickers-3', restaurant: 'panda', name: "Chicken Potstickers (3)", kcal: 160, category: 'appetizer', p: 6, c: 20, f: 6, na: 250 },
  { id: 'panda-cream-cheese-rangoon-3', restaurant: 'panda', name: "Cream Cheese Rangoon (3)", kcal: 190, category: 'appetizer', image: 'panda-express/cream-cheese-rangoon.png', p: 5, c: 24, f: 8, na: 180 },
  { id: 'panda-veggie-spring-roll-2', restaurant: 'panda', name: "Veggie Spring Roll (2)", kcal: 240, category: 'appetizer', image: 'panda-express/veggie-spring-roll.png', p: 4, c: 24, f: 14, na: 440 },
  { id: 'panda-hot-and-sour-soup-cup', restaurant: 'panda', name: "Hot & Sour Soup (cup)", kcal: 140, category: 'appetizer', p: 9, c: 16, f: 4, na: 1030 },
  { id: 'panda-hot-and-sour-soup-bowl', restaurant: 'panda', name: "Hot & Sour Soup (bowl)", kcal: 170, category: 'appetizer', p: 10, c: 20, f: 6, na: 1260 },
  { id: 'shake', restaurant: 'shake', name: "Protein Shake", kcal: null, category: 'shake' },
  // Any amount: 1 kcal (or 1 g) each, and the part's qty is the amount (e.g. qty 350 = 350 kcal).
  { id: 'custom', restaurant: 'custom', name: "Custom", kcal: 1, category: 'custom' },
  { id: 'custom-p', restaurant: 'custom', name: "Protein", kcal: 0, category: 'custom', p: 1 },
  { id: 'custom-c', restaurant: 'custom', name: "Carbs", kcal: 0, category: 'custom', c: 1 },
  { id: 'custom-f', restaurant: 'custom', name: "Fat", kcal: 0, category: 'custom', f: 1 },
];

export const RESTAURANTS: Record<Restaurant, string> = { cfa: 'Chick-fil-A', panda: 'Panda Express', shake: 'Protein shake', custom: 'Custom calories' };

// How each place sells a meal: slots filled in order, plus optional add-ons.
export type Order = { slots: Category[]; extras?: Category } | null;
export const ORDERS: Partial<Record<Restaurant, Record<string, Order>>> = {
  cfa: { 'À la carte': null, Meal: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } },
  panda: {
    'À la carte': null,
    Bowl: { slots: ['base', 'entree'] },
    Plate: { slots: ['base', 'entree', 'entree'] },
    'Bigger Plate': { slots: ['base', 'entree', 'entree', 'entree'] },
  },
};

export const byId = Object.fromEntries(MENU.map(m => [m.id, m])) as Record<string, MenuItem>;
