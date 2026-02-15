import { generateObject } from "ai";
import { getModel, withAI } from "@/server/ai/provider";
import { z } from "zod";

export const clusterDescriptionSchema = z.object({
  name: z
    .string()
    .describe(
      'A concise, descriptive name for the cluster (e.g., "Tension: Lack of leadership clarity").',
    ),
  summary: z
    .string()
    .describe("A 2-3 sentence summary of the themes found in this cluster."),
});

export async function describeCluster(
  narratives: string[],
  locale: "es" | "en",
) {
  const languagePrompt =
    locale === "es" ? "Responde en ESPAÑOL." : "Respond in ENGLISH.";

  const prompt = `
You are an expert organizational consultant and qualitative researcher.
Your task is to analyze a group of semantically similar "narrative fragments" extracted from employee interviews and provide a descriptive name and summary for this cluster.

NARRATIVE FRAGMENTS:
${narratives.map((n) => `- ${n}`).join("\n")}

GUIDELINES:
1. The name should capture the core tension, pattern, or theme.
2. If the cluster is about a specific problem, be direct but professional.
3. If the cluster is mixed, find the strongest common thread.
4. The summary should explain WHY these narratives belong together.

${languagePrompt}
Return the description in the specified structured format.
  `;

  const result = await withAI(async (model) => {
    return generateObject({
      model,
      schema: clusterDescriptionSchema,
      prompt,
    });
  }, "extract");

  return result.object;
}
