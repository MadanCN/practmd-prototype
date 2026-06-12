"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  HelpCircle,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  Building2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { useMemo } from "react";

const ROUTE_LABELS: Record<string, string> = {
  "": "Home",
  "global-masters": "Global Masters",
  organization: "Organization",
  practice: "Practice",
  "clinic-management": "Clinic Management",
  admins: "Admins",
  "provider-staff": "Provider & Staff",
  forms: "Forms",
  "plan-builder": "Plan Builder",
  patients: "Patients",
  "audit-log": "Audit Log",
  analytics: "Analytics",
  settings: "Settings",
  support: "Support / Feedback",
  profile: "Profile",
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="breadcrumb">
      <span className="text-slate-500 dark:text-slate-400 font-medium">PractMD</span>
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span
            className={cn(
              "font-medium",
              i === segments.length - 1
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            {ROUTE_LABELS[seg] ?? seg}
          </span>
        </span>
      ))}
      {segments.length === 0 && (
        <span className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-900 dark:text-slate-100">Home</span>
        </span>
      )}
    </nav>
  );
}

function ClinicSwitcher() {
  const { clinics, activeClinic, setActiveClinic } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
          "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
          "text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
        )}
      >
        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span className="max-w-[160px] truncate">{activeClinic.name}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn(
          "absolute top-full left-0 mt-1.5 w-72 rounded-xl shadow-lg border z-50 py-1",
          "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
        )}>
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Switch Clinic
          </p>
          {clinics.map((clinic) => (
            <button
              key={clinic.id}
              onClick={() => { setActiveClinic(clinic); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                activeClinic.id === clinic.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-700 dark:text-slate-300"
              )}
            >
              <span className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                activeClinic.id === clinic.id
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              )}>
                {clinic.shortName.slice(0, 2)}
              </span>
              <span className="flex-1 truncate font-medium">{clinic.name}</span>
              {activeClinic.id === clinic.id && (
                <Check className="w-4 h-4 text-blue-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
        "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
        "hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export default function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const { sidebarCollapsed } = useApp();
  const leftOffset = useMemo(() => sidebarCollapsed ? "left-[68px]" : "left-64", [sidebarCollapsed]);

  return (
    <header className={cn(
      "fixed top-0 right-0 h-[60px] z-30 flex items-center gap-4 px-5",
      "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
      "border-b border-slate-200 dark:border-slate-800",
      "transition-[left] duration-200 ease-in-out",
      leftOffset
    )}>
      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
        bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
        text-slate-400 w-52 cursor-text hover:border-blue-400 transition-colors"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="text-slate-400 text-sm select-none">Search anything…</span>
        <kbd className="ml-auto text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-slate-500">
          ⌘K
        </kbd>
      </div>

      {/* Clinic switcher */}
      <ClinicSwitcher />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative",
            "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
            "hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>
        {notifOpen && (
          <div className={cn(
            "absolute top-full right-0 mt-1.5 w-80 rounded-xl shadow-lg border z-50",
            "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          )}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
              <span className="text-xs text-blue-500 cursor-pointer hover:underline">Mark all read</span>
            </div>
            <div className="p-3 space-y-1">
              {[
                { title: "New patient registration", time: "2 min ago", unread: true },
                { title: "Schedule conflict detected", time: "1 hr ago", unread: true },
                { title: "Audit log export ready", time: "3 hr ago", unread: false },
              ].map((n, i) => (
                <div key={i} className={cn(
                  "flex gap-3 p-2.5 rounded-lg cursor-pointer",
                  "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                )}>
                  {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                  {!n.unread && <span className="w-1.5 h-1.5 shrink-0" />}
                  <div className="min-w-0">
                    <p className={cn("text-sm", n.unread ? "font-medium text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400")}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-blue-500 cursor-pointer hover:underline">View all notifications</span>
            </div>
          </div>
        )}
      </div>

      {/* Help */}
      <button
        title="Help & documentation"
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
          "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
          "hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  );
}
