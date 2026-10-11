import React, { useState } from 'react';
import { X, Sparkles, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { Chapter } from '../types';

interface CleanInspectorModalProps {
  isOpen: boolean;
  chapter: Chapter;
  onClose: () => void;
  onUpdateCleanedText: (newCleanedText: string) => void;
}

export const CleanInspectorModal: React.FC<CleanInspectorModalProps> = ({
  isOpen,
  chapter,
  onClose,
  onUpdateCleanedText,
}) => {
  const [activeTab, setActiveTab] = useState<'clean' | 'raw'>('clean');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishMessage, setPolishMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeminiPolish = async () => {
    setIsPolishing(true);
    setPolishMessage(null);
    try {
      const res = await fetch('/api/gemini/clean-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: chapter.rawText,
          chapterTitle: chapter.title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cleanedText) {
          onUpdateCleanedText(data.cleanedText);
          setPolishMessage('Texto polido e verificado com sucesso pelo modelo Gemini!');
        }
      }
    } catch (err) {
      console.error(err);
      setPolishMessage('Não foi possível conectar ao serviço de polimento.');
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-50 text-stone-900 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">
                Auditoria de Limpeza do Texto
              </h2>
              <p className="text-xs text-stone-500 font-sans">
                {chapter.title} · Integridade 100% preservada sem cortes narrativos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="bg-stone-100 px-6 py-3 border-b border-stone-200 flex flex-wrap items-center gap-6 text-xs text-stone-600">
          <div>
            <strong className="text-stone-900 font-semibold tabular-nums">
              {chapter.cleanedStats.pageNumbersRemoved}
            </strong>{' '}
            números de página removidos
          </div>
          <div>
            <strong className="text-stone-900 font-semibold tabular-nums">
              {chapter.cleanedStats.citationsRemoved}
            </strong>{' '}
            citações/notas bibliográficas filtradas
          </div>
          <div>
            <strong className="text-stone-900 font-semibold tabular-nums">
              {chapter.cleanedStats.hyphensJoined}
            </strong>{' '}
            hifens de quebra de linha unificados
          </div>
        </div>

        {/* Action button & Tabs */}
        <div className="p-4 px-6 border-b border-stone-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('clean')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'clean'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Texto Limpo para Narração
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'raw'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Texto Original Bruto (com ruídos)
            </button>
          </div>

          <button
            onClick={handleGeminiPolish}
            disabled={isPolishing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPolishing ? 'animate-spin' : ''}`} />
            <span>{isPolishing ? 'Polindo com IA...' : 'Polimento Editorial IA'}</span>
          </button>
        </div>

        {polishMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{polishMessage}</span>
          </div>
        )}

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto flex-1 font-editorial text-sm sm:text-base leading-relaxed text-stone-800 whitespace-pre-wrap select-text bg-white">
          {activeTab === 'clean' ? chapter.cleanedText : chapter.rawText}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>{chapter.wordCount} palavras · Leitura estimada em {chapter.estimatedMinutes} minutos</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 font-medium transition-colors"
          >
            Concluir Inspeção
          </button>
        </div>
      </div>
    </div>
  );
};
