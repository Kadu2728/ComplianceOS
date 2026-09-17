import type { Metadata } from "next";
import { RoomLinks } from "@/components/room/room-links";
import { RoomSettingsForm } from "@/components/room/room-settings-form";
import { RoomShareList, type ShareItem } from "@/components/room/room-share-list";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { CATEGORY, CONTROL_STATUS, DOCUMENT_CATEGORY, DOCUMENT_STATUS } from "@/lib/domain/labels";
import type { ControlPage, DocumentPage, Room } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Sala de compliance" };

/**
 * Compliance Room management (D36, owner only). Order follows the decision the owner makes:
 * what to show → check the preview → publish → hand out links. Nothing is shared by default.
 */
export default async function SalaPage() {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  if (session.membership.role !== "owner") {
    return (
      <>
        <PageHeader eyebrow="Sala de compliance" title="Somente o proprietário" />
        <Alert tone="info">
          A sala de compliance expõe registros da organização a pessoas de fora. Só o proprietário da organização decide o que é compartilhado e com quem.
        </Alert>
      </>
    );
  }
  const base = `/api/v1/orgs/${orgId}`;
  const [room, documents, controls] = await Promise.all([
    apiGet<Room>(`${base}/room`),
    apiGet<DocumentPage>(`${base}/documents?limit=50`),
    apiGet<ControlPage>(`${base}/controls?limit=50`),
  ]);
  if (!room) return null;

  const documentItems: ShareItem[] = (documents?.items ?? []).map((d) => ({
    id: d.id,
    title: d.name,
    subtitle: `${DOCUMENT_CATEGORY[d.category] ?? d.category} · versão ${d.version} · ${DOCUMENT_STATUS[d.status]?.label ?? d.status}${d.filename ? " · com arquivo" : ""}`,
    shared: d.shared_in_room,
    blocked: d.review_state === "faltante" ? "Documento faltante: não há o que mostrar." : undefined,
  }));
  const controlItems: ShareItem[] = (controls?.items ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: `${CATEGORY[c.category] ?? c.category} · ${CONTROL_STATUS[c.status]?.label ?? c.status}`,
    shared: c.shared_in_room,
    blocked: c.status === "implementado" || c.status === "verificado" ? undefined : "Só controles implementados ou verificados podem ser compartilhados.",
  }));
  const readyToPublish = room.shared_documents + room.shared_controls > 0;

  return (
    <>
      <PageHeader
        eyebrow={session.membership.organization.name}
        title="Sala de compliance"
        description="Não basta dizer que sua empresa está preparada: você precisa conseguir provar. Escolha o que mostrar, confira a prévia e envie um link por destinatário."
        action={<ButtonLink href="/sala/previa" variant="secondary">Ver como visitante</ButtonLink>}
      />
      <div className="mb-6 flex flex-wrap items-center gap-3 text-body-sm">
        <span className={`inline-flex h-7 items-center rounded-pill border px-3 ${room.enabled ? "border-success-border bg-success-tint text-success-text" : "border-border bg-surface-base text-text-secondary"}`}>
          {room.enabled ? "Publicada" : "Desligada"}
        </span>
        <span className="text-text-secondary">
          {room.shared_documents} {room.shared_documents === 1 ? "documento" : "documentos"} · {room.shared_controls} {room.shared_controls === 1 ? "controle" : "controles"} · {room.links.filter((l) => l.active).length} {room.links.filter((l) => l.active).length === 1 ? "link ativo" : "links ativos"}
        </span>
      </div>
      {room.enabled && !readyToPublish ? (
        <div className="mb-6">
          <Alert tone="warning">A sala está publicada, mas nada foi compartilhado: um visitante verá apenas o título e a apresentação.</Alert>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <section aria-labelledby="sala-documentos" className="rounded-lg border border-border bg-surface-elevated p-5">
          <h2 id="sala-documentos" className="text-h3">1. Documentos compartilhados</h2>
          <p className="mt-1 mb-4 text-caption text-text-secondary">Nome, categoria, versão, situação e validade. Documentos com arquivo podem ser baixados por quem tem o link.</p>
          <RoomShareList orgId={orgId} kind="documents" items={documentItems} emptyText="Nenhum documento cadastrado ainda." />
        </section>

        <section aria-labelledby="sala-controles" className="rounded-lg border border-border bg-surface-elevated p-5">
          <h2 id="sala-controles" className="text-h3">2. Controles compartilhados</h2>
          <p className="mt-1 mb-4 text-caption text-text-secondary">Título, descrição, tipo e maturidade. Riscos, ações e evidências ligados ao controle nunca aparecem.</p>
          <RoomShareList orgId={orgId} kind="controls" items={controlItems} emptyText="Nenhum controle cadastrado ainda." />
        </section>

        <section aria-labelledby="sala-config" className="rounded-lg border border-border bg-surface-elevated p-5">
          <h2 id="sala-config" className="text-h3">3. Apresentação e publicação</h2>
          <div className="mt-4">
            <RoomSettingsForm orgId={orgId} room={room} />
          </div>
        </section>

        <section aria-labelledby="sala-links" className="rounded-lg border border-border bg-surface-elevated p-5">
          <h2 id="sala-links" className="text-h3">4. Links de acesso</h2>
          <p className="mt-1 mb-4 text-caption text-text-secondary">Um link por destinatário, com validade de até 90 dias. Cada visita e cada download ficam registrados no histórico.</p>
          <RoomLinks orgId={orgId} links={room.links} enabled={room.enabled} />
        </section>
      </div>
    </>
  );
}
