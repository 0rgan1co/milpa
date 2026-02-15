"use server";

import { z } from "zod";
import { getAuthenticatedUser } from "@/server/auth/middleware";
import * as invitationService from "@/server/services/invitations";
import {
  createInvitationSchema,
  bulkCreateInvitationsSchema,
} from "@/lib/validations/invitation";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";

export async function createInvitation(
  input: z.infer<typeof createInvitationSchema>,
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const validated = createInvitationSchema.parse(input);
  const invitation = await invitationService.createInvitation(
    validated.projectId,
    validated.email,
    validated.categoryValues,
  );

  revalidatePath(`/projects/${validated.projectId}/invitations`);
  return invitation;
}

export async function bulkCreateInvitations(
  input: z.infer<typeof bulkCreateInvitationsSchema>,
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const validated = bulkCreateInvitationsSchema.parse(input);

  // Simple CSV parsing
  const results = Papa.parse(validated.csvData, { header: true });
  const data = results.data
    .map((row: any) => ({
      email: row.email,
      categoryValues: row, // Everything else as categories for simplicity
    }))
    .filter((item) => item.email);

  const created = await invitationService.bulkCreateInvitations(
    validated.projectId,
    data,
  );

  revalidatePath(`/projects/${validated.projectId}/invitations`);
  return { count: created.length };
}
