"use client";

import { useRef } from "react";
import { Camera, Lock, Plus, Trash2 } from "lucide-react";
import { GEO, citiesOf, statesOf } from "@/data/geo";
import { STATUS_META } from "@/data/provider-credentialing";
import {
  ID_QUALIFIERS, NPI_QUALIFIER, newCredentialId, providerInitials, type CredentialRow,
} from "@/data/provider-record";
import { ADDRESS_MAX, NPI_ROW_ID } from "@/lib/provider-form";
import { expiryState, formatEin, formatFax, formatPhone, formatZip, onlyDigits } from "@/lib/provider-validation";
import { cn } from "@/lib/utils";
import { Field, INPUT, INPUT_ERR, SectionCard } from "./fields";
import type { SectionProps } from "./types";

/** Downscale an uploaded image to ≤256px JPEG so it fits comfortably in localStorage. */
function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("read failed"));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(fr.result);
    };
    fr.readAsDataURL(file);
  });
}

export default function IdentitySection(p: SectionProps) {
  const { form, set, err, touch, mode, original } = p;
  const fileRef = useRef<HTMLInputElement>(null);
  const cls = (k: string) => cn(INPUT, err(k) && INPUT_ERR);
  const statusLabel = STATUS_META[mode === "add" ? (form.markActive ? "clinically-active" : "invited") : original?.status ?? "invited"].label;
  const states = statesOf(form.country);
  const cities = citiesOf(form.country, form.state);
  const line1Left = ADDRESS_MAX - form.addressLine1.length;
  const line2Left = ADDRESS_MAX - form.addressLine2.length;

  return (
    <SectionCard id="identity" title="Identity & Credentials" subtitle="Who the provider is as a legal entity allowed to practise — used on claims and clinical documents.">
      <div className="space-y-6">
        {/* Photo + names */}
        <div className="flex gap-5 items-start">
          <div className="shrink-0">
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Upload photo"
              className="relative w-24 h-24 rounded-2xl overflow-hidden border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:border-blue-400 group">
              {form.photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={form.photo} alt="Provider" className="w-full h-full object-cover" />
                : (form.firstName || form.lastName) ? <span className="text-2xl font-bold text-slate-400">{providerInitials(form)}</span> : <Camera className="w-6 h-6" />}
              <span className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">{form.photo ? "Change" : "Upload"}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) try { set("photo", await readPhoto(f)); } catch { /* unreadable image — leave as is */ }
              }} />
            {form.photo && <button type="button" onClick={() => set("photo", "")} className="mt-1.5 w-full text-[11px] text-slate-500 hover:text-rose-600">Remove</button>}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="First name" required htmlFor="firstName" error={err("firstName")} hint="As it appears on the licence">
              <input id="firstName" className={cls("firstName")} value={form.firstName} onBlur={() => touch("firstName")} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Middle name" htmlFor="middleName" hint="Some payer enrolments need it">
              <input id="middleName" className={INPUT} value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
            </Field>
            <Field label="Last name" required htmlFor="lastName" error={err("lastName")}>
              <input id="lastName" className={cls("lastName")} value={form.lastName} onBlur={() => touch("lastName")} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
            <Field label="Credentials suffix" required htmlFor="credentialsSuffix" error={err("credentialsSuffix")} hint="e.g. MD, PsyD, LCSW, PMHNP-BC — shown after the name">
              <input id="credentialsSuffix" className={cls("credentialsSuffix")} value={form.credentialsSuffix} onBlur={() => touch("credentialsSuffix")} onChange={(e) => set("credentialsSuffix", e.target.value)} />
            </Field>
            <Field label="Status" htmlFor="status" hint={mode === "add" ? "Set by the options above the footer" : "Change it from the provider page → Change status"}>
              <input id="status" className={INPUT} value={statusLabel} disabled readOnly />
            </Field>
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Email" required htmlFor="email" error={err("email")} hint="Becomes the login and the invitation target. Unique across the organization.">
            <input id="email" type="email" className={cls("email")} value={form.email} placeholder="provider@clinic.com" onBlur={() => touch("email")} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone number" required htmlFor="phone" error={err("phone")}>
            <input id="phone" inputMode="tel" className={cls("phone")} value={form.phone} placeholder="+1 (585) 555-0100" onBlur={() => touch("phone")} onChange={(e) => set("phone", formatPhone(e.target.value))} />
          </Field>
          <Field label="EIN (Employer Identification Number)" required htmlFor="ein" error={err("ein")} hint="Federal Tax ID — 9 digits">
            <input id="ein" inputMode="numeric" className={cn(cls("ein"), "font-mono")} value={formatEin(form.ein)} placeholder="XX-XXXXXXX" onBlur={() => touch("ein")} onChange={(e) => set("ein", onlyDigits(e.target.value).slice(0, 9))} />
          </Field>
          <Field label="Fax" htmlFor="fax" error={err("fax")}>
            <input id="fax" inputMode="tel" className={cls("fax")} value={formatFax(form.fax)} placeholder="(585) 555-0101" onBlur={() => touch("fax")} onChange={(e) => set("fax", onlyDigits(e.target.value).slice(0, 10))} />
          </Field>
          <Field label="Taxonomy code" htmlFor="taxonomyCode" error={err("taxonomyCode")} hint="Up to 15 characters">
            <input id="taxonomyCode" className={cn(cls("taxonomyCode"), "font-mono")} maxLength={15} value={form.taxonomyCode} onBlur={() => touch("taxonomyCode")} onChange={(e) => set("taxonomyCode", e.target.value.toUpperCase())} />
          </Field>
          <Field label="Date of birth" required={p.v.issues.dob?.kind === "required"} htmlFor="dob" error={err("dob")}
            hint={form.markActive ? "Required because the provider is being marked Clinically Active" : "Optional at invite — required before verification. Used for credentialing and payer enrolment."}>
            <input id="dob" type="date" className={cls("dob")} value={form.dob} max={new Date().toISOString().split("T")[0]} onBlur={() => touch("dob")} onChange={(e) => set("dob", e.target.value)} />
          </Field>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Address line 1" required htmlFor="addressLine1" error={err("addressLine1")} counter={`${form.addressLine1.length} / ${ADDRESS_MAX}`} counterWarn={line1Left <= 5} hint="Required for claim forms">
              <input id="addressLine1" maxLength={ADDRESS_MAX} className={cls("addressLine1")} value={form.addressLine1} onBlur={() => touch("addressLine1")} onChange={(e) => set("addressLine1", e.target.value)} />
            </Field>
            <Field label="Address line 2" htmlFor="addressLine2" counter={`${form.addressLine2.length} / ${ADDRESS_MAX}`} counterWarn={line2Left <= 5}>
              <input id="addressLine2" maxLength={ADDRESS_MAX} className={INPUT} value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} />
            </Field>
            <Field label="Country" required htmlFor="country" error={err("country")}>
              <select id="country" className={cls("country")} value={form.country}
                onChange={(e) => p.update((f) => ({ ...f, country: e.target.value, state: "", city: "", zip: formatZip(f.zip, e.target.value) }))}>
                <option value="">Select country</option>
                {GEO.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="State" required htmlFor="state" error={err("state")}>
              <select id="state" className={cls("state")} value={form.state} disabled={!form.country}
                onChange={(e) => p.update((f) => ({ ...f, state: e.target.value, city: "" }))}>
                <option value="">{form.country ? "Select state" : "Select a country first"}</option>
                {states.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
                {form.state && !states.some((s) => s.name === form.state) && <option value={form.state}>{form.state}</option>}
              </select>
            </Field>
            <Field label="City" required htmlFor="city" error={err("city")}>
              <select id="city" className={cls("city")} value={form.city} disabled={!form.state}
                onChange={(e) => set("city", e.target.value)}>
                <option value="">{form.state ? "Select city" : "Select a state first"}</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                {form.city && !cities.includes(form.city) && <option value={form.city}>{form.city}</option>}
              </select>
            </Field>
            <Field label={form.country === "Canada" ? "Postal code" : "Zip code"} required htmlFor="zip" error={err("zip")} hint={form.country === "Canada" ? undefined : "5 digits, or 5+4"}>
              <input id="zip" inputMode="text" className={cn(cls("zip"), "font-mono")} value={form.zip} placeholder={form.country === "Canada" ? "A1A 1A1" : "12345 or 12345-6789"}
                onBlur={() => touch("zip")} onChange={(e) => set("zip", formatZip(e.target.value, form.country))} />
            </Field>
          </div>
        </div>

        <CredentialsBuilder {...p} />
      </div>
    </SectionCard>
  );
}

/* ── Credentials row builder ─────────────────────────────────────────── */

function ExpiryBadge({ iso }: { iso: string }) {
  const st = expiryState(iso);
  if (st === "expired") return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400">Expired</span>;
  if (st === "expiring") return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">Expiring</span>;
  return null;
}

function CredentialsBuilder({ form, update, err, touch, v }: SectionProps) {
  function patch(id: string, changes: Partial<CredentialRow>) {
    update((f) => ({ ...f, credentials: f.credentials.map((c) => (c.id === id ? { ...c, ...changes } : c)) }));
  }
  const npiRequired = v.issues[`cred.${NPI_ROW_ID}.value`]?.kind === "required";

  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Credentials</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">The identifiers a payer needs. Multiple of the same qualifier are fine (e.g. several state licences); an exact duplicate isn&apos;t.</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_170px_84px_36px] gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>ID qualifier <span className="text-rose-500">*</span></span>
          <span>Value {npiRequired && <span className="text-rose-500">*</span>}</span>
          <span>Expiry</span>
          <span />
          <span />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {form.credentials.map((c) => {
            const isNpi = c.qualifier === NPI_QUALIFIER;
            const kv = `cred.${c.id}.value`, kq = `cred.${c.id}.qualifier`;
            return (
              <div key={c.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_170px_84px_36px] gap-3 items-start">
                <div>
                  {isNpi ? (
                    <div className="relative">
                      <input aria-label="ID qualifier" className={cn(INPUT, "pr-8 font-semibold")} value="NPI" disabled readOnly />
                      <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ) : (
                    <select aria-label="ID qualifier" className={cn(INPUT, err(kq) && INPUT_ERR)} value={c.qualifier}
                      onBlur={() => touch(kq)} onChange={(e) => patch(c.id, { qualifier: e.target.value })}>
                      <option value="">Select qualifier…</option>
                      {ID_QUALIFIERS.map((q) => <option key={q.key} value={q.key}>{q.label}</option>)}
                    </select>
                  )}
                  {err(kq) && <p className="mt-1 text-xs text-rose-600">{err(kq)}</p>}
                </div>
                <div>
                  <input aria-label="Value" className={cn(INPUT, "font-mono", err(kv) && INPUT_ERR)} value={c.value}
                    inputMode={isNpi ? "numeric" : undefined} maxLength={isNpi ? 10 : 30}
                    placeholder={isNpi ? "10-digit NPI" : "ID value"}
                    onBlur={() => touch(kv)} onChange={(e) => patch(c.id, { value: isNpi ? onlyDigits(e.target.value).slice(0, 10) : e.target.value })} />
                  {err(kv) && <p className="mt-1 text-xs text-rose-600">{err(kv)}</p>}
                </div>
                <input aria-label="Expiry" type="date" className={INPUT} value={c.expiry} onChange={(e) => patch(c.id, { expiry: e.target.value })} />
                <div className="pt-1.5"><ExpiryBadge iso={c.expiry} /></div>
                <div className="pt-0.5">
                  {isNpi ? (
                    <span title="The NPI row can't be removed" className="inline-flex p-2 text-slate-300"><Lock className="w-4 h-4" /></span>
                  ) : (
                    <button type="button" aria-label="Remove ID" onClick={() => update((f) => ({ ...f, credentials: f.credentials.filter((x) => x.id !== c.id) }))}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button type="button" onClick={() => update((f) => ({ ...f, credentials: [...f.credentials, { id: newCredentialId(), qualifier: "", value: "", expiry: "" }] }))}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
        <Plus className="w-4 h-4" /> Add ID
      </button>
    </div>
  );
}
