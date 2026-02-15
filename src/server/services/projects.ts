import { db } from "@/server/db";
import { projects, projectCollaborators, users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { ProjectInput } from "@/lib/validations/project";

export async function createProject(ownerId: string, input: ProjectInput) {
  const [project] = await db
    .insert(projects)
    .values({
      ...input,
      ownerId,
    })
    .returning();
  return project;
}

export async function getProjectById(projectId: string, userId: string) {
  // Owner access
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.ownerId, userId)),
  });

  if (project) return project;

  // Check collaborators
  const collaborator = await db.query.projectCollaborators.findFirst({
    where: and(
      eq(projectCollaborators.projectId, projectId),
      eq(projectCollaborators.userId, userId),
    ),
  });

  if (collaborator) {
    return db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });
  }

  return null;
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: Partial<ProjectInput>,
) {
  // Verify access first (owner or collaborator)
  const project = await getProjectById(projectId, userId);
  if (!project) throw new Error("Unauthorized");

  const [updated] = await db
    .update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning();

  return updated;
}

export async function deleteProject(projectId: string, userId: string) {
  // Only owner can delete
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.ownerId, userId)),
  });

  if (!project) throw new Error("Unauthorized");

  await db.delete(projects).where(eq(projects.id, projectId));
  return { success: true };
}

export async function getProjectsByUser(userId: string) {
  // Get owned projects
  const owned = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, userId));

  // Get collaborated projects
  const collaborated = await db
    .select({
      project: projects,
    })
    .from(projects)
    .innerJoin(
      projectCollaborators,
      eq(projects.id, projectCollaborators.projectId),
    )
    .where(eq(projectCollaborators.userId, userId));

  return [...owned, ...collaborated.map((c) => c.project)];
}

export async function addCollaborator(projectId: string, email: string) {
  // 1. Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) throw new Error("USER_NOT_FOUND");

  // 2. Add as collaborator
  const [collaborator] = await db
    .insert(projectCollaborators)
    .values({
      projectId,
      userId: user.id,
    })
    .returning();

  return collaborator;
}

export async function removeCollaborator(projectId: string, userId: string) {
  await db
    .delete(projectCollaborators)
    .where(
      and(
        eq(projectCollaborators.projectId, projectId),
        eq(projectCollaborators.userId, userId),
      ),
    );
  return { success: true };
}

export async function getCollaborators(projectId: string) {
  return db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
    })
    .from(users)
    .innerJoin(projectCollaborators, eq(users.id, projectCollaborators.userId))
    .where(eq(projectCollaborators.projectId, projectId));
}
