"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, PowerOff, Trash2, BedDouble } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface RoomType {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  capacity: number;
}

const SEED: RoomType[] = [
  { id: "1", name: "Consultation Room", description: "Standard room for provider–patient meetings", isActive: true, displayOrder: 1, capacity: 3 },
  { id: "2", name: "Therapy Room", description: "Private individual therapy and counseling sessions", isActive: true, displayOrder: 2, capacity: 2 },
  { id: "3", name: "Group Therapy Room", description: "Group therapy sessions and psychoeducation workshops", isActive: true, displayOrder: 3, capacity: 12 },
  { id: "4", name: "Telehealth Station", description: "Dedicated room for virtual telehealth appointments", isActive: true, displayOrder: 4, capacity: 1 },
  { id: "5", name: "Waiting Area", description: "Patient waiting area before appointment check-in", isActive: true, displayOrder: 5, capacity: 20 },
  { id: "6", name: "Assessment Room", description: "Psychological assessments, cognitive testing, and evaluations", isActive: false, displayOrder: 6, capacity: 2 },
];

const EMPTY_FORM = { name: "", description: "", isActive: true, displayOrder: 0, capacity: 1 };

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

export default function RoomTypesScreen() {
  const [rooms, setRooms] = useState<RoomType[]>(SEED);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() =>
    rooms.filter((r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase())
    ),
    [rooms, query]
  );

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, displayOrder: rooms.length + 1 });
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(room: RoomType) {
    setEditing(room);
    setForm({ name: room.name, description: room.description, isActive: room.isActive, displayOrder: room.displayOrder, capacity: room.capacity });
    setErrors({});
    setDrawerOpen(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.displayOrder < 1) e.displayOrder = "Must be 1 or greater";
    if (form.capacity < 1) e.capacity = "Must be 1 or greater";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setRooms((prev) => prev.map((r) => r.id === editing.id ? { ...r, ...form } : r));
    } else {
      setRooms((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setDrawerOpen(false);
  }

  function toggleActive(id: string) {
    setRooms((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }

  function handleDelete(id: string) {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setDeleteId(null);
  }

  const field = (key: string) => ({
    className: cn(
      "w-full px-3 py-2 rounded-lg text-sm border bg-white dark:bg-slate-800",
      "text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow",
      errors[key]
        ? "border-red-400 dark:border-red-600"
        : "border-slate-200 dark:border-slate-700"
    ),
  });

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <BedDouble className="w-[18px] h-[18px] text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Room Types</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Define and manage physical room categories used across clinics</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Room Type
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
              placeholder="Search room types…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700
                bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100
                placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <span className="text-xs text-slate-400 ml-auto">
            {filtered.length} of {rooms.length} records
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {["#", "Name", "Description", "Capacity", "Order", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    {query ? `No room types matching "${query}"` : "No room types yet. Click Add to create one."}
                  </td>
                </tr>
              )}
              {filtered.map((room, idx) => (
                <tr key={room.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{room.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[280px]">
                    <span className="line-clamp-1">{room.description}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {room.capacity}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center">
                    {room.displayOrder}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={room.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(room)}
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(room.id)}
                        title={room.isActive ? "Deactivate" : "Activate"}
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(room.id)}
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

      {/* Delete confirm inline */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-80">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Room Type</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will permanently remove the room type. This action cannot be undone.
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
        title={editing ? "Edit Room Type" : "Add Room Type"}
        description={editing ? `Editing: ${editing.name}` : "Create a new room type for your organization"}
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
              {editing ? "Save Changes" : "Create Room Type"}
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
              {...field("name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Consultation Room"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description of how this room type is used…"
              className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Display Order + Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Display Order <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                {...field("displayOrder")}
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
              />
              {errors.displayOrder && <p className="mt-1 text-xs text-red-500">{errors.displayOrder}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Default Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                {...field("capacity")}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
              {errors.capacity && <p className="mt-1 text-xs text-red-500">{errors.capacity}</p>}
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Status</p>
              <p className="text-xs text-slate-400 mt-0.5">Inactive room types won&apos;t appear in scheduling</p>
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
