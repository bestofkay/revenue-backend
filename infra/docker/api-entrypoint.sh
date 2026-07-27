#!/bin/sh
set -eu

# Build connection URLs from Render private-service env when not provided explicitly.
if [ -z "${DATABASE_URL:-}" ] || [ "${DATABASE_URL}" = "auto" ]; then
  DATABASE_URL="$(
    node -e "
      const u = encodeURIComponent(process.env.MYSQL_USER || 'revenue');
      const p = encodeURIComponent(process.env.MYSQL_PASSWORD || '');
      const h = process.env.MYSQL_HOST || 'revenue-mysql';
      const d = process.env.MYSQL_DATABASE || 'revenue';
      if (!process.env.MYSQL_PASSWORD) {
        console.error('MYSQL_PASSWORD is required when DATABASE_URL=auto');
        process.exit(1);
      }
      process.stdout.write(\`mysql://\${u}:\${p}@\${h}:3306/\${d}\`);
    "
  )"
  export DATABASE_URL
fi

if [ -z "${RABBITMQ_URL:-}" ] || [ "${RABBITMQ_URL}" = "auto" ]; then
  RABBITMQ_URL="$(
    node -e "
      const u = encodeURIComponent(process.env.RABBITMQ_USER || 'revenue');
      const p = encodeURIComponent(process.env.RABBITMQ_PASS || '');
      const h = process.env.RABBITMQ_HOST || 'revenue-rabbitmq';
      if (!process.env.RABBITMQ_PASS) {
        console.error('RABBITMQ_PASS is required when RABBITMQ_URL=auto');
        process.exit(1);
      }
      process.stdout.write(\`amqp://\${u}:\${p}@\${h}:5672\`);
    "
  )"
  export RABBITMQ_URL
fi

if [ -z "${API_URL:-}" ] || [ "${API_URL}" = "auto" ]; then
  if [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
    export API_URL="$RENDER_EXTERNAL_URL"
  else
    export API_URL="http://localhost:${PORT:-4000}"
  fi
fi

echo "Waiting for MySQL at ${MYSQL_HOST:-revenue-mysql}:3306 ..."
i=0
until node -e "
  const net = require('net');
  const host = process.env.MYSQL_HOST || 'revenue-mysql';
  const socket = net.connect({ host, port: 3306 }, () => {
    socket.end();
    process.exit(0);
  });
  socket.on('error', () => process.exit(1));
  setTimeout(() => process.exit(1), 2000);
" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 90 ]; then
    echo "MySQL did not become ready in time"
    exit 1
  fi
  sleep 2
done

echo "Applying Prisma migrations..."
pnpm --filter @revenue/database exec prisma migrate deploy

echo "Starting API on port ${PORT:-4000}..."
exec node apps/api/dist/main.js
