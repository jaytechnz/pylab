// ─── Python Editor — Syntax Highlighting + Auto-indent ───────────────────────
// Uses the textarea-behind-highlight-div overlay technique.

// ══════════════════════════════════════════════════════════════════════════════
// TOKEN DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

const KW = new Set([
  'False','None','True',
  'and','as','assert','async','await',
  'break','class','continue',
  'def','del','elif','else','except',
  'finally','for','from','global',
  'if','import','in','is',
  'lambda','nonlocal','not','or',
  'pass','raise','return',
  'try','while','with','yield',
]);

// Control-flow subset (highlighted differently)
const CTRL_KW = new Set([
  'break','continue','pass','return','yield',
  'raise','del','global','nonlocal',
  'import','from','as',
  'try','except','finally','with','async','await',
  'assert','lambda',
]);

const BUILTIN_FNS = new Set([
  'abs','all','any','ascii','bin','bool','breakpoint',
  'bytearray','bytes','callable','chr','classmethod',
  'compile','complex','copyright','credits','delattr',
  'dict','dir','divmod','enumerate','eval','exec',
  'filter','float','format','frozenset','getattr',
  'globals','hasattr','hash','help','hex','id','input',
  'int','isinstance','issubclass','iter','len','license',
  'list','locals','map','max','memoryview','min','next',
  'object','oct','open','ord','pow','print','property',
  'range','repr','reversed','round','set','setattr',
  'slice','sorted','staticmethod','str','sum','super',
  'tuple','type','vars','zip',
]);

const BUILTIN_TYPES = new Set(['int','float','str','bool','list','dict','tuple','set','bytes','type']);

// Regex table — order matters
const TOKEN_RE = [
  // Triple-quoted strings (multiline) — must come before single-quoted
  [/"""[\s\S]*?"""|'''[\s\S]*?'''/g,                              'tok-str'    ],
  // f-strings
  [/f"""[\s\S]*?"""|f'''[\s\S]*?'''/g,                           'tok-fstr'   ],
  [/f"(?:[^"\\]|\\.)*"|f'(?:[^'\\]|\\.)*'/g,                     'tok-fstr'   ],
  // Regular strings
  [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,                       'tok-str'    ],
  // Comments
  [/#.*/g,                                                         'tok-cmt'    ],
  // Decorators
  [/@[a-zA-Z_]\w*/g,                                              'tok-deco'   ],
  // Numbers (float, int, hex, oct, bin)
  [/\b0[xX][0-9a-fA-F]+\b|\b0[oO][0-7]+\b|\b0[bB][01]+\b|\b\d+\.?\d*(?:[eE][+-]?\d+)?\b/g, 'tok-num'],
  // Identifiers / keywords
  [/[a-zA-Z_]\w*/g,                                               '__ident__'  ],
  // Operators
  [/[+\-*/%&|^~<>=!@]+|\/\//g,                                   'tok-op'     ],
];

// ══════════════════════════════════════════════════════════════════════════════
// HIGHLIGHTING
// ══════════════════════════════════════════════════════════════════════════════

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/** Tokenise one line into an array of {text, cls} tokens. */
function tokeniseLine(line) {
  if (!line) return [];

  const tokens = [];     // {start, end, cls}
  const covered = new Uint8Array(line.length);

  for (const [re, cls] of TOKEN_RE) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      const s = m.index, e = s + m[0].length;
      // Skip if overlaps covered region
      if (covered.slice(s, e).some(Boolean)) continue;

      let resolvedCls = cls;
      if (cls === '__ident__') {
        const w = m[0];
        if (w === 'True' || w === 'False' || w === 'None') resolvedCls = 'tok-bool';
        else if (CTRL_KW.has(w))   resolvedCls = 'tok-ctrl';
        else if (KW.has(w))        resolvedCls = 'tok-kw';
        else if (BUILTIN_FNS.has(w) && !BUILTIN_TYPES.has(w)) resolvedCls = 'tok-builtin';
        else if (BUILTIN_TYPES.has(w)) resolvedCls = 'tok-type';
        else {
          // Check if followed by '(' → function call/def name
          const after = line[e];
          if (after === '(') resolvedCls = 'tok-fn';
          else resolvedCls = '';   // plain identifier
        }
      }

      tokens.push({ start: s, end: e, cls: resolvedCls });
      for (let i = s; i < e; i++) covered[i] = 1;
    }
  }

  tokens.sort((a, b) => a.start - b.start);

  // Build output, filling gaps with plain text
  const parts = [];
  let pos = 0;
  for (const tok of tokens) {
    if (pos < tok.start) parts.push({ text: line.slice(pos, tok.start), cls: '' });
    if (tok.cls) parts.push({ text: line.slice(tok.start, tok.end), cls: tok.cls });
    else         parts.push({ text: line.slice(tok.start, tok.end), cls: '' });
    pos = tok.end;
  }
  if (pos < line.length) parts.push({ text: line.slice(pos), cls: '' });
  return parts;
}

export function highlightSource(source) {
  const lines = source.split('\n');
  return lines.map(line => {
    const parts = tokeniseLine(line);
    const html = parts.map(p =>
      p.cls ? `<span class="${p.cls}">${escHtml(p.text)}</span>` : escHtml(p.text)
    ).join('');
    return `<span class="line">${html}</span>`;
  }).join('\n') + '\n';  // trailing newline keeps caret visible at EOF
}

// ══════════════════════════════════════════════════════════════════════════════
// SNAKE_CASE CHECK
// ══════════════════════════════════════════════════════════════════════════════

// Returns array of {word, line, col} for identifiers that are NOT snake_case,
// excluding: class names (after 'class'), constants (all-caps), builtins, kws.
export function findNonSnakeCase(source) {
  const issues = [];
  const lines = source.split('\n');
  // Identifier regex: starts with letter, contains uppercase inside word
  const identRe = /\b([a-zA-Z_]\w*)\b/g;
  lines.forEach((line, li) => {
    // Skip comments
    const commentIdx = line.indexOf('#');
    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    identRe.lastIndex = 0;
    let m;
    while ((m = identRe.exec(codePart)) !== null) {
      const w = m[1];
      // Skip keywords, builtins, all-caps constants, single-char
      if (KW.has(w) || BUILTIN_FNS.has(w) || w.length <= 1) continue;
      if (/^[A-Z][A-Z0-9_]*$/.test(w)) continue;  // UPPER_CASE constant
      // Class names: the name immediately following 'class ' keyword
      const before = codePart.slice(0, m.index).trimEnd();
      if (/\bclass\s+$/.test(before + ' ')) continue;
      // Check for camelCase / PascalCase (contains uppercase after first char)
      if (/[a-z][A-Z]/.test(w) || /^[A-Z]/.test(w)) {
        issues.push({ word: w, line: li, col: m.index });
      }
    }
  });
  return issues;
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTO-INDENT LOGIC
// ══════════════════════════════════════════════════════════════════════════════

const INDENT_SIZE = 4;
const INDENT_STR  = ' '.repeat(INDENT_SIZE);

// Lines ending with ':' trigger an additional indent on Enter.
const COLON_LINE_RE = /:\s*(?:#.*)?$/;

// Dedent keywords: lines starting with these should reduce indent by 1 level
// relative to the surrounding block.
const DEDENT_KW = /^\s*(elif|else|except|finally)\b/;

// Patterns that should trigger a dedent (typing 'return', 'break', etc.
// don't dedent, but 'elif'/'else'/'except'/'finally' do).

/** Given current source and cursor position, return the indent string to
 *  insert on Enter, taking Python indentation rules into account. */
export function getEnterIndent(source, cursorPos) {
  const textBefore = source.slice(0, cursorPos);
  const lines = textBefore.split('\n');
  const currentLine = lines[lines.length - 1];

  // Current line indentation
  const currentIndent = currentLine.match(/^(\s*)/)[1];

  // If current line ends with ':', increase indent
  if (COLON_LINE_RE.test(currentLine)) {
    return '\n' + currentIndent + INDENT_STR;
  }

  // Default: keep same indent
  return '\n' + currentIndent;
}

/** On backspace at beginning of indented content, snap back to previous
 *  indent level. Returns number of characters to delete. */
export function getBackspaceDelete(source, cursorPos) {
  const textBefore = source.slice(0, cursorPos);
  const lineStart = textBefore.lastIndexOf('\n') + 1;
  const lineContent = textBefore.slice(lineStart);

  // Only act if cursor is in whitespace at start of line
  if (!/^\s+$/.test(lineContent)) return 1;

  // Snap to previous indent level (multiple of 4)
  const col = lineContent.length;
  const snapTo = Math.max(0, col - ((col % INDENT_SIZE) || INDENT_SIZE));
  return col - snapTo;
}

// ══════════════════════════════════════════════════════════════════════════════
// EDITOR CLASS
// ══════════════════════════════════════════════════════════════════════════════

export class Editor {
  constructor({ textarea, highlight, gutter }) {
    this._ta   = textarea;
    this._hl   = highlight;
    this._gut  = gutter;
    this._cbs  = [];          // onChange callbacks
    this._autoIndentEnabled = true;
    this._snakeCaseEnabled  = true;

    this._bindEvents();
    this._render();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  getValue()    { return this._ta.value; }
  setValue(src) { this._ta.value = src; this._render(); this._updateGutter(); }

  setAutoIndent(v) { this._autoIndentEnabled = v; }
  setSnakeCase(v)  { this._snakeCaseEnabled  = v; }

  onChange(fn) { this._cbs.push(fn); }

  getCursorLineCol() {
    const pos = this._ta.selectionStart;
    const text = this._ta.value.slice(0, pos);
    const lines = text.split('\n');
    return { line: lines.length, col: lines[lines.length - 1].length + 1 };
  }

  focus() { this._ta.focus(); }

  // ── Rendering ─────────────────────────────────────────────────────────────

  _render() {
    this._hl.innerHTML = highlightSource(this._ta.value);
    this._syncScroll();
    this._updateGutter();
  }

  _updateGutter() {
    const lines = this._ta.value.split('\n');
    const count = Math.max(lines.length, 1);
    if (this._gut._lineCount === count) return;
    this._gut._lineCount = count;
    this._gut.innerHTML = Array.from({ length: count }, (_, i) =>
      `<span class="gutter-line" data-line="${i+1}">${i+1}</span>`
    ).join('');
  }

  _syncScroll() {
    this._hl.scrollTop  = this._ta.scrollTop;
    this._hl.scrollLeft = this._ta.scrollLeft;
  }

  // ── Event binding ─────────────────────────────────────────────────────────

  _bindEvents() {
    const ta = this._ta;

    ta.addEventListener('input', () => {
      this._render();
      this._cbs.forEach(fn => fn());
    });

    ta.addEventListener('scroll', () => this._syncScroll());

    ta.addEventListener('keydown', e => this._handleKeyDown(e));

    // Sync scroll when window resizes
    window.addEventListener('resize', () => this._syncScroll(), { passive: true });
  }

  _handleKeyDown(e) {
    const ta = this._ta;

    // ── Tab: insert 4 spaces ──────────────────────────────────────────────
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        this._dedentSelection();
      } else {
        this._insertAtCursor(INDENT_STR);
      }
      return;
    }

    // ── Colon: snap else/elif/except/finally back to correct indent ──────
    if (e.key === ':' && this._autoIndentEnabled && ta.selectionStart === ta.selectionEnd) {
      const pos       = ta.selectionStart;
      const textBefore = ta.value.slice(0, pos);
      const lineStart  = textBefore.lastIndexOf('\n') + 1;
      const currentLine = textBefore.slice(lineStart);
      if (DEDENT_KW.test(currentLine) && currentLine.match(/^(\s+)/)) {
        const currentIndent = currentLine.match(/^(\s*)/)[1];
        const newIndent     = currentIndent.slice(0, Math.max(0, currentIndent.length - 4));
        e.preventDefault();
        const newLine = newIndent + currentLine.trimStart() + ':';
        ta.value = ta.value.slice(0, lineStart) + newLine + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = lineStart + newLine.length;
        this._render();
        this._cbs.forEach(fn => fn());
        return;
      }
    }

    // ── Enter: auto-indent ────────────────────────────────────────────────
    if (e.key === 'Enter' && this._autoIndentEnabled) {
      e.preventDefault();
      const indent = getEnterIndent(ta.value, ta.selectionStart);
      this._insertAtCursor(indent);
      return;
    }

    // ── Backspace: smart backspace ────────────────────────────────────────
    if (e.key === 'Backspace' && this._autoIndentEnabled &&
        ta.selectionStart === ta.selectionEnd) {
      const del = getBackspaceDelete(ta.value, ta.selectionStart);
      if (del > 1) {
        e.preventDefault();
        const s = ta.selectionStart;
        const before = ta.value.slice(0, s - del);
        const after  = ta.value.slice(s);
        ta.value = before + after;
        ta.selectionStart = ta.selectionEnd = s - del;
        this._render();
        this._cbs.forEach(fn => fn());
        return;
      }
    }

    // ── Closing bracket auto-dedent ───────────────────────────────────────
    if ((e.key === '}' || e.key === ']' || e.key === ')') && this._autoIndentEnabled) {
      // No action needed for Python, only for brace languages
    }

    // ── Ctrl+/ : toggle comment ───────────────────────────────────────────
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      this._toggleComment();
      return;
    }

    // ── Ctrl+D: duplicate line ────────────────────────────────────────────
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      this._duplicateLine();
      return;
    }
  }

  _insertAtCursor(text) {
    const ta = this._ta;
    const s  = ta.selectionStart;
    const e  = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    const newPos = s + text.length;
    ta.selectionStart = ta.selectionEnd = newPos;
    this._render();
    this._cbs.forEach(fn => fn());
  }

  _dedentSelection() {
    const ta = this._ta;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const val   = ta.value;

    // Find the start of the first selected line
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const block = val.slice(lineStart, end);

    const dedented = block.split('\n').map(line => {
      if (line.startsWith(INDENT_STR)) return line.slice(INDENT_SIZE);
      if (line.startsWith('\t')) return line.slice(1);
      if (line.startsWith(' ')) return line.replace(/^ {1,4}/, '');
      return line;
    }).join('\n');

    const removed = block.length - dedented.length;
    ta.value = val.slice(0, lineStart) + dedented + val.slice(end);
    ta.selectionStart = Math.max(lineStart, start - Math.min(INDENT_SIZE, start - lineStart));
    ta.selectionEnd   = end - removed;
    this._render();
    this._cbs.forEach(fn => fn());
  }

  _toggleComment() {
    const ta  = this._ta;
    const val = ta.value;
    const s   = ta.selectionStart;
    const e   = ta.selectionEnd;

    const lineStart = val.lastIndexOf('\n', s - 1) + 1;
    const lineEnd   = val.indexOf('\n', e);
    const block     = val.slice(lineStart, lineEnd < 0 ? val.length : lineEnd);

    const lines = block.split('\n');
    const allCommented = lines.every(l => l.trimStart().startsWith('#'));

    const toggled = allCommented
      ? lines.map(l => l.replace(/^(\s*)#\s?/, '$1'))
      : lines.map(l => {
          const indent = l.match(/^(\s*)/)[1];
          return indent + '# ' + l.slice(indent.length);
        });

    const newBlock = toggled.join('\n');
    ta.value = val.slice(0, lineStart) + newBlock + (lineEnd < 0 ? '' : val.slice(lineEnd));
    ta.selectionStart = s;
    ta.selectionEnd   = e + (newBlock.length - block.length);
    this._render();
    this._cbs.forEach(fn => fn());
  }

  _duplicateLine() {
    const ta = this._ta;
    const val = ta.value;
    const s   = ta.selectionStart;

    const lineStart = val.lastIndexOf('\n', s - 1) + 1;
    const lineEnd   = val.indexOf('\n', s);
    const line      = val.slice(lineStart, lineEnd < 0 ? val.length : lineEnd);

    const insertAt = lineEnd < 0 ? val.length : lineEnd;
    ta.value = val.slice(0, insertAt) + '\n' + line + val.slice(insertAt);
    ta.selectionStart = ta.selectionEnd = insertAt + 1 + (s - lineStart);
    this._render();
    this._cbs.forEach(fn => fn());
  }
}
