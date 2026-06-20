/* ================================================================
   GERENCIADOR DE ANÚNCIOS - Sistema completo de CRUD
   ================================================================ */

class AnunciosApp {
  constructor() {
    this.anuncios = [];
    this.paginaAtual = 1;
    this.itensPorPagina = 10;
    this.filtros = {};
    this.editandoId = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.carregarAnuncios();
    this.setupUpload();
  }

  setupEventListeners() {
    const formCriar = document.getElementById('form-criar');
    const formFiltros = document.getElementById('form-filtros');
    const tabelaCorpo = document.getElementById('tabela-corpo');
    const tipoRadios = document.querySelectorAll('input[name="tipo"]');
    const todoSiteCheckbox = document.querySelector('input[name="todo_site"]');
    const municipiosCheckbox = document.querySelector('input[name="municipios"]');
    const blogsCheckbox = document.querySelector('input[name="blogs"]');
    const temDataFimCheckbox = document.querySelector('input[name="tem_data_fim"]');
    const botaoLimpar = document.querySelector('.botao-limpar');

    // Alternância entre tipo imagem/html
    tipoRadios.forEach(radio => {
      radio.addEventListener('change', (e) => this.alternarTipo(e.target.value));
    });

    // Toggle veiculação
    todoSiteCheckbox?.addEventListener('change', () => this.toggleVeiculacao());
    municipiosCheckbox?.addEventListener('change', () => this.toggleMunicipios());
    blogsCheckbox?.addEventListener('change', () => this.toggleBlogs());
    temDataFimCheckbox?.addEventListener('change', () => this.toggleDataFim());

    // Formulário de criação
    formCriar?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.criarAnuncio();
    });

    // Filtros
    formFiltros?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.aplicarFiltros();
    });

    botaoLimpar?.addEventListener('click', () => this.limparFiltros());

    // Delegação de eventos para a tabela
    tabelaCorpo?.addEventListener('click', (e) => {
      if (e.target.classList.contains('acao-editar')) {
        const id = parseInt(e.target.dataset.id);
        this.abrirModalEditar(id);
      }
      if (e.target.classList.contains('acao-deletar')) {
        const id = parseInt(e.target.dataset.id);
        this.abrirModalDeletar(id);
      }
      if (e.target.classList.contains('acao-toggle')) {
        const id = parseInt(e.target.dataset.id);
        this.toggleAtivo(id);
      }
    });

    // Modal deletar
    const btnConfirmarDeletar = document.getElementById('btn-confirmar-deletar');
    const btnCancelarDeletar = document.getElementById('btn-cancelar-deletar');
    btnConfirmarDeletar?.addEventListener('click', () => this.confirmarDeletar());
    btnCancelarDeletar?.addEventListener('click', () => this.fecharModalDeletar());
  }

  setupUpload() {
    const uploadAreas = document.querySelectorAll('.pos-select-arquivo');

    uploadAreas.forEach(area => {
      const input = area.querySelector('.arquivo-form');
      const preview = area.querySelector('img');

      // Drag and drop
      area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
      });

      area.addEventListener('dragleave', () => {
        area.classList.remove('drag-over');
      });

      area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) {
          input.files = e.dataTransfer.files;
          this.processarUpload(input, preview);
        }
      });

      // Click
      area.addEventListener('click', () => input.click());

      // Mudança no input
      input.addEventListener('change', () => {
        this.processarUpload(input, preview);
      });
    });
  }

  processarUpload(input, preview) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  alternarTipo(tipo) {
    const secaoImagem = document.getElementById('secao-imagem');
    const secaoHtml = document.getElementById('secao-html');

    if (tipo === 'imagem') {
      secaoImagem.style.display = 'block';
      secaoHtml.style.display = 'none';
    } else {
      secaoImagem.style.display = 'none';
      secaoHtml.style.display = 'block';
    }
  }

  toggleVeiculacao() {
    const opcoes = document.getElementById('opcoes-veiculacao');
    const todoSite = document.querySelector('input[name="todo_site"]').checked;
    opcoes.style.display = todoSite ? 'none' : 'block';
  }

  toggleMunicipios() {
    const lista = document.getElementById('lista-municipios');
    const check = document.querySelector('input[name="municipios"]').checked;
    lista.style.display = check ? 'block' : 'none';
  }

  toggleBlogs() {
    const lista = document.getElementById('lista-blogs');
    const check = document.querySelector('input[name="blogs"]').checked;
    lista.style.display = check ? 'block' : 'none';
  }

  toggleDataFim() {
    const secao = document.getElementById('secao-data');
    const check = document.querySelector('input[name="tem_data_fim"]').checked;
    secao.style.display = check ? 'grid' : 'none';
  }

  async carregarAnuncios() {
    try {
      const params = new URLSearchParams({
        page: this.paginaAtual,
        limit: this.itensPorPagina,
        ...this.filtros
      });

      const res = await fetch(`/api/anuncios?${params}`);
      const json = await res.json();

      if (json.success) {
        this.anuncios = json.data;
        this.renderizarTabela(json.data);
        this.renderizarPaginacao(json.total, json.pages);
        document.getElementById('total-anuncios').textContent = json.total;
      }
    } catch (err) {
      console.error('Erro ao carregar anúncios:', err);
      this.mostrarErro('Falha ao carregar anúncios');
    }
  }

  renderizarTabela(anuncios) {
    const tbody = document.getElementById('tabela-corpo');

    if (anuncios.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: var(--cor-texto-mute);">
            Nenhum anúncio encontrado
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = anuncios.map(ad => `
      <tr>
        <td>${ad.id}</td>
        <td>${this.escape(ad.nome)}</td>
        <td>${ad.tipo === 'imagem' ? '🖼️ Imagem' : '💻 HTML'}</td>
        <td>${this.obterNomeLocal(ad.local)}</td>
        <td>
          <button class="acao-editar" data-id="${ad.id}" title="Editar">✏️ Editar</button>
          <button class="acao-deletar" data-id="${ad.id}" title="Deletar">🗑️ Deletar</button>
          <button class="acao-toggle ${ad.ativo ? 'ativo' : 'inativo'}" data-id="${ad.id}" title="Toggle">
            ${ad.ativo ? '✓ Ativo' : '✗ Inativo'}
          </button>
        </td>
      </tr>
    `).join('');
  }

  renderizarPaginacao(total, pages) {
    const paginacao = document.getElementById('paginacao');
    let html = '';

    if (this.paginaAtual > 1) {
      html += `<span onclick="app.irPagina(${this.paginaAtual - 1})">◄ Anterior</span>`;
    }

    for (let i = 1; i <= pages; i++) {
      html += `<span class="${i === this.paginaAtual ? 'active' : ''}" onclick="app.irPagina(${i})">${i}</span>`;
    }

    if (this.paginaAtual < pages) {
      html += `<span onclick="app.irPagina(${this.paginaAtual + 1})">Próximo ►</span>`;
    }

    paginacao.innerHTML = html;
  }

  irPagina(num) {
    this.paginaAtual = num;
    this.carregarAnuncios();
    window.scrollTo(0, 0);
  }

  aplicarFiltros() {
    const formFiltros = document.getElementById('form-filtros');
    const formData = new FormData(formFiltros);

    this.filtros = {};
    for (const [key, value] of formData) {
      if (value && key === 'busca') this.filtros.busca = value;
      if (value && key === 'tipo') this.filtros.tipo = value;
      if (value && key === 'local') this.filtros.local = value;
      if (value && key === 'status') this.filtros.status = value;
    }

    this.paginaAtual = 1;
    this.carregarAnuncios();
  }

  limparFiltros() {
    document.getElementById('form-filtros').reset();
    this.filtros = {};
    this.paginaAtual = 1;
    this.carregarAnuncios();
  }

  async criarAnuncio() {
    const form = document.getElementById('form-criar');
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData);

    try {
      const res = await fetch('/api/anuncios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      const json = await res.json();

      if (json.success) {
        this.mostrarSucesso('Anúncio criado com sucesso!');
        form.reset();
        this.alternarTipo('imagem');
        this.paginaAtual = 1;
        await this.carregarAnuncios();
      } else {
        this.mostrarErro(json.erro || 'Falha ao criar anúncio');
      }
    } catch (err) {
      console.error('Erro ao criar anúncio:', err);
      this.mostrarErro('Erro ao criar anúncio');
    }
  }

  abrirModalEditar(id) {
    const ad = this.anuncios.find(a => a.id === id);
    if (!ad) return;

    this.editandoId = id;
    const modal = document.getElementById('modal-editar');
    const form = document.getElementById('form-editar');

    form.innerHTML = `
      <div class="item-form">
        <label>Nome</label>
        <input type="text" name="nome" class="input-form" value="${this.escape(ad.nome)}" required>
      </div>
      <div class="item-form">
        <label>Tipo</label>
        <select name="tipo" class="input-form" required>
          <option value="imagem" ${ad.tipo === 'imagem' ? 'selected' : ''}>Imagem</option>
          <option value="html" ${ad.tipo === 'html' ? 'selected' : ''}>HTML</option>
        </select>
      </div>
      <div class="item-form">
        <label>Local</label>
        <select name="local" class="input-form" required>
          <option value="1" ${ad.local === 1 ? 'selected' : ''}>Anúncio home (970x150)</option>
          <option value="2" ${ad.local === 2 ? 'selected' : ''}>Retângulo médio (300x250)</option>
          <option value="4" ${ad.local === 4 ? 'selected' : ''}>Arranha-céu (300x600)</option>
          <option value="10" ${ad.local === 10 ? 'selected' : ''}>Super banner topo (970x150)</option>
          <option value="11" ${ad.local === 11 ? 'selected' : ''}>Anúncio Pop-UP (580x400)</option>
        </select>
      </div>
      <div class="item-form">
        <label>Link de destino</label>
        <input type="url" name="destino" class="input-form" value="${this.escape(ad.destino || '')}">
      </div>
      ${ad.tipo === 'html' ? `
        <div class="item-form">
          <label>HTML</label>
          <textarea name="html" class="input-form" rows="5">${this.escape(ad.criativo?.html || '')}</textarea>
        </div>
      ` : ''}
      <div class="modal-acoes" style="margin-top: 2rem;">
        <button type="button" class="botao-ghost" onclick="app.fecharModalEditar()">Cancelar</button>
        <button type="button" class="botao-submit back-pr" onclick="app.salvarEdicao()">Salvar</button>
      </div>
    `;

    modal.style.display = 'flex';
  }

  async salvarEdicao() {
    const form = document.getElementById('form-editar');
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData);

    try {
      const res = await fetch(`/api/anuncios/${this.editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      const json = await res.json();

      if (json.success) {
        this.mostrarSucesso('Anúncio atualizado com sucesso!');
        this.fecharModalEditar();
        await this.carregarAnuncios();
      } else {
        this.mostrarErro(json.erro || 'Falha ao atualizar');
      }
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
      this.mostrarErro('Erro ao salvar edição');
    }
  }

  fecharModalEditar() {
    document.getElementById('modal-editar').style.display = 'none';
    this.editandoId = null;
  }

  abrirModalDeletar(id) {
    const ad = this.anuncios.find(a => a.id === id);
    if (!ad) return;

    this.editandoId = id;
    const modal = document.getElementById('modal-deletar');
    const msg = document.getElementById('msg-deletar');

    msg.textContent = `Tem certeza que quer deletar "${this.escape(ad.nome)}"? Esta ação não pode ser desfeita.`;
    modal.style.display = 'flex';
  }

  async confirmarDeletar() {
    try {
      const res = await fetch(`/api/anuncios/${this.editandoId}`, {
        method: 'DELETE'
      });

      const json = await res.json();

      if (json.success) {
        this.mostrarSucesso('Anúncio deletado com sucesso!');
        this.fecharModalDeletar();
        await this.carregarAnuncios();
      } else {
        this.mostrarErro(json.erro || 'Falha ao deletar');
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
      this.mostrarErro('Erro ao deletar anúncio');
    }
  }

  fecharModalDeletar() {
    document.getElementById('modal-deletar').style.display = 'none';
    this.editandoId = null;
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

      const json = await res.json();

      if (json.success) {
        const status = json.data.ativo ? 'ativado' : 'pausado';
        this.mostrarSucesso(`Anúncio ${status}!`);
        await this.carregarAnuncios();
      } else {
        this.mostrarErro(json.erro || 'Falha ao atualizar status');
      }
    } catch (err) {
      console.error('Erro ao toggle:', err);
      this.mostrarErro('Erro ao atualizar status');
    }
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

  mostrarSucesso(msg) {
    console.log('✅ ' + msg);
    alert(msg);
  }

  mostrarErro(msg) {
    console.error('❌ ' + msg);
    alert('Erro: ' + msg);
  }
}

// Inicializar app quando DOM estiver pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new AnunciosApp();
});
