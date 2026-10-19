# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Electron desktop app (Windows first): React + TypeScript + Vite renderer, plain CommonJS main process. Chosen by the user from three options. Platform is `web` for design purposes: the renderer is a web UI in a native window, not a native design language.

## Users

One person: the owner (Felipe), cooking at home, using the app on his own Windows PC. Personal use for now; sharing or other devices are not in scope yet.

## Product Purpose

Recivo is a personal cookbook: save, find and read recipes. Success is that every recipe he cares about lives in one place on his own machine, is quick to find while standing in the kitchen, and is never lost.

## Positioning

A private, local-first cookbook where recipes are plain files in a folder the user owns, organised by the one distinction that matters when choosing what to cook: sweet (doce) or savory (salgada).

## Operating Context

- UI language: Brazilian Portuguese.
- All data stays on the PC. No account, no cloud, no network.
- Recipes are stored as JSON files, one per recipe, in `Documentos\Recivo\doce\` and `Documentos\Recivo\salgada\`; photos in `Documentos\Recivo\fotos\`; deleted recipes move to `Documentos\Recivo\lixeira\` instead of being erased.
- Used on a desktop/laptop screen, often while cooking: reading at a distance and quick glances matter.

## Capabilities and Constraints

- Two categories only: doce (sweet) and salgada (savory). Every recipe belongs to exactly one.
- Recipe fields: title, category, ingredients (list), method steps (ordered list), photo, preparation time, servings, favorite flag, free-form notes/tips.
- Create, read, edit, delete, favorite, search (title and ingredients), filter by category and by favorites.
- Local storage only. Editing files by hand in the folder must keep working (the folder is the source of truth for category).
- Undecided: sync/backup, mobile, sharing, import from other apps, shopping list, unit conversion.

## Brand Commitments

- Name: Recivo. The attached logo is the official one: app icon (a squircle tile in a crimson-to-orange gradient with a cream "R" whose leg is a spoon) and a wordmark in a bold geometric sans with a red-to-amber gradient. Assets live in `assets/`.
- The brand palette is the logo's: crimson, vermilion red, orange, amber, cream.

## Evidence on Hand

- Official logo files (icon and wordmark). No recipes, photos, or user research exist yet; the app must not ship fabricated recipes as if they were the user's.

## Product Principles

1. Recipes are the user's files, not the app's data: plain, portable, recoverable.
2. Finding beats browsing: from launch to reading a recipe in as few steps as possible.
3. Forgiveness over confirmation: deletions are recoverable, unsaved edits are protected.
4. The sweet/savory split is the spine of the interface, not a tag buried in a form.
5. Built for kitchen reading: large, calm, high-contrast recipe text.

## Accessibility & Inclusion

Keyboard operable, visible focus, AA contrast, respects reduced motion and the system light/dark setting.
