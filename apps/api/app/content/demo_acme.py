"""Build (or remove) the "Acme Tecnologia" demo organization from `demo_acme_data`.

Everything goes through the regular services, so permissions, state machines, audit entries and
score snapshots are exactly what a real team would have produced — no metric is written by hand
(CLAUDE.md §23, §31). Timestamps are real: the audit trail shows the seed run, and score history
accrues from that day on. The caller owns the transaction.
"""

import io
import secrets
import uuid
from datetime import date, timedelta
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.content import demo_acme_data as data
from app.core.security import hash_password
from app.core.storage import get_storage, new_key
from app.models.assessment import AnswerValue, AssessmentMode
from app.models.control import Control, ControlKind, ControlStatus
from app.models.document import Document, DocumentCategory, DocumentReviewState
from app.models.domain import (
    ActionEffort,
    ActionStatus,
    Evidence,
    EvidenceKind,
    Risk,
    RiskCategory,
    RiskStatus,
)
from app.models.membership import Membership, Role
from app.models.organization import Organization
from app.models.user import User
from app.services import assessment, audit, auth, documents, domain, profile, recommend, score
from app.services import controls as controls_svc

RISK_PATHS: dict[str, list[RiskStatus]] = {
    "aberto": [],
    "em_andamento": [RiskStatus.EM_ANDAMENTO],
    "em_revisao": [RiskStatus.EM_REVISAO],
    "resolvido": [RiskStatus.EM_ANDAMENTO, RiskStatus.EM_REVISAO, RiskStatus.RESOLVIDO],
    "aceito": [RiskStatus.ACEITO],
}
ACTION_PATHS: dict[str, list[ActionStatus]] = {
    "a_fazer": [],
    "em_andamento": [ActionStatus.EM_ANDAMENTO],
    "em_revisao": [ActionStatus.EM_ANDAMENTO, ActionStatus.EM_REVISAO],
    "concluida": [ActionStatus.EM_ANDAMENTO, ActionStatus.CONCLUIDA],
    "bloqueada": [ActionStatus.BLOQUEADA],
}


def minimal_pdf(title: str, lines: list[str]) -> bytes:
    """A valid one-page PDF (Helvetica) so demo documents have a real, downloadable file."""

    def esc(s: str) -> str:
        text = s.encode("latin-1", "replace").decode("latin-1")
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    content = ["BT", "/F1 16 Tf", "50 780 Td", f"({esc(title)}) Tj", "/F1 11 Tf", "0 -28 Td"]
    for line in lines:
        content += [f"({esc(line)}) Tj", "0 -16 Td"]
    content.append("ET")
    stream = "\n".join(content).encode("latin-1")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for n, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{n} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    trailer = f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n"
    out += trailer.encode()
    return bytes(out)


def find_demo_user(db: Session) -> User | None:
    return auth.find_user_by_email(db, data.OWNER_EMAIL)


def build(db: Session, *, password: str, also_owner_email: str | None = None) -> dict[str, Any]:
    """Create the demo organization. Returns a summary (ids, counts, score)."""
    if find_demo_user(db) is not None:
        raise ValueError(f"{data.OWNER_EMAIL} already exists; remove the demo first.")
    today = score.today_local()

    # --- people -------------------------------------------------------------------------------
    name, email, _, _ = data.MEMBERS["ana"]
    owner_user, owner = auth.signup(
        db, name=name, email=email, password=password, organization_name=data.ORGANIZATION_NAME
    )
    org_id = owner.organization_id
    members: dict[str, Membership] = {"ana": owner}
    for key, (name, email, role, _area) in data.MEMBERS.items():
        if key == "ana":
            continue
        user = User(email=email, name=name, password_hash=hash_password(secrets.token_urlsafe(24)))
        db.add(user)
        db.flush()
        members[key] = _add_member(db, org_id, user, Role(role), actor=owner)
    if also_owner_email:
        extra = auth.find_user_by_email(db, also_owner_email)
        if extra is None:
            raise ValueError(f"No account with e-mail {also_owner_email}.")
        _add_member(db, org_id, extra, Role.OWNER, actor=owner)

    # --- profile (D28) ------------------------------------------------------------------------
    profile.update(db, owner, dict(data.PROFILE))

    # --- diagnostic → derived risks -----------------------------------------------------------
    assessment.start(db, owner, AssessmentMode.FULL)
    for code, value in data.ANSWERS.items():
        assessment.answer(db, owner, code, AnswerValue(value), None)
    assessment.complete(db, owner)
    score.recalculate(db, org_id, "assessment.completed")

    # --- documents ----------------------------------------------------------------------------
    docs: dict[str, Document] = {}
    for key, d in data.DOCUMENTS.items():
        doc = documents.create(
            db,
            _manager(members[d["owner"]], owner),
            name=d["name"],
            category=DocumentCategory(d["category"]),
            description=d.get("description"),
            version=d["version"],
            review_state=DocumentReviewState(d["state"]),
            owner_membership_id=members[d["owner"]].id,
            valid_until=today + timedelta(days=d["valid"]) if d["valid"] is not None else None,
            tags=d["tags"],
            url=d.get("url"),
        )
        if d.get("file"):
            _attach_pdf(db, members[d["owner"]], doc, key, today)
        docs[key] = doc

    # --- risks --------------------------------------------------------------------------------
    risks: dict[str, Risk] = {
        r.origin_question_code: r
        for r in db.scalars(select(Risk).where(Risk.organization_id == org_id))
        if r.origin_question_code
    }
    for code, plan in data.RISKS.items():
        risk = risks[code]
        changes: dict[str, Any] = {"owner_membership_id": members[plan["owner"]].id}
        if plan.get("treatment"):
            changes["treatment"] = plan["treatment"]
        domain.update_risk(db, owner, risk.id, changes)
    for m in data.MANUAL_RISKS:
        risks[m["key"]] = domain.create_risk(
            db,
            members["bruno"],
            title=m["title"],
            description=m["description"],
            category=RiskCategory(m["category"]),
            probability=m["probability"],
            impact=m["impact"],
            owner_membership_id=members[m["owner"]].id,
            due_date=None,
            treatment=m["treatment"],
        )

    # --- controls (D27): from the catalogue, linked to the risks their questions map to --------
    catalogue = recommend.catalogue()
    control_of_risk: dict[str, Control] = {}
    control_specs: dict[str, tuple[Control, dict[str, Any]]] = {}
    for code, spec in data.CONTROLS.items():
        template = catalogue[code]
        control = controls_svc.create(
            db,
            _manager(members[spec["owner"]], owner),
            title=template.title,
            category=RiskCategory(template.category),
            description=template.description,
            kind=ControlKind(template.kind),
            status=ControlStatus.PLANEJADO,
            owner_membership_id=members[spec["owner"]].id,
            document_id=docs[spec["doc"]].id if spec.get("doc") else None,
            template_code=code,
        )
        control_specs[code] = (control, spec)
        for question in template.questions:
            if question in risks:
                controls_svc.link_risk(db, owner, control.id, risks[question].id)
                control_of_risk[question] = control

    # --- actions, then evidence, then status transitions --------------------------------------
    for a in data.ACTIONS:
        risk = risks[a["risk"]]
        actor = members[a["owner"]]
        control = control_of_risk.get(a["risk"])
        action = domain.create_action(
            db,
            owner,
            title=a["title"],
            description=a.get("description"),
            risk_id=risk.id,
            control_id=control.id if control else None,
            owner_membership_id=actor.id,
            due_date=today + timedelta(days=a["due"]),
            effort=ActionEffort(a["effort"]) if a.get("effort") else None,
        )
        for ev in a.get("evidence", []):
            _evidence(
                db, actor, ev, docs, action_id=action.id, control_id=control.id if control else None
            )
        for status in ACTION_PATHS[a["status"]]:
            domain.change_action_status(db, actor, action.id, status)
    for key, plan in {**data.RISKS, **{m["key"]: m for m in data.MANUAL_RISKS}}.items():
        risk = risks[key]
        actor = members[plan["owner"]]
        control = control_of_risk.get(key)
        for ev in plan.get("evidence", []):
            _evidence(
                db, actor, ev, docs, risk_id=risk.id, control_id=control.id if control else None
            )
        for status in RISK_PATHS[plan["status"]]:
            domain.change_risk_status(db, actor, risk.id, status)

    # Maturity is declared by the person responsible, after the proof exists (the service refuses
    # "verificado" without evidence — that rule is what makes the demo coherent).
    for control, spec in control_specs.values():
        target = ControlStatus(spec["status"])
        actor = members[spec["owner"]]
        if target != ControlStatus.PLANEJADO:
            controls_svc.update(db, actor, control.id, {"status": target})

    snapshot = score.recalculate(db, org_id, "control.updated")
    return {
        "organization_id": str(org_id),
        "owner_email": owner_user.email,
        "members": len(members),
        "risks": len(risks),
        "actions": len(data.ACTIONS),
        "documents": len(docs),
        "controls": len(control_specs),
        "score": snapshot.score if snapshot else None,
    }


def remove(db: Session) -> bool:
    """Development helper: delete the demo organization, its users and stored files."""
    user = find_demo_user(db)
    if user is None:
        return False
    membership = db.scalar(select(Membership).where(Membership.user_id == user.id))
    if membership is None:
        db.delete(user)
        return True
    org_id = membership.organization_id
    keys = [
        k
        for k in db.scalars(select(Evidence.storage_key).where(Evidence.organization_id == org_id))
        if k
    ] + [
        k
        for k in db.scalars(select(Document.storage_key).where(Document.organization_id == org_id))
        if k
    ]
    # Citations reference documents with RESTRICT; clear them before the organization cascades.
    db.execute(delete(Evidence).where(Evidence.organization_id == org_id))
    db.execute(delete(Organization).where(Organization.id == org_id))
    emails = [m[1] for m in data.MEMBERS.values()]
    db.execute(delete(User).where(User.email.in_(emails)))
    db.flush()
    storage = get_storage()
    for key in keys:
        storage.delete(key)
    return True


def _manager(preferred: Membership, fallback: Membership) -> Membership:
    """Managers act for themselves; work owned by a member is registered by the owner."""
    return preferred if preferred.role in (Role.OWNER, Role.ADMIN) else fallback


def _add_member(
    db: Session, org_id: uuid.UUID, user: User, role: Role, *, actor: Membership
) -> Membership:
    membership = Membership(organization_id=org_id, user_id=user.id, role=role)
    db.add(membership)
    db.flush()
    audit.record(
        db,
        action="membership.created",
        organization_id=org_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="membership",
        entity_id=membership.id,
        data={"role": role.value, "source": "demo_seed"},
    )
    return membership


def _attach_pdf(db: Session, actor: Membership, doc: Document, key: str, today: date) -> None:
    document, _previous = documents.attach_file(
        db, actor, doc.id, filename=f"{key}.pdf", content_type="application/pdf"
    )
    pdf = minimal_pdf(
        doc.name,
        [
            "Documento de demonstracao - Acme Tecnologia Ltda. (dados ficticios)",
            f"Versao {doc.version} - gerado em {today.isoformat()}",
            "",
            "Este arquivo existe para demonstrar upload, download e citacao de documentos",
            "como evidencia no Compliance OS. Nao tem valor juridico.",
        ],
    )
    storage_key = new_key(document.organization_id, uuid.uuid4(), "pdf")
    document.size_bytes = get_storage().put(storage_key, io.BytesIO(pdf))
    document.storage_key = storage_key


def _evidence(
    db: Session,
    actor: Membership,
    ev: dict[str, Any],
    docs: dict[str, Document],
    *,
    risk_id: uuid.UUID | None = None,
    action_id: uuid.UUID | None = None,
    control_id: uuid.UUID | None = None,
) -> None:
    domain.add_evidence(
        db,
        actor,
        kind=EvidenceKind(ev["kind"]),
        risk_id=risk_id,
        action_id=action_id,
        control_id=control_id,
        note=ev.get("note"),
        url=ev.get("url"),
        document_id=docs[ev["doc"]].id if ev["kind"] == "document" else None,
    )
