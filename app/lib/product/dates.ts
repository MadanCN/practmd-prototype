import { addMonths, differenceInCalendarMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";

// Roadmap dates are plain `date` columns: From is the first day of a month, To the last day.

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function parseDate(iso: string): Date {
  return parseISO(iso);
}

/** "2026-03" → first day of that month, as an ISO date. */
export function monthToFrom(month: string): string {
  return toISODate(startOfMonth(parseISO(`${month}-01`)));
}

/** "2026-03" → last day of that month, as an ISO date. */
export function monthToTo(month: string): string {
  return toISODate(endOfMonth(parseISO(`${month}-01`)));
}

/** ISO date → "2026-03", for <input type="month">. */
export function dateToMonth(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 7) : "";
}

export function formatMonth(iso: string | null | undefined): string {
  return iso ? format(parseISO(iso), "MMM yyyy") : "";
}

export function currentMonth(): Date {
  return startOfMonth(new Date());
}

/** Whole months from `rangeStart` to the month containing `iso`. */
export function monthIndex(rangeStart: Date, iso: string): number {
  return differenceInCalendarMonths(parseISO(iso), rangeStart);
}

/** Shift a From/To pair by whole months, keeping From on the 1st and To on the month end. */
export function shiftMonths(iso: string, months: number, edge: "from" | "to"): string {
  const moved = addMonths(startOfMonth(parseISO(iso)), months);
  return toISODate(edge === "from" ? moved : endOfMonth(moved));
}

export { addMonths, startOfMonth, endOfMonth, format, differenceInCalendarMonths };
