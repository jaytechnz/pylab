// ─── Teacher Dashboard ─────────────────────────────────────────────────────────

import {
  getAllStudents, getSessions, aggregateAnalytics,
  getAllChallengeProgress, getAllTeacherFeedback, saveTeacherFeedback,
  getClassNames, saveClassName
} from './storage.js';
import { EXERCISES, CATEGORIES } from './exercises.js';

let _students    = null;
let _sessions    = null;
let _allProgress = null;
let _feedback    = null;
let _classNames  = {};
let _containerEl = null;

export async function renderDashboard(containerEl) {
  _containerEl = containerEl;
  containerEl.innerHTML = '<p class="dash-loading">Loading dashboard data…</p>';
  try {
    [_students, _sessions, _allProgress] = await Promise.all([
      getAllStudents(), getSessions(), getAllChallengeProgress()
    ]);
    [_feedback, _classNames] = await Promise.all([
      getAllTeacherFeedback().catch(() => ({})),
      getClassNames().catch(() => ({}))
    ]);
  } catch (e) {
    containerEl.innerHTML = `<p class="dash-error">Failed to load dashboard: ${escHtml(e.message)}</p>`;
    return;
  }
  _render(containerEl, null);
}

function _render(container, selectedClass) {
  const students = selectedClass
    ? _students.filter(s => s.classCode === selectedClass)
    : _students;
  const uids = new Set(students.map(s => s.uid));
  const sessions = selectedClass
    ? _sessions.filter(s => uids.has(s.uid))
    : _sessions;

  const analytics  = aggregateAnalytics(sessions, students);
  const classCodes = [...new Set(_students.map(s => s.classCode).filter(Boolean))].sort();

  container.innerHTML = `
    <div class="dash-filter-bar">
      <span class="dash-filter-label">Class:</span>
      <button class="dash-filter-btn ${!selectedClass ? 'active' : ''}" data-class="">All Classes</button>
      ${classCodes.map(cc => `
        <button class="dash-filter-btn ${selectedClass === cc ? 'active' : ''}" data-class="${escHtml(cc)}">
          ${escHtml(_classNames[cc] || cc)}
        </button>`).join('')}
    </div>
    <div class="dashboard-grid" id="dash-inner"></div>
  `;

  // Filter buttons
  container.querySelectorAll('.dash-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => _render(container, btn.dataset.class || null));
  });

  const grid = container.querySelector('#dash-inner');
  grid.innerHTML = `
    ${_buildOverviewCard(analytics, students)}
    ${_buildCategoryProgressCard(students, uids)}
    ${_buildActivityChart(sessions)}
    ${_buildAtRiskCard(students, _allProgress)}
    ${_buildStudentTable(students, _allProgress)}
    ${_buildErrorTypesCard(analytics)}
    ${_buildConstructUsageCard(analytics)}
    ${_buildTopExercisesCard(_allProgress)}
  `;

  // Sortable table
  grid.querySelectorAll('.dash-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => _sortTable(th));
  });

  // Teacher feedback listeners
  grid.querySelectorAll('.feedback-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.dataset.uid;
      const exId = btn.dataset.exId;
      const ta = document.getElementById(`fb-${uid}-${exId}`);
      if (!ta) return;
      try {
        await saveTeacherFeedback('teacher', uid, exId, ta.value.trim());
        btn.textContent = 'Saved ✓';
        setTimeout(() => { btn.textContent = 'Save'; }, 2000);
      } catch (e) {
        btn.textContent = 'Error';
      }
    });
  });
}

// ── Overview stats ────────────────────────────────────────────────────────────

function _buildOverviewCard(analytics, students) {
  const avgXP = students.length
    ? Math.round(Object.values(_allProgress ?? {})
        .filter(p => students.some(s => s.uid === p.uid || true))
        .reduce((sum, p) => sum + (p.totalXP ?? 0), 0) / students.length)
    : 0;

  const totalCompleted = Object.values(_allProgress ?? {}).reduce(
    (sum, p) => sum + Object.keys(p.completed ?? {}).length, 0
  );

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      Overview
    </div>
    <div class="dash-stat-row">
      <div class="dash-stat"><div class="dash-stat-val">${students.length}</div><div class="dash-stat-label">Students</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${analytics.totalRuns}</div><div class="dash-stat-label">Total Runs</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${totalCompleted}</div><div class="dash-stat-label">Exercises Done</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${avgXP}</div><div class="dash-stat-label">Avg XP</div></div>
    </div>
  </div>`;
}

// ── Category progress ─────────────────────────────────────────────────────────

function _buildCategoryProgressCard(students, uids) {
  const allProgress = _allProgress ?? {};
  const rows = CATEGORIES.map(cat => {
    const catExercises = EXERCISES.filter(e => e.category === cat.id);
    const totalPossible = catExercises.length * students.length;
    if (!totalPossible) return '';
    let done = 0;
    students.forEach(s => {
      const prog = allProgress[s.uid];
      if (!prog) return;
      done += catExercises.filter(e => prog.completed?.[e.id]).length;
    });
    const pct = Math.round((done / totalPossible) * 100);
    return `<div class="dash-progress-row">
      <span class="dash-progress-label">${cat.icon} ${cat.label}</span>
      <div class="dash-progress-bar-wrap"><div class="dash-progress-bar" style="width:${pct}%"></div></div>
      <span class="dash-progress-pct">${pct}%</span>
    </div>`;
  }).join('');

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Category Progress (Class Average)
    </div>
    <div class="dash-progress-list">${rows || '<p class="feedback-empty">No data yet.</p>'}</div>
  </div>`;
}

// ── Activity chart ─────────────────────────────────────────────────────────────

function _buildActivityChart(sessions) {
  // Last 7 days
  const days = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    days.push({ label: d.toLocaleDateString('en-GB', { weekday: 'short' }), count: 0 });
  }
  sessions.forEach(s => {
    const ts = s.timestamp?.toMillis?.() ?? s.timestamp ?? 0;
    const daysAgo = Math.floor((now - ts) / 86400000);
    if (daysAgo < 7) days[6 - daysAgo].count++;
  });
  const maxCount = Math.max(...days.map(d => d.count), 1);

  const bars = days.map(d => {
    const h = Math.max(4, Math.round((d.count / maxCount) * 120));
    return `<div class="dash-bar-col">
      <div class="dash-bar" style="height:${h}px" title="${d.count} runs"></div>
      <div class="dash-bar-label">${d.label}</div>
    </div>`;
  }).join('');

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
      Activity (Last 7 Days)
    </div>
    <div class="dash-chart-area">${bars}</div>
  </div>`;
}

// ── At-risk students ──────────────────────────────────────────────────────────

function _buildAtRiskCard(students, allProgress) {
  const ap = allProgress ?? {};
  const atRisk = students.map(s => {
    const prog    = ap[s.uid] ?? {};
    const done    = Object.keys(prog.completed ?? {}).length;
    const xp      = prog.totalXP ?? 0;
    let riskLevel = 'low';
    if (done === 0) riskLevel = 'high';
    else if (done < 5 || xp < 50) riskLevel = 'medium';
    return { ...s, done, xp, riskLevel };
  }).filter(s => s.riskLevel !== 'low').sort((a, b) => {
    const ord = { high: 0, medium: 1, low: 2 };
    return ord[a.riskLevel] - ord[b.riskLevel];
  }).slice(0, 8);

  const items = atRisk.length
    ? atRisk.map(s => `<div class="risk-item">
        <span class="risk-name">${escHtml(s.displayName ?? s.email)}</span>
        <span class="risk-detail">${s.done} done · ${s.xp} XP</span>
        <span class="risk-tag ${s.riskLevel}">${s.riskLevel}</span>
      </div>`).join('')
    : '<p class="feedback-empty">No at-risk students detected.</p>';

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      At-Risk Students
    </div>
    <div class="risk-list">${items}</div>
  </div>`;
}

// ── Student table ─────────────────────────────────────────────────────────────

function _buildStudentTable(students, allProgress) {
  const ap = allProgress ?? {};
  const rows = students.map(s => {
    const prog = ap[s.uid] ?? {};
    const done = Object.keys(prog.completed ?? {}).length;
    const xp   = prog.totalXP ?? 0;
    const last = prog.lastRunAt ? new Date(prog.lastRunAt).toLocaleDateString('en-GB') : '—';
    return `<tr>
      <td>${escHtml(s.displayName ?? '—')}</td>
      <td>${escHtml(s.email ?? '—')}</td>
      <td>${escHtml(s.classCode ?? '—')}</td>
      <td>${done}</td>
      <td>${xp}</td>
      <td>${last}</td>
    </tr>`;
  }).join('');

  return `<div class="dash-card dash-card--wide">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      Student Progress
    </div>
    <div class="dash-table-wrap">
      <table class="dash-table" id="student-table">
        <thead><tr>
          <th data-sort="name">Name</th>
          <th>Email</th>
          <th>Class</th>
          <th data-sort="done">Exercises Done</th>
          <th data-sort="xp">Total XP</th>
          <th>Last Active</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="color:var(--text-muted)">No students yet.</td></tr>'}</tbody>
      </table>
    </div>
  </div>`;
}

// ── Error types ───────────────────────────────────────────────────────────────

function _buildErrorTypesCard(analytics) {
  const errors = analytics.errorTypes ?? {};
  const sorted = Object.entries(errors).sort((a,b) => b[1]-a[1]).slice(0, 6);

  const rows = sorted.length
    ? sorted.map(([type, count]) => `<tr><td>${escHtml(type)}</td><td>${count}</td></tr>`).join('')
    : '<tr><td colspan="2" style="color:var(--text-muted)">No error data yet.</td></tr>';

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      Common Error Types
    </div>
    <table class="dash-table"><thead><tr><th>Error Type</th><th>Count</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </div>`;
}

// ── Construct usage ───────────────────────────────────────────────────────────

function _buildConstructUsageCard(analytics) {
  const constructs = analytics.constructs ?? {};
  const sorted = Object.entries(constructs).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const max = sorted[0]?.[1] ?? 1;

  const rows = sorted.map(([c, count]) => {
    const pct = Math.round((count / max) * 100);
    return `<div class="dash-progress-row">
      <span class="dash-progress-label"><code>${escHtml(c)}</code></span>
      <div class="dash-progress-bar-wrap"><div class="dash-progress-bar" style="width:${pct}%"></div></div>
      <span class="dash-progress-pct">${count}</span>
    </div>`;
  }).join('');

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      Construct Usage
    </div>
    <div class="dash-progress-list">${rows || '<p class="feedback-empty">No data yet.</p>'}</div>
  </div>`;
}

// ── Top exercises (most failed) ───────────────────────────────────────────────

function _buildTopExercisesCard(allProgress) {
  const ap = allProgress ?? {};
  // Count attempts without completion per exercise
  const attempted = {};
  Object.values(ap).forEach(prog => {
    Object.entries(prog.submissions ?? {}).forEach(([exId, sub]) => {
      if (!prog.completed?.[exId]) {
        attempted[exId] = (attempted[exId] ?? 0) + 1;
      }
    });
  });
  const sorted = Object.entries(attempted).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const rows = sorted.length
    ? sorted.map(([exId, count]) => {
        const ex = EXERCISES.find(e => e.id === exId);
        return `<tr><td>${escHtml(ex?.title ?? exId)}</td><td>${escHtml(ex?.category ?? '—')}</td><td>${count}</td></tr>`;
      }).join('')
    : '<tr><td colspan="3" style="color:var(--text-muted)">No data yet.</td></tr>';

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
      Most Challenging Exercises
    </div>
    <table class="dash-table"><thead><tr><th>Exercise</th><th>Category</th><th>Attempted (incomplete)</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </div>`;
}

// ── Table sort ────────────────────────────────────────────────────────────────

function _sortTable(th) {
  const table = th.closest('table');
  if (!table) return;
  const idx   = [...th.parentElement.children].indexOf(th);
  const tbody = table.querySelector('tbody');
  const rows  = [...tbody.querySelectorAll('tr')];
  const asc   = th.dataset.asc !== 'true';

  rows.sort((a, b) => {
    const va = a.cells[idx]?.textContent.trim() ?? '';
    const vb = b.cells[idx]?.textContent.trim() ?? '';
    const na = parseFloat(va), nb = parseFloat(vb);
    if (!isNaN(na) && !isNaN(nb)) return asc ? na - nb : nb - na;
    return asc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  th.dataset.asc = String(asc);
  table.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
  th.classList.add('sorted');
  rows.forEach(r => tbody.appendChild(r));
}

// ── helpers ───────────────────────────────────────────────────────────────────
function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
