import { db } from "@/server/db";
import { shareLinks } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

export function generateShareToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createShareLink(
  projectId: string,
  createdById: string,
  scope: string,
  expiresAt?: Date,
  clusteringRunId?: string,
) {
  const token = generateShareToken();
  const [link] = await db
    .insert(shareLinks)
    .values({
      projectId,
      token,
      scope,
      createdById,
      expiresAt,
      clusteringRunId,
    })
    .returning();

  return link;
}

export async function getShareLinkByToken(token: string) {
  const link = await db.query.shareLinks.findFirst({
    where: eq(shareLinks.token, token),
    with: {
      project: true,
      clusteringRun: {
        with: {
          clusters: {
            with: {
              narratives: {
                with: {
                  narrative: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!link) return null;

  // Check expiration
  if (link.expiresAt && link.expiresAt < new Date()) {
    return null;
  }

  return link;
}

export async function getShareLinksByProject(projectId: string) {
  return db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.projectId, projectId));
}

export async function deleteShareLink(id: string) {
  await db.delete(shareLinks).where(eq(shareLinks.id, id));
  return { success: true };
}
