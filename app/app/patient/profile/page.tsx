"use client";

import { useState } from "react";
import {
  User, Users, Lock, Bell, Shield, Download, Headphones, Trash2,
  Plus, Pencil, Check, X, ChevronRight, CheckCircle2, AlertTriangle,
  Eye, EyeOff, Smartphone, LogOut, FileText,
} from "lucide-react";
import { FAMILY_MEMBERS, type FamilyMember } from "@/data/patient-portal";
import { cn } from "@/lib/utils";

const INPUT = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500";

type Section = "profile" | "family" | "security" | "notifications" | "privacy" | "download" | "support" | "delete";

const NAV: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "profile",       label: "Personal Information",  icon: User,       desc: "Name, contact info, preferences" },
  { id: "family",        label: "Family & Dependents",   icon: Users,      desc: "Manage family member profiles" },
  { id: "security",      label: "Password & Security",   icon: Lock,       desc: "Password, 2FA, active sessions" },
  { id: "notifications", label: "Notifications",         icon: Bell,       desc: "Email, SMS, and push preferences" },
  { id: "privacy",       label: "Privacy & HIPAA",       icon: Shield,     desc: "Data sharing and consent settings" },
  { id: "download",      label: "Download My Health Data",icon: Download,  desc: "Export your complete medical records" },
  { id: "support",       label: "Contact Support",       icon: Headphones, desc: "Get help with your patient portal" },
  { id: "delete",        label: "Delete Profile",        icon: Trash2,     desc: "Permanently remove your account" },
];

// ── Personal Information ───────────────────────────────────────────────────────

function PersonalInfo() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: "James", lastName: "Holloway",
    email: "james.holloway@email.com", phone: "+1 (585) 412-0101",
    preferredName: "James", preferredLanguage: "English",
    communicationPref: "email",
  });

  function save() { setSaved(true); setTimeout(() => setSaved(false), 3000); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Personal Information</h2>
        {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium"><CheckCircle2 className="w-4 h-4" />Saved</span>}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl font-bold">JH</div>
        <div>
          <button className="text-sm text-emerald-600 hover:underline font-medium">Change photo</button>
          <p className="text-xs text-slate-400 mt-0.5">JPG, PNG — max 5 MB</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
          <input className={INPUT} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
          <input className={INPUT} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Preferred Name</label>
          <input className={INPUT} value={form.preferredName} onChange={e => setForm(f => ({ ...f, preferredName: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Preferred Language</label>
          <select className={INPUT} value={form.preferredLanguage} onChange={e => setForm(f => ({ ...f, preferredLanguage: e.target.value }))}>
            <option>English</option><option>Spanish</option><option>French</option><option>Mandarin</option><option>Hindi</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
          <input className={INPUT} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
          <input className={INPUT} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Preferred Contact Method</label>
          <div className="flex gap-3">
            {(["email", "sms", "phone"] as const).map(opt => (
              <button key={opt} onClick={() => setForm(f => ({ ...f, communicationPref: opt }))}
                className={cn("flex-1 py-2 rounded-xl border text-sm font-medium transition-colors capitalize",
                  form.communicationPref === opt
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400")}>
                {opt === "sms" ? "SMS" : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={save} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Save Changes</button>
    </div>
  );
}

// ── Family & Dependents ───────────────────────────────────────────────────────

const BLANK_MEMBER: Omit<FamilyMember, "id" | "portalAccess" | "profileCreated"> = {
  firstName: "", lastName: "", dob: "", gender: "", relationship: "",
};

function FamilySection() {
  const [members, setMembers] = useState(FAMILY_MEMBERS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...BLANK_MEMBER, notes: "" });
  const [portal, setPortal] = useState(false);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setMembers(prev => [...prev, {
      id: crypto.randomUUID(), ...form, portalAccess: portal, profileCreated: portal,
    }]);
    setShowAdd(false);
    setForm({ ...BLANK_MEMBER, notes: "" });
    setPortal(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  function remove(id: string) { setMembers(prev => prev.filter(m => m.id !== id)); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Family & Dependents</h2>
        {added && <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium"><CheckCircle2 className="w-4 h-4" />Added</span>}
      </div>
      <p className="text-sm text-slate-500">
        Family members with portal access can manage their own health profiles from this account.
        Minors are managed by the primary account holder.
      </p>

      <div className="space-y-3">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {m.firstName[0]}{m.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{m.firstName} {m.lastName}</p>
              <p className="text-xs text-slate-500">{m.relationship} · DOB {new Date(m.dob + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", m.portalAccess ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                  {m.portalAccess ? "Portal Access" : "No Portal Access"}
                </span>
                {m.profileCreated && <span className="text-[10px] text-slate-400">Profile created</span>}
              </div>
              {m.notes && <p className="text-xs text-slate-400 italic mt-0.5">{m.notes}</p>}
            </div>
            <button onClick={() => remove(m.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Add Family Member</p>
            <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">First Name *</label>
              <input className={INPUT} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Name *</label>
              <input className={INPUT} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date of Birth *</label>
              <input className={INPUT} type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
              <select className={INPUT} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select…</option>
                <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Relationship</label>
              <select className={INPUT} value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
                <option value="">Select…</option>
                <option>Spouse</option><option>Child</option><option>Parent</option><option>Sibling</option><option>Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
              <input className={INPUT} value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setPortal(p => !p)}
              className={cn("w-9 h-5 rounded-full transition-colors relative", portal ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}>
              <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", portal ? "left-4" : "left-0.5")} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Create patient portal access</p>
              <p className="text-xs text-slate-400">They can log in and manage their own health profile</p>
            </div>
          </label>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium">
              <Check className="w-4 h-4" /> Add Member
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 text-sm font-medium transition-colors w-full justify-center">
          <Plus className="w-4 h-4" /> Add Family Member or Dependent
        </button>
      )}
    </div>
  );
}

// ── Password & Security ───────────────────────────────────────────────────────

function SecuritySection() {
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [mfa, setMfa] = useState(true);

  function toggle(k: string) { setShowPw(p => ({ ...p, [k]: !p[k] })); }

  const sessions = [
    { id: "s1", device: "Chrome on Windows", location: "Penfield, NY", last: "Active now", current: true },
    { id: "s2", device: "Safari on iPhone 15", location: "Penfield, NY", last: "3 hours ago", current: false },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Password & Security</h2>

      {/* Change password */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 bg-white dark:bg-slate-900/30">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Change Password</p>
        {(["current", "next", "confirm"] as const).map(k => (
          <div key={k}>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {k === "current" ? "Current Password" : k === "next" ? "New Password" : "Confirm New Password"}
            </label>
            <div className="relative">
              <input type={showPw[k] ? "text" : "password"} className={cn(INPUT, "pr-10")}
                value={pw[k]} onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))} />
              <button type="button" onClick={() => toggle(k)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
        {saved && <p className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Password updated</p>}
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
          Update Password
        </button>
      </div>

      {/* 2FA */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Two-Factor Authentication</p>
              <p className="text-xs text-slate-500 mt-0.5">Verify your identity with a code sent to your phone</p>
            </div>
          </div>
          <div onClick={() => setMfa(m => !m)}
            className={cn("w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1", mfa ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}>
            <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", mfa ? "left-4" : "left-0.5")} />
          </div>
        </div>
        {mfa && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Enabled — codes sent to +1 (585) 412-0101</p>}
      </div>

      {/* Active sessions */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900/30 space-y-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Sessions</p>
        {sessions.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div>
              <p className="text-sm text-slate-800 dark:text-slate-200">{s.device} {s.current && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ml-1">Current</span>}</p>
              <p className="text-xs text-slate-400">{s.location} · {s.last}</p>
            </div>
            {!s.current && (
              <button className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────

type ToggleKey = "apptEmail" | "apptSms" | "formEmail" | "msgEmail" | "msgSms" | "labEmail" | "marketingEmail";

function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<ToggleKey, boolean>>({
    apptEmail: true, apptSms: true, formEmail: true,
    msgEmail: true, msgSms: false, labEmail: true,
    marketingEmail: false,
  });

  function toggle(k: ToggleKey) { setPrefs(p => ({ ...p, [k]: !p[k] })); }

  const rows: { key: ToggleKey; label: string; desc: string }[] = [
    { key: "apptEmail",     label: "Appointment reminders (Email)", desc: "Reminder 48h and 2h before each appointment" },
    { key: "apptSms",       label: "Appointment reminders (SMS)",   desc: "Text message reminder 2h before each appointment" },
    { key: "formEmail",     label: "Form assignments (Email)",       desc: "Notified when a new form is assigned to you" },
    { key: "msgEmail",      label: "New messages (Email)",          desc: "Email when your care team sends a message" },
    { key: "msgSms",        label: "New messages (SMS)",            desc: "Text when your care team sends a message" },
    { key: "labEmail",      label: "Lab results available (Email)", desc: "Notified when new lab results are uploaded" },
    { key: "marketingEmail",label: "Health tips & newsletters",     desc: "Educational content and wellness resources" },
  ];

  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Notification Preferences</h2>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/30">
        {rows.map((row, i) => (
          <div key={row.key} className={cn("flex items-center justify-between gap-4 px-5 py-4", i < rows.length - 1 && "border-b border-slate-100 dark:border-slate-800")}>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{row.desc}</p>
            </div>
            <div onClick={() => toggle(row.key)}
              className={cn("w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0", prefs[row.key] ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}>
              <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", prefs[row.key] ? "left-4" : "left-0.5")} />
            </div>
          </div>
        ))}
      </div>
      {saved && <p className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Preferences saved</p>}
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}
        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Save Preferences</button>
    </div>
  );
}

// ── Privacy & HIPAA ───────────────────────────────────────────────────────────

function PrivacySection() {
  const [consents, setConsents] = useState({ shareWithPcp: true, shareWithSpecialists: true, researchAnonymized: false, marketingAnalytics: false });
  const [saved, setSaved] = useState(false);

  const rows = [
    { key: "shareWithPcp" as const, label: "Share records with my Primary Care Provider", desc: "Allow Penfield Psychiatry to share treatment notes with Dr. Rachel Moore (Penfield Family Medicine)" },
    { key: "shareWithSpecialists" as const, label: "Share records with referred specialists", desc: "Allow records to be shared when a specialist referral is made by your care team" },
    { key: "researchAnonymized" as const, label: "Participate in anonymized research", desc: "Allow de-identified data to be used for health outcomes research (no personally identifiable information)" },
    { key: "marketingAnalytics" as const, label: "Usage analytics for portal improvement", desc: "Allow anonymized portal usage data to improve the patient portal experience" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Privacy & HIPAA</h2>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Your rights under HIPAA</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">You have the right to access, correct, and control how your health information is shared. You can revoke consents at any time. Revocation does not affect disclosures already made.</p>
          <button className="text-xs text-blue-700 dark:text-blue-400 underline mt-1">View HIPAA Notice of Privacy Practices</button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/30">
        {rows.map((row, i) => (
          <div key={row.key} className={cn("flex items-start justify-between gap-4 px-5 py-4", i < rows.length - 1 && "border-b border-slate-100 dark:border-slate-800")}>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{row.desc}</p>
            </div>
            <div onClick={() => setConsents(c => ({ ...c, [row.key]: !c[row.key] }))}
              className={cn("w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5", consents[row.key] ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")}>
              <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", consents[row.key] ? "left-4" : "left-0.5")} />
            </div>
          </div>
        ))}
      </div>
      {saved && <p className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Consent preferences updated</p>}
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}
        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Save Preferences</button>
    </div>
  );
}

// ── Download My Health Data ───────────────────────────────────────────────────

function DownloadSection() {
  const [status, setStatus] = useState<"idle" | "preparing" | "ready">("idle");

  function prepare() {
    setStatus("preparing");
    setTimeout(() => setStatus("ready"), 3000);
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Download My Health Data</h2>
      <p className="text-sm text-slate-500">Export a complete copy of your health data in compliance with 21st Century Cures Act (Right of Access).</p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: FileText, label: "Health Records", desc: "Diagnoses, medications, visit notes" },
          { icon: Shield, label: "Insurance & Claims", desc: "Coverage details and EOBs" },
          { icon: FileText, label: "Lab Results", desc: "All lab reports and imaging" },
          { icon: FileText, label: "Messages", desc: "Conversation history" },
        ].map(item => (
          <div key={item.label} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30">
            <item.icon className="w-5 h-5 text-emerald-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-500">
        Your export will include all data from account creation to today. Estimated size: ~12 MB. Format: FHIR R4 JSON + PDF summary.
      </div>

      {status === "idle" && (
        <button onClick={prepare} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
          <Download className="w-4 h-4" /> Request Data Export
        </button>
      )}
      {status === "preparing" && (
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Preparing your data export… this may take a moment.
        </div>
      )}
      {status === "ready" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Your export is ready!
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
            <Download className="w-4 h-4" /> Download Export (12.4 MB)
          </button>
          <p className="text-xs text-slate-400">This link expires in 24 hours for security.</p>
        </div>
      )}
    </div>
  );
}

// ── Contact Support ───────────────────────────────────────────────────────────

function SupportSection() {
  const [submitted, setSubmitted] = useState(false);
  const [msg, setMsg] = useState("");

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Contact Support</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Call Us", value: "+1 (585) 490-3000", sub: "Mon–Fri, 8 AM–6 PM ET", icon: "📞" },
          { label: "Email Support", value: "support@practmd.health", sub: "Response within 24h", icon: "✉️" },
          { label: "Live Chat", value: "Available now", sub: "Avg. wait: 2 min", icon: "💬" },
        ].map(c => (
          <div key={c.label} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 text-center">
            <p className="text-2xl mb-2">{c.icon}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.label}</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900/30 space-y-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Send a Support Message</p>
        {submitted ? (
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Message sent! We&apos;ll respond within 24 hours.
          </div>
        ) : (
          <>
            <select className={INPUT}>
              <option>I have a question about my appointment</option>
              <option>I have a billing question</option>
              <option>I&apos;m having trouble with the portal</option>
              <option>I need to update my information</option>
              <option>Other</option>
            </select>
            <textarea rows={4} className={cn(INPUT, "resize-none")} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Describe your issue or question…" />
            <button onClick={() => { setSubmitted(true); }} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Send Message</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Delete Profile ────────────────────────────────────────────────────────────

function DeleteSection() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirm, setConfirm] = useState("");

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-red-600">Delete Profile</h2>

      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">This action is permanent and cannot be undone.</p>
            <p className="text-xs text-red-600 dark:text-red-400">Your patient portal account will be permanently deleted. Your clinical records will be retained by Penfield Psychiatry as required by law for 7 years, but you will no longer have portal access to them.</p>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">Before deleting your account, please understand:</p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {[
              "Your upcoming appointments will remain in the system and your care team will be notified",
              "Active prescriptions and treatment plans will not be affected",
              "Your clinical records are retained per state law for 7 years",
              "Family members linked to your account will lose portal access",
              "This action cannot be reversed",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-red-400 shrink-0 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
          <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold">
            I understand — continue to delete
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">Please type <strong>DELETE MY ACCOUNT</strong> to confirm:</p>
          <input className={INPUT} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="DELETE MY ACCOUNT" />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Back</button>
            <button onClick={() => { if (confirm === "DELETE MY ACCOUNT") setStep(3); }}
              disabled={confirm !== "DELETE MY ACCOUNT"}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold">
              Delete My Account
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Account deletion request submitted. You will receive a confirmation email within 24 hours and your account will be removed within 30 days.</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const SECTION_MAP: Record<Section, React.ReactNode> = {
  profile:       <PersonalInfo />,
  family:        <FamilySection />,
  security:      <SecuritySection />,
  notifications: <NotificationsSection />,
  privacy:       <PrivacySection />,
  download:      <DownloadSection />,
  support:       <SupportSection />,
  delete:        <DeleteSection />,
};

export default function ProfilePage() {
  const [active, setActive] = useState<Section>("profile");

  return (
    <div className="flex gap-6">
      {/* Sidebar nav */}
      <div className="w-56 shrink-0 space-y-1">
        {NAV.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors text-sm",
                active === item.id
                  ? item.id === "delete"
                    ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-semibold"
                    : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold"
                  : item.id === "delete"
                    ? "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60")}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              <ChevronRight className={cn("w-3.5 h-3.5 ml-auto shrink-0 opacity-0", active === item.id && "opacity-100")} />
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6">
        {SECTION_MAP[active]}
      </div>
    </div>
  );
}
