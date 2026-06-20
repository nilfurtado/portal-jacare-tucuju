# 📋 Estrutura de Campos do Sistema de Notícias

## Portal (Exibição Pública)

Campos exibidos para leitura/visualização:

| Campo | Tipo | Uso |
|-------|------|-----|
| `titulo` | string | Título da notícia |
| `capa` | object | Imagem principal otimizada (com descrição da foto) |
| `imagem` | string | Fallback de imagem (URL simples) |
| `lide` | string | Resumo/descrição da notícia |
| `categoria` | string | Editoria/seção |
| `data` | string | Data de publicação |
| `fonte` | string | Origem da notícia |
| `autor` | string | Repórter/autor (usuário logado) |
| `slug` | string | URL amigável |
| `views` | number | Contador de visualizações |

## Painel de Notícias Importadas (Gestão)

Campos para filtro, busca e gerenciamento:

| Campo | Tipo | Uso |
|-------|------|-----|
| `descricao` | string | Para busca (alias de `lide`) |
| `publicada` | boolean | Filtro de status de publicação |
| `importada` | boolean | Indicador de origem RSS |
| `status` | string | Status: `publicado` / `rascunho` / `agendado` |
| `[todos acima]` | - | Mesmos campos do portal |

## Metadados Adicionais

| Campo | Tipo | Uso |
|-------|------|-----|
| `id` | number | Identificador único |
| `criadoEm` | string | Data de criação (ISO 8601) |
| `atualizadoEm` | string | Data de última edição |
| `tags` | array | Palavras-chave |
| `conteudo` | string | HTML do artigo completo |
| `municipio` | string | Município relacionado |

---

**Status:** ✅ Implementado em `noticias.json`  
**Total de Notícias:** 69  
**Data:** 2026-06-14
