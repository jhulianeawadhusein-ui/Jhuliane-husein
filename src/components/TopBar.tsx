import React from 'react';
import { BookOpen, Upload, Volume2, Users, SlidersHorizontal } from 'lucide-react';
import { VoiceActorName } from '../types';

interface TopBarProps {
  onOpenUpload: () => void;
  onOpenChapters: () => void;
  onOpenVoiceActors: () => void;
  onOpenNarratorStudio: () => void;
  onOpenSettings: () => void;
  currentBookTitle: string;
  currentChapterTitle: string;
  currentVoiceActor: VoiceActorName;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenUpload,
  onOpenChapters,
  onOpenVoiceActors,
  onOpenNarratorStudio,
  onOpenSettings,
  currentBookTitle,
  currentChapterTitle,
  currentVoiceActor,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            className="font-display text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap hover:text-amber-900 transition-colors"
          >
            Voz & Prosa
          </a>
          <span className="hidden lg:inline text-stone-300">|</span>
          <span className="hidden lg:inline text-xs text-stone-500 font-sans tracking-wide truncate max-w-xs">
            {currentBookTitle ? `${currentBookTitle} · ${currentChapterTitle}` : 'Narrador de Audiobooks'}
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
          <button
            onClick={onOpenChapters}
            className="flex items-center gap-1.5 hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-4 h-4 text-stone-500" />
            <span>Capítulos</span>
          </button>

          {/* Prominent Voice Actors link */}
          <button
            onClick={onOpenVoiceActors}
            className="flex items-center gap-1.5 text-amber-800 hover:text-amber-950 font-semibold transition-colors whitespace-nowrap shrink-0"
            title="Escolher e trocar entre narradoras e narradores"
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Vozes: {currentVoiceActor}</span>
          </button>

          <button
            onClick={onOpenNarratorStudio}
            className="flex items-center gap-1.5 hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
          >
            <Volume2 className="w-4 h-4 text-stone-500" />
            <span>Estúdio</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-stone-500" />
            <span>Ajustes</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile quick voice button */}
          <button
            onClick={onOpenVoiceActors}
            className="md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 rounded-lg"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{currentVoiceActor}</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar Livro</span>
          </button>
        </div>
      </div>
    </header>
  );
};
