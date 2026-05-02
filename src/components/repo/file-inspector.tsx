import { Badge } from "@/components/ui/badge";

type InspectorFile = {
  path: string;
  role: string;
  summary: string | null;
  symbols: Array<{
    id: string;
    name: string;
    kind: string;
    startLine: number;
    endLine: number;
    signature: string | null;
    exported: boolean;
  }>;
  importsFrom: Array<{
    importPath: string;
    importedNames: unknown;
    isExternal: boolean;
    toFile: { path: string } | null;
  }>;
  routes: Array<{
    routePath: string;
    kind: string;
    method: string | null;
  }>;
};

export function FileInspector({ file }: { file: InspectorFile | null }) {
  if (!file) {
    return (
      <aside className="h-full rounded-lg border border-white/10 bg-slate-900/45 p-4">
        <h2 className="text-sm font-semibold text-white">Analysis</h2>
        <p className="mt-3 text-sm text-slate-400">Select a file to inspect source metadata.</p>
      </aside>
    );
  }

  return (
    <aside className="h-full overflow-auto rounded-lg border border-white/10 bg-slate-900/45">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Analysis</h2>
          <Badge className="capitalize">{file.role.replaceAll("_", " ")}</Badge>
        </div>
        <p className="mt-3 text-sm text-slate-300">{file.path}</p>
        <p className="mt-2 text-sm text-slate-500">
          {file.summary ??
            "This file is indexed from source. AI-generated purpose notes can be added once an AI provider is configured."}
        </p>
      </div>

      <Section title="Routes">
        {file.routes.length === 0 ? (
          <Empty>Not detected as a Next.js route file.</Empty>
        ) : (
          <div className="space-y-2">
            {file.routes.map((route) => (
              <div key={`${route.kind}-${route.routePath}`} className="rounded-md bg-slate-950/50 p-2">
                <div className="text-sm text-white">{route.routePath}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {route.kind}
                  {route.method ? ` · ${route.method}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Symbols (${file.symbols.length})`}>
        {file.symbols.length === 0 ? (
          <Empty>No top-level TypeScript symbols detected.</Empty>
        ) : (
          <div className="space-y-2">
            {file.symbols.map((symbol) => (
              <div key={symbol.id} className="rounded-md border border-white/10 bg-slate-950/45 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-white">{symbol.name}</span>
                  <Badge>{symbol.kind}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  lines {symbol.startLine}-{symbol.endLine}
                  {symbol.exported ? " · exported" : ""}
                </p>
                {symbol.signature ? (
                  <code className="mt-2 block truncate text-xs text-slate-400">
                    {symbol.signature}
                  </code>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Imports (${file.importsFrom.length})`}>
        {file.importsFrom.length === 0 ? (
          <Empty>No imports detected.</Empty>
        ) : (
          <div className="space-y-2">
            {file.importsFrom.map((edge) => (
              <div key={edge.importPath} className="rounded-md bg-slate-950/45 p-2">
                <div className="truncate text-sm text-slate-200">{edge.importPath}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {edge.isExternal ? "external package" : edge.toFile?.path ?? "unresolved local import"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="What to know before modifying">
        <ul className="space-y-2 text-sm text-slate-400">
          <li>Check imported dependencies and exported symbols first.</li>
          <li>Review route metadata if this file participates in runtime entry flow.</li>
          <li>Use callers/callees once the symbol graph is expanded beyond basic call names.</li>
        </ul>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/10 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}
