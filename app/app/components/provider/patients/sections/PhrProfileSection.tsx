"use client";

import { ContactRound } from "lucide-react";
import { PHR_PROFILE_BY_ID } from "@/data/provider-patient-activity";
import type { PatientProfile } from "@/data/provider-patients";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function PhrProfileSection({ patient }: { patient: PatientProfile }) {
  const phr = PHR_PROFILE_BY_ID[patient.id];
  if (!phr) {
    return (
      <div className="flex flex-col items-center gap-2 py-14 text-center">
        <ContactRound className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400">{patient.firstName} hasn&apos;t filled out a PHR profile.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 dark:text-slate-400">
        <ContactRound className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        As entered by the patient in their personal health record · updated {fmt(phr.updatedAt)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Group title="Demographics">
          <Row label="Pronouns">{phr.pronouns}</Row>
          <Row label="Preferred language">{phr.preferredLanguage}</Row>
          <Row label="Race">{phr.race}</Row>
          <Row label="Ethnicity">{phr.ethnicity}</Row>
          <Row label="Marital status">{phr.maritalStatus}</Row>
          <Row label="Occupation">{phr.occupation}</Row>
        </Group>

        <Group title="Health">
          <Row label="Height">{phr.height}</Row>
          <Row label="Weight">{phr.weight}</Row>
          <Row label="Blood type">{phr.bloodType}</Row>
          <Row label="Primary care provider">{phr.primaryCareProvider}</Row>
        </Group>

        <Group title="Lifestyle">
          <Row label="Smoking status">{phr.smokingStatus}</Row>
          <Row label="Alcohol use">{phr.alcoholUse}</Row>
          <Row label="Exercise">{phr.exerciseFrequency}</Row>
          <Row label="Location preference">{phr.locationPreference}</Row>
        </Group>

        <Group title="Reason for care">
          <div className="text-sm">
            <p className="text-xs text-slate-400 mb-1">Primary diagnoses (self-reported)</p>
            <div className="flex flex-wrap gap-1.5">
              {phr.primaryDiagnoses.map((d) => (
                <span key={d} className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{d}</span>
              ))}
            </div>
          </div>
          <div className="text-sm mt-3">
            <p className="text-xs text-slate-400 mb-1">Care needs</p>
            <div className="flex flex-wrap gap-1.5">
              {phr.careNeeds.map((c) => (
                <span key={c} className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400">{c}</span>
              ))}
            </div>
          </div>
        </Group>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="w-40 shrink-0 text-xs text-slate-400">{label}</span>
      <span className="flex-1 text-slate-700 dark:text-slate-200">{children}</span>
    </div>
  );
}
