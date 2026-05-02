import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc/init";

export const explanationRouter = router({
  explainFile: publicProcedure
    .input(z.object({ repositoryId: z.string(), fileId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.prisma.repoFile.findFirst({
        where: {
          id: input.fileId,
          repositoryId: input.repositoryId,
        },
        select: {
          id: true,
          path: true,
          role: true,
          summary: true,
          symbols: {
            select: {
              name: true,
              kind: true,
              startLine: true,
              endLine: true,
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

      return {
        content:
          file.summary ??
          `This ${file.role} file has ${file.symbols.length} indexed symbols. AI explanation is not configured yet, so this response is limited to indexed metadata.`,
        citations: [{ filePath: file.path }],
      };
    }),
});
