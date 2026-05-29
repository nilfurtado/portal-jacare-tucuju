/**
 * Auth: login flow + guard de rotas autenticadas.
 */
import { apiPost, getToken, setToken, setUser, getUser } from './api.js';

export async function login(email, senha) {
  const data = await apiPost('/auth/login', { email, senha });
  setToken(data.token);
  setUser(data.usuario);
  return data.usuario;
}

export function logout() {
  setToken(null);
  setUser(null);
  location.href = '/login.html';
}

export function requireAuth() {
  if (!getToken()) {
    location.href = '/login.html';
    return null;
  }
  return getUser();
}

export function redirectIfAuth() {
  if (getToken()) location.href = '/index.html';
}
