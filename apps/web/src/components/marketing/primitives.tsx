import type { CSSProperties, ReactNode } from "react";

/**
 * Landing primitives (03-ux-spec §2.3–§2.4). Server components. The "ponto de controle" is the
 * brand's geometric unit (brand §22–§24): a ring in `currentColor` with an optional Electric Blue
 * centre — the only blue allowed in a section header. Decorative, so always `aria-hidden`.
 */
export function ControlDot({
  size = 12,
  filled = false,
  className = "",
  fillClassName = "",
  style,
  fillStyle,
}: {
  size?: 12 | 16;
  filled?: boolean;
  className?: string;
  fillClassName?: string;
  style?: CSSProperties;
  fillStyle?: CSSProperties;
}) {
  const ring = size === 16 ? "size-4" : "size-3";
  const centre = size === 16 ? "size-1.5" : "size-1";
  return (
    <span aria-hidden style={style} className={`inline-flex ${ring} shrink-0 items-center justify-center rounded-full border-[1.5px] border-current ${className}`}>
      <span style={fillStyle} className={`${centre} rounded-full ${filled ? "bg-electric-blue" : "bg-transparent"} ${fillClassName}`} />
    </span>
  );
}

/** Uppercase label preceding a heading. Never a heading itself. `lang="en"` for the English section labels. */
export function Eyebrow({
  children,
  as: Tag = "p",
  lang,
  dot = true,
  className = "",
  style,
}: {
  children: ReactNode;
  as?: "p" | "span";
  lang?: "en";
  dot?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Tag lang={lang} style={style} className={`inline-flex items-center gap-2 text-label uppercase tracking-[0.06em] text-text-secondary ${className}`}>
      {dot ? <ControlDot filled /> : null}
      {children}
    </Tag>
  );
}

/** Page container: same 1200px as the app content so real components keep their density. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8 ${className}`}>{children}</div>;
}

/**
 * Landing section: id + aria-labelledby (`{id}-heading`), scroll margin for the sticky header,
 * vertical rhythm 64 / 96 / 128 (03-ux-spec §1.3) and the light/dark beat (§1.4).
 */
export function Section({
  id,
  tone = "light",
  className = "",
  children,
}: {
  id: string;
  tone?: "light" | "dark";
  className?: string;
  children: ReactNode;
}) {
  const beat = tone === "dark" ? "theme-dark bg-surface-base text-text-primary" : "bg-surface-base text-text-primary";
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={`scroll-mt-[72px] py-16 md:scroll-mt-20 md:py-24 lg:py-32 ${beat} ${className}`}>
      {children}
    </section>
  );
}

/** Eyebrow + H2 (+ lead). `size` picks Display M (default) or Display S for the long room title. */
export function SectionHeading({
  id,
  eyebrow,
  eyebrowLang,
  title,
  lead,
  size = "m",
  align = "start",
  className = "",
}: {
  id: string;
  eyebrow: string;
  /** "en" for the English section labels (THE PROBLEM…); omit for language-neutral ones (FAQ). */
  eyebrowLang?: "en";
  title: string;
  lead?: string;
  size?: "m" | "s";
  align?: "start" | "center";
  className?: string;
}) {
  const centred = align === "center";
  return (
    <div className={`flex flex-col ${centred ? "items-center text-center" : "items-start"} ${className}`}>
      <Eyebrow lang={eyebrowLang}>{eyebrow}</Eyebrow>
      <h2 id={`${id}-heading`} className={`mt-4 max-w-[20ch] text-pretty text-text-primary ${size === "s" ? "text-section-long" : "text-section"}`}>
        {title}
      </h2>
      {lead ? <p className="mt-4 max-w-[60ch] text-pretty text-body-lg text-text-secondary md:mt-5 lg:mt-6">{lead}</p> : null}
    </div>
  );
}
