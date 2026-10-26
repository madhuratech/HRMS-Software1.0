#!/usr/bin/env bash
# ==============================================================================
# HRMS Production Deployment Script (VPS)
# ==============================================================================
set -e

BACKEND_DIR="/home/madhuratech-api-hrms/htdocs/api.hrms.madhuratech.com/Hrms-Backend/backend"
FRONTEND_DIR="/home/madhuratech-hrms/htdocs/hrms.madhuratech.com/Hrms-Frontend/frontend"

echo "=== 1. Deploying Backend ==="
cd "$BACKEND_DIR"

# Ensure environment is configured for production on port 3308
export NODE_ENV=production
export PORT=3308

# Install dependencies if needed
npm install --omit=dev

# Run pending Knex migrations safely against madhurahrms database
npx knex migrate:latest

# Restart or Start PM2 process
if pm2 list | grep -q "Hrms-Backend"; then
  echo "Restarting Hrms-Backend..."
  pm2 restart Hrms-Backend --update-env
else
  echo "Starting Hrms-Backend..."
  pm2 start server.js --name Hrms-Backend
fi
pm2 save

echo "=== 2. Deploying Frontend ==="
cd "$FRONTEND_DIR"

# Fix esbuild binary executable permissions if needed
if [ -f "node_modules/@esbuild/linux-x64/bin/esbuild" ]; then
  chmod +x "node_modules/@esbuild/linux-x64/bin/esbuild"
fi

# Ensure MapTiler key and Production API URL are available for the build
export VITE_MAPTILER_KEY="EukJpWqJ1UzSEKZylRdZ"
export VITE_API_URL="https://api.hrms.madhuratech.com"

# Build production SPA assets into dist/
npm run build

echo "=== 3. Testing Services ==="
curl -I http://127.0.0.1:3308 || echo "Backend check failed"
echo "=== Deployment Completed Successfully ==="
