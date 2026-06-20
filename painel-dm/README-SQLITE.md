# 🗄️ Banco SQLite — Painel DM

O Painel DM agora usa **SQLite** em vez de JSON para armazenar dados. Todos os dados estão em um arquivo único `data/painel.db`.

## 📊 Tabelas Disponíveis

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| `usuarios` | 3 | Usuários do painel (Redação, Nildo, João) |
| `noticias` | 34 | Notícias publicadas |
| `categorias` | 6 | Categorias (Política, Polícia, Cultura, etc) |
| `municipios` | 0 | Municípios do Amapá |
| `videos` | - | Vídeos para a seção |
| `enquetes` | - | Enquetes disponíveis |
| `paginas` | - | Páginas estáticas |
| `comentarios` | - | Comentários nas notícias |

## 🔧 Usar o Banco Localmente

### Opção 1 — VS Code (Recomendado)

1. Instale a extensão: **SQLite** (by alexcvzz)
2. Clique com botão direito em `painel-dm/data/painel.db`
3. Selecione "Open Database"
4. Explore as tabelas e escreva queries SQL

### Opção 2 — DBeaver

1. Baixe [DBeaver Community](https://dbeaver.io/)
2. Crie nova conexão SQLite
3. Aponte para `painel-dm/data/painel.db`
4. Acesse todas as tabelas com interface gráfica

### Opção 3 — CLI

```bash
# Instale sqlite3 CLI (Windows)
choco install sqlite  # ou via https://www.sqlite.org/download.html

# Acesse o banco
sqlite3 painel-dm/data/painel.db

# Veja as tabelas
.tables

# Query exemplo
SELECT nome, email, tipo FROM usuarios;

# Saia
.quit
```

## 🔄 Migração de JSON para SQLite

Os dados já foram migrados. Se precisar de novo:

```bash
cd painel-dm
npm run migrate
```

Ou manualmente:
```bash
node scripts/migrate-to-sqlite.js
```

## 📝 Exemplos de Queries

### Ver todos os usuários
```sql
SELECT id, nome, email, tipo FROM usuarios;
```

### Ver notícias por categoria
```sql
SELECT titulo, categoria, COUNT(*) FROM noticias GROUP BY categoria;
```

### Ver notícias mais lidas
```sql
SELECT titulo, views FROM noticias ORDER BY views DESC LIMIT 10;
```

### Criar novo usuário (via API, não SQL direto)
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Usuário",
    "email": "novo@portaljt.com.br",
    "senha": "senha1234",
    "tipo": "colaborador"
  }'
```

## 🔐 Credenciais dos Usuários

| Usuário | Email | Senha | Tipo |
|---------|-------|-------|------|
| Redação | admin@portaljt.com.br | Admin@2026 | Admin |
| Nildo | nildo@portaljt.com.br | admin1234 | Admin |
| João | joao@portaljt.com.br | - | Colaborador |

## 📦 Estrutura do Banco

```
painel-dm/
├── data/
│   └── painel.db          ← Banco SQLite (104 KB)
├── lib/
│   ├── db.js              ← Inicialização do SQLite
│   └── db-store.js        ← Interface de leitura/escrita
└── scripts/
    └── migrate-to-sqlite.js  ← Script de migração
```

## 🚀 Iniciar Servidor com SQLite

```bash
cd painel-dm
npm start
```

O servidor carregará automaticamente o SQLite e servirá os dados da mesma forma.

## 💡 Dicas

- ✅ SQLite é levíssimo e perfeito para desenvolvimento
- ✅ Não precisa de servidor separado
- ✅ Dados persistem em arquivo único
- ✅ Fácil backup (copie `painel.db`)
- ⚠️ Para produção, migre para PostgreSQL ou MySQL se necessário

---

**Estrutura criada em:** 2026-05-30  
**Versão:** 1.0 — SQLite
