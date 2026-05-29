# Portal Jacaré Tucujú

> Sistema completo de portal de notícias regional — portal público + painel administrativo (CMS).
> Construído para a redação do Amapá. Open source.

![Status](https://img.shields.io/badge/status-em%20produ%C3%A7%C3%A3o-success)
![Backend](https://img.shields.io/badge/backend-PHP%208.1%20%2B%20MySQL-blueviolet)
![Frontend](https://img.shields.io/badge/frontend-HTML%20%2B%20CSS%20%2B%20JS-blue)
![Hospedagem](https://img.shields.io/badge/hospedagem-Hostinger-purple)

---

## O que tem aqui

| Componente | Stack | O que faz |
|---|---|---|
| **Portal público** | HTML + CSS + JS puro | Site lido pelo público — manchetes, editorias, vídeos, classificados, enquetes |
| **Painel administrativo (PHP)** | PHP 8.1 + MySQL + JWT nativo | CMS pra cadastrar notícias, anúncios, vídeos, usuários, etc. — roda em qualquer hospedagem compartilhada |
| **Painel administrativo (Node)** | Node.js + Express + JSON | Versão alternativa do CMS pra desenvolvimento local (mesma UI, dados em JSON) |
| **Deploy automático** | GitHub Actions + FTP | Push na branch `main` → atualização na Hostinger em ~30 segundos |

---

## Pastas

```
.
├── index.html, noticia.html, ...   # portal público
├── css/, js/, img/, partials/      # assets do portal
├── data/                           # JSONs (fallback do portal)
│
├── painel-php/                     # CMS PHP + MySQL (produção)
│   ├── api/                        # 19 endpoints REST
│   ├── lib/                        # DB, JWT, Auth, Router, Slug
│   ├── public/                     # frontend do painel (24 telas)
│   ├── install.sql                 # schema MySQL (15 tabelas)
│   ├── install.php                 # wizard de instalação
│   └── DEPLOY.md                   # guia detalhado Hostinger
│
├── painel-dm/                      # CMS Node.js (desenvolvimento)
│   └── (mesmo frontend, persistência em JSON)
│
├── .github/workflows/deploy.yml    # deploy automático
└── INTEGRACAO.md                   # como portal ↔ painel se conversam
```

---

## Visual

Estética **editorial/magazine** com tipografia Fraunces + Geist, paleta sóbria laranja-tijolo. Inspiração: jornalismo impresso clássico + workflow CMS moderno.

---

## Tecnologias

- **Frontend portal:** HTML5 + CSS3 (custom design system com tokens) + JS ES modules
- **Backend produção:** PHP 8.1 (sem composer — autoload manual + classes próprias), MySQL 5.7+, JWT HMAC-SHA256 nativo
- **Backend dev:** Node.js 18+, Express 4, JSON files com escrita atômica
- **Fontes:** [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Geist](https://fontshare.com/fonts/geist) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
- **Editor:** [Quill 2.x](https://quilljs.com/) (rich text)
- **Gráficos:** [Chart.js 4.x](https://www.chartjs.org/)

---

## Como rodar localmente

### Portal + painel Node (mais rápido)

```bash
# Portal estático
python -m http.server 8000

# Painel administrativo (em outro terminal)
cd painel-dm
cp .env.example .env       # edite JWT_SECRET
npm install
npm run seed               # cria admin inicial
npm start                  # http://localhost:3000
```

Acesse:
- Portal: <http://localhost:8000>
- Painel: <http://localhost:3000/login.html>

### Painel PHP (produção)

Requer PHP 8.1+ e MySQL. Guia completo: [painel-php/DEPLOY.md](painel-php/DEPLOY.md)

---

## Deploy

Push na branch `main` dispara o workflow `.github/workflows/deploy.yml` que sobe os arquivos via FTP para a hospedagem.

Configuração: ver [GUIA-GITHUB-HOSTINGER.md](GUIA-GITHUB-HOSTINGER.md)

---

## Documentação

| Arquivo | Conteúdo |
|---|---|
| [INTEGRACAO.md](INTEGRACAO.md) | Como portal estático lê dados do painel (API + cache + fallback) |
| [painel-php/DEPLOY.md](painel-php/DEPLOY.md) | Guia passo-a-passo deploy Hostinger PHP+MySQL |
| [painel-php/README.md](painel-php/README.md) | Documentação técnica do painel PHP |
| [painel-dm/README.md](painel-dm/README.md) | Documentação técnica do painel Node |
| [GUIA-GITHUB-HOSTINGER.md](GUIA-GITHUB-HOSTINGER.md) | Configurar deploy automático GitHub → Hostinger |

---

## Funcionalidades do CMS

- ✅ Notícias com editor rich-text, tags, destaque, soft-delete
- ✅ 18 telas administrativas (notícias, anúncios, vídeos, enquetes, classificados, municípios, colunas, comentários, páginas, usuários, plugins, lixeira, tema, layout, acessos, logomarca, configurações)
- ✅ 5 slots publicitários (Pop-up, Super Banner, Half Page, Medium Rectangle, Billboard)
- ✅ Editor de tema com 5 presets de cor + tipografia
- ✅ Personalização completa do layout (8 abas)
- ✅ Sistema de permissões granular (admin / colaborador)
- ✅ Upload de imagens com armazenamento organizado por data
- ✅ Dashboard com gráficos de acessos (Chart.js)
- ✅ Sistema de plugins (13 inclusos)
- ✅ Lixeira unificada (5 tipos com restaurar/excluir definitivo)

---

## Licença

Uso interno do Portal Jacaré Tucujú. Veja `LICENSE` *(a definir)*.

---

## Créditos

Construído com [Claude Code](https://claude.com/claude-code) (Anthropic).
