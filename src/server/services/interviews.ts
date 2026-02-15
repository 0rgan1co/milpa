import { db } from "@/server/db";
import { interviews, invitations } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { Message } from "@/lib/types/interview";

export async function createInterview(projectId: string, invitationId: string) {
  const [interview] = await db
    .insert(interviews)
    .values({
      projectId,
      invitationId,
      status: "in_progress",
    })
    .returning();

  // Update invitation status
  await db
    .update(invitations)
    .set({ status: "in_progress", updatedAt: new Date() })
    .where(eq(invitations.id, invitationId));

  return interview;
}

export async function getInterviewByInvitationToken(token: string) {
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
    with: {
      project: true,
      interview: true,
    },
  });

  if (!invitation) return null;

  return {
    invitation,
    project: invitation.project,
    interview: invitation.interview,
  };
}

export async function updateTranscript(
  interviewId: string,
  transcript: Message[],
  themeCoverage: Record<string, boolean>,
) {
  return db
    .update(interviews)
    .set({
      transcript,
      themeCoverage,
      updatedAt: new Date(),
    })
    .where(eq(interviews.id, interviewId))
    .returning();
}

export async function completeInterview(
  interviewId: string,
  durationSeconds: number,
) {
  const [updated] = await db
    .update(interviews)
    .set({
      status: "completed",
      durationSeconds,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(interviews.id, interviewId))
    .returning();

  // Update invitation status
  await db
    .update(invitations)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(invitations.id, updated.invitationId));

  return updated;
}
