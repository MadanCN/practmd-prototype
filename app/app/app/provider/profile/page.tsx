"use client";

import { useState } from "react";
import Link from "next/link";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { PROVIDERS, type Provider } from "@/data/providers";
import { CLINICS } from "@/data/clinics";
import {
  UserCircle, Eye, MapPin, Globe, Video, Star, CalendarDays, ChevronRight, BadgeCheck,
  GraduationCap, Award, ShieldCheck, Pencil, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";
const fieldCls = "w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500";

export default function ProviderProfilePage() {
  const provider = PROVIDERS.find((p) => p.id === CURRENT_PROVIDER_ID)!;
  const [view, setView] = useState<"profile" | "preview">("profile");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const [bio, setBio] = useState(provider.bio);
  const [phone, setPhone] = useState(provider.phone);
  const [email, setEmail] = useState(provider.email);
  const [acceptingNew, setAcceptingNew] = useState(provider.acceptingNewPatients ?? true);

  function save() { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <ProviderLayout>
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <UserCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profile</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your provider profile and public listing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === "profile" && (
              editing ? (
                <>
                  <button onClick={save} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold practmd-gradient text-white"><Check className="w-3.5 h-3.5" /> Save</button>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500"><X className="w-3.5 h-3.5" /> Cancel</button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} data-tour="profile-edit" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"><Pencil className="w-3.5 h-3.5" /> Edit</button>
              )
            )}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden" data-tour="profile-toggle">
              <button onClick={() => { setView("profile"); }} className={cn("px-3.5 py-2 text-xs font-semibold", view === "profile" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>My Profile</button>
              <button onClick={() => { setView("preview"); setEditing(false); }} className={cn("flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold", view === "preview" ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}><Eye className="w-3.5 h-3.5" /> View as Patient</button>
            </div>
          </div>
        </div>

        {saved && <div className="mb-4 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium"><Check className="w-4 h-4" /> Profile saved</div>}

        {view === "profile"
          ? <FullProfile provider={provider} editing={editing} bio={bio} setBio={setBio} phone={phone} setPhone={setPhone} email={email} setEmail={setEmail} acceptingNew={acceptingNew} setAcceptingNew={setAcceptingNew} />
          : <PatientPreview provider={provider} bio={bio} acceptingNew={acceptingNew} />}
      </div>
    </ProviderLayout>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5"><Icon className="w-4 h-4 text-brand-600 dark:text-brand-400" /> {title}</h3>
      {children}
    </div>
  );
}

function FullProfile({ provider, editing, bio, setBio, phone, setPhone, email, setEmail, acceptingNew, setAcceptingNew }: {
  provider: Provider; editing: boolean;
  bio: string; setBio: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  acceptingNew: boolean; setAcceptingNew: (v: boolean) => void;
}) {
  const clinics = CLINICS.filter((c) => provider.clinicAccess.includes(c.id));
  return (
    <div className="space-y-5">
      {/* hero */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ backgroundColor: provider.color }}>
          {provider.firstName[0]}{provider.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{provider.displayName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{provider.credentials} · {provider.providerType}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
            {provider.yearsExperience && <span>{provider.yearsExperience}+ yrs experience</span>}
            <span>{provider.languages.join(", ")}</span>
            {provider.telehealthEnabled && <span className="text-brand-600 dark:text-brand-400">Telehealth</span>}
            <span className={cn(acceptingNew ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")}>{acceptingNew ? "Accepting new patients" : "Not accepting new patients"}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {provider.specializations.map((s) => (
              <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <Section icon={UserCircle} title="About">
        {editing
          ? <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={cn(fieldCls, "resize-none")} />
          : <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{bio}</p>}
      </Section>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-2 gap-4">
        {[
          { label: "Email", value: email, edit: setEmail },
          { label: "Phone", value: phone, edit: setPhone },
        ].map((f) => (
          <div key={f.label}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
            {editing ? <input value={f.value} onChange={(e) => f.edit(e.target.value)} className={fieldCls} /> : <p className="text-sm text-slate-800 dark:text-slate-200">{f.value}</p>}
          </div>
        ))}
        {[
          { label: "NPI", value: provider.npi },
          { label: "License", value: `${provider.licenseNumber} (${provider.licenseState})` },
        ].map((f) => (
          <div key={f.label}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
            <p className="text-sm text-slate-800 dark:text-slate-200">{f.value}</p>
          </div>
        ))}
        <div className="col-span-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800" data-tour="profile-accepting">
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Accepting new patients</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Shows on your public listing and self-scheduling</p>
          </div>
          <button disabled={!editing} onClick={() => setAcceptingNew(!acceptingNew)}
            className={cn("w-10 h-6 rounded-full transition-colors relative disabled:opacity-60", acceptingNew ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600")}>
            <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", acceptingNew ? "translate-x-4" : "translate-x-0.5")} />
          </button>
        </div>
      </div>

      {provider.education && (
        <Section icon={GraduationCap} title="Education & training">
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            {provider.education.map((e) => <li key={e} className="flex gap-2"><span className="text-slate-300 dark:text-slate-600">·</span>{e}</li>)}
          </ul>
        </Section>
      )}

      {provider.boardCertifications && (
        <Section icon={Award} title="Board certifications">
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            {provider.boardCertifications.map((c) => <li key={c} className="flex gap-2"><BadgeCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{c}</li>)}
          </ul>
        </Section>
      )}

      <Section icon={MapPin} title="Practice locations">
        <div className="space-y-3">
          {clinics.map((c) => (
            <div key={c.id} className="text-sm">
              <p className="font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{c.address}, {c.city}, {c.state} {c.zip} · {c.phone}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-5">
        <Section icon={CalendarDays} title="Visit types">
          <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            {provider.visitTypes.map((v) => <p key={v}>· {v}</p>)}
          </div>
        </Section>
        <Section icon={ShieldCheck} title="Insurance accepted">
          <div className="flex flex-wrap gap-1.5">
            {(provider.insuranceAccepted ?? []).map((i) => (
              <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{i}</span>
            ))}
          </div>
        </Section>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">Manage your working hours, leave and blocked time</p>
        <Link href="/provider/availability" className="text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1">My Availability <ChevronRight className="w-4 h-4" /></Link>
      </div>
    </div>
  );
}

function PatientPreview({ provider, bio, acceptingNew }: { provider: Provider; bio: string; acceptingNew: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
        <Eye className="w-3.5 h-3.5 shrink-0" />
        How your profile appears to patients choosing a provider during self-scheduling.
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-md">
        <div className="p-5 flex items-start gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ backgroundColor: provider.color }}>
            {provider.firstName[0]}{provider.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              {provider.displayName}<BadgeCheck className="w-4 h-4 text-blue-500" />
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{provider.credentials} · {provider.providerType}</p>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              <span className="text-xs text-slate-400 ml-1">4.8 (126 reviews)</span>
            </div>
          </div>
        </div>
        <div className="px-5 pb-4"><p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">{bio}</p></div>
        <div className="px-5 pb-4 flex flex-wrap gap-1.5">
          {provider.specializations.map((s) => (
            <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{s}</span>
          ))}
        </div>
        <div className="px-5 pb-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {provider.city}, {provider.state}</span>
          {provider.telehealthEnabled && <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Telehealth</span>}
          <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {provider.languages.join(", ")}</span>
        </div>
        <div className="px-5 pb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{acceptingNew ? "Next available" : "Not accepting new patients"}</p>
          {acceptingNew && (
            <div className="flex gap-2">
              {["Tomorrow, 10:00 AM", "Thu, 2:30 PM", "Fri, 9:00 AM"].map((slot) => (
                <span key={slot} className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{slot}</span>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 pb-5">
          <button disabled className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold opacity-90 cursor-default">
            <CalendarDays className="w-4 h-4" /> Book with {provider.firstName} <ChevronRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-2">Preview only — this button is not functional here</p>
        </div>
      </div>
    </div>
  );
}
