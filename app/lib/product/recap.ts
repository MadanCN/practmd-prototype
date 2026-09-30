// Builds the post-workshop Markdown recap of challenges, advice, decisions and actions.
import { format, parseISO } from "date-fns";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/product/constants";
import type { Challenge, ChallengeCategory, ChallengeNote } from "@/lib/product/data/challenges";

type RecapChallenge = Pick<Challenge, "id" | "title" | "category" | "ask" | "status" | "priority" | "owner" | "sort_order" | "archived_at">;
type RecapNote = Pick<
  ChallengeNote,
  "challenge_id" | "note_type" | "body" | "source" | "action_owner" | "due_date" | "action_done" | "created_at"
>;

/** Continuation lines of a multi-line note stay inside its list item. */
function listItem(prefix: string, body: string): string {
  const [first, ...rest] = body.trim().split(/\r?\n/);
  return [`${prefix}${first}`, ...rest.map((l) => (l.trim() ? `  ${l}` : ""))].join("\n");
}

export function buildRecap(
  categories: Pick<ChallengeCategory, "code" | "name" | "sort_order">[],
  challenges: RecapChallenge[],
  notes: RecapNote[],
  generatedAt: Date = new Date(),
): string {
  const out: string[] = ["# Workshop challenges — recap", "", `_Generated ${format(generatedAt, "d MMM yyyy")}_`];
  const active = challenges.filter((c) => !c.archived_at);
  const notesFor = (id: string) =>
    notes.filter((n) => n.challenge_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));

  for (const cat of [...categories].sort((a, b) => a.sort_order - b.sort_order)) {
    const list = active.filter((c) => c.category === cat.code).sort((a, b) => a.sort_order - b.sort_order);
    if (!list.length) continue;
    out.push("", `## ${cat.name}`);

    for (const c of list) {
      const meta = [`**Status:** ${STATUS_LABEL[c.status]}`, `**Priority:** ${PRIORITY_LABEL[c.priority]}`];
      if (c.owner) meta.push(`**Owner:** ${c.owner}`);
      out.push("", `### ${c.title}`, "", meta.join(" · "));
      if (c.ask) out.push("", `**Ask:** ${c.ask}`);

      const cn = notesFor(c.id);
      const advice = cn.filter((n) => n.note_type === "advice");
      const decisions = cn.filter((n) => n.note_type === "decision");
      const actions = cn.filter((n) => n.note_type === "action");

      if (advice.length) {
        out.push("", "**Advice**", "");
        advice.forEach((n) => out.push(listItem(`- **${n.source ?? "Unattributed"}:** `, n.body)));
      }
      if (decisions.length) {
        out.push("", "**Decisions**", "");
        decisions.forEach((n) => out.push(listItem("- ", n.body)));
      }
      if (actions.length) {
        out.push("", "**Actions**", "");
        actions.forEach((n) => {
          const details = [
            `owner: ${n.action_owner ?? "unassigned"}`,
            `due: ${n.due_date ? format(parseISO(n.due_date), "d MMM yyyy") : "no date"}`,
            n.action_done ? "done" : "open",
          ].join(", ");
          out.push(listItem(`- [${n.action_done ? "x" : " "}] `, `${n.body.trim()} — _${details}_`));
        });
      }
    }
  }
  return out.join("\n") + "\n";
}
