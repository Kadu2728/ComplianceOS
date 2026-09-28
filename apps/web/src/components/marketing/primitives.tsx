import type { CSSProperties, ReactNode } from "react";

/**
 * Landing primitives v2 (docs/design/landing-v2.md §3.3). Server components. The "ponto de
 * controle" is the brand's geometric unit (brand §22–§24): a muted ring with a cyan centre.
 * Decorative, so always `aria-hidden`.
 */
export function ControlDot({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <span aria-hidden style={style} className={`inline-flex size-3 shrink-0 items-center justify-center rounded-full border-[1.5px] border-text-muted ${className}`}>
      <span className="size-1 rounded-full bg-primary-text" />
    </span>
  );
}

/** Uppercase cyan label preceding a heading. Never a heading itself. `lang="en"` for English labels. */
export function Eyebrow({ children, lang, className = "" }: { children: ReactNode; lang?: "en"; className?: string }) {
  return (
    <p lang={lang} className={`text-label uppercase tracking-[0.08em] text-primary-text ${className}`}>
      {children}
    </p>
  );
}

/** Page container: the same 1136px content box as the app (landing-v2 §3.2). */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8 ${className}`}>{children}</div>;
}

/**
 * Landing section: id + aria-labelledby (`{id}-heading`), scroll margin for the sticky header,
 * padding 48 / 64 / 80 and a full-bleed hairline on top — one dark canvas, no alternating beats.
 */
export function Section({ id, className = "", children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-[72px] border-t border-border py-12 md:scroll-mt-20 md:py-16 xl:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

/** Eyebrow + H2 (+ lead, + CTA slot). `size` "s" = display-s (most sections), "m" = display-m. */
export function SectionIntro({
  id,
  eyebrow,
  eyebrowLang,
  title,
  lead,
  size = "s",
  children,
  className = "",
}: {
  id: string;
  eyebrow: string;
  eyebrowLang?: "en";
  title: string;
  lead?: string;
  size?: "s" | "m";
  /** Optional CTA row, 32px under the lead. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-start ${className}`}>
      <Eyebrow lang={eyebrowLang}>{eyebrow}</Eyebrow>
      <h2 id={`${id}-heading`} className={`mt-3 max-w-[22ch] text-pretty text-text-primary ${size === "m" ? "text-section" : "text-section-long"}`}>
        {title}
      </h2>
      {lead ? <p className="mt-4 max-w-[56ch] text-pretty text-body text-text-secondary">{lead}</p> : null}
      {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
    </div>
  );
}

/** App icon tile (visual-v2 §5.4): cyan icon on the primary tint; decorative. */
export function IconTile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={`flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary-text ${className}`}>
      {children}
    </span>
  );
}
