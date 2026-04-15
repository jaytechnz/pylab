// ─── Quiz Manager ─────────────────────────────────────────────────────────────
// Spaced repetition via Leitner system.
// Boxes 1–5; intervals: 1, 2, 4, 8, 16 days.
// Confidence ratings after each set: Again / Hard / Good / Easy.

import { QUIZ_QUESTIONS } from './quiz-data.js';
import { getQuizProgress, saveQuizProgress } from './storage.js';

const LEITNER_INTERVALS = [0, 1, 2, 4, 8, 16]; // index = box number, value = days

const TOPIC_LABELS = {
  variables: 'Variables & I/O',
  operators: 'Operators',
  selection: 'Selection',
  iteration: 'Iteration',
  lists:     'Lists',
  functions: 'Functions',
};

export class QuizManager {
  constructor() {
    this._uid         = null;
    this._progress    = {};   // qid → { box, correct, attemptedAt, nextReviewAt, confidence }
    this._filter      = { topic: 'all', difficulty: 'all', type: 'all' };
    this._state       = 'home';        // 'home' | 'answering' | 'reviewing'
    this._currentSet  = [];            // up to 10 Question objects for this round
    this._results     = {};            // qid → { correct, answer }  (set after submit)
    this._panelEl     = null;
    this._bodyEl      = null;
  }

  async init(uid) {
    this._uid      = uid;
    const saved    = await getQuizProgress(uid);
    this._progress = saved?.answers ?? {};
  }

  mount(panelEl) {
    this._panelEl = panelEl;
    this._bodyEl  = panelEl.querySelector('#quiz-body');

    panelEl.querySelector('#quiz-filter-topic')?.addEventListener('change', e => {
      this._filter.topic = e.target.value; this._goHome();
    });
    panelEl.querySelector('#quiz-filter-diff')?.addEventListener('change', e => {
      this._filter.difficulty = e.target.value; this._goHome();
    });
    panelEl.querySelector('#quiz-filter-type')?.addEventListener('change', e => {
      this._filter.type = e.target.value; this._goHome();
    });

    this._goHome();
  }

  _goHome() {
    this._state = 'home';
    this._render();
  }

  // ── Question filtering ──────────────────────────────────────────────────────

  _filtered() {
    return QUIZ_QUESTIONS.filter(q =>
      (this._filter.topic      === 'all' || q.topic      === this._filter.topic) &&
      (this._filter.difficulty === 'all' || q.difficulty === this._filter.difficulty) &&
      (this._filter.type       === 'all' || q.type       === this._filter.type)
    );
  }

  // ── Leitner question selection ──────────────────────────────────────────────

  _selectSet() {
    const now      = Date.now();
    const filtered = this._filtered();
    const progress = this._progress;
    const due      = [];
    const newQ     = [];
    const notDue   = [];

    filtered.forEach(q => {
      const p = progress[q.id];
      if (!p) {
        newQ.push(q);
      } else if ((p.nextReviewAt ?? 0) <= now) {
        due.push(q);
      } else {
        notDue.push(q);
      }
    });

    // Due: lowest box first (most struggling), then most overdue
    due.sort((a, b) => {
      const pa = progress[a.id], pb = progress[b.id];
      return (pa.box || 1) !== (pb.box || 1)
        ? (pa.box || 1) - (pb.box || 1)
        : (pa.nextReviewAt || 0) - (pb.nextReviewAt || 0);
    });

    // Not due: soonest first (in case we need filler)
    notDue.sort((a, b) =>
      (progress[a.id].nextReviewAt || 0) - (progress[b.id].nextReviewAt || 0)
    );

    // Build set: due + shuffled new + notDue filler, capped at 10
    return [...due, ...this._shuffle([...newQ]), ...notDue].slice(0, 10);
  }

  // ── Stats for home screen ───────────────────────────────────────────────────

  _getStats() {
    const now      = Date.now();
    const filtered = this._filtered();
    let due = 0, newQ = 0, mastered = 0, learning = 0;

    filtered.forEach(q => {
      const prog = this._progress[q.id];
      if (!prog)                                           { newQ++;      return; }
      if (prog.box >= 5 && (prog.nextReviewAt ?? 0) > now){ mastered++;  return; }
      if ((prog.nextReviewAt ?? 0) <= now)                 { due++;       return; }
      learning++;
    });

    const boxCounts = [0, 0, 0, 0, 0, 0]; // index 0 unused; 1–5
    filtered.forEach(q => {
      const b = this._progress[q.id]?.box ?? 0;
      if (b >= 1 && b <= 5) boxCounts[b]++;
    });

    return { due, new: newQ, mastered, learning, total: filtered.length, boxCounts };
  }

  // ── Render dispatcher ───────────────────────────────────────────────────────

  _render() {
    if (!this._bodyEl) return;
    if (this._state === 'home')      this._renderHome();
    if (this._state === 'answering') this._renderAnswering();
    if (this._state === 'reviewing') this._renderReviewing();
    this._bodyEl.scrollTop = 0;
  }

  // ── HOME ───────────────────────────────────────────────────────────────────

  _renderHome() {
    const stats = this._getStats();
    const canStart = stats.total > 0;
    const dueText  = stats.due > 0
      ? `<span class="qz-stat qz-stat--due"><strong>${stats.due}</strong> due</span>`
      : `<span class="qz-stat"><strong>0</strong> due</span>`;
    const btnText  = stats.due > 0
      ? `Review ${Math.min(10, stats.due + stats.new)} question${Math.min(10, stats.due + stats.new) !== 1 ? 's' : ''}`
      : `Start Quiz`;

    const maxBar = Math.max(...stats.boxCounts.slice(1), 1);

    this._bodyEl.innerHTML = `
      <div class="qz-home">
        <div class="qz-home-stats">
          ${dueText}
          <span class="qz-stat-sep">·</span>
          <span class="qz-stat"><strong>${stats.new}</strong> new</span>
          <span class="qz-stat-sep">·</span>
          <span class="qz-stat qz-stat--learning"><strong>${stats.learning}</strong> learning</span>
          <span class="qz-stat-sep">·</span>
          <span class="qz-stat qz-stat--mastered"><strong>${stats.mastered}</strong> mastered</span>
          <span class="qz-stat-sep">·</span>
          <span class="qz-stat">${stats.total} total</span>
        </div>

        <div class="qz-leitner-vis">
          ${[1,2,3,4,5].map(box => {
            const cnt = stats.boxCounts[box];
            const h   = Math.round((cnt / maxBar) * 60);
            return `<div class="qz-box-col">
              <div class="qz-box-count">${cnt}</div>
              <div class="qz-box-bar-wrap">
                <div class="qz-box-bar qz-box-bar--${box}" style="height:${h}px"></div>
              </div>
              <div class="qz-box-label">Box ${box}</div>
            </div>`;
          }).join('')}
        </div>

        ${canStart
          ? `<button class="btn-accent qz-start-btn" id="qz-start">${btnText}</button>`
          : `<p class="qz-empty">No questions match the selected filters.</p>`}

        <p class="qz-leitner-note">
          Questions are chosen using <strong>spaced repetition</strong> (Leitner system).
          Due and new questions come first. After each set, rate your confidence to
          schedule your next review — easier cards are reviewed less often.
        </p>
      </div>`;

    this._bodyEl.querySelector('#qz-start')?.addEventListener('click', () => {
      this._currentSet = this._selectSet();
      this._results    = {};
      this._state      = 'answering';
      this._render();
    });
  }

  // ── ANSWERING ─────────────────────────────────────────────────────────────

  _renderAnswering() {
    if (!this._currentSet.length) { this._goHome(); return; }

    let html = `<div class="qz-answering">`;

    this._currentSet.forEach((q, i) => {
      const box = this._progress[q.id]?.box ?? 0;
      const boxBadge = box > 0
        ? `<span class="qz-box-badge qz-box-badge--${box}">Box ${box}</span>`
        : `<span class="qz-box-badge qz-box-badge--new">New</span>`;

      html += `
        <div class="qz-question" data-qid="${q.id}" data-type="${q.type}">
          <div class="qz-q-header">
            <span class="qz-q-num">${i + 1}</span>
            <span class="qz-topic-badge">${escHtml(TOPIC_LABELS[q.topic] ?? q.topic)}</span>
            <span class="qz-diff qz-diff--${q.difficulty}">${q.difficulty}</span>
            ${boxBadge}
          </div>
          <div class="qz-q-body">${this._formatQ(q.q)}</div>
          <div class="qz-answer-area">
            ${this._renderAnswerInput(q)}
          </div>
        </div>`;
    });

    html += `
      <div class="qz-submit-bar">
        <button class="btn-ghost btn-sm" id="qz-cancel">← Back</button>
        <button class="btn-accent qz-submit-all-btn" id="qz-submit-all">Submit All Answers</button>
      </div>
    </div>`;

    this._bodyEl.innerHTML = html;
    this._bindAnsweringEvents();
  }

  _renderAnswerInput(q) {
    if (q.type === 'mc')   return this._mcInput(q);
    if (q.type === 'fill') return this._fillInput(q);
    if (q.type === 'drag') return this._dragInput(q);
    return '';
  }

  _mcInput(q) {
    return `<div class="qz-mc-options">
      ${q.options.map((opt, i) =>
        `<button class="qz-mc-opt" data-opt="${i}">${escHtml(opt)}</button>`
      ).join('')}
    </div>`;
  }

  _fillInput(q) {
    const count = (q.q.match(/___/g) || []).length || 1;
    const inputs = Array.from({ length: count }, (_, i) =>
      `<input class="qz-fill-input" data-idx="${i}" placeholder="Your answer…" autocomplete="off" spellcheck="false">`
    ).join('');
    return `<div class="qz-fill-wrap">${inputs}</div>`;
  }

  _dragInput(q) {
    if (q.subtype === 'order') {
      const shuffled = this._seededShuffle([...q.items], q.id);
      return `<div class="qz-drag-order-list" data-qid="${q.id}">
        ${shuffled.map((item, i) =>
          `<div class="qz-drag-item" draggable="true" data-item="${i}">
            <span class="qz-drag-handle">⣿</span>
            <code>${escHtml(item)}</code>
          </div>`
        ).join('')}
      </div>`;
    }

    if (q.subtype === 'match') {
      const shuffledDefs = this._seededShuffle(
        q.pairs.map((p, i) => ({ def: p.def, origIdx: i })), q.id + 'm'
      );
      return `<div class="qz-match-wrap">
        <div class="qz-match-terms">
          ${q.pairs.map((p, i) => `
            <div class="qz-match-row" data-pair="${i}">
              <div class="qz-match-term">${escHtml(p.term)}</div>
              <div class="qz-match-dropzone" data-accept="${i}">Drop here</div>
            </div>`).join('')}
        </div>
        <div class="qz-match-pool" data-qid="${q.id}">
          ${shuffledDefs.map(({ def, origIdx }) =>
            `<div class="qz-drag-item" draggable="true" data-def="${origIdx}">${escHtml(def)}</div>`
          ).join('')}
        </div>
      </div>`;
    }

    if (q.subtype === 'group') {
      const all = q.groups.flatMap((g, gi) => g.items.map(item => ({ item, gi })));
      const shuffled = this._seededShuffle([...all], q.id + 'g');
      return `<div class="qz-group-wrap">
        <div class="qz-group-pool" data-qid="${q.id}">
          ${shuffled.map(({ item }) =>
            `<div class="qz-drag-item" draggable="true" data-item="${escHtml(item)}">${escHtml(item)}</div>`
          ).join('')}
        </div>
        <div class="qz-group-zones">
          ${q.groups.map((g, gi) => `
            <div class="qz-group-zone" data-gi="${gi}" data-qid="${q.id}">
              <div class="qz-group-name">${escHtml(g.name)}</div>
              <div class="qz-group-drop"></div>
            </div>`).join('')}
        </div>
      </div>`;
    }

    return '';
  }

  // ── Answering event binding ────────────────────────────────────────────────

  _bindAnsweringEvents() {
    const body = this._bodyEl;

    body.querySelector('#qz-cancel')?.addEventListener('click', () => this._goHome());
    body.querySelector('#qz-submit-all')?.addEventListener('click', () => this._submitAll());

    // MC selection
    body.querySelectorAll('.qz-mc-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.qz-mc-options').querySelectorAll('.qz-mc-opt')
           .forEach(b => b.classList.remove('qz-mc-opt--selected'));
        btn.classList.add('qz-mc-opt--selected');
      });
    });

    // Fill: submit on Enter if single blank
    body.querySelectorAll('.qz-fill-input').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') body.querySelector('#qz-submit-all')?.click();
      });
    });

    // Drag interactions
    body.querySelectorAll('.qz-drag-order-list').forEach(l => this._initDragOrder(l));
    body.querySelectorAll('.qz-match-pool').forEach(p => this._initDragMatch(p));
    body.querySelectorAll('.qz-group-pool').forEach(p => this._initDragGroup(p));
  }

  // ── Grade all answers on submit ────────────────────────────────────────────

  _submitAll() {
    const body    = this._bodyEl;
    const results = {};

    this._currentSet.forEach(q => {
      let answer = null, correct = false;

      if (q.type === 'mc') {
        const sel = body.querySelector(`.qz-question[data-qid="${q.id}"] .qz-mc-opt--selected`);
        answer  = sel ? parseInt(sel.dataset.opt) : null;
        correct = answer === q.answer;
      }

      else if (q.type === 'fill') {
        const inputs = body.querySelectorAll(`.qz-question[data-qid="${q.id}"] .qz-fill-input`);
        answer  = [...inputs].map(i => i.value.trim());
        correct = answer.every((v, i) => {
          const accepted = Array.isArray(q.blanks[i]) ? q.blanks[i] : [q.blanks[i]];
          return accepted.some(a => a.toLowerCase() === v.toLowerCase());
        }) && answer.length > 0;
      }

      else if (q.type === 'drag' && q.subtype === 'order') {
        const list     = body.querySelector(`.qz-drag-order-list[data-qid="${q.id}"]`);
        const shuffled = this._seededShuffle([...q.items], q.id);
        answer  = [...list.querySelectorAll('.qz-drag-item')]
                    .map(el => shuffled[parseInt(el.dataset.item)]);
        correct = answer.every((item, i) => item === q.items[i]);
      }

      else if (q.type === 'drag' && q.subtype === 'match') {
        const matched = {};
        body.querySelectorAll(`.qz-question[data-qid="${q.id}"] .qz-match-row`).forEach(row => {
          const pi = parseInt(row.dataset.pair);
          const dz = row.querySelector('.qz-match-dropzone');
          matched[pi] = dz.dataset.placedDef !== undefined ? parseInt(dz.dataset.placedDef) : null;
        });
        answer  = matched;
        correct = q.pairs.every((_, i) => matched[i] === i);
      }

      else if (q.type === 'drag' && q.subtype === 'group') {
        const placements = {};
        body.querySelectorAll(`.qz-group-zone[data-qid="${q.id}"]`).forEach(zone => {
          zone.querySelectorAll('.qz-drag-item').forEach(item => {
            placements[item.dataset.item] = parseInt(zone.dataset.gi);
          });
        });
        answer  = placements;
        correct = q.groups.every((g, gi) => g.items.every(item => placements[item] === gi));
      }

      results[q.id] = { correct, answer };
    });

    this._results = results;
    this._state   = 'reviewing';
    this._render();
  }

  // ── REVIEWING ─────────────────────────────────────────────────────────────

  _renderReviewing() {
    const qs           = this._currentSet;
    const results      = this._results;
    const correctCount = Object.values(results).filter(r => r.correct).length;

    let html = `<div class="qz-reviewing">
      <div class="qz-review-banner">
        <div class="qz-review-score">
          <span class="qz-score-big">${correctCount}/${qs.length}</span>
          <span class="qz-score-pct">${Math.round((correctCount / qs.length) * 100)}%</span>
        </div>
        <p class="qz-review-instr">Rate your confidence on each question to update your review schedule.</p>
      </div>`;

    qs.forEach((q, i) => {
      const res    = results[q.id] ?? { correct: false };
      const prog   = this._progress[q.id];
      const curBox = prog?.box ?? 1;
      const cls    = res.correct ? 'qz-result--correct' : 'qz-result--wrong';

      html += `
        <div class="qz-result-card ${cls}" data-qid="${q.id}">
          <div class="qz-result-top">
            <span class="qz-result-icon">${res.correct ? '✓' : '✗'}</span>
            <span class="qz-q-num">${i + 1}</span>
            <span class="qz-topic-badge">${escHtml(TOPIC_LABELS[q.topic] ?? q.topic)}</span>
            <span class="qz-diff qz-diff--${q.difficulty}">${q.difficulty}</span>
            <span class="qz-box-badge qz-box-badge--${curBox}">Box ${curBox}</span>
          </div>

          <div class="qz-result-q">${this._formatQ(q.q)}</div>

          ${!res.correct ? `
            <div class="qz-answer-reveal">
              <span class="qz-answer-reveal-lbl">Correct answer:</span>
              <span class="qz-answer-reveal-val">${escHtml(this._correctAnswerText(q))}</span>
            </div>` : ''}

          <div class="qz-conf-row">
            <span class="qz-conf-prompt">How well did you know this?</span>
            <div class="qz-conf-btns" data-qid="${q.id}">
              <button class="qz-conf-btn qz-conf--again" data-rating="again" title="I didn't know this — review very soon">Again</button>
              <button class="qz-conf-btn qz-conf--hard"  data-rating="hard"  title="I got it but it was a struggle — stay in same box">Hard</button>
              <button class="qz-conf-btn qz-conf--good"  data-rating="good"  title="I got it with effort — move up one box">Good</button>
              <button class="qz-conf-btn qz-conf--easy"  data-rating="easy"  title="I knew it immediately — move up two boxes">Easy</button>
            </div>
            <span class="qz-conf-saved hidden" id="qz-saved-${q.id}">Saved ✓</span>
          </div>
        </div>`;
    });

    html += `
      <div class="qz-review-footer">
        <button class="btn-ghost" id="qz-back-home">← Home</button>
        <button class="btn-accent" id="qz-next-set">Next Set →</button>
      </div>
    </div>`;

    this._bodyEl.innerHTML = html;
    this._bindReviewingEvents();
  }

  _bindReviewingEvents() {
    const body = this._bodyEl;

    body.querySelector('#qz-back-home')?.addEventListener('click', () => this._goHome());

    body.querySelector('#qz-next-set')?.addEventListener('click', () => {
      this._currentSet = this._selectSet();
      this._results    = {};
      this._state      = 'answering';
      this._render();
    });

    body.querySelectorAll('.qz-conf-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rating = btn.dataset.rating;
        const card   = btn.closest('[data-qid]');
        const qid    = card?.dataset.qid;
        if (!qid) return;

        // Highlight chosen button; grey out others
        card.querySelectorAll('.qz-conf-btn').forEach(b => b.classList.remove('qz-conf-selected'));
        btn.classList.add('qz-conf-selected');

        this._applyLeitner(qid, rating);
        await this._saveProgress();

        const savedEl = body.querySelector(`#qz-saved-${qid}`);
        if (savedEl) savedEl.classList.remove('hidden');

        // Show next-box indicator on the badge
        const badge = card.querySelector('.qz-box-badge');
        if (badge) {
          const newBox = this._progress[qid]?.box ?? 1;
          badge.textContent = `Box ${newBox}`;
          badge.className   = `qz-box-badge qz-box-badge--${newBox}`;
        }
      });
    });
  }

  // ── Leitner box update ──────────────────────────────────────────────────────

  _applyLeitner(qid, rating) {
    const DAY  = 86400000;
    const now  = Date.now();
    const prog = this._progress[qid] ?? { box: 0 };
    let   box  = prog.box ?? 1;

    switch (rating) {
      case 'again': box = 1;                       break;
      case 'hard':  box = Math.max(1, box);        break;  // stay; shorter interval below
      case 'good':  box = Math.min(5, box + 1);   break;
      case 'easy':  box = Math.min(5, box + 2);   break;
    }

    const baseDays      = LEITNER_INTERVALS[box] ?? 1;
    const daysUntilNext = rating === 'hard'
      ? Math.max(1, Math.ceil(baseDays * 0.5))
      : baseDays;

    this._progress[qid] = {
      ...prog,
      box,
      correct:      this._results[qid]?.correct ?? false,
      attemptedAt:  now,
      nextReviewAt: now + daysUntilNext * DAY,
      confidence:   rating,
    };
  }

  async _saveProgress() {
    if (!this._uid) return;
    await saveQuizProgress(this._uid, { answers: this._progress });
  }

  // ── Question text formatter ────────────────────────────────────────────────
  // Splits on blank lines; code blocks are rendered in <pre>, prose in <p>.

  _formatQ(text) {
    const parts = text.split(/\n\n+/);
    return parts.map(part => {
      if (!part.trim()) return '';
      const lines = part.split('\n');
      const isCode = lines.some(line => {
        const t = line.trimStart();
        return line.startsWith('    ') || line.startsWith('\t') ||
          /^(def |for |while |if |elif |else:|return |import |from )/.test(t) ||
          /^[a-z_]\w*\s*([+\-*/%]?=|=\s)/.test(t) ||
          /^print\(|^input\(/.test(t);
      }) && lines.length >= 1;

      if (isCode) {
        const highlighted = escHtml(part).replace(/___/g, '<span class="qz-blank">___</span>');
        return `<pre class="qz-code">${highlighted}</pre>`;
      }
      const highlighted = escHtml(part).replace(/___/g, '<span class="qz-blank">___</span>');
      return `<p class="qz-q-prose">${highlighted}</p>`;
    }).join('');
  }

  // ── Correct answer text (for reveal) ──────────────────────────────────────

  _correctAnswerText(q) {
    if (q.type === 'mc')   return q.options[q.answer];
    if (q.type === 'fill') return q.blanks.map(b => Array.isArray(b) ? b[0] : b).join(', ');
    if (q.type === 'drag' && q.subtype === 'order')
      return q.items.join(' → ');
    if (q.type === 'drag' && q.subtype === 'match')
      return q.pairs.map(p => `${p.term} → ${p.def}`).join(';  ');
    if (q.type === 'drag' && q.subtype === 'group')
      return q.groups.map(g => `${g.name}: ${g.items.join(', ')}`).join('  |  ');
    return '';
  }

  // ── Drag interactions ──────────────────────────────────────────────────────

  _initDragOrder(list) {
    let src = null;
    list.querySelectorAll('.qz-drag-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        src = item; e.dataTransfer.effectAllowed = 'move';
        item.classList.add('qz-dragging');
      });
      item.addEventListener('dragend',  () => item.classList.remove('qz-dragging'));
      item.addEventListener('dragover', e => { e.preventDefault(); });
      item.addEventListener('drop', e => {
        e.preventDefault();
        if (src && src !== item) {
          const els = [...list.querySelectorAll('.qz-drag-item')];
          if (els.indexOf(src) < els.indexOf(item)) list.insertBefore(src, item.nextSibling);
          else                                       list.insertBefore(src, item);
        }
      });
    });
    // Allow dropping at the end of the list
    list.addEventListener('dragover', e => e.preventDefault());
    list.addEventListener('drop',     e => { e.preventDefault(); if (src) list.appendChild(src); });
  }

  _initDragMatch(pool) {
    const body = this._bodyEl;
    const attachDragItem = el => {
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('def-idx',  el.dataset.def);
        e.dataTransfer.setData('def-text', el.textContent.trim());
        el.classList.add('qz-dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('qz-dragging'));
    };
    pool.querySelectorAll('.qz-drag-item').forEach(attachDragItem);
    body.querySelectorAll('.qz-match-dropzone').forEach(zone => {
      zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('qz-drop--hover'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('qz-drop--hover'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('qz-drop--hover');
        zone.textContent       = e.dataTransfer.getData('def-text');
        zone.dataset.placedDef = e.dataTransfer.getData('def-idx');
      });
    });
  }

  _initDragGroup(pool) {
    const body = this._bodyEl;
    const makeEl = (text, itemData) => {
      const el = document.createElement('div');
      el.className   = 'qz-drag-item';
      el.draggable   = true;
      el.dataset.item = itemData;
      el.textContent  = text;
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('item-text', itemData);
        el.classList.add('qz-dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('qz-dragging'));
      return el;
    };
    pool.querySelectorAll('.qz-drag-item').forEach(el => {
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('item-text', el.dataset.item);
        el.classList.add('qz-dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('qz-dragging'));
    });
    body.querySelectorAll('.qz-group-drop').forEach(drop => {
      drop.addEventListener('dragover',  e => { e.preventDefault(); drop.classList.add('qz-drop--hover'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('qz-drop--hover'));
      drop.addEventListener('drop', e => {
        e.preventDefault();
        drop.classList.remove('qz-drop--hover');
        const text = e.dataTransfer.getData('item-text');
        // Remove from wherever it currently lives
        body.querySelectorAll(`.qz-drag-item[data-item="${CSS.escape(text)}"]`).forEach(el => el.remove());
        drop.appendChild(makeEl(text, text));
      });
    });
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _seededShuffle(arr, seed) {
    let s = [...seed].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0xFFFFFFFF; };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── Summary for dashboard ──────────────────────────────────────────────────

  getSummary() {
    const total   = QUIZ_QUESTIONS.length;
    const done    = Object.keys(this._progress).length;
    const correct = Object.values(this._progress).filter(p => p.correct).length;
    const byTopic = {};
    QUIZ_QUESTIONS.forEach(q => {
      if (!byTopic[q.topic]) byTopic[q.topic] = { total: 0, correct: 0 };
      byTopic[q.topic].total++;
      if (this._progress[q.id]?.correct) byTopic[q.topic].correct++;
    });
    return { total, done, correct, byTopic };
  }
}

function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
