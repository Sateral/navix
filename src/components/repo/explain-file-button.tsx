"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

export function ExplainFileButton({
  repositoryId,
  fileId,
}: {
  repositoryId: string;
  fileId: string;
}) {
  const [answer, setAnswer] = useState<string | null>(null);
  const explainFile = trpc.explanation.explainFile.useMutation({
    onSuccess(data) {
      setAnswer(data.content);
    },
  });

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/65 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">File explanation</h3>
          <p className="mt-1 text-xs text-slate-500">
            Generates from indexed source context and stores citations.
          </p>
        </div>
        <Button
          disabled={explainFile.isPending}
          onClick={() => explainFile.mutate({ repositoryId, fileId })}
          variant="secondary"
        >
          <Sparkles className="h-4 w-4" />
          Explain
        </Button>
      </div>
      {answer ? <p className="mt-3 text-sm text-slate-300">{answer}</p> : null}
      {explainFile.error ? (
        <p className="mt-3 text-sm text-red-300">{explainFile.error.message}</p>
      ) : null}
    </div>
  );
}
