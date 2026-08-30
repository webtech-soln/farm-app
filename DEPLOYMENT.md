# Deploying Jayda Farms

A runbook for putting this app in front of a real farm, and for the routine work
afterwards. Every command here has been run against this codebase; the
[Gotchas](#gotchas-that-have-actually-bitten) section is the list of things that
have genuinely gone wrong rather than a generic warning list.

**What you are deploying:** a Next.js 16 server (App Router, Server Actions) and
a PostgreSQL database. Every route renders on demand — there is nothing to
export to a CDN — so this needs a Node process, not static hosting.

---

## Contents

1. [Before you start](#1-before-you-start)
2. [Provision the database](#2-provision-the-database)
3. [Set the environment](#3-set-the-environment)
4. [Deploy](#4-deploy)
5. [Verify](#5-verify)
6. [Create the first owner](#6-create-the-first-owner)
7. [Routine deploys](#7-routine-deploys)
8. [Rolling back](#8-rolling-back)
9. [Backups and restore](#9-backups-and-restore)
10. [Monitoring](#10-monitoring)
11. [Gotchas](#gotchas-that-have-actually-bitten)

---

## 1. Before you start

You need:

- **Node 22 or newer.** The app uses `node:crypto` scrypt parameters and
  `--env-file-if-exists`, both of which need a current runtime.
- **PostgreSQL 14 or newer.**
- **TLS in front of the app.** Not optional — see
  [gotcha #1](#1-without-tls-nobody-can-sign-in).
- A place to put secrets that is not the repository.

Confirm the build is green before you touch a server:

```bash
npm ci
npm run verify      # typecheck + lint + 212 tests
npm run build
```

`npm run verify` needs a PostgreSQL it can reach for the integration suite. If
there is none, those tests skip themselves with a message and the unit suite
still runs — that is expected, not a failure.

---

## 2. Provision the database

Create a database and a role that owns only it:

```sql
CREATE DATABASE farm_app;
CREATE USER farm_app WITH PASSWORD 'use-something-generated';
GRANT ALL PRIVILEGES ON DATABASE farm_app TO farm_app;
```

Then, connected to `farm_app` itself:

```sql
GRANT ALL ON SCHEMA public TO farm_app;
```

The app never needs superuser. It creates no databases and no extensions.

---

## 3. Set the environment

| Variable | Required | Notes |
|---|:--:|---|
| `DATABASE_URL` | **yes** | `postgresql://user:password@host:5432/farm_app` |
| `SESSION_SECRET` | **yes** | At least 32 characters. Sign-in is refused without it — see [gotcha #2](#2-session_secret-is-a-hard-requirement-and-rotating-it-signs-everyone-out). |
| `DATABASE_SSL` | no | `"true"` for a managed database over the network. Read [gotcha #6](#6-database_ssltrue-does-not-verify-the-certificate) first. |
| `SESSION_IDLE_MINUTES` | no | Idle timeout, default `60`. |
| `LOG_LEVEL` | no | `debug` \| `info` \| `warn` \| `error`, default `info`. |
| `PORT` | no | Default `3000`. |

Generate the secret once and store it with your other secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`NODE_ENV` is set to `production` by `next build` and `next start`; you do not
need to set it yourself.

---

## 4. Deploy

Migrations run **before** the new code serves traffic, so the schema is never
behind the application reading it.

```bash
# 1. Install exactly what the lockfile says
npm ci

# 2. Bring the schema up to date
npm run db:migrate

# 3. Build
npm run build

# 4. Serve
npm start
```

Step 2 reads `DATABASE_URL` from the environment and needs no `.env` file — see
[gotcha #3](#3-migrations-used-to-need-a-env-file).

### As a container

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

Run `npm run db:migrate` as a release step — an init container, a pre-deploy
hook, whatever your platform calls it — not inside `CMD`, or every replica will
race to migrate the same database.

> **Do not** copy a `.env` file into the image. See
> [gotcha #4](#4-a-stray-env-silently-overrides-your-platform-variables).

### Behind a reverse proxy

The proxy must forward the client address, or per-IP sign-in throttling has
nothing to work with:

```nginx
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

Without `X-Forwarded-For`, per-account throttling still works but the per-IP
limit is inert — see [gotcha #5](#5-no-x-forwarded-for-means-no-per-ip-throttling).

---

## 5. Verify

```bash
curl -s https://your-host/api/health
# {"status":"ok","database":"ok","latencyMs":7}
```

`200` means this instance can serve. `503` means it cannot reach the database
and should be drained. The endpoint is deliberately unauthenticated and reports
nothing else — no version, no counts, no configuration.

Point your load balancer's health check at it.

Then, by hand, once:

- [ ] `https://your-host/login` loads over **HTTPS**
- [ ] Signing in works and lands you on a board
- [ ] Reloading keeps you signed in — if not, read [gotcha #1](#1-without-tls-nobody-can-sign-in)
- [ ] Signing out returns you to `/login`
- [ ] `curl -sI https://your-host/login | grep -i strict-transport` returns a header

---

## 6. Create the first owner

A fresh database has no accounts, and there is no public sign-up. Two options.

**Seed the demo dataset** — for a pilot or a demo, never for real books:

```bash
npm run db:seed    # TRUNCATES EVERY TABLE, then loads sample data
```

It prints the credentials to sign in with. **This destroys existing data**, so
never run it against a database that holds real records.

**Or insert one owner by hand** — the honest path for a real farm:

```bash
# Generate a hash for the password you have chosen
node -e "
const { scrypt, randomBytes } = require('crypto');
const salt = randomBytes(16);
scrypt(process.argv[1].normalize('NFKC'), salt, 64,
  { N: 32768, r: 8, p: 1, maxmem: 128 * 32768 * 8 * 2 },
  (e, key) => console.log(['scrypt', 32768, 8, 1,
    salt.toString('base64url'), key.toString('base64url')].join('\$')));
" 'ChooseAStrongOne1'
```

```sql
INSERT INTO users (name, email, role, password_hash, is_active, duty_status)
VALUES ('Owner Name', 'owner@yourfarm.com', 'owner', '<hash from above>', true, 'on_duty');

INSERT INTO farm_settings (id, farm_name) VALUES (1, 'Your Farm Name');
```

Sign in, then create everyone else through **Employees → Add Employee**, which
applies the password policy for you. After that the only account that can reach
Settings is an `owner`, so make sure there are two before you rely on one.

---

## 7. Routine deploys

```bash
git pull
npm ci
npm run verify        # stop here if anything fails
npm run db:migrate
npm run build
# restart the process
```

After changing `lib/db/schema.ts`, generate the migration and **commit it**:

```bash
npm run db:generate   # writes lib/db/migrations/NNNN_name.sql
```

Never `npm run db:push` against production — it diffs and alters the live
schema with no migration file and no record of what it did.

---

## 8. Rolling back

Migrations are forward-only; there is no down step. So:

- **Code-only change** → redeploy the previous commit. Safe.
- **Included a migration** → rolling the code back does *not* roll the schema
  back. If the old code cannot work against the new schema, restore the
  database from the backup you took before migrating, then redeploy.

Which is the whole reason for the next section.

---

## 9. Backups and restore

Nothing in this repository backs anything up. It has to be configured where the
database lives.

```bash
# Take one — before every migration, and on a schedule
pg_dump --format=custom --file="farm-$(date +%F-%H%M).dump" "$DATABASE_URL"

# Restore into a fresh database first, never over a live one
createdb farm_app_restored
pg_restore --dbname=farm_app_restored --clean --if-exists farm-2026-08-24-1130.dump
```

Then point a staging instance at `farm_app_restored` and sign in. **A backup you
have never restored is a hypothesis, not a backup.** Rehearse it before you need
it, and write down how long it took.

---

## 10. Monitoring

Logs go to stdout as one JSON object per line in production, each carrying a
`requestId`:

```json
{"level":"error","time":"2026-08-24T01:12:04.881Z","message":"Unhandled error in a Server Action","requestId":"…","error":{"name":"Error","message":"…"}}
```

Ship stdout wherever you collect logs. Worth alerting on:

| Signal | Why |
|---|---|
| `"level":"error"` rate | Unhandled failures in actions |
| `/api/health` returning 503 | The instance cannot reach the database |
| `"message":"Sign-in throttled"` in volume | Someone is grinding at the login form |

**Error tracking is not wired to a provider.** Everything funnels through
`reportError` in `lib/observability/logger.ts`; adding Sentry is one edit there
rather than a search through every catch block. Until you do, nothing is
watching those logs for you.

---

## Gotchas that have actually bitten

### 1. Without TLS, nobody can sign in

In production the session cookie is set `Secure`, so a browser will not store
it over plain HTTP. The symptom is not an error: the login form accepts the
password, redirects, and lands you back on `/login` with no message, forever.

Terminate TLS in front of the app before you let anyone try it.

### 2. `SESSION_SECRET` is a hard requirement, and rotating it signs everyone out

Session tokens are stored as an HMAC keyed with this value. Two consequences:

- **Missing in production, sign-in is refused.** Verified: with no
  `SESSION_SECRET`, a production server serves pages and answers `/api/health`
  normally, but every sign-in fails. There is deliberately no fallback — a
  default secret would be a shipped secret.
- **Changing it invalidates every existing session.** Everyone is signed out at
  once. That is the correct emergency response to a leaked secret; it is a
  surprise if you rotate it casually.

### 3. Migrations used to need a `.env` file

The `db:*` scripts once used `node --env-file=.env`, which **fails outright** if
that file is absent — exactly the case in any container where the platform
injects variables. They now use `--env-file-if-exists`, so they read `.env`
locally and fall back to the real environment in production.

If you have older scripts or CI steps pinned to `--env-file=.env`, update them.

### 4. A stray `.env` silently overrides your platform variables

Next.js loads `.env` from the working directory **in production too**. A file
left in the deploy directory or baked into an image will quietly supply
configuration, mask a missing platform variable, and make the running app
disagree with what your dashboard shows.

This one cost real time to diagnose: a production server appeared to accept a
missing `SESSION_SECRET`, because a `.env` in the directory was providing it.

Keep `.env` for local development only. It is already in `.gitignore`; keep it
out of your images too.

### 5. No `X-Forwarded-For` means no per-IP throttling

Sign-in throttling has two limits — 5 per account and 20 per address over a
rolling 15 minutes. The address comes from `X-Forwarded-For`. If your proxy does
not set it, the per-account limit still protects individual accounts, but
somebody spreading attempts across many accounts from one machine is no longer
counted.

### 6. `DATABASE_SSL=true` does not verify the certificate

The pool sets `rejectUnauthorized: false`, which encrypts the connection but
does not authenticate the server — so it does not protect against a
man-in-the-middle. Acceptable inside a private network; **fix it before
connecting to a managed database across the internet**, by supplying the
provider's CA in `lib/db/index.ts`.

### 7. `db:seed` truncates everything

It is a demo loader, not a bootstrapper. It clears every table before inserting.
There is no confirmation prompt.

### 8. One `owner` is a single point of failure

Only an `owner` can reach Settings, and the app refuses to remove the last
active owner — which protects you from lockout but means a single owner who
loses their password locks Settings until someone edits the database. Create a
second owner account.

---

## Reference

| Command | What it does |
|---|---|
| `npm run verify` | Typecheck, lint, and the full test suite |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:generate` | Write a migration after a schema edit |
| `npm run build` | Production build |
| `npm start` | Serve the build |
| `GET /api/health` | `200` serving, `503` drain this instance |

Architecture, the security model, and the known-gaps list live in
[README.md](README.md).
