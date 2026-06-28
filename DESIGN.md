---
name: Spotify Downloader
description: A sharp, music-aware download tool. Paste a Spotify URL, receive MP3s.
colors:
  primary: "oklch(0.65 0.18 132)"
  primary-bright: "oklch(0.77 0.20 131)"
  primary-foreground: "oklch(0.99 0.03 121)"
  canvas-black: "oklch(0.145 0 0)"
  canvas-white: "oklch(1 0 0)"
  surface-raised: "oklch(0.205 0 0)"
  muted-bg: "oklch(0.97 0 0)"
  muted-dark: "oklch(0.269 0 0)"
  ghost-light: "oklch(0.556 0 0)"
  ghost-dark: "oklch(0.708 0 0)"
  divider: "oklch(0.922 0 0)"
  fault-red: "oklch(0.58 0.22 27)"
typography:
  display:
    fontFamily: "Geist, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
rounded:
  none: "0px"
  xl: "0.875rem"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.none}"
    height: "32px"
    padding: "0 10px"
  button-primary-hover:
    backgroundColor: "oklch(0.57 0.16 132)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.canvas-black}"
    rounded: "{rounded.none}"
    height: "32px"
    padding: "0 10px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.canvas-black}"
    rounded: "{rounded.none}"
    height: "32px"
    padding: "0 10px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.canvas-black}"
    rounded: "{rounded.none}"
    height: "32px"
    padding: "4px 10px"
  card-default:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.canvas-black}"
    rounded: "{rounded.none}"
    padding: "16px"
  progress-bar:
    backgroundColor: "{colors.muted-bg}"
    rounded: "{rounded.none}"
    height: "4px"
---

# Design System: Spotify Downloader

## 1. Overview

**Creative North Star: "The Collector's Archive"**

This is the interface a music obsessive built for themselves: precise, unhurried, and quietly confident. The surface is dark by default when the OS prefers it — because album art reads best against a dark canvas, and because this tool does serious work. The green comes directly from the music it handles. Everything else gets out of the way.

The system rejects decoration by principle. There are no rounded corners on interactive elements, no ambient shadows, no gradient fills, no glassmorphism. Depth is created by tonal layering: the page, the card, the raised surface — three distinct levels, no blurring. When the green appears, it means something: a primary action, a live state, a result. Its sparing use across most of the UI makes it land harder on the download CTA.

This is not a marketing tool. It does not need to sell itself. It needs to be fast, clear, and trustworthy — something a user opens, pastes into, and closes with a ZIP in hand.

**Key Characteristics:**
- Sharp corners everywhere on interactive elements (0px radius on buttons, inputs, cards, progress)
- Single font family (Geist) across all hierarchy levels
- Green accent used as a brand signature — active states, links, progress fill, primary actions
- Album art and cover images receive elevated treatment: rounded corners (0.875rem) and shadow
- Thin `ring-1` outlines replace box shadows for card elevation
- Flat-by-default: no shadows on interactive elements at rest
- Both light and dark themes are first-class; neither is an afterthought

## 2. Colors: The Vinyl Palette

Two neutrals anchor the palette. One green signs everything important.

### Primary

- **Vinyl Green** (`oklch(0.65 0.18 132)`, light mode): The brand signature. Applied to primary buttons (download CTA), active table row indicators, link text, and the progress bar fill. Derived from Spotify's own hue family but at lower chroma — more intentional than borrowed. At this lightness it reads clearly on a white canvas.
- **Vinyl Green — Bright** (`oklch(0.77 0.20 131)`, dark mode): The same green lifted for legibility on a near-black surface. More radiant, equally focused. Used identically to Vinyl Green in all dark-mode contexts.
- **Primary Foreground** (`oklch(0.99 0.03 121)`): The text color placed on top of Vinyl Green buttons. Near-white with a faint warm-green tint. Never pure white — pure white clashes with the hue.

### Neutral

- **Canvas Black** (`oklch(0.145 0 0)`): The dark mode page background and the primary text color in light mode. The same value serves both roles — the system is built around a single pair of opposites.
- **Canvas White** (`oklch(1 0 0)`): The light mode page background.
- **Surface Raised** (`oklch(0.205 0 0)`): Dark mode card surface. Sits one step above Canvas Black, creating tonal depth without shadows.
- **Muted BG** (`oklch(0.97 0 0)`): Light mode secondary backgrounds — hover states, muted chips, secondary panels.
- **Muted Dark** (`oklch(0.269 0 0)`): Dark mode equivalent of Muted BG.
- **Ghost Light** (`oklch(0.556 0 0)`): Secondary text in light mode — metadata, descriptions, track counts. Must pass 4.5:1 on Canvas White (it does: ~4.8:1).
- **Ghost Dark** (`oklch(0.708 0 0)`): Secondary text in dark mode.
- **Divider** (`oklch(0.922 0 0)`): Light mode borders and separators. Used as `ring-1` on cards and `border` on inputs. Dark mode equivalent is `oklch(1 0 0 / 10%)`.

### Semantic

- **Fault Red** (`oklch(0.58 0.22 27)`): Destructive actions (delete, error states). Used at 10% opacity for backgrounds and full value for borders and text. Never used decoratively.

### Named Rules

**The One Voice Rule.** Vinyl Green appears on one thing at a time. Primary CTA, active state, or progress indicator — never two simultaneously. Its scarcity makes every appearance decisive.

**The Neutral-First Rule.** The canvas is neutral. Color enters only to carry information. Backgrounds, cards, borders, and typographic elements default to the neutral scale; Vinyl Green enters only when a primary action or live state demands it.

## 3. Typography

**Primary Font:** Geist (with system sans-serif fallback)
**Mono Font:** Geist Mono (for durations, track numbers, and numerical data)

**Character:** Geist is clean and slightly technical — not cold, not expressive. It holds weight contrast well across the scale (800 display vs 400 body reads like a 2:1 ratio). Mono variant for track timestamps gives numerical data a precision that proportional text doesn't.

### Hierarchy

- **Display** (800 weight, `clamp(2.5rem, 5vw, 4rem)`, line-height 1.05, tracking -0.02em): Playlist and track names at hero scale. Used once per page, on the primary content heading. Never in a card or list.
- **Headline** (700 weight, 1.875rem / 30px, line-height 1.15): Section headings, secondary page titles. Rare by design.
- **Title** (500 weight, 0.875rem / 14px, line-height 1.4): Card titles, column headers, UI labels. The default for named interface elements.
- **Body** (400 weight, 0.875rem / 14px, line-height 1.6): Track descriptions, playlist metadata, contextual explanations. Keep line length ≤65ch.
- **Label** (400 weight, 0.75rem / 12px, line-height 1.5): Supporting metadata — owner name, track count, release year, status messages. Also Geist, not uppercase, not tracked.
- **Mono** (Geist Mono, 400 weight, 0.75rem / 12px): Duration timestamps (`formatDuration`), progress percentages, track numbers. `tabular-nums` feature active.

### Named Rules

**The Single Family Rule.** Geist does all the work. No serif, no display typeface, no secondary sans. Hierarchy is expressed through weight contrast (800 → 500 → 400) and size, not family switching. Three weights is enough.

**The No-Uppercase-Body Rule.** Uppercase is prohibited for body copy, descriptions, and anything longer than four words. It is permitted only for single-word or two-word status badges (e.g. "PLAYLIST") when used sparingly and not on every section. The playlist header eyebrow is the one permitted instance.

## 4. Elevation

This system is flat by default. Depth is created through tonal layering, not shadow.

There are three distinct surface levels:
1. **Page** — Canvas Black (`oklch(0.145 0 0)`) in dark / Canvas White (`oklch(1 0 0)`) in light
2. **Card / Panel** — Surface Raised (`oklch(0.205 0 0)`) in dark / Canvas White with `ring-1 ring-foreground/10` in light
3. **Popover / Dropdown** — Same as Card, but lifted above the page via `z-index`

Cards do not use `box-shadow`. Instead, a `ring-1` outline at `oklch(1 0 0 / 10%)` (dark) or `oklch(0.145 0 0 / 10%)` (light) delineates surfaces from each other. This reads as structural, not decorative.

**The one exception:** Album art and playlist cover images receive `shadow-lg` (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`). Cover art is content, not chrome; it earns the shadow because it carries the music identity.

### Named Rules

**The Flat-By-Default Rule.** Buttons, inputs, and cards are flat at rest. No shadow lifts them. If a component needs to feel elevated, tonal contrast is the tool; shadow is not.

**The Content Exception.** Album art is exempt from flat-by-default. It is the only element in the system that uses shadow as a structural device — because artwork depth is expected by users and because it gives the cover image visual separation from the dark canvas.

## 5. Components

### Buttons

Sharp, compact, and deliberately minimal. No radius on any variant.

- **Shape:** 0px radius on all variants. This is non-negotiable and applies to all sizes.
- **Primary:** Vinyl Green background (`oklch(0.65 0.18 132)` light / `oklch(0.77 0.20 131)` dark), Primary Foreground text, `h-8` (32px) default, `h-9` (36px) large. Padding 10px horizontal. No border.
- **Hover:** Background darkens ~15% via opacity or direct step (`oklch(0.57 0.16 132)`). Transition: `all 150ms ease`.
- **Disabled:** 50% opacity, pointer-events none. Color unchanged.
- **Outline:** Transparent background, `border-border` (1px), same text color as foreground. Hover fills with `bg-muted`.
- **Ghost:** No border, no background. Hover fills with `bg-muted`.
- **Icon variants:** `size-8` (32px square) or `size-9` (36px square). Always square, never rectangular.
- **Download Button (stateful):** A signature component. The primary button mutates through five states: idle (Download + icon), initializing (Loader + "Starting..."), processing (Loader + percentage), downloading (Loader + "Saving..."), complete (outline variant + green text + CheckCircle), error (destructive bg + XCircle + "Retry"). Status message appears below on a single line; never wraps.

### Inputs / Fields

- **Style:** 1px border (`border-input`), transparent background, 0px radius, `h-8` (32px), `text-xs` (12px).
- **Focus:** Border shifts to `--ring` (the foreground color at ~70%), plus a 1px ring at 50% opacity. No glow, no halo.
- **Placeholder:** `text-muted-foreground`. Must pass 4.5:1 on background — verify in both modes.
- **Input Group (URL entry):** The primary input surface. A composite of Input + inline addons. Left addon: Search icon (decorative). Right addon: Paste (clipboard icon, shown when empty), Clear (trash icon, shown when populated), and validation feedback (Check or X icon). All inline, no floating elements.
- **Error / Invalid:** `aria-invalid` drives red border and ring. No error text shown below; feedback is icon-only (X).

### Cards / Containers

- **Corner Style:** 0px radius (sharp). No exceptions.
- **Background:** `bg-card` — Canvas White in light mode, Surface Raised in dark.
- **Shadow Strategy:** None. Elevated via `ring-1 ring-foreground/10` outline only.
- **Border:** The ring IS the border. No separate `border` property.
- **Internal Padding:** `p-4` (16px) for standard cards; `p-3` (12px) for small variant.
- **Home Page Card:** The single `Card` on the landing page is the URL entry surface. Width capped at `w-lg`. Contains a heading, descriptor, and the URL Input Group.

### Album Art / Cover Image

- **Shape:** `rounded-xl` (0.875rem ≈ 14px). The only rounded element besides pill links.
- **Shadow:** `shadow-2xl` (`0 25px 50px -12px rgb(0 0 0 / 0.25)`) on track detail page. `shadow-lg` on playlist header.
- **Size:** 224×224px (playlist, mobile), 256×256px (playlist, desktop), 224×224px (track). Always square. Always fills the full container with `object-cover`.
- **Fallback:** Muted background with a `Music` icon centered. Same dimensions. No outline, no text label.

### Progress Bar

- **Shape:** 0px radius. 4px height (`h-1`). Full container width.
- **Track:** `bg-muted` (Muted BG in light, Muted Dark in dark).
- **Fill:** `bg-primary` (Vinyl Green). Translates via `translateX(-${100 - value}%)` — no width transition, transform only.
- **Transition:** `transition-all` on the indicator. Smooth on WebSocket-driven percentage updates.

### Navigation

No persistent navigation exists. The UI is page-based: home → playlist or track. The browser back button is the navigation system. Future nav additions should stay minimal — no sidebars, no top navbars unless the information architecture requires it.

## 6. Do's and Don'ts

### Do:
- **Do** use Vinyl Green exclusively on: the primary download CTA, active/selected table row indicators, link text on hover, and progress bar fill. Nowhere else.
- **Do** keep all interactive elements (buttons, inputs, cards) at 0px border radius. This is the most distinctive visual signature of this system.
- **Do** give album art `rounded-xl` and appropriate shadow. It is the only surface that earns visual elevation.
- **Do** use `ring-1 ring-foreground/10` for card outlines in place of `border` or `box-shadow`.
- **Do** use Geist Mono and `tabular-nums` for all numerical data: durations, progress percentages, track numbers.
- **Do** keep status messages (download progress, error states) inline and single-line. Never use a toast or modal for download state.
- **Do** verify Ghost Light (`oklch(0.556 0 0)`) and Ghost Dark (`oklch(0.708 0 0)`) contrast on their respective backgrounds before using them for any non-decorative text.
- **Do** use `text-wrap: balance` on h1–h3 headings to prevent orphaned last words.
- **Do** respect `prefers-reduced-motion`: all transitions should collapse to instant under the media query.

### Don't:
- **Don't** add border-radius to buttons, inputs, or cards. The system is flat and sharp; adding curves compromises the visual identity.
- **Don't** use gradient fills anywhere — on text, buttons, backgrounds, or decorative elements. Flat color only.
- **Don't** design anything that resembles a sketchy download tool: ad-adjacent layouts, warning banners, cramped form fields, or security-theater iconography (shields, locks used decoratively).
- **Don't** use SaaS marketing patterns: gradient hero sections, social proof counters, "streamline your workflow" copy, or anything that sells rather than helps.
- **Don't** make the UI playful or bubbly — no pastel tones, rounded-everything softness, or casual-consumer animation (bouncing, elastic motion).
- **Don't** let the palette drift into default gray — the system is neutral by design, but neutrals must be intentional (tonal layering), not lazy (framework default gray everywhere).
- **Don't** use `box-shadow` on buttons or inputs at rest. Flat means flat.
- **Don't** place uppercase tracked text on more than one section per view. The playlist header eyebrow is the permitted instance; duplicating the pattern makes it filler.
- **Don't** introduce a second font family. Geist handles all hierarchy through weight and size.
- **Don't** clip album art or cover images with a 0px radius. They always get `rounded-xl`.
