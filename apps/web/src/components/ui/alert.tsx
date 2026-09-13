import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "danger";

const TONE: Record<Tone, string> = {
  info: "border-info-border bg-info-tint text-info-text",
  success: "border-success-border bg-success-tint text-success-text",
  warning: "border-warning-border bg-warning-tint text-warning-text",
  danger: "border-danger-border bg-danger-tint text-danger-text",
};

/** Inline message using the text-safe semantic variants (tokens.md §2). Never color-only. */
export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-body-sm ${TONE[tone]}`}
    >
      {children}
    </div>
  );
}
