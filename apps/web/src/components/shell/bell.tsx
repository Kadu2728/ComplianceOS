"use client";

import { Bell as BellIcon, CircleAlert, CircleCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { RadarItem } from "@/components/domain/radar-item";
import type { Radar } from "@/lib/domain/queries";
import { radarCountsLine } from "@/lib/domain/radar";
import { ICON_STROKE } from "./nav-items";
import { announceOpen, isPhone, useCloseOnOtherOpen } from "./popover-bus";

type Load = "idle" | "loading" | "error";

/**
 * Header bell = the Risk Radar (visual-v2 §5.11): what needs attention today, with the reason and
 * where to act. The layout renders it with the server's radar; every open refetches it through the
 * BFF (layouts do not re-render on client navigation), keeping the cached items visible meanwhile.
 * Non-modal popover from 768px; a full-screen dialog below.
 */
export function Bell({ orgId, initial }: { orgId: string; initial: Radar | null }) {
  const [radar, setRadar] = useState<Radar | null>(initial);
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [load, setLoad] = useState<Load>("idle");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const popId = useId();
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);
  useCloseOnOtherOpen("bell", close);

  const refetch = useCallback(async () => {
    setLoad("loading");
    try {
      const res = await fetch(`/api/v1/orgs/${orgId}/radar`, { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.assign("/entrar");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setRadar((await res.json()) as Radar);
      setLoad("idle");
    } catch {
      setLoad("error");
    }
  }, [orgId]);

  const toggle = () => {
    if (open || sheetOpen) {
      close();
      sheetRef.current?.close();
      return;
    }
    announceOpen("bell");
    if (isPhone()) {
      sheetRef.current?.showModal();
      setSheetOpen(true);
    } else {
      setOpen(true);
    }
    void refetch();
  };

  // Focus moves to the heading on open; Escape and outside clicks close; navigation closes.
  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open]);
  useEffect(() => {
    close();
    sheetRef.current?.close();
  }, [pathname, close]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const counts = radar?.counts ?? {};
  const urgent = (counts.danger ?? 0) + (counts.warning ?? 0);
  const label = !radar
    ? "Atenção hoje"
    : radar.all_clear
      ? "Atenção hoje: nada pendente"
      : `Atenção hoje: ${radarCountsLine(counts)}`.replace(/ · /g, ", ");

  const content = (heading: ReactNode) => (
    <>
      <div className="sticky top-0 border-b border-border bg-surface-elevated p-4">
        {heading}
        {radar ? <p className="mt-1 text-caption text-text-secondary">{radarCountsLine(counts)}</p> : null}
        {load === "loading" && radar ? <p className="text-caption text-text-muted">Atualizando…</p> : null}
      </div>
      <div
        aria-busy={load === "loading"}
        className="p-2"
        onClickCapture={(e) => {
          // Same-path links (/#radar from /) do not change the pathname: close explicitly.
          if ((e.target as HTMLElement).closest("a")) {
            close();
            sheetRef.current?.close();
          }
        }}
      >
        {load === "error" ? (
          <div className="flex flex-wrap items-center gap-x-2 px-2 py-2 text-body-sm text-text-secondary">
            <CircleAlert aria-hidden size={16} strokeWidth={ICON_STROKE} className="text-text-muted" />
            Não foi possível carregar os alertas agora.
            <button type="button" onClick={() => void refetch()} className="font-medium text-primary-text underline decoration-1 underline-offset-2 hover:text-primary-text-hover">
              Tentar de novo
            </button>
          </div>
        ) : null}
        {!radar && load === "loading" ? (
          <div aria-hidden className="flex flex-col gap-2 p-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-pulse h-14 rounded-md bg-surface-hover" />
            ))}
          </div>
        ) : null}
        {radar?.all_clear ? (
          <div className="flex items-start gap-2.5 p-2">
            <CircleCheck aria-hidden size={20} strokeWidth={ICON_STROKE} className="shrink-0 text-success-text" />
            <p className="text-body-sm text-text-primary">
              Nada exige atenção agora.
              <span className="mt-0.5 block text-caption text-text-secondary">Mantenha as evidências em dia e revise o diagnóstico periodicamente.</span>
            </p>
          </div>
        ) : radar ? (
          <ul className="flex flex-col divide-y divide-border">
            {radar.items.map((it) => (
              <li key={it.kind} className="py-1">
                <RadarItem item={it} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="border-t border-border px-4 py-3">
        <Link
          href="/#radar"
          onClick={() => {
            close();
            sheetRef.current?.close();
          }}
          className="text-body-sm font-medium text-primary-text hover:text-primary-text-hover hover:underline"
        >
          Ver na visão geral
        </Link>
      </div>
    </>
  );

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open || sheetOpen}
        aria-controls={popId}
        aria-label={label}
        className="relative flex size-11 items-center justify-center rounded-md text-text-secondary transition-colors duration-(--duration-fast) hover:bg-surface-hover hover:text-text-primary lg:size-10"
      >
        <BellIcon aria-hidden size={20} strokeWidth={ICON_STROKE} />
        {urgent > 0 ? (
          <span
            aria-hidden
            className={`absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill px-1 text-micro text-on-fill tabular-nums shadow-[0_0_0_2px_var(--color-surface-base)] ${
              (counts.danger ?? 0) > 0 ? "bg-danger-fill" : "bg-warning-fill"
            }`}
          >
            {urgent > 9 ? "9+" : urgent}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={popId}
          role="dialog"
          aria-labelledby={titleId}
          className="app-pop absolute top-full right-0 z-40 mt-2 flex max-h-[min(560px,80vh)] w-[400px] max-w-[calc(100vw-32px)] flex-col overflow-auto rounded-lg border border-border-strong bg-surface-elevated shadow-popover"
        >
          {content(
            <h2 ref={headingRef} id={titleId} tabIndex={-1} className="text-h3 text-text-primary focus-visible:outline-none">
              Atenção hoje
            </h2>,
          )}
        </div>
      ) : null}

      <dialog
        ref={sheetRef}
        aria-labelledby={`${titleId}-sheet`}
        onClose={() => {
          setSheetOpen(false);
          buttonRef.current?.focus();
        }}
        className="app-sheet m-0 h-dvh max-h-none w-full max-w-none bg-surface-elevated p-0 text-text-primary open:flex open:flex-col md:hidden"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border pr-2 pl-4 pt-[env(safe-area-inset-top)]">
          <h2 id={`${titleId}-sheet`} className="text-h3">
            Atenção hoje
          </h2>
          <button
            type="button"
            onClick={() => sheetRef.current?.close()}
            aria-label="Fechar"
            className="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            <X aria-hidden size={20} strokeWidth={ICON_STROKE} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto pb-[env(safe-area-inset-bottom)]">{content(null)}</div>
      </dialog>
    </div>
  );
}
