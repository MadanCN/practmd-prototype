"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, Receipt, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = "/revenue-management";

const NAV = [
  { label: "Eligibility Worklist", href: `${BASE}/worklist`, icon: ClipboardCheck },
  { label: "Charges", href: `${BASE}/charges`, icon: Receipt },
];

const BOTTOM_NAV = [
  { label: "Settings", href: `${BASE}/settings`, icon: Settings },
];

export default function RmSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen flex flex-col z-40 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-[width] duration-200 ease-in-out",
      collapsed ? "w-[68px]" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-[60px] px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">P</div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-white font-semibold text-sm tracking-tight truncate">PractMD</span>
              <span className="text-[10px] font-medium text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded shrink-0">RCM</span>
            </div>
          )}
        </div>
        <button onClick={() => setCollapsed((c) => !c)} className="shrink-0 text-slate-500 hover:text-white transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <Link href={BASE} title={collapsed ? "Home" : undefined}
          className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === BASE ? "bg-amber-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800",
            collapsed && "justify-center px-2")}>
          <LayoutDashboard className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span className="truncate">Home</span>}
        </Link>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-amber-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800",
                collapsed && "justify-center px-2")}>
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 border-t border-slate-800 py-2 px-2 space-y-0.5">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors mb-1">
            ← Switch role
          </Link>
        )}
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-amber-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800",
                collapsed && "justify-center px-2")}>
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
