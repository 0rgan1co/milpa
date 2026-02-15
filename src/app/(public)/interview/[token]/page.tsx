"use server";

import {
  getInterviewByInvitationToken,
  createInterview,
} from "@/server/services/interviews";
import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/features/interview/ChatInterface";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // 1. Validate token
  const data = await getInterviewByInvitationToken(token);
  if (!data) notFound();

  const { invitation, project, interview } = data;

  // 2. Redirect if already completed
  if (invitation.status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold">Interview Completed</h1>
        <p className="text-muted-foreground mt-2">
          Thank you for your participation. This interview is already closed.
        </p>
      </div>
    );
  }

  // 3. Initialize interview if it doesn't exist
  let currentInterview = interview;
  if (!currentInterview) {
    currentInterview = await createInterview(project.id, invitation.id);
  }

  // 4. Default themes if not set (Mocked themes for now based on project structure)
  const themeCoverage = currentInterview.themeCoverage || {
    Introduction: false,
    "Daily Workflow": false,
    "Communication Challenges": false,
    "Organizational Culture": false,
    Closing: false,
  };

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{project.name}</h2>
          <p className="text-sm text-muted-foreground">
            AI Research Interview (Anonymous)
          </p>
        </div>
      </div>

      <ChatInterface
        token={token}
        initialMessages={currentInterview.transcript as any[]}
        themeCoverage={themeCoverage}
        locale={project.locale}
      />
    </div>
  );
}
