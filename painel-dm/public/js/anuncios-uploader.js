/**
 * Anúncios Uploader — Upload de criativos com cola/anexa
 */

class AnunciosUploader {
  constructor(options = {}) {
    this.anuncioId = options.anuncioId;
    this.token = localStorage.getItem('painel-dm:token');
    
    this.inputFile = document.querySelector(options.inputSelector || '#anuncio-criativo-input');
    this.previewImg = document.querySelector(options.previewSelector || '#anuncio-preview-img');
    this.statusEl = document.querySelector(options.statusSelector || '#anuncio-status');
    
    if (!this.inputFile) {
      console.error('❌ AnunciosUploader: input file não encontrado!');
      return;
    }

    this.setupListeners();
  }

  setupListeners() {
    // File input
    this.inputFile.addEventListener('change', (e) => this.handleFileSelect(e));

    // Dropzone
    const dropZone = document.querySelector('.anuncio-drop-zone');
    if (dropZone) {
      dropZone.addEventListener('click', () => this.inputFile.click());

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--brand)';
        dropZone.style.backgroundColor = 'rgba(218,125,27,0.05)';
      });

      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--paper-line)';
        dropZone.style.backgroundColor = 'transparent';
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--paper-line)';
        dropZone.style.backgroundColor = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) this.handleFileSelect({ target: { files } });
      });

      dropZone.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        
        for (let item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) this.handleFileSelect({ target: { files: [file] } });
            break;
          }
        }
      });
    }

    // Paste global
    document.addEventListener('paste', (e) => {
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
          if (file) this.handleFileSelect({ target: { files: [file] } });
          break;
        }
      }
    });
  }

  async handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showStatus('Arquivo deve ser uma imagem', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.showStatus('Arquivo muito grande (máximo 2MB)', 'error');
      return;
    }

    this.showStatus('📤 Processando imagem...', 'loading');
    
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.previewImg) {
        this.previewImg.src = e.target.result;
        this.previewImg.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);

    this.showStatus('✅ Imagem carregada! Clique em "Salvar" para confirmar.', 'success');
  }

  showStatus(msg, type = 'info') {
    if (!this.statusEl) return;

    this.statusEl.textContent = msg;
    this.statusEl.style.cssText = `
      padding: 12px;
      border-radius: 4px;
      margin: 12px 0;
      ${
        type === 'success' ? 'background: #e8f5e9; color: #2e7d32;' :
        type === 'error' ? 'background: #ffebee; color: #c62828;' :
        type === 'loading' ? 'background: #e3f2fd; color: #1565c0;' :
        'background: #fff3e0; color: #e65100;'
      }
    `;

    if (type !== 'loading') {
      setTimeout(() => {
        if (this.statusEl?.textContent === msg) {
          this.statusEl.textContent = '';
        }
      }, 5000);
    }
  }

  getImageFile() {
    return this.inputFile.files?.[0];
  }

  reset() {
    this.inputFile.value = '';
    if (this.previewImg) {
      this.previewImg.src = '';
      this.previewImg.style.display = 'none';
    }
    this.statusEl.textContent = '';
  }
}

export default AnunciosUploader;
