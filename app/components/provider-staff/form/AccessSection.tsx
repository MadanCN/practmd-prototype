"use client";

import { CLINICS } from "@/data/clinics";
import { PROVIDER_COLORS, PROVIDER_TYPES, SPECIALIZATIONS_LIST, VISIT_TYPES_LIST } from "@/data/providers";
import {
  ACCESS_CAPABILITY_META, CAPABILITY_ORDER, TELEHEALTH_LICENSES_PURCHASED,
  type CapabilityKey,
} from "@/data/provider-record";
import { telehealthLicensesUsed, useProviderStore } from "@/lib/provider-store";
import { cn } from "@/lib/utils";
import Toggle from "@/components/ui/Toggle";
import BlockerList from "./BlockerList";
import { Callout, ColorSelect, Field, INPUT, INPUT_ERR, MultiSelect, SectionCard } from "./fields";
import type { SectionProps } from "./types";

export default function AccessSection(p: SectionProps) {
  const { form, update, err, touch, v, original } = p;
  const store = useProviderStore();
  const caps = form.capabilities;

  // Active clinics, plus any inactive one the provider already has (so it can be seen and removed).
  const clinics = CLINICS.filter((c) => c.isActive || form.clinicAccess.includes(c.id));

  function toggleClinic(id: string) {
    update((f) => ({ ...f, clinicAccess: f.clinicAccess.includes(id) ? f.clinicAccess.filter((c) => c !== id) : [...f.clinicAccess, id] }));
    touch("clinicAccess");
  }

  function setCap(key: CapabilityKey, on: boolean) {
    update((f) => {
      const next = { ...f.capabilities, [key]: on };
      // Can Book switches Can View All Patients on with it — the admin can still switch it back off.
      if (key === "can_book" && on) next.can_view_all_patients = true;
      return { ...f, capabilities: next };
    });
  }

  const others = telehealthLicensesUsed(store, original?.id);
  const used = others + (caps.telehealth_license ? 1 : 0);
  const heldBefore = !!original?.capabilities.telehealth_license;
  const noneLeft = others >= TELEHEALTH_LICENSES_PURCHASED && !heldBefore;

  /** Per-capability: disabled state, and the extra line shown beneath its description. */
  function extras(key: CapabilityKey): { disabled?: boolean; note?: React.ReactNode } {
    switch (key) {
      case "e_prescribing":
      case "can_order_labs":
        return { disabled: true };
      case "telehealth_license":
        return {
          disabled: noneLeft && !caps.telehealth_license,
          note: (
            <>
              <span className={cn("font-medium", used >= TELEHEALTH_LICENSES_PURCHASED ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300")}>
                {used} of {TELEHEALTH_LICENSES_PURCHASED} licences used
              </span>
              {noneLeft && !caps.telehealth_license && <span className="text-amber-600 dark:text-amber-400"> — none remain. Release a licence from another provider (or buy more) to assign one here.</span>}
            </>
          ),
        };
      case "can_book":
        return {
          note: caps.can_book
            ? caps.can_view_all_patients
              ? "Can book for any patient at the clinics assigned below."
              : "Restricted to booking for patients they already have access to."
            : "Restricted to the provider's own schedule — the provider row is pre-filled with their name.",
        };
      case "requires_cosign":
        return { disabled: caps.can_cosign, note: caps.can_cosign ? "Off-limits while Can Co-sign is on — a provider can't both require co-signing and co-sign for others." : undefined };
      case "can_cosign":
        return { disabled: caps.requires_cosign, note: caps.requires_cosign ? "Off-limits while Requires Co-sign is on — turn that off first." : undefined };
      case "include_for_self_scheduling":
        return { note: caps.include_for_self_scheduling ? "Profile & Bio is now available in the section list." : undefined };
      default:
        return {};
    }
  }

  const advisoryFor: Partial<Record<CapabilityKey, string>> = {
    telehealth_license: "telehealthOff", can_cosign: "cosignOff", requires_cosign: "cosignOn",
  };

  return (
    <SectionCard id="access" title="Access & Services" subtitle="What this provider can reach and do in PractMD.">
      <div className="space-y-6">
        <Field label="Clinic access" required error={err("clinicAccess")} hint="Tick every clinic in the organization this provider works at.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {clinics.map((c) => (
              <label key={c.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60",
                form.clinicAccess.includes(c.id) ? "border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20" : "border-slate-200 dark:border-slate-700")}>
                <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={form.clinicAccess.includes(c.id)} onChange={() => toggleClinic(c.id)} />
                <span className="text-xl">{c.logoEmoji}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{c.name}{!c.isActive && <span className="ml-1.5 text-[10px] uppercase text-slate-400">inactive</span>}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{c.locations.length} location{c.locations.length === 1 ? "" : "s"}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 space-y-2">
            {Object.entries(v.clinicBlockers).map(([cid, appts]) => (
              <BlockerList key={cid} title={`${appts.length} confirmed future appointment${appts.length === 1 ? "" : "s"} at ${CLINICS.find((c) => c.id === cid)?.name ?? cid} — tap to see them`} appointments={appts} />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Provider type" required htmlFor="providerType" error={err("providerType")}>
            <select id="providerType" className={cn(INPUT, err("providerType") && INPUT_ERR)} value={form.providerType} onBlur={() => touch("providerType")}
              onChange={(e) => p.set("providerType", e.target.value)}>
              <option value="">Select provider type</option>
              {PROVIDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              {form.providerType && !PROVIDER_TYPES.includes(form.providerType) && <option value={form.providerType}>{form.providerType}</option>}
            </select>
          </Field>
          <Field label="Provider color" htmlFor="color" hint="Colour-codes this provider on calendars">
            <ColorSelect id="color" options={PROVIDER_COLORS} value={form.color} onChange={(c) => p.set("color", c)} />
          </Field>
          <Field label="Visit types" htmlFor="visitTypes" hint="From Masters → Visit Type">
            <MultiSelect id="visitTypes" options={VISIT_TYPES_LIST} value={form.visitTypes} onChange={(x) => p.set("visitTypes", x)} placeholder="Select visit types" />
          </Field>
          <Field label="Specializations" htmlFor="specializations" hint="From Masters → Specialization">
            <MultiSelect id="specializations" options={SPECIALIZATIONS_LIST} value={form.specializations} onChange={(x) => p.set("specializations", x)} placeholder="Select specializations" />
          </Field>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Capabilities</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">The provider keeps the core &ldquo;Provider&rdquo; role; these switches grant specific extra privileges within it.</p>
          <ul className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {CAPABILITY_ORDER.map((key) => {
              const meta = ACCESS_CAPABILITY_META[key];
              const x = extras(key);
              const adv = advisoryFor[key] ? v.advisories[advisoryFor[key]!] : undefined;
              const problem = v.issues[key]?.msg ?? (key === "requires_cosign" ? v.issues.cosign?.msg : undefined);
              return (
                <li key={key} className={cn("px-4 py-3.5 flex items-start gap-4", x.disabled && meta.soon && "bg-slate-50/60 dark:bg-slate-800/30")}>
                  <div className="pt-0.5">
                    <Toggle checked={caps[key]} disabled={x.disabled} onChange={(on) => setCap(key, on)} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", x.disabled && meta.soon ? "text-slate-400" : "text-slate-800 dark:text-slate-200")}>{meta.label}</span>
                      {meta.soon && <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Coming soon</span>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{meta.description}</p>
                    {x.note && <p className="text-xs text-slate-500 dark:text-slate-400">{x.note}</p>}
                    {problem && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{problem}</p>}
                    {adv && <Callout tone={adv.tone} className={adv.tone === "warn" ? "font-medium" : undefined}>{adv.msg}</Callout>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}
