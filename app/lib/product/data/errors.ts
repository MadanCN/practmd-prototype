import type { PostgrestError } from "@supabase/supabase-js";

// Friendlier text for the database constraints users can actually hit from the UI.
const CONSTRAINT_MESSAGES: Record<string, string> = {
  adjustment_needs_reason: "An adjustment needs a reason of at least 5 characters.",
  dates_in_order: "To must be on or after From.",
  roadmap_items_code_key: "That code is already used by another item.",
  action_fields: "Only Action notes can have an owner, due date or done flag.",
};

export class DataError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "DataError";
  }
}

export function toDataError(error: PostgrestError): DataError {
  const constraint = Object.keys(CONSTRAINT_MESSAGES).find((c) => error.message.includes(c));
  if (constraint) return new DataError(CONSTRAINT_MESSAGES[constraint], error.code);
  if (error.code === "23503") return new DataError("It's still in use, so it can't be deleted.", error.code);
  if (error.code === "42501") return new DataError("You don't have permission to change this.", error.code);
  return new DataError(error.message, error.code);
}

/** Unwraps a Supabase response, throwing a DataError on failure. */
export function must<T>(res: { data: T | null; error: PostgrestError | null }): T {
  if (res.error) throw toDataError(res.error);
  if (res.data === null) throw new DataError("No data returned.");
  return res.data;
}

/**
 * Like `must`, for deletes/updates that return the affected rows: RLS silently filters rows the
 * user may not change, so zero rows means "not allowed" (or already gone), not success.
 */
export function mustAffect<T>(res: { data: T[] | null; error: PostgrestError | null }): T[] {
  const rows = must(res);
  if (rows.length === 0) throw new DataError("Nothing was changed. It may already be gone, or you don't have permission.");
  return rows;
}
