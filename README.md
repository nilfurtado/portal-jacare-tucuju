# Portal de Notícias - Jacaré Tucujú

Sistema completo de portal de notícias com admin panel e front-end público.

## 🚀 Início Rápido

### Instalação

```bash
# Instalar dependências do Painel DM
cd painel-dm
npm install

# Voltar à raiz
cd ..
```

### Iniciar Servidores

```bash
# Painel DM (Admin) - porta 3000
cd painel-dm && npm start

# Portal (Público) - porta 8000
node server.js
```

### 🔐 Login

- **Usuário:** Nildo
- **Senha:** 123456

## 📁 Estrutura

- `painel-dm/` - Admin panel (Node.js + Express)
- `portal/` - Site público (HTML + JS)
- `img/` - Imagens do portal
- `data/` - Dados em JSON

## 📝 Recursos

✅ Upload de imagens com recorte automático (5 dimensões)
✅ WebP otimizado + JPEG fallback
✅ Sincronização SQLite ↔ JSON
✅ Modal de confirmação
✅ Validação de campos
✅ Leitura de texto com síntese de voz

## 🔗 Links

- **Painel:** http://localhost:3000/painel/login/
- **Portal:** http://localhost:8000

---

*Sistema desenvolvido com Node.js, Express e SQLite*
