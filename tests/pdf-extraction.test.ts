import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getDocumentProxy, extractText } from 'unpdf';
import { countWords } from '@/lib/utils';

describe('PDF Extraction Logic', () => {
  const samplePdfPath = '/home/harsh/Documents/Code/PRAYAS-INFO DEVAN SHAH -26-S-007.pdf';

  it('extracts text from a sample 2-page PDF without DataCloneError', async () => {
    if (!fs.existsSync(samplePdfPath)) {
      console.warn('Sample PDF not found, skipping');
      return;
    }

    const buffer = fs.readFileSync(samplePdfPath);
    const uint8Array = new Uint8Array(buffer);

    const doc = await getDocumentProxy(uint8Array);
    expect(doc.numPages).toBe(2);

    const result = await extractText(doc, { mergePages: true });
    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(100);

    const cleanedText = result.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    const wc = countWords(cleanedText);
    expect(wc).toBeGreaterThanOrEqual(150);
    expect(wc).toBeLessThanOrEqual(600);
  });
});
