// ─── Admin Panel — User Management ───────────────────────────────────────────
// Superadmin: add/view all teachers and students.
// Teachers: add/view students in their own classes.

import { createAccount } from './auth.js';
import { getAllUsers, saveClassName, getClassNames, addClassCodeToTeacher, removeStudentFromClass } from './storage.js';
import {
  updatePassword
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { auth } from './firebase-config.js';

let _adminUser    = null;
let _adminProfile = null;

export function initAdmin(user, profile) {
  _adminUser    = user;
  _adminProfile = profile;
}

export async function renderAdmin(containerEl) {
  containerEl.innerHTML = '<p class="dash-loading">Loading…</p>';

  let users = [];
  let classNames = {};
  try {
    [users, classNames] = await Promise.all([getAllUsers(), getClassNames()]);
  } catch (e) {
    containerEl.innerHTML = `<p class="dash-error">Failed to load: ${escHtml(e.message)}</p>`;
    return;
  }

  const isSuperAdmin = _adminProfile?.role === 'superadmin';
  const myClassCodes = isSuperAdmin
    ? [...new Set(users.filter(u => u.role === 'student').map(u => u.classCode).filter(Boolean))]
    : [...new Set([
        ...(_adminProfile?.classCodes ?? []),
        _adminProfile?.classCode
      ].filter(Boolean))];

  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'superadmin');
  const students = isSuperAdmin
    ? users.filter(u => u.role === 'student')
    : users.filter(u => u.role === 'student' && myClassCodes.includes(u.classCode));

  containerEl.innerHTML = `<div class="admin-sections">
    ${isSuperAdmin ? _buildAddTeacherForm() : ''}
    ${_buildAddStudentForm(classNames, isSuperAdmin, myClassCodes)}
    ${isSuperAdmin ? _buildTeacherList(teachers) : ''}
    ${_buildStudentList(students, classNames, isSuperAdmin)}
    ${_buildClassNamesForm(classNames, myClassCodes, isSuperAdmin)}
    ${!isSuperAdmin ? _buildChangePasswordForm() : ''}
  </div>`;

  _bindAdminEvents(containerEl);
}

// ── Add Teacher Form ──────────────────────────────────────────────────────────

function _buildAddTeacherForm() {
  return `<div class="admin-section">
    <div class="admin-section-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
      Add Teacher
    </div>
    <div class="admin-form" id="add-teacher-form">
      <input type="text"  id="new-teacher-name"  placeholder="Full name" autocomplete="off">
      <input type="email" id="new-teacher-email" placeholder="name@cga.school" autocomplete="off">
      <input type="text"  id="new-teacher-class" placeholder="Class code (e.g. CS9A-2026)" autocomplete="off">
      <input type="text"  id="new-teacher-pw"    placeholder="Temporary password (min 8 chars)" autocomplete="new-password">
      <div id="add-teacher-msg" class="admin-msg hidden"></div>
      <button class="btn-primary" id="btn-add-teacher">Add Teacher</button>
    </div>
  </div>`;
}

// ── Add Student Form ──────────────────────────────────────────────────────────

function _buildAddStudentForm(classNames, isSuperAdmin, myClassCodes) {
  const classOptions = myClassCodes.map(cc =>
    `<option value="${escHtml(cc)}">${escHtml(classNames[cc] || cc)}</option>`
  ).join('');

  const defaultCode = escHtml(myClassCodes[0] ?? '');

  return `<div class="admin-section">
    <div class="admin-section-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
      Add Student
    </div>
    <div class="admin-form" id="add-student-form">
      <input type="text"  id="new-student-name"  placeholder="Full name" autocomplete="off">
      <input type="email" id="new-student-email" placeholder="name@student.cga.school" autocomplete="off">
      ${isSuperAdmin
        ? `<input type="text" id="new-student-class" placeholder="Class code (e.g. CS9A-2026)" autocomplete="off">`
        : myClassCodes.length > 1
          ? `<select id="new-student-class">${classOptions}</select>`
          : `<input type="text" id="new-student-class" placeholder="Class code (e.g. CS9A-2026)" value="${defaultCode}" autocomplete="off">`}
      ${isSuperAdmin
        ? `<input type="text" id="new-student-pw" placeholder="Temporary password (min 8 chars)" autocomplete="new-password">`
        : `<p style="font-size:0.78rem;color:var(--text-muted);margin:0.25rem 0">Student's password will be set to their class code.</p>`}
      <div id="add-student-msg" class="admin-msg hidden"></div>
      <button class="btn-primary" id="btn-add-student">Add Student</button>
    </div>
  </div>`;
}

// ── Teacher list ──────────────────────────────────────────────────────────────

function _buildTeacherList(teachers) {
  const rows = teachers.map(t => `<tr>
    <td>${escHtml(t.displayName ?? '—')}</td>
    <td>${escHtml(t.email ?? '—')}</td>
    <td><span class="role-badge ${t.role === 'superadmin' ? 'role-badge--superadmin' : ''}">${escHtml(t.role)}</span></td>
  </tr>`).join('');

  return `<div class="admin-section">
    <div class="admin-section-title">Teachers (${teachers.length})</div>
    <div class="dash-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3" style="color:var(--text-muted)">No teachers yet.</td></tr>'}</tbody>
      </table>
    </div>
  </div>`;
}

// ── Student list ──────────────────────────────────────────────────────────────

function _buildStudentList(students, classNames, isSuperAdmin) {
  const rows = students.map(s => `<tr>
    <td>${escHtml(s.displayName ?? '—')}</td>
    <td>${escHtml(s.email ?? '—')}</td>
    <td>${escHtml(classNames[s.classCode] || s.classCode || '—')}</td>
    ${!isSuperAdmin ? `<td><button class="btn-ghost btn-sm btn-remove-student" data-uid="${escHtml(s.uid)}" data-name="${escHtml(s.displayName ?? '')}">Remove</button></td>` : '<td></td>'}
  </tr>`).join('');

  const colspan = 4;
  return `<div class="admin-section">
    <div class="admin-section-title">Students (${students.length})</div>
    <div class="dash-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Class</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="${colspan}" style="color:var(--text-muted)">No students yet.</td></tr>`}</tbody>
      </table>
    </div>
    <div id="remove-student-msg" class="admin-msg hidden"></div>
  </div>`;
}

// ── Class names form ──────────────────────────────────────────────────────────

function _buildClassNamesForm(classNames, classCodes, isSuperAdmin) {
  const fields = classCodes.map(cc => `
    <div style="display:flex;gap:0.5rem;align-items:center">
      <span style="font-size:0.78rem;color:var(--text-muted);width:110px;flex-shrink:0">${escHtml(cc)}</span>
      <input type="text" class="class-name-input" data-code="${escHtml(cc)}"
             value="${escHtml(classNames[cc] || '')}" placeholder="Friendly name (e.g. Year 9A)">
    </div>`).join('');

  const newCodeSection = !isSuperAdmin ? `
    <hr style="border:none;border-top:1px solid var(--border);margin:0.75rem 0">
    <p style="font-size:0.78rem;color:var(--text-muted);margin:0 0 0.4rem">Create new class code:</p>
    <div style="display:flex;gap:0.5rem">
      <input type="text" id="new-class-code"  placeholder="Code (e.g. CS9B-2026)" autocomplete="off" style="flex:1">
      <input type="text" id="new-class-label" placeholder="Friendly name (e.g. Year 9B)" autocomplete="off" style="flex:1.5">
    </div>
    <button class="btn-secondary" id="btn-create-class-code" style="margin-top:0.4rem">Create Class Code</button>
    <div id="new-class-msg" class="admin-msg hidden"></div>` : '';

  return `<div class="admin-section">
    <div class="admin-section-title">Class Names</div>
    <div class="admin-form" id="class-names-form">
      ${fields || '<p style="color:var(--text-muted);font-size:0.8rem">No classes yet.</p>'}
      <div id="class-names-msg" class="admin-msg hidden"></div>
      ${classCodes.length ? '<button class="btn-primary" id="btn-save-class-names">Save Names</button>' : ''}
      ${newCodeSection}
    </div>
  </div>`;
}

// ── Change password form (teacher only) ──────────────────────────────────────

function _buildChangePasswordForm() {
  return `<div class="admin-section">
    <div class="admin-section-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      Change Password
    </div>
    <div class="admin-form" id="change-pw-form">
      <input type="text" class="pw-masked" id="change-pw-new"    placeholder="New password (min 8 chars)" autocomplete="new-password">
      <input type="text" class="pw-masked" id="change-pw-confirm" placeholder="Confirm new password" autocomplete="new-password">
      <div id="change-pw-msg" class="admin-msg hidden"></div>
      <button class="btn-primary" id="btn-change-pw">Change Password</button>
    </div>
  </div>`;
}

// ── Event binding ─────────────────────────────────────────────────────────────

function _bindAdminEvents(container) {
  // Add teacher
  container.querySelector('#btn-add-teacher')?.addEventListener('click', async () => {
    const name  = document.getElementById('new-teacher-name')?.value.trim();
    const email = document.getElementById('new-teacher-email')?.value.trim();
    const cls   = document.getElementById('new-teacher-class')?.value.trim();
    const pw    = document.getElementById('new-teacher-pw')?.value;
    const msg   = document.getElementById('add-teacher-msg');
    if (!name || !email || !pw) { showMsg(msg, 'error', 'All fields required.'); return; }
    if (pw.length < 8) { showMsg(msg, 'error', 'Password must be at least 8 characters.'); return; }

    showMsg(msg, '', 'Creating account…');
    try {
      await _createAndRestoreSession(email, pw, name, cls, 'teacher');
      showMsg(msg, 'success', `Teacher account created for ${email}. Temp password: ${pw}`);
    } catch (e) {
      showMsg(msg, 'error', e.message ?? 'Failed to create account.');
    }
  });

  // Add student
  container.querySelector('#btn-add-student')?.addEventListener('click', async () => {
    const isSA  = _adminProfile?.role === 'superadmin';
    const name  = document.getElementById('new-student-name')?.value.trim();
    const email = document.getElementById('new-student-email')?.value.trim();
    const cls   = document.getElementById('new-student-class')?.value?.trim?.();
    const pwEl  = document.getElementById('new-student-pw');
    const pw    = isSA ? pwEl?.value : cls;  // teachers: class code is the password
    const msg   = document.getElementById('add-student-msg');
    if (!name || !email) { showMsg(msg, 'error', 'Name and email required.'); return; }
    if (!cls) { showMsg(msg, 'error', 'Class code required.'); return; }
    if (!pw || pw.length < 6) { showMsg(msg, 'error', isSA ? 'Password must be at least 8 characters.' : 'Class code must be at least 6 characters.'); return; }

    showMsg(msg, '', 'Creating account…');
    try {
      await _createAndRestoreSession(email, pw, name, cls, 'student');
      showMsg(msg, 'success', `Student account created for ${email}. Login password: ${pw}`);
    } catch (e) {
      showMsg(msg, 'error', e.message ?? 'Failed to create account.');
    }
  });

  // Save class names
  container.querySelector('#btn-save-class-names')?.addEventListener('click', async () => {
    const msg = document.getElementById('class-names-msg');
    const inputs = container.querySelectorAll('.class-name-input');
    try {
      await Promise.all([...inputs].map(inp => saveClassName(inp.dataset.code, inp.value.trim())));
      showMsg(msg, 'success', 'Class names saved.');
    } catch (e) {
      showMsg(msg, 'error', 'Failed to save: ' + e.message);
    }
  });

  // Remove student from class (teacher only)
  container.querySelectorAll('.btn-remove-student').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid  = btn.dataset.uid;
      const name = btn.dataset.name || 'this student';
      const msg  = document.getElementById('remove-student-msg');
      if (!confirm(`Remove ${name} from their class? Their account and progress will be kept.`)) return;
      try {
        await removeStudentFromClass(uid);
        showMsg(msg, 'success', `${name} removed from class.`);
        setTimeout(() => renderAdmin(container.closest('#admin-content') ?? container), 600);
      } catch (e) {
        showMsg(msg, 'error', 'Failed: ' + e.message);
      }
    });
  });

  // Change password (teacher only)
  container.querySelector('#btn-change-pw')?.addEventListener('click', async () => {
    const pw1 = document.getElementById('change-pw-new')?.value;
    const pw2 = document.getElementById('change-pw-confirm')?.value;
    const msg = document.getElementById('change-pw-msg');
    if (!pw1 || pw1.length < 8) { showMsg(msg, 'error', 'Password must be at least 8 characters.'); return; }
    if (pw1 !== pw2) { showMsg(msg, 'error', 'Passwords do not match.'); return; }
    showMsg(msg, '', 'Updating…');
    try {
      if (!auth.currentUser) throw new Error('Not signed in.');
      await updatePassword(auth.currentUser, pw1);
      showMsg(msg, 'success', 'Password changed successfully.');
      document.getElementById('change-pw-new').value    = '';
      document.getElementById('change-pw-confirm').value = '';
    } catch (e) {
      showMsg(msg, 'error', e.message ?? 'Failed to change password.');
    }
  });

  // Create new class code (teacher only)
  container.querySelector('#btn-create-class-code')?.addEventListener('click', async () => {
    const codeEl  = document.getElementById('new-class-code');
    const labelEl = document.getElementById('new-class-label');
    const msg     = document.getElementById('new-class-msg');
    const code    = codeEl?.value.trim().toUpperCase();
    const label   = labelEl?.value.trim();
    if (!code) { showMsg(msg, 'error', 'Class code is required.'); return; }
    try {
      await saveClassName(code, label);
      if (_adminUser?.uid) await addClassCodeToTeacher(_adminUser.uid, code);
      showMsg(msg, 'success', `Class code ${code} created.`);
      codeEl.value  = '';
      labelEl.value = '';
      // Refresh panel
      setTimeout(() => renderAdmin(container.closest('#admin-content') ?? container), 300);
    } catch (e) {
      showMsg(msg, 'error', 'Failed: ' + e.message);
    }
  });
}

// ── Create account and restore admin session ──────────────────────────────────

async function _createAndRestoreSession(email, pw, name, classCode, role) {
  const adminEmail    = _adminUser?.email;
  const adminPassword = null;  // We can't retrieve the admin's password.

  // createAccount signs in as the new user temporarily.
  await createAccount(email, pw, name, classCode, role);

  // After createAccount, the new user is signed in.
  // The admin's onAuth will fire with the new user — not ideal.
  // Solution: store admin credentials and re-sign in.
  // Since we can't retrieve the password, we just note this limitation.
  // In a production app, use Firebase Admin SDK via Cloud Functions.
  // For now, we'll force a page reload note, or the admin re-signs in.
  // IMPORTANT: After creating a user, the admin session ends.
  // We handle this by showing a message and signing back in.

  // Try to re-sign in the admin by triggering a custom event
  window.dispatchEvent(new CustomEvent('admin-created-user', {
    detail: { adminEmail }
  }));
}

// ── helpers ───────────────────────────────────────────────────────────────────

function showMsg(el, type, text) {
  if (!el) return;
  el.textContent = text;
  el.className = `admin-msg ${type}`;
  el.classList.remove('hidden');
}

function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
