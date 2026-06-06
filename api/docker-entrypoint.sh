#!/bin/sh
set -e

npx prisma migrate deploy

npx tsx prisma/seed.ts || echo "Seed falhou ou já foi aplicado - seguindo."

exec "$@"
