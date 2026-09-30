"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { Archive, ArchiveRestore, MessageSquarePlus, Trash2 } from "lucide-react";
import { zodResolver } from "@/lib/product/zod-resolver";
import { challengeSchema, type ChallengeInput, type ChallengeValues } from "@/lib/product/schemas";
import { CHALLENGE_PRIORITIES, CHALLENGE_STATUSES } from "@/lib/product/constants";
import type { ChallengeCategory, ChallengeNote, ChallengeWithCounts } from "@/lib/product/data/challenges";
import { Button, ColorChip, Field, Sheet, inputClass } from "@/components/product/ui/primitives";
import { useSession } from "@/components/product/SessionContext";
import { NoteComposer, NotesTimeline, type ComposerHandle } from "./Notes";
import { StatusChip } from "./ChallengeCard";
import { useChallengeMutations } from "./useChallenges";
import { useConfirm } from "@/components/product/ui/Confirm";
import { cn } from "@/lib/utils";

function toInput(c: ChallengeWithCounts): ChallengeInput {
  return {
    title: c.title,
    description: c.description,
    category: c.category,
    ask: c.ask,
    status: c.status,
    priority: c.priority,
    owner: c.owner,
    raised_by: c.raised_by,
    related_item_code: c.related_item_code,
  };
}

function ChallengeForm({
  challenge,
  categories,
  roadmapCodes,
  readOnly,
}: {
  challenge: ChallengeWithCounts;
  categories: ChallengeCategory[];
  roadmapCodes: { code: string; name: string }[];
  readOnly: boolean;
}) {
  const { update } = useChallengeMutations();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ChallengeInput, unknown, ChallengeValues>({ resolver: zodResolver(challengeSchema), defaultValues: toInput(challenge) });

  const submit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({ id: challenge.id, patch: values });
    } catch {
      // Rolled back and reported by the mutation.
    }
  });

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <fieldset disabled={readOnly} className="space-y-3">
        <Field label="Title *" htmlFor="ch-title" error={errors.title?.message}>
          <input id="ch-title" className={inputClass} {...register("title")} />
        </Field>
        <Field label="Description" htmlFor="ch-desc">
          <textarea id="ch-desc" rows={3} className={inputClass} {...register("description")} />
        </Field>
        <Field label="Ask (the question we want advice on)" htmlFor="ch-ask">
          <textarea id="ch-ask" rows={2} className={cn(inputClass, "text-pm-link")} {...register("ask")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Category" htmlFor="ch-cat">
            <select id="ch-cat" className={inputClass} {...register("category")}>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" htmlFor="ch-status" hint="Also changes automatically when advice or actions are added">
            <select id="ch-status" className={inputClass} {...register("status")}>
              {CHALLENGE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority" htmlFor="ch-priority">
            <select id="ch-priority" className={inputClass} {...register("priority")}>
              {CHALLENGE_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Owner" htmlFor="ch-owner">
            <input id="ch-owner" className={inputClass} {...register("owner")} />
          </Field>
          <Field label="Raised by" htmlFor="ch-raised">
            <input id="ch-raised" className={inputClass} {...register("raised_by")} />
          </Field>
          <Field label="Related roadmap item" htmlFor="ch-related" hint="Type to search by code or name">
            <input id="ch-related" list="roadmap-codes" className={cn(inputClass, "font-mono")} {...register("related_item_code")} />
            <datalist id="roadmap-codes">
              {roadmapCodes.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </datalist>
          </Field>
        </div>
      </fieldset>
      {!readOnly && (
        <div className="flex justify-end">
          <Button type="submit" size="sm" variant="primary" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? "Saving…" : "Save details"}
          </Button>
        </div>
      )}
    </form>
  );
}

export default function ChallengeDrawer({
  challenge,
  notes,
  categories,
  roadmapCodes,
  onClose,
}: {
  challenge: ChallengeWithCounts | undefined;
  notes: ChallengeNote[];
  categories: ChallengeCategory[];
  roadmapCodes: { code: string; name: string }[];
  onClose: () => void;
}) {
  const { canEdit } = useSession();
  const { update, remove } = useChallengeMutations();
  const confirm = useConfirm();
  const composer = useRef<ComposerHandle>(null);
  if (!challenge) return null;
  const cat = categories.find((c) => c.code === challenge.category);
  const related = roadmapCodes.find((r) => r.code === challenge.related_item_code);
  const challengeNotes = notes.filter((n) => n.challenge_id === challenge.id);

  async function onDelete() {
    if (!challenge) return;
    const ok = await confirm({
      title: "Delete this challenge?",
      message: (
        <>
          <p>
            <strong>{challenge.title}</strong>
            {challengeNotes.length > 0 ? ` and its ${challengeNotes.length === 1 ? "1 note" : `${challengeNotes.length} notes`}` : ""}
            {" will be permanently deleted. This can't be undone."}
          </p>
          {!challenge.archived_at && <p className="mt-2 text-pm-muted">To hide it but keep the record, use Archive instead.</p>}
        </>
      ),
      confirmLabel: "Delete challenge",
    });
    if (!ok) return;
    remove.mutate(challenge);
    onClose();
  }

  return (
    <Sheet
      open
      onClose={onClose}
      width="max-w-2xl"
      title={challenge.title}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {cat && <ColorChip color={cat.color} label={cat.name} />}
          <StatusChip status={challenge.status} />
          {related && (
            <a href={`/product/priorities?item=${related.code}`} className="text-xs text-pm-link hover:underline">
              Roadmap: {related.code} {related.name}
            </a>
          )}
          {challenge.archived_at && <span className="text-xs font-semibold text-pm-warning">Archived</span>}
        </span>
      }
      actions={
        canEdit && (
          <div className="flex flex-wrap justify-end gap-2">
            {!challenge.archived_at && (
              <Button size="sm" variant="primary" onClick={() => composer.current?.captureAdvice()}>
                <MessageSquarePlus className="h-4 w-4" /> Capture advice
              </Button>
            )}
            <Button size="sm" onClick={() => update.mutate({ id: challenge.id, patch: { archived_at: challenge.archived_at ? null : new Date().toISOString() } })}>
              {challenge.archived_at ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {challenge.archived_at ? "Restore" : "Archive"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-pm-warning hover:bg-pm-warning/10">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        )
      }
      footer={canEdit && !challenge.archived_at ? <NoteComposer ref={composer} key={challenge.id} challengeId={challenge.id} /> : undefined}
    >
      <div className="space-y-6">
        <ChallengeForm key={`${challenge.id}-${challenge.updated_at}`} challenge={challenge} categories={categories} roadmapCodes={roadmapCodes} readOnly={!canEdit} />
        <section aria-labelledby="notes-heading">
          <h3 id="notes-heading" className="mb-2 text-sm font-semibold">
            Notes <span className="font-normal text-pm-muted">({challengeNotes.length})</span>
          </h3>
          <NotesTimeline notes={challengeNotes} canEdit={canEdit} />
        </section>
      </div>
    </Sheet>
  );
}
