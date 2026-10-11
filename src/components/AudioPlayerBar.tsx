import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Sparkles,
  Loader2,
  Mic,
  Smile,
} from 'lucide-react';
import { Chapter, DubbingEmotion, VoiceActorName } from '../types';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  isPaused: boolean;
  isDubbingLoading?: boolean;
  currentChapter: Chapter;
  currentParagraphIndex: number;
  totalParagraphs: number;
  hasPrevChapter: boolean;
  hasNextChapter: boolean;
  playbackRate: number;
  selectedEmotion: DubbingEmotion;
  selectedActor: VoiceActorName;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onPrevParagraph: () => void;
  onNextParagraph: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onChangeRate: (rate: number) => void;
  onChangeEmotion: (emotion: DubbingEmotion) => void;
  onChangeActor: (actor: VoiceActorName) => void;
  onOpenCleanInspector: () => void;
  onOpenSettings: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying,
  isPaused,
  isDubbingLoading = false,
  currentChapter,
  currentParagraphIndex,
  totalParagraphs,
  hasPrevChapter,
  hasNextChapter,
  playbackRate,
  selectedEmotion,
  selectedActor,
  onPlay,
  onPause,
  onResume,
  onPrevParagraph,
  onNextParagraph,
  onPrevChapter,
  onNextChapter,
  onChangeRate,
  onChangeEmotion,
  onChangeActor,
  onOpenCleanInspector,
  onOpenSettings,
}) => {
  const [showEmotionMenu, setShowEmotionMenu] = useState(false);

  const progressPercent =
    totalParagraphs > 0
      ? Math.min(100, Math.round(((currentParagraphIndex + 1) / totalParagraphs) * 100))
      : 0;

  const speedOptions = [0.8, 1.0, 1.25, 1.5];

  const emotionLabels: Record<DubbingEmotion, { label: string; icon: string }> = {
    dramatic: { label: 'Dramática & Teatral', icon: '🎭' },
    intimate: { label: 'Íntima & Confessional', icon: '🕯️' },
    suspense: { label: 'Suspense & Mistério', icon: '⚡' },
    energetic: { label: 'Vívida & Apaixonada', icon: '✨' },
  };

  const actorLabels: Record<VoiceActorName, string> = {
    Fenrir: 'Voz Fenrir (Grave & Clássica)',
    Kore: 'Voz Kore (Expressiva & Doce)',
    Puck: 'Voz Puck (Jovem & Espirituosa)',
    Zephyr: 'Voz Zephyr (Serena & Aveludada)',
    Charon: 'Voz Charon (Solene & Profunda)',
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      onPause();
    } else if (isPaused) {
      onResume();
    } else {
      onPlay();
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900 text-stone-100 border-t border-stone-800 shadow-2xl">
      {/* Top progress line */}
      <div className="w-full bg-stone-800 h-1 relative overflow-hidden">
        <div
          className="bg-amber-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Track info & Dubbing emotion tag */}
        <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0">
          <button
            onClick={onPrevChapter}
            disabled={!hasPrevChapter}
            className="p-1.5 text-stone-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Capítulo Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-sm font-medium text-stone-100 truncate">
                {currentChapter.title}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
              <span className="tabular-nums">
                Parágrafo {Math.min(currentParagraphIndex + 1, totalParagraphs)}/{totalParagraphs}
              </span>
              <span aria-hidden="true">·</span>
              {/* Quick emotion badge toggle */}
              <div className="relative inline-block">
                <button
                  onClick={() => setShowEmotionMenu(!showEmotionMenu)}
                  className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
                  title="Mudar emoção da dublagem"
                >
                  <span>{emotionLabels[selectedEmotion].icon}</span>
                  <span className="underline decoration-dotted">
                    {emotionLabels[selectedEmotion].label}
                  </span>
                </button>

                {showEmotionMenu && (
                  <div className="absolute bottom-8 left-0 z-50 bg-stone-800 border border-stone-700 rounded-xl shadow-xl p-2 w-52 flex flex-col gap-1">
                    <div className="text-[10px] text-stone-400 uppercase tracking-wider px-2 py-1">
                      Emoção da Dublagem:
                    </div>
                    {(Object.keys(emotionLabels) as DubbingEmotion[]).map((emo) => (
                      <button
                        key={emo}
                        onClick={() => {
                          onChangeEmotion(emo);
                          setShowEmotionMenu(false);
                        }}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                          selectedEmotion === emo
                            ? 'bg-amber-600 text-white font-semibold'
                            : 'text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        <span>{emotionLabels[emo].icon}</span>
                        <span>{emotionLabels[emo].label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onNextChapter}
            disabled={!hasNextChapter}
            className="p-1.5 text-stone-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Próximo Capítulo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Play/Pause and Skip buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevParagraph}
            className="p-2 text-stone-400 hover:text-white transition-colors active:scale-95"
            title="Voltar parágrafo"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={handleTogglePlay}
            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 relative"
            title={isPlaying ? 'Pausar dublagem' : 'Iniciar dublagem com emoção'}
          >
            {isDubbingLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-stone-950" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onNextParagraph}
            className="p-2 text-stone-400 hover:text-white transition-colors active:scale-95"
            title="Avançar parágrafo"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Living soundwave animation */}
          <div className="hidden sm:flex items-center gap-0.5 h-6 px-2">
            {[45, 80, 95, 60, 90, 50, 75, 85].map((h, i) => (
              <span
                key={i}
                className={`w-0.5 rounded-full transition-all duration-200 ${
                  isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-stone-700'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 0.8 : 1.3)) % 100)}%` : '20%',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Voice Actor Selector & Speed Control */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/3">
          {/* Voice Actor select */}
          <select
            value={selectedActor}
            onChange={(e) => onChangeActor(e.target.value as VoiceActorName)}
            className="bg-stone-800 text-stone-200 border border-stone-700 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 hidden lg:block"
            title="Escolha a voz do ator de dublagem"
          >
            {(Object.keys(actorLabels) as VoiceActorName[]).map((act) => (
              <option key={act} value={act}>
                {actorLabels[act]}
              </option>
            ))}
          </select>

          {/* Speed presets */}
          <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-lg border border-stone-700/60">
            <Gauge className="w-3.5 h-3.5 text-stone-400 ml-1.5" />
            {speedOptions.map((rate) => (
              <button
                key={rate}
                onClick={() => onChangeRate(rate)}
                className={`px-2 py-0.5 text-xs font-mono font-medium rounded transition-colors tabular-nums ${
                  playbackRate === rate
                    ? 'bg-amber-500 text-stone-950 font-semibold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
