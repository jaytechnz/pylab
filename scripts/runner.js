// ─── Python Runner — Skulpt-based execution ────────────────────────────────
// Runs Python 3-compatible code using Skulpt (in-browser interpreter).
// Handles: print(), input() (interactive prompt), turtle graphics.

// Skulpt is loaded as a global <script> tag (skulpt.min.js + skulpt-stdlib.js).

const MAX_OUTPUT_LINES = 2000;
const RUN_TIMEOUT_MS   = 15000;  // 15 s hard cap

// ── Construct detection (for analytics) ──────────────────────────────────────
export function detectConstructs(source) {
  const constructs = [];
  if (/\bif\b/.test(source))    constructs.push('if');
  if (/\belif\b/.test(source))  constructs.push('elif');
  if (/\belse\b/.test(source))  constructs.push('else');
  if (/\bfor\b/.test(source))   constructs.push('for');
  if (/\bwhile\b/.test(source)) constructs.push('while');
  if (/\bdef\b/.test(source))   constructs.push('def');
  if (/\bclass\b/.test(source)) constructs.push('class');
  if (/\bimport\b/.test(source))constructs.push('import');
  if (/\breturn\b/.test(source))constructs.push('return');
  if (/\[.*\]/.test(source))    constructs.push('list');
  if (/\bturtle\b/.test(source))constructs.push('turtle');
  if (/\binput\b/.test(source)) constructs.push('input');
  return constructs;
}

// ── PEP 8 lint (surface-level) ────────────────────────────────────────────────
export function pep8Lint(source) {
  const warnings = [];
  const lines = source.split('\n');
  lines.forEach((line, i) => {
    const ln = i + 1;
    // Trailing whitespace
    if (/\s+$/.test(line)) warnings.push(`Line ${ln}: trailing whitespace`);
    // Tabs instead of spaces
    if (/^\t/.test(line)) warnings.push(`Line ${ln}: use 4 spaces, not tabs`);
    // Lines > 79 chars (PEP 8)
    if (line.length > 79) warnings.push(`Line ${ln}: line too long (${line.length} > 79)`);
    // Missing space around operators (simple heuristic)
    // e.g. x=5 → x = 5
    if (/[a-zA-Z0-9_]=(?!=)[a-zA-Z0-9_('"]/.test(line) && !/^\s*(def |class |for |while |if |elif )/.test(line))
      warnings.push(`Line ${ln}: missing spaces around assignment operator`);
  });
  return warnings;
}

// ══════════════════════════════════════════════════════════════════════════════
// RUNNER CLASS
// ══════════════════════════════════════════════════════════════════════════════

export class PythonRunner {
  constructor({ onOutput, onError, onComplete, onInputRequest, turtleTarget }) {
    this.onOutput       = onOutput;         // (text, type) → void
    this.onError        = onError;          // (msg, lineno) → void
    this.onComplete     = onComplete;       // () → void
    this.onInputRequest = onInputRequest;   // (prompt) → Promise<string>
    this.turtleTarget   = turtleTarget;     // container div element (Skulpt injects canvas here)

    this._running = false;
    this._outputLines = 0;
  }

  isRunning() { return this._running; }

  stop() {
    this._running = false;
    // Skulpt has no clean stop mechanism; we set a flag checked in output handler
  }

  async run(source, preloadedInputs = null) {
    if (this._running) return;
    this._running = true;
    this._outputLines = 0;

    // Queue of inputs if running in test/batch mode
    let inputQueue = preloadedInputs ? [...preloadedInputs] : null;

    // Timeout watchdog
    const startTime = Date.now();

    // Configure Skulpt
    Sk.configure({
      output: (text) => {
        if (!this._running) return;
        if (this._outputLines++ > MAX_OUTPUT_LINES) {
          this._running = false;
          this.onError('Output limit exceeded (too many print statements).', -1);
          return;
        }
        this.onOutput(text, 'stdout');
      },

      read: (filename) => {
        if (Sk.builtinFiles?.files?.[filename] !== undefined)
          return Sk.builtinFiles.files[filename];
        throw new Error(`File not found: '${filename}'`);
      },

      inputfun: (prompt) => {
        if (!this._running) return Promise.resolve('');

        // Print the prompt text to output
        if (prompt) this.onOutput(prompt, 'stdout');

        // Check timeout
        if (Date.now() - startTime > RUN_TIMEOUT_MS) {
          this._running = false;
          this.onError('Program timed out. Check for infinite loops.', -1);
          return Promise.resolve('');
        }

        // Batch/test mode: use pre-loaded inputs
        if (inputQueue !== null) {
          const val = inputQueue.shift() ?? '';
          this.onOutput(val + '\n', 'stdout');  // echo input
          return Promise.resolve(val);
        }

        // Interactive mode: show input widget
        return this.onInputRequest(prompt);
      },

      execLimit:  RUN_TIMEOUT_MS,
      yieldLimit: 500,

      // Turtle: use the canvas
      __future__: Sk.python3,
    });

    // Set up Turtle graphics — target must be a container div; Skulpt creates the canvas inside it
    if (this.turtleTarget) {
      Sk.TurtleGraphics = {
        target: this.turtleTarget,
        width:  500,
        height: 400,
      };
    }

    try {
      await Sk.misceval.asyncToPromise(() =>
        Sk.importMainWithBody('<stdin>', false, source, true)
      );
    } catch (err) {
      if (this._running) {
        const msg  = err.toString?.() ?? String(err);
        // Extract line number if present
        const lineMatch = msg.match(/line\s+(\d+)/i) ||
                          (err.lineno ? [null, err.lineno] : null);
        const lineno = lineMatch ? parseInt(lineMatch[1], 10) : -1;
        // Clean up Skulpt's verbose error format
        const clean = this._cleanError(msg);
        this.onError(clean, lineno);
      }
    } finally {
      this._running = false;
      this.onComplete();
    }
  }

  // ── Run silently for test cases ────────────────────────────────────────────
  // Returns { outputs: string[], error: string|null }
  async runForTests(source, inputs = []) {
    const outputs = [];
    let errorMsg  = null;
    const inputQueue = [...inputs];

    Sk.configure({
      output: (text) => { outputs.push(text); },
      read: (filename) => {
        if (Sk.builtinFiles?.files?.[filename] !== undefined)
          return Sk.builtinFiles.files[filename];
        throw new Error(`File not found: '${filename}'`);
      },
      inputfun: () => {
        const val = inputQueue.shift() ?? '';
        return Promise.resolve(val);
      },
      execLimit: 8000,
      __future__: Sk.python3,
    });

    try {
      await Sk.misceval.asyncToPromise(() =>
        Sk.importMainWithBody('<stdin>', false, source, true)
      );
    } catch (err) {
      errorMsg = this._cleanError(err.toString?.() ?? String(err));
    }

    // Normalise: split concatenated outputs into lines, trim trailing \n
    const lines = outputs.join('').split('\n').map(l => l.trimEnd());
    // Remove trailing empty string from split
    if (lines.length && lines[lines.length - 1] === '') lines.pop();

    return { outputs: lines, error: errorMsg };
  }

  _cleanError(msg) {
    // Skulpt errors look like "SyntaxError: invalid syntax on line 3"
    // or "NameError: name 'foo' is not defined on line 5"
    return msg
      .replace(/^Traceback \(most recent call last\):\s*/i, '')
      .replace(/^  File "<stdin>",\s*/gm, '')
      .replace(/\n  /g, '\n')
      .trim();
  }
}
