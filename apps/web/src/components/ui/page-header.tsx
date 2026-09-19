import type { ReactNode } from "react";

/**
 * Page template header (docs/design/app-shell.md §4): eyebrow, title, description, one primary
 * action. `titleTag` lets a page that already owns the document's <h1> (the landing showcase)
 * embed the header as a picture; every app page keeps the default.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  titleTag: Title = "h1",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  titleTag?: "h1" | "p";
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <span className="text-label uppercase text-text-secondary">{eyebrow}</span>
        ) : null}
        <Title className="text-h1">{title}</Title>
        {description ? <p className="text-body text-text-secondary">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
