import { cn } from "@/lib/utils";

type LogoVariant = "full" | "symbol";

/**
 * PractMD logo. The brand always sits on a white background, so these are the
 * full-colour assets — never knocked out. Use `PractMdLockup` when the
 * surrounding surface is not already white.
 *
 * - `full`   — the wordmark (`/practmd-wordmark.png`), ratio ~6.9:1.
 * - `symbol` — the interlocking-loop mark (`/practmd-symbol.png`), ratio ~1.84:1,
 *              for tight spots such as the collapsed sidebar.
 *
 * Sizing: pass a height via `className` (e.g. `h-7`); width tracks automatically.
 */
export function PractMdLogo({
  variant = "full",
  className,
}: {
  variant?: LogoVariant;
  className?: string;
}) {
  const src = variant === "symbol" ? "/practmd-symbol.png" : "/practmd-wordmark.png";
  const size = variant === "symbol" ? { width: 1687, height: 918 } : { width: 4136, height: 596 };
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="PractMD"
      width={size.width}
      height={size.height}
      className={cn("h-7 w-auto select-none", className)}
    />
  );
}

/** The logo on a white pill/card — for dark or coloured surfaces. */
export function PractMdLockup({
  variant = "full",
  className,
  boxClassName,
}: {
  variant?: LogoVariant;
  className?: string;
  boxClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-white",
        variant === "symbol" ? "p-1.5" : "px-2.5 py-1.5",
        boxClassName,
      )}
    >
      <PractMdLogo variant={variant} className={className} />
    </span>
  );
}

export default PractMdLogo;
