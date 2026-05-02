import type { PrismaClient } from "@/generated/prisma/client";
import { createAIService, type AIService } from "@/lib/ai/ai-service";
import { buildGroundedPrompt } from "@/lib/ai/prompt-builder";
import type { GroundedAnswer, SourceContext } from "@/lib/ai/types";
import { prisma } from "@/lib/db/prisma";

const PROMPT_VERSION = "file-explanation-v1";

export async function explainFile(
  input: { repositoryId: string; fileId: string },
  db: PrismaClient = prisma,
  ai: AIService = createAIService(),
): Promise<GroundedAnswer> {
  const file = await db.repoFile.findFirst({
    where: {
      id: input.fileId,
      repositoryId: input.repositoryId,
    },
    select: {
      id: true,
      path: true,
      content: true,
      symbols: {
        select: {
          name: true,
          kind: true,
          startLine: true,
          endLine: true,
          signature: true,
        },
        orderBy: { startLine: "asc" },
      },
    },
  });

  if (!file) {
    return {
      content: "I could not find that file in this repository index.",
      citations: [],
    };
  }

  const context = toSourceContext(file.path, file.content);
  const prompt = buildGroundedPrompt({
    task:
      "Explain the purpose of this file, important symbols, related risks, and what to understand before modifying it.",
    contexts: [context],
  });

  const answer = await ai.generateGroundedAnswer(prompt);

  await db.explanationCache.create({
    data: {
      repositoryId: input.repositoryId,
      targetType: "file",
      targetId: file.id,
      promptVersion: PROMPT_VERSION,
      content: answer.content,
      citations: answer.citations,
    },
  });

  return answer;
}

function toSourceContext(filePath: string, content: string): SourceContext {
  const lines = content.split(/\r?\n/).slice(0, 200);

  return {
    filePath,
    startLine: 1,
    endLine: lines.length,
    content: lines.join("\n"),
  };
}
