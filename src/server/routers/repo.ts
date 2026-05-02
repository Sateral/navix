import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc/init";
import { importRepository } from "@/server/services/indexing-service";

export const repoRouter = router({
  import: publicProcedure
    .input(
      z.object({
        sourceType: z.enum(["local", "github"]),
        source: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) => {
      return importRepository({
        ...input,
        userId: ctx.session?.user.id,
      });
    }),
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.repository.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            files: true,
            symbols: true,
            routes: true,
          },
        },
      },
    });
  }),
  byId: publicProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.repository.findUnique({
      where: { id: input.id },
      include: {
        _count: {
          select: {
            files: true,
            symbols: true,
            routes: true,
          },
        },
      },
    });
  }),
  fileTree: publicProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.repoFile.findMany({
        where: { repositoryId: input.repositoryId },
        select: {
          id: true,
          path: true,
          role: true,
          language: true,
          size: true,
        },
        orderBy: { path: "asc" },
      });
    }),
  fileById: publicProcedure
    .input(z.object({ repositoryId: z.string(), fileId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.repoFile.findFirst({
        where: {
          id: input.fileId,
          repositoryId: input.repositoryId,
        },
        include: {
          symbols: {
            orderBy: [{ startLine: "asc" }, { name: "asc" }],
          },
          importsFrom: {
            include: {
              toFile: {
                select: { id: true, path: true },
              },
            },
          },
          routes: true,
        },
      });
    }),
});
