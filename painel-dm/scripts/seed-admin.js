/**
 * Cria o usuário admin inicial em data/usuarios.json
 * Lê credenciais do .env (ADMIN_NOME, ADMIN_EMAIL, ADMIN_SENHA).
 * Não sobrescreve se já existir admin com o mesmo email.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const store = require('../lib/store');
const { nextId } = require('../lib/ids');

async function main() {
  const nome  = process.env.ADMIN_NOME  || 'Administrador';
  const email = process.env.ADMIN_EMAIL || 'admin@portaljt.com.br';
  const senha = process.env.ADMIN_SENHA || 'Admin@2026';

  const usuarios = await store.read('usuarios', []);
  const existe = usuarios.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (existe) {
    console.log(`Usuário admin já existe: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(senha, 10);
  const novo = {
    id: nextId(usuarios),
    nome,
    email,
    senha: hash,
    tipo: 'admin',
    status: 'S',
    foto: null,
    telefone: '',
    cidade: '',
    estado: 'AP',
    sobre: '',
    permissoes: {
      paginas: [],
      categorias: [],
      municipios: [],
      colunas: [],
      anuncios: [],
      destinos: [],
      veiculacaoAds: true,
    },
    criadoEm: new Date().toISOString(),
  };
  usuarios.push(novo);
  await store.write('usuarios', usuarios);

  console.log(`\n  ✓ Admin criado com sucesso\n`);
  console.log(`    Nome:  ${nome}`);
  console.log(`    Email: ${email}`);
  console.log(`    Senha: ${senha}\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
