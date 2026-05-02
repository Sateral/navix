import type { PrismaClient } from "@/generated/prisma/client";
import { createAIService, type AIService } from "@/lib/ai/ai-service";
import { buildGroundedPrompt } from "@/lib/ai/prompt-builder";
import type { GroundedAnswer, SourceContext } from "@/lib/ai/types";
import { prisma } from "@/lib/db/prisma";

type AskRepoQuestionInput = {
  repositoryId: string;
  userId?: string | null;
  question: string;
};

export async function askRepoQuestion(
  input: AskRepoQuestionInput,
  db: PrismaClient = prisma,
  ai: AIService = createAIService(),
): Promise<GroundedAnswer & { id: string }> {
  const files = await db.repoFile.findMany({
    where: {
      repositoryId: input.repositoryId,
      OR: [
        { role: "entry_point" },
        { role: "route" },
        { role: "api_endpoint" },
        { role: "schema" },
        { role: "config" },
        { path: { contains: "auth" } },
        { path: { contains: "package.json" } },
        { path: { contains: "next.config" } },
      ],
    },
    select: {
      path: true,
      content: true,
    },
    orderBy: { path: "asc" },
    take: 8,
  });

  if (files.length === 0) {
    const savedQuestion = await db.question.create({
      data: {
        repositoryId: input.repositoryId,
        userId: input.userId ?? null,
        question: input.question,
        answer: "I do not see enough indexed source evidence to answer that yet.",
        citedFiles: [],
      },
    });

    return {
      id: savedQuestion.id,
      content: savedQuestion.answer,
      citations: [],
    };
  }

  const contexts = files.map<SourceContext>((file) => {
    const lines = file.content.split(/\r?\n/).slice(0, 120);

    return {
      filePath: file.path,
      startLine: 1,
      endLine: lines.length,
      content: lines.join("\n"),
    };
  });

  const prompt = buildGroundedPrompt({
    task: "Answer the repository question using only source-grounded context.",
    question: input.question,
    contexts,
  });

  const answer = await ai.generateGroundedAnswer(prompt);
  const savedQuestion = await db.question.create({
    data: {
      repositoryId: input.repositoryId,
      userId: input.userId ?? null,
      question: input.question,
      answer: answer.content,
      citedFiles: answer.citations,
    },
  });

  return {
    id: savedQuestion.id,
    ...answer,
  };
}
