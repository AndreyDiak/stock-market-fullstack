#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Regenerating Prisma client..."
npx prisma generate

if [ "${RUN_SEED}" = "true" ]; then
  echo "Seeding database..."
  npm run db:seed
fi

exec "$@"
