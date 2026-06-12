"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, MessageSquare, CheckSquare,
  FileText, FolderOpen, BarChart3, Clock, Settings, ChevronLeft,
  ChevronRight, ChevronDown, ChevronUp, List, Inbox, Hourglass, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = "/care-coordinator";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
};

const NAV: NavItem[] = [
  { label: "Home", href: `${BASE}`, icon: LayoutDashboard },
  { label: "Patients", href: `${BASE}/patients`, icon: Users },
  {
    label: "Appointments",
    icon: CalendarDays,
    children: [
      { label: "Calendar", href: `${BASE}/appointments/calendar`, icon: CalendarDays },
      { label: "List", href: `${BASE}/appointments/list`, icon: List },
      { label: "Waitlist", href: `${BASE}/appointments/waitlist`, icon: Hourglass },
      { label: "Requests", href: `${BASE}/appointments/requests`, icon: Inbox },
    ],
  },
  { label: "Messages", href: `${BASE}/messages`, icon: MessageSquare },
  { label: "Tasks", href: `${BASE}/tasks`, icon: CheckSquare },
  { label: "Submissions", href: `${BASE}/submissions`, icon: ClipboardList },
  { label: "Documents", href: `${BASE}/documents`, icon: FolderOpen },
  { label: "Analytics", href: `${BASE}/analytics`, icon: BarChart3 },
  { label: "Recents", href: `${BASE}/recents`, icon: Clock },
];

const BOTTOM_NAV = [
  { label: "Settings", href: `${BASE}/settings`, icon: Settings },
];

export default function CcSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [apptOpen, setApptOpen] = useState(true);

  const isActive = (href: string) =>
    href === BASE ? pathname === BASE || pathname === `${BASE}/` : pathname.startsWith(href);

  const isApptSection = pathname.startsWith(`${BASE}/appointments`);

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen flex flex-col z-40 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-[width] duration-200 ease-in-out",
      collapsed ? "w-[68px]" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-[60px] px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">P</div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-white font-semibold text-sm tracking-tight truncate">PractMD</span>
              <span className="text-[10px] font-medium text-teal-400 bg-teal-950 px-1.5 py-0.5 rounded shrink-0">Care</span>
            </div>
          )}
        </div>
        <button onClick={() => setCollapsed(c => !c)} className="shrink-0 text-slate-500 hover:text-white transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          if (item.children) {
            const childActive = item.children.some(c => isActive(c.href));
            return (
              <div key={item.label}>
                {collapsed ? (
                  <Link href={item.children[0].href}
                    className={cn("flex items-center justify-center w-full px-2 py-2 rounded-lg text-sm font-medium transition-colors",
                      childActive ? "bg-teal-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800")}>
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                  </Link>
                ) : (
                  <>
                    <button onClick={() => setApptOpen(o => !o)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        childActive ? "text-teal-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}>
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {apptOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                    {apptOpen && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-800 pl-3">
                        {item.children.map(child => (
                          <Link key={child.href} href={child.href}
                            className={cn("flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                              isActive(child.href) ? "bg-teal-700/80 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800")}>
                            <child.icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const active = item.href ? isActive(item.href) : false;
          return (
            <Link key={item.label} href={item.href!}
              title={collapsed ? item.label : undefined}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-teal-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800",
                collapsed && "justify-center px-2")}>
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 border-t border-slate-800 py-2 px-2 space-y-0.5">
        {/* Back to role selector */}
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors mb-1">
            ← Switch role
          </Link>
        )}
        {BOTTOM_NAV.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-teal-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800",
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
