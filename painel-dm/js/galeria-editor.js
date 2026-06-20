/**
 * Editor de Galerias — Componente visual para gerenciar imagens
 * Funcionalidades: upload, preview, reordenar (drag-drop), editar caption/alt, remover
 */

import { validateFile, generatePreview, uploadFile, generatePlaceholder } from './lib-upload.js';
import { enableDragSort, getCurrentOrder } from './lib-drag-sort.js';

export class GalleryEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      maxImages: 10,
      maxFileSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      token: localStorage.getItem('painel-dm:token'),
      ...options
    };

    this.images = [];
    this.uploading = false;

    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    const html = `
      <div class="gallery-editor">
        <div class="gallery-editor__header">
          <h3 class="gallery-editor__title">📸 Galeria de Imagens</h3>
          <button
            type="button"
            class="gallery-editor__btn-add"
            data-action="add-image"
            ${this.images.length >= this.options.maxImages ? 'disabled' : ''}
          >
            + Adicionar Imagem
          </button>
        </div>

        <div class="gallery-editor__message" data-empty-state style="display: ${this.images.length === 0 ? 'block' : 'none'}">
          <p>Nenhuma imagem adicionada. Clique em "Adicionar Imagem" para começar.</p>
        </div>

        <div class="gallery-editor__list" data-gallery-list>
          ${this.renderImages()}
        </div>

        <input
          type="file"
          accept="image/*"
          style="display: none;"
          data-file-input
        />

        <div class="gallery-editor__info">
          <small>${this.images.length} / ${this.options.maxImages} imagens</small>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  renderImages() {
    if (this.images.length === 0) return '';

    return this.images
      .map((img, idx) => `
        <div
          class="gallery-editor__item"
          data-sort-item
          data-item-id="${img.id}"
          data-item-index="${idx}"
        >
          <div class="gallery-editor__item-image">
            <img
              src="${img.src || generatePlaceholder('⌛')}"
              alt="${img.alt || `Imagem ${idx + 1}`}"
              onerror="this.src='${generatePlaceholder('❌')}'"
            >
            ${img.uploading ? `
              <div class="gallery-editor__upload-progress" data-progress="${idx}">
                <div class="gallery-editor__progress-bar"></div>
              </div>
            ` : ''}
          </div>

          <div class="gallery-editor__item-content">
            <input
              type="text"
              class="gallery-editor__caption-input"
              placeholder="Descrição (caption)"
              value="${img.caption || ''}"
              data-field="caption"
              data-img-id="${img.id}"
            >
            <input
              type="text"
              class="gallery-editor__alt-input"
              placeholder="Texto alternativo (acessibilidade)"
              value="${img.alt || ''}"
              data-field="alt"
              data-img-id="${img.id}"
            >
            <small class="gallery-editor__item-url">${img.src || 'Carregando...'}</small>
          </div>

          <div class="gallery-editor__item-actions">
            <button
              type="button"
              class="gallery-editor__btn-remove"
              data-action="remove"
              data-img-id="${img.id}"
              title="Remover imagem"
            >
              🗑️
            </button>
          </div>
        </div>
      `)
      .join('');
  }

  attachEvents() {
    const addBtn = this.container.querySelector('[data-action="add-image"]');
    const fileInput = this.container.querySelector('[data-file-input]');
    const list = this.container.querySelector('[data-gallery-list]');

    // Botão adicionar imagem
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        fileInput.click();
      });
    }

    // Selecionar arquivo
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          await this.addImage(file);
        }
        fileInput.value = '';
      });
    }

    // Remover imagem
    this.container.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const imgId = btn.getAttribute('data-img-id');
        this.removeImage(imgId);
      });
    });

    // Editar caption/alt
    this.container.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', (e) => {
        const imgId = input.getAttribute('data-img-id');
        const field = input.getAttribute('data-field');
        const value = input.value;
        this.updateImage(imgId, { [field]: value });
      });
    });

    // Drag-and-drop para reordenar
    if (this.images.length > 1 && list) {
      enableDragSort(list, {
        itemSelector: '[data-sort-item]',
        onReorder: (newOrder) => this.reorderImages(newOrder)
      });
    }
  }

  async addImage(file) {
    // Validar arquivo
    const validation = validateFile(file, {
      maxSize: this.options.maxFileSize,
      allowedTypes: this.options.allowedTypes
    });

    if (!validation.valid) {
      alert(`Erro: ${validation.error}`);
      return;
    }

    // Validar limite de imagens
    if (this.images.length >= this.options.maxImages) {
      alert(`Máximo de ${this.options.maxImages} imagens atingido`);
      return;
    }

    // Gerar preview temporário
    const preview = await generatePreview(file);

    // Criar objeto de imagem
    const imgId = `img-${Date.now()}`;
    const imageObj = {
      id: imgId,
      src: preview,
      caption: '',
      alt: file.name,
      uploading: true,
      originalFile: file
    };

    this.images.push(imageObj);
    this.render();
    this.attachEvents();

    // Fazer upload
    try {
      const result = await uploadFile(file, this.options.token, (progress) => {
        const progressEl = this.container.querySelector(`[data-progress="${this.images.length - 1}"]`);
        if (progressEl) {
          progressEl.style.opacity = progress / 100;
        }
      });

      // Atualizar com URL do servidor
      const idx = this.images.findIndex(img => img.id === imgId);
      if (idx >= 0) {
        this.images[idx].src = result.url;
        this.images[idx].uploading = false;
        delete this.images[idx].originalFile;
        this.render();
        this.attachEvents();
      }
    } catch (err) {
      alert(`Erro ao fazer upload: ${err.message}`);
      this.removeImage(imgId);
    }
  }

  removeImage(imgId) {
    const idx = this.images.findIndex(img => img.id === imgId);
    if (idx >= 0) {
      this.images.splice(idx, 1);
      this.render();
      this.attachEvents();
    }
  }

  updateImage(imgId, updates) {
    const img = this.images.find(i => i.id === imgId);
    if (img) {
      Object.assign(img, updates);
    }
  }

  reorderImages(newOrder) {
    const reordered = [];
    newOrder.forEach((id, idx) => {
      const img = this.images.find(i => i.id === id);
      if (img) {
        img.ordem = idx;
        reordered.push(img);
      }
    });
    this.images = reordered;
  }

  /**
   * Obter dados da galeria para enviar à API
   */
  getGaleria() {
    return this.images.map((img, idx) => ({
      id: img.id,
      src: img.src,
      caption: img.caption || '',
      alt: img.alt || `Imagem ${idx + 1}`,
      ordem: idx
    }));
  }

  /**
   * Carregar galeria existente
   */
  setGaleria(imagens = []) {
    this.images = imagens.map((img, idx) => ({
      id: img.id || `img-${Date.now()}-${idx}`,
      src: img.src,
      caption: img.caption || '',
      alt: img.alt || `Imagem ${idx + 1}`,
      uploading: false,
      ordem: img.ordem || idx
    }));

    this.render();
    this.attachEvents();
  }
}
