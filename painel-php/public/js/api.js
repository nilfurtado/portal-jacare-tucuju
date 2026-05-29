/**
 * API helper — fetch wrapper com JWT e tratamento de erro.
 *
 * Detecta automaticamente o caminho base do painel.
 * Suporta instalação na raiz (/) ou em sub-path (/painel-php/).
 */
const TOKEN_KEY = 'painel-dm:token';
const USER_KEY  = 'painel-dm:user';

// Diretório base do painel (ex: "/painel-php" ou "" se na raiz)
export function getBasePath() {
  // Remove o arquivo final (ex: /painel-php/login.html → /painel-php)
  const dir = location.pathname.replace(/\/[^/]*$/, '');
  return dir === '/' ? '' : dir;
}

// Base URL da API (ex: "/painel-php/api")
export function getApiBase() {
  return getBasePath() + '/api';
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
}
export function setUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body,
  });

  let data = null;
  const txt = await res.text();
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      setUser(null);
      if (!location.pathname.endsWith('/login.html')) {
        location.href = '/login.html';
      }
    }
    const err = new Error(data?.erro || `Erro ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const apiGet    = (p)      => api(p);
export const apiPost   = (p, b)   => api(p, { method: 'POST',   body: b });
export const apiPut    = (p, b)   => api(p, { method: 'PUT',    body: b });
export const apiPatch  = (p, b)   => api(p, { method: 'PATCH',  body: b });
export const apiDelete = (p)      => api(p, { method: 'DELETE' });
