import { streamText } from "ai";
import { getModel } from "@/server/ai/provider";
import { constructInterviewerPrompt } from "@/server/ai/interviewer";
import {
  getInterviewByInvitationToken,
  updateTranscript,
} from "@/server/services/interviews";
import { z } from "zod";

const chatSchema = z.object({
  token: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
  themeCoverage: z.record(z.string(), z.boolean()),
  locale: z.enum(["es", "en"]),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { token, messages, themeCoverage, locale } = chatSchema.parse(json);

    // Validate token and get context
    const data = await getInterviewByInvitationToken(token);
    if (
      !data ||
      data.invitation.status === "completed" ||
      data.invitation.status === "expired"
    ) {
      return new Response("Unauthorized or expired interview", { status: 401 });
    }

    const { project, interview } = data;

    // Construct system prompt
    const systemPrompt = constructInterviewerPrompt({
      projectName: project.name,
      projectDescription: project.description || undefined,
      interviewGuidelines: project.interviewGuidelines || undefined,
      themeCoverage,
      locale,
    });

    // Get primary model (Gemini)
    const { primary } = getModel("chat") as { primary: any };

    const result = streamText({
      model: primary,
      system: systemPrompt,
      messages: messages as any[],
      onFinish: async ({ text }) => {
        if (interview) {
          const updatedTranscript = [
            ...messages,
            {
              role: "assistant",
              content: text,
              timestamp: new Date().toISOString(),
            },
          ];
          await updateTranscript(
            interview.id,
            updatedTranscript as any,
            themeCoverage,
          );
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
