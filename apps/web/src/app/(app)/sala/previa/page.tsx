import type { Metadata } from "next";
import { RoomView } from "@/components/room/room-view";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import type { RoomPublic } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Prévia da sala de compliance" };

/** The owner's check (D36, threat model T3): the same payload a visitor gets, rendered the same way. */
export default async function SalaPreviaPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.membership.role !== "owner") {
    return (
      <>
        <PageHeader eyebrow="Sala de compliance" title="Somente o proprietário" />
        <Alert tone="info">Só o proprietário da organização gerencia a sala de compliance.</Alert>
      </>
    );
  }
  const room = await apiGet<RoomPublic>(`/api/v1/orgs/${session.membership.organization.id}/room/preview`);
  if (!room) return null;
  return (
    <>
      <PageHeader eyebrow="Sala de compliance" title="Prévia" description="Exatamente o que um visitante com link vê. Arquivos só podem ser baixados por um link real." action={<ButtonLink href="/sala" variant="secondary">Voltar à sala</ButtonLink>} />
      <div className="rounded-lg border border-dashed border-border bg-surface-base p-4 md:p-8">
        <RoomView room={room} downloadBase={null} />
      </div>
    </>
  );
}
