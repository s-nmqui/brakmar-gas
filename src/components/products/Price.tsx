import { formatCents } from "@/lib/money";
import { cn } from "@/lib/cn";

export function Price({
  priceCents,
  promoPriceCents,
  className,
  size = "md",
}: {
  priceCents: number | null;
  promoPriceCents?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const effective = promoPriceCents ?? priceCents;
  const sizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };
  if (effective === null || effective === undefined) {
    return (
      <span className={cn("font-semibold text-neutral-500", sizes[size], className)}>
        Consultar precio
      </span>
    );
  }
  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-bold text-neutral-900", sizes[size])}>
        {formatCents(effective)}
      </span>
      {promoPriceCents !== null &&
        promoPriceCents !== undefined &&
        priceCents !== null &&
        promoPriceCents < priceCents && (
          <span className="text-sm font-medium text-neutral-400 line-through">
            {formatCents(priceCents)}
          </span>
        )}
    </span>
  );
}
