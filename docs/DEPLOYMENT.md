# Deployment Guide

## Deployment decision

| Target | Full application | Recommended use |
|---|---:|---|
| Local npm | Yes | Individual development and learning |
| Docker / Docker Compose | Yes | Portable local or single-host deployment |
| Azure App Service (Linux container) | Yes, single instance with SQLite | Simple managed hosting; migrate to PostgreSQL before scale-out |
| Azure Container Apps | Yes, single replica with mounted storage | Container-first pilot; PostgreSQL strongly preferred |
| GitHub Codespaces/devcontainer | Yes | Development and demos |
| GitHub Pages | No | Static documentation or exported read-only experience only |

## Local npm

```powershell
npm ci
Copy-Item .env.example .env.local
npm run build
npm start
```

For production behavior, set `NODE_ENV=production`, a random `AUTH_SECRET`, and an absolute writable `DATABASE_PATH`. Local HTTP also needs `SESSION_COOKIE_SECURE=false`; hosted HTTPS must set it to `true`.

## Docker

Build and run:

```powershell
docker build -t levelup-architect .
docker run --rm -p 3000:3000 `
  -e AUTH_SECRET="replace-with-at-least-32-random-characters" `
  -e DATABASE_PATH="/app/data/levelup-architect.db" `
  -v levelup-data:/app/data `
  levelup-architect
```

The image uses Next.js standalone output, runs as a non-root user, and stores SQLite outside immutable image layers.

Docker Compose:

```powershell
$env:AUTH_SECRET = "replace-with-at-least-32-random-characters"
docker compose up --build
```

The Compose health check calls `/api/health`.

## Codespaces and devcontainers

Open the repository in a devcontainer or create a Codespace. The configuration:

- uses Node.js 22 on Debian Bookworm;
- runs `npm ci`;
- forwards port 3000;
- provides local development database/auth settings;
- installs ESLint, Tailwind, and Docker editor extensions.

Run `npm run dev` after container creation. Do not reuse the included development secret in hosted environments.

## Azure App Service

### Container deployment

1. Build and push the image to Azure Container Registry or GitHub Container Registry.
2. Create a Linux App Service plan and Web App for Containers.
3. Set:
   - `AUTH_SECRET` as an application secret or Key Vault reference.
   - `DATABASE_PATH=/home/data/levelup-architect.db`.
   - `NEXT_PUBLIC_APP_URL=https://<your-app-host>`.
   - `SESSION_COOKIE_SECURE=true`.
   - `MENTOR_PROVIDER=local` unless an approved provider is configured.
   - `WEBSITES_PORT=3000`.
4. Mount/persist `/home` storage.
5. Enable HTTPS-only, health check `/api/health`, diagnostic logs, and backups.
6. Keep instance count at one while using SQLite.

### Source deployment

App Service can build Node.js source, but the native `better-sqlite3` dependency and standalone output make the container path more reproducible. If source deployment is used, pin Node.js 22 and run `npm ci && npm run build`.

### Scale-out warning

Do not point multiple App Service instances at separate SQLite files and expect consistent progress. Complete the PostgreSQL migration first, then move login throttling/session cleanup to shared infrastructure.

## Azure Container Apps

1. Push the production image to a registry.
2. Create a Container App with ingress on target port 3000.
3. Store `AUTH_SECRET` and optional mentor credentials as Container Apps secrets.
4. Set `NEXT_PUBLIC_APP_URL` to the public HTTPS origin and `SESSION_COOKIE_SECURE=true`.
5. For an SQLite pilot, attach a supported persistent volume at `/app/data` and set min/max replicas to 1.
6. Configure `/api/health` probes and log collection.
7. For production/multiple replicas, use Azure Database for PostgreSQL and remove the shared-file assumption.

Container Apps ephemeral filesystem is not suitable for the SQLite database. A revision without persistent storage loses learner progress.

## PostgreSQL migration requirements

Before horizontal scale:

1. Introduce a typed database/repository adapter around current service queries.
2. Translate schema checks and JSON text columns to PostgreSQL constraints/`jsonb`.
3. Preserve unique event keys, quest period constraints, and transaction boundaries.
4. Choose transaction isolation and row locking for concurrent step/exam submissions.
5. Replace SQLite scalar `MIN`/`MAX` update expressions where PostgreSQL syntax differs.
6. Add pooled connections, migrations, integration tests, and data-copy verification.
7. Move rate limiting to shared storage and schedule session cleanup.

Azure Database for PostgreSQL Flexible Server with private networking, TLS, managed identity where supported, backup retention, and tested restore is the expected Azure production target.

## Optional mentor provider

Keep `MENTOR_PROVIDER=local` for no-cost/offline operation. For an approved OpenAI-compatible endpoint:

```text
MENTOR_PROVIDER=openai-compatible
MENTOR_API_URL=https://provider.example/v1/chat/completions
MENTOR_API_KEY=<secret>
MENTOR_MODEL=<deployment-or-model>
```

Use platform secret storage. Confirm regional, privacy, retention, and data-processing requirements before enabling. The submitted learner message and derived learning context leave the application boundary.

## GitHub Pages limitation

GitHub Pages is static hosting. It cannot execute:

- Next.js route handlers;
- password/session authentication;
- SQLite reads or transactions;
- quest generation/completion;
- XP/streak/achievement updates;
- timed exam scoring;
- mentor provider calls.

A separate static marketing site or read-only exported learning report can be designed for Pages, but deploying this repository as a static export would remove the core product guarantees. Do not label such an export as the full application.

## Production checklist

- [ ] Unique 32+ character `AUTH_SECRET`.
- [ ] Demo seeding disabled.
- [ ] HTTPS-only and secure proxy headers.
- [ ] Persistent database/storage with backup and tested restore.
- [ ] One instance for SQLite, or completed PostgreSQL migration.
- [ ] Central logs and `/api/health` monitoring.
- [ ] Secret storage/rotation and no `NEXT_PUBLIC_` secret variables.
- [ ] External mentor privacy/security approval.
- [ ] Rate limits appropriate to Internet exposure.
- [ ] Content/resource review cadence.
- [ ] Incident and learner-data deletion procedures.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass for the deployed commit.
