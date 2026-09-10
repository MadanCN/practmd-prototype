"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Globe, CheckCircle2, Plus, MapPin, Phone, Mail,
  Hash, Users, Shield, Wrench, Layers, Key, Map, Cpu, Trash2, Save
} from "lucide-react";
import { CLINICS, TIMEZONES, type Clinic, type BusinessHour, type ClinicLocation } from "@/data/clinics";
import { PROVIDERS, STAFF } from "@/data/providers";
import BusinessHoursGrid, { BusinessHoursReadOnly } from "@/components/ui/BusinessHoursGrid";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "details", label: "Details" },
  { id: "business-hours", label: "Business Hours" },
  { id: "admins", label: "Admins" },
  { id: "providers", label: "Providers" },
  { id: "staff", label: "Staff" },
  { id: "branding", label: "Branding" },
  { id: "domain", label: "Domain" },
  { id: "task-settings", label: "Task Settings" },
  { id: "auto-assignment", label: "Auto Assignment" },
  { id: "hierarchy", label: "Hierarchy" },
  { id: "security", label: "OAuth & Security" },
  { id: "resources", label: "Resource Mgmt" },
  { id: "locations", label: "Locations" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{value || <span className="text-slate-400 font-normal italic">Not specified</span>}</p>
    </div>
  );
}

function StubTab({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
      <button className="mt-4 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
        Configure
      </button>
    </div>
  );
}

function avatarBg(name: string) {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360} 60% 70%)`;
}

function Avatar({ name, id }: { name: string; id: string }) {
  const init = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: avatarBg(id) }}>
      {init}
    </div>
  );
}

export default function ClinicDetailScreen({ id }: { id: string }) {
  const source = CLINICS.find(c => c.id === id);
  const [clinic, setClinic] = useState<Clinic | undefined>(source ? { ...source, businessHours: [...source.businessHours] } : undefined);
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Clinic>>({});
  const [bhHours, setBhHours] = useState<BusinessHour[]>(source?.businessHours ?? []);
  const [bhTimezone, setBhTimezone] = useState(source?.timezone ?? "America/New_York");
  const [bhSaved, setBhSaved] = useState(false);

  if (!clinic) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 dark:text-slate-400 mb-3">Clinic not found</p>
        <Link href="/clinic-management" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Clinic Management
        </Link>
      </div>
    );
  }

  const clinicProviders = PROVIDERS.filter(p => p.clinicAccess.includes(id));
  const clinicStaff = STAFF.filter(s => s.clinicAccess.includes(id));

  function startEdit() { setEditForm({ ...clinic }); setIsEditing(true); }
  function cancelEdit() { setIsEditing(false); setEditForm({}); }
  function saveEdit() {
    setClinic(c => c ? { ...c, ...editForm } : c);
    setIsEditing(false);
    setEditForm({});
  }

  function saveBH() {
    setClinic(c => c ? { ...c, businessHours: bhHours, timezone: bhTimezone } : c);
    setBhSaved(true);
    setTimeout(() => setBhSaved(false), 2000);
  }

  function resetBH() {
    if (!clinic) return;
    setBhHours(clinic.businessHours);
    setBhTimezone(clinic.timezone);
  }

  const INPUT = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  function renderTab() {
    if (!clinic) return null;
    switch (activeTab) {
      case "details":
        return (
          <div className="space-y-8">
            {/* Clinic Identification */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Clinic Identification</h2>
                {!isEditing ? (
                  <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50">Cancel</button>
                    <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { k: "name" as const, label: "Clinic Name" }, { k: "tin" as const, label: "TIN" },
                    { k: "phone" as const, label: "Phone" }, { k: "fax" as const, label: "Fax" },
                    { k: "email" as const, label: "Email" }, { k: "website" as const, label: "Website" },
                    { k: "npi" as const, label: "NPI" },
                  ].map(({ k, label }) => (
                    <div key={k}>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</label>
                      <input className={INPUT} value={(editForm[k] as string) ?? ""} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Timezone</label>
                    <select className={INPUT} value={editForm.timezone ?? ""} onChange={e => setEditForm(f => ({ ...f, timezone: e.target.value }))}>
                      {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  {[
                    { k: "address" as const, label: "Street Address" }, { k: "city" as const, label: "City" },
                    { k: "state" as const, label: "State" }, { k: "zip" as const, label: "Zip Code" },
                  ].map(({ k, label }) => (
                    <div key={k}>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</label>
                      <input className={INPUT} value={(editForm[k] as string) ?? ""} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-x-12 gap-y-5">
                    <Field label="Clinic Name" value={clinic.name} />
                    <Field label="TIN" value={clinic.tin} />
                    <Field label="Phone" value={clinic.phone} />
                    <Field label="Fax" value={clinic.fax} />
                    <Field label="Email" value={clinic.email} />
                    <Field label="Website" value={clinic.website} />
                    <Field label="NPI" value={clinic.npi} />
                    <Field label="Timezone" value={clinic.timezone} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Clinic Address</p>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                      {clinic.address}, {clinic.city}, {clinic.state} – {clinic.zip}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Business Hours summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Business Hours</h2>
                <button onClick={() => setActiveTab("business-hours")} className="text-xs text-blue-600 hover:underline">Configure →</button>
              </div>
              <BusinessHoursReadOnly hours={clinic.businessHours} />
            </div>
          </div>
        );

      case "business-hours":
        return (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Business Hours</h2>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Timezone</label>
              <select value={bhTimezone} onChange={e => setBhTimezone(e.target.value)}
                className="w-72 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <BusinessHoursGrid hours={bhHours} onChange={setBhHours} />
            <div className="flex items-center gap-3">
              <button onClick={saveBH} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save</button>
              <button onClick={resetBH} className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              {bhSaved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Saved
                </span>
              )}
            </div>
          </div>
        );

      case "admins":
        return (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">{clinic.admins.length} admin{clinic.admins.length !== 1 ? "s" : ""}</p>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Admin
              </button>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                  {["Name", "Email", "Phone", "Role", "Status", ""].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clinic.admins.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={a.name} id={a.id} />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{a.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">{a.email}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">{a.phone}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{a.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", a.isActive ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "providers":
        return (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">{clinicProviders.length} provider{clinicProviders.length !== 1 ? "s" : ""}</p>
              <Link href="/provider-staff/add" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Provider
              </Link>
            </div>
            {clinicProviders.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No providers assigned to this clinic</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                    {["Provider", "Type", "Specializations", "NPI", "Telehealth", "Status"].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {clinicProviders.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td className="py-3 px-4">
                        <Link href={`/provider-staff/${p.id}`} className="flex items-center gap-2.5 hover:underline">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: p.color }}>
                            {p.firstName[0]}{p.lastName[0]}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{p.displayName}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{p.providerType}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.specializations.slice(0, 2).map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{s}</span>
                          ))}
                          {p.specializations.length > 2 && <span className="text-xs text-slate-400">+{p.specializations.length - 2}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{p.npi || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", p.telehealthEnabled ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                          {p.telehealthEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", p.isActive ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case "staff":
        return (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">{clinicStaff.length} staff member{clinicStaff.length !== 1 ? "s" : ""}</p>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Staff
              </button>
            </div>
            {clinicStaff.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No staff assigned to this clinic</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                    {["Name", "Email", "Type", "Status"].map(h => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {clinicStaff.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.displayName} id={s.id} />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{s.displayName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{s.email}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{s.staffType}</span></td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", s.isActive ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case "locations":
        return (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">{clinic.locations.length} location{clinic.locations.length !== 1 ? "s" : ""}</p>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Location
              </button>
            </div>
            <div className="space-y-3">
              {clinic.locations.map(loc => (
                <div key={loc.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{loc.name}</p>
                      {loc.isPrimary && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Primary</span>}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {loc.address}, {loc.city}, {loc.state} {loc.zip}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {loc.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><Pencil className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "branding": return <StubTab title="Branding" description="Configure clinic logo, colors, and visual identity." icon={Layers} />;
      case "domain": return <StubTab title="Domain Configuration" description="Manage custom domains for the clinic's patient portal and apps." icon={Globe} />;
      case "task-settings": return <StubTab title="Task Settings" description="Configure task categories, auto-assignment rules, and escalation policies." icon={Wrench} />;
      case "auto-assignment": return <StubTab title="Auto Assignment Rules" description="Define rules for automatically assigning tasks and cases to staff." icon={Cpu} />;
      case "hierarchy": return <StubTab title="Hierarchy" description="Configure the organizational hierarchy and reporting structure." icon={Layers} />;
      case "security": return <StubTab title="OAuth & Security" description="Manage SSO integrations, OAuth providers, and security policies." icon={Key} />;
      case "resources": return <StubTab title="Resource Management" description="Manage rooms, equipment, and shared facility resources." icon={Map} />;
      default: return null;
    }
  }

  return (
    <div className="space-y-0 -mt-1">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-4">
        <Link href="/" className="hover:text-slate-600 dark:hover:text-slate-300">Home</Link>
        <span>/</span>
        <Link href="/clinic-management" className="hover:text-slate-600 dark:hover:text-slate-300">Clinic Management</Link>
        <span>/</span>
        <Link href="/clinic-management" className="hover:text-slate-600 dark:hover:text-slate-300">View</Link>
        <span>/</span>
        <span className="text-slate-500 dark:text-slate-400 font-mono">{id}</span>
      </div>

      {/* Page title + back/edit */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{clinic.name}</h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/clinic-management"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Link>
          <button onClick={activeTab === "details" ? startEdit : undefined}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      {/* Clinic info bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
            {clinic.logoEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{clinic.name}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Active</span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-0.5"><Hash className="w-3 h-3" />{clinic.slug}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{clinic.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{clinic.phone}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div><p className="text-xl font-bold text-slate-800 dark:text-slate-200">{clinic.staffCount}</p><p className="text-xs text-slate-500 dark:text-slate-400">Staff</p></div>
            <div><p className="text-xl font-bold text-slate-800 dark:text-slate-200">{clinic.adminCount}</p><p className="text-xs text-slate-500 dark:text-slate-400">Admins</p></div>
            <div><p className="text-xl font-bold text-slate-800 dark:text-slate-200">{clinic.providerCount}</p><p className="text-xs text-slate-500 dark:text-slate-400">Providers</p></div>
          </div>
          <div className="flex items-center gap-2">
            {clinic.hasOperationsApp && (
              <a href="#" className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1">
                Operations App <Globe className="w-3 h-3" />
              </a>
            )}
            {clinic.hasPatientPortal && (
              <a href="#" className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1">
                Patient Portal <Globe className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout: sidebar + content */}
      <div className="flex gap-6 mt-0">
        {/* Sidebar */}
        <nav className="w-52 flex-shrink-0 space-y-0.5">
          {(() => {
            const GROUPED_TABS: (typeof TABS[number] | "sep")[] = [
              TABS[0], TABS[1], TABS[12], "sep",
              TABS[2], TABS[3], TABS[4], "sep",
              TABS[5], TABS[6], TABS[7], TABS[8], "sep",
              TABS[9], TABS[10], TABS[11],
            ];
            return GROUPED_TABS.map((item, idx) => {
              if (item === "sep") {
                return <div key={`sep-${idx}`} className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />;
              }
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                    activeTab === item.id
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
                  )}>
                  {item.label}
                </button>
              );
            });
          })()}
        </nav>
        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
