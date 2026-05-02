import { createCallerFactory, router } from "@/server/trpc/init";
import { explanationRouter } from "@/server/routers/explanation";
import { questionRouter } from "@/server/routers/question";
import { repoRouter } from "@/server/routers/repo";

export const appRouter = router({
  repo: repoRouter,
  explanation: explanationRouter,
  question: questionRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
