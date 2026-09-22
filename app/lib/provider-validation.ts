// Pure field validators + input formatters for the provider record. No React,
// no browser APIs — safe to import from seed data (data/providers.ts) as well
// as from the form.

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

/* ── NPI: 10 digits, Luhn check digit computed over the 80840 prefix ─────── */

/** Check digit for a 9-digit NPI base (Luhn over "80840" + base). */
export function npiCheckDigit(base9: string): number {
  const s = "80840" + base9;
  let sum = 0;
  for (let i = s.length - 1, pos = 0; i >= 0; i--, pos++) {
    let d = Number(s[i]);
    if (pos % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/** Build a syntactically valid NPI from any 9-digit base (used for seed data). */
export function makeNpi(base9: string): string {
  return base9 + npiCheckDigit(base9);
}

export function isValidNpi(v: string): boolean {
  return /^\d{10}$/.test(v) && npiCheckDigit(v.slice(0, 9)) === Number(v[9]);
}

/** Returns an error message, or "" when valid. */
export function npiError(v: string): string {
  if (!v) return "Required";
  if (!/^\d+$/.test(v)) return "NPI is digits only";
  if (v.length !== 10) return "NPI must be exactly 10 digits";
  if (!isValidNpi(v)) return "Not a valid NPI — the check digit doesn't match";
  return "";
}

/* ── EIN: 9 digits, displayed XX-XXXXXXX ─────────────────────────────────── */

export function formatEin(v: string): string {
  const d = onlyDigits(v).slice(0, 9);
  return d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
}
export const isValidEin = (v: string) => onlyDigits(v).length === 9;

/* ── Phone / fax ─────────────────────────────────────────────────────────── */

/** Progressive `+1 (XXX) XXX-XXXX` formatter. */
export function formatPhone(v: string): string {
  let d = onlyDigits(v);
  if (d.startsWith("1") && d.length > 10) d = d.slice(1);
  d = d.slice(0, 10);
  if (!d) return "";
  const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6);
  let out = "+1 (" + a;
  if (d.length >= 3) out += ")";
  if (b) out += " " + b;
  if (c) out += "-" + c;
  return out;
}
export function isValidPhone(v: string): boolean {
  const d = onlyDigits(v);
  return d.length === 10 || (d.length === 11 && d.startsWith("1"));
}

/** Fax is stored as 10 bare digits and shown as (XXX) XXX-XXXX. */
export function formatFax(v: string): string {
  const d = onlyDigits(v).slice(0, 10);
  if (!d) return "";
  const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6);
  let out = "(" + a;
  if (d.length >= 3) out += ")";
  if (b) out += " " + b;
  if (c) out += "-" + c;
  return out;
}
export const isValidFax = (v: string) => onlyDigits(v).length === 10;

/* ── ZIP (US: 5 or 5+4; Canada: A1A 1A1) ────────────────────────────────── */

export function formatZip(v: string, country: string): string {
  if (country === "Canada") {
    const s = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    return s.length > 3 ? `${s.slice(0, 3)} ${s.slice(3)}` : s;
  }
  const d = onlyDigits(v).slice(0, 9);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
export function isValidZip(v: string, country: string): boolean {
  if (country === "Canada") return /^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(v);
  return /^\d{5}(-\d{4})?$/.test(v);
}

/* ── Email ───────────────────────────────────────────────────────────────── */

export const normalizeEmail = (v: string) => v.trim().toLowerCase();
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/* ── Credential expiry ───────────────────────────────────────────────────── */

export type ExpiryState = "none" | "valid" | "expiring" | "expired";
export const EXPIRING_WINDOW_DAYS = 60;

export function expiryState(iso: string, now = Date.now()): ExpiryState {
  if (!iso) return "none";
  const exp = new Date(iso + "T23:59:59").getTime();
  if (Number.isNaN(exp)) return "none";
  const days = (exp - now) / 86400000;
  if (days < 0) return "expired";
  if (days <= EXPIRING_WINDOW_DAYS) return "expiring";
  return "valid";
}

/* ── Dates ───────────────────────────────────────────────────────────────── */

/** Today as YYYY-MM-DD, UTC-based — same "today" as data/cc-appointments.ts. */
export const todayIso = () => new Date().toISOString().split("T")[0];

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}
