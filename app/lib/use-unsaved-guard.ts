"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Warn before discarding unsaved edits. The App Router has no route-change
 * blocker, so while `dirty` this (a) asks the browser to confirm reloads /
 * tab closes, and (b) intercepts clicks on in-app links (sidebar, breadcrumbs)
 * and exposes the blocked destination as `pending` for the page to confirm.
 * Browser back/forward is not intercepted.
 */
export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || /^(mailto:|tel:)/.test(href)) return;
      if (/^https?:/.test(href) && !href.startsWith(window.location.origin)) return;
      e.preventDefault();
      e.stopPropagation();
      setPending(href.startsWith(window.location.origin) ? href.slice(window.location.origin.length) : href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty]);

  /** Navigate, asking first if there's unsaved work. */
  const requestLeave = useCallback((href: string) => {
    if (dirty) setPending(href);
    else router.push(href);
  }, [dirty, router]);

  const confirmLeave = useCallback(() => {
    const href = pending;
    setPending(null);
    if (href) router.push(href);
  }, [pending, router]);

  const stay = useCallback(() => setPending(null), []);

  return { pending, requestLeave, confirmLeave, stay };
}
