import { NextRequest, NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { countWords } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PAGES = 2; // Strict 1–2 page restriction for micro-learning
const MIN_WORDS = 30; // Minimum words to distinguish from scanned blank/title pages

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'No file uploaded. Please select a PDF file.' } },
        { status: 400 }
      );
    }

    // 1. File Type restriction
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid file format. Only PDF (.pdf) documents are supported.' } },
        { status: 400 }
      );
    }

    // 2. File Size restriction (Max 5 MB)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: `File size (${sizeMb} MB) exceeds the 5 MB limit. Please upload a smaller excerpt.`,
          },
        },
        { status: 400 }
      );
    }

    // Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 3. Page Count restriction
    let doc: any;
    let numPages = 0;
    try {
      doc = await getDocumentProxy(uint8Array);
      numPages = doc.numPages;
    } catch (docErr) {
      console.error('Failed to get PDF document proxy:', docErr);
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Failed to read PDF document. The file may be password-protected or corrupted.',
          },
        },
        { status: 400 }
      );
    }

    if (numPages > MAX_PAGES) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: `Document has ${numPages} pages. To ensure a fair timed micro-learning assessment (1–3 min reading window), PDFs are limited to 1 or 2 pages. Please export an excerpt or abstract.`,
          },
        },
        { status: 400 }
      );
    }

    // 4. Extract Text using document proxy with robust fallback
    let rawText = '';
    try {
      // Passing doc proxy avoids DataCloneError in Node 22 / loopback worker
      const result = await extractText(doc, { mergePages: true });
      rawText = result.text || '';
    } catch (extractErr) {
      console.warn('extractText on doc failed, falling back to manual page extraction:', extractErr);
    }

    // Fallback if rawText is empty or extractText threw
    if (!rawText.trim()) {
      try {
        const pagesText: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const pageStrings = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .filter(Boolean)
            .join(' ');
          pagesText.push(pageStrings);
        }
        rawText = pagesText.join('\n\n');
      } catch (pageErr) {
        console.error('Manual page extraction failed:', pageErr);
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_INPUT',
              message: 'Unable to extract text from this PDF. Please ensure the document contains selectable text.',
            },
          },
          { status: 400 }
        );
      }
    }

    // Clean up extracted text (normalize whitespace and linebreaks)
    const cleanedText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    const wordCount = countWords(cleanedText);

    // 5. Scanned Image / Minimum Content check
    if (wordCount < MIN_WORDS) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: `Only ${wordCount} words were detected. This PDF appears to be a scanned image or lacks a selectable text layer. Please use a text-based PDF or paste your text directly.`,
          },
        },
        { status: 400 }
      );
    }

    // Infer a readable title from document metadata, "Title" line, or filename
    const fallbackTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const lines = cleanedText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const titleIndex = lines.slice(0, 10).findIndex((l: string) => /^title\b/i.test(l));
    let inferredTitle = '';

    if (titleIndex !== -1) {
      let t = lines[titleIndex].replace(/^title\s*[:\-]?\s*/i, '').trim();
      if (
        lines[titleIndex + 1] &&
        !/^(domain|category|department|faculty|author|abstract|problem|mentor|date|id)\b/i.test(lines[titleIndex + 1]) &&
        lines[titleIndex + 1].length < 80
      ) {
        t += ' ' + lines[titleIndex + 1];
      }
      inferredTitle = t;
    } else if (lines.length > 0) {
      const candidate = (lines[0].length < 10 && lines[1] && lines[1].length >= 10 && lines[1].length <= 100)
        ? lines[1]
        : lines[0];
      if (candidate.length >= 6 && candidate.length <= 100) {
        inferredTitle = candidate;
      }
    }

    if (!inferredTitle) {
      inferredTitle = fallbackTitle;
    }

    let finalCleanedText = cleanedText;
    let finalWordCount = wordCount;
    let warning: string | undefined;

    if (wordCount > 600) {
      const words = cleanedText.split(/\s+/);
      const trimmed = words.slice(0, 580).join(' ');
      const lastSentenceIdx = Math.max(trimmed.lastIndexOf('. '), trimmed.lastIndexOf('.\n'), trimmed.lastIndexOf('? '));
      finalCleanedText = lastSentenceIdx > 300 ? trimmed.substring(0, lastSentenceIdx + 1) : trimmed;
      finalWordCount = countWords(finalCleanedText);
      warning = `Original document contained ${wordCount} words. Automatically formatted to ${finalWordCount} words to fit the recommended reading window.`;
    } else if (wordCount < 150) {
      warning = `Document contains ${wordCount} words (recommended minimum: 150 words).`;
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      pageCount: numPages,
      wordCount: finalWordCount,
      title: inferredTitle,
      text: finalCleanedText,
      warning,
    });

  } catch (err) {
    console.error('PDF extraction failed:', err);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to process PDF file. Please try again or paste the text directly.' } },
      { status: 500 }
    );
  }
}
