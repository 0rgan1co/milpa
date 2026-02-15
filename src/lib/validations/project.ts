import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "closed"]).default("draft"),
  locale: z.enum(["es", "en"]).default("es"),
  demographicCategories: z.array(z.string()).default([]),
  interviewGuidelines: z.string().optional(),
});

export const createProjectSchema = projectSchema;
export const updateProjectSchema = projectSchema.partial();

export type ProjectInput = z.infer<typeof projectSchema>;
