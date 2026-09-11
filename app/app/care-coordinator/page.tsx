"use client";

import Link from "next/link";
import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import {
  CalendarDays, DoorOpen, Inbox, Hourglass, ArrowRight, ChevronRight, CheckSquare,
  ShieldAlert, Video, Phone, MapPin, AlertTriangle,
} from "lucide-react";
import { CC_APPOINTMENTS, getRequestedAppointments, getWaitlistedAppointments } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { visitColor } from "@/lib/visit-types";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { useInsuranceStore, getLatestEligibility, isSelfPay } from "@/lib/insurance-store";
import { useInvoiceStore, getInvoices } from "@/lib/invoice-store";
import { cn } from "@/lib/utils";

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
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

export default function CcHomePage() {
  const onboarding = useOnboardingStore();
  useInsuranceStore();
  useInvoiceStore();

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const todayIso = now.toISOString().split("T")[0];

  const todayAppts = CC_APPOINTMENTS
    .filter((a) => a.date === todayIso && !["cancelled", "no-show", "waitlisted", "requested"].includes(a.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const waitingRoom = todayAppts.filter((a) => a.status === "arrived" || a.status === "in-session");
  const requests = getRequestedAppointments();
  const waitlist = getWaitlistedAppointments();
  const openTasks = onboarding.tasks.filter((t) => t.status === "open");

  const patientMap = Object.fromEntries(CC_PATIENTS.map((p) => [p.id, p]));

  // Coverage attention: today's patients whose latest eligibility isn't clean, or who are self-pay.
  const coverageAttention = todayAppts
    .map((a) => {
      const patient = patientMap[a.patientId];
      if (!patient) return null;
      if (isSelfPay(a.patientId)) return { appt: a, patient, kind: "self-pay" as const };
      const latest = getLatestEligibility(a.patientId);
      if (latest && latest.status !== "eligible") return { appt: a, patient, kind: latest.status };
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const todayInvoices = getInvoices().filter((i) => i.createdAt.startsWith(todayIso));
  const collectedToday = todayInvoices.reduce((s, i) => s + i.amountPaid, 0);
  const outstandingToday = todayInvoices.reduce((s, i) => s + i.amountDue, 0);

  const kpis = [
    { label: "Today's appointments", value: todayAppts.length, sub: `${todayAppts.filter((a) => a.status === "completed").length} done`, icon: CalendarDays, href: "/care-coordinator/appointments/list", tone: "brand" as const },
    { label: "In waiting room", value: waitingRoom.length, sub: `${waitingRoom.filter((a) => a.mode === "telehealth").length} telehealth`, icon: DoorOpen, href: "/care-coordinator/waiting-room", tone: "blue" as const },
    { label: "Pending requests", value: requests.length, sub: "awaiting confirmation", icon: Inbox, href: "/care-coordinator/appointments/requests", tone: "amber" as const },
    { label: "Waitlist", value: waitlist.length, sub: `${waitlist.filter((w) => w.waitlistPriority === "crisis").length} crisis`, icon: Hourglass, href: "/care-coordinator/appointments/waitlist", tone: "slate" as const },
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

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Link key={k.label} href={k.href} className={cn("rounded-xl border p-4 hover:shadow-sm transition-all", toneCls[k.tone])}>
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

        {/* Coverage / billing attention */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Coverage needs attention — today</h2>
              {coverageAttention.length > 0 && <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{coverageAttention.length}</span>}
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">Collected today <b className="text-emerald-600 dark:text-emerald-400">${collectedToday.toFixed(2)}</b></span>
              {outstandingToday > 0 && <span className="text-slate-400">Outstanding <b className="text-amber-600 dark:text-amber-400">${outstandingToday.toFixed(2)}</b></span>}
            </div>
          </div>
          {coverageAttention.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Every patient on today&apos;s schedule has verified, active coverage or is confirmed self-pay.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {coverageAttention.map(({ appt, patient, kind }) => (
                <Link key={appt.id} href={`/care-coordinator/patients/${patient.id}?section=insurance`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <AlertTriangle className={cn("w-4 h-4 shrink-0", kind === "self-pay" ? "text-slate-400" : "text-amber-500")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{patient.displayName}</p>
                    <p className="text-xs text-slate-400">{fmt12(appt.startTime)} · {appt.visitType}</p>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0",
                    kind === "self-pay" ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400")}>
                    {kind === "self-pay" ? "Self-pay" : kind === "inactive" ? "Inactive" : kind === "expired" ? "Pending renewal" : "Coverage issue"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today's schedule */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Today&apos;s schedule</h2>
            <Link href="/care-coordinator/appointments/calendar" className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 hover:underline">Calendar <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayAppts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No appointments scheduled for today.</div>
            ) : todayAppts.slice(0, 8).map((appt) => {
              const patient = patientMap[appt.patientId];
              const color = visitColor(appt.visitType);
              const ModeIcon = appt.mode === "telehealth" ? Video : appt.mode === "phone" ? Phone : MapPin;
              return (
                <Link key={appt.id} href="/care-coordinator/appointments/list" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{patient?.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{appt.visitType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{fmt12(appt.startTime)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <ModeIcon className="w-3 h-3 text-slate-400" /><span className="text-[10px] text-slate-400 capitalize">{appt.mode}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{appt.status}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Secondary grid */}
        <div className="grid lg:grid-cols-3 gap-5">
          <SectionCard icon={CheckSquare} iconCls="bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400" title="Tasks" count={openTasks.length} viewAllHref="/care-coordinator/tasks" emptyLabel="No open tasks.">
            {openTasks.slice(0, 4).map((t) => (
              <Row key={t.id} href="/care-coordinator/tasks">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-300" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{t.title}</span>
              </Row>
            ))}
          </SectionCard>

          <SectionCard icon={Inbox} iconCls="bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" title="Appointment requests" count={requests.length} viewAllHref="/care-coordinator/appointments/requests" emptyLabel="No pending requests.">
            {requests.slice(0, 4).map((r) => (
              <Row key={r.id} href="/care-coordinator/appointments/requests">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{patientMap[r.patientId]?.displayName}</span>
                <span className="text-xs text-slate-400 truncate flex-1 min-w-0">{r.visitType}</span>
              </Row>
            ))}
          </SectionCard>

          <SectionCard icon={Hourglass} iconCls="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" title="Waitlist" count={waitlist.length} viewAllHref="/care-coordinator/appointments/waitlist" emptyLabel="Waitlist is empty.">
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
