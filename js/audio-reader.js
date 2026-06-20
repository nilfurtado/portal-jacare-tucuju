/**
 * Vocaliza Plugin — Leitor de áudio para artigos
 * Torna o site inclusivo adicionando um player para ouvir a notícia em voz alta
 * Integra com SpeechSynthesis API do navegador
 */

export function initAudioReader({ container, title, lide, body }) {
  if (!container) return;

  // Verificar suporte a SpeechSynthesis
  const synth = window.speechSynthesis;
  if (!synth) {
    container.innerHTML = `<div class="audio-reader__error">Seu navegador não suporta leitura em voz alta.</div>`;
    return;
  }

  // Estado do player
  const state = {
    isPlaying: false,
    isPaused: false,
    utterance: null,
    chunks: [],
    currentChunk: 0
  };

  // Elementos DOM
  const playBtn = container.querySelector('.audio-reader__btn');
  const stopBtn = container.querySelector('.audio-reader__stop');
  const statusEl = container.querySelector('.audio-reader__status');
  const progressBar = container.querySelector('.audio-reader__bar-fill');

  // Utilitários
  const stripHtmlTags = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const splitIntoChunks = (text) => {
    const maxLen = 200;
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const result = [];
    let current = '';

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (!trimmed) return;

      const combined = current ? `${current} ${trimmed}` : trimmed;
      if (combined.length > maxLen && current) {
        result.push(current.trim());
        current = trimmed;
      } else {
        current = combined;
      }
    });

    if (current.trim()) result.push(current.trim());
    return result;
  };

  const setState = (newState) => {
    Object.assign(state, newState);
    updateUI();
  };

  const updateUI = () => {
    const playing = state.isPlaying && !state.isPaused;
    container.setAttribute('data-state', playing ? 'playing' : state.isPaused ? 'paused' : 'idle');
  };

  const selectVoice = () => {
    const voices = synth.getVoices();

    // Prioridade 1: Voz feminina pt-BR explícita
    let voice = voices.find(v => {
      const lang = v.lang.toLowerCase();
      const isBrazilianPortuguese = /pt[-_]br/i.test(lang) || lang.startsWith('pt-br') || lang.startsWith('pt_br');
      const isFemale = !v.name.toLowerCase().includes('male') &&
                      (v.name.toLowerCase().includes('female') ||
                       v.name.toLowerCase().includes('woman') ||
                       v.name.toLowerCase().includes('female'));
      return isBrazilianPortuguese && isFemale;
    });
    if (voice) return voice;

    // Prioridade 2: Qualquer voz pt-BR (feminina ou não)
    voice = voices.find(v => {
      const lang = v.lang.toLowerCase();
      return /pt[-_]br/i.test(lang) || lang.startsWith('pt-br') || lang.startsWith('pt_br');
    });
    if (voice) return voice;

    // Prioridade 3: Voz feminina português
    voice = voices.find(v => {
      const lang = v.lang.toLowerCase();
      const isFemale = !v.name.toLowerCase().includes('male') &&
                      (v.name.toLowerCase().includes('female') ||
                       v.name.toLowerCase().includes('woman'));
      return /^pt/.test(lang) && isFemale;
    });
    if (voice) return voice;

    // Fallback: primeira voz disponível
    return voices[0];
  };

  const speakNextChunk = () => {
    const { chunks, currentChunk } = state;

    if (currentChunk >= chunks.length) {
      setState({ isPlaying: false, isPaused: false, currentChunk: 0 });
      statusEl.textContent = 'Pronto para ouvir';
      progressBar.style.width = '100%';
      setTimeout(() => { progressBar.style.width = '0%'; }, 1000);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.voice = selectVoice();

    utterance.onstart = () => {
      const progress = Math.round(((currentChunk + 0.5) / chunks.length) * 100);
      progressBar.style.width = `${progress}%`;
    };

    utterance.onend = () => {
      if (state.isPlaying && !state.isPaused) {
        setState({ currentChunk: currentChunk + 1 });
        speakNextChunk();
      }
    };

    utterance.onerror = (e) => {
      console.error('[Vocaliza] Erro ao falar:', e);
      setState({ isPlaying: false, isPaused: false });
      statusEl.textContent = 'Erro na leitura.';
    };

    state.utterance = utterance;
    synth.speak(utterance);
  };

  const play = () => {
    synth.cancel();

    if (!state.chunks.length) {
      const fullText = [title, lide, stripHtmlTags(body)].filter(Boolean).join('. ');
      const chunks = splitIntoChunks(fullText);
      setState({ chunks, currentChunk: 0, isPlaying: true, isPaused: false });
      statusEl.textContent = `Lendo notícia · ${chunks.length} trechos`;
    } else {
      setState({ isPlaying: true, isPaused: false });
      statusEl.textContent = `Lendo notícia · trecho ${state.currentChunk + 1} de ${state.chunks.length}`;
    }

    speakNextChunk();
  };

  const pause = () => {
    if (state.isPlaying && !state.isPaused) {
      synth.pause();
      setState({ isPaused: true });
      statusEl.textContent = 'Pausado · clique para continuar';
    }
  };

  const resume = () => {
    if (state.isPaused) {
      synth.resume();
      setState({ isPaused: false });
      statusEl.textContent = `Lendo notícia · trecho ${state.currentChunk + 1} de ${state.chunks.length}`;
    }
  };

  const stop = () => {
    synth.cancel();
    setState({ isPlaying: false, isPaused: false, chunks: [], currentChunk: 0 });
    statusEl.textContent = 'Pronto para ouvir';
    progressBar.style.width = '0%';
  };

  // Event listeners
  playBtn.addEventListener('click', () => {
    if (!state.isPlaying) play();
    else if (!state.isPaused) pause();
    else resume();
  });

  stopBtn.addEventListener('click', stop);

  // Limpar ao sair da página
  window.addEventListener('beforeunload', () => synth.cancel());

  // Sincronizar vozes quando disponíveis
  if (synth.getVoices().length === 0) {
    synth.onvoiceschanged = () => synth.getVoices();
  }

  updateUI();
}

export function audioReaderTemplate() {
  return `
    <div class="audio-reader" data-state="idle">
      <button class="audio-reader__btn" type="button" aria-label="Ouvir notícia">
        <svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
        <svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
      </button>
      <div class="audio-reader__info">
        <span class="audio-reader__label">Áudio</span>
        <span class="audio-reader__status">Ouvir esta notícia</span>
      </div>
      <div class="audio-reader__bar"><div class="audio-reader__bar-fill"></div></div>
      <button class="audio-reader__stop" type="button" aria-label="Parar leitura">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12v12H6z"/></svg>
      </button>
    </div>
  `;
}
