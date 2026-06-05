/*
 * froala.vim.js — basic modal (Vim-style) editing for Froala.
 *
 * Modes: normal | insert | visual
 * Motions: h j k l w b 0 $ gg G (configurable nav layout: hjkl or ijkl)
 * Mode entry: i (or s in ijkl) a I A o O, v, Esc
 * Operators on visual selection: d c y p x
 * Leader: configurable single key, opens a small command map
 * Undo/redo: u / Ctrl-r via Froala's undo manager
 *
 * Relies on Selection.modify(alter, direction, granularity) for caret motion.
 * Non-standard but supported in Chromium, WebKit, and Firefox.
 */
(function (FroalaEditor) {
  if (!FroalaEditor || !FroalaEditor.PLUGINS) {
    console.warn('[vim] FroalaEditor not found; plugin not registered.');
    return;
  }

  FroalaEditor.DEFAULTS = Object.assign(FroalaEditor.DEFAULTS || {}, {
    vim: {}
  });

  var DEFAULTS = {
    navLayout: 'hjkl',
    leader: ',',
    startMode: 'insert',
    showModeBadge: true,
    cursorColor: '#50a0ff',  // block-cursor + insert-mode caret color
    showLineNumbers: false   // render a left gutter, one number per top-level block
  };

  // Motion granularity tables keyed by layout. Each value is [direction, granularity].
  var MOTION_MAPS = {
    hjkl: {
      h: ['backward', 'character'],
      l: ['forward',  'character'],
      j: ['forward',  'line'],
      k: ['backward', 'line']
    },
    ijkl: {
      j: ['backward', 'character'],
      l: ['forward',  'character'],
      k: ['forward',  'line'],
      i: ['backward', 'line']
    }
  };

  // Insert-entry key for "insert before caret".
  // In ijkl we lose `i` to up-motion, so use `s` instead.
  function insertBeforeKey(layout) {
    return layout === 'ijkl' ? 's' : 'i';
  }

  FroalaEditor.PLUGINS.vim = function (editor) {
    var mode = 'insert';
    var cfg;
    var leaderPending = false;
    var gPending = false;        // first `g` of `gg`
    var rPending  = false;       // `r` waits for next char to replace with
    var opPending = null;        // 'd' | 'y' | 'c' — waits for doubled key (dd/yy/cc)
    var opPendingCount = 1;      // count stashed on the first operator key, used by the doubled action
    var pendingOperator = null;  // future-proofing; currently unused for grammar
    var countBuf = '';           // accumulates digits before a motion (vim counts)
    var register = '';           // single unnamed yank/delete register
    var badgeEl = null;
    var blockCursorEl = null;
    var enabled = true;       // user-facing on/off — controls keystroke interception
    var keydownBound = false;

    function _init() {
      cfg = Object.assign({}, DEFAULTS, editor.opts.vim || {});
      if (!MOTION_MAPS[cfg.navLayout]) cfg.navLayout = 'hjkl';
      mode = cfg.startMode === 'normal' ? 'normal' : 'insert';
      enabled = cfg.enabled !== false;

      bindEvents();
      if (enabled) {
        if (cfg.showModeBadge) mountBadge();
        applyCursorStyle();
        updateBadge();
      }
      if (cfg.showLineNumbers) enableLineNumbers();

      // Tear down DOM bits when Froala destroys the editor.
      editor.events.on('destroy', teardown);
    }

    // --- line numbers -------------------------------------------------------

    var lineNoStyleEl = null;
    function enableLineNumbers() {
      if (lineNoStyleEl) return;
      var doc = editor.doc || document;
      var root = editor.$el && editor.$el[0];
      if (!root) return;
      // Mark this editable so the selector below only hits this instance.
      root.setAttribute('data-fr-vim-lineno', '1');
      lineNoStyleEl = doc.createElement('style');
      lineNoStyleEl.setAttribute('data-fr-vim-lineno-style', '1');
      lineNoStyleEl.textContent =
        '[data-fr-vim-lineno] { counter-reset: fr-vim-lineno; padding-left: 3.2em !important; position: relative; }' +
        '[data-fr-vim-lineno] > * { counter-increment: fr-vim-lineno; position: relative; }' +
        '[data-fr-vim-lineno] > *::before {' +
          'content: counter(fr-vim-lineno);' +
          'position: absolute; left: -2.6em; width: 2em;' +
          'text-align: right; color: #9aa0a6;' +
          'font: 600 11px/1.6 ui-monospace, Menlo, monospace;' +
          'user-select: none; pointer-events: none;' +
        '}';
      doc.head.appendChild(lineNoStyleEl);
    }

    function disableLineNumbers() {
      var root = editor.$el && editor.$el[0];
      if (root) root.removeAttribute('data-fr-vim-lineno');
      if (lineNoStyleEl) { lineNoStyleEl.remove(); lineNoStyleEl = null; }
    }

    function bindEvents() {
      if (keydownBound) return;
      editor.events.on('keydown', onKeyDown, true);
      editor.events.on('mouseup',  scheduleCursorReposition);
      editor.events.on('keyup',    scheduleCursorReposition);
      // selectionchange fires for ANY caret/selection move (toolbar actions,
      // programmatic edits, mouse drags). Without it the block cursor sticks
      // at its last position when focus shifts to a toolbar dropdown.
      var doc = editor.doc || document;
      doc.addEventListener('selectionchange', onSelectionChange);
      // Hide the overlay when focus leaves the editor so it doesn't visually
      // "lag behind" while the user interacts with a toolbar popup.
      editor.events.on('blur',  onEditorBlur);
      editor.events.on('focus', onEditorFocus);
      keydownBound = true;
    }

    function onSelectionChange() {
      if (!enabled || mode === 'insert') return;
      // selectionchange fires even for selections outside the editor; guard.
      var sel = getSel();
      if (!sel || sel.rangeCount === 0) return;
      var root = editor.$el && editor.$el[0];
      if (!root) return;
      var node = sel.anchorNode;
      if (!node || !root.contains(node)) return;
      scheduleCursorReposition();
    }

    function onEditorBlur()  { hideBlockCursor(); }
    function onEditorFocus() { if (enabled && mode !== 'insert') showBlockCursor(); }

    function teardown() {
      if (badgeEl)       { badgeEl.remove();       badgeEl = null; }
      if (blockCursorEl) { blockCursorEl.remove(); blockCursorEl = null; }
      if (helpEl)        { helpEl.remove();        helpEl  = null; }
      if (exInput)       { exInput.remove();       exInput = null; }
      disableLineNumbers();
      var doc = editor.doc || document;
      doc.removeEventListener('selectionchange', onSelectionChange);
      var root = editor.$el && editor.$el[0];
      if (root) root.style.caretColor = '';
    }

    function enable() {
      if (enabled) return;
      enabled = true;
      if (cfg.showModeBadge) mountBadge();
      mode = 'normal';
      updateBadge();
      applyCursorStyle();
    }

    function disable() {
      if (!enabled) return;
      enabled = false;
      teardown();
      clearPending();
    }

    function setLeader(key) {
      if (typeof key === 'string' && key.length === 1) cfg.leader = key;
    }

    function setCursorColor(color) {
      if (typeof color !== 'string' || !color) return;
      cfg.cursorColor = color;
      if (blockCursorEl) {
        blockCursorEl.style.background = toRgba(color, 0.35);
        blockCursorEl.style.outline    = '1px solid ' + toRgba(color, 0.9);
      }
      applyCursorStyle();
    }

    // --- keystroke dispatch -------------------------------------------------

    function onKeyDown(e) {
      // When disabled at runtime, behave like a no-op plugin.
      if (!enabled) return true;

      // Escape: always returns to Normal, swallowed.
      if (e.key === 'Escape') {
        clearPending();
        if (mode !== 'normal') setMode('normal');
        e.preventDefault();
        return false;
      }

      if (mode === 'insert') {
        // Insert mode flows through to Froala for normal typing.
        return true;
      }

      // Ctrl-r → redo, from Normal/Visual.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        editor.redo.run();
        e.preventDefault();
        return false;
      }

      // Ignore pure modifier keys (Shift, Alt etc) so they don't clear pending state.
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return false;
      }

      // `r<char>`: the next printable key replaces the character under the caret.
      if (rPending) {
        rPending = false;
        if (e.key.length === 1) replaceChar(e.key);
        e.preventDefault();
        return false;
      }

      var handled = dispatch(e);
      if (handled === false) {
        e.preventDefault();
        return false;
      }
      // We're in Normal/Visual; anything we didn't recognize is swallowed.
      e.preventDefault();
      return false;
    }

    function dispatch(e) {
      var key = e.key;
      var layout = MOTION_MAPS[cfg.navLayout];

      // Leader handling first so leader key can't be re-bound as a motion.
      if (leaderPending) {
        resolveLeader(key);
        countBuf = '';
        return false;
      }
      if (key === cfg.leader) {
        leaderPending = true;
        scheduleLeaderTimeout();
        return false;
      }

      // Count prefix: digits 1-9 always start a count. `0` joins a count if
      // one is already being typed, otherwise it's the "line start" motion.
      if (/^[0-9]$/.test(key) && !(key === '0' && countBuf === '')) {
        countBuf += key;
        return false;
      }

      var count = countBuf ? Math.max(1, parseInt(countBuf, 10)) : 1;
      countBuf = '';

      // gg: first `g` pends, second executes. (Counts before `gg` are ignored.)
      if (key === 'g' && !e.shiftKey) {
        if (gPending) {
          gPending = false;
          move('backward', 'documentboundary');
        } else {
          gPending = true;
        }
        return false;
      } else if (gPending) {
        gPending = false;
        // fall through; current key isn't `g`, so pending gg is canceled.
      }

      // Operator-doubled: dd / yy / cc — use the count captured on the first key.
      if (opPending) {
        var op = opPending; opPending = null;
        var n = opPendingCount; opPendingCount = 1;
        if (key === op) {
          if (op === 'd') deleteLines(n);
          else if (op === 'y') yankLines(n);
          else if (op === 'c') changeLines(n);
          return false;
        }
        // different key: cancel and fall through to normal handling.
      }

      // Navigation per layout — repeat N times.
      if (layout[key]) {
        var spec = layout[key];
        repeatMove(count, spec[0], spec[1]);
        return false;
      }

      // Motions with counts
      switch (key) {
        case 'w': repeatMove(count, 'forward',  'word');         return false;
        case 'e': repeatMove(count, 'forward',  'word');         return false; // approximation
        case 'b': repeatMove(count, 'backward', 'word');         return false;
        case '0': move('backward', 'lineboundary');              return false;
        case '^': move('backward', 'lineboundary');              return false;
        case '$': move('forward',  'lineboundary');              return false;
        case 'G':
          // Vim: `<n>G` jumps to line n (1-based); plain `G` = last line.
          if (count > 1) gotoBlock(count);
          else gotoBlock(blockCount());
          return false;
      }

      // Mode switches
      if (key === 'v') { setMode(mode === 'visual' ? 'normal' : 'visual'); return false; }
      if (key === 'u') { editor.undo.run(); scheduleCursorReposition(); return false; }

      // `:` opens the ex-style command line. Currently only `:N` (go to line) is supported.
      if (key === ':') { openExLine(); return false; }

      // Insert-entry: `i` in hjkl, `s` in ijkl. The other letter takes its Vim meaning.
      var ib = insertBeforeKey(cfg.navLayout);
      if (key === ib) { setMode('insert'); return false; }

      // Vim's `s` (substitute char) — only when `s` isn't already the insert-entry key.
      if (key === 's' && cfg.navLayout !== 'ijkl') {
        substituteChar();
        return false;
      }

      switch (key) {
        case 'a':
          collapseToFocus();
          move('forward', 'character');
          setMode('insert');
          return false;
        case 'A':
          collapseToFocus();
          move('forward', 'lineboundary');
          setMode('insert');
          return false;
        case 'I':
          collapseToFocus();
          move('backward', 'lineboundary');
          setMode('insert');
          return false;
        case 'o':
          openLine(/*above*/ false);
          setMode('insert');
          return false;
        case 'O':
          openLine(/*above*/ true);
          setMode('insert');
          return false;

        // Single-key replace: `r<char>`
        case 'r':
          rPending = true;
          return false;

        // Line-end shortcuts: `D` = d$, `C` = c$
        case 'D':
          deleteToLineEnd(/*enterInsert*/ false);
          return false;
        case 'C':
          deleteToLineEnd(/*enterInsert*/ true);
          return false;

        // Operators. In Visual: act on the selection. In Normal: pend the operator
        // and wait for a doubled key (`dd`, `yy`, `cc`) to act on the current line.
        case 'd':
          if (mode === 'visual') operatorDelete(false);
          else { opPending = 'd'; opPendingCount = count; }
          return false;
        case 'c':
          if (mode === 'visual') operatorDelete(true);
          else { opPending = 'c'; opPendingCount = count; }
          return false;
        case 'y':
          if (mode === 'visual') operatorYank();
          else { opPending = 'y'; opPendingCount = count; }
          return false;
        case 'p':
          operatorPaste();
          return false;
        case 'x':
          for (var i = 0; i < count; i++) operatorDeleteChar();
          return false;
      }

      return false;
    }

    function repeatMove(n, direction, granularity) {
      for (var i = 0; i < n; i++) move(direction, granularity);
    }

    // --- motion / selection -------------------------------------------------

    function getSel() {
      // editor.selection.get() returns the native Selection in current Froala.
      // Fall back to the editor window's selection if that ever changes.
      var s = null;
      try { s = editor.selection && editor.selection.get && editor.selection.get(); } catch (e) { /* ignore */ }
      if (s && typeof s.modify === 'function') return s;
      return (editor.win || window).getSelection();
    }

    function move(direction, granularity) {
      var sel = getSel();
      if (!sel) return;
      var alter = mode === 'visual' ? 'extend' : 'move';

      // Selection.modify with `line` granularity is bounded by the containing
      // <td>/<th>: depending on the browser, forward/backward from a single-line
      // cell either no-ops, collapses to the cell edge, or jumps into an
      // adjacent cell — never to the same-column cell in the next row, which is
      // what `j`/`k` should do. Try the native motion first (so wrapped cells
      // still get intra-cell vertical motion), and only accept it when it
      // actually advanced vertically *within the same cell*. Otherwise restore
      // and do a manual same-column row hop.
      if (granularity === 'line' && sel.focusNode) {
        var beforeCell = findContainingCell(sel.focusNode);
        if (beforeCell) {
          var beforeRect = caretRect(sel);
          var savedNode = sel.focusNode;
          var savedOffset = sel.focusOffset;
          try { sel.modify(alter, direction, granularity); } catch (e) {}
          var afterCell = findContainingCell(sel.focusNode);
          var afterRect = caretRect(sel);
          var dy = (beforeRect && afterRect) ? (afterRect.top - beforeRect.top) : 0;
          var advancedVertically = direction === 'forward' ? dy > 1 : dy < -1;
          if (afterCell === beforeCell && advancedVertically) {
            // Multi-line cell — native motion moved us down/up a wrapped line.
            scheduleCursorReposition();
            return;
          }
          // Native motion didn't do the right thing — restore and row-hop.
          try {
            if (alter === 'extend') sel.extend(savedNode, savedOffset);
            else sel.collapse(savedNode, savedOffset);
          } catch (e) {}
          cellHop(direction === 'forward', alter === 'extend');
          scheduleCursorReposition();
          return;
        }
      }

      try {
        sel.modify(alter, direction, granularity);
      } catch (err) {
        // Selection.modify is non-standard; if missing, no-op.
      }
      scheduleCursorReposition();
    }

    function collapseToFocus() {
      var sel = getSel();
      if (!sel) return;
      if (sel.isCollapsed) return;
      // Collapse to the end of the user's gesture (focus, not anchor).
      try { sel.collapseToEnd(); } catch (e) { /* some browsers */ }
    }

    // --- table cell navigation ---------------------------------------------

    function findContainingCell(node) {
      var root = editor.$el && editor.$el[0];
      while (node && node !== root) {
        if (node.nodeType === 1 && (node.tagName === 'TD' || node.tagName === 'TH')) return node;
        node = node.parentNode;
      }
      return null;
    }

    function caretRect(sel) {
      if (!sel || !sel.rangeCount) return null;
      try {
        var r = sel.getRangeAt(0).getBoundingClientRect();
        if (r && (r.top || r.left || r.width || r.height)) return r;
      } catch (e) {}
      // Collapsed ranges occasionally produce a zero rect — fall back to the
      // focus element's rect, which is good enough for a same-Y comparison.
      var n = sel.focusNode;
      if (n && n.nodeType === 3) n = n.parentNode;
      if (n && n.getBoundingClientRect) return n.getBoundingClientRect();
      return null;
    }

    function adjacentRow(tr, forward) {
      var sib = forward ? tr.nextElementSibling : tr.previousElementSibling;
      while (sib) {
        if (sib.tagName === 'TR') return sib;
        sib = forward ? sib.nextElementSibling : sib.previousElementSibling;
      }
      // Walk into adjacent table sections (thead/tbody/tfoot).
      var section = tr.parentNode;
      if (!section) return null;
      var sectionSib = forward ? section.nextElementSibling : section.previousElementSibling;
      while (sectionSib) {
        var tag = sectionSib.tagName;
        if (tag === 'THEAD' || tag === 'TBODY' || tag === 'TFOOT') {
          var rows = sectionSib.getElementsByTagName('tr');
          if (rows.length) return forward ? rows[0] : rows[rows.length - 1];
        } else if (tag === 'TR') {
          return sectionSib;
        }
        sectionSib = forward ? sectionSib.nextElementSibling : sectionSib.previousElementSibling;
      }
      return null;
    }

    function firstTextDescendant(node) {
      if (!node) return null;
      if (node.nodeType === 3) return node;
      for (var i = 0; i < node.childNodes.length; i++) {
        var t = firstTextDescendant(node.childNodes[i]);
        if (t) return t;
      }
      return null;
    }

    function placeCaret(sel, node, offset, extend) {
      try {
        if (extend) sel.extend(node, offset);
        else sel.collapse(node, offset);
        return true;
      } catch (e) {
        return false;
      }
    }

    // Hop one row up/down in a table, preserving column. At the first/last row
    // of the table, step out to the block immediately before/after the table.
    function cellHop(forward, extend) {
      var sel = getSel();
      if (!sel || !sel.focusNode) return false;
      var cell = findContainingCell(sel.focusNode);
      if (!cell) return false;
      var tr = cell.parentNode;
      if (!tr || tr.tagName !== 'TR') return false;
      var col = Array.prototype.indexOf.call(tr.children, cell);
      if (col < 0) return false;

      var nextTr = adjacentRow(tr, forward);
      var target;
      if (nextTr) {
        target = nextTr.children[col] || nextTr.children[nextTr.children.length - 1];
      } else {
        // At the top/bottom row — step out of the table entirely.
        var table = cell;
        while (table && table.tagName !== 'TABLE') table = table.parentNode;
        if (!table) return false;
        target = forward ? table.nextElementSibling : table.previousElementSibling;
      }
      if (!target) return false;

      var textNode = firstTextDescendant(target);
      if (textNode) return placeCaret(sel, textNode, 0, extend);
      return placeCaret(sel, target, 0, extend);
    }

    // --- operators ----------------------------------------------------------

    function operatorDelete(enterInsert) {
      var sel = getSel();
      if (!sel || sel.rangeCount === 0) return;
      var range = sel.getRangeAt(0);
      if (range.collapsed) return;
      register = sel.toString();
      try { editor.undo.saveStep(); } catch (e) {}
      range.deleteContents();
      try { editor.undo.saveStep(); } catch (e) {}
      setMode(enterInsert ? 'insert' : 'normal');
      scheduleCursorReposition();
    }

    function operatorYank() {
      var sel = getSel();
      if (!sel || sel.isCollapsed) return;
      register = sel.toString();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(register).catch(function () { /* permissions */ });
        }
      } catch (e) { /* ignore */ }
      // Collapse selection and return to normal.
      try { sel.collapseToEnd(); } catch (e) {}
      setMode('normal');
      scheduleCursorReposition();
    }

    function operatorPaste() {
      if (!register) return;
      try { editor.undo.saveStep(); } catch (e) {}
      var safe = escapeHtml(register);
      editor.html.insert(safe);
      try { editor.undo.saveStep(); } catch (e) {}
      if (mode === 'visual') setMode('normal');
      scheduleCursorReposition();
    }

    function operatorDeleteChar() {
      var sel = getSel();
      if (!sel) return;
      // Extend forward one character, then delete.
      if (sel.isCollapsed) {
        try { sel.modify('extend', 'forward', 'character'); } catch (e) { return; }
      }
      if (sel.rangeCount === 0) return;
      var range = sel.getRangeAt(0);
      if (range.collapsed) return;
      register = sel.toString();
      try { editor.undo.saveStep(); } catch (e) {}
      range.deleteContents();
      try { editor.undo.saveStep(); } catch (e) {}
      scheduleCursorReposition();
    }

    // Vim `s` — delete char under caret, enter insert mode.
    function substituteChar() {
      var sel = getSel();
      if (!sel) return;
      if (sel.isCollapsed) {
        try { sel.modify('extend', 'forward', 'character'); } catch (e) { return; }
      }
      if (sel.rangeCount === 0) return;
      var range = sel.getRangeAt(0);
      if (!range.collapsed) {
        register = sel.toString();
        try { editor.undo.saveStep(); } catch (e) {}
        range.deleteContents();
        try { editor.undo.saveStep(); } catch (e) {}
      }
      setMode('insert');
    }

    // Vim `r<char>` — replace char under caret with `<char>`.
    function replaceChar(ch) {
      var sel = getSel();
      if (!sel) return;
      if (sel.isCollapsed) {
        try { sel.modify('extend', 'forward', 'character'); } catch (e) { return; }
      }
      if (sel.rangeCount === 0) return;
      var range = sel.getRangeAt(0);
      if (range.collapsed) return;
      try { editor.undo.saveStep(); } catch (e) {}
      range.deleteContents();
      range.insertNode((editor.doc || document).createTextNode(ch));
      range.collapse(false);
      var s2 = getSel();
      if (s2) { s2.removeAllRanges(); s2.addRange(range); }
      try { editor.undo.saveStep(); } catch (e) {}
      scheduleCursorReposition();
    }

    // --- block-level (vim "line") helpers ----------------------------------

    function blockChildren() {
      var root = editor.$el && editor.$el[0];
      return root ? Array.prototype.slice.call(root.children) : [];
    }

    function blockCount() { return blockChildren().length; }

    function currentBlockIndex() {
      var sel = getSel();
      if (!sel || sel.rangeCount === 0) return -1;
      var node = sel.getRangeAt(0).startContainer;
      var root = editor.$el && editor.$el[0];
      if (!root) return -1;
      while (node && node.parentNode !== root) node = node.parentNode;
      if (!node) return -1;
      return blockChildren().indexOf(node);
    }

    function placeCaretAtBlockStart(block) {
      if (!block) return;
      var doc = editor.doc || document;
      var range = doc.createRange();
      // Find first text node, or use the block element itself.
      var t = (function find(n) {
        if (n.nodeType === 3) return n;
        for (var i = 0; i < n.childNodes.length; i++) { var r = find(n.childNodes[i]); if (r) return r; }
        return null;
      })(block);
      if (t) { range.setStart(t, 0); range.collapse(true); }
      else   { range.setStart(block, 0); range.collapse(true); }
      var s = getSel();
      if (s) { s.removeAllRanges(); s.addRange(range); }
    }

    // `<n>G` / `:N` — go to the Nth block (1-based).
    function gotoBlock(n) {
      var blocks = blockChildren();
      if (!blocks.length) return;
      var idx = Math.max(0, Math.min(blocks.length - 1, n - 1));
      placeCaretAtBlockStart(blocks[idx]);
      scheduleCursorReposition();
    }

    function rangeOverBlocks(startIdx, endIdx) {
      var blocks = blockChildren();
      if (!blocks.length) return null;
      var s = Math.max(0, startIdx);
      var e = Math.min(blocks.length - 1, endIdx);
      var doc = editor.doc || document;
      var r = doc.createRange();
      r.setStartBefore(blocks[s]);
      r.setEndAfter(blocks[e]);
      return r;
    }

    function blocksAsText(startIdx, count) {
      var blocks = blockChildren();
      var out = [];
      for (var i = startIdx; i < startIdx + count && i < blocks.length; i++) {
        out.push(blocks[i].textContent);
      }
      return out.join('\n');
    }

    function deleteLines(n) {
      var idx = currentBlockIndex();
      if (idx < 0) return;
      var blocks = blockChildren();
      var end = Math.min(blocks.length - 1, idx + n - 1);
      register = blocksAsText(idx, end - idx + 1);
      try { editor.undo.saveStep(); } catch (e) {}
      var r = rangeOverBlocks(idx, end);
      if (r) r.deleteContents();
      // If we deleted everything, leave a fresh empty paragraph.
      var root = editor.$el && editor.$el[0];
      if (root && root.children.length === 0) {
        var p = (editor.doc || document).createElement('p');
        p.innerHTML = '<br>';
        root.appendChild(p);
      }
      try { editor.undo.saveStep(); } catch (e) {}
      // Place caret at start of whichever block is now at idx (or last block).
      var newBlocks = blockChildren();
      placeCaretAtBlockStart(newBlocks[Math.min(idx, newBlocks.length - 1)]);
      scheduleCursorReposition();
    }

    function yankLines(n) {
      var idx = currentBlockIndex();
      if (idx < 0) return;
      register = blocksAsText(idx, n);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(register).catch(function () {});
        }
      } catch (e) {}
    }

    function changeLines(n) {
      deleteLines(n);
      setMode('insert');
    }

    // Vim `D` / `C` — delete (or change) from caret to end of line.
    function deleteToLineEnd(enterInsert) {
      var sel = getSel();
      if (!sel) return;
      try { sel.modify('extend', 'forward', 'lineboundary'); } catch (e) { return; }
      if (sel.rangeCount === 0) return;
      var range = sel.getRangeAt(0);
      if (range.collapsed) { if (enterInsert) setMode('insert'); return; }
      register = sel.toString();
      try { editor.undo.saveStep(); } catch (e) {}
      range.deleteContents();
      try { editor.undo.saveStep(); } catch (e) {}
      setMode(enterInsert ? 'insert' : 'normal');
      scheduleCursorReposition();
    }

    // --- open-line (o / O) --------------------------------------------------

    function openLine(above) {
      var sel = getSel();
      if (!sel) return;
      // Move to lineboundary in the chosen direction, then insert a paragraph.
      move(above ? 'backward' : 'forward', 'lineboundary');
      // editor.html.insert places HTML at the current caret. A fresh <p> with
      // a zero-width space gives us a caret target inside the new paragraph.
      // Use a literal &nbsp; — Froala usually normalizes empty <p> away.
      editor.html.insert('<p>​</p>');
      try { editor.undo.saveStep(); } catch (e) {}
    }

    // --- leader -------------------------------------------------------------

    var leaderTimer = null;
    function scheduleLeaderTimeout() {
      if (leaderTimer) clearTimeout(leaderTimer);
      leaderTimer = setTimeout(function () {
        leaderPending = false;
        leaderTimer = null;
      }, 1500);
    }

    function clearPending() {
      leaderPending = false;
      gPending = false;
      rPending = false;
      opPending = null;
      pendingOperator = null;
      countBuf = '';
      if (leaderTimer) { clearTimeout(leaderTimer); leaderTimer = null; }
    }

    function resolveLeader(key) {
      leaderPending = false;
      if (leaderTimer) { clearTimeout(leaderTimer); leaderTimer = null; }
      var cmd = LEADER_MAP[key];
      if (typeof cmd === 'function') {
        try { cmd(editor); } catch (e) { console.warn('[vim] leader cmd failed:', e); }
      }
      // Unmapped → silently dropped.
    }

    var LEADER_MAP = {
      b: function (ed) { ed.commands && ed.commands.bold   && ed.commands.bold(); },
      i: function (ed) { ed.commands && ed.commands.italic && ed.commands.italic(); },
      u: function (ed) { ed.commands && ed.commands.underline && ed.commands.underline(); },
      s: function (ed) { ed.save && ed.save.save && ed.save.save(); },
      n: function ()   { (lineNoStyleEl ? disableLineNumbers : enableLineNumbers)(); },
      h: function (ed) { toggleHelpOverlay(ed); }
    };

    // --- mode + UI ----------------------------------------------------------

    function setMode(m) {
      var prev = mode;
      mode = m;
      clearPending();
      var sel = getSel();
      if (m === 'normal') {
        // Collapse any range so Normal goes back to a single-cell caret.
        if (sel && !sel.isCollapsed) {
          try { sel.collapseToEnd(); } catch (e) {}
        }
      } else if (m === 'visual' && prev !== 'visual' && sel && sel.isCollapsed) {
        // Vim's Visual is inclusive of the char under the cursor: entering `v`
        // should immediately cover one character, so `vl` selects two chars
        // and `vy` yanks the char the block cursor was on.
        try { sel.modify('extend', 'forward', 'character'); } catch (e) {}
      }
      updateBadge();
      applyCursorStyle();
      scheduleCursorReposition();
    }

    function mountBadge() {
      if (badgeEl) return;
      // Attach the badge to Froala's outer box so it lives inside the editor
      // chrome instead of floating in the viewport corner. Falls back to the
      // editable element, then document.body, if that ref isn't available.
      var host = (editor.$box && editor.$box[0])
              || (editor.$wp  && editor.$wp[0])
              || (editor.$el  && editor.$el[0])
              || (editor.doc || document).body;
      // Make the host a positioning context if it isn't already.
      var pos = (editor.win || window).getComputedStyle(host).position;
      if (pos === 'static' || !pos) host.style.position = 'relative';

      badgeEl = (editor.doc || document).createElement('div');
      badgeEl.className = 'fr-vim-badge';
      badgeEl.style.cssText = [
        'position:absolute', 'bottom:6px', 'left:8px',
        'padding:2px 8px', 'border-radius:4px',
        'font:600 10px/1.4 -apple-system,system-ui,sans-serif',
        'letter-spacing:0.6px', 'z-index:5',
        'background:#222', 'color:#fff', 'opacity:0.85',
        'pointer-events:none', 'user-select:none'
      ].join(';');
      host.appendChild(badgeEl);
    }

    function updateBadge() {
      if (!badgeEl) return;
      var label = mode.toUpperCase();
      var colors = { NORMAL: '#222', INSERT: '#1b6e1b', VISUAL: '#7a5b00' };
      badgeEl.textContent = label + (cfg.navLayout === 'ijkl' ? ' · ijkl' : '');
      badgeEl.style.background = colors[label] || '#222';
    }

    function applyCursorStyle() {
      // In Normal/Visual, hide the native caret and rely on the block cursor overlay.
      // In Insert, show the native caret in the configured color.
      var root = editor.$el && editor.$el[0];
      if (!root) return;
      if (mode === 'insert') {
        root.style.caretColor = cfg && cfg.cursorColor || '';
        hideBlockCursor();
      } else {
        root.style.caretColor = 'transparent';
        showBlockCursor();
      }
    }

    function ensureBlockCursor() {
      if (blockCursorEl) return blockCursorEl;
      blockCursorEl = (editor.doc || document).createElement('div');
      blockCursorEl.className = 'fr-vim-block-cursor';
      var c = (cfg && cfg.cursorColor) || '#50a0ff';
      blockCursorEl.style.cssText = [
        'position:fixed', 'pointer-events:none', 'z-index:9998',
        'background:' + toRgba(c, 0.35),
        'outline:1px solid ' + toRgba(c, 0.9),
        'transition:transform 30ms linear'
      ].join(';');
      (editor.doc || document).body.appendChild(blockCursorEl);
      return blockCursorEl;
    }

    function toRgba(color, alpha) {
      // Accepts #rgb, #rrggbb, rgb(), or rgba(); returns rgba() with given alpha.
      var m = String(color).trim();
      var r, g, b;
      var hex = m.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (hex) {
        var h = hex[1];
        if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
      }
      var rgb = m.match(/^rgba?\(([^)]+)\)$/i);
      if (rgb) {
        var parts = rgb[1].split(',').map(function (s) { return s.trim(); });
        return 'rgba(' + parts[0] + ',' + parts[1] + ',' + parts[2] + ',' + alpha + ')';
      }
      // unknown format — pass through
      return color;
    }

    function hideBlockCursor() {
      if (blockCursorEl) blockCursorEl.style.display = 'none';
    }

    function showBlockCursor() {
      ensureBlockCursor().style.display = '';
      repositionBlockCursor();
    }

    var repositionScheduled = false;
    function scheduleCursorReposition() {
      if (mode === 'insert') return;
      if (repositionScheduled) return;
      repositionScheduled = true;
      (editor.win || window).requestAnimationFrame(function () {
        repositionScheduled = false;
        repositionBlockCursor();
      });
    }

    function repositionBlockCursor() {
      if (mode === 'insert') return;
      var el = ensureBlockCursor();
      var sel = getSel();
      if (!sel || sel.rangeCount === 0) { el.style.display = 'none'; return; }

      // Anchor the block cursor at the *focus* end of the selection — i.e.
      // where the user would extend next. In Normal mode the selection is
      // collapsed so focus == anchor. In Visual mode Vim's cursor sits on the
      // last selected character (the one just before focus when extending
      // forward, or at focus when extending backward), not on the character
      // beyond the selection.
      var doc = editor.doc || document;
      var probe = doc.createRange();
      try {
        probe.setStart(sel.focusNode, sel.focusOffset);
        probe.collapse(true);
      } catch (e) {
        el.style.display = 'none'; return;
      }

      var node = probe.startContainer;
      var off  = probe.startOffset;
      var nodeLen = lengthOf(node);
      var sized = probe.cloneRange();
      var rect;

      // In Visual mode, forward selections (anchor before focus) should put the
      // cursor on the last selected char, i.e. [focus-1, focus]. Backward
      // selections (focus before anchor) put it on [focus, focus+1].
      var forwardVisual = false;
      if (mode === 'visual' && !sel.isCollapsed && sel.focusNode === node) {
        var cmp = -1;
        try { cmp = probe.comparePoint(sel.anchorNode, sel.anchorOffset); } catch (e) {}
        // cmp < 0 → anchor is before focus → forward selection.
        forwardVisual = cmp < 0;
      }

      if (forwardVisual && off > 0) {
        try { sized.setStart(node, off - 1); sized.setEnd(node, off); } catch (e) {}
        rect = firstRect(sized);
      } else if (off < nodeLen) {
        try { sized.setEnd(node, off + 1); } catch (e) {}
        rect = firstRect(sized);
      } else if (off > 0) {
        try { sized.setStart(node, off - 1); sized.setEnd(node, off); } catch (e) {}
        rect = firstRect(sized);
      }

      if (!rect || rect.width === 0) {
        // Empty/blank block: fall back to the focus range's own rect, then
        // to the enclosing block element's top-left so the cursor stays visible.
        rect = firstRect(probe);
        if (!rect || (rect.width === 0 && rect.height === 0)) {
          rect = blockRectFor(node);
        }
        if (rect) rect = { left: rect.left, top: rect.top, width: 7, height: rect.height || 16 };
      }

      if (!rect) { el.style.display = 'none'; return; }
      // Match the cursor height to the line box, not the glyph box, so it lines
      // up with the native ::selection highlight (which spans full line-height).
      var lineH = lineHeightFor(node);
      var h = Math.max(rect.height, lineH || 0, 16);
      var top = rect.top;
      if (lineH && lineH > rect.height) {
        // Center the taller cursor over the glyph rect's vertical midpoint.
        top = rect.top + (rect.height - lineH) / 2;
      }
      el.style.display = '';
      el.style.left   = rect.left + 'px';
      el.style.top    = top + 'px';
      el.style.width  = Math.max(rect.width, 7) + 'px';
      el.style.height = h + 'px';
    }

    function lineHeightFor(node) {
      var el = node && node.nodeType === 3 ? node.parentNode : node;
      if (!el || !el.nodeType || el.nodeType !== 1) return 0;
      var win = editor.win || window;
      var cs = win.getComputedStyle(el);
      var lh = parseFloat(cs.lineHeight);
      if (!isFinite(lh) || lh <= 0) {
        // line-height: normal — approximate as 1.2 × font-size.
        var fs = parseFloat(cs.fontSize);
        if (isFinite(fs) && fs > 0) lh = fs * 1.2;
      }
      return lh || 0;
    }

    function blockRectFor(node) {
      // Walk up to the nearest element, then measure its bounding box.
      var n = node && node.nodeType === 3 ? node.parentNode : node;
      if (!n || !n.getBoundingClientRect) return null;
      var r = n.getBoundingClientRect();
      // For empty blocks, height comes from line-height; getBoundingClientRect
      // can report height 0 in some browsers. Use the computed line-height as
      // a floor so the cursor remains visible.
      var h = r.height;
      if (h < 4) {
        var lh = parseFloat((editor.win || window).getComputedStyle(n).lineHeight);
        h = isNaN(lh) ? 18 : lh;
      }
      return { left: r.left, top: r.top, width: 7, height: h };
    }

    function lengthOf(node) {
      if (node.nodeType === 3) return node.nodeValue.length;
      return node.childNodes.length;
    }

    function firstRect(range) {
      var rects = range.getClientRects();
      if (rects && rects.length) return rects[0];
      var r = range.getBoundingClientRect && range.getBoundingClientRect();
      return r && (r.width || r.height) ? r : null;
    }

    // --- ex command line (`:`) ---------------------------------------------

    var exInput = null;
    function openExLine() {
      if (exInput) { exInput.focus(); return; }
      var host = (editor.$box && editor.$box[0]) || (editor.doc || document).body;
      var pos = (editor.win || window).getComputedStyle(host).position;
      if (pos === 'static' || !pos) host.style.position = 'relative';

      var bar = (editor.doc || document).createElement('div');
      bar.style.cssText = [
        'position:absolute', 'left:0', 'right:0', 'bottom:0',
        'background:#111', 'color:#eee', 'padding:6px 10px',
        'font:13px/1.4 ui-monospace, Menlo, monospace',
        'z-index:50', 'display:flex', 'align-items:center', 'gap:6px',
        'border-top:1px solid #333'
      ].join(';');
      bar.innerHTML = '<span style="opacity:0.7">:</span>';
      var input = (editor.doc || document).createElement('input');
      input.type = 'text';
      input.style.cssText = [
        'flex:1', 'background:transparent', 'border:0', 'outline:0',
        'color:inherit', 'font:inherit'
      ].join(';');
      bar.appendChild(input);
      host.appendChild(bar);
      exInput = bar;

      function close() {
        if (!exInput) return;
        exInput.remove();
        exInput = null;
        // Restore focus to the editor so motions resume.
        var root = editor.$el && editor.$el[0];
        if (root) root.focus();
        scheduleCursorReposition();
      }

      input.addEventListener('keydown', function (ev) {
        ev.stopPropagation();
        if (ev.key === 'Enter')  { runExCommand(input.value.trim()); close(); ev.preventDefault(); }
        else if (ev.key === 'Escape') { close(); ev.preventDefault(); }
      });
      input.focus();
    }

    function runExCommand(cmd) {
      if (!cmd) return;
      // Pure number: jump to that line. Future-proofed for more verbs.
      if (/^\d+$/.test(cmd)) { gotoBlock(parseInt(cmd, 10)); return; }
      // `:$` — last line, analogous to Vim
      if (cmd === '$') { gotoBlock(blockCount()); return; }
      // Unknown commands are silently ignored for now.
    }

    // --- help overlay (leader-h) -------------------------------------------

    var helpEl = null;
    function toggleHelpOverlay(ed) {
      var doc = ed.doc || document;
      if (helpEl) { helpEl.remove(); helpEl = null; return; }
      helpEl = doc.createElement('div');
      helpEl.style.cssText = [
        'position:fixed', 'top:20px', 'left:50%', 'transform:translateX(-50%)',
        'background:#111', 'color:#eee', 'padding:14px 18px', 'border-radius:8px',
        'font:12px/1.5 ui-monospace,Menlo,monospace', 'z-index:10000',
        'box-shadow:0 8px 32px rgba(0,0,0,0.4)', 'max-width:520px'
      ].join(';');
      var ib = insertBeforeKey(cfg.navLayout);
      helpEl.innerHTML =
        '<div style="font-weight:600;margin-bottom:6px">Vim mode — ' + cfg.navLayout + '</div>' +
        '<div>motions: ' + Object.keys(MOTION_MAPS[cfg.navLayout]).join(' ') +
          '  w b 0 $ gg G</div>' +
        '<div>insert: ' + ib + ' a A I o O   visual: v   exit: Esc</div>' +
        '<div>ops (visual): d c y p x</div>' +
        '<div>undo: u   redo: Ctrl-r</div>' +
        '<div>leader (' + cfg.leader + '): b=bold i=italic u=underline s=save n=line# h=help</div>' +
        '<div style="opacity:0.6;margin-top:6px">' + cfg.leader + 'h to close</div>';
      doc.body.appendChild(helpEl);
    }

    // --- utils --------------------------------------------------------------

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Public surface — `_init` is required; the rest are the runtime API.
    return {
      _init: _init,
      enable: enable,
      disable: disable,
      toggle: function () { (enabled ? disable : enable)(); },
      isEnabled: function () { return enabled; },
      getMode: function () { return mode; },
      setLeader: setLeader,
      getLeader: function () { return cfg && cfg.leader; },
      getLayout: function () { return cfg && cfg.navLayout; },
      setCursorColor: setCursorColor,
      getCursorColor: function () { return cfg && cfg.cursorColor; },
      showLineNumbers: enableLineNumbers,
      hideLineNumbers: disableLineNumbers,
      toggleLineNumbers: function () { (lineNoStyleEl ? disableLineNumbers : enableLineNumbers)(); },
      // legacy aliases used by harness/tests
      _getMode: function () { return mode; },
      _setMode: setMode,
      _register: function () { return register; }
    };
  };

  // Register a toolbar command + icon so users can drop "Vim" into the toolbar.
  // Usage: include `'vim'` in `toolbarButtons` (or in any toolbarButtons.<bp>.buttons).
  if (typeof FroalaEditor.DefineIcon === 'function') {
    // Use the `FONT_AWESOME_5` icon set if loaded; otherwise fall back to text.
    FroalaEditor.DefineIcon('vim', { NAME: 'keyboard-o', SVG_KEY: 'inlineClass', template: 'text' });
    FroalaEditor.DefineIconTemplate && FroalaEditor.DefineIconTemplate('vim-text', '<span style="font:600 11px/1 system-ui">VIM</span>');
    FroalaEditor.DefineIcon('vim', { NAME: 'VIM', template: 'vim-text' });
  }

  if (typeof FroalaEditor.RegisterCommand === 'function') {
    FroalaEditor.RegisterCommand('vim', {
      title: 'Toggle Vim mode',
      icon: 'vim',
      focus: false,
      undo: false,
      refreshAfterCallback: true,
      callback: function () {
        if (this.vim && this.vim.toggle) this.vim.toggle();
      },
      refresh: function ($btn) {
        if (this.vim && this.vim.isEnabled) {
          $btn.toggleClass('fr-active', !!this.vim.isEnabled());
        }
      }
    });
  }
})(window.FroalaEditor);
