# Guia: GitHub → Hostinger (deploy automático)

Passo-a-passo completo para conectar este repositório ao GitHub e fazer deploy automático na sua hospedagem Hostinger (plano Single ou superior).

**Tempo total:** ~15 minutos.
**Resultado final:** todo `git push` na branch `main` → arquivos atualizados na Hostinger em ~30 segundos.

---

## Visão geral

```
SEU PC                    GITHUB                    HOSTINGER
┌──────┐  git push      ┌──────────┐   FTP        ┌──────────┐
│ code ├───────────────►│ Actions  ├─────────────►│ public_  │
│      │                │ workflow │              │ html/    │
└──────┘                └──────────┘              └──────────┘
                          (script já          (site atualizado)
                          pronto no repo)
```

---

## Parte 1 — Preparar o repositório local

> Você já está no diretório `site de noticias/`.

### 1.1 Verificar que tudo crítico está ignorado

Antes do primeiro commit, confira que esses arquivos **NÃO** vão entrar no repo:

```bash
git status --ignored 2>/dev/null || dir /a
```

Deve ignorar:
- `painel-dm/.env` (credenciais locais)
- `painel-dm/node_modules/` (peso de instalação)
- `data/usuarios.json` (hash bcrypt do admin)
- `img/uploads/` (arquivos enviados em runtime)
- `.claude/` (contexto do agente)

Já está tudo configurado no `.gitignore`. Se quiser auditar manualmente:

```bash
cat .gitignore
```

### 1.2 Inicializar o git

```bash
cd "site de noticias"
git init
git branch -M main
git add .
git commit -m "Primeiro commit — Portal Jacaré Tucujú"
```

---

## Parte 2 — Criar repositório no GitHub

### 2.1 No site do GitHub

1. Vá para <https://github.com/new>
2. Preencha:
   - **Repository name:** `portal-jacare-tucuju` *(ou outro nome)*
   - **Description:** "Portal de notícias regional do Amapá"
   - **Visibility:** **Public** (já escolheu)
   - ❌ **NÃO** marque "Add a README file" (você já tem)
   - ❌ **NÃO** marque ".gitignore" nem "license"
3. Clique **Create repository**

### 2.2 Conectar o repo local ao GitHub

O GitHub vai mostrar uma tela com comandos. Use o bloco **"…or push an existing repository from the command line"**:

```bash
git remote add origin https://github.com/SEU_USUARIO/portal-jacare-tucuju.git
git push -u origin main
```

Vai pedir login (use **token de acesso pessoal**, não senha — GitHub aboliu senha em 2021):

- Vá em <https://github.com/settings/tokens>
- **Generate new token (classic)**
- Marque `repo` (acesso a repos)
- Copie e use como senha no `git push`

> 💡 **Dica:** instale o [GitHub CLI](https://cli.github.com/) (`gh auth login`) e nunca mais lide com tokens — autentica via browser.

---

## Parte 3 — Pegar credenciais FTP da Hostinger

### 3.1 Criar conta FTP no hPanel

1. Acesse o **hPanel** da Hostinger
2. Menu lateral → **Arquivos → Conta FTP**
3. Se ainda não tem uma conta:
   - **Criar nova conta FTP**
   - Usuário: `deploy@seudominio.com.br` (ou similar)
   - Senha: clique **Gerar senha forte** e copie
   - Pasta: `/public_html` (raiz do seu site)

4. **Anote os 4 dados** que aparecem:
   - **FTP Host:** `ftp.seudominio.com.br` (ou IP)
   - **FTP Port:** 21
   - **FTP Username:** o que você criou
   - **FTP Password:** a senha gerada

---

## Parte 4 — Configurar GitHub Secrets

Os Secrets são variáveis criptografadas que só o workflow do GitHub consegue ler. As credenciais FTP **nunca** ficam expostas no repo público.

### 4.1 No GitHub

1. Abra o repositório no GitHub
2. Aba **Settings** → menu lateral **Secrets and variables → Actions**
3. Clique **New repository secret** e crie os 4:

| Name | Secret (valor) |
|---|---|
| `HOSTINGER_FTP_HOST` | `ftp.seudominio.com.br` *(do passo 3.1)* |
| `HOSTINGER_FTP_USER` | usuário FTP que você criou |
| `HOSTINGER_FTP_PASS` | senha FTP |
| `HOSTINGER_FTP_DIR` | `/public_html/` *(com as barras)* |

Cada um: cole o valor → **Add secret**.

---

## Parte 5 — Disparar o primeiro deploy

### 5.1 Push de qualquer alteração

```bash
# Faz uma alteração mínima (exemplo: comentário no README)
echo "" >> README.md
git add README.md
git commit -m "ci: testando deploy automático"
git push
```

### 5.2 Acompanhar o deploy

1. Abra o repo no GitHub → aba **Actions**
2. Você vai ver "Deploy to Hostinger" rodando 🟡
3. Em ~30-60 segundos vira ✅ verde
4. Abra `https://seudominio.com.br/` → arquivos atualizados

### 5.3 Se der erro vermelho ❌

Clique na execução para ver os logs. Causas mais comuns:

| Erro | Solução |
|---|---|
| `ECONNREFUSED` | FTP_HOST errado |
| `530 Login authentication failed` | usuário ou senha errados |
| `550 Permission denied` | `HOSTINGER_FTP_DIR` aponta pra pasta que não existe |
| `Timeout` | Hostinger às vezes demora — refazer disparando manualmente (aba Actions → **Re-run jobs**) |
| `connect ETIMEDOUT` | porta 21 bloqueada pelo provedor de internet do GitHub Actions — troque `protocol: ftps` para `protocol: ftp` em `.github/workflows/deploy.yml` |

---

## Parte 6 — Instalar o painel PHP (uma vez só)

O deploy sobe os arquivos, mas o banco MySQL precisa ser criado **uma única vez** manualmente:

1. **No hPanel:** crie um banco MySQL (anote nome/usuário/senha)
2. **Via FTP** (FileZilla): edite `public_html/painel-php/.env.example` → renomeie para `.env` → preencha as credenciais do banco + JWT_SECRET
3. **Navegador:** acesse `https://seudominio.com.br/painel-php/install.php` → siga os 4 passos
4. **Delete** `install.php` via FTP após concluir

Guia detalhado: [painel-php/DEPLOY.md](painel-php/DEPLOY.md)

---

## Workflow diário (depois do setup)

A partir daqui, é só:

```bash
# Edita um arquivo (HTML, CSS, JS, PHP — qualquer coisa)
nano index.html

# Commit + push
git add index.html
git commit -m "ajuste no carrossel do hero"
git push

# Em 30s o site está atualizado. Confere em:
# https://seudominio.com.br/
```

---

## Limitações importantes

- ❌ O deploy **não cria nem altera o banco MySQL automaticamente.** Mudanças de schema (novas colunas/tabelas) precisam ser aplicadas via phpMyAdmin manualmente.
- ❌ Arquivos em `data/usuarios.json`, `.env`, `img/uploads/` **não são sobrescritos** (estão na lista de exclusão do workflow).
- ❌ `painel-dm/` (versão Node) também não sobe — é só pra desenvolvimento local.
- ✅ Tudo o mais é sincronizado: portal estático, painel-php, partials, css, js, data (exceto os ignorados).

---

## Acessar o repo pra mudar Secret ou workflow

1. **Editar deploy:** edite `.github/workflows/deploy.yml` direto no GitHub (botão de lápis ✏️) ou local + push
2. **Rotacionar senha FTP:** hPanel → muda → atualiza secret `HOSTINGER_FTP_PASS` no GitHub
3. **Desativar deploy temporariamente:** aba Actions → workflow "Deploy to Hostinger" → menu `…` → **Disable workflow**

---

## Próximos passos sugeridos

- [ ] Adicionar badge de status do deploy no README (`![Deploy](https://github.com/SEU_USUARIO/portal-jacare-tucuju/actions/workflows/deploy.yml/badge.svg)`)
- [ ] Adicionar workflow secundário pra testar PHP syntax (`php -l`) antes do deploy
- [ ] Configurar **branch protection** em `main` (impede push direto, exige PR)
- [ ] Habilitar **Dependabot** pra alerta de vulnerabilidades

---

## Dúvidas frequentes

**"O painel-dm/ tá no repo público. Tem problema?"**
Não — só tem código Node. Sem credenciais (o `.env` está ignorado). É documentação de como o sistema funciona em dev.

**"Pode alguém roubar meu site clonando o repo?"**
Não. Sem o banco MySQL preenchido e sem as credenciais do `.env`, o painel não funciona. Quem clonar precisa criar próprio banco e configurar do zero.

**"E se eu quiser deixar o repo privado depois?"**
Settings → Change repository visibility → Private. O deploy continua funcionando.
