import { describe, expect, it } from "vitest";
import { challengeSchema, noteSchema, roadmapItemSchema } from "./schemas";
import { toCsv } from "./csv";

describe("noteSchema", () => {
  it("accepts an Action note without an owner", () => {
    const r = noteSchema.safeParse({ note_type: "action", body: "Draft the plan" });
    expect(r.success).toBe(true);
  });

  it("accepts an Action note with owner and due date", () => {
    const r = noteSchema.safeParse({ note_type: "action", body: "Draft the plan", action_owner: "Biju", due_date: "2026-10-15" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.action_owner).toBe("Biju");
  });

  it("rejects an owner on a non-Action note", () => {
    const r = noteSchema.safeParse({ note_type: "advice", body: "Hire first", action_owner: "Biju" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["action_owner"]);
  });

  it("rejects a due date or done flag on a non-Action note", () => {
    expect(noteSchema.safeParse({ note_type: "comment", body: "Hi there", due_date: "2026-10-15" }).success).toBe(false);
    expect(noteSchema.safeParse({ note_type: "decision", body: "Agreed", action_done: true }).success).toBe(false);
  });

  it("treats a blank owner as none", () => {
    const r = noteSchema.safeParse({ note_type: "advice", body: "Hire first", action_owner: "  " });
    expect(r.success).toBe(true);
  });

  it("enforces the body length", () => {
    expect(noteSchema.safeParse({ note_type: "comment", body: "x" }).success).toBe(false);
    expect(noteSchema.safeParse({ note_type: "comment", body: "x".repeat(4001) }).success).toBe(false);
  });
});

describe("challengeSchema", () => {
  const base = { title: "No test environment", category: "product_platform", status: "open", priority: "medium" };
  it("accepts a minimal challenge", () => {
    expect(challengeSchema.safeParse(base).success).toBe(true);
  });
  it("rejects short and long titles", () => {
    expect(challengeSchema.safeParse({ ...base, title: "ab" }).success).toBe(false);
    expect(challengeSchema.safeParse({ ...base, title: "x".repeat(141) }).success).toBe(false);
  });
});

describe("roadmapItemSchema", () => {
  const base = {
    code: "r9",
    name: "Something useful",
    workstream: "revenue_cycle",
    description: null,
    outcome: null,
    horizon: "later" as const,
    revenue_impact: 4,
    operational_efficiency: 4,
    unlocks: 4,
    ease: 4,
    score_adjustment: 0,
    adjustment_reason: null,
    start_date: null,
    end_date: null,
    depends_on_codes: [],
    is_mvp: false,
    owner: null,
  };

  it("accepts a valid item", () => {
    expect(roadmapItemSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an adjustment without a reason", () => {
    const r = roadmapItemSchema.safeParse({ ...base, score_adjustment: 5, adjustment_reason: "no" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["adjustment_reason"]);
  });

  it("accepts an adjustment with a reason", () => {
    expect(roadmapItemSchema.safeParse({ ...base, score_adjustment: -10, adjustment_reason: "Contract signed" }).success).toBe(true);
  });

  it("rejects To before From and out-of-range values", () => {
    expect(roadmapItemSchema.safeParse({ ...base, start_date: "2026-05-01", end_date: "2026-04-30" }).success).toBe(false);
    expect(roadmapItemSchema.safeParse({ ...base, ease: 6 }).success).toBe(false);
    expect(roadmapItemSchema.safeParse({ ...base, score_adjustment: 21, adjustment_reason: "Because reasons" }).success).toBe(false);
  });
});

describe("toCsv", () => {
  it("quotes fields that need it", () => {
    expect(toCsv(["a", "b"], [["x, y", 'say "hi"'], [null, 3]])).toBe('a,b\r\n"x, y","say ""hi"""\r\n,3\r\n');
  });
});
