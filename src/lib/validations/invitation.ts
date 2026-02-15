import { z } from "zod";

export const invitationSchema = z.object({
  projectId: z.string(),
  email: z.string().email("Invalid email address"),
  categoryValues: z.record(z.string(), z.string()).default({}),
  expiresAt: z.string().optional().nullable(),
});

export const createInvitationSchema = invitationSchema;
export const bulkCreateInvitationsSchema = z.object({
  projectId: z.string(),
  csvData: z.string(),
});

export type InvitationInput = z.infer<typeof invitationSchema>;
