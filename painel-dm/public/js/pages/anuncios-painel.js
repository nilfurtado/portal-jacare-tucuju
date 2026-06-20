import { mountShell } from '../shell.js';
import { toast, confirmar } from '../ui.js';

class AnunciosPainel {
  constructor() {
    this.anuncios = [];
    this.filtros = { busca: '', tipo: '' };
    this.init();
  }

  async init() {
    // Montar shell (sidebar) PRIMEIRO
    await mountShell({ route: 'anuncios' });

    // Depois carregar dados
    await this.carregarAnuncios();
    this.atualizarKPIs();
    this.renderizarGrid();
    this.setupEventListeners();
    // ⚠️ SSE DESABILIDO TEMPORARIAMENTE
    // this.setupSSEListener();
  }

  setupSSEListener() {
    console.log('🔌 setupSSEListener() iniciando...');
    try {
      console.log('📡 Criando EventSource para /api/eventos');
      const eventoSource = new EventSource('/api/eventos');

      eventoSource.addEventListener('open', () => {
        console.log('🟢 SSE ABERTO: Conexão estabelecida');
      });

      eventoSource.addEventListener('message', (e) => {
        console.log('📨 SSE message recebido');
        try {
          const evento = JSON.parse(e.data);

          // Atualizar anúncios quando restaurados
          if (evento.tipo === 'restaurado' && evento.categoria === 'anuncios') {
            console.log('📨 Evento SSE: Anúncio restaurado', evento.id);
            this.carregarAnuncios();
          }

          // Atualizar anúncios quando movidos para lixeira
          if (evento.tipo === 'anunciosAtualizados' && evento.acao === 'movido-para-lixeira') {
            console.log('📨 Evento SSE: Anúncio movido para lixeira', evento.id);
            this.carregarAnuncios();
          }
        } catch (err) {
          console.log('ℹ️ Dados SSE ignorados (heartbeat ou inválido)');
        }
      });

      eventoSource.onerror = (err) => {
        console.error('🔴 Erro SSE:', err);
        console.error('   ReadyState:', eventoSource.readyState);
        console.error('   Status:', err.status || 'N/A');
        eventoSource.close();
        console.log('🔌 Conexão SSE fechada');

        // Tentar reconectar após 5 segundos
        console.log('⏳ Tentando reconectar em 5s...');
        setTimeout(() => this.setupSSEListener(), 5000);
      };

      console.log('✅ SSE listener configurado em /api/eventos');
    } catch (err) {
      console.error('❌ Erro ao conectar SSE:', err.message);
    }
  }

  setupEventListeners() {
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      this.filtros.busca = e.target.value;
      this.renderizarGrid();
    });

    document.getElementById('type-filter')?.addEventListener('change', (e) => {
      this.filtros.tipo = e.target.value;
      this.renderizarGrid();
    });

    document.getElementById('btn-novo')?.addEventListener('click', () => {
      window.location.href = '/painel/anuncios/novo';
    });

    // Event delegation para botões de ação
    document.getElementById('slot-grid')?.addEventListener('click', (e) => {
      console.log('🖱️ Click detectado:', e.target.className);

      // Botões de intervalo rápido
      const btnIntervalo = e.target.closest('.btn-intervalo-card');
      if (btnIntervalo) {
        console.log('⚡ Botão de intervalo clicado!', btnIntervalo);
        const id = parseInt(btnIntervalo.dataset.id);
        const valor = parseInt(btnIntervalo.dataset.value);
        console.log(`📊 Atualizando ID ${id} para ${valor}s`);
        this.atualizarIntervalo(id, valor);
        return;
      }

      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id);

      if (action === 'editar') {
        window.location.href = `/painel/anuncios/editar/?id=${id}`;
      } else if (action === 'pausar') {
        this.toggleAtivo(id);
      } else if (action === 'deletar') {
        this.deletar(id);
      }
    });
  }

  async carregarAnuncios() {
    try {
      const res = await fetch('/api/anuncios?limit=100');
      const json = await res.json();
      if (json.success) {
        this.anuncios = json.data;
      }
    } catch (err) {
      console.error('Erro ao carregar:', err);
    }
  }

  filtrarAnuncios() {
    return this.anuncios.filter(ad => {
      if (this.filtros.busca && !ad.nome.toLowerCase().includes(this.filtros.busca.toLowerCase())) {
        return false;
      }
      if (this.filtros.tipo && ad.tipo !== this.filtros.tipo) {
        return false;
      }
      return true;
    });
  }

  atualizarKPIs() {
    const filtrados = this.filtrarAnuncios();
    const ativos = filtrados.filter(ad => ad.ativo).length;
    const totalImp = filtrados.reduce((sum, ad) => sum + (ad.impressoes || 0), 0);
    const totalClicks = filtrados.reduce((sum, ad) => sum + (ad.cliques || 0), 0);
    const ctr = totalImp > 0 ? ((totalClicks / totalImp) * 100).toFixed(1) : 0;

    document.getElementById('total-count').textContent = this.anuncios.length;
    document.getElementById('active-count').textContent = ativos;
    document.getElementById('active-sub').textContent = `de ${this.anuncios.length}`;
    document.getElementById('impressions-count').textContent = totalImp.toLocaleString('pt-BR');
    document.getElementById('ctr-count').textContent = ctr;
  }

  renderizarGrid() {
    const filtrados = this.filtrarAnuncios();
    const grid = document.getElementById('slot-grid');

    if (filtrados.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;color:var(--ink-mute);padding:var(--s-6);">
          Nenhum anúncio encontrado
        </div>
      `;
      return;
    }

    grid.innerHTML = filtrados.map(ad => {
      const locais = {
        '0': 'Topbar Banner',
        '1': 'Super Banner Topo',
        '2': 'Medium Rectangle',
        '4': 'Half Page',
        '10': 'Super Banner Rodapé',
        '11': 'Pop-up',
        '12': 'Rectangle Medium'
      };

      const dimensoes = {
        '0': '1018×150',
        '1': '970×150',
        '2': '300×250',
        '4': '300×600',
        '10': '970×150',
        '11': '580×400',
        '12': '280×196'
      };

      const ctr = ad.impressoes > 0 ? ((ad.cliques / ad.impressoes) * 100).toFixed(1) : 0;
      const dataInicio = ad.periodo?.inicio ? new Date(ad.periodo.inicio).toLocaleDateString('pt-BR') : '-';
      const dataFim = ad.periodo?.fim ? new Date(ad.periodo.fim).toLocaleDateString('pt-BR') : 'Sem limite';

      const statusClass = ad.ativo ? 'status-ativo' : 'status-inativo';

      // Parsear criativo (pode ser string ou objeto)
      let criativo = ad.criativo;
      if (typeof criativo === 'string') {
        try {
          criativo = JSON.parse(criativo);
        } catch (e) {
          criativo = {};
        }
      }

      return `
        <div class="slot-card ${statusClass}">
          <h3 class="slot-title">${this.escape(ad.nome)}</h3>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--s-2);font-size:0.8rem;color:var(--ink-mute);margin-bottom:var(--s-3);">
            <div>
              <strong style="color:var(--ink);">Posição:</strong><br>
              ${locais[ad.local] || 'N/A'} (${dimensoes[ad.local] || 'N/A'})
            </div>
            <div>
              <strong style="color:var(--ink);">Formato:</strong><br>
              ${criativo?.imagem ? '🖼️ Imagem' : '💻 HTML'}
            </div>
            <div>
              <strong style="color:var(--ink);">Modo:</strong><br>
              ${criativo?.modo === 'rotativo' ? '🎠 Rotativo' : '📷 Normal'}
            </div>
            ${criativo?.modo === 'rotativo' ? `
            <div>
              <strong style="color:var(--ink);">Intervalo:</strong><br>
              <div style="display: flex; gap: 4px; margin-top: 4px;">
                <button type="button" class="btn-intervalo-card" data-id="${ad.id}" data-value="3" style="padding: 4px 8px; font-size: 0.75rem; background: var(--surface-2); border: 1px solid var(--rule); border-radius: 4px; cursor: pointer;">3x</button>
                <button type="button" class="btn-intervalo-card" data-id="${ad.id}" data-value="5" style="padding: 4px 8px; font-size: 0.75rem; background: ${criativo?.intervaloRotacao === 5 ? 'var(--brand)' : 'var(--surface-2)'}; color: ${criativo?.intervaloRotacao === 5 ? 'white' : 'var(--ink)'}; border: 1px solid var(--rule); border-radius: 4px; cursor: pointer;">5x</button>
                <button type="button" class="btn-intervalo-card" data-id="${ad.id}" data-value="10" style="padding: 4px 8px; font-size: 0.75rem; background: var(--surface-2); border: 1px solid var(--rule); border-radius: 4px; cursor: pointer;">10x</button>
              </div>
            </div>
            ` : ''}
            <div>
              <strong style="color:var(--ink);">Status:</strong><br>
              <span class="badge ${ad.ativo ? 'active' : ''}">
                ${ad.ativo ? '✓ Ativo' : 'Inativo'}
              </span>
            </div>
            <div>
              <strong style="color:var(--ink);">Período:</strong><br>
              ${dataInicio} até ${dataFim}
            </div>
            <div>
              <strong style="color:var(--ink);">Impressões:</strong><br>
              📊 ${(ad.impressoes || 0).toLocaleString('pt-BR')}
            </div>
            <div>
              <strong style="color:var(--ink);">Cliques:</strong><br>
              👆 ${(ad.cliques || 0).toLocaleString('pt-BR')}
            </div>
            <div style="grid-column:1/-1;">
              <strong style="color:var(--ink);">CTR (Taxa de Clique):</strong><br>
              📈 ${ctr}%
            </div>
          </div>

          <div class="slot-actions">
            <button class="slot-btn" data-action="editar" data-id="${ad.id}">
              ✏️ Editar
            </button>
            <button class="slot-btn" data-action="pausar" data-id="${ad.id}">
              ${ad.ativo ? '⏸️ Pausar' : '▶️ Ativar'}
            </button>
            <button class="slot-btn" data-action="deletar" data-id="${ad.id}" style="background:#e74c3c;color:white;">
              🗑️ Deletar
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.atualizarKPIs();
  }

  async toggleAtivo(id) {
    const ad = this.anuncios.find(a => a.id === id);
    if (!ad) return;

    try {
      const res = await fetch(`/api/anuncios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ad.ativo })
      });

      if (res.ok) {
        ad.ativo = !ad.ativo;
        this.renderizarGrid();
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  }

  async atualizarIntervalo(id, intervalo) {
    const ad = this.anuncios.find(a => a.id === id);
    if (!ad) {
      console.error('❌ Anúncio não encontrado:', id);
      return;
    }

    try {
      console.log(`⚡ Atualizando intervalo de ${ad.nome} para ${intervalo}s`);

      const criativo = typeof ad.criativo === 'string' ? JSON.parse(ad.criativo) : ad.criativo;
      criativo.intervaloRotacao = intervalo;

      const payload = {
        criativo: criativo,
        intervaloRotacao: intervalo
      };

      console.log('📤 Enviando:', payload);

      const res = await fetch(`/api/anuncios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📥 Response status:', res.status);

      if (res.ok) {
        const json = await res.json();
        console.log('✅ Resposta API:', json);

        ad.criativo = typeof ad.criativo === 'string' ? JSON.stringify(criativo) : criativo;
        toast(`⚡ Intervalo atualizado para ${intervalo}s`, 'success');

        setTimeout(() => this.renderizarGrid(), 500);
      } else {
        const erro = await res.json();
        console.error('❌ Erro:', erro);
        toast(`❌ Erro: ${erro.erro || 'desconhecido'}`, 'error');
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar intervalo:', err);
      toast('❌ Erro ao atualizar intervalo', 'error');
    }
  }

  async deletar(id) {
    const anuncio = this.anuncios.find(a => a.id === id);
    if (!anuncio) return;

    const ok = await confirmar({
      titulo: 'Mover anúncio para lixeira?',
      mensagem: `Deseja mover "${anuncio.nome}" para a lixeira? Você poderá restaurá-lo depois.`,
      okText: 'Mover para lixeira'
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/anuncios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('✅ Anúncio movido para lixeira com sucesso!', 'success');
        this.anuncios = this.anuncios.filter(a => a.id !== id);
        await new Promise(r => setTimeout(r, 500));
        this.renderizarGrid();
      } else {
        toast('❌ Erro ao mover anúncio para lixeira', 'error');
      }
    } catch (err) {
      toast('❌ Erro: ' + err.message, 'error');
    }
  }

  escape(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new AnunciosPainel();
});
