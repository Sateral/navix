import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc/init";
import { explainFile } from "@/server/services/explanation-service";

export const explanationRouter = router({
  explainFile: publicProcedure
    .input(z.object({ repositoryId: z.string(), fileId: z.string() }))
    .mutation(({ ctx, input }) => explainFile(input, ctx.prisma)),
});
