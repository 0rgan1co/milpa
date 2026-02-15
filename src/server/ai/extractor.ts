import { z } from "zod";

export const extractedNarrativeSchema = z.object({
  text: z.string().describe("The anonymized text of the narrative fragment."),
  originalText: z.string().describe("The original text from the transcript."),
  sentiment: z
    .number()
    .min(-2)
    .max(2)
    .describe("Sentiment score from -2 (very negative) to +2 (very positive)."),
  abstraction: z
    .number()
    .min(1)
    .max(4)
    .describe(
      "Abstraction level: 1 (concrete story), 2 (example), 3 (pattern), 4 (high-level opinion).",
    ),
});

export const extractionResponseSchema = z.object({
  narratives: z.array(extractedNarrativeSchema),
  isLowYield: z
    .boolean()
    .describe(
      "True if the interview produced fewer than 10 high-quality narratives.",
    ),
});

export function constructExtractionPrompt(
  transcript: any[],
  locale: "es" | "en",
): string {
  const transcriptText = transcript
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const languagePrompt =
    locale === "es"
      ? "Extrae las narrativas en ESPAÑOL."
      : "Extract narratives in ENGLISH.";

  return `
You are an expert qualitative data analyst. Your task is to extract meaningful "narrative fragments" from the provided organizational interview transcript.

A narrative fragment is a specific story, example, or observation shared by the participant.

GUIDELINES:
1. Break down the transcript into atomic units of meaning.
2. Focus on "stories" and "concrete examples" (Abstraction 1-2).
3. Include high-level opinions only if they reveal deep cultural patterns (Abstraction 3-4).
4. ANONYMIZE the "text" field: Replace all names of people, specific projects, and highly identifying details with placeholders like [NAME], [PROJECT], [CLIENT]. The "originalText" field should remain untouched.
5. Score sentiment from -2.0 (total frustration/anger) to +2.0 (total inspiration/joy).
6. Score abstraction:
   - 1: A specific "one-time" event or story.
   - 2: A recurring example or behavior.
   - 3: A perceived pattern or cultural norm.
   - 4: A general opinion or abstract belief.

TRANSCRIPT:
${transcriptText}

${languagePrompt}
Return the narratives in the specified structured format.
  `;
}
