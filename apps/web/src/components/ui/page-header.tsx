import type { ReactNode } from "react";

/** Page template header (docs/design/app-shell.md §4): eyebrow, title, description, one primary action. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <span className="text-label uppercase text-text-secondary">{eyebrow}</span>
        ) : null}
        <h1 className="text-h1">{title}</h1>
        {description ? <p className="text-body text-text-secondary">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
