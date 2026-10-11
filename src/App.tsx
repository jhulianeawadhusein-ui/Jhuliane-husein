/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SAMPLE_BOOKS } from './lib/sampleBooks';
import { Book, Chapter, NarratorSettings } from './types';
import { speechEngine } from './lib/speechEngine';
import { cleanNarrationText } from './lib/cleaner';
import { TopBar } from './components/TopBar';
import { ReaderView } from './components/ReaderView';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { ChapterDrawer } from './components/ChapterDrawer';
import { UploadModal } from './components/UploadModal';
import { NarratorPromptModal } from './components/NarratorPromptModal';
import { CleanInspectorModal } from './components/CleanInspectorModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { VoiceActorsDrawer } from './components/VoiceActorsDrawer';
import { NarratorStudioChat } from './components/NarratorStudioChat';

export default function App() {
  const [books, setBooks] = useState<Book[]>(SAMPLE_BOOKS);
  const [activeBookId, setActiveBookId] = useState<string>(SAMPLE_BOOKS[0].id);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);

  // Audio state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDubbingLoading, setIsDubbingLoading] = useState<boolean>(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isChaptersOpen, setIsChaptersOpen] = useState<boolean>(false);
  const [isVoiceActorsOpen, setIsVoiceActorsOpen] = useState<boolean>(false);
  const [isNarratorStudioOpen, setIsNarratorStudioOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCleanInspectorOpen, setIsCleanInspectorOpen] = useState<boolean>(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);

  // Narrator settings
  const [settings, setSettings] = useState<NarratorSettings>({
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
  });

  const activeBook = useMemo(() => {
    return books.find((b) => b.id === activeBookId) || books[0];
  }, [books, activeBookId]);

  const currentChapter = useMemo(() => {
    return activeBook.chapters[currentChapterIndex] || activeBook.chapters[0];
  }, [activeBook, currentChapterIndex]);

  const nextChapter = useMemo(() => {
    if (currentChapterIndex < activeBook.chapters.length - 1) {
      return activeBook.chapters[currentChapterIndex + 1];
    }
    return undefined;
  }, [activeBook, currentChapterIndex]);

  const prevChapter = useMemo(() => {
    if (currentChapterIndex > 0) {
      return activeBook.chapters[currentChapterIndex - 1];
    }
    return undefined;
  }, [activeBook, currentChapterIndex]);

  const paragraphs = useMemo(() => {
    const text = currentChapter.cleanedText || currentChapter.rawText;
    return text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [currentChapter]);

  // Handle chapter completion callback
  const handleChapterFinished = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setIsPromptModalOpen(true);
  }, []);

  // Sync speech engine callbacks
  useEffect(() => {
    speechEngine.setCallbacks({
      onParagraphChange: (index) => {
        setCurrentParagraphIndex(index);
      },
      onStateChange: (playing, paused) => {
        setIsPlaying(playing);
        setIsPaused(paused);
      },
      onLoadingDubbing: (loading) => {
        setIsDubbingLoading(loading);
      },
      onChapterFinished: handleChapterFinished,
      onError: (err) => {
        console.warn('Erro na fala:', err);
      },
    });
  }, [handleChapterFinished]);

  // Load chapter into speech engine whenever chapter changes
  useEffect(() => {
    speechEngine.loadChapter(currentChapter, 0);
    setCurrentParagraphIndex(0);
  }, [currentChapter]);

  // Handle Proceed to Next Chapter
  const handleProceedNext = useCallback(() => {
    setIsPromptModalOpen(false);
    if (nextChapter) {
      const nextIdx = currentChapterIndex + 1;
      setCurrentChapterIndex(nextIdx);
      setTimeout(() => {
        speechEngine.loadChapter(activeBook.chapters[nextIdx], 0);
        speechEngine.play(0);
      }, 200);
    }
  }, [currentChapterIndex, nextChapter, activeBook]);

  // Handle Repeat Current Chapter
  const handleRepeatCurrent = useCallback(() => {
    setIsPromptModalOpen(false);
    speechEngine.loadChapter(currentChapter, 0);
    speechEngine.play(0);
  }, [currentChapter]);

  // Play controls
  const handlePlay = () => {
    speechEngine.play(currentParagraphIndex);
  };

  const handlePause = () => {
    speechEngine.pause();
  };

  const handleResume = () => {
    speechEngine.resume();
  };

  const handleParagraphClick = (index: number) => {
    setCurrentParagraphIndex(index);
    speechEngine.jumpToParagraph(index);
  };

  const handlePrevParagraph = () => {
    const newIdx = Math.max(0, currentParagraphIndex - 1);
    setCurrentParagraphIndex(newIdx);
    speechEngine.jumpToParagraph(newIdx);
  };

  const handleNextParagraph = () => {
    const newIdx = Math.min(paragraphs.length - 1, currentParagraphIndex + 1);
    setCurrentParagraphIndex(newIdx);
    speechEngine.jumpToParagraph(newIdx);
  };

  const handlePrevChapter = () => {
    if (prevChapter) {
      const prevIdx = currentChapterIndex - 1;
      setCurrentChapterIndex(prevIdx);
      speechEngine.stop();
    }
  };

  const handleNextChapter = () => {
    if (nextChapter) {
      const nextIdx = currentChapterIndex + 1;
      setCurrentChapterIndex(nextIdx);
      speechEngine.stop();
    }
  };

  const handleChangeRate = (newRate: number) => {
    setSettings((prev) => ({ ...prev, rate: newRate }));
    speechEngine.setSettings({ rate: newRate });
  };

  const handleUpdateSettings = (newSettings: Partial<NarratorSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    speechEngine.setSettings(newSettings);
  };

  const handleBookLoaded = (newBook: Book) => {
    setBooks((prev) => [newBook, ...prev]);
    setActiveBookId(newBook.id);
    setCurrentChapterIndex(0);
    speechEngine.stop();
  };

  const handleUpdateCleanedText = (newCleanedText: string) => {
    const updatedChapters = [...activeBook.chapters];
    updatedChapters[currentChapterIndex] = {
      ...currentChapter,
      cleanedText: newCleanedText,
    };
    const updatedBook = {
      ...activeBook,
      chapters: updatedChapters,
    };
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    speechEngine.loadChapter(updatedChapters[currentChapterIndex], currentParagraphIndex);
  };

  const handleLoadNewPastedChapter = (title: string, rawText: string) => {
    const clean = cleanNarrationText(rawText);
    const words = clean.cleanedText.split(/\s+/).filter(Boolean).length;
    const newChapter: Chapter = {
      id: `pasted-ch-${Date.now()}`,
      number: activeBook.chapters.length + 1,
      title: title || `Capítulo ${activeBook.chapters.length + 1}`,
      rawText,
      cleanedText: clean.cleanedText,
      wordCount: words,
      estimatedMinutes: Math.max(1, Math.round(words / 130)),
      cleanedStats: clean.stats,
    };

    const updatedBook = {
      ...activeBook,
      chapters: [...activeBook.chapters, newChapter],
    };

    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    setCurrentChapterIndex(updatedBook.chapters.length - 1);
    speechEngine.loadChapter(newChapter, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-200">
      {/* 3-Zone Header Contract */}
      <TopBar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenChapters={() => setIsChaptersOpen(true)}
        onOpenVoiceActors={() => setIsVoiceActorsOpen(true)}
        onOpenNarratorStudio={() => setIsNarratorStudioOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentBookTitle={activeBook.title}
        currentChapterTitle={currentChapter.title}
        currentVoiceActor={settings.voiceActor}
      />

      {/* Main Editorial Reader View */}
      <main className="flex-1">
        <ReaderView
          book={activeBook}
          chapter={currentChapter}
          currentParagraphIndex={currentParagraphIndex}
          isPlaying={isPlaying}
          settings={settings}
          paragraphs={paragraphs}
          hasNextChapter={!!nextChapter}
          nextChapterTitle={nextChapter?.title}
          onParagraphClick={handleParagraphClick}
          onStartReading={handlePlay}
          onNextChapter={handleProceedNext}
          onRepeatChapter={handleRepeatCurrent}
          onOpenCleanInspector={() => setIsCleanInspectorOpen(true)}
        />
      </main>

      {/* Sticky Bottom Audio Player Bar */}
      <AudioPlayerBar
        isPlaying={isPlaying}
        isPaused={isPaused}
        isDubbingLoading={isDubbingLoading}
        currentChapter={currentChapter}
        currentParagraphIndex={currentParagraphIndex}
        totalParagraphs={paragraphs.length}
        hasPrevChapter={!!prevChapter}
        hasNextChapter={!!nextChapter}
        playbackRate={settings.rate}
        selectedEmotion={settings.emotionStyle}
        selectedActor={settings.voiceActor}
        onPlay={handlePlay}
        onPause={handlePause}
        onResume={handleResume}
        onPrevParagraph={handlePrevParagraph}
        onNextParagraph={handleNextParagraph}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onChangeRate={handleChangeRate}
        onChangeEmotion={(emo) => handleUpdateSettings({ emotionStyle: emo })}
        onChangeActor={(actor) => handleUpdateSettings({ voiceActor: actor })}
        onOpenCleanInspector={() => setIsCleanInspectorOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Chapter Completion Prompt Modal */}
      <NarratorPromptModal
        isOpen={isPromptModalOpen}
        completedChapter={currentChapter}
        nextChapter={nextChapter}
        onProceedNext={handleProceedNext}
        onRepeat={handleRepeatCurrent}
        onClose={() => setIsPromptModalOpen(false)}
      />

      {/* Chapter Navigation Drawer */}
      <ChapterDrawer
        isOpen={isChaptersOpen}
        book={activeBook}
        allBooks={books}
        currentChapterIndex={currentChapterIndex}
        onSelectChapter={(idx) => {
          setCurrentChapterIndex(idx);
          speechEngine.stop();
        }}
        onSelectBook={(bookId) => {
          setActiveBookId(bookId);
          setCurrentChapterIndex(0);
          speechEngine.stop();
        }}
        onClose={() => setIsChaptersOpen(false)}
      />

      {/* Voice Actors Cast Drawer */}
      <VoiceActorsDrawer
        isOpen={isVoiceActorsOpen}
        selectedActor={settings.voiceActor}
        selectedEmotion={settings.emotionStyle}
        onSelectActor={(actor) => {
          handleUpdateSettings({ voiceActor: actor });
          if (isPlaying) {
            speechEngine.stop();
            setTimeout(() => speechEngine.play(currentParagraphIndex), 150);
          }
        }}
        onClose={() => setIsVoiceActorsOpen(false)}
      />

      {/* PDF & EPUB File Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onBookLoaded={handleBookLoaded}
        onClose={() => setIsUploadOpen(false)}
      />

      {/* Clean Text & Noise Inspector Modal */}
      <CleanInspectorModal
        isOpen={isCleanInspectorOpen}
        chapter={currentChapter}
        onClose={() => setIsCleanInspectorOpen(false)}
        onUpdateCleanedText={handleUpdateCleanedText}
      />

      {/* Voice & Typography Preferences */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Narrator Studio Chat */}
      <NarratorStudioChat
        isOpen={isNarratorStudioOpen}
        book={activeBook}
        currentChapter={currentChapter}
        onProceedNextChapter={handleProceedNext}
        onPlayCurrentChapter={handlePlay}
        onSelectChapter={(idx) => {
          setCurrentChapterIndex(idx);
          speechEngine.stop();
        }}
        onLoadNewPastedChapter={handleLoadNewPastedChapter}
        onClose={() => setIsNarratorStudioOpen(false)}
      />
    </div>
  );
}
