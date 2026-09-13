# COMPLIANCE OS — DESIGN TOKENS (v1, light mode)

Authority: derived strictly from `.claude/brand-system.md`; section numbers cited as §n.
Decisions applied: D7 (pt-BR), D14 (text-safe variants), D16 (no dark mode in MVP), D22 (CSS-first motion).
Implementation target: Tailwind CSS 4 `@theme` in `apps/web/src/app/globals.css`. The engineer implements from this file without inventing values.

Contrast figures below were computed with the WCAG 2.x relative-luminance formula (script in the Orchestrator's Phase 1 log) and rounded to two decimals. AA thresholds: 4.5:1 normal text, 3.0:1 large text (≥ 24px regular / ≥ 18.66px bold) and non-text UI.

---

## 1. Color — core and neutrals (§8, §10)

| Token | Value | Role (brand) | Use |
|---|---|---|---|
| `--color-obsidian` | `#0B0D0F` | Authority / Foundation | primary text, dark surfaces, secondary button |
| `--color-off-white` | `#F4F4F0` | Clarity / Canvas | page background (`--color-surface-base`) |
| `--color-electric-blue` | `#356AE6` | Control / Action | primary button fill, focus ring, active nav indicator, progress fill |
| `--color-surface-base` | `#F4F4F0` | §10 | body background |
| `--color-surface-elevated` | `#FFFFFF` | §10 | cards, tables, inputs, popovers |
| `--color-border` | `#D9D9D3` | §10, §18 | 1px structural borders (1.29:1 vs base — decorative only; never the sole boundary of an interactive element) |
| `--color-text-primary` | `#0B0D0F` | §10 | 17.66:1 on base |
| `--color-text-secondary` | `#52575C` | §10 | 6.62:1 on base, 7.30:1 on white — **default for Label 12px and Caption 11px** |
| `--color-text-muted` | `#73787D` | §10 | 4.04:1 on base — **only** for text ≥ 24px / ≥ 18.66px bold, placeholders, or non-text UI. Never for Label/Caption. |

Color ratio guidance (§11): ≈70% neutral / 20% obsidian surfaces / 10% blue + semantic. Blue must have a reason (§12).

## 2. Color — semantic (§9) and text-safe variants (D14)

The official semantic colors are **fills**: icons, progress segments, large numbers, borders, button backgrounds with white text. As *text on light surfaces* they fail AA (Success 2.91, Warning 2.21, Danger 3.49, Electric Blue 4.37 on Off-white). Each therefore gets a `-text` variant (official hue mixed toward Obsidian) and a `-tint` background (official hue at 10% on white) for badges and inline alerts. These are design-system extensions under §75, not new brand colors: the official hex remains the identity; the variants exist only to meet §49.

| Family | `-fill` (official) | `-text` | `-tint` | `-border` | `-text` on base | `-text` on white | `-text` on `-tint` |
|---|---|---|---|---|---|---|---|
| info / blue | `#356AE6` | `#3264D9` | `#EBF0FC` | `#AEC3F5` | 4.81 | 5.30 | 4.65 |
| success | `#28A36A` | `#207C52` | `#EAF6F0` | `#A9DAC3` | 4.68 | 5.16 | 4.66 |
| warning | `#D99A2B` | `#8F6721` | `#FBF5EA` | `#F0D7AA` | 4.61 | 5.08 | 4.69 |
| danger | `#D95757` | `#B44A4A` | `#FBEEEE` | `#F0BCBC` | 4.74 | 5.23 | 4.62 |

Token names: `--color-{info|success|warning|danger}-{fill|text|tint|border}`. `--color-info-fill` aliases `--color-electric-blue`.

Rules:
- Text under 24px (or under 18.66px bold) in a semantic color **must** use `-text`. Applies to badges, table status cells, inline messages, links.
- `-fill` may be used for text only at ≥ 24px regular / ≥ 18.66px bold (e.g., a large score delta), where 3.0:1 applies. On Off-white: blue 4.37 passes, danger 3.49 passes, **success 2.91 and warning 2.21 fail even as large text** — any success/warning text, at any size, uses `-text`.
- Badge anatomy: `-tint` background, `-border` 1px, `-text` label, optional 16px icon in `-text`. Never color-only (§49, brand §29): every status badge carries a text label and, for risk severity, an icon.
- Links: `--color-info-text`, underlined (`text-decoration-thickness: 1px; text-underline-offset: 2px`). Hover: `--color-electric-blue`. Visited: no change.
- Primary button: `--color-electric-blue` background, white text (4.82:1). Hover: `#3263D5` (blue mixed 8% toward obsidian; white on it 5.41:1). Active: `#2E5BC4` (16%; 6.16:1). Disabled: 40% opacity, no hover.
- Secondary button: Obsidian outline 1px, Obsidian text on elevated surface. Tertiary: text-only in `--color-info-text`. Destructive: `--color-danger-fill` background with white text (3.85:1 — **passes only as large/bold text**; therefore destructive buttons use `--color-danger-text` `#B44A4A` as background → white on it = 5.23:1).

## 3. Typography (§13–§15)

Decision for the app: **Inter only**. Geist stays for marketing/presentations (§13 "Display / Brand"). Rationale: one family removes ~40–80 KB of font payload per route on low-end devices (§36, CLAUDE.md §15); the score number set in Inter 600 with tight tracking satisfies "precise and editorial" (§15). If the brand owner wants Geist for the score digit, load it as a single subset weight 600, digits-only unicode-range — a later decision, not MVP.

Loading: `next/font/google` Inter, `subsets: ["latin"]`, weights 400/500/600 (700 only if a real need appears — §15 "avoid excessive bold"), `display: "swap"`, exposed as `--font-sans`.

Scale tokens (px / line-height / tracking / weight). App uses the rows marked A; M = marketing only.

| Token | Size | LH | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `--text-display-xl` (M) | 72 | 1.0 | −0.03em | 600 | hero |
| `--text-display-l` (M) | 64 | 1.05 | −0.03em | 600 | hero |
| `--text-h1` (A) | 32 | 1.18 | −0.02em | 600 | page title (brand H3 size; brand H1 48px is marketing-scale) |
| `--text-h2` (A) | 24 | 1.25 | −0.02em | 600 | section title |
| `--text-h3` (A) | 18 | 1.4 | −0.01em | 600 | card / group title |
| `--text-score` (A) | 48 | 1.0 | −0.03em | 600 | score number on Visão geral, tabular-nums |
| `--text-body-lg` (A) | 18 | 1.55 | 0 | 400 | intro paragraphs, help text in Diagnóstico |
| `--text-body` (A) | 16 | 1.5 | 0 | 400 | default |
| `--text-body-sm` (A) | 14 | 1.45 | 0 | 400/500 | tables, secondary UI |
| `--text-label` (A) | 12 | 1.3 | +0.04em uppercase | 500 | eyebrow labels, column headers |
| `--text-caption` (A) | 11 | 1.3 | 0 | 400 | metadata, timestamps |

`font-variant-numeric: tabular-nums` on score, tables and any column of numbers/dates.

## 4. Spacing, radius, borders, shadows (§16–§19)

- Spacing scale (4px base): `--spacing-1..32` mapped to 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128. Dense UI 8–24; section gaps 40–96 (app uses 24–48 between page sections).
- Radius: `--radius-sm 4px` (tags, checkboxes), `--radius-md 6px` (inputs, buttons), `--radius-lg 8px` (cards, table containers), `--radius-xl 12px` (dialogs, drawers), `--radius-2xl 16px` (reserved), `--radius-pill 9999px` (status badges only — §17 "avoid making every component pill-shaped").
- Borders: 1px solid `--color-border`. Hierarchy comes from spacing → typography → contrast → surface → border, in that order (§18). No 2px borders except focus.
- Shadows (§19): exactly two. `--shadow-popover: 0 4px 12px rgb(11 13 15 / 0.08), 0 1px 2px rgb(11 13 15 / 0.06)` for dropdowns/popovers/toasts; `--shadow-modal: 0 16px 40px rgb(11 13 15 / 0.16)` for dialogs/drawers. Cards have **no** shadow — border + surface only.

## 5. States, focus, interaction (§44, §49)

- Focus: `outline: 2px solid var(--color-electric-blue); outline-offset: 2px;` on every interactive element, via `:focus-visible` (4.37:1 non-text ≥ 3.0 ✓). Never remove outlines.
- Hover on surfaces: background `#EBEBE7` (off-white mixed 4% toward obsidian) for rows/nav items; no color shifts on text.
- Active nav item: `--color-electric-blue` 2px left indicator + text-primary weight 500; inactive: text-secondary weight 400.
- Disabled: 40% opacity + `cursor: not-allowed`; never hide disabled primary actions — explain why (§33 of the UX file, "show who can perform the action").
- Every status is communicated by **label + icon + color** (§49). Severity icons: see §7.
- Touch targets ≥ 44×44 px on mobile; row actions become a single overflow menu below 768px.

## 6. Motion (§31–§36, D22)

CSS only. Tokens: `--duration-fast 150ms`, `--duration-base 200ms`, `--duration-slow 250ms` (interface); `--duration-complex 400ms` (state transitions such as risk → controlled, score change); `--ease-out: cubic-bezier(0.2, 0, 0, 1)`. No bounce, no parallax, no entrance animation on every element.

Allowed MVP motion, each mapped to the brand language: **Progress** (progress bar width, score number counting up ≤ 400ms), **Resolve** (status badge cross-fade 200ms when an action completes or a risk changes severity), **Layer** (drawer/dialog enter 200ms translate+opacity), **Connect** (none in MVP). `@media (prefers-reduced-motion: reduce)`: all durations → 0ms, count-up disabled.

## 7. Iconography (§20, §21)

Library: **Lucide** (`lucide-react`), stroke 1.5px (`strokeWidth={1.5}`), round caps/joins — matches §20. Import icons individually (`import { Layers } from "lucide-react"`), never the barrel. Emojis are prohibited in product UI (§21).

Shell icon set (all Lucide): Visão geral `LayoutDashboard`; Diagnóstico `ClipboardList`; Riscos `TriangleAlert`; Ações `ListChecks`; Documentos `FileText`; Histórico `History`; Configurações `Settings`; organization switcher `Building2`; user menu `CircleUser`; collapse nav `PanelLeft`.

Severity icons (risk): Critical `OctagonAlert`, High `TriangleAlert`, Medium `CircleAlert`, Low `Info`. Action status: A fazer `Circle`, Em andamento `CircleDot`, Em revisão `CircleEllipsis`, Concluída `CircleCheck`, Bloqueada `CircleSlash`. Document status: Atualizado `CircleCheck`, Vence em breve `Clock`, Vencido `CircleX`, Ausente `CircleDashed`, Em revisão `CircleEllipsis`.

Forbidden as "compliance" symbols (§20): shields, padlocks, standalone checkmark badges as brand devices. The status `CircleCheck` is a *state* icon, not a brand device — acceptable.

## 8. Dark mode (D16)

Not implemented. All color tokens are defined once on `:root`; the engineer must not hard-code hex in components, so a `[data-theme="dark"]` block can be added later with the §10 dark values without touching components.

## 9. Tailwind 4 `@theme` mapping (for the engineer)

Define the tokens above as `@theme` variables in `globals.css` using Tailwind 4 namespaces so utilities are generated: `--color-*` → `bg-`, `text-`, `border-`; `--font-sans`; `--text-*` with `--text-*--line-height`, `--text-*--letter-spacing`, `--text-*--font-weight`; `--radius-*`; `--shadow-*`; `--spacing` base 4px (Tailwind 4 derives the scale). Set `body { background: var(--color-surface-base); color: var(--color-text-primary); }`. Do not import any preset theme or shadcn "new-york" color set; shadcn components, when added, are re-tokenized to these variables.

## 10. Open points for the Orchestrator

- D15 logo: none of the above depends on it; the wordmark rule is in `app-shell.md`.
- Geist in-app for the score digit: recommended NO for MVP; brand owner may override.
- Destructive button background uses `--color-danger-text` instead of the official `#D95757` to keep white text ≥ 4.5:1 — confirm acceptable (it is a §75 extension, same hue).
