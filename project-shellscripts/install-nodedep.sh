#!/bin/bash
# install-nodedep.sh
# Usage: ./project-shellscripts/install-nodedep.sh server sharp
# Usage: ./project-shellscripts/install-nodedep.sh storefront some-package

set -e

APP=$1
PACKAGE=$2

if [ -z "$APP" ] || [ -z "$PACKAGE" ]; then
  echo "Usage: $0 <server|storefront> <package-name>"
  exit 1
fi

case $APP in
  server) DIR="my-shop-juniper/apps/server" ;;
  storefront) DIR="my-shop-juniper/apps/storefront" ;;
  *) echo "Unknown app: $APP"; exit 1 ;;
esac

echo "📦 Installing $PACKAGE in $APP (Linux container)..."
docker run --rm \
  -v "$(pwd)/$DIR:/usr/src/app" \
  -w /usr/src/app \
  node:20-slim \
  sh -c "npm install $PACKAGE && chown -R $(id -u):$(id -g) ."
echo "✅ Done. Commit the updated package.json and package-lock.json."