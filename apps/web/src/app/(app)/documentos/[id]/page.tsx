import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentFile } from "@/components/domain/document-file";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { DOCUMENT_CATEGORY, DOCUMENT_REVIEW_STATE, DOCUMENT_STATUS, formatDate } from "@/lib/domain/labels";
import { type Document, isManager } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Documento" };

const STATUS_HINT: Record<string, string> = {
  atualizado: "Dentro da validade.",
  vencendo: "A validade termina em até 30 dias — planeje a revisão.",
  vencido: "A validade terminou. Revise o documento e atualize a data.",
  faltante: "Documento esperado, ainda não produzido. Envie um arquivo ou link quando existir.",
  em_revisao: "Em revisão — a versão vigente pode estar desatualizada.",
};

export default async function DocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const doc = await apiGet<Document>(`/api/v1/orgs/${orgId}/documents/${id}`);
  if (!doc) notFound();
  const st = DOCUMENT_STATUS[doc.status]!;
  const canEdit = isManager(session.membership.role) || doc.owner?.membership_id === session.membership.id;

  return (
    <>
      <PageHeader eyebrow="Documentos" title={doc.name} action={canEdit ? <ButtonLink href={`/documentos/${doc.id}/editar`} variant="secondary">Editar</ButtonLink> : undefined} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-surface-elevated p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={st.label} tone={st.tone} icon={st.icon} />
              <span className="text-caption text-text-secondary">{STATUS_HINT[doc.status]}</span>
            </div>
            {doc.description ? <p className="mt-4 whitespace-pre-wrap text-body">{doc.description}</p> : null}
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 text-body-sm md:grid-cols-2">
              <dt className="text-text-secondary">Categoria</dt>
              <dd>{DOCUMENT_CATEGORY[doc.category]}</dd>
              <dt className="text-text-secondary">Versão</dt>
              <dd className="tabular-nums">{doc.version}</dd>
              <dt className="text-text-secondary">Situação</dt>
              <dd>{DOCUMENT_REVIEW_STATE[doc.review_state]?.label}</dd>
              <dt className="text-text-secondary">Responsável</dt>
              <dd>{doc.owner?.name ?? "—"}</dd>
              <dt className="text-text-secondary">Válido até</dt>
              <dd className={`tabular-nums ${doc.status === "vencido" ? "text-danger-text" : ""}`}>{doc.valid_until ? formatDate(doc.valid_until) : "Sem vencimento"}</dd>
              {doc.tags.length ? (
                <>
                  <dt className="text-text-secondary">Tags</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {doc.tags.map((t) => (
                      <span key={t} className="rounded-pill border border-border px-2 text-caption text-text-secondary">{t}</span>
                    ))}
                  </dd>
                </>
              ) : null}
              {doc.url ? (
                <>
                  <dt className="text-text-secondary">Link externo</dt>
                  <dd>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-info-text hover:underline">
                      {doc.url} <ExternalLink aria-hidden size={14} strokeWidth={1.5} />
                    </a>
                  </dd>
                </>
              ) : null}
            </dl>
          </section>
          <DocumentFile orgId={orgId} documentId={doc.id} filename={doc.filename} sizeBytes={doc.size_bytes} updatedAt={doc.file_updated_at} canUpload={canEdit} />
        </div>
        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface-elevated p-5">
            <h2 className="text-h3">Como evidência</h2>
            <p className="mt-1 text-body-sm text-text-secondary">
              Cite este documento como evidência na página de um risco ou de uma ação — é assim que ele conta para o score.
            </p>
          </section>
          <p className="text-caption text-text-secondary">
            Criado em {formatDate(doc.created_at)} · atualizado em {formatDate(doc.updated_at)}
          </p>
        </aside>
      </div>
    </>
  );
}
