/**
 * Slugify: converte texto em slug seguro para URL.
 * Remove acentos, normaliza espaços, lowercase, hifens.
 */
function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function uniqueSlug(base, existing) {
  let slug = slugify(base);
  let i = 2;
  const set = new Set(existing);
  while (set.has(slug)) {
    slug = `${slugify(base)}-${i++}`;
  }
  return slug;
}

module.exports = { slugify, uniqueSlug };
