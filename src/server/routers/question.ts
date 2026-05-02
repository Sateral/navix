import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc/init";

export const questionRouter = router({
  ask: publicProcedure
    .input(z.object({ repositoryId: z.string(), question: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const candidateFiles = await ctx.prisma.repoFile.findMany({
        where: {
          repositoryId: input.repositoryId,
          OR: [
            { role: "entry_point" },
            { role: "route" },
            { role: "api_endpoint" },
            { role: "schema" },
            { path: { contains: "package.json" } },
            { path: { contains: "next.config" } },
          ],
        },
        select: {
          id: true,
          path: true,
          role: true,
        },
        orderBy: { path: "asc" },
        take: 12,
      });

      const answer =
        candidateFiles.length > 0
          ? `I found ${candidateFiles.length} indexed files that are likely relevant. AI synthesis is not configured yet, so this answer is limited to retrieved source context.`
          : "I do not see enough indexed source evidence to answer that yet.";

      const citedFiles = candidateFiles.map((file) => ({
        filePath: file.path,
      }));

      const savedQuestion = await ctx.prisma.question.create({
        data: {
          repositoryId: input.repositoryId,
          userId: ctx.session?.user.id,
          question: input.question,
          answer,
          citedFiles,
        },
      });

      return {
        id: savedQuestion.id,
        answer,
        citations: citedFiles,
      };
    }),
});
