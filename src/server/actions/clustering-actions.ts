"use server";

import { z } from "zod";
import { getAuthenticatedUser } from "@/server/auth/middleware";
import * as clusteringService from "@/server/services/clustering";
import { clusteringParametersSchema } from "@/lib/validations/cluster";
import { revalidatePath } from "next/cache";

export async function runClustering(
  projectId: string,
  parameters: z.infer<typeof clusteringParametersSchema>,
) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const validated = clusteringParametersSchema.parse(parameters);
  const result = await clusteringService.runClustering(projectId, validated);

  revalidatePath(`/clustering`);
  revalidatePath(`/dashboard`);
  return result;
}

export async function getClusteringRun(runId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  return clusteringService.getClusteringRun(runId);
}

export async function getClusteringRuns(projectId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  return clusteringService.getClusteringRunsByProject(projectId);
}
