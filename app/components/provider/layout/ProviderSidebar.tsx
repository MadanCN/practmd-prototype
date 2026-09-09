"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, HelpCircle, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PractMdLogo } from "@/components/brand/PractMdLogo";
import { useApp } from "@/contexts/AppContext";
import { buildWaitingRoom } from "@/lib/provider-schedule";
import { useEncounterStore } from "@/lib/encounter-store";
import { useEncounterNotes, getAllNotes, getNotesToCoSign } from "@/lib/encounter-notes-store";
import { useProviderAvailabilityStore, availabilitySelfServiceEnabled } from "@/lib/provider-availability-store";
import { useProviderTasks, openTaskCount } from "@/lib/provider-tasks-store";
import { useProviderSession } from "@/lib/provider-session";
import { visibleNav, portalLevel, type NavItem } from "@/lib/provider-nav";
import { PROVIDER_MESSAGE_THREADS } from "@/data/provider-today";

const BASE = "/provider";

function useBadges(providerId: string, providerName: string) {
  useEncounterStore();
  useEncounterNotes();
  useProviderTasks();
  const waiting = buildWaitingRoom(providerId).filter(
    (e) => e.status === "waiting" || e.status === "called" || e.status === "telehealth-waiting",
  ).length;
  const notes = getAllNotes().filter((n) => n.providerId === providerId && n.status !== "signed").length;
  const cosign = getNotesToCoSign(providerName).length;
  const messages = PROVIDER_MESSAGE_THREADS.filter((m) => m.unread).length;
  return { waiting, notes, cosign, messages, tasks: openTaskCount() };
}

export default function ProviderSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed: collapsed, setSidebarCollapsed } = useApp();
  const session = useProviderSession();
  useProviderAvailabilityStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ schedule: true, messages: true });

  const badges = useBadges(session.provider.id, session.provider.displayName);
  const badgeFor = (k?: NavItem["badgeKey"]) =>
    k === "notes" ? badges.notes : k === "waiting" ? badges.waiting : k === "messages" ? badges.messages : k === "cosign" ? badges.cosign : k === "tasks" ? badges.tasks : 0;

  const nav = visibleNav(session, { availabilitySelfService: availabilitySelfServiceEnabled() });
  const level = portalLevel(session);

  const isActive = (href: string) => pathname === href.split("?")[0];
  const profileActive = pathname === `${BASE}/profile`;

  const linkBase = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  const linkIdle = "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-navy-200/70 dark:hover:text-white dark:hover:bg-white/8";
  const linkActive = "bg-brand-50 text-navy-900 font-semibold shadow-[inset_3px_0_0_#05a99a] [&>svg]:text-brand-600 dark:bg-brand-950/40 dark:text-white dark:[&>svg]:text-brand-300";

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen flex-col z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-navy-800 transition-[width] duration-200 ease-in-out hidden md:flex",
      collapsed ? "w-[68px]" : "w-60",
    )}>
      <div className={cn(
        "flex items-center h-[60px] border-b border-slate-100 dark:border-navy-800 shrink-0",
        collapsed ? "flex-col justify-center gap-1 px-2" : "justify-between px-4",
      )}>
        <Link href={`${BASE}/today`} className="min-w-0 flex items-center">
          <span className="flex items-center rounded-md bg-white dark:px-1.5 dark:py-1">
            <PractMdLogo variant={collapsed ? "symbol" : "full"} className={collapsed ? "h-7" : "h-[18px]"} />
          </span>
        </Link>
        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          className="shrink-0 text-slate-400 hover:text-slate-700 dark:text-navy-200/60 dark:hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {level !== "full" && !collapsed && (
        <div className="mx-2 mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900 text-[11px] font-medium text-amber-700 dark:text-amber-400">
          {level === "limited" ? "Limited access — verification in progress" : level === "read-only" ? "Read-only — access suspended" : "Finish account setup"}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {nav.map((item) => {
          if (item.children) {
            const open = openGroups[item.key] ?? false;
            const childActive = item.children.some((c) => isActive(c.href));
            if (collapsed) {
              return (
                <Link key={item.key} href={item.children[0].href}
                  className={cn("flex items-center justify-center w-full px-2 py-2 rounded-lg text-sm font-medium transition-colors", childActive ? linkActive : linkIdle)}>
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                </Link>
              );
            }
            return (
              <div key={item.key}>
                <button onClick={() => setOpenGroups((g) => ({ ...g, [item.key]: !open }))}
                  className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", childActive ? "text-brand-700 dark:text-brand-300" : linkIdle)}>
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {!!badgeFor(item.badgeKey) && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">{badgeFor(item.badgeKey)}</span>
                  )}
                  {open ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                </button>
                {open && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 dark:border-white/10 pl-3">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href}
                        className={cn("flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive(child.href) ? "bg-slate-100 text-slate-900 dark:bg-white/12 dark:text-white" : linkIdle)}>
                        <child.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const active = item.href ? isActive(item.href) : false;
          const badge = badgeFor(item.badgeKey);
          return (
            <Link key={item.key} href={item.href!}
              title={collapsed ? item.label : undefined}
              data-tour={item.key === "notes" ? "nav-notes-badge" : undefined}
              className={cn("relative", linkBase, active ? linkActive : linkIdle, collapsed && "justify-center px-2")}>
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && !!badge && (
                <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">{badge}</span>
              )}
              {!collapsed && item.soon && (
                <span className={cn("shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded", active ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-navy-100/80")}>Soon</span>
              )}
              {collapsed && !!badge && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-900" />}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-100 dark:border-white/8 pt-2 pb-3 px-2 space-y-0.5">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-navy-200/60 dark:hover:text-white dark:hover:bg-white/8 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" /> Switch role
          </Link>
        )}
        {[
          { label: "Settings", href: `${BASE}/settings`, icon: Settings },
          { label: "Support", href: `${BASE}/support`, icon: HelpCircle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              className={cn(linkBase, isActive(item.href) ? linkActive : linkIdle, collapsed && "justify-center px-2")}>
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        <Link href={`${BASE}/profile`} title={collapsed ? session.provider.displayName : undefined}
          className={cn("mt-1 flex items-center gap-2.5 rounded-lg transition-colors",
            collapsed ? "justify-center p-1.5" : "px-3 py-2",
            profileActive ? "bg-slate-100 dark:bg-white/12" : "hover:bg-slate-100 dark:hover:bg-white/8")}>
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-navy-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {session.provider.firstName[0]}{session.provider.lastName[0]}
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{session.provider.displayName}</span>
              <span className="block text-[10px] text-slate-400 dark:text-navy-200/60 truncate">{session.provider.providerType}</span>
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}
