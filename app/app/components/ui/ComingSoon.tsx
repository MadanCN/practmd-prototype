import { LucideIcon, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export default function ComingSoon({ title, description, icon: Icon = Wrench, className }: ComingSoonProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[60vh] text-center px-4", className)}>
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed">
        {description ?? "This feature is currently under development and will be available in the next release."}
      </p>
      <div className="mt-8 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Coming Soon
        </span>
      </div>
    </div>
  );
}
