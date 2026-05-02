import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, GitBranch, Search, ShieldQuestion } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CodeViewer } from "@/components/repo/code-viewer";
import { FileInspector } from "@/components/repo/file-inspector";
import { FileTree } from "@/components/repo/file-tree";
import { QuestionBox } from "@/components/repo/question-box";
import { StackDetectionStrip } from "@/components/repo/stack-detection-strip";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ repoId: string }>;
  searchParams: Promise<{ fileId?: string }>;
};

type StackDetection = {
  name: string;
  version: string | null;
  confidence: number;
  evidence: string[];
};

export default async function RepositoryWorkspacePage({ params, searchParams }: PageProps) {
  const { repoId } = await params;
  const { fileId } = await searchParams;

  const repository = await prisma.repository.findUnique({
    where: { id: repoId },
    include: {
      files: {
        select: {
          id: true,
          path: true,
          role: true,
          language: true,
          size: true,
        },
        orderBy: { path: "asc" },
      },
      _count: {
        select: {
          files: true,
          symbols: true,
          routes: true,
        },
      },
    },
  });

  if (!repository) {
    notFound();
  }

  const selectedFileId = fileId ?? repository.files[0]?.id;
  const selectedFile = selectedFileId
    ? await prisma.repoFile.findFirst({
        where: {
          id: selectedFileId,
          repositoryId: repository.id,
        },
        include: {
          importsFrom: {
            include: {
              toFile: {
                select: {
                  id: true,
                  path: true,
                },
              },
            },
            orderBy: { importPath: "asc" },
          },
          routes: true,
          symbols: {
            orderBy: [{ startLine: "asc" }, { name: "asc" }],
          },
        },
      })
    : null;

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col gap-3 p-3 lg:p-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/65 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 hover:text-white"
            >
              Repositories
            </Link>
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white">
              {repository.owner}/{repository.name}
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>
            <Badge>
              <GitBranch className="mr-1 h-3.5 w-3.5" />
              {repository.defaultBranch ?? "local"}
            </Badge>
            <Badge className="capitalize">{repository.status}</Badge>
          </div>
          <div className="hidden h-9 w-full max-w-sm items-center gap-2 rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-500 md:flex">
            <Search className="h-4 w-4" />
            Search anything...
          </div>
        </header>

        <StackDetectionStrip stack={toStackDetection(repository.detectedStack)} />

        <div className="grid min-h-[calc(100vh-13rem)] gap-3 xl:grid-cols-[18rem_minmax(0,1fr)_25rem]">
          <section className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/45">
            <FileTree
              files={repository.files}
              repoId={repository.id}
              selectedFileId={selectedFile?.id}
            />
          </section>

          <section className="flex min-w-0 flex-col gap-3">
            {selectedFile ? (
              <CodeViewer
                content={selectedFile.content}
                language={selectedFile.language}
                path={selectedFile.path}
              />
            ) : (
              <div className="grid min-h-[34rem] place-items-center rounded-lg border border-white/10 bg-slate-950/65 text-sm text-slate-500">
                No indexed files available.
              </div>
            )}
            <QuestionBox repositoryId={repository.id} />
          </section>

          <FileInspector file={selectedFile} />
        </div>

        <footer className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldQuestion className="h-3.5 w-3.5" />
          Answers should cite indexed files and line ranges when enough evidence exists.
        </footer>
      </div>
    </AppShell>
  );
}

function toStackDetection(value: unknown): StackDetection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isStackDetection);
}

function isStackDetection(value: unknown): value is StackDetection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as StackDetection;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.confidence === "number" &&
    Array.isArray(candidate.evidence)
  );
}
