---
name: spotdl
description: A dark-first download tool for Spotify links — neutral surfaces, bordered at rest, Spotify green used only where it acts.
colors:
  canvas-dark: "#0f0f0f"
  surface-dark: "#161616"
  raised-dark: "#1e1e1e"
  overlay-dark: "#1a1a1a"
  line-dark: "#262626"
  line-strong-dark: "#333333"
  ink-dark: "#ededed"
  ink-muted-dark: "#a1a1a1"
  ink-subtle-dark: "#8a8a8a"
  accent-hover-dark: "#1ed760"
  accent-text-dark: "#1ed760"
  accent-wash-dark: "rgb(29 185 84 / 0.14)"
  danger-dark: "#ef4444"
  danger-text-dark: "#f87171"
  danger-wash-dark: "rgb(239 68 68 / 0.12)"
  canvas-light: "#ffffff"
  surface-light: "#fafafa"
  raised-light: "#f2f2f2"
  overlay-light: "#ffffff"
  line-light: "#e6e6e6"
  line-strong-light: "#d4d4d4"
  ink-light: "#171717"
  ink-muted-light: "#595959"
  ink-subtle-light: "#6e6e6e"
  accent-hover-light: "#1aa34a"
  accent-text-light: "#12833c"
  accent-wash-light: "rgb(29 185 84 / 0.1)"
  danger-light: "#dc2626"
  danger-text-light: "#b91c1c"
  danger-wash-light: "rgb(220 38 38 / 0.09)"
  accent: "#1db954"
  accent-ink: "#0a0a0a"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  micro:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "16px"
  numeric:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    fontFeature: "tabular-nums"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover-dark}"
    textColor: "{colors.accent-ink}"
  button-secondary:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted-dark}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "32px"
  button-danger:
    backgroundColor: "{colors.danger-wash-dark}"
    textColor: "{colors.danger-text-dark}"
    rounded: "{rounded.md}"
    height: "36px"
  input:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
    typography: "{typography.body}"
  url-field-hero:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "52px"
  badge-neutral:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-muted-dark}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
    typography: "{typography.micro}"
  badge-accent:
    backgroundColor: "{colors.accent-wash-dark}"
    textColor: "{colors.accent-text-dark}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  segmented-item-selected:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.xl}"
  popover:
    backgroundColor: "{colors.overlay-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.lg}"
    padding: "16px"
    width: "288px"
  downloads-dock:
    backgroundColor: "{colors.canvas-dark}"
    textColor: "{colors.ink-dark}"
    width: "380px"
---

# Design System: spotdl

## Overview

**Creative North Star: "The Machine Room"**

spotdl is a working tool that happens to be about music. Its ground is a deep neutral you would find in a dashboard, not on a marketing page, and everything drawn on that ground is either a control or a piece of real content from Spotify. The album art is the only saturated thing on most screens — the interface itself contributes almost no color at all. Where color does appear it is doing a job: the accent marks the thing you press, the progress that advances, and the row that is currently playing. Nothing is tinted for atmosphere.

Density is dashboard-density: a 14px body base, tracks at 13px in bordered tables, controls on a 32/36/44px height ladder. But the release pages open up — cover art at 160–224px, a title up to 2.75rem, and a 40px gap before the tracklist — because a record deserves a masthead. The tool is dense; the content is not.

Dark is the designed reference. The palette was drawn on `#0f0f0f`, where cover art reads best, and light was then composed by hand from it, value by value, never generated by inversion. Both themes ship every token and both are held to the same contrast floor. The system's confirmed anti-references are the sketchy-downloader register (ad density, warning banners, cramped chrome), SaaS marketing gloss (gradient heroes, persuasion copy), consumer bubbliness, and framework-default gray. Its craft floor is Supabase's dashboard density and docked-panel language, Vercel's typographic restraint, and Apple's spatial generosity on content pages.

**Key Characteristics:**

- Dark-first neutrals, light composed by hand from them
- Bordered at rest — depth comes from 1px lines and tonal steps, not shadow
- Spotify green on fills, progress and state; never as body text on a light ground
- A real 4/6/8/12/16 radius scale, applied consistently and always by token name
- Geist and Geist Mono, tabular numerals on every figure that can be compared
- All interface copy lowercase, written that way in the source
- One authored entrance, reused everywhere; everything collapses under reduced motion

## Colors

A four-step neutral stack in each theme carries the entire interface, with exactly two chromatic roles — Spotify green for action and a red for failure — and album art supplying all remaining color.

### Primary

- **Spotify Green** (`#1db954`, both themes): fills and indicators only — primary button ground, progress bar, switch-on, the badge on the downloads counter, the play button while a preview is active, the caret, and the text selection ground. It is also the focus ring in both themes. It is never body text.
- **Signal Green** (`#1ed760` dark / `#12833c` light, `accent-text-*`): the accent *as text or icon* — link hovers, the valid-link check in the URL field, the completed-job tick, the currently-playing track title. This is a separate value because the fill green is only ~2.3:1 on white.
- **Accent Ink** (`#0a0a0a`, both themes): the only color that sits on top of the accent fill (7.66:1). Also the switch thumb when on.
- **Accent Wash** (10% green light / 14% dark): the currently-playing row and the accent badge ground.

### Secondary

- **Alert Red** (`#ef4444` dark / `#dc2626` light) with **Alert Red Text** (`#f87171` / `#b91c1c`) and a wash at 12% / 9%. Used for the invalid-link state, the failed-job row, the error boundary's icon medallion, and the destructive button. Never decorative, and never the only carrier of a state — every error state also carries an icon and a sentence.

### Neutral

Four grounds, each one step apart, stacked in the same order in both themes:

- **Canvas** (`#0f0f0f` dark / `#ffffff` light): the page itself, and — deliberately — the ground of bordered content containers (tracklist, detail list) so they read as cut into the page rather than lifted off it. Also the ground of the selected segmented item and the downloads dock.
- **Surface** (`#161616` / `#fafafa`): controls at rest — inputs, secondary buttons, the URL field, table headers, badges, row hover.
- **Raised** (`#1e1e1e` / `#f2f2f2`): the step above surface — button hover, progress track, skeletons, cover-art placeholder ground.
- **Overlay** (`#1a1a1a` / `#ffffff`): things that genuinely float — popovers, tooltips, the now-playing bar, the inline URL error. Note it is *lighter* than canvas in dark and equal to canvas in light; in both themes an overlay is distinguished by its border and shadow, not by tone alone.

Two border weights: **Line** (`#262626` / `#e6e6e6`) is the default border on everything (it is the global `border-color`), and **Line Strong** (`#333333` / `#d4d4d4`) is the hover/emphasis border and the scrollbar thumb.

Three text steps, all of which clear WCAG AA on their own ground — light then dark: **Ink** (`#ededed` / `#171717`) at 17.93 / 16.37 for titles and primary copy; **Ink Muted** (`#a1a1a1` / `#595959`) at 7.00 / 7.42 for secondary lines, artists, metadata; **Ink Subtle** (`#8a8a8a` / `#6e6e6e`) at 5.10 / 5.55 for table headers, hints, placeholders and separator dots. Subtle is the floor — there is no fourth, dimmer step.

### Named Rules

**The Accent-Text Rule.** `--accent` is a fill; `--accent-text` is text. `#1db954` fails AA outright on white, so any green word, number or icon takes `--accent-text`. Reaching for `--accent` because it is "the brand color" is how the light theme breaks.

**The Content-Wins Rule.** Cover art is the loudest thing on any page and nothing in the chrome may compete with it. The interface contributes green and red and otherwise stays neutral; there are no tinted panels, no gradient grounds, and no decorative color.

**The Browser-Surface Rule.** Selection, caret, focus ring and scrollbar are part of the system and are themed explicitly. A surface you did not draw is still a surface you own.

## Typography

**Display / Body Font:** Geist (with `ui-sans-serif, system-ui, sans-serif`), loaded via `next/font`
**Numeric / Mono Font:** Geist Mono (with `ui-monospace, monospace`), loaded via `next/font`

**Character:** One neutral grotesque doing everything, tightened at display sizes and left alone at text sizes, with its monospace sibling reserved for figures. The pairing has no voice of its own — that is the point. Restraint at the type level is what keeps a download tool from looking like a download site.

### Hierarchy

There is **no type-scale token set**. Sizes are chosen per component as arbitrary values, and the ramp below is a description of what the build actually uses, not a scale it reads from. This is a known gap: a future pass should promote these into named steps. Until then, pick from this list rather than inventing a new size.

- **Headline** (600, `2.25rem` → `3rem` at `sm`, line-height 1.05, tracking `-0.03em`): the home page's one sentence. Nothing else uses it.
- **Display** (600, `1.875rem` → `2.25rem` at `sm` → `2.75rem` at `lg`; the track page tops out at `2.5rem`; line-height 1.1, tracking `-0.025em`, balanced wrap): release and track titles in the masthead.
- **Title** (600, `15px`): section headings and the panel header. Also used at 500 weight for the byline under a release title, and at 600 for the wordmark with `-0.02em` tracking.
- **Body** (400/500, `13px`): the workhorse — track names, table cells, detail values, paragraphs, buttons at `md`/`sm`. Long-form copy is capped at 52–65ch.
- **Label** (500, `12px`): form labels, secondary metadata lines, artist lines, load-more counters.
- **Micro** (500, `11px`): table column headers, badges, type captions in the job row, digest references. `10px` exists only inside `kbd` chips.
- **Numeric** (Geist Mono, `11–12px`, tabular): durations, track positions, percentages, ISRC, popularity.

The document base is `14px` at line-height 1.5 on `body`; `h1`–`h3` get balanced wrapping and `-0.02em` tracking globally.

### Named Rules

**The Lowercase Rule.** Every word the interface itself writes is lowercase — headings, buttons, labels, errors, aria-labels, the wordmark — and it is written lowercase in the source, never produced by `text-transform`, so the accessibility tree and the clipboard match what is on screen. Content from Spotify (track, artist, album, playlist names and descriptions) keeps its own casing untouched. Formatting helpers lowercase their own output for the same reason, and the error boundary translates capitalized runtime messages into product copy rather than showing them. This is a hard rule; a single sentence-cased button breaks it visibly.

**The Tabular Rule.** Any number that can be compared down a column or that changes in place carries the `.tabular` utility (`font-variant-numeric: tabular-nums`): durations, track numbers, percentages, ISRC, counts, aggregate runtimes. Durations, positions and identifiers additionally take Geist Mono.

**The No-Kicker Rule.** A page's type starts at its title. The resource type ("album", "playlist") lives in the metadata line *under* the heading, never as a small label above it, and there are no eyebrows, kickers or category tags anywhere in the system.

## Layout

A single centered column under a sticky top bar, with the measure set by how many columns the page actually has:

- **Playlist** `max-w-[1400px]` — it is the only page with album and added columns, so it earns the width.
- **Album** and **Track** `max-w-4xl` (896px) — three-column rows and a detail list; wider left a dead gulf between title and duration and stopped reading as centered once the downloads panel docked.
- **Home** `max-w-xl` (576px) — one field and a short list, vertically centered in the viewport.

Page padding is `16px` rising to `24px` at `sm`; vertical padding `32px` rising to `48px`. The rhythm inside a page is `40px` between masthead and tracklist, `24px` between masthead columns, `32px` between home's blocks, and `8–12px` inside controls. There is **no bespoke spacing token layer** — Tailwind's default 4px scale is used directly; the steps above are the ones that actually recur.

**Breakpoints** are Tailwind defaults and only three are used: `sm` 640px (padding step up, top bar collapses to one row, mastheads go side-by-side), `md` 768px (playlist reveals the album column), `lg` 1024px (playlist reveals the added column, cover art reaches 224px, the downloads panel docks).

**The top bar** is sticky, 56px at `sm` and up, with a translucent canvas at 85% and a backdrop blur, bordered below. Below `sm` it wraps the URL field onto a second row rather than hiding it — the paste field is the only route into the app, so it is present at every width. The landing page is the one exception: it owns a full-size field already, so the bar shows none.

**The downloads panel** is 380px, fixed to the right edge, full viewport height. At `lg` and up it genuinely docks: the shell adds `lg:pr-[380px]` so the page yields a gutter and a running job never covers the tracklist. Below `lg` the same element becomes a modal sheet — scrim, focus move, focus restore, body scroll lock, `role="dialog"`. Closed, it is `inert`, which removes it from the tab order and the accessibility tree together.

### Named Rules

**The Measure Rule.** Container width follows column count, not page importance. Add a column, widen the measure; remove one, narrow it. A route skeleton inherits the measure of the page it stands in for — there is no shared app-level skeleton, because one measure cannot be right for a 1400px playlist and an 896px track page, and getting it wrong makes the layout jump sideways the moment content resolves.

## Elevation & Depth

Surfaces are **bordered at rest and never shadowed**. Depth is carried by the four-step tonal stack (canvas → surface → raised → overlay) plus a 1px `line` border, which is why the system reads as flat and precise rather than lifted. A shadow in this system is a claim that the element is physically above the page, and only five things make that claim: popovers and tooltips, the now-playing bar, the docked panel at `lg`, the inline URL-field error, and the selected item in a segmented control. Cover art is the one content element that carries a shadow, and it carries a different one. The vocabulary below is exhaustive — no element anywhere in `frontend/src` uses a shadow outside these two tokens, and `grep -r 'shadow-sm\|shadow-lg\|drop-shadow'` returning nothing is the audit test.

Both shadows use real offset and blur, and both scale their alpha by theme (10%/18% light, 50%/60% dark) — a shadow tuned for white will disappear on `#0f0f0f`.

### Shadow Vocabulary

- **Float** (`box-shadow: 0 8px 24px -6px var(--shadow-color), 0 2px 6px -2px var(--shadow-color)`): anything that overlays page content — popover, tooltip, now-playing bar, docked panel, inline field error, the raised segmented selection.
- **Art** (`box-shadow: 0 16px 40px -12px var(--shadow-art-color)`): cover art on a masthead only. A larger, softer, further-offset cast that lifts the artwork off the page.

### Named Rules

**The Bordered-At-Rest Rule.** If it sits in the page, it gets a border and a tonal step. If it floats over the page, it gets `--shadow-float`. There is no third option, and hover never adds a shadow — hover moves a border from `line` to `line-strong`, or a ground from `surface` to `raised`.

**The Art Exception.** `--shadow-art` belongs to cover art and nothing else. It is the one place the system admits physical depth, because the artwork is the only object on the page that is not part of the interface.

## Shapes

Squares with softened corners on a five-step scale plus full: **4px** (`xs` — the focus ring's own radius and the `kbd` chips, the smallest things the system draws), **6px** (`sm` — small buttons, badges, segmented items, thumbnails), **8px** (`md`, the default — medium buttons, inputs, tooltips, job artwork), **12px** (`lg` — popovers, large buttons, `lg` icon buttons), and **16px** (`xl` — content containers: tracklist, detail list, recents list, masthead cover art, the now-playing bar). **Full** rounding is reserved for genuinely circular or pill-shaped things: progress bars and their fills, the switch and its thumb, play buttons, status medallions, the count badge, and the scrollbar thumb.

`--radius-xs` deliberately overrides Tailwind v4's built-in 2px value. 2px is too tight to read as a corner at this density, and a step that exists but disagrees with the token layer is worse than no step at all.

Radius rises with the size of the thing. A 32px button takes 6px; a 224px cover takes 16px. Nothing in the system is square-cornered, and nothing is more rounded than 16px except the deliberately circular set.

Borders are always 1px and always `--line` unless a state changes them; the global `*` selector sets border-color so a bare `border` class is already correct. Dashed borders appear once, on the empty-tracklist state.

The focus ring is a 2px accent outline at 2px offset, taking `--radius-xs` from the scale, applied globally to `:focus-visible`.

### Named Rules

**The Rounded Rule.** The previous 0px-radius identity is retired and must not be reintroduced. Every surface takes a step from the scale. `rounded-none` is not a surface radius in this system; the one legitimate use is squaring an inner edge that a rounded parent already clips (the header bar inside a route skeleton's `overflow-hidden` container).

**The Named-Step Rule.** Radius is applied by token name — `rounded-xs`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`. There are no arbitrary radius values anywhere in `frontend/src`, and `grep -r 'rounded-\['` returning nothing is the audit test. A `rounded-[6px]` that happens to equal `--radius-sm` is drift waiting to happen: it survives a change to the token and silently stops matching everything around it.

## Components

### Buttons

- **Shape:** softly rounded, scaling with size — 6px at `sm`/`icon-sm` (32px tall), 8px at `md`/`icon` (36px), 12px at `lg`/`icon-lg` (44px).
- **Primary:** Spotify green ground with near-black text at 600 weight. The single most important action on a page (download, open, try again). One per view.
- **Secondary (default):** surface ground, `line` border, ink text. Everything else — the options trigger, retry, start over.
- **Ghost:** no ground, muted ink; hovers to a `raised` ground and full ink. Icon-only chrome: theme toggle, clear, dismiss, panel close.
- **Danger:** danger-wash ground with danger-text and a 25% danger border; hover only strengthens the border.
- **Link:** accent-text, no height or padding, underline on hover at 4px offset.
- **Hover / Focus:** 150ms ease-out on background, border, color and opacity only — never transform or shadow. Focus uses the global accent ring. Disabled drops to 45% opacity and removes pointer events.
- **Icons:** Lucide, 16px, always paired with a word except in genuinely icon-only chrome, where the accessible name carries it.

### Inputs / Fields

- **Style:** surface ground, `line` border, 8px radius, 36px tall, 13px text, subtle-ink placeholder.
- **Hover:** border steps to `line-strong`.
- **Focus:** border becomes accent *and* the ground drops to canvas — the field lights up rather than glowing. No ring, no shadow.
- **Invalid:** `aria-invalid` drives a 60%-alpha danger border. Errors are always named in a sentence beside the field, never color alone.

### URL Field (signature component)

The one way into the app, in two variants sharing all behavior. **Hero** is 52px tall at 16px radius with 15px text, a live type icon on the left (link / track / album / playlist), a validity glyph, a paste-from-clipboard button, a primary "open" action, and a persistent 12px hint line beneath that cycles between a supported-formats note, a green "link found, press ↵" confirmation, and a named error. **Bar** is the 36px, 8px-radius copy that lives in the top bar at every width, reachable with ⌘K, showing its error in a floating `shadow-float` strip positioned out of flow so the bar keeps its height. Both variants render the same error `id`, so `aria-describedby` never dangles.

### Cards / Containers

- **Corner Style:** 16px.
- **Background:** canvas — containers are cut into the page, not lifted off it. Their table headers sit on surface.
- **Border:** 1px `line`; internal dividers drop to `line/60`–`line/70` so rows read lighter than the container edge.
- **Shadow:** none. See The Bordered-At-Rest Rule.
- **Internal Padding:** table cells `10px` vertical, `12–16px` horizontal; list rows `12px 16px`.

### Track List

A real `<table>` with a screen-reader caption, sticky-free bordered header on surface, and 11px subtle-ink column labels. Columns appear as width allows: `#` and title always, album at `md`, added at `lg`, duration always right-aligned in mono. The `#` cell swaps the track number for a play button on row hover or focus-within — the two occupy the same 48px cell so nothing shifts. The currently-playing row takes an accent wash and an accent-text title; every other row hovers to surface.

### Downloads Dock (signature component)

The system's most consequential piece of composition. A 380px right-edge panel with a 56px header, a job list, and a real empty state (a bordered circular medallion, a line of ink, and a line of muted copy explaining that jobs survive a reload). Each **job row** pairs 44px artwork with a linked title, a type caption, a status icon (spinner / tick / alert / help), a truncating message line, a mono percentage, and a 4px progress bar — plus a full-width recovery button when a job errors or goes unknown. The dismiss button appears on row hover and on focus-visible. Docked at `lg` with `--shadow-float`; a modal sheet with a 50% black scrim below it.

### Segmented Control

A single-select radiogroup — not a row of buttons — on a surface ground with a 0.5-unit inset gutter and 8px radius. The selected item lifts to a canvas ground with `--shadow-float` at 6px radius; unselected items are muted ink that hover to full ink. Arrow keys roll focus and selection in both directions; the whole group disables to 45% opacity when its choice is irrelevant. Used for format, quality and cover mode.

### Route Skeletons

Loading states are per-route, not app-level, so each one is laid out at its own page's measure. `CollectionSkeleton` takes a `measure` and a `rows` count and is used by the playlist route (`max-w-[1400px]`, 8 rows) and the album route (`max-w-4xl`, 6 rows); the track route has its own skeleton at `max-w-4xl` shaped for the art-plus-details layout rather than a table. Home is prerendered static and has none. Every skeleton reproduces the real page's cover size, masthead rhythm and container radius, and carries a `sr-only` "loading" line. Skeletons are `raised` blocks with a `line/70` gradient sweeping across them under `animate-sweep`, and are `aria-hidden` so the sweep is never announced.

### Progress

A 6px (or 4px in the job row) fully-rounded track on `raised` with an accent fill. The determinate fill animates by `translateX` only, so a long download stays on the compositor; the indeterminate variant is a one-third-width accent bar sweeping under `animate-sweep`. `aria-valuenow` is omitted while indeterminate rather than faked.

### Cover Art

Square, `raised` ground, 1px border, `overflow-hidden`, with the radius passed in per context (6px thumbnails, 8px job rows, 16px mastheads). Spotify art 404s and playlists can lack an image entirely, so the placeholder — a centered `Disc3` glyph at one-third the box, in subtle ink — is a first-class state, not a broken-image icon.

### Badges

6px radius, 11px medium text, 2px/6px padding, 12px icons. Four variants: neutral (surface + line), accent (wash + 30% accent border + accent-text), danger (wash + 30% danger border + danger-text), outline (transparent + `line-strong` + subtle ink). The outline variant carries the explicit marker.

### Navigation

There is no nav — the brand mark is the only link in the bar, beside the URL field, the downloads toggle and the theme toggle. The wordmark is drawn geometry (a disc cut by a download arrow) at 22px in accent, set beside 15px semibold ink at `-0.02em`. The theme toggle cycles system → light → dark and renders an inert 32px frame before mount so the bar does not reflow.

### Motion

One authored entrance, reused: **rise** (opacity 0→1, `translateY(6px)`→0, 420ms, `cubic-bezier(0.22, 1, 0.36, 1)`), on popovers, tooltips, the now-playing bar, the recents section and the URL field's confirmation line. Content is visible by default and the animation only offsets it, so a failed animation never hides anything. Two utility animations support state: **sweep** (1.4s, infinite) for skeletons and indeterminate progress, and **spin-slow** (900ms linear) for the ring spinner. State transitions are 100–200ms ease-out on color, border and transform only. Everything — animation, transition and scroll behavior — collapses to 0.01ms under `prefers-reduced-motion: reduce`.

### Named Rules

**The One Entrance Rule.** `animate-rise` is the only entrance in the system. A new surface that wants to appear uses it; it does not get its own keyframes, its own duration, or its own easing.

**The Compositor Rule.** Anything that animates while a download runs animates `transform` or `opacity` only. Progress fills translate; they do not animate `width`.

## Do's and Don'ts

### Do:

- **Do** design in dark first and then compose the light value by hand. Every token exists in both themes and both are shipped; an auto-inverted light theme is not acceptable.
- **Do** use `--accent-text` for any green word, number or icon, and `--accent` only for fills, indicators and the focus ring.
- **Do** separate surfaces with a 1px `--line` border and a step in the tonal stack. Reserve `--shadow-float` for elements that overlay page content.
- **Do** give cover art `--shadow-art` on mastheads. It is the one content element that earns depth.
- **Do** write every word the interface itself says in lowercase, in the source. Leave Spotify's own strings alone.
- **Do** put `.tabular` on every duration, percentage, count, track position and ISRC, and set durations, positions and identifiers in Geist Mono.
- **Do** take radii from the 4/6/8/12/16 scale by token name (`rounded-xs` … `rounded-xl`), rising with the size of the element, and use full rounding only for circles and pills.
- **Do** give a new route its own skeleton at that route's measure, reproducing the real page's cover size and container radius.
- **Do** pick type sizes from the ramp already in use (`11/12/13/15px`, then the display steps). If you find yourself needing a new size, that is a signal to promote the ramp into tokens, not to add a sixteenth arbitrary value.
- **Do** pair every color-carried state with an icon and a sentence — errors, completions and in-progress states all do this today.
- **Do** keep transitions to color, border and transform at 100–200ms ease-out, and let `prefers-reduced-motion` collapse them.

### Don't:

- **Don't** reintroduce a 0px radius as a surface treatment. The sharp identity is retired; `rounded-none` is only for squaring an inner edge a rounded parent already clips.
- **Don't** write an arbitrary radius (`rounded-[6px]`) or an off-token shadow (`shadow-sm`, `drop-shadow-*`). Both were removed from this codebase deliberately; reintroducing one restarts the drift.
- **Don't** add an app-level `loading.tsx`. A single skeleton cannot match every route's measure, and the width jump on resolve is exactly what the per-route skeletons exist to prevent.
- **Don't** use `--accent` for text, especially on a light ground — it is ~2.3:1 on white and fails AA outright.
- **Don't** add a shadow to a button, input, card, table or table row. Bordered at rest, in both themes.
- **Don't** introduce a fourth text step below `--ink-subtle`, or tint a neutral surface. The palette's only chromatic roles are green and red.
- **Don't** set interface copy in sentence case or Title Case, and don't produce lowercase with `text-transform` — the accessibility tree must match the render.
- **Don't** add a kicker, eyebrow or category label above a heading. Resource type belongs in the metadata line beneath the title.
- **Don't** author a second entrance animation. Reuse `animate-rise`.
- **Don't** animate `width`, `height` or `box-shadow` on anything that runs during a download.
- **Don't** show a raw runtime or HTTP error message. Map it to lowercase product copy and log the original.
- **Don't** hide the URL field at any width. It is the only route into the app.
