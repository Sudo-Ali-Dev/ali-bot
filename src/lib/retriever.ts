import datasetRaw from './dataset.json';

interface QAPair {
  question: string;
  answer: string;
  tokens: Set<string>;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'but',
  'or', 'and', 'not', 'no', 'so', 'if', 'then', 'than', 'too', 'very',
  'just', 'that', 'this', 'it', 'i', 'me', 'my', 'you', 'your', 'we',
  'they', 'he', 'she', 'what', 'which', 'who', 'whom', 'how', 'when',
  'where', 'why', 'all', 'each', 'some', 'any', 'most', 'am', 'also',
  'really', 'like', 'think', 'know', 'much', 'many', 'more', 'up',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function parseEntry(text: string): { question: string; answer: string } | null {
  const userIdx = text.indexOf('User: ');
  const aliIdx = text.indexOf('\nAli: ');
  if (userIdx === -1 || aliIdx === -1) return null;
  const question = text.slice(userIdx + 6, aliIdx).trim();
  const answer = text.slice(aliIdx + 6).replace(/<\/s>$/, '').trim();
  return { question, answer };
}

const pairs: QAPair[] = [];

for (const entry of datasetRaw as { text: string }[]) {
  const parsed = parseEntry(entry.text);
  if (!parsed) continue;
  const combined = parsed.question + ' ' + parsed.answer;
  pairs.push({
    question: parsed.question,
    answer: parsed.answer,
    tokens: tokenize(combined),
  });
}

export function retrieve(query: string, topK = 3): { question: string; answer: string }[] {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return [];

  const scored = pairs.map((pair) => {
    let overlap = 0;
    for (const token of queryTokens) {
      if (pair.tokens.has(token)) overlap++;
    }
    const score = overlap / Math.sqrt(queryTokens.size * Math.max(pair.tokens.size, 1));
    return { pair, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, topK)
    .filter((s) => s.score > 0.05)
    .map((s) => ({ question: s.pair.question, answer: s.pair.answer }));
}
