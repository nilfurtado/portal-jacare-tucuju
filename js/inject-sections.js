/**
 * 🔄 Inject Sections Dinâmicos
 * Lê categorias.json via API e injeta sections na home
 * Garante que IDs dos sections sempre correspondem aos slugs
 *
 * Isso resolve: IDs de sections sempre sincronizados com categorias.json
 * Sempre que categorias.json mudar, a home renderiza com IDs corretos
 */

export async function injetarSectionsDinamicos() {
  try {
    // 1️⃣ Tentar carregar da API (mais atualizado)
    let categorias = [];
    try {
      const res = await fetch('http://localhost:3000/api/portal/bootstrap');
      const data = await res.json();
      categorias = data.categorias || [];
      console.log('[inject-sections] ✅ Categorias carregadas da API (', categorias.length, 'items)');
    } catch (apiErr) {
      // 2️⃣ Fallback para dados.json se API falhar
      console.warn('[inject-sections] ⚠️ API indisponível, usando dados.json');
      const res = await fetch('data/dados.json?v=' + Date.now());
      const data = await res.json();
      categorias = data.categorias || [];
    }

    // Encontrar container onde injeta sections
    const container = document.getElementById('main-grid-primary');
    if (!container) {
      console.warn('[inject-sections] ❌ Container #main-grid-primary não encontrado');
      return false;
    }

    // Limpar container (remover qualquer section anterior)
    container.innerHTML = '';

    // Gerar e injetar sections para cada categoria (na ordem correta)
    categorias.forEach((cat) => {
      const section = document.createElement('section');
      section.className = 'cat-section';
      section.id = `section-${cat.slug}`;
      section.dataset.slug = cat.slug;
      section.dataset.ordem = cat.ordem || 999;

      container.appendChild(section);
      console.log(`[inject-sections] ✅ section-${cat.slug} (ordem ${cat.ordem})`);
    });

    // Injetar section de colunistas no final
    const colunistasSection = document.createElement('section');
    colunistasSection.className = 'colunistas-section';
    colunistasSection.id = 'section-colunistas';
    container.appendChild(colunistasSection);

    console.log('[inject-sections] ✅', categorias.length, 'sections injetados (sempre sincronizados com categorias.json)');
    return true;
  } catch (err) {
    console.error('[inject-sections] ❌ Erro fatal:', err.message);
    return false;
  }
}
