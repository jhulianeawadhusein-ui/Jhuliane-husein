export interface CleanResult {
  cleanedText: string;
  stats: {
    pageNumbersRemoved: number;
    citationsRemoved: number;
    hyphensJoined: number;
  };
}

/**
 * Professional text cleaner for audiobooks
 * Removes page numbers, bibliographic citations, footnote markers, and line break hyphens.
 */
export function cleanNarrationText(rawText: string): CleanResult {
  if (!rawText) {
    return {
      cleanedText: '',
      stats: { pageNumbersRemoved: 0, citationsRemoved: 0, hyphensJoined: 0 },
    };
  }

  let text = rawText;
  let pageNumbersRemoved = 0;
  let citationsRemoved = 0;
  let hyphensJoined = 0;

  // 1. Count & Join words broken across linebreaks (e.g. "com- \n preensão" -> "compreensão")
  const hyphenMatches = text.match(/(\p{L}+)-\s*\r?\n\s*(\p{L}+)/gu);
  if (hyphenMatches) {
    hyphensJoined += hyphenMatches.length;
  }
  text = text.replace(/(\p{L}+)-\s*\r?\n\s*(\p{L}+)/gu, '$1$2');

  // 2. Count & Remove standalone page numbers or headers/footers
  // Matches lines like: "12", "- 12 -", "— 12 —", "Página 45", "Pág. 12 de 180"
  const lines = text.split(/\r?\n/);
  const filteredLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Check if line is purely a page number or page indicator
    const isPageNumber =
      /^(?:[-—–\s]*\d+[-—–\s]*|p[áa]g(?:ina|\.)?\s*\d+(?:\s*(?:de|\/)\s*\d+)?|\d+\s*(?:de|\/)\s*\d+)$/i.test(
        trimmed
      );

    // Also filter running repetitive header lines like "DOM CASMURRO | MACHADO DE ASSIS" followed by a page number
    const isRunningHeaderWithPage =
      /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,}\s*[|\-—–•]\s*\d+$/i.test(trimmed);

    if (isPageNumber || isRunningHeaderWithPage) {
      pageNumbersRemoved++;
      continue;
    }

    // Filter footnote blocks starting with digits at line start (e.g., "1. Ver notas sobre a edição de 1899.")
    const isFootnoteLine = /^\s*(?:\d{1,3}\.|\(\d{1,3}\)|\[\d{1,3}\])\s+(?:Cf\.|Ver|Vide|Nota|Edição|Ibid|Op\.\s*cit\.|Consultar)/i.test(
      trimmed
    );
    if (isFootnoteLine) {
      citationsRemoved++;
      continue;
    }

    filteredLines.push(line);
  }

  text = filteredLines.join('\n');

  // 3. Count & Remove citation brackets like [1], [1, 2], [1-4], [23, 24], [p. 45]
  const bracketMatches = text.match(/\[\s*(?:\d+[\s,\-–\d]*|p[áa]g?\.?\s*\d+)\s*\]/g);
  if (bracketMatches) {
    citationsRemoved += bracketMatches.length;
  }
  text = text.replace(/\[\s*(?:\d+[\s,\-–\d]*|p[áa]g?\.?\s*\d+)\s*\]/g, '');

  // 4. Count & Remove parenthetical academic / bibliographic citations:
  // e.g., (SILVA, 2018), (MACHADO DE ASSIS, 1899, p. 45), (cf. SOUZA, 2005)
  const parenMatches = text.match(
    /\((?:cf\.\s*)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{2,},\s*\d{4}(?:,\s*p[áa]g?\.?\s*\d+)?\)/g
  );
  if (parenMatches) {
    citationsRemoved += parenMatches.length;
  }
  text = text.replace(
    /\((?:cf\.\s*)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{2,},\s*\d{4}(?:,\s*p[áa]g?\.?\s*\d+)?\)/g,
    ''
  );

  // 5. Remove superscript footnote numbers right after words: e.g. "palavra¹", "palavra²", "palavra¹²³"
  text = text.replace(/[\u00B9\u00B2\u00B3\u2070\u2074-\u2079]/g, '');

  // 6. Normalize paragraph spaces and blank lines
  text = text
    // Replace 3+ consecutive newlines with 2 newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove trailing spaces on lines
    .replace(/[ \t]+$/gm, '')
    // Replace multiple inline spaces with single space
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return {
    cleanedText: text,
    stats: {
      pageNumbersRemoved,
      citationsRemoved,
      hyphensJoined,
    },
  };
}

/**
 * Splits text into readable paragraph chunks for narration highlighting
 */
export function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
