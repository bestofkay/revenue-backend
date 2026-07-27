# Start the Government Revenue project

Copy-paste this into Cursor chat:

---

Start the Government Revenue platform for local development.

1. Ensure Docker Desktop is running.
2. From the repo root, start MySQL, Redis, RabbitMQ, and Mailhog:
   `docker compose -f infra/docker/docker-compose.yml up -d mysql redis rabbitmq mailhog`
3. Wait until MySQL is healthy.
4. Run `pnpm install` if needed.
5. Build shared packages:
   `pnpm --filter @revenue/shared build`
   `pnpm --filter @revenue/config build`
6. Apply all DB migrations and seed:
   `pnpm db:generate`
   `pnpm --filter @revenue/database exec prisma migrate deploy`
   `pnpm db:seed`
7. Start all apps in the background:
   `pnpm --filter @revenue/api dev`
   `pnpm --filter @revenue/web dev`
   `pnpm --filter @revenue/pay dev`
8. Confirm ports 4000 / 3000 / 3001 are up, then give me the URLs and demo login credentials.

Use the project skill **start-project** if available. Do not print `.env` secrets.

---

## After it finishes

| App | URL |
|-----|-----|
| Admin | http://localhost:3000 |
| Pay | http://localhost:3001 |
| Swagger | http://localhost:4000/docs |
| Mailhog | http://localhost:8025 |

Password for seeded users: `ChangeMe@12345`  
Admin: `admin@ncs.gov.ng`
