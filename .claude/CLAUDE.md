# COMPLIANCE OS — MASTER PROJECT CONTEXT

## 1. PROJECT IDENTITY

Project name: Compliance OS

Category:
B2B SaaS / Compliance Operations / GRC Infrastructure

Core concept:
THE CONTROL LAYER

Main slogan:
"Know your risk. Control your business."

Portuguese:
"Conheça seus riscos. Controle seu negócio."

Commercial positioning:
"Compliance corporativo sem precisar de um departamento de compliance."

Acquisition positioning:
"Seu passaporte de compliance para vender para empresas maiores."

One-line identity:

Compliance OS é uma marca de infraestrutura tecnológica que transforma complexidade, risco e burocracia em controle claro e mensurável.

The product is not merely a "LGPD platform".

LGPD is the initial wedge.

The long-term product territory includes:

- Privacy
- Information Security
- Risk Management
- Governance
- Vendor Management
- Contracts
- Audits
- Incidents
- Policies
- Certifications
- ISO
- SOC 2
- ESG
- Enterprise Compliance

The architecture and product language MUST allow this evolution.

---

# 2. SOURCE OF TRUTH HIERARCHY

When information conflicts, use this order:

1. Explicit user instruction in the current task
2. `.claude/CLAUDE.md`
3. `.claude/brand-system.md` (brand, visual language, voice)
4. `.claude/agents/orchestrator.md`
5. Relevant specialized agent instructions
6. Documented decisions in `docs/decisions.md`
7. Existing implementation and repository reality
8. General assumptions

Special rule for legal and regulatory facts:

Official primary sources (ANPD, Planalto, Diário Oficial, official regulatory bodies) override every document above except an explicit user instruction. No brand, product, agent or code document may assert a legal obligation on its own authority. When a document in this repository and an official source disagree about a legal fact, the official source wins and the Compliance Researcher must be involved.

When existing implementation contradicts a documented decision, surface the contradiction — do not silently follow either side.

This same hierarchy is mirrored in `.claude/agents/orchestrator.md`. If the two ever diverge, this file wins.

Never silently override higher-priority instructions.

If an important conflict exists:

- identify it;
- explain its impact;
- ask for a decision when necessary;
- do not invent a resolution.

The `.claude/brand-system.md` file is the official visual and brand source of truth.

Any visual decision that conflicts with it must be explicitly justified and reviewed.

---

# 3. CORE PRODUCT VISION

Compliance OS exists to make compliance operational.

The user should be able to:

1. Understand their current compliance maturity.
2. Identify their biggest risks.
3. Understand why those risks matter.
4. Prioritize what needs to be fixed.
5. Assign responsibilities.
6. Execute corrective actions.
7. Store evidence.
8. Monitor progress.
9. Demonstrate compliance maturity to clients, partners and auditors.

Core product flow:

Diagnosticar
→ Entender
→ Priorizar
→ Corrigir
→ Comprovar
→ Monitorar

The product must always move the user from information to action.

Do not build features that merely display information without helping the user decide or act.

---

# 4. V1 PRODUCT SCOPE

The first commercially meaningful version should focus on:

### Dashboard

Show:

- Compliance Score
- Current status
- Critical risks
- Pending actions
- Document status
- Recent activity
- Recommended next actions

The dashboard must answer immediately:

"How protected and organized is my company right now?"

and:

"What should I do next?"

---

### Compliance Assessment

The assessment should collect information about areas such as:

- Personal data processing
- Data storage
- Access control
- Third parties
- Security practices
- Privacy policies
- Data subject requests
- Employee awareness
- Incidents
- Vendors
- Documentation

Questions must be versionable.

Never hard-code regulatory assumptions into the product without a documented source.

---

### Risk Management

Each risk should support information such as:

- Title
- Description
- Category
- Probability
- Impact
- Severity
- Status
- Owner
- Due date
- Treatment
- Evidence
- Related tasks

Risk levels:

- Critical
- High
- Medium
- Low

The risk model must be explainable.

Users must understand:

- why a risk exists;
- why it has its severity;
- what should be done;
- whether it is improving.

---

### Action Plan

The fundamental execution model:

Risk
→ Action
→ Responsible
→ Deadline
→ Status

Suggested statuses:

- To do
- In progress
- Review
- Done
- Blocked

Actions must remain connected to the originating risk whenever applicable.

---

### Document Management

Documents should support:

- Name
- Category
- Version
- Status
- Responsible
- Creation date
- Validity
- Last update
- Tags
- Evidence relationship

Statuses:

- Updated
- Expiring
- Expired
- Missing
- In review

Architecture must support secure object storage in the future.

---

### Compliance Score

The score must be explainable.

Never present an arbitrary number.

The system must be capable of explaining:

- what increased the score;
- what reduced the score;
- which risks affect it;
- which controls are missing;
- what actions can improve it.

Example:

74/100

But the interface should allow the user to understand why it is 74.

---

### Audit Trail

Track relevant changes such as:

- Creation
- Editing
- Deletion
- Status changes
- Responsibility changes
- Document uploads
- Task completion
- Risk changes
- Permission changes
- Important configuration changes

Auditability is a core product characteristic.

---

# 5. FUTURE PRODUCT DIRECTION

Potential future capabilities include:

- AI Compliance Copilot
- Contract intelligence
- Vendor risk management
- Incident management
- Compliance Room
- Automated reports
- Integrations
- Certifications
- Expert marketplace
- Billing
- Advanced governance
- Security maturity
- ISO readiness
- Enterprise compliance workflows

These capabilities should not unnecessarily expand V1.

Architecture should support future evolution without prematurely implementing everything.

---

# 6. COMPLIANCE ROOM

Compliance Room is an important future commercial capability.

Concept:

A secure, shareable environment where a company can demonstrate its compliance maturity to:

- Clients
- Prospects
- Partners
- Auditors
- Procurement teams

Potential contents:

- Policies
- Security practices
- Privacy documentation
- Processing records
- Evidence
- Certifications
- Compliance score
- Relevant controls
- Organization information

Commercial idea:

"Stop losing opportunities because you can't prove your compliance."

This should eventually become part of the sales/product story.

---

# 7. AI PRODUCT PRINCIPLES

AI must be useful, contextual and explainable.

Do NOT build a generic chatbot simply because the product uses AI.

Future AI capabilities may include:

- Risk explanation
- Recommended actions
- Document analysis
- Contract analysis
- Missing-document detection
- Compliance summaries
- Action-plan generation
- Score explanation

Example questions:

"What are my biggest risks?"

"What should I fix this week?"

"What documents are missing?"

"Why did my score fall?"

"Analyze this contract."

"Create an action plan for this risk."

AI must never:

- invent legal requirements;
- present uncertain legal interpretations as facts;
- claim that a company is legally compliant without sufficient basis;
- replace lawyers, DPOs, consultants or qualified professionals;
- expose data between organizations;
- reveal sensitive tenant information.

Human review must remain possible.

---

# 8. LEGAL AND REGULATORY SAFETY

Compliance OS is a management and operational support platform.

It does NOT automatically guarantee legal compliance.

The product must never communicate:

- "You are legally compliant"
- "This guarantees compliance"
- "This replaces your lawyer"
- "This automatically satisfies every legal requirement"

Prefer language such as:

- "Helps identify gaps"
- "Supports compliance management"
- "Recommended action"
- "Potential risk"
- "Based on the configured assessment"
- "Requires review"

Regulatory information must prioritize primary sources.

For Brazil, relevant sources include:

- ANPD
- Planalto
- Diário Oficial
- Official regulatory bodies

When regulation is uncertain or changing, the uncertainty must be represented.

---

# 9. SECURITY BASELINE

Security is a product requirement, not an optional enhancement.

Minimum expectations:

- Secure authentication
- Authorization
- Server-side permission checks
- Strict tenant isolation
- Input validation
- Secure password handling
- Secure token handling
- Protected secrets
- Safe file uploads
- Rate limiting where appropriate
- Secure error handling
- Audit logging
- Protection against IDOR/BOLA
- Protection against injection
- XSS prevention
- CSRF considerations
- CORS configuration
- Dependency hygiene
- Data minimization
- Secure database access

Never trust frontend authorization.

Every sensitive operation must be authorized server-side.

---

# 10. MULTI-TENANCY

The system is fundamentally multi-tenant.

Core relationship:

Organization
→ Users / Memberships
→ Assessments
→ Risks
→ Tasks
→ Documents
→ Evidence
→ Scores
→ Audit Logs

Tenant isolation must be enforced server-side.

A user from Organization A must never be able to access or manipulate Organization B's data.

Every query involving tenant-owned data must be carefully scoped.

Never rely only on frontend filtering.

---

# 11. ROLES AND PERMISSIONS

Initial roles:

- OWNER
- ADMIN
- MEMBER
- VIEWER

Permissions must be explicit.

Examples:

OWNER:
- Full organization control
- Billing/configuration
- Member management

ADMIN:
- Operational management
- Risks
- Tasks
- Documents
- Assessments

MEMBER:
- Assigned operational work

VIEWER:
- Read-only access

Authorization must be enforced on the backend.

---

# 12. TECH STACK

Frontend:

- Next.js 15 (App Router, Server Components by default)
- React 19
- TypeScript 5 (strict)
- Tailwind CSS 4
- shadcn/ui (install only the components actually used)
- Framer Motion — listed, but NOT included in the MVP bundle (see `docs/decisions.md` D22); motion is CSS-first

Backend:

- Python 3.12
- FastAPI
- SQLAlchemy 2.x
- Pydantic v2
- JWT
- Refresh tokens

Database:

- PostgreSQL 16
- Alembic

Major versions above are pinned decisions (D18). Exact patch versions are locked by the lockfiles once the projects are scaffolded. Do not downgrade or upgrade a major version without a decision record.

Potential infrastructure:

- Vercel
- Railway / Render
- Neon
- S3-compatible object storage

Use additional dependencies only when they provide clear value.

Do not add libraries simply because they are popular.

---

# 13. ENGINEERING PRINCIPLES

Code should be:

- Production-oriented
- Maintainable
- Typed
- Modular
- Testable
- Secure
- Observable
- Performant
- Accessible

Prefer:

- Clear abstractions
- Small reusable components
- Explicit contracts
- Strong typing
- Predictable state management
- Server-side validation
- Reusable domain logic

Avoid:

- Giant components
- Duplicate logic
- Magic numbers
- Hidden business rules
- Unnecessary abstractions
- Premature complexity
- Dead code
- Temporary hacks becoming permanent architecture

---

# 14. FRONTEND PRINCIPLES

The interface must feel like premium B2B infrastructure software.

The experience should communicate:

- Trust
- Control
- Clarity
- Maturity
- Precision
- Progress

Visual authority belongs to `.claude/brand-system.md`.

The frontend must not drift into:

- Generic AI aesthetics
- Excessive gradients
- Neon dashboards
- Glassmorphism everywhere
- Decorative 3D
- Overloaded cards
- Excessive animations
- Purple AI visual clichés

Use hierarchy and information architecture to create sophistication.

---

# 15. PERFORMANCE

Performance is a product requirement.

The application must work well on:

- Low-end smartphones
- Older Android devices
- Slow networks
- Basic computers

Avoid:

- Heavy animations
- Large JavaScript bundles
- Unnecessary client-side rendering
- Huge images
- Autoplay video
- Excessive dependencies
- Expensive effects

Prefer:

- Server rendering when appropriate
- Lazy loading
- Code splitting
- Optimized images
- Lightweight interactions
- Progressive enhancement
- Efficient API calls
- Caching where appropriate

Target:

Fast perception first.

The user should feel that the system responds immediately.

---

# 16. UX AND MOTION

Motion must communicate state or hierarchy.

Core motion concept:

Layer
→ Connect
→ Resolve
→ Progress

Examples:

- Score changes
- Risk status changes
- Task completion
- Document state transitions
- Navigation
- Loading
- Feedback

Avoid animation purely for decoration.

Respect:

`prefers-reduced-motion`

Motion must never compromise performance.

---

# 17. DATA VISUALIZATION

Data visualization should answer questions.

Examples:

- What is my compliance level?
- Where are my biggest risks?
- What is improving?
- What is getting worse?
- What requires attention?
- Which controls are incomplete?

Charts should not exist simply because dashboards traditionally contain charts.

Every visualization needs a purpose.

---

# 18. DESIGN SYSTEM

The visual system must be centralized.

Use reusable:

- Components
- Tokens
- Typography
- Spacing
- Radius
- Borders
- Shadows
- Colors
- States
- Interaction patterns

Avoid page-specific visual inventions that create inconsistency.

`.claude/brand-system.md` is the authority for brand decisions.

---

# 19. RESPONSIVE DESIGN

The product must support:

- Desktop
- Tablet
- Mobile

Responsive behavior must be intentional.

Do not simply shrink desktop layouts.

Tables, dashboards, risk matrices and action plans need mobile-specific behavior where necessary.

Prioritize essential actions on smaller screens.

---

# 20. ACCESSIBILITY

Minimum expectations:

- Semantic HTML
- Keyboard navigation
- Focus states
- Sufficient contrast
- Accessible forms
- Labels
- Error messages
- Screen-reader considerations
- Reduced-motion support

Accessibility is part of product quality.

---

# 21. APPLICATION STATES

Every important interface must consider:

- Loading
- Empty
- Error
- Success
- Disabled
- Permission denied
- Expired
- Missing
- In review
- Blocked

Do not design only the happy path.

---

# 22. DATABASE AND API

Database models must represent actual business relationships.

Core entities:

- User
- Organization
- Membership
- Assessment
- AssessmentQuestion
- AssessmentResponse
- Risk
- RiskAction
- Task
- Document
- Evidence
- AuditLog

Potential API domains:

`/api/auth`

`/api/organizations`

`/api/dashboard`

`/api/assessments`

`/api/risks`

`/api/tasks`

`/api/documents`

`/api/compliance-score`

`/api/audit-log`

Business logic must not depend on frontend assumptions.

---

# 23. DEMO DATA

Demo environments must contain coherent relational data.

Example:

Organization:
Acme Tecnologia Ltda.

Example state:

- Compliance Score: 74
- 22 risks
- 3 critical pending risks
- 27 tasks
- 18 documents

These numbers are illustrative.

The score must correspond logically to the underlying data.

Never fake metrics in a way that breaks trust when the user explores the system.

---

# 24. AGENT TEAM

The project uses specialized AI agents.

Team:

1. Orchestrator
2. Product Strategist
3. Compliance Researcher
4. UX/UI Engineer
5. Senior Software Engineer
6. QA & Security Engineer
7. Marketing & Growth

Hierarchy:

User
↓
Orchestrator
↓
Specialized Agents

The Orchestrator coordinates the system.

Specialized agents must remain within their domain.

---

# 25. AGENT RESPONSIBILITIES

### Orchestrator

Owns:

- Coordination
- Architecture governance
- Prioritization
- Delegation
- Dependencies
- Conflict resolution
- Final review

### Product Strategist

Owns:

- Product strategy
- ICP
- JTBD
- Prioritization
- MVP
- Monetization
- Product metrics

### Compliance Researcher

Owns:

- Regulatory research
- Legal-source verification
- Compliance interpretation
- Regulatory mapping
- Compliance safety

### UX/UI Engineer

Owns:

- UX
- UI
- Design system
- Interaction
- Information architecture
- Responsive behavior
- Accessibility
- Motion

Must follow `.claude/brand-system.md`.

### Senior Software Engineer

Owns:

- Architecture implementation
- Frontend
- Backend
- Database
- API
- Authentication
- Authorization
- Integrations

### QA & Security Engineer

Owns:

- Testing
- Security
- Threat modeling
- Reliability
- Regression
- Quality gates

### Marketing & Growth

Owns:

- Positioning
- Messaging
- GTM
- Content
- Acquisition
- Conversion
- Growth experiments
- Brand consistency

### Ownership clarifications

- **Pricing and monetization** are decided by the Product Strategist. Marketing communicates pricing; it does not set it.
- **Positioning and messaging** are owned by Marketing & Growth, within the boundaries of `.claude/brand-system.md`.
- **All `.tsx`, `.ts`, `.py` and schema files are written by the Senior Software Engineer.** The UX/UI Engineer specifies, reviews and approves anything that affects appearance or interaction; it does not fork the implementation.
- **Assessment content** (questions, help text, risk-derivation rules, sources) is a versioned artifact in `docs/regulatory/`. Product Strategist owns scope, Compliance Researcher owns sources and classification, UX/UI Engineer owns final wording. Nothing enters the seed without all three.
- **Human legal review** is a mandatory gate before any regulatory content or compliance-related UI copy is released to real customers. It is not an agent; the Orchestrator must schedule it and record it in `docs/decisions.md`.

---

# 25A. EXECUTION ENVIRONMENT RULES

These rules exist because the Claude Code environment may contain global agents and skills that are not governed by this project.

### Agents

- The Orchestrator role is executed by the **main session**, which reads `.claude/agents/orchestrator.md` at the start of significant work. Subagents cannot delegate, so the Orchestrator must never be spawned to coordinate.
- Use only the project agents in `.claude/agents/` for Compliance OS work: `product-strategist`, `compliance-researcher`, `ux-ui-engineer`, `senior-software-engineer`, `qa-security-engineer`, `marketing-growth`, and `orchestrator` (review only).
- Global agents that may exist in the user's environment (for example `backend-senior`, `frontend-senior-uxui`, `database-architect`, `devops-engineer`, `code-reviewer`) are **not** governed by this file, do not know the brand system and must not be used for Compliance OS tasks. If one is used deliberately, its prompt must instruct it to read `.claude/CLAUDE.md` and `.claude/brand-system.md` first, and its output must be reviewed by the corresponding project agent.

### Skills

- Skills whose purpose is generic aesthetics or template-driven UI — including but not limited to `elite-frontend-dev`, `elite-frontend-react`, `ui-ux-pro-max`, `senior-product-designer`, `frontend-design`, `ui-styling`, `conversion-rate-optimization-expert`, `banner-design`, `design`, `design-system`, `brand` — **must not be invoked** for Compliance OS product or marketing work. Their defaults (glassmorphism, gradients, scroll storytelling, neon, generic SaaS layouts, forced stack versions) conflict with `.claude/brand-system.md §39` and with §14–§16 of this file.
- Visual and interaction decisions come from `.claude/brand-system.md` and the UX/UI Engineer, never from a skill's built-in style library.
- Skills that are tooling-neutral (file handling, code review, documents, spreadsheets) may be used when they do not impose design or stack opinions.

### Versions

- Framework versions are pinned in §12 (decision D18). Skills or agents that force a different major version are overridden by §12.

---

# 26. FEATURE DEVELOPMENT LIFECYCLE

No significant feature should jump directly from idea to implementation.

Preferred flow:

1. Define problem
2. Validate value
3. Research compliance implications
4. Define requirements
5. Define UX
6. Define architecture
7. Implement
8. Test
9. Security review
10. Validate UX
11. Validate performance
12. Review
13. Release

Not every tiny change requires the full lifecycle.

The Orchestrator determines the appropriate level of process.

---

# 27. MVP DISCIPLINE

The MVP must remain focused.

Before accepting a feature, evaluate:

- Does it solve a real user problem?
- Does it support the core workflow?
- Does it improve activation?
- Does it improve retention?
- Does it improve commercial value?
- Does it create unnecessary complexity?
- Does it introduce compliance or security risk?
- Can it be deferred?

If a feature does not strengthen the core product, challenge it.

---

# 28. CHANGE IMPACT ANALYSIS

Before changing an important architecture or product decision, consider impact on:

- Database
- API
- Authentication
- Authorization
- Multi-tenancy
- Security
- Compliance logic
- UX
- Design system
- Performance
- Testing
- Existing users
- Future scalability

Never make isolated changes that silently break another domain.

---

# 29. QUALITY GATES

Before considering work complete:

### Product

- Requirement satisfied
- User value clear
- Scope controlled

### Engineering

- Typecheck passes
- Lint passes
- Build passes
- Tests pass
- Migrations verified

### Security

- Authorization verified
- Tenant isolation verified
- Input validation verified
- Sensitive data protected

### UX

- Responsive
- Accessible
- Loading states
- Error states
- Empty states
- Success feedback

### Performance

- No unnecessary heavy dependencies
- No obvious bundle problems
- No unnecessary network requests
- Mobile performance considered

### Brand

- Consistent with `.claude/brand-system.md`
- No generic AI visual drift
- Typography and color usage consistent

---

# 30. COMMUNICATION STANDARD

Agents must communicate with:

- Context
- Decision
- Reason
- Impact
- Next step

Avoid vague statements such as:

"Looks good."

"Should work."

"Probably fine."

Prefer:

"Implemented X because Y. This affects Z. Validation completed through A/B/C."

---

# 31. NO FALSE COMPLETION

Never claim something is:

- Implemented
- Tested
- Secure
- Compliant
- Production-ready
- Deployed

unless there is evidence.

If something was not verified, say so.

If a test was not run, do not imply that it passed.

If an assumption was made, label it.

---

# 32. CORE PRODUCT PRINCIPLE

Compliance OS should never make compliance feel more complicated than it already is.

The product exists to transform:

Complexity
→ Clarity

Risk
→ Priority

Priority
→ Action

Action
→ Evidence

Evidence
→ Confidence

The final experience should make the customer think:

"I finally know where I stand, what I need to fix, and how to prove it."

That is the product.
