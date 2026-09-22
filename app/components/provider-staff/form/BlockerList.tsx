"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { CcAppointment } from "@/data/cc-appointments";
import { formatApptWhen, patientName } from "@/lib/provider-impact";

/** Expandable list of the confirmed appointments that block an Edit. */
export default function BlockerList({ title, appointments }: { title: string; appointments: CcAppointment[] }) {
  const [open, setOpen] = useState(false);
  if (!appointments.length) return null;
  return (
    <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-1.5 px-3 py-2 text-left font-medium">
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {title}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <ul className="space-y-0.5 max-h-40 overflow-y-auto">
            {appointments.map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span>{patientName(a.patientId)} · {a.visitType}</span>
                <span className="text-rose-600 dark:text-rose-400 whitespace-nowrap">{formatApptWhen(a)}</span>
              </li>
            ))}
          </ul>
          <p>
            Reschedule or cancel them from{" "}
            <Link href="/care-coordinator/appointments/list" target="_blank" className="underline font-medium">the appointment list</Link>, then come back to save.
          </p>
        </div>
      )}
    </div>
  );
}
