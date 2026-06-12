"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Building2,
  Briefcase,
  Hospital,
  ShieldCheck,
  Users,
  FileText,
  LayoutTemplate,
  PersonStanding,
  ClipboardList,
  BarChart3,
  Settings,
  MessageSquareHeart,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

const NAV = [
  {
    items: [{ label: "Home", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Administration",
    items: [
      { label: "Global Masters", href: "/global-masters", icon: Globe },
      { label: "Organization", href: "/organization", icon: Building2 },
      { label: "Practice", href: "/practice", icon: Briefcase },
      { label: "Clinic Management", href: "/clinic-management", icon: Hospital },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Admins", href: "/admins", icon: ShieldCheck },
      { label: "Provider & Staff", href: "/provider-staff", icon: Stethoscope },
      { label: "Forms", href: "/forms", icon: FileText },
      { label: "Plan Builder", href: "/plan-builder", icon: LayoutTemplate },
      { label: "Patients", href: "/patients", icon: PersonStanding },
    ],
  },
  {
    title: "Approvals",
    items: [
      { label: "Leave Approvals", href: "/admin/leave-approvals", icon: CalendarRange },
    ],
  },
  {
    title: "Insights & Control",
    items: [
      { label: "Audit Log", href: "/audit-log", icon: ClipboardList },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
];

const BOTTOM_NAV = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Support / Feedback", href: "/support", icon: MessageSquareHeart },
  { label: "Profile", href: "/profile", icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useApp();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" || pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col z-40",
        "bg-slate-900 dark:bg-slate-950 border-r border-slate-800",
        "transition-[width] duration-200 ease-in-out",
        sidebarCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-[60px] px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
            P
          </div>
          {!sidebarCollapsed && (
            <span className="text-white font-semibold text-base tracking-tight truncate">
              PractMD
            </span>
          )}
        </div>
        {!sidebarCollapsed && (
          <span className="ml-1.5 text-[10px] font-medium text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded shrink-0">
            Admin
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-3" : ""}>
            {section.title && !sidebarCollapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
            )}
            {section.title && sidebarCollapsed && (
              <div className="my-2 mx-3 h-px bg-slate-800" />
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-slate-800 py-2 px-2 space-y-0.5">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800",
                sidebarCollapsed && "justify-center px-2"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            "text-slate-500 hover:text-white hover:bg-slate-800",
            sidebarCollapsed && "justify-center px-2"
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-[18px] h-[18px] shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-[18px] h-[18px] shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
