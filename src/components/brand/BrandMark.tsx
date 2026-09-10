import { cn } from "@/lib/utils";

interface BrandMarkProps {
  /** "compact" renders "W_", "full" renders "Webberick_" */
  variant?: "compact" | "full";
  /** Whether the trailing cursor underscore blinks */
  cursorBlink?: boolean;
  /** Extra classes (size, color, etc.) */
  className?: string;
}

/**
 * Reusable typographic brand mark. Pure text/CSS — no image assets.
 * The trailing underscore is a dedicated <span> so it can blink independently.
 */
export function BrandMark({
  variant = "compact",
  cursorBlink = false,
  className,
}: BrandMarkProps) {
  const text = variant === "full" ? "Webberick" : "W";

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-bold tracking-tight text-[hsl(var(--brand-logo))]",
        className,
      )}
    >
      <span aria-hidden="true">{text}</span>
      <span
        aria-hidden="true"
        className={cn(
          "brand-cursor",
          cursorBlink && "brand-cursor-blink",
        )}
      >
        _
      </span>
    </span>
  );
}
