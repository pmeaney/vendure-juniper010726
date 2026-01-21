#!/bin/bash
# generate-lockfiles.sh

# This file is to generate npm package-lock.json files from within containers.
# This way all their dependencies will be Linux -based, rather than based on the OS of the developer's laptop.
# To run it, run these two lines:
# chmod +x generate-lockfiles.sh
# ./generate-lockfiles.sh

set -e  # Exit on any error

echo "🔧 Generating Linux-compatible package-lock.json files..."
echo ""

# Server (used by both server and worker)
echo "📦 Processing server..."
docker run --rm \
  -v "$(pwd)/my-shop-juniper/apps/server:/usr/src/app" \
  -w /usr/src/app \
  node:20-slim \
  sh -c "npm install && chown $(id -u):$(id -g) package-lock.json"
echo "✅ Server package-lock.json generated"
echo ""

# Storefront
echo "📦 Processing storefront..."
docker run --rm \
  -v "$(pwd)/my-shop-juniper/apps/storefront:/app" \
  -w /app \
  node:20-slim \
  sh -c "npm install && chown $(id -u):$(id -g) package-lock.json"
echo "✅ Storefront package-lock.json generated"
echo ""

echo "🎉 Done! Lockfiles are ready to commit."
echo "Next steps:"
echo "  1. Review the generated files"
echo "  2. git add my-shop-juniper/apps/*/package-lock.json"
echo "  3. git commit -m 'Add Linux-generated package-lock.json files'"
echo "  4. docker compose -f docker-compose.local.yml up --build"