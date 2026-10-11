import React, { useEffect, useState } from 'react';
import { Volume2, ArrowRight, RotateCcw, X, Sparkles } from 'lucide-react';
import { Chapter } from '../types';

interface NarratorPromptModalProps {
  isOpen: boolean;
  completedChapter: Chapter;
  nextChapter?: Chapter;
  onProceedNext: () => void;
  onRepeat: () => void;
  onClose: () => void;
}

export const NarratorPromptModal: React.FC<NarratorPromptModalProps> = ({
  isOpen,
  completedChapter,
  nextChapter,
  onProceedNext,
  onRepeat,
  onClose,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !nextChapter) {
      setCountdown(null);
      return;
    }

    // Auto-countdown to advance seamlessly if user does not click
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onProceedNext();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, nextChapter, onProceedNext]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-50 text-stone-900 w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl border border-stone-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Narrator Icon & Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
            <Volume2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-700 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Voz do Narrador</span>
            </div>
            <h2 className="font-display text-xl font-bold text-stone-900">
              Capítulo Concluído na Íntegra
            </h2>
          </div>
        </div>

        <div className="bg-stone-100 rounded-xl p-4 mb-6 border border-stone-200">
          <p className="font-editorial text-base italic text-stone-800 leading-relaxed">
            "{completedChapter.title} foi narrado na íntegra ao pé da letra, sem cortes ou resumos."
          </p>
          <p className="font-display text-base font-semibold text-stone-900 mt-3">
            Posso prosseguir para a leitura do próximo capítulo?
          </p>
        </div>

        {nextChapter ? (
          <div className="mb-6">
            <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">
              Próximo Capítulo na Sequência:
            </p>
            <p className="font-editorial text-lg font-medium text-stone-900">
              {nextChapter.title}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {nextChapter.wordCount} palavras · ~{nextChapter.estimatedMinutes} min de áudio
            </p>
          </div>
        ) : (
          <div className="mb-6 text-sm text-stone-600">
            Você chegou ao final de todos os capítulos deste livro!
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {nextChapter && (
            <button
              onClick={onProceedNext}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-transform active:scale-95"
            >
              <span>Sim, Iniciar Próximo Capítulo</span>
              {countdown !== null && (
                <span className="text-xs font-mono bg-amber-700/80 px-2 py-0.5 rounded-md tabular-nums">
                  {countdown}s
                </span>
              )}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onRepeat}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-200/80 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repetir Capítulo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
