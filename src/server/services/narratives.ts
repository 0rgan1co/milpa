import { db } from "@/server/db";
import { narratives, tags, narrativeTags } from "@/server/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { NarrativeInput } from "@/lib/validations/narrative";

type SimilarNarrativeResult = {
  id: string;
  text: string;
  sentiment: number;
  abstraction: string;
  similarity: number;
};

export async function searchSimilarNarratives(
  projectId: string,
  queryEmbedding: number[],
  limit: number = 20,
) {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  // Use cosine similarity (<=>) with pgvector
  // 1 - (embedding <=> $1) is cosine similarity
  const results = await db.execute(sql`
    SELECT id, text, sentiment, abstraction, 1 - (embedding <=> ${vectorLiteral}::vector) as similarity
    FROM narratives
    WHERE project_id = ${projectId}
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `);

  return results.rows as SimilarNarrativeResult[];
}

export async function createNarrative(
  input: NarrativeInput & { embedding?: number[] },
) {
  const [narrative] = await db
    .insert(narratives)
    .values({
      ...input,
    })
    .returning();
  return narrative;
}

export async function bulkCreateNarratives(
  data: Array<NarrativeInput & { embedding?: number[] }>,
) {
  return db.insert(narratives).values(data).returning();
}

export async function getNarrativesByProject(
  projectId: string,
  filters?: {
    interviewId?: string;
    tagIds?: string[];
  },
) {
  let whereClause = eq(narratives.projectId, projectId);

  if (filters?.interviewId) {
    whereClause = and(
      whereClause,
      eq(narratives.interviewId, filters.interviewId),
    )!;
  }

  // Handle tags filter separately if needed with a join
  if (filters?.tagIds && filters.tagIds.length > 0) {
    const narrativeIdsWithTags = await db
      .select({ id: narrativeTags.narrativeId })
      .from(narrativeTags)
      .where(inArray(narrativeTags.tagId, filters.tagIds));

    const ids = narrativeIdsWithTags.map((n) => n.id);
    if (ids.length === 0) return [];

    whereClause = and(whereClause, inArray(narratives.id, ids))!;
  }

  return db.select().from(narratives).where(whereClause);
}

export async function updateNarrative(
  id: string,
  input: Partial<NarrativeInput>,
) {
  const [updated] = await db
    .update(narratives)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(narratives.id, id))
    .returning();
  return updated;
}

export async function deleteNarrative(id: string) {
  await db.delete(narratives).where(eq(narratives.id, id));
  return { success: true };
}

export async function addTagToNarrative(narrativeId: string, tagId: string) {
  await db
    .insert(narrativeTags)
    .values({ narrativeId, tagId })
    .onConflictDoNothing();
  return { success: true };
}

export async function removeTagFromNarrative(
  narrativeId: string,
  tagId: string,
) {
  await db
    .delete(narrativeTags)
    .where(
      and(
        eq(narrativeTags.narrativeId, narrativeId),
        eq(narrativeTags.tagId, tagId),
      ),
    );
  return { success: true };
}

export async function createTag(
  projectId: string,
  name: string,
  category?: string,
  description?: string,
) {
  const [tag] = await db
    .insert(tags)
    .values({
      projectId,
      name,
      category,
      description,
    })
    .returning();
  return tag;
}

export async function getTagsByProject(projectId: string) {
  return db.select().from(tags).where(eq(tags.projectId, projectId));
}
