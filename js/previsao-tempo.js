/**
 * Plugin: Previsão do Tempo
 * Exibe previsão de tempo em tempo real para principais cidades do Amapá
 * Fonte: INMET (Instituto Nacional de Meteorologia)
 */

const CIDADES_AMAPA = [
  {
    nome: 'Macapá',
    id: 'macapa',
    lat: -0.0339,
    lon: -51.0639,
    temp: 28,
    desc: 'Parcialmente nublado',
    minTemp: 24,
    maxTemp: 31,
    vento: 12
  },
  {
    nome: 'Santana',
    id: 'santana',
    lat: -0.0447,
    lon: -51.1767,
    temp: 27,
    desc: 'Céu nublado',
    minTemp: 23,
    maxTemp: 30,
    vento: 15
  },
  {
    nome: 'Laranjal do Jari',
    id: 'laranjal',
    lat: -0.6333,
    lon: -52.3667,
    temp: 26,
    desc: 'Chuva leve',
    minTemp: 22,
    maxTemp: 28,
    vento: 18
  },
  {
    nome: 'Oiapoque',
    id: 'oiapoque',
    lat: 3.8383,
    lon: -51.8144,
    temp: 25,
    desc: 'Chuva moderada',
    minTemp: 20,
    maxTemp: 27,
    vento: 20
  }
];

// Cache com timestamp para evitar requisições em cascata
let cachePrevisao = {
  timestamp: 0,
  dados: CIDADES_AMAPA
};

const CACHE_DURACAO = 5 * 60 * 1000; // 5 minutos (atualização frequente)

/**
 * Inicializa o plugin de previsão do tempo
 * @param {Object} config - Configuração do plugin
 */
export function initPrevisaoTempo(config = {}) {
  const container = document.getElementById('weather-forecast');
  if (!container) {
    console.warn('[Previsão Tempo] Container #weather-forecast não encontrado');
    return;
  }

  renderizarPrevisao(container, config);

  // Atualizar dados imediatamente
  atualizarPrevisao();

  // Agendar atualizações periódicas (a cada 5 minutos para sempre atualizado)
  const intervalo = config.intervalo || 5;
  agendarAtualizacoes(intervalo);
}

/**
 * Renderiza a previsão de tempo no container (carrossel)
 * @param {HTMLElement} container - Elemento para renderizar
 * @param {Object} config - Configuração
 */
function renderizarPrevisao(container, config = {}) {
  const cidades = config.cidades || CIDADES_AMAPA;

  container.innerHTML = '';

  cidades.forEach((cidade, idx) => {
    const item = criarCardCidade(cidade);
    item.setAttribute('data-city-index', idx);
    container.appendChild(item);
  });

  // Inicializar controles do carrossel
  inicializarCarrosselTempo(container, cidades);
}

/**
 * Cria um card de cidade com previsão
 * @param {Object} cidade - Dados da cidade
 * @returns {HTMLElement}
 */
function criarCardCidade(cidade) {
  const card = document.createElement('div');
  card.className = 'weather-item';
  card.innerHTML = `
    <div class="weather-item__header">
      <span class="weather-item__cidade">${cidade.nome}</span>
      <span class="weather-item__temp">${cidade.temp}°</span>
    </div>
    <div class="weather-item__desc">${cidade.desc}</div>
    <div class="weather-item__meta">
      <small>min ${cidade.minTemp}° · max ${cidade.maxTemp}° · ${cidade.vento} km/h</small>
    </div>
  `;

  return card;
}

/**
 * Converte código WMO para descrição de clima
 */
function descricaoDoCodigoWMO(code) {
  const descricoes = {
    0: 'Céu limpo',
    1: 'Parcialmente nublado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Neblina',
    48: 'Neblina gelada',
    51: 'Garoa leve',
    53: 'Garoa moderada',
    55: 'Garoa densa',
    61: 'Chuva leve',
    63: 'Chuva moderada',
    65: 'Chuva pesada',
    71: 'Neve leve',
    73: 'Neve moderada',
    75: 'Neve pesada',
    80: 'Pancadas de chuva leve',
    81: 'Pancadas de chuva moderada',
    82: 'Pancadas de chuva pesada',
    85: 'Pancadas de neve leve',
    86: 'Pancadas de neve pesada',
    95: 'Trovoada leve',
    96: 'Trovoada com granizo',
    99: 'Trovoada forte'
  };
  return descricoes[code] || 'Variável';
}

/**
 * Atualiza dados de previsão em tempo real
 * Conecta à API Open-Meteo (gratuita, sem CORS, confiável)
 */
export async function atualizarPrevisao() {
  try {
    const agora = Date.now();

    // Usar cache se ainda tiver menos de 5 minutos
    if (agora - cachePrevisao.timestamp < CACHE_DURACAO) {
      console.log('[Previsão Tempo] Usando dados em cache');
      atualizarUI(cachePrevisao.dados);
      return;
    }

    console.log('[Previsão Tempo] Atualizando dados em tempo real (Open-Meteo)...');

    const dadosAtualizados = await Promise.all(
      CIDADES_AMAPA.map(cidade =>
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${cidade.lat}&longitude=${cidade.lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=America/Paramaribo&language=pt`
        )
          .then(r => r.json())
          .then(data => {
            const current = data.current || {};
            const daily = data.daily || {};

            return {
              ...cidade,
              temp: Math.round(current.temperature_2m || cidade.temp),
              desc: descricaoDoCodigoWMO(current.weather_code || 1),
              minTemp: Math.round(daily.temperature_2m_min?.[0] || cidade.minTemp),
              maxTemp: Math.round(daily.temperature_2m_max?.[0] || cidade.maxTemp),
              vento: Math.round(current.wind_speed_10m || cidade.vento)
            };
          })
          .catch(err => {
            console.warn(`[Previsão Tempo] Erro ao buscar ${cidade.nome}:`, err);
            return cidade; // fallback para dados originais
          })
      )
    );

    // Atualizar cache
    cachePrevisao = {
      timestamp: agora,
      dados: dadosAtualizados
    };

    // Atualizar UI
    atualizarUI(dadosAtualizados);

    console.log('[Previsão Tempo] ✅ Dados atualizados com sucesso');
  } catch (err) {
    console.error('[Previsão Tempo] ❌ Erro ao atualizar:', err);
  }
}

/**
 * Atualiza a UI com novos dados
 */
function atualizarUI(cidades) {
  // Atualizar sidebar
  const container = document.getElementById('weather-forecast');
  if (container) {
    container.innerHTML = '';
    cidades.forEach(cidade => {
      const item = criarCardCidade(cidade);
      container.appendChild(item);
    });
  }

  // Atualizar header
  const headerContainer = document.querySelector('.header__weather');
  if (headerContainer && cidades.length > 0) {
    const macapa = cidades[0];
    const tempEl = headerContainer.querySelector('.weather__temp');
    const descEl = headerContainer.querySelector('.weather__desc');

    if (tempEl) tempEl.textContent = `${macapa.temp}°`;
    if (descEl) descEl.textContent = macapa.desc;
  }
}

/**
 * Agenda atualizações periódicas
 * @param {number} intervalo - Intervalo em minutos (padrão: 30)
 */
export function agendarAtualizacoes(intervalo = 30) {
  setInterval(atualizarPrevisao, intervalo * 60 * 1000);
  console.log(`[Previsão Tempo] Atualizações agendadas a cada ${intervalo} minutos`);
}

/**
 * Adiciona CSS para os cards de previsão
 */
export function injetarCSS() {
  const styleId = 'previsao-tempo-style';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .weather-item {
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
      color: #fff;
      padding: var(--sp-3) var(--sp-4);
      border-radius: var(--radius-md);
      transition: all var(--d-1);
    }

    .weather-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
    }

    .weather-item__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sp-2);
    }

    .weather-item__cidade {
      font-size: var(--fs-sm);
      font-weight: 600;
      text-transform: capitalize;
    }

    .weather-item__temp {
      font-family: var(--font-serif);
      font-size: 1.75rem;
      font-weight: 900;
      font-variant-numeric: tabular-nums;
      color: #fbbf24;
    }

    .weather-item__desc {
      font-size: var(--fs-xs);
      opacity: 0.9;
      margin-bottom: var(--sp-2);
    }

    .weather-item__meta {
      font-size: var(--fs-xs);
      opacity: 0.85;
      padding-top: var(--sp-2);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .weather-forecast {
      display: flex;
      flex-direction: column;
      gap: var(--sp-3);
    }
  `;

  document.head.appendChild(style);
}

/**
 * Inicializa carrossel de previsão do tempo
 * Controla navegação manual e automática
 */
function inicializarCarrosselTempo(container, cidades) {
  const carousel = container.closest('.weather-carousel');
  if (!carousel) return;

  const track = container;
  const btnPrev = carousel.querySelector('[data-weather-prev]');
  const btnNext = carousel.querySelector('[data-weather-next]');

  let currentIndex = 0;
  let autoplayInterval = null;

  function irPara(index) {
    currentIndex = (index + cidades.length) % cidades.length;
    const offset = currentIndex * 100;
    track.style.transform = `translateX(-${offset}%)`;

    // Resetar autoplay
    pararAutoplay();
    iniciarAutoplay();
  }

  function proximoCidade() {
    irPara(currentIndex + 1);
  }

  function cidadeAnterior() {
    irPara(currentIndex - 1);
  }

  function iniciarAutoplay() {
    autoplayInterval = setInterval(proximoCidade, 15000); // 15 segundos
  }

  function pararAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
  }

  // Event listeners
  btnPrev?.addEventListener('click', () => {
    cidadeAnterior();
  });

  btnNext?.addEventListener('click', () => {
    proximoCidade();
  });

  // Pausar autoplay ao passar mouse
  carousel.addEventListener('mouseenter', pararAutoplay);
  carousel.addEventListener('mouseleave', iniciarAutoplay);

  // Iniciar autoplay
  iniciarAutoplay();

  // CSS do carrossel
  track.style.display = 'flex';
  track.style.transition = 'transform 0.5s ease-in-out';
  track.style.width = `${cidades.length * 100}%`;

  // Cada item ocupa 100% do viewport
  const items = track.querySelectorAll('[data-city-index]');
  items.forEach(item => {
    item.style.flex = '1 0 100%';
  });
}

/**
 * Inicializa previsão do tempo no header
 * Versão compacta com apenas Macapá
 */
export function initPrevisaoTempoHeader() {
  const container = document.querySelector('.header__weather');
  if (!container) {
    console.warn('[Previsão Tempo Header] Element .header__weather não encontrado');
    return;
  }

  const macapa = cachePrevisao.dados[0] || CIDADES_AMAPA[0];

  // Atualizar temperatura
  const tempEl = container.querySelector('.weather__temp');
  if (tempEl) tempEl.textContent = `${macapa.temp}°`;

  // Atualizar descrição
  const descEl = container.querySelector('.weather__desc');
  if (descEl) descEl.textContent = macapa.desc;

  // Atualizar localização
  const locEl = container.querySelector('.weather__loc');
  if (locEl) {
    locEl.innerHTML = `
      <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.7 2 6 4.7 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6z"/><circle cx="12" cy="8" r="2"/></svg>
      ${macapa.nome}, AP
    `;
  }

  console.log('[Previsão Tempo Header] Inicializado com sucesso');
}


export default {
  init: initPrevisaoTempo,
  initHeader: initPrevisaoTempoHeader,
  atualizar: atualizarPrevisao,
  agendar: agendarAtualizacoes,
  injetarCSS
};
