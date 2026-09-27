import type { LucideIcon } from "lucide-react";
import { SEVERITY, type Tone } from "@/lib/domain/labels";

const TONE: Record<Tone, string> = {
  danger: "bg-danger-tint text-danger-text",
  warning: "bg-warning-tint text-warning-text",
  info: "bg-info-tint text-info-text",
  success: "bg-success-tint text-success-text",
  neutral: "bg-surface-hover text-text-secondary",
};

const PILL = "inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 text-caption font-medium whitespace-nowrap";

/** Status pill v2 (visual-v2 §5.6): tint + text-safe label + shape-distinct icon; never colour-only. */
export function Badge({ label, tone, icon: Icon }: { label: string; tone: Tone; icon?: LucideIcon }) {
  return (
    <span className={`${PILL} ${TONE[tone]}`}>
      {Icon ? <Icon aria-hidden size={14} strokeWidth={1.5} /> : null}
      {label}
    </span>
  );
}

/** Severity colour per level (visual-v2 §2.2 `sev-*`): dots, icons and the severity badge only. */
export const SEVERITY_COLOR: Record<string, { text: string; bg: string }> = {
  critico: { text: "text-sev-critical", bg: "bg-sev-critical" },
  alto: { text: "text-sev-high", bg: "bg-sev-high" },
  medio: { text: "text-sev-medium", bg: "bg-sev-medium" },
  baixo: { text: "text-sev-low", bg: "bg-sev-low" },
};

/**
 * Severity badge (visual-v2 §5.6): neutral pill, the level's icon in its severity colour and the
 * label in text-primary — severity is a ramp of its own, never the status tones.
 */
export function SeverityBadge({ severity, label }: { severity: string; label?: string }) {
  const sev = SEVERITY[severity];
  if (!sev) return null;
  const Icon = sev.icon;
  return (
    <span className={`${PILL} bg-surface-hover text-text-primary`}>
      <Icon aria-hidden size={14} strokeWidth={1.5} className={SEVERITY_COLOR[severity]?.text} />
      {label ?? sev.label}
    </span>
  );
}

/** Severity dot for summary lists (always next to a text label). */
export function SeverityDot({ severity, size = 10 }: { severity: string; size?: 8 | 10 }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-pill ${SEVERITY_COLOR[severity]?.bg ?? "bg-text-muted"} ${size === 8 ? "size-2" : "size-2.5"}`}
    />
  );
}
