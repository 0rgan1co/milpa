# Tasks: Milpa - AI Discovery Platform

**Input**: Design documents from `/specs/001-ai-discovery-platform/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are absolute or relative to repository root as specified.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize shadcn/ui and base styles in `tailwind.config.ts` and `src/app/globals.css`
- [x] T002 [P] Install core dependencies (drizzle-orm, @neondatabase/serverless, firebase, firebase-admin, ai, @ai-sdk/google, @ai-sdk/anthropic, zod, zustand, d3, umap-js, papaparse, @react-pdf/renderer, resend)
- [x] T003 [P] Configure Vitest and Playwright in `vitest.config.ts` and `playwright.config.ts`
- [x] T004 Define shared Zod schemas in `src/lib/validations/` for all entities

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Setup Neon PostgreSQL connection and Drizzle client in `src/server/db/index.ts`
- [x] T006 Define Drizzle schema with enums, tables, and relations in `src/server/db/schema.ts`
- [x] T007 [P] Create custom pgvector type and HNSW index migration in `src/server/db/schema.ts`
- [x] T008 [P] Initialize Firebase Client SDK in `src/lib/firebase.ts` and Admin SDK in `src/server/auth/firebase-admin.ts`
- [x] T009 Implement authentication middleware and session cookie handling in `src/server/auth/middleware.ts`
- [x] T010 [P] Create AI provider abstraction with primary/fallback logic in `src/server/ai/provider.ts`
- [x] T011 Create shared TypeScript types in `src/lib/types/` (project.ts, interview.ts, narrative.ts, etc.)
- [x] T012 [P] Setup base layout with Sidebar and Header in `src/components/layout/`
- [x] T012b [P] Implement `ThemeToggle` component in `src/components/layout/theme-toggle.tsx` using `next-themes`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Admin Creates a Project (Priority: P1) 🎯 MVP

**Goal**: Authenticated Admin can create a project, define categories, and invite employees via email/CSV.

**Independent Test**: Create a project manually, upload a CSV of 5 emails, and verify 5 invitation records with unique tokens are created in the DB.

- [x] T013 [US1] Implement project CRUD service functions in `src/server/services/projects.ts`
- [x] T014 [US1] Implement invitation management service in `src/server/services/invitations.ts`
- [x] T015 [P] [US1] Create project actions (create, update, delete) in `src/server/actions/project-actions.ts`
- [x] T016 [P] [US1] Create invitation actions (create, bulkCreate, sendEmail) in `src/server/actions/invitation-actions.ts`
- [x] T017 [US1] Build project creation form component in `src/components/features/projects/ProjectForm.tsx`
- [x] T018 [US1] Build CSV upload and invitation list in `src/app/(auth)/projects/[id]/invitations/page.tsx`
- [x] T019 [P] [US1] Integrate Resend for invitation emails in `src/server/services/invitations.ts`
- [x] T019b [US1] Build collaborator management UI in `src/app/(auth)/projects/[id]/settings/page.tsx`

**Checkpoint**: Admin can now distribute RTI links to employees.

---

## Phase 4: User Story 2 - Employee AI Interview (Priority: P1) 🎯 MVP

**Goal**: Anonymous employee can complete a conversational AI interview with voice/text and auto-save.

**Independent Test**: Open an anonymous link, type/speak responses to 5+ questions, refresh page, and verify conversation resumes from the last point.

- [x] T020 [US2] Setup Zustand store for RTI session state in `src/store/interview-store.ts`
- [x] T021 [US2] Implement interview persistence service in `src/server/services/interviews.ts`
- [x] T022 [US2] Create RTI streaming Route Handler in `src/app/api/ai/chat/route.ts`
- [x] T023 [US2] Design RTI system prompt and interview guide in `src/server/ai/interviewer.ts`
- [x] T024 [US2] Build RTI chat interface component in `src/components/features/interview/ChatInterface.tsx`
- [x] T025 [P] [US2] Implement Web Speech API wrapper hook in `src/lib/hooks/use-speech.ts`
- [x] T026 [P] [US2] Implement localStorage auto-save hook in `src/lib/hooks/use-local-draft.ts`
- [x] T027 [US2] Create anonymous interview page in `src/app/(public)/interview/[token]/page.tsx`

**Checkpoint**: Data collection (interviews) is now functional.

---

## Phase 5: User Story 3 - Narrative Extraction (Priority: P2)

**Goal**: Extract scored, anonymized narrative fragments from completed interview transcripts.

**Independent Test**: Trigger extraction on a completed interview and verify 10-30 narrative records are created with sentiment/abstraction scores and vector embeddings.

- [x] T028 [US3] Implement narrative CRUD and batch service in `src/server/services/narratives.ts`
- [x] T029 [US3] Design extraction and anonymization prompt logic in `src/server/ai/extractor.ts` and `src/server/ai/anonymizer.ts`
- [x] T030 [US3] Implement embedding generation service in `src/server/ai/embeddings.ts`
- [x] T031 [US3] Create narrative extraction Route Handler in `src/app/api/ai/extract/route.ts`
- [x] T032 [P] [US3] Create narrative actions (update, addTag, reAnonymize) in `src/server/actions/narrative-actions.ts`
- [x] T033 [US3] Build narrative list and editor UI in `src/app/(auth)/narratives/page.tsx`

**Checkpoint**: Atomic data for analysis (narratives) is now available.

---

## Phase 6: User Story 4 - Semantic Clustering (Priority: P2)

**Goal**: Group narratives into clusters using UMAP + HDBSCAN and visualize on a 2D map.

**Independent Test**: Run clustering with 50+ narratives and verify the semantic map renders color-coded clusters with AI-generated names.

- [x] T034a [US4] Implement UMAP dimensionality reduction service in `src/server/services/clustering/umap.ts`
- [x] T034b [US4] Implement HDBSCAN/DBSCAN density clustering logic in `src/server/services/clustering/dbscan.ts`
- [x] T034c [US4] Implement cluster metrics and centroid calculation in `src/server/services/clustering/metrics.ts`
- [x] T035 [US4] Design cluster naming and summarization AI logic in `src/server/ai/cluster-namer.ts`
- [x] T036 [US4] Create clustering actions (run, getRun, getDetail) in `src/server/actions/clustering-actions.ts`
- [x] T037 [US4] Build D3.js Semantic Map component in `src/components/features/clustering/SemanticMap.tsx`
- [x] T038 [US4] Build clustering controls and results UI in `src/app/(auth)/clustering/page.tsx`

**Checkpoint**: Qualitative analysis (clustering) is now functional.

---

## Phase 7: User Story 5 - Analytics Dashboard (Priority: P3)

**Goal**: Aggregate project data into a dashboard with metrics, heatmap, and analytic chat.

**Independent Test**: Filter dashboard by "Department" and verify metrics, map, and analytic chat responses update to reflect the subset.

- [x] T039 [US5] Implement dashboard metrics service in `src/server/services/dashboard.ts`
- [x] T040 [US5] Create analytic chat Route Handler in `src/app/api/ai/query/route.ts`
- [x] T041 [US5] Build sentiment heatmap component in `src/components/features/dashboard/SentimentHeatmap.tsx`
- [x] T042 [US5] Build project dashboard page in `src/app/(auth)/dashboard/page.tsx`
- [x] T043 [P] [US5] Implement CSV/PDF export Route Handler in `src/app/api/export/route.ts`

---

## Phase 8: User Story 6 - Shared Read-Only Views (Priority: P3)

**Goal**: Generate share links for stakeholders to view dashboards without an account.

**Independent Test**: Generate a share link, open in incognito, and verify access to the dashboard (read-only) without a login prompt.

- [x] T044 [US6] Implement share link management service in `src/server/services/share-links.ts`
- [x] T045 [US6] Create share link actions in `src/server/actions/project-actions.ts`
- [x] T046 [US6] Build public share layout and page in `src/app/(shared)/share/[token]/page.tsx`

---

## Phase N: Polish & Cross-Cutting Concerns

- [x] T047 Implement global error handling and loading states in `src/app/`
- [x] T048 [P] Add accessibility (Aria labels, keyboard nav) to complex D3 and Chat components
- [x] T049 [P] Finalize Spanish/English localization for all UI text and AI prompts
- [x] T050 Run full E2E test suite and validate against `quickstart.md`

---

## Dependencies & Execution Order

1. **Phase 1 & 2**: Parallel setup, then sequential DB/Auth foundation. (BLOCKS ALL)
2. **Phase 3 (US1)**: Foundation ready → Project Management.
3. **Phase 4 (US2)**: Depends on US1 (need project/tokens) → Interviewer.
4. **Phase 5 (US3)**: Depends on US2 (need transcripts) → Narrative Extraction.
5. **Phase 6 (US4)**: Depends on US5 (need embeddings) → Clustering.
6. **Phase 7 (US5)**: Depends on US4 (need clusters) → Dashboard.
7. **Phase 8 (US6)**: Depends on US7 → Shared access.

### Parallel Opportunities

- T010 (AI Provider) can be done while T005-T007 (DB) are in progress.
- T012 (Layout) can be done by a frontend developer during foundation.
- Once Phase 2 is done, US1 and RTI structure (Phase 3 & 4) can start simultaneously.
- UI components (shadcn/ui) can be added as needed by each task.
