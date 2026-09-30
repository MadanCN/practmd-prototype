"use client";

import type { RoadmapItem, Workstream } from "@/lib/product/data/roadmap";
import type { Weights } from "@/lib/product/score";
import { Sheet } from "@/components/product/ui/primitives";
import ItemForm, { suggestCode } from "./ItemForm";
import { useInsertItem } from "./useRoadmap";

export default function AddItemSheet({
  open,
  onClose,
  items,
  workstreams,
  weights,
}: {
  open: boolean;
  onClose: () => void;
  items: RoadmapItem[];
  workstreams: Workstream[];
  weights: Weights | undefined;
}) {
  const insert = useInsertItem();
  const firstWs = workstreams[0]?.code ?? "";
  return (
    <Sheet open={open} onClose={onClose} title="Add roadmap item" width="max-w-2xl">
      {open && (
        <ItemForm
          isNew
          defaultValues={{
            code: firstWs ? suggestCode(firstWs, items) : "",
            name: "",
            workstream: firstWs,
            description: null,
            outcome: null,
            horizon: "later",
            revenue_impact: null,
            operational_efficiency: null,
            unlocks: null,
            ease: null,
            score_adjustment: 0,
            adjustment_reason: null,
            start_date: null,
            end_date: null,
            depends_on_codes: [],
            is_mvp: false,
            owner: null,
          }}
          items={items}
          workstreams={workstreams}
          weights={weights}
          submitLabel="Add item"
          onCancel={onClose}
          onSubmit={async (values) => {
            const sortOrder = Math.max(0, ...items.map((i) => i.sort_order)) + 1;
            await insert.mutateAsync({ ...values, sort_order: sortOrder });
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}
