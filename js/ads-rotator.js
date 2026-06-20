/**
 * ADS ROTATOR
 * Rotação automática de anúncios do mesmo tipo
 * com transições suaves a cada X segundos
 */

// Base das imagens (usa painel ou relativa)
function imgBase() {
  // Para localhost ou 127.0.0.1:8000 (Portal), as imagens vêm de localhost:3000 (Painel DM)
  if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && location.port === '8000') {
    return 'http://localhost:3000'; // Imagens do Painel DM
  }
  // Para produção, usar URLs relativas ou domínio completo conforme necessário
  return '';
}

class AdsRotator {
  constructor(options = {}) {
    this.interval = options.interval || 8000; // 8 segundos (padrão para rotação de anúncios)
    this.anuncios = [];
    this.posicao = {};
    this.timers = {};
    this.currentAd = {};
    this.anunciosAgrupados = {};
  }

  /**
   * Inicializar rotador com lista de anúncios
   */
  init(anuncios) {
    this.anuncios = anuncios || [];
    this.agruparPorTipo();
    this.iniciarRotacao();
  }

  /**
   * Agrupar anúncios por tipo para rotação
   */
  agruparPorTipo() {
    this.anunciosAgrupados = {};

    this.anuncios.forEach(ad => {
      if (!this.anunciosAgrupados[ad.tipo]) {
        this.anunciosAgrupados[ad.tipo] = [];
        this.posicao[ad.tipo] = 0;
        this.currentAd[ad.tipo] = null;
      }
      // Apenas anúncios ativos entram na rotação (com ou sem imagem)
      if (ad.ativo) {
        this.anunciosAgrupados[ad.tipo].push(ad);
      }
    });

    console.log('✅ Anúncios agrupados por tipo:', this.anunciosAgrupados);
  }

  /**
   * Iniciar exibição estática de anúncios (sem rotação)
   * Exibe apenas o primeiro anúncio de cada tipo
   */
  iniciarRotacao() {
    Object.keys(this.anunciosAgrupados).forEach(tipo => {
      const lista = this.anunciosAgrupados[tipo];
      if (lista.length >= 1) {
        // Exibir primeiro anúncio apenas (sem rotação automática)
        this.exibirAnuncio(tipo, lista[0]);
        console.log(`✅ Anúncio exibido (estático) para ${tipo}: ${lista[0].nome}`);
      }
    });
  }

  /**
   * Rotacionar para próximo anúncio
   */
  rotarProximo(tipo) {
    const lista = this.anunciosAgrupados[tipo];
    if (lista.length <= 1) return;

    const atual = this.currentAd[tipo];
    const elemento = document.querySelector(`[data-ad-type="${tipo}"] .banner-ad`);

    if (!elemento) return;

    // Sair com transição
    elemento.classList.add('ad-rotating', 'out');

    setTimeout(() => {
      // Avançar posição
      this.posicao[tipo] = (this.posicao[tipo] + 1) % lista.length;
      const proximo = lista[this.posicao[tipo]];

      // Exibir novo
      this.exibirAnuncio(tipo, proximo);

      // Entrar com transição
      elemento.classList.remove('out');
      elemento.classList.add('ad-rotating');

      setTimeout(() => {
        elemento.classList.remove('ad-rotating');
      }, 500);

      console.log(`🔄 ${tipo}: rotacionado para ${proximo.nome}`);
    }, 500);
  }

  /**
   * Exibir anúncio específico
   */
  exibirAnuncio(tipo, anuncio) {
    if (!anuncio) {
      console.log(`[ads-rotator] ❌ Anúncio nulo para tipo: ${tipo}`);
      return;
    }

    const elemento = document.querySelector(`[data-ad-type="${tipo}"] .banner-ad`);
    if (!elemento) {
      console.log(`[ads-rotator] ❌ Elemento não encontrado para tipo: ${tipo}`);
      console.log(`[ads-rotator] Procurando: [data-ad-type="${tipo}"] .banner-ad`);
      return;
    }
    console.log(`[ads-rotator] ✅ Renderizando em:`, elemento);

    this.currentAd[tipo] = anuncio;

    // Limpar conteúdo
    elemento.innerHTML = '';

    // Parsear criativo se for string (JSON)
    let criativo = anuncio.criativo;
    if (typeof criativo === 'string') {
      try {
        criativo = JSON.parse(criativo);
      } catch (e) {
        criativo = {};
      }
    }

    // Extrair imagens do criativo (pode estar aninhado ou no topo)
    const imagens = anuncio.imagens || criativo?.imagens || [];
    const modo = anuncio.modo || criativo?.modo || 'normal';
    const intervaloRotacao = anuncio.intervaloRotacao || criativo?.intervaloRotacao || 5;

    console.log(`[ads-rotator] Debug: modo=${modo}, imagens.length=${imagens.length}`);

    // Se for modo rotativo com múltiplas imagens, renderizar carrossel
    if (modo === 'rotativo' && Array.isArray(imagens) && imagens.length > 1) {
      const anuncioComImagens = { ...anuncio, imagens, modo, intervaloRotacao };
      this.renderizarCarrossel(tipo, anuncioComImagens, elemento);
      return;
    }

    // Senão, renderizar imagem estática
    // Criar link
    const link = document.createElement('a');
    link.href = anuncio.destino || '#';
    link.target = '_blank';
    link.rel = 'noopener sponsored';
    link.style.cssText = 'display:block;width:100%;height:100%;line-height:0;text-decoration:none;';

    // Se tem imagem, renderizar imagem
    if (anuncio.criativo?.imagem) {
      const img = document.createElement('img');
      img.src = imgBase() + anuncio.criativo.imagem;
      img.alt = anuncio.criativo.titulo || anuncio.nome;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

      // Preferir WebP se disponível
      if (anuncio.criativo?.imagemWebp) {
        const picture = document.createElement('picture');

        // Source WebP
        const sourceWebp = document.createElement('source');
        sourceWebp.srcset = imgBase() + anuncio.criativo.imagemWebp;
        sourceWebp.type = 'image/webp';

        // Source JPEG fallback
        const sourceJpeg = document.createElement('source');
        sourceJpeg.srcset = imgBase() + anuncio.criativo.imagem;
        sourceJpeg.type = 'image/jpeg';

        picture.appendChild(sourceWebp);
        picture.appendChild(sourceJpeg);
        picture.appendChild(img);
        link.appendChild(picture);
      } else {
        link.appendChild(img);
      }
    } else {
      // Placeholder para anúncios sem imagem
      const placeholder = document.createElement('div');
      placeholder.style.cssText = `
        width:100%;
        height:100%;
        display:flex;
        align-items:center;
        justify-content:center;
        background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color:white;
        font-family:var(--font-display, sans-serif);
        font-weight:600;
        text-align:center;
        padding:2rem;
        box-sizing:border-box;
        font-size:clamp(0.875rem, 3vw, 1.125rem);
      `;
      placeholder.textContent = anuncio.criativo?.titulo || anuncio.nome;
      link.appendChild(placeholder);
    }

    // Se for modo rotativo com múltiplas imagens
    if (anuncio.modo === 'rotativo' && anuncio.imagens && Array.isArray(anuncio.imagens) && anuncio.imagens.length > 1) {
      elemento.innerHTML = '';
      this.renderizarCarrossel(tipo, anuncio, elemento);
    } else {
      elemento.appendChild(link);
    }

    // Registrar impressão
    this.registrarImpressao(anuncio);

    // Registrar clique
    link.addEventListener('click', () => {
      this.registrarClique(anuncio);
    });
  }

  /**
   * Renderizar carrossel com múltiplas imagens
   */
  renderizarCarrossel(tipo, anuncio, elemento) {
    const intervalo = anuncio.intervaloRotacao || 5;
    let posicaoAtual = 0;

    // Container do carrossel
    const carousel = document.createElement('div');
    carousel.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;';

    // Wrapper para imagens
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;width:100%;height:100%;';

    // Criar cada slide
    anuncio.imagens.forEach((imagem, index) => {
      const slide = document.createElement('div');
      slide.style.cssText = `
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        opacity:${index === 0 ? 1 : 0};
        transition:opacity 0.5s ease-in-out;
      `;

      const link = document.createElement('a');
      link.href = anuncio.destino || '#';
      link.target = '_blank';
      link.rel = 'noopener sponsored';
      link.style.cssText = 'display:block;width:100%;height:100%;text-decoration:none;';

      const img = document.createElement('img');
      img.src = imgBase() + imagem;
      img.alt = anuncio.criativo?.titulo || anuncio.nome;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

      link.appendChild(img);
      slide.appendChild(link);
      wrapper.appendChild(slide);
    });

    // Setas de navegação
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '❮';
    prevBtn.style.cssText = `
      position:absolute;
      left:10px;
      top:50%;
      transform:translateY(-50%);
      z-index:10;
      background:rgba(0,0,0,0.5);
      color:white;
      border:none;
      padding:10px 15px;
      cursor:pointer;
      border-radius:4px;
      font-size:18px;
      transition:background 0.3s;
    `;
    prevBtn.addEventListener('mouseover', () => prevBtn.style.background = 'rgba(0,0,0,0.8)');
    prevBtn.addEventListener('mouseout', () => prevBtn.style.background = 'rgba(0,0,0,0.5)');

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '❯';
    nextBtn.style.cssText = `
      position:absolute;
      right:10px;
      top:50%;
      transform:translateY(-50%);
      z-index:10;
      background:rgba(0,0,0,0.5);
      color:white;
      border:none;
      padding:10px 15px;
      cursor:pointer;
      border-radius:4px;
      font-size:18px;
      transition:background 0.3s;
    `;
    nextBtn.addEventListener('mouseover', () => nextBtn.style.background = 'rgba(0,0,0,0.8)');
    nextBtn.addEventListener('mouseout', () => nextBtn.style.background = 'rgba(0,0,0,0.5)');

    // Função para atualizar slides
    const atualizarSlides = () => {
      const slides = wrapper.children; // Pega só os slides diretos (não todos os divs)
      Array.from(slides).forEach((slide, index) => {
        slide.style.opacity = index === posicaoAtual ? 1 : 0;
      });
    };

    // Eventos dos botões
    prevBtn.addEventListener('click', () => {
      posicaoAtual = (posicaoAtual - 1 + anuncio.imagens.length) % anuncio.imagens.length;
      atualizarSlides();
    });

    nextBtn.addEventListener('click', () => {
      posicaoAtual = (posicaoAtual + 1) % anuncio.imagens.length;
      atualizarSlides();
    });

    // Rotação automática
    let timerRotacao = setInterval(() => {
      posicaoAtual = (posicaoAtual + 1) % anuncio.imagens.length;
      atualizarSlides();
    }, intervalo * 1000);

    // Pausar ao hover
    carousel.addEventListener('mouseenter', () => {
      clearInterval(timerRotacao);
    });
    carousel.addEventListener('mouseleave', () => {
      timerRotacao = setInterval(() => {
        posicaoAtual = (posicaoAtual + 1) % anuncio.imagens.length;
        atualizarSlides();
      }, intervalo * 1000);
    });

    // Montar carrossel
    carousel.appendChild(wrapper);
    carousel.appendChild(prevBtn);
    carousel.appendChild(nextBtn);
    elemento.appendChild(carousel);

    console.log(`[ads-rotator] 🎠 Carrossel renderizado para ${tipo}: ${anuncio.imagens.length} imagens`);
  }

  /**
   * Registrar impressão de anúncio
   */
  registrarImpressao(anuncio) {
    // Determinar URL da API
    const apiBase = location.hostname === 'localhost' && location.port === '8000'
      ? 'http://localhost:3000'
      : '';
    fetch(apiBase + '/api/anuncios/' + anuncio.id + '/impressao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.warn('Erro ao registrar impressão:', err.message));
  }

  /**
   * Registrar clique em anúncio
   */
  registrarClique(anuncio) {
    const apiBase = location.hostname === 'localhost' && location.port === '8000'
      ? 'http://localhost:3000'
      : '';
    fetch(apiBase + '/api/anuncios/' + anuncio.id + '/clique', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.warn('Erro ao registrar clique:', err.message));
  }

  /**
   * Pausar rotação
   */
  pausar(tipo) {
    if (this.timers[tipo]) {
      clearInterval(this.timers[tipo]);
      delete this.timers[tipo];
      console.log('⏸️ Rotação pausada para ' + tipo);
    }
  }

  /**
   * Retomar rotação
   */
  retomar(tipo) {
    if (!this.timers[tipo]) {
      this.timers[tipo] = setInterval(() => this.rotarProximo(tipo), this.interval);
      console.log('▶️ Rotação retomada para ' + tipo);
    }
  }

  /**
   * Pausar todas as rotações
   */
  pausarTodas() {
    Object.keys(this.timers).forEach(tipo => this.pausar(tipo));
  }

  /**
   * Retomar todas as rotações
   */
  retomarTodas() {
    Object.keys(this.anunciosAgrupados).forEach(tipo => this.retomar(tipo));
  }

  /**
   * Destruir rotador
   */
  destruir() {
    Object.keys(this.timers).forEach(tipo => {
      clearInterval(this.timers[tipo]);
    });
    this.timers = {};
    this.anunciosAgrupados = {};
  }
}

// Exportar globalmente
window.AdsRotator = AdsRotator;

// Auto-inicializar ao carregar página
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data/anuncios.json');
    const anuncios = await res.json();

    const rotador = new window.AdsRotator({ interval: 8000 });
    rotador.init(anuncios);

    window.adsRotator = rotador;
  } catch (err) {
    console.warn('[ads-rotator] Erro ao inicializar:', err.message);
  }
});

export { AdsRotator };
