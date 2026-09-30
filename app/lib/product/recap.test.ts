import { describe, expect, it } from "vitest";
import { buildRecap } from "./recap";

const categories = [
  { code: "people_team", name: "People and team", sort_order: 4 },
  { code: "product_platform", name: "Product and platform", sort_order: 1 },
];

const challenges = [
  {
    id: "c1",
    title: "One person owns all of product",
    category: "product_platform",
    ask: "What should be hired first?",
    status: "action_agreed" as const,
    priority: "high" as const,
    owner: "Madan",
    sort_order: 1,
    archived_at: null,
  },
  {
    id: "c2",
    title: "No test environment",
    category: "product_platform",
    ask: null,
    status: "open" as const,
    priority: "medium" as const,
    owner: null,
    sort_order: 2,
    archived_at: null,
  },
  {
    id: "c3",
    title: "Archived one",
    category: "people_team",
    ask: null,
    status: "parked" as const,
    priority: "low" as const,
    owner: null,
    sort_order: 1,
    archived_at: "2026-09-01T00:00:00Z",
  },
];

const note = (over: Partial<Parameters<typeof buildRecap>[2][number]>) => ({
  challenge_id: "c1",
  note_type: "comment" as const,
  body: "",
  source: null,
  action_owner: null,
  due_date: null,
  action_done: false,
  created_at: "2026-09-30T10:00:00Z",
  ...over,
});

const notes = [
  note({ note_type: "advice", body: "Hire a product ops lead first.", source: "Alex Adviser", created_at: "2026-09-30T10:00:00Z" }),
  note({ note_type: "decision", body: "Delegate Jira grooming.", created_at: "2026-09-30T10:05:00Z" }),
  note({ note_type: "action", body: "Draft the job description", action_owner: "Biju", due_date: "2026-10-15", created_at: "2026-09-30T10:10:00Z" }),
  note({ note_type: "action", body: "Share PostHog access", action_done: true, created_at: "2026-09-30T10:12:00Z" }),
  note({ note_type: "comment", body: "Comments are not in the recap.", created_at: "2026-09-30T10:15:00Z" }),
  note({ challenge_id: "c3", note_type: "advice", body: "Archived advice", source: "X" }),
];

describe("buildRecap", () => {
  it("produces the expected markdown", () => {
    const md = buildRecap(categories, challenges, notes, new Date("2026-09-30T12:00:00Z"));
    expect(md).toBe(
      [
        "# Workshop challenges — recap",
        "",
        "_Generated 30 Sep 2026_",
        "",
        "## Product and platform",
        "",
        "### One person owns all of product",
        "",
        "**Status:** Action agreed · **Priority:** High · **Owner:** Madan",
        "",
        "**Ask:** What should be hired first?",
        "",
        "**Advice**",
        "",
        "- **Alex Adviser:** Hire a product ops lead first.",
        "",
        "**Decisions**",
        "",
        "- Delegate Jira grooming.",
        "",
        "**Actions**",
        "",
        "- [ ] Draft the job description — _owner: Biju, due: 15 Oct 2026, open_",
        "- [x] Share PostHog access — _owner: unassigned, due: no date, done_",
        "",
        "### No test environment",
        "",
        "**Status:** Open · **Priority:** Medium",
        "",
      ].join("\n"),
    );
  });

  it("keeps multi-line notes inside their list item", () => {
    const md = buildRecap(categories, challenges, [
      note({ note_type: "advice", body: "Line one\nLine two", source: "Alex Adviser" }),
    ]);
    expect(md).toContain("- **Alex Adviser:** Line one\n  Line two");
  });
});
