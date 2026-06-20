# 💾 STATUS DE ARMAZENAMENTO DOS DADOS

**Data:** 31 de maio de 2026, 19:45:00

---

## 📊 RESUMO EXECUTIVO

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| **Armazenamento Ativo** | 📄 **JSON** | Arquivo principal em uso |
| **SQLite** | ⚠️ Configurado | Existe mas NÃO é usado |
| **6 Artigos Amapá** | 📄 JSON | IDs 42-47 em `/data/noticias.json` |
| **Sincronização** | ✅ Funcional | Painel → JSON → Portal |

---

## 🗄️ DISTRIBUIÇÃO DOS DADOS

### 📄 JSON Storage (`/data/noticias.json`)

**Status:** ✅ **ATIVO - ARMAZENAMENTO PRIMÁRIO**

```
/data/noticias.json
├─ Total: 47 artigos
├─ IDs: 1-41 (artigos antigos)
├─ IDs: 42-47 ✅ (6 NOVOS - Amapá)
└─ Último atualizado: 31/05/2026 19:27:29
```

**Artigos do Amapá no JSON:**
```json
[
  { "id": 42, "titulo": "Macapá: Cidade do Equador Recebe...", "municipio": "macapa" },
  { "id": 43, "titulo": "Operação Integrada da Polícia Desmantela...", "municipio": "santana" },
  { "id": 44, "titulo": "Festival de Arte Indígena em Oiapoque...", "municipio": "oiapoque" },
  { "id": 45, "titulo": "Campeonato Estadual de Futebol...", "municipio": "laranjal-do-jari" },
  { "id": 46, "titulo": "Mazagão Registra Crescimento Econômico...", "municipio": "mazagao" },
  { "id": 47, "titulo": "Porto Grande Inaugura Rodovia Estratégica...", "municipio": "porto-grande" }
]
```

✅ **Conclusão:** Os 6 artigos estão SALVOS no JSON

---

### 🗄️ SQLite Database (`painel-dm/data/painel.db`)

**Status:** ⚠️ **CONFIGURADO MAS NÃO ATIVO**

```
painel.db
├─ Tabelas: 10
│  ├─ noticias (34 artigos)
│  ├─ categorias
│  ├─ municipios
│  ├─ videos
│  ├─ enquetes
│  └─ ... (5 outras)
│
└─ Artigos Amapá: 33 artigos
   └─ IDs 1-33 (artigos ANTIGOS, não contém os 6 novos)
```

**Últimas 6 Notícias no SQLite:**
```
ID 34: Teste do João
ID 33: Porto de Santana bate recorde
ID 32: Trem vence de virada
ID 31: Macapá recebe 3ª Mostra de Arte Indígena
ID 30: Polícia Federal deflagra operação
ID 29: Governo anuncia pacote R$ 200 milhões
```

❌ **Conclusão:** Os 6 artigos NÃO estão no SQLite (IDs 42-47 não existem)

---

## 🔄 FLUXO DE DADOS ATUAL

```
┌─────────────────────────────┐
│  Painel DM (Criar Artigos)  │
│  script: criar-artigos-amapa.js
└────────────┬────────────────┘
             │
             │ store.js usa JSON
             ↓
    /data/noticias.json ✅
    (47 artigos incluindo 6 novos)
             │
             │ Portal lê
             ↓
┌─────────────────────────────┐
│   Portal (Exibir Artigos)   │
│   /data/noticias.json       │
│   ✅ 6 artigos visíveis     │
└─────────────────────────────┘
```

**SQLite está desconectado deste fluxo**

---

## 🔍 POR QUE SQLITE NÃO FOI ATUALIZADO?

### 1. **Store.js Usa Apenas JSON**

[painel-dm/lib/store.js](painel-dm/lib/store.js) implementa:
```javascript
async function read(name, fallback = []) {
  const file = fullPath(name); // Procura em /data/
  const raw = await fs.readFile(file, 'utf8'); // Lê arquivo
  return JSON.parse(raw); // Parse JSON
}
```

- ✅ Lê/escreve arquivos JSON
- ❌ Não toca em SQLite

### 2. **Script Usa store.js**

[criar-artigos-amapa.js](painel-dm/scripts/criar-artigos-amapa.js):
```javascript
const store = require('../lib/store');
const noticias = await store.read('noticias', []);
noticiasAtuais.push(artigo);
await store.update('noticias', () => noticiasAtuais);
```

- Usa `store.read()` e `store.update()`
- Que operam em JSON, não SQLite

### 3. **Nenhum Código Toca em SQLite**

- ❌ Nenhum endpoint escreve em SQLite
- ❌ Nenhum script inicializa SQLite
- ❌ SQLite existe mas está orphan (isolado)

---

## 📈 MATRIZ DE DADOS

| ID | Título | JSON | SQLite | Status |
|----|--------|------|--------|--------|
| 1-33 | Artigos Antigos | ✅ | ✅ | Sincronizados (antes) |
| 34 | Teste do João | ? | ✅ | Apenas em SQLite |
| 35-41 | Artigos (gap) | ? | ❌ | Desconhecido |
| **42-47** | **6 Artigos Amapá** | **✅** | **❌** | **Apenas em JSON** |

---

## ⚙️ CONFIGURAÇÃO ATUAL

### Store Configuration
- **Sistema Ativo:** JSON File System
- **Localização:** `/data/noticias.json`
- **Modo:** Leitura/Escrita atômica (usa lock + rename temp)
- **Camada Cache:** localStorage em portal (TTL 60s)

### SQLite Configuration
- **Status:** Existe mas não é usado
- **Localização:** `/painel-dm/data/painel.db`
- **Conexão:** better-sqlite3 (instalado mas não chamado)
- **Tabelas:** 10 tabelas criadas
- **Dados:** 34 artigos (desatualizado)

---

## 🎯 SITUAÇÃO ATUAL

### ✅ O que está funcionando
1. **Painel DM** cria artigos ✅
2. **JSON** salva dados ✅
3. **Portal** acessa JSON ✅
4. **Sincronização** funciona ✅
5. **6 Artigos Amapá** estão visíveis no Portal ✅

### ⚠️ O que precisa melhorar
1. **SQLite desatualizado** - 34 artigos vs 47 no JSON
2. **Duplicação de dados** - JSON e SQLite dessincronizados
3. **Sem backup** - SQLite poderia ser backup
4. **Sem transações** - JSON não tem ACID como SQLite

---

## 🚀 OPÇÕES PARA RESOLVER

### Opção 1: Manter Apenas JSON (Atual - Simples)
```
✅ Pros:
  • Simples de manter
  • Sem dependências de banco
  • Funciona perfeitamente para portal
  
❌ Contras:
  • Sem transações (ACID)
  • Sem índices para performance
  • SQLite fica orphan
```

### Opção 2: Migrar para SQLite (Recomendado)
```
✅ Pros:
  • Performance melhor (índices)
  • Transações ACID
  • Backup e recuperação
  
❌ Contras:
  • Requer refactoring de store.js
  • Migration dos 47 artigos
  • Mais complexo
```

### Opção 3: Manter Ambos (Hybrid)
```
✅ Pros:
  • JSON como fallback
  • SQLite como primário
  • Melhor resilience
  
❌ Contras:
  • Sincronização entre bancos
  • Mais código
  • Mais manutenção
```

---

## 📝 RECOMENDAÇÃO

**Para o propósito atual (Portal de Notícias):**

### ✅ **MANTER JSON** (Status Quo)
- Funciona 100%
- Simples e confiável
- Portal sincroniza perfeitamente
- 6 artigos Amapá estão visíveis

### 🔄 **PARA FUTURA MIGRAÇÃO:**

Se precisar de SQLite depois:

1. **Criar migration script:**
   ```javascript
   // Ler all from JSON
   const data = require('/data/noticias.json');
   
   // Inserir em SQLite
   for (const article of data) {
     db.prepare(`INSERT INTO noticias VALUES (...)`).run(...);
   }
   ```

2. **Atualizar store.js:**
   - Adicionar métodos SQLite
   - Manter fallback JSON
   - Sincronizar ambos

3. **Testar sincronização:**
   - Criar artigo no Painel
   - Verificar JSON ✅
   - Verificar SQLite ✅

---

## 📊 CHECKLIST DE VALIDAÇÃO

| Item | Status | Ação |
|------|--------|------|
| JSON com 47 artigos | ✅ | Nenhuma |
| 6 artigos Amapá em JSON | ✅ | Nenhuma |
| Portal sincronizado | ✅ | Nenhuma |
| SQLite atualizado | ❌ | Opcional (Fase 2) |
| Backup SQLite | ❌ | Opcional (Fase 2) |

---

## 🎯 CONCLUSÃO

**SITUAÇÃO ATUAL:**
- ✅ 6 artigos Amapá estão **SALVOS em JSON**
- ✅ Portal está **SINCRONIZADO** (vê todos os 47)
- ⚠️ SQLite existe mas não está sendo usado
- ✅ **INTEGRAÇÃO FUNCIONAL 100%**

**NÃO PRECISA TOMAR AÇÃO AGORA**

O sistema está operacional. SQLite pode ser ativado na Fase 2 do roadmap se necessário maior robustez ou performance.

---

**Status Final:** ✅ **SISTEMA FUNCIONAL**  
**Armazenamento Primário:** 📄 JSON  
**Portal Sincronizado:** ✅ SIM  
**6 Artigos Amapá:** ✅ VISÍVEIS
