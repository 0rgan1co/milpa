"use server";

import { getAuthenticatedUser } from "@/server/auth/middleware";
import * as projectService from "@/server/services/projects";
import * as clusteringService from "@/server/services/clustering";
import { redirect } from "next/navigation";
import { ClusteringControls } from "./clustering-controls";

export default async function ClusteringPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; runId?: string }>;
}) {
  const { projectId, runId } = await searchParams;
  const user = await getAuthenticatedUser();
  if (!user) redirect("/");

  // Get active project
  let targetProjectId = projectId;
  if (!targetProjectId) {
    const userProjects = await projectService.getProjectsByUser(user.uid);
    if (userProjects.length > 0) {
      targetProjectId = userProjects[0].id;
    }
  }

  if (!targetProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-xl font-semibold">No projects found</h2>
        <p className="text-muted-foreground mt-2">
          Create a project first to use clustering.
        </p>
      </div>
    );
  }

  // Get latest run or specific run
  let run = null;
  if (runId) {
    run = await clusteringService.getClusteringRun(runId);
  } else {
    const runs =
      await clusteringService.getClusteringRunsByProject(targetProjectId);
    if (runs.length > 0) {
      run = await clusteringService.getClusteringRun(runs[runs.length - 1].id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Semantic Clustering</h1>
          <p className="text-muted-foreground">
            Discover patterns and themes using AI-powered clustering.
          </p>
        </div>
      </div>

      <ClusteringControls projectId={targetProjectId} initialRun={run as any} />
    </div>
  );
}
