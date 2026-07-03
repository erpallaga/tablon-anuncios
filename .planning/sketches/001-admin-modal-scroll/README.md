---
sketch: 001
name: admin-modal-scroll
question: "How should the AdminPanel 'New Element' modal handle content that overflows the viewport?"
winner: "C"
tags: [admin, modal, forms, overflow]
---

# Sketch 001: Admin Modal Scroll Fix

## Design Question
`GridItemForm` (rendered by `AdminPanel` for both "New Element" and "Edit") has no
`max-height`/`overflow` on its modal container, so on short viewports the emoji grid,
PDF dropzone, and footer buttons get cut off with no way to reach them. What's the best
fix?

## How to View
```
open .planning/sketches/001-admin-modal-scroll/index.html
```
Use the "Simulated window height" buttons in the top-right of the tab bar to see how
each variant behaves on a short (480px), typical laptop (620px), and tall (900px) viewport.

## Variants
- **A: Scroll + Sticky Header/Footer** — Modal becomes a flex column capped at 90% viewport
  height. Header and footer are pinned; only the middle content scrolls. Zero changes to
  the form itself — purely a container fix. Lowest effort, safest.
- **B: Popup Emoji Picker** — The 38-emoji grid (the single biggest space hog, ~200px) collapses
  into one row: current emoji + "Cambiar icono" button that opens a small popover grid.
  Reclaims most of the vertical space up front; still has the scroll safety net from A underneath.
- **C: Two-Column Layout** — Modal widens (420px → 640px) and splits into two columns:
  title/icon on the left, PDF source on the right. Uses horizontal space instead of stacking
  everything, so the form is short enough to rarely need scrolling at all.

## What to Look For
- At 480px (small laptop / half-split window), does the footer ("Crear"/"Cancelar") stay
  reachable without scrolling past it or losing it entirely?
- Does the emoji grid still feel easy to scan/pick from in B's popover vs. A/C's always-visible grid?
- Does C's wider modal feel appropriate for a simple 3-field form, or over-engineered?
- Any combination worth cherry-picking (e.g., B's popover + C's two-column for the remaining fields)?
