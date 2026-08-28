"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProviderSidebar from "./ProviderSidebar";
import { ProviderBreadcrumbs } from "./ProviderBreadcrumbs";
import { Bell, Search, ChevronDown, Sun, Moon, X, Building2 } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { useEncounterStore, dismissNotification } from "@/lib/encounter-store";
import { TourProvider } from "@/components/provider/tour/TourProvider";
import { HeaderHelpButton } from "@/components/provider/tour/HeaderHelpButton";

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { sidebarCollapsed } = useApp();
  const { notifications } = useEncounterStore();
  const [notifOpen, setNotifOpen] = useState(false);

  function openNotification(href: string, id: string) {
    dismissNotification(id);
    setNotifOpen(false);
    router.push(href);
  }

  return (
    <TourProvider>
    <div className="h-full flex bg-slate-50 dark:bg-slate-950">
      <ProviderSidebar />

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
            <input
              placeholder="Search…"
              className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none"
            />
          </div>

          {/* Breadcrumbs — fill the space next to search */}
          <div className="flex-1 min-w-0 hidden md:block">
            <ProviderBreadcrumbs />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Clinic switcher */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="font-medium hidden lg:inline">Penfield Psychiatry</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Contextual help */}
            <HeaderHelpButton />

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotifOpen((o) => !o)}
                className="relative z-40 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notifications</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-xs text-slate-400">You&apos;re all caught up.</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="flex items-start gap-2.5 px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <button onClick={() => openNotification(n.href, n.id)} className="flex-1 text-left">
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                            </button>
                            <button onClick={() => dismissNotification(n.id)} className="text-slate-300 hover:text-slate-500 shrink-0" title="Dismiss">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme */}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pt-[60px] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
    </TourProvider>
  );
}
