// ─── Quiz Manager ─────────────────────────────────────────────────────────────

import { QUIZ_QUESTIONS } from './quiz-data.js';
import { getQuizProgress, saveQuizProgress } from './storage.js';

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
    this._uid       = null;
    this._progress  = {};  // { qid: { answer, correct, attemptedAt } }
    this._filter    = { topic: 'all', difficulty: 'all', type: 'all' };
    this._page      = 0;
    this._PAGE_SIZE = 10;
    this._panelEl   = null;
    this._bodyEl    = null;
    this._dragState = null;  // active drag info
  }

  async init(uid) {
    this._uid      = uid;
    const saved    = await getQuizProgress(uid);
    this._progress = saved?.answers ?? {};
  }

  // Called when user opens the quiz panel
  mount(panelEl) {
    this._panelEl = panelEl;
    this._bodyEl  = panelEl.querySelector('#quiz-body');
    panelEl.querySelector('#quiz-filter-topic')?.addEventListener('change', e => {
      this._filter.topic = e.target.value; this._page = 0; this._render();
    });
    panelEl.querySelector('#quiz-filter-diff')?.addEventListener('change', e => {
      this._filter.difficulty = e.target.value; this._page = 0; this._render();
    });
    panelEl.querySelector('#quiz-filter-type')?.addEventListener('change', e => {
      this._filter.type = e.target.value; this._page = 0; this._render();
    });
    this._render();
  }

  // ── Filtering + pagination ─────────────────────────────────────────────────

  _filtered() {
    return QUIZ_QUESTIONS.filter(q =>
      (this._filter.topic      === 'all' || q.topic      === this._filter.topic) &&
      (this._filter.difficulty === 'all' || q.difficulty === this._filter.difficulty) &&
      (this._filter.type       === 'all' || q.type       === this._filter.type)
    );
  }

  _pageQuestions() {
    const all   = this._filtered();
    const start = this._page * this._PAGE_SIZE;
    return { questions: all.slice(start, start + this._PAGE_SIZE), total: all.length };
  }

  // ── Main render ───────────────────────────────────────────────────────────

  _render() {
    if (!this._bodyEl) return;
    const { questions, total } = this._pageQuestions();
    const totalPages = Math.max(1, Math.ceil(total / this._PAGE_SIZE));

    // Stats bar
    const answered  = this._filtered().filter(q => this._progress[q.id]).length;
    const correct   = this._filtered().filter(q => this._progress[q.id]?.correct).length;

    let html = `
      <div class="qz-stats">
        <span class="qz-stat"><strong>${total}</strong> questions</span>
        <span class="qz-stat-sep">·</span>
        <span class="qz-stat"><strong>${answered}</strong> answered</span>
        <span class="qz-stat-sep">·</span>
        <span class="qz-stat qz-stat--correct"><strong>${correct}</strong> correct</span>
      </div>`;

    if (questions.length === 0) {
      html += `<div class="qz-empty">No questions match the selected filters.</div>`;
    } else {
      html += `<div class="qz-question-list">`;
      questions.forEach((q, i) => {
        html += this._renderQuestion(q, this._page * this._PAGE_SIZE + i + 1);
      });
      html += `</div>`;
    }

    // Pagination
    const startNum = total === 0 ? 0 : this._page * this._PAGE_SIZE + 1;
    const endNum   = Math.min(startNum + this._PAGE_SIZE - 1, total);
    html += `
      <div class="qz-pagination">
        <button class="btn-ghost btn-sm" id="qz-prev" ${this._page === 0 ? 'disabled' : ''}>← Prev</button>
        <span class="qz-page-info">${total ? `${startNum}–${endNum} of ${total}` : '0 questions'}</span>
        <button class="btn-ghost btn-sm" id="qz-next" ${this._page >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
      </div>`;

    this._bodyEl.innerHTML = html;
    this._bindQuestionEvents(questions);

    this._bodyEl.querySelector('#qz-prev')?.addEventListener('click', () => { this._page--; this._render(); });
    this._bodyEl.querySelector('#qz-next')?.addEventListener('click', () => { this._page++; this._render(); });
  }

  // ── Question renderers ────────────────────────────────────────────────────

  _renderQuestion(q, num) {
    const prog    = this._progress[q.id];
    const done    = !!prog;
    const correct = prog?.correct;
    const stateClass = done ? (correct ? 'qz-q--correct' : 'qz-q--wrong') : '';
    const diffBadge  = `<span class="qz-diff qz-diff--${q.difficulty}">${q.difficulty}</span>`;
    const topicBadge = `<span class="qz-topic-badge">${TOPIC_LABELS[q.topic] ?? q.topic}</span>`;

    let inner = '';
    if (q.type === 'mc')   inner = this._renderMC(q, prog);
    if (q.type === 'fill') inner = this._renderFill(q, prog);
    if (q.type === 'drag') inner = this._renderDrag(q, prog);

    return `
      <div class="qz-question ${stateClass}" data-qid="${q.id}" data-type="${q.type}">
        <div class="qz-q-header">
          <span class="qz-q-num">${num}</span>
          ${topicBadge}${diffBadge}
          ${done ? `<span class="qz-q-result-icon">${correct ? '✓' : '✗'}</span>` : ''}
        </div>
        <div class="qz-q-text">${this._formatQ(q.q)}</div>
        ${inner}
        ${done && !correct ? `<div class="qz-correct-answer">Correct answer: <strong>${this._correctAnswerText(q)}</strong></div>` : ''}
      </div>`;
  }

  _formatQ(text) {
    // Lines that start with spaces (indented code) are wrapped in <pre>
    const lines   = text.split('\n');
    let result    = '';
    let inCode    = false;
    let codeBlock = '';

    lines.forEach(line => {
      const isCode = line.startsWith('    ') || line.startsWith('\t') ||
                     /^(def |for |while |if |elif |else:|print\(|[a-z_]+ =)/.test(line.trimStart()) && lines.length > 1;
      if (isCode) {
        if (!inCode) { inCode = true; codeBlock = ''; }
        codeBlock += escHtml(line) + '\n';
      } else {
        if (inCode) { result += `<pre class="qz-code">${codeBlock.trimEnd()}</pre>`; inCode = false; }
        result += `<p class="qz-q-line">${escHtml(line)}</p>`;
      }
    });
    if (inCode) result += `<pre class="qz-code">${codeBlock.trimEnd()}</pre>`;
    return result;
  }

  // MC ───────────────────────────────────────────────────────────────────────

  _renderMC(q, prog) {
    const done = !!prog;
    return `
      <div class="qz-mc-options">
        ${q.options.map((opt, i) => {
          let cls = 'qz-mc-opt';
          if (done && i === q.answer)          cls += ' qz-mc-opt--correct';
          if (done && prog.answer === i && i !== q.answer) cls += ' qz-mc-opt--wrong';
          if (done && prog.answer === i && i === q.answer) cls += ' qz-mc-opt--chosen-correct';
          return `<button class="qz-mc-opt ${done ? 'qz-mc-opt--done' : ''} ${done && i === q.answer ? 'qz-mc-opt--correct' : ''} ${done && prog.answer === i && i !== q.answer ? 'qz-mc-opt--wrong' : ''}" data-opt="${i}">${escHtml(opt)}</button>`;
        }).join('')}
      </div>
      ${!done ? `<button class="btn-accent btn-sm qz-submit-mc" data-qid="${q.id}" disabled>Submit</button>` : ''}`;
  }

  // Fill ─────────────────────────────────────────────────────────────────────

  _renderFill(q, prog) {
    const done = !!prog;
    if (done) return '';  // correct answer shown via qz-correct-answer
    // Count blanks
    const count = (q.q.match(/___/g) || []).length;
    let inputs = '';
    for (let i = 0; i < count; i++) {
      inputs += `<input class="qz-fill-input" data-idx="${i}" placeholder="Type answer…" autocomplete="off" spellcheck="false">`;
    }
    return `
      <div class="qz-fill-wrap">
        ${inputs}
        <button class="btn-accent btn-sm qz-submit-fill" data-qid="${q.id}">Submit</button>
      </div>`;
  }

  // Drag ─────────────────────────────────────────────────────────────────────

  _renderDrag(q, prog) {
    const done = !!prog;
    if (q.subtype === 'order')  return this._renderDragOrder(q, done, prog);
    if (q.subtype === 'match')  return this._renderDragMatch(q, done, prog);
    if (q.subtype === 'group')  return this._renderDragGroup(q, done, prog);
    return '';
  }

  _renderDragOrder(q, done, prog) {
    // Shuffle items using a seeded shuffle (seeded by qid so it's stable)
    const shuffled = done
      ? (prog?.userOrder ?? this._seededShuffle([...q.items], q.id))
      : this._seededShuffle([...q.items], q.id);

    const items = shuffled.map((item, i) =>
      `<div class="qz-drag-item ${done ? 'qz-drag-item--done' : ''}" draggable="${!done}" data-item="${i}">
        <span class="qz-drag-handle">⣿</span>
        <code>${escHtml(item)}</code>
      </div>`).join('');

    return `
      <div class="qz-drag-order-list" data-qid="${q.id}">${items}</div>
      ${!done ? `<button class="btn-accent btn-sm qz-submit-order" data-qid="${q.id}">Check Order</button>` : ''}`;
  }

  _renderDragMatch(q, done, prog) {
    const defs     = this._seededShuffle([...q.pairs.map(p => p.def)], q.id + 'm');
    const termHTML = q.pairs.map((p, i) =>
      `<div class="qz-match-row" data-pair="${i}">
        <div class="qz-match-term">${escHtml(p.term)}</div>
        <div class="qz-match-dropzone ${done ? (prog?.matched?.[i] === i ? 'qz-drop--correct' : 'qz-drop--wrong') : ''}" data-accept="${i}">
          ${done && prog?.matched ? escHtml(q.pairs[prog.matched[i]]?.def ?? '?') : 'Drop here'}
        </div>
      </div>`).join('');

    const defHTML = done ? '' : defs.map((d, i) =>
      `<div class="qz-drag-item" draggable="true" data-def="${q.pairs.indexOf(q.pairs.find(p => p.def === d))}">${escHtml(d)}</div>`
    ).join('');

    return `
      <div class="qz-match-wrap">
        <div class="qz-match-terms">${termHTML}</div>
        ${!done ? `<div class="qz-match-pool" data-qid="${q.id}">${defHTML}</div>` : ''}
      </div>
      ${!done ? `<button class="btn-accent btn-sm qz-submit-match" data-qid="${q.id}">Check Matches</button>` : ''}`;
  }

  _renderDragGroup(q, done, prog) {
    const allItems = q.groups.flatMap((g, gi) => g.items.map(item => ({ item, gi })));
    const shuffled = this._seededShuffle([...allItems], q.id + 'g');

    const groupZones = q.groups.map((g, gi) => {
      const placed = done ? allItems.filter(a => prog?.placements?.[a.item] === gi) : [];
      return `
        <div class="qz-group-zone" data-gi="${gi}" data-qid="${q.id}">
          <div class="qz-group-name">${escHtml(g.name)}</div>
          <div class="qz-group-drop">
            ${placed.map(a => `<div class="qz-drag-item qz-drag-item--done ${a.gi === gi ? 'qz-drag-item--correct' : 'qz-drag-item--wrong'}">${escHtml(a.item)}</div>`).join('')}
          </div>
        </div>`;
    }).join('');

    const pool = done ? '' : shuffled.map(({ item }) =>
      `<div class="qz-drag-item" draggable="true" data-item="${escHtml(item)}">${escHtml(item)}</div>`
    ).join('');

    return `
      <div class="qz-group-wrap">
        ${!done ? `<div class="qz-group-pool" data-qid="${q.id}">${pool}</div>` : ''}
        <div class="qz-group-zones">${groupZones}</div>
      </div>
      ${!done ? `<button class="btn-accent btn-sm qz-submit-group" data-qid="${q.id}">Check Groups</button>` : ''}`;
  }

  // ── Event binding ──────────────────────────────────────────────────────────

  _bindQuestionEvents(questions) {
    const body = this._bodyEl;

    // MC — select option
    body.querySelectorAll('.qz-mc-opt:not(.qz-mc-opt--done)').forEach(btn => {
      btn.addEventListener('click', () => {
        const container = btn.closest('.qz-mc-options');
        container.querySelectorAll('.qz-mc-opt').forEach(b => b.classList.remove('qz-mc-opt--selected'));
        btn.classList.add('qz-mc-opt--selected');
        const submitBtn = btn.closest('.qz-question').querySelector('.qz-submit-mc');
        if (submitBtn) submitBtn.disabled = false;
      });
    });

    // MC — submit
    body.querySelectorAll('.qz-submit-mc').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid   = btn.dataset.qid;
        const q     = QUIZ_QUESTIONS.find(q => q.id === qid);
        const sel   = btn.closest('.qz-question').querySelector('.qz-mc-opt--selected');
        if (!sel) return;
        const chosen = parseInt(sel.dataset.opt);
        this._recordAnswer(qid, chosen, chosen === q.answer);
      });
    });

    // Fill — submit
    body.querySelectorAll('.qz-submit-fill').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid    = btn.dataset.qid;
        const q      = QUIZ_QUESTIONS.find(q => q.id === qid);
        const inputs = btn.closest('.qz-fill-wrap').querySelectorAll('.qz-fill-input');
        const vals   = [...inputs].map(i => i.value.trim());
        const correct = vals.every((v, i) => {
          const accepted = Array.isArray(q.blanks[i]) ? q.blanks[i] : [q.blanks[i]];
          return accepted.some(a => a.toLowerCase() === v.toLowerCase());
        });
        this._recordAnswer(qid, vals, correct);
      });
    });

    // Fill — submit on Enter
    body.querySelectorAll('.qz-fill-input').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') inp.closest('.qz-fill-wrap')?.querySelector('.qz-submit-fill')?.click();
      });
    });

    // Drag order
    body.querySelectorAll('.qz-drag-order-list').forEach(list => {
      this._initDragOrder(list);
    });
    body.querySelectorAll('.qz-submit-order').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid  = btn.dataset.qid;
        const q    = QUIZ_QUESTIONS.find(q => q.id === qid);
        const list = body.querySelector(`.qz-drag-order-list[data-qid="${qid}"]`);
        const order = [...list.querySelectorAll('.qz-drag-item')].map(el =>
          this._seededShuffle([...q.items], q.id)[parseInt(el.dataset.item)]
        );
        const correct = order.every((item, i) => item === q.items[i]);
        this._recordAnswer(qid, order, correct);
      });
    });

    // Drag match
    body.querySelectorAll('.qz-match-pool').forEach(pool => {
      this._initDragMatch(pool);
    });
    body.querySelectorAll('.qz-submit-match').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid  = btn.dataset.qid;
        const q    = QUIZ_QUESTIONS.find(q => q.id === qid);
        const rows = body.querySelectorAll(`.qz-match-row`);
        const matched = {};
        let allFilled = true;
        rows.forEach(row => {
          const pairIdx  = parseInt(row.dataset.pair);
          const dropzone = row.querySelector('.qz-match-dropzone');
          const placed   = dropzone.dataset.placedDef;
          if (placed === undefined) { allFilled = false; return; }
          matched[pairIdx] = parseInt(placed);
        });
        if (!allFilled) { alert('Please match all items before submitting.'); return; }
        const correct = q.pairs.every((_, i) => matched[i] === i);
        this._recordAnswer(qid, matched, correct);
      });
    });

    // Drag group
    body.querySelectorAll('.qz-group-pool').forEach(pool => {
      this._initDragGroup(pool);
    });
    body.querySelectorAll('.qz-submit-group').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid    = btn.dataset.qid;
        const q      = QUIZ_QUESTIONS.find(q => q.id === qid);
        const zones  = body.querySelectorAll(`.qz-group-zone[data-qid="${qid}"]`);
        const placements = {};
        zones.forEach(zone => {
          const gi = parseInt(zone.dataset.gi);
          zone.querySelectorAll('.qz-drag-item').forEach(item => {
            placements[item.dataset.item] = gi;
          });
        });
        const allCorrect = q.groups.every((g, gi) =>
          g.items.every(item => placements[item] === gi)
        );
        this._recordAnswer(qid, { placements }, allCorrect);
      });
    });
  }

  // ── Drag implementations ───────────────────────────────────────────────────

  _initDragOrder(list) {
    let dragSrc = null;
    list.querySelectorAll('.qz-drag-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        dragSrc = item;
        e.dataTransfer.effectAllowed = 'move';
        item.classList.add('qz-dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('qz-dragging'));
      item.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      item.addEventListener('drop', e => {
        e.preventDefault();
        if (dragSrc && dragSrc !== item) {
          const items   = [...list.querySelectorAll('.qz-drag-item')];
          const srcIdx  = items.indexOf(dragSrc);
          const tgtIdx  = items.indexOf(item);
          if (srcIdx < tgtIdx) list.insertBefore(dragSrc, item.nextSibling);
          else                 list.insertBefore(dragSrc, item);
        }
      });
    });
  }

  _initDragMatch(pool) {
    const body = this._bodyEl;

    pool.querySelectorAll('.qz-drag-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('def-idx', item.dataset.def);
        e.dataTransfer.setData('def-text', item.textContent.trim());
        item.classList.add('qz-dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('qz-dragging'));
    });

    body.querySelectorAll('.qz-match-dropzone').forEach(zone => {
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('qz-drop--hover'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('qz-drop--hover'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('qz-drop--hover');
        const defIdx  = e.dataTransfer.getData('def-idx');
        const defText = e.dataTransfer.getData('def-text');
        zone.textContent       = defText;
        zone.dataset.placedDef = defIdx;
      });
    });
  }

  _initDragGroup(pool) {
    const body = this._bodyEl;

    pool.querySelectorAll('.qz-drag-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('item-text', item.dataset.item);
        item.classList.add('qz-dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('qz-dragging'));
    });

    body.querySelectorAll('.qz-group-drop').forEach(drop => {
      drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('qz-drop--hover'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('qz-drop--hover'));
      drop.addEventListener('drop', e => {
        e.preventDefault();
        drop.classList.remove('qz-drop--hover');
        const itemText = e.dataTransfer.getData('item-text');
        // Remove from pool or other zone
        body.querySelectorAll(`.qz-drag-item[data-item="${CSS.escape(itemText)}"]`).forEach(el => el.remove());
        const newEl = document.createElement('div');
        newEl.className   = 'qz-drag-item';
        newEl.draggable   = true;
        newEl.dataset.item = itemText;
        newEl.textContent = itemText;
        // Re-attach drag events
        newEl.addEventListener('dragstart', ev => {
          ev.dataTransfer.setData('item-text', itemText);
          newEl.classList.add('qz-dragging');
        });
        newEl.addEventListener('dragend', () => newEl.classList.remove('qz-dragging'));
        drop.appendChild(newEl);
      });
    });
  }

  // ── Answer recording ───────────────────────────────────────────────────────

  async _recordAnswer(qid, answer, correct) {
    this._progress[qid] = { answer, correct, attemptedAt: Date.now() };
    if (this._uid) {
      await saveQuizProgress(this._uid, { answers: this._progress });
    }
    this._render();
  }

  // ── Correct answer display ─────────────────────────────────────────────────

  _correctAnswerText(q) {
    if (q.type === 'mc')   return q.options[q.answer];
    if (q.type === 'fill') return q.blanks.map(b => Array.isArray(b) ? b[0] : b).join(' / ');
    if (q.type === 'drag' && q.subtype === 'order') return q.items.join(' → ');
    if (q.type === 'drag' && q.subtype === 'match') return q.pairs.map(p => `${p.term} = ${p.def}`).join(', ');
    if (q.type === 'drag' && q.subtype === 'group') return q.groups.map(g => `${g.name}: ${g.items.join(', ')}`).join(' | ');
    return '';
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

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
