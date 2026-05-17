# Arkan Brand Assets

> **Arkan** · أركان — *the pillars your restaurant runs on*
> Tagline: **From kitchen to customer, all in one.**

## Logo system

| File | Use |
|------|-----|
| `logo.svg` | Primary horizontal lockup (mark + wordmark + tagline). Marketing pages, emails, invoices. |
| `logo-stacked-bilingual.svg` | Stacked Latin + Arabic. Hero placements, About page, splash screens. |
| `logo-on-dark.svg` | White-on-dark variant of the primary logo. |
| `logo-mark.svg` | Just the mark. Tight spaces (sidebar, nav, email header). |
| `app-icon.svg` | Rounded-tile app icon (navy background, white A, amber crossbar). Source for iOS / Android. |
| `../favicon.svg` | 32×32 favicon, served at the root. |
| `preview.html` | Open in a browser at `/brand/preview.html` to see the whole system. |

## Concept

The mark is a bold **monogram A**: two confident triangular slabs in deep navy meeting at the apex, with a wide amber crossbar cutting through the centre.

- The two slabs are the **pillars** (أركان literally means *pillars / foundations*) — the structure the platform provides.
- The **amber crossbar** is the warmth at the heart of every kitchen, framed by the navy structure.
- Geometric, architectural, instantly recognizable at any size. Reads cleanly at 16×16 favicon.

## Colour palette

| Token | Hex | Use |
|-------|-----|-----|
| **Navy** | `#0f172a` | Brand primary — mark, headers, dark surfaces, secondary buttons, body text |
| Navy raised | `#1e293b` | Card / panel on dark, hover states on dark |
| **Amber** | `#f59e0b` | Accent — crossbar in mark, primary CTA buttons, badges, highlights, the Arabic wordmark |
| Amber light | `#fbbf24` | Hover for amber CTAs, tag backgrounds |
| Ink | `#0f172a` | Body text on light surfaces |
| Muted | `#475569` | Captions, tagline, secondary text |
| Paper | `#f8fafc` | Page background |
| Surface | `#ffffff` | Cards, modals |

## Typography

- **Latin:** Inter, weights 500 / 700 / 800. Letter-spacing −1.2 on display sizes.
- **Arabic:** Cairo (fallback Tajawal), weights 500 / 700.

## Generating PNG icons (for app stores)

The SVGs are the source of truth. Generate raster icons at build time using `@resvg/resvg-js` or the `sharp` CLI. Recommended sizes:

| Platform | Size | Source |
|----------|------|--------|
| iOS app icon | 1024×1024 | `app-icon.svg` |
| Android adaptive (foreground) | 432×432 transparent | `logo-mark.svg` |
| Android adaptive (background) | solid navy `#0f172a` tile | n/a |
| Web favicon (PNG fallback) | 192×192, 512×512 | `favicon.svg` |

Example: `npx @resvg/resvg-cli app-icon.svg -w 1024 -h 1024 ios-icon.png`

## Clear-space rules

- Around the mark: keep an empty zone of at least one half-leg-width on every side.
- Don't recolour the mark outside the palette above. For monochrome reproduction, use solid navy (`#0f172a`) or solid white on dark.
- Don't rotate, skew, or add drop shadows to the mark.
- The amber crossbar is a fixed brand element — never replace it with another colour.
