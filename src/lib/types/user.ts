export type UserRole = "admin" | "viewer";

export type User = {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  locale: "es" | "en";
  createdAt: Date;
  updatedAt: Date;
};

export type Tag = {
  id: string;
  projectId: string;
  name: string;
  category: string | null;
  description: string | null;
  createdAt: Date;
};

export type ShareLink = {
  id: string;
  projectId: string;
  token: string;
  scope: string;
  clusteringRunId: string | null;
  createdById: string;
  expiresAt: Date | null;
  createdAt: Date;
};
