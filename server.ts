import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI server-side with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: AI-assisted text cleaning and audiobook preparation
app.post('/api/gemini/clean-text', async (req: Request, res: Response) => {
  try {
    const { rawText, chapterTitle } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({ error: 'Texto não fornecido.' });
      return;
    }

    if (!apiKey) {
      // Fallback to heuristic cleaner if no API key
      res.json({ cleanedText: heuristicClean(rawText) });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Você é um editor sênior de audiobooks. Sua tarefa é preparar e limpar o seguinte texto do capítulo "${chapterTitle || 'Capítulo'}" para narração em voz alta.
REGRAS OBRIGATÓRIAS:
1. Remova completamente números de página isolados (ex: "12", "- 45 -", "Página 10").
2. Remova referências bibliográficas, colchetes de citação (ex: "[1]", "[24-26]", "(SILVA, 2020, p. 12)") e notas de rodapé sem perder o fluxo da prosa narrativa.
3. Junte palavras quebradas por hifenização de fim de linha (ex: "cons- trução" -> "construção").
4. Remova cabeçalhos repetidos e rodapés de livro.
5. Mantenha 100% da integridade da obra literária, pontuação expressiva e diálogos originais. Não resuma e não invente conteúdo.
6. Retorne APENAS o texto limpo, sem comentários adicionais.

Texto a limpar:
${rawText.slice(0, 30000)}`,
    });

    res.json({
      cleanedText: response.text || rawText,
    });
  } catch (err: unknown) {
    console.error('Erro na limpeza com Gemini:', err);
    // Graceful fallback to heuristic clean
    res.json({ cleanedText: heuristicClean(req.body.rawText || '') });
  }
});

// Endpoint: Professional Narrator Chat / Assistant
app.post('/api/gemini/narrator-chat', async (req: Request, res: Response) => {
  try {
    const { message, currentChapter, bookTitle, history } = req.body;

    if (!apiKey) {
      res.json({
        reply: `Com certeza! Como seu narrador profissional, estou pronto para conduzir a leitura do ${currentChapter?.title || 'capítulo atual'} de "${bookTitle || 'seu livro'}". Deseja que eu inicie a narração limpa agora?`,
      });
      return;
    }

    const systemInstruction = `Você é um narrador profissional de audiobooks experiente, caloroso, erudito e expressivo em língua portuguesa.
Sua missão:
- Ajudar o ouvinte/leitor a apreciar a obra literária.
- Quando o usuário perguntar ou pedir para ler um capítulo, confirme com postura elegante de narrador.
- Quando terminar um capítulo, sempre certifique-se e pergunte: "Posso prosseguir para o próximo capítulo?".
- Explique nuances de vocabulário ou personagens se solicitado.
- Seja sempre solícito, pontual e cortês, falando como uma grande voz do rádio e do teatro clássico.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'narrator' ? 'model' : 'user',
          parts: [{ text: h.text }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [
        {
          text: `[Contexto: Livro "${bookTitle || 'Sem título'}", Capítulo atual: "${currentChapter?.title || 'Nenhum'}"]\nPergunta/Pedido do leitor: ${message}`,
        },
      ],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || 'Estou pronto para prosseguir com a leitura.',
    });
  } catch (err: unknown) {
    console.error('Erro no chat com narrador:', err);
    res.json({
      reply: 'Perfeito. Como seu narrador, estou a postos para dar continuidade à nossa leitura. Podemos prosseguir?',
    });
  }
});

// Simple in-memory cache for generated dubbing audio chunks
const audioCache = new Map<string, { audioBase64: string; mimeType: string }>();

// Endpoint: Emotional Dubbing Audio Synthesis (returns audio/wav)
app.post('/api/gemini/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Fenrir', style, emotion = 'dramatic' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Texto não fornecido.' });
      return;
    }

    const cleanInput = text.trim().slice(0, 1200);
    const cacheKey = `${voiceName}_${emotion}_${cleanInput}`;

    if (audioCache.has(cacheKey)) {
      res.json(audioCache.get(cacheKey));
      return;
    }

    if (!apiKey) {
      res.status(503).json({ error: 'Gemini API Key não configurada no servidor. Usando síntese expressiva do navegador.' });
      return;
    }

    const emotionDirectives: Record<string, string> = {
      dramatic:
        'Dublador e ator de voz brasileiro interpretando um grande clássico. Leitura calorosa, humana, com interpretação teatral das falas e sentimentos, pausas dramáticas de respiração e modulação dinâmica entre ironia e comoção.',
      intimate:
        'Ator de voz brasileiro com timbre aveludado, ritmo pausado, tom confessional, íntimo e reflexivo, como se estivesse sussurrando memórias vívidas ao pé do ouvido.',
      suspense:
        'Interpretação tensa e misteriosa em português do Brasil, ritmo contido, pausas marcantes de expectativa, sussurros dramáticos e inflexões de sobressalto.',
      energetic:
        'Dublagem vibrante e apaixonada em português do Brasil, ritmo vivo, entusiasmo contagiante e destaque radiante para as interações dos personagens.',
    };

    const finalStyle = style || emotionDirectives[emotion] || emotionDirectives.dramatic;

    let response;
    try {
      // First attempt: Flagship audio model for maximum emotional acting
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanInput,
                speechMetadata: {
                  style: finalStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Fenrir' },
            },
          },
        },
      });
    } catch {
      // Graceful fallback to flash-lite-tts
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanInput,
                speechMetadata: {
                  style: finalStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Fenrir' },
            },
          },
        },
      });
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const result = { audioBase64: base64Audio, mimeType: 'audio/wav' };
      // Cache the result
      audioCache.set(cacheKey, result);
      if (audioCache.size > 200) {
        const firstKey = audioCache.keys().next().value;
        if (firstKey) audioCache.delete(firstKey);
      }
      res.json(result);
    } else {
      res.status(500).json({ error: 'Nenhum áudio gerado pelo modelo.' });
    }
  } catch (err: unknown) {
    console.error('Erro na síntese TTS Gemini:', err);
    res.status(500).json({ error: 'Falha na geração de áudio via API.' });
  }
});

// Heuristic cleaning function for instant client/server cleaning
function heuristicClean(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove standalone page numbers: e.g. " 45 ", "- 45 -", "[45]", "Página 12 de 300"
      .replace(/^[ \t]*(?:p[áa]gina\s+\d+(?:\s+de\s+\d+)?|-?\s*\d+\s*-?)[ \t]*$/gim, '')
      // Remove citations like [1], [1, 2], [1-5], [p. 45]
      .replace(/\[\s*(?:\d+[\s,\-–\d]*|p\.\s*\d+)\s*\]/g, '')
      // Remove parenthetical citations: e.g. (SILVA, 2019), (SANTOS et al., 2021, p. 12)
      .replace(/\([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+,\s*\d{4}(?:,\s*p\.\s*\d+)?\)/g, '')
      // Fix line break hyphenations: "tra- \n balho" -> "trabalho"
      .replace(/(\p{L}+)-\s*\n\s*(\p{L}+)/gu, '$1$2')
      // Collapse repeated newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

// Development and production Vite mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Audiobook Narrator Server rodando na porta ${port}`);
  });
}

startServer();
