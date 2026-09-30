"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { categorySchema } from "@/lib/product/schemas";
import { challengeKeys, deleteCategory, upsertCategories, type Challenge, type ChallengeCategory } from "@/lib/product/data/challenges";
import { getSupabaseBrowserClient } from "@/lib/product/supabase/client";
import { Button, Dialog, inputClass } from "@/components/product/ui/primitives";
import { useToast } from "@/components/product/ui/Toast";
import { useConfirm } from "@/components/product/ui/Confirm";
import { cn } from "@/lib/utils";

type Draft = ChallengeCategory & { isNew?: boolean };

/** Admin-only editor for challenge categories: name, colour and order. */
export default function CategoriesDialog({ onClose, categories, challenges }: { onClose: () => void; categories: ChallengeCategory[]; challenges: Challenge[] }) {
  const [rows, setRows] = useState<Draft[]>(categories);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();

  async function removeRow(i: number) {
    const row = rows[i];
    if (row.isNew) {
      setRows((r) => r.filter((_, j) => j !== i));
      return;
    }
    const ok = await confirm({
      title: "Delete this category?",
      message: <p><strong>{row.name}</strong>{" "}will be permanently deleted. This can&apos;t be undone.</p>,
      confirmLabel: "Delete category",
    });
    if (!ok) return;
    try {
      await deleteCategory(getSupabaseBrowserClient(), row.code);
      await qc.invalidateQueries({ queryKey: challengeKeys.categories });
      setRows((r) => r.filter((x) => x.code !== row.code));
      toast(`Deleted “${row.name}”`);
    } catch (e) {
      toast(`Couldn't delete: ${(e as Error).message}`, "error");
    }
  }
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
      const parsed = categorySchema.safeParse({ ...r, sort_order: i + 1 });
      if (!parsed.success) errs[i] = parsed.error.issues[0].message;
      return { code: r.code, name: r.name.trim(), color: r.color.toUpperCase(), sort_order: i + 1 };
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await upsertCategories(getSupabaseBrowserClient(), payload);
      await qc.invalidateQueries({ queryKey: challengeKeys.categories });
      toast("Categories saved");
      onClose();
    } catch (e) {
      toast(`Couldn't save categories: ${(e as Error).message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Challenge categories"
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
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.isNew ? `new-${i}` : r.code} className="rounded-lg border border-pm-border p-2">
            <div className="flex items-center gap-2">
              <input aria-label={`Colour for ${r.name}`} type="color" value={/^#[0-9a-f]{6}$/i.test(r.color) ? r.color : "#000000"} onChange={(e) => patch(i, { color: e.target.value })} className="h-9 w-10 shrink-0 cursor-pointer rounded border border-pm-border bg-transparent" />
              <input aria-label="Name" className={inputClass} value={r.name} onChange={(e) => patch(i, { name: e.target.value })} />
              <Button size="sm" variant="ghost" aria-label={`Move ${r.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" aria-label={`Move ${r.name} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              {(() => {
                const used = challenges.filter((c) => c.category === r.code).length;
                return (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${r.name || "new category"}`}
                    title={used ? `Used by ${used} challenge${used === 1 ? "" : "s"} (archived included). Move or delete them first.` : "Delete"}
                    disabled={used > 0}
                    onClick={() => removeRow(i)}
                    className="text-pm-warning"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                );
              })()}
            </div>
            {r.isNew && <input aria-label="Code" placeholder="code (e.g. finance)" className={cn(inputClass, "mt-2 font-mono")} value={r.code} onChange={(e) => patch(i, { code: e.target.value })} />}
            {errors[i] && (
              <p role="alert" className="mt-1 text-xs text-pm-warning">
                {errors[i]}
              </p>
            )}
          </li>
        ))}
      </ol>
      <Button className="mt-3" size="sm" onClick={() => setRows((r) => [...r, { code: "", name: "", color: "#475569", sort_order: r.length + 1, isNew: true }])}>
        <Plus className="h-4 w-4" /> Add category
      </Button>
    </Dialog>
  );
}
