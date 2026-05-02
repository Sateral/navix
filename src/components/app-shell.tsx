import Link from "next/link";
import {
  Boxes,
  CircleHelp,
  FileCode2,
  GitBranch,
  Home,
  Route,
  Settings,
} from "lucide-react";
import { NavixLogo } from "@/components/navix-logo";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard", label: "Files", icon: FileCode2 },
  { href: "/dashboard", label: "Symbols", icon: GitBranch },
  { href: "/dashboard", label: "Routes", icon: Route },
  { href: "/dashboard", label: "Schema", icon: Boxes },
  { href: "/dashboard", label: "Questions", icon: CircleHelp },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-[13.5rem] border-r border-white/10 bg-slate-950/80 px-4 py-5 backdrop-blur-xl lg:block">
        <NavixLogo />
        <nav className="mt-8 space-y-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white",
                  index === 0 && "bg-violet-500/15 text-slate-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-400">
            <div className="flex items-center justify-between text-slate-200">
              <span>Index status</span>
              <span className="text-emerald-400">Ready</span>
            </div>
            <p className="mt-2">Local ingestion and public GitHub imports are enabled.</p>
          </div>
          <Link
            href="/dashboard"
            className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>
      <main className="min-h-screen lg:pl-[13.5rem]">{children}</main>
    </div>
  );
}
