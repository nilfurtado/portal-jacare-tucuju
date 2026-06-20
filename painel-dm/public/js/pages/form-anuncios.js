import { mountShell } from '../shell.js';

class FormAnuncios {
  // Mapa de dimensões por local
  static DIMENSOES_LOCAIS = {
    '1': { width: 970, height: 150, nome: 'Anúncio Home' },
    '2': { width: 300, height: 250, nome: 'Retângulo Médio' },
    '4': { width: 300, height: 600, nome: 'Arranha-céu' },
    '10': { width: 970, height: 150, nome: 'Super Banner' },
    '11': { width: 580, height: 400, nome: 'Pop-up' },
    '12': { width: 280, height: 196, nome: 'Anúncio Topo' }
  };

  constructor() {
    this.form = document.getElementById('form-novo-anuncio');
    this.tipoRadios = document.querySelectorAll('input[name="tipo"]');
    this.todoSiteCheckbox = document.getElementById('todo-site');
    this.secaoImagem = document.getElementById('secao-imagem');
    this.secaoHtml = document.getElementById('secao-html');
    this.opcoesEspecificas = document.getElementById('opcoes-especificas');
    this.localSelect = document.getElementById('local');
    this.dimensoesSpan = document.getElementById('dimensoes-imagem');

    this.init();
  }

  async init() {
    // Montar shell (sidebar) PRIMEIRO
    await mountShell({ route: 'anuncios' });

    // Renderizar mapeamento visual
    this.renderizarMapeamento();

    // Setup eventos
    this.setupEventListeners();
    this.setupUpload();

    // Inicializar modo (Normal/Rotativo) - DEPOIS dos listeners
    if (document.querySelector('input[name="modo"]')) {
      this.alternarModo();
    }

    // Inicializar dimensões com valor padrão
    this.atualizarDimensoes({ target: { value: this.localSelect.value } });

    // Carregar listagem de campanhas
    await this.carregarCampanhas();

    console.log('✅ FormAnuncios inicializado - Aguardando seleção de posição');
  }

  renderizarMapeamento() {
    const grid = document.getElementById('mapeamento-grid');
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

    // Adicionar event listeners aos cards
    document.querySelectorAll('.mapeamento-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const localId = card.dataset.local;
        this.selecionarMapeamento(localId);
      });
    });
  }

  selecionarMapeamento(localId) {
    // Remover seleção anterior
    document.querySelectorAll('.mapeamento-card').forEach(card => {
      card.classList.remove('selected');
    });

    // Adicionar seleção ao card clicado
    const cardSelecionado = document.querySelector(`[data-local="${localId}"]`);
    if (cardSelecionado) {
      cardSelecionado.classList.add('selected');
    }

    // Atualizar o select oculto
    this.localSelect.value = localId;
    console.log('✅ Local selecionado:', localId, 'Valor do select:', this.localSelect.value);

    // Atualizar dimensões
    this.atualizarDimensoes({ target: { value: localId } });

    // Mostrar informações
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

    console.log(`✅ Posição selecionada: ${localId}`);
  }

  async carregarCampanhas() {
    try {
      const res = await fetch('/api/anuncios?limit=100');
      const json = await res.json();

      if (json.success && json.data.length > 0) {
        this.renderizarTabela(json.data);
      } else {
        document.getElementById('tabela-campanhas').innerHTML = `
          <tr>
            <td colspan="6" style="padding: var(--s-4); text-align: center; color: var(--ink-mute);">
              Nenhuma campanha cadastrada ainda.
            </td>
          </tr>
        `;
      }
    } catch (err) {
      console.error('Erro ao carregar campanhas:', err);
    }
  }

  renderizarTabela(anuncios) {
    const tbody = document.getElementById('tabela-campanhas');

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

  escape(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupEventListeners() {
    // Toggle entre imagem e HTML
    this.tipoRadios.forEach(radio => {
      radio.addEventListener('change', () => this.alternarTipo());
    });

    // Toggle entre modo Normal e Rotativo
    const modoRadios = document.querySelectorAll('input[name="modo"]');
    modoRadios.forEach(radio => {
      radio.addEventListener('change', () => this.alternarModo());
    });

    // Toggle todo site vs específico
    this.todoSiteCheckbox.addEventListener('change', () => {
      this.opcoesEspecificas.classList.toggle('hidden-section');
    });

    // Atualizar dimensões quando mudar o local
    this.localSelect.addEventListener('change', (e) => this.atualizarDimensoes(e));

    // Botões rápidos de intervalo de rotação
    const intervaloInput = document.getElementById('intervalo-rotacao');
    const botoesIntervalo = document.querySelectorAll('.btn-intervalo');
    botoesIntervalo.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const valor = btn.dataset.value;
        intervaloInput.value = valor;

        // Visual feedback: destacar botão selecionado
        botoesIntervalo.forEach(b => {
          b.style.background = b === btn ? 'var(--brand)' : 'var(--surface-2)';
          b.style.color = b === btn ? 'white' : 'var(--ink)';
          b.style.borderColor = b === btn ? 'var(--brand)' : 'var(--rule)';
        });

        console.log(`⚡ Intervalo selecionado: ${valor}s`);
      });
    });

    // Inicializar botão selecionado baseado no valor do input
    if (intervaloInput) {
      const valor = intervaloInput.value;
      const btnSelecionado = Array.from(botoesIntervalo).find(b => b.dataset.value === valor);
      if (btnSelecionado) {
        botoesIntervalo.forEach(b => {
          b.style.background = b === btnSelecionado ? 'var(--brand)' : 'var(--surface-2)';
          b.style.color = b === btnSelecionado ? 'white' : 'var(--ink)';
          b.style.borderColor = b === btnSelecionado ? 'var(--brand)' : 'var(--rule)';
        });
      }
    }

    // Submit do formulário
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  atualizarDimensoes(event) {
    const localId = event.target.value;
    const dimensoes = FormAnuncios.DIMENSOES_LOCAIS[localId];
    const preview = document.getElementById('preview-imagem');

    console.log(`🔄 atualizarDimensoes chamado - localId: ${localId}`, dimensoes);

    if (dimensoes) {
      // Atualizar o texto das dimensões no TÍTULO
      const novoTexto = `Imagem do Anúncio (${dimensoes.width}×${dimensoes.height}px)`;
      const titulo = document.querySelector('#secao-imagem .form-section-title');
      if (titulo) {
        titulo.textContent = novoTexto;
      }

      // Atualizar o span de dimensões
      if (this.dimensoesSpan) {
        this.dimensoesSpan.textContent = `${dimensoes.width}×${dimensoes.height}`;
      }

      // Atualizar o tamanho do preview
      if (preview) {
        preview.style.width = `${dimensoes.width}px`;
        preview.style.height = `${dimensoes.height}px`;
        preview.style.maxWidth = `${dimensoes.width}px`;
      }

      console.log(`✅ Dimensões atualizadas para: ${dimensoes.nome} (${dimensoes.width}×${dimensoes.height}px)`);
    } else if (localId === '') {
      // Se vazio, volta para padrão
      const titulo = document.querySelector('#secao-imagem .form-section-title');
      if (titulo) {
        titulo.textContent = 'Imagem do Anúncio (recomendado conforme slot)';
      }
      if (this.dimensoesSpan) {
        this.dimensoesSpan.textContent = 'Selecione uma posição acima';
      }
      if (preview) {
        preview.style.width = '100%';
        preview.style.height = '200px';
        preview.style.maxWidth = '300px';
      }
    }
  }

  alternarTipo() {
    const tipo = document.querySelector('input[name="tipo"]:checked').value;

    if (tipo === 'imagem') {
      this.secaoImagem.classList.remove('hidden-section');
      this.secaoHtml.classList.add('hidden-section');
      document.getElementById('foto').required = true;
      document.getElementById('html').required = false;
      this.alternarModo();
    } else {
      this.secaoImagem.classList.add('hidden-section');
      this.secaoHtml.classList.remove('hidden-section');
      document.getElementById('foto').required = false;
      document.getElementById('html').required = true;
    }
  }

  alternarModo() {
    const modo = document.querySelector('input[name="modo"]:checked').value;
    const secaoImagem = document.getElementById('secao-imagem');
    const secaoRotativo = document.getElementById('secao-rotativo');

    if (modo === 'normal') {
      secaoImagem.style.display = 'block';
      secaoRotativo.style.display = 'none';
      document.getElementById('foto').required = true;
      document.getElementById('fotos-rotativo').required = false;
    } else {
      secaoImagem.style.display = 'none';
      secaoRotativo.style.display = 'block';
      document.getElementById('foto').required = false;
      document.getElementById('fotos-rotativo').required = true;
    }
  }

  setupUpload() {
    // Upload NORMAL (única imagem)
    const area = document.getElementById('upload-imagem');
    const input = document.getElementById('foto');
    const preview = document.getElementById('preview-imagem');

    if (area && input) {
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

    // Upload ROTATIVO (múltiplas imagens)
    const areaRotativo = document.getElementById('upload-rotativo');
    const inputRotativo = document.getElementById('fotos-rotativo');

    if (areaRotativo && inputRotativo) {
      areaRotativo.addEventListener('click', () => inputRotativo.click());

      areaRotativo.addEventListener('dragover', (e) => {
        e.preventDefault();
        areaRotativo.classList.add('dragover');
      });

      areaRotativo.addEventListener('dragleave', () => {
        areaRotativo.classList.remove('dragover');
      });

      areaRotativo.addEventListener('drop', (e) => {
        e.preventDefault();
        areaRotativo.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          inputRotativo.files = files;
          this.handleFilesSelectRotativo(inputRotativo);
        }
      });

      inputRotativo.addEventListener('change', (e) => {
        this.handleFilesSelectRotativo(inputRotativo);
      });
    }
  }

  handleFilesSelectRotativo(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    console.log(`📸 Selecionadas ${files.length} imagens para carrossel`);

    // Inicializar array se não existir
    if (!this.imagensRotativo) {
      this.imagensRotativo = [];
    }

    // Adicionar NOVAS imagens (evitar duplicatas)
    files.forEach(file => {
      // Verificar se já existe uma imagem com o mesmo nome e tamanho
      const existe = this.imagensRotativo.some(f => f.name === file.name && f.size === file.size);
      if (!existe) {
        this.imagensRotativo.push(file);
        console.log(`✅ Imagem adicionada: ${file.name}`);
      } else {
        console.warn(`⚠️ Imagem já existe: ${file.name}`);
      }
    });

    // Validar cada arquivo
    let validas = 0;
    files.forEach((file, index) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        console.warn(`⚠️ Imagem ${index + 1}: Formato inválido`);
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        console.warn(`⚠️ Imagem ${index + 1}: Muito grande`);
        return;
      }
      validas++;
    });

    // Renderizar preview
    this.renderizarPreviewRotativo();
  }

  renderizarPreviewRotativo() {
    const lista = document.getElementById('lista-imagens-rotativo');
    if (!lista) {
      console.error('❌ #lista-imagens-rotativo não encontrado');
      return;
    }

    // Remover duplicatas antes de renderizar
    const files = this.imagensRotativo || [];
    const semDuplicatas = [];
    const nomes = new Set();

    files.forEach(file => {
      const key = `${file.name}-${file.size}`;
      if (!nomes.has(key)) {
        nomes.add(key);
        semDuplicatas.push(file);
      }
    });

    this.imagensRotativo = semDuplicatas;

    if (semDuplicatas.length === 0) {
      lista.innerHTML = '';
      return;
    }

    const files_final = semDuplicatas;

    let html = `
      <div style="background: rgba(var(--brand-rgb), 0.1); padding: var(--s-3); border-radius: var(--r-2); margin-bottom: var(--s-3);">
        <div style="display: flex; align-items: center; gap: var(--s-2); margin-bottom: var(--s-2);">
          <span style="font-size: 1.5rem;">📸</span>
          <div>
            <strong style="display: block; color: var(--brand);">${files_final.length} imagem${files_final.length > 1 ? 's' : ''} no carrossel</strong>
            <span style="font-size: 0.85rem; color: var(--ink-mute);">Rotação automática a cada ${document.getElementById('intervalo-rotacao')?.value || 5}s</span>
          </div>
        </div>
    `;

    // Lista de imagens com botão remover
    files_final.forEach((file, index) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--s-2); background: var(--surface); margin: var(--s-1) 0; border-radius: var(--r-1); border-left: 3px solid var(--brand);">
          <div style="flex: 1;">
            <span style="font-weight: 600;">${index + 1}. ${file.name}</span>
            <span style="display: block; font-size: 0.85rem; color: var(--ink-mute); margin-top: 4px;">${sizeKB} KB • ${file.type}</span>
          </div>
          <button type="button" class="btn-remover-imagem" data-index="${index}" style="padding: var(--s-1) var(--s-2); background: #ff4444; color: white; border: none; border-radius: var(--r-1); cursor: pointer; margin-left: var(--s-2);">
            ✕ Remover
          </button>
        </div>
      `;
    });

    html += `
      <button type="button" id="btn-adicionar-mais" style="margin-top: var(--s-2); padding: var(--s-2) var(--s-3); background: var(--brand); color: white; border: none; border-radius: var(--r-1); cursor: pointer; font-weight: 600; width: 100%;">
        + Adicionar mais imagens
      </button>
      </div>
    `;

    lista.innerHTML = html;

    // Eventos dos botões
    document.querySelectorAll('.btn-remover-imagem').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.removerImagemRotativo(index);
      });
    });

    document.getElementById('btn-adicionar-mais')?.addEventListener('click', () => {
      document.getElementById('fotos-rotativo')?.click();
    });

    console.log('✅ Preview renderizado com sucesso');
  }

  removerImagemRotativo(index) {
    if (!this.imagensRotativo) return;
    this.imagensRotativo = this.imagensRotativo.filter((_, i) => i !== index);
    this.renderizarPreviewRotativo();
    console.log(`🗑️ Imagem ${index + 1} removida`);
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

    // Obter dimensões do local selecionado
    const localId = this.localSelect.value;
    const dimensoes = FormAnuncios.DIMENSOES_LOCAIS[localId];

    // Mostrar preview com dimensões corretas
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';

      // Aplicar dimensões do local (se selecionado)
      if (dimensoes) {
        preview.style.width = `${dimensoes.width}px`;
        preview.style.height = `${dimensoes.height}px`;
        preview.style.maxWidth = `${dimensoes.width}px`;
        console.log(`🖼️ Preview redimensionado para ${dimensoes.width}×${dimensoes.height}px`);
      }
    };
    reader.readAsDataURL(file);

    // Armazenar arquivo para envio posterior
    this.arquivoSelecionado = file;
  }

  async handleSubmit(e) {
    e.preventDefault();

    const nomeInput = document.getElementById('nome');
    const localInput = document.getElementById('local');
    const tipoInput = document.querySelector('input[name="tipo"]:checked');
    const modoRadio = document.querySelector('input[name="modo"]:checked');

    const nome = nomeInput?.value.trim();
    const tipo = tipoInput?.value;
    const local = localInput?.value;
    const modo = modoRadio?.value || 'normal';

    console.log('📝 Validação iniciada:', { nome, tipo, local, modo });
    console.log('   Modo:', modo);
    console.log('   Imagens normais:', this.arquivoSelecionado);
    console.log('   Imagens rotativo:', this.imagensRotativo?.length || 0);

    // Limpar destaques vermelhos anteriores
    document.querySelectorAll('.form-input, .form-select').forEach(el => {
      el.style.borderColor = '';
      el.style.backgroundColor = '';
    });

    const camposFaltando = [];

    // Validar nome
    if (!nome) {
      camposFaltando.push('Nome da Campanha');
      if (nomeInput) {
        nomeInput.style.borderColor = '#e74c3c';
        nomeInput.style.backgroundColor = 'rgba(231, 76, 60, 0.05)';
      }
    }

    // Validar local
    if (!local || local === '') {
      camposFaltando.push('Posição');
      if (localInput) {
        localInput.style.borderColor = '#e74c3c';
        localInput.style.backgroundColor = 'rgba(231, 76, 60, 0.05)';
      }
    }

    // Validar tipo
    if (!tipo) {
      camposFaltando.push('Formato (Imagem ou HTML)');
    }

    // Se faltam campos, mostrar alerta detalhado
    if (camposFaltando.length > 0) {
      const lista = camposFaltando.map(c => `• ${c}`).join('\n');
      alert(`❌ Campos obrigatórios faltando:\n\n${lista}\n\nPreencha os campos destacados em vermelho.`);
      console.log('❌ Validação falhou:', camposFaltando);
      return;
    }

    console.log('✅ Form válido. Prosseguindo com submit...');

    // Validar imagens conforme o modo
    if (tipo === 'imagem') {
      if (modo === 'normal') {
        if (!this.arquivoSelecionado) {
          alert('📷 Modo Normal: Selecione uma imagem.');
          return;
        }
      } else if (modo === 'rotativo') {
        if (!this.imagensRotativo || this.imagensRotativo.length === 0) {
          alert('🎠 Modo Rotativo: Selecione pelo menos 1 imagem.');
          return;
        }
      }
    }

    // Se é HTML, precisa de conteúdo
    if (tipo === 'html' && !document.getElementById('html').value.trim()) {
      alert('💻 Preencha o código HTML.');
      return;
    }

    let imagemJpeg = null;
    let imagemWebp = null;
    let imagensRotativoUpload = [];

    // 1️⃣ UPLOAD OTIMIZADO DE IMAGEM
    if (modo === 'normal' && this.arquivoSelecionado) {
      // MODO NORMAL: 1 imagem
      try {
        console.log('📁 [NORMAL] Arquivo selecionado:', this.arquivoSelecionado.name);

        const uploadFormData = new FormData();
        uploadFormData.append('imagem', this.arquivoSelecionado);
        uploadFormData.append('anuncioId', Date.now());
        uploadFormData.append('localId', local);

        console.log(`📤 Iniciando upload: ${this.arquivoSelecionado.name}`);

        const uploadResponse = await fetch('/api/anuncios/upload/imagem', {
          method: 'POST',
          body: uploadFormData
        });

        console.log(`📥 Status: ${uploadResponse.status}`);
        const uploadJson = await uploadResponse.json();
        console.log('📦 Resposta:', uploadJson);

        if (uploadJson.success) {
          imagemJpeg = uploadJson.data.jpeg;
          imagemWebp = uploadJson.data.webp;
          console.log(`✅ Imagem normal otimizada: JPEG ${uploadJson.data.tamanhos.jpeg} | WebP ${uploadJson.data.tamanhos.webp}`);
        } else {
          alert('Erro ao fazer upload: ' + uploadJson.erro);
          return;
        }
      } catch (err) {
        console.error('❌ Erro upload normal:', err);
        alert('Erro ao fazer upload da imagem.');
        return;
      }
    } else if (modo === 'rotativo' && this.imagensRotativo && this.imagensRotativo.length > 0) {
      // MODO ROTATIVO: múltiplas imagens
      try {
        console.log(`📁 [ROTATIVO] ${this.imagensRotativo.length} imagens para upload...`);

        for (let i = 0; i < this.imagensRotativo.length; i++) {
          const file = this.imagensRotativo[i];
          console.log(`  📤 Enviando imagem ${i + 1}/${this.imagensRotativo.length}: ${file.name}`);

          const uploadFormData = new FormData();
          uploadFormData.append('imagem', file);
          uploadFormData.append('anuncioId', Date.now());
          uploadFormData.append('localId', local);
          uploadFormData.append('indice', i);

          const uploadResponse = await fetch('/api/anuncios/upload/imagem', {
            method: 'POST',
            body: uploadFormData
          });

          console.log(`  📥 Status: ${uploadResponse.status}`);
          const uploadJson = await uploadResponse.json();

          if (uploadJson.success) {
            imagensRotativoUpload.push({
              original: file.name,
              jpeg: uploadJson.data.jpeg,
              webp: uploadJson.data.webp
            });
            console.log(`  ✅ Imagem ${i + 1} uploadada: ${uploadJson.data.jpeg}`);
          } else {
            alert(`Erro ao fazer upload da imagem ${i + 1}: ${uploadJson.erro}`);
            return;
          }
        }

        console.log(`✅ Todas as ${imagensRotativoUpload.length} imagens do carrossel foram uploadadas!`);
      } catch (err) {
        console.error('❌ Erro upload rotativo:', err);
        alert('Erro ao fazer upload das imagens do carrossel.');
        return;
      }
    }

    // 2️⃣ CRIAR ANÚNCIO
    try {
      // Validação final antes de enviar
      console.log('🔍 Validação final:');
      console.log('   nome:', nome, '(vazio?', !nome, ')');
      console.log('   local:', local, '(vazio?', !local, ')');
      console.log('   tipo:', tipo);
      console.log('   modo:', modo);

      if (!nome || !local) {
        console.error('❌ Nome ou Local vazios!');
        alert('❌ Nome e Local são obrigatórios!');
        return;
      }

      const payload = {
        nome,
        tipo,
        local: parseInt(local),
        modo: modo,
        intervaloRotacao: modo === 'rotativo' ? parseInt(document.getElementById('intervalo-rotacao')?.value || 5) : null,
        imagens: modo === 'rotativo' ? imagensRotativoUpload.map(img => img.jpeg) : [],
        destino: document.getElementById('destino').value || null,
        paginas: document.getElementById('todo-site')?.checked ? ['*'] : [],
        criativo: {
          imagem: imagemJpeg,
          imagemWebp: imagemWebp,
          html: tipo === 'html' ? document.getElementById('html').value : null,
          titulo: nome,
          modo: modo,
          intervaloRotacao: modo === 'rotativo' ? parseInt(document.getElementById('intervalo-rotacao')?.value || 5) : null,
          imagensRotativo: imagensRotativoUpload
        }
      };

      console.log('📤 Enviando para API:');
      console.log('   nome:', payload.nome);
      console.log('   tipo:', payload.tipo);
      console.log('   local:', payload.local);
      console.log('   modo:', payload.modo);
      console.log('   intervaloRotacao:', payload.intervaloRotacao);
      console.log('   imagens:', payload.imagens);
      console.log('   criativo:', payload.criativo);
      console.log('   PAYLOAD COMPLETO:', JSON.stringify(payload, null, 2));

      const response = await fetch('/api/anuncios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Status resposta:', response.status);
      const json = await response.json();

      console.log('📥 Resposta API:', JSON.stringify(json, null, 2));

      if (json.success) {
        alert('✓ Anúncio criado com sucesso!');
        window.location.href = '/painel/anuncios/';
      } else {
        alert('Erro ao criar anúncio: ' + (json.erro || 'Tente novamente.'));
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao enviar dados.');
    }
  }
}

// Inicializar quando DOM estiver pronto
let app; // Variável global para acesso aos métodos
document.addEventListener('DOMContentLoaded', () => {
  app = new FormAnuncios();
});
