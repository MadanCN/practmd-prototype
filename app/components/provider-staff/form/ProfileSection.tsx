"use client";

import { Lock, Plus, Trash2 } from "lucide-react";
import { SERVICES_LIST } from "@/data/providers";
import type { EducationRow } from "@/data/provider-record";
import { cn } from "@/lib/utils";
import { Field, INPUT, INPUT_ERR, MultiSelect, SectionCard } from "./fields";
import type { SectionProps } from "./types";

let seq = 0;
const newEduId = () => `ed_${Date.now().toString(36)}${seq++}`;

export default function ProfileSection(p: SectionProps) {
  const { form, set, update, err, touch } = p;
  const enabled = form.capabilities.include_for_self_scheduling;

  if (!enabled) {
    return (
      <SectionCard id="profile" title="Profile & Bio" muted subtitle="Shown to patients when they choose a provider while self-scheduling.">
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Available only when <strong>Include for self-scheduling</strong> is on in Access &amp; Services.</span>
          <button type="button" onClick={() => update((f) => ({ ...f, capabilities: { ...f.capabilities, include_for_self_scheduling: true } }))}
            className="ml-auto shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Turn it on</button>
        </div>
      </SectionCard>
    );
  }

  const patchEdu = (id: string, c: Partial<EducationRow>) => update((f) => ({ ...f, education: f.education.map((e) => (e.id === id ? { ...e, ...c } : e)) }));

  return (
    <SectionCard id="profile" title="Profile & Bio" subtitle="Shown to patients when they choose a provider while self-scheduling.">
      <div className="space-y-5">
        <Field label="About provider" required htmlFor="aboutProvider" error={err("aboutProvider")}>
          <textarea id="aboutProvider" rows={4} className={cn(INPUT, "resize-y", err("aboutProvider") && INPUT_ERR)} value={form.aboutProvider}
            placeholder="A short introduction patients will read…" onBlur={() => touch("aboutProvider")} onChange={(e) => set("aboutProvider", e.target.value)} />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Education</span>
          </div>
          {form.education.length > 0 && (
            <div className="space-y-2 mb-2">
              {form.education.map((e) => (
                <div key={e.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_90px_36px] gap-2 items-start">
                  <div>
                    <input aria-label="Degree" className={cn(INPUT, err(`edu.${e.id}.degree`) && INPUT_ERR)} placeholder="Degree (e.g. MD)" value={e.degree}
                      onBlur={() => touch(`edu.${e.id}.degree`)} onChange={(ev) => patchEdu(e.id, { degree: ev.target.value })} />
                    {err(`edu.${e.id}.degree`) && <p className="mt-1 text-xs text-rose-600">{err(`edu.${e.id}.degree`)}</p>}
                  </div>
                  <input aria-label="Institution" className={INPUT} placeholder="Institution" value={e.institution} onChange={(ev) => patchEdu(e.id, { institution: ev.target.value })} />
                  <input aria-label="Year" inputMode="numeric" maxLength={4} className={INPUT} placeholder="Year" value={e.year} onChange={(ev) => patchEdu(e.id, { year: ev.target.value.replace(/\D/g, "").slice(0, 4) })} />
                  <button type="button" aria-label="Remove education" onClick={() => update((f) => ({ ...f, education: f.education.filter((x) => x.id !== e.id) }))}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => update((f) => ({ ...f, education: [...f.education, { id: newEduId(), degree: "", institution: "", year: "" }] }))}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            <Plus className="w-4 h-4" /> Add education
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
          <Field label="Years of experience" htmlFor="yearsExperience" error={err("yearsExperience")}>
            <input id="yearsExperience" inputMode="numeric" className={cn(INPUT, err("yearsExperience") && INPUT_ERR)} value={form.yearsExperience}
              onBlur={() => touch("yearsExperience")} onChange={(e) => set("yearsExperience", e.target.value.replace(/[^\d]/g, "").slice(0, 2))} />
          </Field>
          <Field label="Services provided" htmlFor="servicesProvided" hint="From Masters → Services">
            <MultiSelect id="servicesProvided" options={SERVICES_LIST} value={form.servicesProvided} onChange={(x) => set("servicesProvided", x)} placeholder="Select services" />
          </Field>
        </div>
        <Field label="Experience summary" htmlFor="experienceSummary">
          <textarea id="experienceSummary" rows={3} className={cn(INPUT, "resize-y")} value={form.experienceSummary} onChange={(e) => set("experienceSummary", e.target.value)} />
        </Field>
      </div>
    </SectionCard>
  );
}
