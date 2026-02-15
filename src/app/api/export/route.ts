import {
  generateNarrativeCSV,
  generateClusterCSV,
} from "@/server/services/export";
import { z } from "zod";

const exportSchema = z.object({
  projectId: z.string(),
  type: z.enum(["csv", "pdf"]),
  scope: z.enum(["narratives", "clusters"]),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { projectId, type, scope } = exportSchema.parse({
      projectId: searchParams.get("projectId"),
      type: searchParams.get("type"),
      scope: searchParams.get("scope"),
    });

    if (type === "pdf") {
      return new Response("PDF export coming soon", { status: 501 });
    }

    let csv = "";
    if (scope === "narratives") {
      csv = await generateNarrativeCSV(projectId);
    } else {
      csv = await generateClusterCSV(projectId);
    }

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="milpa-${scope}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
