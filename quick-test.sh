#!/bin/bash

echo "🧪 TESTE RÁPIDO DE FUNCIONALIDADE DO PORTAL"
echo ""

# Teste 1: Homepage carrega
echo "1️⃣  Homepage (/):"
response=$(curl -s -w "\n%{http_code}" http://localhost:8000/)
code=$(echo "$response" | tail -1)
if [ "$code" = "200" ]; then
  echo "   ✅ Retorna HTTP 200"
  # Verificar se tem elementos principais
  body=$(echo "$response" | head -n -1)
  echo "$body" | grep -q "<title>" && echo "   ✅ Tem <title>"
  echo "$body" | grep -q "hero-featured-carousel" && echo "   ✅ Tem carrossel de notícias"
  echo "$body" | grep -q "cat-section" && echo "   ✅ Tem seções de categorias"
else
  echo "   ❌ HTTP $code"
fi

# Teste 2: Categoria página
echo ""
echo "2️⃣  Categoria (politica):"
response=$(curl -s -w "\n%{http_code}" http://localhost:8000/categoria.html?cat=politica)
code=$(echo "$response" | tail -1)
if [ "$code" = "200" ]; then
  echo "   ✅ HTTP 200"
  body=$(echo "$response" | head -n -1)
  echo "$body" | grep -q "cat=politica" && echo "   ✅ Query string recebido"
else
  echo "   ❌ HTTP $code"
fi

# Teste 3: Notícia detalhe
echo ""
echo "3️⃣  Página de Notícia:"
response=$(curl -s -w "\n%{http_code}" http://localhost:8000/noticia.html?id=1)
code=$(echo "$response" | tail -1)
if [ "$code" = "200" ]; then
  echo "   ✅ HTTP 200"
else
  echo "   ❌ HTTP $code"
fi

# Teste 4: CSS Bundle
echo ""
echo "4️⃣  CSS Bundle (bundle.css):"
response=$(curl -s -w "\n%{http_code}" http://localhost:8000/css/bundle.css)
code=$(echo "$response" | tail -1)
if [ "$code" = "200" ]; then
  echo "   ✅ CSS carrega (HTTP 200)"
  size=$(echo "$response" | head -n -1 | wc -c)
  echo "   📦 Tamanho: $size bytes"
else
  echo "   ❌ HTTP $code"
fi

# Teste 5: API Bootstrap
echo ""
echo "5️⃣  API Bootstrap (painel-dm):"
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/bootstrap)
code=$(echo "$response" | tail -1)
if [ "$code" = "200" ]; then
  echo "   ✅ API respondendo (HTTP 200)"
  body=$(echo "$response" | head -n -1)
  echo "$body" | grep -q '"noticias"' && echo "   ✅ Tem campo 'noticias'"
  echo "$body" | grep -q '"categorias"' && echo "   ✅ Tem campo 'categorias'"
  echo "$body" | grep -q '"categoriasColunas"' && echo "   ✅ Tem campo 'categoriasColunas'"
else
  echo "   ⚠️  API HTTP $code (painel-dm pode não estar rodando)"
fi

echo ""
echo "✅ Testes básicos concluídos!"

