import type { CSSProperties, ReactNode } from "react";

/**
 * A real product component shown as a picture (03-ux-spec §2.17). `inert` + `aria-hidden` +
 * `pointer-events-none` neutralize every link, button and form inside without variants: nothing
 * receives focus, clicks or screen-reader output. The figcaption carries the alt text from the
 * copy and, when `caption` is given, is visible inside the frame (hero: "Exemplo com dados
 * ilustrativos…") — inside, so it stays on the light frame even where the frame bleeds over the
 * next dark section.
 */
export function ProductFigure({
  id,
  alt,
  caption,
  frame = true,
  className = "",
  stageClassName = "",
  style,
  children,
}: {
  id: string;
  alt: string;
  caption?: string;
  frame?: boolean;
  className?: string;
  stageClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const captionId = `${id}-caption`;
  return (
    <figure
      aria-labelledby={captionId}
      style={style}
      className={`min-w-0 ${frame ? "rounded-xl border border-border bg-surface-base p-4 md:p-6" : ""} ${className}`}
    >
      <div inert aria-hidden="true" className={`pointer-events-none select-none ${stageClassName}`}>
        {children}
      </div>
      <figcaption id={captionId} className={caption ? "mt-4 text-caption text-text-secondary" : "sr-only"}>
        {caption ? (
          <>
            <span className="sr-only">{alt} </span>
            {caption}
          </>
        ) : (
          alt
        )}
      </figcaption>
    </figure>
  );
}
