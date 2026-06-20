import { mountShell } from '../shell.js';

class FormEditar {
  constructor() {
    this.form = document.getElementById('form-editar-anuncio');
    this.loading = document.getElementById('loading');
    this.formContainer = document.getElementById('form-container');
    this.tipoRadios = document.querySelectorAll('input[name="tipo"]');
    this.todoSiteCheckbox = document.getElementById('todo-site');
    this.secaoImagem = document.getElementById('secao-imagem');
    this.secaoHtml = document.getElementById('secao-html');
    this.opcoesEspecificas = document.getElementById('opcoes-especificas');

    this.id = this.getIdFromUrl();
    this.anuncio = null;

    this.init();
  }

  getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async init() {
    console.log('🚀 FormEditar.init() iniciado');

    // Montar shell (sidebar) PRIMEIRO
    await mountShell({ route: 'anuncios' });
    console.log('✅ Shell montado');

    // Carregar dados do anúncio
    if (!this.id) {
      console.error('❌ ID não encontrado na URL');
      this.loading.innerHTML = '<p style="color: red;">ID do anúncio não encontrado!</p>';
      return;
    }

    console.log(`📝 Carregando anúncio ID: ${this.id}`);

    try {
      await this.carregarAnuncio();
      console.log('✅ Anúncio carregado');

      await this.preencherFormulario();
      console.log('✅ Formulário preenchido');

      this.setupEventListeners();
      console.log('✅ Event listeners configurados');

      this.setupUpload();
      console.log('✅ Upload configurado');

      // Mostrar formulário
      this.loading.style.display = 'none';
      this.formContainer.style.display = 'block';
      console.log('✅ Formulário visível');
    } catch (err) {
      console.error('❌ Erro na inicialização:', err);
      this.loading.innerHTML = `<p style="color: red;">Erro ao carregar: ${err.message}</p>`;
    }
  }

  async carregarAnuncio() {
    console.log(`🔄 carregarAnuncio() iniciado para ID: ${this.id}`);
    try {
      const res = await fetch(`/api/anuncios/${this.id}`);
      console.log(`📊 Response status: ${res.status}`);

      if (!res.ok) {
        console.error(`❌ HTTP ${res.status}: Anúncio não encontrado`);
        this.loading.innerHTML = '<p style="color: red;">❌ Anúncio não encontrado! <a href="/painel/anuncios/">Voltar</a></p>';
        return;
      }

      const json = await res.json();
      console.log('📡 Resposta GET:', json);

      if (json.success && json.data) {
        this.anuncio = json.data;
        console.log('✅ Anúncio carregado:', this.anuncio.nome);
        console.log('   ID:', this.anuncio.id);
        console.log('   Local:', this.anuncio.local);
        console.log('   Tipo:', this.anuncio.tipo);
      } else {
        console.error('❌ Erro na resposta:', json);
        this.loading.innerHTML = '<p style="color: red;">❌ ' + (json.erro || 'Erro ao carregar') + '</p>';
      }
    } catch (err) {
      console.error('❌ Erro fetch:', err.message);
      this.loading.innerHTML = '<p style="color: red;">Erro ao carregar anúncio: ' + err.message + '</p>';
    }
  }

  async preencherFormulario() {
    if (!this.anuncio) return;

    console.log('📝 Preenchendo formulário com dados:', this.anuncio);

    // Título
    const tituloEl = document.getElementById('titulo-anuncio');
    if (tituloEl) tituloEl.textContent = `Editando: ${this.anuncio.nome}`;

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 1: INFORMAÇÕES BÁSICAS
    // ═══════════════════════════════════════════════════════

    // Nome
    const nomeEl = document.getElementById('nome');
    if (nomeEl) nomeEl.value = this.anuncio.nome || '';

    // Local - Mapeamento Visual
    this.renderizarMapeamento();
    const localId = this.anuncio.local || '';
    if (localId) {
      setTimeout(() => {
        const cardSelecionado = document.querySelector(`[data-local="${localId}"]`);
        if (cardSelecionado) {
          cardSelecionado.classList.add('selected');
          // Disparar seleção para atualizar informações
          this.selecionarMapeamento(localId);
        }
      }, 100);
    }

    // Select oculto
    const localEl = document.getElementById('local');
    if (localEl) localEl.value = localId;

    // Tipo
    const tipo = this.anuncio.tipo || 'imagem';
    const tipoInput = document.querySelector(`input[name="tipo"][value="${tipo}"]`);
    if (tipoInput) {
      tipoInput.checked = true;
    }

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 2: IMAGEM
    // ═══════════════════════════════════════════════════════

    // Preview de imagem
    const preview = document.getElementById('preview-imagem');
    if (preview && this.anuncio.criativo && this.anuncio.criativo.imagem) {
      console.log('🖼️ Carregando preview:', this.anuncio.criativo.imagem);
      preview.src = this.anuncio.criativo.imagem;
      preview.style.display = 'block';
    }

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 3: HTML
    // ═══════════════════════════════════════════════════════

    const htmlEl = document.getElementById('html');
    if (htmlEl && this.anuncio.criativo && this.anuncio.criativo.html) {
      htmlEl.value = this.anuncio.criativo.html;
    }

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 4: DESTINO
    // ═══════════════════════════════════════════════════════

    const destinoEl = document.getElementById('destino');
    if (destinoEl) destinoEl.value = this.anuncio.destino || '';

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 5: VEICULAÇÃO
    // ═══════════════════════════════════════════════════════

    const todoSiteEl = document.getElementById('todo-site');
    const paginas = this.anuncio.paginas || [];
    const todoSite = paginas.length === 0 || (paginas.length === 1 && paginas[0] === '*');

    if (todoSiteEl) {
      todoSiteEl.checked = todoSite;
    }

    // Páginas específicas
    if (!todoSite && this.opcoesEspecificas) {
      this.opcoesEspecificas.classList.remove('hidden-section');

      const inicioEl = document.getElementById('inicio');
      const municipiosEl = document.getElementById('municipios');
      const blogsEl = document.getElementById('blogs');

      if (inicioEl) inicioEl.checked = paginas.includes('inicio');
      if (municipiosEl) municipiosEl.checked = paginas.includes('municipios');
      if (blogsEl) blogsEl.checked = paginas.includes('blogs');
    }

    // ═══════════════════════════════════════════════════════
    // SEÇÃO 6: DATAS
    // ═══════════════════════════════════════════════════════

    if (this.anuncio.periodo) {
      const dataInicioEl = document.getElementById('data-inicio');
      if (this.anuncio.periodo.inicio && dataInicioEl) {
        dataInicioEl.value = this.anuncio.periodo.inicio.split('T')[0];
      }

      const dataFimEl = document.getElementById('data-fim');
      if (this.anuncio.periodo.fim && dataFimEl) {
        dataFimEl.value = this.anuncio.periodo.fim.split('T')[0];
      }
    }

    // Ativo
    const ativoEl = document.getElementById('ativo');
    if (ativoEl) ativoEl.checked = this.anuncio.ativo ? true : false;

    // Atualizar visibilidade de seções
    this.alternarTipo();

    // Carregar listagem de campanhas
    await this.carregarCampanhas();

    console.log('✅ Formulário preenchido completamente');
  }

  renderizarMapeamento() {
    console.log('🎨 renderizarMapeamento() iniciado');
    const grid = document.getElementById('mapeamento-grid');
    if (!grid) {
      console.warn('⚠️ mapeamento-grid não encontrado no DOM');
      return;
    }
    console.log('✅ mapeamento-grid encontrado');

    const mapeamentoData = [
      { id: '0', nome: 'Topbar Banner', width: 1018, height: 150, sessao: 'TOPO ABSOLUTO' },
      { id: '1', nome: 'Super Banner Topo', width: 970, height: 150, sessao: 'HEADER - Topo' },
      { id: '2', nome: 'Medium Rectangle', width: 300, height: 250, sessao: 'SIDEBAR - Superior' },
      { id: '4', nome: 'Half Page', width: 300, height: 600, sessao: 'SIDEBAR - Lateral' },
      { id: '10', nome: 'Super Banner Rodapé', width: 970, height: 150, sessao: 'FOOTER - Final' },
      { id: '11', nome: 'Interstitial Pop-up', width: 580, height: 400, sessao: 'OVERLAY - Modal' },
      { id: '12', nome: 'Rectangle Medium', width: 280, height: 196, sessao: 'MAIN - Topo' }
    ];

    grid.innerHTML = mapeamentoData.map(item => `
      <div class="mapeamento-card" data-local="${item.id}">
        <div class="mapeamento-card__dimensoes">${item.width}×${item.height}</div>
        <div class="mapeamento-card__nome">${item.nome}</div>
        <div class="mapeamento-card__sessao">${item.sessao}</div>
      </div>
    `).join('');

    // Adicionar event listeners
    const cards = document.querySelectorAll('.mapeamento-card');
    console.log(`🖱️ Adicionando listeners a ${cards.length} cards`);
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const localId = card.dataset.local;
        console.log(`🎯 Card clicado: ${localId}`);
        this.selecionarMapeamento(localId);
      });
    });
    console.log('✅ renderizarMapeamento() concluído');
  }

  selecionarMapeamento(localId) {
    document.querySelectorAll('.mapeamento-card').forEach(card => {
      card.classList.remove('selected');
    });

    const cardSelecionado = document.querySelector(`[data-local="${localId}"]`);
    if (cardSelecionado) {
      cardSelecionado.classList.add('selected');
    }

    document.getElementById('local').value = localId;

    const mapeamentoData = {
      '0': { sessao: 'TOPBAR', posicao: 'TOPO ABSOLUTO - Acima de tudo' },
      '1': { sessao: 'HEADER', posicao: 'Entre navegação e conteúdo principal' },
      '2': { sessao: 'SIDEBAR DIREITA', posicao: 'ANTES do Half Page' },
      '4': { sessao: 'SIDEBAR DIREITA', posicao: 'DEPOIS do Medium Rectangle' },
      '10': { sessao: 'FOOTER', posicao: 'ANTES dos links e contato' },
      '11': { sessao: 'OVERLAY/MODAL', posicao: 'SOBRE TODO O CONTEÚDO (Centrado)' },
      '12': { sessao: 'MAIN GRID', posicao: 'DEPOIS Super Banner - ANTES Política' }
    };

    const info = mapeamentoData[localId];
    if (info) {
      document.getElementById('info-sessao').textContent = `📍 Sessão: ${info.sessao}`;
      document.getElementById('info-posicao').textContent = `📌 Posição: ${info.posicao}`;
      document.getElementById('mapeamento-info').classList.add('visible');
    }
  }

  async carregarCampanhas() {
    console.log('📊 carregarCampanhas() iniciado');
    try {
      const res = await fetch('/api/anuncios?limit=100');
      const json = await res.json();
      console.log(`✅ Campanhas carregadas: ${json.data?.length || 0} itens`);

      if (json.success && json.data.length > 0) {
        console.log('🎨 Renderizando tabela de campanhas');
        this.renderizarTabela(json.data);
      } else {
        console.log('⚠️ Nenhuma campanha encontrada');
        document.getElementById('tabela-campanhas').innerHTML = `
          <tr>
            <td colspan="6" style="padding: var(--s-4); text-align: center; color: var(--ink-mute);">
              Nenhuma campanha cadastrada ainda.
            </td>
          </tr>
        `;
      }
      console.log('✅ carregarCampanhas() concluído');
    } catch (err) {
      console.error('❌ Erro ao carregar campanhas:', err);
    }
  }

  escape(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  renderizarTabela(anuncios) {
    const tbody = document.getElementById('tabela-campanhas');
    if (!tbody) return;

    tbody.innerHTML = anuncios.map(ad => {
      const isFinalized = ad.periodo && ad.periodo.fim && new Date(ad.periodo.fim) < new Date();
      const rowColor = isFinalized ? '#ffebee' : 'transparent';

      return `
        <tr style="border-bottom: 1px solid var(--rule); background-color: ${rowColor};">
          <td style="padding: var(--s-2);">${ad.id}</td>
          <td style="padding: var(--s-2);"><strong>${this.escape(ad.nome)}</strong></td>
          <td style="padding: var(--s-2);">
            ${ad.tipo === 'imagem' ? '🖼️ Imagem' : '💻 HTML'}
          </td>
          <td style="padding: var(--s-2);">${ad.local || '-'}</td>
          <td style="padding: var(--s-2);">-</td>
          <td style="padding: var(--s-2); text-align: center;">
            <button onclick="window.location.href='/painel/anuncios/editar/?id=${ad.id}'" style="padding: var(--s-1) var(--s-2); font-size: 0.75rem; background: var(--brand); color: white; border: none; border-radius: var(--r-1); cursor: pointer;">
              Editar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  setupEventListeners() {
    // Toggle entre imagem e HTML
    this.tipoRadios.forEach(radio => {
      radio.addEventListener('change', () => this.alternarTipo());
    });

    // Toggle todo site vs específico
    this.todoSiteCheckbox.addEventListener('change', () => {
      this.opcoesEspecificas.classList.toggle('hidden-section');
    });

    // Submit do formulário
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  alternarTipo() {
    const tipoRadio = document.querySelector('input[name="tipo"]:checked');
    if (!tipoRadio) return;
    const tipo = tipoRadio.value;

    if (this.secaoImagem) {
      if (tipo === 'imagem') {
        this.secaoImagem.classList.remove('hidden-section');
      } else {
        this.secaoImagem.classList.add('hidden-section');
      }
    }

    if (this.secaoHtml) {
      if (tipo === 'imagem') {
        this.secaoHtml.classList.add('hidden-section');
      } else {
        this.secaoHtml.classList.remove('hidden-section');
      }
    }

    const htmlEl = document.getElementById('html');
    if (htmlEl) htmlEl.required = tipo !== 'imagem';
  }

  setupUpload() {
    const area = document.getElementById('upload-imagem');
    const input = document.getElementById('foto');
    const preview = document.getElementById('preview-imagem');

    if (!area || !input || !preview) return;

    area.addEventListener('click', () => input.click());

    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.classList.add('dragover');
    });

    area.addEventListener('dragleave', () => {
      area.classList.remove('dragover');
    });

    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        input.files = files;
        this.handleFileSelect(input, preview);
      }
    });

    input.addEventListener('change', (e) => {
      this.handleFileSelect(input, preview);
    });
  }

  handleFileSelect(input, preview) {
    const file = input.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato inválido. Use JPG, PNG ou GIF.');
      input.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 8MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    this.arquivoSelecionado = file;
  }

  async handleSubmit(e) {
    e.preventDefault();

    const nomeEl = document.getElementById('nome');
    const tipoRadio = document.querySelector('input[name="tipo"]:checked');
    const localEl = document.getElementById('local');

    if (!nomeEl || !tipoRadio || !localEl) {
      alert('Formulário incompleto.');
      return;
    }

    const nome = nomeEl.value.trim();
    const tipo = tipoRadio.value;
    const local = localEl.value;

    if (!nome || !tipo || !local) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    // Checar se é delete
    if (this.form.dataset.delete === 'true') {
      await this.deletarAnuncio();
      return;
    }

    let imagemJpeg = null;
    let imagemWebp = null;

    // 1️⃣ UPLOAD OTIMIZADO DE IMAGEM (se selecionada nova)
    if (this.arquivoSelecionado) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('imagem', this.arquivoSelecionado);
        uploadFormData.append('anuncioId', this.id);

        const uploadResponse = await fetch('/api/anuncios/upload/imagem', {
          method: 'POST',
          body: uploadFormData
        });

        const uploadJson = uploadResponse.json();

        if ((await uploadJson).success) {
          imagemJpeg = (await uploadJson).data.jpeg;
          imagemWebp = (await uploadJson).data.webp;
        } else {
          alert('Erro ao fazer upload: ' + (await uploadJson).erro);
          return;
        }
      } catch (err) {
        console.error('Erro upload:', err);
        alert('Erro ao fazer upload da imagem.');
        return;
      }
    }

    // 2️⃣ EDITAR ANÚNCIO
    try {
      if (!this.anuncio) {
        alert('❌ Anúncio não foi carregado. Recarregue a página.');
        return;
      }

      const criativo = { ...this.anuncio.criativo };
      if (imagemJpeg) criativo.imagem = imagemJpeg;
      if (imagemWebp) criativo.imagemWebp = imagemWebp;
      if (tipo === 'html') {
        const htmlEl = document.getElementById('html');
        criativo.html = htmlEl?.value || null;
      }

      const destinoEl = document.getElementById('destino');
      const dataInicioEl = document.getElementById('data-inicio');
      const dataFimEl = document.getElementById('data-fim');
      const ativoEl = document.getElementById('ativo');

      const payload = {
        nome,
        tipo,
        local,
        destino: destinoEl?.value || null,
        ativo: ativoEl?.checked ?? true,
        criativo,
        periodo: {
          inicio: dataInicioEl?.value || null,
          fim: dataFimEl?.value || null
        }
      };

      const response = await fetch(`/api/anuncios/${this.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await response.json();

      if (json.success) {
        alert('✓ Anúncio atualizado com sucesso!');
        window.location.href = '/painel/anuncios/';
      } else {
        alert('Erro ao atualizar: ' + (json.erro || 'Tente novamente.'));
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao enviar dados.');
    }
  }

  async deletarAnuncio() {
    try {
      const response = await fetch(`/api/anuncios/${this.id}`, {
        method: 'DELETE'
      });

      const json = await response.json();

      if (json.success) {
        alert('✓ Anúncio deletado com sucesso!');
        window.location.href = '/painel/anuncios/';
      } else {
        alert('Erro ao deletar: ' + (json.erro || 'Tente novamente.'));
        this.form.dataset.delete = '';
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao deletar. Verifique o console.');
      this.form.dataset.delete = '';
    }
  }
}

// Inicializar imediatamente (script type="module" carrega após DOM)
console.log('📄 form-editar.js carregado como módulo');

if (document.readyState === 'loading') {
  console.log('⏳ Aguardando DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOMContentLoaded disparado, inicializando FormEditar');
    new FormEditar();
  });
} else {
  console.log('🎯 DOM já carregado, inicializando FormEditar imediatamente');
  new FormEditar();
}
