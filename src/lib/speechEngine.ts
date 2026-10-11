import { Chapter, NarratorSettings, DubbingEmotion, VoiceActorName } from '../types';

export interface SpeechCallbacks {
  onParagraphChange: (index: number) => void;
  onStateChange: (isPlaying: boolean, isPaused: boolean) => void;
  onChapterFinished: () => void;
  onLoadingDubbing?: (isLoading: boolean) => void;
  onError: (error: string) => void;
}

export type NarrationEngineMode = 'gemini' | 'browser';

export class AudiobookSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private paragraphs: string[] = [];
  private currentParagraphIndex: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private callbacks: SpeechCallbacks | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private engineMode: NarrationEngineMode = 'gemini';
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Pre-fetched audio buffer: paragraph index -> Audio object
  private prefetchBuffer = new Map<number, HTMLAudioElement>();

  // Subtle acoustic ambience
  private audioCtx: AudioContext | null = null;
  private ambientGainNode: GainNode | null = null;

  private settings: NarratorSettings = {
    rate: 1.0,
    pitch: 1.0,
    voiceActor: 'Fenrir',
    emotionStyle: 'dramatic',
    volume: 1.0,
    highlightSentences: true,
    autoPromptNext: true,
    readingTheme: 'paper',
    fontSize: 'base',
    enableAmbientAcoustic: true,
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.getAvailableVoices();
        };
      }
    }
  }

  public setCallbacks(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
  }

  public setSettings(settings: Partial<NarratorSettings>) {
    this.settings = { ...this.settings, ...settings };
    if (this.currentUtterance) {
      this.currentUtterance.rate = this.settings.rate;
      this.currentUtterance.pitch = this.settings.pitch;
      this.currentUtterance.volume = this.settings.volume;
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.playbackRate = this.settings.rate;
      this.currentAudioElement.volume = this.settings.volume;
    }
  }

  public getSettings(): NarratorSettings {
    return this.settings;
  }

  public setEngineMode(mode: NarrationEngineMode) {
    this.engineMode = mode;
  }

  public getEngineMode(): NarrationEngineMode {
    return this.engineMode;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    return voices.sort((a, b) => {
      const aIsPtBr = a.lang === 'pt-BR' || a.lang === 'pt_BR';
      const bIsPtBr = b.lang === 'pt-BR' || b.lang === 'pt_BR';
      if (aIsPtBr && !bIsPtBr) return -1;
      if (!aIsPtBr && bIsPtBr) return 1;

      const aIsPt = a.lang.toLowerCase().startsWith('pt');
      const bIsPt = b.lang.toLowerCase().startsWith('pt');
      if (aIsPt && !bIsPt) return -1;
      if (!aIsPt && bIsPt) return 1;

      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Previews a narrator voice by speaking a sample phrase
   */
  public async previewNarratorVoice(
    actor: VoiceActorName,
    emotion: DubbingEmotion = 'dramatic'
  ): Promise<void> {
    this.stop();
    const sampleText =
      actor === 'Kore' || actor === 'Zephyr'
        ? 'Olá! Sou sua narradora. Conduzirei a leitura do seu livro com sentimento vivo e fidelidade ao pé da letra.'
        : 'Olá! Sou seu narrador. Conduzirei a leitura do seu livro com sentimento vivo e fidelidade ao pé da letra.';

    if (this.engineMode === 'gemini') {
      try {
        const res = await fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: sampleText,
            voiceName: actor,
            emotion,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
            audio.playbackRate = this.settings.rate;
            audio.volume = this.settings.volume;
            this.currentAudioElement = audio;
            await audio.play();
            return;
          }
        }
      } catch (err) {
        console.warn('Erro ao testar voz Gemini:', err);
      }
    }

    // Fallback: browser speech
    if (this.synth) {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.lang = 'pt-BR';
      const voices = this.synth.getVoices();
      const ptVoice =
        voices.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
      if (ptVoice) utterance.voice = ptVoice;
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      this.synth.speak(utterance);
    }
  }

  public loadChapter(chapter: Chapter, startIndex: number = 0) {
    this.stop();
    this.prefetchBuffer.clear();
    const text = chapter.cleanedText || chapter.rawText;
    this.paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    this.currentParagraphIndex = Math.min(startIndex, Math.max(0, this.paragraphs.length - 1));

    // Start prefetching first 2 paragraphs in background if in gemini mode
    if (this.engineMode === 'gemini') {
      this.prefetchParagraph(this.currentParagraphIndex);
      this.prefetchParagraph(this.currentParagraphIndex + 1);
    }
  }

  public async play(paragraphIndex?: number) {
    if (paragraphIndex !== undefined) {
      this.currentParagraphIndex = paragraphIndex;
    }

    if (this.paragraphs.length === 0) {
      this.callbacks?.onError('Nenhum texto disponível para a dublagem.');
      return;
    }

    if (this.isPaused) {
      if (this.currentAudioElement && this.currentAudioElement.paused) {
        this.currentAudioElement.play();
        this.isPaused = false;
        this.isPlaying = true;
        this.callbacks?.onStateChange(true, false);
        return;
      }
      if (this.synth && this.synth.paused) {
        this.synth.resume();
        this.isPaused = false;
        this.isPlaying = true;
        this.callbacks?.onStateChange(true, false);
        this.startAndroidHeartbeat();
        return;
      }
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.callbacks?.onStateChange(true, false);
    this.startAndroidHeartbeat();

    this.speakCurrentParagraph();
  }

  public pause() {
    this.clearAndroidHeartbeat();
    if (this.currentAudioElement && !this.currentAudioElement.paused) {
      this.currentAudioElement.pause();
    }
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
    this.isPaused = true;
    this.isPlaying = false;
    this.callbacks?.onStateChange(false, true);
  }

  public resume() {
    if (this.currentAudioElement && this.currentAudioElement.paused) {
      this.currentAudioElement.play();
      this.isPaused = false;
      this.isPlaying = true;
      this.callbacks?.onStateChange(true, false);
      return;
    }
    if (this.synth) {
      this.synth.resume();
      this.isPaused = false;
      this.isPlaying = true;
      this.callbacks?.onStateChange(true, false);
      this.startAndroidHeartbeat();
    }
  }

  public stop() {
    this.clearAndroidHeartbeat();
    this.callbacks?.onLoadingDubbing?.(false);
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.callbacks?.onStateChange(false, false);
  }

  public jumpToParagraph(index: number) {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.currentParagraphIndex = Math.max(0, Math.min(index, this.paragraphs.length - 1));
    this.callbacks?.onParagraphChange(this.currentParagraphIndex);
    if (wasPlaying) {
      this.play();
    }
  }

  public getCurrentParagraphIndex(): number {
    return this.currentParagraphIndex;
  }

  public getParagraphs(): string[] {
    return this.paragraphs;
  }

  private startAndroidHeartbeat() {
    this.clearAndroidHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 12000);
  }

  private clearAndroidHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Background pre-fetch of dubbing audio
   */
  private async prefetchParagraph(index: number): Promise<HTMLAudioElement | null> {
    if (index >= this.paragraphs.length || this.prefetchBuffer.has(index)) {
      return this.prefetchBuffer.get(index) || null;
    }

    const text = this.paragraphs[index];
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: this.settings.voiceActor,
          emotion: this.settings.emotionStyle,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      if (!data.audioBase64) return null;

      const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
      this.prefetchBuffer.set(index, audio);
      return audio;
    } catch {
      return null;
    }
  }

  /**
   * Speaks the current paragraph with expressive acting
   */
  private async speakCurrentParagraph() {
    if (!this.isPlaying) return;

    if (this.currentParagraphIndex >= this.paragraphs.length) {
      this.onFinishedChapter();
      return;
    }

    const currentText = this.paragraphs[this.currentParagraphIndex];
    this.callbacks?.onParagraphChange(this.currentParagraphIndex);

    // Trigger pre-fetching for next paragraph immediately
    this.prefetchParagraph(this.currentParagraphIndex + 1);

    // Try Gemini Emotional Dubbing first
    if (this.engineMode === 'gemini') {
      this.callbacks?.onLoadingDubbing?.(true);
      try {
        let audio = this.prefetchBuffer.get(this.currentParagraphIndex) || null;
        if (!audio) {
          audio = await this.prefetchParagraph(this.currentParagraphIndex);
        }

        if (audio && this.isPlaying) {
          this.callbacks?.onLoadingDubbing?.(false);
          this.currentAudioElement = audio;
          audio.playbackRate = this.settings.rate;
          audio.volume = this.settings.volume;

          audio.onended = () => {
            if (!this.isPlaying) return;
            this.currentParagraphIndex++;
            this.speakCurrentParagraph();
          };

          audio.onerror = () => {
            console.warn('Erro na reprodução do áudio de estúdio, usando voz expressiva.');
            this.playDramaticBrowserUtterance(currentText);
          };

          await audio.play();
          return;
        }
      } catch (err) {
        console.warn('Falha na dublagem Gemini, ativando interpretação vocal local:', err);
      }
      this.callbacks?.onLoadingDubbing?.(false);
    }

    // Dramatic fallback using browser SpeechSynthesis with human acting prosody
    this.playDramaticBrowserUtterance(currentText);
  }

  /**
   * Expressive reading: differentiates narrative prose from character dialogues
   */
  private playDramaticBrowserUtterance(text: string) {
    if (!this.synth) {
      this.callbacks?.onError('Síntese de voz não suportada.');
      return;
    }

    this.synth.cancel();

    const isDialogue = text.startsWith('—') || text.startsWith('-') || text.includes('—');
    const isQuestion = text.includes('?');
    const isExclamation = text.includes('!');

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;
    utterance.lang = 'pt-BR';

    // Voice selection: prioritize Brazilian Portuguese
    const voices = this.synth.getVoices();
    let ptBrVoice =
      voices.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('pt')) ||
      voices[0];

    if (this.settings.voiceURI) {
      const selected = voices.find((v) => v.voiceURI === this.settings.voiceURI);
      if (selected) ptBrVoice = selected;
    }

    if (ptBrVoice) utterance.voice = ptBrVoice;

    // Apply acting prosody modulation
    let adjustedPitch = this.settings.pitch;
    let adjustedRate = this.settings.rate;

    if (this.settings.emotionStyle === 'dramatic') {
      if (isDialogue) {
        adjustedPitch *= 1.08; // Character dialogues spoken with higher animation
        adjustedRate *= 1.02;
      } else {
        adjustedPitch *= 0.96; // Narrative voice has deeper resonance
        adjustedRate *= 0.96;
      }
    } else if (this.settings.emotionStyle === 'intimate') {
      adjustedPitch *= 0.94;
      adjustedRate *= 0.88; // Slower, confessional, whisper-like cadence
    } else if (this.settings.emotionStyle === 'suspense') {
      adjustedRate *= 0.9;
      adjustedPitch *= isQuestion ? 1.06 : 0.95;
    } else if (this.settings.emotionStyle === 'energetic') {
      adjustedRate *= 1.08;
      adjustedPitch *= isExclamation ? 1.12 : 1.02;
    }

    utterance.pitch = Math.max(0.7, Math.min(1.4, adjustedPitch));
    utterance.rate = Math.max(0.7, Math.min(1.5, adjustedRate));
    utterance.volume = this.settings.volume;

    utterance.onend = () => {
      if (!this.isPlaying) return;
      this.currentParagraphIndex++;
      this.speakCurrentParagraph();
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      if (this.isPlaying) {
        this.currentParagraphIndex++;
        this.speakCurrentParagraph();
      }
    };

    this.synth.speak(utterance);
  }

  private onFinishedChapter() {
    this.stop();

    // Spoken completion prompt by narrator in pt-BR
    if (this.settings.autoPromptNext && this.synth) {
      const closingUtterance = new SpeechSynthesisUtterance(
        'Capítulo concluído com sucesso. Deseja que eu prossiga para a leitura do próximo capítulo?'
      );
      closingUtterance.lang = 'pt-BR';
      closingUtterance.rate = 1.0;
      closingUtterance.pitch = 1.0;

      const voices = this.synth.getVoices();
      const ptVoice =
        voices.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
      if (ptVoice) closingUtterance.voice = ptVoice;

      this.synth.speak(closingUtterance);
    }

    this.callbacks?.onChapterFinished();
  }
}

export const speechEngine = new AudiobookSpeechEngine();
