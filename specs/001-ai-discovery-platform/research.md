# Research: Milpa - AI Discovery Platform

**Branch**: `001-ai-discovery-platform` | **Date**: 2026-02-15  
**Phase**: 0 (Outline & Research) | **Status**: Complete

---

## 1. Database & Persistence

### 1.1 Primary Database: Neon PostgreSQL

- **Decision**: Neon PostgreSQL (serverless)
- **Rationale**: User-specified. Neon provides serverless Postgres with automatic
  scaling, branching for dev/preview environments, and a generous free tier
  (0.5 GB storage, 100h compute/month). The `@neondatabase/serverless` driver
  supports HTTP and WebSocket connections, making it ideal for serverless
  environments (Vercel Edge, Lambda). Full Postgres compatibility means we get
  JSONB for flexible transcript storage, robust indexing, and the pgvector
  extension for embeddings — all in one database.
- **Alternatives considered**:
  - **Supabase**: Also serverless Postgres with built-in auth, but the user
    specified Firebase for auth and Neon for DB. Supabase would introduce
    redundant auth and tighter coupling.
  - **PlanetScale (MySQL)**: No native vector extension support. Would require
    a separate vector DB (Pinecone, Weaviate) for embeddings, adding operational
    complexity.
  - **SQLite (Turso)**: Lightweight but lacks native vector search and
    concurrent write support needed for 50 simultaneous RTI sessions.
  - **MongoDB Atlas**: Document model is tempting for transcript storage, but
    relational queries (joins across projects, narratives, clusters) are a core
    need. Postgres JSONB gives us the best of both worlds.

### 1.2 Vector Extension: pgvector

- **Decision**: pgvector extension (Neon-native)
- **Rationale**: Neon includes pgvector as a first-class extension — no
  additional service to manage. Supports `vector` column type, cosine
  similarity (`<=>` operator), L2 distance, and inner product. IVFFlat and
  HNSW indexes provide fast approximate nearest neighbor search. For our scale
  (up to 1,000 narratives per project × ~1536-dim embeddings), pgvector handles
  queries well under 100ms. Keeps embeddings co-located with the data they
  describe, enabling single-query joins (e.g., "find similar narratives in
  department X").
- **Alternatives considered**:
  - **Pinecone**: Purpose-built vector DB with excellent performance at scale,
    but adds a separate service dependency, separate billing, and data sync
    complexity. Overkill for our scale.
  - **Weaviate / Qdrant / Milvus**: Same concerns as Pinecone — separate
    infrastructure for a feature that pgvector handles natively within our
    existing database.
  - **In-memory (JavaScript arrays)**: Loading all embeddings client-side for
    similarity search fails at scale and leaks data. Server-side pgvector is
    both performant and secure.
- **Implementation notes**:
  - Enable extension: `CREATE EXTENSION IF NOT EXISTS vector;`
  - Column type: `vector(1536)` for OpenAI-compatible embeddings or
    `vector(768)` for Gemini text-embedding-004 (768 dimensions).
  - Index: Use HNSW index (`CREATE INDEX ... USING hnsw ... WITH (m=16, ef_construction=64)`)
    for better recall at our scale vs IVFFlat.
  - Gemini `text-embedding-004` produces 768-dimension vectors. We will use
    768 dimensions.

### 1.3 ORM: Drizzle

- **Decision**: Drizzle ORM
- **Rationale**: Lightweight (~10KB), type-safe ORM that generates SQL at build
  time rather than runtime. Drizzle's schema-as-code approach produces
  TypeScript types directly from table definitions, eliminating type drift.
  Built-in migration tooling (`drizzle-kit`) generates SQL migrations from
  schema changes. First-class support for Neon via `drizzle-orm/neon-serverless`.
  Supports pgvector through `drizzle-orm/pg-core` custom column types.
- **Alternatives considered**:
  - **Prisma**: More mature ecosystem but heavier runtime (Rust query engine
    binary), slower cold starts in serverless, and pgvector support requires
    raw queries or community extensions. Prisma's schema file (`.prisma`) is a
    separate DSL rather than TypeScript, adding cognitive overhead.
  - **Kysely**: Excellent type-safe query builder but lacks built-in migration
    tooling and requires more boilerplate for common CRUD patterns.
  - **Raw SQL (`@neondatabase/serverless`)**: Maximum control but zero type
    safety, no migration tracking, and verbose for CRUD operations.
- **Implementation notes**:
  - Use `drizzle-orm/neon-serverless` adapter.
  - Define custom pgvector column type:
    ```ts
    import { customType } from "drizzle-orm/pg-core";
    const vector = customType<{ data: number[]; dpiverName: string }>({
      dataType: () => "vector(768)",
      toDriver: (value: number[]) => `[${value.join(",")}]`,
      fromDriver: (value: string) => JSON.parse(value) as number[],
    });
    ```
  - Schema file: `src/server/db/schema.ts`
  - Migrations dir: `src/server/db/migrations/`

### 1.4 Client-Side Persistence: localStorage

- **Decision**: Browser localStorage API
- **Rationale**: User-specified. Provides instant, zero-latency persistence for
  RTI interview drafts (auto-save every exchange). If the browser crashes or
  loses connection mid-interview, the draft is recoverable without a server
  round-trip. Also used for caching user preferences (theme, locale). No
  additional dependencies required — built into the Web Platform.
- **Alternatives considered**:
  - **IndexedDB**: More powerful (structured data, larger storage limits, async
    API) but adds complexity for simple key-value draft storage. Could be
    adopted later if draft data grows beyond localStorage's ~5MB limit.
  - **SessionStorage**: Lost when the tab closes — unsuitable for crash
    recovery across sessions.
  - **Cookies**: Size-limited (4KB), sent with every request, not designed for
    application state.
- **Implementation notes**:
  - Key pattern: `milpa:interview:{token}:draft` for RTI drafts.
  - Key pattern: `milpa:preferences` for theme/locale.
  - Sync to server on each exchange (localStorage is the fallback, not the
    source of truth).
  - Clear draft on successful interview completion.

---

## 2. Authentication

### 2.1 Firebase Authentication

- **Decision**: Firebase Auth (client SDK + Admin SDK)
- **Rationale**: User-specified. Firebase Auth provides email/password
  authentication, Google OAuth, and token-based session management with minimal
  backend code. The client SDK handles the UI flow (sign-in, sign-up, password
  reset). The Admin SDK (`firebase-admin`) verifies ID tokens server-side in
  Next.js middleware and Server Actions. Firebase's free Spark plan supports
  unlimited authentication users — no cost concern for MVP.
- **Alternatives considered**:
  - **NextAuth.js (Auth.js)**: Full-featured auth for Next.js, but adds a
    session management layer we don't need if Firebase handles tokens. Also
    requires database adapter configuration.
  - **Clerk**: Excellent DX with pre-built UI components, but paid beyond free
    tier limits and introduces vendor lock-in for a feature Firebase already
    covers.
  - **Supabase Auth**: Would pair well with Supabase DB but we're using Neon.
    Using Supabase just for auth is unusual and adds an unnecessary dependency.
  - **Custom JWT**: Maximum control but requires implementing token rotation,
    refresh logic, password hashing, and email verification from scratch.
- **Implementation notes**:
  - Client SDK: `firebase` package, initialized in `src/lib/firebase.ts`
    (client-side only).
  - Admin SDK: `firebase-admin` package, initialized in
    `src/server/auth/firebase-admin.ts` (server-side only). Service account
    credentials stored as `FIREBASE_SERVICE_ACCOUNT` env var (JSON string).
  - Auth flow:
    1. Client signs in via Firebase SDK → gets ID token.
    2. ID token sent as `Authorization: Bearer <token>` header or in a
       secure cookie.
    3. Next.js middleware (`src/server/auth/middleware.ts`) verifies the token
       via Admin SDK on every `(auth)/` route.
    4. Server Actions extract the verified user from the request context.
  - Anonymous interview access (FR-007): No Firebase auth required. The
    interview token in the URL is the sole credential. Validated server-side
    against the `invitations` table.
  - Viewer access (FR-033): ShareLink token in URL, validated server-side.
    No Firebase account needed.
  - Required env vars:
    - `NEXT_PUBLIC_FIREBASE_API_KEY`
    - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    - `FIREBASE_SERVICE_ACCOUNT` (server-only, JSON string)

---

## 3. AI & Machine Learning

### 3.1 AI SDK: Vercel AI SDK

- **Decision**: Vercel AI SDK (`ai` + `@ai-sdk/google` + `@ai-sdk/anthropic`)
- **Rationale**: User-specified. The Vercel AI SDK provides a unified interface
  for multiple AI providers with built-in streaming support (`streamText`,
  `streamObject`), structured output via Zod schemas (`generateObject`), and
  React hooks (`useChat`, `useCompletion`) for the RTI chat UI. Provider
  abstraction makes the primary/fallback pattern (FR-045) straightforward —
  swap the provider parameter without changing any business logic.
- **Alternatives considered**:
  - **LangChain.js**: More powerful for complex chains and agent workflows, but
    heavier, more opinionated, and adds abstraction layers we don't need. Our
    AI operations are mostly single-turn or streaming chat — the Vercel AI SDK
    handles these natively.
  - **Direct API calls (fetch)**: Maximum control, but loses streaming
    abstractions, React hooks, structured output parsing, and provider
    abstraction. Significantly more boilerplate.
  - **LlamaIndex.ts**: Focused on RAG pipelines. Overkill for our use case
    where we control the full data pipeline (extraction → embedding → storage).
- **Implementation notes**:
  - Primary provider: `@ai-sdk/google` (Gemini)
  - Fallback provider: `@ai-sdk/anthropic` (Claude)
  - Provider abstraction in `src/server/ai/provider.ts`:

    ```ts
    import { google } from "@ai-sdk/google";
    import { anthropic } from "@ai-sdk/anthropic";

    export function getModel(operation: "chat" | "extract" | "embed") {
      // Primary: Gemini
      // Fallback: Claude (switched on 3 consecutive failures)
    }
    ```

  - RTI streaming: Route Handler (`POST /api/ai/chat/route.ts`) using
    `streamText()` with `useChat()` hook on the client.
  - Structured extraction: `generateObject()` with Zod schema for narrative
    fragments (sentiment, abstraction, text).
  - Env vars:
    - `GOOGLE_GENERATIVE_AI_API_KEY` (Gemini)
    - `ANTHROPIC_API_KEY` (Claude)

### 3.2 Primary AI Provider: Google Gemini

- **Decision**: Gemini 2.0 Flash (primary for chat, extraction, analytics) +
  Gemini text-embedding-004 (embeddings)
- **Rationale**: User-specified as primary. Gemini 2.0 Flash offers a generous
  free tier (15 RPM / 1M TPM), fast response times (~1-3s), strong
  multilingual support (critical for Spanish-primary platform), and 1M token
  context window for processing long interview transcripts. The
  `text-embedding-004` model produces 768-dimension embeddings with strong
  semantic quality for clustering.
- **Alternatives considered**:
  - **GPT-4o (OpenAI)**: Excellent quality but more expensive, no free tier,
    and requires a separate embedding model. Would be a valid primary if cost
    were not a constraint.
  - **Claude 3.5 Sonnet**: Strong analytical capabilities but designated as
    fallback per user specification.
  - **Llama 3 (self-hosted)**: No hosting cost for inference, but requires GPU
    infrastructure, adds operational complexity, and latency would exceed the
    5-second target for RTI responses.
- **Implementation notes**:
  - Chat model: `gemini-2.0-flash` via `google('gemini-2.0-flash')`
  - Embedding model: `text-embedding-004` via `google.textEmbeddingModel('text-embedding-004')`
  - Embedding dimensions: 768
  - Rate limiting: Implement client-side token bucket (15 RPM) with queue for
    burst operations (batch extraction). Back off exponentially on 429 errors.
  - Free tier constraint: Batch extraction of 10 interviews (~300 narratives)
    may approach token limits. Implement a sequential processing queue with
    progress tracking rather than parallel extraction.

### 3.3 Fallback AI Provider: Anthropic Claude

- **Decision**: Claude 3.5 Sonnet (fallback for all AI operations)
- **Rationale**: User-specified as fallback. Claude excels at structured
  extraction and analytical reasoning — strong fallback for narrative
  extraction and cluster naming. The Vercel AI SDK makes swapping trivial
  (change the model parameter). Claude's 200K context window handles long
  transcripts well.
- **Alternatives considered**:
  - **GPT-4o**: Also viable as fallback, but Claude's structured output quality
    is comparable or better for our extraction use case.
  - **Gemini Pro**: Using a different Gemini model as "fallback" doesn't protect
    against Google API outages, which is the primary failure scenario.
- **Implementation notes**:
  - Model: `claude-sonnet-4-20250514` via `anthropic('claude-sonnet-4-20250514')`
  - Fallback trigger: 3 consecutive failures from primary with exponential
    backoff (1s, 2s, 4s). After switching to fallback, attempt primary again
    after 5 minutes.
  - Embedding fallback: If Gemini embedding API fails, fall back to generating
    embeddings via Claude's text output (less efficient but functional). In
    practice, embedding API outages are rare.
  - Env var: `ANTHROPIC_API_KEY`

### 3.4 Dimensionality Reduction: UMAP

- **Decision**: UMAP (Uniform Manifold Approximation and Projection) via
  `umap-js` npm package
- **Rationale**: UMAP preserves both local and global structure of
  high-dimensional data better than t-SNE, runs faster (O(n log n) vs O(n²)),
  and produces more stable, reproducible layouts. For the 2D semantic map
  (FR-021), UMAP's preservation of global relationships between clusters is
  critical — consultants need to see which themes are related vs. distant.
  The `umap-js` package is a pure JavaScript implementation (~15KB) that runs
  server-side in Node.js.
- **Alternatives considered**:
  - **t-SNE (`tsne-js`)**: Well-established for visualization but O(n²)
    complexity, poor global structure preservation, and non-deterministic
    results make it unsuitable for consistent semantic maps. At 500+
    narratives, t-SNE becomes noticeably slower than the 15-second target.
  - **PCA**: Fast and deterministic but only captures linear relationships.
    Semantic similarity in embedding space is inherently non-linear; PCA
    would produce misleading layouts.
  - **Trimap**: Newer alternative with good global structure, but limited
    JavaScript ecosystem support. Would require a Python microservice.
- **Implementation notes**:
  - Run server-side in Route Handler or Server Action (not client-side — avoids
    sending all embeddings to the browser).
  - Parameters exposed to user (FR-022): `n_neighbors` (default 15),
    `min_dist` (default 0.1).
  - Output: 2D coordinates `[x, y]` per narrative, stored in the database
    alongside the clustering run.
  - Cache UMAP results per parameter set to avoid re-computation on page reload.

### 3.5 Clustering Algorithm: HDBSCAN

- **Decision**: HDBSCAN (Hierarchical Density-Based Spatial Clustering of
  Applications with Noise) — custom implementation or `density-clustering` npm
  package with DBSCAN + hierarchical extension
- **Rationale**: HDBSCAN automatically determines the number of clusters (no
  need to pre-specify k as with K-means), handles noise points (narratives that
  don't fit any cluster), and works well with UMAP-reduced data. This matches
  the spec's requirement for adjustable parameters (FR-022) without forcing the
  user to guess cluster count.
- **Alternatives considered**:
  - **K-means**: Requires pre-specifying k (number of clusters), which the
    user shouldn't need to know. Assumes spherical clusters, which semantic
    embeddings rarely form.
  - **DBSCAN**: Simpler but requires a fixed epsilon (distance threshold) and
    doesn't handle varying-density clusters well. HDBSCAN is its hierarchical
    extension that adapts to density.
  - **Agglomerative clustering**: Produces a dendrogram, which is useful but
    harder to visualize on a 2D map. Could be offered as a secondary view
    later.
  - **Gaussian Mixture Models**: Assume Gaussian-distributed clusters, which is
    rarely true for semantic embeddings.
- **Implementation notes**:
  - The JavaScript ecosystem lacks a mature HDBSCAN library. Two approaches:
    1. **Preferred**: Implement a simplified HDBSCAN in TypeScript (~200 lines)
       operating on the 2D UMAP coordinates (not the full 768-dim embeddings).
       This is tractable because UMAP has already reduced the dimensionality.
    2. **Fallback**: Use `density-clustering` npm package (DBSCAN) with
       user-adjustable epsilon derived from the similarity threshold parameter.
  - Parameters mapped from spec:
    - `min_cluster_size` → HDBSCAN min_cluster_size (default 5)
    - `threshold` → similarity threshold for merging (default 0.2)
  - Noise handling: Narratives not assigned to any cluster are labeled
    "Unclustered" and shown in gray on the semantic map.

---

## 4. Frontend

### 4.1 Framework: Next.js 16

- **Decision**: Next.js 16.1.6 (already installed)
- **Rationale**: User-specified. Next.js with App Router provides Server
  Components (default), Server Actions (mutations), Route Handlers (streaming),
  and file-based routing — all core requirements. The project was initialized
  with `create-next-app` and produces a working build. While the constitution
  references "Next.js 15 Best Practices", the actual installed version is
  16.1.6; the same conventions apply as 16 is backwards-compatible with 15
  patterns.
- **Alternatives considered**: None — user-specified and already initialized.
- **Implementation notes**:
  - Turbopack enabled for development builds.
  - React 19.2.3 with Server Components as default rendering strategy.
  - App Router structure defined in plan.md Project Structure section.

### 4.2 UI Components: shadcn/ui

- **Decision**: shadcn/ui (copy-paste component library built on Radix UI +
  Tailwind CSS)
- **Rationale**: shadcn/ui provides accessible, well-designed components
  (Dialog, Select, Slider, Tabs, DataTable, etc.) that are copied into the
  project rather than installed as a dependency. This means full ownership and
  customizability — no version-lock or breaking changes from upstream. Built on
  Radix UI primitives, ensuring keyboard navigation and screen reader support
  (FR-042). Pairs natively with Tailwind CSS 4.
- **Alternatives considered**:
  - **Material UI (MUI)**: Comprehensive but heavy (~300KB), opinionated
    styling (Material Design), and harder to customize for a non-Google design
    language.
  - **Chakra UI**: Good DX and accessibility, but runtime CSS-in-JS conflicts
    with Server Components (requires `'use client'` everywhere).
  - **Headless UI**: Accessible primitives but fewer pre-built components than
    shadcn/ui. Would require more custom styling.
  - **Ant Design**: Enterprise-focused but very opinionated, large bundle, and
    Chinese documentation focus.
- **Implementation notes**:
  - Initialize with `npx shadcn@latest init`
  - Components installed to `src/components/ui/`
  - Key components needed: Button, Card, Dialog, Input, Select, Slider, Tabs,
    Table, Toast, Form, Badge, Avatar, DropdownMenu, Sheet (mobile nav),
    Tooltip, Skeleton (loading states)
  - Theme configuration in `tailwind.config.ts` with CSS custom properties for
    dark/light mode (FR-040)

### 4.3 Visualization: D3.js

- **Decision**: D3.js (Data-Driven Documents)
- **Rationale**: The semantic map (FR-021, FR-028) requires force-directed graph
  layout, zoom/pan, click-to-detail, and dynamic re-rendering on parameter
  changes. D3.js is the de facto standard for custom data visualization in the
  browser, with proven performance for rendering 500-1000 nodes with
  interactions. No other library provides the same level of control over SVG
  rendering, force simulations, and animated transitions.
- **Alternatives considered**:
  - **Chart.js / Recharts**: Good for standard charts (bar, line, pie) but
    cannot render interactive scatter plots with force-directed positioning,
    custom zoom behaviors, and click interactions on individual nodes.
  - **Vis.js / Sigma.js**: Network visualization focused. Better for
    graph/network diagrams but not optimized for scatter-plot-style semantic
    maps.
  - **Plotly.js**: Can render scatter plots with hover, but lacks the
    fine-grained control needed for custom cluster styling, force-directed
    positioning, and semantic map interactions.
  - **Three.js / deck.gl**: 3D rendering is overkill. The spec calls for a 2D
    map. WebGL adds complexity without benefit at our scale.
  - **Observable Plot**: Simpler D3 wrapper, but sacrifices the low-level
    control we need for interactive semantic maps.
- **Implementation notes**:
  - Wrap D3 in a React component (`SemanticMap.tsx`) using a ref-based pattern
    (D3 manages the SVG, React manages the container).
  - Must be a Client Component (`'use client'`) — D3 requires DOM access.
  - Use `d3-force` for force-directed layout of cluster centers.
  - Use `d3-zoom` for pan/zoom behavior.
  - Use `d3-scale` for color mapping (cluster assignment → color, sentiment →
    red/green gradient).
  - Performance: Use canvas rendering (`d3-canvas`) if SVG performance degrades
    beyond 500 nodes. Start with SVG for simplicity.
  - Package: `d3` (full) or selective imports (`d3-force`, `d3-zoom`,
    `d3-scale`, `d3-selection`, `d3-color`). Prefer selective imports to
    minimize bundle size.

### 4.4 Client State Management: Zustand

- **Decision**: Zustand
- **Rationale**: The RTI chat interface requires complex client-side state:
  message history, recording status (voice input), current interview theme,
  timer, auto-save status, and connection state. This state is interactive,
  ephemeral, and tightly coupled to the chat UI — it cannot be represented in
  URL params or Server Components. Zustand is minimal (~1KB), has no
  boilerplate (no providers, no reducers), and supports middleware for
  localStorage persistence.
- **Alternatives considered**:
  - **React Context + useReducer**: Built-in but causes unnecessary re-renders
    of the entire component tree when any state value changes. For a chat UI
    with real-time updates, this is a performance concern.
  - **Jotai**: Atomic state model is elegant but adds conceptual overhead
    (atoms, derived atoms) for what is ultimately a single feature's state.
  - **Redux Toolkit**: Battle-tested but extreme overkill for a single
    feature's client state. Adds significant boilerplate (slices, actions,
    selectors, store configuration).
  - **URL search params**: Cannot represent message arrays, recording state,
    or timers. Only suitable for simple filter/pagination state.
- **Implementation notes**:
  - Single store: `src/store/interview-store.ts`
  - State shape: `{ messages, isRecording, currentTheme, elapsedTime,
autoSaveStatus, connectionState }`
  - Middleware: `persist` middleware for localStorage auto-save.
  - The store is scoped to the RTI feature only. Dashboard and admin pages use
    URL params + Server Components per constitution.

### 4.5 Voice Input: Web Speech API

- **Decision**: Web Speech API (`SpeechRecognition` interface)
- **Rationale**: Browser-native speech-to-text — no additional dependency or
  API cost. Supports Spanish and English (FR-041). Provides real-time interim
  results for live transcription display. Available in Chrome, Edge, and Safari
  (covers ~90% of users). Aligns with the Simplicity principle (built-in Web
  Platform API over third-party library).
- **Alternatives considered**:
  - **Deepgram / AssemblyAI**: Superior accuracy and streaming support, but
    adds API cost and a network dependency for each utterance. For MVP, browser
    speech recognition is sufficient.
  - **Whisper (OpenAI)**: Excellent accuracy but requires sending audio to an
    API — adds latency, cost, and privacy concerns (employee voice data sent
    to external service).
  - **MediaRecorder + server-side transcription**: More control over audio
    quality but significantly more complex (audio encoding, file upload,
    server-side processing pipeline).
- **Implementation notes**:
  - Custom hook: `src/lib/hooks/use-speech.ts`
  - Wrap `SpeechRecognition` with error handling, language setting
    (`lang: 'es-MX'` or `'en-US'`), and interim results.
  - Graceful degradation: If `SpeechRecognition` is not available (Firefox),
    hide the microphone button and show text-only input. Display a one-time
    notice explaining voice is not supported in their browser.
  - Privacy: Audio is processed locally in the browser. Only the transcribed
    text is sent to the server.

---

## 5. Export

### 5.1 CSV Export

- **Decision**: Server-side CSV generation using native string concatenation
  (no library)
- **Rationale**: CSV is a trivial format (comma-separated values with quoted
  fields). For our use case (narrative list + metadata, cluster report), a
  simple utility function (~30 lines) is more aligned with the Simplicity
  principle than importing a library. The output is generated server-side in a
  Route Handler and streamed as a download.
- **Alternatives considered**:
  - **Papa Parse**: Full-featured CSV parser/generator, but we only need
    generation (not parsing — CSV upload parsing is a separate concern handled
    during invitation import). Papa Parse is 20KB for a feature we can
    implement in 30 lines.
  - **csv-stringify**: Focused on generation but still adds a dependency for
    trivial functionality.
  - **Client-side Blob generation**: Works but limits file size and requires
    client-side data. Server-side generation is more secure (no raw data
    in the browser).
- **Implementation notes**:
  - Utility: `src/server/services/export.ts`
  - For CSV _parsing_ (invitation CSV upload, FR-003), we will use Papa Parse
    since parsing is more complex than generation (handling quoted fields,
    encoding, error rows). This is a justified dependency.
  - Route Handler: `GET /api/export?type=csv&projectId=...&scope=narratives|clusters`
  - Content-Type: `text/csv; charset=utf-8`
  - Content-Disposition: `attachment; filename="milpa-export-{date}.csv"`

### 5.2 PDF Export

- **Decision**: `@react-pdf/renderer` for PDF generation
- **Rationale**: Allows defining PDF layouts using React components (JSX), which
  is natural for a React/Next.js project. Supports tables, styled text,
  headers, footers, and page numbers. Runs server-side in Node.js. The React
  component model makes it easy to compose different report sections
  (narratives table, cluster summaries, sentiment charts).
- **Alternatives considered**:
  - **jsPDF**: Low-level API — requires manual coordinate-based positioning.
    Producing a well-formatted multi-page report is tedious and error-prone.
  - **Puppeteer / Playwright**: Render HTML to PDF via headless browser.
    Produces perfect layouts but requires a full browser binary (~200MB),
    making it unsuitable for serverless deployment on Vercel.
  - **pdfmake**: Declarative layout via JSON definitions. Reasonable
    alternative but less ergonomic than JSX for a React team.
  - **html-pdf-node**: Wraps Puppeteer — same serverless limitation.
- **Implementation notes**:
  - PDF templates defined as React components in `src/server/services/export.ts`
    (server-side only — `@react-pdf/renderer` does not require a browser).
  - Route Handler: `GET /api/export?type=pdf&projectId=...&scope=narratives|clusters`
  - Content-Type: `application/pdf`
  - Reports include: project summary header, narrative table (text, sentiment,
    abstraction, cluster), cluster summary cards, generation timestamp.

---

## 6. Validation

### 6.1 Schema Validation: Zod

- **Decision**: Zod
- **Rationale**: Constitution mandates runtime validation at trust boundaries
  (Principle III). Zod is the TypeScript-native schema validation library with
  first-class support in the Vercel AI SDK (`generateObject` accepts Zod
  schemas), React Hook Form, and Next.js Server Actions. Infers TypeScript
  types from schemas (single source of truth). ~10KB gzipped.
- **Alternatives considered**:
  - **Yup**: Similar API but weaker TypeScript inference. Older ecosystem,
    less adopted in modern Next.js projects.
  - **Valibot**: Smaller bundle (~1KB) with tree-shakeable API, but less
    ecosystem integration (no Vercel AI SDK support for structured output).
  - **ArkType**: Excellent TypeScript integration but newer and less battle-tested.
  - **io-ts**: Functional programming-oriented API. Steeper learning curve
    for no clear benefit over Zod in our context.
- **Implementation notes**:
  - Schemas directory: `src/lib/validations/`
  - One schema file per entity: `project.ts`, `invitation.ts`, `narrative.ts`,
    `cluster.ts`, `interview.ts`
  - Each schema exports: creation schema, update schema, and inferred
    TypeScript types.
  - Used in: Server Actions (form validation), Route Handlers (request body),
    AI structured output (`generateObject`), CSV upload parsing.

---

## 7. Testing

### 7.1 Unit & Component Testing: Vitest

- **Decision**: Vitest
- **Rationale**: Native ESM support, compatible with Next.js and React 19,
  fast parallel execution, and built-in TypeScript support without
  configuration. API-compatible with Jest (easy migration if needed). Supports
  React Testing Library for component tests. ~5x faster than Jest for
  TypeScript projects due to esbuild-based transformation.
- **Alternatives considered**:
  - **Jest**: Industry standard but requires explicit TypeScript/ESM
    configuration (`ts-jest` or `@swc/jest`), slower execution, and
    increasingly awkward ESM interop.
  - **Bun test**: Fast but couples the test runner to the Bun runtime,
    which we're not using.
- **Implementation notes**:
  - Config: `vitest.config.ts` at project root
  - Test directory: `tests/unit/` and `tests/integration/`
  - Focus: Service layer logic (narrative extraction parsing, clustering
    algorithms, CSV generation), Zod schema validation, utility functions.

### 7.2 End-to-End Testing: Playwright

- **Decision**: Playwright
- **Rationale**: Cross-browser testing (Chromium, Firefox, WebKit), built-in
  auto-waiting, network interception for mocking AI responses, and screenshot
  comparison for semantic map rendering. First-class Next.js integration via
  `@playwright/test`. Recommended by the Next.js team.
- **Alternatives considered**:
  - **Cypress**: Excellent DX and debugging tools, but Chrome-only for free
    tier, and component testing model conflicts with Server Components.
  - **Puppeteer**: Low-level browser automation, not a test framework. Would
    need a separate assertion library.
- **Implementation notes**:
  - Config: `playwright.config.ts`
  - Test directory: `tests/e2e/`
  - Key E2E flows: project creation, interview completion (mocked AI),
    narrative extraction trigger, clustering execution, share link access.

---

## 8. Integration Patterns

### 8.1 Neon + Drizzle Connection Pattern

- **Pattern**: Serverless connection pooling via `@neondatabase/serverless`
  with Drizzle ORM adapter.
- **Details**:

  ```ts
  // src/server/db/index.ts
  import { neon } from "@neondatabase/serverless";
  import { drizzle } from "drizzle-orm/neon-http";
  import * as schema from "./schema";

  const sql = neon(process.env.DATABASE_URL!);
  export const db = drizzle(sql, { schema });
  ```

- **Key consideration**: Neon's serverless driver uses HTTP for queries (no
  persistent connection). For WebSocket-based connections (useful for
  transactions), use `@neondatabase/serverless` Pool with `drizzle-orm/neon-serverless`.
- **Migrations**: Run via `npx drizzle-kit push` during development,
  `npx drizzle-kit generate` + `npx drizzle-kit migrate` for production.

### 8.2 Firebase Auth + Next.js Middleware Pattern

- **Pattern**: Verify Firebase ID tokens in Next.js middleware for protected
  routes.
- **Details**:
  - The standard `firebase-admin` SDK uses Node.js APIs not available in Edge
    Runtime. Two approaches:
    1. **Preferred**: Use middleware only for route matching (redirect
       unauthenticated users to login). Perform actual token verification in
       Server Components/Actions using `firebase-admin` (Node.js runtime).
    2. **Alternative**: Use a lightweight JWT verification library in Edge
       middleware that validates Firebase tokens without the full Admin SDK.
  - We will use approach 1 (simpler, no Edge Runtime constraints).
- **Session strategy**: Store the Firebase ID token in an HTTP-only cookie.
  The cookie is set client-side after Firebase sign-in and sent automatically
  with every request. Server-side code reads and verifies the cookie.

### 8.3 AI Provider Fallback Pattern

- **Pattern**: Retry with exponential backoff, then failover to fallback
  provider.
- **Details**:
  ```
  attempt(primary, retry=3, backoff=[1s, 2s, 4s])
    → on failure: attempt(fallback, retry=2, backoff=[1s, 2s])
      → on failure: throw UserFacingError with retry button
  ```
- **Scope**: Applied uniformly across all AI operations:
  - RTI chat streaming (`/api/ai/chat`)
  - Narrative extraction (`/api/ai/extract`)
  - Cluster naming (`generateObject` in Server Action)
  - Analytic chat (`/api/ai/query`)
  - Embedding generation (provider-specific embedding API)
- **State**: Track consecutive failures in a module-level counter (per
  provider, per operation type). Reset on success. After switching to
  fallback, periodically probe primary (every 5 minutes) to detect recovery.

### 8.4 pgvector Similarity Search Pattern

- **Pattern**: Cosine similarity search using Drizzle custom operators.
- **Details**:
  ```sql
  SELECT id, text, 1 - (embedding <=> $1) AS similarity
  FROM narratives
  WHERE project_id = $2
  ORDER BY embedding <=> $1
  LIMIT 10;
  ```
- **Use cases**:
  - Analytic chat (FR-030): Find narratives semantically similar to the
    user's natural language query (embed the query, then vector search).
  - Clustering input: Retrieve all embeddings for a project to feed into
    UMAP + HDBSCAN.
  - Duplicate detection: Flag narratives with >0.95 cosine similarity as
    potential duplicates during extraction.
- **Index**: Create HNSW index on the `embedding` column for the `narratives`
  table to accelerate similarity queries.

### 8.5 Interview Invitation Email Pattern

- **Decision**: Use a simple transactional email approach
- **Details**: For MVP, two viable approaches:
  1. **Resend**: Modern email API with React Email templates. Simple SDK,
     generous free tier (100 emails/day).
  2. **Nodemailer + SMTP**: Direct SMTP sending via Gmail or a transactional
     email service. Zero dependency if using a generic SMTP provider.
- **Recommendation**: Use **Resend** for clean API, React-based email
  templates, and delivery tracking. Falls within free tier for MVP scale.
- **Env var**: `RESEND_API_KEY`

---

## 9. Dependency Summary

| Package                    | Purpose                         | Size (gzip) | Justification                                |
| -------------------------- | ------------------------------- | ----------- | -------------------------------------------- |
| `@neondatabase/serverless` | Neon DB driver                  | ~15KB       | User-specified database                      |
| `drizzle-orm`              | Type-safe ORM                   | ~10KB       | Type safety + migrations (Constitution III)  |
| `drizzle-kit`              | Migration tooling (dev)         | —           | Dev dependency only                          |
| `firebase`                 | Client-side auth                | ~80KB       | User-specified auth provider                 |
| `firebase-admin`           | Server-side token verification  | ~50KB       | Server-only, needed for secure auth          |
| `ai`                       | Vercel AI SDK core              | ~20KB       | User-specified AI framework                  |
| `@ai-sdk/google`           | Gemini provider                 | ~5KB        | User-specified primary AI                    |
| `@ai-sdk/anthropic`        | Claude provider                 | ~5KB        | User-specified fallback AI                   |
| `zod`                      | Schema validation               | ~10KB       | Constitution III mandate                     |
| `d3` (selective)           | Semantic map visualization      | ~30KB       | No Web Platform alternative (Constitution V) |
| `zustand`                  | RTI client state                | ~1KB        | Justified in Complexity Tracking             |
| `umap-js`                  | Dimensionality reduction        | ~15KB       | Required for 2D semantic map (FR-021)        |
| `papaparse`                | CSV parsing (invitation upload) | ~20KB       | Complex parsing justifies dependency         |
| `@react-pdf/renderer`      | PDF report generation           | ~100KB      | Required for FR-043                          |
| `resend`                   | Transactional email             | ~5KB        | Required for FR-005                          |

**Total estimated addition**: ~370KB gzipped (tree-shaken, before code splitting)

---

## 10. Open Questions (Resolved)

All NEEDS CLARIFICATION items from Technical Context have been resolved:

| Item                       | Resolution                                                       |
| -------------------------- | ---------------------------------------------------------------- |
| Embedding dimensions       | 768 (Gemini text-embedding-004)                                  |
| Clustering algorithm       | HDBSCAN (custom implementation on UMAP-reduced 2D coordinates)   |
| Email delivery service     | Resend (free tier, React Email templates)                        |
| PDF generation approach    | @react-pdf/renderer (server-side, JSX-based)                     |
| CSV parsing vs generation  | Papa Parse for parsing imports; native strings for CSV export    |
| Edge Runtime compatibility | Firebase Admin not Edge-compatible; use Node.js runtime for auth |
| Voice input cross-browser  | Web Speech API with graceful degradation (no Firefox support)    |
