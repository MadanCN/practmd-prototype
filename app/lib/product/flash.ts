"use client";

import { useSyncExternalStore } from "react";

// Tiny store of ids that should briefly highlight (someone else changed them, or they were just added).

const FLASH_MS = 2200;
const flashing = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  listeners.forEach((l) => l());
}

export function flash(id: string) {
  flashing.add(id);
  emit();
  window.setTimeout(() => {
    flashing.delete(id);
    emit();
  }, FLASH_MS);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Re-renders when the flash set changes; returns whether `id` is flashing. */
export function useFlashing(id: string): boolean {
  useSyncExternalStore(subscribe, () => version, () => 0);
  return flashing.has(id);
}
