import type { ProviderRecord } from "@/data/provider-record";
import type { ProviderForm, ValidationResult } from "@/lib/provider-form";

export interface SectionProps {
  form: ProviderForm;
  set: <K extends keyof ProviderForm>(key: K, value: ProviderForm[K]) => void;
  update: (fn: (f: ProviderForm) => ProviderForm) => void;
  v: ValidationResult;
  mode: "add" | "edit";
  original?: ProviderRecord;
  /** error text for a field key, or undefined while it's still just "not filled in yet" */
  err: (key: string) => string | undefined;
  touch: (key: string) => void;
}
