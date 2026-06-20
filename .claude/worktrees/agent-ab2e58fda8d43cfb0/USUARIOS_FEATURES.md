# Página de Usuários - Recursos Implementados

## Resumo
Implementação de 6 recursos avançados na página de usuários do painel-dm para melhorar a gestão e visualização de usuários.

---

## 1. Ordenação de Colunas

**Arquivo**: `painel-dm/public/usuarios.html`

### Funcionalidades:
- Clique no header da coluna para ordenar (nome, email, tipo, status)
- Indicador visual (↑↓) mostra direção e coluna ativa
- Ordenação dinâmica com troca entre ASC/DESC
- Reseta para página 1 ao aplicar nova ordenação

### Uso:
```
Clique em "Usuário ↕", "E-mail ↕", "Tipo ↕" ou "Status ↕" para ordenar
↑ = Ascendente | ↓ = Descendente
```

### Código:
- Funções: `getSortField()`, `renderSortIndicators()`, `aplicarOrdenacao()`
- Estado: `sortField`, `sortDir`
- CSS: `.sortable-header`, `.sort-indicator`

---

## 2. Paginação

**Arquivo**: `painel-dm/public/usuarios.html`

### Funcionalidades:
- Mostra 10 usuários por página (ITEMS_PER_PAGE = 10)
- Navegação: Anterior/Próximo com estados desabilitados
- Indicador: "Página X de Y" e "Mostrando 1-10 de 50"
- Botões desabilitados quando em primeira/última página
- Atualiza automaticamente com filtros e ordenação

### Uso:
```
← Anterior | Página 2 de 5 | Próximo →
Mostrando 11-20 de 50 usuários
```

### Código:
- Funções: `atualizarPaginacao()`
- Estado: `currentPage`, `ITEMS_PER_PAGE`
- CSS: `.pagination-container`, `.pagination-nav`

---

## 3. Bulk Actions

**Arquivo**: `painel-dm/public/usuarios.html`

### Funcionalidades:
- Checkbox "Selecionar todos" no header da tabela
- Checkboxes individuais em cada linha
- Barra de ações flutuante quando há seleção
- Botão "Deletar selecionados" com confirmação
- Mostra contagem: "3 usuário(s) selecionado(s)"
- Barra desaparece quando nenhum usuário é selecionado

### Uso:
```
1. Clique em checkboxes para selecionar usuários
2. Barra aparece: "2 usuário(s) selecionado(s) | [Deletar]"
3. Clique "Deletar" para remover múltiplos usuários
```

### Código:
- Funções: `atualizarBulkActions()`, `deletarSelecionados()`
- Estado: `selectedIds` (Set)
- CSS: `.bulk-actions`, `.table-checkbox`

---

## 4. Exportar CSV/JSON

**Arquivo**: `painel-dm/public/usuarios.html`

### Funcionalidades:
- Botão "Exportar" na toolbar
- Exporta usuários do filtro atual (não todas as páginas)
- Dois formatos:
  - **CSV**: Campos: ID, Nome, E-mail, Tipo, Status, Telefone, Cidade, Estado, Criado em, Atualizado em
  - **JSON**: Estrutura completa com indentação
- Filename automático: `usuarios-YYYY-MM-DD.csv|json`
- Download automático no navegador

### Uso:
```
Clique em "Exportar" → Escolha formato (JSON/CSV) → Download automático
```

### Código:
- Funções: `exportarUsuarios(format)`
- Criação de Blob com download automático
- Suporte a encoding UTF-8 para CSV

---

## 5. Histórico de Alterações

**Arquivo**: `painel-dm/public/usuarios.html` e `painel-dm/api/usuarios.js`

### Funcionalidades:
- Endpoint: `GET /api/usuarios/:id/historico`
- Ícone de relógio em cada linha para acessar histórico
- Modal mostra:
  - Campo alterado (ex: "foto")
  - Valor anterior → novo valor
  - Autor da alteração
  - Data/hora em formato local pt-BR
- Histórico registrado automaticamente em atualizações

### Uso:
```
1. Clique no ícone de relógio em uma linha
2. Modal mostra histórico de alterações do usuário
3. Formato: "foto: (nenhuma) → /uploads/avatars/123.jpg"
4. "Sistema • 16/06/2026 14:30:45"
```

### API:
```javascript
GET /api/usuarios/:id/historico
Response:
[
  {
    campo: "foto",
    oldValue: "(nenhuma)",
    newValue: "/uploads/avatars/123.jpg",
    autor: "admin@site.com",
    data: "2026-06-16T14:30:45.000Z"
  }
]
```

### Código:
- Função frontend: `mostrarHistorico(user)`
- Endpoint backend: `router.get('/:id/historico')`
- Armazenamento: Store JSON por usuário (`usuarios-historico-{id}`)

---

## 6. Avatar Upload

**Arquivo**: `painel-dm/public/usuarios.html` e `painel-dm/api/usuarios.js`

### Funcionalidades:
- Ícone de câmera em cada linha para fazer upload
- Modal com:
  - Preview em tempo real (círculo 80x80px)
  - Área drag-and-drop
  - Input file click
  - Validação de tamanho (max 2MB)
  - Validação de tipo (JPEG, PNG, WebP)
- Salva em `/uploads/avatars/`
- Atualiza `usuario.foto` com URL relativa
- Integrado com histórico de alterações

### Uso:
```
1. Clique no ícone de câmera
2. Modal abre com área de upload
3. Arraste ou clique para selecionar imagem
4. Preview mostra imagem selecionada
5. Clique "Salvar" para confirmar
6. Arquivo salvo em /uploads/avatars/{timestamp}-{filename}
7. URL registrada em usuario.foto
```

### Validações:
```
- Tamanho: máximo 2MB
- Formatos: image/jpeg, image/png, image/webp
- Erro se exceder limites
```

### API:
```javascript
POST /api/usuarios/:id/avatar
Content-Type: multipart/form-data
Body: { foto: File }

Response: { id, nome, email, ..., foto: "/uploads/avatars/..." }
```

### Código:
- Função frontend: `abrirAvatarUpload(user)`
- Endpoint backend: `router.post('/:id/avatar')`
- Middleware: `multer` com diskStorage
- Armazenamento: `/painel-dm/public/uploads/avatars/`

---

## Arquivos Modificados

### Frontend
- **`painel-dm/public/usuarios.html`**
  - Adicionado CSS para novos componentes
  - Adicionado HTML para paginação e bulk actions
  - Rewrite completo do script com 6 recursos

### Backend
- **`painel-dm/api/usuarios.js`**
  - Importação de multer, path, fs
  - Configuração de upload storage
  - Endpoint `GET /:id/historico`
  - Endpoint `POST /:id/avatar`

### Criados
- **`painel-dm/public/uploads/avatars/`** (diretório)
  - Armazena imagens de perfil dos usuários
  - Arquivo `.gitkeep` para manter no repositório

---

## Estrutura de Estado

```javascript
const state = {
  allUsers: [],              // Todos os usuários carregados
  filteredUsers: [],         // Usuários após filtros aplicados
  currentPage: 1,            // Página atual (paginação)
  sortField: null,           // Campo de ordenação ('nome', 'email', 'tipo', 'status')
  sortDir: 'asc',            // Direção ('asc' ou 'desc')
  selectedIds: new Set(),    // IDs dos usuários selecionados (bulk)
  ITEMS_PER_PAGE: 10         // Usuários por página
};
```

---

## Fluxo de Dados

```
Carregar dados
    ↓
apiGet('/usuarios') → allUsers
    ↓
Filtrar (search + tipo) → filteredUsers
    ↓
Ordenar (sort) → filteredUsers
    ↓
Paginar (page * 10) → visíveis na tela
    ↓
Renderizar tabela + controles
```

---

## Integração com Sistema Existente

- **Auth**: Protegido por `authJwt` middleware
- **Permissões**: Requer permissão `usuarios`
- **UI**: Reutiliza `toast()`, `confirmar()`, modal styles
- **API**: Segue padrão de endpoints (`apiGet`, `apiPost`, `apiPut`, `apiDelete`)
- **Storage**: Usa sistema de store.json existente

---

## Performance

- **Paginação**: Renderiza apenas 10 items por página
- **Filtros**: Aplicados em memória (rápido)
- **Ordenação**: Array sort nativo do JS
- **Avatar**: Multer disk storage com stream
- **Histórico**: Store JSON separado por usuário

---

## Testes Recomendados

1. ✓ Ordenar por nome, email, tipo, status
2. ✓ Navegar entre páginas
3. ✓ Selecionar/desselecionar usuários
4. ✓ Deletar múltiplos usuários
5. ✓ Exportar em CSV e JSON
6. ✓ Visualizar histórico de alterações
7. ✓ Upload de avatar (JPEG, PNG, WebP)
8. ✓ Validação de tamanho (>2MB)
9. ✓ Combinações de filtros + ordenação + paginação
10. ✓ Responsividade em mobile

---

## Notas de Implementação

- Bulk delete implementado sem confirmação individual (usa confirmar único)
- Histórico registrado automaticamente ao atualizar foto
- Avatar preview mostra imagem real ou letra inicial colorida
- Exportar CSV escapa aspas corretamente
- Paginação reseta ao aplicar novo filtro
- Select-all respota ao mudar de página
