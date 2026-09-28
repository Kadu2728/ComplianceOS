"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Lockup } from "@/components/ui/brand-symbol";
import { Container } from "./primitives";
import { CtaLink } from "./cta";

export type NavItem = { label: string; href: string };

/**
 * Landing header v2 (landing-v2 §4.1): opaque canvas bar, the anchor links (drawer below lg),
 * "Entrar" and the CTA. While the hero is on screen the CTA is outline (one filled button per
 * viewport); once `sentinelId` scrolls out it becomes primary. A hairline appears once the page
 * scrolls. The drawer is a native <dialog>: focus trap, Escape, backdrop and scroll lock come
 * from the platform.
 */
export function SiteHeader({
  items,
  login,
  cta,
  sentinelId,
}: {
  items: NavItem[];
  login: NavItem;
  cta: NavItem;
  /** Id of the 1px element at the end of the hero; omit on pages without a hero (CTA primary from the start). */
  sentinelId?: string;
}) {
  const [pastHero, setPastHero] = useState(!sentinelId);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!sentinelId) return;
    const el = document.getElementById(sentinelId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry) setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelId]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const show = () => {
    dialog.current?.showModal();
    setOpen(true);
  };
  const close = () => {
    dialog.current?.close();
  };

  return (
    <header
      data-past-hero={pastHero ? "true" : undefined}
      className={`sticky top-0 z-40 border-b bg-surface-base text-text-primary transition-colors duration-(--duration-fast) print:hidden ${
        scrolled ? "border-border" : "border-transparent"
      }`}
    >
      <Container className="flex h-14 items-center justify-between gap-4 md:h-16">
        <div className="flex items-center gap-10">
          <Lockup symbolOnlyNarrow />
          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center">
              {items.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="inline-flex h-10 items-center px-3 text-body-sm font-medium text-text-secondary transition-colors duration-(--duration-fast) hover:text-text-primary">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href={login.href}
            className="hidden h-10 items-center px-3 text-body-sm font-medium text-text-secondary transition-colors duration-(--duration-fast) hover:text-text-primary md:inline-flex"
          >
            {login.label}
          </a>
          <CtaLink href={cta.href} variant={pastHero ? "primary" : "outline"} size="sm" arrow="forward" className="max-md:[&>svg]:hidden">
            {cta.label}
          </CtaLink>
          <button
            type="button"
            onClick={show}
            aria-label="Abrir navegação"
            aria-expanded={open}
            className="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary lg:hidden"
          >
            <Menu aria-hidden size={20} strokeWidth={1.5} />
          </button>
        </div>
      </Container>

      <dialog
        ref={dialog}
        aria-label="Navegação"
        onClose={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
        className="m-drawer m-0 ml-auto h-dvh max-h-none w-[300px] max-w-[85vw] bg-surface-elevated p-0 text-text-primary shadow-modal open:flex open:flex-col"
      >
        <div className="flex h-14 items-center justify-between border-b border-border pr-2 pl-4">
          <Lockup />
          <button type="button" onClick={close} aria-label="Fechar navegação" className="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary">
            <X aria-hidden size={20} strokeWidth={1.5} />
          </button>
        </div>
        <nav aria-label="Principal" className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={close} className="flex h-12 items-center rounded-md px-3 text-body text-text-primary hover:bg-surface-hover">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-3 border-t border-border pt-4">
            <CtaLink href={login.href} variant="outline" size="md" className="w-full" onClick={close}>
              {login.label}
            </CtaLink>
            <CtaLink href={cta.href} variant="primary" size="md" arrow="forward" className="w-full" onClick={close}>
              {cta.label}
            </CtaLink>
          </div>
        </nav>
      </dialog>
    </header>
  );
}
