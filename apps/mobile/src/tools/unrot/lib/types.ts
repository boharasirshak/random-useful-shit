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
  em?: string; // the key phrase, highlighted (an exact part of text)
  author?: string;
  source: string;
  more?: string; // the "go deeper" panel (bulk cards may have none: the source line stands alone)
  link?: string;
  thread?: Thread;
  image?: string; // a picture (URL), with its credit
  credit?: string;
  tier?: number; // 1 (or unset): hand-written, bundled. 2: gathered by script (packages/unrot-content/BULK.md)
};
export type Catalog = { version: string; cards: Card[] };
