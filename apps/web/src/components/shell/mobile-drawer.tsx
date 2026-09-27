"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { AccountBlock } from "./account-block";
import { onDrawerRequest, requestDrawer, setDrawerOpen, useDrawerOpen } from "./drawer-store";
import { ICON_STROKE } from "./nav-items";
import { NavList } from "./nav-list";
import { type OrganizationOption, OrgSwitcher } from "./org-switcher";
import { Wordmark } from "./wordmark";

const DRAWER_ID = "app-drawer";

/**
 * Navigation drawer below 1024 (visual-v2 §3.6) as a native <dialog>: focus trap, Escape,
 * backdrop and inert page come from the platform — no library. Slides in from the left.
 */
export function MobileDrawer({
  currentId,
  organizations,
  role,
  userName,
}: {
  currentId: string;
  organizations: OrganizationOption[];
  role: string;
  userName: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  const pathname = usePathname();

  useEffect(
    () =>
      onDrawerRequest(() => {
        if (!ref.current?.open) ref.current?.showModal();
        setDrawerOpen(true);
      }),
    [],
  );
  // A navigation from inside the drawer closes it (Link clicks also call `close`).
  useEffect(() => {
    if (ref.current?.open) ref.current.close();
  }, [pathname]);

  return (
    <dialog
      ref={ref}
      id={DRAWER_ID}
      aria-label="Navegação"
      onClose={() => setDrawerOpen(false)}
      onClick={(e) => {
        // Clicks on the backdrop target the <dialog> element itself.
        if (e.target === ref.current) close();
      }}
      className="app-drawer m-0 h-dvh max-h-none w-[300px] max-w-[85vw] rounded-r-xl bg-surface-elevated p-0 text-text-primary shadow-modal open:flex open:flex-col lg:hidden"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border pr-2 pl-4">
        <Wordmark onNavigate={close} />
        <button
          type="button"
          onClick={close}
          aria-label="Fechar navegação"
          className="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        >
          <X aria-hidden size={20} strokeWidth={ICON_STROKE} />
        </button>
      </div>
      <div className="px-3 pt-3">
        <OrgSwitcher currentId={currentId} organizations={organizations} />
      </div>
      <nav aria-label="Principal" className="min-h-0 flex-1 overflow-y-auto p-3">
        <NavList role={role} onNavigate={close} tall />
      </nav>
      <AccountBlock userName={userName} role={role} onNavigate={close} />
    </dialog>
  );
}

/** Any control that opens the drawer (tablet menu button, the tab bar's "Mais"). */
export function DrawerButton({ className, label, children }: { className: string; label?: string; children: ReactNode }) {
  const open = useDrawerOpen();
  return (
    <button
      type="button"
      onClick={requestDrawer}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={DRAWER_ID}
      aria-label={label}
      className={className}
    >
      {children}
    </button>
  );
}

export function MenuButton() {
  return (
    <DrawerButton
      label="Abrir navegação"
      className="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary"
    >
      <Menu aria-hidden size={20} strokeWidth={ICON_STROKE} />
    </DrawerButton>
  );
}
