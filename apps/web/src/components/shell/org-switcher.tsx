"use client";

import { Building2 } from "lucide-react";
import { useId } from "react";
import { useFormStatus } from "react-dom";
import { switchOrganization } from "@/lib/session/actions";
import { ICON_STROKE } from "./nav-items";

export type OrganizationOption = { id: string; name: string };

/**
 * Current organization in the shell. With one membership it is a label; with several it is a
 * select bound to a Server Action, so it also works as a plain form post without JavaScript
 * (the submit button only shows then).
 */
export function OrgSwitcher({
  currentId,
  organizations,
}: {
  currentId: string;
  organizations: OrganizationOption[];
}) {
  const current = organizations.find((o) => o.id === currentId) ?? organizations[0];
  if (organizations.length < 2) {
    return (
      <div className="flex h-10 items-center gap-3 px-3 text-body-sm font-medium text-text-primary">
        <Building2 aria-hidden size={20} strokeWidth={ICON_STROKE} />
        <span className="truncate">{current?.name}</span>
      </div>
    );
  }
  return (
    <form action={switchOrganization} className="flex h-10 items-center gap-3 px-3">
      <Building2 aria-hidden size={20} strokeWidth={ICON_STROKE} className="shrink-0" />
      <SwitchSelect currentId={currentId} organizations={organizations} />
    </form>
  );
}

function SwitchSelect({ currentId, organizations }: { currentId: string; organizations: OrganizationOption[] }) {
  const { pending } = useFormStatus();
  const id = useId(); // the switcher renders twice (sidebar and drawer): ids must not collide
  return (
    <>
      <label htmlFor={id} className="sr-only">
        Organização atual
      </label>
      <select
        id={id}
        data-testid="org-switch"
        name="organization_id"
        defaultValue={currentId}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-busy={pending}
        className="h-8 min-w-0 flex-1 truncate rounded-md border border-border bg-surface-elevated px-2 text-body-sm font-medium text-text-primary disabled:opacity-60"
      >
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="text-body-sm underline underline-offset-2">
          Trocar
        </button>
      </noscript>
    </>
  );
}
