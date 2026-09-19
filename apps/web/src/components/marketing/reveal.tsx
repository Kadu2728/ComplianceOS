"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Scroll reveal (03-ux-spec §2.15): one IntersectionObserver shared by every instance; the
 * element gets `is-visible` once and is unobserved. All motion is CSS (`globals.css`, gated on
 * `html.js` and `prefers-reduced-motion: no-preference`), so without JavaScript nothing is hidden.
 * Use on blocks and lists (with `--d` per item), never on individual lines of text.
 */
type Tag = "div" | "section" | "article" | "figure" | "ol" | "ul" | "li" | "header" | "footer";

let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function observe(el: Element, onVisible: () => void) {
  if (typeof IntersectionObserver === "undefined") {
    onVisible();
    return () => {};
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        callbacks.delete(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
  );
  callbacks.set(el, onVisible);
  observer.observe(el);
  return () => {
    callbacks.delete(el);
    observer?.unobserve(el);
  };
}

export function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}: {
  as?: Tag;
  /** ms, applied as `--reveal-delay`. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  id?: string;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observe(el, () => setVisible(true));
  }, []);

  const Component = Tag as "div";
  return (
    <Component
      ref={ref}
      data-reveal=""
      className={`${visible ? "is-visible " : ""}${className}`}
      style={delay ? { ...style, ["--reveal-delay" as string]: `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Component>
  );
}
