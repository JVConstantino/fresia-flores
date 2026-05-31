#!/bin/bash

# Script para gerar ZIP de deploy do Frésia Flores
# Uso: ./scripts/create-deploy-zip.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_ZIP="fresia-deploy-${TIMESTAMP}.zip"

echo "📦 Criando ZIP de deploy..."
echo "📁 Diretório do projeto: ${PROJECT_ROOT}"
echo "📄 Arquivo de saída: ${DEPLOY_ZIP}"

cd "${PROJECT_ROOT}"

# Criar ZIP excluindo arquivos desnecessários
zip -r "${DEPLOY_ZIP}" . \
  -x "node_modules/*" \
  -x "frontend/node_modules/*" \
  -x "backend/node_modules/*" \
  -x "frontend/dist/*" \
  -x "backend/dist/*" \
  -x ".git/*" \
  -x ".gitignore" \
  -x "*.log" \
  -x "logs/*" \
  -x ".env" \
  -x ".env.local" \
  -x ".env.development" \
  -x ".env.production" \
  -x "frontend/.env" \
  -x "frontend/.env.local" \
  -x "frontend/.env.development" \
  -x "frontend/.env.production" \
  -x "backend/.env" \
  -x "backend/.env.local" \
  -x "backend/.env.development" \
  -x "backend/.env.production" \
  -x ".DS_Store" \
  -x "Thumbs.db" \
  -x "*.tmp" \
  -x "*.temp" \
  -x ".cache/*" \
  -x "coverage/*" \
  -x ".nyc_output/*" \
  -x "deploy-*.zip" \
  -x "fresia-deploy-*.zip"

# Mostrar informações do ZIP
echo ""
echo "✅ ZIP criado com sucesso!"
echo "📊 Tamanho: $(du -h "${DEPLOY_ZIP}" | cut -f1)"
echo "📦 Arquivo: ${PROJECT_ROOT}/${DEPLOY_ZIP}"
echo ""
echo "📋 Próximos passos:"
echo "1. Faça upload do ZIP para o Hostinger"
echo "2. Configure as variáveis de ambiente no hPanel"
echo "3. Execute o build no servidor"
echo ""
echo "🔧 Variáveis de ambiente necessárias:"
echo "   - NODE_ENV=production"
echo "   - DATABASE_URL=mysql://..."
echo "   - JWT_SECRET=..."
echo "   - MP_ACCESS_TOKEN=..."
echo "   - MP_PUBLIC_KEY=..."
echo "   - PORT=4000"
