# Data Model: Milpa - AI Discovery Platform

**Branch**: `001-ai-discovery-platform` | **Date**: 2026-02-15
**Phase**: 1 (Design & Contracts) | **Status**: Complete

---

## Overview

9 entities modeled as Drizzle ORM schemas targeting Neon PostgreSQL with the
pgvector extension. All tables use UUID primary keys, `created_at`/`updated_at`
timestamps, and follow the naming convention `snake_case` for columns and
tables.

**Embedding dimensions**: 768 (Gemini `text-embedding-004`)

---

## Entity Relationship Diagram (Text)

```
User (1) ──owns──> (*) Project
User (*) <──collaborators──> (*) Project  [via project_collaborators join table]
Project (1) ──has──> (*) Invitation
Project (1) ──has──> (*) Interview
Project (1) ──has──> (*) Narrative
Project (1) ──has──> (*) ClusteringRun
Project (1) ──has──> (*) Tag
Project (1) ──has──> (*) ShareLink

Invitation (1) ──has──> (0..1) Interview
Interview (1) ──has──> (*) Narrative
ClusteringRun (1) ──has──> (*) Cluster
Cluster (*) <──members──> (*) Narrative  [via cluster_narratives join table]
Tag (*) <──tagged──> (*) Narrative       [via narrative_tags join table]
```

---

## Drizzle Schema

The complete schema lives in `src/server/db/schema.ts`. Below is the full
definition with field-level comments.

### Prerequisites

```sql
-- Run once on Neon dashboard or via migration
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Custom Types

```ts
// src/server/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

// pgvector custom column type (768 dimensions for Gemini text-embedding-004)
const vector768 = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value) as number[];
  },
});
```

### Enums

```ts
export const userRoleEnum = pgEnum("user_role", ["admin", "viewer"]);

export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "active",
  "closed",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "sent",
  "opened",
  "in_progress",
  "completed",
  "expired",
]);

export const interviewStatusEnum = pgEnum("interview_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

export const clusteringRunStatusEnum = pgEnum("clustering_run_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const localeEnum = pgEnum("locale", ["es", "en"]);
```

---

### 1. Users

Represents authenticated platform users (Admin or Viewer). Employees
(interviewees) are NOT stored here — they are anonymous and represented only
by their Invitation token.

```ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firebaseUid: varchar("firebase_uid", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }),
  role: userRoleEnum("role").notNull().default("admin"),
  locale: localeEnum("locale").notNull().default("es"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  collaborations: many(projectCollaborators),
}));
```

**Indexes**: `firebase_uid` (unique), `email` (unique)

---

### 2. Projects

Represents a discovery initiative (e.g., "Clima Enlite Q1 2026").

```ts
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("draft"),
  locale: localeEnum("locale").notNull().default("es"),
  // Demographic categories defined by the Admin (e.g., ["role", "department", "seniority"])
  demographicCategories: jsonb("demographic_categories")
    .notNull()
    .$type<string[]>()
    .default([]),
  // Interview prompt guidelines configured by the Admin
  interviewGuidelines: text("interview_guidelines"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  collaborators: many(projectCollaborators),
  invitations: many(invitations),
  interviews: many(interviews),
  narratives: many(narratives),
  clusteringRuns: many(clusteringRuns),
  tags: many(tags),
  shareLinks: many(shareLinks),
}));
```

**Indexes**: `owner_id`

---

### 3. Project Collaborators (Join Table)

Many-to-many between Users and Projects. Only the owner can delete the project;
collaborators have full edit access (FR-044).

```ts
export const projectCollaborators = pgTable(
  "project_collaborators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_collaborator_unique").on(
      table.projectId,
      table.userId,
    ),
  ],
);

export const projectCollaboratorsRelations = relations(
  projectCollaborators,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectCollaborators.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectCollaborators.userId],
      references: [users.id],
    }),
  }),
);
```

---

### 4. Invitations

Links a Project to an employee email. Each invitation generates a unique
anonymous token used as the interview link. The invitation carries optional
demographic values (role, department, etc.) for later analysis filtering.

```ts
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    // Anonymous token used in the interview URL: /interview/{token}
    token: varchar("token", { length: 64 }).notNull().unique(),
    status: invitationStatusEnum("status").notNull().default("sent"),
    // Demographic values for this employee (e.g., { "role": "Engineer", "department": "Product" })
    categoryValues: jsonb("category_values")
      .$type<Record<string, string>>()
      .default({}),
    // Optional expiration (no expiration by default per clarification)
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("invitation_project_email").on(table.projectId, table.email),
    index("invitation_token_idx").on(table.token),
  ],
);

export const invitationsRelations = relations(invitations, ({ one, many }) => ({
  project: one(projects, {
    fields: [invitations.projectId],
    references: [projects.id],
  }),
  interview: one(interviews),
}));
```

**Indexes**: `token` (unique), `(project_id, email)` (unique — prevents duplicate invitations)

**State transitions**:

```
sent → opened (employee clicks link)
opened → in_progress (employee starts answering)
in_progress → completed (interview finished)
sent/opened → expired (expiration date passed, checked on access)
```

---

### 5. Interviews

A completed or in-progress conversational session between an employee and the
AI interviewer. Linked to an Invitation via the anonymous token.

```ts
export const interviews = pgTable(
  "interviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" })
      .unique(),
    // Full transcript stored as ordered array of messages
    transcript: jsonb("transcript")
      .notNull()
      .$type<
        Array<{
          role: "assistant" | "user";
          content: string;
          timestamp: string;
        }>
      >()
      .default([]),
    status: interviewStatusEnum("status").notNull().default("in_progress"),
    // Theme coverage tracking (which interview themes have been covered)
    themeCoverage: jsonb("theme_coverage")
      .notNull()
      .$type<Record<string, boolean>>()
      .default({}),
    durationSeconds: integer("duration_seconds"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("interview_project_idx").on(table.projectId),
    index("interview_invitation_idx").on(table.invitationId),
  ],
);

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  project: one(projects, {
    fields: [interviews.projectId],
    references: [projects.id],
  }),
  invitation: one(invitations, {
    fields: [interviews.invitationId],
    references: [invitations.id],
  }),
  narratives: many(narratives),
}));
```

**State transitions**:

```
in_progress → completed (all themes covered or 45-min timeout)
in_progress → abandoned (no activity for 24 hours)
```

**Note**: The `transcript` field stores the complete ordered conversation. The
separate `narratives` table stores extracted fragments. Original transcripts
are Admin-only access (FR-035).

---

### 6. Narratives

An extracted story fragment from an interview transcript. The atomic unit of
analysis. Contains the anonymized text, scoring metadata, and a vector
embedding for semantic operations.

```ts
export const narratives = pgTable(
  "narratives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    interviewId: uuid("interview_id")
      .notNull()
      .references(() => interviews.id, { onDelete: "cascade" }),
    // Anonymized narrative text
    text: text("text").notNull(),
    // Original text before anonymization (Admin-only access, FR-035)
    originalText: text("original_text"),
    // Sentiment: -2 (very negative) to +2 (very positive)
    sentiment: real("sentiment").notNull(),
    // Abstraction: 1 (concrete story) to 4 (high-level opinion)
    abstraction: integer("abstraction").notNull(),
    // 768-dimensional embedding from Gemini text-embedding-004
    embedding: vector768("embedding"),
    // Whether anonymization has been applied
    isAnonymized: boolean("is_anonymized").notNull().default(false),
    // Flag for short interviews producing fewer than 10 narratives
    isLowYield: boolean("is_low_yield").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("narrative_project_idx").on(table.projectId),
    index("narrative_interview_idx").on(table.interviewId),
    // HNSW index for vector similarity search
    // Note: Created via raw SQL migration since Drizzle doesn't natively support
    // HNSW index syntax. See migration file.
  ],
);

export const narrativesRelations = relations(narratives, ({ one, many }) => ({
  project: one(projects, {
    fields: [narratives.projectId],
    references: [projects.id],
  }),
  interview: one(interviews, {
    fields: [narratives.interviewId],
    references: [interviews.id],
  }),
  tags: many(narrativeTags),
  clusters: many(clusterNarratives),
}));
```

**Vector index** (raw SQL migration):

```sql
CREATE INDEX narrative_embedding_hnsw_idx
  ON narratives
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

---

### 7. Tags

User-defined classification labels. Many-to-many with Narratives.

```ts
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    category: varchar("category", { length: 100 }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("tag_project_name").on(table.projectId, table.name)],
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  project: one(projects, {
    fields: [tags.projectId],
    references: [projects.id],
  }),
  narratives: many(narrativeTags),
}));
```

### Narrative-Tags Join Table

```ts
export const narrativeTags = pgTable(
  "narrative_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    narrativeId: uuid("narrative_id")
      .notNull()
      .references(() => narratives.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("narrative_tag_unique").on(table.narrativeId, table.tagId),
  ],
);

export const narrativeTagsRelations = relations(narrativeTags, ({ one }) => ({
  narrative: one(narratives, {
    fields: [narrativeTags.narrativeId],
    references: [narratives.id],
  }),
  tag: one(tags, {
    fields: [narrativeTags.tagId],
    references: [tags.id],
  }),
}));
```

---

### 8. Clustering Runs

A snapshot of a clustering execution. Preserves parameters so re-runs with
different settings don't overwrite previous results (FR-026).

```ts
export const clusteringRuns = pgTable(
  "clustering_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: clusteringRunStatusEnum("status").notNull().default("pending"),
    // Snapshot of parameters used for this run
    parameters: jsonb("parameters")
      .notNull()
      .$type<{
        neighbors: number;
        minDist: number;
        minClusterSize: number;
        threshold: number;
      }>()
      .default({
        neighbors: 15,
        minDist: 0.1,
        minClusterSize: 5,
        threshold: 0.2,
      }),
    // UMAP 2D coordinates for each narrative in this run
    umapCoordinates: jsonb("umap_coordinates")
      .$type<Record<string, [number, number]>>()
      .default({}),
    clusterCount: integer("cluster_count"),
    narrativeCount: integer("narrative_count"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("clustering_run_project_idx").on(table.projectId)],
);

export const clusteringRunsRelations = relations(
  clusteringRuns,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [clusteringRuns.projectId],
      references: [projects.id],
    }),
    clusters: many(clusters),
  }),
);
```

---

### 9. Clusters

A group of semantically similar narratives produced by a clustering run.

```ts
export const clusters = pgTable(
  "clusters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clusteringRunId: uuid("clustering_run_id")
      .notNull()
      .references(() => clusteringRuns.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    // AI-generated cluster name (e.g., "Tension: Lack of cross-departmental communication")
    name: varchar("name", { length: 500 }).notNull(),
    // AI-generated cluster summary
    summary: text("summary"),
    // Popularity as percentage of total narratives in this run
    popularity: real("popularity"),
    // Average sentiment of member narratives
    averageSentiment: real("average_sentiment"),
    // Cluster label index (used for color assignment on the map)
    labelIndex: integer("label_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("cluster_run_idx").on(table.clusteringRunId),
    index("cluster_project_idx").on(table.projectId),
  ],
);

export const clustersRelations = relations(clusters, ({ one, many }) => ({
  clusteringRun: one(clusteringRuns, {
    fields: [clusters.clusteringRunId],
    references: [clusteringRuns.id],
  }),
  project: one(projects, {
    fields: [clusters.projectId],
    references: [projects.id],
  }),
  narratives: many(clusterNarratives),
}));
```

### Cluster-Narratives Join Table

```ts
export const clusterNarratives = pgTable(
  "cluster_narratives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clusterId: uuid("cluster_id")
      .notNull()
      .references(() => clusters.id, { onDelete: "cascade" }),
    narrativeId: uuid("narrative_id")
      .notNull()
      .references(() => narratives.id, { onDelete: "cascade" }),
    // Similarity score of this narrative to the cluster centroid
    similarity: real("similarity"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("cluster_narrative_unique").on(
      table.clusterId,
      table.narrativeId,
    ),
  ],
);

export const clusterNarrativesRelations = relations(
  clusterNarratives,
  ({ one }) => ({
    cluster: one(clusters, {
      fields: [clusterNarratives.clusterId],
      references: [clusters.id],
    }),
    narrative: one(narratives, {
      fields: [clusterNarratives.narrativeId],
      references: [narratives.id],
    }),
  }),
);
```

---

### 10. Share Links

Read-only access tokens for sharing dashboards with Viewers (FR-032, FR-033).

```ts
export const shareLinks = pgTable(
  "share_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    // Unique URL token: /share/{token}
    token: varchar("token", { length: 64 }).notNull().unique(),
    // Scope of access
    scope: varchar("scope", { length: 50 }).notNull().default("full_dashboard"),
    // Optional: restrict to a specific clustering run
    clusteringRunId: uuid("clustering_run_id").references(
      () => clusteringRuns.id,
      {
        onDelete: "set null",
      },
    ),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("share_link_token_idx").on(table.token),
    index("share_link_project_idx").on(table.projectId),
  ],
);

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  project: one(projects, {
    fields: [shareLinks.projectId],
    references: [projects.id],
  }),
  clusteringRun: one(clusteringRuns, {
    fields: [shareLinks.clusteringRunId],
    references: [clusteringRuns.id],
  }),
  createdBy: one(users, {
    fields: [shareLinks.createdById],
    references: [users.id],
  }),
}));
```

---

## Validation Rules (from Requirements)

| Entity     | Rule                                                                  | Source |
| ---------- | --------------------------------------------------------------------- | ------ |
| Project    | `name` required, max 255 chars                                        | FR-001 |
| Project    | `demographicCategories` must be a string array                        | FR-002 |
| Invitation | `email` must be valid email format                                    | FR-003 |
| Invitation | Unique constraint on `(project_id, email)` — no duplicate invitations | FR-003 |
| Invitation | `token` must be cryptographically random, 64 chars                    | FR-004 |
| Interview  | `transcript` messages must have `role`, `content`, `timestamp`        | FR-012 |
| Narrative  | `sentiment` must be between -2.0 and 2.0                              | FR-015 |
| Narrative  | `abstraction` must be between 1 and 4                                 | FR-016 |
| Narrative  | `embedding` must be exactly 768 dimensions when present               | FR-018 |
| Cluster    | `popularity` must be between 0.0 and 100.0                            | FR-025 |
| ShareLink  | `token` must be cryptographically random, 64 chars                    | FR-032 |
| ShareLink  | `expiresAt` must be in the future when set                            | FR-032 |

---

## Migration Strategy

1. **Development**: Use `npx drizzle-kit push` to apply schema changes directly
   to the Neon development branch.
2. **Production**: Use `npx drizzle-kit generate` to create SQL migration files,
   review them, and apply with `npx drizzle-kit migrate`.
3. **pgvector index**: Created via a custom SQL migration (not auto-generated
   by Drizzle) since HNSW index syntax requires raw SQL.
4. **Seed data**: A seed script (`src/server/db/seed.ts`) will create a demo
   project with sample interviews, narratives, and clusters for development.
