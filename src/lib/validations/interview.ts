import { z } from "zod";

export const messageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string(),
  timestamp: z.string(),
});

export const interviewSchema = z.object({
  projectId: z.string(),
  invitationId: z.string(),
  transcript: z.array(messageSchema).default([]),
  status: z
    .enum(["in_progress", "completed", "abandoned"])
    .default("in_progress"),
  themeCoverage: z.record(z.string(), z.boolean()).default({}),
  durationSeconds: z.number().int().optional(),
});

export type Message = z.infer<typeof messageSchema>;
export type InterviewInput = z.infer<typeof interviewSchema>;
