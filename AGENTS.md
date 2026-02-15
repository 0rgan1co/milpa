# Milpa Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-15

## Active Technologies

- Frontend: Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5, Tailwind CSS 4, shadcn/ui
- Data viz: D3.js for semantic maps (scatter plots, force-directed layouts, zoom/pan)
- Client state: Zustand for RTI interview session state
- Backend: Server Actions + Route Handlers (AI streaming only), Firebase Admin SDK (Auth)
- Database: Neon PostgreSQL (serverless) + pgvector extension + Drizzle ORM
- AI: Vercel AI SDK with Gemini 2.0 Flash (primary) + Claude 3.5 Sonnet (fallback)
- Infrastructure: Deploy on Vercel, Turbopack for dev builds

## Project Structure

```text
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: authenticated pages
│   │   ├── layout.tsx            # Auth guard layout
│   │   ├── dashboard/page.tsx    # Project dashboard (FR-027..031)
│   │   ├── projects/             # Project list + create + detail
│   │   ├── interviews/           # Interview list + detail
│   │   ├── narratives/           # Narrative list + editor
│   │   ├── clustering/page.tsx   # Semantic map + clustering (FR-021..026)
│   │   └── settings/page.tsx     # User settings
│   ├── (public)/interview/[token]/page.tsx  # Anonymous RTI (FR-007..013)
│   ├── (shared)/share/[token]/page.tsx      # Read-only dashboard (FR-032..033)
│   └── api/                      # Route Handlers (streaming + export only)
│       ├── ai/chat/route.ts      # RTI streaming
│       ├── ai/extract/route.ts   # Narrative extraction
│       ├── ai/query/route.ts     # Analytic chat
│       └── export/route.ts       # CSV/PDF export
├── server/                       # Server-side business logic
│   ├── db/schema.ts              # Drizzle schema (9 entities + pgvector)
│   ├── db/index.ts               # Neon connection pool
│   ├── services/                 # Business logic functions
│   ├── ai/provider.ts            # AI provider abstraction (primary + fallback)
│   ├── auth/firebase-admin.ts    # Firebase Admin SDK init
│   └── actions/                  # Server Actions
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── features/                 # Feature-specific components
│   └── layout/                   # Shared layout components
├── lib/
│   ├── types/                    # Shared TypeScript types
│   ├── validations/              # Zod schemas
│   ├── hooks/                    # Custom React hooks
│   └── utils/                    # Pure utility functions
└── store/interview-store.ts      # Zustand RTI session state

tests/
├── unit/                         # Vitest
├── integration/                  # Service tests
└── e2e/                          # Playwright
```

## Commands

- `npm run dev` – Start Next.js dev server (Turbopack)
- `npm test` – Run unit tests (Vitest)
- `npm run lint` – Lint TypeScript/ESLint
- `npm run build` – Production build
- `npm start` – Serve production build
- `npx drizzle-kit push` – Push schema changes to Neon (dev)
- `npx drizzle-kit generate` – Generate SQL migrations (prod)

_Spec-Kit/OpenCode commands:_

- `/speckit.specify` – Add or update feature specifications
- `/speckit.plan` – Generate/update technical plans from specs
- `/speckit.tasks` – Break plan into implementable tasks
- `/speckit.implement` – Apply tasks guided by plan

## Code Style

- TypeScript/React:
  - Functional components with hooks; no classes.
  - Server Components by default; `"use client"` only when local state/effects needed.
  - Props explicitly typed, avoid `any`.
  - Absolute imports from `@/` for `app`, `lib`, `components`, `server`, `store`.

- Next.js:
  - App Router (`app/`) with route groups for auth/public/shared.
  - Server Actions for mutations; Route Handlers only for streaming/export/webhooks.
  - Business logic in `server/`, UI in `components/`.
  - Error handling with `error.tsx` and `not-found.tsx` per route segment.

- Styling:
  - Tailwind CSS 4 as primary system.
  - shadcn/ui for inputs, tables, dialogs, and complex consistent components.

- Validation:
  - Zod at all trust boundaries (forms, API, AI responses, URL params).

- Tests:
  - Key components with minimal unit tests.
  - RTI and clustering flows with at least one E2E "happy path" and one network failure test.

## Recent Changes

1. **Phase 1 Plan Complete – 2026-02-15**
   - Generated research.md (technology decisions), data-model.md (Drizzle schema for 9 entities with pgvector), api-spec.md (Server Actions + Route Handlers mapped to 45 FRs), and quickstart.md.

2. **Spec + Clarifications Complete – 2026-02-15**
   - 251-line spec with 45 FRs, 9 entities, 12 success criteria, 6 user stories, 7 edge cases. 5 clarifications resolved.

3. **Constitution Ratified – 2026-02-14**
   - 5 core principles: Simplicity > Code Clarity > Modular Architecture > Next.js Best Practices > Type Safety.

<!-- MANUAL ADDITIONS START -->

<!-- MANUAL ADDITIONS END -->
