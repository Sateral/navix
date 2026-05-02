import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-xs font-medium text-slate-300",
        className,
      )}
      {...props}
    />
  );
}
