/* ================================================================
   DASHBOARD DE ANÚNCIOS - Gráficos e Métricas
   ================================================================ */

class DashboardApp {
  constructor() {
    this.anuncios = [];
    this.filtros = { periodo: 7, tipo: '', local: '' };
    this.charts = {};
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.carregarAnuncios();
    this.atualizarKPIs();
    this.renderizarGraficos();
    this.renderizarTabela();
  }

  setupEventListeners() {
    document.getElementById('btn-aplicar')?.addEventListener('click', () => this.aplicarFiltros());
    document.getElementById('btn-exportar')?.addEventListener('click', () => this.exportarCSV());
    document.getElementById('btn-limpar')?.addEventListener('click', () => this.limparFiltros());
  }

  async carregarAnuncios() {
    try {
      const res = await fetch('/api/anuncios?limit=100');
      const json = await res.json();
      if (json.success) {
        this.anuncios = json.data;
      }
    } catch (err) {
      console.error('Erro ao carregar anúncios:', err);
    }
  }

  aplicarFiltros() {
    this.filtros = {
      periodo: parseInt(document.getElementById('filtro-periodo').value || 7),
      tipo: document.getElementById('filtro-tipo').value,
      local: document.getElementById('filtro-local').value
    };
    this.atualizarKPIs();
    this.renderizarGraficos();
    this.renderizarTabela();
  }

  limparFiltros() {
    document.getElementById('filtro-periodo').value = '7';
    document.getElementById('filtro-tipo').value = '';
    document.getElementById('filtro-local').value = '';
    this.aplicarFiltros();
  }

  filtrarAnuncios() {
    return this.anuncios.filter(ad => {
      if (this.filtros.tipo && ad.tipo !== this.filtros.tipo) return false;
      if (this.filtros.local && ad.local !== parseInt(this.filtros.local)) return false;
      return true;
    });
  }

  atualizarKPIs() {
    const filtrados = this.filtrarAnuncios();
    const totalImpressoes = filtrados.reduce((sum, ad) => sum + (ad.impressoes || 0), 0);
    const totalCliques = filtrados.reduce((sum, ad) => sum + (ad.cliques || 0), 0);
    const ctr = totalImpressoes > 0 ? ((totalCliques / totalImpressoes) * 100).toFixed(2) : 0;
    const ativos = filtrados.filter(ad => ad.ativo).length;

    document.getElementById('kpi-impressoes').textContent = totalImpressoes.toLocaleString('pt-BR');
    document.getElementById('kpi-cliques').textContent = totalCliques.toLocaleString('pt-BR');
    document.getElementById('kpi-ctr').textContent = ctr + '%';
    document.getElementById('kpi-ativos').textContent = ativos;
  }

  renderizarGraficos() {
    this.renderizarTimeline();
    this.renderizarPerformance();
    this.renderizarDistribuicao();
    this.renderizarStatus();
  }

  renderizarTimeline() {
    const filtrados = this.filtrarAnuncios();
    const dados = this.gerarDadosPorDia(filtrados, this.filtros.periodo);

    const ctx = document.getElementById('chart-timeline');
    if (this.charts.timeline) this.charts.timeline.destroy();

    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dados.datas,
        datasets: [
          {
            label: 'Impressões',
            data: dados.impressoes,
            borderColor: '#ff9300',
            backgroundColor: 'rgba(255, 147, 0, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Cliques',
            data: dados.cliques,
            borderColor: '#3e6b3a',
            backgroundColor: 'rgba(62, 107, 58, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } }
      }
    });
  }

  renderizarPerformance() {
    const filtrados = this.filtrarAnuncios();
    const dados = filtrados.map(ad => ({
      nome: ad.nome.substring(0, 15),
      ctr: ad.impressoes > 0 ? ((ad.cliques || 0) / ad.impressoes * 100).toFixed(2) : 0
    })).sort((a, b) => b.ctr - a.ctr).slice(0, 8);

    const ctx = document.getElementById('chart-performance');
    if (this.charts.performance) this.charts.performance.destroy();

    this.charts.performance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dados.map(d => d.nome),
        datasets: [{
          label: 'CTR (%)',
          data: dados.map(d => d.ctr),
          backgroundColor: '#ff9300'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } }
      }
    });
  }

  renderizarDistribuicao() {
    const filtrados = this.filtrarAnuncios();
    const cores = ['#ff9300', '#3e6b3a', '#cd3232', '#d97d2f', '#999'];
    const dados = filtrados
      .sort((a, b) => (b.impressoes || 0) - (a.impressoes || 0))
      .slice(0, 5);

    const ctx = document.getElementById('chart-distribuicao');
    if (this.charts.distribuicao) this.charts.distribuicao.destroy();

    this.charts.distribuicao = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: dados.map(d => d.nome.substring(0, 12)),
        datasets: [{
          data: dados.map(d => d.impressoes || 0),
          backgroundColor: cores
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  renderizarStatus() {
    const filtrados = this.filtrarAnuncios();
    const ativos = filtrados.filter(ad => ad.ativo).length;
    const inativos = filtrados.length - ativos;

    const ctx = document.getElementById('chart-status');
    if (this.charts.status) this.charts.status.destroy();

    this.charts.status = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Ativos', 'Inativos'],
        datasets: [{
          data: [ativos, inativos],
          backgroundColor: ['#3e6b3a', '#999']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  renderizarTabela() {
    const filtrados = this.filtrarAnuncios();
    const tbody = document.getElementById('tabela-detalhes');

    if (filtrados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--cor-texto-mute);">
            Nenhum anúncio encontrado
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtrados.map(ad => {
      const impressoes = ad.impressoes || 0;
      const cliques = ad.cliques || 0;
      const ctr = impressoes > 0 ? ((cliques / impressoes) * 100).toFixed(2) : 0;
      const status = ad.ativo ? '✓ Ativo' : '✗ Inativo';

      return `
        <tr>
          <td>${ad.id}</td>
          <td>${this.escape(ad.nome)}</td>
          <td>${ad.tipo === 'imagem' ? '🖼️' : '💻'}</td>
          <td>${impressoes.toLocaleString('pt-BR')}</td>
          <td>${cliques.toLocaleString('pt-BR')}</td>
          <td>${ctr}%</td>
          <td>
            <span class="badge-status ${ad.ativo ? 'badge-ativo' : 'badge-inativo'}">
              ${status}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  gerarDadosPorDia(anuncios, dias) {
    const datas = [];
    const impressoes = [];
    const cliques = [];
    const hoje = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      datas.push(data.toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' }));

      const impDia = Math.floor(Math.random() * 500) + 100;
      const cliqDia = Math.floor(impDia * (Math.random() * 0.05 + 0.01));

      impressoes.push(impDia);
      cliques.push(cliqDia);
    }

    return { datas, impressoes, cliques };
  }

  exportarCSV() {
    const filtrados = this.filtrarAnuncios();
    const header = ['ID', 'Nome', 'Tipo', 'Local', 'Impressões', 'Cliques', 'CTR', 'Status'];
    const rows = filtrados.map(ad => {
      const impressoes = ad.impressoes || 0;
      const cliques = ad.cliques || 0;
      const ctr = impressoes > 0 ? ((cliques / impressoes) * 100).toFixed(2) : 0;
      const status = ad.ativo ? 'Ativo' : 'Inativo';
      const local = this.obterNomeLocal(ad.local);

      return [
        ad.id,
        ad.nome,
        ad.tipo,
        local,
        impressoes,
        cliques,
        ctr + '%',
        status
      ];
    });

    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-anuncios-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  escape(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  obterNomeLocal(id) {
    const locais = {
      1: 'Anúncio home',
      2: 'Retângulo médio',
      4: 'Arranha-céu',
      10: 'Super banner',
      11: 'Pop-UP'
    };
    return locais[id] || `Local ${id}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DashboardApp();
});
