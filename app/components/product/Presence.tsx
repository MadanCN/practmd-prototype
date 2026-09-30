"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/product/supabase/client";
import { sharedChannel, subscribeShared } from "@/lib/product/realtime";
import { initials, useSession } from "@/components/product/SessionContext";
import { cn } from "@/lib/utils";

export interface OnlineUser {
  email: string;
  name: string;
  page: string;
}

const PresenceContext = createContext<OnlineUser[]>([]);
const PRESENCE_TOPIC = "product-presence";

const PAGE_LABEL: Record<string, string> = {
  priorities: "Priorities",
  workstreams: "Workstreams",
  timeline: "Timeline",
  challenges: "Challenges",
};

/** Supabase Presence: who has the Product section open, and on which tab. */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const pathname = usePathname();
  const page = pathname.split("/")[2] ?? "";
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const release = subscribeShared(
      getSupabaseBrowserClient(),
      PRESENCE_TOPIC,
      (channel, emit) => channel.on("presence", { event: "sync" }, () => emit("sync", channel.presenceState<OnlineUser>())),
      (kind, payload) => {
        if (kind === "status") setJoined(payload === "SUBSCRIBED");
        if (kind !== "sync") return;
        const seen = new Map<string, OnlineUser>();
        for (const metas of Object.values(payload as Record<string, OnlineUser[]>)) {
          const latest = metas[metas.length - 1];
          if (latest) seen.set(latest.email, { email: latest.email, name: latest.name, page: latest.page });
        }
        setOnline([...seen.values()].sort((a, b) => a.name.localeCompare(b.name)));
      },
      { config: { presence: { key: user.email } } },
    );
    return release;
  }, [user.email]);

  useEffect(() => {
    if (!joined) return;
    void sharedChannel(PRESENCE_TOPIC)?.track({ email: user.email, name: user.displayName || user.email.split("@")[0], page });
  }, [joined, page, user.email, user.displayName]);

  return <PresenceContext.Provider value={online}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  return useContext(PresenceContext);
}

/** Initials of everyone online. Pass `page` to show only people on that tab. */
export function PresenceAvatars({ page, max = 6, className }: { page?: string; max?: number; className?: string }) {
  const online = usePresence().filter((u) => !page || u.page === page);
  if (!online.length) return null;
  const shown = online.slice(0, max);
  const label = `Online: ${online.map((u) => `${u.name}${PAGE_LABEL[u.page] ? ` (${PAGE_LABEL[u.page]})` : ""}`).join(", ")}`;
  return (
    <div className={cn("flex items-center", className)} role="group" aria-label={label} title={label}>
      {shown.map((u) => (
        <span
          key={u.email}
          className="-ml-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-pm-navy bg-pm-teal text-[10px] font-semibold text-white first:ml-0"
        >
          {initials(u.name)}
        </span>
      ))}
      {online.length > max && <span className="ml-1 text-xs text-white/80">+{online.length - max}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
}
