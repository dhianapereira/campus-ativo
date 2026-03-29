#!/bin/bash

# Script para gerar a documentação OpenAPI do projeto

set -e

# Resolve a raiz do projeto a partir da localização do script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 Gerando documentação OpenAPI..."

# Compila o projeto
echo "📦 Compilando o projeto..."
(cd "${PROJECT_ROOT}" && tsc -p tsconfig.build.json)

echo "🧾 Gerando especificação OpenAPI..."
(cd "${PROJECT_ROOT}" && NODE_ENV=development OPENAPI_GENERATION=true node dist/src/infra/main.js)

echo "✅ Documentação OpenAPI gerada com sucesso em openapi.json"
