import { db } from "@/server/db";
import { invitations } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

type InvitationStatus = NonNullable<typeof invitations.$inferInsert.status>;

async function sendWithBrevo(to: string, subject: string, htmlContent: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is missing");
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "no-reply@milpa.app";
  const senderName = process.env.BREVO_SENDER_NAME ?? "Milpa";

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo email send failed: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function sendInvitationEmail(invitationId: string) {
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.id, invitationId),
    with: {
      project: true,
    },
  });

  if (!invitation) throw new Error("Invitation not found");

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/interview/${invitation.token}`;

  return sendWithBrevo(
    invitation.email,
    `Invitation to participate in ${invitation.project.name}`,
    `<p>You have been invited to participate in an organizational discovery project: <strong>${invitation.project.name}</strong>.</p><p>Please click the following link to start your anonymous AI interview: <a href="${url}">${url}</a></p>`,
  );
}

export async function createInvitation(
  projectId: string,
  email: string,
  categoryValues: Record<string, string> = {},
) {
  const token = generateToken();
  const [invitation] = await db
    .insert(invitations)
    .values({
      projectId,
      email,
      token,
      categoryValues,
    })
    .returning();
  return invitation;
}

export async function bulkCreateInvitations(
  projectId: string,
  data: Array<{ email: string; categoryValues: Record<string, string> }>,
) {
  const values = data.map((item) => ({
    projectId,
    email: item.email,
    token: generateToken(),
    categoryValues: item.categoryValues,
  }));

  return db.insert(invitations).values(values).returning();
}

export async function getInvitationsByProject(projectId: string) {
  return db
    .select()
    .from(invitations)
    .where(eq(invitations.projectId, projectId));
}

export async function getInvitationByToken(token: string) {
  return db.query.invitations.findFirst({
    where: eq(invitations.token, token),
    with: {
      project: true,
    },
  });
}

export async function updateInvitationStatus(
  id: string,
  status: InvitationStatus,
) {
  return db
    .update(invitations)
    .set({ status, updatedAt: new Date() })
    .where(eq(invitations.id, id))
    .returning();
}
