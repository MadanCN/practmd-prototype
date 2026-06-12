"use client";

import { useRouter } from "next/navigation";
import { Shield, HeartHandshake, Stethoscope, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    id: "admin",
    label: "Admin",
    description: "Manage clinics, providers, global configurations and system settings",
    icon: Shield,
    href: "/admin",
    available: true,
    accent: "blue",
  },
  {
    id: "care-coordinator",
    label: "Care Coordinator",
    description: "Schedule appointments, coordinate patient care and manage communications",
    icon: HeartHandshake,
    href: "/care-coordinator/appointments/calendar",
    available: true,
    accent: "teal",
  },
  {
    id: "provider",
    label: "Provider",
    description: "View your schedule, manage patient sessions and clinical notes",
    icon: Stethoscope,
    href: "/provider",
    available: true,
    accent: "violet",
  },
  {
    id: "patient",
    label: "Patient",
    description: "Access your health records, appointments and messages",
    icon: User,
    href: "/patient",
    available: true,
    accent: "emerald",
  },
] as const;

const accentMap = {
  blue: {
    ring: "ring-blue-500",
    bg: "bg-blue-600",
    iconBg: "bg-blue-600/10",
    iconColor: "text-blue-500",
    badge: "bg-blue-600 text-white",
    hover: "hover:border-blue-400 hover:shadow-blue-100 dark:hover:shadow-blue-900/30",
  },
  teal: {
    ring: "ring-teal-500",
    bg: "bg-teal-600",
    iconBg: "bg-teal-600/10",
    iconColor: "text-teal-500",
    badge: "bg-teal-600 text-white",
    hover: "hover:border-teal-400 hover:shadow-teal-100 dark:hover:shadow-teal-900/30",
  },
  violet: {
    ring: "ring-violet-500",
    bg: "bg-violet-600",
    iconBg: "bg-violet-600/10",
    iconColor: "text-violet-500",
    badge: "bg-violet-600 text-white",
    hover: "hover:border-violet-400 hover:shadow-violet-100 dark:hover:shadow-violet-900/30",
  },
  emerald: {
    ring: "ring-emerald-500",
    bg: "bg-emerald-600",
    iconBg: "bg-emerald-600/10",
    iconColor: "text-emerald-500",
    badge: "bg-emerald-600 text-white",
    hover: "hover:border-emerald-400 hover:shadow-emerald-100 dark:hover:shadow-emerald-900/30",
  },
};

export default function RoleSelector() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Logo + heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/50">
              P
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">PractMD</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 text-base">Select your role to continue</p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-4">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const a = accentMap[role.accent];
            return (
              <button
                key={role.id}
                onClick={() => role.available && router.push(role.href)}
                disabled={!role.available}
                className={cn(
                  "group relative text-left p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm",
                  "transition-all duration-200 shadow-lg",
                  role.available
                    ? cn("cursor-pointer hover:shadow-xl", a.hover)
                    : "cursor-not-allowed opacity-60"
                )}
              >
                {/* Coming soon badge */}
                {!role.available && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 uppercase tracking-wider">
                    Soon
                  </span>
                )}

                {/* Icon */}
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", a.iconBg)}>
                  <Icon className={cn("w-6 h-6", a.iconColor)} />
                </div>

                {/* Label */}
                <h2 className="text-lg font-semibold text-white mb-2">{role.label}</h2>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed">{role.description}</p>

                {/* Arrow indicator on hover */}
                {role.available && (
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
                    <span>Enter</span>
                    <svg className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          PractMD Admin Platform · v2.0 · All rights reserved
        </p>
      </div>
    </div>
  );
}
