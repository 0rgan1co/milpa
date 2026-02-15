"use server";

import { getAuthenticatedUser } from "@/server/auth/middleware";
import * as projectService from "@/server/services/projects";
import { notFound, redirect } from "next/navigation";
import { CollaboratorManager } from "./collaborator-manager";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const project = await projectService.getProjectById(id, user.uid);
  if (!project) notFound();

  // Only owner can access settings for now (simplification)
  if (project.ownerId !== user.uid) {
    redirect(`/projects/${id}`);
  }

  const collaborators = await projectService.getCollaborators(id);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage project details and team access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">General</h2>
          {/* Project update form could go here */}
          <div className="p-12 border-2 border-dashed rounded-xl text-center text-muted-foreground text-sm italic">
            General settings editor coming soon.
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Team & Collaboration</h2>
          <CollaboratorManager projectId={id} collaborators={collaborators} />
        </div>
      </div>
    </div>
  );
}
