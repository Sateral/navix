import Link from "next/link";
import { ArrowRight, Database, GitBranch, SearchCode } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { ImportRepositoryForm } from "@/app/dashboard/import-repository-form";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const repositories = await prisma.repository.findMany({
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

  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-violet-300">
              Code comprehension
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white">
              Repository workbench
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-400">
            <SearchCode className="h-4 w-4 text-violet-300" />
            Source-grounded indexing
          </div>
        </header>

        <ImportRepositoryForm />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Connected repositories</h2>
            <Badge>{repositories.length} total</Badge>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/40">
            {repositories.length === 0 ? (
              <div className="p-8 text-sm text-slate-400">
                No repositories indexed yet. Import a local folder or public GitHub repo to
                start exploring real source context.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {repositories.map((repository) => (
                  <Link
                    key={repository.id}
                    href={`/repo/${repository.id}`}
                    className="grid gap-4 p-4 transition hover:bg-white/[0.04] md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-white">
                          {repository.owner}/{repository.name}
                        </h3>
                        <Badge className="capitalize">{repository.status}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Database className="h-3.5 w-3.5" />
                          {repository._count.files} files
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <GitBranch className="h-3.5 w-3.5" />
                          {repository._count.symbols} symbols
                        </span>
                        <span>{repository._count.routes} routes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-violet-200">
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
