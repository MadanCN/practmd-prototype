"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { contrastWithWhite } from "@/lib/product/constants";
import { workstreamSchema } from "@/lib/product/schemas";
import { roadmapKeys, upsertWorkstreams, type Workstream } from "@/lib/product/data/roadmap";
import { getSupabaseBrowserClient } from "@/lib/product/supabase/client";
import { Button, Dialog, inputClass } from "@/components/product/ui/primitives";
import { useToast } from "@/components/product/ui/Toast";
import { cn } from "@/lib/utils";

type Draft = Workstream & { isNew?: boolean };

/** Admin-only editor for workstream names, colours, descriptions and order. */
export default function ManageWorkstreamsDialog({ open, onClose, workstreams }: { open: boolean; onClose: () => void; workstreams: Workstream[] }) {
  const [rows, setRows] = useState<Draft[]>(workstreams);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  const patch = (i: number, p: Partial<Draft>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...p } : row)));
  const move = (i: number, d: -1 | 1) =>
    setRows((r) => {
      const next = [...r];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  async function save() {
    const errs: Record<number, string> = {};
    const payload = rows.map((r, i) => {
      const parsed = workstreamSchema.safeParse({ ...r, sort_order: i + 1 });
      if (!parsed.success) errs[i] = parsed.error.issues[0].message;
      return { code: r.code, name: r.name.trim(), color: r.color.toUpperCase(), description: r.description?.trim() || null, sort_order: i + 1 };
    });
    const codes = payload.map((p) => p.code);
    codes.forEach((c, i) => codes.indexOf(c) !== i && (errs[i] = "Code already used"));
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await upsertWorkstreams(getSupabaseBrowserClient(), payload);
      await qc.invalidateQueries({ queryKey: roadmapKeys.workstreams });
      toast("Workstreams saved");
      onClose();
    } catch (e) {
      toast(`Couldn't save workstreams: ${(e as Error).message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Manage workstreams"
      width="max-w-3xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-pm-muted">Colours are used on every tab, including the Timeline. White text needs a contrast of at least 4.5:1.</p>
      <ol className="space-y-3">
        {rows.map((r, i) => {
          const ratio = contrastWithWhite(r.color);
          return (
            <li key={r.isNew ? `new-${i}` : r.code} className="rounded-xl border border-pm-border p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
                <input aria-label="Name" className={inputClass} value={r.name} onChange={(e) => patch(i, { name: e.target.value })} />
                <div className="flex items-center gap-2">
                  <input aria-label={`Colour for ${r.name}`} type="color" value={/^#[0-9a-f]{6}$/i.test(r.color) ? r.color : "#000000"} onChange={(e) => patch(i, { color: e.target.value })} className="h-9 w-10 shrink-0 cursor-pointer rounded border border-pm-border bg-transparent" />
                  <input aria-label={`Hex colour for ${r.name}`} className={cn(inputClass, "font-mono")} value={r.color} onChange={(e) => patch(i, { color: e.target.value })} />
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" aria-label={`Move ${r.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={`Move ${r.name} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input aria-label={`Description for ${r.name}`} placeholder="Description" className={inputClass} value={r.description ?? ""} onChange={(e) => patch(i, { description: e.target.value })} />
                <span
                  className="inline-flex items-center justify-center rounded-lg px-3 text-xs font-semibold text-white"
                  style={{ backgroundColor: /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : "#888888" }}
                >
                  {ratio.toFixed(1)}:1 {ratio >= 4.5 ? "✓ readable" : "✗ low contrast"}
                </span>
              </div>
              {r.isNew && (
                <input aria-label="Code" placeholder="code (e.g. data_platform)" className={cn(inputClass, "mt-2 font-mono")} value={r.code} onChange={(e) => patch(i, { code: e.target.value })} />
              )}
              {errors[i] && (
                <p role="alert" className="mt-1 text-xs text-pm-warning">
                  {errors[i]}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <Button className="mt-3" size="sm" onClick={() => setRows((r) => [...r, { code: "", name: "", color: "#475569", description: null, sort_order: r.length + 1, isNew: true }])}>
        <Plus className="h-4 w-4" /> Add workstream
      </Button>
    </Dialog>
  );
}
