---
name: Cinematic Noir
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d4c0d7'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#9d8ba0'
  outline-variant: '#514255'
  surface-tint: '#ecb2ff'
  primary: '#ecb2ff'
  on-primary: '#520071'
  primary-container: '#bd00ff'
  on-primary-container: '#ffffff'
  inverse-primary: '#9900cf'
  secondary: '#ffaedd'
  on-secondary: '#60004a'
  secondary-container: '#c20299'
  on-secondary-container: '#ffe0ef'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#777676'
  on-tertiary-container: '#ffffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f8d8ff'
  primary-fixed-dim: '#ecb2ff'
  on-primary-fixed: '#320047'
  on-primary-fixed-variant: '#74009f'
  secondary-fixed: '#ffd8ec'
  secondary-fixed-dim: '#ffaedd'
  on-secondary-fixed: '#3b002d'
  on-secondary-fixed-variant: '#88006a'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 72px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bodoni Moda
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  title-md:
    fontFamily: Bodoni Moda
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '300'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '300'
    lineHeight: '1.6'
  data-mono:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 80px
  section-gap: 160px
---

## Brand & Style

This design system draws inspiration from the evocative editorial language of A24 and the technical precision of Apple Design Award winners. It is defined by a "Cinema-First" philosophy, where the UI acts as a silent, sophisticated frame for high-fidelity content. 

The aesthetic is a blend of **Minimalism** and **Subtle Glassmorphism**, emphasizing negative space to create a sense of luxury and breathing room. The emotional response is intended to be atmospheric, premium, and intellectual. Every interaction should feel intentional and quiet, avoiding visual noise in favor of high-contrast typography and moody, tonal depth.

## Colors

The palette is anchored in absolute darkness. By using pure black (`#000000`) for the primary canvas, we maximize the contrast of the high-end display panels. 

- **Primary Canvas:** Pure black to allow hardware bezels to disappear.
- **Surface Elevation:** Deep charcoal and semi-transparent layers for structural depth.
- **Accents:** Electric purple is reserved for primary actions and critical focus states. Muted neon pink is used exclusively for secondary emphasis or subtle status indicators.
- **Glass:** Transitions utilize ultra-low opacity white (5-8%) to create a smoke-like glass effect.

## Typography

Typography is the primary driver of the design system's personality. We employ a high-contrast pairing: 

1. **Bodoni Moda:** Used for headlines and editorial moments. It should be set with tight tracking to emphasize its vertical elegance. 
2. **Geist:** A technical, geometric sans-serif used for all functional data, navigation, and body copy. 

For "Data" and "Label" roles, use uppercase styling with increased letter spacing to evoke a technical, cinematic metadata aesthetic. Paragraphs should favor light weights (300) to maintain a delicate, premium feel against the dark background.

## Layout & Spacing

This design system uses a **Fixed Grid** model for desktop to ensure cinematic compositions remain intact, transitioning to a fluid model for mobile.

- **Negative Space:** Use aggressive vertical spacing (`section-gap`) to separate content blocks. Whitespace is treated as a premium asset, not a void.
- **Grid:** A 12-column grid with wide margins (`80px`+) on desktop.
- **Photography:** Images should be full-bleed or span at least 8 columns. Use 21:9 or 16:9 aspect ratios exclusively to maintain a filmic quality.
- **Alignment:** Headlines should often be center-aligned or offset intentionally to create editorial tension. Data should be strictly grid-aligned.

## Elevation & Depth

Depth is not communicated through heavy shadows, but through **Tonal Layering** and **Glassmorphism**.

1. **The Base:** `#000000`.
2. **The Layer:** Deep charcoal surfaces (`#0A0A0A`) with a `0.5px` solid border in `rgba(255,255,255,0.1)`.
3. **The Floating Element:** For overlays, use a background blur of `20px` combined with a subtle inner glow (a `1px` top-border that is slightly brighter than the rest).
4. **The Glow:** Active states should utilize a very soft, diffused outer glow using the primary purple accent (opacity 15%, blur 30px) rather than a traditional drop shadow.

## Shapes

The shape language is "Soft-Modern." We avoid fully circular or overly rounded elements to prevent the UI from feeling too playful. 

- **Containers:** Use `rounded-lg` (8px) for cards and primary containers.
- **Small Elements:** Buttons and tags use `rounded` (4px).
- **Interactive States:** On hover, borders may subtly increase in opacity, but the corner radius remains constant to maintain structural integrity.

## Components

### Buttons
Primary buttons are transparent with a `0.5px` border and high-letter-spaced Geist text. Upon hover, they fill with the primary electric purple and emit a faint purple floor-glow. Secondary buttons are pure text with an underline that expands from the center on hover.

### Cards
Cards are glassmorphic shells. They feature a `20px` backdrop blur and `0.5px` borders. Images within cards should have a slight "Ken Burns" zoom effect when the card is hovered.

### Input Fields
Inputs are minimalist underlines or subtle ghost boxes. The label sits above in `label-sm` (uppercase). The caret should be the accent purple.

### Cinematic Lists
Lists used for navigation or content discovery should feature large hover-states where a thumbnail image follows the cursor or appears in the background (low opacity) to provide a rich, immersive browsing experience.

### Micro-transitions
All transitions should use a custom cubic-bezier `(0.16, 1, 0.3, 1)`—a "quintic" out—making movements feel swift yet incredibly smooth and "heavy."