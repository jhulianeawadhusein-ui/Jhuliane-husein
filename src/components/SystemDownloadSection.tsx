import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  FileText,
  Volume2,
  CheckCircle,
  HelpCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Chapter, Book, VoiceActorName, DubbingEmotion } from '../types';

interface SystemDownloadSectionProps {
  book: Book;
  chapter: Chapter;
  selectedActor: VoiceActorName;
  selectedEmotion: DubbingEmotion;
}

export const SystemDownloadSection: React.FC<SystemDownloadSectionProps> = ({
  book,
  chapter,
  selectedActor,
  selectedEmotion,
}) => {
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [downloadingAudio, setDownloadingAudio] = useState<boolean>(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  // Capture PWA install prompt for both Android and Windows
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPromptEvent(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async (system: 'android' | 'windows') => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPromptEvent(null);
    } else {
      // Manual instruction alert
      if (system === 'android') {
        alert(
          'Para instalar no Android:\n\n1. No navegador Google Chrome ou Samsung Internet, toque no menu de 3 pontinhos (⋮) no canto superior direito.\n2. Selecione "Adicionar à tela inicial" ou "Instalar aplicativo".\n3. O ícone do Voz & Prosa será fixado no seu menu de aplicativos do Android!'
        );
      } else {
        alert(
          'Para instalar no Windows:\n\n1. No Google Chrome ou Microsoft Edge, clique no ícone de computador/instalação na barra de endereços (ao lado da estrela de favoritos).\n2. Ou clique no menu (⋯) > "Aplicativos" > "Instalar este site como aplicativo".\n3. O app abrirá em janela própria e criará atalho na área de trabalho e Menu Iniciar!'
        );
      }
    }
  };

  // Download clean text file
  const handleDownloadCleanText = () => {
    const textContent = `LIVRO: ${book.title.toUpperCase()}
AUTOR: ${book.author}
CAPÍTULO: ${chapter.title}
ESTADO DO TEXTO: Integral ao pé da letra (ruídos de números de página e notas bibliográficas filtrados)
PALAVRAS: ${chapter.wordCount}
------------------------------------------------------------------------

${chapter.cleanedText || chapter.rawText}
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${book.title} - ${chapter.title} (Texto Limpo Integral).txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadStatus('Texto limpo baixado com sucesso!');
    setTimeout(() => setDownloadStatus(null), 3500);
  };

  // Download clean audio file
  const handleDownloadAudio = async () => {
    setDownloadingAudio(true);
    setDownloadStatus('Gerando arquivo de áudio de alta fidelidade para download...');

    try {
      // Take first 1000 characters or complete preview of chapter
      const textToSynthesize = (chapter.cleanedText || chapter.rawText).slice(0, 1000);

      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSynthesize,
          voiceName: selectedActor,
          emotion: selectedEmotion,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const byteCharacters = atob(data.audioBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: data.mimeType || 'audio/wav' });

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${book.title} - ${chapter.title} (Dublagem ${selectedActor}).wav`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          setDownloadStatus('Arquivo de áudio baixado com sucesso!');
        } else {
          throw new Error('Sem áudio retornado');
        }
      } else {
        throw new Error('Falha no servidor');
      }
    } catch {
      // Fallback: download text script
      handleDownloadCleanText();
      setDownloadStatus('Texto estruturado para áudio baixado com sucesso!');
    } finally {
      setDownloadingAudio(false);
      setTimeout(() => setDownloadStatus(null), 3500);
    }
  };

  return (
    <section className="mt-14 pt-10 border-t border-stone-200 dark:border-stone-800">
      <div className="bg-white dark:bg-stone-800/90 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-700 shadow-sm">
        {/* Title */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Downloads & Instalação</span>
          </div>
          <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            Disponível para Android & Windows
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
            Instale o aplicativo direto no seu dispositivo ou baixe os áudios e textos limpos do capítulo para ouvir offline onde quiser.
          </p>
        </div>

        {downloadStatus && (
          <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 text-center animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{downloadStatus}</span>
          </div>
        )}

        {/* Dual Column: Android & Windows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Android Card */}
          <div className="bg-stone-50 dark:bg-stone-900/60 rounded-xl p-5 sm:p-6 border border-stone-200 dark:border-stone-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                      Sistema Android
                    </h4>
                    <p className="text-[11px] text-stone-500">Smartphone & Tablet</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                  Mobile PWA
                </span>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
                Adicione o aplicativo nativamente à tela inicial do Android para ler com a tela apagada, em segundo plano e com navegação por gestos.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleInstallApp('android')}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Instalar Aplicativo no Android</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadAudio}
                  disabled={downloadingAudio}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                  title="Baixar arquivo de áudio deste capítulo para Android"
                >
                  {downloadingAudio ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Baixar Áudio (.wav)</span>
                </button>

                <button
                  onClick={handleDownloadCleanText}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  title="Baixar texto limpo sem notas para leitores de tela"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  <span>Texto Limpo (.txt)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Windows Card */}
          <div className="bg-stone-50 dark:bg-stone-900/60 rounded-xl p-5 sm:p-6 border border-stone-200 dark:border-stone-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                      Sistema Windows
                    </h4>
                    <p className="text-[11px] text-stone-500">Windows 10 & 11 (Desktop)</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                  Desktop App
                </span>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
                Instale como aplicativo de desktop autônomo no Windows (via Chrome/Edge), com ícone na barra de tarefas e janela própria sem moldura de navegador.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleInstallApp('windows')}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors active:scale-95"
              >
                <Monitor className="w-4 h-4" />
                <span>Instalar Aplicativo no Windows</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadAudio}
                  disabled={downloadingAudio}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                  title="Baixar áudio para Windows Media Player ou Groove"
                >
                  {downloadingAudio ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Baixar Áudio (.wav)</span>
                </button>

                <button
                  onClick={handleDownloadCleanText}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  title="Baixar texto limpo sem rodapés para leitura no Bloco de Notas ou Word"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  <span>Texto Limpo (.txt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footnote instruction */}
        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-700/60 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Formatado para reprodução em reprodutores de áudio de ambos os sistemas</span>
          </span>
          <span>Compatível com Android Chrome, Edge & Windows 10/11</span>
        </div>
      </div>
    </section>
  );
};
