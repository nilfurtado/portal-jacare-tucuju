/**
 * Capa Uploader — Componente de upload + preview de capas de notícias
 * Gera preview das 5 dimensões após upload
 */

const PREVIEW_DIMS = {
  principal: { w: 1200, h: 675 },
  homepage: { w: 800, h: 450 },
  sidebar: { w: 400, h: 225 },
  mobile: { w: 600, h: 338 },
  social: { w: 1200, h: 630 }
};

class CapaUploader {
  constructor(options = {}) {
    console.log('🔧 CapaUploader inicializando...', options);

    this.noticiId = options.noticiId;
    this.token = localStorage.getItem('painel-dm:token');
    this.capaData = null;

    this.inputFile = document.querySelector(options.inputSelector || '#capa-input');
    this.previewGrid = document.querySelector(options.previewGridSelector || '#capa-preview-grid');
    this.altInput = document.querySelector(options.altSelector || '#capa-alt');
    this.statusEl = document.querySelector(options.statusSelector || '#capa-status');

    console.log('📋 Elementos encontrados:', {
      inputFile: !!this.inputFile,
      previewGrid: !!this.previewGrid,
      altInput: !!this.altInput,
      statusEl: !!this.statusEl
    });

    if (!this.inputFile) {
      console.error('❌ CapaUploader: input file (#capa-input) não encontrado!');
      return;
    }

    console.log('✅ CapaUploader inicializado com sucesso');
    this.setupListeners();
  }

  setupListeners() {
    console.log('🎯 Registrando event listeners...');

    // Upload via file input
    this.inputFile.addEventListener('change', (e) => {
      console.log('📂 Arquivo selecionado:', e.target.files?.[0]?.name);
      this.handleFileSelect(e);
    });

    // Drag & drop + click para abrir file picker
    const dropZone = document.querySelector('.capa-drop-zone');
    console.log('📦 Dropzone encontrada?', !!dropZone);

    if (dropZone) {
      // Click abre file picker
      dropZone.addEventListener('click', () => {
        console.log('🖱️ Click na dropzone detectado');
        this.inputFile.click();
      });

      // Drag & drop
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = 'var(--brand)';
        dropZone.style.backgroundColor = 'rgba(218,125,27,0.05)';
      });

      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = 'var(--paper-line)';
        dropZone.style.backgroundColor = 'transparent';
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = 'var(--paper-line)';
        dropZone.style.backgroundColor = 'transparent';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileSelect({ target: { files } });
        }
      });

      // Paste de imagens do clipboard
      dropZone.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              this.handleFileSelect({ target: { files: [file] } });
            }
            break;
          }
        }
      });
    }

    // Paste global — funciona em qualquer lugar da página
    document.addEventListener('paste', (e) => {
      // Só ativa se não estiver focado em input de texto
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' && activeEl.type === 'text' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            this.handleFileSelect({ target: { files: [file] } });
          }
          break;
        }
      }
    });

  }

  async handleFileSelect(event) {
    const file = event.target.files?.[0];
    console.log('📸 handleFileSelect chamado com arquivo:', file?.name, file?.size, file?.type);

    if (!file) {
      console.warn('⚠️ Nenhum arquivo selecionado');
      return;
    }

    // Validação básica
    if (!file.type.startsWith('image/')) {
      console.error('❌ Arquivo não é imagem:', file.type);
      this.showStatus('Arquivo deve ser uma imagem', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      console.error('❌ Arquivo muito grande:', file.size);
      this.showStatus('Arquivo muito grande (máximo 8MB)', 'error');
      return;
    }

    console.log('✅ Validação passou, iniciando upload...');
    await this.uploadFile(file);
  }

  async uploadFile(file) {
    if (!this.noticiId) {
      this.showStatus('noticiId não definido', 'error');
      return;
    }

    const originalSize = file.size;
    this.showStatus(`📤 Enviando: ${this.formatFileSize(originalSize)}...`, 'loading');
    this.showProgress(true);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress event
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          this.updateProgress(percentComplete);
          this.showStatus(`📤 Enviando: ${percentComplete}%`, 'loading');
        }
      });

      xhr.addEventListener('load', async () => {
        this.showProgress(false);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            this.capaData = data.capa;
            this.originalFileSize = originalSize;
            this.renderPreview();
            this.updateRemoveButton();
            this.showStatus('✓ Capa atualizada com sucesso!', 'success');
            resolve();
          } catch (err) {
            this.showStatus(`Erro ao processar resposta: ${err.message}`, 'error');
            reject(err);
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            this.showStatus(`Erro: ${data.erro || 'Upload falhou'}`, 'error');
          } catch {
            this.showStatus(`Erro ${xhr.status}: Upload falhou`, 'error');
          }
          reject(new Error('Upload falhou'));
        }
      });

      xhr.addEventListener('error', () => {
        this.showProgress(false);
        this.showStatus('Erro de conexão ao fazer upload', 'error');
        reject(new Error('Erro de conexão'));
      });

      xhr.addEventListener('abort', () => {
        this.showProgress(false);
        this.showStatus('Upload cancelado', 'error');
        reject(new Error('Upload cancelado'));
      });

      const fd = new FormData();
      fd.append('file', file);
      fd.append('noticiId', this.noticiId);

      xhr.open('POST', '/api/noticias-capa/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      xhr.send(fd);
    });
  }

  showProgress(show) {
    const progressEl = document.getElementById('capa-progress');
    if (progressEl) {
      progressEl.style.display = show ? 'block' : 'none';
    }
  }

  updateProgress(percent) {
    const bar = document.getElementById('capa-progress-bar');
    const text = document.getElementById('capa-progress-text');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = percent + '%';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  }

  renderPreview() {
    if (!this.previewGrid || !this.capaData) return;

    this.previewGrid.innerHTML = '';

    const dim = PREVIEW_DIMS.principal;
    const card = document.createElement('div');
    card.className = 'capa-preview-card';
    card.style.cssText = `
      width: 100%;
      background: var(--surface-2);
      border-radius: var(--r-3);
      overflow: hidden;
      transition: all var(--d-1);
      border: 1px solid var(--paper-line);
    `;

    const box = document.createElement('div');
    box.className = 'capa-preview-box';
    box.style.cssText = `
      position: relative;
      width: 100%;
      padding-top: ${(dim.h / dim.w) * 100}%;
      background: var(--surface);
      overflow: hidden;
    `;

    const webpUrl = this.capaData['principalWebp'];
    const jpegUrl = this.capaData['principal'];

    const img = document.createElement('img');
    img.src = webpUrl || jpegUrl;
    img.alt = 'Prévia da capa';
    img.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;

    box.appendChild(img);

    // Badge de formato (mais suave)
    const badge = document.createElement('span');
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0,0,0,0.5);
      color: white;
      padding: 4px 10px;
      border-radius: var(--r-pill);
      font-size: 11px;
      font-weight: 500;
    `;
    badge.textContent = webpUrl ? 'WebP' : 'JPEG';
    box.appendChild(badge);

    card.appendChild(box);

    const label = document.createElement('div');
    label.style.cssText = `
      padding: var(--s-4);
      background: var(--surface);
      border-top: 1px solid var(--paper-line);
      font-size: 13px;
      color: var(--ink-soft);
    `;

    const titleEl = document.createElement('strong');
    titleEl.style.cssText = 'display: block; color: var(--ink); margin-bottom: 6px;';
    titleEl.textContent = 'Imagem principal';

    const dimEl = document.createElement('small');
    dimEl.style.cssText = 'display: block; color: var(--ink-mute); font-family: var(--font-mono);';
    dimEl.textContent = `${dim.w} × ${dim.h}px`;

    label.appendChild(titleEl);
    label.appendChild(dimEl);
    card.appendChild(label);

    this.previewGrid.appendChild(card);

    // Mostrar informações gerais de tamanho
    if (this.originalFileSize && this.capaData.metadados) {
      const meta = this.capaData.metadados;
      const savings = Math.round(((this.originalFileSize - meta.tamanho) / this.originalFileSize) * 100);
      const infoMsg = `✓ ${meta.largura} × ${meta.altura}px · ${this.formatFileSize(meta.tamanho)} (${savings}% otimizado)`;
      setTimeout(() => this.showStatus(infoMsg, 'success'), 300);
    }
  }

  showStatus(msg, type = 'info') {
    if (!this.statusEl) return;

    this.statusEl.textContent = msg;
    this.statusEl.style.cssText = `
      padding: 12px;
      border-radius: 4px;
      font-size: 14px;
      margin: 12px 0;
      ${
        type === 'success' ? 'background: #e8f5e9; color: #2e7d32; border-left: 4px solid #4caf50;' :
        type === 'error' ? 'background: #ffebee; color: #c62828; border-left: 4px solid #f44336;' :
        type === 'loading' ? 'background: #e3f2fd; color: #1565c0; border-left: 4px solid #2196f3;' :
        'background: #fff3e0; color: #e65100; border-left: 4px solid #ff9800;'
      }
    `;

    if (type !== 'loading') {
      setTimeout(() => {
        if (this.statusEl && this.statusEl.textContent === msg) {
          this.statusEl.textContent = '';
        }
      }, 5000);
    }
  }

  getCapaData() {
    return this.capaData;
  }

  setCapaData(data) {
    this.capaData = data;
    this.renderPreview();
    this.updateRemoveButton();
  }

  resetCapa() {
    this.showConfirmModal(
      'Remover imagem?',
      'Isso vai remover a imagem atual. Você pode fazer upload de uma nova depois.',
      () => {
        this.capaData = null;
        this.originalFileSize = null;
        this.previewGrid.innerHTML = '';
        this.inputFile.value = '';
        this.statusEl.textContent = '';
        document.getElementById('capa-json').value = '{}';
        this.updateRemoveButton();
        this.showStatus('✓ Imagem removida. Você pode fazer upload de uma nova.', 'info');
      }
    );
  }

  showConfirmModal(title, message, onConfirm) {
    // Remover modal anterior se existir
    const existingModal = document.getElementById('capa-confirm-modal');
    if (existingModal) existingModal.remove();

    // Criar overlay
    const overlay = document.createElement('div');
    overlay.id = 'capa-confirm-modal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    `;

    // Criar modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: var(--surface);
      border-radius: var(--r-3);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
      animation: slideUp 0.3s ease-out;
      border: 1px solid var(--paper-line);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: var(--s-5);
      border-bottom: 1px solid var(--paper-line);
      display: flex;
      align-items: flex-start;
      gap: var(--s-3);
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
      font-size: 24px;
      flex-shrink: 0;
      margin-top: 2px;
    `;
    icon.textContent = '⚠️';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      flex: 1;
      color: var(--ink);
      font-weight: 600;
      font-size: 16px;
    `;
    titleEl.textContent = title;

    header.appendChild(icon);
    header.appendChild(titleEl);
    modal.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.style.cssText = `
      padding: var(--s-5);
      color: var(--ink-soft);
      font-size: 14px;
      line-height: 1.5;
    `;
    body.textContent = message;
    modal.appendChild(body);

    // Footer com botões
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: var(--s-4) var(--s-5);
      border-top: 1px solid var(--paper-line);
      display: flex;
      gap: var(--s-3);
      justify-content: flex-end;
    `;

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.style.cssText = `
      padding: 8px 16px;
      border: 1px solid var(--paper-line);
      background: var(--surface-2);
      color: var(--ink-soft);
      border-radius: var(--r-2);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--d-1);
    `;
    btnCancel.textContent = 'Cancelar';
    btnCancel.onmouseover = () => {
      btnCancel.style.background = 'var(--surface)';
      btnCancel.style.borderColor = 'var(--paper-line)';
    };
    btnCancel.onmouseout = () => {
      btnCancel.style.background = 'var(--surface-2)';
    };
    btnCancel.onclick = () => overlay.remove();

    const btnConfirm = document.createElement('button');
    btnConfirm.type = 'button';
    btnConfirm.style.cssText = `
      padding: 8px 16px;
      border: 1px solid #d32f2f;
      background: #d32f2f;
      color: white;
      border-radius: var(--r-2);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--d-1);
    `;
    btnConfirm.textContent = 'Remover';
    btnConfirm.onmouseover = () => {
      btnConfirm.style.background = '#b71c1c';
      btnConfirm.style.borderColor = '#b71c1c';
    };
    btnConfirm.onmouseout = () => {
      btnConfirm.style.background = '#d32f2f';
      btnConfirm.style.borderColor = '#d32f2f';
    };
    btnConfirm.onclick = () => {
      overlay.remove();
      onConfirm();
    };

    footer.appendChild(btnCancel);
    footer.appendChild(btnConfirm);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Fechar ao clicar no overlay (fora do modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Fechar com ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Adicionar animações CSS se não existirem
    if (!document.getElementById('capa-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'capa-modal-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Focus no botão de confirmação
    btnConfirm.focus();
  }

  updateRemoveButton() {
    const btn = document.getElementById('capa-remove-btn');
    if (btn) {
      btn.style.display = this.capaData ? 'block' : 'none';
    }
  }
}

export default CapaUploader;
