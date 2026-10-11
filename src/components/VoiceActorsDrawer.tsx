import React, { useState } from 'react';
import { X, Volume2, Play, Check, Sparkles, User, Filter, Loader2 } from 'lucide-react';
import { VoiceActorName, DubbingEmotion } from '../types';
import { speechEngine } from '../lib/speechEngine';

interface VoiceActorsDrawerProps {
  isOpen: boolean;
  selectedActor: VoiceActorName;
  selectedEmotion: DubbingEmotion;
  onSelectActor: (actor: VoiceActorName) => void;
  onClose: () => void;
}

interface ActorProfile {
  id: VoiceActorName;
  name: string;
  gender: 'female' | 'male';
  tag: string;
  tone: string;
  description: string;
  sampleQuote: string;
}

export const VoiceActorsDrawer: React.FC<VoiceActorsDrawerProps> = ({
  isOpen,
  selectedActor,
  selectedEmotion,
  onSelectActor,
  onClose,
}) => {
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('all');
  const [previewingActor, setPreviewingActor] = useState<VoiceActorName | null>(null);

  if (!isOpen) return null;

  const actors: ActorProfile[] = [
    {
      id: 'Kore',
      name: 'Kore (Narradora)',
      gender: 'female',
      tag: 'Voz Feminina Expressiva',
      tone: 'Calorosa, Envolvente & Articulada',
      description:
        'Interpretação rica em nuances, perfeita para literatura clássica, romance, reflexões e personagens cheios de vivacidade.',
      sampleQuote: '“Se o leitor me acompanhar com paciência, verá como tudo começou no ano de 1857...”',
    },
    {
      id: 'Zephyr',
      name: 'Zephyr (Narradora)',
      gender: 'female',
      tag: 'Voz Serena & Poética',
      tone: 'Aveludada, Suave & Confessional',
      description:
        'Voz delicada e imersiva para audiolivros contemplativos, ficção intimista, poesia e memórias profundas.',
      sampleQuote: '“Uma noite destas, vindo da cidade, encontrei no trem um rapaz que conheço de vista...”',
    },
    {
      id: 'Fenrir',
      name: 'Fenrir (Narrador)',
      gender: 'male',
      tag: 'Voz Masculina Nobre',
      tone: 'Grave, Maduro & Clássico',
      description:
        'O timbre solene e clássico dos grandes locutores e contadores de histórias, com autoridade e elegância.',
      sampleQuote: '“Não sou propriamente um autor defunto, mas um defunto autor, para quem a campa foi outro berço.”',
    },
    {
      id: 'Puck',
      name: 'Puck (Narrador)',
      gender: 'male',
      tag: 'Voz Jovem & Dinâmica',
      tone: 'Ágil, Espirituoso & Teatral',
      description:
        'Ideal para narrativas de aventura, comédia machadiana, diálogos rápidos e interpretações com sarcasmo e inteligência.',
      sampleQuote: '“O Bentinho e a Capitu estão sempre de cochichos. Meninos assim, se pegam afeição...”',
    },
    {
      id: 'Charon',
      name: 'Charon (Narrador)',
      gender: 'male',
      tag: 'Voz Dramática & Épica',
      tone: 'Profunda, Imponente & Misteriosa',
      description:
        'Excelente para suspense, tragédia, reflexões existenciais e grandes obras com forte carga dramática.',
      sampleQuote: '“Vi a Natureza tecendo a vida com os fios da dor e da morte através do espaço infinito.”',
    },
  ];

  const filteredActors = actors.filter((act) => {
    if (filterGender === 'all') return true;
    return act.gender === filterGender;
  });

  const handleTestVoice = async (actorId: VoiceActorName) => {
    setPreviewingActor(actorId);
    try {
      await speechEngine.previewNarratorVoice(actorId, selectedEmotion);
    } finally {
      setPreviewingActor(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-50 h-full flex flex-col shadow-2xl border-l border-stone-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">
                Elenco de Vozes do Narrador
              </h2>
              <p className="text-xs text-stone-500 font-sans">
                Escolha e ouça amostras de voz feminina e masculina
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="p-3 px-5 bg-stone-100 border-b border-stone-200 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
            Filtrar:
          </span>
          <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-lg">
            <button
              onClick={() => setFilterGender('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterGender === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todas as Vozes
            </button>
            <button
              onClick={() => setFilterGender('female')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterGender === 'female'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Narradoras (Femininas)
            </button>
            <button
              onClick={() => setFilterGender('male')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterGender === 'male'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Narradores (Masculinos)
            </button>
          </div>
        </div>

        {/* Voices List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredActors.map((actor) => {
            const isSelected = selectedActor === actor.id;
            const isTesting = previewingActor === actor.id;

            return (
              <div
                key={actor.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/70 shadow-sm ring-1 ring-amber-500'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                        actor.gender === 'female'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {actor.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-bold text-stone-900">
                          {actor.name}
                        </h3>
                        {isSelected && (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Voz Ativa</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-amber-800">{actor.tone}</p>
                    </div>
                  </div>

                  {/* Play Sample Button */}
                  <button
                    onClick={() => handleTestVoice(actor.id)}
                    disabled={isTesting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors shrink-0 disabled:opacity-50"
                    title="Ouvir amostra de voz deste narrador"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                        <span className="text-amber-700">Reproduzindo...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current text-amber-700" />
                        <span>Ouvir Amostra</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed font-sans">
                  {actor.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] italic text-stone-500 font-editorial truncate max-w-[240px]">
                    {actor.sampleQuote}
                  </span>

                  {!isSelected && (
                    <button
                      onClick={() => {
                        onSelectActor(actor.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-stone-800 text-white transition-colors shrink-0"
                    >
                      Escolher Esta Voz
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-200 bg-stone-100 text-xs text-stone-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Português do Brasil (pt-BR)</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
