// Popeyes: same RBI/Sanity stack as Burger King, different project + dataset.
import { rbi } from './bk.mjs';

export const scrape = () => rbi({
  place: 'popeyes', name: 'Popeyes', project: 'czqk28jt', dataset: 'prod_plk_us',
  sections: { Sandwiches: 'entree', 'Signature Chicken': 'entree', Tenders: 'entree', 'Chicken Wraps': 'entree', Wraps: 'entree', Wings: 'entree', Seafood: 'entree', 'Sides & Sweets': 'side', Drinks: 'drink', Sauces: 'sauce' },
  orders: { 'À la carte': null, Combo: { slots: ['entree', 'side', 'drink'], extras: 'sauce' } },
});
