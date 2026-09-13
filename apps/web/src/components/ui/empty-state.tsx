import type { ReactNode } from "react";

/** Guiding empty state (brand §45, app-shell.md §5): title, one sentence, actions. No illustration. */
export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="mx-auto flex max-w-[480px] flex-col items-center gap-4 rounded-lg border border-border bg-surface-elevated px-6 py-16 text-center"
    >
      <h2 className="text-h3">{title}</h2>
      <p className="text-body text-text-secondary">{description}</p>
      {actions ? <div className="flex flex-wrap justify-center gap-3 pt-2">{actions}</div> : null}
    </section>
  );
}
