"use client";

// Tiny localStorage persistence layer for the prototype's in-memory
// useSyncExternalStore stores. The provider portal asks for state that
// survives a refresh (drafts, onboarding progress, capability overrides,
// notifications) — real persistence is a backend concern, this is the
// stand-in. SSR-safe: reads/writes are guarded and no-op on the server.

const PREFIX = "practmd.v2.";

export function loadPersisted<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function savePersisted<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function clearPersisted(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Wipe every practmd.v2.* key — used by the dev "reset prototype" action. */
export function clearAllPersisted(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/**
 * Build a persisted external store. Returns the useSyncExternalStore trio plus
 * a `set` updater and a `reset`. State is hydrated from localStorage on the
 * client after mount (never during SSR / first paint) to avoid hydration
 * mismatches — pass `onHydrate` to react to the hydrated value.
 */
export function createPersistedStore<S>(opts: {
  key: string;
  initial: S;
  /** Migrate / validate a persisted blob before it is trusted. */
  revive?: (raw: unknown, initial: S) => S;
}) {
  let state: S = opts.initial;
  let hydrated = false;
  let listeners: (() => void)[] = [];

  function emit() {
    for (const l of listeners) l();
  }
  function persist() {
    savePersisted(opts.key, state);
  }

  function hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    const raw = loadPersisted<unknown>(opts.key, null);
    if (raw != null) {
      state = opts.revive ? opts.revive(raw, opts.initial) : (raw as S);
      emit();
    }
  }

  return {
    subscribe(l: () => void) {
      listeners = [...listeners, l];
      hydrate();
      return () => {
        listeners = listeners.filter((x) => x !== l);
      };
    },
    getSnapshot() {
      return state;
    },
    getServerSnapshot() {
      return opts.initial;
    },
    get() {
      return state;
    },
    set(updater: (s: S) => S) {
      state = updater(state);
      persist();
      emit();
    },
    reset() {
      state = opts.initial;
      clearPersisted(opts.key);
      emit();
    },
    hydrate,
  };
}
