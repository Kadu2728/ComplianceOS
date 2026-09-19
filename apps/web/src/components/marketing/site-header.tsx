"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Lockup } from "@/components/ui/brand-symbol";
import { Container } from "./primitives";
import { CtaLink } from "./cta";

export type NavItem = { label: string; href: string };

/**
 * Landing header (03-ux-spec §2.1): sticky Obsidian bar, five anchor links (drawer below lg),
 * "Entrar" and the primary CTA. While the hero is on screen the CTA is secondary (one big
 * primary per viewport, copy §D); once `sentinelId` scrolls out it becomes primary. Without
 * JavaScript it stays secondary — still a valid CTA. The drawer is a native <dialog>, as in the
 * app shell: focus trap, Escape, backdrop and scroll lock come from the platform.
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

  const show = () => {
    dialog.current?.showModal();
    setOpen(true);
  };
  const close = () => {
    dialog.current?.close();
  };

  return (
    <header data-past-hero={pastHero ? "true" : undefined} className="theme-dark sticky top-0 z-40 border-b border-border bg-surface-base text-text-primary">
      <Container className="flex h-14 items-center justify-between gap-4 md:h-16">
        <div className="flex items-center gap-8">
          <Lockup symbolOnlyBelowSm />
          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="inline-flex h-10 items-center px-2 text-body-sm text-text-secondary transition-colors duration-(--duration-fast) hover:text-text-primary">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <CtaLink href={login.href} variant="tertiary" size="sm" className="hidden md:inline-flex">
            {login.label}
          </CtaLink>
          <CtaLink href={cta.href} variant={pastHero ? "primary" : "secondary"} size="sm" className="my-1">
            {cta.label}
          </CtaLink>
          <button
            type="button"
            onClick={show}
            aria-label="Abrir navegação"
            aria-expanded={open}
            className="flex size-11 items-center justify-center rounded-md text-text-primary hover:bg-surface-hover lg:hidden"
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
        className="m-drawer theme-dark m-0 ml-auto h-dvh max-h-none w-[280px] max-w-[85vw] bg-surface-elevated p-0 text-text-primary shadow-modal backdrop:bg-obsidian/40 open:flex open:flex-col"
      >
        <div className="flex h-14 items-center justify-between border-b border-border pr-2 pl-4">
          <Lockup />
          <button type="button" onClick={close} aria-label="Fechar navegação" className="flex size-11 items-center justify-center rounded-md hover:bg-surface-hover">
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
            <CtaLink href={login.href} variant="secondary" size="md" className="w-full" onClick={close}>
              {login.label}
            </CtaLink>
            <CtaLink href={cta.href} variant="primary" size="md" className="w-full" onClick={close}>
              {cta.label}
            </CtaLink>
          </div>
        </nav>
      </dialog>
    </header>
  );
}
