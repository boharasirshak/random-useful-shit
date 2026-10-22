// Menu data. Generated from apps/web-prototype/calorie-calculator/script.js (FOODS), then owned here.
// Chick-fil-A: chick-fil-a.com (official) where readable, else MyFoodDiary.
// Panda: pandaexpress.com/nutritioninformation (official, Oct 2026). Base = 12 oz.
// ids are stable: logs store ids, so rename `name` freely but never change an `id`.

export type Restaurant = 'cfa' | 'panda' | 'shake';
export type Category = 'entree' | 'base' | 'side' | 'appetizer' | 'drink' | 'sauce' | 'shake';
export type MenuItem = {
  id: string;
  restaurant: Restaurant;
  name: string;
  kcal: number | null; // null = user-set (protein shake)
  category: Category;
  image?: string; // path under assets/menu/
};

export const MENU: MenuItem[] = [
  { id: 'cfa-chicken-sandwich', restaurant: 'cfa', name: "Chicken Sandwich", kcal: 420, category: 'entree', image: 'chick-fil-a/sandwich.png' },
  { id: 'cfa-spicy-chicken-sandwich', restaurant: 'cfa', name: "Spicy Chicken Sandwich", kcal: 450, category: 'entree', image: 'chick-fil-a/spicy-sandwich.png' },
  { id: 'cfa-deluxe-sandwich', restaurant: 'cfa', name: "Deluxe Sandwich", kcal: 490, category: 'entree', image: 'chick-fil-a/deluxe.png' },
  { id: 'cfa-spicy-deluxe-sandwich', restaurant: 'cfa', name: "Spicy Deluxe Sandwich", kcal: 540, category: 'entree', image: 'chick-fil-a/spicy-deluxe.png' },
  { id: 'cfa-grilled-chicken-sandwich', restaurant: 'cfa', name: "Grilled Chicken Sandwich", kcal: 390, category: 'entree', image: 'chick-fil-a/grilled-sandwich.png' },
  { id: 'cfa-grilled-chicken-club', restaurant: 'cfa', name: "Grilled Chicken Club", kcal: 520, category: 'entree', image: 'chick-fil-a/grilled-club.png' },
  { id: 'cfa-nuggets-8-ct', restaurant: 'cfa', name: "Nuggets (8 ct)", kcal: 250, category: 'entree', image: 'chick-fil-a/nuggets.png' },
  { id: 'cfa-nuggets-12-ct', restaurant: 'cfa', name: "Nuggets (12 ct)", kcal: 380, category: 'entree', image: 'chick-fil-a/nuggets.png' },
  { id: 'cfa-grilled-nuggets-8-ct', restaurant: 'cfa', name: "Grilled Nuggets (8 ct)", kcal: 130, category: 'entree', image: 'chick-fil-a/grilled-nuggets.png' },
  { id: 'cfa-grilled-nuggets-12-ct', restaurant: 'cfa', name: "Grilled Nuggets (12 ct)", kcal: 200, category: 'entree', image: 'chick-fil-a/grilled-nuggets.png' },
  { id: 'cfa-chick-n-strips-3-ct', restaurant: 'cfa', name: "Chick-n-Strips (3 ct)", kcal: 310, category: 'entree', image: 'chick-fil-a/strips.png' },
  { id: 'cfa-chick-n-strips-4-ct', restaurant: 'cfa', name: "Chick-n-Strips (4 ct)", kcal: 410, category: 'entree', image: 'chick-fil-a/strips.png' },
  { id: 'cfa-grilled-cool-wrap-no-dressing', restaurant: 'cfa', name: "Grilled Cool Wrap (no dressing)", kcal: 350, category: 'entree', image: 'chick-fil-a/cool-wrap.png' },
  { id: 'cfa-waffle-fries-s', restaurant: 'cfa', name: "Waffle Fries (S)", kcal: 320, category: 'side', image: 'chick-fil-a/waffle-fries.png' },
  { id: 'cfa-waffle-fries-m', restaurant: 'cfa', name: "Waffle Fries (M)", kcal: 420, category: 'side', image: 'chick-fil-a/waffle-fries.png' },
  { id: 'cfa-waffle-fries-l', restaurant: 'cfa', name: "Waffle Fries (L)", kcal: 600, category: 'side', image: 'chick-fil-a/waffle-fries.png' },
  { id: 'cfa-mac-and-cheese-m', restaurant: 'cfa', name: "Mac & Cheese (M)", kcal: 450, category: 'side', image: 'chick-fil-a/mac-cheese.png' },
  { id: 'cfa-kale-crunch-side', restaurant: 'cfa', name: "Kale Crunch Side", kcal: 120, category: 'side', image: 'chick-fil-a/kale-crunch.png' },
  { id: 'cfa-fruit-cup-m', restaurant: 'cfa', name: "Fruit Cup (M)", kcal: 70, category: 'side', image: 'chick-fil-a/fruit-cup.png' },
  { id: 'cfa-chick-fil-a-sauce', restaurant: 'cfa', name: "Chick-fil-A Sauce", kcal: 140, category: 'sauce', image: 'chick-fil-a/cfa-sauce.png' },
  { id: 'cfa-polynesian-sauce', restaurant: 'cfa', name: "Polynesian Sauce", kcal: 110, category: 'sauce', image: 'chick-fil-a/polynesian.png' },
  { id: 'cfa-garden-herb-ranch-sauce', restaurant: 'cfa', name: "Garden Herb Ranch Sauce", kcal: 140, category: 'sauce', image: 'chick-fil-a/garden-herb-ranch.png' },
  { id: 'cfa-sweet-tea-m', restaurant: 'cfa', name: "Sweet Tea (M)", kcal: 120, category: 'drink', image: 'chick-fil-a/sweet-tea.png' },
  { id: 'cfa-unsweet-tea-m', restaurant: 'cfa', name: "Unsweet Tea (M)", kcal: 0, category: 'drink', image: 'chick-fil-a/sweet-tea.png' },
  { id: 'cfa-lemonade-m', restaurant: 'cfa', name: "Lemonade (M)", kcal: 220, category: 'drink', image: 'chick-fil-a/lemonade.png' },
  { id: 'cfa-diet-lemonade-m', restaurant: 'cfa', name: "Diet Lemonade (M)", kcal: 50, category: 'drink', image: 'chick-fil-a/lemonade.png' },
  { id: 'cfa-bottled-water', restaurant: 'cfa', name: "Bottled Water", kcal: 0, category: 'drink', image: 'chick-fil-a/water.png' },
  { id: 'panda-orange-chicken', restaurant: 'panda', name: "Orange Chicken", kcal: 560, category: 'entree', image: 'panda-express/the-original-orange-chicken.png' },
  { id: 'panda-black-pepper-chicken', restaurant: 'panda', name: "Black Pepper Chicken", kcal: 200, category: 'entree', image: 'panda-express/black-pepper-chicken.png' },
  { id: 'panda-kung-pao-chicken', restaurant: 'panda', name: "Kung Pao Chicken", kcal: 270, category: 'entree', image: 'panda-express/kung-pao-chicken.png' },
  { id: 'panda-grilled-teriyaki-chicken', restaurant: 'panda', name: "Grilled Teriyaki Chicken", kcal: 280, category: 'entree', image: 'panda-express/grilled-teriyaki-chicken.png' },
  { id: 'panda-mushroom-chicken', restaurant: 'panda', name: "Mushroom Chicken", kcal: 180, category: 'entree', image: 'panda-express/mushroom-chicken.png' },
  { id: 'panda-honey-sesame-chicken-breast', restaurant: 'panda', name: "Honey Sesame Chicken Breast", kcal: 420, category: 'entree', image: 'panda-express/honey-sesame-chicken-breast.png' },
  { id: 'panda-string-bean-chicken-breast', restaurant: 'panda', name: "String Bean Chicken Breast", kcal: 210, category: 'entree', image: 'panda-express/string-bean-chicken-breast.png' },
  { id: 'panda-sweetfire-chicken-breast', restaurant: 'panda', name: "SweetFire Chicken Breast", kcal: 360, category: 'entree', image: 'panda-express/sweetfire-chicken-breast.png' },
  { id: 'panda-beijing-beef', restaurant: 'panda', name: "Beijing Beef", kcal: 480, category: 'entree', image: 'panda-express/beijing-beef.png' },
  { id: 'panda-broccoli-beef', restaurant: 'panda', name: "Broccoli Beef", kcal: 190, category: 'entree', image: 'panda-express/broccoli-beef.png' },
  { id: 'panda-black-pepper-sirloin-steak', restaurant: 'panda', name: "Black Pepper Sirloin Steak", kcal: 200, category: 'entree', image: 'panda-express/black-pepper-sirloin-steak.png' },
  { id: 'panda-honey-walnut-shrimp', restaurant: 'panda', name: "Honey Walnut Shrimp", kcal: 340, category: 'entree', image: 'panda-express/honey-walnut-shrimp.png' },
  { id: 'panda-eggplant-tofu', restaurant: 'panda', name: "Eggplant Tofu", kcal: 310, category: 'entree' },
  { id: 'panda-super-greens-entree', restaurant: 'panda', name: "Super Greens (entree)", kcal: 45, category: 'entree', image: 'panda-express/super-greens.png' },
  { id: 'panda-chow-mein', restaurant: 'panda', name: "Chow Mein", kcal: 520, category: 'base', image: 'panda-express/chow-mein.png' },
  { id: 'panda-fried-rice', restaurant: 'panda', name: "Fried Rice", kcal: 610, category: 'base', image: 'panda-express/fried-rice.png' },
  { id: 'panda-white-steamed-rice', restaurant: 'panda', name: "White Steamed Rice", kcal: 570, category: 'base', image: 'panda-express/white-steamed-rice.png' },
  { id: 'panda-quinoa-fried-rice', restaurant: 'panda', name: "Quinoa Fried Rice", kcal: 600, category: 'base' },
  { id: 'panda-super-greens', restaurant: 'panda', name: "Super Greens", kcal: 180, category: 'base', image: 'panda-express/super-greens.png' },
  { id: 'panda-chicken-egg-roll', restaurant: 'panda', name: "Chicken Egg Roll", kcal: 200, category: 'appetizer', image: 'panda-express/chicken-egg-roll.png' },
  { id: 'panda-chicken-potstickers-3', restaurant: 'panda', name: "Chicken Potstickers (3)", kcal: 160, category: 'appetizer' },
  { id: 'panda-cream-cheese-rangoon-3', restaurant: 'panda', name: "Cream Cheese Rangoon (3)", kcal: 190, category: 'appetizer', image: 'panda-express/cream-cheese-rangoon.png' },
  { id: 'panda-veggie-spring-roll-2', restaurant: 'panda', name: "Veggie Spring Roll (2)", kcal: 240, category: 'appetizer', image: 'panda-express/veggie-spring-roll.png' },
  { id: 'panda-hot-and-sour-soup-cup', restaurant: 'panda', name: "Hot & Sour Soup (cup)", kcal: 140, category: 'appetizer' },
  { id: 'panda-hot-and-sour-soup-bowl', restaurant: 'panda', name: "Hot & Sour Soup (bowl)", kcal: 170, category: 'appetizer' },
  { id: 'shake', restaurant: 'shake', name: "Protein Shake", kcal: null, category: 'shake' },
];

export const RESTAURANTS: Record<Restaurant, string> = { cfa: 'Chick-fil-A', panda: 'Panda Express', shake: 'Protein shake' };

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
