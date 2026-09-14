// Shared date/time formatting for the appointment-booking flow. The rest of
// the app formats dates ad hoc per-component ("Sep 14, 2026", "Mon, Sep 14",
// etc. — at least 8 distinct inline patterns exist); this file is scoped to
// the new booking UI, which needs one consistent MM-DD-YYYY convention.

/** "2026-09-14" -> "09-14-2026" */
export function fmtDateMDY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}-${d}-${y}`;
}

/** "2026-09-14" -> "Mon, 09-14-2026" */
export function fmtDateMDYWithDay(iso: string): string {
  const weekday = new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday}, ${fmtDateMDY(iso)}`;
}

/** "14:30" -> "2:30 PM" */
export function fmt12(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

/** 90 -> "1h 30m"; 30 -> "30 min" */
export function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}
