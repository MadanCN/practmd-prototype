"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { CalendarClock, Pencil, Pin, PinOff, Trash2, User } from "lucide-react";
import { DEFAULT_ADVISER, NOTE_TYPES, NOTE_TYPE_LABEL, type NoteType } from "@/lib/product/constants";
import { noteSchema } from "@/lib/product/schemas";
import type { ChallengeNote } from "@/lib/product/data/challenges";
import { useFlashing } from "@/lib/product/flash";
import Markdown from "@/components/product/ui/Markdown";
import { Button, Chip, Field, inputClass } from "@/components/product/ui/primitives";
import { useSession } from "@/components/product/SessionContext";
import { useChallengeMutations } from "./useChallenges";
import { cn } from "@/lib/utils";

const SOURCE_KEY = "practmd.adviceSource";

function rememberedSource(): string {
  try {
    return window.localStorage.getItem(SOURCE_KEY) || DEFAULT_ADVISER;
  } catch {
    return DEFAULT_ADVISER;
  }
}
function rememberSource(source: string) {
  try {
    window.localStorage.setItem(SOURCE_KEY, source);
  } catch {
    // Storage can be unavailable (private mode); the default still works.
  }
}

export function NoteTypeChip({ type }: { type: NoteType }) {
  return <Chip className={NOTE_TYPES.find((n) => n.value === type)?.chip}>{NOTE_TYPE_LABEL[type]}</Chip>;
}

function wasEdited(n: ChallengeNote) {
  return new Date(n.updated_at).getTime() - new Date(n.created_at).getTime() > 2000;
}

function NoteItem({ note, canEdit }: { note: ChallengeNote; canEdit: boolean }) {
  const { user, nameFor } = useSession();
  const { editNote, removeNote } = useChallengeMutations();
  const flashing = useFlashing(note.id);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mine = canEdit && (note.created_by ?? "").toLowerCase() === user.email;

  function saveEdit() {
    const parsed = noteSchema.safeParse({ ...note, body });
    if (!parsed.success) return;
    editNote.mutate({ id: note.id, patch: { body: parsed.data.body } }, { onSuccess: () => setEditing(false) });
  }

  return (
    <li className={cn("rounded-xl border border-pm-border bg-pm-card p-3 transition-colors duration-700", flashing && "bg-pm-aqua/25", note.pinned && "border-pm-accent")}>
      <div className="flex flex-wrap items-center gap-2">
        <NoteTypeChip type={note.note_type} />
        {note.source && <span className={cn("text-sm", note.note_type === "advice" ? "font-semibold" : "text-pm-muted")}>{note.source}</span>}
        {note.pinned && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-pm-accent">
            <Pin className="h-3 w-3" /> Pinned
          </span>
        )}
        {mine && !editing && (
          <span className="ml-auto flex items-center gap-0.5">
            <button type="button" onClick={() => editNote.mutate({ id: note.id, patch: { pinned: !note.pinned } })} aria-label={note.pinned ? "Unpin from card" : "Pin to card"} title={note.pinned ? "Unpin from card" : "Pin to card"} className="rounded p-1 text-pm-muted hover:bg-pm-subtle hover:text-pm-text">
              {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={() => setEditing(true)} aria-label="Edit note" title="Edit" className="rounded p-1 text-pm-muted hover:bg-pm-subtle hover:text-pm-text">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1 text-xs">
                <button type="button" onClick={() => removeNote.mutate(note.id)} className="font-semibold text-pm-warning hover:underline">
                  Delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="text-pm-muted hover:underline">
                  Keep
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete note" title="Delete" className="rounded p-1 text-pm-muted hover:bg-pm-subtle hover:text-pm-warning">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        )}
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea aria-label="Edit note" rows={4} className={inputClass} value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => (setEditing(false), setBody(note.body))}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={saveEdit} disabled={body.trim().length < 2}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <Markdown text={note.body} className="mt-2 space-y-1.5 text-sm leading-relaxed" />
      )}

      {note.note_type === "action" && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg bg-pm-subtle px-2.5 py-1.5 text-xs">
          <label className={cn("flex items-center gap-1.5 font-medium", !mine && "cursor-not-allowed")} title={mine ? undefined : "Only the note's author can change this"}>
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#02979D]"
              checked={note.action_done}
              disabled={!mine}
              onChange={() => editNote.mutate({ id: note.id, patch: { action_done: !note.action_done } })}
            />
            {note.action_done ? "Done" : "Open"}
          </label>
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-pm-muted" /> {note.action_owner ?? "Unassigned"}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5 text-pm-muted" /> {note.due_date ? format(parseISO(note.due_date), "d MMM yyyy") : "No due date"}
          </span>
        </div>
      )}

      <p className="mt-2 text-xs text-pm-muted">
        {nameFor(note.created_by)} ·{" "}
        <time dateTime={note.created_at} title={new Date(note.created_at).toLocaleString()}>
          {formatDistanceToNow(parseISO(note.created_at), { addSuffix: true })}
        </time>
        {wasEdited(note) && " · edited"}
      </p>
    </li>
  );
}

export function NotesTimeline({ notes, canEdit }: { notes: ChallengeNote[]; canEdit: boolean }) {
  if (!notes.length) return <p className="rounded-xl border border-dashed border-pm-border p-4 text-center text-sm text-pm-muted">No notes yet. Capture advice, decisions and actions below.</p>;
  return (
    <ol className="space-y-2.5">
      {notes.map((n) => (
        <NoteItem key={n.id} note={n} canEdit={canEdit} />
      ))}
    </ol>
  );
}

export interface ComposerHandle {
  captureAdvice: () => void;
}

/** Note composer: type, markdown body, source, and owner/due date for Actions. Ctrl/Cmd+Enter saves. */
export const NoteComposer = forwardRef<ComposerHandle, { challengeId: string }>(function NoteComposer({ challengeId }, ref) {
  const { addNote } = useChallengeMutations();
  const [type, setType] = useState<NoteType>("advice");
  const [body, setBody] = useState("");
  const [source, setSource] = useState(() => (typeof window === "undefined" ? DEFAULT_ADVISER : rememberedSource()));
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    captureAdvice() {
      setType("advice");
      setSource(rememberedSource());
      setError(null);
      window.setTimeout(() => bodyRef.current?.focus(), 0);
    },
  }));

  function changeType(t: NoteType) {
    setType(t);
    if (t === "advice" && !source) setSource(rememberedSource());
    if (t !== "advice" && source === rememberedSource()) setSource("");
  }

  function submit() {
    const parsed = noteSchema.safeParse({
      note_type: type,
      body,
      source,
      action_owner: type === "action" ? owner : null,
      due_date: type === "action" && due ? due : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(null);
    if (type === "advice" && parsed.data.source) rememberSource(parsed.data.source);
    addNote.mutate(
      { challenge_id: challengeId, ...parsed.data },
      {
        onSuccess: () => {
          setBody("");
          setOwner("");
          setDue("");
        },
      },
    );
  }

  return (
    <form
      aria-label="Add a note"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2"
    >
      <div className="flex flex-wrap items-end gap-2">
        <div role="radiogroup" aria-label="Note type" className="flex flex-wrap gap-1">
          {NOTE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={type === t.value}
              onClick={() => changeType(t.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                type === t.value ? cn(t.chip, "border-transparent ring-2 ring-pm-accent/40") : "border-pm-border text-pm-muted hover:text-pm-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          aria-label="Source (who said it)"
          placeholder="Source (who said it)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={cn(inputClass, "h-8 min-w-0 flex-1 py-1 text-xs")}
        />
      </div>
      <textarea
        ref={bodyRef}
        aria-label="Note"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={type === "advice" ? "What did they advise?" : type === "decision" ? "What did we agree?" : type === "action" ? "What needs doing?" : "Write a note"}
        className={inputClass}
      />
      {type === "action" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Action owner" htmlFor="note-owner">
            <input id="note-owner" value={owner} onChange={(e) => setOwner(e.target.value)} className={cn(inputClass, "h-8 py-1")} />
          </Field>
          <Field label="Action due date" htmlFor="note-due">
            <input id="note-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className={cn(inputClass, "h-8 py-1")} />
          </Field>
        </div>
      )}
      <div className="flex items-center gap-2">
        <p className="flex-1 text-[11px] text-pm-muted">
          {error ? <span className="text-pm-warning">{error}</span> : "**bold**, *italic*, “- ” lists · Ctrl/⌘ + Enter to save"}
        </p>
        <Button type="submit" size="sm" variant="primary" disabled={addNote.isPending}>
          {addNote.isPending ? "Saving…" : `Add ${NOTE_TYPE_LABEL[type].toLowerCase()}`}
        </Button>
      </div>
    </form>
  );
});
