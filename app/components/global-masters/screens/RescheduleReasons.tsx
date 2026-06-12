"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, PowerOff, Trash2, RotateCcw } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface RescheduleReason {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

const SEED: RescheduleReason[] = [
  { id: "1", name: "Patient Request", displayOrder: 1, isActive: true },
  { id: "2", name: "Provider Conflict", displayOrder: 2, isActive: true },
  { id: "3", name: "Telehealth Issues", displayOrder: 3, isActive: true },
  { id: "4", name: "Work Schedule Change", displayOrder: 4, isActive: true },
  { id: "5", name: "Medical Emergency", displayOrder: 5, isActive: true },
  { id: "6", name: "Travel", displayOrder: 6, isActive: false },
];

const EMPTY_FORM = { name: "", displayOrder: 0, isActive: true };

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
      active
        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function RescheduleReasonsScreen() {
  const [reasons, setReasons] = useState<RescheduleReason[]>(SEED);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RescheduleReason | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() =>
    reasons.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
    [reasons, query]
  );

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, displayOrder: reasons.length + 1 });
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(reason: RescheduleReason) {
    setEditing(reason);
    setForm({ name: reason.name, displayOrder: reason.displayOrder, isActive: reason.isActive });
    setErrors({});
    setDrawerOpen(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.displayOrder < 1) e.displayOrder = "Must be 1 or greater";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setReasons((prev) => prev.map((r) => r.id === editing.id ? { ...r, ...form } : r));
    } else {
      setReasons((prev) => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  function toggleActive(id: string) {
    setReasons((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }

  function handleDelete(id: string) {
    setReasons((prev) => prev.filter((r) => r.id !== id));
    setDeleteId(null);
  }

  const fieldClass = (key: string) =>
    cn(
      "w-full px-3 py-2 rounded-lg text-sm border bg-white dark:bg-slate-800",
      "text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow",
      errors[key]
        ? "border-red-400 dark:border-red-600"
        : "border-slate-200 dark:border-slate-700"
    );

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <RotateCcw className="w-[18px] h-[18px] text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reschedule Reasons</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage reasons available when rescheduling an appointment</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Reason
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reasons…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700
                bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100
                placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <span className="text-xs text-slate-400 ml-auto">
            {filtered.length} of {reasons.length} records
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {["#", "Reason Name", "Display Order", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    {query ? `No reasons matching "${query}"` : "No reschedule reasons yet. Click Add to create one."}
                  </td>
                </tr>
              )}
              {filtered.map((reason, idx) => (
                <tr key={reason.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{reason.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center">
                    {reason.displayOrder}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={reason.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(reason)}
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(reason.id)}
                        title={reason.isActive ? "Deactivate" : "Activate"}
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(reason.id)}
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-80">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Reschedule Reason</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will permanently remove the reschedule reason. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Reschedule Reason" : "Add Reschedule Reason"}
        description={editing ? `Editing: ${editing.name}` : "Create a new reschedule reason"}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              {editing ? "Save Changes" : "Create Reason"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className={fieldClass("name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Patient Request"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Display Order <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              className={fieldClass("displayOrder")}
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
            />
            {errors.displayOrder && <p className="mt-1 text-xs text-red-500">{errors.displayOrder}</p>}
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Status</p>
              <p className="text-xs text-slate-400 mt-0.5">Inactive reasons won&apos;t appear in the reschedule flow</p>
            </div>
            <Toggle
              checked={form.isActive}
              onChange={(v) => setForm({ ...form, isActive: v })}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
