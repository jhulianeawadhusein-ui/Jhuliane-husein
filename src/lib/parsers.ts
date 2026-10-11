import JSZip from 'jszip';
import { Book, Chapter } from '../types';
import { cleanNarrationText } from './cleaner';

/**
 * Extracts text and chapters from an EPUB file
 */
export async function parseEPUB(file: File): Promise<Book> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  // 1. Locate container.xml to find root OPF file
  const containerXml = await zipContent.file('META-INF/container.xml')?.async('string');
  let opfPath = 'content.opf';
  if (containerXml) {
    const match = containerXml.match(/full-path="([^"]+)"/i);
    if (match && match[1]) {
      opfPath = match[1];
    }
  }

  // 2. Read OPF file
  const opfFile = zipContent.file(opfPath);
  let title = file.name.replace(/\.[^/.]+$/, '');
  let author = 'Autor desconhecido';
  const spineHrefs: string[] = [];

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  if (opfFile) {
    const opfXml = await opfFile.async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(opfXml, 'application/xml');

    const titleEl = doc.querySelector('title') || doc.querySelector('dc\\:title');
    if (titleEl?.textContent) title = titleEl.textContent.trim();

    const authorEl = doc.querySelector('creator') || doc.querySelector('dc\\:creator');
    if (authorEl?.textContent) author = authorEl.textContent.trim();

    // Map manifest item IDs to hrefs
    const manifestItems: Record<string, string> = {};
    const items = doc.querySelectorAll('manifest > item');
    items.forEach((item) => {
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      if (id && href) {
        manifestItems[id] = href;
      }
    });

    // Read spine order
    const spineItemrefs = doc.querySelectorAll('spine > itemref');
    spineItemrefs.forEach((ref) => {
      const idref = ref.getAttribute('idref');
      if (idref && manifestItems[idref]) {
        spineHrefs.push(opfDir + manifestItems[idref]);
      }
    });
  }

  // 3. Fallback: if no spine, look for html/xhtml files in zip
  let filesToRead = spineHrefs;
  if (filesToRead.length === 0) {
    filesToRead = Object.keys(zipContent.files).filter((name) =>
      /\.(xhtml|html|htm)$/i.test(name) && !name.includes('toc')
    );
  }

  // 4. Extract chapters
  const rawChapters: { title: string; text: string }[] = [];

  for (const path of filesToRead) {
    const chFile = zipContent.file(path);
    if (!chFile) continue;

    const html = await chFile.async('string');
    const dom = new DOMParser().parseFromString(html, 'text/html');

    // Extract title from h1, h2, or title element
    const heading = dom.querySelector('h1, h2, h3, title');
    let chapterTitle = heading?.textContent?.trim() || '';

    // Remove script, style, header, footer elements
    dom.querySelectorAll('script, style, nav').forEach((el) => el.remove());

    const bodyText = dom.body ? dom.body.innerText || dom.body.textContent || '' : '';
    const cleanBody = bodyText.trim();

    // Only add if there is substantial text (skip empty/cover-only stubs)
    if (cleanBody.length > 80) {
      if (!chapterTitle) {
        // Try extracting first line
        const firstLine = cleanBody.split('\n')[0].slice(0, 60).trim();
        chapterTitle = firstLine || `Capítulo ${rawChapters.length + 1}`;
      }

      rawChapters.push({
        title: chapterTitle,
        text: cleanBody,
      });
    }
  }

  // 5. Build Chapter objects with cleaned text
  const chapters: Chapter[] = rawChapters.map((rc, idx) => {
    const clean = cleanNarrationText(rc.text);
    const words = clean.cleanedText.split(/\s+/).filter(Boolean).length;
    return {
      id: `epub-ch-${idx + 1}`,
      number: idx + 1,
      title: rc.title || `Capítulo ${idx + 1}`,
      rawText: rc.text,
      cleanedText: clean.cleanedText,
      wordCount: words,
      estimatedMinutes: Math.max(1, Math.round(words / 130)),
      cleanedStats: clean.stats,
    };
  });

  return {
    id: `book-${Date.now()}`,
    title,
    author,
    format: 'epub',
    currentChapterIndex: 0,
    chapters: chapters.length > 0 ? chapters : [createEmptyChapter()],
  };
}

/**
 * Extracts text and chapters from a PDF file
 */
export async function parsePDF(file: File): Promise<Book> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');

  // Configure worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let fullBookText = '';
  const pagesText: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean);
    const pageStr = pageStrings.join(' ');
    pagesText.push(pageStr);
    fullBookText += `\n[PÁGINA ${i}]\n` + pageStr;
  }

  // Detect chapters in the extracted PDF text
  // Common Portuguese chapter patterns: "Capítulo 1", "Capítulo I", "CAPÍTULO II", "Capítulo Terceiro"
  const chapterRegex = /(?:^|\n)\s*(?:cap[íi]tulo\s+(?:[0-9]+|[ivxlcdm]+|[a-zçãõ]+)|parte\s+[0-9ivxlcdm]+)\b[^\n]*/gim;
  const matches = [...fullBookText.matchAll(chapterRegex)];

  const chapters: Chapter[] = [];
  const bookTitle = file.name.replace(/\.[^/.]+$/, '');

  if (matches.length >= 2) {
    // Split into detected chapters
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const startIdx = currentMatch.index ?? 0;
      const endIdx = i < matches.length - 1 ? (matches[i + 1].index ?? fullBookText.length) : fullBookText.length;

      const rawChapterBlock = fullBookText.substring(startIdx, endIdx);
      const firstLineEnd = rawChapterBlock.indexOf('\n');
      const titleLine = firstLineEnd !== -1 ? rawChapterBlock.substring(0, firstLineEnd).trim() : `Capítulo ${i + 1}`;
      const content = rawChapterBlock.substring(firstLineEnd !== -1 ? firstLineEnd : 0).trim();

      const clean = cleanNarrationText(content);
      const words = clean.cleanedText.split(/\s+/).filter(Boolean).length;

      chapters.push({
        id: `pdf-ch-${i + 1}`,
        number: i + 1,
        title: titleLine || `Capítulo ${i + 1}`,
        rawText: content,
        cleanedText: clean.cleanedText,
        wordCount: words,
        estimatedMinutes: Math.max(1, Math.round(words / 130)),
        cleanedStats: clean.stats,
      });
    }
  } else {
    // Fallback if no distinct chapter headings are matched: divide logically by groups of pages (e.g. 5-10 pages each)
    const pagesPerChapter = Math.max(3, Math.ceil(numPages / 5));
    let chapterCount = 1;

    for (let p = 0; p < numPages; p += pagesPerChapter) {
      const slice = pagesText.slice(p, p + pagesPerChapter).join('\n\n');
      const clean = cleanNarrationText(slice);
      const words = clean.cleanedText.split(/\s+/).filter(Boolean).length;

      chapters.push({
        id: `pdf-sec-${chapterCount}`,
        number: chapterCount,
        title: `Seção ${chapterCount} (Págs. ${p + 1} a ${Math.min(p + pagesPerChapter, numPages)})`,
        rawText: slice,
        cleanedText: clean.cleanedText,
        wordCount: words,
        estimatedMinutes: Math.max(1, Math.round(words / 130)),
        cleanedStats: clean.stats,
      });
      chapterCount++;
    }
  }

  return {
    id: `book-pdf-${Date.now()}`,
    title: bookTitle,
    author: 'Documento PDF',
    format: 'pdf',
    currentChapterIndex: 0,
    chapters: chapters.length > 0 ? chapters : [createEmptyChapter()],
  };
}

function createEmptyChapter(): Chapter {
  return {
    id: 'empty-ch-1',
    number: 1,
    title: 'Capítulo 1',
    rawText: 'Nenhum texto pôde ser extraído.',
    cleanedText: 'Nenhum texto pôde ser extraído.',
    wordCount: 0,
    estimatedMinutes: 0,
    cleanedStats: { pageNumbersRemoved: 0, citationsRemoved: 0, hyphensJoined: 0 },
  };
}
