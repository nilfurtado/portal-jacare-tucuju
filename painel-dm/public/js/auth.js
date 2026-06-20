/**
 * Auth: login flow + guard de rotas autenticadas.
 */
import { apiPost, getToken, setToken, setUser, getUser } from './api.js';

export async function login(credencial, senha) {
  const data = await apiPost('/auth/login', { usuario: credencial, senha });
  setToken(data.token);
  setUser(data.usuario);
  return data.usuario;
}

export function logout() {
  console.log('🚪 logout() chamado');
  console.log('1️⃣ Limpando token');
  setToken(null);
  console.log('2️⃣ Limpando user');
  setUser(null);
  console.log('3️⃣ Redirecionando para login');
  console.log('Token após limpar:', localStorage.getItem('painel-dm:token'));
  console.log('User após limpar:', localStorage.getItem('painel-dm:user'));
  location.href = '/painel/login.html';
}

export function requireAuth() {
  if (!getToken()) {
    location.href = '/painel/login.html';
    return null;
  }
  return getUser();
}

export function redirectIfAuth() {
  if (getToken()) location.href = '/painel/';
}
