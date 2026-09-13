import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/domain/labels";

const TONE: Record<Tone, string> = {
  danger: "border-danger-border bg-danger-tint text-danger-text",
  warning: "border-warning-border bg-warning-tint text-warning-text",
  info: "border-info-border bg-info-tint text-info-text",
  success: "border-success-border bg-success-tint text-success-text",
  neutral: "border-border bg-surface-base text-text-secondary",
};

/** Status/severity badge: label + icon + tint (tokens.md §2; never color-only). */
export function Badge({ label, tone, icon: Icon }: { label: string; tone: Tone; icon?: LucideIcon }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-pill border px-2 text-caption font-medium whitespace-nowrap ${TONE[tone]}`}
    >
      {Icon ? <Icon aria-hidden size={14} strokeWidth={1.5} /> : null}
      {label}
    </span>
  );
}
