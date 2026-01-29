#!/bin/sh
set -e

# Build if needed (skipped during Docker build)
if [ -f .next/skip-build ]; then
  echo "Running Next.js build at runtime..."
  npm run build
  rm .next/skip-build
fi

# Start application
exec node server.js