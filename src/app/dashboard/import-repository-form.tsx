"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GitBranch, HardDrive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";

export function ImportRepositoryForm() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<"github" | "local">("github");
  const [source, setSource] = useState("");
  const importRepo = trpc.repo.import.useMutation({
    onSuccess(repository) {
      router.push(`/repo/${repository.id}`);
      router.refresh();
    },
  });

  return (
    <form
      className="rounded-lg border border-white/10 bg-slate-900/45 p-4 shadow-2xl shadow-black/20"
      onSubmit={(event) => {
        event.preventDefault();
        importRepo.mutate({ sourceType, source });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Import repository</h2>
          <p className="mt-1 text-sm text-slate-400">
            Start with a public GitHub URL or a local path on this machine.
          </p>
        </div>
        <div className="flex rounded-md border border-white/10 bg-slate-950/70 p-1">
          <button
            className={`inline-flex h-8 items-center gap-2 rounded px-3 text-xs ${
              sourceType === "github"
                ? "bg-violet-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
            type="button"
            onClick={() => setSourceType("github")}
          >
            <GitBranch className="h-3.5 w-3.5" />
            GitHub
          </button>
          <button
            className={`inline-flex h-8 items-center gap-2 rounded px-3 text-xs ${
              sourceType === "local"
                ? "bg-violet-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
            type="button"
            onClick={() => setSourceType("local")}
          >
            <HardDrive className="h-3.5 w-3.5" />
            Local
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={source}
          onChange={(event) => setSource(event.target.value)}
          placeholder={
            sourceType === "github"
              ? "https://github.com/vercel/next.js"
              : "/home/danielkop/projects/navix"
          }
        />
        <Button className="sm:w-32" disabled={importRepo.isPending || source.length === 0} type="submit">
          {importRepo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Import
        </Button>
      </div>
      {importRepo.error ? (
        <p className="mt-3 text-sm text-red-300">{importRepo.error.message}</p>
      ) : null}
    </form>
  );
}
