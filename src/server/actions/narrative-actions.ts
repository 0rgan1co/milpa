"use server";

import { z } from "zod";
import { getAuthenticatedUser } from "@/server/auth/middleware";
import * as narrativeService from "@/server/services/narratives";
import { narrativeSchema } from "@/lib/validations/narrative";
import { revalidatePath } from "next/cache";

export async function updateNarrative(
  id: string,
  input: z.infer<typeof narrativeSchema>,
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const validated = narrativeSchema.partial().parse(input);
  const narrative = await narrativeService.updateNarrative(id, validated);

  revalidatePath("/narratives");
  return narrative;
}

export async function addTag(narrativeId: string, tagId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  await narrativeService.addTagToNarrative(narrativeId, tagId);
  revalidatePath("/narratives");
  return { success: true };
}

export async function removeTag(narrativeId: string, tagId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  await narrativeService.removeTagFromNarrative(narrativeId, tagId);
  revalidatePath("/narratives");
  return { success: true };
}

export async function createTag(
  projectId: string,
  name: string,
  category?: string,
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const tag = await narrativeService.createTag(projectId, name, category);
  revalidatePath("/narratives");
  return tag;
}
