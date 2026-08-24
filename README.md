# Jayda Farms

A poultry farm management system: flocks and houses, daily records, health and
vaccinations, feed and inventory, sales and deliveries, revenue and expenses —
for a whole team, with a role behind every action.

Built on Next.js 16 (App Router, Server Actions), React 19, PostgreSQL via
Drizzle, and Tailwind 4. Money is Ghana cedis, stored as whole pesewas in
integer columns.

---

## Running it locally

**Requirements:** Node 22+, PostgreSQL 14+.

```bash
git clone <repo> && cd farm-app
npm install

cp .env.example .env
# Set DATABASE_URL, then generate a real SESSION_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

createdb farm_app
npm run db:migrate     # apply the schema
npm run db:seed        # demo data — skip for an empty farm

npm run dev
```

Then sign in at http://localhost:3000. The seed creates
`johnson@jaydafarms.com` / `farmpassword` as the owner, plus one account per
role. **Never run `db:seed` against production** — it truncates every table
first.

### Environment

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SESSION_SECRET` | **in production** | Keys the session token digest. At least 32 characters. The app refuses to start a session without it in production rather than falling back to a default. Changing it signs everyone out. |
| `DATABASE_SSL` | no | `"true"` for a managed database requiring TLS |
| `SESSION_IDLE_MINUTES` | no | Idle timeout, default 60 |
| `LOG_LEVEL` | no | `debug` / `info` / `warn` / `error`, default `info` |
| `TEST_DATABASE_URL` | no | Test suite only, defaults to `farm_app_test` |

---

## Everyday commands

```bash
npm run dev              # development server
npm run verify           # typecheck + lint + tests — run before pushing
npm test                 # the whole suite
npm run test:watch       # re-runs on save
npm run test:unit        # no database needed
npm run test:coverage    # coverage report in coverage/

npm run db:generate      # write a migration after editing lib/db/schema.ts
npm run db:migrate       # apply pending migrations
npm run db:studio        # browse the data
```

---

## Tests

Two suites, split by what they need.

**`tests/unit`** — schemas, formatters, the permission table, the redirect
guard. No database, runs in about a second.

**`tests/integration`** — the real Server Actions against real PostgreSQL,
because the failures worth catching here only exist once a database is
involved: a stock-out race that oversells, a payment that exceeds its order,
the capability gate refusing a role. The test database is created and migrated
automatically on first run; if no PostgreSQL is reachable the suite skips
itself with a message instead of failing.

Tests never touch your development database — the Vitest config points
`DATABASE_URL` at `farm_app_test` before anything imports the app.

---

## Deploying

The app is a standard Next.js server. Every route renders on demand (there is
nothing to statically export), so it needs a Node runtime and a reachable
database.

```bash
npm ci
npm run db:migrate      # always before the new code serves traffic
npm run build
npm start               # defaults to port 3000
```

### Before the first production deploy

- [ ] `SESSION_SECRET` set to a fresh 64-character value, held in your secret
      manager and not in the repo
- [ ] `DATABASE_URL` points at the production database, with its own role and
      password
- [ ] TLS terminated in front of the app — the session cookie is marked
      `Secure` in production and will not survive plain HTTP
- [ ] `/api/health` wired into the load balancer (200 = serving, 503 = drain)
- [ ] Automated database backups on, and **a restore actually rehearsed**
- [ ] Log output shipped somewhere durable — see below

### Health

`GET /api/health` is unauthenticated by design and reports only whether the
database is reachable:

```json
{ "status": "ok", "database": "ok", "latencyMs": 7 }
```

A 503 means this instance cannot serve. It deliberately exposes no version,
row counts or configuration.

---

## Operations

### Logs

Production emits one JSON object per line, each carrying a `requestId`:

```json
{"level":"error","time":"2026-08-24T01:12:04.881Z","message":"Unhandled error in a Server Action","requestId":"…","error":{"name":"Error","message":"…","stack":"…"}}
```

Ship stdout to whatever you use — CloudWatch, Loki, Datadog. `LOG_LEVEL`
controls the floor.

**Error tracking** is not wired to a provider. Everything funnels through
`reportError` in `lib/observability/logger.ts`; adding Sentry is one edit
there, not a search through every catch block.

### Backups

Nothing in this repo backs up your data — it has to be configured wherever the
database lives.

```bash
# Take one
pg_dump --format=custom --file=farm-$(date +%F).dump "$DATABASE_URL"

# Restore into a fresh database, then point the app at it
createdb farm_app_restored
pg_restore --dbname=farm_app_restored --clean --if-exists farm-2026-08-24.dump
```

A backup you have never restored is a hypothesis. Rehearse it.

### Migrations

Schema changes are files, never `db:push` in production:

```bash
# after editing lib/db/schema.ts
npm run db:generate      # writes lib/db/migrations/NNNN_name.sql — commit it
npm run db:migrate       # applies anything pending
```

Migrations run forward only; there is no down step. Take a backup before
applying one that drops or rewrites a column.

### Rate limiting

Failed sign-ins are recorded in `login_attempts` and throttled over a rolling
15-minute window: 5 per account, 20 per address. It lives in the database
rather than in memory so it survives a deploy and works with more than one
instance. A successful sign-in clears that account's history, and rows age out
on their own.

---

## How the code is arranged

| Path | What lives there |
|---|---|
| `app/(app)/` | The boards. Server Components that query and render. |
| `app/api/` | Route handlers: export, health, session lifecycle. |
| `lib/data/` | Every read query. Returns display-ready shapes. |
| `lib/actions/` | Every write, as a Server Action. |
| `lib/validation/` | Zod schemas — the only place input is trusted from. |
| `lib/auth/` | Sessions, password hashing, capabilities, throttling. |
| `lib/db/` | Drizzle schema, migrations, seed. |
| `components/` | UI, dialogs, forms, charts. |
| `tests/` | Unit and integration suites. |
| `proxy.ts` | Edge routing: bounces anonymous requests before render. |

### The security model, briefly

Authorization is a **capability** per role (`lib/auth/permissions.ts`), checked
inside every Server Action via `requireCapability`. The proxy redirect is a
first line of defence only — actions are reachable by direct POST, so the gate
has to be in the action itself, and it is. `tests/integration/actions.test.ts`
holds that property in place.

---

## Known gaps

Honest list, so nobody discovers these the hard way:

- **`DATABASE_SSL=true` does not verify the server certificate**
  (`rejectUnauthorized: false` in `lib/db/index.ts`). Encrypted, not
  authenticated. Fix before pointing at a managed database over the internet.
- **Deletes are permanent.** Expenses, daily records, mortality, health events,
  flocks and houses are removed outright, with no soft-delete and no audit of
  the deletion — while products and inventory items archive instead. That
  asymmetry is unresolved.
- **No forced password change on first sign-in**, so an owner-chosen initial
  password can live indefinitely.
- **`npm audit` reports moderate advisories in `drizzle-kit`'s build chain.**
  They are development tooling, not shipped code — `npm audit --omit=dev` is
  clean, which is what CI gates on.
- **The `manager` role has no seeded account**, so it is the one role never
  exercised end to end.
