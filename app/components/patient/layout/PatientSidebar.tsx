"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, FileText, MessageSquare, UserCircle,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Heart, Shield, ClipboardList, FolderOpen, AlertTriangle, Video,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = "/patient";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  badge?: number;
  children?: { label: string; href: string; icon: React.ElementType; badge?: number }[];
};

const NAV: NavItem[] = [
  { label: "Home", href: `${BASE}/home`, icon: LayoutDashboard },
  {
    label: "My Visits",
    icon: CalendarDays,
    children: [
      { label: "Upcoming", href: `${BASE}/visits`, icon: CalendarDays },
      { label: "Past Visits", href: `${BASE}/visits/past`, icon: ClipboardList },
      { label: "Book Appointment", href: `${BASE}/visits/schedule`, icon: PlusCircle },
    ],
  },
  {
    label: "My Records",
    icon: FolderOpen,
    children: [
      { label: "Health Profile", href: `${BASE}/records/health-profile`, icon: Heart },
      { label: "Insurance", href: `${BASE}/records/insurance`, icon: Shield },
      { label: "Forms & Intake", href: `${BASE}/records/forms`, icon: FileText },
      { label: "Documents", href: `${BASE}/records/documents`, icon: FolderOpen },
      { label: "Allergies", href: `${BASE}/records/allergies`, icon: AlertTriangle },
    ],
  },
  { label: "Messages", href: `${BASE}/messages`, icon: MessageSquare, badge: 1 },
];

const BOTTOM_NAV = [
  { label: "Profile", href: `${BASE}/profile`, icon: UserCircle },
];

export default function PatientSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [visitsOpen, setVisitsOpen] = useState(true);
  const [recordsOpen, setRecordsOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const isTelehealth = pathname.startsWith(`${BASE}/telehealth`);

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen flex flex-col z-40 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-[width] duration-200 ease-in-out",
      collapsed ? "w-[68px]" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-[60px] px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">P</div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-white font-semibold text-sm tracking-tight truncate">PractMD</span>
              <span className="text-[10px] font-medium text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded shrink-0">Patient</span>
            </div>
          )}
        </div>
        <button onClick={() => setCollapsed(c => !c)} className="shrink-0 text-slate-500 hover:text-white transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Telehealth indicator */}
      {isTelehealth && !collapsed && (
        <div className="mx-2 mt-2 px-3 py-2 rounded-lg bg-emerald-900/40 border border-emerald-800 flex items-center gap-2">
          <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-300">Telehealth Session</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          if (item.children) {
            const isVisits = item.label === "My Visits";
            const open = isVisits ? visitsOpen : recordsOpen;
            const setOpen = isVisits ? setVisitsOpen : setRecordsOpen;
            const childActive = item.children.some(c => isActive(c.href));

            return (
              <div key={item.label}>
                {collapsed ? (
                  <Link href={item.children[0].href}
                    className={cn("flex items-center justify-center w-full px-2 py-2 rounded-lg text-sm font-medium transition-colors",
                      childActive ? "bg-emerald-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800")}>
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                  </Link>
                ) : (
                  <>
                    <button onClick={() => setOpen(o => !o)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        childActive ? "text-emerald-400" : "text-slate-400 hover:text-white hover:bg-slate-800")}>
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {open ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                    {open && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-800 pl-3">
                        {item.children.map(child => (
                          <Link key={child.href} href={child.href}
                            className={cn("flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
                              isActive(child.href) ? "bg-emerald-700/80 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800",
                              child.label === "Book Appointment" && !isActive(child.href) && "text-emerald-400 hover:text-emerald-300")}>
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
              className={cn("relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-emerald-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800",
                collapsed && "justify-center px-2")}>
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge && item.badge > 0 && (
                <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
              )}
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
        {/* Patient identity card */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg bg-slate-800/50">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">JH</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">James Holloway</p>
              <p className="text-[10px] text-slate-500 truncate">MRN-00101</p>
            </div>
          </div>
        )}
        {BOTTOM_NAV.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-emerald-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800",
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
