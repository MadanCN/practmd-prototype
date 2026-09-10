"use client";

// Shared store bridging the Global Masters "Provider Availability" config
// (Users & Access > Providers > Provider Availability) and the Provider
// portal's My Availability page. Toggling a setting in Global Masters is
// immediately reflected for providers in the same browser session — same
// governance-loop pattern as lib/onboarding-store.ts.

import { useSyncExternalStore } from "react";
import { DAYS, type DayName } from "@/data/clinics";

export type AvailabilityRequestType = "leave" | "block-time" | "hours-change";
export type AvailabilityRequestStatus = "pending" | "approved" | "auto-approved" | "rejected";

export interface WorkingHoursDraftDay {
  day: DayName;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
}

export interface AvailabilityRequest {
  id: string;
  providerId: string;
  providerName: string;
  type: AvailabilityRequestType;
  startDateTime?: string;
  endDateTime?: string;
  blockDate?: string;
  blockStart?: string;
  blockEnd?: string;
  proposedHours?: WorkingHoursDraftDay[];
  reason: string;
  status: AvailabilityRequestStatus;
  approverName?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ToggleConfig {
  allow: boolean;
  approvalRequired: boolean;
  approvalTarget: string | null;
}

export interface ApprovalTargetOption {
  id: string;
  name: string;
}

export const APPROVAL_TARGETS: ApprovalTargetOption[] = [
  { id: "s10", name: "Priya Nair — Administration" },
  { id: "s1", name: "Aelxa Chatmon — Operations" },
  { id: "s11", name: "Derek Owens — Billing" },
  { id: "practice-manager", name: "Practice Manager (role)" },
  { id: "clinic-admin", name: "Clinic Admin (role)" },
];

interface StoreState {
  leave: ToggleConfig;
  blockTime: ToggleConfig;
  hoursChange: ToggleConfig;
  requests: AvailabilityRequest[];
}

function now() {
  return new Date().toISOString();
}
function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Deterministic "day offset + fixed clock time" ISO string. Unlike
 *  `new Date(Date.now() + offset).toISOString()`, this zeroes out
 *  hours/minutes before applying the offset, so seed data rendered with
 *  minute precision (e.g. via toLocaleString) stays identical between the
 *  server-render pass and the client-hydration pass — a few seconds apart
 *  in real time would otherwise land on different minutes and trigger a
 *  React hydration mismatch. */
function dayAt(offsetDays: number, hh: number, mm: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

let state: StoreState = {
  leave: { allow: true, approvalRequired: true, approvalTarget: "s10" },
  blockTime: { allow: true, approvalRequired: true, approvalTarget: "s10" },
  hoursChange: { allow: true, approvalRequired: true, approvalTarget: "clinic-admin" },
  requests: [
    {
      id: "avr1",
      providerId: "p1",
      providerName: "Dr. Sarah Mitchell",
      type: "leave",
      startDateTime: dayAt(1, 9, 0),
      endDateTime: dayAt(3, 17, 0),
      reason: "Family vacation — planned travel",
      status: "pending",
      approverName: "Priya Nair — Administration",
      createdAt: dayAt(-2, 9, 15),
    },
    {
      id: "avr2",
      providerId: "p1",
      providerName: "Dr. Sarah Mitchell",
      type: "block-time",
      blockDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      blockStart: "13:00",
      blockEnd: "15:00",
      reason: "CME conference session",
      status: "approved",
      approverName: "Priya Nair — Administration",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      resolvedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: "avr3",
      providerId: "p1",
      providerName: "Dr. Sarah Mitchell",
      type: "leave",
      startDateTime: dayAt(-20, 9, 0),
      endDateTime: dayAt(-20, 17, 0),
      reason: "Personal day",
      status: "rejected",
      approverName: "Priya Nair — Administration",
      createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
      resolvedAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    },
  ],
};

type Listener = () => void;
let listeners: Listener[] = [];
function emit() {
  for (const l of listeners) l();
}
function subscribe(listener: Listener) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
function getSnapshot() {
  return state;
}
function set(updater: (s: StoreState) => StoreState) {
  state = updater(state);
  emit();
}

export function useProviderAvailabilityStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ── Global Masters admin actions ─────────────────────────────────────────────

export function updateToggle(kind: "leave" | "blockTime" | "hoursChange", changes: Partial<ToggleConfig>) {
  set((s) => ({ ...s, [kind]: { ...s[kind], ...changes } }));
}

// ── Provider portal actions ──────────────────────────────────────────────────

function resolveStatus(cfg: ToggleConfig): { status: AvailabilityRequestStatus; approverName?: string } {
  if (!cfg.approvalRequired) return { status: "auto-approved" };
  const target = APPROVAL_TARGETS.find((t) => t.id === cfg.approvalTarget);
  return { status: "pending", approverName: target?.name };
}

export function submitLeaveRequest(providerId: string, providerName: string, startDateTime: string, endDateTime: string, reason: string) {
  const { status, approverName } = resolveStatus(state.leave);
  const req: AvailabilityRequest = { id: id("avr"), providerId, providerName, type: "leave", startDateTime, endDateTime, reason, status, approverName, createdAt: now(), resolvedAt: status === "auto-approved" ? now() : undefined };
  set((s) => ({ ...s, requests: [req, ...s.requests] }));
  return req;
}

export function submitBlockTimeRequest(providerId: string, providerName: string, blockDate: string, blockStart: string, blockEnd: string, reason: string) {
  const { status, approverName } = resolveStatus(state.blockTime);
  const req: AvailabilityRequest = { id: id("avr"), providerId, providerName, type: "block-time", blockDate, blockStart, blockEnd, reason, status, approverName, createdAt: now(), resolvedAt: status === "auto-approved" ? now() : undefined };
  set((s) => ({ ...s, requests: [req, ...s.requests] }));
  return req;
}

export function submitHoursChangeRequest(providerId: string, providerName: string, proposedHours: WorkingHoursDraftDay[], reason: string) {
  const { status, approverName } = resolveStatus(state.hoursChange);
  const req: AvailabilityRequest = { id: id("avr"), providerId, providerName, type: "hours-change", proposedHours, reason, status, approverName, createdAt: now(), resolvedAt: status === "auto-approved" ? now() : undefined };
  set((s) => ({ ...s, requests: [req, ...s.requests] }));
  return req;
}

export { DAYS };
