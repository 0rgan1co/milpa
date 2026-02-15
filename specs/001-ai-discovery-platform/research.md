# Research: Milpa - AI Discovery Platform

**Branch**: `001-ai-discovery-platform` | **Date**: 2026-02-15  
**Phase**: 0 (Outline & Research) | **Status**: Complete

---

## 1. Database & Persistence

### 1.1 Primary Database: Neon PostgreSQL

- **Decision**: Neon PostgreSQL (serverless) with pooled connection
- **Rationale**: User-specified. Neon provides serverless Postgres with automatic scaling, branching, and a generous free tier. The `@neondatabase/serverless` driver supports HTTP and WebSocket connections.
- **Critical Configuration**: Must use the **pooled connection string** (containing `-pooler` hostname) to leverage Neon's built-in PgBouncer. This is essential for serverless environments (Next.js App Router) to prevent connection exhaustion from rapidly spawning serverless functions.
- **Alternatives considered**: Supabase, PlanetScale, SQLite, MongoDB (see original rationale).
- **Implementation notes**:
  - Connection Mode: **HTTP Mode** for standard queries (fastest for stateless serverless functions). **WebSocket Mode** for transactions if needed.
  - Driver: `@neondatabase/serverless`.
  - **Singleton Pattern**: In development/hot-reload environments, use a global singleton for the database connection to prevent connection leaks. In production, the serverless function lifecycle handles this naturally, but the pooled string is non-negotiable.

### 1.2 Vector Extension: pgvector

- **Decision**: pgvector extension (Neon-native)
- **Rationale**: Built-in vector search support in Postgres. (See original rationale).
- **Implementation notes**: `vector(768)` for Gemini text-embedding-004. HNSW index.

### 1.3 ORM: Drizzle

- **Decision**: Drizzle ORM
- **Rationale**: Lightweight, type-safe, schema-as-code. (See original rationale).
- **Implementation notes**:
  - Adapter: `drizzle-orm/neon-http` (for best serverless performance with pooling).

### 1.4 Client-Side Persistence: localStorage

- **Decision**: Browser localStorage API
- **Rationale**: Instant, zero-latency persistence for RTI drafts. (See original rationale).

### 1.5 Data Integration Strategy (Firebase + Postgres)

- **Decision**: Firebase UID as Primary Key in Postgres `users` table
- **Rationale**: Direct mapping between Auth provider and Data store. The Firebase UID is guaranteed unique and stable. Using it as the Primary Key (`text` or `varchar(128)`) eliminates the need for a separate lookup table or internal integer ID, simplifying queries and foreign key relationships.
- **Implementation notes**:
  - `users` table schema: `id: text('id').primaryKey()`
  - Foreign Keys: Other tables (e.g., `projects.owner_id`) reference `users.id` directly.

---

## 2. Authentication

### 2.1 Firebase Authentication

- **Decision**: Firebase Auth (Client SDK) + Session Cookies (Server Verification)
- **Rationale**: While ID tokens are standard for SPAs, Next.js App Router best practice is **Session Cookies** (`HttpOnly`).
  - **Security**: HttpOnly cookies prevent XSS theft of tokens.
  - **SSR Compatibility**: Cookies are automatically sent with Server Component requests, allowing `cookies().get()` to verify auth without client-side waterfalls.
  - **Compatibility**: Solves "flicker" issues and state synchronization problems common with client-side-only auth in Next.js 16.
- **Alternatives considered**:
  - **Bearer Token Headers**: Requires client-side fetch wrappers or "use client" wrappers for every data fetch. breaks Server Components pattern.
  - **NextAuth.js / Clerk**: (See original rationale).
- **Implementation notes**:
  - **Runtime Requirement**: Route Handlers and Server Actions performing verification **MUST** use the **Node.js Runtime** (`export const runtime = 'nodejs'`). The Firebase Admin SDK depends on Node.js APIs (e.g., `crypto`, `fs`) and is **incompatible with the Edge Runtime**.
  - **Login Flow**:
    1. Client: `signInWithPopUp` (Firebase SDK) -> gets ID Token.
    2. Client: `POST /api/auth/login` with ID Token.
    3. Server: `admin.auth().createSessionCookie(idToken)`.
    4. Server: Set `HttpOnly` cookie.
  - **Verification**: Middleware and Server Components read the cookie and verify via `admin.auth().verifySessionCookie()`.
  - **Compatibility**: Next.js 16.1.6 is compatible with this pattern. Note: `signInWithPopup` may have mobile quirks; fallback to redirect flow if needed.

---

## 3. AI & Machine Learning

### 3.1 AI SDK: Vercel AI SDK

- **Decision**: Vercel AI SDK (`ai` + `@ai-sdk/google` + `@ai-sdk/anthropic`)
- **Rationale**: Unified interface, streaming support. (See original rationale).
- **Compatibility Note**: Streaming endpoints in Next.js App Router are public by default.
- **Security Pattern**: **Must** verify authentication (Session Cookie) at the _start_ of the Route Handler/Server Action before initializing the stream.
  - Fail with `401` immediately if invalid.
  - Ensure `export const dynamic = 'force-dynamic'` and increased `maxDuration` to prevent timeouts during streaming authentication checks.

### 3.2 Primary AI Provider: Google Gemini

- **Decision**: Gemini 2.0 Flash + text-embedding-004
- **Rationale**: (See original rationale).

### 3.3 Fallback AI Provider: Anthropic Claude

- **Decision**: Claude 3.5 Sonnet
- **Rationale**: (See original rationale).
- **Implementation notes**:
  - **Fallback Pattern**: Use a custom `try/catch` wrapper or the `ai-fallback` utility.
  - **Runtime**: Since `streamText` might run on Edge in other contexts, strictly enforce `nodejs` runtime if it shares a file with Firebase Admin verification.
  - **Strategy**:
    1. Attempt `streamText` with Gemini.
    2. Catch error (check if it's a rate limit or API error).
    3. Retry with Claude 3.5 Sonnet.
    4. Maintain same system prompt and message history.

### 3.4 Dimensionality Reduction: UMAP

- **Decision**: UMAP via `umap-js`
- **Rationale**: (See original rationale).

### 3.5 Clustering Algorithm: HDBSCAN

- **Decision**: HDBSCAN (Custom or `density-clustering`)
- **Rationale**: (See original rationale).

---

## 4. Frontend

### 4.1 Framework: Next.js 16

- **Decision**: Next.js 16.1.6 (App Router)
- **Rationale**: User-specified. Latest stable version.
- **Compatibility**: Fully compatible with Firebase Session Cookie pattern and Neon Serverless.

### 4.2 UI Components: shadcn/ui

- **Decision**: shadcn/ui
- **Rationale**: (See original rationale).

### 4.3 Visualization: D3.js

- **Decision**: D3.js
- **Rationale**: (See original rationale).

### 4.4 Client State Management: Zustand

- **Decision**: Zustand
- **Rationale**: (See original rationale).

### 4.5 Voice Input: Web Speech API

- **Decision**: Web Speech API
- **Rationale**: (See original rationale).

---

## 5. Export

### 5.1 CSV Export

- **Decision**: Server-side string concatenation
- **Rationale**: (See original rationale).

### 5.2 PDF Export

- **Decision**: `@react-pdf/renderer`
- **Rationale**: (See original rationale).

---

## 6. Validation

### 6.1 Schema Validation: Zod

- **Decision**: Zod
- **Rationale**: (See original rationale).

---

## 7. Testing

### 7.1 Unit & Component Testing: Vitest

- **Decision**: Vitest
- **Rationale**: (See original rationale).

### 7.2 End-to-End Testing: Playwright

- **Decision**: Playwright
- **Rationale**: (See original rationale).

---

## 8. Integration Patterns

### 8.1 Neon + Drizzle Connection Pattern

- **Pattern**: Serverless Pooling via HTTP
- **Details**:

  ```ts
  // src/server/db/index.ts
  import { neon } from "@neondatabase/serverless";
  import { drizzle } from "drizzle-orm/neon-http";

  // MUST use the POOLED connection string (with -pooler)
  const sql = neon(process.env.DATABASE_URL!);
  export const db = drizzle(sql, { schema });
  ```

### 8.2 Firebase Auth + Session Cookie Pattern

- **Pattern**: Client Login -> Server Session Cookie
- **Details**:
  1. **Client**: User signs in with Firebase SDK.
  2. **Client**: `auth.currentUser.getIdToken()`
  3. **Client**: `fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ idToken }) })`
  4. **Server (Route Handler)**:
     ```ts
     const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
     const sessionCookie = await admin
       .auth()
       .createSessionCookie(idToken, { expiresIn });
     cookies().set("session", sessionCookie, {
       maxAge: expiresIn,
       httpOnly: true,
       secure: true,
     });
     ```
  5. **Middleware**: Check for `session` cookie. If missing on protected route -> Redirect.
  6. **Server Components**: `cookies().get('session')` -> `admin.auth().verifySessionCookie()`.

### 8.3 AI Provider Fallback Pattern

- **Pattern**: Retry with exponential backoff -> Fallback Provider. (See original rationale).

### 8.4 pgvector Similarity Search Pattern

- **Pattern**: Cosine similarity via Drizzle. (See original rationale).

### 8.5 Data Integrity Pattern (Foreign Keys)

- **Pattern**: Firebase UID as Foreign Key
- **Details**:

  ```ts
  // schema.ts
  export const users = pgTable("users", {
    id: text("id").primaryKey(), // Firebase UID
    email: text("email").notNull(),
  });

  export const projects = pgTable("projects", {
    ownerId: text("owner_id")
      .references(() => users.id)
      .notNull(),
  });
  ```

---

## 9. Dependency Summary

| Package                                     | Purpose        | Justification                                   |
| :------------------------------------------ | :------------- | :---------------------------------------------- |
| `@neondatabase/serverless`                  | Neon DB driver | Serverless-compatible, supports HTTP/WebSocket. |
| `drizzle-orm`                               | ORM            | Type-safe, lightweight.                         |
| `firebase`                                  | Client Auth    | User-specified.                                 |
| `firebase-admin`                            | Server Auth    | Session cookie creation/verification.           |
| `ai`, `@ai-sdk/google`, `@ai-sdk/anthropic` | AI             | Streaming, standardized provider interface.     |
| `zod`                                       | Validation     | Runtime validation.                             |
| `d3`                                        | Visualization  | Complex semantic maps.                          |
| `zustand`                                   | State          | RTI session management.                         |
| `umap-js`                                   | Dim. Reduction | Required for 2D maps.                           |
| `papaparse`                                 | CSV Parsing    | Robust import handling.                         |
| `@react-pdf/renderer`                       | PDF Export     | React-based PDF generation.                     |
| `resend`                                    | Email          | Transactional emails.                           |

---

## 10. Open Questions (Resolved)

| Item                      | Resolution                                                                                                                                   |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16 + Firebase** | **Session Cookies** are the required pattern for App Router compatibility and security.                                                      |
| **Neon Connection**       | Must use **pooled connection string** with `neon-http` driver.                                                                               |
| **Data Integrity**        | Use **Firebase UID as Primary Key** (`text`) in Postgres.                                                                                    |
| **Streaming Security**    | Verify session cookie in Route Handler _before_ starting stream.                                                                             |
| **Embedding Dims**        | 768 (Gemini text-embedding-004).                                                                                                             |
| **Clustering**            | HDBSCAN on UMAP-reduced 2D coords.                                                                                                           |
| **Runtime Compatibility** | **CRITICAL**: Use `runtime = 'nodejs'` for all routes using Firebase Admin (Auth). AI streaming must also use Node.js runtime if auth-gated. |
| **AI Fallback**           | Use `try/catch` block around `streamText` to switch providers (Gemini -> Claude).                                                            |
