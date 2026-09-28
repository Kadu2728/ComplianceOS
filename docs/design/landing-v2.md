# COMPLIANCE OS — LANDING v2 (dark, cyan, device hero)

Status: SPEC, ready for implementation by the Senior Software Engineer. Author: UX/UI Engineer, 2026-09-27.
Authority: owner decisions of 2026-09-27 (official landing reference `landing.webp` + crops `sec0–sec4`; decisions 1–5 quoted in §0). The Orchestrator records this as a new decision (proposed **D40 — Landing v2**) and updates `.claude/brand-system.md` from §12.1.
Scope: `app/(marketing)/**` (landing `/inicio`, `/termos`, `/privacidade`), `components/marketing/*`, `lib/marketing/{copy,fixtures}.ts`, the landing blocks of `app/globals.css`, and two tests.
Inputs reconciled:
- Marketing & Growth copy `landing-v2/02-copy.md` (2026-09-27, DRAFT). Its section order, anchors and slot lengths govern; §9 lists the layout checks.
- The delivered screenshots `appshot/hero-desktop.webp` (1440 × 900, 1×, 75 KB) and `appshot/hero-phone.webp` (780 × 1688, 2×, 53 KB): demo organization Acme Tecnologia Ltda., user "Ana Souza", score **69**, "Organizado", **+5 pts desde 08/09/2026**, 18 open risks (3 / 5 / 9 / 1).
Supersedes: `visual-v2.md` §2.1 (landing rows), §2.8 and §8.2; the legacy values in `tokens.md`; the previous landing UX spec (`03-ux-spec`). The app is **not** touched, apart from two now-unused props (§10.4).

Contrast figures use the WCAG 2.x relative-luminance formula. They were **computed by hand in this session; no script was run**. §10.3 adds the landing block to `contrast.test.ts` so the machine check covers them before release (CLAUDE.md §31).

Reference geometry: the render is 1024 px wide for a ≈ 1440 px page (factor 1.406). Crop measurements (2× crops) were converted to 1440-px design units. The render's type is about 25% smaller than the brand scale, and its spacing is tighter than brand §16 allows. Those two aspects are **not** reproduced. Proportions, structure and composition are.

---

## 0. Decisions in one screen

| # | Decision | Why |
|---|---|---|
| 1 | The landing becomes **dark for every visitor**. The wrapper `.landing` pins the app-dark v2 palette (hex, screen only). The legacy `.theme-light` / `.theme-dark` / v1 `.landing` pins are **deleted**. | Owner decision 1. The app theme (light/dark/system) no longer matters on public pages. Print falls back to light, so legal pages still print. |
| 2 | One deeper page background: **Canvas `#030712`**. It is the landing value of `surface-base`, not a new token name. It is Tailwind gray-950, the next step down the same neutral scale that already gives v2 its `#111827` / `#1F2937` / `#374151` / `#6B7280`. | The hero screen is a screenshot of the app, whose page is `#0B0F14`. On a `#0B0F14` page the screen would have no luminance step and would read as a hole in a bezel. One step darker makes it read as a lit screen **without any glow effect**. It is also within ≈ 6 units per channel of the measured reference background (`#04070D`–`#050B0F`), and every text ratio goes up (§2.5). |
| 3 | Everything the reference paints blue becomes the **v2 cyan family**: fill `primary` `#06B6D4` with dark text; text, strokes and eyebrows in `primary-text` `#22D3EE`; tiles in `primary-tint` `#0A2D37`; focus `#22D3EE`. Teal (`score-fill`) is **not** used on the landing. | Owner decision 1. Teal means "level of control" and only the real screenshot shows a score. |
| 4 | Structure (§3): header → hero (laptop + phone + callout) → O problema → The Control Layer → Como funciona → Produto (**one** section) → Menos trabalho manual (the reference's "IA + automação" slot) → Planos → FAQ (14 questions) → final CTA card → footer. Security, Score and Compliance Room sections are **removed**. | Owner decision 2; Marketing's copy (`02-copy.md`). |
| 5 | The owner's real symbol (`BrandSymbol`, currentColor mask) is shown in `primary-text`. No hexagon anywhere, including the hexagon outline behind the reference hero (**omitted**). No photos, no people. | Owner decision 3. A hexagon outline next to the logo would read as the reference's fake hexagon logo. |
| 6 | Hero visual = the **real dashboard**, as screenshots of the live app (demo organization, dark). They sit in **CSS device frames**. The laptop has a static 10° perspective at ≥ 1280 only and is flat below. The phone overlaps bottom-right at every width. The callout and its leader line show at ≥ 768 only. | Owner decision 4. Perspective only where the device sits beside the text and turns toward it; flat where it is centred, for legibility (§4.3.6). |
| 7 | The Control Layer figure is an **inline SVG**: five isometric planes, cyan strokes fading with depth, a dot lattice on the top plane and one static radial glow. Labels are HTML. No canvas, no WebGL, no loop. | Owner decision 5. |
| 8 | Hero H1 = **display-l 48/700** (fluid 32→48), not display-xl 56. | In a two-column hero, 56 px needs ≈ 580 px per line and would push each sentence onto two lines. At 48 px, each sentence fits on one line in the 520 px text column, and also at 375–430 px phone widths (§2.3). The reference itself sets the H1 at ≈ 42 px. |
| 9 | **One filled cyan button per viewport**, plus the persistent header CTA, which is outline while the hero is visible (behaviour kept from today). Every other section CTA is outline. | Brand §41. The reference fills four buttons; cyan would stop meaning "act here". |
| 10 | Glow is a **closed list of four static radial gradients**, never `filter: blur`, never animated: hero device backdrop, Control Layer SVG glow, trial-band wash, final-CTA wash. | The owner asked for "glow (discreet)". Brand §39 allows neon nowhere else. `radial-gradient` costs nothing on low-end GPUs; blur filters do not. |

---

## 1. Visual analysis of the reference

### 1.1 Grid and measured geometry (converted to a 1440 page)

| Element | Measured | v2 value |
|---|---|---|
| Content column | x 152 → 1288 ≈ **1136** | **1136**: the current `Container` (`max-w-[1200px] px-8`), the same box as the app's content (visual-v2 §3.5) |
| Header | ≈ 58 tall; logo, then 4 links, then "Entrar" and a blue button at the right | **64** (56 < 768), sticky |
| Hero text column | ≈ 432 wide; H1 ≈ 42 px, 2 lines, line 2 blue | **520** column; H1 48 (§2.3) |
| Hero visual | lid ≈ 486 wide, phone ≈ 112, callout ≈ 112 × 68 at top-right; bleeds ≈ 60 px past the content edge | lid 505, phone 123, callout 168; **48 px bleed** (§4.3) |
| Section dividers | full-bleed 1 px, `#001A37` | full-bleed 1 px `border` `#1F2937` |
| Section padding | ≈ 35–50 | **48 / 64 / 80** (brand §16 "section spacing 40–96") |
| Problem cards | 3 × ≈ 192, gap ≈ 16, radius ≈ 8, round icon tile ≈ 36 | 3 × 201, gap 16, radius **12**, square icon tile **40** (the app tile) |
| Steps | 6 × ≈ 189 pitch, 1 px vertical dividers, → between columns | 6 × 189, dividers, arrow badge sitting on the divider |
| Product | text ≈ 344 · module cards 4 + 2 at ≈ 135 · preview ≈ 166 | text 357 · module cards 2 × 3 at 216 · preview 268 |
| FAQ | intro ≈ 280 + three boxes ≈ 280 | intro 276 + three columns 265 |
| Final CTA card | full content width, ≈ 92 tall, radius ≈ 10, bg `#01121C` | full width, radius **16**, `surface-elevated` + wash |
| Footer | one row ≈ 40 tall | two rows (legal disclaimer and legal links need room, §4.12) |

### 1.2 Rhythm, density, surfaces

- **Rhythm:** one dark canvas. Sections are separated by full-bleed hairlines, not by alternating backgrounds. Each section is a two-column composition: text and CTA on the left, evidence on the right (cards, diagram, list, screenshot). The spec keeps that grammar and fixes the proportions to a 5 : 7 split (§3.3).
- **Density:** the render is denser than brand §16. Padding goes to 48/64/80, which is still about half of today's landing (64/96/128), as the owner's reference asks.
- **Surfaces:** the canvas, plus one elevated step for cards (the render's `#020E18` is barely lifted). v2 uses `surface-elevated` `#111827`. That is the same card the screenshot shows, so the landing's cards and the product's cards are literally the same surface.
- **Borders:** 1 px everywhere. The render tints them navy. v2 uses neutral `border` for structure, `border-strong` for floating layers and device edges, and `primary-text` only on the one recommended plan and on outline buttons.
- **Radius:** 8 for controls and tiles, 12 for cards, 16 for the final CTA card and the drawer, pill for chips and tags (v2 §2.5). The v1 pins (6/8) go away.
- **Shadows:** none on cards. `shadow-popover` (dark value) only on the floating product chip; `shadow-modal` on the drawer.
- **Glow:** the render glows everywhere (edges, tiles, planes, hexagon). Only the closed list in §0-10 is kept.
- **Icons:** outline, round caps, ≈ 1.5 px at 20. **Lucide, `strokeWidth={1.5}`**, 20 px in tiles and 16 px inline, as in the app. The render's shields (Compliance chip, "Riscos regulatórios") are replaced (brand §20).
- **Type:** Inter only. Headings are semibold, with bold only for the H1, and tracking −1.2%. Uppercase eyebrows have wide tracking.

---

## 2. Tokens

### 2.1 How the landing becomes dark (`app/globals.css`)

1. **Delete** the `.theme-dark { … }` and `.theme-light { … }` blocks and the v1 non-colour pins in `.landing { … }` (radius 6/8, v1 type scale, v1 shadows, `--score-glow`). Delete `--color-obsidian`, `--color-off-white`, `--color-electric-blue` from `@theme`: after this change their only consumers are the deleted marketing files (verified by grep, 2026-09-27).
2. **Add** one colour pin, screen only:

```css
@media screen {
  /* Landing v2 (landing-v2.md §2): app-dark v2 values for every visitor; canvas one step deeper. */
  :where(.landing) {
    color-scheme: dark;
    --shadow-popover: 0 8px 24px rgb(0 0 0 / 0.45), 0 2px 6px rgb(0 0 0 / 0.3);
    --shadow-modal: 0 24px 56px rgb(0 0 0 / 0.6);
    --m-glow: rgb(6 182 212 / 0.14);   /* hero device backdrop (§4.3.5) */
    --m-wash: rgb(6 182 212 / 0.07);   /* trial band + final CTA wash (§4.9, §4.11) */

    --color-surface-base: #030712;     /* Canvas — gray-950, one step below #0B0F14 */
    /* every other --color-* token: copied verbatim, in hex, from html[data-theme="dark"] */
  }
  html:has(.landing) { color-scheme: dark; }
  body:has(.landing) { background: #030712; }
}
```

- `:where(.landing)` has zero specificity, and that is enough: a custom property declared on the wrapper always beats the value inherited from `html`. The selector string is also unique, which the tests use as an anchor (§10.3). If the engineer prefers `.landing`, the tests must find the block by a marker comment instead.
- Keep hex values, never `var()` aliases (visual-v2 §2.1 rule; `var()` would resolve to the html theme).
- Print: the pin is screen-only, so print uses the `@theme` light values (dark text on white). `/termos` and `/privacidade` stay printable.
- Keep the existing `.landing { overflow-x: clip }` and the `summary::-webkit-details-marker` rule. The wrapper also gets `min-h-dvh`, so short pages never show the body colour.
- Browser chrome: the marketing layout's existing inline script (the `js` flag) also sets `<meta name="theme-color">` to `#030712`. The root bootstrap may have written the app colour for a returning user with a stored preference.

### 2.2 Tokens the landing uses (all v2; nothing new in `@theme`)

| Group | Tokens |
|---|---|
| Surfaces | `surface-base` (Canvas `#030712`), `surface-elevated` `#111827`, `surface-hover` `#18212F`, `primary-tint` `#0A2D37` |
| Lines | `border` `#1F2937` (structure, dividers), `border-strong` `#374151` (device edges, tags, floating chip, callout), `info-border` `#095A6A` (leader line, trial-band border), `outline` `#22D3EE` |
| Text | `text-primary` `#F3F4F6`, `text-secondary` `#B4BDCA`, `text-muted` `#8A94A6`, `primary-text` `#22D3EE`, `primary-text-hover` `#67E8F9` |
| Action | `primary` `#06B6D4`, `primary-foreground` `#0B0F14`, `primary-hover` `#22D3EE`, `primary-active` `#0891B2`, `outline-hover` `#0A2D37`, `focus` `#22D3EE`, `backdrop` |
| Non-colour | `radius-md/lg/xl/pill`, `shadow-popover`, `shadow-modal`, app type scale, display scale, motion tokens, breakpoints |
| Effect vars (not `--color-*`, landing scope only) | `--m-glow`, `--m-wash` |

- New **token names**: none. New **value**: Canvas `#030712`, as the landing-scope `surface-base`.
- `--m-glow` and `--m-wash` are the only literal colours outside the colour blocks. They are the primary hue at a stated alpha, and live next to the pin.

### 2.3 Type mapping (Inter; v2 scales)

| Element | Token / utility | Size ceiling · LH · weight | Fluid |
|---|---|---|---|
| Hero H1 | `text-hero`, **re-pointed** to display-l | 48 · 1.08 · 700 · −0.012em | `clamp(2rem, 1.1rem + 3vw, 3rem)`: 32 at ≤ 480, ≈ 41 at 768, 48 at ≥ 1024 |
| Control Layer H2 · legal H1 | `text-section` (display-m) | 40 · 1.12 · 600 | 28 → 40 |
| All other section H2 | `text-section-long` (display-s) | 32 · 1.18 · 600 | 26 → 32 |
| Final CTA title | `text-h1-compact` (≥ 1280: `text-h1`) | 24 · 1.25 · 600 (28 · 1.2) | — |
| Plan name, trial title | `text-h2` | 20 · 1.3 · 600 | — |
| Card / step / module / IA / FAQ titles | `text-h3` | 16 · 1.4 · 600 | FAQ questions: `text-body-sm` 500 at ≥ 1024, `text-body` 500 below |
| Hero lead | `text-body-lg` | 18 · 1.6 | — |
| Section leads | `text-body` | 16 · 1.6 | — |
| Card text, lists, nav | `text-body-sm` | 14 · 1.5 | — |
| Eyebrow | `text-label` + `tracking-[0.08em]` uppercase | 12 · 1.35 · 500 | colour `primary-text` |
| Captions, metadata | `text-caption` | 12 · 1.4 | — |
| Plan price | `text-score-compact` | 40 · 1 · 600 · tabular | — |

- `text-hero` changes its `font-size` clamp and sub-properties to the display-l values. `text-final` loses its last consumer and is **deleted**. `--text-display-xl` stays in `@theme` as a brand-scale token, unused on this page (the tests assert it exists).
- Width check (Inter Bold advance widths, estimated): "Controle seu negócio." ≈ 10.15 em, so 487 px at 48 and 325 px at 32. "Conheça seus riscos." ≈ 9.91 em, so 476 / 317 px. Each sentence fits on one line in the 520 px column at ≥ 1280, and in the 343–398 px content at 375–430. At 320 it wraps; `text-balance` on each line span keeps the wrap even.
- Weight 700 appears only on the H1 (already in the build).

### 2.4 Radius, spacing, borders (landing)

- **Radius:** controls, icon tiles and the screenshot inside the lid use 8 (the lid inner screen uses 6/4, §4.3.3). Cards, FAQ columns, callout and product preview use 12. The final CTA card and the drawer use 16. Chips, tags and badges are pill.
- **Spacing:** 4 px base.
  - Section padding-block: **48** (< 768) / **64** (768–1279) / **80** (≥ 1280).
  - Intro rhythm: eyebrow → H2 **12**; H2 → lead **16**; lead → CTA **32**; intro → content when stacked **40** (≥ 768) / **32**.
  - Card padding: **24** (20 on module cards; 16 < 640). Grid gaps: **16** inside card groups, **24** between plan cards.
- **Borders:** 1 px. Every section after the hero has `border-top: 1px solid var(--color-border)` on the full-bleed `section` element.

### 2.5 Contrast on the landing (hand-computed; machine-checked by §10.3)

Surface luminance: Canvas `#030712` = 0.00215; elevated `#111827` = 0.00919; hover `#18212F`; tint `#0A2D37`; wash worst case ≈ `#102535` (elevated + 7–8% cyan) = 0.01691.

| Foreground | on Canvas | on elevated | on hover | on tint | on wash | Required |
|---|---|---|---|---|---|---|
| `text-primary` `#F3F4F6` | **18.30** | 16.12 | 14.71 | 13.22 | 14.26 | 4.5 |
| `text-secondary` `#B4BDCA` | **10.62** | 9.35 | 8.53 | 7.67 | 8.28 | 4.5 |
| `text-muted` `#8A94A6` | **6.58** | 5.80 | 5.29 | 4.76 | 5.13 | 4.5 |
| `primary-text` / `focus` `#22D3EE` (eyebrows, H1 line 2, links) | **11.14** | 9.82 | 8.96 | 8.05 | 8.69 | 4.5 |
| `primary-text-hover` `#67E8F9` | **13.89** | 12.24 | — | — | — | 4.5 |

| Pair | Ratio | Required |
|---|---|---|
| `primary-foreground` `#0B0F14` on `primary` / hover / active | 7.92 / 10.64 / 5.22 | 4.5 |
| `primary` button fill vs Canvas / elevated (boundary) | 8.29 / 7.31 | 3.0 |
| `outline` border vs Canvas / elevated | 11.14 / 9.82 | 3.0 |
| Focus ring vs Canvas | 11.14 | 3.0 |
| Recommended-plan border (`primary-text`) vs elevated | 9.82 | 3.0 (meaning is also carried by the badge text) |
| `border` vs Canvas · `border-strong` vs Canvas · `info-border` vs Canvas | 1.37 · 1.95 · 2.57 | decorative only; no state depends on them |

---

## 3. Page structure and grid

### 3.1 Section order, ids, headings

| # | Section | `id` (anchor) | Heading | Eyebrow (Marketing copy) |
|---|---|---|---|---|
| — | Header | — | — | — |
| 1 | Hero | `hero` | **h1** | yes |
| 2 | O problema | `problema` | h2 `text-section-long` | "O PROBLEMA" |
| 3 | The Control Layer | `control-layer` | h2 `text-section` | "THE CONTROL LAYER" (`lang="en"`) |
| 4 | Como funciona | `como-funciona` | h2 `text-section-long` | "COMO FUNCIONA" |
| 5 | Produto | `produto` | h2 `text-section-long` | "PRODUTO" |
| 6 | Menos trabalho manual | `menos-trabalho-manual` | h2 `text-section-long` | "RISK BRAIN + RISK RADAR" (`lang="en"`) |
| 7 | Planos | `planos` | h2 `text-section-long` | "PLANOS" |
| 8 | FAQ ("Tire suas dúvidas.") | `faq` | h2 `text-section-long` | "FAQ" |
| 9 | Final CTA | `comecar` | h2 `text-h1-compact` | — |
| — | Footer | — | — | — |

### 3.2 Container and breakpoints

- `Container` is unchanged: `mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8`.
- Content width: 288 (320) · 343 (375) · 358 (390) · 398 (430) · 720 (768) · 960 (1024) · **1136** (≥ 1200, including 1280, 1440, 1920+, centred).
- Composition bands used throughout:

| Band | Widths | Character |
|---|---|---|
| **S** | < 768 | one column, left-aligned, essentials first |
| **M** | 768–1023 | one column for text, 3-up grids |
| **L** | 1024–1279 | two-column where the right side has room; hero still stacked |
| **XL** | ≥ 1280 | the reference composition, content fixed at 1136 |

### 3.3 Section frame and intro (primitives)

- **`Section`** (restyle of the existing primitive):
  - `section` with `aria-labelledby="{id}-heading"`, `scroll-mt-[72px] md:scroll-mt-20`.
  - Padding-block per §2.4; `border-t border-border`; background inherits the Canvas.
  - The `tone` prop and the `theme-dark` beat are **removed**.
- **`SectionIntro`** (replaces `SectionHeading`):
  - `Eyebrow` (`p`, `text-label uppercase tracking-[0.08em] text-primary-text`, **no dot**, optional `lang`).
  - h2 (`size: "s" | "m"` → `text-section-long` | `text-section`), `text-primary`, `text-pretty`, max-w 22ch.
  - Optional lead: `text-body text-secondary`, max-w 56ch.
  - Optional CTA (`CtaLink`, §4.2).
- **Two-column sections:** `grid` with `grid-template-columns: minmax(0,5fr) minmax(0,7fr)`, column-gap **48** (XL) / **40** (L). At 1136 that gives **453 | 635**. Items are `align-items: center` unless noted.

---

## 4. Components

### 4.1 Header and drawer (`site-header.tsx`, restyle; behaviour kept)

- **Frame:**
  - `header`, `sticky top-0 z-40`, height **64** (56 < 768), background `surface-base` (opaque Canvas).
  - Bottom border: `border-transparent` at scroll 0, then `border-border` once a 1 px sentinel at the top of `main` leaves the viewport (`data-scrolled`, the same IntersectionObserver instance as the existing hero sentinel, 150 ms colour transition).
  - Never translucent, never `backdrop-filter`.
- **Left:**
  - `Lockup` (**amended by D41, 2026-09-28**): the official horizontal logo `BrandLogo size="md"` — symbol 24 and "COMPLIANCE" 15/700 caps in `text-primary`, superscript "OS" 9/700 in `primary-text`, gap 10; link `/`, accessible name "Compliance OS — início".
  - The wordmark shows from **390 px** (`min-[390px]:inline-flex`, prop `symbolOnlyNarrow`); below that the symbol shows alone.
    - Width check at 390 (measured): lockup 149 + gap 16 + CTA "Comece grátis" 130 + 8 + menu 44 = 347 ≤ 358.
    - At 375 the same total does not fit in 343.
  - At ≥ 1024: `nav aria-label="Principal"` 40 px after the lockup. Links are h 40, padding-inline 12, `text-body-sm` 500 `text-secondary`, hover `text-primary`, 150 ms.
  - Items, in Marketing's order: **Produto** `#produto` · **Como funciona** `#como-funciona` · **Planos** `#planos` · **Dúvidas** `#faq`. "Segurança" is removed with its section.
- **Right:**
  - "Entrar" (≥ 768): the same nav-link style, not cyan.
  - CTA "Comece grátis", `CtaLink size="sm"`: **outline** while the hero is on screen, **primary** after the hero sentinel. On pages without a hero it is primary from the start. Trailing arrow at ≥ 768.
  - Menu button `Menu` 20 in a 44 × 44 box (< 1024), `aria-label` "Abrir menu" (the close button in the drawer: "Fechar menu"), `aria-expanded`.
- **Drawer** (existing native `<dialog>`; focus trap, Esc, backdrop and return are kept):
  - Slides from the **right**, `m-drawer`. Width 300, `max-w-[85vw]`, full height, radius 0.
  - Background `surface-elevated`, `shadow-modal`, `backdrop:bg-backdrop` (**replaces `backdrop:bg-obsidian/40`**).
  - Contents:
    - Top row 56: `Lockup` + close `X` 44.
    - Anchors: h 48, `text-body`, hover `surface-hover`, radius 8.
    - A block with `border-t`, pt 16, gap 12: "Entrar" outline md, full width; CTA primary md, full width.
  - Following an anchor closes the drawer.

### 4.2 Buttons (`cta.tsx`, restyle)

| Variant | Classes (tokens) | Use |
|---|---|---|
| `primary` | `bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active` | conversion CTA; one filled per viewport (+ header) |
| `outline` (replaces `secondary`) | `border border-outline text-text-primary hover:bg-outline-hover active:border-primary`, transparent bg | every other CTA |
| `tertiary` | `text-primary-text underline decoration-1 underline-offset-2 hover:text-primary-text-hover` | inline links (**fixes** today's `hover:text-info-fill`) |

- **Sizes:**
  - `sm` h 40 (header), padding-inline 16, `text-body-sm` 500, `max-lg:min-h-11`.
  - `md` h 44, padding-inline 20, `text-body-sm` 500.
  - `lg` h 48, padding-inline 24, `text-body` 500.
  - Radius 8, gap 8, `whitespace-nowrap`.
- **`arrow` prop:**
  - `"forward"`: `ArrowRight` 16 (18 at lg), stroke 1.5. On parent hover it moves `translate-x-0.5` over 150 ms.
  - `"external"`: `ArrowUpRight` 16 + `<span class="sr-only"> (abre em outro site)</span>`. Used for the Kiwify checkouts.
  - Arrows are `aria-hidden`.
- **States:** focus-visible uses the global 2 px `focus` ring, offset 2. Pressed uses the active colours. The existing internal/external routing logic (`Link` vs `<a>`) is kept.

### 4.3 Hero (`hero.tsx`, rewrite; new `device-frames.tsx`)

#### 4.3.1 Layout

| Band | Composition |
|---|---|
| XL | `grid-template-columns: 520px minmax(0,1fr)`, column-gap 48, `align-items: center`. Text left; visual right (column 568 → visual box **616** with `margin-right: -48px`, safe because the side margin is ≥ 72 at 1280). |
| M, L | Stacked and **centred**: text block `max-w-[720px] mx-auto text-center` (CTAs, microcopy and chips `justify-center`), visual box **720** centred, margin-top 48. |
| S | Stacked, **left-aligned**; visual box = content width, margin-top 40. |

- Section padding: top 32 (S) / 48 (M, L) / 64 (XL); bottom 48 / 64 / 80. No top border. The existing 1 px `HERO_SENTINEL_ID` element stays at the end of the section.

#### 4.3.2 Text column (DOM order = reading order)

1. Eyebrow: `Eyebrow`, cyan.
2. h1, `text-hero`, two `span.block.text-balance`: line 1 `text-primary`, **line 2 `text-primary-text`**. That is the reference's highlighted line and the only cyan heading on the page. mt 12.
3. Lead: `text-body-lg text-secondary`, max-w 52ch, mt 20.
4. CTA row, mt 32, gap 12: primary lg "Comece grátis" `arrow="forward"` + outline lg "Ver como funciona" → `#como-funciona`. Stacked full-width below 640, a row from 640.
5. Microcopy, mt 12: "Primeiro mês grátis · Sem cartão de crédito · 12 perguntas para o primeiro Score", in `text-caption text-muted`. The separators are `aria-hidden` "·" with 8 px margin. At 12 px it is ≈ 500 px wide, so it stays on one line in the 520 px column. It wraps per item (`inline-block` items) below that.
6. Chip row, mt 32: `ul`, `aria-label="O que o Compliance OS organiza"`, flex-wrap, gap-x 16, gap-y 8. Five items: Proteção de dados · Riscos · Controles · Ações · Evidências.
   - Each item: a Lucide 16 icon `text-muted` + `text-body-sm text-secondary`, gap 6. No borders, no shields.
   - Width check: ≈ 518 px, so it may wrap to 2 lines at XL; wrapping is acceptable.
   - Icons are from the product family, all verified in the installed lucide-react 1.x:

     | Chip | Icon |
     |---|---|
     | Proteção de dados | `Database` |
     | Riscos | `TriangleAlert` |
     | Controles | `Layers` |
     | Ações | `ListChecks` |
     | Evidências | `FileCheck` |

Marketing's optional audience line ("Para empresas que precisam mostrar controle…") is **not** placed in the hero:
- The column already holds six blocks.
- The lead's last sentence already qualifies the buyer.
- The line lives on in FAQ 8.

#### 4.3.3 Device frames (`device-frames.tsx`: `LaptopFrame`, `PhoneFrame`)

These are server components. Frames only; the children are the `<img>` elements. They carry no domain knowledge.

**Visual box:**
- `figure`, `position: relative`, width **B** (per §4.3.1).
- Padding-top 0 (S) / **72** (M, L, XL: the callout zone).
- A `figcaption` follows the box (§4.3.8).

All proportions below are relative to B, so one component serves every width:

| Part | S (< 768) | M, L (768–1279) | XL (≥ 1280) |
|---|---|---|---|
| Laptop group (in flow) | width **88% B**, `margin-bottom: 16px` | same | same, + perspective (§4.3.6) |
| Lid | width 93.2% of group (= 82% B), `mx-auto` | same | same |
| Lid bezel (top / sides / bottom) | 6 / 6 / 10 | 8 / 8 / 14 | 8 / 8 / 14 |
| Lid radius (outer) | 10 10 4 4 | 14 14 6 6 | 14 14 6 6 |
| Lid surface | `surface-base` (Canvas) + 1 px `border-strong` | same | same |
| Screen | `aspect-ratio: 16/10`, radius 4, overflow hidden, placeholder `surface-elevated` | radius 6 | radius 6 |
| Base (deck) | full group width, h 10, `bg-border`, 1 px top `border-strong`, radius 0 0 8 8 | h 14, radius 0 0 12 12 | same |
| Base notch | centred, 16% × 3, `surface-elevated`, radius 0 0 4 4 | 16% × 4 | same |
| Phone | `absolute right-0 bottom-0`, width **26% B**, z 2 | width **20% B** | 20% B |
| Phone bezel / radius | 4 / 16 (screen radius 12) | 5 / 22 (screen 17) | 5 / 22 |
| Phone surface | `surface-base` + 1 px `border-strong`; screen `aspect-ratio: 390/844`, placeholder `surface-elevated` | same | same |
| Callout + leader line | hidden | shown (§4.3.4) | shown |
| Glow | §4.3.5 | same | same |

Resulting sizes (content/visual box → screen image sizes):

| Width | B | Laptop screen | Phone screen | Box height |
|---|---|---|---|---|
| 320 | 288 | 224 × 140 | 67 × 145 | ≈ 180 |
| 390 | 358 | 282 × 176 | 85 × 184 | ≈ 218 |
| 768–1279 | 720 | 574 × 359 | 134 × 290 | ≈ 483 |
| ≥ 1280 | 616 | 489 × 306 | 113 × 245 | ≈ 430 |

- The phone always overlaps the laptop's lower-right corner by ≈ 35–40 px, or the base end at XL, where the perspective pulls the lid's right edge back. It is always in front.
- No notch or camera is drawn: the screenshots are web viewports, and a notch would cover the app's top bar.

#### 4.3.4 Callout and leader line (M, L, XL)

- Both live **inside the phone wrapper**, so they follow the phone at every width. No container queries are needed.
- **Leader line:**
  - `absolute`, `bottom: 100%`, `left: 50%`, width 1, height **64**, background `info-border`.
  - Node: a 7 px circle, 1.5 px border `primary-text`, background `surface-base`, centred on the phone's top edge.
  - `aria-hidden`.
- **Callout card:**
  - `absolute`, `bottom: calc(100% + 64px)`, `right: 0` (aligned to the phone's right edge), width **168**, min-height 88.
  - Padding 12 × 16, radius 12, `surface-elevated`, 1 px `border-strong`, no shadow, z 3.
  - Text: 2–3 lines, `text-body-sm` 500 `text-primary`, `line-height: 1.5`. Real text, read in order after the images.
- Resulting position:
  - XL: callout y ≈ 23–111, x 448–616. It overlaps ≈ 57 × 38 px of the lid's top-right corner, which is the screenshot's header corner, so the layering reads as depth.
  - M, L: y ≈ 31–119.
- Copy (Marketing): "Mais clareza." / "Mais controle." / "Mais confiança." One `span.block` per line (≤ 16 chars each).
- The copy is a neutral outcome statement. The line reads as "this is what the product gives you" and makes no claim about the phone screen.

#### 4.3.5 Glow (discreet)

- One `div`, `aria-hidden`, `absolute inset-0`, `z-0`, `pointer-events-none`, inside the visual box, behind the laptop.
- `background: radial-gradient(60% 55% at 45% 55%, var(--m-glow), transparent)`. Peak alpha is 0.14, mostly hidden behind the opaque lid, so what shows is a faint halo around the lid edges.
- Static. No blur filter, no animation. It never sits behind text.

#### 4.3.6 Perspective: kept at XL only

- XL: the laptop group gets `transform: perspective(1800px) rotateY(10deg)` with `transform-origin: 0% 50%`. The right edge recedes by ≈ 5%, so the screen turns toward the headline, as in the reference.
  - It is a static transform: one composited layer, no per-frame cost, no `will-change`.
  - The phone, callout and glow stay flat, which gives the depth.
- Below 1280: **none**. There the device is centred under the text, so a turn would look asymmetric. A flat front view gives the largest, sharpest screenshot on the screens where it is already small.

#### 4.3.7 Images: source, `sizes`, priority (LCP)

- **Assets** (delivered, §8.3): `hero-desktop.webp` **1440 × 900 (1×)** and `hero-phone.webp` **780 × 1688 (2×)**.
  - The 1× desktop capture is **sufficient**. The largest rendered screen is 574 CSS px (M/L), which is 1148 device px at DPR 2. XL renders 490 CSS px (980 at DPR 2). A 390 px phone at DPR 3 renders ≈ 846 device px.
  - The optimizer never upscales, so the largest candidate is the 1440 source.
  - A 2× re-capture is only worth it if the rendered size grows.
  - Import them statically from `src/assets/marketing/`, so width and height are checked at build.
  - No blur placeholder: the screen shows `surface-elevated` until the image paints.
- **Rendering:** `getImageProps()` from `next/image` + a plain `<img>` inside the server component. This keeps the optimizer (srcset, WebP) with **zero client JS**.
  - Desktop image: `priority: true` → `fetchPriority="high"`, `loading="eager"`.
  - Also call `preload(src, { as: "image", imageSrcSet, imageSizes, fetchPriority: "high" })` from `react-dom` in the hero, so the `<link rel="preload">` is emitted.
  - Phone image: default lazy.
- **`sizes`** (= the rendered screen widths above):
  - Desktop: `"(min-width: 1280px) 490px, (min-width: 768px) 574px, calc(82vw - 38px)"`
  - Phone: `"(min-width: 1280px) 114px, (min-width: 768px) 134px, calc(26vw - 16px)"`
- `object-fit: cover`, `object-position: top`. `alt` from Marketing (§7.4).
- No entrance animation on the desktop image (§6.2): an image fading in from opacity 0 delays LCP.

#### 4.3.8 Caption

- Under the box, mt 16: `text-caption text-muted`, centred at M/L, left at S and XL.
- The demo-data caption is kept (today: "Exemplo com dados ilustrativos de uma organização fictícia."). The screenshot shows a fictitious organization's numbers, and the page must say so (CLAUDE.md §23).

### 4.4 O problema (`problem.tsx`, new; replaces `before-after.tsx`)

- **Layout:**
  - XL: 5 | 7 (§3.3). Intro left. Right: `ul` of **3 cards**, 3-up, gap 16 (card 201 wide).
  - L and M: stacked, intro max 720, then 3-up grid (L: 309 wide; M: 229 wide).
  - S: stacked; cards become **rows** (tile left, text right, gap 16, padding 16), gap 12.
- **Card:**
  - `li`, `surface-elevated`, 1 px `border`, radius 12, padding 24 (16 at S).
  - Icon tile 40 (radius 8, `primary-tint`, icon 20 `primary-text`, `aria-hidden`).
  - Title h3 `text-h3 text-primary`, mt 16.
  - Text `text-body-sm text-secondary`, mt 8.
  - **Static:** no hover, no link, no chevron.
- **Copy:** Marketing's cards 1, 2 and **3A**. Each card text is **one `p`** holding the two lines as two sentences; there are no forced breaks. At XL the 153 px inner width gives ≈ 4 lines, and the cards stretch to equal height.
- **Icons** (never a shield or a lock):

  | Card | Icon |
  |---|---|
  | Processos manuais | `Clock` |
  | Informações dispersas | `Files` |
  | Pedidos de clientes (3A) | `FileQuestionMark` (the lucide 1.x name) |

- Option 3B ("Riscos regulatórios") is layout-compatible but is FLAG-CR in the copy, and it is not recommended (brand §62).

### 4.5 The Control Layer (`control-layer.tsx` + `layers-figure.tsx`, new; replace `control-chain.tsx`)

#### 4.5.1 Layout

- **XL, L:** 5 | 7. Intro left (`size="m"`) with an **outline** CTA ("Conheça o produto" → `#produto`, `arrow="forward"`). Figure right, `max-w-[560px]`, `justify-self: center`.
- **M and 640–767:** stacked. The figure sits below the intro, max-w 560, centred, with side labels.
- **< 640 ("narrow"):** stacked. The figure is **cropped to the planes** and the labels become a list under it (Marketing: "on mobile the labels become a plain list"). See §4.5.3.

#### 4.5.2 Figure anatomy

Element: `figure`, `relative`, `aspect-ratio: 560/412`. It contains:
- an inline `svg`, `viewBox="0 0 560 412"`, `absolute inset-0 w-full h-full`, `aria-hidden`;
- an HTML `ol` of labels, `aria-label="Camadas, do topo à base"`.

There is no `figcaption` and no alt. The labels are real text, so Marketing's figure alt would only repeat them to screen readers. Keep the alt in `copy.ts` only if a static export ever needs it.

**SVG geometry.** Five planes i = 0 (top) … 4 (bottom):
- Plane i has centre `(144, cy_i)` with `cy_i = 88 + 64·i` (88, 152, 216, 280, 344), half-width 140, half-height 56 (a 2.5 : 1 rhombus), thickness 6.
- Top face: `M144,{cy−56} L284,{cy} L144,{cy+56} L4,{cy} Z`.
- Front edge: `M4,{cy} L144,{cy+56} L284,{cy} L284,{cy+6} L144,{cy+62} L4,{cy+6} Z`.
- **Paint order:** glow, then planes 4 → 0 (bottom first), then connectors.

**Paint:**
- Colours come from tokens through classes or `style` (`fill-primary`, `stroke-primary-text`, `[stop-color:var(--color-primary)]`), never hard-coded in attributes.
- Face fill: `linearGradient` (objectBoundingBox, top → bottom) from `primary-tint` to `surface-base`, `fill-opacity` 0.92. Lower planes show faintly through upper ones (layers, brand §22).
- Face stroke: `primary-text`, 1.5 px, `vector-effect: non-scaling-stroke` (it stays 1.5 px when the SVG scales to 288 px). Stroke opacity by depth, i = 0…4: **1 · 0.72 · 0.52 · 0.38 · 0.28**.
- Edge fill: `primary`, fill opacity **0.30 · 0.18 · 0.14 · 0.10 · 0.08**.
- **Top plane only:**
  - Control-point lattice: 6 × 6 interior points P = T + (a/7)(R−T) + (b/7)(L−T), for a, b = 1…6. T, R and L are the top, right and left vertices. Each point: r 1.25, `primary-text`, fill opacity 0.45 (36 circles).
  - Centre node: r 3.5 `primary-text`, plus a ring r 9, stroke 1, opacity 0.5.
- **Static glow:** `ellipse cx=144 cy=96 rx=200 ry=96`, filled by a `radialGradient` from `primary` at stop-opacity **0.22** to 0. Painted first. No filter.
- **Connectors**, one per plane:
  - Node at the right vertex `(284, cy)`: r 2.5, `primary-text` for i = 0, `text-muted` for the others.
  - Line `(292, cy) → (312, cy)`: 1 px `border-strong`, non-scaling.

**Labels (HTML `ol`):**
- Item i is `absolute`, `top: calc(cy_i / 412 * 100%)`, `left: 57.14%` (x 320), `right: 0`, `margin-top: -10px` (centres the first line on the connector).
- Label: `text-body-sm`, nowrap. i = 0 is 500 `text-primary`; the others are 400 `text-secondary`. There are no descriptors (Marketing supplied none).
- Copy, top → bottom (Marketing): **Score e Visão geral** · Riscos e prioridades · Controles e documentos · Ações e responsáveis · Evidências e Histórico.
  - The emphasised top plane is the resulting visibility.
  - Evidence is the base layer, so the picture reads "a prova sustenta o Score".
- Width check: the longest label, "Controles e documentos" (22 chars), is ≈ 175 px at 14/500.
  - The label column (from x 320 to the right edge) is 240 px at 560 and 230 px at L (537).
  - At a 592 px content width (640 viewport) the figure is still 560.
  - Side labels therefore always fit at ≥ 640.

#### 4.5.3 Narrow variant (< 640)

- The figure becomes `max-w-[292px] mx-auto`, `aspect-ratio: 292/412`, `overflow: hidden`.
- The same SVG is set to `width: 191.8%` (= 560/292), `max-width: none`, `height: auto`. The container therefore shows only x 0–292 of the viewBox: the planes and their corner nodes. The connector lines are cut.
- There is one DOM and no second SVG.
- The label `ol` switches from absolute positioning to normal flow under the figure, mt 16, `flex flex-col gap-8`.
  - Each item: an 8 px dot (`primary-text` for the first, `text-muted` for the others) + the label `text-body-sm` (the first at 500 `text-primary`).
  - Same order as the planes.

**Size:** DOM ≈ 5 planes × 2 paths + 36 dots + 5 connectors, ≈ 5 kB of markup, server-rendered.

### 4.6 Como funciona (`steps.tsx`, rewrite)

- **Intro:** full width, max 720. The title is "Do diagnóstico à prova, em um único fluxo."
- Marketing's optional note on step 01 (the seven areas) is **not** rendered as a tooltip, because tooltips fail on touch and for keyboard users. If the owner wants it, it goes as a `text-caption text-muted` line under the list, mt 24.
- **List:** `ol` (six steps), mt 40 (32 at S). Each `li` contains, in order:
  - icon tile 40;
  - number `text-label tabular-nums text-muted` "01"…"06", `aria-hidden`, mt 16;
  - title h3 `text-h3`, mt 4;
  - text `text-body-sm text-secondary`, mt 8.

| Band | Layout |
|---|---|
| XL | `grid-cols-6`, gap 0. Items 2–6 have `border-l border-border`; padding-inline **16** (first item pl 0, last pr 0). Column pitch 189, text width ≈ 157. Marketing's step text is ≈ 100–115 chars (two fragments rendered as **one** `p`), so it runs to ≈ 5–6 lines at XL. Row height ≈ 240; items stretch to equal height. |
| L, M | `grid-cols-3`, row-gap 40, the same divider/padding rules applied **per row** (items 1 and 4 have no left border and pl 0; items 3 and 6 pr 0). |
| S | Vertical timeline. Each `li` is a grid `40px 1fr`, gap 16, tile left, text right, pb 24. A connector (1 px `border`) runs from 4 px under the tile to 4 px above the next tile (`::before`, left 20). No arrows. |

- **Arrow badge** (XL, L, M; not on the last item of a row):
  - `absolute`, `top: 8px`, `right: -12px`, so it is centred on the divider at the tile's centre height.
  - 24 × 24, radius pill, background `surface-base` (it interrupts the divider line).
  - `ArrowRight` 16 `text-muted`, stroke 1.5, `aria-hidden`.
- **Icons**, following the product flow (CLAUDE.md §3):

  | Step | Icon |
  |---|---|
  | Diagnosticar | `ClipboardList` |
  | Entender | `ScanSearch` |
  | Priorizar | `ListOrdered` |
  | Corrigir | `ListChecks` |
  | Comprovar | `FileCheck` |
  | Monitorar | `History` |

### 4.7 Produto (`product.tsx`, new; replaces `feature-story.tsx`, `story-figures.tsx`, `product-figure.tsx`)

#### 4.7.1 Layout

| Band | Composition |
|---|---|
| XL | `grid-template-columns: minmax(0,4fr) minmax(0,5fr) minmax(0,3fr)`, gap 32 → **357 · 447 · 268**. Intro (+ outline CTA) · module grid (2 cols × 3 rows, gap 16, cards 216) · preview. `align-items: start`. |
| L | Intro full width (max 720); below it, a grid `8fr 4fr`, gap 24: modules (2 cols) · preview (≈ 312–370 wide). |
| M | Intro; modules 3 cols × 2 rows (229). **No preview**: the hero already shows the same screen, and this saves a request. |
| S | Intro; modules as rows, 1 column (2 columns from 640). No preview. |

- Section CTA: "Comece grátis" → `/criar-conta`, **outline** with `arrow="forward"`. Marketing left filled vs outline to UX. Outline, because the header CTA is already filled at this scroll depth (§0-9).

#### 4.7.2 Module card

- `li`, `surface-elevated`, 1 px `border`, radius 12, padding 20 (16 at S), flex column, gap 12.
- Content: icon tile 40 · name h3 `text-h3 text-primary` (`lang="en"`, module names stay in English, as in the app) · description `text-body-sm text-secondary`. Marketing's two lines are one `p`: ≈ 80–95 chars, about 4 lines at XL (176 px inner). Cards in a row stretch to equal height.
- Compliance Room carries Marketing's tag "Plus e Ultimate":
  - v2 tag anatomy: h 24, pill, padding-inline 10, 1 px `border-strong`, `text-caption` 500 `text-secondary`.
  - It sits under the name, mt 8, with no colour of its own, so it informs without competing.
- S: row layout (tile left).
- **Static:** no chevron, no hover, not a link. The landing has no module pages, and a card that looks clickable but is not is a false affordance.
- The six modules are the app's, with the app's icons (visual-v2 §4.5-4):

| Module | Icon |
|---|---|
| Risk Brain | `MessageSquareText` |
| Control Graph | `Layers` |
| Risk Radar | `Radar` |
| Action Plan | `ListChecks` |
| Evidence Vault | `FileText` |
| Compliance Room | `DoorOpen` |

  The render's "Professional Vault" / "Agiton Plan" duplicates are dropped.

#### 4.7.3 Preview + floating chip (L, XL)

- **Preview:** `figure`, `relative`. Panel: `aspect-ratio: 390/652`, radius 12, 1 px `border-strong`, overflow hidden, `surface-elevated`. It is the **same `hero-phone` asset**:
  - `object-fit: cover; object-position: top`, lazy;
  - `sizes="(min-width: 1280px) 268px, 372px"`.
- The crop shows y 0–652 CSS px of the 390 × 844 screen, measured on the delivered capture: the top bar, "Olá, Ana", and the **whole Score de Compliance card** (ring 69, "Organizado", +5 pts, Evolução chart, "Por que 69?"). The card ends at ≈ 643. The crop stops before "Riscos em atenção" (starts ≈ 660), so no card is cut in half.
- Why the phone crop: at 268 px it renders the real mobile score card at ≈ 0.69 scale. A crop of the desktop score card at the same width would be ≈ 0.48 scale and harder to read.
- **Chip = the caption:**
  - Marketing's text is "Visão geral · dados ilustrativos". It carries the demo-data disclosure, so there is no separate caption under the panel.
  - It is rendered inside the `figcaption` element (absolutely positioned).
  - Position: `absolute`, `bottom: 40px`, `right: -16px` (XL: 16 px into the ≥ 72 px side margin; L: `right: 12px`, inside).
  - Pill h 32, padding-inline 12, gap 8, `surface-elevated`, 1 px `border-strong`, `shadow-popover`.
  - Dot 8 `primary-text` + `text-caption` 500 `text-primary`, nowrap.

### 4.8 Menos trabalho manual (`manual-work.tsx`, new): the reference's "IA + automação" slot

- **Section:** `id="menos-trabalho-manual"`.
  - Eyebrow "RISK BRAIN + RISK RADAR" (`lang="en"`).
  - H2 "Menos trabalho manual."
  - Lead: Marketing's 35 words.
  - CTA: **outline** "Ver os planos" → `#planos`, `arrow="forward"`.
- **Layout:** the reference's. XL, L: 5 | 7. Intro left. Right: `ul` of **4 rows**. M, S: stacked, list under the intro.
- **Row:**
  - Grid `40px 1fr`, column-gap 16, **no card**: rows are separated by a hairline (`border-b border-border`, pb 16, mb 16; none after the last).
  - Content: icon tile 40 · title h3 `text-h3 text-primary` (≤ 24 chars) · text `text-body-sm text-secondary`, mt 4 (one line of ≤ 10 words).
  - Rows are static.
- **Icons** (Marketing's suggestions; all exist in lucide 1.x). The first three match the dashboard module cards, so the landing and the product use the same symbols:

  | Row | Icon |
  |---|---|
  | Perguntas respondidas | `MessageSquareText` |
  | Atenção do dia | `Radar` |
  | Plano em um passo | `ListChecks` |
  | Score recalculado | `Gauge` |

  **No sparkles or AI glyphs** (brand §7, §63).
- **Footnote** under the list: mt 16, `text-caption text-muted`, max 64ch. It is Marketing's "Respostas calculadas por regras explícitas… Perguntas em texto livre ainda não estão disponíveis." It is part of the list's column, not a legal block, and it is always visible.
- **No AI tags.** The copy claims no AI, so none is needed. If D35 is ever enabled in production, this section, the footnote and the Risk Brain card change together, behind the D35 legal gate. That is a copy change, not a layout change.

### 4.9 Planos (`plans.tsx`, restyle; data and links unchanged)

- **Intro:** left-aligned, max 720 (the reference has no plans block; this uses the same language).
- **Trial band** (mt 40):
  - Radius 12, `surface-elevated` + `.m-wash`, 1 px `info-border`.
  - Padding 32 (XL, L) / 24 (M) / 20 (S).
  - L, XL: a flex row, `items-center`, gap 32:
    - icon tile 40 `CalendarCheck`;
    - text block (eyebrow `text-label` cyan · title h3 `text-h2 text-primary` mt 4 · text `text-body-sm text-secondary` mt 8, max 64ch; flex-1);
    - **primary** md CTA "Comece grátis" `arrow="forward"`, shrink-0.
  - Below 1024: a column; the CTA is full width below 640.
  - This is the section's **only filled button** (§12-2).
- **Tier grid:** `ul aria-label="Planos"`, mt 24. 3 columns at ≥ 1024 (gap 24; 363 wide at XL, 304 at 1024). One column below 1024 (gap 16, full width). DOM order Standard → Plus → Ultimate.
- **Tier card:**
  - `li`, flex column, radius 12, `surface-elevated`, 1 px `border`, padding 24 (32 at XL).
  - Header: name h3 `text-h2`. Recommended: 1 px **`primary-text`** border and a badge right: pill h 24, padding-inline 10, `primary-tint` bg, `text-caption` 500 `primary-text` "Recomendado". The meaning is in the word, not only in the colour.
  - Price (mt 16, baseline row, gap 4): "R$" `text-body-sm` 500 `text-secondary` · numeral `text-score-compact tabular-nums text-primary` · "/mês" `text-body-sm text-secondary`. Then "por organização" `text-caption text-muted`.
  - Audience: `text-body-sm text-secondary`, mt 16.
  - Limits: tags (§4.8 anatomy), wrap, gap 8, mt 16.
  - `border-t border-border`, mt 24, pt 24.
  - Included label (`text-label uppercase text-muted`), then the list: mt 12, gap 10, `flex-1`. Each item is `ControlDot` + `text-body-sm text-primary`.
  - `ControlDot` restyle: ring 1.5 px `text-muted`, filled centre `primary-text`.
  - CTA block (mt 32):
    - "Assinar {name}" **outline** md, full width, `arrow="external"`.
    - Under it, mt 12, centred: tertiary `text-body-sm` "Ou comece com 1 mês grátis" → `/criar-conta?plano={slug}`.
- **Footnotes:** mt 24, `text-body-sm text-secondary`, gap 8, max 80ch. They carry the charging and beta facts and stay visible.
- **Contact card:** mt 40, radius 12, 1 px `border`, transparent, padding 24. Row ≥ 768: title h3 `text-h3` + text `text-body-sm text-secondary` | tertiary "Fale com a gente" (mailto; hidden without a mailbox).

### 4.10 FAQ (`faq.tsx`, restyle; native `<details>`)

- **Layout:**

| Band | Composition |
|---|---|
| XL | `grid-template-columns: minmax(0,3fr) minmax(0,9fr)`, gap 32 → intro **276** · accordion area 828 = **3 columns** (gap 16, 265 each), `align-items: start` |
| L | Intro full width (max 720), then 3 columns (309) |
| M, S | Intro, then the three column boxes stacked, gap 12 |

- **Intro:** eyebrow "FAQ", H2 "Tire suas dúvidas.", lead "Respostas curtas, sem promessa de conformidade."
- **Distribution (14 questions):** column-major, so DOM = visual reading order.

  | Column | Items |
  |---|---|
  | 1 | 1–5 (O que é · Posso testar · Suporte · Pagamento · Segurança) |
  | 2 | 6–10 (Cancelar · Substitui advogado · Para quem · Preciso entender · Diagnóstico) |
  | 3 | 11–14 (Score · Sala · Só LGPD · Equipe) |

  - That is 5 / 5 / 4. Marketing's order puts the six purchase questions first, so they fill column 1 and the top of column 2.
  - Columns open independently. There is no `name` attribute, so several items can be open at once, as today.
- **All 14 questions are visible at every width. There is no "ver todas" disclosure.** Considered and rejected:
  - The native `<details>` already hides every answer. The 14 summaries are the index a visitor scans.
  - A second disclosure layer costs a tap. It would also hide questions like "Posso cancelar" or "O sistema é seguro?" that decide a purchase.
  - A "first 6 + disclosure" on S only would need a different DOM from the column-major split at L/XL (items 7–14 span columns 2 and 3), which means duplicated markup or CSS tricks.
  - Measured cost: 14 closed rows at S ≈ 14 × 64–80 px ≈ 1 000 px. That is acceptable for the last content block before the CTA.
- **Contact line after the list** (Marketing: "Não encontrou sua pergunta? Escreva para {contactEmail}."):
  - `p`, mt 24, `text-body-sm text-secondary`; the address is a tertiary mailto link from `contactMailto()`.
  - Placed **after** the columns: at XL inside the 9fr area under the columns, below 1280 under the stacked boxes. Hidden when there is no mailbox.
- **Column box:** `div`, radius 12, 1 px `border`, `surface-elevated`, overflow hidden. Items are separated by `border-t`.
- **Item:**
  - `details` > `summary`: `list-none`, flex, `items-start justify-between`, gap 12, padding 16, min-h 56, cursor pointer.
  - Question: `h3`, `text-body-sm` 500 (≥ 1024) / `text-body` 500 (below), `text-primary`.
  - Icon: `Plus` 16 `text-secondary`, mt 2.
  - Hover: `surface-hover` background.
  - Focus-visible: 2 px `focus` outline, **offset −2 px** (inset, so the overflow cannot clip it).
  - Open: the icon rotates 45° (reads as ×) over 200 ms, colour `primary-text`.
  - Answer: padding `0 16 16`, `text-body-sm text-secondary`, line-height 1.6; links tertiary.
- The existing `FAQ.privacyLink` rule (now answer **5**, only when `site.legalReady`) is kept. Answer 6's "[Termos de Uso](/termos)" follows the same rule: `next/link`, tertiary, rendered only when `site.legalReady`.
- Answer 3 and the contact line build the address from `site.contactEmail`, never a hard-coded string.
- The render's "Mais popular" pill on a FAQ box is **not** reproduced, since it means nothing there.

### 4.11 Final CTA card (`final-cta.tsx`, rewrite)

- **Section:** `id="comecar"`, normal section frame (border-top, padding per §2.4).
- **Card:**
  - Radius **16**, 1 px `border-strong`, `surface-elevated` + `.m-wash`.
  - Padding 32 × 40 (XL, L) / 32 (M) / 24 (S).
  - `.m-wash` = `background-image: radial-gradient(80% 140% at 0% 0%, var(--m-wash), transparent 70%)`.

| Band | Grid |
|---|---|
| XL | `grid-template-columns: auto 1px minmax(0,1fr) auto`, column-gap 32, `items-center`: lockup · divider · text · buttons (text column ≈ 440 with "Comece grátis" + "Fale com a gente" ≈ 330 of buttons, so the title takes 2 lines) |
| M, L | `auto 1px minmax(0,1fr)`: lockup · divider · (text, then the buttons row mt 20) |
| S | Column, gap 20: lockup · text · buttons stacked, full width |

- **Lockup** (amended by D41): `BrandLogo size="xl"` (symbol 40 + "COMPLIANCE" 23/700 + "OS" 13/700 cyan; at S `size="lg"`, 28 + 17), **`aria-hidden`**. It is not a link and not read aloud: the h2 follows.
- **Divider:** 1 px `border-strong`, `align-self: stretch`. Hidden at S.
- **Text:**
  - h2 `text-h1-compact` (XL `text-h1`) `text-primary`: "Pronto para conhecer os riscos da sua empresa?"
  - p `text-body text-secondary`, mt 8: Marketing's 19-word line.
  - Microcopy `text-caption text-muted`, mt 8: "Primeiro mês grátis · Sem cartão de crédito". It is rendered: it is the reason to click now.
- **Buttons:** gap 12.
  - Primary md "Comece grátis" `arrow="forward"` → `/criar-conta`.
  - Outline md "Fale com a gente" → `contactMailto("Compliance OS — contato")`. When there is no mailbox, the outline becomes "Entrar" → `/entrar`.

### 4.12 Footer (`site-footer.tsx`, rework)

This follows the reference's one-row footer, plus a legal row that Marketing's content needs (statement, Termos/Privacidade, contact, copyright). There is **no "Conta" column**: Marketing's footer lists none, and the header already carries Entrar and Comece grátis.

- **Frame:** `footer`, `border-t border-border`, pt 40 (48 at ≥ 1024), pb 32. `theme-dark` removed.
- **Row 1** (≥ 768: `flex items-center justify-between gap-6 flex-wrap`):
  - `Lockup` (official horizontal logo, `md`; D41).
  - `nav aria-label="Rodapé"`: inline `ul`, gap 24, with Produto · Como funciona · Planos · Dúvidas (the header anchors, `/#…` on the legal pages). Links are `text-body-sm text-secondary`, hover `text-primary`, h 40.
  - **Instagram icon link:** 40 × 40 (44 < 1024), radius 8, hover `surface-hover`, `aria-label="Instagram do Compliance OS"`, `rel="noopener"`, href `site.instagramUrl`; rendered only when set.
    - The glyph is an **inline SVG** drawn in the Lucide idiom: 20 px, stroke 1.5, round caps, `currentColor` `text-secondary` → hover `text-primary`. It is a rounded square (rx 5), a centre circle (r 4) and a 1.5 px dot at the top right.
    - lucide-react 1.x ships no brand icons, and an icon package would be a new dependency for one glyph. No LinkedIn, X or YouTube.
- **Row 2:** mt 32, `border-t border-border`, pt 24. ≥ 1024: grid `minmax(0,1fr) auto`, gap 32.
  - Left:
    - The statement: `text-caption text-muted`, max 72ch. It is the page's limit disclosure now that the Trust section is gone.
    - Below it, mt 8, the copyright "© {year} Compliance OS · {legalEntity}. Todos os direitos reservados." (`text-caption text-muted`, year computed).
  - Right: a `ul`, inline, gap 24, `text-body-sm text-secondary`:
    - "Termos de Uso" → `/termos` and "Política de Privacidade" → `/privacidade` (both only when `site.legalReady`);
    - "Contato: {contactEmail}" as a mailto.
- **S (< 768):**
  - Row 1 stacks: lockup; nav as a 2 × 2 grid (items 44 tall); Instagram icon.
  - Row 2 stacks: legal links and contact (each 44 tall); statement; copyright.

### 4.13 Legal pages (`/termos`, `/privacidade`; `legal-notice.tsx`, restyle)

- They inherit the dark frame, header (CTA primary from the start) and footer.
- `main`: padding-block 48 (S) / 64.
- Article: `max-w-[68ch]`.
  - h1 `text-section`; "Última atualização" `text-caption text-muted`, mt 12.
  - Sections: h2 `text-h2 text-primary`, gap 40.
  - **Paragraphs and lists: `text-body text-secondary`** (10.62:1). Near-white on near-black over long legal text causes halation; headings stay `text-primary`.
  - Links: tertiary, hover `primary-text-hover` (**fixes `hover:text-info-fill`**).
- Print: light values (screen-only pin), `print:hidden` on header and footer.

---

## 5. Responsive matrix and overflow rules

| Section | S < 768 (320–430) | M 768–1023 | L 1024–1279 | XL ≥ 1280 (1440, 1920+) |
|---|---|---|---|---|
| Header | 56; symbol only < 390; CTA + menu | 64; "Entrar" + CTA + menu | 64; nav inline; no menu | same as L |
| Hero | stacked left; devices: phone 26%, no callout | stacked centred; box 720; callout | same as M | 520 · 48 · 616 (bleed 48); perspective |
| Problema | cards as rows | intro · 3-up | intro · 3-up | 5 : 7 |
| Control Layer | stacked; < 640 planes-only crop (292) + label list below; 640–767 side labels | stacked; figure 560 centred, side labels | 5 : 7 | 5 : 7 |
| Como funciona | vertical timeline | 3 × 2 + arrows | 3 × 2 | 6 in a row |
| Produto | module rows (2 cols ≥ 640); no preview | modules 3 × 2; no preview | intro · modules 2 cols + preview | 4 : 5 : 3 |
| Menos trabalho manual | stacked | stacked | 5 : 7 | 5 : 7 |
| Planos | band column; tiers 1 col | same | band row; tiers 3-up | same as L |
| FAQ (14) | 3 boxes stacked (5/5/4), all visible | same | intro · 3 columns | 3 : 9 (3 columns) |
| Final CTA | stacked | lockup · divider · text + buttons | same as M | 4-part row |
| Footer | stacked; nav 2 × 2 | row 1 inline · row 2 stacked | row 1 inline · row 2 two-sided | same as L |

- **1920+:** identical to 1440. The content stays 1136, centred; only the hairlines and the Canvas extend.
- **No horizontal overflow at any width.** The only elements drawn outside the content box are:
  - the hero visual at XL (48 px, side margin ≥ 72);
  - the product chip at XL (16 px);
  - the glows, which are inside their boxes.

  `.landing { overflow-x: clip }` stays as the safety net. The engineer verifies at 320, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 that `document.documentElement.scrollWidth === innerWidth`.
- **Touch:** every interactive element is ≥ 44 × 44 below 1024 (header CTA `min-h-11`, menu 44, drawer items 48, FAQ summary 56, footer links 44, buttons 44/48).

---

## 6. Motion (CSS only, D22)

### 6.1 Kept

- The existing system: `Reveal` (one shared IntersectionObserver, `is-visible` once), `data-reveal`, and the gating on `html.js` + `prefers-reduced-motion: no-preference`.
- The `m-settle` 3 s safety net.
- `m-rise`, `m-node`, `m-draw-x`, `m-draw-y`, `m-drawer`.
- Without JS or with reduced motion, nothing is ever hidden. The global reduced-motion rule zeroes durations and delays.

### 6.2 Changed

- **Removed** (no consumers after the rewrite): `.hero-seq`, `.hero-frame`, `.hero-stage`, `.m-arc`, `.m-bar`, `.m-dot-fill`, `--arc-length`.
- **Hero on load (LAYER):**
  - The text column and the laptop are **static**. They are the LCP candidates (the H1 or lead on phones, the screenshot on desktop), and opacity-0 entrances delay LCP.
  - Only the **phone** (`m-rise` keyframes, 400 ms `--ease-out`, delay 200 ms, `--rise: 12px`) and then the **callout + leader line** (same, delay 320 ms) layer onto the laptop.
  - Both are CSS keyframes, not observer-driven. They are disabled with reduced motion.

### 6.3 Scroll reveals

| Where | What | Timing | Meaning (brand §32) |
|---|---|---|---|
| Section intros | block `m-rise` 12 px | 400 ms | — |
| Card groups (problem, modules, "Menos trabalho manual" rows, tiers, FAQ columns) | items `m-rise`, `--d` = index × 60 ms | 400 ms each, ≤ 600 ms total | LAYER |
| Steps | items `m-rise` × 60 ms; arrow badges `m-node` at item delay + 120 ms | ≤ 700 ms | CONNECT |
| Steps S (timeline) | connectors `m-draw-y` at item delay + 120 ms | 400 ms | CONNECT / PROGRESS |
| Layers figure | glow fades 0 → 1 (250 ms); planes `m-rise` 8 px **bottom → top** (`--d` = (4 − i) × 80 ms); connectors `m-draw-x` at 400 + (4 − i) × 80 ms; labels `m-rise` +60 ms | ends ≈ 950 ms (brand §33 "marketing storytelling 500–1000 ms") | LAYER → CONNECT |
| Final CTA card | block `m-rise` | 400 ms | — |

### 6.4 Micro-interactions

| Element | Property | Timing |
|---|---|---|
| Buttons, nav, footer links, FAQ summary | colour / background | 150 ms |
| CTA arrow on hover | `translateX(2px)` | 150 ms |
| FAQ `Plus` | `rotate(45deg)` + colour | 200 ms |
| Header hairline | border colour | 150 ms |
| Drawer | `m-drawer` from the right | 200 ms |

- Nothing loops. No parallax, no count-ups, no hover lift on static cards.
- SVG groups animated with transforms get `transform-box: fill-box` (already on `.m-node`, `.m-draw-x`, `.m-draw-y`; add it to `.m-rise` when used inside the SVG).

---

## 7. Accessibility

### 7.1 Landmarks and focus order

- The skip link "Pular para o conteúdo" is the first focusable element. It is visible on focus: fixed top 8 / left 8, h 40, radius 8, `surface-elevated`, 1 px `border-strong`, `text-primary`.
- Then:
  - `header` (banner): lockup → nav "Principal" (≥ 1024) → Entrar → CTA → menu.
  - `main#conteudo`: sections in §3.1 order. DOM order equals visual order at every width. Hero text precedes the visual. FAQ is column-major. Final CTA text precedes the buttons.
  - `footer` (contentinfo) with nav "Rodapé".
- The drawer reuses "Principal"; only one nav of that name is visible at a time.
- Section anchors clear the header (`scroll-mt`). `main` keeps `tabIndex={-1}` for the skip link.

### 7.2 Headings

- One h1 (hero). One h2 per section (§3.1). h3 for the problem cards, step titles, module names, "Menos trabalho manual" rows, the trial title, tier names, the contact card and FAQ questions (inside `summary`, as today).
- No skipped levels. Eyebrows are `p` elements, never headings. Layer labels are list items.

### 7.3 Semantics and non-colour signals

- **Lists:** problem cards `ul`, steps `ol` (numbers `aria-hidden` to avoid "1. 01"), layer labels `ol`, modules `ul`, "Menos trabalho manual" rows `ul`, tiers `ul aria-label="Planos"`, hero chips `ul aria-label="O que o Compliance OS organiza"`.
- **Decorative, `aria-hidden`:** icon tiles, arrows, the layers SVG, device frames, leader line, glows, the final-CTA lockup.
- **Not colour-only:**

| Signal | Carried by |
|---|---|
| Recommended plan | "Recomendado" badge text |
| Open FAQ | `details[open]` state (announced by the platform) + icon shape change |
| Highlighted H1 line | a line break, not meaning |
| External checkout | icon + sr-only "(abre em outro site)" |

- **Forced colours:** focus outlines and borders survive. Every state has text.

### 7.4 Alt text and figure captions (Marketing writes; UX constraints)

**Blocking mismatch.** Marketing's two alts (hero mockup and product preview) say "Score de Compliance **74** de 100 … **6 pontos** acima de 30 dias atrás". They were written against the deleted `fixtures.ts`. The delivered capture shows:
- **69** de 100, "Organizado", **+5 pts desde 08/09/2026**;
- 18 riscos em aberto: 3 críticos, 5 altos, 9 médios, 1 baixo;
- próximo passo "Ativar MFA no e-mail corporativo…";
- the six modules.

"Riscos por categoria" and "Últimas ações" show only their titles at the bottom edge, so the alt should not describe their contents.

An alt text that contradicts the pixels is a false statement to screen-reader users (CLAUDE.md §23). Marketing corrects both alts **from the capture** before implementation. If the demo is re-captured, the alts are re-checked.

- **`hero-desktop` alt** (Marketing's combined "no computador e no celular" alt, corrected):
  - It describes what is visible and states that the organization is fictitious.
  - Max ≈ 300 characters. Every number must be visible in the capture.
- **`hero-phone` alt:** **`alt=""`**. Marketing's combined alt already covers the phone ("no computador e no celular"), so a second description would repeat it.
- **Product preview alt:** Marketing's sentence, corrected to 69: "Visão geral do Compliance OS com dados de uma organização fictícia: Score de Compliance 69 de 100 e sua evolução." The chip is visible text.
- **Layers figure:** no alt and no figcaption; the labels are real text (§4.5.2).
- **Captions:** the hero caption and the preview chip ("dados ilustrativos") are visible text in `figcaption`.

### 7.5 Checks asked of the engineer

- Keyboard-only walkthrough at 1440 and 390: skip link → header → drawer (open, Tab, Esc, focus return) → hero CTAs → section CTAs → FAQ (Enter/Space toggles) → plan CTAs → footer.
- NVDA + Chrome spot check: h1 and h2 outline, layer list, FAQ state, external-link suffix.
- Reduced motion (OS setting) shows the final states instantly. Without JS, all content is visible.

---

## 8. Performance

### 8.1 Budget (to be measured, not assumed)

| Item | Budget |
|---|---|
| `/inicio` First Load JS | **≤ 115 kB** (today 111 kB). Client components stay: `SiteHeader`, `Reveal`. With `<Image>` instead of `getImageProps`: ≤ 118 kB. |
| New npm dependencies | **none** |
| LCP element | `hero-desktop` (desktop) or the H1 / lead (phones). The image is preloaded with `fetchpriority="high"`; the hero has no opacity entrance. |
| Images, first viewport | desktop ≤ **130 kB** transferred (hero-desktop 1080 w variant ≤ 90 kB + phone 256 w ≤ 20 kB); phone ≤ **80 kB** |
| Images, full page | ≤ **220 kB** (+ product preview 640 w variant ≤ 50 kB, lazy, ≥ 1024 only) |
| Source assets in the repo | **delivered: `hero-desktop.webp` 75 KB (1440 × 900), `hero-phone.webp` 53 KB (780 × 1688)**. Both are well under the ceilings (450 / 180 KB). They are optimizer inputs; the served variants are the ones measured above. |
| Inline SVG | ≤ 6 kB of markup |
| CSS effects | no `filter: blur`, no `backdrop-filter`, no `will-change`. One static 3D transform (XL laptop). Four radial gradients. |
| Fonts | Inter only, already loaded; no new weight |
| Lab targets (Lighthouse mobile, "Slow 4G, Moto G Power") | LCP ≤ 2.5 s · TBT ≤ 150 ms · CLS ≤ 0.05. All image boxes have `aspect-ratio`, so there is no layout shift. |

### 8.2 Why this stays light on low-end devices

- Server components: the device frames, the SVG and the FAQ (native `<details>`) ship no JS.
- `getImageProps` keeps the optimizer without shipping the `next/image` client component.
- The page loses the old real-component showcases (`ScoreCard`, `RadarPanel`, `PrioritiesPanel`, `RiskTable`, `RoomView` with fixtures). That is a large drop in DOM size.
- Glows are gradients, not blurs.

### 8.3 Screenshot production (Orchestrator)

**Delivered (2026-09-27):** `scratchpad/appshot/hero-desktop.webp` and `hero-phone.webp`. Reviewed against the criteria below:

| Check | Result |
|---|---|
| Live app, dark, Visão geral at scroll 0 | pass |
| Fictitious organization and user | Acme Tecnologia Ltda., "Ana Souza", initials avatar: pass |
| No hover/focus, search empty, bell closed, no toasts | pass. The bell shows its count badge "9", which is real product state. |
| Animations finished | pass: ring and chart fully drawn |
| Desktop resolution | 1440 × 900 at **1×** instead of the 2× first planned. **Accepted**, see §4.3.7. |
| Phone resolution | 780 × 1688 (2×): pass |

- **Location:** copy both files to `apps/web/src/assets/marketing/`. Record the capture date and the visible values (69 / +5 / 18 open) in the hero component's doc comment. The alts depend on those values (§7.4).
- **Re-capture** when the dashboard changes visibly. A landing that shows an older UI than the product breaks trust. Use the same state rules, and capture the desktop at DPR 2 if the rendered size ever exceeds 720 CSS px.

---

## 9. Copy fit check: Marketing's `02-copy.md` against this layout

The source is Marketing's draft; its limits govern the words. UX owns final wording (CLAUDE.md §25). The table records whether each slot fits the layout, as measured or estimated with Inter at the stated sizes.

| Slot | Marketing's copy / limit | Layout verdict |
|---|---|---|
| Nav | 4 items: Produto · Como funciona · Planos · Dúvidas | fits; wordmark from 390 px (§4.1) |
| Hero eyebrow | 37 chars | fits one line at every width ≥ 320 (12 px, +0.08em ≈ 300 px) |
| H1 | 20 + 21 chars | one line each at ≥ 375 and at XL (§2.3); wraps at 320, balanced |
| Lead | 31 words ≈ 190 chars | 4 lines at XL (52ch) |
| CTAs | "Comece grátis" · "Ver como funciona" | fit side by side from 640 |
| Microcopy | ≈ 80 chars | one line at XL (12 px ≈ 500 px); wraps per item below |
| Chips | 5 × ≤ 18 chars | ≈ 518 px; 1–2 lines at XL, wraps below: acceptable |
| Callout | 3 × ≤ 16 chars | fits 136 px inner at 14/500 |
| Problem title | 11 words ≈ 88 chars | 3 lines at XL (453 px, 32 px) |
| Problem cards | title + 2 × ≤ 10 words | ≈ 4 text lines at XL; equal-height cards |
| Layer labels | ≤ 24 chars (longest delivered: 22) | fit the side column at ≥ 640: 24 chars at 14/500 ≈ 190 px against a 230–240 px column. Below 640 they become a list (§4.5.3). |
| Steps | verb + 2 × ≤ 10 words | 5–6 lines at XL (§4.6); keep ≤ 115 chars |
| Module cards | 2 × ≤ 8 words + tag | ≈ 4 lines at XL; tag under the name |
| Preview chip | "Visão geral · dados ilustrativos" (32) | fits nowrap (≈ 215 px + dot) |
| Menos trabalho manual | lead 35 words; 4 × (≤ 24 title + ≤ 10 words); footnote | fits the 635 px list column in one line per row at XL |
| FAQ | 14 Q&A; answers up to ≈ 700 chars | fits; columns 233 px inner at XL, so long answers run ≈ 20 lines. **Recommendation:** trim answers 2, 5 and 12 below ≈ 500 chars. Not blocking. |
| Final CTA | title 47 chars; line 19 words | 2 + 2–3 lines at XL |
| Footer | statement, legal, contact, © line | fits row 2 (§4.12) |
| Alt texts | — | **blocking fix: 74 / +6 must become 69 / +5** (§7.4) |

Human legal review of the new visitor-facing copy is a gate before release (CLAUDE.md §25, D37). Marketing's §13 lists what needs it.

---

## 10. File-level implementation plan

### 10.1 Page and layout

| File | Action |
|---|---|
| `app/(marketing)/layout.tsx` | Wrapper `className="landing min-h-dvh bg-surface-base text-text-primary"` (**drop `theme-light`**). Inline script: `js` flag **+** `meta[name=theme-color]` → `#030712`. Skip link styles as in §7.1. |
| `app/(marketing)/inicio/page.tsx` | Sections in §3.1 order: `SiteHeader`, `Hero`, `Problem`, `ControlLayer`, `Steps`, `Product`, `ManualWork`, `Plans`, `Faq`, `FinalCta`, `SiteFooter`. Remove `now` (no fixtures). Metadata from Marketing's §12 SEO fields; JSON-LD structure unchanged. |
| `app/(marketing)/termos/page.tsx`, `privacidade/page.tsx` | Unchanged (they use `LegalDocumentPage`). |

### 10.2 `components/marketing/`

| File | Action |
|---|---|
| `hero.tsx` | **Rewrite** (§4.3). Keeps `HERO_SENTINEL_ID`. |
| `device-frames.tsx` | **New**: `LaptopFrame`, `PhoneFrame` (§4.3.3), presentational only. |
| `problem.tsx` | **New** (§4.4). |
| `before-after.tsx` | **Delete** (replaced by `problem.tsx`). |
| `control-layer.tsx`, `layers-figure.tsx` | **New** (§4.5). |
| `control-chain.tsx` | **Delete**. |
| `steps.tsx` | **Rewrite** (§4.6). |
| `product.tsx` | **New** (§4.7). |
| `feature-story.tsx`, `story-figures.tsx`, `product-figure.tsx` | **Delete** (old real-component showcases). |
| `manual-work.tsx` | **New** (§4.8, "Menos trabalho manual"). |
| `instagram-glyph.tsx` | **New**: an inline SVG, Lucide idiom (§4.12), `aria-hidden`. The accessible name is on the link. |
| `score-explainer.tsx`, `room-showcase.tsx`, `trust-grid.tsx` | **Delete** (sections removed, owner decision 2). |
| `plans.tsx` | **Restyle** (§4.9). Data, Kiwify links and `?plano=` unchanged. Tier CTAs outline + external arrow. |
| `faq.tsx` | **Restyle** (§4.10). |
| `final-cta.tsx` | **Rewrite** (§4.11). |
| `site-header.tsx` | **Restyle** (§4.1): v2 tokens, cyan symbol, scroll hairline (second sentinel), drawer `backdrop:bg-backdrop`, remove `theme-dark`. |
| `site-footer.tsx` | **Rework** (§4.12): two rows. Drop the column layout and the "Conta" column; add the Instagram icon link, the contact line, and Marketing's © format. Remove `theme-dark`. |
| `legal-notice.tsx` | **Restyle** (§4.13): link hover token fix, reading colours. |
| `primitives.tsx` | **Update**: `Section` (no tone; padding 48/64/80; `border-t`), `SectionIntro` replaces `SectionHeading`, `Eyebrow` (cyan, no dot), `ControlDot` (v2 colours; plans only), `Container` unchanged. |
| `cta.tsx` | **Update** (§4.2): `outline` replaces `secondary`; sizes; `arrow` prop; tertiary hover fix. |
| `reveal.tsx` | **Keep** unchanged. |
| `components/ui/brand-symbol.tsx` | `Lockup` gains `symbolClassName` (default `""`; the landing passes `text-primary-text`). No change for app callers. **Superseded by D41:** `BrandLogo` / `Lockup` render the official logo; `symbolClassName` removed. |

### 10.3 `lib/`, tests, CSS

| File | Action |
|---|---|
| `app/globals.css` | §2.1: delete `.theme-dark`, `.theme-light`, v1 `.landing` pins, v1 core colours in `@theme`; add the screen-only `:where(.landing)` pin, `html`/`body :has` rules (dark, `#030712`). §2.3: re-point `text-hero`, delete `text-final`. §6.2: delete the unused motion classes; add the hero phone/callout keyframe classes; add `.m-glow` and `.m-wash`. |
| `lib/marketing/copy.ts` | Transcribe Marketing's `02-copy.md`: `NAV`, `HERO`, `PROBLEM`, `CONTROL_LAYER`, `HOW_IT_WORKS`, `PRODUCT` (modules, tag, chip), new `MANUAL_WORK`, `FAQ` (14), `FINAL`, `FOOTER`, `SEO`. `PLANS` changes only `eyebrow` and `trial.cta.label` ("Comece grátis"). **Delete** `SCORE`, `ROOM`, `TRUST`. Apply the §7.4 alt correction (69 / +5) before commit. |
| `lib/marketing/fixtures.ts` | **Delete**. Its only consumers are the deleted showcases. The coherence the fixtures had to fake is now guaranteed by construction: the screenshots are the real app on the real demo organization. |
| `lib/__tests__/marketing-fixtures.test.ts` | **Delete** with the fixtures. |
| `lib/__tests__/globals-theme.test.ts` | **Rewrite** the landing assertions: `:where(.landing)` declares every colour of the app-dark block; each equals the app-dark value **except** `--color-surface-base` = `#030712`; `--color-primary` = `#06b6d4`, `--color-primary-foreground` = `#0b0f14`; `.theme-light {` and `.theme-dark {` no longer exist. Drop the v1 non-colour-pin test. Keep the marketing-token test. |
| `lib/__tests__/contrast.test.ts` | Add `landing: colors(":where(.landing) {")` to `THEMES`. Every existing assertion must pass on it (they do by §2.5; the test proves it). |
| `lib/__tests__/marketing-plans.test.ts`, `marketing-site.test.ts`, `marketing-entry.test.ts` | Unchanged; must still pass. |
| `src/assets/marketing/hero-desktop.webp`, `hero-phone.webp` | **New**: copied from `scratchpad/appshot/` (§8.3). |
| Label-string tests | `marketing-plans.test.ts` asserts offers, not button labels. Grep the tests for "Começar gratuitamente" before renaming it to "Comece grátis". |

### 10.4 App code touched only because the showcases go away

- `PageHeader.titleTag` and `RoomView.titleTag` lose their only non-default callers. Remove the prop (dead code, CLAUDE.md §13) in the same change, or record it as a follow-up.
- `PrioritiesPanel` stays (the dashboard uses it).

### 10.5 Documents after implementation

- **`tokens.md`:** header note "legacy v1 values retired by landing-v2.md".
- **`visual-v2.md`:** §2.1, §2.8 and §8.2 point to this file.
- **`brand-system.md`:** see §12-1.

---

## 11. Deviations from the reference (each justified)

| # | Reference shows | Landing v2 does | Reason |
|---|---|---|---|
| L-1 | Electric-blue accents everywhere | v2 cyan family; dark text on fills | Owner decision 1; white on `#06B6D4` is 2.43:1 (fails) |
| L-2 | Page ≈ `#04070D`–`#050B0F` | Canvas `#030712` (gray-950) | A derived step of the v2 scale; lit-screen contrast (§0-2) |
| L-3 | Navy dividers `#001A37` | `border` `#1F2937` | Cyan/blue budget (brand §11); structure stays neutral |
| L-4 | Cards ≈ `#020E18` | `surface-elevated` `#111827` | The same card as the product screenshot; visible edges on low-end screens |
| L-5 | Hexagon logo + hexagon outline behind the hero | Real symbol in cyan; outline omitted | Owner decision 3; the outline would imitate the fake logo |
| L-6 | Glow on edges, tiles, planes, chips | Four static radial gradients (§0-10) | Brand §39; the owner asked for "discreet"; blur is expensive |
| L-7 | H1 ≈ 42 px | 48 px (display-l), not 56 | Split layout; one line per sentence (§2.3) |
| L-8 | Laptop always in perspective | Perspective at ≥ 1280 only | Legibility and symmetry when centred (§4.3.6) |
| L-9 | Section padding ≈ 35–50 | 48 / 64 / 80 | Brand §16 minimum 40; readability |
| L-10 | Filled blue buttons in hero, product and final CTA | One filled per viewport; section CTAs outline | Brand §41 |
| L-11 | Topic chips "LGPD · Compliance · Riscos · Auditoria · Governança", one with a shield | Marketing's chips (Proteção de dados · Riscos · Controles · Ações · Evidências) with product icons, **plus** the approved microcopy line | Brand §20 (no shields); "Auditoria" and "LGPD" alone would overclaim (Marketing §0) |
| L-12 | Round icon tiles with glow | App icon tile (40, radius 8, `primary-tint`) | One tile anatomy across product and landing (brand §50 "extension of the product") |
| L-13 | Two "Produto" sections; garbled module names | One section; the six real modules | Owner decision 2; AI render artefacts |
| L-14 | Module cards with chevrons | Static cards | No destination; no false affordance |
| L-15 | Tablet-like preview, "Dashboard em tempo real" | Phone-screenshot crop (whole score card); chip "Visão geral · dados ilustrativos" doubles as the caption | Real screen; the data is not real-time |
| L-16 | Steps without numbers; generic names | Numbers (aria-hidden) + the product flow | Order survives reflow; CLAUDE.md §3 |
| L-17 | "IA + AUTOMAÇÃO", "Análise de documentos com IA e NLP", "agentes inteligentes" | "RISK BRAIN + RISK RADAR / Menos trabalho manual": 4 rows about what exists, a footnote on explicit rules, no AI glyphs | D35 (no document analysis; free text off); CLAUDE.md §7; brand §63 |
| L-18 | Garbled plans/FAQ row with 9 questions | Plans designed in the same language; FAQ intro + 3 columns holding **14** questions (5/5/4), all visible, contact line after | Owner decision 2; §4.10 |
| L-19 | "Mais popular" pill on a FAQ box | Omitted | Meaningless there |
| L-20 | Final CTA "Falar com o time" | "Fale com a gente" mailto (or "Entrar" without a mailbox) | Real destination only |
| L-21 | One-row footer with four social icons | Row 1 = the reference's row (logo · anchors · **Instagram only**, as an inline SVG glyph); row 2 = statement, © line, Termos/Privacidade, contact e-mail | The legal disclaimer must stay; LinkedIn is null, X and YouTube do not exist; lucide 1.x has no brand icons and no dependency is added |
| L-22 | Nav "Produto, Recursos, Preços, Sobre" | "Produto · Como funciona · Planos · Dúvidas" | Anchors that exist (Marketing §1) |
| L-23 | Header CTA always filled | Outline while the hero is visible | Kept v1 behaviour; one filled per viewport |
| L-24 | No demo disclaimer | Visible captions under the hero and the preview | Honesty (CLAUDE.md §23) |
| L-25 | Callout "Mais controle / Menos risco / Mais resultado" | "Mais clareza. / Mais controle. / Mais confiança." | "Menos risco / mais resultado" cannot be proven (Marketing §0; brand §64 level 5) |
| L-26 | Final CTA "Pronto para transformar a gestão de riscos…" | "Pronto para conhecer os riscos da sua empresa?" | "Transformar" is avoided vocabulary (brand §59); the new title echoes the H1 |

---

## 12. Open points for the Orchestrator / owner

1. **`brand-system.md` updates** (proposed D40):
   - remove the "Legacy v1 (landing only)" note (header and §8);
   - §7 approved backgrounds and §51 social colours are still v1 (flag; no change proposed here);
   - §39: add the landing's closed glow list (§0-10);
   - §50: the recommended landing narrative becomes this structure (owner decision 2 removes the Compliance Room and Trust blocks).
2. **Plans CTA hierarchy:** this spec makes all tier buttons **outline**, with the trial band as the section's only filled button. Today the recommended tier is filled. This is a conversion decision; the **Product Strategist** confirms. If the Product Strategist keeps it filled, it is allowed, but no other filled button may share its viewport.
3. **Caveats that lived in the removed sections:**
   - Score: "não é certificação".
   - Room: "não é atestado".
   - Trust: "beta, declarado", residency.

   The FAQ (answers 5, 8, 9) and the plan footnotes still carry them. **Marketing + Compliance Researcher** confirm nothing legally reviewed is lost.
4. ~~**Open Graph image** is still the v1 Obsidian card.~~ Regenerated in v2 with the official logo (D41, 2026-09-28).
5. **Screenshot privacy:** the delivered captures show only Acme Tecnologia Ltda. and "Ana Souza" (checked, §8.3). Keep the rule for re-captures.
6. **Human legal review** of the new copy before release (D37 gate), especially "Menos trabalho manual" and the FAQ compositions (Marketing §13).
7. **Blocking before commit: alt texts vs the capture.** Marketing's alts say 74 / +6. The capture shows 69 / +5 desde 08/09/2026 (§7.4). Marketing corrects them. Marketing's claim note ("fixtures.ts demoScore, coherence test") is obsolete: the fixtures are deleted and the capture is now the source.
8. **`LLM_PROVIDER=none` in production** is a precondition for the Risk Brain card and the "texto livre ainda não disponível" footnote (Marketing FLAG-QA). If D35 is enabled, the copy changes behind its legal gate; the layout does not.
9. **Band label "Organizado"** is visible in both captures (F5, human legal review pending). If the reviewed label changes, re-capture.

---

## 13. Implementation order and done criteria

1. Tokens and CSS (§10.3), tests updated → `vitest` green (including `contrast.test.ts` with the landing block).
2. Primitives, `cta.tsx`, header, footer and legal page → the legal pages are dark and print light.
3. Hero with the device frames and the delivered WebPs (copied to `src/assets/marketing/`), preload verified in the HTML.
4. Problem, Control Layer (SVG), Steps, Product, IA, Plans, FAQ, final CTA.
5. Delete the old components, fixtures and fixture test; remove the dead `titleTag` props.

**Done means:**

- `lint`, `typecheck`, `vitest` and `next build` pass. The build table reports `/inicio` First Load JS ≤ 115 kB and no new dependencies.
- Screenshots at 320, 390, 768, 1024, 1280, 1440 and 1920, with the app theme set to **light** and to **dark**: the landing looks identical in both. No horizontal overflow (§5).
- Lighthouse mobile run reported with its real numbers (§8.1 targets), plus the LCP element and whether it was preloaded.
- Keyboard and screen-reader notes (§7.5); reduced-motion and no-JS checks.
- `/termos` print preview is legible (dark text on white).
