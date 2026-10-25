// USDA FoodData Central: unbranded staples (chicken thigh, rice, eggs, milk) in the portion a person actually logs.
// Bulk JSON (SR Legacy for ingredients, FNDDS survey foods for mixed dishes like "pizza slice") is downloaded once into
// cache/usda/. Each STAPLE is one FDC id plus the portion weight taken from USDA's foodPortions; numbers are per 100 g
// in the dump and scaled here. Look an id up at https://fdc.nal.usda.gov/food-details/<fdcId>/nutrients
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, item, save } from '../lib.mjs';

const DIR = join(ROOT, 'cache', 'usda');
const BASE = 'https://fdc.nal.usda.gov/fdc-datasets/';
const DATASETS = [
  ['FoodData_Central_sr_legacy_food_json_2018-04.zip', 'FoodData_Central_sr_legacy_food_json_2018-04.json', 'SRLegacyFoods'],
  ['FoodData_Central_survey_food_json_2024-10-31.zip', 'surveyDownload.json', 'SurveyFoods'],
];
const NUTRIENT = { kcal: 1008, p: 1003, c: 1005, f: 1004, na: 1093 };

// { name, fdcId | description (exact USDA text), grams, serving, category }. Add a line to add a food.
const STAPLES = [
  // meat & fish
  { name: 'Rotisserie chicken breast', fdcId: 171123, grams: 85, serving: '3 oz (85 g)', category: 'meat' },
  { name: 'Rotisserie chicken thigh', fdcId: 171120, grams: 89, serving: '1 thigh (89 g)', category: 'meat' },
  { name: 'Rotisserie chicken, shredded', fdcId: 171123, grams: 140, serving: '1 cup (140 g)', category: 'meat' },
  { name: 'Chicken breast, cooked', fdcId: 171477, grams: 172, serving: '1 breast (172 g)', category: 'meat' },
  { name: 'Chicken breast, cooked (100 g)', fdcId: 171477, grams: 100, serving: '100 g', category: 'meat' },
  { name: 'Chicken breast, grilled', fdcId: 171534, grams: 85, serving: '3 oz (85 g)', category: 'meat' },
  { name: 'Chicken thigh, cooked (skinless)', fdcId: 172388, grams: 116, serving: '1 thigh (116 g)', category: 'meat' },
  { name: 'Chicken thigh, roasted (with skin)', fdcId: 173625, grams: 137, serving: '1 thigh (137 g)', category: 'meat' },
  { name: 'Chicken drumstick, roasted', fdcId: 173612, grams: 105, serving: '1 drumstick (105 g)', category: 'meat' },
  { name: 'Chicken wings, roasted', fdcId: 173630, grams: 85, serving: '3 oz (85 g)', category: 'meat' },
  { name: 'Fried chicken', fdcId: 2705949, grams: 85, serving: '1 piece (85 g)', category: 'meat' },
  { name: 'Ground chicken, cooked', fdcId: 171117, grams: 113, serving: '4 oz (113 g)', category: 'meat' },
  { name: 'Ground beef 80/20, cooked', fdcId: 171799, grams: 113, serving: '4 oz (113 g)', category: 'meat' },
  { name: 'Ground beef 90/10, cooked', fdcId: 171794, grams: 113, serving: '4 oz (113 g)', category: 'meat' },
  { name: 'Beef burger patty 80/20', fdcId: 171797, grams: 85, serving: '1 patty (85 g cooked)', category: 'meat' },
  { name: 'Sirloin steak', fdcId: 168727, grams: 227, serving: '8 oz (227 g)', category: 'meat' },
  { name: 'Ribeye steak', fdcId: 169557, grams: 227, serving: '8 oz (227 g)', category: 'meat' },
  { name: 'Pork chop', fdcId: 167827, grams: 157, serving: '1 chop (157 g)', category: 'meat' },
  { name: 'Pork tenderloin, roasted', fdcId: 168250, grams: 113, serving: '4 oz (113 g)', category: 'meat' },
  { name: 'Pulled pork (pork shoulder, roasted)', fdcId: 167844, grams: 85, serving: '3 oz (85 g)', category: 'meat' },
  { name: 'Bacon', fdcId: 168322, grams: 23, serving: '2 slices (23 g)', category: 'meat' },
  { name: 'Breakfast sausage links', fdcId: 174578, grams: 46, serving: '2 links (46 g)', category: 'meat' },
  { name: 'Breakfast sausage patty', fdcId: 174578, grams: 27, serving: '1 patty (27 g)', category: 'meat' },
  { name: 'Italian sausage', fdcId: 174586, grams: 87, serving: '1 link (87 g)', category: 'meat' },
  { name: 'Hot dog (no bun)', fdcId: 2706166, grams: 57, serving: '1 hot dog (57 g)', category: 'meat' },
  { name: 'Deli ham', fdcId: 173863, grams: 56, serving: '2 oz (56 g)', category: 'meat' },
  { name: 'Deli turkey breast', fdcId: 172941, grams: 56, serving: '2 oz (56 g)', category: 'meat' },
  { name: 'Turkey breast, roasted', fdcId: 171492, grams: 85, serving: '3 oz (85 g)', category: 'meat' },
  { name: 'Ground turkey, cooked', fdcId: 171506, grams: 113, serving: '4 oz (113 g)', category: 'meat' },
  { name: 'Salmon, cooked', fdcId: 175168, grams: 170, serving: '6 oz (170 g)', category: 'meat' },
  { name: 'Tuna, canned in water', fdcId: 173709, grams: 165, serving: '1 can, drained (165 g)', category: 'meat' },
  { name: 'Shrimp, cooked', fdcId: 171971, grams: 85, serving: '3 oz (85 g)', category: 'meat' },
  { name: 'Tilapia, cooked', fdcId: 175177, grams: 87, serving: '1 fillet (87 g)', category: 'meat' },

  // eggs & dairy
  { name: 'Egg, large', fdcId: 171287, grams: 50, serving: '1 large egg (50 g)', category: 'dairy' },
  { name: 'Scrambled eggs', fdcId: 172187, grams: 122, serving: '2 large eggs (122 g)', category: 'dairy' },
  { name: 'Fried egg', fdcId: 173423, grams: 46, serving: '1 large egg (46 g)', category: 'dairy' },
  { name: 'Hard-boiled egg', fdcId: 173424, grams: 50, serving: '1 large egg (50 g)', category: 'dairy' },
  { name: 'Egg whites', fdcId: 172183, grams: 99, serving: '3 large egg whites (99 g)', category: 'dairy' },
  { name: 'Whole milk', fdcId: 171265, grams: 244, serving: '1 cup (244 g)', category: 'dairy' },
  { name: '2% milk', fdcId: 171267, grams: 244, serving: '1 cup (244 g)', category: 'dairy' },
  { name: '1% milk', fdcId: 170872, grams: 244, serving: '1 cup (244 g)', category: 'dairy' },
  { name: 'Skim milk', fdcId: 171269, grams: 245, serving: '1 cup (245 g)', category: 'dairy' },
  { name: 'Chocolate milk (2%)', fdcId: 170880, grams: 250, serving: '1 cup (250 g)', category: 'dairy' },
  { name: 'Almond milk, unsweetened', fdcId: 174832, grams: 240, serving: '1 cup (240 g)', category: 'dairy' },
  { name: 'Soy milk', fdcId: 172456, grams: 243, serving: '1 cup (243 g)', category: 'dairy' },
  { name: 'Greek yogurt, plain nonfat', fdcId: 170894, grams: 245, serving: '1 cup (245 g)', category: 'dairy' },
  { name: 'Greek yogurt, plain low fat', fdcId: 170903, grams: 245, serving: '1 cup (245 g)', category: 'dairy' },
  { name: 'Greek yogurt, vanilla', fdcId: 170902, grams: 150, serving: '1 container (150 g)', category: 'dairy' },
  { name: 'Greek yogurt, strawberry', fdcId: 170901, grams: 150, serving: '1 container (150 g)', category: 'dairy' },
  { name: 'Yogurt, plain whole milk', fdcId: 171284, grams: 245, serving: '1 cup (245 g)', category: 'dairy' },
  { name: 'Yogurt, fruit low fat', fdcId: 170889, grams: 170, serving: '1 container (170 g)', category: 'dairy' },
  { name: 'Cheddar cheese', fdcId: 173414, grams: 28, serving: '1 oz (28 g)', category: 'dairy' },
  { name: 'Shredded cheddar', fdcId: 173414, grams: 28, serving: '1/4 cup (28 g)', category: 'dairy' },
  { name: 'Mozzarella cheese', fdcId: 171244, grams: 28, serving: '1 oz (28 g)', category: 'dairy' },
  { name: 'String cheese', fdcId: 170847, grams: 28, serving: '1 stick (28 g)', category: 'dairy' },
  { name: 'American cheese slice', fdcId: 170853, grams: 21, serving: '1 slice (21 g)', category: 'dairy' },
  { name: 'Swiss cheese', fdcId: 171251, grams: 28, serving: '1 slice (28 g)', category: 'dairy' },
  { name: 'Parmesan, grated', fdcId: 171247, grams: 5, serving: '1 tbsp (5 g)', category: 'dairy' },
  { name: 'Feta cheese', fdcId: 173420, grams: 28, serving: '1 oz (28 g)', category: 'dairy' },
  { name: 'Cream cheese', fdcId: 173418, grams: 29, serving: '2 tbsp (29 g)', category: 'dairy' },
  { name: 'Cottage cheese (2%)', fdcId: 172182, grams: 226, serving: '1 cup (226 g)', category: 'dairy' },
  { name: 'Butter', fdcId: 173410, grams: 14, serving: '1 tbsp (14 g)', category: 'dairy' },
  { name: 'Half and half', fdcId: 171255, grams: 30, serving: '2 tbsp (30 g)', category: 'dairy' },
  { name: 'Sour cream', fdcId: 171257, grams: 24, serving: '2 tbsp (24 g)', category: 'dairy' },
  { name: 'Coffee creamer', fdcId: 2705600, grams: 15, serving: '1 tbsp (15 g)', category: 'dairy' },

  // bakery
  { name: 'White bread', fdcId: 174924, grams: 29, serving: '1 slice (29 g)', category: 'bakery' },
  { name: 'Whole wheat bread', fdcId: 172688, grams: 32, serving: '1 slice (32 g)', category: 'bakery' },
  { name: 'Sourdough bread', fdcId: 172675, grams: 50, serving: '1 slice (50 g)', category: 'bakery' },
  { name: 'Bagel', fdcId: 174899, grams: 105, serving: '1 bagel (105 g)', category: 'bakery' },
  { name: 'English muffin', fdcId: 172828, grams: 57, serving: '1 muffin (57 g)', category: 'bakery' },
  { name: 'Croissant', fdcId: 174987, grams: 57, serving: '1 croissant (57 g)', category: 'bakery' },
  { name: 'Flour tortilla', fdcId: 173242, grams: 49, serving: '1 tortilla, 8" (49 g)', category: 'bakery' },
  { name: 'Flour tortilla, burrito size', fdcId: 173242, grams: 72, serving: '1 tortilla, 10" (72 g)', category: 'bakery' },
  { name: 'Corn tortilla', fdcId: 173241, grams: 26, serving: '1 tortilla (26 g)', category: 'bakery' },
  { name: 'Hamburger bun', fdcId: 172796, grams: 44, serving: '1 bun (44 g)', category: 'bakery' },
  { name: 'Pita bread', fdcId: 172816, grams: 60, serving: '1 pita (60 g)', category: 'bakery' },
  { name: 'Biscuit', fdcId: 172670, grams: 60, serving: '1 biscuit (60 g)', category: 'bakery' },
  { name: 'Blueberry muffin', fdcId: 172765, grams: 139, serving: '1 large muffin (139 g)', category: 'bakery' },

  // pantry: grains, potatoes, beans, nuts, oils, condiments
  { name: 'White rice, cooked', fdcId: 168878, grams: 158, serving: '1 cup (158 g)', category: 'pantry' },
  { name: 'Brown rice, cooked', fdcId: 169704, grams: 202, serving: '1 cup (202 g)', category: 'pantry' },
  { name: 'Quinoa, cooked', fdcId: 168917, grams: 185, serving: '1 cup (185 g)', category: 'pantry' },
  { name: 'Pasta, cooked', fdcId: 169737, grams: 140, serving: '1 cup (140 g)', category: 'pantry' },
  { name: 'Baked potato', fdcId: 170093, grams: 173, serving: '1 medium (173 g)', category: 'pantry' },
  { name: 'Mashed potatoes', fdcId: 168555, grams: 210, serving: '1 cup (210 g)', category: 'pantry' },
  { name: 'Sweet potato, baked', fdcId: 168483, grams: 114, serving: '1 medium (114 g)', category: 'pantry' },
  { name: 'French fries, frozen (oven)', fdcId: 169264, grams: 85, serving: '3 oz (85 g)', category: 'pantry' },
  { name: 'Black beans', fdcId: 173735, grams: 86, serving: '1/2 cup (86 g)', category: 'pantry' },
  { name: 'Pinto beans, canned', fdcId: 173797, grams: 85, serving: '1/2 cup (85 g)', category: 'pantry' },
  { name: 'Chickpeas', fdcId: 173757, grams: 82, serving: '1/2 cup (82 g)', category: 'pantry' },
  { name: 'Refried beans', fdcId: 172438, grams: 119, serving: '1/2 cup (119 g)', category: 'pantry' },
  { name: 'Baked beans', fdcId: 175182, grams: 127, serving: '1/2 cup (127 g)', category: 'pantry' },
  { name: 'Lentils, cooked', fdcId: 172421, grams: 99, serving: '1/2 cup (99 g)', category: 'pantry' },
  { name: 'Peanut butter', fdcId: 174266, grams: 32, serving: '2 tbsp (32 g)', category: 'pantry' },
  { name: 'Olive oil', fdcId: 171413, grams: 13.5, serving: '1 tbsp (13.5 g)', category: 'pantry' },
  { name: 'Canola oil', fdcId: 172336, grams: 14, serving: '1 tbsp (14 g)', category: 'pantry' },
  { name: 'Mayonnaise', fdcId: 171009, grams: 13.8, serving: '1 tbsp (13.8 g)', category: 'pantry' },
  { name: 'Ranch dressing', fdcId: 173592, grams: 30, serving: '2 tbsp (30 g)', category: 'pantry' },
  { name: 'Italian dressing', fdcId: 171019, grams: 29, serving: '2 tbsp (29 g)', category: 'pantry' },
  { name: 'Ketchup', fdcId: 168556, grams: 17, serving: '1 tbsp (17 g)', category: 'pantry' },
  { name: 'Yellow mustard', fdcId: 172234, grams: 5, serving: '1 tsp (5 g)', category: 'pantry' },
  { name: 'BBQ sauce', fdcId: 174523, grams: 34, serving: '2 tbsp (34 g)', category: 'pantry' },
  { name: 'Salsa', fdcId: 174524, grams: 36, serving: '2 tbsp (36 g)', category: 'pantry' },
  { name: 'Guacamole', fdcId: 2709307, grams: 60, serving: '1/4 cup (60 g)', category: 'pantry' },
  { name: 'Hummus', fdcId: 174289, grams: 30, serving: '2 tbsp (30 g)', category: 'pantry' },
  { name: 'Soy sauce', fdcId: 174277, grams: 16, serving: '1 tbsp (16 g)', category: 'pantry' },
  { name: 'Sriracha', fdcId: 171186, grams: 6.5, serving: '1 tsp (6.5 g)', category: 'pantry' },
  { name: 'Marinara sauce', fdcId: 171192, grams: 132, serving: '1/2 cup (132 g)', category: 'pantry' },
  { name: 'Honey', fdcId: 169640, grams: 21, serving: '1 tbsp (21 g)', category: 'pantry' },
  { name: 'Sugar', fdcId: 169655, grams: 4.2, serving: '1 tsp (4.2 g)', category: 'pantry' },
  { name: 'Maple syrup', fdcId: 169661, grams: 40, serving: '2 tbsp (40 g)', category: 'pantry' },
  { name: 'Jam', fdcId: 169641, grams: 20, serving: '1 tbsp (20 g)', category: 'pantry' },
  { name: 'Dill pickle', fdcId: 168558, grams: 35, serving: '1 spear (35 g)', category: 'pantry' },

  // produce
  { name: 'Banana', fdcId: 173944, grams: 118, serving: '1 medium (118 g)', category: 'produce' },
  { name: 'Apple', fdcId: 171688, grams: 182, serving: '1 medium (182 g)', category: 'produce' },
  { name: 'Orange', fdcId: 169097, grams: 131, serving: '1 medium (131 g)', category: 'produce' },
  { name: 'Clementine', fdcId: 168195, grams: 74, serving: '1 fruit (74 g)', category: 'produce' },
  { name: 'Grapes', fdcId: 174683, grams: 151, serving: '1 cup (151 g)', category: 'produce' },
  { name: 'Strawberries', fdcId: 167762, grams: 152, serving: '1 cup (152 g)', category: 'produce' },
  { name: 'Blueberries', fdcId: 171711, grams: 148, serving: '1 cup (148 g)', category: 'produce' },
  { name: 'Raspberries', fdcId: 167755, grams: 123, serving: '1 cup (123 g)', category: 'produce' },
  { name: 'Avocado', fdcId: 171705, grams: 100, serving: '1/2 avocado (100 g)', category: 'produce' },
  { name: 'Watermelon', fdcId: 167765, grams: 152, serving: '1 cup (152 g)', category: 'produce' },
  { name: 'Cantaloupe', fdcId: 169092, grams: 160, serving: '1 cup (160 g)', category: 'produce' },
  { name: 'Pineapple', fdcId: 169124, grams: 165, serving: '1 cup (165 g)', category: 'produce' },
  { name: 'Mango', fdcId: 169910, grams: 165, serving: '1 cup (165 g)', category: 'produce' },
  { name: 'Peach', fdcId: 169928, grams: 150, serving: '1 medium (150 g)', category: 'produce' },
  { name: 'Pear', fdcId: 169118, grams: 178, serving: '1 medium (178 g)', category: 'produce' },
  { name: 'Cherries', fdcId: 171719, grams: 138, serving: '1 cup (138 g)', category: 'produce' },
  { name: 'Broccoli, cooked', fdcId: 169967, grams: 156, serving: '1 cup (156 g)', category: 'produce' },
  { name: 'Broccoli, raw', fdcId: 170379, grams: 91, serving: '1 cup (91 g)', category: 'produce' },
  { name: 'Spinach, raw', fdcId: 168462, grams: 60, serving: '2 cups (60 g)', category: 'produce' },
  { name: 'Spinach, cooked', fdcId: 168463, grams: 180, serving: '1 cup (180 g)', category: 'produce' },
  { name: 'Romaine lettuce', fdcId: 169247, grams: 94, serving: '2 cups (94 g)', category: 'produce' },
  { name: 'Mixed salad greens', fdcId: 2709792, grams: 70, serving: '2 cups (70 g)', category: 'produce' },
  { name: 'Carrot', fdcId: 170393, grams: 61, serving: '1 medium (61 g)', category: 'produce' },
  { name: 'Baby carrots', fdcId: 170393, grams: 85, serving: '3 oz, about 8 (85 g)', category: 'produce' },
  { name: 'Corn on the cob', fdcId: 169999, grams: 103, serving: '1 medium ear (103 g)', category: 'produce' },
  { name: 'Tomato', fdcId: 170457, grams: 123, serving: '1 medium (123 g)', category: 'produce' },
  { name: 'Cherry tomatoes', fdcId: 170457, grams: 149, serving: '1 cup (149 g)', category: 'produce' },
  { name: 'Cucumber', fdcId: 168409, grams: 104, serving: '1 cup sliced (104 g)', category: 'produce' },
  { name: 'Onion', fdcId: 170000, grams: 110, serving: '1 medium (110 g)', category: 'produce' },
  { name: 'Red bell pepper', fdcId: 170108, grams: 119, serving: '1 medium (119 g)', category: 'produce' },
  { name: 'Green beans, cooked', fdcId: 169141, grams: 125, serving: '1 cup (125 g)', category: 'produce' },
  { name: 'Peas, cooked', fdcId: 170017, grams: 80, serving: '1/2 cup (80 g)', category: 'produce' },
  { name: 'Mushrooms, raw', fdcId: 169251, grams: 70, serving: '1 cup sliced (70 g)', category: 'produce' },
  { name: 'Cauliflower, raw', fdcId: 169986, grams: 107, serving: '1 cup (107 g)', category: 'produce' },
  { name: 'Brussels sprouts, cooked', fdcId: 169971, grams: 156, serving: '1 cup (156 g)', category: 'produce' },
  { name: 'Asparagus, cooked', fdcId: 168390, grams: 90, serving: '6 spears (90 g)', category: 'produce' },
  { name: 'Celery', fdcId: 169988, grams: 40, serving: '1 stalk (40 g)', category: 'produce' },
  { name: 'Edamame', fdcId: 168411, grams: 155, serving: '1 cup shelled (155 g)', category: 'produce' },

  // drinks
  { name: 'Orange juice', fdcId: 169100, grams: 249, serving: '1 cup (249 g)', category: 'drink' },
  { name: 'Apple juice', fdcId: 167771, grams: 248, serving: '1 cup (248 g)', category: 'drink' },
  { name: 'Lemonade', fdcId: 173217, grams: 247, serving: '1 cup (247 g)', category: 'drink' },
  { name: 'Coffee, black', fdcId: 171890, grams: 237, serving: '1 cup (237 g)', category: 'drink' },
  { name: 'Latte', fdcId: 2710386, grams: 360, serving: '12 fl oz (360 g)', category: 'drink' },
  { name: 'Iced latte', fdcId: 2710431, grams: 480, serving: '16 fl oz (480 g)', category: 'drink' },
  { name: 'Black tea', fdcId: 173227, grams: 237, serving: '1 cup (237 g)', category: 'drink' },
  { name: 'Green tea', fdcId: 171917, grams: 245, serving: '1 cup (245 g)', category: 'drink' },
  { name: 'Sweet tea', fdcId: 2710515, grams: 496, serving: '16 fl oz (496 g)', category: 'drink' },
  { name: 'Iced tea, unsweetened', fdcId: 2710517, grams: 480, serving: '16 fl oz (480 g)', category: 'drink' },
  { name: 'Hot chocolate', fdcId: 2705473, grams: 248, serving: '1 cup (248 g)', category: 'drink' },
  { name: 'Cola', fdcId: 174852, grams: 370, serving: '1 can, 12 fl oz (370 g)', category: 'drink' },
  { name: 'Diet cola', fdcId: 2710542, grams: 360, serving: '1 can, 12 fl oz (360 g)', category: 'drink' },
  { name: 'Energy drink', fdcId: 2710747, grams: 496, serving: '1 can, 16 fl oz (496 g)', category: 'drink' },
  { name: 'Sports drink', fdcId: 2710771, grams: 620, serving: '1 bottle, 20 fl oz (620 g)', category: 'drink' },
  { name: 'Fruit smoothie', fdcId: 2705514, grams: 432, serving: '16 fl oz (432 g)', category: 'drink' },
  { name: 'Beer', fdcId: 168746, grams: 356, serving: '1 can, 12 fl oz (356 g)', category: 'drink' },
  { name: 'Light beer', fdcId: 168749, grams: 354, serving: '1 can, 12 fl oz (354 g)', category: 'drink' },
  { name: 'Red wine', fdcId: 173190, grams: 147, serving: '1 glass, 5 fl oz (147 g)', category: 'drink' },
  { name: 'White wine', fdcId: 2710689, grams: 150, serving: '1 glass, 5 fl oz (150 g)', category: 'drink' },
  { name: 'Liquor (vodka, whiskey, rum, gin)', fdcId: 171919, grams: 42, serving: '1 shot, 1.5 fl oz (42 g)', category: 'drink' },

  // meals (FNDDS survey foods: the whole dish as eaten)
  { name: 'Cheese pizza', fdcId: 2708614, grams: 119, serving: '1 slice, large pizza (119 g)', category: 'meal' },
  { name: 'Pepperoni pizza', fdcId: 2708638, grams: 124, serving: '1 slice, large pizza (124 g)', category: 'meal' },
  { name: 'Hamburger', fdcId: 2706920, grams: 145, serving: '1 burger (145 g)', category: 'meal' },
  { name: 'Cheeseburger', fdcId: 2706888, grams: 165, serving: '1 burger (165 g)', category: 'meal' },
  { name: 'Hot dog on bun', fdcId: 2707056, grams: 102, serving: '1 hot dog (102 g)', category: 'meal' },
  { name: 'Grilled cheese sandwich', fdcId: 2705801, grams: 116, serving: '1 sandwich (116 g)', category: 'meal' },
  { name: 'Peanut butter and jelly sandwich', fdcId: 2707554, grams: 112, serving: '1 sandwich (112 g)', category: 'meal' },
  { name: 'Turkey sandwich', fdcId: 2706981, grams: 115, serving: '1 sandwich (115 g)', category: 'meal' },
  { name: 'Ham and cheese sandwich', fdcId: 2706965, grams: 135, serving: '1 sandwich (135 g)', category: 'meal' },
  { name: 'BLT sandwich', fdcId: 2706979, grams: 105, serving: '1 sandwich (105 g)', category: 'meal' },
  { name: 'Tuna salad sandwich', fdcId: 2707034, grams: 180, serving: '1 sandwich (180 g)', category: 'meal' },
  { name: 'Grilled chicken sandwich', fdcId: 2707005, grams: 140, serving: '1 sandwich (140 g)', category: 'meal' },
  { name: 'Chicken nuggets', fdcId: 2706092, grams: 96, serving: '6 nuggets (96 g)', category: 'meal' },
  { name: 'Chicken tenders', fdcId: 2706098, grams: 100, serving: '2 tenders (100 g)', category: 'meal' },
  { name: 'French fries', fdcId: 170698, grams: 117, serving: '1 medium (117 g)', category: 'meal' },
  { name: 'Burrito', fdcId: 2708534, grams: 220, serving: '1 regular burrito (220 g)', category: 'meal' },
  { name: 'Taco', fdcId: 2708514, grams: 105, serving: '1 taco (105 g)', category: 'meal' },
  { name: 'Quesadilla', fdcId: 2708590, grams: 140, serving: '1 whole (140 g)', category: 'meal' },
  { name: 'Mac and cheese', fdcId: 2708811, grams: 230, serving: '1 cup (230 g)', category: 'meal' },
  { name: 'Spaghetti with meat sauce', fdcId: 2708838, grams: 250, serving: '1 cup (250 g)', category: 'meal' },
  { name: 'Spaghetti with marinara', fdcId: 2708831, grams: 250, serving: '1 cup (250 g)', category: 'meal' },
  { name: 'Lasagna', fdcId: 2708753, grams: 232, serving: '1 piece (232 g)', category: 'meal' },
  { name: 'Fried rice', fdcId: 2708952, grams: 198, serving: '1 cup (198 g)', category: 'meal' },
  { name: 'Chicken noodle soup', fdcId: 2709149, grams: 245, serving: '1 cup (245 g)', category: 'meal' },
  { name: 'Instant ramen', fdcId: 2709152, grams: 440, serving: '1 package, prepared (440 g)', category: 'meal' },
  { name: 'Chili', fdcId: 2706373, grams: 255, serving: '1 cup (255 g)', category: 'meal' },
  { name: 'Garden salad (no dressing)', fdcId: 2709822, grams: 146, serving: '2 cups (146 g)', category: 'meal' },
  { name: 'Caesar salad (no dressing)', fdcId: 2709591, grams: 158, serving: '2 cups (158 g)', category: 'meal' },

  // breakfast
  { name: 'Oatmeal, cooked', fdcId: 173905, grams: 234, serving: '1 cup (234 g)', category: 'breakfast' },
  { name: 'Instant oatmeal packet', fdcId: 171662, grams: 177, serving: '1 packet, prepared (177 g)', category: 'breakfast' },
  { name: 'Cereal', fdcId: 2708445, grams: 35, serving: '1 cup (35 g)', category: 'breakfast' },
  { name: 'Granola', fdcId: 2708461, grams: 55, serving: '1/2 cup (55 g)', category: 'breakfast' },
  { name: 'Pancakes', fdcId: 175009, grams: 154, serving: '2 pancakes, 6" (154 g)', category: 'breakfast' },
  { name: 'Frozen waffles', fdcId: 175048, grams: 66, serving: '2 waffles (66 g)', category: 'breakfast' },
  { name: 'French toast', fdcId: 174998, grams: 130, serving: '2 slices (130 g)', category: 'breakfast' },
  { name: 'Hash browns', fdcId: 170036, grams: 156, serving: '1 cup (156 g)', category: 'breakfast' },
  { name: 'Egg and cheese sandwich', fdcId: 2707308, grams: 135, serving: '1 sandwich (135 g)', category: 'breakfast' },
  { name: 'Bacon, egg and cheese muffin', fdcId: 2707317, grams: 150, serving: '1 sandwich (150 g)', category: 'breakfast' },
  { name: 'Sausage, egg and cheese muffin', fdcId: 2707316, grams: 180, serving: '1 sandwich (180 g)', category: 'breakfast' },
  { name: 'Toaster pastry', fdcId: 167927, grams: 53, serving: '1 pastry (53 g)', category: 'breakfast' },

  // snacks
  { name: 'Potato chips', fdcId: 169677, grams: 28, serving: '1 oz (28 g)', category: 'snack' },
  { name: 'Tortilla chips', fdcId: 167558, grams: 28, serving: '1 oz (28 g)', category: 'snack' },
  { name: 'Cheese puffs', fdcId: 167949, grams: 28, serving: '1 oz (28 g)', category: 'snack' },
  { name: 'Microwave popcorn', fdcId: 167549, grams: 33, serving: '3 cups popped (33 g)', category: 'snack' },
  { name: 'Pretzels', fdcId: 167555, grams: 28, serving: '1 oz (28 g)', category: 'snack' },
  { name: 'Snack crackers', fdcId: 174982, grams: 16, serving: '5 crackers (16 g)', category: 'snack' },
  { name: 'Cheese crackers', fdcId: 174975, grams: 30, serving: '1 oz, about 55 pieces (30 g)', category: 'snack' },
  { name: 'Graham crackers', fdcId: 174957, grams: 28, serving: '2 full sheets (28 g)', category: 'snack' },
  { name: 'Rice cake', fdcId: 170250, grams: 9, serving: '1 cake (9 g)', category: 'snack' },
  { name: 'Beef jerky', fdcId: 167536, grams: 28, serving: '1 oz (28 g)', category: 'snack' },
  { name: 'Almonds', fdcId: 170567, grams: 28, serving: '1 oz, 23 nuts (28 g)', category: 'snack' },
  { name: 'Walnuts', fdcId: 170187, grams: 28, serving: '1 oz (28 g)', category: 'snack' },
  { name: 'Cashews', fdcId: 169421, grams: 28, serving: '1 oz (28 g)', category: 'snack' },
  { name: 'Peanuts', fdcId: 174262, grams: 28, serving: '1 oz (28 g)', category: 'snack' },
  { name: 'Pistachios', fdcId: 169426, grams: 28, serving: '1 oz, 49 nuts (28 g)', category: 'snack' },
  { name: 'Mixed nuts', fdcId: 168599, grams: 28, serving: '1 oz (28 g)', category: 'snack' },
  { name: 'Trail mix', fdcId: 167561, grams: 42, serving: '1/4 cup (42 g)', category: 'snack' },
  { name: 'Granola bar', fdcId: 169674, grams: 28, serving: '1 bar (28 g)', category: 'snack' },

  // dessert
  { name: 'Vanilla ice cream', fdcId: 167575, grams: 66, serving: '1/2 cup (66 g)', category: 'dessert' },
  { name: 'Chocolate ice cream', fdcId: 168809, grams: 66, serving: '1/2 cup (66 g)', category: 'dessert' },
  { name: 'Milkshake', fdcId: 2705508, grams: 405, serving: '1 small (405 g)', category: 'dessert' },
  { name: 'Chocolate chip cookie (bakery)', fdcId: 172716, grams: 40, serving: '1 big cookie (40 g)', category: 'dessert' },
  { name: 'Chocolate chip cookies (packaged)', fdcId: 172716, grams: 33, serving: '3 cookies (33 g)', category: 'dessert' },
  { name: 'Chocolate sandwich cookies', fdcId: 172718, grams: 36, serving: '3 cookies (36 g)', category: 'dessert' },
  { name: 'Chocolate cake with frosting', fdcId: 174934, grams: 138, serving: '1 slice (138 g)', category: 'dessert' },
  { name: 'Yellow cake with frosting', fdcId: 174945, grams: 67, serving: '1 piece (67 g)', category: 'dessert' },
  { name: 'Cheesecake', fdcId: 172711, grams: 80, serving: '1 slice (80 g)', category: 'dessert' },
  { name: 'Apple pie', fdcId: 173239, grams: 125, serving: '1 slice (125 g)', category: 'dessert' },
  { name: 'Pumpkin pie', fdcId: 172787, grams: 133, serving: '1 slice (133 g)', category: 'dessert' },
  { name: 'Glazed donut', fdcId: 172758, grams: 60, serving: '1 donut (60 g)', category: 'dessert' },
  { name: 'Milk chocolate bar', fdcId: 167587, grams: 44, serving: '1 bar, 1.55 oz (44 g)', category: 'dessert' },
  { name: 'Dark chocolate', fdcId: 170272, grams: 28, serving: '1 oz (28 g)', category: 'dessert' },
  { name: 'Peanut butter cups', fdcId: 168763, grams: 45, serving: '2 cups (45 g)', category: 'dessert' },
  { name: 'Gummy candy', fdcId: 2710359, grams: 60, serving: '1 bag (60 g)', category: 'dessert' },

  // protein
  { name: 'Whey protein powder', fdcId: 173180, grams: 32, serving: '1 scoop (32 g)', category: 'protein' },
  { name: 'Protein bar', fdcId: 173132, grams: 80, serving: '1 bar (80 g)', category: 'protein' },
  { name: 'Tofu, firm', fdcId: 172448, grams: 100, serving: '100 g', category: 'protein' },
];

async function load() {
  const foods = [];
  for (const [zip, json, key] of DATASETS) {
    if (!existsSync(join(DIR, json))) {
      mkdirSync(DIR, { recursive: true });
      console.log(`usda: downloading ${zip}`);
      const r = await fetch(BASE + zip);
      if (!r.ok) throw new Error(`${zip}: HTTP ${r.status}`);
      writeFileSync(join(DIR, zip), Buffer.from(await r.arrayBuffer()));
      execFileSync('unzip', ['-oq', join(DIR, zip), '-d', DIR]);
    }
    foods.push(...JSON.parse(readFileSync(join(DIR, json), 'utf8'))[key].filter(Boolean));
  }
  return foods;
}

export async function scrape() {
  const foods = await load();
  const byId = new Map(foods.map(f => [f.fdcId, f]));
  const byDesc = new Map(foods.map(f => [f.description, f]));
  const items = [];
  for (const s of STAPLES) {
    const f = s.fdcId ? byId.get(s.fdcId) : byDesc.get(s.description);
    if (!f) {
      console.error(`usda: not found: ${s.name} (${s.fdcId ?? s.description})`);
      continue;
    }
    const per100 = Object.fromEntries(Object.entries(NUTRIENT).map(([k, id]) => [k, f.foodNutrients.find(n => n.nutrient?.id === id)?.amount]));
    const x = v => (v == null ? undefined : (v * s.grams) / 100);
    items.push(item({ place: 'home', name: s.name, category: s.category, kcal: x(per100.kcal), p: x(per100.p), c: x(per100.c), f: x(per100.f), na: x(per100.na), serving: s.serving, grams: s.grams }));
  }
  return save('usda', { places: [{ id: 'home', name: 'Home', kind: 'home', orders: { 'À la carte': null } }], items });
}
