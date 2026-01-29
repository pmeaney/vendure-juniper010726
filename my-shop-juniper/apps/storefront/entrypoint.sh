#!/bin/sh
set -e

# Build if needed (skipped during Docker build)
if [ -f .next/skip-build ]; then
  echo "Running Next.js build at runtime..."
  npm run build
fi

# Start application
exec npm run start