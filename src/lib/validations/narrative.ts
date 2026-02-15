import { z } from "zod";

export const narrativeSchema = z.object({
  projectId: z.string(),
  interviewId: z.string(),
  text: z.string(),
  originalText: z.string().optional(),
  sentiment: z.number().min(-2).max(2),
  abstraction: z.number().min(1).max(4),
  isAnonymized: z.boolean().default(false),
  isLowYield: z.boolean().default(false),
});

export type NarrativeInput = z.infer<typeof narrativeSchema>;
