# Design

Recorded from the built app (`src/styles.css`). Mode: Operate: scanability and kitchen reading outrank expression; the brand lives in the logo's colors and in one signature control.

## Idea

The wordmark's gradient runs red to amber. Recivo turns that spectrum into the app's spine: **salgada = crimson/red, doce = amber**, with "Todas" as the neutral middle. Category color is never a tag buried in a form; it is the thumb of the main control, the cover tile of recipes without photos, the chip, the bullets and step numbers in the reader.

## Palette (sampled from the official logo)

| Role | Value |
| --- | --- |
| Crimson | `#b4022e` (deep) · `#c8102e` (fill) · `#d9262e` (primary gradient end) |
| Red / vermilion | `#e51a35` · `#fb4a36` |
| Amber / peach | `#f5b420` · `#fbd184` |
| Light | bg `#fdf9f6`, surface `#fff`, ink `#2a1a18`, ink-2 `#6a5651`, line `#ecdfd8` |
| Dark | bg `#1a1210`, surface `#261b18`, ink `#f8eee7`, ink-2 `#c9b4ab`, line `#3b2c27` |

Strategy: restrained neutrals (warm, tinted toward the brand) plus committed category color. Contrast checked: body ≥ 6.5:1, white on crimson fill 7:1, brown on amber 7:1, chips ≥ 6.6:1 (dark chips ≥ 8:1). Both schemes follow the system.

Category accents are CSS variables set by `[data-cat]` (`--accent-fill`, `--on-accent-fill`, `--accent-soft`, `--accent-ink`); components read them and never hard-code a category.

## Typography

Figtree Variable (bundled, offline). Titles 700-780 with negative tracking (`-0.012em` cards to `-0.028em` reader title), body 15px/1.5, reader text 1.0625-1.125rem/1.6 for distance reading. `text-wrap: balance` on titles, `pretty` on steps.

## Shape, depth, materials

Radii 10/14/22px; the sheet has a 28px leading corner. Warm-tinted soft shadows (`--shadow`, `--shadow-lg`). The top bar is a translucent layer (`backdrop-filter`) with a hairline that fades in only once content scrolls under it; the sheet bar does the same via a named scroll timeline. No hard dividers at rest.

## Components

- **Spectrum** (signature): 3-way radiogroup, Salgadas · Todas · Doces, track = brand gradient wash, thumb slides on a damped spring and changes color (red / neutral / amber). Counts reflect the active search and favorites filter.
- **Recipe card**: 4:3 cover (photo, or a category-colored tile with a cropped initial), chip, title (2-line clamp), meta. Whole card is one button; the heart sits above it.
- **Sheet**: right-hand modal `<dialog>` for reading and editing, same path in and out (exit faster than enter). Reader is two columns (ingredients | numbered steps) at ≥ 700px.
- **Editor**: visible labels, one-item-per-line textareas (pasted bullets/numbers stripped), inline validation, discard-changes prompt.
- Buttons: primary crimson gradient, doce amber, danger solid crimson; press feedback on `:active` (scale .96, 60ms).

## Motion

Critically damped ease-out (`cubic-bezier(.22,1,.36,1)`) by default; a ζ≈0.82 spring only for the Spectrum thumb and the category check. Everything uses transform/opacity. `prefers-reduced-motion` replaces slides and lifts with short fades; `prefers-reduced-transparency` makes the top bar opaque; `prefers-contrast: more` outlines cards.

## Do / Don't

- Do keep category color semantic (salgada red, doce amber) and read it from `[data-cat]`.
- Do keep recipe text large and high contrast.
- Don't add a serif/cream "cookbook" costume; the brand is saturated and modern.
- Don't put a translucent surface on another translucent surface.
