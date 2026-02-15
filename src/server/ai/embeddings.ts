import { embed, embedMany } from "ai";
import { getModel } from "@/server/ai/provider";

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getModel("embed") as any;

  const { embedding } = await embed({
    model,
    value: text,
  });

  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = getModel("embed") as any;

  const { embeddings } = await embedMany({
    model,
    values: texts,
  });

  return embeddings;
}
