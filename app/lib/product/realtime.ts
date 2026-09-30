"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ProductSupabase } from "@/lib/product/supabase/client";

// Shared, ref-counted Realtime channels.
//
// supabase-js hands back the existing channel for a topic, and removing one is async. When a
// component unmounts and remounts quickly (React StrictMode in dev, fast tab switches), the new
// mount would get the channel the old cleanup is tearing down, and silently stop receiving events.
// Here one channel per topic is created once, listeners come and go, and the channel is only removed
// a moment after its last listener leaves.

type Listener = (kind: string, payload: unknown) => void;
interface Entry {
  channel: RealtimeChannel;
  listeners: Set<Listener>;
  status: string;
  releaseTimer?: number;
}

const entries = new Map<string, Entry>();
const RELEASE_DELAY_MS = 2000;

/**
 * Subscribe `listener` to a shared channel. `build` attaches the channel's handlers once, and they
 * forward events through `emit(kind, payload)`. Listeners also get `("status", status)` updates.
 * Returns an unsubscribe function.
 */
export function subscribeShared(
  sb: ProductSupabase,
  topic: string,
  build: (channel: RealtimeChannel, emit: Listener) => RealtimeChannel,
  listener: Listener,
  options?: Parameters<ProductSupabase["channel"]>[1],
): () => void {
  let entry = entries.get(topic);
  if (!entry) {
    const listeners = new Set<Listener>();
    const emit: Listener = (kind, payload) => listeners.forEach((l) => l(kind, payload));
    const channel = build(sb.channel(topic, options), emit);
    const created: Entry = { channel, listeners, status: "CONNECTING" };
    channel.subscribe((status) => {
      created.status = status;
      emit("status", status);
    });
    entries.set(topic, created);
    entry = created;
  }
  window.clearTimeout(entry.releaseTimer);
  entry.listeners.add(listener);
  if (entry.status === "SUBSCRIBED") listener("status", "SUBSCRIBED");

  const current = entry;
  return () => {
    current.listeners.delete(listener);
    if (current.listeners.size) return;
    current.releaseTimer = window.setTimeout(() => {
      if (current.listeners.size || entries.get(topic) !== current) return;
      entries.delete(topic);
      void sb.removeChannel(current.channel);
    }, RELEASE_DELAY_MS);
  };
}

export function sharedChannel(topic: string): RealtimeChannel | undefined {
  return entries.get(topic)?.channel;
}
