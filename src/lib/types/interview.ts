export type MessageRole = "assistant" | "user";
export type InterviewStatus = "in_progress" | "completed" | "abandoned";

export type Message = {
  role: MessageRole;
  content: string;
  timestamp: string;
};

export type Interview = {
  id: string;
  projectId: string;
  invitationId: string;
  transcript: Message[];
  status: InterviewStatus;
  themeCoverage: Record<string, boolean>;
  durationSeconds: number | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InvitationStatus =
  | "sent"
  | "opened"
  | "in_progress"
  | "completed"
  | "expired";

export type Invitation = {
  id: string;
  projectId: string;
  email: string;
  token: string;
  status: InvitationStatus;
  categoryValues: Record<string, string>;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
