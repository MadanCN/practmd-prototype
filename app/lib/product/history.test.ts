import { describe, expect, it } from "vitest";
import { describeChanges } from "./history";

describe("describeChanges", () => {
  it("lists only the fields that changed, readably", () => {
    const before = { name: "A", horizon: "later", ease: 3, depends_on_codes: ["s2"], is_mvp: false, updated_at: "x" };
    const after = { name: "A", horizon: "next", ease: null, depends_on_codes: ["s2", "c3"], is_mvp: true, updated_at: "y" };
    expect(describeChanges(before, after)).toEqual([
      { field: "horizon", label: "Horizon", from: "Later", to: "Next" },
      { field: "ease", label: "Ease", from: "3", to: "—" },
      { field: "depends_on_codes", label: "Depends on", from: "s2", to: "s2, c3" },
      { field: "is_mvp", label: "MVP", from: "No", to: "Yes" },
    ]);
  });

  it("treats an insert as every set field changing from empty", () => {
    const changes = describeChanges(null, { name: "New item", horizon: "now" });
    expect(changes.map((c) => c.field)).toEqual(["name", "horizon"]);
  });
});
