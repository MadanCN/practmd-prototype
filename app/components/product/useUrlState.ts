"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Read and write query-string state (sort, filters, open item) without adding history entries. */
export function useUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = useCallback((key: string) => params.get(key) ?? "", [params]);
  const getList = useCallback((key: string) => (params.get(key) ?? "").split(",").filter(Boolean), [params]);
  const getFlag = useCallback((key: string) => params.get(key) === "1", [params]);

  const set = useCallback(
    (updates: Record<string, string | string[] | boolean | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        const value = Array.isArray(v) ? v.join(",") : v === true ? "1" : v === false ? "" : (v ?? "");
        if (value) next.set(k, value);
        else next.delete(k);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { get, getList, getFlag, set };
}
