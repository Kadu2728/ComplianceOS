# COMPLIANCE OS — VISUAL SYSTEM v2 (app shell + Visão geral)

Status: SPEC — ready for implementation (Senior Software Engineer). Author: UX/UI Engineer, 2026-09-26.
Authority: owner decision of 2026-09-26 (official references `dashboard.png` + `tipografia.png`; palette, dark default, search + bell, pt-BR nav, Inter only). To be recorded by the Orchestrator as **D39**; `.claude/brand-system.md` §8–§10, §13–§14, §17, §41, §80 must be updated from §2 of this file (list in §8.4).
Scope: authenticated app (`app/(app)`, `app/(auth)`, `app/(public)`), shell and Visão geral. Landing: font switch only (§2.8).
Supersedes for the app: `tokens.md` §1–§4, §5 (focus/hover/nav values), §8 (dark values) and `app-shell.md` §2–§3. `tokens.md` stays the source for the **legacy** values pinned in the landing scopes.

Contrast figures: WCAG 2.x relative-luminance formula, rounded to two decimals, **computed by hand in this session (no script was run)**. §7.3 asks the engineer to pin them in a unit test. AA thresholds are 4.5:1 for normal text, 3.0:1 for large text (≥ 24px, or ≥ 18.66px bold) and 3.0:1 for non-text UI.

---

## 0. Decisions in one screen

| # | Decision | Why |
|---|---|---|
| 1 | Canonical palette: Dark `#0B0F14`, Surface `#111827`, Border `#1F2937`, Primary `#06B6D4`, Success `#10B981`, Warning `#F59E0B`, Error `#EF4444`. All other values are derived steps from the same family. Every canonical value except Dark is a Tailwind 500/900/800 step, so the derived steps use that scale too. | Owner decision. The derived steps give AA text and state variants. |
| 2 | **Dark is the default.** A v2 light variant exists, and Light / Dark / System stay (D16). | Owner decision. |
| 3 | Cyan (`primary`) means **"you can act here / you are here"**: buttons, links, active nav, focus, selection, progress. Teal (`score`) means **"level of control"**: the score ring, the trend line, and the "low" end of the severity ramp. | This keeps two accent hues with two distinct meanings (brand §12, "color must mean something"). Teal is the reference's own ring colour, not an invented hue. |
| 4 | Bright fills carry **dark text** (`#0B0F14`): primary button, destructive button, count badge. | White on `#06B6D4` is 2.43:1 and white on `#EF4444` is 3.76:1, so both fail AA. Dark text gives 7.92:1 and 5.11:1. |
| 5 | Severity has its own ramp: critical red, high orange, medium yellow, low teal. It is always shown with a label, plus an icon in badges. | These are the reference's dots. Status tones (info/success/warning/danger) stay separate. |
| 6 | Inter only, app and landing. Scale in §2.4. | Owner decision. It also removes the Geist payload from the landing. |
| 7 | Shell: sidebar 240px at ≥ 1024. Below 1024, a top bar plus drawer. Below 768, a bottom tab bar (Início, Riscos, Ações, Mais). | Reference phone mockup. At 768–1023 a 240px sidebar would leave ≤ 528px for content. |
| 8 | First fold follows the reference. The third card of row 1 becomes **"Próximo passo"** instead of a duplicate Risk Brain card. | The dashboard must answer "what should I do next?" (CLAUDE.md §4, UX §12). The reference shows Risk Brain twice. |

---

## 1. Visual analysis of the references

Measurements from `dashboard.png`: the screen spans x 88–1470 px (1382 px), read as a 1440px design (scale ≈ 0.96, figures below already converted). `tipografia.png` is a presentation board; only its labelled values are canonical.

### 1.1 Layout grid (dashboard, 1440 × 900)

| Element | Measured | v2 value |
|---|---|---|
| Sidebar width | ≈ 231 | **240** |
| Sidebar logo row | ≈ 38 tall content, aligned with the header search | row **64** |
| Nav item | ≈ 203 × 37.5, radius ≈ 8, pitch ≈ 40.6 | **40** tall, radius **8**, gap **2** (pitch 42) |
| Header | search ≈ 621 × 38.5; icon pitch ≈ 52; avatar ≈ 37.5 | header **64**, search **40** tall, max **600** wide; icon buttons **40** |
| Content box | x 340 → 1432 ≈ 1136 wide | content **1136** at 1440 (= 1440 − 240 − 2 × 32) |
| Greeting | ≈ 25px semibold; subtitle ≈ 13.5 | H1 **28/600**; subtitle **14** |
| Row 1 | 230 tall; widths 610 / 256 / 223; gaps ≈ 23 | 12-col grid, **6 / 3 / 3**, gap **24** |
| Score ring | outer ≈ 158, stroke ≈ 13.5; numeral ≈ 52 | ring **160**, stroke **12**; numeral **56** |
| Trend chart | plot ≈ 287 × 88, x labels below | plot **fluid × 120** + 20 axis |
| Risk rows | pitch ≈ 40.6, dot ≈ 12 | row **40**, dot **10** |
| Module cards | 6 across, ≈ 180 × 140, gap ≈ 20 | 6 across at ≥ 1440, min-height **168**, gap **24** |
| Row 3 | 191 tall; 578 / 546; category rows ≈ 34, action rows ≈ 49 | **6 / 6**; category rows **40**, action rows **52** |
| Card radius | ≈ 10–12 | **12** |
| Card padding | ≈ 22 | **24** (module cards **20**) |
| Status pills | ≈ 21 tall, full radius | **24**, pill |

### 1.2 Density, surfaces, borders, depth

- **Density** is comfortable-dense: 24px card padding, 40px rows, one idea per card. Hierarchy comes from surface steps (page < card) and type weight, not from shadows.
- **Surfaces:** page and sidebar share one colour; cards are one step lighter. There is a 1px border on cards, the sidebar's right edge and the search field. The render tints everything teal-navy (page ≈ `#010D16`, card ≈ `#001321`). That tint is AI rendering; the canonical Surface `#111827` wins (§9 D-17).
- **Shadows:** none visible on cards. The glow on card edges and icon tiles is rendering. In v2, glow exists **only on the score ring** (dark theme).
- **Radius:** 8 for controls and nav items, 12 for cards, pill for statuses and tags. It is moderate, not "pillowy" (brand §17 still holds).
- **Gradients:** only the trend-chart area fill (vertical, fading to transparent). No other gradients.
- **Iconography:** outline icons, round caps, about 1.5px at 20px. **Lucide at `strokeWidth={1.5}` matches**, so the family is kept. The sheet's shield icons ("Risco", "Compliance Room") are **not** adopted, because brand §20 forbids shields as compliance symbols (§9 D-20).
- **Typography:** Inter throughout. Headings are semibold with slight negative tracking (−1.2%), and numerals are large and tabular.

### 1.3 The sheet (`tipografia.png`)

- **Type:** H1 Bold 56/−1.2%, H2 Semibold 40/−1.2%, H3 Semibold 28/−1.2%, Body Regular 16/1.6, Caption Medium 14/1.4. These are brand/marketing sizes; the app scale in §2.4 is derived from them plus the dashboard measurements.
- **UI elements:** primary button (cyan fill, dark text, trailing arrow); outline button (cyan 1px border, light text); search input; outline tags (LGPD, Risco…); phone mockup (top bar, score card, risks list, bottom tabs Início · Riscos · Ações · Mais); list item with status pill and relative time; upload progress bar (cyan, "60%"); toast "Ação concluída com sucesso!".
- **Not product UI (excluded):** "Outras páginas (exemplos)", "Detalhes que fazem diferença", "Elementos visuais", "Sensação da marca", and the "Status: Tudo funcionando" card (no such system status exists).

---

## 2. Tokens v2

### 2.1 Where values live (Tailwind 4, `apps/web/src/app/globals.css`)

The engineer's current structure is kept:

| Block | Role |
|---|---|
| `@theme { … }` | **App light v2.** Also the default values for non-colour tokens. |
| `html[data-theme="dark"] { … }` | **App dark v2** (the default theme). Wrap it in `@media screen { … }` so printing (`/resumo` is print-friendly) always uses the light values. |
| `.theme-light { … }` | **Landing, legacy light.** Brand v1 values from `tokens.md`. Frozen. |
| `.theme-dark { … }` | **Landing, legacy dark.** Frozen. |
| `.landing { … }` (new) | Pins the **non-colour** legacy tokens (radius, app type scale, shadows) so the app changes cannot reflow the landing (§2.8). |

Rules:
- Every colour token in the dark block also appears in the other three blocks. `globals-theme.test.ts` already enforces this.
- Write **hex values in every block, never `var()` aliases.** A `var()` resolves at `:root`, so `.theme-light` subtrees would inherit the app value.
- Core brand v1 tokens (`--color-obsidian`, `--color-off-white`, `--color-electric-blue`) stay in `@theme`, but only the landing may use them.

### 2.2 Colour tokens (full table)

`--color-<name>`. Values: app dark (default) · app light · `.theme-light` (legacy) · `.theme-dark` (legacy).

| Token | App dark | App light | Legacy light | Legacy dark | Role |
|---|---|---|---|---|---|
| `surface-base` | `#0B0F14` | `#F5F7FA` | `#F4F4F0` | `#0B0D0F` | page, sidebar, header, tab bar |
| `surface-elevated` | `#111827` | `#FFFFFF` | `#FFFFFF` | `#111416` | cards, inputs, popovers, drawer |
| `surface-hover` | `#18212F` | `#EEF1F5` | `#EBEBE7` | `#161A1D` | row/nav hover, neutral pill, skeleton |
| `border` | `#1F2937` | `#E5E7EB` | `#D9D9D3` | `#292E32` | structural 1px (decorative) |
| `border-strong` **new** | `#374151` | `#D1D5DB` | `#D9D9D3` | `#292E32` | popover/dialog edge, tags, kbd, card hover |
| `border-input` **new** | `#6B7280` | `#7D8799` | `#73787D` | `#858B91` | input/select/textarea/search boundary (≥ 3:1) |
| `text-primary` | `#F3F4F6` | `#0B0F14` | `#0B0D0F` | `#F4F4F0` | |
| `text-secondary` | `#B4BDCA` | `#4B5563` | `#52575C` | `#B7BCC1` | descriptions, inactive nav |
| `text-muted` | `#8A94A6` | `#626B7A` | `#73787D` | `#858B91` | metadata, placeholders, axis labels (AA in both v2 themes) |
| `primary` | `#06B6D4` | `#06B6D4` | `#356AE6` | `#356AE6` | primary button fill |
| `primary-foreground` | `#0B0F14` | `#0B0F14` | `#FFFFFF` | `#FFFFFF` | text on `primary` |
| `primary-hover` | `#22D3EE` | `#06A9C5` | `#3263D5` | `#3263D5` | |
| `primary-active` | `#0891B2` | `#079BB5` | `#2E5BC4` | `#2E5BC4` | |
| `primary-text` **new** | `#22D3EE` | `#0E7490` | `#3264D9` | `#B7C9FF` | links, active nav icon/label, outline-button border, progress fill, selected state |
| `primary-text-hover` **new** | `#67E8F9` | `#155E75` | `#356AE6` | `#6C93F4` | link / tertiary hover |
| `primary-tint` **new** | `#0A2D37` | `#E6F8FB` | `#EBF0FC` | `#1B2948` | active nav bg, icon tiles, avatar, `<mark>`, outline-button hover |
| `focus` **new** | `#22D3EE` | `#0E7490` | `#356AE6` | `#356AE6` | 2px focus outline |
| `on-fill` **new** | `#0B0F14` | `#0B0F14` | `#FFFFFF` | `#FFFFFF` | text on bright semantic fills (count badge, destructive button) |
| `info-fill` | `#06B6D4` | `#06B6D4` | `#356AE6` | `#6C93F4` | |
| `info-text` | `#22D3EE` | `#0E7490` | `#3264D9` | `#B7C9FF` | |
| `info-tint` | `#0A2D37` | `#E6F8FB` | `#EBF0FC` | `#1B2948` | |
| `info-border` | `#095A6A` | `#A8E5F0` | `#AEC3F5` | `#526DA9` | |
| `success-fill` | `#10B981` | `#10B981` | `#28A36A` | `#48B980` | |
| `success-text` | `#34D399` | `#047857` | `#207C52` | `#94E0B6` | |
| `success-tint` | `#0C2E28` | `#E7F8F2` | `#EAF6F0` | `#173A2B` | |
| `success-border` | `#0D5C45` | `#ABE7D3` | `#A9DAC3` | `#4B9870` | |
| `warning-fill` | `#F59E0B` | `#F59E0B` | `#D99A2B` | `#E6AD4D` | |
| `warning-text` | `#FBBF24` | `#A34C0A` | `#8F6721` | `#F3CD85` | |
| `warning-tint` | `#352912` | `#FEF5E7` | `#FBF5EA` | `#3E3018` | |
| `warning-border` | `#744F10` | `#FCDDAA` | `#F0D7AA` | `#9F7835` | |
| `danger-fill` | `#EF4444` | `#EF4444` | `#D95757` | `#E46D6D` | |
| `danger-text` | `#F87171` | `#B91C1C` | `#B44A4A` | `#FFB5B5` | |
| `danger-tint` | `#34191D` | `#FDECEC` | `#FBEEEE` | `#432425` | |
| `danger-border` | `#72272A` | `#F9BEBE` | `#F0BCBC` | `#A65D60` | |
| `sev-critical` **new** | `#EF4444` | `#DC2626` | `#D95757` | `#E46D6D` | severity dot/icon: Crítico |
| `sev-high` **new** | `#F97316` | `#EA580C` | `#D99A2B` | `#E6AD4D` | Alto |
| `sev-medium` **new** | `#FACC15` | `#A16207` | `#356AE6` | `#6C93F4` | Médio |
| `sev-low` **new** | `#2DD4BF` | `#0D9488` | `#73787D` | `#858B91` | Baixo |
| `score` **new** | `#2DD4BF` | `#0D9488` | `#356AE6` | `#6C93F4` | ring arc, trend line/area, last-point marker |
| `score-track` **new** | `#15343E` | `#E2F2F1` | `#EBEBE7` | `#161A1D` | ring track |
| `backdrop` **new** | `rgb(0 0 0 / 0.6)` | `rgb(11 15 20 / 0.4)` | `rgb(11 13 15 / 0.4)` | `rgb(11 13 15 / 0.4)` | dialog/drawer backdrop |

How the values were derived:
- **Dark tints:** the hue at 18% over `#0B0F14`.
- **Dark borders:** the hue at 45% over `#0B0F14`.
- **Light tints:** the hue at 10% over white.
- **Light borders:** the hue at 35% over white.
- **`primary-tint` = `info-tint`:** info is the primary hue.
- **Light hover/active:** the primary mixed 8% / 16% toward `#0B0F14`.
- **Light `warning-text`:** amber-700 mixed 10% toward `#0B0F14`. Plain amber-700 is 4.43:1 on `surface-hover` and fails; the mix gives 5.16:1.
- **Legacy severity values:** they reproduce the v1 badge tones (critico = danger, alto = warning, medio = info, baixo = neutral), so the landing showcases do not change.

Colour rules:
1. **Text under 24px in a semantic hue always uses `-text`.** `-fill` is for dots, icons in dark, bars and borders.
   - In **light**, `success-fill` (2.54:1) and `warning-fill` (2.15:1) fail even as non-text on white. There they are decoration only (the badge icon uses `-text`).
2. **Graphics that carry meaning** use `primary-text` in both themes (it passes 3:1 in both): progress bars, selected icons, outline borders.
3. **The primary button keeps `#06B6D4` in both themes, with dark text.** In light, its fill is 2.43:1 against white. That is acceptable, because WCAG 1.4.11 does not require a button's background to contrast when its label (7.92:1) identifies it. The focus ring provides a ≥ 3:1 boundary.
4. **Blue/cyan budget (brand §11):** cyan appears on the one primary action, the active nav item, links, focus and progress. Cards, icons at rest and headings stay neutral.

### 2.3 Chart colours

| Use | Token | Notes |
|---|---|---|
| Trend line | `score` | 2px, round caps/joins, `vector-effect: non-scaling-stroke` |
| Trend area | `score` via `<linearGradient>` | top stop opacity 0.24 (dark) / 0.14 (light), bottom 0 |
| Baseline | `border` | 1px |
| Axis labels | `text-muted` | `text-caption`, tabular |
| Last point | `score` fill, 2px ring `surface-elevated` | 8px |
| Preliminary snapshot | hollow: 1.5px `score` stroke, `surface-elevated` fill | legend "○ preliminar" |
| Score ring arc / track | `score` / `score-track` | §5.1 |
| Severity series (future) | `sev-*` | never status tones |

### 2.4 Typography (Inter only)

Loading happens in the root layout, as now:
- `next/font/google` Inter, latin subset, weights **400/500/600/700**, `display: "swap"`, variable `--font-inter`.
- 700 is used **only** by the marketing H1/H2.
- **Verify in `next build` that the number of Inter woff2 files does not grow** (Inter is variable on Google Fonts, so all weights share one file per subset). If it grows, drop 700 and use 600 for `display-xl`/`display-l`.
- Remove Geist from `app/(marketing)/layout.tsx`.

**App scale** (`@theme`; line-height / tracking / weight as Tailwind 4 sub-properties):

| Token | Size | LH | Tracking | Weight | Use | v1 → v2 |
|---|---|---|---|---|---|---|
| `--text-h1` | 28 (1.75rem) | 1.2 | −0.012em | 600 | page title ≥ 640 (greeting) | 32 → 28 |
| `--text-h1-compact` **new** | 24 (1.5rem) | 1.25 | −0.012em | 600 | page title < 640 | — |
| `--text-h2` | 20 (1.25rem) | 1.3 | −0.012em | 600 | page section titles | 24 → 20 |
| `--text-h3` | 16 (1rem) | 1.4 | −0.006em | 600 | card titles (semantic `<h2>` inside the page) | 18 → 16 |
| `--text-score` | 56 (3.5rem) | 1 | −0.024em | 600 | score numeral, ring 160 | 48 → 56 |
| `--text-score-compact` **new** | 40 (2.5rem) | 1 | −0.02em | 600 | score numeral, ring 128 | — |
| `--text-kpi` **new** | 24 (1.5rem) | 1.2 | −0.012em | 600 | KPI numerals (`Stat`, maturity ladder, document counts) | replaces the `text-h2` used for numbers |
| `--text-body-lg` | 18 | 1.6 | 0 | 400 | intro copy (Diagnóstico) | lh 1.55 → 1.6 |
| `--text-body` | 16 | 1.6 | 0 | 400 | paragraphs, input text | lh 1.5 → 1.6 (sheet Body) |
| `--text-body-sm` | 14 | 1.5 | 0 | 400 / 500 | **UI default**: nav, rows, buttons, list titles | lh 1.45 → 1.5 |
| `--text-label` | 12 | 1.35 | +0.04em, uppercase | 500 | eyebrows, group headers, column headers | lh 1.3 → 1.35 |
| `--text-caption` | 12 (0.75rem) | 1.4 | 0 | 400 | metadata, timestamps, hints, axis labels | **11 → 12** (legibility on low-end dark screens) |
| `--text-micro` **new** | 11 (0.6875rem) | 1 | 0 | 600 | bell count badge **only** | — |

Rules:
- The sheet's "Caption Medium 14/1.4" is `text-body-sm` at weight 500.
- `font-variant-numeric: tabular-nums` applies to score, KPIs, counts, dates, times and deltas.
- Weight 700 is never used in the app.

**Marketing display scale** (Inter; replaces the Geist rows). The `@utility text-hero / text-final / text-section / text-section-long` change `font-family` to `var(--font-sans)` and use these clamps:

| Token (ceiling) | Size | LH | Tracking | Weight | Fluid utility |
|---|---|---|---|---|---|
| `--text-display-xl` | 56 | 1.05 | −0.012em | 700 (sheet H1) | `text-hero`: `clamp(2.25rem, 1.2rem + 3.6vw, 3.5rem)` |
| `--text-display-l` | 48 | 1.08 | −0.012em | 700 | `text-final`: `clamp(2rem, 1.1rem + 3vw, 3rem)` |
| `--text-display-m` | 40 | 1.12 | −0.012em | 600 (sheet H2) | `text-section`: `clamp(1.75rem, 1.2rem + 1.9vw, 2.5rem)` |
| `--text-display-s` | 32 | 1.18 | −0.012em | 600 | `text-section-long`: `clamp(1.625rem, 1.2rem + 1.2vw, 2rem)` |

`--font-display` becomes `var(--font-sans)` (keep the token so existing `font-display` classes still resolve). The sheet's H3 28/600 maps to the landing card titles if the Marketing agent wants it. Not required in this task.

### 2.5 Radius, spacing, borders

- **Radius (app):**
  - `--radius-sm 4px`: kbd, checkbox, chart marker.
  - `--radius-md 8px` (was 6): buttons, inputs, search, nav items, icon tiles, menu items.
  - `--radius-lg 12px` (was 8): cards, table containers, popovers, toasts.
  - `--radius-xl 16px` (was 12): dialogs, drawer, full-screen sheets on tablet.
  - `--radius-2xl 20px`: reserved.
  - `--radius-pill`: status pills, tags, count badge, chips.
  - Nested rule: inner radius = outer − padding, never larger than the parent.
- **Spacing:** 4px base (unchanged).
  - Card padding: 24 (≥ 640) / 16 (< 640); module cards 20 / 16.
  - Grid gap: 24 (≥ 1024) / 16 (< 1024).
  - Page header → grid: 24.
  - Row insets: 12 vertical.
- **Borders:** 1px. `border` for structure, `border-strong` for floating layers and card hover, `border-input` for fields. No 2px borders except the focus outline and the radar tone accent (§5.9).

### 2.6 Shadows and glow

| Token | App dark | App light / `@theme` | `.landing` pin (legacy) |
|---|---|---|---|
| `--shadow-popover` | `0 8px 24px rgb(0 0 0 / 0.45), 0 2px 6px rgb(0 0 0 / 0.30)` | `0 8px 24px rgb(11 15 20 / 0.10), 0 2px 6px rgb(11 15 20 / 0.06)` | `0 4px 12px rgb(11 13 15 / 0.08), 0 1px 2px rgb(11 13 15 / 0.06)` |
| `--shadow-modal` | `0 24px 56px rgb(0 0 0 / 0.60)` | `0 24px 56px rgb(11 15 20 / 0.18)` | `0 16px 40px rgb(11 13 15 / 0.16)` |
| `--drop-shadow-score` **new** | `0 0 6px rgb(45 212 191 / 0.35)` | `0 0 0 transparent` | `0 0 0 transparent` |

- Cards have **no** shadow.
- Glow = `drop-shadow-score`, applied **only** to the score ring arc path, static (never animated). If the Tailwind `drop-shadow-score` utility does not re-resolve per theme, use a component class: `filter: drop-shadow(var(--drop-shadow-score))`.

### 2.7 Motion tokens (unchanged) and breakpoints

- **Motion:** `--duration-fast 150ms`, `--duration-base 200ms`, `--duration-slow 250ms`, `--duration-complex 400ms`, `--ease-out cubic-bezier(0.2, 0, 0, 1)`. `--duration-story` stays marketing-only. Usage is in §6.
- **Breakpoints:** Tailwind defaults `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`, plus **new `--breakpoint-wide: 90rem` (1440)** for the 6-across module row (`wide:` variant).

### 2.8 What the landing keeps and what it changes

- **Keeps:**
  - The palette: both legacy scopes, values as in the table.
  - Radius, app type scale and shadows: new `.landing` block, legacy values:
    ```css
    .landing {
      --radius-md: 6px; --radius-lg: 8px; --radius-xl: 12px; --radius-2xl: 16px;
      --text-h1: 2rem; --text-h1--line-height: 1.18; --text-h1--letter-spacing: -0.02em;
      --text-h2: 1.5rem; --text-h2--line-height: 1.25; --text-h2--letter-spacing: -0.02em;
      --text-h3: 1.125rem; --text-h3--line-height: 1.4; --text-h3--letter-spacing: -0.01em;
      --text-score: 3rem; --text-score--letter-spacing: -0.03em;
      --text-body-lg--line-height: 1.55; --text-body--line-height: 1.5; --text-body-sm--line-height: 1.45;
      --text-label--line-height: 1.3; --text-caption: 0.6875rem; --text-caption--line-height: 1.3;
      --shadow-popover: 0 4px 12px rgb(11 13 15 / 0.08), 0 1px 2px rgb(11 13 15 / 0.06);
      --shadow-modal: 0 16px 40px rgb(11 13 15 / 0.16);
      --drop-shadow-score: 0 0 0 transparent;
    }
    ```
  - Motion.
  - Its `Lockup` in `text-primary`.
- **Changes:** the family becomes Inter, and the display sizes follow §2.4.
- **Page chrome while the app default is dark:** add `html:has(.landing) { color-scheme: light; }` and `body:has(.landing) { background: var(--color-off-white); }`. Otherwise the page scrollbar and overscroll area turn dark.
- Showcases that embed app components (`ScoreCard`, `RadarPanel`, `PrioritiesPanel`, `RiskTable`, `Badge`, `PageHeader`) pick up any **anatomy** change (e.g., the severity badge) but keep legacy colours and sizes through the scopes.

---

## 3. Application shell

### 3.1 Breakpoint behaviour

| Width | Navigation | Header |
|---|---|---|
| < 768 | **Top bar 56** (logo left; search and bell icon buttons 44 right) + **bottom tab bar 64 + `env(safe-area-inset-bottom)`** (Início · Riscos · Ações · Mais). "Mais" opens the drawer. | inside the top bar |
| 768–1023 | **Top bar 64**: menu button 44 (opens drawer) · logo · inline search (flex, max 360) · bell 40 · avatar link 40. No tab bar. | same bar |
| ≥ 1024 | **Sidebar 240**, sticky, full viewport height | **Header 64**, sticky in the main column: search · bell · user block |
| ≥ 1920 | Sidebar stays on the left edge; content container centred, max 1440 content | header content aligned to the same container |

### 3.2 Sidebar (≥ 1024)

- **Frame:**
  - `aside`, `sticky top-0 h-dvh w-[240px]`, background `surface-base`, 1px right `border`.
  - Three zones: top (fixed), nav (scrolls if needed), bottom (fixed).
- **Logo row** (64 tall, padding-inline 24):
  - `BrandSymbol` **28px**, colour **`text-primary-text`** (cyan in dark, cyan-700 in light).
  - Then "Compliance OS" Inter **18/600/−0.012em**, `text-primary`, gap 10. The whole row is a link to `/`.
  - The real symbol replaces the mockup hexagon.
  - No glow, no gradient (brand §7). Clear space ≥ 8px.
- **Organization** (owner decision of 2026-09-17, kept):
  - `OrgSwitcher` directly below the logo, margin `0 12 12`.
  - Height 40, radius 8, background `surface-elevated`, 1px `border`.
  - `Building2` 16 in `text-muted`; name `text-body-sm` 500 `text-primary`.
  - The select keeps its current behaviour.
- **Nav** (`nav aria-label="Principal"`), padding-inline 12:

  | Group | Items (label → route · Lucide icon) |
  |---|---|
  | 1 — operate | Visão geral → `/` · `House` · Diagnóstico → `/diagnostico` · `ClipboardList` · Riscos → `/riscos` · `TriangleAlert` · Controles → `/controles` · `Layers` · Ações → `/acoes` · `ListChecks` · Documentos → `/documentos` · `FileText` |
  | 2 — prove & manage | Sala de compliance → `/sala` · `DoorOpen` (**owner only**, unchanged) · Relatórios → `/resumo` · `FileChartColumn` (verify the export name in the installed lucide-react; fallback `ChartColumn`) · Histórico → `/historico` · `History` · Configurações → `/configuracoes` · `Settings` |

  Groups are separated by a 1px `border` line with 12px margin above and below. No group labels.
- **Nav item:**
  - Layout: `h-10` (40), radius 8, padding-inline 12, gap 12. Icon 20, stroke 1.5. Label `text-body-sm`.

  | State | Background | Label | Icon |
  |---|---|---|---|
  | rest | transparent | `text-secondary` 400 | `text-secondary` |
  | hover | `surface-hover` | `text-primary` | `text-primary` |
  | active (`aria-current="page"`) | `primary-tint` | `text-primary` **500** | **`primary-text`** |
  | focus-visible | + 2px `focus` outline, offset 2 | | |

  - The v1 2px left indicator is **removed**. The active state is carried by background + icon colour + weight + `aria-current`.
  - Transition: background/colour over `--duration-fast`.
- **Bottom block** (≥ 1024), `border-t`, padding 12, one row 40 tall: `ThemeToggle labels` (left) + `LogoutButton compact` (right, 36 × 36).
  - The identity row and the Settings icon are **not** rendered here at ≥ 1024: identity is in the header user block, and Configurações is in the nav. Nothing is shown twice on one screen.
  - `AccountBlock` gets a `variant: "full" | "compact"` prop. `compact` is used in the sidebar; `full` (identity + Configurações + theme + Sair, exactly as today) is used in the drawer.
- **ThemeToggle v2:**
  - Container: 1px `border`, background `surface-elevated`, radius 8, padding 2.
  - Options: 32 tall, radius 6.
  - Selected: `primary-tint` background, `text-primary`, icon `primary-text`. Unselected: `text-secondary`; hover `surface-hover` + `text-primary`.
  - Remove `shadow-sm`.
  - The default preference is now **Escuro** (§3.7).

### 3.3 Header (≥ 1024) and top bar (< 1024)

- **Header frame:**
  - `header`, `sticky top-0 z-30`, height 64, background `surface-base`, 1px bottom `border` (solid, no blur/glass).
  - Inner container = the main container (§3.5), so the search aligns with the page content's left edge.
  - Layout `flex items-center gap-4`.
- **Search field:**
  - Width `flex-1`, `max-w-[600px]` (≥ 1280), `max-w-[480px]` (1024–1279), max 360 in the tablet top bar. Details in §5.10.
- **Right cluster** (`ml-auto flex items-center gap-2`):
  - **Bell** button 40 × 40 (§5.11).
  - **User block:**
    - A link to `/configuracoes`, height 40, radius 8, padding `0 8 0 4`, gap 10; hover `surface-hover`.
    - Avatar 32, radius pill, background `primary-tint`, initials `text-caption` 600 `primary-text` (same `initials()` as `AccountBlock`). No photos.
    - Name `text-body-sm` 500 `text-primary` (truncate, max 160).
    - Role `text-caption` `text-secondary` (`ROLE_LABEL`).
    - `ChevronRight` 16 `text-muted`.
    - Accessible name: the visible "Name Role" plus `<span class="sr-only"> — Configurações</span>`.
    - 1024–1279: avatar + chevron only; name and role are `sr-only`.
  - The mockup's third icon (square with dot) is **not** implemented (no product function).
- **Tablet top bar (768–1023):**
  - Height 64; the same classes as the header plus `Menu` 44 at the left (opens the drawer, `aria-haspopup="dialog"`).
  - Logo: symbol 24 + wordmark 16/600.
  - Then search, bell, avatar link (32-avatar only).
- **Mobile top bar (< 768):**
  - Height 56, padding-inline 16, background `surface-base`, bottom `border`, `sticky top-0 z-30`.
  - Left: logo (symbol 24 + "Compliance OS" 16/600, link `/`).
  - Right: `Search` 44 (opens the full-screen search, §5.10) and bell 44.
  - No hamburger: "Mais" in the tab bar opens the same drawer.

### 3.4 Bottom tab bar (< 768)

- **Frame:**
  - `nav aria-label="Atalhos"`, `fixed inset-x-0 bottom-0 z-30`.
  - Height 64 + `padding-bottom: env(safe-area-inset-bottom)`; background `surface-base`, top `border`.
  - Four equal columns.
- **Item:**
  - Full column × 64 (touch target ≥ 44 × 44).
  - Icon 22 (stroke 1.5) above the label `text-caption` 500, gap 4.

| Tab | Target | Icon | Active when |
|---|---|---|---|
| Início | link `/` | `House` | pathname `=== "/"` |
| Riscos | link `/riscos` | `TriangleAlert` | starts with `/riscos` |
| Ações | link `/acoes` | `ListChecks` | starts with `/acoes` |
| Mais | `button`, opens the drawer (`aria-haspopup="dialog"`, `aria-expanded`) | `Menu` | on any other route |

- **States:**
  - Rest: `text-secondary`.
  - Active: the icon sits in a 56 × 28 radius-pill `primary-tint` shape; icon `primary-text`; label `text-primary` 600; `aria-current="page"` on links. The shape change means state is never colour-only.
  - Pressed: background `surface-hover` for 150ms.
- `main` gets `padding-bottom: calc(64px + env(safe-area-inset-bottom) + 16px)` below 768.

### 3.5 Main container

`main#conteudo`:
- `mx-auto w-full max-w-[1200px] 2xl:max-w-[1504px]`.
- `px-4 sm:px-6 lg:px-8`; `pt-6 lg:pt-8`; `pb-8`, plus the tab-bar padding below 768.

Content box per width:

| Viewport | Content width |
|---|---|
| 320 / 375 / 390 / 430 | 288 / 343 / 358 / 398 |
| 768 | 720 |
| 1024 | 720 (1024 − 240 − 64) |
| 1280 | 976 |
| 1440 | 1136 |
| 1536 | 1232 |
| 1920 and up | 1440 (centred) |

### 3.6 Drawer (< 1024)

- Existing native `<dialog>`, kept. Width 300 (`max-w-[85vw]`), slides from the **left**, background `surface-elevated`, `shadow-modal`, `backdrop:bg-backdrop` (replaces `bg-obsidian/40`).
- Contents:
  - Logo row 56 with close `X` 44.
  - `OrgSwitcher`.
  - Full nav (both groups; nav items 44 tall).
  - `AccountBlock variant="full"` at the bottom.
- Focus trap, Esc, backdrop click and focus return all come from `<dialog>` and are kept.
- `::backdrop` only inherits custom properties in recent engines (Chrome 122+, Firefox 120+, Safari 17.4+). Declare a literal fallback first: `dialog::backdrop { background: rgb(0 0 0 / 0.5); }`, then the `bg-backdrop` utility. The current `bg-obsidian/40` has the same issue on older Android WebViews.

### 3.7 Theme default (D16 amended)

- **No stored preference = `dark`.**
  - Bootstrap script: `preference = stored ?? "dark"`.
  - `readPreference()` fallback `"dark"`; `getServerSnapshot()` returns `"dark"`.
  - The root `<html>` renders `data-theme="dark"` server-side, so no-JS visitors get dark and there is no flash.
- **Theme colour:**
  - `THEME_COLOR = { light: "#f5f7fa", dark: "#0b0f14" }`.
  - `viewport.themeColor` uses the same two values.
  - The bootstrap also applies the meta rule from `applyTheme` (explicit choice → both metas take the resolved colour).
- **Scope:** `(auth)` pages and the public room `(public)/sala/[token]` follow the same default (dark). Visitors have no toggle there. Flagged for the owner in §8.3; no change proposed.

---

## 4. Visão geral (dashboard)

### 4.1 Page header

- **`<h1>`:** `<span class="sr-only">Visão geral — </span>Olá, {firstName}`.
  - `firstName` = `session.user.name` up to the first space.
  - `text-h1` (≥ 640), `text-h1-compact` (< 640).
  - Add `export const metadata = { title: "Visão geral" }`.
- **Status line** (`text-body-sm` `text-secondary`, mt 4). It replaces the generic description and the v1 "Status atual" assessment sentence:

| `overview.assessment.status` | Copy | Link (`primary-text`, underline on hover) |
|---|---|---|
| `completed` | "Diagnóstico {rápido\|completo} concluído em {dd/mm/aaaa}." | "Abrir diagnóstico" → `/diagnostico` |
| `in_progress` | "Diagnóstico em andamento — {answered} de {total} perguntas." | "Continuar" → `/diagnostico` |
| `none` | "Comece pelo diagnóstico para gerar seu score e seus primeiros riscos." | — (the CTA lives in Próximo passo) |
| overview unavailable | "Veja onde sua empresa está e o que precisa de atenção hoje." | — |

- The v1 header button "Resumo executivo" is **removed** (it duplicates the nav item "Relatórios"). One primary action per page (brand §41).

### 4.2 Section order (identical DOM order on every breakpoint → focus order = reading order)

1. Score de Compliance
2. Riscos em atenção
3. Próximo passo
4. Módulos (6 cards)
5. Riscos por categoria
6. Últimas ações

Fold ends in the reference here.

7. O que precisa de atenção hoje (Risk Radar)
8. O que fazer primeiro (priorities)
9. Riscos críticos e altos
10. Por que {score}? (breakdown)
11. Controles (maturity)
12. Documentos
13. Agente de compliance (Risk Brain)
14. Atividade recente (managers only)

Order 1 → 3 answers UX §4 in sequence: *where do I stand → what is wrong → what do I do.*

### 4.3 Grid per breakpoint (12-column CSS grid; `gap-4` < 1024, `gap-6` ≥ 1024)

| Section | < 640 (320–430) | 640–1023 | 1024–1279 | 1280–1439 | ≥ 1440 (incl. 1920+) |
|---|---|---|---|---|---|
| 1 Score | 12 (compact layout §5.1) | 12 | 12 | **6** | **6** |
| 2 Riscos em atenção | 12 | 6 | 6 | **3** | **3** |
| 3 Próximo passo | 12 | 6 | 6 | **3** | **3** |
| 4 Módulos (inner grid) | 2 cols, compact | 3 cols | 3 cols | 3 cols | **6 cols** (`wide:`) |
| 5 Riscos por categoria | 12 | 12 | 12 | **6** | **6** |
| 6 Últimas ações | 12 | 12 | 12 | **6** | **6** |
| 7 Radar (inner list) | 1 col | 2 cols | 3 cols | 3 cols | 3 cols |
| 8 O que fazer primeiro | 12 | 12 | 12 | **7** | **7** |
| 9 Riscos críticos e altos | 12 | 12 | 12 | **5** | **5** |
| 10 Por que {score}? | 12 (factors 1 col) | 12 (factors 2 cols) | 12 (2 cols) | 12 (factors 4 cols) | 12 (4 cols) |
| 11 Controles | 12 | 6 | 6 | 6 | 6 |
| 12 Documentos | 12 | 6 | 6 | 6 | 6 |
| 13 Agente | 12 | 12 | 12 | 12 | 12 |
| 14 Atividade | 12 | 12 | 12 | 12 | 12 |

Cards in the same row stretch to equal height (`align-items: stretch`); content stays top-aligned and footers are pinned with `mt-auto`.

### 4.4 Card anatomy (all dashboard cards)

- **Container:** `section` with `aria-labelledby`, radius 12, background `surface-elevated`, 1px `border`, padding 24 (16 < 640), flex column.
- **Header row:** title `<h2 class="text-h3">` + optional right slot (link "Ver todos" / "Ver todas" in `text-body-sm` 500 `primary-text`, hover `primary-text-hover` + underline). Optional caption below: `text-caption` `text-secondary`, mt 2.
- **Eyebrow:** `text-label` uppercase `text-secondary`, mb 4. Used on sections that module cards point to, so the English module name maps to the section: "RISK RADAR", "RISK BRAIN".
- **Content** starts 16 below the header.
- **Footer**, when present: `border-t`, pt 12, mt auto, `text-caption`.

### 4.5 Sections: content, data, states

States common to every card:
- **Loading:** a skeleton with the final dimensions (§4.7).
- **Error** (its data source returned `null`):
  - Keep the card frame and title.
  - Body: `CircleAlert` 16 `text-muted` + "Não foi possível carregar {este bloco}." + tertiary link "Tentar de novo" (a plain `<a href="/">`, full reload).
  - The card's min-height is kept.
- Each card renders independently. **Partial data never hides a working card.**

#### 1 — Score de Compliance (`/score`, `/score/history?limit=30`)

| Part | Spec |
|---|---|
| Header | `<h2>` "Score de Compliance" (D10 name; the reference's English "Compliance Score" is not used). Caption "Indicador de maturidade". |
| Header right | Band badge (`BAND_TONE`: inicial danger · estruturando warning · organizado info · maduro success), then the delta block: `ArrowUpRight`/`ArrowDownRight`/`Minus` 16 + **"+8 pts"** `text-body-sm` 600 tabular (`success-text` > 0, `danger-text` < 0, `text-secondary` = 0), and below it "desde {dd/mm/aaaa}" `text-caption` `text-muted`. No delta → "Primeiro registro" `text-caption` `text-muted`. **Never "%".** |
| Body ≥ 640 | Flex row, gap 32: ring 160 (§5.1) · trend block (flex-1, min-w 0). Trend block: label "Evolução" `text-body-sm` 500 `text-secondary` + right caption "{n} registros" `text-muted`; chart (§5.2). |
| Body < 640 | Row: ring 128 (left) + column (band badge, delta). Chart full width below, plot height 96. |
| Footer | "Maior redutor: {top_reducers[0].title} (−{points} pts)" (truncate 1 line) · link **"Por que {score}?"** → `#por-que`. No reducers → "Nada reduz o score no momento." + link. |
| Preliminary | Extra footer line: "Score preliminar — baseado no diagnóstico rápido." + link "Responder o diagnóstico completo" → `/diagnostico`. |
| `assessment_completed === false` | Extra footer line: "Diagnóstico em andamento — conclua para consolidar o score." + link "Continuar". |
| Empty (`available=false`) | Ring shows track only; numeral "—" in `text-muted`; `/100` hidden. Below the ring: `score.message` or "Score disponível após o diagnóstico." Header right empty. Trend: "A evolução aparece depois do primeiro diagnóstico." No footer. Never "0/100". |
| History < 2 points | "A evolução aparece a partir do segundo registro do score." (in the chart area, same height). |
| History `null`, score OK | "Evolução indisponível no momento." (chart area). |

#### 2 — Riscos em atenção (`/overview.risks`)

| Part | Spec |
|---|---|
| Header | "Riscos em atenção" · right "Ver todos" → `/riscos?status=abertos`. Caption "{open} em aberto". |
| Rows (4) | Críticos · Altos · Médios · Baixos, from `by_severity.{critico,alto,medio,baixo}` (open risks). Row: 40 tall, full-width link → `/riscos?status=abertos&severity={key}`, radius 8, padding-inline 8 (bleeds to −8), hover `surface-hover`. Content: dot 10 (`sev-*`) · label `text-body-sm` `text-primary` · count `text-body-sm` 600 tabular, right-aligned. Count 0 → the row is **not** a link, and label and count are `text-muted`. |
| Footer | "{without_owner} sem responsável" (count in `warning-text` when > 0; link `/riscos?status=abertos`) · "{in_review} em revisão" (link `/riscos?status=em_revisao`). Hidden when both are 0. |
| Empty, assessment done, `open = 0` | "Nenhum risco em aberto. Revise o diagnóstico periodicamente." |
| No assessment | "Seus riscos aparecem aqui depois do diagnóstico." |

#### 3 — Próximo passo (`/overview.assessment`, `/priorities?limit=5`, `/score.next_actions`)

The reference's "Risk Brain / Explorar" slot. Same anatomy: icon tile, title, text, button pinned to the bottom.

- Eyebrow "PRÓXIMO PASSO".
- Icon tile 40 (§5.4).
- Title `text-h3`, 2-line clamp.
- Text `text-body-sm` `text-secondary`, 3-line clamp.
- Meta lines `text-caption`.
- Button full width at the bottom (`mt-auto`).
- The first matching case wins:

| Case | Icon | Title | Text / meta | Button |
|---|---|---|---|---|
| `assessment.status = none`, role ∈ owner/admin/member (`assessment.answer`) | `ClipboardList` | "Comece pelo diagnóstico" | "Responda às perguntas por área. O diagnóstico gera seus primeiros riscos, as ações recomendadas e o score." | **Primary** "Iniciar diagnóstico" → `/diagnostico` (the page's only primary) |
| same, viewer | `ClipboardList` | "Diagnóstico não iniciado" | "Peça a um membro da equipe para iniciar o diagnóstico." | — |
| `in_progress` | `ClipboardList` | "Conclua o diagnóstico" | "{answered} de {total} perguntas respondidas. O progresso fica salvo." + progress bar (§5.8) | **Primary** "Continuar diagnóstico" (viewer: none) |
| `prio.items[0]` | `ListChecks` | action title | `reasons` joined " · " · meta 1: dot `sev-*` + `risk_title` (truncate) · meta 2: owner or "Sem responsável" · due date (overdue → `danger-text` + `Clock` 12 + "atrasada") · meta 3, if `score_gain > 0`: "+{gain} pts no score ao concluir com evidência" `success-text` | **Outline** "Ver ação" → `/acoes/{id}` |
| `prio.unplanned[0]` | `TriangleAlert` | "Planejar: {risk title}" | "Risco {crítico\|alto} sem ação planejada." + gain line | Outline "Planejar" → `/riscos/{id}#plano` (managers) · "Ver risco" → `/riscos/{id}` (others) |
| `score.next_actions[0]` | `ListChecks` | `label` | — | Outline "Abrir" → `refHref()` |
| nothing pending | `CircleCheck` (`success-text`) | "Nada urgente agora" | "Nenhuma ação pendente e nenhum risco crítico ou alto sem ação. Mantenha as evidências em dia." | Outline "Ver controles" → `/controles` |

#### 4 — Módulos (product differentiators; names stay in English as module names)

- Inner grid gap 16 (< 1024) / 24.
- The whole card is one link (except Compliance Room for non-owners).
- Anatomy: see §5.5.

| Module | Icon (same as nav concept) | Target | Description (pt-BR, honest) | Live metric (`text-caption` 500) |
|---|---|---|---|---|
| Risk Brain | `MessageSquareText` | `#agente` | `agentStatus.free_text` ? "Perguntas sobre seus riscos, respondidas por IA a partir dos seus registros." : "Perguntas prontas sobre seus riscos, respondidas a partir dos seus registros." | free_text ? "IA habilitada" : "{questions.length} perguntas prontas" |
| Control Graph | `Layers` | `/controles` | "Relação entre riscos, controles, ações e evidências." | total > 0 ? "{verificado} de {total} verificados" : "Nenhum controle ainda" |
| Risk Radar | `Radar` | `#radar` | "O que precisa de atenção hoje, com o motivo." | `all_clear` ? "Nada urgente hoje" : "{danger} críticos · {warning} alertas" (danger count in `danger-text` when > 0) |
| Action Plan | `ListChecks` | `/acoes` | "Riscos viram ações com responsável e prazo." | "{pending} pendentes" + (overdue > 0 ? " · {overdue} atrasadas" in `danger-text` : "") |
| Evidence Vault | `FileText` | `/documentos` | "Documentos com validade, versão e responsável." | total = 0 ? "Nenhum documento ainda" : attention (= vencendo + vencido + faltante) > 0 ? "{attention} precisam de atenção" (`warning-text`) : "{atualizado} atualizados" |
| Compliance Room (owner) | `DoorOpen` | `/sala` | "Mostre sua maturidade a clientes e parceiros." | `room.enabled` ? "Publicada" : "Não publicada" (one `/room` call, owner only) |
| Compliance Room (admin/member/viewer) | `DoorOpen` | **not a link** | same description | "Gerida pelo proprietário da organização" (`text-muted`); the card has no hover state and no pointer cursor |

- **Metric unavailable** (source `null`): "—".
- **No assessment:** the cards still render (they explain the product), with the metrics above in their empty wording.
- The Control Graph counts come from the maturity-ladder calls already made for section 11. Hoist them to the page so the calls are not duplicated.

#### 5 — Riscos por categoria (`/overview.risks.by_category`, already ordered by the API)

| Part | Spec |
|---|---|
| Header | "Riscos por categoria" · caption "Riscos em aberto por área" · right "Ver todos" → `/riscos?status=abertos`. |
| Rows | First 5 categories. Row 40, link, hover `surface-hover`. Columns: category label (`CATEGORY[key]`, `text-body-sm` `text-primary`, truncate, flex) · **highest severity present** (first of critico → alto → medio → baixo with count > 0): dot 8 `sev-*` + label `text-body-sm` `text-secondary`, fixed width 96 · count `text-body-sm` 600 tabular right, width 32. SR suffix: `<span class="sr-only">: {open} em aberto — {c} críticos, {a} altos, {m} médios, {b} baixos</span>`. |
| Row link | `/riscos?status=abertos&category={key}` **once the risk list accepts `category`** (engineer: small filter addition in `filters.ts` + API param). Until then, `/riscos?status=abertos`. |
| More than 5 | Footer "+{n} áreas" → `/riscos?status=abertos`. |
| Empty | "Nenhum risco em aberto." · no assessment: "As áreas aparecem depois do diagnóstico." |

#### 6 — Últimas ações (`/overview.actions.recent`, 5 items, any status)

| Part | Spec |
|---|---|
| Header | "Últimas ações" · right "Ver todas" → `/acoes`. |
| Row ≥ 640 | min-h 52, `border-b` (except the last). Icon tile 32 (radius 8, `primary-tint`, `ListChecks` 16 `primary-text`, `aria-hidden`) · title `text-body-sm` 500 `text-primary`, truncate, link `/acoes/{id}` · status pill (§5.6, `ACTION_STATUS`), fixed column 132 · relative time `text-caption` `text-muted`, right-aligned, width 88: `<time dateTime={updated_at} title={dd/mm/aaaa hh:mm}>`. |
| Row < 640 | Line 1: title (2-line clamp). Line 2: pill + time. The tile is hidden. |
| Relative time | `Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" })`, America/Sao_Paulo: < 60 min "há N minutos"; < 24 h "há N horas"; < 30 days "ontem" / "há N dias"; otherwise `dd/mm/aaaa`. SR prefix "Atualizada ". |
| Empty | "Nenhuma ação ainda. As ações nascem dos riscos: abra um risco crítico ou alto e use Planejar." + link "Ver riscos" → `/riscos`. |

#### 7–14 — Below the fold (existing content, restyled; nothing the user relies on is removed)

| # | Section | Source | Notes |
|---|---|---|---|
| 7 | "O que precisa de atenção hoje", eyebrow "RISK RADAR", `id="radar"` on the `<h2>` (anchor target) | `/radar` | `RadarPanel` restyled per §5.9. Counts caption unchanged. |
| 8 | "O que fazer primeiro" | `/priorities?limit=5` | `PrioritiesPanel compact`; severity badges → `SeverityBadge` (§5.6). |
| 9 | "Riscos críticos e altos" | `/overview.risks.items` | v1 list kept: title link, `SeverityBadge`, status pill when ≠ aberto, owner, due date (overdue `danger-text`). |
| 10 | "Por que {score}?" (`id="por-que"`) | `/score` | `ScoreCard variant="breakdown"`: v1 content **without** the number block. Factors (label · weight · bar `primary-text` on `surface-hover` · "{contribution} de {weight} pts" · summary), "O que mais reduz o score", "Próximos passos", and the footer disclaimer **verbatim**: "Indicador de maturidade calculado a partir dos seus registros (versão {v}). Não é uma medida de conformidade legal." Hidden when the score is unavailable. The landing keeps using the default variant. |
| 11 | "Controles" | `/controls` ladder counts | 4 `Stat`s (`text-kpi`), "Planejado" in `warning-text` when > 0. |
| 12 | "Documentos" | `/overview.documents` | 5 `Stat`s, v1 tones. |
| 13 | "Agente de compliance", eyebrow "RISK BRAIN", `id="agente"` | `/agent/questions`, `/agent/status` | Copy unchanged (no AI claim unless `free_text`). Chips §5.12. |
| 14 | "Atividade recente" | `/overview.recent_activity` | Rendered only when not `null` (managers: `audit.read`). |

Mapping of the v1 "Status atual" block (nothing lost):

| v1 item | v2 location |
|---|---|
| Riscos abertos | Riscos em atenção caption |
| Críticos | Riscos em atenção row |
| Pendentes / Atrasadas | Action Plan module metric + radar |
| Em revisão / Sem responsável | Riscos em atenção footer |
| Diagnóstico sentence | Page status line |
| Tendência | Score card chart |

### 4.6 Page-level states and permissions

| State | Behaviour |
|---|---|
| **No assessment** | Render sections 1–4 only (Score empty, Riscos empty, Próximo passo = start, Módulos). Plus Documentos (12) if `documents.total > 0`. Everything else is hidden (no empty-card noise). |
| **API fully down** (every source `null`) | Page `error.tsx` equivalent inline: title "Não foi possível carregar a visão geral." · text "Verifique sua conexão e tente novamente. Seus dados não foram alterados." · button (primary) "Tentar de novo" (full reload). Add `app/(app)/error.tsx` with the same copy for thrown errors (`reset()`). |
| **Partial** | Per-card error state (§4.5); the rest renders. |
| Viewer | No primary CTAs for writes (Próximo passo per table). Room card is non-link. Atividade hidden. Search and bell work read-only. |
| Member | As viewer, plus diagnóstico CTAs (`assessment.answer`). |
| Admin | Everything except Room (non-link card). |
| Owner | Everything; Room card is a link with the publication metric. |

### 4.7 Loading skeleton

- Provide a dashboard-specific skeleton. Move the page into a route group (`app/(app)/(visao-geral)/page.tsx` + `loading.tsx`; the URL stays `/`) so the generic `(app)/loading.tsx` keeps serving other routes.
- Blocks (same grid as §4.3), all `surface-hover` on `surface-elevated` cards, radius 6, exact final heights:
  - Header: 28px bar × 40%, then a 14px bar × 60%.
  - Score card: circle 160 with 12px track outline, plus a 120px chart block.
  - Riscos: 4 rows × 40.
  - Próximo: 40 tile, 2 lines, 40px button.
  - Modules: 6 × (40 tile + 2 lines).
  - Row 3: 5 rows × 40 each.
- `aria-busy="true"`, `aria-label="Carregando visão geral"`.
- Pulse: opacity 1 → 0.6, 1.6s ease-in-out, infinite. Disabled with reduced motion.

---

## 5. Component specs

### 5.1 ScoreRing (server component, SVG)

| Property | ≥ 640 | < 640 |
|---|---|---|
| Size / viewBox | 160 / `0 0 160 160` | 128 / `0 0 128 128` |
| Stroke | 12 | 10 |
| Radius r | 74 | 59 |
| Circumference C | 464.96 | 370.71 |
| Numeral | `text-score` 56 | `text-score-compact` 40 |

- **Track:** full circle, stroke `score-track`.
- **Arc:**
  - Stroke `score`, `stroke-linecap: round`, start at 12 o'clock (`rotate(-90 c c)`).
  - `stroke-dasharray: C`, `stroke-dashoffset: C × (1 − score/100)`.
  - Score 0: do not render the arc (a round cap would draw a dot). Score 100: full circle.
- **Glow:** `filter: drop-shadow(var(--drop-shadow-score))` on the arc only (dark: 6px teal at 35%; light: none).
- **Centre:** numeral `text-primary` tabular, centred. Below it, "/100" `text-caption` 500 `text-secondary` (`aria-hidden`), mt 2.
- **A11y:** the SVG is `aria-hidden`. The numeral is real text followed by `<span class="sr-only"> de 100</span>`, and the band label is real text in the badge. Colour never carries the band.
- The ring colour does **not** change with the band. Teal = "level of control"; the band badge communicates the judgement.

### 5.2 TrendChart (server component, SVG + HTML overlay; replaces `ScoreTrend` on the dashboard)

- **Frame:** relative container, plot height 120 (96 < 640) + 20px x-axis row, width 100%.
- **Plot geometry:**
  - SVG `viewBox="0 0 1000 100"` with `preserveAspectRatio="none"`.
  - The line and area use `vector-effect: non-scaling-stroke`.
  - Markers are **HTML** spans positioned with `left: x%; top: y%; transform: translate(-50%, -50%)`, so they stay round.
- **X:** time-proportional, `computed_at` from first to last snapshot (not index-spaced).
- **Y domain:**
  - `yMin = max(0, floor((min − 5)/10) × 10)`, `yMax = min(100, ceil((max + 5)/10) × 10)`.
  - If `yMax − yMin < 20`, widen symmetrically inside 0–100.
  - **The two domain values are printed** at the top-left and bottom-left (`text-caption` `text-muted`, tabular, column width 28), because a truncated axis must be visible (§9 D-14).
- **Area:** closed path to the baseline, `fill="url(#score-area)"`. Gradient stops `stop-color: var(--color-score)`, opacity 0.24 → 0 (dark) / 0.14 → 0 (light). Use a unique gradient id (`useId` or a fixed id; one chart per page).
- **Line:** stroke `score`, 2px.
- **Baseline:** 1px `border`. No other gridlines.
- **Markers:**
  - The last snapshot: 8px `score` with a 2px `surface-elevated` ring.
  - Preliminary snapshots: hollow 8px.
  - Legend "○ preliminar" on the axis row, right, only if any snapshot is preliminary.
- **X labels:**
  - Up to 6 ticks evenly spaced in time; first and last always shown.
  - Format: span ≥ 90 days → month (`Intl` pt-BR `month: "short"`, strip the trailing ".", capitalise: "Jan", "Fev"); otherwise `dd/mm`.
  - Below 640, show only first, middle and last.
- **A11y:** the wrapper is `role="img"` with the v1 summary label ("Score de {first} em {date} para {last} em {date}; mínimo {min}, máximo {max}, {n} registros."). The SVG is `aria-hidden`.
- No tooltip, no client JS.

### 5.3 Buttons

| Variant | Background | Text | Border | Hover | Active | Use |
|---|---|---|---|---|---|---|
| primary | `primary` | `primary-foreground` | — | `primary-hover` | `primary-active` | one per page |
| outline (**replaces v1 "secondary"**) | transparent | `text-primary` | 1px `primary-text` | background `primary-tint` | background `primary-tint`, border `primary` | Próximo passo, secondary actions |
| tertiary | — | `primary-text`, underline 1px, offset 2 | — | `primary-text-hover` | — | inline/low priority |
| destructive | `danger-fill` | `on-fill` | — | `brightness-110` (lighter fill, so dark-text contrast rises in both themes) | `brightness-95` (5.11 → ≈ 4.66:1, still AA) | delete, revoke; never next to the primary |
| neutral | `surface-elevated` | `text-primary` | 1px `border-strong` | `surface-hover` | `surface-hover` | toolbar, filters |

- **Sizes:** `md` 40 (default, radius 8, padding-inline 16, `text-body-sm` 500, gap 8, icons 16); `sm` 32 (padding-inline 12); below 768 every button is min-h 44. Trailing arrow allowed on primary CTAs that move the user forward (`ArrowRight` 16), as in the sheet.
- **Disabled:** opacity 0.4, `cursor: not-allowed`, no hover. Never hide a disabled primary; explain it.
- **Icon button:** 40 × 40 (header), 36 (in cards), 44 (< 1024); radius 8; icon 20 `text-secondary` → hover `text-primary` + `surface-hover`; `aria-label` required.

### 5.4 Icon tile

40 × 40 (32 in list rows), radius 8, background `primary-tint`, icon 20 (16) `primary-text`, stroke 1.5. Always `aria-hidden`. No glow, no gradient, no illustration.

### 5.5 ModuleCard

- **Frame:** link card, radius 12, background `surface-elevated`, 1px `border`, padding 20 (16 < 640), min-height 168 (≥ 640) / 112 (< 640), flex column, gap 12.
- **Content:**
  - Icon tile 40.
  - Name `text-h3` `text-primary`.
  - Description `text-caption` `text-secondary`, 2-line clamp; **hidden < 640**.
  - Metric `text-caption` 500 `text-primary`, `mt-auto`, tabular.
- **States:**
  - Hover: background `surface-hover`, border `border-strong`, 150ms.
  - Focus-visible: 2px `focus`, offset 2.
  - Non-link variant: no hover, `cursor: default`.
- Accessible name: the module name. The description and metric follow as content.

### 5.6 Badges, pills, tags, dots

| Kind | Anatomy | Colours |
|---|---|---|
| Status pill (`Badge`, tones info/success/warning/danger) | h 24, radius pill, padding-inline 8/10, gap 6, **no border**, `text-caption` 500. Icon 14 = the status icon from `labels.ts` (shape-distinct, reads as the reference's dot) | background `-tint`, icon and label `-text` |
| Neutral pill | same | background `surface-hover`, icon and label `text-secondary` |
| **SeverityBadge** (new; replaces tone-based severity badges everywhere) | same anatomy | background `surface-hover`, icon 14 = `SEVERITY[key].icon` in `sev-*`, label `text-primary` |
| Severity dot (dashboard summary lists only) | 10 (8 in dense rows), round, `aria-hidden`; always next to the text label | `sev-*` |
| Band badge | status pill with `BAND_TONE` | as tone |
| Tag (document tags, sheet "LGPD") | h 24, radius pill, padding-inline 10, 1px `border-strong`, `text-caption` 500 | `text-secondary`, transparent background |
| Count badge (bell) | min-w 16, h 16, padding-inline 4, radius pill, `text-micro` tabular, 2px ring `surface-base` (box-shadow) | background `danger-fill` if any danger, else `warning-fill`; text `on-fill` |

Change in `labels.ts`: `SEVERITY[*].tone` is no longer used for severity rendering. Components render `SeverityBadge`. The medium severity is therefore never cyan ("info") next to a yellow dot.

### 5.7 Inputs (TextField, selects, textarea, search)

- Height 40 (44 < 768), radius 8, background `surface-elevated`, 1px **`border-input`**, padding-inline 12.
- Text `text-body` `text-primary`; placeholder `text-muted`.
- Hover: border `text-muted`.
- Focus: border `primary-text` + global 2px `focus` outline, offset 2.
- Error: border `danger-text` + message `text-caption` `danger-text` with `role="alert"` (as v1).
- Disabled: opacity 0.4.
- Labels `text-body-sm` 500 `text-primary`; hints `text-caption` `text-secondary`.

### 5.8 Progress bar

h 6, radius pill, track `surface-hover`, fill `primary-text`, width transition 400ms. `role="progressbar"` with `aria-valuenow/min/max` and `aria-label`. Optional value label right, `text-caption` tabular (sheet "60%"). Used by the diagnóstico card, upload and score factors.

### 5.9 Radar item (dashboard section 7 and the bell)

- Row: `li`, radius 8, background `surface-base` (dashboard; inset look on the card) / transparent (bell), 2px **left** accent in the tone's `-fill`.
- Padding 12 × 12; whole row is a link (`radarHref`).
- Icon 16 in `-text` (danger `CircleAlert`, warning `TriangleAlert`, info `Info`).
- Title `text-body-sm` 500 `text-primary`; reason `text-caption` `text-secondary`, 2-line clamp.
- Hover: background `surface-hover`, title underline.

### 5.10 Header search (combobox)

Data: `GET /api/v1/orgs/{org}/search?q=&limit=5` (implemented in `apps/api/app/api/v1/search.py`). It returns `groups[]` in the order risk, action, control, document (only readable groups), each with `{kind, total, items}`; matching is case- and accent-insensitive.

- **Field** (≥ 768):
  - `role="combobox"`, `aria-expanded`, `aria-controls="busca-resultados"`, `aria-autocomplete="list"`, `aria-activedescendant`, `aria-keyshortcuts="/ Control+K Meta+K"`.
  - Visible label: none, so use `aria-label="Buscar riscos, ações, controles e documentos"`.
  - Placeholder "Buscar riscos, ações, controles e documentos" (ellipsis when narrow).
  - Leading `Search` 18 `text-muted` at 12px; padding-left 40.
  - Trailing kbd "/" (§5.14), hidden while focused or non-empty.
  - Clear button `X` 16 (32 × 32, `aria-label="Limpar busca"`) when non-empty.
- **Shortcuts:**
  - `/` focuses the field unless the event target is an `input`, `textarea`, `select` or `[contenteditable]`.
  - Ctrl+K / ⌘+K focuses it from anywhere (`preventDefault`).
  - Opening the search closes the bell and vice versa.
- **Request:**
  - Trim; fire at ≥ 2 characters (max 100, the API limit).
  - Debounce 200ms; abort the in-flight request (`AbortController`).
  - No client cache across organizations (the key includes the org id).
- **Popover:**
  - Anchored under the field, offset 8, width = the field (min 400), `max-height: min(480px, 70vh)`, overflow auto.
  - Radius 12, `surface-elevated`, 1px `border-strong`, `shadow-popover`, padding 8, z-40.
  - `role="listbox"`, `id="busca-resultados"`, `aria-label="Resultados da busca"`.
- **Group:**
  - `role="group"` + `aria-labelledby` header.
  - Header 28 tall, padding-inline 12: label "RISCOS" / "AÇÕES" / "CONTROLES" / "DOCUMENTOS" `text-label` `text-secondary`, plus the count `text-caption` `text-muted` right ("{shown} de {total}" when total > shown).
  - Omit groups with `total = 0`.
- **Option:**
  - `role="option"`, unique id, min-h 40 (48 < 768), padding 8 × 12, radius 8, gap 10.
  - Type icon 16 `text-muted` (`TriangleAlert`, `ListChecks`, `Layers`, `FileText`).
  - Title `text-body-sm` 500 `text-primary`, 1-line truncate. The match is wrapped in `<mark>`: background `primary-tint`, text `text-primary`, weight 600, radius 2. Find the match by folding case and accents client-side, the same way as the API.
  - Right meta `text-caption`:

    | Kind | Meta |
    |---|---|
    | risk | dot `sev-*` + severity label |
    | action | status label `text-secondary`; "· atrasada" `danger-text` when `due_date < today` and status ≠ concluida |
    | control | `CONTROL_STATUS` label |
    | document | `DOCUMENT_STATUS` label in its `-text` tone |

  - Active (keyboard or hover): background `surface-hover`, `aria-selected="true"`.
  - Target: `/riscos/{id}`, `/acoes/{id}`, `/controles/{id}`, `/documentos/{id}`.
- **Group overflow:** a line "Mais {total − shown} em {grupo}: refine a busca." (`text-caption` `text-muted`, not a link, since the list pages have no text filter yet).
- **Keyboard:**

  | Key | Behaviour |
  |---|---|
  | ↓ / ↑ | Opens the popover if closed; moves the active option across groups, wrapping |
  | Enter | Opens the active option, or the first option when none is active; closes the popover and navigates |
  | Esc | Closes the popover (text kept); a second Esc clears the text |
  | Tab | Closes the popover and moves focus on |
  | Home / End | Left to the input caret (not overridden) |

  - A click outside closes. Route change closes.
- **States:**

  | State | Content |
  |---|---|
  | Focused, < 2 characters | Hint row: "Digite ao menos 2 letras. A busca procura pelo título em riscos, ações, controles e documentos." |
  | Loading (> 150ms) | 3 skeleton rows × 40 |
  | Empty | "Nenhum resultado para “{q}”." + "Tente outra palavra do título." |
  | Error | "Não foi possível buscar agora." + tertiary button "Tentar de novo" (query kept) |
  | 429 | "Muitas buscas em sequência. Aguarde alguns segundos." |

- **Live region** (`role="status"`, polite, visually hidden): "Buscando…", "{total} resultados", "Nenhum resultado".
- **Mobile (< 768):**
  - The top-bar `Search` button opens a full-screen `<dialog>` (`showModal`).
  - Top row: padding 8 + safe area; input 44 (autofocus) + text button "Cancelar" 44.
  - Results fill the rest with the same grouping; options 48.
  - Esc or Cancelar closes and returns focus to the trigger. No kbd hint.
- **Tablet top bar:** inline field, as desktop.

### 5.11 Bell (Risk Radar)

- **Data:**
  - The `(app)` layout server-fetches `/radar` once per request and passes `{counts, items, all_clear}` to the client `Bell`.
  - **On every open** it refetches `/api/v1/orgs/{org}/radar` through the BFF. The cached items stay visible and are replaced when the fetch completes, together with the badge count. This keeps the badge fresh, since layouts do not re-render on client navigation.
- **Button:**
  - 40 × 40 (44 < 1024), `Bell` 20; `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`.
  - `aria-label`:
    - `all_clear` → "Atenção hoje: nada pendente".
    - Otherwise → "Atenção hoje: {danger} críticos, {warning} alertas, {info} avisos".
  - Count badge (§5.6) = `counts.danger + counts.warning`, capped at "9+", positioned `top: 6px; right: 6px`. Info-only → no badge.
- **Popover (≥ 768):**
  - Width 400 (`max-w-[calc(100vw-32px)]`), right-aligned to the bell, offset 8, `max-height: min(560px, 80vh)`.
  - Radius 12, `surface-elevated`, 1px `border-strong`, `shadow-popover`.
  - `role="dialog"`, `aria-labelledby`, non-modal.
- **Content:**
  - Header (sticky, padding 16, `border-b`): `<h2 class="text-h3" tabindex="-1">` "Atenção hoje" + counts line `text-caption` `text-secondary` ("3 críticos · 2 alertas · 1 aviso", singular/plural as in `RadarPanel`).
  - List: radar items (§5.9, transparent background), separated by `border`.
  - Footer (`border-t`, padding 12 × 16): link "Ver na visão geral" → `/#radar`.
- **Focus:**
  - On open, focus moves to the heading.
  - Tab walks the items. Esc closes and returns focus to the bell. A click outside closes.
  - Following an item navigates and closes. The search opening closes the bell.
- **States:**

  | State | Content |
  |---|---|
  | `all_clear` | `CircleCheck` 20 `success-text` + "Nada exige atenção agora." + `text-caption` "Mantenha as evidências em dia e revise o diagnóstico periodicamente." |
  | Refetching | `aria-busy="true"` on the list + caption "Atualizando…" under the counts line |
  | No cached items and loading | 3 skeleton rows × 56 |
  | Error | "Não foi possível carregar os alertas agora." + tertiary "Tentar de novo" (cached items kept if any) |

- **Mobile (< 768):** full-screen `<dialog>` with header row 56 (title + close `X` 44), counts line, list (rows ≥ 56), and the footer link pinned above the safe area.

### 5.12 Chips (agent questions)

- h 32 (40 < 768), radius pill, padding-inline 12, 1px `border-strong`, `text-body-sm` `text-secondary`.
- Hover: `surface-hover` + `text-primary`.
- Pressed (`aria-pressed="true"`): border `primary-text`, background `primary-tint`, `text-primary` 500.
- Disabled: opacity 0.6.

### 5.13 Alerts and toast (visual only; no new toast system in this task)

- **Alert (inline):** radius 8, padding 12 × 16, background `-tint`, 1px `-border`, icon 16 + text `text-body-sm` in `-text`; `role` as v1.
- **Toast** (sheet), if/when used:
  - Radius 12, `surface-elevated`, 1px `border-strong`, `shadow-popover`, padding 16, width 360.
  - Icon `CircleCheck` 20 `success-text`; title `text-body-sm` 600 `text-primary`; body `text-body-sm` `text-secondary`; close `X` 32 `aria-label="Fechar"`.
  - Position bottom-right 24 (≥ 768) / above the tab bar, 16 inset (< 768). `role="status"`. 5s, paused on hover/focus.

### 5.14 kbd

Min-w 20, h 20, padding-inline 4, radius 4, 1px `border-strong`, background `surface-base`, `text-caption` 500 `text-secondary`, `aria-hidden` (the shortcut is exposed through `aria-keyshortcuts`).

### 5.15 Stat (KPI)

`dt` `text-caption` `text-secondary`; `dd` `text-kpi` tabular, link with hover underline. Colour `danger-text` / `warning-text` only when the tone applies and value > 0. Otherwise `text-primary`.

---

## 6. Motion

CSS only (D22). Only `opacity`, `transform` and `stroke-dashoffset` are animated. Nothing loops except the skeleton.

| Interaction | Property | Duration / easing | Meaning (brand §32) |
|---|---|---|---|
| Hover (nav, rows, cards, buttons) | background-color, border-color, color | 150ms `--ease-out` | feedback |
| Press | background (to `-active`) | 150ms | feedback |
| Focus ring | none (instant) | — | — |
| Popover open (search, bell) | opacity 0 → 1, translateY(−4px → 0) | 150ms `--ease-out`; close 150ms opacity only | Layer |
| Full-screen dialog (mobile search/bell) | opacity, translateY(8px → 0) | 200ms | Layer |
| Drawer | opacity, translateX(−16px → 0) from the left | 200ms | Layer |
| Tab bar active pill | background-color | 150ms | state |
| Score ring draw (on mount) | `stroke-dashoffset` C → target, `@keyframes` with `from` only | **400ms** `--ease-out`, delay 100ms, `animation-fill-mode: backwards` | Progress |
| Trend line draw | `pathLength="1"`, `stroke-dasharray: 1`, dashoffset 1 → 0 | 400ms, delay 150ms | Progress |
| Trend area | opacity 0 → 1 | 250ms, delay 350ms | Progress |
| Markers | opacity | 150ms, delay 500ms | — |
| Status badge change | cross-fade | 200ms (v1) | Resolve |
| Progress bar width | width | 400ms | Progress |
| Skeleton | opacity 1 ↔ 0.6 | 1.6s ease-in-out, infinite | loading |

- The score numeral does **not** count up (it would need client JS).
- Single animations stay ≤ 500ms (brand §33); the chart sequence ends by 650ms.
- **`prefers-reduced-motion: reduce`:** extend the existing global rule with `animation-delay: 0ms !important; animation-iteration-count: 1 !important;`. Because every entrance animation only defines its `from` state, 0ms leaves each element in its final state immediately.

---

## 7. Accessibility

### 7.1 Checklist

- **Landmarks:**
  - Skip link "Ir para o conteúdo" is the first focusable element.
  - `aside` > `nav aria-label="Principal"`; `header` (banner, main column); `main#conteudo`; `nav aria-label="Atalhos"` (tab bar).
  - The drawer's nav reuses "Principal" (only one is rendered/visible at a time).
- **Headings:**
  - One `h1` per page (the greeting includes the sr-only "Visão geral —").
  - Cards and sections are `h2` (styled `text-h3`).
  - Popover titles are `h2`. No skipped levels inside cards (`h3` for sub-blocks of the breakdown).
- **Focus order:** skip link → sidebar (logo, org, nav, theme, Sair) → header (search, bell, user) → main in DOM order (§4.2, identical on every breakpoint). Popovers and dialogs follow §5.10–§5.11; `<dialog>` handles trapping and return.
- **Focus visible:** `:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }`. Replace the current `var(--color-primary)`, because light `#06B6D4` is 2.43:1 on white and fails 3:1.
- **Not colour-only:**

  | Signal | Carried by |
  |---|---|
  | Severity | label (+ icon in badges) |
  | Status | label + shape-distinct icon |
  | Delta | sign + arrow |
  | Active nav | background + icon + weight + `aria-current` |
  | Active tab | pill shape + `aria-current` |
  | Band | text label |
  | Overdue | "atrasada" / `Clock` |

- **Charts:** ring and trend expose text equivalents (§5.1, §5.2). Decorative SVG is `aria-hidden`.
- **Touch targets:** ≥ 44 × 44 below 1024 (top bar, tab bar, drawer items, options, chips 40 + 8 gap, buttons min-h 44).
- **Dynamic content:** the search live region (polite), and `aria-busy` on refetch. Relative times carry `dateTime` and a full-date `title`.
- **Language and formats:** `lang="pt-BR"`; `Intl` for dates, relative time and numbers; time zone America/Sao_Paulo.
- **Reduced motion:** §6. **Forced colours:** `outline` focus survives; every state has a text label.
- **Optional:** `@media (prefers-contrast: more)` sets `--color-border` to the `border-input` value and `--color-text-muted` to the `text-secondary` value.
- **Print:** the dark block is screen-only (§2.1). Shell elements get `print:hidden`.

### 7.2 Contrast table (v2)

**Dark (default).** Surface luminance: base `#0B0F14`, elevated `#111827`, hover `#18212F`, tint `#0A2D37`.

| Foreground | on base | on elevated | on hover | on tint | Required |
|---|---|---|---|---|---|
| `text-primary` `#F3F4F6` | 17.46 | 16.12 | 14.71 | 13.22 | 4.5 |
| `text-secondary` `#B4BDCA` | 10.13 | 9.35 | 8.53 | 7.67 | 4.5 |
| `text-muted` `#8A94A6` | 6.28 | 5.80 | 5.29 | 4.76 | 4.5 |
| `primary-text` / `info-text` / `focus` `#22D3EE` | 10.64 | 9.82 | 8.96 | 8.05 | 4.5 |
| `primary-text-hover` `#67E8F9` | 13.26 | 12.24 | — | — | 4.5 |
| `success-text` `#34D399` | 10.00 | 9.23 | 8.42 | 7.60 (own tint `#0C2E28`) | 4.5 |
| `warning-text` `#FBBF24` | 11.51 | 10.63 | 9.70 | 8.51 (own tint `#352912`) | 4.5 |
| `danger-text` `#F87171` | 6.95 | 6.41 | 5.85 | 5.83 (own tint `#34191D`) | 4.5 |

| Pair | Ratio | Required |
|---|---|---|
| `primary-foreground` on `primary` / hover / active | 7.92 / 10.64 / 5.22 | 4.5 |
| `on-fill` on `danger-fill` / `warning-fill` / `success-fill` | 5.11 / 8.95 / 7.58 | 4.5 |
| `primary` button vs base / elevated (boundary) | 7.92 / 7.31 | 3.0 |
| `border-input` `#6B7280` vs elevated / base | 3.67 / 3.98 | 3.0 |
| `score` arc vs `score-track` / vs elevated | 7.08 / 9.53 | 3.0 |
| `sev-critical` / `-high` / `-medium` / `-low` vs elevated | 4.71 / 6.33 / 11.58 / 9.53 | 3.0 |
| same vs `surface-hover` (SeverityBadge) | 4.30 / 5.77 / 10.57 / 8.70 | 3.0 |
| count badge (`danger-fill`) vs header base | 5.11 | 3.0 |
| `border` `#1F2937` vs base / elevated | 1.31 / 1.21 | decorative only |

**Light.** Surface luminance: white `#FFFFFF`, base `#F5F7FA`, hover `#EEF1F5`, tint `#E6F8FB`.

| Foreground | on white | on base | on hover | on tint | Required |
|---|---|---|---|---|---|
| `text-primary` `#0B0F14` | 19.22 | 17.91 | 16.96 | 17.56 | 4.5 |
| `text-secondary` `#4B5563` | 7.56 | 7.04 | 6.67 | 6.90 | 4.5 |
| `text-muted` `#626B7A` | 5.38 | 5.01 | 4.75 | 4.91 | 4.5 |
| `primary-text` / `info-text` / `focus` `#0E7490` | 5.36 | 4.99 | 4.73 | 4.89 | 4.5 |
| `primary-text-hover` `#155E75` | 7.27 | 6.77 | — | — | 4.5 |
| `success-text` `#047857` | 5.48 | 5.11 | 4.84 | 4.99 (own tint) | 4.5 |
| `warning-text` `#A34C0A` | 5.84 | 5.44 | 5.16 | 5.40 (own tint) | 4.5 |
| `danger-text` `#B91C1C` | 6.47 | 6.03 | 5.71 | 5.66 (own tint) | 4.5 |

| Pair | Ratio | Required |
|---|---|---|
| `primary-foreground` on `primary` / hover `#06A9C5` / active `#079BB5` | 7.92 / 6.85 / 5.82 | 4.5 |
| `on-fill` on `danger-fill` / `warning-fill` / `success-fill` | 5.11 / 8.95 / 7.58 | 4.5 |
| `border-input` `#7D8799` vs white / base | 3.62 / 3.38 | 3.0 |
| `score` `#0D9488` arc vs `score-track` / vs white | 3.25 / 3.74 | 3.0 |
| `sev-critical` / `-high` / `-medium` / `-low` vs white | 4.83 / 3.56 / 4.92 / 3.74 | 3.0 |
| same vs base | 4.50 / 3.32 / 4.59 / 3.49 | 3.0 |
| same vs `surface-hover` (SeverityBadge) | 4.26 / 3.14 / 4.35 / 3.31 | 3.0 |
| `primary` button fill vs white | 2.43 | not required (label identifies the control, §2.2 rule 3) |
| `success-fill` / `warning-fill` vs white | 2.54 / 2.15 | decoration only; never the sole signal |

Legacy scopes keep the figures in `tokens.md` §2 and §8.

### 7.3 Verification asked of the engineer

- Add `lib/__tests__/contrast.test.ts`. It parses the four colour blocks of `globals.css`, recomputes every pair in §7.2 and asserts the thresholds. The figures above are hand-computed and must be machine-checked before release (CLAUDE.md §31).
- Keyboard-only walkthrough at 1440 and 390: skip link → nav → search (`/`, arrows, Enter, Esc) → bell (open, Tab, Esc, focus return) → dashboard cards.
- Screen-reader spot check (NVDA + Chrome): greeting heading, ring label, search announcements, bell label with counts.

---

## 8. Impact on other pages and on the landing

### 8.1 Global changes every page inherits

| Change | What may look off | Action for the engineer |
|---|---|---|
| Dark default + v2 neutrals | Anything using `obsidian`, `off-white`, `electric-blue`, `text-white`, `bg-white` in **app** code | Replace with semantic tokens: `mobile-drawer.tsx` `backdrop:bg-obsidian/40` → `backdrop:bg-backdrop`; `theme-toggle.tsx` `shadow-sm` → §3.2; any app `bg-electric-blue` / `stroke-electric-blue` / `fill-electric-blue` (e.g., the `ScoreCard` factor bars, `ScoreTrend`) → `primary-text` (bars) or `score` (trend). Marketing files keep theirs. |
| `Button` secondary | v1 secondary = obsidian outline; v2 = cyan outline | Rename the variant to `outline` (§5.3); keep a `neutral` variant for toolbars. |
| Tertiary hover `hover:text-info-fill` | In light v2 `info-fill` is 2.43:1 on white, so it **fails** | `hover:text-primary-text-hover` (button and every link using `hover:text-info-fill`). |
| Inputs `border-border` | 1.21:1 in dark, so the field is invisible | `border-border-input` in `text-field.tsx`, `fields.tsx`, filter selects, agent input, room forms, auth forms. |
| Focus ring `var(--color-primary)` | light 2.43:1 fails | `var(--color-focus)`. |
| `--text-h1` 32 → 28, `--text-h2` 24 → 20, `--text-h3` 18 → 16 | Page and card titles smaller; **`Stat` numbers used `text-h2`** | `Stat` and every numeric `text-h2` → `text-kpi`. Check `PageHeader` on every page at 320. |
| `--text-caption` 11 → 12 | Dense rows (risk table mobile cards, badges, filter chips, activity list) may wrap | Visual QA at 320/375; allow wrapping, never truncate status labels. |
| Radius `md` 6 → 8, `lg` 8 → 12 | Table containers, nested boxes | Apply the inner-radius rule (§2.5); table header corners follow the container. |
| Severity rendering | "Médio" pill was info (cyan), "Baixo" neutral | Use `SeverityBadge` everywhere (`risk-table`, risk detail, priorities, dashboard, search). |
| Radar left borders `-border` | Too dim in dark | `-fill` (§5.9). |
| Sidebar at ≥ 1024 (was ≥ 768) | Tablet loses the permanent sidebar | By design (§3.1). QA at 768 and 1023. |
| `/resumo` (now "Relatórios") | Nav label ≠ page title | Add eyebrow "RELATÓRIOS" to its `PageHeader`; keep the title "Resumo executivo". Confirm print output is light (§2.1). |
| Auth pages, public room | Now dark by default | QA only; logo `Lockup` in `text-primary` reads correctly in both. |

### 8.2 Landing

- **Keeps:** palette (legacy scopes), radius, app type scale, shadows (`.landing` pins, §2.8), motion, copy, layout.
- **Changes:** Inter replaces Geist (marketing layout no longer loads Geist) and the display sizes follow §2.4.
- The landing's `ScoreCard` / `RadarPanel` / `PrioritiesPanel` / `RiskTable` showcases pick up anatomy changes only (`SeverityBadge`, pill without border). Colours stay legacy through the scoped tokens.
- `globals-theme.test.ts` keeps passing with the new tokens, provided every new colour is in all four blocks. Extend it to assert the `.landing` non-colour pins.

### 8.3 Open points for the Orchestrator / owner

1. **Public Compliance Room (`/sala/{token}`) is dark by default for visitors** (no toggle there). Acceptable per the owner's decision; flag it in case the owner wants the visitor page to follow the system preference instead.
2. **Risk list `category` filter:** a small API/UI addition so the "Riscos por categoria" rows deep-link. Until then rows link to `/riscos?status=abertos`.
3. **Text filter (`q`) on list pages:** would let search groups offer "Ver todos em Riscos". Not required now.
4. **Inter 700** payload check (§2.4).

### 8.4 Documents to update after implementation (D39)

- **`brand-system.md`:**
  - §8–§10 → the palette and neutrals of §2.2.
  - §13–§14 → Inter only + the scales of §2.4.
  - §17 → radius of §2.5.
  - §20 → note "no shields" still stands despite the sheet.
  - §41 → primary cyan with dark text, outline = cyan border.
  - §80 → DNA line "Dark + Cyan + Teal / Inter".
- **`tokens.md`:** header note "legacy values; app = visual-v2.md".
- **`app-shell.md`:** header note "§2–§3 superseded by visual-v2.md §3".
- **`decisions.md`:** D39 entry and the D16 amendment (default dark).

---

## 9. Deviations from the references (each justified)

| # | Reference shows | v2 does | Reason |
|---|---|---|---|
| D-1 | "Compliance Score" | "Score de Compliance" + "Indicador de maturidade" | D10 official UI name; D7 pt-BR. |
| D-2 | "+12%" | "+8 pts" | The score is not a percentage. |
| D-3 | Risk Brain card with "Explorar" in row 1 (the module also appears in row 2) | "Próximo passo" card | Duplicate module; the dashboard must answer "what next?" (CLAUDE.md §4). |
| D-4 | "IA para análise de riscos" | Honest copy conditioned on `agentStatus.free_text` | No AI claim unless the LLM is enabled (CLAUDE.md §7, brand §63). |
| D-5 | User photo | Initials avatar | No photos in the product. |
| D-6 | "Seu compliance mais inteligente / Explorar recursos" | Omitted | Promotional, no real destination; brand §39 clutter. |
| D-7 | "Outras páginas", "Detalhes que fazem diferença", sheet presentation panels | Excluded | Presentation, not product UI. |
| D-8 | Header: search icon + bell + square icon | Bell only (the search icon exists only < 768 where the field collapses) | The third icon has no product function. |
| D-9 | Nav: Dashboard, Assessments, Compliance Room, Relatórios (EN/PT mix) | pt-BR labels, 10 items in 2 groups, Sala de compliance owner-only | Owner decision; brand §55. |
| D-10 | Status "Pendente" (amber) | Real statuses (A fazer neutral, Em andamento info, Em revisão warning, Concluída success, Bloqueada danger) | Map to real data only. |
| D-11 | Category rows: two dots per row; "Baixo" text in teal | One dot + label in `text-secondary` | Same information twice; the coloured text was an inconsistency. |
| D-12 | "2 dias atrás" | "há 2 dias" (`Intl.RelativeTimeFormat` pt-BR) | Standard pt-BR form, locale-driven. |
| D-13 | Fixed month axis Jan–Jun | Axis from real snapshot dates, time-proportional | Honest data. |
| D-14 | No y-axis | Domain min/max printed | The y-axis is truncated for readability, so the scale must be visible (brand §27, trust). |
| D-15 | Subtle input borders | `border-input` ≥ 3:1 | WCAG 1.4.11. |
| D-16 | Glow on cards, icon tiles, chart | Glow only on the ring arc, dark theme only | Brand §39 (no neon); the owner allowed "discreet" glow. |
| D-17 | Teal-navy surfaces (`#001321`) | Canonical `#111827` | The labelled values are canonical; the render is over-saturated. |
| D-18 | Text colours unspecified | Derived greys with AA figures | Needed for AA. |
| D-19 | Active nav: tinted pill | Same, and the v1 2px left bar is retired | Matches the reference; state kept non-colour-only via weight and `aria-current`. |
| D-20 | Shield icons ("Risco", "Compliance Room"), gear for "Controle" | Lucide `TriangleAlert`, `DoorOpen`, `Layers` | Brand §20 forbids shields; the gear means Configurações. |
| D-21 | Module cards with description only | Plus a live metric line | A card must earn its place (brand §42); turns navigation tiles into status. |
| D-22 | "/100" to the right of the ring | "/100" under the numeral, inside the ring | Keeps the ring self-contained and responsive. |
| D-23 | No band label | Band badge in the score card header | Brand §28 ("74 — Good"). |
| D-24 | Phone top bar with hamburger | Search + bell; "Mais" opens the drawer | The hamburger and "Mais" would do the same thing; search and bell need a home on mobile. |
| D-25 | Tablet not shown | Top bar + drawer at 768–1023 | Content width. |
| D-26 | Primary button with trailing arrow everywhere | Arrow only on forward-moving CTAs | Avoids icon noise. |
| D-27 | Sheet H1 56 as a generic heading | 56 is the marketing hero; app page title 28 | Product density; the sheet sizes are brand-level. |
| D-28 | Light theme not shown | Derived v2 light with AA variants | Owner decision (theme toggle stays). |
| D-29 | Sections below row 3 not shown | Radar, priorities, critical risks, breakdown, controls, documents, agent, activity kept below the fold | No loss of information the user relies on (CLAUDE.md §3–§4). |

---

## 10. Implementation order (suggested) and done criteria

1. **Tokens:** `globals.css` four colour blocks, typography, radius, shadows, `.landing` pins, breakpoint `wide`, focus token, print scoping. Update `globals-theme.test.ts` and add `contrast.test.ts`.
2. **Theme default:** dark (bootstrap, toggle snapshot, SSR attribute, theme-color).
3. **Primitives:** `Button` (outline, neutral, destructive), `Badge` (no border) + `SeverityBadge`, inputs `border-input`, `Stat` → `text-kpi`, progress bar, kbd.
4. **Shell:** sidebar (240, logo 28 cyan, groups, compact `AccountBlock`), header (search, bell, user block), tablet/mobile top bars, tab bar, drawer.
5. **Search** client component against `/search`; **Bell** client component with SSR radar.
6. **Dashboard:** `ScoreRing`, `TrendChart`, cards 1–6, sections 7–14, states, skeleton route group, `error.tsx`.
7. **Landing:** Inter switch, display clamps.

Done means:
- `next build` table reported: shell First Load JS ≤ 140 kB; no new dependencies (no cmdk, Radix, floating-ui or chart library).
- `lint`, `typecheck` and `vitest` (incl. contrast) pass.
- Screenshots at 390, 768, 1024, 1440 and 1920 in both themes.
- Keyboard and screen-reader notes (§7.3).
- The landing compared before/after, with only the font and display sizes changed.
