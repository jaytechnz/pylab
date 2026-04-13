// ─── Authentication ────────────────────────────────────────────────────────
// Login-only: accounts are created by teachers/superadmin via admin panel.
// Domain policy:
//   @cga.school          → teacher
//   @student.cga.school  → student
// Superadmin emails are hard-coded below.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

import { auth, db } from './firebase-config.js';

// ── Superadmin emails ────────────────────────────────────────────────────────
const SUPERADMIN_EMAILS = new Set([
  'j.smith@cga.school',
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function domainOf(email) {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

function roleForEmail(email) {
  const lower = email.toLowerCase();
  if (SUPERADMIN_EMAILS.has(lower)) return 'superadmin';
  const domain = domainOf(lower);
  if (domain === 'cga.school')         return 'teacher';
  if (domain === 'student.cga.school') return 'student';
  return null;
}

function validateDomain(email) {
  const role = roleForEmail(email.toLowerCase());
  if (!role) throw new Error('Only @cga.school and @student.cga.school accounts may use PyLab.');
  return role;
}

// ── Sign in (public) ─────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const role  = roleForEmail(email);
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:         cred.user.uid,
    email:       email.toLowerCase(),
    displayName: cred.user.displayName || email.split('@')[0],
    role,
    lastLoginAt: serverTimestamp()
  }, { merge: true });
  return { user: cred.user, role };
}

// ── Create account (admin/teacher only) ──────────────────────────────────────
// Called programmatically from admin panel; second user may be created while
// admin is signed in, leaving admin signed in (Firebase re-signs in the admin).

export async function createAccount(email, password, displayName, classCode = '', role = null) {
  validateDomain(email);
  const resolvedRole = role ?? roleForEmail(email);

  // Create Firebase Auth user — this signs the NEW user in temporarily.
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:         cred.user.uid,
    email:       email.toLowerCase(),
    displayName,
    role:        resolvedRole,
    classCode:   resolvedRole === 'student' ? (classCode.trim().toUpperCase() || '') : '',
    createdAt:   serverTimestamp(),
    lastLoginAt: serverTimestamp()
  });

  // Sign back in as the admin to restore their session.
  // (The caller must pass adminEmail/adminPassword for this to work.)
  return { uid: cred.user.uid, role: resolvedRole };
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export async function signOutUser() {
  await signOut(auth);
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Update class code ────────────────────────────────────────────────────────

export async function updateUserClassCode(uid, classCode) {
  await updateDoc(doc(db, 'users', uid), {
    classCode: classCode.trim().toUpperCase()
  });
}

// ── Auth state observer ──────────────────────────────────────────────────────

export function onAuth(callback) {
  onAuthStateChanged(auth, async user => {
    if (!user) { callback(null, null); return; }
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const profile = snap.exists() ? snap.data() : null;
      // Always ensure role is correct for known emails
      if (profile) {
        const canonicalRole = roleForEmail(user.email);
        if (canonicalRole && profile.role !== canonicalRole) {
          await updateDoc(doc(db, 'users', user.uid), { role: canonicalRole });
          profile.role = canonicalRole;
        }
      }
      callback(user, profile);
    } catch (e) {
      console.warn('Could not load user profile:', e);
      callback(user, null);
    }
  });
}

export { auth };
