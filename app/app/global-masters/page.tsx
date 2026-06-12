import Link from "next/link";
import { GM_SECTIONS } from "@/data/gm-nav";
import { cn } from "@/lib/utils";

const SECTION_COLORS = [
  "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900",
  "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900",
  "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900",
  "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900",
  "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900",
  "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900",
  "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900",
  "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900",
  "bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900",
];

function countLeaves(section: (typeof GM_SECTIONS)[0]): number {
  return section.children.reduce((n, child) => {
    if (child.kind === "leaf") return n + 1;
    return n + child.children.length;
  }, 0);
}

function getFirstHref(section: (typeof GM_SECTIONS)[0]): string {
  const first = section.children[0];
  if (!first) return section.href;
  if (first.kind === "leaf") return first.href;
  return first.children[0]?.href ?? section.href;
}

export default function GlobalMastersOverview() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Global Masters</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Centralized administration hub for all platform-wide configurations across your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {GM_SECTIONS.map((section, i) => {
          const Icon = section.icon;
          const color = SECTION_COLORS[i % SECTION_COLORS.length];
          const leafCount = countLeaves(section);
          const firstHref = getFirstHref(section);

          return (
            <Link
              key={section.id}
              href={firstHref}
              className={cn(
                "group flex flex-col gap-4 p-5 rounded-xl border bg-white dark:bg-slate-900",
                "border-slate-200 dark:border-slate-800",
                "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  {leafCount} setting{leafCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {String(section.number).padStart(2, "0")}
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {section.label}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {section.description}
                </p>
              </div>

              {/* Subsection list */}
              <div className="flex flex-wrap gap-1.5">
                {section.children.slice(0, 4).map((child) => (
                  <span
                    key={child.kind === "leaf" ? child.href : child.id}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  >
                    {child.kind === "leaf" ? child.label : child.label}
                  </span>
                ))}
                {section.children.length > 4 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    +{section.children.length - 4} more
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
