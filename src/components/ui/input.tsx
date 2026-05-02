import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/20",
        className,
      )}
      {...props}
    />
  );
}
