# API Contracts: Milpa - AI Discovery Platform

**Branch**: `001-ai-discovery-platform` | **Date**: 2026-02-15
**Phase**: 1 (Design & Contracts) | **Status**: Complete

---

## Overview

This document defines the API surface for Milpa. Following the constitution
(Principle II), **Server Actions** are the primary mechanism for data mutations.
**Route Handlers** are used only for:

- AI streaming endpoints (Server Actions cannot stream)
- File export (binary response)
- Webhook integrations

All endpoints assume JSON request/response unless otherwise noted.

### Authentication Patterns

| Pattern                    | Mechanism                                                                       | Routes                |
| -------------------------- | ------------------------------------------------------------------------------- | --------------------- |
| **Admin/Viewer**           | Firebase ID token in `Authorization: Bearer <token>` header or HTTP-only cookie | All `(auth)/` routes  |
| **Employee (Interviewee)** | Anonymous token in URL path (`/interview/{token}`)                              | `(public)/interview/` |
| **Shared Viewer**          | Share token in URL path (`/share/{token}`)                                      | `(shared)/share/`     |

---

## Server Actions

Server Actions are called directly from Client Components via form submissions
or `startTransition`. They validate input with Zod, verify auth, and perform
mutations.

All Server Actions live in `src/server/actions/` and follow this pattern:

```ts
'use server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/server/auth/middleware';

export async function actionName(input: z.infer<typeof schema>) {
  const validated = schema.parse(input);
  const user = await getAuthenticatedUser();
  // ... business logic
  return { success: true, data: ... };
}
```

### Project Actions (`src/server/actions/project-actions.ts`)

| Action               | Input                                                                                                                                                                            | Output              | FR             | Description                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------- | -------------------------------------------------------------- |
| `createProject`      | `{ name: string, description?: string, locale: 'es'\|'en', demographicCategories: string[], interviewGuidelines?: string }`                                                      | `{ id: string }`    | FR-001, FR-002 | Creates a new project. Sets authenticated user as owner.       |
| `updateProject`      | `{ id: string, name?: string, description?: string, status?: 'draft'\|'active'\|'closed', locale?: 'es'\|'en', demographicCategories?: string[], interviewGuidelines?: string }` | `{ success: true }` | FR-001, FR-002 | Updates project fields. Owner or collaborator only.            |
| `deleteProject`      | `{ id: string }`                                                                                                                                                                 | `{ success: true }` | FR-001         | Deletes project and all associated data. Owner only (FR-044).  |
| `addCollaborator`    | `{ projectId: string, email: string }`                                                                                                                                           | `{ success: true }` | FR-044         | Adds an Admin user as collaborator. Owner only.                |
| `removeCollaborator` | `{ projectId: string, userId: string }`                                                                                                                                          | `{ success: true }` | FR-044         | Removes a collaborator. Owner only.                            |
| `getProjects`        | `{}`                                                                                                                                                                             | `Project[]`         | FR-001         | Lists projects owned by or shared with the authenticated user. |
| `getProject`         | `{ id: string }`                                                                                                                                                                 | `Project`           | FR-001         | Gets project details. Owner or collaborator only.              |

### Invitation Actions (`src/server/actions/invitation-actions.ts`)

| Action                  | Input                                                                                               | Output                                                                 | FR             | Description                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `createInvitation`      | `{ projectId: string, email: string, categoryValues?: Record<string, string>, expiresAt?: string }` | `{ id: string, token: string }`                                        | FR-003, FR-004 | Creates single invitation with anonymous token.                                |
| `bulkCreateInvitations` | `{ projectId: string, csvData: string }`                                                            | `{ created: number, skipped: Array<{ row: number, reason: string }> }` | FR-003, FR-004 | Parses CSV, creates invitations. Reports skipped rows (duplicates, malformed). |
| `sendInvitationEmail`   | `{ invitationId: string }`                                                                          | `{ success: true }`                                                    | FR-005         | Sends invitation email via Resend.                                             |
| `sendBulkEmails`        | `{ projectId: string, invitationIds?: string[] }`                                                   | `{ sent: number, failed: number }`                                     | FR-005         | Sends emails for all unsent invitations (or specified IDs).                    |
| `getInvitations`        | `{ projectId: string, status?: InvitationStatus }`                                                  | `Invitation[]`                                                         | FR-006         | Lists invitations with status tracking.                                        |
| `deleteInvitation`      | `{ id: string }`                                                                                    | `{ success: true }`                                                    | FR-003         | Deletes an invitation (only if status is 'sent').                              |

### Interview Actions (`src/server/actions/interview-actions.ts`)

| Action                   | Input                                             | Output                                                                                    | FR        | Description                                                                        |
| ------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| `validateInterviewToken` | `{ token: string }`                               | `{ valid: boolean, projectName?: string, locale?: 'es'\|'en' }`                           | FR-007    | Validates anonymous token. Checks expiration, completion status. Public (no auth). |
| `saveTranscriptChunk`    | `{ token: string, messages: Message[] }`          | `{ success: true }`                                                                       | FR-012    | Appends messages to transcript. Auto-save endpoint. Public (token-auth).           |
| `completeInterview`      | `{ token: string, durationSeconds: number }`      | `{ success: true }`                                                                       | FR-013    | Marks interview complete, updates invitation status. Public (token-auth).          |
| `getInterviews`          | `{ projectId: string, status?: InterviewStatus }` | `Interview[]`                                                                             | FR-019    | Lists interviews for a project. Admin only.                                        |
| `getInterview`           | `{ id: string }`                                  | `Interview` (with transcript)                                                             | FR-035    | Gets full interview including transcript. Admin only.                              |
| `resumeInterview`        | `{ token: string }`                               | `{ messages: Message[], themeCoverage: Record<string, boolean>, elapsedSeconds: number }` | Edge case | Returns saved state for resumption. Public (token-auth).                           |

### Narrative Actions (`src/server/actions/narrative-actions.ts`)

| Action                   | Input                                                                                                                                                         | Output                                                                                                           | FR             | Description                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| `triggerExtraction`      | `{ interviewId: string }`                                                                                                                                     | `{ jobId: string }`                                                                                              | FR-014         | Triggers AI narrative extraction for one interview. Returns job ID for progress tracking. |
| `triggerBatchExtraction` | `{ projectId: string, interviewIds?: string[] }`                                                                                                              | `{ jobId: string, totalInterviews: number }`                                                                     | FR-019         | Triggers batch extraction. All completed interviews if no IDs specified.                  |
| `getNarratives`          | `{ projectId: string, filters?: { interviewId?: string, sentiment?: [number, number], abstraction?: [number, number], tagIds?: string[], search?: string } }` | `Narrative[]`                                                                                                    | FR-014, FR-020 | Lists narratives with filtering.                                                          |
| `updateNarrative`        | `{ id: string, text?: string, sentiment?: number, abstraction?: number }`                                                                                     | `{ success: true }`                                                                                              | FR-020         | Manually edit narrative text or scores.                                                   |
| `reAnonymize`            | `{ id: string }`                                                                                                                                              | `{ success: true }`                                                                                              | FR-038         | Re-runs anonymization on a narrative.                                                     |
| `addTag`                 | `{ narrativeId: string, tagId: string }`                                                                                                                      | `{ success: true }`                                                                                              | FR-020         | Adds a tag to a narrative.                                                                |
| `removeTag`              | `{ narrativeId: string, tagId: string }`                                                                                                                      | `{ success: true }`                                                                                              | FR-020         | Removes a tag from a narrative.                                                           |
| `createTag`              | `{ projectId: string, name: string, category?: string, description?: string }`                                                                                | `{ id: string }`                                                                                                 | FR-020         | Creates a new tag for the project.                                                        |
| `getExtractionProgress`  | `{ jobId: string }`                                                                                                                                           | `{ status: 'processing'\|'completed'\|'failed', processed: number, total: number, narrativesExtracted: number }` | FR-019         | Polls extraction job progress.                                                            |

### Clustering Actions (`src/server/actions/clustering-actions.ts`)

| Action                  | Input                                                                                                                  | Output                                                                                                            | FR             | Description                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------- |
| `runClustering`         | `{ projectId: string, parameters: { neighbors: number, minDist: number, minClusterSize: number, threshold: number } }` | `{ runId: string }`                                                                                               | FR-022, FR-023 | Triggers UMAP + HDBSCAN clustering. Returns run ID for progress tracking. |
| `getClusteringRuns`     | `{ projectId: string }`                                                                                                | `ClusteringRun[]`                                                                                                 | FR-026         | Lists all clustering runs for a project (preserves history).              |
| `getClusteringRun`      | `{ runId: string }`                                                                                                    | `ClusteringRun` (with clusters and UMAP coordinates)                                                              | FR-021, FR-025 | Gets full clustering results including 2D map data.                       |
| `getClusterDetail`      | `{ clusterId: string }`                                                                                                | `Cluster` (with member narratives)                                                                                | FR-024, FR-025 | Gets cluster name, summary, metrics, and member narratives.               |
| `getClusteringProgress` | `{ runId: string }`                                                                                                    | `{ status: 'pending'\|'processing'\|'completed'\|'failed', phase?: 'embedding'\|'umap'\|'clustering'\|'naming' }` | FR-022         | Polls clustering job progress.                                            |

### Share Link Actions (inlined in `src/server/actions/project-actions.ts`)

| Action               | Input                                                                                                            | Output                                                   | FR     | Description                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------ | ---------------------------------------- |
| `createShareLink`    | `{ projectId: string, scope: 'full_dashboard'\|'clustering_run', clusteringRunId?: string, expiresAt?: string }` | `{ token: string, url: string }`                         | FR-032 | Generates a shareable read-only link.    |
| `deleteShareLink`    | `{ id: string }`                                                                                                 | `{ success: true }`                                      | FR-032 | Revokes a share link.                    |
| `getShareLinks`      | `{ projectId: string }`                                                                                          | `ShareLink[]`                                            | FR-032 | Lists active share links for a project.  |
| `validateShareToken` | `{ token: string }`                                                                                              | `{ valid: boolean, projectId?: string, scope?: string }` | FR-033 | Validates share token. Public (no auth). |

---

## Route Handlers

Route Handlers handle streaming AI responses, file exports, and external
integrations. Located in `src/app/api/`.

### AI Streaming Endpoints

#### `POST /api/ai/chat` (FR-007, FR-008, FR-009, FR-010, FR-011, FR-013)

RTI interview streaming endpoint. Uses Vercel AI SDK `streamText()`.

**Auth**: Anonymous token (in request body)

**Request**:

```ts
{
  token: string; // Interview anonymous token
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  themeCoverage: Record<string, boolean>; // Current theme progress
  elapsedMinutes: number; // For 45-min cutoff
  locale: "es" | "en"; // Response language
}
```

**Response**: `text/event-stream` (SSE via Vercel AI SDK `toDataStreamResponse()`)

**Behavior**:

- Validates token against `invitations` table
- Constructs system prompt with interview guidelines, theme progress, and
  anonymity reminders (every 5-7 exchanges)
- Uses primary AI provider (Gemini), falls back to Claude on failure (FR-045)
- Steers toward concrete stories (abstraction 1-2) when detecting opinions
- Closes interview gracefully when all themes covered or 45 min elapsed

**Error responses**:

- `401` — Invalid or expired token
- `429` — Rate limited (AI provider)
- `503` — Both AI providers unavailable

---

#### `POST /api/ai/extract` (FR-014, FR-015, FR-016, FR-017, FR-018)

Narrative extraction endpoint. Processes a full transcript and returns
structured narrative fragments with sentiment, abstraction scores, and
anonymized text. Not streaming — returns complete result.

**Auth**: Firebase token (Admin only)

**Request**:

```ts
{
  interviewId: string;
  locale: "es" | "en";
}
```

**Response**:

```ts
{
  narratives: Array<{
    text: string; // Anonymized
    originalText: string; // Pre-anonymization
    sentiment: number; // -2 to +2
    abstraction: number; // 1 to 4
  }>;
  isLowYield: boolean; // true if < 10 narratives extracted
}
```

**Behavior**:

- Retrieves transcript from database
- Uses `generateObject()` with Zod schema to extract structured narratives
- Runs NER-based anonymization on each narrative
- Generates embeddings via `text-embedding-004`
- Stores narratives + embeddings in database
- Primary/fallback AI provider pattern (FR-045)

---

#### `POST /api/ai/query` (FR-030)

Analytic chat endpoint. Streams AI responses to natural language queries about
project narratives and clusters.

**Auth**: Firebase token (Admin) OR share token (Viewer, FR-033)

**Request**:

```ts
{
  projectId: string;
  query: string;
  shareToken?: string;       // For Viewer access
  locale: 'es' | 'en';
  filters?: {
    department?: string;
    role?: string;
    clusterIds?: string[];
  };
}
```

**Response**: `text/event-stream` (SSE)

**Behavior**:

- Embeds the query using `text-embedding-004`
- Performs vector similarity search against project narratives (top 20)
- Retrieves relevant cluster summaries
- Streams an AI-generated analytical response with citations to specific
  narratives and clusters
- Applies demographic filters if provided
- Never reveals employee identities (FR-037)

---

### Export Endpoint

#### `GET /api/export` (FR-043)

Generates CSV or PDF export of narratives or cluster reports.

**Auth**: Firebase token (Admin only)

**Query Parameters**:

```
type: 'csv' | 'pdf'                     (required)
projectId: string                        (required)
scope: 'narratives' | 'clusters'         (required)
clusteringRunId?: string                 (for cluster export, specifies which run)
filters?: string                         (JSON-encoded filter object)
```

**Response**:

- CSV: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="milpa-{scope}-{date}.csv"`
- PDF: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="milpa-{scope}-{date}.pdf"`

**CSV format (narratives)**:

```csv
ID,Text,Sentiment,Abstraction,Cluster,Tags,Interview Date
uuid,"Anonymized narrative text",-1.5,2,"Cluster Name","tag1, tag2",2026-02-15
```

**CSV format (clusters)**:

```csv
ID,Name,Summary,Popularity %,Avg Sentiment,Narrative Count
uuid,"Tension: Lack of communication","AI-generated summary...",23.5,-0.8,47
```

---

## Data Types (shared)

These types are used across Server Actions and Route Handlers. Defined in
`src/lib/types/`.

```ts
// src/lib/types/project.ts
export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "closed";
  locale: "es" | "en";
  demographicCategories: string[];
  interviewGuidelines: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields (from joins)
  interviewCount?: number;
  completedInterviewCount?: number;
  narrativeCount?: number;
  clusterCount?: number;
};

// src/lib/types/interview.ts
export type Message = {
  role: "assistant" | "user";
  content: string;
  timestamp: string;
};

export type Interview = {
  id: string;
  projectId: string;
  invitationId: string;
  transcript: Message[];
  status: "in_progress" | "completed" | "abandoned";
  themeCoverage: Record<string, boolean>;
  durationSeconds: number | null;
  startedAt: string;
  completedAt: string | null;
};

// src/lib/types/narrative.ts
export type Narrative = {
  id: string;
  projectId: string;
  interviewId: string;
  text: string;
  sentiment: number;
  abstraction: number;
  isAnonymized: boolean;
  isLowYield: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
};

// src/lib/types/cluster.ts
export type Cluster = {
  id: string;
  clusteringRunId: string;
  name: string;
  summary: string | null;
  popularity: number | null;
  averageSentiment: number | null;
  labelIndex: number;
  narrativeCount?: number;
  narratives?: Narrative[];
};

export type ClusteringRun = {
  id: string;
  projectId: string;
  status: "pending" | "processing" | "completed" | "failed";
  parameters: {
    neighbors: number;
    minDist: number;
    minClusterSize: number;
    threshold: number;
  };
  umapCoordinates: Record<string, [number, number]>;
  clusterCount: number | null;
  narrativeCount: number | null;
  startedAt: string | null;
  completedAt: string | null;
  clusters?: Cluster[];
};

// src/lib/types/user.ts
export type User = {
  id: string;
  email: string;
  displayName: string | null;
  role: "admin" | "viewer";
  locale: "es" | "en";
};

export type Tag = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
};

export type ShareLink = {
  id: string;
  projectId: string;
  token: string;
  scope: "full_dashboard" | "clustering_run";
  expiresAt: string | null;
  createdAt: string;
};

export type Invitation = {
  id: string;
  projectId: string;
  email: string;
  token: string;
  status: "sent" | "opened" | "in_progress" | "completed" | "expired";
  categoryValues: Record<string, string>;
  expiresAt: string | null;
  createdAt: string;
};
```

---

## Dashboard Data Endpoints (Server Components)

The dashboard (FR-027–FR-031) is rendered via **Server Components** that fetch
data directly from the database using service functions. No API endpoints
needed — data is fetched server-side during rendering.

| Page          | Service Function                             | Data                                                                               | FR     |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| `/dashboard`  | `getDashboardMetrics(projectId)`             | Interview count, narrative count, cluster count, avg sentiment, participation rate | FR-027 |
| `/dashboard`  | `getLatestClusteringRun(projectId)`          | Semantic map data (UMAP coords, clusters, narratives)                              | FR-028 |
| `/dashboard`  | `getSentimentHeatmap(projectId, filters)`    | Sentiment by demographic category matrix                                           | FR-029 |
| `/clustering` | `getClusteringRun(runId)`                    | Full clustering data for interactive map                                           | FR-021 |
| `/narratives` | `getNarrativesByProject(projectId, filters)` | Paginated, filtered narrative list                                                 | FR-014 |

These service functions live in `src/server/services/` and are called directly
from Server Components — no HTTP layer in between. This is the Next.js App
Router pattern: the server component IS the API for read operations.

---

## Error Response Format

All errors (Server Actions and Route Handlers) follow a consistent format:

```ts
{
  error: {
    code: string;       // Machine-readable: 'VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'AI_PROVIDER_ERROR'
    message: string;    // Human-readable in the project's locale
    details?: unknown;  // Additional context (validation errors, skipped rows, etc.)
  }
}
```

**HTTP Status Codes** (Route Handlers only):

- `400` — Validation error
- `401` — Missing or invalid auth token
- `403` — Authenticated but insufficient permissions
- `404` — Resource not found
- `429` — Rate limited (AI provider)
- `500` — Internal server error
- `503` — AI provider unavailable (both primary and fallback failed)
