// ─── Teacher Dashboard ─────────────────────────────────────────────────────────

import {
  getAllStudents, getSessions, aggregateAnalytics,
  getAllChallengeProgress, getAllTeacherFeedback, saveTeacherFeedback,
  getClassNames, saveClassName,
  saveChallengeProgress, updateLeaderboard
} from './storage.js';
import { EXERCISES, CATEGORIES } from './exercises.js';
import { generateDemoData }       from './demo-data.js';
import { PythonRunner }           from './runner.js';

const TOTAL_EXERCISES = EXERCISES.length;  // 130

let _students    = null;
let _sessions    = null;
let _allProgress = null;
let _feedback    = null;
let _classNames  = {};
let _containerEl = null;
let _role        = '';

export function initDashboard(user, profile) {
  _role = profile?.role ?? '';
}

// Demo mode — swaps live Firestore data with generated fake data
let _isDemoMode   = false;
let _liveStudents = null;
let _liveSessions = null;
let _liveProgress = null;

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
  // Save live data so we can restore it after demo mode
  _liveStudents = _students;
  _liveSessions = _sessions;
  _liveProgress = _allProgress;
  _isDemoMode   = false;
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

  const filterButtons = _isDemoMode
    ? `<span class="dash-demo-badge">DEMO MODE — 5 sample students</span>`
    : `<span class="dash-filter-label">Class:</span>
       <button class="dash-filter-btn ${!selectedClass ? 'active' : ''}" data-class="">All Classes</button>
       ${classCodes.map(cc => `
         <button class="dash-filter-btn ${selectedClass === cc ? 'active' : ''}" data-class="${escHtml(cc)}">
           ${escHtml(_classNames[cc] || cc)}
         </button>`).join('')}`;

  const demoToggle = _isDemoMode
    ? `<button class="dash-demo-btn dash-demo-active" id="btn-demo-toggle">← Live Data</button>`
    : `<button class="dash-demo-btn" id="btn-demo-toggle">Try Demo</button>`;

  container.innerHTML = `
    <div class="dash-toolbar">
      <div class="dash-filter-bar">${filterButtons}</div>
      <div class="dash-toolbar-right">
        ${_role === 'superadmin' ? `<button class="btn-ghost btn-sm dash-revalidate-btn" id="btn-revalidate" title="Re-run all saved student code against the current tests">Re-validate All</button>` : ''}
        ${demoToggle}
        <button class="btn-ghost btn-sm dash-export-btn" id="btn-export-csv">Export CSV</button>
      </div>
    </div>
    <div class="dash-cards-grid" id="dash-inner"></div>
  `;

  container.querySelectorAll('.dash-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => _render(container, btn.dataset.class || null));
  });

  container.querySelector('#btn-demo-toggle')?.addEventListener('click', () => {
    if (_isDemoMode) {
      _isDemoMode  = false;
      _students    = _liveStudents;
      _sessions    = _liveSessions;
      _allProgress = _liveProgress;
    } else {
      _isDemoMode  = true;
      const demo   = generateDemoData();
      _students    = demo.students;
      _sessions    = demo.sessions;
      _allProgress = demo.allProgress;
    }
    _render(container, null);
  });

  container.querySelector('#btn-export-csv')?.addEventListener('click', () =>
    _exportCSV(students)
  );

  container.querySelector('#btn-revalidate')?.addEventListener('click', () =>
    _revalidateAll(students)
  );

  const grid = container.querySelector('#dash-inner');

  // Empty state when no live students exist
  if (!students.length) {
    grid.innerHTML = `<div class="dash-empty-state">
      <div class="dash-empty-icon">👥</div>
      <div class="dash-empty-title">${_isDemoMode ? 'No students match this filter.' : 'No students yet.'}</div>
      <div class="dash-empty-body">${_isDemoMode ? '' : 'Use the <strong>Admin panel</strong> to add teachers and students, then their data will appear here.<br><br>Click <strong>Try Demo</strong> above to preview the dashboard with sample data.'}</div>
    </div>`;
    return;
  }

  grid.innerHTML = `
    ${_buildOverviewCard(analytics, students)}
    ${_buildTrafficLightCard(students)}
    ${_buildAccuracyCard(students)}
    ${_buildCategoryProgressCard(students)}
    ${_buildConceptMasteryCard(students)}
    ${_buildActivityChart(sessions)}
    ${_buildEngagementCard(students, sessions)}
    ${_buildHeatmapCard(students)}
    ${_buildExamReadinessCard(students)}
    ${_buildInterventionsCard(students)}
    ${_buildResilienceCard(students)}
    ${_buildAtRiskCard(students)}
    ${_buildCohortCard(students)}
    ${_buildStudentTable(students)}
    ${_buildHardestExercisesCard(students)}
    ${_buildContentQualityCard(students)}
  `;

  // Sortable table
  grid.querySelectorAll('.dash-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => _sortTable(th));
  });

  // Student drill-down
  grid.querySelectorAll('.student-row-clickable').forEach(row => {
    row.addEventListener('click', () => {
      const uid = row.dataset.uid;
      const student = students.find(s => s.uid === uid);
      if (!student) return;
      _showStudentDrillDown(grid, student);
    });
  });
}

// ── Overview card ─────────────────────────────────────────────────────────────

function _buildOverviewCard(analytics, students) {
  const ap = _allProgress ?? {};
  let totalDone = 0, totalXP = 0;
  students.forEach(s => {
    const p = ap[s.uid] ?? {};
    totalDone += Object.keys(p.completed ?? {}).length;
    totalXP   += p.totalXP ?? 0;
  });
  const avgXP   = students.length ? Math.round(totalXP / students.length) : 0;
  const avgDone = students.length ? (totalDone / students.length).toFixed(1) : 0;
  const avgPct  = students.length ? Math.round((totalDone / (students.length * TOTAL_EXERCISES)) * 100) : 0;

  const atRiskCount = students.filter(s => {
    const done = Object.keys((ap[s.uid] ?? {}).completed ?? {}).length;
    return done < Math.round(TOTAL_EXERCISES * 0.5);
  }).length;

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      Class Overview
    </div>
    <div class="dash-stat-row">
      <div class="dash-stat"><div class="dash-stat-val">${students.length}</div><div class="dash-stat-label">Students</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${avgPct}%</div><div class="dash-stat-label">Avg Completion</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${avgDone}</div><div class="dash-stat-label">Avg Exercises Done</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${avgXP}</div><div class="dash-stat-label">Avg XP</div></div>
      <div class="dash-stat dash-stat--risk"><div class="dash-stat-val">${atRiskCount}</div><div class="dash-stat-label">At Risk (&lt;50%)</div></div>
    </div>
  </div>`;
}

// ── Traffic light — Ahead / On Track / Behind ─────────────────────────────────

function _buildTrafficLightCard(students) {
  const ap = _allProgress ?? {};
  const now = Date.now();
  // Simple pacing: assume course runs 10 weeks, 13 exercises/week target
  // Use completion % as proxy for "on track"
  const groups = { ahead: [], on_track: [], behind: [] };

  students.forEach(s => {
    const done = Object.keys((ap[s.uid] ?? {}).completed ?? {}).length;
    const pct  = TOTAL_EXERCISES ? done / TOTAL_EXERCISES : 0;
    if (pct >= 0.66)       groups.ahead.push(s.displayName ?? s.email);
    else if (pct >= 0.33)  groups.on_track.push(s.displayName ?? s.email);
    else                   groups.behind.push(s.displayName ?? s.email);
  });

  const pill = (names, cls, label) => {
    const list = names.length
      ? names.map(n => `<span class="tl-name">${escHtml(n)}</span>`).join('')
      : '<span class="tl-empty">None</span>';
    return `<div class="tl-group">
      <div class="tl-group-header tl-${cls}">
        <span class="tl-dot"></span>${label} <span class="tl-count">${names.length}</span>
      </div>
      <div class="tl-names">${list}</div>
    </div>`;
  };

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Pacing &amp; Progress
    </div>
    <div class="tl-container">
      ${pill(groups.ahead,    'ahead',    'Ahead (&gt;66%)')}
      ${pill(groups.on_track, 'on-track', 'On Track (33–66%)')}
      ${pill(groups.behind,   'behind',   'Behind (&lt;33%)')}
    </div>
    <p class="dash-sub-note">Based on overall completion percentage</p>
  </div>`;
}

// ── Category progress bars ────────────────────────────────────────────────────

function _buildCategoryProgressCard(students) {
  const ap = _allProgress ?? {};
  const rows = CATEGORIES.map(cat => {
    const catExs = EXERCISES.filter(e => e.category === cat.id);
    const totalPossible = catExs.length * students.length;
    if (!totalPossible) return '';
    let done = 0;
    students.forEach(s => {
      const prog = ap[s.uid];
      if (!prog) return;
      done += catExs.filter(e => prog.completed?.[e.id]).length;
    });
    const pct = Math.round((done / totalPossible) * 100);
    const barCol = pct >= 70 ? 'var(--accent)' : pct >= 40 ? 'var(--warning)' : 'var(--error)';
    return `<div class="dash-progress-row">
      <span class="dash-progress-label">${cat.icon} ${cat.label}</span>
      <div class="dash-progress-bar-wrap"><div class="dash-progress-bar" style="width:${pct}%;background:${barCol}"></div></div>
      <span class="dash-progress-pct">${pct}%</span>
    </div>`;
  }).join('');

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Topic Progress (Class Average)
    </div>
    <div class="dash-progress-list">${rows || '<p class="feedback-empty">No data yet.</p>'}</div>
  </div>`;
}

// ── Activity chart — last 7 days ──────────────────────────────────────────────

function _buildActivityChart(sessions) {
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
      Activity — Last 7 Days
    </div>
    <div class="dash-chart-area">${bars}</div>
  </div>`;
}

// ── Exercise heatmap ──────────────────────────────────────────────────────────

function _buildHeatmapCard(students) {
  const ap = _allProgress ?? {};
  const n  = students.length || 1;

  const legend = ['0%','1–24%','25–49%','50–74%','75–100%'].map((l, i) => {
    const colours = ['var(--border)','#ef4444','#f97316','#eab308','var(--accent)'];
    return `<span class="heatmap-legend-item">
      <span class="heatmap-legend-dot" style="background:${colours[i]}"></span>${l}
    </span>`;
  }).join('');

  return `<div class="dash-card dash-card--wide">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      Exercise Heatmap — Completion Rate per Exercise (${TOTAL_EXERCISES} exercises)
    </div>
    <div class="heatmap-legend">${legend}</div>
    <div class="heatmap-categories">
      ${CATEGORIES.map(cat => {
        const catExs = EXERCISES.filter(e => e.category === cat.id);
        const catCells = catExs.map(ex => {
          const completedCount = students.filter(s => (ap[s.uid] ?? {}).completed?.[ex.id]).length;
          const pct = completedCount / n;
          let bg;
          if (completedCount === 0) bg = 'var(--border)';
          else if (pct < 0.25) bg = '#ef4444';
          else if (pct < 0.5)  bg = '#f97316';
          else if (pct < 0.75) bg = '#eab308';
          else                 bg = 'var(--accent)';
          return `<div class="heatmap-cell" style="background:${bg}"
                       title="${escHtml(ex.title)}: ${completedCount}/${students.length} completed"></div>`;
        }).join('');
        return `<div class="heatmap-cat-group">
          <div class="heatmap-cat-label">${cat.icon} ${cat.label}</div>
          <div class="heatmap-cells">${catCells}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ── Intervention suggestions ──────────────────────────────────────────────────

function _buildInterventionsCard(students) {
  const ap = _allProgress ?? {};
  const now = Date.now();
  const DAY = 86400000;
  const suggestions = [];

  // 1. Topics where class average < 40%
  CATEGORIES.forEach(cat => {
    const catExs = EXERCISES.filter(e => e.category === cat.id);
    const totalPossible = catExs.length * students.length;
    if (!totalPossible) return;
    let done = 0;
    students.forEach(s => {
      const prog = ap[s.uid];
      done += catExs.filter(e => prog?.completed?.[e.id]).length;
    });
    const pct = done / totalPossible;
    if (pct < 0.4) {
      suggestions.push({
        icon: '📉',
        text: `<strong>${Math.round(pct * 100)}%</strong> of the class has completed <strong>${cat.label}</strong> exercises — consider reteaching this topic.`
      });
    }
  });

  // 2. Students stuck on same exercise for 7+ days (many attempts, not completed)
  const stuckStudents = [];
  students.forEach(s => {
    const prog = ap[s.uid] ?? {};
    const attempts = prog.attempts ?? {};
    Object.entries(attempts).forEach(([exId, count]) => {
      if (count >= 5 && !prog.completed?.[exId]) {
        const ex = EXERCISES.find(e => e.id === exId);
        if (ex) stuckStudents.push(`${s.displayName ?? s.email} (${ex.title})`);
      }
    });
  });
  if (stuckStudents.length) {
    suggestions.push({
      icon: '🔁',
      text: `${stuckStudents.length} student${stuckStudents.length > 1 ? 's' : ''} attempted an exercise 5+ times without completing: ${stuckStudents.map(escHtml).join(', ')}.`
    });
  }

  // 3. Students inactive for 7+ days
  const inactiveStudents = students.filter(s => {
    const lastRun = (ap[s.uid] ?? {}).lastRunAt;
    if (!lastRun) return true;
    return (now - lastRun) > 7 * DAY;
  });
  if (inactiveStudents.length) {
    suggestions.push({
      icon: '😴',
      text: `${inactiveStudents.length} student${inactiveStudents.length > 1 ? 's' : ''} ha${inactiveStudents.length > 1 ? 've' : 's'} not been active in 7+ days: ${inactiveStudents.map(s => escHtml(s.displayName ?? s.email)).join(', ')}.`
    });
  }

  // 4. Heavy hint usage
  const highHintStudents = [];
  students.forEach(s => {
    const prog = ap[s.uid] ?? {};
    const hints = Object.values(prog.hintsUsed ?? {}).reduce((a, b) => a + b, 0);
    const done  = Object.keys(prog.completed ?? {}).length;
    if (hints > 10 && done < 20) highHintStudents.push(s.displayName ?? s.email);
  });
  if (highHintStudents.length) {
    suggestions.push({
      icon: '💡',
      text: `${highHintStudents.length} student${highHintStudents.length > 1 ? 's' : ''} ${highHintStudents.length > 1 ? 'are' : 'is'} using many hints with low completion — may need 1:1 support: ${highHintStudents.map(escHtml).join(', ')}.`
    });
  }

  if (!suggestions.length) {
    suggestions.push({ icon: '✅', text: 'No intervention signals detected — the class is progressing well!' });
  }

  const items = suggestions.map(s =>
    `<div class="intervention-item">
      <div class="intervention-icon">${s.icon}</div>
      <div class="intervention-text">${s.text}</div>
    </div>`
  ).join('');

  return `<div class="dash-card dash-card--wide">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      Intervention Suggestions
    </div>
    <div class="intervention-list">${items}</div>
  </div>`;
}

// ── At-risk card ──────────────────────────────────────────────────────────────

function _buildAtRiskCard(students) {
  const ap = _allProgress ?? {};
  const atRisk = students.map(s => {
    const prog = ap[s.uid] ?? {};
    const done = Object.keys(prog.completed ?? {}).length;
    const xp   = prog.totalXP ?? 0;
    let riskLevel = 'low';
    if (done === 0) riskLevel = 'high';
    else if (done < Math.round(TOTAL_EXERCISES * 0.15) || xp < 50) riskLevel = 'medium';
    return { ...s, done, xp, riskLevel };
  }).filter(s => s.riskLevel !== 'low').sort((a, b) => {
    const ord = { high: 0, medium: 1, low: 2 };
    return ord[a.riskLevel] - ord[b.riskLevel];
  }).slice(0, 10);

  const items = atRisk.length
    ? atRisk.map(s => `<div class="risk-item">
        <span class="risk-name">${escHtml(s.displayName ?? s.email)}</span>
        <span class="risk-detail">${s.done} done · ${s.xp} XP</span>
        <span class="risk-tag ${s.riskLevel}">${s.riskLevel}</span>
      </div>`).join('')
    : '<p class="feedback-empty">No at-risk students detected.</p>';

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
      At-Risk Students
    </div>
    <div class="risk-list">${items}</div>
  </div>`;
}

// ── Student table ─────────────────────────────────────────────────────────────

function _buildStudentTable(students) {
  const ap  = _allProgress ?? {};
  const now = Date.now();

  const rows = students.map(s => {
    const prog  = ap[s.uid] ?? {};
    const done  = Object.keys(prog.completed ?? {}).length;
    const xp    = prog.totalXP ?? 0;
    const pct   = Math.round((done / TOTAL_EXERCISES) * 100);
    const hints = Object.values(prog.hintsUsed ?? {}).reduce((a, b) => a + b, 0);
    const lastRunMs = prog.lastRunAt;
    let lastStr = '—';
    if (lastRunMs) {
      const daysAgo = Math.floor((now - lastRunMs) / 86400000);
      lastStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
    }
    const riskCls = done === 0 ? 'row-risk-high' : done < 20 ? 'row-risk-med' : '';
    return `<tr class="student-row-clickable ${riskCls}" data-uid="${escHtml(s.uid)}" title="Click for drill-down">
      <td>${escHtml(s.displayName ?? '—')}</td>
      <td>${escHtml(s.classCode ?? '—')}</td>
      <td>
        <div class="td-progress-wrap">
          <div class="td-progress-bar" style="width:${pct}%"></div>
          <span class="td-progress-label">${done}/${TOTAL_EXERCISES}</span>
        </div>
      </td>
      <td>${xp}</td>
      <td>${hints}</td>
      <td class="${!lastRunMs ? 'text-muted' : ''}">${lastStr}</td>
    </tr>`;
  }).join('');

  return `<div class="dash-card dash-card--wide">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      Student Progress <span class="dash-card-sub">Click a row for details</span>
    </div>
    <div class="dash-table-wrap">
      <table class="dash-table" id="student-table">
        <thead><tr>
          <th data-sort="name">Name</th>
          <th>Class</th>
          <th data-sort="done">Completion</th>
          <th data-sort="xp">XP</th>
          <th data-sort="hints">Hints Used</th>
          <th data-sort="last">Last Active</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="color:var(--text-muted)">No students yet.</td></tr>'}</tbody>
      </table>
    </div>
    <div id="student-drilldown"></div>
  </div>`;
}

// ── Per-student drill-down ────────────────────────────────────────────────────

function _showStudentDrillDown(grid, student) {
  const ap   = _allProgress ?? {};
  const prog = ap[student.uid] ?? {};
  const done = Object.keys(prog.completed ?? {}).length;
  const xp   = prog.totalXP ?? 0;
  const hints = Object.values(prog.hintsUsed ?? {}).reduce((a, b) => a + b, 0);
  const completedIds = Object.keys(prog.completed ?? {});
  const attMap = prog.attempts ?? {};
  const firstAttemptDone = completedIds.filter(id => (attMap[id] ?? 1) === 1).length;
  const firstAttemptRate = done ? Math.round((firstAttemptDone / done) * 100) : null;
  const abandonedCount = Object.keys(attMap).filter(id => !prog.completed?.[id]).length;
  const hintFreeCount = completedIds.filter(id => !(prog.hintsUsed?.[id] > 0)).length;

  // Category breakdown bars
  const catBars = CATEGORIES.map(cat => {
    const catExs  = EXERCISES.filter(e => e.category === cat.id);
    const catDone = catExs.filter(e => prog.completed?.[e.id]).length;
    const pct     = catExs.length ? Math.round((catDone / catExs.length) * 100) : 0;
    const barCol  = pct >= 70 ? 'var(--accent)' : pct >= 40 ? 'var(--warning)' : 'var(--error)';
    return `<div class="dash-progress-row">
      <span class="dash-progress-label">${cat.icon} ${cat.label}</span>
      <div class="dash-progress-bar-wrap"><div class="dash-progress-bar" style="width:${pct}%;background:${barCol}"></div></div>
      <span class="dash-progress-pct">${catDone}/${catExs.length}</span>
    </div>`;
  }).join('');

  // Completed exercises — sorted by completedAt descending
  const completedRows = EXERCISES
    .filter(ex => prog.completed?.[ex.id])
    .sort((a, b) => (prog.completed[b.id].completedAt ?? 0) - (prog.completed[a.id].completedAt ?? 0))
    .map(ex => {
      const completedAt = prog.completed[ex.id].completedAt;
      const dateStr = completedAt ? new Date(completedAt).toLocaleDateString('en-GB') : '—';
      const hasCode = !!prog.submissions?.[ex.id]?.code;
      return `<tr class="ex-row ${hasCode ? 'ex-row--clickable' : ''}" data-ex-id="${ex.id}" data-state="done">
        <td><span class="ex-status-dot done">✓</span></td>
        <td>${escHtml(ex.title)}</td>
        <td class="ex-cat">${escHtml(ex.category)}</td>
        <td class="ex-date">${dateStr}</td>
        <td>${hasCode ? '<span class="ex-view-code">View code ›</span>' : '<span class="ex-no-code">—</span>'}</td>
      </tr>`;
    }).join('');

  // In-progress exercises — attempted or code saved, but not completed
  const attempts = prog.attempts ?? {};
  const inProgressExs = EXERCISES
    .filter(ex => !prog.completed?.[ex.id] &&
      (attempts[ex.id] > 0 || prog.submissions?.[ex.id]?.code))
    .sort((a, b) => (attempts[b.id] ?? 0) - (attempts[a.id] ?? 0));

  const inProgressRows = inProgressExs.map(ex => {
    const count   = attempts[ex.id] ?? 0;
    const hasCode = !!prog.submissions?.[ex.id]?.code;
    const dateCell = count > 0
      ? `${count} attempt${count !== 1 ? 's' : ''}`
      : `<span class="ex-saved-label">Saved, not run</span>`;
    return `<tr class="ex-row ${hasCode ? 'ex-row--clickable' : ''}" data-ex-id="${ex.id}" data-state="progress">
      <td><span class="ex-status-dot progress">…</span></td>
      <td>${escHtml(ex.title)}</td>
      <td class="ex-cat">${escHtml(ex.category)}</td>
      <td class="ex-date">${dateCell}</td>
      <td>${hasCode ? '<span class="ex-view-code">View code ›</span>' : '<span class="ex-no-code">—</span>'}</td>
    </tr>`;
  }).join('');

  const exTable = (rows, emptyMsg) => rows
    ? `<div class="ex-table-wrap"><table class="ex-table">
        <thead><tr><th></th><th>Exercise</th><th>Topic</th><th>Date / Attempts</th><th>Code</th></tr></thead>
        <tbody>${rows}</tbody>
       </table></div>`
    : `<p class="feedback-empty">${emptyMsg}</p>`;

  const html = `<div class="student-drilldown-panel">
    <div class="drilldown-header">
      <strong>${escHtml(student.displayName ?? student.email)}</strong>
      <span class="drilldown-stats">${done} completed · ${xp} XP · ${hints} hints used${firstAttemptRate !== null ? ` · ${firstAttemptRate}% first-try` : ''}${hintFreeCount ? ` · ${hintFreeCount} hint-free` : ''}${abandonedCount ? ` · ${abandonedCount} abandoned` : ''}</span>
      <button class="btn-ghost btn-sm drilldown-close-btn">✕ Close</button>
    </div>
    <div class="drilldown-body drilldown-body--cols">

      <div class="drilldown-col-narrow">
        <div class="drilldown-section">
          <div class="drilldown-section-title">Topic Breakdown</div>
          <div class="dash-progress-list">${catBars}</div>
        </div>
      </div>

      <div class="drilldown-col-wide">
        <div class="drilldown-section">
          <div class="drilldown-section-title">In Progress (${inProgressExs.length} exercises)</div>
          ${exTable(inProgressRows, 'No exercises in progress.')}
        </div>
        <div class="drilldown-section">
          <div class="drilldown-section-title">Completed (${done} exercises)</div>
          ${exTable(completedRows, 'No completed exercises yet.')}
        </div>
      </div>

    </div>
    <div class="code-viewer hidden" id="code-viewer-${escHtml(student.uid)}">
      <div class="code-viewer-header">
        <span class="code-viewer-title" id="code-viewer-title-${escHtml(student.uid)}"></span>
        <button class="btn-ghost btn-sm code-viewer-close">✕</button>
      </div>
      <pre class="code-viewer-body" id="code-viewer-body-${escHtml(student.uid)}"></pre>
    </div>
  </div>`;

  const container = grid.querySelector('#student-drilldown');
  if (!container) return;

  // Toggle off if same student clicked again
  const existing = container.querySelector('.student-drilldown-panel');
  if (existing && container.dataset.uid === student.uid) {
    container.innerHTML = '';
    container.dataset.uid = '';
    return;
  }
  container.dataset.uid = student.uid;
  container.innerHTML = html;

  container.querySelector('.drilldown-close-btn')?.addEventListener('click', () => {
    container.innerHTML = '';
    container.dataset.uid = '';
  });

  // Code viewer
  const viewer      = container.querySelector(`#code-viewer-${student.uid}`);
  const viewerTitle = container.querySelector(`#code-viewer-title-${student.uid}`);
  const viewerBody  = container.querySelector(`#code-viewer-body-${student.uid}`);

  container.querySelector('.code-viewer-close')?.addEventListener('click', () => {
    viewer?.classList.add('hidden');
  });

  container.querySelectorAll('.ex-row--clickable').forEach(row => {
    row.addEventListener('click', () => {
      const exId = row.dataset.exId;
      const ex   = EXERCISES.find(e => e.id === exId);
      const code = prog.submissions?.[exId]?.code ?? '';
      if (!code || !viewer) return;

      // Highlight currently selected row
      container.querySelectorAll('.ex-row--clickable').forEach(r => r.classList.remove('ex-row--active'));
      row.classList.add('ex-row--active');

      if (viewerTitle) viewerTitle.textContent = `${student.displayName ?? student.email} — ${ex?.title ?? exId}`;
      if (viewerBody)  viewerBody.textContent  = code;
      viewer.classList.remove('hidden');
      viewer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Hardest exercises ─────────────────────────────────────────────────────────

function _buildHardestExercisesCard(students) {
  const ap = _allProgress ?? {};
  const n  = students.length || 1;

  // For each exercise: avg attempts across students who tried it, completion rate
  const stats = EXERCISES.map(ex => {
    let totalAttempts = 0, tried = 0, completed = 0;
    students.forEach(s => {
      const prog = ap[s.uid] ?? {};
      const a = prog.attempts?.[ex.id] ?? 0;
      if (a > 0) { totalAttempts += a; tried++; }
      if (prog.completed?.[ex.id]) completed++;
    });
    const completionRate = Math.round((completed / n) * 100);
    const avgAttempts    = tried ? (totalAttempts / tried).toFixed(1) : '—';
    return { ex, tried, completed, completionRate, avgAttempts };
  });

  // Sort by most tried but lowest completion
  const hardest = stats
    .filter(s => s.tried > 0)
    .sort((a, b) => {
      const scoreA = a.tried - a.completed;
      const scoreB = b.tried - b.completed;
      return scoreB - scoreA;
    })
    .slice(0, 8);

  const rows = hardest.length
    ? hardest.map(s => `<tr>
        <td>${escHtml(s.ex.title)}</td>
        <td>${escHtml(s.ex.category)}</td>
        <td><span class="diff-badge diff-${s.ex.difficulty}">${s.ex.difficulty[0].toUpperCase()}</span></td>
        <td>${s.tried}</td>
        <td>${s.avgAttempts}</td>
        <td>${s.completionRate}%</td>
      </tr>`).join('')
    : '<tr><td colspan="6" style="color:var(--text-muted)">No attempt data yet.</td></tr>';

  return `<div class="dash-card dash-card--wide">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
      Hardest Exercises for the Class
    </div>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead><tr>
          <th>Exercise</th><th>Topic</th><th>Diff</th>
          <th>Students Tried</th><th>Avg Attempts</th><th>Completion</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

// ── Accuracy & Achievement ────────────────────────────────────────────────────

function _buildAccuracyCard(students) {
  const ap = _allProgress ?? {};
  let totalCompleted = 0, firstAttemptCompleted = 0, totalAttemptsOnCompleted = 0;

  const studentStats = students.map(s => {
    const prog     = ap[s.uid] ?? {};
    const completed = prog.completed ?? {};
    const attempts  = prog.attempts  ?? {};
    let sTotal = 0, sFirst = 0, sAttempts = 0;
    Object.keys(completed).forEach(exId => {
      sTotal++;
      const a = attempts[exId] ?? 1;
      if (a === 1) sFirst++;
      sAttempts += a;
    });
    totalCompleted          += sTotal;
    firstAttemptCompleted   += sFirst;
    totalAttemptsOnCompleted += sAttempts;
    const firstRate = sTotal ? Math.round((sFirst / sTotal) * 100) : null;
    const avgAtt    = sTotal ? (sAttempts / sTotal).toFixed(1) : null;
    return { ...s, sTotal, sFirst, firstRate, avgAtt };
  });

  const classFirstRate = totalCompleted ? Math.round((firstAttemptCompleted / totalCompleted) * 100) : 0;
  const classAvgAtt    = totalCompleted ? (totalAttemptsOnCompleted / totalCompleted).toFixed(1) : '—';

  const ranked = studentStats
    .filter(s => s.sTotal >= 5)
    .sort((a, b) => (b.firstRate ?? 0) - (a.firstRate ?? 0));

  const effRows = ranked.slice(0, 5).map((s, i) =>
    `<tr>
      <td>${i + 1}</td>
      <td>${escHtml(s.displayName ?? s.email)}</td>
      <td>${s.firstRate}%</td>
      <td>${s.avgAtt}</td>
      <td>${s.sTotal}</td>
    </tr>`
  ).join('');

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      Accuracy &amp; Achievement
    </div>
    <div class="dash-stat-row">
      <div class="dash-stat"><div class="dash-stat-val">${classFirstRate}%</div><div class="dash-stat-label">First-Try Success</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${classAvgAtt}</div><div class="dash-stat-label">Avg Attempts/Exercise</div></div>
    </div>
    ${ranked.length ? `<div class="dash-table-wrap" style="margin-top:8px">
      <table class="dash-table">
        <thead><tr><th>#</th><th>Student</th><th>1st-Try Rate</th><th>Avg Attempts</th><th>Completed</th></tr></thead>
        <tbody>${effRows}</tbody>
      </table></div>` : '<p class="feedback-empty" style="margin-top:8px">Complete 5+ exercises to see accuracy rankings.</p>'}
  </div>`;
}

// ── Concept Mastery Map ───────────────────────────────────────────────────────

function _buildConceptMasteryCard(students) {
  const ap = _allProgress ?? {};
  if (!students.length) return '';

  const rows = students.map(s => {
    const prog = ap[s.uid] ?? {};
    const cells = CATEGORIES.map(cat => {
      const catExs  = EXERCISES.filter(e => e.category === cat.id);
      const catDone = catExs.filter(e => prog.completed?.[e.id]).length;
      const pct     = catExs.length ? catDone / catExs.length : 0;
      let status;
      if (pct === 0)       status = 'none';
      else if (pct < 0.4)  status = 'low';
      else if (pct < 0.75) status = 'partial';
      else                 status = 'mastered';
      const label = { none: 'Not started', low: 'Struggling', partial: 'Progressing', mastered: 'Mastered' }[status];
      return `<td class="mastery-cell mastery-${status}" title="${escHtml(cat.label)}: ${catDone}/${catExs.length} (${Math.round(pct*100)}%) — ${label}"></td>`;
    }).join('');
    return `<tr><td class="mastery-name">${escHtml(s.displayName ?? s.email)}</td>${cells}</tr>`;
  }).join('');

  const catHeaders = CATEGORIES.map(c =>
    `<th class="mastery-cat-header"><span class="mastery-tip-wrap" data-tip="${escHtml(c.label)}">${c.icon}</span></th>`
  ).join('');

  const legend = [['mastered','Mastered (≥75%)'],['partial','Progressing (40–74%)'],['low','Struggling (<40%)'],['none','Not started']].map(([cls, lbl]) =>
    `<span class="mastery-legend-item"><span class="mastery-dot mastery-${cls}"></span>${lbl}</span>`
  ).join('');

  return `<div class="dash-card dash-card--wide">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
      Concept Mastery Map
    </div>
    <div class="mastery-legend">${legend}</div>
    <div class="dash-table-wrap">
      <table class="dash-table mastery-table">
        <thead><tr><th>Student</th>${catHeaders}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

// ── Engagement (last 7 days) ──────────────────────────────────────────────────

function _buildEngagementCard(students, sessions) {
  const now  = Date.now();
  const DAY  = 86400000;
  const WEEK = 7 * DAY;
  const ap   = _allProgress ?? {};

  const stats = students.map(s => {
    const sSess = sessions.filter(sess => {
      const ts = sess.timestamp?.toMillis?.() ?? sess.timestamp ?? 0;
      return sess.uid === s.uid && (now - ts) < WEEK;
    });
    const runs = sSess.length;
    const activeDays = new Set(sSess.map(sess => {
      const ts = sess.timestamp?.toMillis?.() ?? sess.timestamp ?? 0;
      return Math.floor((now - ts) / DAY);
    })).size;
    const lastRunMs  = (ap[s.uid] ?? {}).lastRunAt;
    const daysInactive = lastRunMs ? Math.floor((now - lastRunMs) / DAY) : 999;
    return { ...s, runs, activeDays, daysInactive };
  });

  const avgRuns = stats.length ? (stats.reduce((a, s) => a + s.runs, 0) / stats.length).toFixed(1) : 0;
  const avgDays = stats.length ? (stats.reduce((a, s) => a + s.activeDays, 0) / stats.length).toFixed(1) : 0;
  const activeNow = stats.filter(s => s.daysInactive <= 2).length;

  const rows = [...stats].sort((a, b) => b.runs - a.runs).map(s => {
    const dotCls   = s.daysInactive === 0 ? 'green' : s.daysInactive <= 3 ? 'amber' : 'red';
    const lastStr  = s.daysInactive === 999 ? 'Never' : s.daysInactive === 0 ? 'Today' : s.daysInactive === 1 ? 'Yesterday' : `${s.daysInactive}d ago`;
    return `<tr>
      <td>${escHtml(s.displayName ?? s.email)}</td>
      <td>${s.runs}</td>
      <td>${s.activeDays}/7</td>
      <td><span class="eng-dot eng-dot--${dotCls}"></span> ${lastStr}</td>
    </tr>`;
  }).join('');

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      Engagement — Last 7 Days
    </div>
    <div class="dash-stat-row">
      <div class="dash-stat"><div class="dash-stat-val">${avgRuns}</div><div class="dash-stat-label">Avg Runs/Student</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${avgDays}</div><div class="dash-stat-label">Avg Active Days</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${activeNow}</div><div class="dash-stat-label">Active (≤2 days ago)</div></div>
    </div>
    <div class="dash-table-wrap" style="margin-top:8px">
      <table class="dash-table">
        <thead><tr><th>Student</th><th>Runs</th><th>Active Days</th><th>Last Active</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" style="color:var(--text-muted)">No session data.</td></tr>'}</tbody>
      </table>
    </div>
  </div>`;
}

// ── Resilience & Attempt Patterns ─────────────────────────────────────────────

function _buildResilienceCard(students) {
  const ap = _allProgress ?? {};

  const stats = students.map(s => {
    const prog      = ap[s.uid] ?? {};
    const completed = prog.completed ?? {};
    const attempts  = prog.attempts  ?? {};
    const triedIds  = Object.keys(attempts);
    const abandoned = triedIds.filter(id => !completed[id]);
    const abandonRate = triedIds.length ? Math.round((abandoned.length / triedIds.length) * 100) : null;
    // Persisted: completed after 3+ attempts
    const persistedCount = Object.keys(completed).filter(id => (attempts[id] ?? 1) >= 3).length;
    return { ...s, tried: triedIds.length, abandoned: abandoned.length, abandonRate, persistedCount };
  }).filter(s => s.tried > 0);

  const classAvgAbandon = stats.length
    ? Math.round(stats.reduce((a, s) => a + (s.abandonRate ?? 0), 0) / stats.length)
    : 0;

  const mostPersistent = [...stats].sort((a, b) => b.persistedCount - a.persistedCount).slice(0, 4);
  const highAbandoners = [...stats]
    .filter(s => (s.abandonRate ?? 0) > 50 && s.tried >= 3)
    .sort((a, b) => (b.abandonRate ?? 0) - (a.abandonRate ?? 0));

  const persistRows = mostPersistent.length
    ? mostPersistent.map(s =>
        `<div class="resilience-row">
          <span class="resilience-name">${escHtml(s.displayName ?? s.email)}</span>
          <span class="resilience-badge resilience-badge--good">Persisted on ${s.persistedCount} exercise${s.persistedCount !== 1 ? 's' : ''}</span>
        </div>`).join('')
    : '<p class="feedback-empty">No data yet.</p>';

  const abandonRows = highAbandoners.length
    ? highAbandoners.map(s =>
        `<div class="resilience-row">
          <span class="resilience-name">${escHtml(s.displayName ?? s.email)}</span>
          <span class="resilience-badge resilience-badge--warn">${s.abandonRate}% abandoned (${s.abandoned}/${s.tried})</span>
        </div>`).join('')
    : '<p class="feedback-empty">No high-abandonment students.</p>';

  return `<div class="dash-card">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Resilience &amp; Attempt Patterns
    </div>
    <div class="dash-stat-row">
      <div class="dash-stat"><div class="dash-stat-val">${classAvgAbandon}%</div><div class="dash-stat-label">Avg Abandonment Rate</div></div>
    </div>
    <div class="resilience-cols">
      <div>
        <div class="resilience-section-label">Most Persistent</div>
        ${persistRows}
      </div>
      <div>
        <div class="resilience-section-label">High Abandonment (needs support)</div>
        ${abandonRows}
      </div>
    </div>
  </div>`;
}

// ── Cohort Comparison ─────────────────────────────────────────────────────────

function _buildCohortCard(students) {
  const ap = _allProgress ?? {};
  if (students.length < 2) return '';

  const withStats = students.map(s => {
    const prog  = ap[s.uid] ?? {};
    const done  = Object.keys(prog.completed ?? {}).length;
    const xp    = prog.totalXP ?? 0;
    const hints = Object.values(prog.hintsUsed ?? {}).reduce((a, b) => a + b, 0);
    return { ...s, done, xp, hints };
  }).sort((a, b) => b.done - a.done);

  const n = withStats.length;
  const rows = withStats.map((s, rank) => {
    const percentile = n > 1 ? Math.round(((n - 1 - rank) / (n - 1)) * 100) : 100;
    const pct = Math.round((s.done / TOTAL_EXERCISES) * 100);
    const barCol = percentile >= 75 ? 'var(--accent)' : percentile >= 40 ? 'var(--warning)' : 'var(--error)';
    return `<tr>
      <td>${rank + 1}</td>
      <td>${escHtml(s.displayName ?? s.email)}</td>
      <td>
        <div class="td-progress-wrap">
          <div class="td-progress-bar" style="width:${percentile}%;background:${barCol}"></div>
          <span class="td-progress-label">${percentile}th</span>
        </div>
      </td>
      <td>${pct}%</td>
      <td>${s.xp}</td>
      <td>${s.hints}</td>
    </tr>`;
  }).join('');

  return `<div class="dash-card dash-card--wide">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      Cohort Comparison &amp; Rankings
    </div>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead><tr><th>Rank</th><th>Student</th><th>Percentile</th><th>Completion</th><th>XP</th><th>Hints</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="dash-sub-note">Ranked by exercises completed within this class/filter.</p>
  </div>`;
}

// ── Exam Readiness ────────────────────────────────────────────────────────────

function _buildExamReadinessCard(students) {
  const ap = _allProgress ?? {};
  const hardExs = EXERCISES.filter(e => e.difficulty === 'hard');

  const stats = students.map(s => {
    const prog       = ap[s.uid] ?? {};
    const completed  = prog.completed  ?? {};
    const hints      = prog.hintsUsed  ?? {};
    const completedIds = Object.keys(completed);

    const hintFree     = completedIds.filter(id => !(hints[id] > 0)).length;
    const hintFreeRate = completedIds.length ? Math.round((hintFree / completedIds.length) * 100) : null;

    const hardDone = hardExs.filter(e => completed[e.id]).length;
    const hardRate = hardExs.length ? Math.round((hardDone / hardExs.length) * 100) : 0;

    const weakTopics = CATEGORIES.filter(cat => {
      const catExs = EXERCISES.filter(e => e.category === cat.id);
      const catDone = catExs.filter(e => completed[e.id]).length;
      return catExs.length > 0 && catDone / catExs.length < 0.5;
    }).map(c => c.label);

    const completionPct = TOTAL_EXERCISES ? completedIds.length / TOTAL_EXERCISES : 0;
    const readiness = Math.round(
      (completionPct * 0.5 + (hardRate / 100) * 0.3 + ((hintFreeRate ?? 0) / 100) * 0.2) * 100
    );
    return { ...s, hintFreeRate, hardDone, hardRate, weakTopics, readiness };
  });

  const classReadiness = stats.length
    ? Math.round(stats.reduce((a, s) => a + s.readiness, 0) / stats.length)
    : 0;

  const rows = [...stats].sort((a, b) => b.readiness - a.readiness).map(s => {
    const rCol = s.readiness >= 70 ? 'var(--accent)' : s.readiness >= 40 ? 'var(--warning)' : 'var(--error)';
    return `<tr>
      <td>${escHtml(s.displayName ?? s.email)}</td>
      <td>
        <div class="td-progress-wrap">
          <div class="td-progress-bar" style="width:${s.readiness}%;background:${rCol}"></div>
          <span class="td-progress-label">${s.readiness}%</span>
        </div>
      </td>
      <td>${s.hintFreeRate !== null ? s.hintFreeRate + '%' : '—'}</td>
      <td>${s.hardDone}/${hardExs.length}</td>
      <td class="exam-weak-topics">${s.weakTopics.length ? escHtml(s.weakTopics.join(', ')) : '<span style="color:var(--accent)">None</span>'}</td>
    </tr>`;
  }).join('');

  return `<div class="dash-card dash-card--wide">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      Assessment &amp; Exam Readiness
    </div>
    <div class="dash-stat-row">
      <div class="dash-stat"><div class="dash-stat-val">${classReadiness}%</div><div class="dash-stat-label">Class Readiness Score</div></div>
      <div class="dash-stat"><div class="dash-stat-val">${hardExs.length}</div><div class="dash-stat-label">Hard Exercises Total</div></div>
    </div>
    <div class="dash-table-wrap" style="margin-top:8px">
      <table class="dash-table">
        <thead><tr><th>Student</th><th>Readiness</th><th>Hint-Free %</th><th>Hard Exs</th><th>Weak Topics</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" style="color:var(--text-muted)">No data yet.</td></tr>'}</tbody>
      </table>
    </div>
    <p class="dash-sub-note">Readiness = 50% completion + 30% hard exercises + 20% hint-free rate</p>
  </div>`;
}

// ── Content Quality & Difficulty Analysis ─────────────────────────────────────

function _buildContentQualityCard(students) {
  const ap = _allProgress ?? {};
  const n  = students.length || 1;

  const topicRows = CATEGORIES.map(cat => {
    const catExs = EXERCISES.filter(e => e.category === cat.id);
    let totalAttempts = 0, totalTried = 0, totalCompleted = 0;
    catExs.forEach(ex => {
      students.forEach(s => {
        const prog = ap[s.uid] ?? {};
        const a = prog.attempts?.[ex.id] ?? 0;
        if (a > 0) { totalAttempts += a; totalTried++; }
        if (prog.completed?.[ex.id]) totalCompleted++;
      });
    });
    const completionRate = Math.round((totalCompleted / (catExs.length * n)) * 100);
    const avgAttempts    = totalTried ? (totalAttempts / totalTried).toFixed(1) : '—';
    const diffIndex      = completionRate < 40 ? 'hard' : completionRate < 70 ? 'medium' : 'easy';
    return `<tr>
      <td>${cat.icon} ${escHtml(cat.label)}</td>
      <td>${completionRate}%</td>
      <td>${avgAttempts}</td>
      <td><span class="diff-badge diff-${diffIndex}">${diffIndex[0].toUpperCase()}</span></td>
    </tr>`;
  }).join('');

  const failureStats = EXERCISES.map(ex => {
    let tried = 0, completed = 0, totalAttempts = 0;
    students.forEach(s => {
      const prog = ap[s.uid] ?? {};
      const a = prog.attempts?.[ex.id] ?? 0;
      if (a > 0) { tried++; totalAttempts += a; }
      if (prog.completed?.[ex.id]) completed++;
    });
    const failRate = tried > 0 ? Math.round(((tried - completed) / tried) * 100) : 0;
    const avgAtt   = tried ? (totalAttempts / tried).toFixed(1) : '—';
    return { ex, tried, completed, failRate, avgAtt };
  }).filter(s => s.tried > 0).sort((a, b) => b.failRate - a.failRate).slice(0, 6);

  const failRows = failureStats.length
    ? failureStats.map(s =>
        `<tr>
          <td>${escHtml(s.ex.title)}</td>
          <td><span class="diff-badge diff-${s.ex.difficulty}">${s.ex.difficulty[0].toUpperCase()}</span></td>
          <td>${s.tried}</td>
          <td>${s.failRate}%</td>
          <td>${s.avgAtt}</td>
        </tr>`).join('')
    : '<tr><td colspan="5" style="color:var(--text-muted)">No attempt data yet.</td></tr>';

  return `<div class="dash-card dash-card--wide">
    <div class="dash-card-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      Content Quality &amp; Difficulty Analysis
    </div>
    <div class="content-quality-cols">
      <div>
        <div class="resilience-section-label">Topic Difficulty Index</div>
        <div class="dash-table-wrap">
          <table class="dash-table">
            <thead><tr><th>Topic</th><th>Completion</th><th>Avg Attempts</th><th>Index</th></tr></thead>
            <tbody>${topicRows}</tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="resilience-section-label">Highest-Failure Exercises</div>
        <div class="dash-table-wrap">
          <table class="dash-table">
            <thead><tr><th>Exercise</th><th>Diff</th><th>Tried</th><th>Fail Rate</th><th>Avg Att.</th></tr></thead>
            <tbody>${failRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}

// ── CSV export ────────────────────────────────────────────────────────────────

function _exportCSV(students) {
  const ap  = _allProgress ?? {};
  const now = Date.now();
  const header = ['Name', 'Email', 'Class', 'Exercises Done', 'Completion %', 'Total XP', 'Hints Used', 'Last Active'];
  const rows = students.map(s => {
    const prog     = ap[s.uid] ?? {};
    const done     = Object.keys(prog.completed ?? {}).length;
    const pct      = Math.round((done / TOTAL_EXERCISES) * 100);
    const xp       = prog.totalXP ?? 0;
    const hints    = Object.values(prog.hintsUsed ?? {}).reduce((a, b) => a + b, 0);
    const lastRunMs = prog.lastRunAt;
    const last     = lastRunMs ? new Date(lastRunMs).toLocaleDateString('en-GB') : '—';
    return [s.displayName ?? '', s.email ?? '', s.classCode ?? '', done, pct + '%', xp, hints, last];
  });

  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `pylab_class_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

// ── Re-validate all submissions (superadmin only) ─────────────────────────────

async function _revalidateAll(students) {
  if (!students.length) return;

  // Build modal
  const overlay = document.createElement('div');
  overlay.className = 'rv-overlay';
  overlay.innerHTML = `
    <div class="rv-card">
      <div class="rv-title">Re-validating Submissions</div>
      <p class="rv-subtitle">Re-running all saved student code against the current exercise tests and rules.</p>
      <div class="rv-progress-track"><div class="rv-progress-bar" id="rv-bar"></div></div>
      <div class="rv-label" id="rv-label">Starting…</div>
      <div class="rv-changes" id="rv-changes" style="display:none"></div>
      <div class="rv-actions">
        <button class="btn-ghost btn-sm" id="rv-cancel">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  let cancelled = false;
  overlay.querySelector('#rv-cancel').addEventListener('click', () => { cancelled = true; });

  const runner = new PythonRunner({
    onOutput: () => {}, onError: () => {}, onComplete: () => {},
    onInputRequest: () => Promise.resolve(''), turtleTarget: null
  });

  const total = students.length;
  let done = 0;
  const changes = [];

  for (const student of students) {
    if (cancelled) break;

    const prog = (_allProgress ?? {})[student.uid];
    if (!prog) { done++; continue; }

    const submissions  = prog.submissions ?? {};
    const oldCompleted = prog.completed   ?? {};
    const newCompleted = {};
    let   newXP        = 0;

    const exsWithCode = EXERCISES.filter(ex => submissions[ex.id]?.code);

    for (const ex of exsWithCode) {
      if (cancelled) break;

      overlay.querySelector('#rv-label').textContent =
        `${student.displayName ?? student.email} — ${ex.title}`;

      const code = submissions[ex.id].code;

      // ── Static inputType check ──
      if (ex.inputType) {
        const needsInt   = ex.inputType === 'int'   || ex.inputType === 'int_float';
        const needsFloat = ex.inputType === 'float' || ex.inputType === 'int_float';
        if ((needsInt   && !/\bint\s*\(\s*input\s*\(/.test(code)) ||
            (needsFloat && !/\bfloat\s*\(\s*input\s*\(/.test(code))) {
          continue; // fails convention — not completed
        }
      }

      // ── Run Skulpt tests ──
      let allPass = true;
      for (const tc of ex.tests) {
        const { outputs, error } = await runner.runForTests(code, tc.inputs);
        if (error || !_compareOutputsRV(outputs, tc.expected)) { allPass = false; break; }
      }

      if (allPass) {
        // Preserve original completedAt timestamp if it existed
        newCompleted[ex.id] = oldCompleted[ex.id] ?? { completedAt: Date.now() };
        newXP += ex.xp;
      }
    }

    const oldDone = Object.keys(oldCompleted).length;
    const newDone = Object.keys(newCompleted).length;
    const oldXP   = prog.totalXP ?? 0;

    if (oldDone !== newDone || oldXP !== newXP) {
      changes.push({
        name: student.displayName ?? student.email,
        oldDone, newDone, oldXP, newXP
      });
    }

    // Save updated progress
    const updatedProg = { ...prog, completed: newCompleted, totalXP: newXP };
    try {
      await saveChallengeProgress(student.uid, updatedProg);
      if (student.classCode) {
        await updateLeaderboard(
          student.uid, student.classCode,
          student.displayName ?? student.email, newXP
        );
      }
      if (_allProgress) _allProgress[student.uid] = updatedProg;
    } catch (e) {
      console.warn('Re-validate: save failed for', student.uid, e);
    }

    done++;
    overlay.querySelector('#rv-bar').style.width = Math.round((done / total) * 100) + '%';
  }

  if (cancelled) {
    overlay.remove();
    return;
  }

  // Show summary
  overlay.querySelector('#rv-bar').style.width = '100%';
  overlay.querySelector('#rv-bar').classList.add('rv-bar--done');
  overlay.querySelector('#rv-label').textContent =
    changes.length
      ? `Done — ${changes.length} student record${changes.length !== 1 ? 's' : ''} updated.`
      : 'Done — all records are already up to date.';

  if (changes.length) {
    const changesEl = overlay.querySelector('#rv-changes');
    changesEl.style.display = '';
    changesEl.innerHTML = changes.map(c => {
      const dir = c.newDone > c.oldDone ? '▲' : c.newDone < c.oldDone ? '▼' : '~';
      const cls = c.newDone > c.oldDone ? 'rv-chg--up' : c.newDone < c.oldDone ? 'rv-chg--down' : '';
      return `<div class="rv-change-row ${cls}">
        <span class="rv-chg-name">${escHtml(c.name)}</span>
        <span class="rv-chg-stat">${dir} ${c.oldDone}→${c.newDone} exercises &nbsp;·&nbsp; ${c.oldXP}→${c.newXP} XP</span>
      </div>`;
    }).join('');
  }

  const cancelBtn = overlay.querySelector('#rv-cancel');
  cancelBtn.textContent = 'Close & Refresh';
  cancelBtn.addEventListener('click', () => {
    overlay.remove();
    _render(_containerEl, null);
  }, { once: true });
}

function _compareOutputsRV(got, expected) {
  const clean = arr => { const a = [...arr]; while (a.length && a[a.length - 1] === '') a.pop(); return a; };
  const g = clean(got.map(l => l.trimEnd()));
  const e = clean(expected.map(l => l.trimEnd()));
  return g.length === e.length && g.every((line, i) => line === e[i]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
