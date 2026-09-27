import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { Radar } from "@/lib/domain/queries";
import { radarHref } from "@/lib/domain/radar";

const TONE = {
  danger: { icon: CircleAlert, text: "text-danger-text", accent: "border-danger-fill" },
  warning: { icon: TriangleAlert, text: "text-warning-text", accent: "border-warning-fill" },
  info: { icon: Info, text: "text-info-text", accent: "border-info-fill" },
} as const;

/**
 * One Risk Radar line (visual-v2 §5.9): 2px left accent in the tone's fill, icon in its text-safe
 * variant, title + the reason it matters; the whole row links to where to act. Shared by the
 * dashboard's radar section (`inset`) and the header bell.
 */
export function RadarItem({ item, inset = false }: { item: Radar["items"][number]; inset?: boolean }) {
  const tone = TONE[item.tone as keyof typeof TONE] ?? TONE.info;
  const Icon = tone.icon;
  return (
    <Link
      href={radarHref(item.route)}
      className={`group flex items-start gap-2.5 rounded-md border-l-2 p-3 transition-colors duration-(--duration-fast) hover:bg-surface-hover ${tone.accent} ${
        inset ? "bg-surface-base" : ""
      }`}
    >
      <Icon aria-hidden size={16} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${tone.text}`} />
      <span className="min-w-0">
        <span className="block text-body-sm font-medium text-text-primary group-hover:underline">{item.title}</span>
        <span className="line-clamp-2 text-caption text-text-secondary">{item.reason}</span>
      </span>
    </Link>
  );
}
