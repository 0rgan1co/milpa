"use server";

import { getAuthenticatedUser } from "@/server/auth/middleware";
import * as projectService from "@/server/services/projects";
import * as invitationService from "@/server/services/invitations";
import { notFound } from "next/navigation";
import { InvitationList } from "./invitation-list";

export default async function ProjectInvitationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");

  const project = await projectService.getProjectById(id, user.uid);
  if (!project) notFound();

  const invitations = await invitationService.getInvitationsByProject(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name} - Invitations</h1>
        <p className="text-muted-foreground">
          Manage employee invitations and view status.
        </p>
      </div>

      <InvitationList projectId={id} initialInvitations={invitations} />
    </div>
  );
}
