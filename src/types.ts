export interface Chapter {
  id: string;
  number: number;
  title: string;
  rawText: string;
  cleanedText: string;
  wordCount: number;
  estimatedMinutes: number;
  cleanedStats: {
    pageNumbersRemoved: number;
    citationsRemoved: number;
    hyphensJoined: number;
  };
}

export interface Book {
  id: string;
  title: string;
  author: string;
  format: 'pdf' | 'epub' | 'sample';
  coverUrl?: string;
  coverAccentColor?: string;
  chapters: Chapter[];
  currentChapterIndex: number;
  description?: string;
}

export type DubbingEmotion = 'dramatic' | 'intimate' | 'suspense' | 'energetic';
export type VoiceActorName = 'Fenrir' | 'Kore' | 'Puck' | 'Zephyr' | 'Charon';

export interface NarratorSettings {
  rate: number; // 0.75 to 2.0
  pitch: number; // 0.8 to 1.2
  voiceURI?: string;
  voiceActor: VoiceActorName;
  emotionStyle: DubbingEmotion;
  volume: number;
  highlightSentences: boolean;
  autoPromptNext: boolean;
  readingTheme: 'paper' | 'sepia' | 'dark';
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  enableAmbientAcoustic: boolean;
}
