# InboxIQ

InboxIQ is a Next.js App Router starter for a Gmail-connected inbox assistant.

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS
- ESLint + Prettier

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` file (not committed) from the example:

```bash
cp .env.example .env.local
```

### 2a) Google OAuth (for local auth)

- Set `NEXTAUTH_URL=http://localhost:3000`
- Set `NEXTAUTH_SECRET` (any long random string)
- In Google Cloud Console, create an OAuth Client ID (Web application) and add:
  - Authorized JavaScript origins: `http://localhost:3000`
  - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
- Add Gmail scope permission in the client if prompted.
- Set `TOKEN_ENCRYPTION_KEY` to a 32-byte base64 string (e.g., `openssl rand -base64 32`).

### 2b) Database (PostgreSQL)

Set `DATABASE_URL` to a PostgreSQL connection string, for example:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inboxiq?schema=public"
```

Run migrations:

```bash
npm run db:migrate
```

Enable pgvector (migration will attempt `CREATE EXTENSION IF NOT EXISTS "vector"`; if your DB user lacks permission, run it manually as a superuser first).

Seed default email tags:

```bash
npm run db:seed
```

### 3) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Routes

- Landing page: `/` (CTA: “Sign in with Google”)
- App area: `/app` (placeholder status)

Route groups live under `src/app/(auth)` and `src/app/(app)`.

## Scripts

- `npm run dev` – start dev server
- `npm run lint` – run ESLint
- `npm run format` – run Prettier
- `npm run db:migrate` – apply Prisma migrations
- `npm run db:seed` – seed default tags
- `npm run prisma:studio` – browse the database
- `npm run worker:indexer` – run the Gmail indexing worker

## Email + search schema

- EmailMessage/EmailTag/EmailMessageTag and Embedding (pgvector) are defined in `prisma/schema.prisma`.
- `searchVector` column (tsvector) exists on `EmailMessage` with a GIN index; populate it later via trigger or job (e.g., `to_tsvector('english', coalesce(subject,'') || ' ' || coalesce(cleanedText,''))`).

## Tasks & calendar (planned)

- Endpoint stubs are present:
  - `POST /api/todos/from-email` (returns 501)
  - `GET /api/todos` (empty list)
- UI stub at `/app/tasks` with a disabled “Generate tasks from selected emails” button.
- Planned architecture:
  - Use indexed emails as source, run an LLM pass to extract action items + due dates.
  - Persist tasks to a `TodoItem` table and link to source email IDs.
  - For calendar, push events to Google Calendar via OAuth scopes and store event IDs for updates.
  - Allow manual review/approval before syncing tasks/events.
