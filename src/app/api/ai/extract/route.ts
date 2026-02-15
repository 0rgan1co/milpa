import { generateObject } from "ai";
import { getModel, withAI } from "@/server/ai/provider";
import {
  constructExtractionPrompt,
  extractionResponseSchema,
} from "@/server/ai/extractor";
import { generateEmbeddings } from "@/server/ai/embeddings";
import { db } from "@/server/db";
import { interviews } from "@/server/db/schema";
import { bulkCreateNarratives } from "@/server/services/narratives";
import { eq } from "drizzle-orm";
import { z } from "zod";

const extractSchema = z.object({
  interviewId: z.string(),
  locale: z.enum(["es", "en"]),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { interviewId, locale } = extractSchema.parse(json);

    // 1. Get interview transcript
    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        project: true,
      },
    });

    if (!interview) {
      return new Response("Interview not found", { status: 404 });
    }

    // 2. AI Extraction
    const systemPrompt = constructExtractionPrompt(
      interview.transcript as any[],
      locale,
    );

    const extractionResult = await withAI(async (model) => {
      return generateObject({
        model,
        schema: extractionResponseSchema,
        prompt: systemPrompt,
      });
    }, "extract");

    const { narratives: extractedNarratives, isLowYield } =
      extractionResult.object;

    if (extractedNarratives.length === 0) {
      return Response.json({ success: true, count: 0 });
    }

    // 3. Generate Embeddings
    const texts = extractedNarratives.map((n) => n.text);
    const embeddings = await generateEmbeddings(texts);

    // 4. Store Narratives
    const narrativesToInsert = extractedNarratives.map((n, i) => ({
      projectId: interview.projectId,
      interviewId,
      text: n.text,
      originalText: n.originalText,
      sentiment: n.sentiment,
      abstraction: n.abstraction,
      embedding: embeddings[i],
      isAnonymized: true,
      isLowYield,
    }));

    await bulkCreateNarratives(narrativesToInsert);

    return Response.json({
      success: true,
      count: narrativesToInsert.length,
      isLowYield,
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
