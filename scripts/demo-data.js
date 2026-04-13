// ─── Demo Class Data ───────────────────────────────────────────────────────────
// Generates realistic fake data for 5 demo students.
// Timestamps are computed at call time so activity charts always look current.

import { EXERCISES } from './exercises.js';

export function generateDemoData() {
  const now = Date.now();
  const DAY = 86400000;

  const students = [
    { uid: 'demo-alice', displayName: 'Alice Chen',  email: 'alice@demo.school', classCode: 'DEMO', role: 'student' },
    { uid: 'demo-ben',   displayName: 'Ben Malik',   email: 'ben@demo.school',   classCode: 'DEMO', role: 'student' },
    { uid: 'demo-chloe', displayName: 'Chloe Park',  email: 'chloe@demo.school', classCode: 'DEMO', role: 'student' },
    { uid: 'demo-dylan', displayName: 'Dylan Osei',  email: 'dylan@demo.school', classCode: 'DEMO', role: 'student' },
    { uid: 'demo-emma',  displayName: 'Emma Torres', email: 'emma@demo.school',  classCode: 'DEMO', role: 'student' },
  ];

  const allProgress = {
    // Alice: 95/130 — Ahead. Low hint usage. Grinding through Functions.
    'demo-alice': _makeProgress(95, now - 1 * DAY, {
      attempts:  { 'fn-20': 3, 'fn-21': 4, 'fn-22': 6 },
      hintsUsed: { 'fn-15': 1, 'fn-17': 2 },
    }),
    // Ben: 65/130 — On Track. Stuck on hard Iteration exercises.
    'demo-ben': _makeProgress(65, now - 2 * DAY, {
      attempts:  { 'itr-15': 6, 'itr-16': 4, 'itr-17': 5 },
      hintsUsed: { 'itr-15': 3, 'itr-17': 3, 'sel-15': 2 },
    }),
    // Chloe: 48/130 — On Track but heavy hint user (intervention signal).
    'demo-chloe': _makeProgress(48, now - 3 * 3600000, {
      attempts:  { 'sel-15': 7, 'itr-01': 3 },
      hintsUsed: { 'sel-10': 3, 'sel-11': 2, 'sel-12': 3, 'sel-13': 2, 'sel-14': 3, 'sel-15': 4 },
    }),
    // Dylan: 28/130 — Behind. Stuck on medium/hard Operators exercises.
    'demo-dylan': _makeProgress(28, now - 3 * DAY, {
      attempts:  { 'ops-14': 6, 'ops-16': 7, 'ops-17': 5 },
      hintsUsed: { 'ops-14': 2, 'ops-16': 3 },
    }),
    // Emma: 6/130 — At Risk. Inactive for 9 days.
    'demo-emma': _makeProgress(6, now - 9 * DAY, {
      attempts:  { 'var-07': 3, 'var-08': 4 },
      hintsUsed: {},
    }),
  };

  const sessions = _makeSessions(students, now, DAY);

  return { students, sessions, allProgress };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _makeProgress(count, lastRunAt, { attempts = {}, hintsUsed = {} } = {}) {
  const completed = {};
  let totalXP = 0;
  const now = Date.now();

  // Space completions evenly over the last 30 days
  EXERCISES.slice(0, count).forEach((ex, i) => {
    completed[ex.id] = { completedAt: now - (count - i) * 4 * 3600000 };
    totalXP += ex.xp;
  });

  const badges = [];
  if (count  >= 1)   badges.push('first_step');
  if (count  >= 10)  badges.push('getting_going');
  if (count  >= 65)  badges.push('halfway');
  if (count  >= 130) badges.push('master');
  if (totalXP >= 100)  badges.push('xp_100');
  if (totalXP >= 500)  badges.push('xp_500');
  if (totalXP >= 1000) badges.push('xp_1000');

  return { completed, totalXP, badges, attempts, hintsUsed, lastRunAt };
}

function _makeSessions(students, now, DAY) {
  const sessions = [];

  // Runs per day over the last 7 days — index 0 = 6 days ago, index 6 = today
  const activity = {
    'demo-alice': [4, 3, 5, 2, 6, 0, 4],
    'demo-ben':   [0, 3, 0, 4, 2, 3, 0],
    'demo-chloe': [2, 0, 3, 1, 0, 2, 5],
    'demo-dylan': [0, 2, 1, 0, 3, 0, 0],
    'demo-emma':  [0, 0, 0, 0, 0, 0, 0],
  };
  const cats      = ['variables','operators','selection','iteration','lists','functions'];
  const constSets = [['for','if'],['while'],['def','return'],['if','elif','else'],['list','for']];

  let idx = 0;
  students.forEach(s => {
    (activity[s.uid] ?? []).forEach((count, dayIdx) => {
      const daysAgo = 6 - dayIdx;
      for (let r = 0; r < count; r++) {
        const ts = now - daysAgo * DAY - r * 1800000;
        sessions.push({
          id:         `demo-sess-${idx}`,
          uid:        s.uid,
          classCode:  'DEMO',
          timestamp:  { toMillis: () => ts },
          hadError:   idx % 3 === 0,
          category:   cats[idx % cats.length],
          constructs: constSets[idx % constSets.length],
        });
        idx++;
      }
    });
  });

  return sessions;
}
