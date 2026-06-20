# Guia Rápido - Página de Usuários

## 6 Recursos Implementados em 1 Página

### 1️⃣ ORDENAÇÃO
```
Clique no header da coluna para ordenar
Usuário ↕ | E-mail ↕ | Tipo ↕ | Status ↕

Indicador:
↑ = Ascendente (A-Z)
↓ = Descendente (Z-A)
↕ = Não ordenado
```

**Exemplo**:
- Clique em "Usuário ↕" → "Usuário ↑" (A-Z)
- Clique de novo → "Usuário ↓" (Z-A)
- Clique em outro header → nova ordenação

---

### 2️⃣ PAGINAÇÃO
```
[← Anterior] Página 2 de 5 [Próximo →]
Mostrando 11-20 de 50 usuários

Características:
- 10 usuários por página
- Botões desabilitados em primeira/última página
- Reseta para página 1 ao filtrar
```

**Exemplo**:
```
Total: 50 usuários
Página 1: usuários 1-10
Página 2: usuários 11-20
Página 3: usuários 21-30
...
Página 5: usuários 41-50
```

---

### 3️⃣ BULK ACTIONS (Seleção Múltipla)
```
[☑] Selecionar todos no header
☐ Usuário 1
☑ Usuário 2
☐ Usuário 3
↓
Barra aparece: "2 usuário(s) selecionado(s) | [Deletar]"
```

**Fluxo**:
1. Clique em checkboxes para selecionar
2. Barra flutuante aparece automaticamente
3. Clique "Deletar" para remover em lote
4. Confirmação: "Você está prestes a remover 2 usuário(s)"
5. Após confirmação: usuários deletados, barra desaparece

**Exemplo**:
```
Selecionou João, Maria e Pedro
Clicou em "Deletar"
Confirmou na modal
→ 3 usuários removidos em 1 ação
```

---

### 4️⃣ EXPORTAR CSV/JSON
```
Clique no botão "Exportar" na toolbar
    ↓
Sistema pergunta o formato
    ↓
Escolha:
  - JSON (estrutura completa)
  - CSV (planilha Excel)
    ↓
Download automático: usuarios-2026-06-16.{json|csv}
```

**O que exporta**:
```
ID | Nome | E-mail | Tipo | Status | Telefone | Cidade | Estado | Criado em | Atualizado em

CSV: Abre no Excel/Google Sheets
JSON: Abre em qualquer editor de texto
```

**Exemplo**:
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@site.com",
  "tipo": "admin",
  "status": "Ativo",
  "telefone": "(96) 9 0000-0000",
  "cidade": "Macapá",
  "estado": "AP",
  "criadoEm": "2026-06-16T14:30:00.000Z"
}
```

---

### 5️⃣ HISTÓRICO DE ALTERAÇÕES
```
Clique no ícone de relógio ⏰ em cada linha
    ↓
Modal abre mostrando:
┌─────────────────────────────────┐
│ Histórico — João Silva          │
├─────────────────────────────────┤
│ foto:                           │
│ (nenhuma) → /uploads/...jpg     │
│ Sistema • 16/06/2026 14:30:45   │
│                                 │
│ nome:                           │
│ João da Silva → João Silva      │
│ admin@site.com • 15/06/2026...  │
└─────────────────────────────────┘
```

**O que mostra**:
- Campo que foi alterado (ex: "foto", "nome", "email")
- Valor anterior → valor novo
- Quem alterou (email do usuário)
- Quando (data e hora em pt-BR)

**Exemplo Timeline**:
```
1. 16/06 14:30 - Foto atualizada
2. 15/06 10:15 - Nome corrigido
3. 14/06 09:00 - Email alterado
4. 13/06 08:30 - Usuário criado
```

---

### 6️⃣ AVATAR UPLOAD
```
Clique no ícone de câmera 📷 em cada linha
    ↓
Modal abre:
┌─────────────────────────────────┐
│ Foto do perfil                  │
├─────────────────────────────────┤
│      [👤 ou imagem]             │ ← Preview
│                                 │
│ ┌─ Clique ou arraste aqui ────┐ │
│ │ Clique para selecionar ou    │ │
│ │ arraste uma imagem           │ │
│ │ JPG, PNG ou WebP • Máx. 2MB  │ │
│ └──────────────────────────────┘ │
│                                 │
│ [Cancelar] [Salvar]             │
└─────────────────────────────────┘
```

**Como usar**:
1. **Clique na área**: Abre seletor de arquivo
2. **Arraste arquivo**: Drop a imagem diretamente
3. **Validações automáticas**:
   - Formato: JPEG, PNG ou WebP
   - Tamanho: máximo 2MB
   - Erro se exceder → tente outra imagem
4. **Preview**: Mostra imagem antes de salvar
5. **Clique "Salvar"**: Faz upload e atualiza

**Resultado na tabela**:
```
Antes: [João] (letra inicial)
Depois: [👨‍💼] (foto real do João)
```

**Arquivo salvo em**:
```
/painel-dm/public/uploads/avatars/{timestamp}-{filename}
Ex: 1718555445000-perfil.jpg
```

---

## 🎯 Casos de Uso Comuns

### Cenário 1: Encontrar usuário inativo
```
1. Clique em "Inativos" na toolbar
2. Clique em "Usuário ↕" para ordenar alfabeticamente
3. Navegue pelas páginas
4. Clique na linha para editar
```

### Cenário 2: Remover múltiplos usuários
```
1. Selecione checkboxes dos usuários
2. Barra aparece: "5 usuário(s) selecionado(s)"
3. Clique "Deletar"
4. Confirme na modal
5. ✓ 5 usuários removidos
```

### Cenário 3: Fazer backup de usuários
```
1. Aplique filtros desejados
2. Clique "Exportar"
3. Escolha JSON (melhor para backup)
4. Arquivo baixa automaticamente
5. Guarde em lugar seguro
```

### Cenário 4: Verificar quem alterou usuário
```
1. Clique ⏰ na linha do usuário
2. Modal mostra histórico completo
3. Veja quem fez cada alteração
4. Veja data/hora exata
5. Feche a modal
```

### Cenário 5: Adicionar foto ao usuário
```
1. Clique 📷 na linha do usuário
2. Arraste a foto ou clique para selecionar
3. Veja preview
4. Clique "Salvar"
5. ✓ Foto aparece na tabela
```

---

## 📊 Dados Visíveis

### Coluna de Usuário
```
[Avatar] Nome Completo
         Cidade, Estado
```
Exemplo:
```
[JS]  João Silva
      Macapá, AP
```

### Coluna de E-mail
```
joao@site.com (monospace)
```

### Coluna de Tipo
```
🔷 Admin (azul)
ou
🔘 Colaborador (cinza)
```

### Coluna de Status
```
● Ativo (verde)
ou
◯ Inativo (cinza)
```

### Coluna de Ações
```
[📷] [⏰] [✎] [🗑]
 
Foto | Histórico | Editar | Remover
```

---

## ⚡ Atalhos & Dicas

### Filtros Rápidos
```
Todos → Mostra todos os usuários
Admins → Apenas administradores
Ativos → Apenas com status "Ativo"
Inativos → Apenas com status "Inativo"
```

### Busca + Filtro
```
Digite na busca: "joão"
Clique em "Ativos"
Resultado: Apenas João's ativos
```

### Ordenação Múltipla
```
Nota: Sistema suporta 1 ordenação por vez
Para ordenar por outra coluna:
1. Clique em nova coluna
2. Ordenação anterior é substituída
```

### Paginação Rápida
```
Página cheia? Clique "Próximo →"
Voltar atrás? Clique "← Anterior"
Saber onde está? Veja "Página 2 de 5"
```

---

## 🔒 Permissões

Todos os recursos requerem:
```
Autenticação: ✓ Logado no painel
Permissão: ✓ Módulo "usuarios"
```

Se não conseguir acessar, peça ao administrador.

---

## 🐛 Troubleshooting

### Avatar não salva
- Verificar tamanho (máx 2MB)
- Verificar formato (JPEG, PNG, WebP)
- Verificar conexão com servidor

### Histórico vazio
- Primeira vez que edita o usuário?
- Histórico começa após primeira alteração

### Exportar não funciona
- Pop-up bloqueado? Permita downloads
- Filtros aplicados? Exporta apenas filtrados
- Navegador suportado? Chrome, Firefox, Safari, Edge ✓

### Paginação desaparece
- Menos de 10 usuários? Normal, paginação não aparece
- Aplicou filtro? Página reseta para 1

---

## 📚 Para Mais Informações

**Documentação Técnica**: `USUARIOS_FEATURES.md`
- Estrutura de código
- Endpoints de API
- Validações completas

**Resumo da Implementação**: `USUARIOS_IMPLEMENTATION_SUMMARY.md`
- O que foi criado
- Arquivos modificados
- Performance & UX

