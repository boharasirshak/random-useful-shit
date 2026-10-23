// Turns extracted PDF text into sentences the player can read one at a time.

export type Sentence = { t: string; p: number }; // text, paragraph index

// Longest chunk sent to a voice at once. Tables and run-on text get cut at a space.
const MAX = 300;

// Paragraphs: blank lines separate them; other line breaks are just PDF wrapping. Lines that are only a page
// number (or a roman numeral) are dropped, and words hyphenated across lines are joined.
export function paragraphs(raw: string): string[] {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\f/g, '\n\n')
    .replace(/(\w)-\n(?=\w)/g, '$1')
    .split(/\n\s*\n/)
    .map(p => p.split('\n').map(l => l.trim()).filter(l => l && !/^(\d+|[ivxlcdm]+)$/i.test(l)).join(' ').replace(/\s+/g, ' '))
    .filter(Boolean);
}

const ABBREV = /^(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|No|Fig|pp?|Vol|approx)$/i;
const INITIAL = /^[A-Z]$/; // "J. Smith"

// Splits one paragraph into sentences: after . ! ? (plus closing quotes/brackets) when a space follows.
// Abbreviations such as "Mr." or "e.g." and numbers like "3.14" stay inside their sentence.
export function splitParagraph(p: string): string[] {
  const out: string[] = [];
  let buf = '';
  for (const piece of p.match(/[^.!?]*(?:[.!?]+["'”’)\]]*\s*|$)/g) ?? []) {
    if (!piece) continue;
    buf += piece;
    const word = buf.trimEnd().match(/(\S*?)[.!?]+["'”’)\]]*$/)?.[1] ?? '';
    const glued = /\S$/.test(buf); // "3.14": no space after the dot
    if (!glued && !ABBREV.test(word) && !INITIAL.test(word)) { out.push(buf.trim()); buf = ''; }
  }
  if (buf.trim()) out.push(buf.trim());
  return out.flatMap(cut);
}

// Cuts an over-long sentence at the last space before MAX.
function cut(s: string): string[] {
  if (s.length <= MAX) return [s];
  const at = s.lastIndexOf(' ', MAX);
  const i = at > MAX / 2 ? at : MAX;
  return [s.slice(0, i).trim(), ...cut(s.slice(i).trim())];
}

export function sentences(raw: string): Sentence[] {
  return paragraphs(raw).flatMap((p, i) => splitParagraph(p).map(t => ({ t, p: i })));
}

// Character offset of the word being spoken: the last marker at or before `time`, or a guess from elapsed time.
export function wordAt(text: string, time: number, duration: number, markers: { at: number; time: number }[]): number {
  if (markers.length) {
    let at = 0;
    for (const m of markers) { if (m.time <= time) at = m.at; else break; }
    return at;
  }
  if (!duration) return 0;
  const guess = Math.floor(Math.min(1, time / duration) * text.length);
  return Math.max(0, text.lastIndexOf(' ', guess) + 1);
}
