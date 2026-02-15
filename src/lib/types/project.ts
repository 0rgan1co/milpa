export type ProjectStatus = "draft" | "active" | "closed";
export type Locale = "es" | "en";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  locale: Locale;
  demographicCategories: string[];
  interviewGuidelines: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectCollaborator = {
  id: string;
  projectId: string;
  userId: string;
  createdAt: Date;
};
