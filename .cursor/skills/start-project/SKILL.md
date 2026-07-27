---
name: start-project
description: >-
  Starts the Government Revenue platform locally: Docker (MySQL/Redis/RabbitMQ/Mailhog),
  installs deps if needed, builds shared packages, runs Prisma migrate deploy, seeds the DB,
  and starts API/web/pay apps. Use when the user asks to start the project, boot the apps,
  run migrations, seed the database, or bring the stack up for local testing.
---

# Start Project (Revenue Platform)

## Goal

Bring the full local stack online and report URLs + demo credentials when done.

## Working directory

Always run commands from the repo root: `c:\Projects\revenue` (or the workspace root).

## Steps (execute in order)

1. **Ensure `.env` exists**
   - If missing: copy `.env.example` â†’ `.env`
   - Do not print secret values from `.env`

2. **Start Docker infrastructure** (apps run on host, not via compose app services unless asked)
   ```powershell
   docker compose -f infra/docker/docker-compose.yml up -d mysql redis rabbitmq mailhog
   ```
   - If Docker Desktop is not running, tell the user to start it, then retry
   - Wait until MySQL is healthy (`docker compose -f infra/docker/docker-compose.yml ps` or `docker ps`)

3. **Install dependencies** (skip only if `node_modules` already exists and user did not ask for a clean install)
   ```powershell
   pnpm install
   ```

4. **Build shared packages**
   ```powershell
   pnpm --filter @revenue/shared build
   pnpm --filter @revenue/config build
   ```

5. **Database: generate client + apply all migrations + seed**
   ```powershell
   pnpm db:generate
   pnpm --filter @revenue/database exec prisma migrate deploy
   pnpm db:seed
   ```
   - Prefer `migrate deploy` (applies all migrations) over `migrate:dev` for this start flow
   - If migrate fails because MySQL is not ready, wait ~10â€“20s and retry once

6. **Start all apps in background** (separate shell processes; do not block forever on one)
   ```powershell
   pnpm --filter @revenue/api dev
   pnpm --filter @revenue/web dev
   pnpm --filter @revenue/pay dev
   ```
   - Use `block_until_ms: 0` (or equivalent) so each starts in the background
   - Confirm they are listening before finishing (API ~4000, web ~3000, pay ~3001)
   - If a port is already in use, report which process/port and ask before killing

7. **Final report to user** (always include)
   | Surface | URL |
   |---------|-----|
   | Admin | http://localhost:3000 |
   | Pay portal | http://localhost:3001 |
   | API Swagger | http://localhost:4000/docs |
   | Mailhog | http://localhost:8025 |

   Demo login password: `ChangeMe@12345`  
   Example admin: `admin@ncs.gov.ng`  
   Sample pay codes: `NCS202607000001` â€¦ `NCS202607000005`

## Optional helper script

If `scripts/start-dev.ps1` exists, you may run it for steps 2â€“5, then still start the three apps in background as in step 6:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1
```

## Do not

- Do not commit, push, or change git config
- Do not force-kill unrelated processes without asking
- Do not start production builds unless the user asked for production
- Do not print full `.env` contents
