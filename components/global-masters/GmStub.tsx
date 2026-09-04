import { LucideIcon, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface GmStubProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
  className?: string;
}

export default function GmStub({ title, description, icon: Icon, features, className }: GmStubProps) {
  return (
    <div className={className}>
      {/* Page title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
          <Icon className="w-[18px] h-[18px] text-blue-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>

      {/* Stub card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
          Under Development
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
          This screen is planned for the next sprint. Here&apos;s what it will include:
        </p>

        {features && features.length > 0 && (
          <ul className="text-left max-w-xs mx-auto space-y-1.5 mb-6">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-[5px] shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <span className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
          "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Coming Soon
        </span>
      </div>
    </div>
  );
}
