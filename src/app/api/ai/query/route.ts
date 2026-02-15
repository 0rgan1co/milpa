import { streamText } from "ai";
import { getModel, withAI } from "@/server/ai/provider";
import { generateEmbedding } from "@/server/ai/embeddings";
import { searchSimilarNarratives } from "@/server/services/narratives";
import { db } from "@/server/db";
import { projects, clusters, clusteringRuns } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const querySchema = z.object({
  projectId: z.string(),
  query: z.string(),
  locale: z.enum(["es", "en"]).default("es"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { projectId, query, locale } = querySchema.parse(json);

    // 1. Get project context
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return new Response("Project not found", { status: 404 });
    }

    // 2. Embed the query
    const embedding = await generateEmbedding(query);

    // 3. Search similar narratives
    const similarNarratives = await searchSimilarNarratives(
      projectId,
      embedding,
      20,
    );

    // 4. Get latest clusters for context
    const latestRun = await db.query.clusteringRuns.findFirst({
      where: eq(clusteringRuns.projectId, projectId),
      orderBy: [desc(clusteringRuns.createdAt)],
      with: {
        clusters: true,
      },
    });

    const clusterContext =
      latestRun?.clusters.map((c) => `- ${c.name}: ${c.summary}`).join("\n") ||
      "No clusters discovered yet.";

    // 5. Construct AI Prompt
    const languagePrompt =
      locale === "es" ? "Responde en ESPAÑOL." : "Respond in ENGLISH.";

    const systemPrompt = `
You are an expert organizational consultant analyzing data from the project "${project.name}".
Your goal is to answer the user's query based on the narratives and clusters extracted from employee interviews.

CONTEXT - DISCOVERED THEMES:
${clusterContext}

CONTEXT - RELEVANT NARRATIVES (TOP 20):
${similarNarratives.map((n, i) => `${i + 1}. [Sentiment: ${n.sentiment.toFixed(1)}] ${n.text}`).join("\n")}

INSTRUCTIONS:
1. Base your answer STRICTLY on the provided context.
2. If you don't know the answer, say you don't have enough data.
3. Use a professional, analytical tone.
4. Cite specific narratives or themes when possible.
5. NEVER reveal names or identifying details (all data is already anonymized).

${languagePrompt}
    `;

    // 6. Stream Response
    const { primary } = getModel("chat") as { primary: any };

    const result = streamText({
      model: primary,
      system: systemPrompt,
      messages: [{ role: "user", content: query }],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Analytic query error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
