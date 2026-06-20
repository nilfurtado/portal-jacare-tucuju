import { initPageShell } from './page-shell.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initPageShell({ route: null });
  } catch (err) {
    console.error('Erro ao inicializar página:', err);
  }
});
