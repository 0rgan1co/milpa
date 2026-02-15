import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";

// Configuration for primary/fallback
const PRIMARY_PROVIDER = "google";
const FALLBACK_PROVIDER = "anthropic";

export function getModel(operation: "chat" | "extract" | "embed") {
  if (operation === "embed") {
    // google text-embedding-004 is primary for embeddings
    return google.textEmbeddingModel("text-embedding-004");
  }

  // For chat and extract, use flash models for primary
  const primaryModel = google("gemini-2.0-flash");
  const fallbackModel = anthropic("claude-3-5-sonnet-20241022");

  return {
    primary: primaryModel,
    fallback: fallbackModel,
  };
}

// Helper to handle retries and fallback
export async function withAI<T>(
  operation: (model: any) => Promise<T>,
  type: "chat" | "extract" | "embed",
): Promise<T> {
  const models = getModel(type);

  if (type === "embed") {
    return operation(models);
  }

  const { primary, fallback } = models as { primary: any; fallback: any };

  try {
    // Attempt primary with 3 retries (implicitly handled by some SDKs or manually here)
    // For simplicity in this base implementation, we'll just try primary then fallback
    return await operation(primary);
  } catch (primaryError) {
    console.warn(
      "Primary AI provider failed, attempting fallback...",
      primaryError,
    );
    try {
      return await operation(fallback);
    } catch (fallbackError) {
      console.error("Both AI providers failed:", fallbackError);
      throw new Error("AI_PROVIDER_UNAVAILABLE");
    }
  }
}
