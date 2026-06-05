# froala-vim

A single-file Froala custom plugin that adds **basic modal (Vim-style) editing**
to a Froala WYSIWYG editor instance. No dependencies, no build step.

The plugin covers modes, the common motions (with count prefixes), the
visual-mode operators, the operator-doubled commands (`dd`, `yy`, `cc`),
line-jumping (`3G`, `:N`), an optional line-number gutter, and a configurable
leader. Full Vim grammar (operator+motion composition, registers, marks,
macros, `/` search, text objects) is **out of scope** — see
[Non-goals](#non-goals).

## Install

Drop [`src/froala.vim.js`](src/froala.vim.js) into your page **after**
`froala_editor.pkgd.min.js`. The plugin self-registers on `FroalaEditor.PLUGINS.vim`
and also registers a toolbar command named `vim`.

```html
<link href="froala_editor.pkgd.min.css" rel="stylesheet">
<script src="froala_editor.pkgd.min.js"></script>
<script src="froala.vim.js"></script>
<script>
  new FroalaEditor('#editor', {
    // Drop the 'vim' button anywhere in your toolbar config.
    toolbarButtons: {
      moreMisc: { buttons: ['vim', 'undo', 'redo', 'fullscreen'], align: 'right' }
    },
    vim: {
      enabled: true,         // false to start with vim off (toolbar button still toggles)
      navLayout: 'hjkl',     // 'hjkl' | 'ijkl'
      leader: ',',
      startMode: 'normal',   // 'normal' | 'insert'
      showModeBadge: true,
      cursorColor: '#50a0ff', // block cursor (normal/visual) + insert-mode caret color
      showLineNumbers: false  // render a left gutter with one number per block (`,n` to toggle)
    },
  });
</script>
```

A small badge in the bottom-left corner of the editor shows the current mode
(`NORMAL` / `INSERT` / `VISUAL`). The badge is anchored inside Froala's
editor box so it travels with the editor in the page.

### Toolbar button (Enable Vim)

The plugin registers a `vim` Froala command on load. To put an **Enable Vim**
toggle in the toolbar, list `'vim'` in any `toolbarButtons` group:

```js
new FroalaEditor('#editor', {
  toolbarButtons: ['bold', 'italic', '|', 'vim'],
});
```

The button's active state mirrors `editor.vim.isEnabled()`. Clicking it calls
`editor.vim.toggle()`.

### Runtime API

```js
const ed = new FroalaEditor('#editor', { /* … */ });

ed.vim.enable();          // turn vim keybindings on
ed.vim.disable();         // turn vim keybindings off (editor stays a normal Froala)
ed.vim.toggle();          // flip enabled state
ed.vim.isEnabled();       // → boolean

ed.vim.getMode();         // → 'normal' | 'insert' | 'visual'
ed.vim.getLayout();       // → 'hjkl' | 'ijkl'

ed.vim.setLeader('\\');         // change the leader key at runtime
ed.vim.getLeader();

ed.vim.setCursorColor('#f87171'); // accepts #rgb, #rrggbb, rgb(), rgba()
ed.vim.getCursorColor();

ed.vim.showLineNumbers();   // turn the gutter on
ed.vim.hideLineNumbers();   // turn the gutter off
ed.vim.toggleLineNumbers(); // also bound to leader `n` (default `,n`)
```

When disabled at runtime, the plugin returns the editor to vanilla Froala
behavior — no keystroke interception, no mode badge, no block cursor.

## Key map

### Motions

| Keys (hjkl) | Keys (ijkl) | Action |
|---|---|---|
| `h` `l` | `j` `l` | left / right one character |
| `j` `k` | `k` `i` | down / up one line |
| `w` `b` `e` | `w` `b` `e` | next word / previous word / end-of-word (`e` ≈ `w`) |
| `0` `^` `$` | `0` `^` `$` | line start / line start (no whitespace concept) / line end |
| `gg` `G` | `gg` `G` | document start / end |

Motions accept a **count prefix**: `5l` moves right 5 chars, `3j` moves down 3
lines, `10w` jumps 10 words forward, `3x` deletes 3 characters, and so on.
A leading `0` is the line-start motion when typed by itself; once a count is in
progress (e.g. you've already pressed `1`), `0` joins the count.

Motions are powered by the browser's
[`Selection.modify(alter, direction, granularity)`](https://developer.mozilla.org/en-US/docs/Web/API/Selection/modify)
API. They follow soft-wrapped lines correctly.

### Mode entry

| Key (hjkl) | Key (ijkl) | Action |
|---|---|---|
| `i` | `s` | insert before the caret |
| `a` | `a` | insert after the caret |
| `I` | `I` | insert at line start |
| `A` | `A` | insert at line end |
| `o` | `o` | open a new line below, enter insert |
| `O` | `O` | open a new line above, enter insert |
| `v` | `v` | toggle visual mode |
| `Esc` | `Esc` | return to normal mode |

> **ijkl note:** because `i` is bound to *move up*, the "insert before caret"
> keystroke moves to `s`. All other insert-entry keys stay the same.

### Operators

| Key | Mode | Action |
|---|---|---|
| `d` | visual | delete the selection |
| `c` | visual | delete the selection, enter insert |
| `y` | visual | yank the selection into the unnamed register (and to the system clipboard, where permitted) |
| `dd` | normal | delete the current line (block). Supports counts: `3dd` deletes 3 lines |
| `yy` | normal | yank the current line. Supports counts: `2yy` |
| `cc` | normal | delete the current line and enter insert |
| `p` | normal/visual | paste the register at the caret |
| `x` | normal/visual | delete the character under the caret |
| `s` | normal (hjkl only) | substitute char: delete char under caret, enter insert |
| `r<char>` | normal | replace the character under the caret with `<char>` |
| `D` | normal | delete from caret to end of line |
| `C` | normal | change from caret to end of line |

Each mutation pushes both a pre- and post-state onto Froala's undo stack, so
`u` reverses exactly one operator at a time.

### Jumping to a line (block)

A "line" in this plugin is a top-level block (a `<p>`, `<h1>`, list, etc.) — the
same unit the [line-number gutter](#line-numbers) counts.

| Key | Action |
|---|---|
| `<n>G` | go to line *n* (e.g. `3G` jumps to the 3rd block) |
| `G` (no count) | go to the last line |
| `gg` | go to the first line |
| `:` | open an ex-style mini command line. `:3<Enter>` jumps to line 3, `:$<Enter>` jumps to the last line. `Esc` cancels. |

### Line numbers

Set `vim.showLineNumbers: true` to render a left gutter with one number per
top-level block. Toggle at runtime with `editor.vim.toggleLineNumbers()` or
with the default leader binding `,n`. Soft-wrapped lines inside a paragraph
share a number — there's no fixed-line concept in `contenteditable`.

### Undo / redo

| Key | Action |
|---|---|
| `u` | undo (`editor.undo.run`) |
| `Ctrl-r` | redo (`editor.redo.run`) |

### Leader

Default leader is `,`. Press the leader key, then one of:

| Sequence | Action |
|---|---|
| `,b` | toggle bold |
| `,i` | toggle italic |
| `,u` | toggle underline |
| `,s` | save (`editor.save.save`, if `save` plugin is loaded) |
| `,n` | toggle the line-number gutter |
| `,h` | toggle a help overlay listing the full key map |

An unmapped key after the leader is silently dropped. If 1.5s pass with no
follow-up key the leader is cleared.

## Configuration

All options live under `vim` in your Froala init. Full table:

| Option | Default | Description |
|---|---|---|
| `enabled` | `true` | Start with vim keybindings active. Toggle later via the toolbar button or `editor.vim.toggle()`. |
| `navLayout` | `'hjkl'` | `'hjkl'` (standard) or `'ijkl'` (inverted-T; `s` is insert-before in this layout). |
| `leader` | `','` | Single character that opens a leader sequence. |
| `startMode` | `'insert'` | `'insert'` or `'normal'`. Insert is less jarring inside a WYSIWYG. |
| `showModeBadge` | `true` | Render the bottom-left mode indicator inside the editor box. |
| `cursorColor` | `'#50a0ff'` | Color of the block cursor (normal/visual) and the native caret (insert). Accepts `#rgb`, `#rrggbb`, `rgb()`, `rgba()`. |
| `showLineNumbers` | `false` | Render the left gutter with one number per top-level block. |

## Browser support

`Selection.modify` is non-standard but is implemented in **Chromium, WebKit,
and Firefox**, which covers every browser Froala officially supports. The
plugin degrades gracefully — if `modify` throws, that motion is a no-op
and the rest of the keymap still works.

## Manual testing

Open [`test/harness.html`](test/harness.html) in a browser. The page is a
realistic minimal Froala integration with the `vim` plugin loaded — no extra
controls or cheatsheet, exactly what you would ship in an app.

For console probing, the active editor is `FroalaEditor.INSTANCES[0]`:

```js
FroalaEditor.INSTANCES[0].vim.getMode();       // 'normal' | 'insert' | 'visual'
FroalaEditor.INSTANCES[0].vim.setLeader('\\'); // change the leader at runtime
```

Work through the DoDs in [`plan.md`](plan.md) if you want a checklist.

## Non-goals

The following are intentionally **not** implemented. Don't add them without
a separate spec:

- Additional registers (named, numbered, `"0`, `"+`)
- Marks (`m`, ``` ` ```, `'`)
- Macros (`q`, `@`)
- `.` repeat
- `/` and `?` search, `n` / `N`
- Full `:` command line (only `:N` / `:$` go-to-line are implemented)
- Text objects (`ciw`, `da"`, `di(`, etc.)
- Operator+motion grammar (`dw`, `d3l`, `c$`) — counts on motions work (`3j`, `5l`), and the doubled forms `dd`/`yy`/`cc` work with counts, but operator+motion composition does not
- Window/split concepts, jump lists

## File layout

```
froala-vim/
  src/
    froala.vim.js     # the plugin (deliverable)
  test/
    harness.html      # manual test page
  plan.md             # full executable spec
  README.md           # this file
  LICENSE             # MIT
```

## License

[MIT](LICENSE).
