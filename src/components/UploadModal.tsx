import React, { useState } from 'react';
import { X, Upload, FileText, Book, AlertCircle, Loader2, Sparkles, Check, AlignLeft } from 'lucide-react';
import { parseEPUB, parsePDF } from '../lib/parsers';
import { cleanNarrationText } from '../lib/cleaner';
import { Book as BookType, Chapter } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onBookLoaded: (book: BookType) => void;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onBookLoaded,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Direct text forwarding state
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedAuthor, setPastedAuthor] = useState('');
  const [pastedText, setPastedText] = useState('');

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
    const isEpub = file.name.toLowerCase().endsWith('.epub') || file.type.includes('epub');
    const isText = file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md');

    if (!isPdf && !isEpub && !isText) {
      setErrorMessage('Por favor, envie um arquivo em PDF, EPUB ou TXT.');
      setIsLoading(false);
      return;
    }

    try {
      setLoadingStep('Extraindo conteúdo do arquivo...');
      let parsedBook: BookType;

      if (isEpub) {
        setLoadingStep('Lendo capítulos do EPUB e sumário...');
        parsedBook = await parseEPUB(file);
      } else if (isPdf) {
        setLoadingStep('Processando páginas do PDF e detectando capítulos...');
        parsedBook = await parsePDF(file);
      } else {
        setLoadingStep('Lendo arquivo de texto...');
        const textContent = await file.text();
        const clean = cleanNarrationText(textContent);
        const words = clean.cleanedText.split(/\s+/).filter(Boolean).length;
        parsedBook = {
          id: `book-txt-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          author: 'Texto Importado',
          format: 'sample',
          currentChapterIndex: 0,
          chapters: [
            {
              id: `txt-ch-1`,
              number: 1,
              title: file.name.replace(/\.[^/.]+$/, ''),
              rawText: textContent,
              cleanedText: clean.cleanedText,
              wordCount: words,
              estimatedMinutes: Math.max(1, Math.round(words / 130)),
              cleanedStats: clean.stats,
            },
          ],
        };
      }

      setLoadingStep('Limpando ruídos, números de página e notas para narração...');
      setTimeout(() => {
        setIsLoading(false);
        onBookLoaded(parsedBook);
        onClose();
      }, 400);
    } catch (err: unknown) {
      console.error('Erro ao processar livro:', err);
      setErrorMessage(
        'Falha ao extrair o arquivo. Certifique-se de que o arquivo é válido.'
      );
      setIsLoading(false);
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Por favor, cole ou digite o texto do capítulo no campo.');
      return;
    }

    const title = pastedTitle.trim() || 'Capítulo Personalizado';
    const author = pastedAuthor.trim() || 'Texto do Leitor';
    const clean = cleanNarrationText(pastedText);
    const words = clean.cleanedText.split(/\s+/).filter(Boolean).length;

    const newBook: BookType = {
      id: `custom-text-${Date.now()}`,
      title,
      author,
      format: 'sample',
      currentChapterIndex: 0,
      chapters: [
        {
          id: `custom-ch-1`,
          number: 1,
          title,
          rawText: pastedText,
          cleanedText: clean.cleanedText,
          wordCount: words,
          estimatedMinutes: Math.max(1, Math.round(words / 130)),
          cleanedStats: clean.stats,
        },
      ],
    };

    onBookLoaded(newBook);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-50 text-stone-900 w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-stone-200 overflow-hidden relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Português do Brasil (pt-BR) · Android & Web</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-stone-900">
            Adicionar Livro ou Capítulo
          </h2>
          <p className="text-xs text-stone-600 mt-1 font-sans">
            Envie arquivos PDF/EPUB ou cole diretamente o texto do capítulo para extração limpa e narração integral.
          </p>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl mt-4 border border-stone-200">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'file'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Arquivo (PDF / EPUB / TXT)</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'text'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Colar Texto Diretamente</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'file' ? (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleProcessFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-amber-600 bg-amber-50/50'
                    : 'border-stone-300 hover:border-stone-400 bg-white'
                }`}
                onClick={() => {
                  if (!isLoading) {
                    document.getElementById('file-upload-input')?.click();
                  }
                }}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,.epub,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                  disabled={isLoading}
                />

                {isLoading ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                    <p className="text-sm font-medium text-stone-800">{loadingStep}</p>
                    <p className="text-xs text-stone-500">Preparando texto limpo para o áudio...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        Toque para selecionar ou arraste o arquivo aqui
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Formatos aceitos: <span className="font-mono text-stone-700 font-semibold">.PDF</span>,{' '}
                        <span className="font-mono text-stone-700 font-semibold">.EPUB</span> ou{' '}
                        <span className="font-mono text-stone-700 font-semibold">.TXT</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Título da Obra ou Capítulo:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dom Casmurro - Capítulo I"
                    value={pastedTitle}
                    onChange={(e) => setPastedTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Autor (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Machado de Assis"
                    value={pastedAuthor}
                    onChange={(e) => setPastedAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Texto do Capítulo na Íntegra (pode conter números de página e referências):
                </label>
                <textarea
                  rows={8}
                  placeholder="Cole aqui o texto completo do capítulo extraído de PDF, ebook ou mensagem..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-editorial leading-relaxed"
                />
                <div className="flex justify-between text-[11px] text-stone-500 mt-1">
                  <span>O narrador removerá automaticamente números de página e citações.</span>
                  <span className="tabular-nums font-mono">{pastedText.length} caracteres</span>
                </div>
              </div>

              <button
                onClick={handleProcessPastedText}
                disabled={!pastedText.trim()}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
              >
                Limpar Texto e Iniciar Narração em Português
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Guidelines */}
          <div className="mt-6 pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-600">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>Leitura ao pé da letra sem cortes</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>Filtro de notas e números de página</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>Compatível com Android (pt-BR)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
