// Splits card text into phrases for the reveal, and marks which words belong to the highlighted key phrase.
// Phrases end at punctuation or after MAX words, so the text arrives in readable chunks, not frantic single words.
// A word the key phrase starts or ends inside (e.g. "beauty—a") is split there, so the highlight stops exactly.

export type Word = { text: string; phrase: number; em: boolean; space: boolean };
const MAX = 6;

export function phrases(text: string, em?: string): Word[] {
  const start = em ? text.indexOf(em) : -1;
  const end = start < 0 ? -1 : start + em!.length;
  const out: Word[] = [];
  let phrase = 0, inPhrase = 0;
  for (const m of text.matchAll(/\S+/g)) {
    const a = m.index!, b = a + m[0].length;
    const cuts = [a, ...[start, end].filter(x => x > a && x < b), b];
    for (let i = 0; i + 1 < cuts.length; i++)
      out.push({ text: text.slice(cuts[i], cuts[i + 1]), phrase, em: start >= 0 && cuts[i] >= start && cuts[i + 1] <= end, space: i + 2 === cuts.length });
    inPhrase++;
    if (/[.,;:!?—–…)]["”’]?$/.test(m[0]) || inPhrase >= MAX) { phrase++; inPhrase = 0; }
  }
  return out;
}

export const phraseCount = (words: Word[]) => (words.length ? words[words.length - 1].phrase + 1 : 0);
