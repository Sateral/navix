import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-violet-500 text-white shadow-[0_0_24px_rgba(124,58,237,0.32)] hover:bg-violet-400",
        variant === "secondary" &&
          "border border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.09]",
        variant === "ghost" && "text-slate-300 hover:bg-white/[0.06] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
