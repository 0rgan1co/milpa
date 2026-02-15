# Quickstart: Milpa - AI Discovery Platform

**Branch**: `001-ai-discovery-platform` | **Date**: 2026-02-15

---

## Prerequisites

- **Node.js** 20+ (`node -v`)
- **npm** 10+ (`npm -v`)
- **Git** (`git --version`)
- A **Neon** account (https://neon.tech) — free tier is sufficient
- A **Firebase** project (https://console.firebase.google.com) — Spark plan (free)
- A **Google AI** API key (https://aistudio.google.com/apikey) — for Gemini
- An **Anthropic** API key (https://console.anthropic.com) — for Claude fallback
- A **Resend** account (https://resend.com) — for transactional emails (free tier: 100/day)

---

## 1. Clone & Install

```bash
git clone <repo-url> milpa
cd milpa
git checkout 001-ai-discovery-platform
npm install
```

---

## 2. Neon Database Setup

1. Log in to [Neon Console](https://console.neon.tech).
2. Create a new project named `milpa` (or use an existing one).
3. In the project dashboard, copy the **connection string** (starts with `postgresql://...`).
4. Enable the pgvector extension:
   - Go to **SQL Editor** in the Neon console.
   - Run:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
5. Note the connection string — you'll use it as `DATABASE_URL`.

---

## 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com).
2. Create a new project named `milpa` (disable Google Analytics if not needed).
3. **Enable Email/Password authentication**:
   - Go to **Authentication** > **Sign-in method**.
   - Enable **Email/Password**.
4. **Get client-side config**:
   - Go to **Project Settings** > **General** > **Your apps**.
   - Click **Add app** > **Web** (`</>`).
   - Register the app, then copy the `firebaseConfig` values:
     - `apiKey`
     - `authDomain`
     - `projectId`
5. **Generate service account key** (for server-side token verification):
   - Go to **Project Settings** > **Service Accounts**.
   - Click **Generate new private key**.
   - Download the JSON file.
   - Stringify the JSON contents (you'll use it as `FIREBASE_SERVICE_ACCOUNT`).

---

## 4. Environment Variables

Create `.env.local` at the project root:

```bash
cp .env.example .env.local  # If .env.example exists, otherwise create manually
```

Fill in the following values:

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/milpa?sslmode=require
NEON_API_KEY=                            # Neon API key (for programmatic project management, optional)

# Firebase (client-side — prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=milpa-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=milpa-xxxxx

# Firebase (server-side — NOT prefixed)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"milpa-xxxxx",...}

# AI Providers
GOOGLE_GENERATIVE_AI_API_KEY=AIza...     # Gemini (primary)
ANTHROPIC_API_KEY=sk-ant-...             # Claude (fallback)

# Email
RESEND_API_KEY=re_...                    # Resend transactional email

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Base URL (update for production)
```

**Security**: `.env.local` is already in `.gitignore`. Never commit secrets.

---

## 5. Database Migrations

Once dependencies are installed and `DATABASE_URL` is set:

```bash
# Push schema to Neon (development mode — applies changes directly)
npx drizzle-kit push

# Or generate + apply migration files (production mode)
npx drizzle-kit generate
npx drizzle-kit migrate
```

Create the HNSW vector index (run manually in Neon SQL Editor or via migration):

```sql
CREATE INDEX IF NOT EXISTS narrative_embedding_hnsw_idx
  ON narratives
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

---

## 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The dev server uses Turbopack for fast refresh.

---

## 7. Build & Production

```bash
# Type check + build
npm run build

# Start production server
npm start
```

---

## 8. Linting

```bash
npm run lint
```

---

## 9. Key Dependencies (to be installed)

The following packages need to be installed during implementation:

```bash
# Database
npm install @neondatabase/serverless drizzle-orm
npm install -D drizzle-kit

# Authentication
npm install firebase firebase-admin

# AI
npm install ai @ai-sdk/google @ai-sdk/anthropic

# Validation
npm install zod

# UI Components
npx shadcn@latest init
# Then install individual components as needed:
# npx shadcn@latest add button card dialog input ...

# Visualization
npm install d3
npm install -D @types/d3

# State Management
npm install zustand

# Clustering & Dimensionality Reduction
npm install umap-js

# CSV Parsing (for invitation upload)
npm install papaparse
npm install -D @types/papaparse

# PDF Generation
npm install @react-pdf/renderer

# Email
npm install resend

# Testing
npm install -D vitest @testing-library/react playwright @playwright/test
```

---

## 10. Project Structure

```
src/
├── app/                  # Next.js App Router (pages + API routes)
├── server/               # Server-side business logic
│   ├── db/               # Drizzle schema + Neon connection
│   ├── services/         # Business logic functions
│   ├── ai/               # AI provider abstraction + prompts
│   ├── auth/             # Firebase Admin SDK + middleware
│   └── actions/          # Server Actions
├── components/           # React components (ui/ + features/)
├── lib/                  # Shared types, validations, hooks, utils
└── store/                # Zustand stores

tests/
├── unit/                 # Vitest
├── integration/          # Service tests
└── e2e/                  # Playwright
```

See `plan.md` for the detailed file-by-file structure.

---

## Troubleshooting

| Issue                          | Solution                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `Cannot connect to Neon`       | Check `DATABASE_URL` includes `?sslmode=require`. Verify IP allow-list in Neon console.              |
| `Firebase Admin init failed`   | Ensure `FIREBASE_SERVICE_ACCOUNT` is a valid JSON string (not a file path). Escape quotes if needed. |
| `pgvector extension not found` | Run `CREATE EXTENSION IF NOT EXISTS vector;` in Neon SQL Editor.                                     |
| `Build fails with type errors` | Run `npx tsc --noEmit` to see all type errors. Fix before building.                                  |
| `Gemini 429 rate limit`        | Free tier is 15 RPM. Reduce concurrent AI operations or add delays between requests.                 |
