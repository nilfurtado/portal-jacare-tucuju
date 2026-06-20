# 🚀 Plano: Melhorias no Modal Importador RSS

## Status Atual ✅
- ✅ Validação de feed (extrai 15 artigos com preview)
- ✅ Seletor de notícias com checkboxes
- ✅ Alerta de validação mostrando quantidade selecionada
- ✅ Confirmação antes de importar
- ✅ Sincronização JSON ↔ SQLite
- ✅ Cache-busting no Portal

## Problemas Identificados
1. **UX do Modal**: Abas confusas (Pré-definidos, Busca, Gerenciar)
2. **Preview de Artigos**: Sem imagens, apenas texto
3. **Seletor**: Sem filtros ou busca rápida
4. **Feedback**: Apenas alerta nativo (confirm dialog)
5. **Responsividade**: Modal pode ficar muito alto em listas longas

---

## 🎯 Objetivo Geral
Melhorar a experiência do usuário ao importar feeds RSS com:
1. Interface mais intuitiva e visual
2. Preview de artigos com imagens
3. Busca/filtro rápido nos artigos encontrados
4. Feedback melhorado (não apenas confirm nativo)
5. Melhor organização das abas

---

## 📋 Fase 1: Reorganização do Layout Modal

### 1.1 Estrutura de Abas Simplificada

**Nova estrutura:**
```
┌─────────────────────────────────────┐
│ 📰 Importar Notícias via RSS         │
├─────────────────────────────────────┤
│ [Pré-definidos] [Novo Feed] [Gerir] │
├─────────────────────────────────────┤
│ Conteúdo da aba atual               │
└─────────────────────────────────────┘
```

**Aba 1: Pré-definidos**
- Grid com feeds clássicos (Agência Brasil, EDNews, etc)
- Card com: Logo + Nome + Status + "Importar Agora"
- Indicador de última importação

**Aba 2: Novo Feed**
- Campo de URL
- Botão "Validar"
- Se sucesso: mostra preview de artigos (com seletor)
- Se erro: mensagem clara

**Aba 3: Gerenciar**
- Lista de feeds com status
- Ações: editar intervalo, deletar, testar
- Log de últimas importações

### 1.2 Melhorias CSS
- Modal responsivo (max-width: 700px em desktop, 95vw em mobile)
- Altura máxima com scroll: max-height: 85vh
- Cards com sombra sutil
- Animações suaves nas transições

---

## 📸 Fase 2: Preview Visual de Artigos

### 2.1 Estrutura do Preview
Atualmente: `[checkbox] [título] [lide]`

Novo:
```
┌────────────────────────────────────┐
│ [✓] [thumbnail] [info]             │
│     [img 120px]  Título (1 linha)  │
│              Lide (2 linhas)       │
│              Data • Fonte          │
└────────────────────────────────────┘
```

### 2.2 Implementação
- Thumbnail 120px de altura
- Fallback com placeholder se sem imagem
- Lazy load das imagens
- Aspecto ratio 16:9 ou 4:3

---

## 🔍 Fase 3: Busca/Filtro nos Artigos

### 3.1 Campo de Busca
```
[🔍 Buscar nos 10 artigos encontrados...]
```

### 3.2 Filtros Opcionais
- Por data (últimas 24h, últimos 7 dias, qualquer)
- Por fonte (se múltiplos feeds)
- Por categoria

### 3.3 Contador Dinâmico
"X de Y selecionados para importar"
- Atualiza em tempo real
- Cor verde se > 0, laranja se 0
- Botão "Importar" disabled se 0

---

## ⚡ Fase 4: Alerta de Confirmação Melhorado

### 4.1 Modal em vez de Confirm Dialog

**Atual:**
```javascript
if (!confirm('Deseja importar 5 de 10?')) return;
```

**Novo:**
```
┌─────────────────────────────────────┐
│ ✅ Pronto para Importar             │
├─────────────────────────────────────┤
│ Você selecionou 5 de 10 artigos:    │
│                                     │
│ • Agência Brasil: 2 artigos         │
│ • EDNews: 3 artigos                 │
│                                     │
│ Vai durar ~3 segundos               │
├─────────────────────────────────────┤
│ [Cancelar] [Importar Agora!]        │
└─────────────────────────────────────┘
```

### 4.2 Após Importação
```
┌─────────────────────────────────────┐
│ ✅ Importação Concluída!             │
├─────────────────────────────────────┤
│ 5 artigos importados com sucesso    │
│ Total no painel: 42 notícias        │
│ Duraram: 2.3 segundos              │
│ Próxima atualização: 12 horas      │
├─────────────────────────────────────┤
│ [Fechar] [Ver no Portal]            │
└─────────────────────────────────────┘
```

---

## 🔧 Fase 5: Como Funciona em Portais (UX Pattern)

### Padrão Comum em Portais de Notícias

1. **Upload Manual**
   - Input de URL/arquivo
   - Validação imediata
   - Preview antes de confirmar
   - Feedback em tempo real

2. **Agendamento**
   - Intervalo configurável
   - Status ativo/inativo
   - Log de execuções

3. **Gerenciamento**
   - Listar fontes
   - Editar/deletar
   - Ver últimas importações
   - Estatísticas

### Nosso Modal Combina Tudo Isso
- Aba "Novo Feed" = Upload Manual + Validação
- Aba "Pré-definidos" = Feeds pré-configurados (atalho)
- Aba "Gerenciar" = Administração completa

---

## 📅 Roadmap de Implementação

### Sprint 1 (Essencial) ✅ FEITO
- ✅ Seletor com checkboxes
- ✅ Alerta de validação (quantidade selecionada)
- ✅ Confirmação antes de importar
- ✅ Backend aceita índices

### Sprint 2 (Melhoria Visual) - ✅ CONCLUÍDO
- ✅ Reorganizar HTML do modal (3h)
  - Abas com visual melhorado
  - Responsivo 700px desktop / 95vw mobile
  - Scroll interno com altura máxima 90vh
  
- ✅ CSS responsivo (2h)
  - Media queries para mobile
  - Imagem reduz em mobile: 80x60px
  - Botões adaptam tamanho de fonte
  
- ✅ Preview com thumbnail (4h)
  - Imagem 100x80px lado a lado com texto
  - Fallback SVG placeholder
  - Hover effect: border azul + sombra
  - Contador integrado mostrando X/Y e percentual
  
- Total: 9 horas ✅

### Sprint 3 (Busca/Filtro) - FUTURO
- [ ] Campo de busca (2h)
- [ ] Filtros opcionais (3h)
- [ ] Total: 5 horas

### Sprint 4 (Modal de Confirmação) - FUTURO
- [ ] Modal customizado (3h)
- [ ] Estatísticas por fonte (2h)
- [ ] Total: 5 horas

---

## 🎨 Design Tokens a Usar

**Cores:**
- Success: #4caf50 (verde)
- Warning: #ff9800 (laranja)
- Error: #f44336 (vermelho)
- Brand: var(--brand) (azul)

**Espaçamento:**
- var(--s-2) para gap pequeno
- var(--s-4) para padding interno
- var(--s-6) para margem externa

**Tipografia:**
- Título: 1.3rem / 700 weight
- Corpo: 0.9rem
- Pequeno: 0.75rem

---

## ✅ Critérios de Sucesso

1. ✅ Usuário vê 15 artigos com preview visual
2. ✅ Clica em checkboxes e vê contador atualizar em tempo real
3. ✅ Seleciona 5 artigos e modal de confirmação mostra estatísticas
4. ✅ Confirma e vê progresso "Importando... 2 de 5"
5. ✅ Resultado final mostra "5 importados com sucesso"
6. ✅ Modal fecha e artigos aparecem no Portal (cache-busting)

---

## 🔗 Arquivos Afetados

| Arquivo | Mudança | Prioridade |
|---------|---------|-----------|
| painel-dm/public/noticias-importadas.html | Reorganizar layout + CSS | P0 |
| painel-dm/api/rss-feeds.js | Backend já suporta índices | ✅ |
| js/data.js | Cache-busting ativo | ✅ |
| data/noticias.json | Sincronização ativa | ✅ |

---

## 🚀 Próximos Passos

**Imediato (hoje):**
1. Testar fluxo atual com confirmação
2. Validar que importação com índices funciona

**Curto prazo (Sprint 2):**
1. Reorganizar HTML do modal (Fase 1)
2. Adicionar CSS responsivo
3. Implementar preview com imagens (Fase 2)

**Médio prazo (Sprint 3+):**
4. Busca/filtro nos artigos (Fase 3)
5. Modal customizado de confirmação (Fase 4)
