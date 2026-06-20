/**
 * Utilitários de upload com preview
 * Responsável por: validação, preview, upload para /api/upload
 */

/**
 * Validar arquivo antes do upload
 * @param {File} file
 * @param {Object} options - { maxSize, allowedTypes }
 * @returns {Object} { valid, error }
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 2 * 1024 * 1024, // 2MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  } = options;

  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }

  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${sizeMB}MB`
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Use: ${allowedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Gerar preview de imagem em base64
 * @param {File} file
 * @returns {Promise<string>} Data URL
 */
export function generatePreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Fazer upload do arquivo para /api/upload
 * @param {File} file
 * @param {string} token - JWT token
 * @param {Function} onProgress - Callback de progresso
 * @returns {Promise<Object>} { url, mime, size, originalName }
 */
export async function uploadFile(file, token, onProgress = null) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const xhr = new XMLHttpRequest();

    // Progresso do upload
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          onProgress(percent);
        }
      });
    }

    return new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            reject(new Error('Resposta inválida do servidor'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.erro || 'Erro no upload'));
          } catch (e) {
            reject(new Error('Erro ao fazer upload'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Erro de conexão'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelado'));
      });

      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  } catch (err) {
    throw new Error(`Erro ao fazer upload: ${err.message}`);
  }
}

/**
 * Gerar thumb/placeholder para imagem não carregada
 * @param {string} text - Texto para mostrar
 * @returns {string} SVG data URL
 */
export function generatePlaceholder(text = '🖼️') {
  const svg = `
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#f0f0f0"/>
      <text x="100" y="75" font-size="40" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
