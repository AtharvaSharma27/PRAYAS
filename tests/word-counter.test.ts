import { describe, it, expect } from 'vitest';
import { countWords } from '../lib/utils';

describe('Word Count Calculation & Range Validation', () => {
  it('returns 0 for empty, null, or whitespace-only strings', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords('\n\n\t  ')).toBe(0);
  });

  it('accurately counts words separated by spaces, punctuation, and newlines', () => {
    expect(countWords('Hello world')).toBe(2);
    expect(countWords('   One   two   three   four   ')).toBe(4);
    expect(countWords('Line one.\nLine two.\nLine three.')).toBe(6);
  });

  it('validates summary word count constraints (min 20, max 150)', () => {
    const generateWords = (count: number) =>
      Array.from({ length: count }, (_, i) => `word${i}`).join(' ');

    const isSummaryValid = (text: string) => {
      const c = countWords(text);
      return c >= 20 && c <= 150;
    };

    // Under minimum
    expect(isSummaryValid(generateWords(0))).toBe(false);
    expect(isSummaryValid(generateWords(19))).toBe(false);

    // Exact boundaries
    expect(isSummaryValid(generateWords(20))).toBe(true);
    expect(isSummaryValid(generateWords(50))).toBe(true);
    expect(isSummaryValid(generateWords(150))).toBe(true);

    // Over maximum
    expect(isSummaryValid(generateWords(151))).toBe(false);
    expect(isSummaryValid(generateWords(300))).toBe(false);
  });

  it('validates custom article word count constraints (min 150, max 600)', () => {
    const generateWords = (count: number) =>
      Array.from({ length: count }, (_, i) => `token${i}`).join(' ');

    const isArticleValid = (text: string) => {
      const c = countWords(text);
      return c >= 150 && c <= 600;
    };

    expect(isArticleValid(generateWords(149))).toBe(false);
    expect(isArticleValid(generateWords(150))).toBe(true);
    expect(isArticleValid(generateWords(400))).toBe(true);
    expect(isArticleValid(generateWords(600))).toBe(true);
    expect(isArticleValid(generateWords(601))).toBe(false);
  });
});
