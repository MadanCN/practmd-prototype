"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ProductUser } from "@/lib/product/session";

interface SessionValue {
  user: ProductUser;
  team: ProductUser[];
  canEdit: boolean;
  isAdmin: boolean;
  /** Display name for an email, falling back to the part before the @. */
  nameFor: (email: string | null | undefined) => string;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ user, team, children }: { user: ProductUser; team: ProductUser[]; children: ReactNode }) {
  const value = useMemo<SessionValue>(() => {
    const names = new Map(team.map((u) => [u.email, u.displayName]));
    return {
      user,
      team,
      canEdit: user.role === "editor" || user.role === "admin",
      isAdmin: user.role === "admin",
      nameFor: (email) => {
        if (!email) return "Someone";
        const e = email.toLowerCase();
        return names.get(e) || e.split("@")[0];
      },
    };
  }, [user, team]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

export function initials(nameOrEmail: string) {
  const base = nameOrEmail.split("@")[0];
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
