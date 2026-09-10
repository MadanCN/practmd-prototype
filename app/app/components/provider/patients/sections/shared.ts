import { PROVIDERS } from "@/data/providers";

export const CLINIC_NAMES: Record<string, string> = {
  "penfield-psychiatry": "Penfield Psychiatry",
  "new-hartford": "New Hartford Psychological Services",
  "shore-counseling": "Shore Counseling",
};

export function clinicName(id: string): string {
  return CLINIC_NAMES[id] ?? id;
}

export function providerName(id: string): string {
  return PROVIDERS.find((p) => p.id === id)?.displayName ?? "Unassigned";
}

export function fmt12(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function fmtLongDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export function fmtShortDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** No room/equipment data in the prototype — derive something stable per appt. */
export function apptResources(appt: { id: string; mode: string; clinicId: string }): { room: string; equipment: string } {
  if (appt.mode === "telehealth") return { room: "Telehealth — secure video", equipment: "Patient device + camera" };
  if (appt.mode === "phone") return { room: "Phone visit", equipment: "—" };
  const n = (appt.id.match(/\d+/)?.[0] ?? "0").split("").reduce((s, d) => s + Number(d), 0);
  return { room: `${clinicName(appt.clinicId)} · Room ${2 + (n % 6)}`, equipment: "Standard exam room" };
}
