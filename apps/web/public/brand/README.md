# Arkan Brand Assets

> **Arkan** · أركان — *the pillars your restaurant runs on*
> Tagline: **From kitchen to customer, all in one.**

## Logo system

| File | Use |
|------|-----|
| `logo.svg` | Primary horizontal lockup (mark + wordmark + tagline). Use in marketing pages, emails, invoices. |
| `logo-stacked-bilingual.svg` | Stacked Latin + Arabic. Use for hero placements, About page, splash screens. |
| `logo-on-dark.svg` | White-on-dark variant of the primary logo. Use on dark backgrounds. |
| `logo-mark.svg` | Just the mark. Use in tight spaces (sidebar, nav, email header). |
| `app-icon.svg` | Rounded-tile app icon (orange background, white mark). Source for iOS / Android icons. |
| `../favicon.svg` | 32×32 favicon, served at the root. |
| `preview.html` | Open in a browser at `/brand/preview.html` to see the whole system on one page. |

## Concept

The mark is a stylized **temple façade**: four pillars (the literal meaning of أركان) supporting a lintel above and a stylobate below. A small warm-orange dot sits at the centre — the heart of the kitchen, the warmth at the core of every meal.

The Latin "A" in the wordmark echoes the same geometry — two outer columns meeting at the apex.

## Colour palette

| Token | Hex | Use |
|-------|-----|-----|
| `brand-600` | `#ea580c` | Primary orange — mark, primary buttons, links |
| `brand-500` | `#f97316` | Accent — hover states, gradients |
| `warmth` | `#fb923c` | The centre dot in the mark; subtle warmth accents |
| `ink` | `#1c1917` | Wordmark, body copy |
| `muted` | `#78716c` | Tagline, captions |
| `paper` | `#fafaf9` | Page background |

## Typography

- **Latin:** Inter, weights 500 / 700 / 800. Letter-spacing −1.2 on display sizes.
- **Arabic:** Cairo (fallback Tajawal), weights 500 / 700.

## Generating PNG icons (for app stores)

The SVGs are the source of truth. Generate raster icons at build time using `@resvg/resvg-js` or the `sharp` CLI. Recommended sizes:

| Platform | Size | Source |
|----------|------|--------|
| iOS app icon | 1024×1024 | `app-icon.svg` |
| Android adaptive (foreground) | 432×432 transparent | `logo-mark.svg` |
| Android adaptive (background) | solid `#ea580c` tile | n/a |
| Web favicon (PNG fallback) | 192×192, 512×512 | `favicon.svg` |

Example: `npx @resvg/resvg-cli app-icon.svg -w 1024 -h 1024 ios-icon.png`

## Clear-space rules

- Around the mark: keep an empty zone of at least one pillar-width on every side.
- Don't recolour the mark outside the palette above. For monochrome reproduction, use solid `ink` (`#1c1917`) or solid white.
- Don't rotate, skew, or add drop shadows to the mark.
