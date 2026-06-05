# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file Froala WYSIWYG plugin (`src/froala.vim.js`) that adds modal Vim-style editing. **No build step, no dependencies, no package manager** — the plugin is plain ES5-flavored JS that is loaded via a `<script>` tag after `froala_editor.pkgd.min.js`.

## Running / testing

There is no test framework. Verification is manual through `test/harness.html`, which loads Froala from a CDN and the plugin from `../src/froala.vim.js`.

```bash
# Serve from repo root so the harness's relative paths resolve:
python3 -m http.server 8765
# then open http://localhost:8765/test/harness.html
```

The harness uses the latest CDN build of Froala — opening it requires network access. The active editor is always `FroalaEditor.INSTANCES[0]` for console probing (`.vim.getMode()`, `.vim.setLeader(...)`, etc.).

The `.playwright-mcp/` directory holds screenshots captured during prior Playwright-MCP driven testing sessions; the project has no checked-in automated test suite.

Quick syntax check of the plugin:

```bash
node -c src/froala.vim.js
```

## Architecture

### Single-file plugin, registered into Froala

`src/froala.vim.js` is one IIFE that runs `FroalaEditor.PLUGINS.vim = function (editor) { ... return { _init, ...publicApi } }` and also registers a `vim` toolbar **command** (`FroalaEditor.RegisterCommand('vim', ...)`). Froala calls `_init` on editor init. Everything — config merge, key dispatch, mode UI, line gutter, ex command line, help overlay — lives in that closure.

User-facing options live under `editor.opts.vim` and are merged onto `DEFAULTS` in `_init`. The same closure exposes runtime methods (`enable`, `disable`, `toggle`, `setLeader`, `setCursorColor`, line-number toggles, etc.) on `editor.vim` for programmatic use.

### Core technical insight (do not undo this)

There is no text buffer. The plugin is a thin keystroke translator on top of:

1. `editor.events.on('keydown', fn, true)` — third arg `true` runs the handler *before* Froala's default. **Returning `false` cancels Froala's default**, which is how keys are swallowed in Normal/Visual mode.
2. `Selection.modify(alter, direction, granularity)` — does all caret motion. `alter` is `'move'` in Normal, `'extend'` in Visual. Soft-wrap behavior comes for free from the browser.

If you find yourself wanting to track lines/columns or walk DOM nodes for motion, stop — that is the wrong layer.

### Key dispatch state machine

`onKeyDown` → `dispatch(e)`. Dispatch is one big switch driven by several pending-flag variables held in the closure:

- `mode`: `'normal' | 'insert' | 'visual'`
- `countBuf`: accumulates leading digits (vim counts like `5l`, `3dd`)
- `gPending`: the first `g` of `gg`
- `rPending`: `r` is waiting for the next char to replace with
- `opPending` / `opPendingCount`: the first `d|y|c` of a doubled operator (`dd|yy|cc`), with its count stashed
- `leaderPending`: leader key was pressed; next key resolves through `LEADER_MAP`. A 1.5s timer (`scheduleLeaderTimeout`) clears it.

`clearPending()` resets all of these — call it whenever a sequence aborts.

Insert mode falls through to Froala (`return true`) for normal typing; only `Escape` is intercepted to return to Normal.

### Two navigation layouts share one table

`MOTION_MAPS` is keyed by `cfg.navLayout` (`'hjkl'` or `'ijkl'`). Each entry maps a key to `[direction, granularity]` for `Selection.modify`. The `ijkl` layout reassigns *insert-before-caret* to `s` (because `i` is taken by up-motion). Layout branching lives in this table and in `insertBeforeKey()` — keep it that way; do not sprinkle layout checks through the dispatcher.

### "Lines" mean top-level blocks

For `dd`/`yy`/`cc`/`<n>G`/`:N`/the line gutter, a "line" is a top-level block child of the editable root (`<p>`, `<h1>`, list, etc.) — not a soft-wrapped visual line. `blockChildren()`, `currentBlockIndex()`, `gotoBlock()`, `rangeOverBlocks()`, etc. all operate at this granularity. Motions (`hjkl`, `w`, `b`, `0`, `$`, `j`, `k`) operate on the *browser's* lines via `Selection.modify` — these two concepts coexist intentionally.

### Undo discipline

Every mutation (`operatorDelete`, `operatorYank` from cut path, `operatorPaste`, `deleteLines`, `replaceChar`, `openLine`, etc.) calls `editor.undo.saveStep()` both before and after the DOM change. That keeps `u` reversing exactly one operator at a time. When adding any new mutating command, follow the same pre/post pattern — Froala's undo manager records snapshots, not deltas.

### Block cursor + line gutter

In Normal/Visual the native caret is hidden (`caret-color: transparent`) and a positioned `<div>` overlay (`blockCursorEl`) is sized from `range.getBoundingClientRect()` and repositioned on selection/scroll/input. In Insert the overlay is hidden and the native caret returns, recolored to `cfg.cursorColor`. `toRgba()` is the small CSS-color parser used to derive the translucent visual-selection background from the same color.

The line gutter is implemented as a single injected `<style>` element using CSS counters scoped by a `data-fr-vim-lineno` attribute on the editable root — no per-block DOM nodes. Toggle via `enableLineNumbers()` / `disableLineNumbers()`.

## Scope guardrails

`README.md` §Non-goals and `plan.md` §9 list features that are **intentionally not implemented**: registers beyond a single unnamed one, marks, macros, `.` repeat, `/`?` search, full `:` commands beyond `:N`/`:$`, text objects (`ciw`, `di(`), and **operator+motion composition** (`dw`, `d3l`, `c$`). Counts work on motions and on the doubled operator forms (`3j`, `5l`, `3dd`), but `d`/`c`/`y` as standalone operators awaiting a motion are not wired up. Do not implement any of these without an explicit request — they are listed as out of scope on purpose to keep the surface small.

## Spec documents

- `README.md` — user-facing docs (install, runtime API, full key map for both layouts, config table, non-goals).
- `plan.md` — the original executable spec the plugin was built against. Phases 0–3 with DoDs; the API reference table in §6 lists the exact Froala entry points the plugin is allowed to rely on. Treat it as historical; do not edit it to reflect new work unless asked.
