"use client";

// Per-user "Recents" — recently opened records and objects, most recent first.
// Convenience, not a permission bypass: an entry the provider can no longer
// reach renders as unavailable rather than opening (checked at render time
// against the panel). Clearable by the provider.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";

export type RecentKind = "patient" | "note" | "appointment" | "thread" | "task";

export interface RecentEntry {
  kind: RecentKind;
  refId: string;
  title: string;
  subtitle?: string;
  href: string;
  at: string;
}

interface RecentsState {
  entries: RecentEntry[];
}

const store = createPersistedStore<RecentsState>({
  key: "provider-recents",
  initial: { entries: [] },
});

export function useRecents() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function getRecents(): RecentEntry[] {
  return store.get().entries;
}

export function addRecent(e: Omit<RecentEntry, "at">) {
  store.set((s) => ({
    entries: [
      { ...e, at: new Date().toISOString() },
      ...s.entries.filter((x) => !(x.kind === e.kind && x.refId === e.refId)),
    ].slice(0, 40),
  }));
}

export function clearRecents() {
  store.set(() => ({ entries: [] }));
}
