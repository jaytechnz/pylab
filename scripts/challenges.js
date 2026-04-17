// ─── Challenge System ─────────────────────────────────────────────────────────
// Manages: exercise sidebar, test running, XP, badges, leaderboard.

import { EXERCISES, CATEGORIES } from './exercises.js';
import { PythonRunner }           from './runner.js';
import {
  getChallengeProgress, saveChallengeProgress,
  updateLeaderboard, getClassLeaderboard,
  getStudentFeedback, markFeedbackRead
} from './storage.js';

// ── Badges ───────────────────────────────────────────────────────────────────

const BADGES = [
  { id: 'first_step',  label: 'First Step',       desc: 'Complete your first exercise',     threshold: 1,   type: 'total' },
  { id: 'getting_going',label:'Getting Going',     desc: 'Complete 10 exercises',            threshold: 10,  type: 'total' },
  { id: 'halfway',     label: 'Halfway There',     desc: 'Complete 65 exercises',            threshold: 65,  type: 'total' },
  { id: 'master',      label: 'Python Master',     desc: 'Complete all 130 exercises',       threshold: 130, type: 'total' },
  { id: 'var_done',    label: 'Variable Virtuoso', desc: 'Complete all Variables exercises', category: 'variables'  },
  { id: 'ops_done',    label: 'Operator Pro',      desc: 'Complete all Operators exercises', category: 'operators'  },
  { id: 'sel_done',    label: 'Decision Maker',    desc: 'Complete all Selection exercises', category: 'selection'  },
  { id: 'itr_done',    label: 'Loop Legend',       desc: 'Complete all Iteration exercises', category: 'iteration'  },
  { id: 'lst_done',    label: 'List Master',       desc: 'Complete all Lists exercises',     category: 'lists'      },
  { id: 'fn_done',     label: 'Function Wizard',   desc: 'Complete all Functions exercises', category: 'functions'  },
  { id: 'xp_100',      label: 'XP 100',            desc: 'Earn 100 XP',                      threshold: 100, type: 'xp'   },
  { id: 'xp_500',      label: 'XP 500',            desc: 'Earn 500 XP',                      threshold: 500, type: 'xp'   },
  { id: 'xp_1000',     label: 'XP 1000',           desc: 'Earn 1000 XP',                     threshold:1000, type: 'xp'   },
];

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500, 5000];

function xpToLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function xpBarPercent(xp) {
  const level = xpToLevel(xp);
  const lo = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const hi = LEVEL_THRESHOLDS[level]     ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return hi > lo ? Math.round(((xp - lo) / (hi - lo)) * 100) : 100;
}

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════════════════════════════════
// CHALLENGE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class ChallengeManager {
  constructor({ editor, appendOutput, clearOutput, onXpChange, onExerciseLoad }) {
    this.editor         = editor;
    this.appendOutput   = appendOutput;
    this.clearOutput    = clearOutput;
    this.onXpChange     = onXpChange;
    this.onExerciseLoad = onExerciseLoad;

    this.uid            = null;
    this.classCode      = '';
    this._displayName   = '';
    this.role           = 'student';
    this.progress       = { completed: {}, totalXP: 0, badges: [], submissions: {} };
    this.currentExercise = null;
    this._hintIndex     = 0;
    this._autoSaveTimer = null;
    this._feedback      = {};

    // DOM refs
    this.challengeList  = $('challenge-list');
    this.challengePanel = $('challenge-panel');
    this.panelTitle     = $('ch-panel-title');
    this.panelBody      = $('ch-panel-body');
    this.panelBadge     = $('ch-panel-badge');
    this.testResults    = $('ch-test-results');
    this.feedbackEl     = $('ch-feedback');
    this.closePanelBtn  = $('btn-close-challenge');
    this.hintBtn        = $('btn-hint');
    this.xpDisplay      = $('ch-xp-display');
    this.levelDisplay   = $('ch-level-display');
    this.xpBarFill      = $('ch-xp-bar-fill');
    this.badgeToast     = $('badge-toast');

    this._bindPanelEvents();
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  async init(uid, classCode = '', displayName = '', role = 'student') {
    this.uid          = uid;
    this.classCode    = classCode;
    this._displayName = displayName;
    this.role         = role;
    try {
      const [saved, feedback] = await Promise.all([
        getChallengeProgress(uid),
        getStudentFeedback(uid).catch(() => ({}))
      ]);
      if (saved)    this.progress  = saved;
      if (feedback) this._feedback = feedback;
    } catch (e) {
      console.warn('Could not load challenge progress:', e);
    }
    this.renderSidebar();
    this._updateXpDisplay();

    // Auto-save code for current exercise
    this.editor.onChange(() => {
      if (!this.currentExercise) return;
      clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = setTimeout(() => {
        this._saveCodeForExercise(this.currentExercise.id, this.editor.getValue());
      }, 1500);
    });
  }

  reset() {
    this.uid         = null;
    this.classCode   = '';
    this.progress    = { completed: {}, totalXP: 0, badges: [], submissions: {} };
    this._feedback   = {};
    this.currentExercise = null;
    if (this.challengePanel) this.challengePanel.classList.add('hidden');
  }

  // ── Sidebar rendering ─────────────────────────────────────────────────────

  renderSidebar() {
    if (!this.challengeList) return;

    const completed = this.progress.completed ?? {};

    // Group exercises by category
    const byCategory = {};
    EXERCISES.forEach(ex => {
      if (!byCategory[ex.category]) byCategory[ex.category] = [];
      byCategory[ex.category].push(ex);
    });

    this.challengeList.innerHTML = CATEGORIES.map(cat => {
      const exList  = byCategory[cat.id] ?? [];
      const doneCount = exList.filter(e => completed[e.id]).length;
      const pct     = exList.length ? Math.round((doneCount / exList.length) * 100) : 0;

      const isOpen = localStorage.getItem(`ch_cat_${cat.id}`) !== 'closed';

      const items = exList.map(ex => {
        const isDone     = !!completed[ex.id];
        const isActive   = this.currentExercise?.id === ex.id;
        const fb         = this._feedback[ex.id];
        const hasUnread  = fb && !fb.readAt;
        return `<div class="ch-exercise-item ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}"
                     data-id="${ex.id}" title="${ex.title}">
          <span class="ch-ex-status">${isDone ? '✓' : '○'}</span>
          <span class="ch-ex-name">${escHtml(ex.title)}</span>
          ${hasUnread ? '<span class="ch-ex-feedback-dot" title="New teacher feedback">●</span>' : ''}
          <span class="ch-ex-diff diff-${ex.difficulty}">${ex.difficulty[0].toUpperCase()}</span>
          <span class="ch-ex-xp">${ex.xp}xp</span>
        </div>`;
      }).join('');

      return `<div class="ch-category ${isOpen ? 'open' : ''}" data-cat="${cat.id}">
        <div class="ch-category-header">
          <span class="ch-category-name">${cat.icon} ${cat.label}</span>
          <span class="ch-category-progress">${doneCount}/${exList.length}</span>
          <span class="ch-category-chevron">▶</span>
        </div>
        <div class="ch-category-bar"><div class="ch-category-bar-fill" style="width:${pct}%"></div></div>
        <div class="ch-exercise-list">${items}</div>
      </div>`;
    }).join('');

    // Category toggle
    this.challengeList.querySelectorAll('.ch-category-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const cat = hdr.closest('.ch-category');
        cat.classList.toggle('open');
        localStorage.setItem(`ch_cat_${cat.dataset.cat}`,
          cat.classList.contains('open') ? 'open' : 'closed');
      });
    });

    // Exercise click
    this.challengeList.querySelectorAll('.ch-exercise-item').forEach(item => {
      item.addEventListener('click', () => {
        const ex = EXERCISES.find(e => e.id === item.dataset.id);
        if (ex) this.loadExercise(ex);
      });
    });
  }

  // ── Load exercise ─────────────────────────────────────────────────────────

  loadExercise(ex) {
    this.currentExercise = ex;
    this._hintIndex      = 0;

    // Restore saved code or use starter code
    const savedCode = this.progress.submissions?.[ex.id]?.code;
    this.editor.setValue(savedCode ?? ex.starterCode ?? '');
    this.clearOutput();

    // Populate panel
    this.panelTitle.textContent  = ex.title;
    this.panelBadge.textContent  = ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1);
    this.panelBadge.className    = `ch-difficulty-badge badge-${ex.difficulty}`;
    this.panelBody.innerHTML     = ex.description;
    this.testResults.innerHTML   = '';

    // Show teacher feedback if present
    const fb = this._feedback[ex.id];
    if (fb && this.feedbackEl) {
      const isUnread = !fb.readAt;
      this.feedbackEl.className = 'ch-feedback' + (isUnread ? ' ch-feedback--unread' : '');
      this.feedbackEl.innerHTML = `<span class="ch-feedback-icon">💬</span><span class="ch-feedback-text">${escHtml(fb.comment)}</span>`;
      if (isUnread && this.uid) {
        markFeedbackRead(this.uid, ex.id).then(() => {
          this._feedback[ex.id] = { ...fb, readAt: Date.now() };
          this.feedbackEl.classList.remove('ch-feedback--unread');
          this.renderSidebar();
        }).catch(() => {});
      }
    } else if (this.feedbackEl) {
      this.feedbackEl.className = 'ch-feedback hidden';
      this.feedbackEl.innerHTML = '';
    }

    if (this.challengePanel) this.challengePanel.classList.remove('hidden');
    this.renderSidebar();
    this.onExerciseLoad(ex.title);
    this.editor.focus();
  }

  // ── Run tests ─────────────────────────────────────────────────────────────

  async runTests(source) {
    if (!this.currentExercise) return false;
    const ex = this.currentExercise;

    // Track attempt count and last active time
    if (!this.progress.attempts) this.progress.attempts = {};
    this.progress.attempts[ex.id] = (this.progress.attempts[ex.id] ?? 0) + 1;
    this.progress.lastRunAt = Date.now();

    this.testResults.innerHTML = '<div class="ch-test-header">Running tests…</div>';

    // ── Input type convention check ───────────────────────────────────────────
    if (ex.inputType) {
      const needsInt   = ex.inputType === 'int'   || ex.inputType === 'int_float';
      const needsFloat = ex.inputType === 'float' || ex.inputType === 'int_float';
      const hasInt     = /\bint\s*\(\s*input\s*\(/.test(source);
      const hasFloat   = /\bfloat\s*\(\s*input\s*\(/.test(source);

      const missing = [];
      if (needsInt   && !hasInt)   missing.push('int(input(...))');
      if (needsFloat && !hasFloat) missing.push('float(input(...))');

      if (missing.length) {
        const msg = `Input values must be converted to numbers. Use ${missing.join(' and ')} when reading numeric input.`;
        this._renderTestResults([{ pass: false, message: msg }], false);
        return false;
      }
    }

    const runner = new PythonRunner({
      onOutput: () => {}, onError: () => {}, onComplete: () => {}, onInputRequest: () => Promise.resolve(''),
      turtleTarget: null
    });

    const results = [];

    for (const tc of ex.tests) {
      const { outputs, error } = await runner.runForTests(source, tc.inputs);

      if (error) {
        results.push({ pass: false, expected: tc.expected, got: [`Error: ${error}`] });
        continue;
      }

      // Compare outputs
      const pass = this._compareOutputs(outputs, tc.expected);
      results.push({ pass, expected: tc.expected, got: outputs });
    }

    const allPass = results.every(r => r.pass);
    this._renderTestResults(results, allPass);

    if (allPass) {
      await this._markComplete(ex);
    }

    return allPass;
  }

  _compareOutputs(got, expected) {
    // Strip trailing empty lines from both
    const clean = arr => {
      const a = [...arr];
      while (a.length && a[a.length-1] === '') a.pop();
      return a;
    };
    // Normalise quoted strings: "text" and 'text' compare equal; \' allowed inside '...'
    const normQ = s => {
      const dq = /^"((?:[^"\\]|\\.)*)"$/.exec(s);
      if (dq) return dq[1].replace(/\\"/g, '"');
      const sq = /^'((?:[^'\\]|\\.)*)'$/.exec(s);
      if (sq) return sq[1].replace(/\\'/g, "'");
      return s;
    };
    const g = clean(got.map(l => normQ(l.trimEnd())));
    const e = clean(expected.map(l => normQ(l.trimEnd())));
    if (g.length !== e.length) return false;
    return g.every((line, i) => line === e[i]);
  }

  _renderTestResults(results, allPass) {
    const total = results.length;
    const passed = results.filter(r => r.pass).length;

    let html = `<div class="ch-test-header">Tests: ${passed}/${total} passed</div>`;

    results.forEach((r, i) => {
      const icon = r.pass ? '✓' : '✗';
      const cls  = r.pass ? 'test-pass' : 'test-fail';
      if (r.message) {
        html += `<div class="test-case ${cls}">
          <span class="test-icon">${icon}</span>
          <div class="test-detail"><code>${escHtml(r.message)}</code></div>
        </div>`;
      } else {
        html += `<div class="test-case ${cls}">
          <span class="test-icon">${icon}</span>
          <div class="test-detail">
            <code>Expected: ${escHtml(r.expected.slice(0,3).join(' | '))}</code>
            ${!r.pass ? `<code>Got:      ${escHtml(r.got.slice(0,3).join(' | '))}</code>` : ''}
          </div>
        </div>`;
      }
    });

    if (allPass) {
      const xp = this.currentExercise?.xp ?? 0;
      const already = this.progress.completed?.[this.currentExercise?.id];
      html += `<div class="ch-success-banner">
        ✓ All tests passed!
        ${!already ? `<span class="ch-xp-award">+${xp} XP</span>` : ''}
      </div>`;
    }

    this.testResults.innerHTML = html;
  }

  // ── Mark complete ─────────────────────────────────────────────────────────

  async _markComplete(ex) {
    const alreadyDone = this.progress.completed?.[ex.id];
    if (!this.progress.completed) this.progress.completed = {};
    if (!alreadyDone) this.progress.completed[ex.id] = { completedAt: Date.now() };
    this.progress.lastRunAt = Date.now();

    if (!alreadyDone) {
      this.progress.totalXP = (this.progress.totalXP ?? 0) + ex.xp;
    }

    this._checkBadges(ex);
    this._updateXpDisplay();

    try {
      await saveChallengeProgress(this.uid, this.progress);
      if (this.classCode) {
        await updateLeaderboard(this.uid, this.classCode, this._displayName, this.progress.totalXP);
      }
    } catch (e) {
      console.warn('Could not save progress:', e);
    }
    this.renderSidebar();
  }

  // ── Badges ────────────────────────────────────────────────────────────────

  _checkBadges(completedEx) {
    const earned = new Set(this.progress.badges ?? []);
    const newBadges = [];
    const completed = this.progress.completed ?? {};
    const totalDone = Object.keys(completed).length;
    const totalXP   = this.progress.totalXP ?? 0;

    for (const badge of BADGES) {
      if (earned.has(badge.id)) continue;

      let shouldEarn = false;

      if (badge.type === 'total') {
        shouldEarn = totalDone >= badge.threshold;
      } else if (badge.type === 'xp') {
        shouldEarn = totalXP >= badge.threshold;
      } else if (badge.category) {
        const catExercises = EXERCISES.filter(e => e.category === badge.category);
        shouldEarn = catExercises.every(e => !!completed[e.id]);
      }

      if (shouldEarn) {
        earned.add(badge.id);
        newBadges.push(badge);
      }
    }

    if (newBadges.length) {
      this.progress.badges = [...earned];
      newBadges.forEach(b => this._showBadgeToast(b));
    }
  }

  _showBadgeToast(badge) {
    if (!this.badgeToast) return;
    const titleEl = $('badge-toast-title');
    const descEl  = $('badge-toast-desc');
    if (titleEl) titleEl.textContent = badge.label;
    if (descEl)  descEl.textContent  = badge.desc;
    this.badgeToast.classList.remove('hidden');
    setTimeout(() => this.badgeToast.classList.add('hidden'), 4000);
  }

  // ── XP display ────────────────────────────────────────────────────────────

  _updateXpDisplay() {
    const xp    = this.progress.totalXP ?? 0;
    const level = xpToLevel(xp);
    const pct   = xpBarPercent(xp);

    if (this.xpDisplay)    this.xpDisplay.textContent   = `${xp} XP`;
    if (this.levelDisplay) this.levelDisplay.textContent = `Level ${level}`;
    if (this.xpBarFill)    this.xpBarFill.style.width    = `${pct}%`;
    this.onXpChange?.(xp, level);
  }

  // ── Hint ──────────────────────────────────────────────────────────────────

  showHint() {
    if (!this.currentExercise) return;
    const hints = this.currentExercise.hints ?? [];
    if (!hints.length) {
      this.appendOutput('No hints available for this exercise.', 'info');
      return;
    }
    const hint = hints[this._hintIndex % hints.length];
    this._hintIndex++;

    // Track hint usage
    if (!this.progress.hintsUsed) this.progress.hintsUsed = {};
    this.progress.hintsUsed[this.currentExercise.id] =
      (this.progress.hintsUsed[this.currentExercise.id] ?? 0) + 1;

    // Show hint in panel body
    let hintEl = this.panelBody.querySelector('.ch-hint');
    if (!hintEl) {
      hintEl = document.createElement('div');
      hintEl.className = 'ch-hint';
      this.panelBody.appendChild(hintEl);
    }
    hintEl.innerHTML = `<div class="ch-hint-label">💡 Hint ${this._hintIndex}/${hints.length}</div>${escHtml(hint)}`;
    hintEl.classList.add('visible');
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────

  async showLeaderboard() {
    const modal   = $('leaderboard-modal');
    const content = $('leaderboard-content');
    if (!modal || !content) return;

    content.innerHTML = '<p style="color:var(--text-muted)">Loading…</p>';
    modal.classList.remove('hidden');

    try {
      const entries = await getClassLeaderboard(this.classCode);
      if (!entries.length) {
        content.innerHTML = '<p style="color:var(--text-muted)">No entries yet for your class.</p>';
        return;
      }
      const rows = entries.map((e, i) => {
        const rankCls = i === 0 ? 'lb-rank-1' : i === 1 ? 'lb-rank-2' : i === 2 ? 'lb-rank-3' : '';
        const isMe    = e.uid === this.uid;
        return `<tr class="${isMe ? 'me' : ''}">
          <td class="lb-rank ${rankCls}">${['🥇','🥈','🥉'][i] ?? (i+1)}</td>
          <td>${escHtml(e.displayName ?? 'Unknown')}</td>
          <td>${e.totalXP ?? 0} XP</td>
        </tr>`;
      }).join('');

      content.innerHTML = `<table class="leaderboard-table">
        <thead><tr><th>#</th><th>Name</th><th>XP</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    } catch (err) {
      content.innerHTML = `<p style="color:var(--error)">Could not load leaderboard: ${escHtml(err.message)}</p>`;
    }
  }

  // ── Close panel ───────────────────────────────────────────────────────────

  closePanel() {
    this.currentExercise = null;
    if (this.challengePanel) this.challengePanel.classList.add('hidden');
    this.onExerciseLoad(null);
    this.renderSidebar();
  }

  // ── Save code per exercise ────────────────────────────────────────────────

  async _saveCodeForExercise(exId, code) {
    if (!this.progress.submissions) this.progress.submissions = {};
    this.progress.submissions[exId] = { code, savedAt: Date.now() };
    try { await saveChallengeProgress(this.uid, this.progress); }
    catch (e) { /* silent */ }
  }

  // ── DOM events ────────────────────────────────────────────────────────────

  _bindPanelEvents() {
    this.closePanelBtn?.addEventListener('click', () => this.closePanel());
    this.hintBtn?.addEventListener('click', () => this.showHint());

    $('btn-leaderboard')?.addEventListener('click', () => this.showLeaderboard());
    $('leaderboard-close')?.addEventListener('click', () => {
      $('leaderboard-modal')?.classList.add('hidden');
    });
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────
function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
