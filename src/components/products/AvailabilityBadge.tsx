import { AVAILABILITY_LABELS } from "@/lib/config";
import { Badge } from "../ui";
import type { Availability } from "@/lib/types";

const TONES: Record<Availability, "success" | "warning" | "danger" | "neutral"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger",
  unknown: "neutral",
};

export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: Availability;
  className?: string;
}) {
  return (
    <Badge tone={TONES[availability]} className={className}>
      {AVAILABILITY_LABELS[availability]}
    </Badge>
  );
}
