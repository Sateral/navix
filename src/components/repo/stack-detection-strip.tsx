import { Badge } from "@/components/ui/badge";

type StackDetection = {
  name: string;
  version: string | null;
  confidence: number;
  evidence: string[];
};

export function StackDetectionStrip({ stack }: { stack: StackDetection[] }) {
  if (stack.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-medium text-white">Stack detection</p>
        <p className="mt-2 text-sm text-slate-400">
          No high-confidence stack signals have been indexed yet.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Stack detection</h2>
        <Badge>{stack.length} signals</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stack.map((item) => (
          <div key={item.name} className="rounded-md border border-white/10 bg-slate-950/55 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="mt-1 text-xs text-slate-400">{item.version ?? "detected"}</p>
              </div>
              <span className="text-xs text-emerald-300">
                {Math.round(item.confidence * 100)}%
              </span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-slate-800">
              <div
                className="h-1 rounded-full bg-emerald-400"
                style={{ width: `${Math.round(item.confidence * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
