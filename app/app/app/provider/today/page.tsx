"use client";

import Link from "next/link";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { WeekBars, SignedDonut } from "@/components/provider/today/TodayCharts";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";
import { PROVIDER_TASKS, PROVIDER_MESSAGE_THREADS, PROVIDER_RESULTS, PROVIDER_REFILLS } from "@/data/provider-today";
import { useEncounterStore, getEffectiveAppointment, checkInPatient } from "@/lib/encounter-store";
import { useEncounterNotes, getAllNotes } from "@/lib/encounter-notes-store";
import { useChargeStore } from "@/lib/charge-store";
import { buildWaitingRoom } from "@/lib/provider-schedule";
import { visitTypeDef, visitColor } from "@/lib/visit-types";
import {
  CalendarDays, DoorOpen, CheckSquare, MessageSquare, FlaskConical, Pill,
  NotebookPen, ArrowRight, ChevronRight, Video, Phone, LogIn, Play, AlertTriangle, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function daysSince(iso: string) {
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T12:00:00");
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}
function minutesUntil(dateIso: string, timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const start = new Date(dateIso + "T00:00:00");
  start.setHours(h, m, 0, 0);
  return (start.getTime() - Date.now()) / 60000;
}

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

export default function ProviderTodayPage() {
  useEncounterStore();
  useEncounterNotes();
  useChargeStore();

  const provider = PROVIDERS.find((p) => p.id === CURRENT_PROVIDER_ID)!;
  const todayIso = new Date().toISOString().split("T")[0];
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const myAppts = CC_APPOINTMENTS.filter((a) => a.providerId === CURRENT_PROVIDER_ID).map(getEffectiveAppointment);
  const todayAppts = myAppts
    .filter((a) => a.date === todayIso && !["cancelled", "no-show"].includes(a.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const notes = getAllNotes();
  const unsigned = notes.filter((n) => n.status !== "signed").sort((a, b) => daysSince(b.date) - daysSince(a.date));
  const signedCount = notes.length - unsigned.length;
  const revenueAtRisk = unsigned.reduce((s, n) => s + visitTypeDef(n.visitType).typicalCharge, 0);

  const wr = buildWaitingRoom(CURRENT_PROVIDER_ID);
  const waiting = wr.filter((e) => e.status === "waiting" || e.status === "telehealth-waiting");

  const openTasks = PROVIDER_TASKS.filter((t) => t.status === "open").sort((a, b) => (a.overdue ? -1 : 0) - (b.overdue ? -1 : 0));
  const unreadMessages = PROVIDER_MESSAGE_THREADS.filter((m) => m.unread).sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
  const unreviewedResults = PROVIDER_RESULTS.filter((r) => !r.reviewed);
  const pendingRefills = PROVIDER_REFILLS.filter((r) => r.status === "pending");

  // week bar data — appts/day this Mon–Sun
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    return {
      label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      value: myAppts.filter((a) => a.date === iso && !["cancelled", "no-show"].includes(a.status)).length,
      today: iso === todayIso,
    };
  });

  const kpis = [
    { label: "Unsigned notes", value: unsigned.length, sub: `$${revenueAtRisk.toLocaleString()} unbilled`, icon: NotebookPen, href: "/provider/encounter-notes", tone: "amber" as const, big: true },
    { label: "Today's appointments", value: todayAppts.length, sub: `${todayAppts.filter((a) => a.status === "completed").length} done`, icon: CalendarDays, href: "/provider/appointments/list", tone: "brand" as const },
    { label: "In waiting room", value: waiting.length, sub: `${wr.length} checked in`, icon: DoorOpen, href: "/provider/waiting-room", tone: "blue" as const },
    { label: "Open tasks", value: openTasks.length, sub: `${openTasks.filter((t) => t.overdue).length} overdue`, icon: CheckSquare, href: "/provider/tasks", tone: "slate" as const },
  ];
  const toneCls: Record<string, string> = {
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    brand: "bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border-slate-200 dark:border-slate-800",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-800",
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  };

  return (
    <ProviderLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-5" data-tour="today-greeting">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{greeting}, {provider.firstName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{dateLabel} · {provider.credentials} · Penfield Psychiatry</p>
        </div>

        {/* KPI row — revenue-first */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" data-tour="today-kpis">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Link key={k.label} href={k.href} data-tour={k.big ? "today-kpi-unsigned" : undefined}
                className={cn("rounded-xl border p-4 hover:shadow-sm transition-all", toneCls[k.tone], k.big && "ring-1 ring-amber-300 dark:ring-amber-700")}>
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

        {/* Needs your signature — top priority */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6" data-tour="today-needs-sig">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Needs your signature</h2>
              {unsigned.length > 0 && <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{unsigned.length} · ${revenueAtRisk.toLocaleString()}</span>}
            </div>
            <Link href="/provider/encounter-notes" className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 hover:underline">All notes <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {unsigned.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Every note is signed — nothing sitting unbilled.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {unsigned.slice(0, 6).map((n) => {
                    const age = daysSince(n.date);
                    return (
                      <tr key={n.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{n.patientName}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visitColor(n.visitType) }} />{n.visitType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">${visitTypeDef(n.visitType).typicalCharge}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn("text-xs font-medium", age > 7 ? "text-red-600 dark:text-red-400" : age > 2 ? "text-amber-600 dark:text-amber-400" : "text-slate-400")}>
                            {age === 0 ? "Today" : `${age}d old`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/provider/encounters/${n.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                            Open note <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Today's schedule */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6" data-tour="today-schedule">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Today&apos;s schedule</h2>
            <Link href="/provider/appointments" className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 hover:underline">Calendar <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayAppts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No appointments scheduled for today.</div>
            ) : todayAppts.map((appt) => {
              const patient = CC_PATIENTS.find((p) => p.id === appt.patientId);
              const color = visitColor(appt.visitType);
              const ModeIcon = appt.mode === "telehealth" ? Video : appt.mode === "phone" ? Phone : CalendarDays;
              const mins = minutesUntil(appt.date, appt.startTime);
              const canCheckIn = appt.status === "confirmed" && mins <= 30 && mins >= -120;
              const inFlight = appt.status === "arrived" || appt.status === "in-session";
              return (
                <div key={appt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <Link href={`/provider/appointments/list?appt=${appt.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{patient?.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{appt.visitType}</p>
                  </Link>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{fmt12(appt.startTime)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <ModeIcon className="w-3 h-3 text-slate-400" /><span className="text-[10px] text-slate-400 capitalize">{appt.mode}</span>
                    </div>
                  </div>
                  {appt.mode === "telehealth" && (appt.status === "confirmed" || inFlight) ? (
                    <Link href={`/provider/telehealth/${appt.id}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg practmd-gradient text-white text-[10px] font-bold shrink-0">
                      <Video className="w-3 h-3" /> Join
                    </Link>
                  ) : inFlight ? (
                    <Link href={`/provider/appointments/list?appt=${appt.id}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                      <Play className="w-3 h-3" /> Session
                    </Link>
                  ) : canCheckIn ? (
                    <button onClick={() => checkInPatient(appt)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg practmd-gradient text-white text-[10px] font-bold shrink-0">
                      <LogIn className="w-3 h-3" /> Check in
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-300 dark:text-slate-600 shrink-0 w-14 text-right capitalize">{appt.status === "completed" ? "done" : "—"}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Visuals */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6" data-tour="today-charts">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Appointments this week</h3>
            </div>
            <WeekBars data={weekData} />
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <NotebookPen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Documentation status</h3>
            </div>
            <SignedDonut signed={signedCount} pending={unsigned.length} />
          </div>
        </div>

        {/* Secondary grid */}
        <div className="grid lg:grid-cols-2 gap-5" data-tour="today-secondary">
          <SectionCard icon={CheckSquare} iconCls="bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400" title="Tasks" count={openTasks.length} viewAllHref="/provider/tasks" emptyLabel="No open tasks.">
            {openTasks.slice(0, 4).map((t) => (
              <Row key={t.id} href={`/provider/tasks?task=${t.id}`}>
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.overdue ? "bg-red-500" : t.priority === "high" ? "bg-amber-500" : "bg-slate-300")} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{t.title}</span>
                <span className={cn("text-xs shrink-0", t.overdue ? "text-red-500 font-medium" : "text-slate-400")}>{t.dueLabel}</span>
              </Row>
            ))}
          </SectionCard>

          <SectionCard icon={MessageSquare} iconCls="bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" title="Unread messages" count={unreadMessages.length} viewAllHref="/provider/messages/patients" emptyLabel="No unread messages.">
            {unreadMessages.slice(0, 4).map((m) => (
              <Row key={m.id} href={`/provider/messages/${m.channel}?thread=${m.id}`}>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{m.participantName}</span>
                <span className="text-xs text-slate-400 truncate flex-1 min-w-0">{m.subject}</span>
                {m.urgent && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
              </Row>
            ))}
          </SectionCard>

          <SectionCard icon={FlaskConical} iconCls="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" title="Results to review" count={unreviewedResults.length} viewAllHref="/provider/results" emptyLabel="No results awaiting review.">
            {unreviewedResults.slice(0, 4).map((r) => (
              <Row key={r.id} href={`/provider/results?result=${r.id}`}>
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", r.flag === "critical" ? "bg-red-500" : r.flag === "abnormal" ? "bg-amber-500" : "bg-emerald-500")} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{r.patientName}</span>
                <span className="text-xs text-slate-400 truncate flex-1 min-w-0">{r.testName}</span>
              </Row>
            ))}
          </SectionCard>

          <SectionCard icon={Pill} iconCls="bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400" title="Refill requests" count={pendingRefills.length} viewAllHref="/provider/refills" emptyLabel="No pending refill requests.">
            {pendingRefills.slice(0, 4).map((r) => (
              <Row key={r.id} href={`/provider/refills?refill=${r.id}`}>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{r.patientName}</span>
                <span className="text-xs text-slate-400 truncate flex-1 min-w-0">{r.medication}</span>
                {r.urgent && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
              </Row>
            ))}
          </SectionCard>
        </div>
      </div>
    </ProviderLayout>
  );
}
