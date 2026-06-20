# Painel DM — PHP + MySQL

Versão em **PHP 8.1+ / MySQL 5.7+** do painel administrativo do Portal Jacaré Tucujú. Roda em **qualquer hospedagem compartilhada PHP** (Hostinger, Locaweb, HostGator, KingHost, etc.).

> Esta é a versão de produção. Para a versão de desenvolvimento em Node.js (mais rápida de testar localmente), veja `painel-dm/`. As duas têm exatamente o mesmo frontend e expõem os mesmos endpoints REST.

---

## Stack

| Camada | Tecnologia | Notas |
|---|---|---|
| **Backend** | PHP 8.1+ (vanilla, sem composer) | Classes próprias para DB, JWT, Router, Auth |
| **Banco** | MySQL 5.7+ / MariaDB 10.3+ | 15 tabelas + JSON columns para campos polimórficos |
| **Auth** | JWT HMAC-SHA256 nativo | Sem dependências externas |
| **Frontend** | HTML + CSS + JS puro | Fraunces, Geist, JetBrains Mono. **Idêntico ao painel-dm.** |
| **Editor** | Quill 2.x (CDN) | Para conteúdo de notícias e páginas |
| **Gráficos** | Chart.js 4.x (CDN) | Dashboard de acessos |

---

## Estrutura

```
painel-php/
├── index.php                  ← front-controller
├── install.php                ← instalador web (execute 1 vez)
├── install.sql                ← schema MySQL completo
├── migrate.php                ← migra data/*.json do painel-dm
├── .env.example               ← copie para .env
├── .htaccess                  ← Apache rewrite + segurança
├── DEPLOY.md                  ← guia Hostinger passo a passo
├── api/                       ← handlers REST (1 arquivo por recurso)
│   ├── auth.php, noticias.php, categorias.php, anuncios.php, config.php
│   ├── municipios.php, videos.php, enquetes.php, classificados.php
│   ├── classificados-categorias.php, colunas.php, comentarios.php
│   ├── paginas.php, usuarios.php, plugins.php, lixeira.php
│   ├── tema.php, acessos.php, upload.php
├── lib/                       ← classes core
│   ├── Env.php, DB.php, JWT.php, Auth.php
│   ├── Request.php, Response.php, Router.php, Slug.php
├── public/                    ← frontend (HTML/CSS/JS, idêntico ao painel-dm)
│   ├── login.html, index.html, ... (24 páginas)
│   ├── css/, js/, partials/, img/
└── storage/
    ├── uploads/               ← uploads ficam aqui (também acessível via /img/uploads/)
    └── logs/                  ← logs em modo development
```

---

## Endpoints (espelham 1:1 o painel-dm Node)

| Recurso | Endpoints |
|---|---|
| auth | `POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/logout` |
| noticias | `GET / GET /:id POST PUT PATCH /:id/destaque DELETE /:id` |
| categorias | CRUD por `slug` |
| anuncios | CRUD + `PATCH /:id/ativar` + `GET /api/anuncios/public` (sem auth) |
| videos | CRUD |
| enquetes | CRUD + `PATCH /:id/ativar` |
| classificados | CRUD + sub-recurso `classificados-categorias` |
| municipios | CRUD por `slug` |
| colunas | CRUD |
| comentarios | `POST` público + `PATCH /:id/aprovar` `/rejeitar` |
| paginas | CRUD |
| usuarios | CRUD + `PATCH /:id/status` |
| plugins | `GET` · `PATCH /:id/instalar` · `/desinstalar` · `/atualizar` |
| lixeira | `GET /:tipo` · `POST /:tipo/:id/restaurar` · `DELETE /:tipo/:id` · `DELETE /:tipo` |
| tema | `GET /api/tema` · `PUT /api/tema` · `GET /api/tema/public` |
| config | `GET /api/config` · `PUT /api/config` · `GET /api/config/public` |
| acessos | `GET /api/acessos` |
| upload | `POST /api/upload` (multipart `file`) |

---

## Instalação rápida (TL;DR)

1. Crie um banco MySQL no painel da hospedagem
2. `cp .env.example .env` e preencha as credenciais
3. Suba toda a pasta `painel-php/` via FTP para `public_html/painel/`
4. Acesse `https://seudominio.com.br/painel/install.php` e siga os 4 passos
5. Acesse `login.html` e faça login com as credenciais do `.env`
6. **Apague `install.php`** e `migrate.php` após uso

**Guia completo:** [DEPLOY.md](DEPLOY.md)

---

## Diferenças vs painel-dm (Node.js)

| Aspecto | painel-dm (Node) | painel-php (PHP) |
|---|---|---|
| Onde roda | Node.js 18+ | PHP 8.1+ + Apache/Nginx |
| Persistência | JSON files (`data/*.json`) | MySQL |
| Hospedagem | VPS / Render / Railway | Qualquer shared PHP (Hostinger, etc.) |
| Frontend | Idêntico | Idêntico |
| API | Idêntica | Idêntica |
| Auth | JWT (jsonwebtoken) | JWT (nativo) |
| Performance | Excelente até ~5k notícias | Excelente até dezenas de milhares (índices MySQL) |

**Para migrar do Node para o PHP:** use o `migrate.php` que importa todos os `data/*.json` automaticamente.

---

## Roadmap futuro (opcional)

- [ ] Cache de queries (Redis ou APCu)
- [ ] Full-text search nativo nas notícias (índice `ft_busca` já existe)
- [ ] WebSockets para notificações em tempo real (push)
- [ ] Painel mobile (PWA)
- [ ] Exportar relatório PDF de acessos
- [ ] Integração com Google Analytics 4

---

## Licença

Uso interno do Portal Jacaré Tucujú.
