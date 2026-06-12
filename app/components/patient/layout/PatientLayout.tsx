"use client";

import { useState } from "react";
import PatientSidebar from "./PatientSidebar";
import { Bell, Sun, Moon, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const BREADCRUMB: Record<string, string> = {
  "/patient/home":                    "Home",
  "/patient/visits":                  "My Visits — Upcoming",
  "/patient/visits/past":             "My Visits — Past",
  "/patient/visits/schedule":         "Book Appointment",
  "/patient/records/health-profile":  "Health Profile",
  "/patient/records/insurance":       "Insurance",
  "/patient/records/forms":           "Forms & Intake",
  "/patient/records/documents":       "Documents",
  "/patient/records/allergies":       "Allergies",
  "/patient/messages":                "Messages",
  "/patient/profile":                 "Profile",
};

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const pathname = usePathname();
  const isTelehealth = pathname?.startsWith("/patient/telehealth");
  const title = BREADCRUMB[pathname ?? ""] ?? "Patient Portal";

  if (isTelehealth) {
    return <div className={dark ? "dark" : ""}>{children}</div>;
  }

  return (
    <div className={cn("min-h-screen", dark ? "dark bg-slate-950" : "bg-slate-50")}>
      <PatientSidebar />

      {/* Header */}
      <header className={cn(
        "fixed top-0 right-0 h-[60px] z-30 flex items-center px-6 border-b",
        "left-[240px] transition-[left] duration-200",
        dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
          <span className={cn("font-semibold truncate", dark ? "text-slate-100" : "text-slate-800")}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className={cn("relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
            dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}>
            <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          </button>
          <button onClick={() => setDark(d => !d)}
            className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}>
            {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-[11px] font-bold text-white">JH</div>
        </div>
      </header>

      {/* Main */}
      <main className="pl-[240px] pt-[60px] min-h-screen transition-[padding] duration-200">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
