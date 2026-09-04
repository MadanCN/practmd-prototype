"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  patients: "Patients",
  appointments: "Appointments",
  calendar: "Calendar",
  list: "List",
  waitlist: "Waitlist",
  requests: "Requests",
  "waiting-room": "Waiting Room",
  messages: "Messages",
  tasks: "Tasks",
  submissions: "Submissions",
  documents: "Documents",
  analytics: "Analytics",
  recents: "Recents",
  settings: "Settings",
};

const ID_LABEL_BY_PARENT: Record<string, string> = {
  patients: "Patient",
  appointments: "Appointment",
};

function titleCase(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CcBreadcrumbs() {
  const pathname = usePathname() || "/care-coordinator";
  const segs = pathname.split("/").filter(Boolean).slice(1); // drop "care-coordinator"

  const crumbs: { label: string; href?: string }[] = [];
  let acc = "/care-coordinator";
  segs.forEach((seg, i) => {
    acc += `/${seg}`;
    const parent = segs[i - 1];
    const looksLikeId = !LABELS[seg] && /[0-9]/.test(seg);
    const label = looksLikeId ? (ID_LABEL_BY_PARENT[parent] ?? "Detail") : (LABELS[seg] ?? titleCase(seg));
    crumbs.push({ label, href: i < segs.length - 1 ? acc : undefined });
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
      <Link href="/care-coordinator" className="flex items-center text-slate-400 hover:text-brand-700 transition-colors shrink-0" aria-label="Care Coordinator home">
        <Home className="w-4 h-4" />
      </Link>
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5 min-w-0">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          {c.href ? (
            <Link href={c.href} className="text-slate-500 hover:text-brand-700 transition-colors truncate">{c.label}</Link>
          ) : (
            <span className={cn("font-semibold text-navy-900 dark:text-slate-100 truncate")}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default CcBreadcrumbs;
