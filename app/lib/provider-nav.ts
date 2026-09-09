"use client";

// The provider rail, expressed once and filtered by the live session so the
// sidebar and the mobile bottom bar stay in agreement. Nav visibility is the
// first gate a provider feels: the limited portal shows a deliberate subset,
// the read-only (suspended) portal shows everything but the screens render
// read-only, and "Coming soon" items are shown-not-hidden.

import {
  LayoutDashboard, Users, CalendarDays, MessageSquare, CheckSquare,
  BarChart3, Clock, CalendarRange, ClipboardList, DoorOpen, FlaskConical,
  Pill, Syringe, UserRound, Building2, ListChecks,
} from "lucide-react";
import type { ProviderSession } from "@/lib/provider-session";
import { STATUS_META } from "@/data/provider-credentialing";

const BASE = "/provider";

export type PortalLevel = "activation-wizard" | "limited" | "full" | "read-only";

export interface NavChild {
  label: string;
  href: string;
  icon: React.ElementType;
}
export interface NavItem {
  key: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavChild[];
  soon?: boolean;
  /** portal levels this item shows in */
  levels: PortalLevel[];
  /** capability that must be present, if any */
  capability?: "can_book" | "can_cosign";
  /** show only when the availability policy allows self-service */
  availabilityGated?: boolean;
  badgeKey?: "notes" | "waiting" | "messages" | "tasks" | "cosign";
}

const FULL: PortalLevel[] = ["full", "read-only"];

export const PROVIDER_NAV: NavItem[] = [
  { key: "today", label: "Today", href: `${BASE}/today`, icon: LayoutDashboard, levels: FULL },
  {
    key: "schedule", label: "Schedule", icon: CalendarDays, levels: FULL,
    children: [
      { label: "Calendar", href: `${BASE}/appointments`, icon: CalendarDays },
      { label: "List", href: `${BASE}/appointments/list`, icon: ListChecks },
    ],
  },
  { key: "notes", label: "Clinical Notes", href: `${BASE}/encounter-notes`, icon: ClipboardList, levels: FULL, badgeKey: "notes" },
  { key: "cosign", label: "To Co-sign", href: `${BASE}/encounter-notes?filter=to-cosign`, icon: ListChecks, levels: ["full"], capability: "can_cosign", badgeKey: "cosign" },
  { key: "waiting", label: "Waiting Room", href: `${BASE}/waiting-room`, icon: DoorOpen, levels: ["full"], badgeKey: "waiting" },
  {
    key: "messages", label: "Messages", icon: MessageSquare, levels: ["limited", "full", "read-only"], badgeKey: "messages",
    children: [
      { label: "Patients", href: `${BASE}/messages/patients`, icon: UserRound },
      { label: "Internal", href: `${BASE}/messages/internal`, icon: Building2 },
    ],
  },
  { key: "patients", label: "Patients", href: `${BASE}/patients`, icon: Users, levels: FULL },
  { key: "tasks", label: "Tasks", href: `${BASE}/tasks`, icon: CheckSquare, levels: ["full"], badgeKey: "tasks" },
  { key: "results", label: "Results", href: `${BASE}/results`, icon: FlaskConical, soon: true, levels: ["full"] },
  { key: "refills", label: "Refill Requests", href: `${BASE}/refills`, icon: Pill, soon: true, levels: ["full"] },
  { key: "medication", label: "Medication", href: `${BASE}/medication`, icon: Syringe, soon: true, levels: ["full"] },
  { key: "reports", label: "Reports", href: `${BASE}/reports`, icon: BarChart3, levels: FULL },
  { key: "recents", label: "Recents", href: `${BASE}/recents`, icon: Clock, levels: FULL },
  { key: "readiness", label: "Account Readiness", href: `${BASE}/readiness`, icon: ListChecks, levels: ["limited", "read-only"] },
  { key: "availability", label: "My Availability", href: `${BASE}/availability`, icon: CalendarRange, levels: ["limited", "full", "read-only"], availabilityGated: true },
];

export function portalLevel(session: ProviderSession): PortalLevel {
  const p = STATUS_META[session.clinicalStatus].permits.portal;
  return p === "none" ? "limited" : (p as PortalLevel);
}

export function visibleNav(session: ProviderSession, opts: { availabilitySelfService: boolean }): NavItem[] {
  const level = portalLevel(session);
  return PROVIDER_NAV.filter((item) => {
    if (!item.levels.includes(level)) return false;
    if (item.capability && !session.capabilities[item.capability]) return false;
    if (item.availabilityGated && !opts.availabilitySelfService) return false;
    return true;
  });
}
