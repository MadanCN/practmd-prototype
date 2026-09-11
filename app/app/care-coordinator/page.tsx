"use client";

import Link from "next/link";
import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import {
  DoorOpen, Inbox, Hourglass, ArrowRight, ChevronRight, CheckSquare,
  UserPlus, CalendarPlus, CalendarClock,
} from "lucide-react";
import { getRequestedAppointments, getWaitlistedAppointments } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { buildWaitingRoom } from "@/lib/cc-waiting-room";
import { useOnboardingStore, type Task } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const TASK_TYPE_CFG: Record<Task["type"], { label: string; icon: React.ElementType; cls: string }> = {
  "onboarding-prep": { label: "Onboarding", icon: UserPlus, cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  "book-appointment": { label: "Book appointment", icon: CalendarPlus, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  "follow-up-booking": { label: "Follow-up", icon: CalendarClock, cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
};

const WR_STATUS_LABEL: Record<string, string> = {
  waiting: "Waiting", called: "Called In", "with-provider": "With Provider", "telehealth-waiting": "Virtual Lobby",
};

function SectionCard({ icon: Icon, iconCls, title, count, viewAllHref, emptyLabel, children }: {
  icon: React.ElementType; iconCls: string; title: string; count: number; viewAllHref: string; emptyLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconCls)}><Icon className="w-3.5 h-3.5" /></div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
          {count > 0 && <span className="text-xs font-bold text-slate-400">{count}</span>}
        </div>
        <Link href={viewAllHref} className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 hover:underline shrink-0">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {count === 0 ? <p className="px-4 py-6 text-xs text-slate-400 text-center">{emptyLabel}</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>}
    </div>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      {children}
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 ml-auto" />
    </Link>
  );
}

export default function CcHomePage() {
  const onboarding = useOnboardingStore();

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const requests = getRequestedAppointments();
  const waitlist = getWaitlistedAppointments();
  const openTasks = onboarding.tasks.filter((t) => t.status === "open").sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const patientMap = Object.fromEntries(CC_PATIENTS.map((p) => [p.id, p]));

  // Cross-provider waiting room — a coordinator runs traffic control across
  // every provider's patients at once, not a single provider's day.
  const wr = buildWaitingRoom();
  const wrWaiting = wr.filter((e) => e.status === "waiting" || e.status === "telehealth-waiting");
  const wrWithProvider = wr.filter((e) => e.status === "with-provider" || e.status === "called");
  const wrAvgWait = wrWaiting.length > 0 ? Math.round(wrWaiting.reduce((s, e) => s + e.waitMinutes, 0) / wrWaiting.length) : 0;
  const wrPreview = [...wrWaiting, ...wrWithProvider].slice(0, 4);

  const kpis = [
    { label: "In waiting room", value: wrWaiting.length + wrWithProvider.length, sub: wrWaiting.length > 0 ? `${wrAvgWait}m avg wait` : "clear", icon: DoorOpen, href: "/care-coordinator/waiting-room", tone: "blue" as const },
    { label: "Pending requests", value: requests.length, sub: "awaiting confirmation", icon: Inbox, href: "/care-coordinator/appointments/requests", tone: "amber" as const },
    { label: "Waitlist", value: waitlist.length, sub: `${waitlist.filter((w) => w.waitlistPriority === "crisis").length} crisis`, icon: Hourglass, href: "/care-coordinator/appointments/waitlist", tone: "slate" as const },
    { label: "Needs your action", value: openTasks.length, sub: "onboarding, booking & follow-ups", icon: CheckSquare, href: "/care-coordinator/tasks", tone: "brand" as const, big: true },
  ];
  const toneCls: Record<string, string> = {
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    brand: "bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border-slate-200 dark:border-slate-800",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-800",
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  };

  return (
    <CcLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{greeting}, Jordan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{dateLabel} · Care Coordinator · Penfield Psychiatry</p>
        </div>

        {/* KPI row — every provider's queue, not one provider's day */}
        <div data-tour="cc-home-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Link key={k.label} href={k.href} className={cn("rounded-xl border p-4 hover:shadow-sm transition-all", toneCls[k.tone], k.big && "ring-1 ring-brand-300 dark:ring-brand-700")}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{k.label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{k.value}</p>
                <p className="text-[11px] mt-0.5">{k.sub}</p>
              </Link>
            );
          })}
        </div>

        {/* Needs your action — everything another persona (a patient self-registering,
            RCM resolving eligibility, a provider recommending a follow-up) has just
            handed the coordinator to act on. This is the actual job, not a calendar. */}
        <div data-tour="cc-home-actions" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center">
                <CheckSquare className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Needs your action</h2>
              {openTasks.length > 0 && <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{openTasks.length}</span>}
            </div>
            <Link href="/care-coordinator/tasks" className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 hover:underline">All tasks <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {openTasks.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Nothing waiting on you — new patient submissions, resolved eligibility, and provider follow-ups will land here.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {openTasks.slice(0, 6).map((t) => {
                const cfg = TASK_TYPE_CFG[t.type];
                const Icon = cfg.icon;
                return (
                  <Link key={t.id} href="/care-coordinator/tasks" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.cls)}><Icon className="w-3.5 h-3.5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
                      <p className="text-xs text-slate-400 truncate">{t.detail}</p>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0", cfg.cls)}>{cfg.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Secondary grid — live waiting room, requests, waitlist */}
        <div data-tour="cc-home-secondary" className="grid lg:grid-cols-3 gap-5">
          <SectionCard icon={DoorOpen} iconCls="bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" title="Waiting room now" count={wrPreview.length} viewAllHref="/care-coordinator/waiting-room" emptyLabel="No one checked in right now.">
            {wrPreview.map((e) => (
              <Row key={e.appointmentId} href="/care-coordinator/waiting-room">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", e.status === "with-provider" ? "bg-emerald-500" : "bg-amber-400")} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{e.patientName}</span>
                <span className="text-xs text-slate-400 truncate flex-1 min-w-0">{e.providerName} · {WR_STATUS_LABEL[e.status]}</span>
              </Row>
            ))}
          </SectionCard>

          <SectionCard icon={Inbox} iconCls="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" title="Appointment requests" count={requests.length} viewAllHref="/care-coordinator/appointments/requests" emptyLabel="No pending requests.">
            {requests.slice(0, 4).map((r) => (
              <Row key={r.id} href="/care-coordinator/appointments/requests">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{patientMap[r.patientId]?.displayName}</span>
                <span className="text-xs text-slate-400 truncate flex-1 min-w-0">{r.visitType}{r.mode !== "in-person" && ` · ${fmt12(r.startTime)}`}</span>
              </Row>
            ))}
          </SectionCard>

          <SectionCard icon={Hourglass} iconCls="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" title="Waitlist" count={waitlist.length} viewAllHref="/care-coordinator/appointments/waitlist" emptyLabel="Waitlist is empty.">
            {waitlist.slice(0, 4).map((w) => (
              <Row key={w.id} href="/care-coordinator/appointments/waitlist">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", w.waitlistPriority === "crisis" ? "bg-red-500" : w.waitlistPriority === "urgent" ? "bg-amber-500" : "bg-slate-300")} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{patientMap[w.patientId]?.displayName}</span>
                <span className="text-xs text-slate-400 truncate flex-1 min-w-0">{w.visitType}</span>
              </Row>
            ))}
          </SectionCard>
        </div>
      </div>
    </CcLayout>
  );
}
