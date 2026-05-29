/**
 * Audio reader usando a API nativa SpeechSynthesis.
 * Lê título + lide + corpo da notícia em pt-BR.
 */

export function initAudioReader({ container, title, lide, body }) {
  if (!container) return;

  // Feature detection
  if (!('speechSynthesis' in window)) {
    container.innerHTML = `<div class="audio-reader__error">Seu navegador não suporta leitura em voz alta.</div>`;
    return;
  }

  const synth = window.speechSynthesis;
  let utter = null;
  let chunks = [];
  let chunkIdx = 0;

  const btn = container.querySelector('.audio-reader__btn');
  const stopBtn = container.querySelector('.audio-reader__stop');
  const statusEl = container.querySelector('.audio-reader__status');
  const barFill = container.querySelector('.audio-reader__bar-fill');

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Divide em pedaços <= 200 chars para evitar truncamento no Chrome
  function splitChunks(text) {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const result = [];
    let buf = '';
    sentences.forEach(s => {
      const trimmed = s.trim();
      if (!trimmed) return;
      if ((buf + ' ' + trimmed).length > 200 && buf) {
        result.push(buf.trim());
        buf = trimmed;
      } else {
        buf = (buf + ' ' + trimmed).trim();
      }
    });
    if (buf) result.push(buf.trim());
    return result;
  }

  function buildChunks() {
    const text = [title, lide, stripHtml(body)].filter(Boolean).join('. ');
    chunks = splitChunks(text);
    chunkIdx = 0;
  }

  function speakChunk(i) {
    if (i >= chunks.length) {
      setState('idle');
      statusEl.textContent = 'Pronto para ouvir';
      barFill.style.width = '100%';
      setTimeout(() => { barFill.style.width = '0%'; }, 1000);
      return;
    }
    utter = new SpeechSynthesisUtterance(chunks[i]);
    utter.lang = 'pt-BR';
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    // tenta selecionar uma voz pt-BR
    const voices = synth.getVoices();
    const pt = voices.find(v => /pt[-_]?BR/i.test(v.lang)) || voices.find(v => /pt/i.test(v.lang));
    if (pt) utter.voice = pt;

    utter.onstart = () => {
      const perc = Math.round(((i + 0.5) / chunks.length) * 100);
      barFill.style.width = perc + '%';
    };
    utter.onend = () => {
      chunkIdx = i + 1;
      if (synth.speaking || synth.paused) return; // segurança
      speakChunk(chunkIdx);
    };
    utter.onerror = (e) => {
      console.warn('Erro de leitura:', e);
      setState('idle');
      statusEl.textContent = 'Erro na leitura.';
    };
    synth.speak(utter);
  }

  function setState(state) {
    container.setAttribute('data-state', state);
  }

  function start() {
    synth.cancel();
    if (!chunks.length) buildChunks();
    chunkIdx = 0;
    setState('playing');
    statusEl.textContent = `Lendo notícia · ${chunks.length} trechos`;
    speakChunk(0);
  }

  function pause() {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setState('paused');
      statusEl.textContent = 'Pausado · clique para continuar';
    }
  }

  function resume() {
    if (synth.paused) {
      synth.resume();
      setState('playing');
      statusEl.textContent = `Lendo notícia · trecho ${chunkIdx + 1} de ${chunks.length}`;
    }
  }

  function stop() {
    synth.cancel();
    setState('idle');
    statusEl.textContent = 'Pronto para ouvir';
    barFill.style.width = '0%';
    chunks = [];
    chunkIdx = 0;
  }

  btn.addEventListener('click', () => {
    const state = container.getAttribute('data-state');
    if (state === 'idle') start();
    else if (state === 'playing') pause();
    else if (state === 'paused') resume();
  });

  stopBtn.addEventListener('click', stop);

  // pausa se sair da página
  window.addEventListener('beforeunload', () => synth.cancel());

  // Algumas vozes carregam após onvoiceschanged
  if (synth.getVoices().length === 0) {
    synth.onvoiceschanged = () => synth.getVoices();
  }

  setState('idle');
  statusEl.textContent = 'Ouvir esta notícia';
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
