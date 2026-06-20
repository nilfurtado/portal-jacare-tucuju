# RSS Importer Crash Analysis

## Problema Identificado

O servidor Node.js está crashing ~3 segundos após iniciar quando `initRSSImporter()` é chamado em `server.js:431`.

**Causa Raiz**: Erro de EventEmitter não capturado na biblioteca `rss-feed-emitter`.

---

## Stack Trace e Diagnóstico

### Fluxo do Crash

1. **server.js:431** - `initRSSImporter()` é chamada SEM `await`:
   ```javascript
   // TEMPORARIAMENTE DESABILITADO - Causando crash do servidor
   // initRSSImporter();
   ```

2. **rss-importer.js:115-132** - Função assíncrona que carrega feeds:
   ```javascript
   async function initRSSImporter() {
     try {
       const feeds = await store.read('auto-post-feeds', []);
       feeds.forEach(feed => {
         if (!feed.ativo) return;
         addFeedListener(feed);  // <-- PROBLEMA COMEÇA AQUI
       });
     } catch (err) {
       console.error('[RSS Importer] Erro ao inicializar:', err.message);
     }
   }
   ```

3. **rss-importer.js:137-152** - `addFeedListener()` adiciona feed ao emitter:
   ```javascript
   function addFeedListener(feed) {
     if (activeFeeds.has(feed.id)) return;
     try {
       emitter.add({
         url: feed.url,
         refresh: feed.intervalo * 3600 * 1000,
         skipHours: [],
         skipDays: []
       });
       activeFeeds.set(feed.id, feed);
     } catch (err) {
       console.error(`[RSS Importer] Erro ao adicionar feed...`);
     }
   }
   ```

4. **node_modules/rss-feed-emitter/src/FeedEmitter.js:246-248** - Chamada assíncrona sem `await`:
   ```javascript
   createSetInterval(feed) {
     const feedManager = new FeedManager(this, feed);
     feedManager.getContent(true);  // <-- ASYNC SEM AWAIT!
     // ... resto do código
   }
   ```

5. **node_modules/rss-feed-emitter/src/FeedManager.js:108-125** - Promise assíncrona é criada:
   ```javascript
   async getContent(firstload) {
     const items = await this.feed.fetchData();  // <-- PODE FALHAR
     // ...
   }
   ```

6. **node_modules/rss-feed-emitter/src/Feed.js:200,212-217** - Erro é emitido no EventEmitter:
   ```javascript
   handleError(error) {
     if (this.handler) {
       this.handler.handle(error);  // <-- Emite para FeedManager
     } else {
       throw error;  // <-- Lança exceção se sem handler
     }
   }
   ```

7. **FeedManager.js:97-99** - Error é emitido no EventEmitter:
   ```javascript
   onError(error) {
     console.error(error.stack);
     this.instance.emit('error', error);  // <-- EMITE NO EMITTER
   }
   ```

### O Problema Final

**Node.js mata o processo quando:**
- Um evento 'error' é emitido em um EventEmitter
- NÃO há listeners registrados para 'error'
- Isso resulta em: `throw er; // Unhandled 'error' event`

**Por que está acontecendo agora:**

No arquivo `rss-importer.js`, há um listener de erro:
```javascript
emitter.on('error', (err) => {
  console.error('[RSS Importer] Erro no emitter:', err.message);
});
```

**MAS** esse listener é registrado APÓS a chamada do `initRSSImporter()`. 

Quando `emitter.add()` é chamado na linha 141 do `rss-importer.js`, ele cria um `FeedManager` que pode gerar erros ANTES do listener estar registrado no emitter.

---

## Raiz do Problema Exato

**Arquivo**: `painel-dm/lib/rss-importer.js`  
**Linhas**: 10, 165

```javascript
// Linha 10
const emitter = new RSSFeedEmitter();

// Linhas 165-262 (listener registrado DEPOIS)
emitter.on('new-item', async (item) => {
  // ...
});

emitter.on('error', (err) => {  // <-- Registrado aqui
  console.error('[RSS Importer] Erro no emitter:', err.message);
});

// Linha 115
async function initRSSImporter() {
  // ...
  feeds.forEach(feed => {
    addFeedListener(feed);  // <-- Erro pode ocorrer ANTES dos listeners acima
  });
}
```

**Sequência do crash:**
1. `emitter` é criado
2. `initRSSImporter()` é chamada
3. `addFeedListener(feed)` é chamada
4. `emitter.add()` começa a processar (assincronamente)
5. Erro de conexão ocorre (HTTP timeout, DNS fail, etc)
6. `FeedEmitter` tenta emitir 'error'
7. **Não há listener registrado ainda** (listeners são registrados linhas 165-262)
8. Node.js lança `Unhandled 'error' event` e mata o processo

---

## Soluções

### SOLUÇÃO 1: Registrar Listeners ANTES de Usar (RECOMENDADO)

**Arquivo**: `painel-dm/lib/rss-importer.js`

Mover o registro dos listeners ANTES da função `initRSSImporter()`:

```javascript
const RSSFeedEmitter = require('rss-feed-emitter');
const store = require('./store');
const { nextId } = require('./ids');

const emitter = new RSSFeedEmitter();
const activeFeeds = new Map();

// REGISTRAR LISTENERS PRIMEIRO (antes de usar o emitter)
emitter.on('new-item', async (item) => {
  console.log(`[RSS Importer] Novo item recebido: ${item.title}`);
  // ... resto do código
});

emitter.on('error', (err) => {
  console.error('[RSS Importer] Erro no emitter:', err.message);
});

// DEPOIS definir as funções
async function initRSSImporter() {
  // ...
}
```

**Vantagem**: 
- Simples, sem mudanças de lógica
- Listeners sempre disponíveis
- Suporta erros em qualquer momento

---

### SOLUÇÃO 2: Adicionar Handler de Erro Global no Server

**Arquivo**: `painel-dm/server.js`

Adicionar handler para unhandled rejections e exceptions:

```javascript
// Após crear o server HTTP (linha 12)
const server = http.createServer(app);

// ADICIONAR LISTENERS GLOBAIS
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
  // Optionally send alert, log to file, etc
  // Mas NÃO fazer process.exit() aqui
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  // Optionally send alert, log to file, etc
  process.exit(1);  // É seguro fazer exit aqui
});
```

**Vantagem**:
- Proteção global contra qualquer promise rejection
- Logging melhorado
- Previne crash silencioso

---

### SOLUÇÃO 3: Usar Workaround - Inicializar Emitter com Error Handler Dummy

Registrar um handler de erro dummy se não houver listeners:

```javascript
const emitter = new RSSFeedEmitter();

// Dummy handler para evitar "Unhandled 'error' event"
emitter.once('newListener', (event, listener) => {
  if (event === 'error' && emitter.listenerCount('error') === 0) {
    emitter.on('error', (err) => {
      console.error('[RSS Importer] Unhandled error:', err.message);
    });
  }
});
```

---

## Implementação Recomendada

**Use SOLUÇÃO 1 + SOLUÇÃO 2 combinadas:**

1. **Registrar listeners primeiro** (SOLUÇÃO 1) - Garante que erros do `rss-feed-emitter` sejam sempre capturados
2. **Adicionar global error handlers** (SOLUÇÃO 2) - Proteção contra erros não previstos em outras partes do código

Isso garante:
- Nenhum erro de RSS causa crash
- Logging adequado
- Recuperação graceful de falhas
- Possibilidade de monitoramento

---

## Verificação

Para testar se o crash foi resolvido:

```bash
cd painel-dm
node -e "
const { initRSSImporter } = require('./lib/rss-importer');
(async () => {
  await initRSSImporter();
  console.log('✅ RSS Importer inicializado sem crash');
  process.exit(0);
})().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
" 
```

---

## Resumo

| Aspecto | Detalhes |
|--------|----------|
| **Causa** | Listeners de erro registrados DEPOIS de iniciar async tasks |
| **Libraria** | rss-feed-emitter v3.2.4 (Node request/feedparser) |
| **Trigger** | Qualquer erro de conexão/parsing durante `addFeedListener()` |
| **Resultado** | Unhandled 'error' event no EventEmitter → process.exit(1) |
| **Fix Rápido** | Registrar listeners antes de chamar `initRSSImporter()` |
