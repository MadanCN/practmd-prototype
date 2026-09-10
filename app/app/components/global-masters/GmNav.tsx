"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GM_SECTIONS, type GmSection, type GmSectionChild, type GmLeaf, type GmGroup } from "@/data/gm-nav";

function isLeaf(child: GmSectionChild): child is GmLeaf {
  return child.kind === "leaf";
}

function getAllLeaves(section: GmSection): GmLeaf[] {
  const leaves: GmLeaf[] = [];
  for (const child of section.children) {
    if (isLeaf(child)) leaves.push(child);
    else leaves.push(...child.children);
  }
  return leaves;
}

function sectionContainsPath(section: GmSection, pathname: string): boolean {
  return getAllLeaves(section).some((l) => pathname.startsWith(l.href));
}

interface SectionProps {
  section: GmSection;
  pathname: string;
  query: string;
}

function NavSection({ section, pathname, query }: SectionProps) {
  const isActiveSection = sectionContainsPath(section, pathname);
  const [open, setOpen] = useState(isActiveSection);

  useEffect(() => {
    if (isActiveSection) setOpen(true);
  }, [isActiveSection]);

  const Icon = section.icon;

  const filteredChildren = useMemo((): GmSectionChild[] => {
    if (!query) return section.children;
    const q = query.toLowerCase();
    return section.children.reduce<GmSectionChild[]>((acc, child) => {
      if (isLeaf(child)) {
        if (child.label.toLowerCase().includes(q)) acc.push(child);
      } else {
        const matched = child.children.filter((l) => l.label.toLowerCase().includes(q));
        if (matched.length) acc.push({ ...child, children: matched });
      }
      return acc;
    }, []);
  }, [section.children, query]);

  if (query && filteredChildren.length === 0) return null;

  const forceOpen = !!query && filteredChildren.length > 0;

  return (
    <div>
      {/* Section header */}
      <button
        onClick={() => !forceOpen && setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
          isActiveSection
            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        )}
      >
        <span className={cn(
          "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
          isActiveSection
            ? "bg-blue-600 text-white"
            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
        )}>
          {section.number}
        </span>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left text-[13px] truncate">{section.label}</span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 shrink-0 transition-transform text-slate-400",
          (open || forceOpen) ? "rotate-180" : ""
        )} />
      </button>

      {/* Children */}
      {(open || forceOpen) && (
        <div className="ml-3 mt-0.5 mb-1 border-l border-slate-200 dark:border-slate-800 pl-3 space-y-0.5">
          {filteredChildren.map((child) => {
            if (isLeaf(child)) {
              return <LeafItem key={child.href} leaf={child} pathname={pathname} />;
            }
            return <GroupItem key={child.id} group={child} pathname={pathname} />;
          })}
        </div>
      )}
    </div>
  );
}

function GroupItem({ group, pathname }: { group: GmGroup; pathname: string }) {
  return (
    <div className="mt-2">
      <p className="px-2 mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {group.label}
      </p>
      {group.children.map((leaf) => (
        <LeafItem key={leaf.href} leaf={leaf} pathname={pathname} />
      ))}
    </div>
  );
}

function LeafItem({ leaf, pathname }: { leaf: GmLeaf; pathname: string }) {
  const active = pathname === leaf.href || pathname.startsWith(leaf.href + "/");
  return (
    <Link
      href={leaf.href}
      className={cn(
        "flex items-center px-2 py-1.5 rounded-md text-[13px] transition-colors",
        active
          ? "bg-blue-600 text-white font-medium"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {leaf.label}
    </Link>
  );
}

export default function GmNav() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Global Masters
        </p>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections..."
            className="w-full pl-7 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700
              bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {GM_SECTIONS.map((section) => (
          <NavSection key={section.id} section={section} pathname={pathname} query={query} />
        ))}
      </nav>
    </aside>
  );
}
