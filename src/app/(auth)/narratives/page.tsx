"use server";

import { getAuthenticatedUser } from "@/server/auth/middleware";
import * as narrativeService from "@/server/services/narratives";
import * as projectService from "@/server/services/projects";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function NarrativesPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const user = await getAuthenticatedUser();
  if (!user) redirect("/");

  // If no projectId, get the first project available
  let targetProjectId = projectId;
  if (!targetProjectId) {
    const userProjects = await projectService.getProjectsByUser(user.uid);
    if (userProjects.length > 0) {
      targetProjectId = userProjects[0].id;
    }
  }

  if (!targetProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold">No projects found</h2>
        <p className="text-muted-foreground">
          Create a project first to see narratives.
        </p>
      </div>
    );
  }

  const narratives =
    await narrativeService.getNarrativesByProject(targetProjectId);
  const tags = await narrativeService.getTagsByProject(targetProjectId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Narratives</h1>
          <p className="text-muted-foreground">
            View and manage extracted narrative fragments.
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-2/3">Narrative Text</th>
              <th className="px-4 py-3">Sentiment</th>
              <th className="px-4 py-3">Abstraction</th>
              <th className="px-4 py-3">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {narratives.map((n) => (
              <tr key={n.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 leading-relaxed">{n.text}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      n.sentiment > 0.5
                        ? "bg-green-100 text-green-700"
                        : n.sentiment < -0.5
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700",
                    )}
                  >
                    {n.sentiment.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {n.abstraction}
                </td>
                <td className="px-4 py-3">
                  {/* Tag display logic here later */}
                  <span className="text-xs text-muted-foreground italic">
                    No tags
                  </span>
                </td>
              </tr>
            ))}
            {narratives.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No narratives extracted for this project yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
