// ─── Firestore Storage ────────────────────────────────────────────────────────
// Collections:
//   users/{uid}                          — user profile
//   programs/{progId}                    — saved programs
//   sessions/{sessionId}                 — run-session analytics
//   challenge_progress/{uid}             — XP, completed exercises, submissions
//   leaderboard/{classCode}/{uid}        — class leaderboard entries
//   teacher_feedback/{uid}/{exId}        — teacher feedback per exercise
//   class_names/{classCode}              — friendly name for a class

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

import { db } from './firebase-config.js';

// ══════════════════════════════════════════════════════════════════════════════
// PROGRAMS
// ══════════════════════════════════════════════════════════════════════════════

export async function saveNewProgram(uid, { title, source }) {
  const ref = await addDoc(collection(db, 'programs'), {
    uid, title: title || 'Untitled', source,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateProgram(programId, { title, source }) {
  const updates = { source, updatedAt: serverTimestamp() };
  if (title !== undefined) updates.title = title;
  await updateDoc(doc(db, 'programs', programId), updates);
}

export async function loadProgram(programId) {
  const snap = await getDoc(doc(db, 'programs', programId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listPrograms(uid) {
  const q = query(collection(db, 'programs'), where('uid', '==', uid));
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  docs.sort((a, b) => {
    const ta = a.updatedAt?.toMillis?.() ?? 0;
    const tb = b.updatedAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
  return docs;
}

export async function deleteProgram(programId) {
  await deleteDoc(doc(db, 'programs', programId));
}

export async function renameProgram(programId, newTitle) {
  await updateDoc(doc(db, 'programs', programId), {
    title: newTitle, updatedAt: serverTimestamp()
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SESSIONS (analytics)
// ══════════════════════════════════════════════════════════════════════════════

export async function saveSession(uid, classCode, data) {
  await addDoc(collection(db, 'sessions'), {
    uid, classCode: classCode || '',
    timestamp: serverTimestamp(),
    ...data
  });
}

export async function getSessions() {
  const snap = await getDocs(collection(db, 'sessions'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS (for dashboard)
// ══════════════════════════════════════════════════════════════════════════════

export async function getAllStudents() {
  const q = query(
    collection(db, 'users'),
    where('role', 'in', ['student'])
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ══════════════════════════════════════════════════════════════════════════════
// CHALLENGE PROGRESS
// ══════════════════════════════════════════════════════════════════════════════

export async function getChallengeProgress(uid) {
  const snap = await getDoc(doc(db, 'challenge_progress', uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveChallengeProgress(uid, progress) {
  await setDoc(doc(db, 'challenge_progress', uid), progress);
}

export async function getAllChallengeProgress() {
  const snap = await getDocs(collection(db, 'challenge_progress'));
  const result = {};
  snap.docs.forEach(d => { result[d.id] = d.data(); });
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ══════════════════════════════════════════════════════════════════════════════

export async function updateLeaderboard(uid, classCode, displayName, totalXP) {
  if (!classCode) return;
  await setDoc(doc(db, 'leaderboard', `${classCode}_${uid}`), {
    uid, classCode, displayName, totalXP,
    updatedAt: serverTimestamp()
  });
}

export async function getClassLeaderboard(classCode) {
  if (!classCode) return [];
  const q = query(
    collection(db, 'leaderboard'),
    where('classCode', '==', classCode)
  );
  const snap = await getDocs(q);
  const entries = snap.docs.map(d => d.data());
  entries.sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0));
  return entries;
}

export async function getAllLeaderboardEntries() {
  const snap = await getDocs(collection(db, 'leaderboard'));
  return snap.docs.map(d => d.data());
}

// ══════════════════════════════════════════════════════════════════════════════
// TEACHER FEEDBACK
// ══════════════════════════════════════════════════════════════════════════════

export async function saveTeacherFeedback(teacherUid, studentUid, exId, comment) {
  await setDoc(doc(db, 'teacher_feedback', `${studentUid}_${exId}`), {
    teacherUid, studentUid, exId, comment,
    updatedAt: serverTimestamp(),
    readAt: null
  });
}

export async function getAllTeacherFeedback() {
  const snap = await getDocs(collection(db, 'teacher_feedback'));
  const result = {};
  snap.docs.forEach(d => {
    const data = d.data();
    if (!result[data.studentUid]) result[data.studentUid] = {};
    result[data.studentUid][data.exId] = data.comment;
  });
  return result;
}

export async function getStudentFeedback(uid) {
  const snap = await getDocs(
    query(collection(db, 'teacher_feedback'), where('studentUid', '==', uid))
  );
  const result = {};
  snap.docs.forEach(d => {
    const data = d.data();
    result[data.exId] = {
      comment:   data.comment,
      updatedAt: data.updatedAt,
      readAt:    data.readAt ?? null
    };
  });
  return result;
}

export async function markFeedbackRead(studentUid, exId) {
  await updateDoc(doc(db, 'teacher_feedback', `${studentUid}_${exId}`), {
    readAt: serverTimestamp()
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// CLASS NAMES
// ══════════════════════════════════════════════════════════════════════════════

export async function getClassNames() {
  const snap = await getDocs(collection(db, 'class_names'));
  const result = {};
  snap.docs.forEach(d => { result[d.id] = d.data().name; });
  return result;
}

export async function saveClassName(classCode, name) {
  await setDoc(doc(db, 'class_names', classCode), { name });
}

export async function addClassCodeToTeacher(uid, classCode) {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const existing = snap.data()?.classCodes ?? [];
  if (!existing.includes(classCode)) {
    await updateDoc(ref, { classCodes: [...existing, classCode] });
  }
}

export async function removeStudentFromClass(uid) {
  await updateDoc(doc(db, 'users', uid), { classCode: '' });
}

// ══════════════════════════════════════════════════════════════════════════════
// QUIZ PROGRESS
// ══════════════════════════════════════════════════════════════════════════════

export async function getQuizProgress(uid) {
  const snap = await getDoc(doc(db, 'quiz_progress', uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveQuizProgress(uid, data) {
  await setDoc(doc(db, 'quiz_progress', uid), data);
}

export async function getAllQuizProgress() {
  const snap = await getDocs(collection(db, 'quiz_progress'));
  const result = {};
  snap.docs.forEach(d => { result[d.id] = d.data(); });
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// PROGRAM SUBMISSIONS (teacher feedback & marks)
// ══════════════════════════════════════════════════════════════════════════════

export async function submitProgram(uid, programId, title, code, classCode, displayName) {
  const q = query(collection(db, 'program_submissions'),
    where('uid', '==', uid), where('programId', '==', programId));
  const existing = await getDocs(q);
  if (!existing.empty) {
    const docId = existing.docs[0].id;
    const prevStatus = existing.docs[0].data().status;
    await updateDoc(doc(db, 'program_submissions', docId), {
      code, title, submittedAt: serverTimestamp(),
      status: prevStatus === 'reviewed' ? 'reviewed' : 'pending'
    });
    return docId;
  }
  const ref = await addDoc(collection(db, 'program_submissions'), {
    uid, programId, title, code,
    classCode: classCode || '', displayName: displayName || '',
    submittedAt: serverTimestamp(),
    status: 'pending', mark: null, feedback: null,
    feedbackAt: null, teacherUid: null
  });
  return ref.id;
}

export async function getStudentSubmissions(uid) {
  const q = query(collection(db, 'program_submissions'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getClassProgramSubmissions(classCodes) {
  if (!classCodes?.length) return [];
  const results = [];
  for (let i = 0; i < classCodes.length; i += 10) {
    const batch = classCodes.slice(i, i + 10);
    const q = query(collection(db, 'program_submissions'), where('classCode', 'in', batch));
    const snap = await getDocs(q);
    snap.docs.forEach(d => results.push({ id: d.id, ...d.data() }));
  }
  return results;
}

export async function getAllProgramSubmissions() {
  const snap = await getDocs(collection(db, 'program_submissions'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function upsertProgramReview(uid, programId, title, code, classCode, displayName, teacherUid, mark, feedback) {
  const q = query(collection(db, 'program_submissions'),
    where('uid', '==', uid), where('programId', '==', programId));
  const existing = await getDocs(q);
  const reviewData = {
    mark: (mark !== '' && mark !== null && mark !== undefined) ? Number(mark) : null,
    feedback: feedback || null,
    teacherUid,
    status: 'reviewed',
    feedbackAt: serverTimestamp()
  };
  if (!existing.empty) {
    await updateDoc(doc(db, 'program_submissions', existing.docs[0].id), reviewData);
    return existing.docs[0].id;
  }
  const ref = await addDoc(collection(db, 'program_submissions'), {
    uid, programId, title, code,
    classCode: classCode || '', displayName: displayName || '',
    submittedAt: serverTimestamp(),
    ...reviewData
  });
  return ref.id;
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS AGGREGATION
// ══════════════════════════════════════════════════════════════════════════════

export function aggregateAnalytics(sessions, students) {
  const studentCount = students.length;
  const totalRuns  = sessions.length;
  const errorRuns  = sessions.filter(s => s.hadError).length;
  const avgRunsPerStudent = studentCount ? (totalRuns / studentCount).toFixed(1) : 0;

  // Category XP totals across all students
  const categoryXP = {};
  sessions.forEach(s => {
    if (s.category) {
      categoryXP[s.category] = (categoryXP[s.category] || 0) + 1;
    }
  });

  // Construct use frequency
  const constructs = {};
  sessions.forEach(s => {
    if (Array.isArray(s.constructs)) {
      s.constructs.forEach(c => { constructs[c] = (constructs[c] || 0) + 1; });
    }
  });

  // Error types
  const errorTypes = {};
  sessions.forEach(s => {
    if (s.errorType) {
      errorTypes[s.errorType] = (errorTypes[s.errorType] || 0) + 1;
    }
  });

  return { studentCount, totalRuns, errorRuns, avgRunsPerStudent, categoryXP, constructs, errorTypes };
}
