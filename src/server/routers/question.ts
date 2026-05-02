import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc/init";
import { askRepoQuestion } from "@/server/services/question-service";

export const questionRouter = router({
  ask: publicProcedure
    .input(z.object({ repositoryId: z.string(), question: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const answer = await askRepoQuestion(
        {
          ...input,
          userId: ctx.session?.user.id,
        },
        ctx.prisma,
      );

      return {
        id: answer.id,
        answer: answer.content,
        citations: answer.citations,
      };
    }),
});
