# 📦 Sistema de Backup - Painel DM

Sistema completo de backup e restauração para o Painel DM.

## ✨ Funcionalidades

- ✅ Backup automático diário
- ✅ Compressão ZIP com nível máximo
- ✅ Armazena: banco de dados SQLite, JSON, e imagens
- ✅ Limpeza automática (mantém últimos 10 backups)
- ✅ API REST para gerenciamento
- ✅ CLI para linha de comando
- ✅ Restore com validação de segurança

## 📂 Estrutura de Backup

```
backups/
├── backup-2026-06-10T12-30-45-123Z.zip
├── backup-2026-06-10T00-30-45-456Z.zip
└── ...
```

Cada backup contém:
- `painel.db` - Banco de dados SQLite
- `data/noticias.json` - Notícias (JSON)
- `data/anuncios.json` - Anúncios (JSON)
- `data/categorias.json` - Categorias (JSON)
- `uploads/` - Pasta com imagens

## 🖥️ CLI - Linha de Comando

### Criar backup
```bash
cd painel-dm
node scripts/backup.js criar
```

### Listar backups
```bash
node scripts/backup.js listar
```

Exibe:
- Nome do arquivo
- Tamanho do arquivo
- Data de criação

### Restaurar backup
```bash
node scripts/backup.js restaurar backup-2026-06-10T12-30-45-123Z.zip
```

### Deletar backup
```bash
node scripts/backup.js deletar backup-2026-06-10T12-30-45-123Z.zip
```

### Limpar backups antigos
```bash
# Manter apenas os últimos 5 backups
node scripts/backup.js limpar 5

# Manter apenas os últimos 10 (padrão)
node scripts/backup.js limpar
```

### Agendar backup automático
```bash
# Backup a cada 24 horas
node scripts/backup.js agendar 24

# Backup a cada 12 horas
node scripts/backup.js agendar 12
```

## 🔗 API REST

### Listar backups
```http
GET /api/backup/list
Authorization: Bearer <JWT_TOKEN>
```

Resposta:
```json
{
  "total": 3,
  "backups": [
    {
      "nome": "backup-2026-06-10T12-30-45-123Z.zip",
      "tamanho": "15.45MB",
      "data": "2026-06-10T12:30:45.123Z"
    }
  ]
}
```

### Criar backup
```http
POST /api/backup/criar
Authorization: Bearer <JWT_TOKEN>
```

Resposta:
```json
{
  "ok": true,
  "mensagem": "Backup criado com sucesso",
  "arquivo": "backup-2026-06-10T12-30-45-123Z.zip"
}
```

### Restaurar backup
```http
POST /api/backup/restaurar
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "arquivo": "backup-2026-06-10T12-30-45-123Z.zip"
}
```

Resposta:
```json
{
  "ok": true,
  "mensagem": "Backup restaurado com sucesso"
}
```

### Deletar backup
```http
DELETE /api/backup/backup-2026-06-10T12-30-45-123Z.zip
Authorization: Bearer <JWT_TOKEN>
```

Resposta:
```json
{
  "ok": true,
  "mensagem": "Backup deletado com sucesso"
}
```

### Baixar backup
```http
GET /api/backup/download/backup-2026-06-10T12-30-45-123Z.zip
Authorization: Bearer <JWT_TOKEN>
```

Retorna o arquivo ZIP para download.

## ⚙️ Configuração Automática

### Backup Automático

Ao iniciar o servidor:
1. Um backup é criado automaticamente
2. Backups antigos são limpados (mantém últimos 10)
3. Próximos backups agendados a cada 24 horas

### Logs

```
[startup] ✅ Backup automático agendado (diariamente)
[12:30] ✅ Backup criado: backups/backup-2026-06-10T12-30-45-123Z.zip (15.45MB)
[12:30] 🧹 Removidos 2 backups antigos
```

## 🔐 Segurança

- ✅ Requer autenticação JWT (admin)
- ✅ Validação de caminho contra directory traversal
- ✅ Criação de pré-backup antes de restaurar
- ✅ Compressão máxima (nível 9)

## 📊 Armazenamento

### Espaço em disco

- Banco de dados: ~5-10 MB
- Imagens: ~50-100 MB
- Backup total: ~80-150 MB por arquivo

Com 10 backups: ~800 MB a 1.5 GB

### Limpeza automática

Por padrão, mantém apenas os 10 últimos backups. Use:
```bash
node scripts/backup.js limpar 5
```

Para reduzir para 5 backups.

## 🚨 Recuperação de Desastres

### Cenário: Banco de dados corrompido

1. Listar backups:
```bash
node scripts/backup.js listar
```

2. Restaurar último backup:
```bash
node scripts/backup.js restaurar backup-2026-06-10T12-30-45-123Z.zip
```

3. Reiniciar servidor:
```bash
node server.js
```

## 📝 Logs

Os logs de backup aparecem no console do servidor:

```
📦 Criando backup...
✅ Backup criado: backups/backup-2026-06-10T12-30-45-123Z.zip (15.45MB)
🧹 Removidos 2 backups antigos
```

## 🔄 Integração com CI/CD

Para incluir backups em pipelines:

```bash
# Criar backup antes do deploy
node scripts/backup.js criar

# Criar backup com nome customizado
# (copiar arquivo gerado)
cp backups/backup-*.zip ./pre-deploy-backup.zip
```

## ✅ Checklist de Backup

- [ ] Backups automáticos agendados
- [ ] Pelo menos 1 backup disponível
- [ ] Tamanho de arquivo dentro do esperado
- [ ] Teste de restauração realizado
- [ ] Armazenamento verificado

---

**Sistema de Backup ✅ Operacional**
