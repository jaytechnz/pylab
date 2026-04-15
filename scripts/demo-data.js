// ─── Demo Class Data ───────────────────────────────────────────────────────────
// Generates realistic fake data for 5 demo students.
// Timestamps are computed at call time so activity charts always look current.

import { EXERCISES }      from './exercises.js';
import { SOLUTIONS }      from './solutions.js';
import { QUIZ_QUESTIONS } from './quiz-data.js';

// Realistic student attempt code for in-progress exercises.
// Each snippet is a plausible near-miss a student might write.
const IN_PROGRESS_CODE = {

  // Alice — stuck on hard Functions (95/130 done)
  'fn-20': `\
def to_binary(n):
    bits = ""
    while n > 0:
        bits = str(n % 2) + bits
        n = n // 2
    return bits

print(to_binary(10))
print(to_binary(255))
`,
  // Missing the n == 0 edge case — prints "" for 0 instead of "0"

  'fn-21': `\
def get_positive_int(prompt):
    try:
        value = int(input())
        if value > 0:
            return value
    except:
        pass

age = get_positive_int("Enter age: ")
print(age)
`,
  // Missing the while True loop — gives up after one bad input instead of looping

  'fn-22': `\
def print_table(n):
    header = "     "
    for j in range(1, n + 1):
        header += str(j).rjust(4)
    print(header)
    for i in range(1, n + 1):
        row = str(i)
        for j in range(1, n + 1):
            row += str(i * j).rjust(4)
        print(row)

print_table(4)
`,
  // Using rjust(4) — output is one character too narrow for the expected format

  // Ben — stuck on hard Iteration (65/130 done)
  'itr-15': `\
n = int(input())
is_prime = True
for i in range(2, n):
    if n % i == 0:
        is_prime = False
        break
if is_prime:
    print("Prime")
else:
    print("Not prime")
`,
  // Doesn't handle n <= 1 — prints "Prime" for 1, should print "Not prime"

  'itr-16': `\
n = int(input())
prev, curr = 0, 1
for i in range(n):
    print(curr)
    prev, curr = curr, prev + curr
`,
  // Prints curr instead of prev — sequence starts 1, 1, 2, 3... instead of 0, 1, 1, 2...

  'itr-17': `\
correct = "secure99"
for attempt in range(3):
    password = input()
    if password == correct:
        print("Welcome!")
        break
    else:
        print("Incorrect. Try again.")
print("Account locked.")
`,
  // Always prints "Account locked." even when login succeeds

  // Chloe — stuck on Rock Paper Scissors and early Iteration (48/130 done)
  'sel-15': `\
p1 = input()
p2 = input()
if p1 == p2:
    print("Draw")
elif p1 == "rock" and p2 == "scissors":
    print("Player 1 wins")
elif p1 == "paper" and p2 == "rock":
    print("Player 2 wins")
elif p1 == "scissors" and p2 == "paper":
    print("Player 1 wins")
else:
    print("Player 2 wins")
`,
  // paper beats rock gives "Player 2 wins" — swapped Player 1 and Player 2 for that case

  'itr-01': `\
for i in range(10):
    print(i)
`,
  // range(10) gives 0–9, not 1–10 — should be range(1, 11)

  // Dylan — stuck on hard Operators (28/130 done)
  'ops-14': `\
pi = 3.14159
radius = input()
area = pi * radius ** 2
print(round(area, 2))
`,
  // Missing float() — bare input() returns a string, causes TypeError

  'ops-16': `\
weight = input()
height = input()
bmi = weight / height ** 2
print(round(bmi, 1))
`,
  // Missing float() on both inputs — will crash with TypeError on arithmetic

  'ops-17': `\
total = int(input())
hours = total // 3600
minutes = total // 60
seconds = total % 60
print(str(hours) + " hours, " + str(minutes) + " minutes, " + str(seconds) + " seconds")
`,
  // minutes = total // 60 ignores hours — gives wrong minutes (e.g. 3661 → 61 min, not 1)

  // Emma — stuck on basic Variables I/O (6/130 done)
  'var-07': `\
name = input()
print("Hello " + name)
`,
  // Missing comma and exclamation mark — should be "Hello, <name>!"

  'var-08': `\
first_name = input()
last_name = input()
print(first_name + last_name)
`,
  // Missing the space between names — prints "JamesBond" instead of "James Bond"

};

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
      attempts:       { 'fn-20': 3, 'fn-21': 4, 'fn-22': 6 },
      hintsUsed:      { 'fn-15': 1, 'fn-17': 2 },
      inProgressCode: { 'fn-20': IN_PROGRESS_CODE['fn-20'], 'fn-21': IN_PROGRESS_CODE['fn-21'], 'fn-22': IN_PROGRESS_CODE['fn-22'] },
    }),
    // Ben: 65/130 — On Track. Stuck on hard Iteration exercises.
    'demo-ben': _makeProgress(65, now - 2 * DAY, {
      attempts:       { 'itr-15': 6, 'itr-16': 4, 'itr-17': 5 },
      hintsUsed:      { 'itr-15': 3, 'itr-17': 3, 'sel-15': 2 },
      inProgressCode: { 'itr-15': IN_PROGRESS_CODE['itr-15'], 'itr-16': IN_PROGRESS_CODE['itr-16'], 'itr-17': IN_PROGRESS_CODE['itr-17'] },
    }),
    // Chloe: 48/130 — On Track but heavy hint user (intervention signal).
    'demo-chloe': _makeProgress(48, now - 3 * 3600000, {
      attempts:       { 'sel-15': 7, 'itr-01': 3 },
      hintsUsed:      { 'sel-10': 3, 'sel-11': 2, 'sel-12': 3, 'sel-13': 2, 'sel-14': 3, 'sel-15': 4 },
      inProgressCode: { 'sel-15': IN_PROGRESS_CODE['sel-15'], 'itr-01': IN_PROGRESS_CODE['itr-01'] },
    }),
    // Dylan: 28/130 — Behind. Stuck on medium/hard Operators exercises.
    'demo-dylan': _makeProgress(28, now - 3 * DAY, {
      attempts:       { 'ops-14': 6, 'ops-16': 7, 'ops-17': 5 },
      hintsUsed:      { 'ops-14': 2, 'ops-16': 3 },
      inProgressCode: { 'ops-14': IN_PROGRESS_CODE['ops-14'], 'ops-16': IN_PROGRESS_CODE['ops-16'], 'ops-17': IN_PROGRESS_CODE['ops-17'] },
    }),
    // Emma: 6/130 — At Risk. Inactive for 9 days.
    'demo-emma': _makeProgress(6, now - 9 * DAY, {
      attempts:       { 'var-07': 3, 'var-08': 4 },
      hintsUsed:      {},
      inProgressCode: { 'var-07': IN_PROGRESS_CODE['var-07'], 'var-08': IN_PROGRESS_CODE['var-08'] },
    }),
  };

  const sessions = _makeSessions(students, now, DAY);

  const allQuizProgress = {
    // Alice: diligent — 80 questions, avg box 2–3, ~85% correct
    'demo-alice': _makeQuizProgress(80, 0.85, 2.5, now - 1 * DAY),
    // Ben: 50 questions, avg box 2, ~70% correct
    'demo-ben':   _makeQuizProgress(50, 0.70, 2.0, now - 2 * DAY),
    // Chloe: 35 questions, avg box 1–2, ~60% correct
    'demo-chloe': _makeQuizProgress(35, 0.60, 1.5, now - 3 * 3600000),
    // Dylan: 20 questions — mostly variables/operators, avg box 1, ~55% correct
    'demo-dylan': _makeQuizProgress(20, 0.55, 1.2, now - 3 * DAY, ['variables', 'operators']),
    // Emma: 8 questions, box 1, ~40% correct
    'demo-emma':  _makeQuizProgress(8,  0.40, 1.0, now - 9 * DAY),
  };

  return { students, sessions, allProgress, allQuizProgress };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _makeProgress(count, lastRunAt, { attempts = {}, hintsUsed = {}, inProgressCode = {} } = {}) {
  const completed  = {};
  const submissions = {};
  let totalXP = 0;
  const now = Date.now();

  // Space completions evenly over the last 30 days; attach model solution as saved code
  EXERCISES.slice(0, count).forEach((ex, i) => {
    completed[ex.id] = { completedAt: now - (count - i) * 4 * 3600000 };
    totalXP += ex.xp;
    if (SOLUTIONS[ex.id]) {
      submissions[ex.id] = { code: SOLUTIONS[ex.id], savedAt: now - (count - i) * 4 * 3600000 };
    }
  });

  // Attach in-progress code for attempted-but-not-completed exercises
  Object.entries(inProgressCode).forEach(([exId, code]) => {
    if (!completed[exId]) {
      submissions[exId] = { code, savedAt: now - Math.floor(Math.random() * 3600000) };
    }
  });

  const badges = [];
  if (count  >= 1)   badges.push('first_step');
  if (count  >= 10)  badges.push('getting_going');
  if (count  >= 65)  badges.push('halfway');
  if (count  >= 130) badges.push('master');
  if (totalXP >= 100)  badges.push('xp_100');
  if (totalXP >= 500)  badges.push('xp_500');
  if (totalXP >= 1000) badges.push('xp_1000');

  return { completed, submissions, totalXP, badges, attempts, hintsUsed, lastRunAt };
}

// ── Quiz progress helper ───────────────────────────────────────────────────────
// Selects `count` questions from the pool (optionally filtered to topics[]),
// assigns each a box (1–5, normally distributed around avgBox), and marks
// ~correctRate of them as correct. Returns the Firestore `answers` wrapper.

function _makeQuizProgress(count, correctRate, avgBox, lastActiveAt, topics = null) {
  const DAY       = 86400000;
  const INTERVALS = [0, 1, 4, 16]; // Leitner box → days (boxes 1–3)
  const pool      = topics
    ? QUIZ_QUESTIONS.filter(q => topics.includes(q.topic))
    : QUIZ_QUESTIONS;

  // Pick `count` questions spread across the pool
  const step      = Math.max(1, Math.floor(pool.length / count));
  const selected  = pool.filter((_, i) => i % step === 0).slice(0, count);

  const answers = {};
  selected.forEach((q, i) => {
    // Box: clamp 1–5, normally distributed around avgBox with some noise
    const noise = (Math.sin(i * 7.3) + Math.cos(i * 3.1)) * 0.8; // deterministic noise
    const box   = Math.min(3, Math.max(1, Math.round(avgBox + noise)));

    const correct    = (i / count) < correctRate; // deterministic: first N% are correct
    const daysAgo    = Math.max(0, (count - i) * 0.4); // spread attempts over recent past
    const attemptedAt = lastActiveAt - daysAgo * DAY;
    const interval    = INTERVALS[box] ?? 1;
    // Correct answers get the full interval; incorrect get a shorter re-review
    const nextReviewAt = attemptedAt + (correct ? interval : Math.max(1, Math.ceil(interval * 0.5))) * DAY;

    answers[q.id] = {
      box,
      correct,
      attemptedAt,
      nextReviewAt,
      confidence: correct ? (box >= 4 ? 'easy' : 'good') : (box === 1 ? 'again' : 'hard'),
    };
  });

  return { answers };
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
