import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Volume2, Sparkles, Paperclip, Check } from 'lucide-react';
import { Chapter, Book } from '../types';
import { cleanNarrationText } from '../lib/cleaner';

interface NarratorStudioChatProps {
  isOpen: boolean;
  book: Book;
  currentChapter: Chapter;
  onProceedNextChapter: () => void;
  onPlayCurrentChapter: () => void;
  onSelectChapter: (index: number) => void;
  onLoadNewPastedChapter: (title: string, text: string) => void;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'narrator';
  text: string;
  time: string;
  isActionableText?: boolean;
}

export const NarratorStudioChat: React.FC<NarratorStudioChatProps> = ({
  isOpen,
  book,
  currentChapter,
  onProceedNextChapter,
  onPlayCurrentChapter,
  onSelectChapter,
  onLoadNewPastedChapter,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'narrator',
      text: `Olá! Sou seu narrador profissional de audiobooks em língua portuguesa do Brasil (pt-BR). Estou a postos com "${book.title}" no ${currentChapter.title}. Você pode me pedir para ler qualquer capítulo, enviar um arquivo PDF/EPUB, ou colar o texto de um novo capítulo diretamente aqui neste campo de mensagens! Sempre lerei na íntegra ao pé da letra com toda a emoção. Ao terminar o capítulo, perguntarei se posso prosseguir para o próximo. Como deseja começar?`,
      time: 'Agora',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsSending(true);

    const lower = text.toLowerCase();

    // Check if user pasted a long block of text (e.g. over 120 characters or with newlines)
    if (text.length > 120 || text.includes('\n\n')) {
      const clean = cleanNarrationText(text);
      const title = text.split('\n')[0].slice(0, 40).trim() || 'Texto Encaminhado';

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `n-${Date.now()}`,
            sender: 'narrator',
            text: `Recebi o texto que você encaminhou! Removi ${clean.stats.pageNumbersRemoved} números de página e ${clean.stats.citationsRemoved} referências bibliográficas. O texto está limpo e pronto para ser narrado ao pé da letra na íntegra. Carreguei este trecho como o capítulo ativo. Posso iniciar a narração agora?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isActionableText: true,
          },
        ]);
        onLoadNewPastedChapter(title, text);
        setIsSending(false);
      }, 500);
      return;
    }

    // Check for quick user intents:
    if (
      lower.includes('prosseguir') ||
      lower.includes('pode ir') ||
      lower.includes('próximo') ||
      lower.includes('pode prosseguir') ||
      lower === 'sim' ||
      lower === 'pode'
    ) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `n-${Date.now()}`,
            sender: 'narrator',
            text: 'Perfeito! Prosseguindo para o próximo capítulo agora com a narração limpa ao pé da letra.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsSending(false);
        onProceedNextChapter();
      }, 500);
      return;
    }

    if (lower.includes('ler') || lower.includes('iniciar') || lower.includes('começar') || lower.includes('toque')) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `n-${Date.now()}`,
            sender: 'narrator',
            text: `Iniciando a leitura integral do ${currentChapter.title} com emoção e sem cortes.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsSending(false);
        onPlayCurrentChapter();
      }, 500);
      return;
    }

    // Call server Gemini narrator chat endpoint
    try {
      const res = await fetch('/api/gemini/narrator-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          bookTitle: book.title,
          currentChapter: {
            title: currentChapter.title,
            number: currentChapter.number,
          },
          history: messages.slice(-4).map((m) => ({
            role: m.sender,
            text: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `n-${Date.now()}`,
            sender: 'narrator',
            text: data.reply || 'Compreendo perfeitamente. Deseja que eu leia o capítulo agora?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('Erro na resposta');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `n-${Date.now()}`,
          sender: 'narrator',
          text: `Como seu narrador em português do Brasil, estou a postos para ler o ${currentChapter.title} na íntegra ou receber novos textos. Deseja que eu inicie a narração?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    'Pode ler o capítulo agora',
    'Sim, pode prosseguir para o próximo',
    'Repetir este capítulo',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-50 h-full flex flex-col shadow-2xl border-l border-stone-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 px-6 border-b border-stone-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-stone-900">
                Estúdio do Narrador (pt-BR)
              </h2>
              <p className="text-xs text-stone-500">
                Envie comandos ou cole textos e capítulos aqui
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

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-amber-600 text-white rounded-br-none'
                    : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none font-editorial'
                }`}
              >
                {m.text}

                {m.isActionableText && (
                  <div className="mt-3 pt-2 border-t border-stone-200">
                    <button
                      onClick={() => onPlayCurrentChapter()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-amber-700 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Iniciar Narração Agora</span>
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-stone-400 mt-1 px-1">{m.time}</span>
            </div>
          ))}
          {isSending && (
            <div className="flex items-center gap-2 text-xs text-stone-400 italic pl-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>O narrador está processando...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-2 px-4 bg-stone-100 border-t border-stone-200 flex items-center gap-2 overflow-x-auto">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="text-xs px-2.5 py-1 bg-white hover:bg-stone-200/70 border border-stone-200 text-stone-700 rounded-md whitespace-nowrap transition-colors shrink-0"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input box supporting typing, questions, and full text pasting */}
        <div className="p-4 bg-white border-t border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              rows={2}
              placeholder="Digite um pedido ou cole o texto de um capítulo aqui para narrar..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 px-3.5 py-2 text-xs bg-stone-100 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-sans"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isSending}
              className="p-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 disabled:opacity-30 transition-transform active:scale-95 shrink-0"
              title="Enviar mensagem ou texto"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-stone-400 mt-1.5">
            Dica: Cole qualquer texto com números de página ou notas que o narrador limpa e lê na íntegra.
          </p>
        </div>
      </div>
    </div>
  );
};
