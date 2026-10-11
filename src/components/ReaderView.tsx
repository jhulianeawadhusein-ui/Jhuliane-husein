import React, { useRef, useEffect } from 'react';
import { Volume2, Play, CheckCircle2, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { Book, Chapter, NarratorSettings } from '../types';
import { SystemDownloadSection } from './SystemDownloadSection';

interface ReaderViewProps {
  book: Book;
  chapter: Chapter;
  currentParagraphIndex: number;
  isPlaying: boolean;
  settings: NarratorSettings;
  paragraphs: string[];
  hasNextChapter: boolean;
  nextChapterTitle?: string;
  onParagraphClick: (index: number) => void;
  onStartReading: () => void;
  onNextChapter: () => void;
  onRepeatChapter: () => void;
  onOpenCleanInspector: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  book,
  chapter,
  currentParagraphIndex,
  isPlaying,
  settings,
  paragraphs,
  hasNextChapter,
  nextChapterTitle,
  onParagraphClick,
  onStartReading,
  onNextChapter,
  onRepeatChapter,
  onOpenCleanInspector,
}) => {
  const activeParagraphRef = useRef<HTMLParagraphElement | null>(null);

  // Auto-scroll gently into view when the active paragraph changes while playing
  useEffect(() => {
    if (isPlaying && activeParagraphRef.current) {
      activeParagraphRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentParagraphIndex, isPlaying]);

  const themeClasses = {
    paper: 'bg-stone-50 text-stone-900',
    sepia: 'bg-[#fcf8f2] text-[#2c221a]',
    dark: 'bg-stone-900 text-stone-100',
  }[settings.readingTheme];

  const fontSizeClasses = {
    sm: 'text-base leading-relaxed',
    base: 'text-lg leading-relaxed',
    lg: 'text-xl leading-loose',
    xl: 'text-2xl leading-loose',
  }[settings.fontSize];

  const isLastParagraphActive = currentParagraphIndex >= paragraphs.length - 1;

  return (
    <article className={`min-h-screen pb-32 transition-colors duration-200 ${themeClasses}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        {/* Editorial Book & Chapter Header */}
        <header className="mb-10 sm:mb-14 pb-8 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-3">
            <span>{book.title}</span>
            <span aria-hidden="true">·</span>
            <span>{book.author}</span>
            <span aria-hidden="true">·</span>
            <span>{chapter.wordCount} palavras</span>
            <span aria-hidden="true">·</span>
            <span>~{chapter.estimatedMinutes} min de áudio</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-stone-900 dark:text-stone-50 text-balance mb-4">
            {chapter.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
              <span className="font-medium text-amber-700 dark:text-amber-400">Texto Integral</span>
              <span aria-hidden="true">·</span>
              <span>Lido ao pé da letra sem cortes ou resumos</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={onOpenCleanInspector}
                className="underline hover:text-stone-900 dark:hover:text-stone-200 transition-colors inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>
                  {chapter.cleanedStats.pageNumbersRemoved + chapter.cleanedStats.citationsRemoved} ruídos removidos
                </span>
              </button>
            </div>

            {!isPlaying && (
              <button
                onClick={onStartReading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-transform active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ouvir Capítulo na Íntegra</span>
              </button>
            )}
          </div>
        </header>

        {/* Chapter Prose Content with synchronized paragraph highlight */}
        <div className={`font-editorial ${fontSizeClasses} space-y-6 sm:space-y-8 select-text`}>
          {paragraphs.map((paragraph, index) => {
            const isActive = isPlaying && currentParagraphIndex === index;
            const isRead = currentParagraphIndex > index;

            return (
              <p
                key={index}
                ref={isActive ? activeParagraphRef : null}
                onClick={() => onParagraphClick(index)}
                className={`relative group rounded-lg p-3 -mx-3 cursor-pointer transition-colors duration-200 ${
                  isActive
                    ? 'bg-amber-100/70 dark:bg-amber-950/40 text-stone-950 dark:text-amber-50 shadow-sm ring-1 ring-amber-300/50 dark:ring-amber-700/50'
                    : isRead
                    ? 'text-stone-700 dark:text-stone-300 hover:bg-stone-100/50 dark:hover:bg-stone-800/40'
                    : 'text-stone-900 dark:text-stone-100 hover:bg-stone-100/50 dark:hover:bg-stone-800/40'
                } ${
                  index === 0
                    ? 'first-letter:text-5xl sm:first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-stone-900 dark:first-letter:text-amber-300'
                    : ''
                }`}
              >
                {/* Active narrator indicator icon */}
                {isActive && (
                  <span
                    className="absolute -left-7 top-4 text-amber-600 dark:text-amber-400 hidden sm:inline-block animate-pulse"
                    title="Voz do narrador aqui"
                  >
                    <Volume2 className="w-4 h-4" />
                  </span>
                )}
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Chapter Conclusion Card & Prompt for Next Chapter */}
        <div className="mt-16 pt-10 border-t border-stone-200 dark:border-stone-800">
          <div className="bg-stone-100/80 dark:bg-stone-800/70 rounded-xl p-6 sm:p-8 border border-stone-200 dark:border-stone-700 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100 mb-2">
              Fim do {chapter.title}
            </h3>

            <p className="text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto mb-6">
              O capítulo foi lido na íntegra, ao pé da letra e sem interrupções.
              <br />
              <strong className="text-stone-900 dark:text-stone-100 font-semibold">
                Posso prosseguir para o próximo capítulo?
              </strong>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {hasNextChapter ? (
                <button
                  onClick={onNextChapter}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-transform active:scale-95"
                >
                  <span>Sim, Prosseguir para o Próximo Capítulo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-xs text-stone-500 uppercase tracking-widest">
                  Você concluiu todos os capítulos deste livro!
                </span>
              )}

              <button
                onClick={onRepeatChapter}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ouvir Este Capítulo Novamente</span>
              </button>
            </div>

            {hasNextChapter && nextChapterTitle && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-4">
                Próximo: <span className="font-medium text-stone-700 dark:text-stone-300">{nextChapterTitle}</span>
              </p>
            )}
          </div>
        </div>

        {/* Downloads & Installation for Android and Windows at the bottom */}
        <SystemDownloadSection
          book={book}
          chapter={chapter}
          selectedActor={settings.voiceActor}
          selectedEmotion={settings.emotionStyle}
        />
      </div>
    </article>
  );
};
