"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

export function QuestionBox({ repositoryId }: { repositoryId: string }) {
  const [question, setQuestion] = useState("What's the entry point?");
  const [answer, setAnswer] = useState<{
    answer: string;
    citations: Array<{ filePath: string }>;
  } | null>(null);
  const askQuestion = trpc.question.ask.useMutation({
    onSuccess(data) {
      setAnswer(data);
    },
  });

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/65 p-3">
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs text-slate-400">
        <span className="font-medium text-violet-200">Ask a question</span>
        <span>Recent</span>
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          askQuestion.mutate({ repositoryId, question });
        }}
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="h-10 flex-1 rounded-md border border-violet-400/30 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-violet-500/20"
        />
        <Button disabled={askQuestion.isPending || question.length === 0} type="submit">
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
      {answer ? (
        <div className="mt-4 border-t border-white/10 pt-3 text-sm text-slate-300">
          <p>{answer.answer}</p>
          <p className="mt-3 text-xs text-slate-500">
            Sources: {answer.citations.map((citation) => citation.filePath).join(", ") || "none"}
          </p>
        </div>
      ) : null}
      {askQuestion.error ? (
        <p className="mt-3 text-sm text-red-300">{askQuestion.error.message}</p>
      ) : null}
    </div>
  );
}
