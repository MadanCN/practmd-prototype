"use client";

import { use } from "react";
import Link from "next/link";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { ProviderApptDetail } from "@/components/provider/appointments/ProviderApptDetail";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";

export default function ProviderAppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const appt = CC_APPOINTMENTS.find((a) => a.id === id);

  if (!appt) {
    return (
      <ProviderLayout>
        <div className="p-6 max-w-2xl mx-auto text-center">
          <p className="text-sm text-slate-400">Appointment not found.</p>
          <Link href="/provider/appointments/list" className="mt-3 inline-block text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline">← All appointments</Link>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <ProviderApptDetail appt={appt} mode="page" />
    </ProviderLayout>
  );
}
