# COMPLIANCE OS — APPLICATION SHELL (v1)

Authority: `.claude/brand-system.md` (§ cited), `.claude/agents/ux-ui-engineer.md`, `docs/design/tokens.md`.
Decisions applied: D7 pt-BR, D9 (Evidence attached to Actions/Risks; Documents = SHOULD), D10 (score lives in Visão geral), D15 (no logo asset), D16 (no dark mode), D22 (CSS motion).
Scope: the authenticated application frame only. No marketing page. No product data — every module renders its empty state in Phase 1.

---

## 1. Navigation (§55, UX §11)

Brand §55 lists nine modules. The MVP nav shows **seven**, ordered by "what requires attention → what requires action → what needs monitoring" (UX §11):

| Order | pt-BR label (§55) | Route | Why in MVP nav |
|---|---|---|---|
| 1 | Visão geral | `/` | command center; score + breakdown live here (D10) |
| 2 | Diagnóstico | `/diagnostico` | the entry point of the loop |
| 3 | Riscos | `/riscos` | what requires attention |
| 4 | Ações | `/acoes` | what requires action |
| 5 | Documentos | `/documentos` | SHOULD module; present in nav from Phase 1 with an empty state so the IA is stable — the engineer must not build the module |
| 6 | Histórico | `/historico` | audit log (read-only, OWNER/ADMIN per D8 draft) |
| 7 | Configurações | `/configuracoes` | organization, members |

Removed from top-level (merged, not deleted): **Evidências** — evidence is attached to actions and risks (D9); a standalone list would mirror a database table (UX §11). **Score de Compliance** — the score and its explanation are the top of Visão geral (D10, UX §13); a separate page would duplicate it. Both can return as top-level items if user research shows the need; routes are reserved (`/evidencias`, `/score`).

Nav items are concept names, never entity names (no "Tasks", no "Assessments").

## 2. Layout

Breakpoints (Tailwind 4 defaults): `sm 640`, `md 768`, `lg 1024`, `xl 1280`.

**Desktop (≥ lg):** left sidebar 248px, `--color-surface-elevated` background, 1px right border. Top of sidebar: wordmark (see §3) at 24px height inside a 56px row. Below: nav list (item height 40px, padding 8/12, icon 20px + label `--text-body-sm` 500 when active / 400 inactive, active indicator 2px `--color-electric-blue` on the left edge, hover `#EBEBE7`). The sidebar is viewport-height and sticky (`position: sticky; top: 0; height: 100dvh`), so its bottom is always on screen regardless of page length (revised 2026-09-17 after the footer was found at the bottom of long pages). **Organization block** directly under the wordmark (`Building2` + name on `--color-surface-base`, the switcher when there are several memberships): context comes first. Nav scrolls on its own if needed. **Account block** at the bottom (`components/shell/account-block.tsx`): initials avatar, name, role label, a `Settings` icon link to Configurações, the theme control (Claro · Escuro · Sistema with labels) and the exit icon — nothing about the account is ever below the fold. Collapsed state: 64px, icons only with `title`; persisted in `localStorage` (convenience only).

Main column: top bar 56px with page title (`--text-h1` reduced to 24px in the bar on lg, 32px in-page on xl — engineer picks one; recommended: title lives in the page, not the bar, and the bar holds only breadcrumb + primary action slot). Content container max-width 1200px, padding 32px (lg) / 24px (md). Page sections spaced 32px.

**Tablet (md–lg):** sidebar collapsed by default (64px); everything else as desktop with 24px padding.

**Mobile (< md):** no sidebar. Top bar 56px: wordmark left, `PanelLeft` button right opening a **drawer** (full-height, 280px, `--shadow-modal`, focus-trapped, `Escape` closes, background scroll locked). A bottom bar is rejected for MVP: seven items do not fit and the primary action must stay visible. Primary page action becomes a full-width button at the top of the content, not a floating button. Padding 16px.

## 3. Wordmark without logo (D15, §7)

The approved symbol is not in the repository. Until it is:
- Render the text **"Compliance OS"** in Inter 600, 16px, tracking −0.01em, `--color-text-primary`. No icon, no invented mark, no shield/lock/check (§7 prohibited uses, §20).
- Reserve a 24×24px slot to the left of the text (min symbol size §7) rendered as empty space, so adding the SVG later does not reflow the sidebar.
- Favicon: none in Phase 1 (do not generate a placeholder that could be mistaken for the brand).

## 4. Page template

```
[breadcrumb / section eyebrow  --text-label]           [primary action — one per page (§41)]
Page title  --text-h1
Optional one-line description  --text-body  --color-text-secondary
──────────────────────────────── 32px
Content: cards (border, no shadow) or a table container (elevated surface, 8px radius)
```
Secondary actions go into an overflow menu or as secondary/tertiary buttons to the left of the primary. Destructive actions never sit next to the primary.

## 5. States (§44–§46, UX §19–§21)

Empty states are the Phase 1 deliverable for every module. Structure: title (`--text-h3`), one guiding sentence (`--text-body`, secondary), one CTA (primary, or secondary when the action belongs to another module). No illustration. Vertical padding 64px, centered, max-width 480px.

| Module | Title | Sentence | CTA |
|---|---|---|---|
| Visão geral (no assessment) | Sua visão geral ainda está vazia. | Comece pelo diagnóstico para identificar os primeiros riscos e gerar seu score. | Iniciar diagnóstico → `/diagnostico` |
| Diagnóstico | Nenhum diagnóstico iniciado. | Responda às perguntas por seção. Você pode parar e continuar depois; o progresso é salvo. | Iniciar diagnóstico |
| Riscos | Nenhum risco registrado. | Conclua o diagnóstico para identificar os primeiros riscos, ou registre um risco manualmente. | Ir para o diagnóstico (secondary) · Registrar risco (primary — disabled in Phase 1 with tooltip "Disponível em breve") |
| Ações | Nenhuma ação planejada. | As ações nascem dos riscos: cada risco aberto pode gerar ações com responsável e prazo. | Ver riscos |
| Documentos | Nenhum documento organizado. | Centralize políticas, procedimentos e evidências com data de validade e responsável. | Adicionar documento (disabled in Phase 1) |
| Histórico | Nenhuma atividade ainda. | Alterações em riscos, ações, documentos e membros aparecem aqui com data e autor. | — |
| Configurações | — (form page, not an empty state) | — | — |

Score empty state is **not** "0 / 100": show "—" with the caption "Score disponível após o diagnóstico" (D10, brand §28).

Loading: skeletons that reserve final dimensions (title 32px × 40%, rows 40px × 100% × 5). No full-screen spinners. Route-level `loading.tsx` per module.

Error copy pattern (§46): never blame the user; state what did not happen and that existing data is intact; offer retry.
- Save failed: "Não foi possível salvar esta alteração. Tente novamente — seus dados anteriores não foram alterados."
- Load failed: "Não foi possível carregar esta página. Verifique sua conexão e tente novamente."
- Permission denied (UX §33): "Você não tem permissão para acessar esta área. Fale com um administrador da organização."
- Session expired: "Sua sessão expirou. Entre novamente para continuar."
- Offline: "Você está offline. As alterações serão possíveis quando a conexão voltar."
- Save success (toast, 3 s): "Alteração salva."
- Action completed (toast): "Ação concluída. O score será atualizado."
- Generic 404: "Esta página não existe ou foi movida."

## 6. Tables (§43, UX §32)

Desktop: sortable header (`--text-label`), 44px rows, zebra off, hover `#EBEBE7`, status column as badge (label + icon), owner as name (no e-mail for VIEWER, D8), deadline in `dd/mm/yyyy` tabular, overdue in `--color-danger-text` with `Clock` icon, primary row action as a tertiary link at the row end. Pagination: 25 per page, "Mostrando 1–25 de 120".

Mandatory columns — Riscos: Severidade · Risco · Responsável · Prazo · Status. Ações: Ação · Risco relacionado · Responsável · Prazo · Status.

Mobile (< md): rows become stacked cards: line 1 title + status badge; line 2 owner · deadline; severity icon leading. No horizontal scroll. Filters collapse into a "Filtrar" sheet.

## 7. Accessibility checklist (§49, UX §24)

- Landmarks: `header`, `nav aria-label="Principal"`, `main`, `footer` (none needed in MVP); skip link "Ir para o conteúdo" as first focusable element.
- Focus order: skip link → wordmark → nav → primary action → content. Drawer traps focus; returns focus to the toggle on close.
- Every icon-only control has `aria-label`; decorative icons `aria-hidden`.
- Touch targets ≥ 44px; nav items 40px tall with 4px gap (acceptable: the whole row is the target).
- Contrast per `tokens.md` (all text ≥ 4.5:1; focus ring 4.37:1).
- `prefers-reduced-motion`: drawer and badge transitions become instant.
- Language: `<html lang="pt-BR">`; dates via `Intl.DateTimeFormat("pt-BR")`.

## 8. Copy tone (§56–§59)

Short, operational, no fear. Preferred verbs: identificar, priorizar, registrar, concluir, comprovar, acompanhar. Avoid: "garantir conformidade", "100%", "automático", "revolucionário". Numbers before words: "3 riscos críticos precisam de atenção", not "Existem alguns riscos críticos".

## 9. Performance constraints for the engineer (§36, CLAUDE.md §15)

- Layout and every module page are **server components**. Client boundary only: nav drawer/collapse toggle, user menu, toasts.
- Icons: individual imports from `lucide-react`, ≤ 16 icons in the shell bundle.
- Fonts: `next/font/google` Inter, latin subset, weights 400/500/600, `display: swap`.
- No images, no illustrations, no chart library, no Framer Motion (D22), no shadcn install in this run (add components one by one when a module needs them, re-tokenized to `tokens.md`).
- Budget: shell route First Load JS ≤ 130 kB (baseline is 103 kB with an empty page); the engineer reports the `next build` table.

## 10. What the engineer implements now (Phase 1, run 2)

1. `globals.css` `@theme` from `tokens.md` §9; base styles (body, focus-visible, reduced-motion).
2. `next/font` Inter wired to `--font-sans`.
3. `src/app/(app)/layout.tsx` with sidebar/top bar/drawer per §2–§3; `src/components/shell/*` (Sidebar, NavItem, TopBar, MobileDrawer as the only client component, OrgSwitcher placeholder, UserMenu placeholder).
4. Seven routes with the empty states of §5 and `loading.tsx` skeletons; a shared `EmptyState` and `PageHeader` component.
5. No auth, no data fetching: the organization name is a hard-coded placeholder string "Organização" until Phase 2 — clearly marked `// Phase 2: from session`.
6. Evidence: `next build` table, lint/typecheck/test green, a keyboard-only walkthrough note (skip link → nav → content) and a mobile screenshot or DOM check of the drawer.
