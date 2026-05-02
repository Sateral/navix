import { Badge } from "@/components/ui/badge";

export function CodeViewer({
  path,
  content,
  language,
}: {
  path: string;
  content: string;
  language: string | null;
}) {
  const lines = content.split(/\r?\n/);

  return (
    <div className="flex h-full min-h-[34rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-950/65">
      <div className="flex h-10 items-center justify-between border-b border-white/10 px-3">
        <div className="min-w-0 text-sm text-slate-300">
          <span className="text-slate-500">repo</span>
          <span className="px-2 text-slate-600">/</span>
          <span className="text-slate-200">{path}</span>
        </div>
        <Badge>{language ?? "text"}</Badge>
      </div>
      <div className="overflow-auto">
        <pre className="min-w-max py-3 text-[13px] leading-6">
          {lines.map((line, index) => (
            <div key={`${index}-${line}`} className="grid grid-cols-[3.5rem_1fr] px-3">
              <span className="select-none pr-4 text-right text-slate-600">{index + 1}</span>
              <code className="whitespace-pre text-slate-300">{highlightLine(line)}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function highlightLine(line: string) {
  const commentIndex = line.indexOf("//");

  if (commentIndex > -1) {
    return (
      <>
        {highlightCode(line.slice(0, commentIndex))}
        <span className="text-slate-500">{line.slice(commentIndex)}</span>
      </>
    );
  }

  return highlightCode(line);
}

function highlightCode(line: string) {
  const tokens = line.split(
    /(\b(?:import|export|from|const|let|function|class|interface|type|return|async|await|new|if|else)\b|"[^"]*"|'[^']*'|`[^`]*`|\b\d+\b)/g,
  );

  return tokens.map((token, index) => {
    if (
      /^(import|export|from|const|let|function|class|interface|type|return|async|await|new|if|else)$/.test(
        token,
      )
    ) {
      return (
        <span key={`${token}-${index}`} className="text-violet-300">
          {token}
        </span>
      );
    }

    if (/^["'`]/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-emerald-300">
          {token}
        </span>
      );
    }

    if (/^\d+$/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-amber-300">
          {token}
        </span>
      );
    }

    return token;
  });
}
