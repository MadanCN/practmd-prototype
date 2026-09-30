import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

/**
 * Minimal react-hook-form resolver for a zod schema (saves adding @hookform/resolvers).
 * Returns the parsed output on success, or errors keyed by the dotted field path.
 */
export function zodResolver<TSchema extends z.ZodType<FieldValues, FieldValues>>(
  schema: TSchema,
): Resolver<z.input<TSchema>, unknown, z.output<TSchema>> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "root";
      errors[path] ??= { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<z.input<TSchema>> };
  };
}
