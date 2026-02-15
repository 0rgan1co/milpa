"use server";

import { z } from "zod";
import { getAuthenticatedUser } from "@/server/auth/middleware";
import * as projectService from "@/server/services/projects";
import * as shareLinkService from "@/server/services/share-links";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validations/project";
import { revalidatePath } from "next/cache";

export async function createProject(
  input: z.infer<typeof createProjectSchema>,
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const validated = createProjectSchema.parse(input);
  const project = await projectService.createProject(user.uid, validated);

  revalidatePath("/projects");
  return project;
}

export async function updateProject(
  projectId: string,
  input: z.infer<typeof updateProjectSchema>,
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const validated = updateProjectSchema.parse(input);
  const project = await projectService.updateProject(
    projectId,
    user.uid,
    validated,
  );

  revalidatePath(`/projects/${projectId}`);
  return project;
}

export async function deleteProject(projectId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  await projectService.deleteProject(projectId, user.uid);

  revalidatePath("/projects");
  return { success: true };
}

export async function addCollaborator(projectId: string, email: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const result = await projectService.addCollaborator(projectId, email);
  revalidatePath(`/projects/${projectId}/settings`);
  return result;
}

export async function removeCollaborator(projectId: string, userId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  await projectService.removeCollaborator(projectId, userId);
  revalidatePath(`/projects/${projectId}/settings`);
  return { success: true };
}

export async function createShareLink(
  projectId: string,
  scope: string,
  expiresAt?: Date,
  clusteringRunId?: string,
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const result = await shareLinkService.createShareLink(
    projectId,
    user.uid,
    scope,
    expiresAt,
    clusteringRunId,
  );
  revalidatePath(`/projects/${projectId}/settings`);
  return result;
}

export async function deleteShareLink(projectId: string, linkId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  await shareLinkService.deleteShareLink(linkId);
  revalidatePath(`/projects/${projectId}/settings`);
  return { success: true };
}
