"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, PowerOff, Trash2, X, type LucideIcon } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

export interface SimpleItem {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  [key: string]: unknown;
}

export interface ExtraField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface ExtraColumn<T extends SimpleItem = SimpleItem> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
}

interface Props<T extends SimpleItem = SimpleItem> {
  title: string;
  description: string;
  icon: LucideIcon;
  singularLabel: string;
  seedData: T[];
  extraFields?: ExtraField[];
  extraColumns?: ExtraColumn<T>[];
  hasDescription?: boolean;
}

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

export default function GmSimpleTable<T extends SimpleItem = SimpleItem>({
  title,
  description,
  icon: Icon,
  singularLabel,
  seedData,
  extraFields = [],
  extraColumns = [],
  hasDescription = false,
}: Props<T>) {
  const [items, setItems] = useState<T[]>(seedData);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(it =>
      it.name.toLowerCase().includes(q) ||
      (hasDescription && String(it.description ?? "").toLowerCase().includes(q)) ||
      extraFields.some(f => String(it[f.key] ?? "").toLowerCase().includes(q))
    );
  }, [items, query, hasDescription, extraFields]);

  function openAdd() {
    const defaults: Record<string, unknown> = {
      name: "", displayOrder: items.length + 1, isActive: true,
    };
    if (hasDescription) defaults.description = "";
    for (const f of extraFields) defaults[f.key] = f.defaultValue ?? "";
    setForm(defaults);
    setEditing(null);
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(item: T) {
    const f: Record<string, unknown> = {
      name: item.name, displayOrder: item.displayOrder, isActive: item.isActive,
    };
    if (hasDescription) f.description = item.description ?? "";
    for (const ef of extraFields) f[ef.key] = item[ef.key] ?? ef.defaultValue ?? "";
    setForm(f);
    setEditing(item);
    setErrors({});
    setDrawerOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!String(form.name ?? "").trim()) errs.name = "Name is required";
    if (!form.displayOrder || Number(form.displayOrder) < 1) errs.displayOrder = "Must be ≥ 1";
    for (const f of extraFields) {
      if (f.required && !String(form[f.key] ?? "").trim()) errs[f.key] = `${f.label} is required`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setItems(prev => prev.map(it => it.id === editing.id ? { ...it, ...form } as T : it));
    } else {
      const next: T = { id: crypto.randomUUID(), ...form } as unknown as T;
      setItems(prev => [...prev, next]);
    }
    setDrawerOpen(false);
  }

  function toggleActive(id: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, isActive: !it.isActive } as T : it));
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(it => it.id !== id));
    setDeleteId(null);
  }

  const activeCount = items.filter(i => i.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add {singularLabel}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <span>{items.length} total</span>
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
        <span className="text-emerald-600 dark:text-emerald-400">{activeCount} active</span>
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
        <span>{items.length - activeCount} inactive</span>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}…`}
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-8">#</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Name</th>
              {hasDescription && (
                <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Description</th>
              )}
              {extraColumns.map(col => (
                <th key={col.key} className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                  {col.label}
                </th>
              ))}
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-28" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4 + (hasDescription ? 1 : 0) + extraColumns.length} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  {query ? "No results found" : `No ${title.toLowerCase()} yet`}
                </td>
              </tr>
            )}
            {filtered.map((item, idx) => (
              <tr
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <td className="py-3 px-4 text-slate-400 dark:text-slate-500 text-xs">{item.displayOrder}</td>
                <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                {hasDescription && (
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {String(item.description ?? "")}
                  </td>
                )}
                {extraColumns.map(col => (
                  <td key={col.key} className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    {col.render(item)}
                  </td>
                ))}
                <td className="py-3 px-4 text-center">
                  <StatusBadge active={item.isActive} />
                </td>
                <td className="py-3 px-4">
                  <div className={cn("flex items-center justify-end gap-1 transition-opacity", hoveredId === item.id ? "opacity-100" : "opacity-0")}>
                    <button
                      onClick={() => openEdit(item)}
                      title="Edit"
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleActive(item.id)}
                      title={item.isActive ? "Deactivate" : "Activate"}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      title="Delete"
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 hover:text-red-500"
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

      {/* Add/Edit Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Edit ${singularLabel}` : `Add ${singularLabel}`}
        description={editing ? `Update details for "${editing.name}"` : `Create a new ${singularLabel.toLowerCase()}`}
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              {editing ? "Save Changes" : `Add ${singularLabel}`}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={String(form.name ?? "")}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={`${singularLabel} name`}
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.name ? "border-red-400" : "border-slate-200 dark:border-slate-700"
              )}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {hasDescription && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
              <textarea
                value={String(form.description ?? "")}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {extraFields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={String(form[field.key] ?? "")}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none",
                    errors[field.key] ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                  )}
                />
              ) : field.type === "select" ? (
                <select
                  value={String(form[field.key] ?? "")}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors[field.key] ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={String(form[field.key] ?? "")}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors[field.key] ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                  )}
                />
              )}
              {errors[field.key] && <p className="text-xs text-red-500 mt-1">{errors[field.key]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Display Order <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={String(form.displayOrder ?? "")}
              onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 1 }))}
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.displayOrder ? "border-red-400" : "border-slate-200 dark:border-slate-700"
              )}
            />
            {errors.displayOrder && <p className="text-xs text-red-500 mt-1">{errors.displayOrder}</p>}
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {form.isActive ? "Visible and available in the system" : "Hidden from selection lists"}
              </p>
            </div>
            <Toggle
              checked={Boolean(form.isActive)}
              onChange={v => setForm(f => ({ ...f, isActive: v }))}
            />
          </div>
        </div>
      </Drawer>

      {/* Delete confirmation dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete {singularLabel}?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                This action cannot be undone. The {singularLabel.toLowerCase()} will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
