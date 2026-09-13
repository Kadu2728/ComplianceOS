"use client";

import { Trash2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, humanMessage } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";
import { ROLE_LABEL } from "@/lib/domain/labels";

type Member =
  paths["/api/v1/orgs/{org_id}/members"]["get"]["responses"]["200"]["content"]["application/json"][number];
type Invitation =
  paths["/api/v1/orgs/{org_id}/members/invitations"]["get"]["responses"]["200"]["content"]["application/json"][number];
type Role = Member["role"];

const ROLE_HINT: Record<string, string> = {
  owner: "Controle total, inclusive membros e organização",
  admin: "Gerencia riscos, ações, documentos e diagnóstico",
  member: "Trabalha no que lhe é atribuído",
  viewer: "Somente leitura",
};
const ROLES: Role[] = ["owner", "admin", "member", "viewer"];

const when = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

/**
 * Members and invitations (CLAUDE.md §11). The API decides what each role may do: managers see
 * the controls, an owner alone cannot be demoted or removed, and only owners grant "owner".
 */
export function MembersPanel({
  orgId,
  members,
  invitations,
  me,
  canManage,
  isOwner,
}: {
  orgId: string;
  members: Member[];
  invitations: Invitation[];
  me: { membershipId: string };
  canManage: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitePending, setInvitePending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState<string | null>(null);
  const base = `/api/v1/orgs/${orgId}/members`;

  async function changeRole(id: string, role: string) {
    setBusy(id);
    setError(null);
    const r = await api(`${base}/${id}`, { method: "PATCH", body: { role } });
    setBusy(null);
    if (!r.ok) return setError(r.error.message || humanMessage(r.error));
    router.refresh();
  }

  async function remove(member: Member) {
    if (!window.confirm(`Remover ${member.user.name} da organização? A pessoa perde o acesso imediatamente.`)) return;
    setBusy(member.id);
    setError(null);
    const r = await api(`${base}/${member.id}`, { method: "DELETE" });
    setBusy(null);
    if (!r.ok) return setError(r.error.message || humanMessage(r.error));
    router.refresh();
  }

  async function revoke(inv: Invitation) {
    setBusy(inv.id);
    setError(null);
    const r = await api(`${base}/invitations/${inv.id}`, { method: "DELETE" });
    setBusy(null);
    if (!r.ok) return setError(r.error.message || humanMessage(r.error));
    router.refresh();
  }

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const email = String(f.get("email") ?? "").trim();
    setInvitePending(true);
    setInviteError(null);
    setInviteSent(null);
    const r = await api(`${base}/invitations`, { method: "POST", body: { email, role: f.get("role") } });
    setInvitePending(false);
    if (!r.ok) return setInviteError(r.error.message || humanMessage(r.error));
    form.reset();
    setInviteSent(email);
    router.refresh();
  }

  return (
    <section aria-labelledby="membros" className="rounded-lg border border-border bg-surface-elevated p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="membros" className="text-h3">
          Membros <span className="text-body-sm font-normal text-text-secondary">· {members.length}</span>
        </h2>
        {canManage ? (
          <Button variant="secondary" onClick={() => setInviteOpen((v) => !v)} aria-expanded={inviteOpen}>
            <UserPlus aria-hidden size={16} strokeWidth={1.5} /> Convidar
          </Button>
        ) : null}
      </div>
      {error ? <div className="mt-3"><Alert tone="danger">{error}</Alert></div> : null}

      {canManage && inviteOpen ? (
        <form onSubmit={invite} className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-surface-base p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-email" className="text-body-sm font-medium">E-mail</label>
              <input id="invite-email" name="email" type="email" required className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-body" placeholder="pessoa@empresa.com.br" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-role" className="text-body-sm font-medium">Papel</label>
              <select id="invite-role" name="role" defaultValue="member" className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-body">
                {ROLES.filter((r) => isOwner || r !== "owner").map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={invitePending}>{invitePending ? "Enviando…" : "Enviar convite"}</Button>
          </div>
          <p className="text-caption text-text-secondary">
            {ROLES.map((r) => `${ROLE_LABEL[r]}: ${ROLE_HINT[r]}`).join(" · ")}. O convite vale por 7 dias.
          </p>
          {inviteError ? <Alert tone="danger">{inviteError}</Alert> : null}
          {inviteSent ? <Alert tone="success">Convite enviado para {inviteSent}.</Alert> : null}
        </form>
      ) : null}

      <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
        {members.map((m) => {
          const self = m.id === me.membershipId;
          return (
            <li key={m.id} className="flex flex-col gap-2 px-4 py-3 text-body-sm md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <span className="font-medium text-text-primary">{m.user.name}</span>
                {self ? <span className="ml-2 text-caption text-text-secondary">(você)</span> : null}
                <div className="text-caption text-text-secondary">
                  {m.user.email ?? ""}{m.user.email ? " · " : ""}desde {when.format(new Date(m.created_at))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManage && !self ? (
                  <>
                    <label className="sr-only" htmlFor={`role-${m.id}`}>Papel de {m.user.name}</label>
                    <select id={`role-${m.id}`} value={m.role} disabled={busy === m.id || (m.role === "owner" && !isOwner)} onChange={(e) => changeRole(m.id, e.target.value)} className="h-9 rounded-md border border-border bg-surface-elevated px-2 text-body-sm">
                      {ROLES.filter((r) => isOwner || r !== "owner").map((r) => (
                        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => remove(m)} disabled={busy === m.id || (m.role === "owner" && !isOwner)} aria-label={`Remover ${m.user.name}`} className="flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-danger-text disabled:opacity-40">
                      <Trash2 aria-hidden size={16} strokeWidth={1.5} />
                    </button>
                  </>
                ) : (
                  <span className="rounded-pill border border-border px-2 py-0.5 text-caption text-text-secondary">{ROLE_LABEL[m.role]}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {canManage ? (
        <div className="mt-6">
          <h3 className="text-body font-medium">Convites pendentes</h3>
          {invitations.length === 0 ? (
            <p className="mt-1 text-body-sm text-text-secondary">Nenhum convite aguardando aceite.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-body-sm">
                  <span>
                    <span className="font-medium text-text-primary">{inv.email}</span>
                    <span className="ml-2 text-caption text-text-secondary">{ROLE_LABEL[inv.role]} · expira em {when.format(new Date(inv.expires_at))}</span>
                  </span>
                  <button type="button" onClick={() => revoke(inv)} disabled={busy === inv.id} aria-label={`Revogar convite de ${inv.email}`} className="flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-danger-text disabled:opacity-40">
                    <X aria-hidden size={16} strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
