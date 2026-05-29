# Painel DM — Portal Jacaré Tucujú

Admin completo para gerenciar notícias, anúncios, vídeos, enquetes, classificados, municípios, colunas, usuários e configurações do portal.

**Stack:** Node.js + Express + JSON files (mesma fonte de verdade que o portal estático).
**Auth:** JWT + bcrypt.
**Visual:** estética editorial/magazine com tipografia Fraunces + Geist + JetBrains Mono.

---

## Instalação local

```bash
cd painel-dm
npm install
cp .env.example .env        # ajuste JWT_SECRET, ADMIN_EMAIL, ADMIN_SENHA
npm run seed                # cria usuário admin em ../data/usuarios.json
npm start                   # http://localhost:3000
```

Acesse `http://localhost:3000/login.html` com as credenciais do `.env`.

---

## Estrutura

```
painel-dm/
├── server.js              # Express bootstrap
├── api/                   # routers REST
├── lib/                   # store atômico, ids, slugify
├── middleware/            # auth-jwt, permissoes
├── scripts/seed-admin.js  # cria admin inicial
└── public/                # frontend admin estático
    ├── login.html
    ├── index.html         # dashboard
    ├── partials/shell.html
    ├── css/               # tokens · motion · painel · forms · tabela · login
    └── js/                # api · auth · ui · shell
```

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (default 3000) |
| `NODE_ENV` | `development` ou `production` |
| `JWT_SECRET` | Segredo do JWT (>= 32 caracteres em produção) |
| `JWT_EXPIRES` | Expiração do token (`8h`, `7d`, etc.) |
| `ADMIN_NOME`  | Nome do admin seed |
| `ADMIN_EMAIL` | Email do admin seed |
| `ADMIN_SENHA` | Senha do admin seed |

---

## Endpoints (Fase 1)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login → retorna `{ token, usuario }` |
| `GET` | `/api/auth/me` | Dados do usuário autenticado |
| `POST` | `/api/auth/logout` | Encerra sessão (stateless: cliente descarta token) |

Próximas fases adicionam CRUD para: `noticias`, `categorias`, `anuncios`, `videos`, `enquetes`, `classificados` (+ sub), `municipios`, `colunas`, `comentarios`, `usuarios`, `config`, `lixeira`, `upload`, `acessos`.

---

## Deploy Hostinger

Requer plano com Node.js (Business+, Cloud ou VPS).

```bash
# Na VPS
git clone <repo>
cd painel-dm && npm install --production
cp .env.example .env && nano .env       # configurar secrets
node scripts/seed-admin.js
npm install -g pm2
pm2 start server.js --name painel-dm
pm2 save && pm2 startup
```

Configurar Nginx:
```nginx
server {
  server_name painel.seudominio.com.br;
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

SSL via Certbot (`certbot --nginx -d painel.seudominio.com.br`).

---

## Fases de entrega

| Fase | Status | Entrega |
|------|--------|---------|
| **1** Estrutura + Auth | ✅ pronta | Login funcional, dashboard com métricas, shell editorial |
| **2** Notícias (CRUD) | — | Cadastrar/listar/editar/lixeira + Quill editor |
| **3** Anúncios + integração portal | — | CRUD ad slots + `ads-loader.js` no portal |
| **4** Categorias + Municípios + Configurações | — | Edição dos JSONs base |
| **5** Vídeos + Enquetes + Classificados | — | CRUD completos |
| **6** Colunas + Comentários + Páginas + Usuários | — | Permissões granulares |
| **7** Lixeira + Acessos + Logomarca + Temas | — | Soft-delete + analytics |
| **8** Deploy Hostinger | — | PM2 + Nginx + SSL |
