// One card in the Unrot feed. Content lives in packages/unrot-content (see its README for the rules).
export type CardType = 'quote' | 'idea' | 'fact' | 'question';
export type Thread = { id: string; title: string; part: number; of: number };
export type Card = {
  id: string;
  type: CardType;
  topic: string;
  tags: string[];
  title?: string;
  text: string;
  author?: string;
  source: string;
  more: string; // the "go deeper" panel
  link?: string;
  thread?: Thread;
};
export type Catalog = { version: string; cards: Card[] };
