"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import ProviderSidebar from "./ProviderSidebar";
import { ProviderBreadcrumbs } from "./ProviderBreadcrumbs";
import { StatusBanner } from "./StatusBanner";
import { GlobalSearch } from "./GlobalSearch";
import { DevProviderSwitcher } from "./DevProviderSwitcher";
import { LockScreen } from "./LockScreen";
import { ProviderBottomBar } from "./ProviderBottomBar";
import { Bell, ChevronDown, Sun, Moon, X, Building2, Lock, ScreenShare } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { useEncounterStore, dismissNotification } from "@/lib/encounter-store";
import { useProviderSession, lockPortal, setActiveClinic, setPresenting } from "@/lib/provider-session";
import { portalLevel } from "@/lib/provider-nav";
import { CLINICS } from "@/data/clinics";

const LIMITED_ALLOWED = ["/provider/readiness", "/provider/profile", "/provider/availability", "/provider/messages", "/provider/settings", "/provider/support"];
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
  const session = useProviderSession();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [clinicOpen, setClinicOpen] = useState(false);

  const level = portalLevel(session);
  useEffect(() => {
    if (level === "activation-wizard" && pathname !== "/provider/activate") {
      router.replace("/provider/activate");
    } else if (level === "limited" && !LIMITED_ALLOWED.some((p) => pathname.startsWith(p))) {
      router.replace("/provider/readiness");
    }
  }, [level, pathname, router]);

  const myClinics = CLINICS.filter((c) => session.provider.clinicAccess.includes(c.id));
  const activeClinic = myClinics.find((c) => c.id === session.activeClinicId) ?? myClinics[0] ?? CLINICS[0];

  function openNotification(href: string, id: string) {
    dismissNotification(id);
    setNotifOpen(false);
    router.push(href);
  }

  // Notification tray shows patient names — suppress while screen-sharing.
  const scrub = (msg: string) => (session.presenting ? msg.replace(/—\s?[A-Z][a-z]+\s[A-Z][a-z]+/g, "— [name hidden]") : msg);

  return (
    <TourProvider>
      <LockScreen>
        <div className="h-full flex bg-slate-50 dark:bg-slate-950">
          <ProviderSidebar />

          <div className={cn(
            "flex-1 flex flex-col min-h-screen transition-[margin] duration-200 md:ml-60",
            sidebarCollapsed && "md:ml-[68px]",
          )}>
            <header className={cn(
              "fixed top-0 right-0 left-0 z-30 h-[60px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-3 sm:px-4 gap-3 transition-[left] duration-200",
              "md:left-60", sidebarCollapsed && "md:left-[68px]",
            )}>
              <GlobalSearch />

              <div className="flex-1 min-w-0 hidden lg:block">
                <ProviderBreadcrumbs />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
                {/* Clinic switcher */}
                <div className="relative">
                  <button onClick={() => setClinicOpen((o) => !o)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="font-medium hidden lg:inline max-w-[160px] truncate">{activeClinic?.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {clinicOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setClinicOpen(false)} />
                      <div className="absolute right-0 top-10 z-40 w-60 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5">
                        {myClinics.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No clinic assignments.</p>}
                        {myClinics.map((c) => (
                          <button key={c.id}
                            onClick={() => { setActiveClinic(c.id); setClinicOpen(false); }}
                            className={cn("w-full text-left px-3 py-2 rounded-lg text-sm",
                              c.id === activeClinic?.id ? "bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-semibold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <HeaderHelpButton />
                <DevProviderSwitcher />

                {/* Screen-share toggle — suppresses patient names in the tray */}
                <button onClick={() => setPresenting(!session.presenting)}
                  title={session.presenting ? "Stop screen-share mode" : "Screen-share mode — hide patient names"}
                  className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                    session.presenting ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400")}>
                  <ScreenShare className="w-4 h-4" />
                </button>

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
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notifications</p>
                          {session.presenting && <span className="text-[10px] font-semibold text-amber-600">names hidden</span>}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="px-4 py-8 text-center text-xs text-slate-400">You&apos;re all caught up.</p>
                          ) : (
                            notifications.map((n) => (
                              <div key={n.id} className="flex items-start gap-2.5 px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <button onClick={() => openNotification(n.href, n.id)} className="flex-1 text-left">
                                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{scrub(n.message)}</p>
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

                {/* Immediate lock */}
                <button onClick={() => lockPortal()} title="Lock the portal now"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </button>

                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hidden sm:flex"
                  aria-label="Toggle theme">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </header>

            <main className="flex-1 pt-[60px] pb-14 md:pb-0 overflow-y-auto">
              <StatusBanner />
              {children}
            </main>
          </div>

          <ProviderBottomBar />
        </div>
      </LockScreen>
    </TourProvider>
  );
}
