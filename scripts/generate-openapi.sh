#!/bin/bash

# Script para gerar a documentação OpenAPI do projeto

set -e

# Resolve a raiz do projeto a partir da localização do script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SERVER_PID=""

cleanup() {
  if [ -n "${SERVER_PID}" ] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo "🛑 Parando servidor temporário..."
    kill "${SERVER_PID}"
  fi
}

trap cleanup EXIT

echo "🚀 Gerando documentação OpenAPI..."

# Compila o projeto
echo "📦 Compilando o projeto..."
(cd "${PROJECT_ROOT}" && nest build)

# Inicia o servidor temporariamente em background
echo "🔧 Iniciando servidor temporário..."
(
  cd "${PROJECT_ROOT}"
  PORT=3333 NODE_ENV=development node dist/src/infra/main.js
) &
SERVER_PID=$!

# Aguarda o servidor inicializar
echo "⏳ Aguardando servidor inicializar..."
sleep 5

# Baixa o JSON do OpenAPI
echo "📥 Baixando especificação OpenAPI..."
curl -s http://localhost:3333/api-json > "${PROJECT_ROOT}/openapi.json"

echo "✅ Documentação OpenAPI gerada com sucesso em openapi.json"
