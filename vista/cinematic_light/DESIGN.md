---
name: Cinematic Light
colors:
  surface: '#f8f9ff'
  surface-dim: '#d1dbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dfe9fa'
  surface-container-highest: '#d9e3f4'
  on-surface: '#121c28'
  on-surface-variant: '#4a4455'
  inverse-surface: '#27313e'
  inverse-on-surface: '#eaf1ff'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#b5005d'
  on-secondary: '#ffffff'
  secondary-container: '#da2676'
  on-secondary-container: '#fffbff'
  tertiary: '#4d4f50'
  on-tertiary: '#ffffff'
  tertiary-container: '#656768'
  on-tertiary-container: '#e5e6e7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#ffd9e2'
  secondary-fixed-dim: '#ffb1c7'
  on-secondary-fixed: '#3f001c'
  on-secondary-fixed-variant: '#8e0048'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f8f9ff'
  on-background: '#121c28'
  surface-variant: '#d9e3f4'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 80px
---

## Brand & Style

The design system is defined by a "Cinematic Light" aesthetic—a high-end, editorial approach to digital interfaces. It targets a premium audience that values clarity, sophistication, and a sense of "digital air." The personality is poised and gallery-like, evoking the feeling of a modern art museum or a high-fashion digital lookbook.

The style is a hybrid of **Apple-inspired Minimalism** and **Refined Glassmorphism**. It utilizes expansive white space, precise typography, and translucent layering to create depth without visual clutter. The emotional response should be one of "effortless luxury"—where the interface feels light, responsive, and secondary to the cinematic content it hosts.

## Colors

The palette is anchored by a base of **Soft White (#F9FAFB)** and **Warm Grays**, creating a low-strain, high-luxury canvas. 

- **Primary (Electric Purple):** Adjusted to #7C3AED to ensure a 4.5:1 contrast ratio against white backgrounds while maintaining its neon energy.
- **Secondary (Neon Pink):** Shifted to #DB2777 for optimal legibility in text and icon states.
- **Neutrals:** A range of warm grays (from #111827 for text to #E5E7EB for subtle dividers) provides structure without the harshness of pure black.
- **Glass Surfaces:** Utilizes a highly transparent white (70-80% opacity) to allow background colors and content to bleed through softly.

## Typography

This design system uses a high-contrast typographic pairing to reinforce the cinematic theme. 

**Playfair Display** is reserved for headlines and editorial moments. It should be used with generous leading and occasional italicization for emphasis. **Inter** handles all functional data, UI labels, and long-form body copy. This geometric sans-serif ensures that even at small sizes, technical information (runtimes, ratings, dates) remains perfectly legible. 

For display sizes, use slight negative letter-spacing to tighten the serif's elegance. For labels, use increased letter-spacing and uppercase styling to distinguish functional elements from narrative content.

## Layout & Spacing

The layout follows a **12-column fluid grid** for desktop, transitioning to a **4-column grid** for mobile. The philosophy is "Content First," utilizing wide margins and significant vertical "Section Gaps" to allow the eye to rest between cinematic modules.

Spacing follows an 8px linear scale. 
- **Desktop:** Use 64px side margins to create a "letterboxed" feel, centering the content.
- **Vertical Rhythm:** Elements within a card or group use 8px/16px spacing, while major UI blocks are separated by 80px or more to maintain the premium, airy feel.
- **Reflow:** On mobile, margins shrink to 20px, and large display type scales down to ensure no awkward line breaks in titles.

## Elevation & Depth

Depth is achieved through **Backdrop Blurs** and **Tonal Layering** rather than traditional heavy shadows.

1.  **The Base:** The bottom layer is the solid #F9FAFB background.
2.  **The Glass Layer:** Floating panels (cards, navigation bars, modals) use a `backdrop-filter: blur(20px)` and a semi-transparent white fill.
3.  **The Stroke:** Every elevated element must have a 1px border. Use a linear gradient stroke (top-left to bottom-right) ranging from a bright white (highlight) to a soft gray (shadow) to simulate a physical glass edge.
4.  **Shadows:** When necessary for functional separation (e.g., dropdowns), use a single "Ambient Shadow": `0px 10px 40px rgba(0, 0, 0, 0.04)`. It should be almost imperceptible.

## Shapes

The shape language is consistently **Rounded**, mimicking the hardware aesthetics of high-end consumer electronics. 

- **Standard Elements (Buttons, Inputs):** 0.5rem (8px) radius.
- **Containers (Cards, Modals):** 1rem (16px) radius.
- **Feature Elements (Hero Carousels):** 1.5rem (24px) radius.

Avoid sharp 0px corners entirely to maintain the soft, approachable luxury of the design system.

## Components

- **Buttons:** Primary buttons use a solid Electric Purple fill with white Inter Medium text. Secondary buttons use the Glassmorphism effect: a transparent background, 1px gradient border, and Purple text.
- **Glass Cards:** The signature component. These must feature a 20px backdrop blur, the 1px gradient stroke, and internal padding of 24px. Content inside should be vertically stacked with Playfair Display for titles and Inter for metadata.
- **Inputs:** Fields should be semi-transparent with a 1px soft gray border. On focus, the border transitions to a 1px Electric Purple stroke with a subtle outer glow.
- **Chips/Tags:** Used for genres or categories. Pill-shaped (32px height) with a very light gray background (#F3F4F6) and Inter Bold 12px text.
- **Lists:** Clean, borderless rows separated by subtle 1px horizontal lines (#F3F4F6). Icons should be thin-stroke (1.5pt) to match the elegant serif typography.
- **Cinematic Hero:** A full-width or large-container component using high-quality imagery with a subtle bottom-to-top white gradient overlay to ensure text legibility.