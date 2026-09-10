"use client";

import { useEffect, useRef, useState } from "react";

/** Reads `?<param>=<id>` on mount and scrolls/highlights the matching row —
 *  the deep-link mechanism used by the provider Today dashboard to jump
 *  straight to a specific task/message/result/refill/note from its list page. */
export function useQueryHighlight(param: string) {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(param);
    if (!id) return;
    setHighlightId(id);
    const t = setTimeout(() => {
      refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(t);
  }, [param]);

  function setRef<T extends HTMLElement>(id: string) {
    return (el: T | null) => {
      refs.current[id] = el;
    };
  }

  return { highlightId, setRef };
}
