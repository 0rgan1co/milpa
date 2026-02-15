# Implementation Plan: Milpa - AI Discovery Platform

**Branch**: `001-ai-discovery-platform` | **Date**: 2026-02-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-discovery-platform/spec.md`

## Summary

Build a full-stack organizational discovery platform that enables consultants to
conduct AI-guided interviews with employees, extract narrative fragments, cluster
them semantically, and present actionable insights via interactive dashboards.
The stack centers on Next.js 16 with App Router (Server Components, Server Actions,
Route Handlers), Neon PostgreSQL for persistence, Firebase for authentication,
and Vercel AI SDK with Gemini/Claude for all AI operations. Client-side localStorage
provides offline caching and draft persistence for the RTI.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, Tailwind CSS 4, shadcn/ui,
Vercel AI SDK (`ai` + `@ai-sdk/google` + `@ai-sdk/anthropic`), Firebase Auth
(client + admin SDK), Neon Serverless Driver (`@neondatabase/serverless`),
Drizzle ORM, D3.js (semantic map), Zustand (RTI client state), Zod (validation)
**Storage**: Neon PostgreSQL (primary), localStorage (client-side caching/drafts),
pgvector extension (narrative embeddings)
**Testing**: Vitest (unit/component), Playwright (E2E)
**Target Platform**: Web (Vercel deployment), responsive desktop + mobile
**Project Type**: Web application (single Next.js project)
**Performance Goals**: <2s page loads, <5s AI responses, <60s narrative extraction,
<15s clustering for 500 narratives
**Constraints**: Neon free tier (0.5 GB storage, 100h compute), Firebase Spark plan,
Gemini API free tier (15 RPM / 1M TPM)
**Scale/Scope**: Up to 50 concurrent RTI sessions, 1,000 narratives per project,
10 projects per Admin

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                     | Status                   | Notes                                                                                                                       |
| ----------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| I. Modular Architecture       | PASS                     | Feature-based dirs under `src/`, server logic isolated in `src/server/`, shared code in `src/lib/` and `src/components/ui/` |
| II. Next.js 15 Best Practices | PASS                     | App Router, Server Components default, Server Actions for mutations, Route Handlers for AI streaming/webhooks only          |
| III. Type Safety              | PASS                     | TypeScript strict, Zod at all trust boundaries (forms, API, AI responses, URL params)                                       |
| IV. Code Clarity              | PASS                     | Descriptive naming, <30 line functions, named constants, early returns                                                      |
| V. Simplicity                 | PASS with justifications | See Complexity Tracking for localStorage, Zustand, and D3 justifications                                                    |

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-discovery-platform/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-spec.md      # REST API contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: authenticated pages
│   │   ├── layout.tsx            # Auth guard layout
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Project dashboard (FR-027..031)
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx          # Project list
│   │   │   ├── new/page.tsx      # Create project (FR-001, FR-002)
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Project detail
│   │   │       ├── settings/page.tsx
│   │   │       └── invitations/page.tsx  # FR-003..006
│   │   ├── interviews/
│   │   │   ├── page.tsx          # Interview list (FR-019)
│   │   │   └── [id]/page.tsx     # Interview detail/transcript
│   │   ├── narratives/
│   │   │   ├── page.tsx          # Narrative list (FR-014..020)
│   │   │   └── [id]/page.tsx     # Narrative editor
│   │   ├── clustering/
│   │   │   └── page.tsx          # Semantic map + clustering (FR-021..026)
│   │   └── settings/
│   │       └── page.tsx          # User settings, API keys
│   ├── (public)/                 # Route group: no auth required
│   │   └── interview/
│   │       └── [token]/
│   │           └── page.tsx      # Anonymous RTI interface (FR-007..013)
│   ├── (shared)/                 # Route group: shared read-only views
│   │   └── share/
│   │       └── [token]/
│   │           └── page.tsx      # Read-only dashboard (FR-032..033)
│   ├── api/                      # Route Handlers (streaming + webhooks only)
│   │   ├── ai/
│   │   │   ├── chat/route.ts     # RTI streaming endpoint
│   │   │   ├── extract/route.ts  # Narrative extraction
│   │   │   └── query/route.ts    # Analytic chat
│   │   ├── export/route.ts       # CSV/PDF export (FR-043)
│   │   └── webhooks/
│   │       └── route.ts          # External integrations
│   ├── layout.tsx                # Root layout
│   ├── global-error.tsx          # Global error boundary
│   └── page.tsx                  # Landing/redirect
├── server/                       # Server-side business logic
│   ├── db/
│   │   ├── index.ts              # Neon connection pool
│   │   ├── schema.ts             # Drizzle schema definitions
│   │   └── migrations/           # SQL migrations
│   ├── services/
│   │   ├── projects.ts           # Project CRUD
│   │   ├── invitations.ts        # Invitation management
│   │   ├── interviews.ts         # Interview persistence
│   │   ├── narratives.ts         # Narrative CRUD + batch ops
│   │   ├── clustering.ts         # Clustering logic
│   │   ├── export.ts             # CSV/PDF generation
│   │   └── share-links.ts       # Share link management
│   ├── ai/
│   │   ├── provider.ts           # AI provider abstraction (primary + fallback)
│   │   ├── interviewer.ts        # RTI prompt engineering
│   │   ├── extractor.ts          # Narrative extraction prompts
│   │   ├── anonymizer.ts         # NER-based anonymization
│   │   ├── embeddings.ts         # Embedding generation
│   │   └── cluster-namer.ts      # Cluster naming/summarization
│   ├── auth/
│   │   ├── firebase-admin.ts     # Firebase Admin SDK init
│   │   └── middleware.ts         # Auth verification
│   └── actions/                  # Server Actions
│       ├── project-actions.ts
│       ├── invitation-actions.ts
│       ├── interview-actions.ts
│       ├── narrative-actions.ts
│       └── clustering-actions.ts
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── features/
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── interview/            # RTI chat interface
│   │   ├── narratives/           # Narrative list/editor
│   │   ├── clustering/           # Semantic map + controls
│   │   └── projects/             # Project management
│   └── layout/                   # Shared layout components
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── theme-toggle.tsx
├── lib/
│   ├── types/                    # Shared TypeScript types
│   │   ├── project.ts
│   │   ├── interview.ts
│   │   ├── narrative.ts
│   │   ├── cluster.ts
│   │   └── user.ts
│   ├── validations/              # Zod schemas
│   │   ├── project.ts
│   │   ├── invitation.ts
│   │   └── narrative.ts
│   ├── constants/                # Named constants
│   │   ├── interview-themes.ts
│   │   └── defaults.ts
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-speech.ts         # Web Speech API wrapper
│   │   └── use-local-draft.ts    # localStorage draft persistence
│   └── utils/                    # Pure utility functions
│       ├── csv-parser.ts
│       └── token-generator.ts
└── store/                        # Zustand stores
    └── interview-store.ts        # RTI session state

tests/
├── unit/                         # Vitest unit tests
├── integration/                  # Service integration tests
└── e2e/                          # Playwright E2E tests
```

**Structure Decision**: Single Next.js web application with server-side logic
co-located in `src/server/` as requested. This aligns with Next.js conventions
(no separate backend server needed) while keeping business logic cleanly
separated from UI components. Route Handlers are used only for AI streaming
endpoints and export/webhook integrations; all other mutations use Server Actions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                              | Why Needed                                                                                                 | Simpler Alternative Rejected Because                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| localStorage (client-side persistence) | User-requested for RTI draft auto-save and offline caching of interview progress                           | Server-only persistence would lose in-progress data on connection drop; localStorage provides instant recovery        |
| Zustand (client state library)         | RTI chat requires complex real-time client state: message history, recording status, theme progress, timer | URL params cannot represent chat message arrays; Server Components cannot hold interactive chat state                 |
| D3.js (visualization library)          | Semantic map with force-directed graph, zoom/pan, interactive clustering                                   | No built-in Next.js or Web Platform API exists for force-directed graph rendering                                     |
| Drizzle ORM                            | Type-safe PostgreSQL queries with migration support for Neon                                               | Direct SQL strings lose type safety and migration tracking; Drizzle is lightweight (~10KB)                            |
| pgvector extension                     | Vector similarity search for narrative embeddings (FR-018, FR-021)                                         | Without vector DB, clustering requires loading all embeddings client-side; pgvector keeps it server-side and scalable |
