// ─── Suggestions Module ───────────────────────────────────────────────────────
// Feature requests, error reports, and admin inbox.
// Superadmin (role: 'superadmin') sees all submissions and can reply.
// All other users see only their own submissions and any replies.

import {
  collection, addDoc, getDocs, updateDoc, doc,
  query, orderBy, where, serverTimestamp, onSnapshot
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db }        from './firebase-config.js';
import { EXERCISES } from './exercises.js';

// ── EmailJS config ───────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = 'EvJ6Rdcag3XTAxv_0';
const EMAILJS_SERVICE_ID  = 'service_wpoq1bp';
const EMAILJS_TEMPLATE_ID = 'template_qzpp70d';

const $ = id => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
  });
}

let _user    = null;
let _profile = null;
let _unsub   = null;

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC
// ══════════════════════════════════════════════════════════════════════════════

export function initSuggestions(user, profile) {
  _user    = user;
  _profile = profile;

  const isAdmin = profile?.role === 'superadmin';

  // Show admin-only dropdown items
  $('sg-admin-sep') ?.classList.toggle('hidden', !isAdmin);
  $('btn-sg-inbox') ?.classList.toggle('hidden', !isAdmin);

  // Populate exercise selector in error modal
  _buildExerciseSelect();

  // Live badge
  _unsub?.();
  _startBadge(isAdmin);
}

export function teardownSuggestions() {
  _unsub?.();
  _unsub = null;
}

// Called once on page load to wire all static event listeners
export function setupSuggestionsUI() {

  // ── Dropdown toggle ──────────────────────────────────────────────────────
  $('btn-suggestions')?.addEventListener('click', e => {
    e.stopPropagation();
    const dropdown = $('sg-dropdown');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
      const rect = e.currentTarget.getBoundingClientRect();
      dropdown.style.top   = (rect.bottom + 6) + 'px';
      dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    }
    dropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => $('sg-dropdown')?.classList.add('hidden'));

  // ── Dropdown items ───────────────────────────────────────────────────────
  $('btn-sg-request')?.addEventListener('click', () => {
    _closeDropdown();
    _clearStatus();
    $('sg-modal-request')?.classList.remove('hidden');
  });
  $('btn-sg-error')?.addEventListener('click', () => {
    _closeDropdown();
    _clearStatus();
    $('sg-modal-error')?.classList.remove('hidden');
  });
  $('btn-sg-mine')?.addEventListener('click', () => {
    _closeDropdown();
    _openInbox(false);
  });
  $('btn-sg-inbox')?.addEventListener('click', () => {
    _closeDropdown();
    _openInbox(true);
  });

  // ── Request modal ────────────────────────────────────────────────────────
  $('sg-req-cancel')  ?.addEventListener('click', () => _closeModal('sg-modal-request'));
  $('sg-req-cancel-2')?.addEventListener('click', () => _closeModal('sg-modal-request'));
  $('sg-modal-request')?.addEventListener('click', e => {
    if (e.target.id === 'sg-modal-request') _closeModal('sg-modal-request');
  });
  $('sg-req-submit')?.addEventListener('click', _submitRequest);

  // ── Error modal ──────────────────────────────────────────────────────────
  $('sg-err-cancel')  ?.addEventListener('click', () => _closeModal('sg-modal-error'));
  $('sg-err-cancel-2')?.addEventListener('click', () => _closeModal('sg-modal-error'));
  $('sg-modal-error')?.addEventListener('click', e => {
    if (e.target.id === 'sg-modal-error') _closeModal('sg-modal-error');
  });
  $('sg-err-submit')?.addEventListener('click', _submitError);

  // ── Inbox modal ──────────────────────────────────────────────────────────
  $('sg-inbox-close')?.addEventListener('click', () => _closeModal('sg-modal-inbox'));
  $('sg-modal-inbox')?.addEventListener('click', e => {
    if (e.target.id === 'sg-modal-inbox') _closeModal('sg-modal-inbox');
  });

  // Inbox filter tabs (admin only)
  document.querySelectorAll('.sg-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sg-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _loadInbox(true, btn.dataset.f);
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function _closeDropdown() { $('sg-dropdown')?.classList.add('hidden'); }
function _closeModal(id)  { $(id)?.classList.add('hidden'); }
function _clearStatus() {
  ['sg-req-status','sg-err-status'].forEach(id => {
    const el = $(id);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
  });
}

function _buildExerciseSelect() {
  const sel = $('sg-exercise-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">— General / Other —</option>';
  EXERCISES.forEach(ex => {
    const o = document.createElement('option');
    o.value       = ex.id;
    o.textContent = `${ex.id} · ${ex.title}`;
    sel.appendChild(o);
  });
}

function _showStatus(elId, msg, ok) {
  const el = $(elId);
  if (!el) return;
  el.textContent = msg;
  el.className   = `sg-status ${ok ? 'sg-status--ok' : 'sg-status--err'}`;
  el.classList.remove('hidden');
}

async function _persist(type, message, challengeId, challengeTitle) {
  await addDoc(collection(db, 'suggestions'), {
    type,
    message,
    challengeId:    challengeId    || '',
    challengeTitle: challengeTitle || '',
    userId:      _user.uid,
    userEmail:   _user.email,
    displayName: _profile?.displayName ?? _user.email,
    role:        _profile?.role ?? 'student',
    timestamp:   serverTimestamp(),
    status:      'new',
    reply:       '',
    repliedAt:   null,
    repliedBy:   '',
    replyRead:   false,
  });

  // Email notification — dynamic import so a CDN failure never blocks the app
  import('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm').then(({ default: ejs }) => {
    ejs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    return ejs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      sub_type:   type === 'request' ? '✨ Feature Request' : '🐛 Error Report',
      from_name:  _profile?.displayName ?? _user.email,
      from_email: _user.email,
      from_role:  _profile?.role ?? 'student',
      challenge:  challengeTitle || '—',
      message,
    });
  }).catch(() => {}); // silent fail — Firestore save already succeeded
}

// ── Submit handlers ──────────────────────────────────────────────────────────

async function _submitRequest() {
  const msg = $('sg-req-text')?.value.trim();
  if (!msg) { _showStatus('sg-req-status', 'Please describe your request.', false); return; }
  const btn = $('sg-req-submit');
  btn.disabled = true;
  try {
    await _persist('request', msg, '', '');
    _showStatus('sg-req-status', 'Submitted — thank you!', true);
    $('sg-req-text').value = '';
    setTimeout(() => _closeModal('sg-modal-request'), 1800);
  } catch { _showStatus('sg-req-status', 'Failed to submit. Please try again.', false); }
  finally   { btn.disabled = false; }
}

async function _submitError() {
  const msg  = $('sg-err-text')?.value.trim();
  const sel  = $('sg-exercise-sel');
  const cId  = sel?.value || '';
  const cTxt = sel?.options[sel.selectedIndex]?.text || '';
  const cTitle = cTxt === '— General / Other —' ? '' : cTxt;
  if (!msg) { _showStatus('sg-err-status', 'Please describe the error.', false); return; }
  const btn = $('sg-err-submit');
  btn.disabled = true;
  try {
    await _persist('error', msg, cId, cTitle);
    _showStatus('sg-err-status', 'Reported — thank you!', true);
    $('sg-err-text').value = '';
    if (sel) sel.selectedIndex = 0;
    setTimeout(() => _closeModal('sg-modal-error'), 1800);
  } catch { _showStatus('sg-err-status', 'Failed to submit. Please try again.', false); }
  finally   { btn.disabled = false; }
}

// ── Badge ────────────────────────────────────────────────────────────────────

function _startBadge(isAdmin) {
  const badge = $('sg-badge');
  if (!badge || !_user) return;

  if (isAdmin) {
    // Count docs with status 'new'
    const q = query(collection(db, 'suggestions'), where('status', '==', 'new'));
    _unsub = onSnapshot(q, snap => {
      const n = snap.size;
      badge.textContent = n;
      badge.classList.toggle('hidden', n === 0);
    }, () => {});
  } else {
    // Count own submissions where a reply exists but hasn't been read
    const q = query(collection(db, 'suggestions'), where('userId', '==', _user.uid));
    _unsub = onSnapshot(q, snap => {
      const n = snap.docs.filter(d => d.data().reply && !d.data().replyRead).length;
      badge.textContent = n;
      badge.classList.toggle('hidden', n === 0);
    }, () => {});
  }
}

// ── Inbox ────────────────────────────────────────────────────────────────────

function _openInbox(isAdmin) {
  const modal = $('sg-modal-inbox');
  if (!modal) return;

  const title = $('sg-inbox-title');
  if (title) title.textContent = isAdmin ? 'All Submissions' : 'My Submissions';

  // Filters only visible to admin viewing all submissions
  $('sg-filters')?.classList.toggle('hidden', !isAdmin);

  // Reset filters to 'all'
  document.querySelectorAll('.sg-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.f === 'all');
  });

  modal.classList.remove('hidden');
  _loadInbox(isAdmin, 'all');
}

async function _loadInbox(isAdmin, filter = 'all') {
  const list = $('sg-inbox-list');
  if (!list) return;
  list.innerHTML = '<div class="sg-loading">Loading…</div>';

  try {
    let snapDocs;
    if (!isAdmin) {
      const q  = query(collection(db, 'suggestions'), where('userId', '==', _user.uid));
      const sn = await getDocs(q);
      snapDocs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      const sn = await getDocs(collection(db, 'suggestions'));
      snapDocs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      if (filter === 'new')     snapDocs = snapDocs.filter(d => d.status === 'new');
      if (filter === 'request') snapDocs = snapDocs.filter(d => d.type   === 'request');
      if (filter === 'error')   snapDocs = snapDocs.filter(d => d.type   === 'error');
      if (filter === 'replied') snapDocs = snapDocs.filter(d => d.status === 'replied');
    }

    // Sort newest first
    snapDocs.sort((a, b) => {
      const ta = a.timestamp?.toMillis?.() ?? 0;
      const tb = b.timestamp?.toMillis?.() ?? 0;
      return tb - ta;
    });

    if (snapDocs.length === 0) {
      list.innerHTML = '<div class="sg-empty">No submissions found.</div>';
      return;
    }

    // Mark own unread replies as read
    if (!isAdmin) {
      snapDocs.filter(d => d.reply && !d.replyRead).forEach(async d => {
        await updateDoc(doc(db, 'suggestions', d.id), { replyRead: true });
      });
    }

    list.innerHTML = snapDocs.map(s => {
      const typeLabel = s.type === 'request' ? '✨ Request' : '🐛 Error';

      const userRow = isAdmin ? `
        <div class="sg-item-user">
          <strong>${esc(s.displayName)}</strong>
          <a href="mailto:${esc(s.userEmail)}" class="sg-mailto">${esc(s.userEmail)}</a>
          <span class="sg-role-chip sg-role-${esc(s.role)}">${esc(s.role)}</span>
        </div>` : '';

      const challengeRow = s.challengeTitle
        ? `<div class="sg-challenge-ref">📚 ${esc(s.challengeTitle)}</div>`
        : '';

      const replyBlock = s.reply ? `
        <div class="sg-reply-view">
          <span class="sg-reply-from">Reply from ${esc(s.repliedBy || 'Admin')}:</span>
          <span class="sg-reply-text">${esc(s.reply)}</span>
          <span class="sg-reply-date">${fmtDate(s.repliedAt)}</span>
        </div>` : '';

      const adminControls = isAdmin ? `
        <div class="sg-admin-controls">
          <textarea class="sg-reply-ta" placeholder="Reply to ${esc(s.displayName)}…" rows="2">${esc(s.reply || '')}</textarea>
          <div class="sg-admin-btns">
            <button class="btn-ghost btn-sm sg-btn-read" data-id="${esc(s.id)}" title="Mark as read">Mark read</button>
            <button class="btn-accent btn-sm sg-btn-reply" data-id="${esc(s.id)}">
              ${s.reply ? 'Update reply' : 'Send reply'}
            </button>
          </div>
        </div>` : '';

      return `
        <div class="sg-item sg-item--${esc(s.status)}" data-id="${esc(s.id)}">
          <div class="sg-item-head">
            <span class="sg-type-badge sg-type-${s.type}">${typeLabel}</span>
            <span class="sg-stat-chip sg-stat-${esc(s.status)}">${esc(s.status)}</span>
            <span class="sg-ts">${fmtDate(s.timestamp)}</span>
          </div>
          ${userRow}
          ${challengeRow}
          <div class="sg-item-msg">${esc(s.message)}</div>
          ${replyBlock}
          ${adminControls}
        </div>`;
    }).join('');

    // Bind admin buttons
    if (isAdmin) {
      list.querySelectorAll('.sg-btn-reply').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id   = btn.dataset.id;
          const ta   = btn.closest('.sg-item')?.querySelector('.sg-reply-ta');
          const text = ta?.value.trim();
          if (!text) return;
          btn.disabled = true;
          try {
            await updateDoc(doc(db, 'suggestions', id), {
              reply:     text,
              repliedAt: serverTimestamp(),
              repliedBy: _user.email,
              status:    'replied',
              replyRead: false,
            });
            await _loadInbox(true, filter);
          } finally { btn.disabled = false; }
        });
      });

      list.querySelectorAll('.sg-btn-read').forEach(btn => {
        btn.addEventListener('click', async () => {
          await updateDoc(doc(db, 'suggestions', btn.dataset.id), { status: 'read' });
          await _loadInbox(true, filter);
        });
      });
    }

  } catch (e) {
    list.innerHTML = `<div class="sg-empty">Error loading submissions: ${esc(e.message)}</div>`;
  }
}
