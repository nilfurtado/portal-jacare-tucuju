# Deploy na Hostinger — Painel DM (PHP + MySQL)

Guia completo para subir o portal + painel administrativo na **hospedagem compartilhada PHP da Hostinger** (Single, Premium ou Business).

Tempo estimado: **30–45 minutos**.

---

## Pré-requisitos

- ✅ Plano de hospedagem ativo na Hostinger com PHP 8.1+
- ✅ Domínio configurado (ex: `seudominio.com.br`)
- ✅ Cliente FTP instalado (recomendado: [FileZilla](https://filezilla-project.org)) **ou** acesso ao **Gerenciador de Arquivos** do hPanel
- ✅ Pasta `painel-php/` deste repositório pronta

---

## Arquitetura final

```
seudominio.com.br/                 ← Portal público (HTML estático)
seudominio.com.br/painel/          ← Painel administrativo (PHP + MySQL)
seudominio.com.br/img/uploads/     ← Imagens enviadas via painel
```

> **Variante recomendada (subdomínio):**
> `painel.seudominio.com.br` → painel
> `seudominio.com.br` → portal
>
> Isso permite SSL separado e cookies isolados. Veja [Seção 7](#7-variante-subdom%C3%ADnio).

---

## 1. Criar banco MySQL no hPanel

1. Acesse o **hPanel** da Hostinger
2. Menu lateral → **Bancos de Dados → MySQL**
3. Clique em **Criar Novo Banco MySQL**
4. Preencha:
   - **Banco MySQL:** `portaljt_dm` (vira algo como `u123456789_portaljt_dm`)
   - **Usuário:** `portaljt_user`
   - **Senha:** *gere uma forte com 16+ caracteres* (clique no botão "Gerar senha")
5. **Anote os 3 dados que aparecem no quadro de "Lista de bancos de dados MySQL":**
   - Host MySQL (geralmente `localhost` na Hostinger)
   - Nome do banco completo (com prefixo `u123456789_`)
   - Usuário completo (com prefixo `u123456789_`)
   - Senha

---

## 2. Preparar arquivos locais

No seu PC, dentro de `site de noticias/painel-php/`:

### 2.1 Criar o `.env`

```bash
cp .env.example .env
```

Edite o `.env` com os dados anotados:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_portaljt_dm
DB_USER=u123456789_portaljt_user
DB_PASS=A_SENHA_QUE_VOCE_GEROU
DB_CHARSET=utf8mb4

# Gere com: openssl rand -hex 32  (ou use https://generate-secret.vercel.app/32)
JWT_SECRET=cole_aqui_32_caracteres_aleatorios_de_verdade
JWT_EXPIRES_HOURS=8

APP_ENV=production
APP_URL=https://seudominio.com.br/painel
PORTAL_URL=https://seudominio.com.br

ADMIN_NOME=Redação
ADMIN_EMAIL=seu_email@portaljt.com.br
ADMIN_SENHA=Senha@Forte#2026
```

> ⚠️ **NÃO comite o `.env` em git.** Já está no `.gitignore`.

---

## 3. Upload via FTP

### Opção A — FileZilla (recomendado)

1. Abra o FileZilla
2. Pegue os dados de FTP no hPanel: **Arquivos → Conta FTP**
3. Conecte:
   - Servidor: `ftp.seudominio.com.br` ou IP fornecido
   - Usuário/senha do hPanel
   - Porta: `21`

4. No lado direito (servidor), navegue até `public_html/`

5. Faça upload da estrutura assim:

```
public_html/
├── index.html              ← do portal (raiz do projeto)
├── noticia.html
├── categoria.html
├── ... (demais HTMLs do portal)
├── css/                    ← do portal
├── js/                     ← do portal
├── data/                   ← (vai virar legado depois da migração)
├── img/                    ← do portal + uploads
│   ├── logo.svg
│   ├── favicon.svg
│   └── uploads/            ← criar pasta vazia, chmod 755
└── painel/                 ← AQUI vai TODA a pasta painel-php/
    ├── .env                ← com as credenciais reais
    ├── .htaccess
    ├── index.php
    ├── install.php
    ├── install.sql
    ├── migrate.php
    ├── api/
    ├── lib/
    ├── public/
    └── storage/
```

> 💡 **NÃO** suba: `node_modules/`, `painel-dm/` (versão Node), arquivos `__autologin.html`, `__taballer.html`, `*.log`, `.git/`.

### Opção B — Gerenciador de Arquivos do hPanel

1. **Arquivos → Gerenciador de Arquivos**
2. Entre em `public_html/`
3. Crie pasta `painel/`
4. Compacte localmente `painel-php/` num `.zip`
5. **Carregar Arquivos** → seleciona o zip → **Extrair**
6. Renomeie a pasta extraída se necessário para `painel/`

---

## 4. Permissões de pasta

No FileZilla (clique direito → **Permissões do arquivo**) ou via hPanel:

| Pasta/arquivo | Permissão |
|---|---|
| `public_html/img/uploads/` | **755** (rwxr-xr-x) |
| `public_html/painel/.env` | **600** (rw-------) — fica oculto para outras contas |
| `public_html/painel/storage/` | **755** |

---

## 5. Instalar o banco

1. Abra no navegador: `https://seudominio.com.br/painel/install.php`
2. Você verá a tela do **Instalador**
3. Clique nos passos em sequência:
   - **01** Pré-requisitos → confere que o `.env` está OK
   - **02** Criar tabelas → executa o `install.sql` (cria 15 tabelas + dados iniciais)
   - **03** Admin → cria o usuário com as credenciais do `.env`
   - **04** Finalizar → trava o instalador (`install.locked`)

4. **Delete o arquivo `install.php` via FTP** após concluir (boa prática de segurança)

---

## 6. Migrar dados existentes (opcional, só se já tem o painel Node rodando)

Se você está vindo do `painel-dm/` Node.js e quer trazer todos os JSONs:

1. Suba os arquivos `data/*.json` para `public_html/data/`
2. Acesse `https://seudominio.com.br/painel/migrate.php`
3. Vai mostrar quantos itens migraram de cada coleção
4. **Delete o arquivo `migrate.php`** via FTP após concluir

---

## 7. Variante subdomínio

Para deixar `painel.seudominio.com.br` separado do portal principal:

1. hPanel → **Domínios → Subdomínios → Criar Subdomínio**
   - Subdomínio: `painel`
   - Pasta: `painel`
2. Suba `painel-php/` para `public_html/painel/` normalmente
3. Acesse `https://painel.seudominio.com.br/install.php`

**Vantagem:** SSL separado, cookies isolados, mais fácil de proteger por IP.

---

## 8. SSL grátis (Let's Encrypt)

Hostinger oferece SSL automático em todos os planos:

1. hPanel → **Segurança → SSL/TLS**
2. Selecione o domínio principal e o subdomínio (se criou)
3. Clique **Instalar SSL** — ativo em 5 minutos
4. Marque **Forçar HTTPS** → todos os acessos `http://` redirecionam para `https://`

---

## 9. Pós-instalação — checklist

- [ ] Acesse `https://seudominio.com.br/painel/login.html`
- [ ] Faça login com `ADMIN_EMAIL` / `ADMIN_SENHA`
- [ ] Vá em **Configurações** e ajuste nome do portal, redes sociais
- [ ] Vá em **Logomarca** e suba os arquivos
- [ ] Vá em **Temas** e escolha a paleta
- [ ] Cadastre a primeira notícia em **Notícias**
- [ ] Confirme que aparece em `https://seudominio.com.br/`
- [ ] Ative o slot **Super Banner** em **Anúncios** e suba um criativo de teste

---

## 10. Backup automático

A Hostinger faz backup diário automático nos planos Premium/Business. Para fazer backup **manual** do banco:

1. hPanel → **Bancos de Dados → MySQL**
2. Clique em **phpMyAdmin** ao lado do seu banco
3. Aba **Exportar → Executar** → baixa `.sql`

Para backup dos **arquivos**:

1. hPanel → **Arquivos → Backups**
2. **Gerar Novo Backup**

Recomendo backup manual antes de qualquer mudança grande.

---

## 11. Troubleshooting

| Erro | Causa | Solução |
|---|---|---|
| **500 Internal Server Error** | PHP < 8.1 | hPanel → **PHP → Versão do PHP** → selecione 8.1+ |
| `Class "PDO" not found` | extensão MySQL desabilitada | hPanel → **PHP → Extensões** → habilite `pdo_mysql` |
| `Access denied for user...` | senha errada no `.env` | reabra `.env` e cole de novo as credenciais do hPanel |
| `Unable to write to /storage/uploads` | permissões | `chmod 755 img/uploads` via FTP |
| `Token ausente` ao logar | JWT_SECRET vazio | preencha `JWT_SECRET` no `.env` (32+ caracteres) |
| Upload retorna 413 | limite do PHP | hPanel → **PHP → Configurações** → aumente `upload_max_filesize` e `post_max_size` para `16M` |
| `.htaccess` ignorado | `AllowOverride` | Hostinger já permite. Confirme que enviou o arquivo com nome exato `.htaccess` |

---

## 12. Atualizações futuras

Quando lançar nova versão do painel:

1. Baixe o `.env` da hospedagem (não deve mudar)
2. Substitua os arquivos do painel via FTP (mantenha `.env` + `img/uploads/`)
3. Se houver schema novo, rode `migrate.php` (que vai detectar e ajustar)

---

## 13. Performance — dicas extras

- **OPcache** já vem habilitado na Hostinger por padrão
- **Cache de browser:** o `.htaccess` já inclui `mod_expires` com TTLs adequados
- **CDN:** ative o **Hostinger CDN** no hPanel para servir CSS/JS/imagens via Cloudflare grátis
- **Compressão:** ativada via `mod_deflate` no `.htaccess`

---

## Suporte

- Documentação: `painel-php/README.md`
- Help da Hostinger: [hostinger.com.br/tutoriais](https://www.hostinger.com.br/tutoriais)
- Chat suporte Hostinger: disponível 24/7 no hPanel
