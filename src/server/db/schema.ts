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
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// pgvector custom column type (768 dimensions for Gemini text-embedding-004)
const vector768 = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown): number[] {
    return JSON.parse(value as string) as number[];
  },
});

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

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("draft"),
  locale: localeEnum("locale").notNull().default("es"),
  demographicCategories: jsonb("demographic_categories")
    .notNull()
    .$type<string[]>()
    .default([]),
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

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    status: invitationStatusEnum("status").notNull().default("sent"),
    categoryValues: jsonb("category_values")
      .$type<Record<string, string>>()
      .default({}),
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
    text: text("text").notNull(),
    originalText: text("original_text"),
    sentiment: real("sentiment").notNull(),
    abstraction: integer("abstraction").notNull(),
    embedding: vector768("embedding"),
    isAnonymized: boolean("is_anonymized").notNull().default(false),
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
  ],
);

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

export const clusteringRuns = pgTable(
  "clustering_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: clusteringRunStatusEnum("status").notNull().default("pending"),
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
    name: varchar("name", { length: 500 }).notNull(),
    summary: text("summary"),
    popularity: real("popularity"),
    averageSentiment: real("average_sentiment"),
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

export const shareLinks = pgTable(
  "share_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 64 }).notNull().unique(),
    scope: varchar("scope", { length: 50 }).notNull().default("full_dashboard"),
    clusteringRunId: uuid("clustering_run_id").references(
      () => clusteringRuns.id,
      { onDelete: "set null" },
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  collaborations: many(projectCollaborators),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  collaborators: many(projectCollaborators),
  invitations: many(invitations),
  interviews: many(interviews),
  narratives: many(narratives),
  clusteringRuns: many(clusteringRuns),
  tags: many(tags),
  shareLinks: many(shareLinks),
}));

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

export const invitationsRelations = relations(invitations, ({ one }) => ({
  project: one(projects, {
    fields: [invitations.projectId],
    references: [projects.id],
  }),
  interview: one(interviews),
}));

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

export const tagsRelations = relations(tags, ({ one, many }) => ({
  project: one(projects, {
    fields: [tags.projectId],
    references: [projects.id],
  }),
  narratives: many(narrativeTags),
}));

export const narrativeTagsRelations = relations(narrativeTags, ({ one }) => ({
  narrative: one(narratives, {
    fields: [narrativeTags.narrativeId],
    references: [narratives.id],
  }),
  tag: one(tags, { fields: [narrativeTags.tagId], references: [tags.id] }),
}));

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
