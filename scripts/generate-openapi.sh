#!/bin/bash

# Script para gerar a documentação OpenAPI do projeto

set -e

echo "🚀 Gerando documentação OpenAPI..."

# Compila o projeto
echo "📦 Compilando o projeto..."
npm run build

# Inicia o servidor temporariamente em background
echo "🔧 Iniciando servidor temporário..."
PORT=3333 NODE_ENV=development node dist/src/infra/main.js &
SERVER_PID=$!

# Aguarda o servidor inicializar
echo "⏳ Aguardando servidor inicializar..."
sleep 5

# Baixa o JSON do OpenAPI
echo "📥 Baixando especificação OpenAPI..."
curl -s http://localhost:3333/api-json > openapi.json

# Para o servidor
echo "🛑 Parando servidor temporário..."
kill $SERVER_PID

echo "✅ Documentação OpenAPI gerada com sucesso em openapi.json"
