// ─── Teacher Dashboard ─────────────────────────────────────────────────────────

import {
  getAllStudents, getSessions, aggregateAnalytics,
  getAllChallengeProgress, getAllTeacherFeedback, saveTeacherFeedback,
  getClassNames, saveClassName
} from './storage.js';
import { EXERCISES, CATEGORIES } from './exercises.js';

const TOTAL_EXERCISES = EXERCISES.length;  // 130

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
    <div class="dash-toolbar">
      <div class="dash-filter-bar">
        <span class="dash-filter-label">Class:</span>
        <button class="dash-filter-btn ${!selectedClass ? 'active' : ''}" data-class="">All Classes</button>
        ${classCodes.map(cc => `
          <button class="dash-filter-btn ${selectedClass === cc ? 'active' : ''}" data-class="${escHtml(cc)}">
            ${escHtml(_classNames[cc] || cc)}
          </button>`).join('')}
      </div>
      <button class="btn-ghost btn-sm dash-export-btn" id="btn-export-csv">Export CSV</button>
    </div>
    <div class="dashboard-grid" id="dash-inner"></div>
  `;

  container.querySelectorAll('.dash-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => _render(container, btn.dataset.class || null));
  });

  container.querySelector('#btn-export-csv')?.addEventListener('click', () =>
    _exportCSV(students)
  );

  const grid = container.querySelector('#dash-inner');
  grid.innerHTML = `
    ${_buildOverviewCard(analytics, students)}
    ${_buildTrafficLightCard(students)}
    ${_buildCategoryProgressCard(students)}
    ${_buildActivityChart(sessions)}
    ${_buildHeatmapCard(students)}
    ${_buildInterventionsCard(students)}
    ${_buildAtRiskCard(students)}
    ${_buildStudentTable(students)}
    ${_buildHardestExercisesCard(students)}
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

  const cells = EXERCISES.map(ex => {
    const completedCount = students.filter(s => (ap[s.uid] ?? {}).completed?.[ex.id]).length;
    const pct = completedCount / n;
    // 0 = grey, low = red, mid = amber, high = green
    let bg;
    if (completedCount === 0) bg = 'var(--border)';
    else if (pct < 0.25) bg = '#ef4444';
    else if (pct < 0.5)  bg = '#f97316';
    else if (pct < 0.75) bg = '#eab308';
    else                 bg = 'var(--accent)';

    return `<div class="heatmap-cell" style="background:${bg}"
                 title="${escHtml(ex.title)}: ${completedCount}/${students.length} completed"></div>`;
  }).join('');

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
      text: `${stuckStudents.length} student${stuckStudents.length > 1 ? 's' : ''} attempted an exercise 5+ times without completing: ${stuckStudents.slice(0, 3).map(escHtml).join(', ')}${stuckStudents.length > 3 ? '…' : ''}.`
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
      text: `${inactiveStudents.length} student${inactiveStudents.length > 1 ? 's' : ''} ha${inactiveStudents.length > 1 ? 've' : 's'} not been active in 7+ days: ${inactiveStudents.slice(0, 3).map(s => escHtml(s.displayName ?? s.email)).join(', ')}${inactiveStudents.length > 3 ? '…' : ''}.`
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
      text: `${highHintStudents.length} student${highHintStudents.length > 1 ? 's' : ''} ${highHintStudents.length > 1 ? 'are' : 'is'} using many hints with low completion — may need 1:1 support: ${highHintStudents.slice(0, 3).map(escHtml).join(', ')}.`
    });
  }

  if (!suggestions.length) {
    suggestions.push({ icon: '✅', text: 'No intervention signals detected — the class is progressing well!' });
  }

  const items = suggestions.map(s =>
    `<div class="intervention-item">
      <span class="intervention-icon">${s.icon}</span>
      <span class="intervention-text">${s.text}</span>
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

  // Category breakdown bars
  const catBars = CATEGORIES.map(cat => {
    const catExs    = EXERCISES.filter(e => e.category === cat.id);
    const catDone   = catExs.filter(e => prog.completed?.[e.id]).length;
    const pct       = catExs.length ? Math.round((catDone / catExs.length) * 100) : 0;
    const barCol    = pct >= 70 ? 'var(--accent)' : pct >= 40 ? 'var(--warning)' : 'var(--error)';
    return `<div class="dash-progress-row">
      <span class="dash-progress-label">${cat.icon} ${cat.label}</span>
      <div class="dash-progress-bar-wrap"><div class="dash-progress-bar" style="width:${pct}%;background:${barCol}"></div></div>
      <span class="dash-progress-pct">${catDone}/${catExs.length}</span>
    </div>`;
  }).join('');

  // Stuck exercises (5+ attempts, not complete)
  const attempts = prog.attempts ?? {};
  const stuck = Object.entries(attempts)
    .filter(([id, count]) => count >= 3 && !prog.completed?.[id])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const ex = EXERCISES.find(e => e.id === id);
      return `<div class="stuck-item">
        <span class="stuck-name">${escHtml(ex?.title ?? id)}</span>
        <span class="stuck-cat">${ex?.category ?? ''}</span>
        <span class="stuck-count">${count} attempts</span>
      </div>`;
    }).join('');

  // Badges earned
  const badges = (prog.badges ?? []).join(', ') || 'None yet';

  const html = `<div class="student-drilldown-panel">
    <div class="drilldown-header">
      <strong>${escHtml(student.displayName ?? student.email)}</strong>
      <span class="drilldown-stats">${done} exercises · ${xp} XP · ${hints} hints used</span>
      <button class="btn-ghost btn-sm drilldown-close-btn">✕ Close</button>
    </div>
    <div class="drilldown-body">
      <div class="drilldown-section">
        <div class="drilldown-section-title">Topic Breakdown</div>
        <div class="dash-progress-list">${catBars}</div>
      </div>
      <div class="drilldown-section">
        <div class="drilldown-section-title">Struggling Exercises (3+ attempts, incomplete)</div>
        ${stuck || '<p class="feedback-empty">No stuck exercises.</p>'}
        ${stuck ? '<div class="stuck-list">' + stuck + '</div>' : ''}
      </div>
      <div class="drilldown-section">
        <div class="drilldown-section-title">Badges Earned</div>
        <p class="drilldown-badges">${escHtml(badges)}</p>
      </div>
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
