"use client";

import { useState } from "react";
import { Shield, Plus, Copy, Pencil, Trash2, Check } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

const MODULES = [
  "Dashboard", "Appointments", "Patient Records", "Clinical Notes",
  "Billing & Payments", "Reports & Analytics", "Staff Management",
  "Settings", "Audit Log", "Telehealth", "Forms & Documents", "Messaging",
];

const ACTIONS = ["View", "Create", "Edit", "Delete"] as const;
type Action = typeof ACTIONS[number];

interface RolePermissions {
  [module: string]: Record<Action, boolean>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissions: RolePermissions;
}

function makeFullAccess(): RolePermissions {
  return Object.fromEntries(MODULES.map(m => [m, { View: true, Create: true, Edit: true, Delete: true }]));
}

function makeReadOnly(): RolePermissions {
  return Object.fromEntries(MODULES.map(m => [m, { View: true, Create: false, Edit: false, Delete: false }]));
}

function makeNoAccess(): RolePermissions {
  return Object.fromEntries(MODULES.map(m => [m, { View: false, Create: false, Edit: false, Delete: false }]));
}

const SEED_ADMIN: Role[] = [
  { id: "1", name: "Super Admin", description: "Full unrestricted access to all modules", isActive: true, permissions: makeFullAccess() },
  {
    id: "2", name: "Practice Manager", description: "Full access except system-level settings", isActive: true,
    permissions: {
      ...makeFullAccess(),
      "Settings": { View: true, Create: false, Edit: false, Delete: false },
      "Audit Log": { View: true, Create: false, Edit: false, Delete: false },
    }
  },
  {
    id: "3", name: "Billing Admin", description: "Billing, payments, and limited patient data", isActive: true,
    permissions: {
      ...makeNoAccess(),
      "Dashboard": { View: true, Create: false, Edit: false, Delete: false },
      "Patient Records": { View: true, Create: false, Edit: false, Delete: false },
      "Billing & Payments": { View: true, Create: true, Edit: true, Delete: false },
      "Reports & Analytics": { View: true, Create: false, Edit: false, Delete: false },
    }
  },
  {
    id: "4", name: "Read-Only Auditor", description: "View access to all modules — no write permissions", isActive: false,
    permissions: makeReadOnly(),
  },
];

const SEED_STAFF: Role[] = [
  {
    id: "s1", name: "Front Desk", description: "Scheduling, check-in, basic patient info", isActive: true,
    permissions: {
      ...makeNoAccess(),
      "Dashboard": { View: true, Create: false, Edit: false, Delete: false },
      "Appointments": { View: true, Create: true, Edit: true, Delete: false },
      "Patient Records": { View: true, Create: true, Edit: true, Delete: false },
      "Forms & Documents": { View: true, Create: false, Edit: false, Delete: false },
      "Messaging": { View: true, Create: true, Edit: false, Delete: false },
    }
  },
  {
    id: "s2", name: "Medical Assistant", description: "Clinical support, vitals, form entry", isActive: true,
    permissions: {
      ...makeNoAccess(),
      "Dashboard": { View: true, Create: false, Edit: false, Delete: false },
      "Appointments": { View: true, Create: false, Edit: false, Delete: false },
      "Patient Records": { View: true, Create: false, Edit: true, Delete: false },
      "Clinical Notes": { View: true, Create: true, Edit: true, Delete: false },
      "Forms & Documents": { View: true, Create: true, Edit: true, Delete: false },
    }
  },
];

interface Props { type: "administrative" | "staff" }

export default function PermissionMatrix({ type }: Props) {
  const seed = type === "administrative" ? SEED_ADMIN : SEED_STAFF;
  const [roles, setRoles] = useState<Role[]>(seed);
  const [selectedId, setSelectedId] = useState(seed[0].id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [nameForm, setNameForm] = useState({ name: "", description: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selected = roles.find(r => r.id === selectedId) ?? roles[0];

  function toggle(module: string, action: Action) {
    setRoles(prev => prev.map(r => {
      if (r.id !== selectedId) return r;
      return {
        ...r,
        permissions: {
          ...r.permissions,
          [module]: { ...r.permissions[module], [action]: !r.permissions[module][action] },
        },
      };
    }));
  }

  function setAllForModule(module: string, val: boolean) {
    setRoles(prev => prev.map(r => {
      if (r.id !== selectedId) return r;
      return {
        ...r,
        permissions: {
          ...r.permissions,
          [module]: { View: val, Create: val, Edit: val, Delete: val },
        },
      };
    }));
  }

  function duplicateRole(role: Role) {
    const copy: Role = {
      ...role,
      id: crypto.randomUUID(),
      name: `${role.name} (Copy)`,
      permissions: JSON.parse(JSON.stringify(role.permissions)),
    };
    setRoles(prev => [...prev, copy]);
    setSelectedId(copy.id);
    setCopiedId(copy.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openAddRole() {
    setNameForm({ name: "", description: "" });
    setEditingRole(null);
    setDrawerOpen(true);
  }

  function openEditRole(r: Role) {
    setNameForm({ name: r.name, description: r.description });
    setEditingRole(r);
    setDrawerOpen(true);
  }

  function handleSaveRole() {
    if (!nameForm.name.trim()) return;
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...nameForm } : r));
    } else {
      const nr: Role = {
        id: crypto.randomUUID(),
        name: nameForm.name,
        description: nameForm.description,
        isActive: true,
        permissions: makeNoAccess(),
      };
      setRoles(prev => [...prev, nr]);
      setSelectedId(nr.id);
    }
    setDrawerOpen(false);
  }

  const moduleAllChecked = (module: string) =>
    ACTIONS.every(a => selected.permissions[module]?.[a]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {type === "administrative" ? "Administrative Roles" : "Staff Roles"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Define module-level CRUD permissions for each role.
            </p>
          </div>
        </div>
        <button onClick={openAddRole} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      <div className="flex gap-4">
        {/* Role list */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {roles.map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                r.id === selectedId
                  ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                  : "hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-transparent"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", r.id === selectedId ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200")}>{r.name}</p>
                <p className="text-xs text-slate-400 truncate">{r.description}</p>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); openEditRole(r); }} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={e => { e.stopPropagation(); duplicateRole(r); }} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {copiedId === r.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
                {roles.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); setRoles(p => p.filter(x => x.id !== r.id)); if (selectedId === r.id) setSelectedId(roles.find(x => x.id !== r.id)!.id); }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-1">{selected.name}</p>
            <Toggle checked={selected.isActive} onChange={v => setRoles(p => p.map(r => r.id === selectedId ? { ...r, isActive: v } : r))} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{selected.isActive ? "Active" : "Inactive"}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left py-2.5 px-4 font-medium text-slate-600 dark:text-slate-400">Module</th>
                {ACTIONS.map(a => (
                  <th key={a} className="text-center py-2.5 px-3 font-medium text-slate-600 dark:text-slate-400 w-20">{a}</th>
                ))}
                <th className="text-center py-2.5 px-3 font-medium text-slate-500 dark:text-slate-500 w-20 text-xs">All</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map(module => (
                <tr key={module} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-medium">{module}</td>
                  {ACTIONS.map(action => (
                    <td key={action} className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.permissions[module]?.[action] ?? false}
                        onChange={() => toggle(module, action)}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={moduleAllChecked(module)}
                      onChange={e => setAllForModule(module, e.target.checked)}
                      className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        title={editingRole ? "Edit Role" : "Add Role"}
        description="Role name and description"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSaveRole} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Role</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role Name <span className="text-red-500">*</span></label>
            <input value={nameForm.name} onChange={e => setNameForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Practice Manager"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={nameForm.description} onChange={e => setNameForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this role's responsibilities" rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {!editingRole && (
            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
              New role starts with no permissions. Use the permission matrix to grant access after creating.
            </p>
          )}
        </div>
      </Drawer>
    </div>
  );
}
