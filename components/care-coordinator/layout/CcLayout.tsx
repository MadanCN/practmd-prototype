"use client";

import CcSidebar from "./CcSidebar";
import { CcBreadcrumbs } from "./CcBreadcrumbs";
import { Bell, Search, ChevronDown, Sun, Moon, Building2 } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

export default function CcLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed } = useApp();

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-950">
      <CcSidebar />

      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-[margin] duration-200",
        sidebarCollapsed ? "ml-[68px]" : "ml-60",
      )}>
        {/* Header */}
        <header className={cn(
          "fixed top-0 right-0 z-30 h-[60px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4 transition-[left] duration-200",
          sidebarCollapsed ? "left-[68px]" : "left-60",
        )}>
          {/* Search — compact, left-aligned */}
          <div className="flex items-center gap-2 w-56 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 focus-within:border-brand-400 transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input placeholder="Search…" className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none" />
          </div>

          {/* Breadcrumbs */}
          <div className="flex-1 min-w-0 hidden md:block">
            <CcBreadcrumbs />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="font-medium hidden lg:inline">New Hartford</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-slate-900" />
            </button>

            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pt-[60px] overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
