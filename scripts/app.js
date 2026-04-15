// ─── App Controller ────────────────────────────────────────────────────────────

import { onAuth, signIn, signOutUser, resetPassword, updateUserClassCode } from './auth.js';
import { Editor, findNonSnakeCase }      from './editor.js';
import { PythonRunner, detectConstructs, pep8Lint } from './runner.js';
import { renderDashboard, initDashboard } from './dashboard.js';
import { ChallengeManager }              from './challenges.js';
import { renderAdmin, initAdmin }        from './admin.js';
import { QuizManager }                   from './quiz.js';
import { initSuggestions, teardownSuggestions, setupSuggestionsUI } from './suggestions.js';
import {
  saveNewProgram, updateProgram, loadProgram,
  listPrograms, deleteProgram, renameProgram, saveSession
} from './storage.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const loginPage         = $('login-page');
const appEl             = $('app');
const signInForm        = $('signin-form');
const loginError        = $('signin-error');
const userNameEl        = $('user-name-display');
const userRoleBadge     = $('user-role-badge');
const signOutBtn        = $('btn-logout');
const dashboardBtn      = $('btn-dashboard');
const adminBtn          = $('btn-admin');

const newProgramBtn     = $('btn-new-program');
const programList       = $('program-list');
const importBtn         = $('btn-import-py');
const exportBtn         = $('btn-export-py');
const fileInputPy       = $('file-input-py');

const runBtn            = $('btn-run');
const stopBtn           = $('btn-stop');
const saveBtn           = $('btn-save');
const saveStatus        = $('save-status');

const editorTextarea    = $('code-editor');
const editorHighlight   = $('editor-highlight');
const editorGutter      = $('editor-gutter');
const programTitleEl    = $('program-title-display');
const editorTabEl       = $('active-tab');
const tabFilename       = $('tab-filename');
const tabDirty          = $('tab-dirty');

const outputConsole     = $('output-console');
const outputTurtle      = $('output-turtle');
const errorsPanel       = $('output-errors');
const errorBadge        = $('error-badge');
const outputTabs        = document.querySelectorAll('.output-tab');
const clearOutputBtn    = $('btn-clear-output');
const consoleMascot     = $('console-mascot');

const renameModal       = $('rename-modal');
const renameInput       = $('rename-input');
const renameConfirm     = $('rename-confirm');
const renameCancel      = $('rename-cancel');

const teacherDash       = $('teacher-dashboard');
const closeDashBtn      = $('btn-close-dashboard');
const dashboardGrid     = $('dashboard-grid');

const adminPanel        = $('admin-panel');
const closeAdminBtn     = $('btn-close-admin');
const adminContent      = $('admin-content');

const quizPanel         = $('quiz-panel');
const quizBtn           = $('btn-quiz');
const closeQuizBtn      = $('btn-close-quiz');

const themeToggleBtn    = $('btn-theme');
const themeIconDark     = $('theme-icon-dark');
const themeIconLight    = $('theme-icon-light');
const themeLabel        = $('theme-label');
const fontToggleBtn     = $('btn-font');
const refPanelBtn       = $('btn-ref-panel');
const refPanel          = $('ref-panel');
const refCloseBtn       = $('btn-close-ref');
const explorerBtn       = $('btn-explorer');
const explorerCloseBtn  = $('btn-close-explorer');

const statusLineCol     = $('status-line-col');
const statusExecState   = $('status-exec-state');
const statusClassCode   = $('status-class-code');
const classCodeBtn      = $('btn-class-code');
const classModal        = $('class-modal');
const classInput        = $('class-input');
const classConfirm      = $('class-confirm');
const classCancel       = $('class-cancel');
const outputPanel       = $('output-panel');
const resizeHandle      = $('panel-resize-handle');
const pep8Indicator     = $('pep8-indicator');
const sidebar           = $('sidebar');
const tabPrograms       = $('tab-programs');
const tabChallenges     = $('tab-challenges');
const sidebarProgView   = $('sidebar-programs-view');
const sidebarChalView   = $('sidebar-challenges-view');
const checkSnakeCase    = $('check-snake-case');
const checkAutoIndent   = $('auto-indent');
const programSearch     = $('program-search');

// ── State ─────────────────────────────────────────────────────────────────────

const quiz = new QuizManager();
let _quizMounted = false;

let currentUser      = null;
let currentProfile   = null;
let currentProgramId = null;
let currentTitle     = 'Untitled Program';
let isDirty          = false;
let isRunning        = false;
let runStartTime     = 0;
let _allPrograms     = [];  // cache for search

// ── Editor ────────────────────────────────────────────────────────────────────

const editor = new Editor({
  textarea:  editorTextarea,
  highlight: editorHighlight,
  gutter:    editorGutter
});

// ── Python Runner ─────────────────────────────────────────────────────────────

let _activeInputEl = null;  // the inline <input> currently awaiting user input

const runner = new PythonRunner({
  onOutput: (text, type) => appendOutput(text, type),
  onError:  (msg, lineno) => {
    appendOutput(msg, 'stderr');
    showErrorInPanel(msg);
  },
  onComplete: () => {
    setRunning(false);
    saveSessionData(editor.getValue(), false);
  },
  onInputRequest: (_prompt) => {
    // _prompt was already printed to console by runner.js onOutput call
    return new Promise(resolve => {
      setOutputTab('console');

      const inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.className = 'console-inline-input';
      inputEl.autocomplete = 'off';
      inputEl.spellcheck = false;
      outputConsole.appendChild(inputEl);
      outputConsole.scrollTop = outputConsole.scrollHeight;
      inputEl.focus();
      _activeInputEl = inputEl;

      function submit() {
        const val = inputEl.value;
        // Replace input with echoed text
        const echo = document.createElement('span');
        echo.className = 'output-line out-stdin';
        echo.textContent = val;
        outputConsole.replaceChild(echo, inputEl);
        outputConsole.appendChild(document.createElement('br'));
        _activeInputEl = null;
        resolve(val);
      }

      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); submit(); }
      });
    });
  },
  turtleTarget: outputTurtle,
});

// ── Challenges ────────────────────────────────────────────────────────────────

const challenges = new ChallengeManager({
  editor,
  appendOutput,
  clearOutput,
  onXpChange: () => {},
  onExerciseLoad: (title) => {
    if (title) {
      if (tabFilename)    tabFilename.textContent  = title;
      if (tabDirty)       tabDirty.classList.add('hidden');
      if (programTitleEl) programTitleEl.textContent = title;
      clearOutput();
    } else {
      setTitle(currentTitle);
      updateTabState();
    }
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════

onAuth(async (user, profile) => {
  currentUser    = user;
  currentProfile = profile;

  if (!user) { teardownSuggestions(); show(loginPage); hide(appEl); return; }

  hide(loginPage);
  show(appEl);

  const isSuperAdmin = profile?.role === 'superadmin';
  const isTeacher    = profile?.role === 'teacher' || isSuperAdmin;
  const isStudent    = profile?.role === 'student';

  if (userNameEl)   userNameEl.textContent = profile?.displayName ?? user.email;
  if (userRoleBadge) {
    userRoleBadge.textContent = isSuperAdmin ? 'Super Admin' : (isTeacher ? 'Teacher' : 'Student');
    userRoleBadge.classList.toggle('role-badge--superadmin', isSuperAdmin);
  }

  dashboardBtn?.classList.toggle('hidden', !isTeacher);
  adminBtn?.classList.toggle('hidden', !isSuperAdmin && !isTeacher);

  document.querySelectorAll('.teacher-only').forEach(el => el.classList.toggle('hidden', !isTeacher));
  document.querySelectorAll('.superadmin-only').forEach(el => el.classList.toggle('hidden', !isSuperAdmin));
  document.querySelectorAll('.student-only').forEach(el => el.classList.toggle('hidden', !isStudent));

  if (isStudent) updateClassDisplay(profile?.classCode);

  initAdmin(user, profile);
  initDashboard(user, profile);
  initSuggestions(user, profile);
  quiz.init(user.uid);

  await refreshProgramList();
  newProgram();
  await challenges.init(user.uid, profile?.classCode ?? '', profile?.displayName ?? user.email, profile?.role ?? 'student');
});

// Password show/hide
document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = $(btn.dataset.target);
    if (!input) return;
    const showing = input.classList.toggle('pw-masked');
    btn.querySelector('.pw-eye')?.classList.toggle('hidden', showing);
    btn.querySelector('.pw-eye-off')?.classList.toggle('hidden', !showing);
  });
});

signInForm?.addEventListener('submit', async e => {
  e.preventDefault();
  clearAuthError(loginError);
  const btn = $('signin-btn');
  setLoading(btn, true);
  try {
    await signIn($('signin-email').value.trim(), $('signin-password').value);
  } catch (err) {
    showAuthError(loginError, friendlyAuthError(err));
  } finally {
    setLoading(btn, false);
  }
});

// Forgot password
$('forgot-password-btn')?.addEventListener('click', () => {
  const resetEmail = $('reset-email');
  if (resetEmail) resetEmail.value = $('signin-email')?.value ?? '';
  $('reset-error')?.classList.add('hidden');
  $('reset-panel')?.classList.remove('hidden');
  $('reset-email')?.focus();
});
$('reset-cancel-btn')?.addEventListener('click', () => $('reset-panel')?.classList.add('hidden'));
$('reset-submit-btn')?.addEventListener('click', async () => {
  const email = $('reset-email')?.value.trim();
  const errEl = $('reset-error');
  if (!email) { showAuthError(errEl, 'Enter your email.'); return; }
  try {
    await resetPassword(email);
    if (errEl) {
      errEl.textContent = `Reset link sent to ${email}.`;
      errEl.style.color = 'var(--accent)';
      errEl.classList.remove('hidden');
    }
    setTimeout(() => $('reset-panel')?.classList.add('hidden'), 3000);
  } catch (err) { showAuthError(errEl, friendlyAuthError(err)); }
});

signOutBtn?.addEventListener('click', async () => {
  if (!confirmDirty()) return;
  challenges.reset();
  await signOutUser();
});

setupSuggestionsUI();

// ══════════════════════════════════════════════════════════════════════════════
// PROGRAM MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

async function refreshProgramList() {
  if (!currentUser) return;
  programList.innerHTML = '<div class="program-list-empty">Loading…</div>';
  try {
    _allPrograms = await listPrograms(currentUser.uid);
    renderProgramList(_allPrograms);
  } catch (err) {
    programList.innerHTML = `<div class="program-list-empty">Failed to load.<br><small>${escHtml(err.message)}</small></div>`;
  }
}

function renderProgramList(programs) {
  if (!programs.length) {
    programList.innerHTML = '<div class="program-list-empty">No saved programs yet.<br>Click <strong>+ New</strong> to start.</div>';
    return;
  }
  programList.innerHTML = programs.map(p => `
    <div class="program-item ${p.id === currentProgramId ? 'active' : ''}" data-id="${p.id}">
      <span class="program-item-name">${escHtml(p.title)}</span>
      <span class="program-item-actions">
        <button class="prog-rename icon-btn" data-id="${p.id}" title="Rename">✎</button>
        <button class="prog-delete icon-btn" data-id="${p.id}" title="Delete">✕</button>
      </span>
    </div>`).join('');

  programList.querySelectorAll('.program-item').forEach(el => {
    el.addEventListener('click', async e => {
      if (e.target.closest('button')) return;
      if (!confirmDirty()) return;
      await openProgram(el.dataset.id);
    });
  });
  programList.querySelectorAll('.prog-rename').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); showRenameModal(btn.dataset.id); });
  });
  programList.querySelectorAll('.prog-delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Delete this program? This cannot be undone.')) return;
      await deleteProgram(btn.dataset.id);
      if (btn.dataset.id === currentProgramId) newProgram();
      await refreshProgramList();
    });
  });
}

function newProgram() {
  currentProgramId = null;
  currentTitle     = 'Untitled Program';
  isDirty          = false;
  editor.setValue('');
  setTitle('Untitled Program');
  setSaveStatus('');
  clearOutput();
  updateTabState();
}

async function openProgram(id) {
  const prog = await loadProgram(id);
  if (!prog) return;
  currentProgramId = id;
  currentTitle     = prog.title;
  isDirty          = false;
  editor.setValue(prog.source ?? '');
  setTitle(prog.title);
  setSaveStatus('');
  clearOutput();
  updateTabState();
  renderProgramList(_allPrograms);
}

async function saveProgram() {
  const source = editor.getValue();
  const title  = currentTitle;
  try {
    if (currentProgramId) {
      await updateProgram(currentProgramId, { title, source });
    } else {
      currentProgramId = await saveNewProgram(currentUser.uid, { title, source });
    }
    isDirty = false;
    updateTabState();
    setSaveStatus('Saved');
    setTimeout(() => setSaveStatus(''), 2000);
    _allPrograms = await listPrograms(currentUser.uid);
    renderProgramList(_allPrograms);
  } catch (err) {
    setSaveStatus('Save failed');
    console.error(err);
  }
}

newProgramBtn?.addEventListener('click', () => {
  if (!confirmDirty()) return;
  newProgram();
});

saveBtn?.addEventListener('click', () => saveProgram());

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (currentUser && !challenges.currentExercise) saveProgram();
  }
  if (e.key === 'F5') { e.preventDefault(); handleRun(); }
  if (e.key === 'Escape' && isRunning) stopRun();
});

// Search programs
programSearch?.addEventListener('input', () => {
  const q = programSearch.value.trim().toLowerCase();
  renderProgramList(q ? _allPrograms.filter(p => p.title.toLowerCase().includes(q)) : _allPrograms);
});

// Import
importBtn?.addEventListener('click', () => fileInputPy?.click());
fileInputPy?.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    if (!confirmDirty()) return;
    const content = ev.target.result;
    currentProgramId = null;
    currentTitle     = file.name.replace(/\.py$/, '');
    isDirty          = true;
    editor.setValue(content);
    setTitle(currentTitle);
    updateTabState();
    fileInputPy.value = '';
  };
  reader.readAsText(file);
});

// Export
exportBtn?.addEventListener('click', () => {
  const source = editor.getValue();
  const blob   = new Blob([source], { type: 'text/x-python' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `${currentTitle.replace(/[^a-z0-9_]/gi, '_')}.py`;
  a.click();
  URL.revokeObjectURL(url);
});

// Rename modal
let _renamingId = null;
function showRenameModal(id) {
  _renamingId = id;
  const prog = _allPrograms.find(p => p.id === id);
  if (renameInput) renameInput.value = prog?.title ?? '';
  renameModal?.classList.remove('hidden');
  renameInput?.focus();
}
renameConfirm?.addEventListener('click', async () => {
  const newTitle = renameInput?.value.trim();
  if (!newTitle) return;
  await renameProgram(_renamingId, newTitle);
  if (_renamingId === currentProgramId) {
    currentTitle = newTitle;
    setTitle(newTitle);
  }
  renameModal?.classList.add('hidden');
  _allPrograms = await listPrograms(currentUser.uid);
  renderProgramList(_allPrograms);
});
renameCancel?.addEventListener('click', () => renameModal?.classList.add('hidden'));
renameModal?.addEventListener('click', e => { if (e.target === renameModal) renameModal.classList.add('hidden'); });

// ══════════════════════════════════════════════════════════════════════════════
// RUN / STOP
// ══════════════════════════════════════════════════════════════════════════════

runBtn?.addEventListener('click', handleRun);
stopBtn?.addEventListener('click', stopRun);

async function handleRun() {
  if (isRunning) return;
  const source = editor.getValue().trim();
  if (!source) return;

  clearOutput();
  setRunning(true);

  // Check if it's an exercise
  if (challenges.currentExercise) {
    const allPass = await challenges.runTests(source);
    // Also run it for the student to see output
    await runner.run(source);
    return;
  }

  // Check for turtle graphics
  const hasTurtle = /\bimport\s+turtle\b|\bfrom\s+turtle\b/.test(source);
  if (hasTurtle) {
    setOutputTab('turtle');
    if (outputTurtle) outputTurtle.innerHTML = '';  // Skulpt will create a fresh canvas
  } else {
    setOutputTab('console');
  }

  runStartTime = Date.now();
  await runner.run(source);
}

function stopRun() {
  runner.stop();
  setRunning(false);
  // Remove any pending inline input and resolve it
  if (_activeInputEl) {
    _activeInputEl.remove();
    _activeInputEl = null;
  }
  appendOutput('\n[Execution stopped]', 'info');
}

function setRunning(running) {
  isRunning = running;
  runBtn?.classList.toggle('hidden', running);
  stopBtn?.classList.toggle('hidden', !running);
  if (statusExecState) statusExecState.textContent = running ? 'Running…' : 'Ready';
  if (consoleMascot) consoleMascot.src = running
    ? 'assets/sammy_snake_presenter.png'
    : 'assets/sammy_snake_snoozing.png';
}

// ── Admin-created user event (restore session note) ───────────────────────────
window.addEventListener('admin-created-user', e => {
  // After creating a user, Firebase signs in the new user.
  // The admin must re-sign-in. We show a modal with a message.
  if (currentUser) return; // onAuth already fired
  setTimeout(() => {
    alert('User created successfully. Please sign in again as admin.');
  }, 500);
});

// ══════════════════════════════════════════════════════════════════════════════
// OUTPUT
// ══════════════════════════════════════════════════════════════════════════════

function appendOutput(text, type = 'stdout') {
  const el = outputConsole;
  if (!el) return;

  // Remove placeholder
  el.querySelector('.output-placeholder')?.remove();

  const span = document.createElement('span');
  span.className = `output-line out-${type}`;

  // text might include newlines — split and add multiple spans
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (i > 0) el.appendChild(document.createElement('br'));
    const s = document.createElement('span');
    s.className = `output-line out-${type}`;
    s.textContent = line;
    el.appendChild(s);
  });

  // Auto-scroll
  el.scrollTop = el.scrollHeight;
}

function clearOutput() {
  if (outputConsole) outputConsole.innerHTML = '<div class="output-placeholder">Program output will appear here…</div>';
  if (errorsPanel) errorsPanel.innerHTML = '<div class="output-placeholder">No problems detected.</div>';
  if (errorBadge) { errorBadge.textContent = '0'; errorBadge.classList.add('hidden'); }
  // Clear turtle div (Skulpt recreates its canvas on next run)
  if (outputTurtle) outputTurtle.innerHTML = '';
  _activeInputEl = null;
}

function showErrorInPanel(msg) {
  if (!errorsPanel) return;
  errorsPanel.querySelector('.output-placeholder')?.remove();
  const div = document.createElement('div');
  div.className = 'output-line out-stderr';
  div.textContent = msg;
  errorsPanel.appendChild(div);
  const count = errorsPanel.querySelectorAll('.output-line').length;
  if (errorBadge) { errorBadge.textContent = count; errorBadge.classList.remove('hidden'); }
}

clearOutputBtn?.addEventListener('click', () => clearOutput());

// Output tabs
outputTabs.forEach(tab => {
  tab.addEventListener('click', () => setOutputTab(tab.dataset.panel));
});

function setOutputTab(panel) {
  outputTabs.forEach(t => t.classList.toggle('active', t.dataset.panel === panel));
  if (outputConsole) outputConsole.classList.toggle('hidden', panel !== 'console');
  if (outputTurtle)  outputTurtle.classList.toggle('hidden',  panel !== 'turtle');
  if (errorsPanel)   errorsPanel.classList.toggle('hidden',   panel !== 'errors');
}

// ══════════════════════════════════════════════════════════════════════════════
// EDITOR EVENTS & PEP 8 HINTS
// ══════════════════════════════════════════════════════════════════════════════

editor.onChange(() => {
  if (!challenges.currentExercise) {
    if (!isDirty) { isDirty = true; updateTabState(); }
  }
  updateStatusBar();
  updatePep8Indicator();
});

editorTextarea?.addEventListener('click',   updateStatusBar);
editorTextarea?.addEventListener('keydown', updateStatusBar);

checkSnakeCase?.addEventListener('change', () => {
  editor.setSnakeCase(checkSnakeCase.checked);
  updatePep8Indicator();
});
checkAutoIndent?.addEventListener('change', () => {
  editor.setAutoIndent(checkAutoIndent.checked);
});

function updateStatusBar() {
  const { line, col } = editor.getCursorLineCol();
  if (statusLineCol) statusLineCol.textContent = `Ln ${line}, Col ${col}`;
}

function updatePep8Indicator() {
  if (!pep8Indicator) return;
  const source   = editor.getValue();
  const warnings = pep8Lint(source);
  const snakeIssues = checkSnakeCase?.checked ? findNonSnakeCase(source) : [];
  const total    = warnings.length + snakeIssues.length;
  if (total === 0) {
    pep8Indicator.textContent = 'PEP 8 ✓';
    pep8Indicator.classList.remove('has-warnings');
  } else {
    pep8Indicator.textContent = `PEP 8 ⚠ ${total} hint${total>1?'s':''}`;
    pep8Indicator.classList.add('has-warnings');
    pep8Indicator.title = [
      ...warnings.slice(0,3),
      ...snakeIssues.slice(0,3).map(i => `Line ${i.line+1}: "${i.word}" should be snake_case`)
    ].join('\n');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR TABS
// ══════════════════════════════════════════════════════════════════════════════

function setSidebarView(view) {
  const isCh = view === 'challenges';
  tabPrograms?.classList.toggle('active', !isCh);
  tabChallenges?.classList.toggle('active', isCh);
  sidebarProgView?.classList.toggle('hidden', isCh);
  sidebarChalView?.classList.toggle('hidden', !isCh);
  newProgramBtn?.classList.toggle('hidden', isCh);
  if (programTitleEl) programTitleEl.classList.toggle('hidden', isCh);
  editorTabEl?.classList.toggle('hidden', isCh);
  saveBtn?.classList.toggle('hidden', isCh);
  localStorage.setItem('pylab_sidebarView', view);
}

tabPrograms?.addEventListener('click', () => setSidebarView('programs'));
tabChallenges?.addEventListener('click', () => {
  setSidebarView('challenges');
  challenges.renderSidebar();
});

(function restoreSidebarView() {
  const saved = localStorage.getItem('pylab_sidebarView') ?? 'programs';
  setSidebarView(saved);
})();

// ══════════════════════════════════════════════════════════════════════════════
// THEME, FONT, REF PANEL, EXPLORER
// ══════════════════════════════════════════════════════════════════════════════

(function initTheme() {
  const saved = localStorage.getItem('pylab_theme') ?? 'light';
  applyTheme(saved);
})();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pylab_theme', theme);
  const isDark = theme === 'dark';
  themeIconDark?.classList.toggle('hidden', isDark);
  themeIconLight?.classList.toggle('hidden', !isDark);
  if (themeLabel) themeLabel.textContent = isDark ? 'Light' : 'Dark';
}

themeToggleBtn?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme') ?? 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

(function initFont() {
  if (localStorage.getItem('pylab_font') === 'dyslexic') document.body.classList.add('dyslexic-font');
})();

fontToggleBtn?.addEventListener('click', () => {
  const isDyslexic = document.body.classList.toggle('dyslexic-font');
  localStorage.setItem('pylab_font', isDyslexic ? 'dyslexic' : 'default');
});

// Ref panel
(function initRefPanel() {
  const open = localStorage.getItem('pylab_refPanel') !== 'closed';
  if (!open && refPanel) refPanel.classList.remove('ref-panel--open');
})();

refPanelBtn?.addEventListener('click', () => toggleRefPanel());
refCloseBtn?.addEventListener('click', () => toggleRefPanel(false));

function toggleRefPanel(force) {
  const isOpen = refPanel?.classList.contains('ref-panel--open');
  const newOpen = force !== undefined ? force : !isOpen;
  refPanel?.classList.toggle('ref-panel--open', newOpen);
  localStorage.setItem('pylab_refPanel', newOpen ? 'open' : 'closed');
}

// Explorer
explorerBtn?.addEventListener('click', () => sidebar?.classList.toggle('sidebar--collapsed'));
explorerCloseBtn?.addEventListener('click', () => sidebar?.classList.add('sidebar--collapsed'));

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD & ADMIN
// ══════════════════════════════════════════════════════════════════════════════

dashboardBtn?.addEventListener('click', () => {
  show(teacherDash);
  renderDashboard(dashboardGrid);
});
closeDashBtn?.addEventListener('click', () => hide(teacherDash));

adminBtn?.addEventListener('click', () => {
  show(adminPanel);
  renderAdmin(adminContent);
});
closeAdminBtn?.addEventListener('click', () => hide(adminPanel));

quizBtn?.addEventListener('click', () => {
  show(quizPanel);
  if (!_quizMounted) { quiz.mount(quizPanel); _quizMounted = true; }
});
closeQuizBtn?.addEventListener('click', () => hide(quizPanel));

// ══════════════════════════════════════════════════════════════════════════════
// CLASS CODE
// ══════════════════════════════════════════════════════════════════════════════

classCodeBtn?.addEventListener('click', () => {
  if (classInput) classInput.value = currentProfile?.classCode ?? '';
  classModal?.classList.remove('hidden');
});
classConfirm?.addEventListener('click', async () => {
  const code = classInput?.value.trim().toUpperCase();
  if (!code || !currentUser) return;
  await updateUserClassCode(currentUser.uid, code);
  if (currentProfile) currentProfile.classCode = code;
  updateClassDisplay(code);
  classModal?.classList.add('hidden');
  challenges.classCode = code;
});
classCancel?.addEventListener('click', () => classModal?.classList.add('hidden'));
classModal?.addEventListener('click', e => { if (e.target === classModal) classModal.classList.add('hidden'); });

function updateClassDisplay(code) {
  if (statusClassCode) statusClassCode.textContent = code || '—';
}

// ══════════════════════════════════════════════════════════════════════════════
// OUTPUT PANEL RESIZE
// ══════════════════════════════════════════════════════════════════════════════

let _resizing = false;
let _startY = 0, _startH = 0;

resizeHandle?.addEventListener('mousedown', e => {
  _resizing = true;
  _startY   = e.clientY;
  _startH   = outputPanel?.offsetHeight ?? 220;
  document.body.style.cursor = 'ns-resize';
});

document.addEventListener('mousemove', e => {
  if (!_resizing || !outputPanel) return;
  const delta = _startY - e.clientY;
  const newH  = Math.max(80, Math.min(500, _startH + delta));
  outputPanel.style.height = `${newH}px`;
  document.documentElement.style.setProperty('--output-h', `${newH}px`);
});

document.addEventListener('mouseup', () => {
  if (_resizing) {
    _resizing = false;
    document.body.style.cursor = '';
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS SESSION SAVE
// ══════════════════════════════════════════════════════════════════════════════

async function saveSessionData(source, hadError) {
  if (!currentUser) return;
  try {
    await saveSession(currentUser.uid, currentProfile?.classCode ?? '', {
      hadError,
      duration:   Date.now() - runStartTime,
      lineCount:  source.split('\n').length,
      charCount:  source.length,
      constructs: detectConstructs(source),
      category:   challenges.currentExercise?.category ?? null,
      exerciseId: challenges.currentExercise?.id ?? null,
    });
  } catch (e) { /* analytics are non-critical */ }
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function show(el) { el?.classList.remove('hidden'); }
function hide(el) { el?.classList.add('hidden'); }

function setTitle(title) {
  currentTitle = title;
  if (programTitleEl) programTitleEl.textContent = title;
  if (tabFilename)    tabFilename.textContent = title + '.py';
}

function setSaveStatus(msg) {
  if (saveStatus) saveStatus.textContent = msg;
}

function updateTabState() {
  if (tabDirty) tabDirty.classList.toggle('hidden', !isDirty);
  if (tabFilename) tabFilename.textContent = currentTitle + '.py';
}

function confirmDirty() {
  if (!isDirty) return true;
  return confirm('You have unsaved changes. Discard them?');
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.querySelector('.btn-label')?.classList.toggle('hidden', loading);
  btn.querySelector('.btn-spinner')?.classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

function showAuthError(el, msg) { if (!el) return; el.textContent = msg; el.classList.remove('hidden'); }
function clearAuthError(el)     { if (!el) return; el.textContent = ''; el.classList.add('hidden'); }

function friendlyAuthError(err) {
  const c = err.code ?? '';
  if (c.includes('user-not-found') || c.includes('wrong-password') || c.includes('invalid-credential'))
    return 'Incorrect email or password.';
  if (c.includes('email-already-in-use')) return 'An account with this email already exists.';
  if (c.includes('weak-password'))        return 'Password must be at least 6 characters.';
  if (c.includes('network'))              return 'Network error — check your connection.';
  if (c.includes('too-many-requests'))    return 'Too many failed attempts. Try again later.';
  return err.message ?? 'Authentication failed.';
}

function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Program title rename on click ─────────────────────────────────────────────
programTitleEl?.addEventListener('click', () => {
  if (challenges.currentExercise) return;
  const newTitle = prompt('Rename program:', currentTitle);
  if (newTitle?.trim()) {
    currentTitle = newTitle.trim();
    setTitle(currentTitle);
    isDirty = true;
    updateTabState();
  }
});
