import { CircleAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Dashboard card anatomy (visual-v2 §4.4): section labelled by its h2 (styled h3), optional
 * eyebrow (the English module name a module card points to), caption, right link, content 16px
 * below the header and an optional footer pinned to the bottom. Radius 12, 1px border, no shadow.
 */
export function DashCard({
  id,
  title,
  eyebrow,
  caption,
  link,
  footer,
  className = "",
  children,
}: {
  id: string;
  title: ReactNode;
  eyebrow?: string;
  caption?: ReactNode;
  link?: { href: string; label: string };
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`flex min-w-0 flex-col rounded-lg border border-border bg-surface-elevated p-4 sm:p-6 ${className}`}>
      {eyebrow ? <p className="mb-1 text-label uppercase text-text-secondary">{eyebrow}</p> : null}
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-h3 text-text-primary">
          {title}
        </h2>
        {link ? <CardLink href={link.href}>{link.label}</CardLink> : null}
      </div>
      {caption ? <p className="mt-0.5 text-caption text-text-secondary">{caption}</p> : null}
      <div className="mt-4 flex min-w-0 flex-1 flex-col">{children}</div>
      {footer ? <div className="mt-4 border-t border-border pt-3 text-caption text-text-secondary">{footer}</div> : null}
    </section>
  );
}

export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="shrink-0 text-body-sm font-medium text-primary-text hover:text-primary-text-hover hover:underline">
      {children}
    </Link>
  );
}

/** Per-card error (visual-v2 §4.5): frame and title stay, the rest of the page keeps working. */
export function CardError({ what }: { what: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-text-secondary">
      <CircleAlert aria-hidden size={16} strokeWidth={1.5} className="text-text-muted" />
      Não foi possível carregar {what}.
      <Link href="/" prefetch={false} className="font-medium text-primary-text underline decoration-1 underline-offset-2 hover:text-primary-text-hover">
        Tentar de novo
      </Link>
    </p>
  );
}

/** Icon tile (visual-v2 §5.4): cyan icon on the primary tint, always decorative. */
export function IconTile({ children, small = false }: { children: ReactNode; small?: boolean }) {
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary-text ${small ? "size-8" : "size-10"}`}>
      {children}
    </span>
  );
}
