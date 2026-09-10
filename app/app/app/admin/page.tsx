import AppLayout from "@/components/layout/AppLayout";
import {
  Users, CalendarDays, ClipboardCheck, TrendingUp, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATS = [
  { label: "Total Patients", value: "12,847", change: "+4.6%", up: true, icon: Users, color: "blue" },
  { label: "Active Providers", value: "64", change: "+2", up: true, icon: Activity, color: "emerald" },
  { label: "Appointments Today", value: "238", change: "-12%", up: false, icon: CalendarDays, color: "violet" },
  { label: "Pending Forms", value: "91", change: "+18", up: false, icon: ClipboardCheck, color: "amber" },
];

const RECENT_ACTIVITY = [
  { action: "New patient registered", detail: "James Holloway — Penfield Psychiatry", time: "3 min ago" },
  { action: "Appointment rescheduled", detail: "Dr. Sarah Mitchell — Apr 14, 2:30 PM", time: "17 min ago" },
  { action: "Provider onboarded", detail: "Dr. Michael Torres — NHPS", time: "1 hr ago" },
  { action: "Form template updated", detail: "PHQ-9 Assessment v3", time: "2 hr ago" },
  { action: "Audit log exported", detail: "By admin@practmd.com", time: "3 hr ago" },
  { action: "Clinic settings changed", detail: "Penfield Psychiatry — timezone", time: "5 hr ago" },
];

const ALERTS = [
  { msg: "3 providers have incomplete credential verification", severity: "error" },
  { msg: "Insurance plan renewal due in 7 days for NHPS", severity: "warning" },
  { msg: "New PHQ-9 guidelines published — review recommended", severity: "info" },
];

const QUICK_LINKS = [
  { label: "Add Organization", href: "/organization" },
  { label: "Onboard Provider", href: "/provider-staff" },
  { label: "Create Practice", href: "/practice" },
  { label: "Configure Clinic", href: "/clinic-management" },
  { label: "Manage Patients", href: "/patients" },
  { label: "View Analytics", href: "/analytics" },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
};

export default function AdminPage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Good morning, Admin</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Here&apos;s what&apos;s happening across your clinics today.</p>
      </div>

      <div className="mb-6 space-y-2">
        {ALERTS.map((alert, i) => (
          <div key={i} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl text-sm border",
            alert.severity === "error" && "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400",
            alert.severity === "warning" && "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400",
            alert.severity === "info" && "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400"
          )}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{alert.msg}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colorMap[stat.color])}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className={cn("flex items-center gap-0.5 text-xs font-medium", stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
                  {stat.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Recent Activity</h2>
            <span className="text-xs text-blue-500 cursor-pointer hover:underline">View all</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.action}</p>
                  <p className="text-xs text-slate-400 truncate">{item.detail}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Clinics Overview</h2>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {[
                { name: "Penfield Psychiatry", patients: 7320, providers: 38 },
                { name: "New Hartford Psychological Services", patients: 5527, providers: 26 },
              ].map((clinic, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{clinic.name}</p>
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span><strong className="text-slate-600 dark:text-slate-300">{clinic.patients.toLocaleString()}</strong> patients</span>
                    <span><strong className="text-slate-600 dark:text-slate-300">{clinic.providers}</strong> providers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Quick Actions</h2>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {QUICK_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-900">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
