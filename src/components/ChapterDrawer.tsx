import React, { useState } from 'react';
import { X, BookOpen, Clock, Search, ChevronRight, Play, Check } from 'lucide-react';
import { Book, Chapter } from '../types';

interface ChapterDrawerProps {
  isOpen: boolean;
  book: Book;
  allBooks: Book[];
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  onSelectBook: (bookId: string) => void;
  onClose: () => void;
}

export const ChapterDrawer: React.FC<ChapterDrawerProps> = ({
  isOpen,
  book,
  allBooks,
  currentChapterIndex,
  onSelectChapter,
  onSelectBook,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredChapters = book.chapters.filter((ch) =>
    ch.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-50 h-full flex flex-col shadow-2xl border-l border-stone-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-700" />
            <h2 className="font-display text-lg font-bold text-stone-900">
              Índice de Capítulos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Book Selector Dropdown */}
        <div className="p-4 bg-stone-100 border-b border-stone-200">
          <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
            Livro Ativo na Biblioteca:
          </label>
          <select
            value={book.id}
            onChange={(e) => onSelectBook(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          >
            {allBooks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.author} ({b.chapters.length} capítulos)
              </option>
            ))}
          </select>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-stone-200">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar capítulos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Chapters list */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2">
          {filteredChapters.map((chapter) => {
            const actualIndex = book.chapters.findIndex((c) => c.id === chapter.id);
            const isCurrent = actualIndex === currentChapterIndex;

            return (
              <button
                key={chapter.id}
                onClick={() => {
                  onSelectChapter(actualIndex);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-lg flex items-start justify-between gap-3 transition-colors ${
                  isCurrent
                    ? 'bg-amber-100/70 border border-amber-300/60 shadow-xs'
                    : 'hover:bg-stone-100'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold font-mono ${
                        isCurrent ? 'text-amber-800' : 'text-stone-500'
                      }`}
                    >
                      {String(chapter.number).padStart(2, '0')}.
                    </span>
                    <span
                      className={`font-editorial text-sm font-medium truncate ${
                        isCurrent ? 'text-stone-900 font-bold' : 'text-stone-800'
                      }`}
                    >
                      {chapter.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 pl-6">
                    <span className="tabular-nums">{chapter.wordCount} palavras</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3 text-stone-400" />
                      ~{chapter.estimatedMinutes} min
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pt-1">
                  {isCurrent ? (
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  )}
                </div>
              </button>
            );
          })}

          {filteredChapters.length === 0 && (
            <div className="p-8 text-center text-xs text-stone-500">
              Nenhum capítulo encontrado para "{searchQuery}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-200 bg-stone-100 text-xs text-stone-500 flex items-center justify-between">
          <span>{book.chapters.length} capítulos no total</span>
          <span>Leitura na íntegra sem cortes</span>
        </div>
      </div>
    </div>
  );
};
