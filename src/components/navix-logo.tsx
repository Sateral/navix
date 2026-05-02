import { APP_NAME } from "@/config/app";

export function NavixLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-lg border border-violet-300/30 bg-violet-500/15 text-lg font-black text-violet-300 shadow-[0_0_24px_rgba(124,58,237,0.22)]">
        N
      </div>
      <span className="text-lg font-semibold tracking-normal text-white">{APP_NAME}</span>
    </div>
  );
}
