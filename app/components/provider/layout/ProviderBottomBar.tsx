"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, DoorOpen, MessageSquare, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProviderSession } from "@/lib/provider-session";
import { availabilitySelfServiceEnabled } from "@/lib/provider-availability-store";
import { visibleNav } from "@/lib/provider-nav";

const BASE = "/provider";

/** Narrow-viewport nav: Today, Waiting Room, Messages and a More sheet
 *  (PRD "Shell and navigation"). */
export function ProviderBottomBar() {
  const pathname = usePathname();
  const session = useProviderSession();
  const [sheet, setSheet] = useState(false);

  const primary = [
    { label: "Today", href: `${BASE}/today`, icon: LayoutDashboard },
    { label: "Waiting", href: `${BASE}/waiting-room`, icon: DoorOpen },
    { label: "Messages", href: `${BASE}/messages/patients`, icon: MessageSquare },
  ];
  const rest = visibleNav(session, { availabilitySelfService: availabilitySelfServiceEnabled() })
    .filter((i) => !["today", "waiting", "messages"].includes(i.key));

  const isActive = (href: string) => pathname === href.split("?")[0];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-stretch">
        {primary.map((i) => (
          <Link key={i.href} href={i.href}
            className={cn("flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
              isActive(i.href) ? "text-brand-600 dark:text-brand-400" : "text-slate-400")}>
            <i.icon className="w-5 h-5" />
            {i.label}
          </Link>
        ))}
        <button onClick={() => setSheet(true)} className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-slate-400">
          <MoreHorizontal className="w-5 h-5" /> More
        </button>
      </nav>

      {sheet && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSheet(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">More</p>
              <button onClick={() => setSheet(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {rest.map((i) => (
                <Link key={i.key} href={i.href ?? i.children![0].href} onClick={() => setSheet(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <i.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span className="text-center leading-tight">{i.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
