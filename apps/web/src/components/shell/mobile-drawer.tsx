"use client";

import { PanelLeft, X } from "lucide-react";
import { useRef } from "react";
import { ICON_STROKE, navItemsFor } from "./nav-items";
import { NavLink } from "./nav-link";
import { AccountBlock } from "./account-block";
import { type OrganizationOption, OrgSwitcher } from "./org-switcher";

/**
 * Mobile navigation as a native <dialog>: focus trap, Escape, backdrop and inert page
 * come from the platform — no library (docs/design/app-shell.md §2, §7).
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
  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Abrir navegação"
        className="flex size-11 items-center justify-center rounded-md text-text-primary hover:bg-surface-hover md:hidden"
      >
        <PanelLeft aria-hidden size={20} strokeWidth={ICON_STROKE} />
      </button>
      <dialog
        ref={ref}
        aria-label="Navegação"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
        onClick={(e) => {
          // Clicks on the backdrop target the <dialog> element itself.
          if (e.target === ref.current) close();
        }}
        className="m-0 h-dvh max-h-none w-[280px] max-w-[85vw] bg-surface-elevated p-0 shadow-modal backdrop:bg-obsidian/40 open:flex open:flex-col"
      >
        <div className="flex h-14 items-center justify-between border-b border-border pr-2 pl-3">
          <span className="text-[16px] font-semibold tracking-[-0.01em]">Compliance OS</span>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar navegação"
            className="flex size-11 items-center justify-center rounded-md hover:bg-surface-hover"
          >
            <X aria-hidden size={20} strokeWidth={ICON_STROKE} />
          </button>
        </div>
        <div className="px-3 pt-3">
          <OrgSwitcher currentId={currentId} organizations={organizations} />
        </div>
        <nav aria-label="Principal" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItemsFor(role).map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon aria-hidden size={20} strokeWidth={ICON_STROKE} />}
              onNavigate={close}
            />
          ))}
        </nav>
        <AccountBlock userName={userName} role={role} onNavigate={close} />
      </dialog>
    </>
  );
}
