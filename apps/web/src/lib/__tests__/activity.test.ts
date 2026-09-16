import { describe, expect, it } from "vitest";
import { ACTIVITY_ENTITY_HREF, type AuditEntry, describeActivity } from "../domain/activity";

const base = {
  id: "e1",
  entity_id: "r1",
  actor_user_id: null,
  actor_membership_id: null,
  actor_name: "Ana",
  request_id: null,
  created_at: "2026-09-13T00:00:00Z",
};

function entry(action: string, extra: Partial<AuditEntry> = {}): AuditEntry {
  return { ...base, action, entity_type: "risk", entity_title: "MFA", data: null, ...extra } as AuditEntry;
}

describe("activity sentences", () => {
  it("describes risk, action and document events in pt-BR", () => {
    expect(describeActivity(entry("risk.created"))).toBe("registrou o risco “MFA”");
    expect(describeActivity(entry("risk.created", { data: { source: "assessment" } }))).toBe("identificou o risco “MFA” no diagnóstico");
    expect(describeActivity(entry("risk.status_changed", { data: { from: "aberto", to: "em_andamento" } }))).toBe("mudou o risco “MFA” para Em andamento");
    expect(describeActivity(entry("risk.updated", { data: { title: {}, due_date: {}, reason: "assessment:DF-01:sim" } }))).toBe("atualizou o risco “MFA” pelo diagnóstico");
    expect(describeActivity(entry("risk.updated", { data: { title: {}, due_date: {} } }))).toBe("editou o risco “MFA” (título, prazo)");
    expect(describeActivity(entry("document.file_uploaded", { entity_type: "document", entity_title: "Política" }))).toBe("enviou um arquivo para o documento “Política”");
    expect(describeActivity(entry("document.deleted", { entity_type: "document", entity_title: null, data: { name: "Antiga" } }))).toBe("removeu o documento “Antiga”");
    expect(describeActivity(entry("evidence.added", { data: { kind: "document" } }))).toBe("anexou uma evidência (documento)");
    expect(describeActivity(entry("membership.created", { entity_type: "membership", data: { role: "admin", source: "demo_seed" } }))).toBe("adicionou um membro como Administrador");
    expect(describeActivity(entry("membership.role_changed", { entity_type: "membership", data: { from: "member", to: "viewer" } }))).toBe("alterou o papel de um membro para Leitura");
    expect(describeActivity(entry("control.created", { entity_type: "control", entity_title: "MFA" }))).toBe("registrou o controle “MFA”");
    expect(describeActivity(entry("control.updated", { entity_type: "control", entity_title: "MFA", data: { status: { from: "parcial", to: "verificado" } } }))).toBe("mudou o controle “MFA” para Verificado");
    expect(describeActivity(entry("control.linked", { entity_type: "control", entity_title: "MFA", data: { risk_id: "r1", risk_title: "Sem MFA" } }))).toBe("vinculou o controle “MFA” ao risco “Sem MFA”");
    expect(describeActivity(entry("risk.planned", { entity_title: "Sem MFA" }))).toBe("planejou o risco “Sem MFA” (controle e ação em um passo)");
    expect(describeActivity(entry("profile.updated", { entity_type: "organization", data: { segment: {}, data_categories: {} } }))).toBe("atualizou o perfil da organização (segmento, tipos de dados)");
    expect(describeActivity(entry("something.new"))).toBe("something.new");
  });

  it("links to the record when it still exists", () => {
    expect(ACTIVITY_ENTITY_HREF(entry("risk.created"))).toBe("/riscos/r1");
    expect(ACTIVITY_ENTITY_HREF(entry("document.updated", { entity_type: "document", entity_id: "d1" }))).toBe("/documentos/d1");
    expect(ACTIVITY_ENTITY_HREF(entry("document.deleted", { entity_type: "document", entity_id: "d1" }))).toBeNull();
    expect(ACTIVITY_ENTITY_HREF(entry("membership.invited", { entity_type: "membership", entity_id: "m1" }))).toBeNull();
    expect(ACTIVITY_ENTITY_HREF(entry("control.updated", { entity_type: "control", entity_id: "c1" }))).toBe("/controles/c1");
    expect(ACTIVITY_ENTITY_HREF(entry("control.deleted", { entity_type: "control", entity_id: "c1" }))).toBeNull();
  });
});
