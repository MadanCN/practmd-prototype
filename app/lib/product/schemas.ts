// zod schemas mirroring the database checks in supabase/migrations/0001_roadmap.sql and 0002_challenges.sql.
import { z } from "zod";

/** Optional free text: trims, and stores empty as null. */
const optionalText = (max = 4000) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : null));

const rating = z.number().int().min(1).max(5).nullable();
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .nullable();

// ---------- roadmap ----------

export const HORIZON_VALUES = ["done", "now", "next", "later", "not_now"] as const;

export const roadmapItemSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Code is required")
      .max(20)
      .regex(/^[a-z0-9_-]+$/i, "Letters, numbers, - and _ only"),
    name: z.string().trim().min(3, "At least 3 characters").max(120, "At most 120 characters"),
    workstream: z.string().min(1, "Pick a workstream"),
    description: optionalText(),
    outcome: optionalText(),
    horizon: z.enum(HORIZON_VALUES),
    revenue_impact: rating,
    operational_efficiency: rating,
    unlocks: rating,
    ease: rating,
    score_adjustment: z.number().int().min(-20, "Between −20 and +20").max(20, "Between −20 and +20"),
    adjustment_reason: optionalText(500),
    start_date: isoDate,
    end_date: isoDate,
    depends_on_codes: z.array(z.string()),
    is_mvp: z.boolean(),
    owner: optionalText(120),
  })
  .superRefine((v, ctx) => {
    if (v.score_adjustment !== 0 && (v.adjustment_reason ?? "").length < 5) {
      ctx.addIssue({ code: "custom", path: ["adjustment_reason"], message: "An adjustment needs a reason of at least 5 characters" });
    }
    if (v.start_date && v.end_date && v.end_date < v.start_date) {
      ctx.addIssue({ code: "custom", path: ["end_date"], message: "To must be on or after From" });
    }
    if (v.depends_on_codes.includes(v.code)) {
      ctx.addIssue({ code: "custom", path: ["depends_on_codes"], message: "An item can't depend on itself" });
    }
  });

export type RoadmapItemInput = z.input<typeof roadmapItemSchema>;
export type RoadmapItemValues = z.output<typeof roadmapItemSchema>;

export const workstreamSchema = z.object({
  code: z.string().trim().min(1).max(40).regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and _ only"),
  name: z.string().trim().min(2).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex colour like #02979D"),
  description: optionalText(300),
  sort_order: z.number().int(),
});
export type WorkstreamValues = z.output<typeof workstreamSchema>;

// ---------- challenges ----------

export const STATUS_VALUES = ["open", "discussing", "action_agreed", "resolved", "parked"] as const;
export const PRIORITY_VALUES = ["high", "medium", "low"] as const;
export const NOTE_TYPE_VALUES = ["advice", "decision", "action", "question", "comment"] as const;

export const challengeSchema = z.object({
  title: z.string().trim().min(3, "At least 3 characters").max(140, "At most 140 characters"),
  description: optionalText(),
  category: z.string().min(1, "Pick a category"),
  ask: optionalText(1000),
  status: z.enum(STATUS_VALUES),
  priority: z.enum(PRIORITY_VALUES),
  owner: optionalText(120),
  raised_by: optionalText(120),
  related_item_code: optionalText(40),
});
export type ChallengeInput = z.input<typeof challengeSchema>;
export type ChallengeValues = z.output<typeof challengeSchema>;

export const noteSchema = z
  .object({
    note_type: z.enum(NOTE_TYPE_VALUES),
    body: z.string().trim().min(2, "At least 2 characters").max(4000, "At most 4000 characters"),
    source: optionalText(120),
    action_owner: optionalText(120),
    due_date: isoDate.optional().transform((v) => v ?? null),
    action_done: z.boolean().optional().transform((v) => v ?? false),
  })
  .superRefine((v, ctx) => {
    // Mirrors constraint action_fields: only Action notes carry owner, due date or done.
    if (v.note_type !== "action") {
      if (v.action_owner) ctx.addIssue({ code: "custom", path: ["action_owner"], message: "Only Action notes have an owner" });
      if (v.due_date) ctx.addIssue({ code: "custom", path: ["due_date"], message: "Only Action notes have a due date" });
      if (v.action_done) ctx.addIssue({ code: "custom", path: ["action_done"], message: "Only Action notes can be done" });
    }
  });
export type NoteInput = z.input<typeof noteSchema>;
export type NoteValues = z.output<typeof noteSchema>;

export const categorySchema = z.object({
  code: z.string().trim().min(1).max(40).regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and _ only"),
  name: z.string().trim().min(2).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex colour like #02979D"),
  sort_order: z.number().int(),
});
