import ComingSoon from "@/components/ui/ComingSoon";
import type { SectionDef } from "./registry";

export function PlaceholderSection({ def }: { def: SectionDef }) {
  if (def.soon) {
    return <ComingSoon title={def.label} description={def.blurb} icon={def.icon} className="min-h-[50vh]" />;
  }

  const Icon = def.icon;
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-brand-600 dark:text-brand-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{def.label}</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{def.blurb}</p>
      <span className="mt-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
        Building this section next
      </span>
    </div>
  );
}
