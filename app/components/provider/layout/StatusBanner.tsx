"use client";

import Link from "next/link";
import { AlertTriangle, Info, ShieldAlert, LogOut } from "lucide-react";
import { useProviderSession } from "@/lib/provider-session";
import { STATUS_META } from "@/data/provider-credentialing";
import { cn } from "@/lib/utils";

/** The clinical-status banner shown above every portal screen when the
 *  provider is not Clinically Active. Never a dead end — it points at the
 *  readiness checklist. */
export function StatusBanner() {
  const { clinicalStatus } = useProviderSession();
  const meta = STATUS_META[clinicalStatus];
  if (!meta.banner || clinicalStatus === "clinically-active") return null;

  const tone =
    clinicalStatus === "suspended" || clinicalStatus === "offboarded"
      ? { cls: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300", Icon: ShieldAlert }
      : clinicalStatus === "offboarding"
        ? { cls: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300", Icon: LogOut }
        : clinicalStatus === "active-limited"
          ? { cls: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300", Icon: Info }
          : { cls: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300", Icon: AlertTriangle };

  return (
    <div className={cn("flex items-start gap-2.5 px-4 py-2.5 border-b text-xs sm:text-sm", tone.cls)}>
      <tone.Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="flex-1 leading-relaxed">
        <span className="font-semibold">{meta.label}.</span> {meta.banner}
      </p>
      <Link href="/provider/readiness" className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80">
        View checklist
      </Link>
    </div>
  );
}
