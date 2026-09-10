"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Human labels for known route segments. Anything else is title-cased. */
const LABELS: Record<string, string> = {
  today: "Today",
  appointments: "Schedule",
  list: "List",
  "encounter-notes": "Encounter Notes",
  "waiting-room": "Waiting Room",
  messages: "Messages",
  patients: "Patients",
  internal: "Internal",
  tasks: "Tasks",
  results: "Results",
  refills: "Refill Requests",
  medication: "Medication",
  reports: "Reports",
  recents: "Recents",
  availability: "My Availability",
  settings: "Settings",
  support: "Support",
  profile: "Profile",
  telehealth: "Telehealth",
};

/** Segments that are really record ids — label them from their parent. */
const ID_LABEL_BY_PARENT: Record<string, string> = {
  appointments: "Appointment",
  telehealth: "Session",
  patients: "Patient",
};

function titleCase(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ProviderBreadcrumbs() {
  const pathname = usePathname() || "/provider";
  const parts = pathname.split("/").filter(Boolean); // ["provider", ...]
  const segs = parts.slice(1); // drop "provider"

  const crumbs: { label: string; href?: string }[] = [];
  let acc = "/provider";
  segs.forEach((seg, i) => {
    acc += `/${seg}`;
    const parent = segs[i - 1];
    const looksLikeId = !LABELS[seg] && /[0-9]/.test(seg);
    const label = looksLikeId
      ? (ID_LABEL_BY_PARENT[parent] ?? "Detail")
      : (LABELS[seg] ?? titleCase(seg));
    crumbs.push({ label, href: i < segs.length - 1 ? acc : undefined });
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
      <Link
        href="/provider/today"
        className="flex items-center text-slate-400 hover:text-brand-700 transition-colors shrink-0"
        aria-label="Provider home"
      >
        <Home className="w-4 h-4" />
      </Link>
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5 min-w-0">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          {c.href ? (
            <Link href={c.href} className="text-slate-500 hover:text-brand-700 transition-colors truncate">
              {c.label}
            </Link>
          ) : (
            <span className={cn("font-semibold text-navy-900 dark:text-slate-100 truncate")}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default ProviderBreadcrumbs;
