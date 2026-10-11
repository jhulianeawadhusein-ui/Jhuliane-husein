import React, { useEffect, useState } from 'react';
import { X, SlidersHorizontal, Sparkles, Volume2, Mic, Theater } from 'lucide-react';
import { NarratorSettings, DubbingEmotion, VoiceActorName } from '../types';
import { speechEngine, NarrationEngineMode } from '../lib/speechEngine';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  settings: NarratorSettings;
  onUpdateSettings: (newSettings: Partial<NarratorSettings>) => void;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [engineMode, setEngineMode] = useState<NarrationEngineMode>('gemini');

  useEffect(() => {
    if (isOpen) {
      setVoices(speechEngine.getAvailableVoices());
      setEngineMode(speechEngine.getEngineMode());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEngineChange = (mode: NarrationEngineMode) => {
    setEngineMode(mode);
    speechEngine.setEngineMode(mode);
  };

  const emotionsList: { id: DubbingEmotion; label: string; icon: string; desc: string }[] = [
    {
      id: 'dramatic',
      label: 'Teatral & Dramático',
      icon: '🎭',
      desc: 'Atuação visceral com respiração natural, emoção nas falas e calor humano.',
    },
    {
      id: 'intimate',
      label: 'Íntimo & Confessional',
      icon: '🕯️',
      desc: 'Timbre aveludado, ritmo calmo e sensação de memórias contadas ao pé do ouvido.',
    },
    {
      id: 'suspense',
      label: 'Suspense & Mistério',
      icon: '⚡',
      desc: 'Pausas dramáticas, tensão calculada e inflexões de incerteza e sobressalto.',
    },
    {
      id: 'energetic',
      label: 'Vívido & Apaixonado',
      icon: '✨',
      desc: 'Ritmo alegre e entusiasmado, perfeito para diálogos animados e cenas de ação.',
    },
  ];

  const actorsList: { id: VoiceActorName; name: string; profile: string }[] = [
    { id: 'Fenrir', name: 'Fenrir', profile: 'Masculino maduro, clássico, aveludado e solene' },
    { id: 'Kore', name: 'Kore', profile: 'Feminino expressivo, caloroso e cativante' },
    { id: 'Puck', name: 'Puck', profile: 'Jovem, vibrante, espirituoso e teatral' },
    { id: 'Zephyr', name: 'Zephyr', profile: 'Suave, poético, sereno e reflexivo' },
    { id: 'Charon', name: 'Charon', profile: 'Profundo, imponente, dramático e épico' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-50 text-stone-900 w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-stone-200 overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Theater className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900">
                Direção de Voz & Dublagem com Emoção
              </h2>
              <p className="text-xs text-stone-500 font-sans">
                Interpretação humana com calor, sentimentos e respiração viva
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

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Emotion Styles */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
              Emoção & Clima Dramático da Dublagem
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {emotionsList.map((emo) => (
                <button
                  key={emo.id}
                  onClick={() => onUpdateSettings({ emotionStyle: emo.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.emotionStyle === emo.id
                      ? 'border-amber-600 bg-amber-50/80 shadow-xs ring-1 ring-amber-500'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emo.icon}</span>
                    <span className="text-xs font-bold text-stone-900">{emo.label}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1 leading-snug">{emo.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Actor Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
              Ator / Voz Principal do Audiolivro
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actorsList.map((act) => (
                <button
                  key={act.id}
                  onClick={() => onUpdateSettings({ voiceActor: act.id })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    settings.voiceActor === act.id
                      ? 'border-amber-600 bg-amber-50/80 text-stone-900 ring-1 ring-amber-500'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="text-xs font-bold text-stone-900">{act.name}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{act.profile}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Engine Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
              Motor de Síntese
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleEngineChange('gemini')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  engineMode === 'gemini'
                    ? 'border-amber-600 bg-amber-50/70 text-stone-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1">
                  <span>Gemini TTS Studio</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Interpretação humana com emoção real e dublagem de estúdio
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleEngineChange('browser')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  engineMode === 'browser'
                    ? 'border-amber-600 bg-amber-50/70 text-stone-900 shadow-xs'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold text-stone-900">Voz do Dispositivo (pt-BR)</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Reprodução offline rápida com prosódia dramática aplicada
                </div>
              </button>
            </div>
          </div>

          {/* Speed & Pitch */}
          <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 space-y-4">
            <div>
              <div className="flex justify-between text-xs text-stone-700 mb-1">
                <span className="font-medium">Cadência da Interpretação (Velocidade)</span>
                <span className="font-mono tabular-nums">{settings.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={settings.rate}
                onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-stone-700 mb-1">
                <span className="font-medium">Afinação Vocal</span>
                <span className="font-mono tabular-nums">{settings.pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.85"
                max="1.15"
                step="0.05"
                value={settings.pitch}
                onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-stone-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors"
          >
            Aplicar Direção & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
