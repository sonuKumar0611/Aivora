/**
 * Sentiment analysis for chat conversations using VADER.
 * Returns positive, negative, and neutral scores (0–1, sum ≈ 1).
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const vader = require('vader-sentiment');

const SentimentIntensityAnalyzer = vader.SentimentIntensityAnalyzer;

export interface SentimentResult {
  positive: number;
  negative: number;
  neutral: number;
}

/**
 * Analyze sentiment of a text string. Returns pos/neg/neu scores (0–1).
 */
export function getSentimentScores(text: string): SentimentResult {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { positive: 0, negative: 0, neutral: 1 };
  }
  const scores = SentimentIntensityAnalyzer.polarity_scores(text.trim());
  return {
    positive: typeof scores.pos === 'number' ? scores.pos : 0,
    negative: typeof scores.neg === 'number' ? scores.neg : 0,
    neutral: typeof scores.neu === 'number' ? scores.neu : 0,
  };
}

/**
 * Aggregate sentiment across multiple text segments (e.g. messages).
 * Averages the scores so the result still sums to ~1.
 */
export function aggregateSentiment(texts: string[]): SentimentResult {
  if (!texts.length) return { positive: 0, negative: 0, neutral: 1 };
  let pos = 0, neg = 0, neu = 0;
  for (const t of texts) {
    const s = getSentimentScores(t);
    pos += s.positive;
    neg += s.negative;
    neu += s.neutral;
  }
  const n = texts.length;
  return {
    positive: pos / n,
    negative: neg / n,
    neutral: neu / n,
  };
}
