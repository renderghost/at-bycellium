/*
 * Credence — the assessment form. A modal that asks one thing at a time:
 * starting belief → each piece of evidence → review and submit.
 * Answers save as you go, so closing the form never loses work.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const S = C.state;

  let W = null; // { cid, step, root, lastFocus }

  function steps(claim) {
    return ['prior', ...claim.evidence.map((e) => e.id), 'review'];
  }

  function stepAnswered(claim, key) {
    const r = S.me.ratings[claim.id];
    if (key === 'prior') return !!(r && r.prior != null);
    if (key === 'review') return false;
    const x = r && r.ev && r.ev[key];
    return !!(x && (x.s != null || x.skipped));
  }

  function cumulativeBefore(claim, uptoIdx) {
    const r = S.me.ratings[claim.id];
    if (!r || r.prior == null) return null;
    let v = r.prior;
    claim.evidence.slice(0, uptoIdx).forEach((e) => {
      const x = r.ev && r.ev[e.id];
      if (x && x.s != null) v += x.s * (x.t != null ? x.t : 1);
    });
    return v;
  }

  C.openWizard = function (cid, startKey) {
    const claim = C.claim(cid);
    if (!claim) return;
    C.myRating(cid, true);
    const list = steps(claim);
    let step = 0;
    if (startKey) step = Math.max(0, list.indexOf(startKey));
    else {
      const firstOpen = list.findIndex((k) => k !== 'review' && !stepAnswered(claim, k));
      step = firstOpen === -1 ? list.length - 1 : firstOpen;
    }
    const host = document.getElementById('modal-root');
    W = { cid, step, lastFocus: document.activeElement };
    host.innerHTML = `<div class="wiz-back"><div class="wiz" role="dialog" aria-modal="true" aria-labelledby="wiz-title" id="wiz"></div></div>`;
    document.body.classList.add('is-taken-over');
    W.root = host.querySelector('#wiz');
    bind(W.root);
    document.addEventListener('keydown', onKey);
    render();
  };

  function close() {
    document.removeEventListener('keydown', onKey);
    document.getElementById('modal-root').innerHTML = '';
    document.body.classList.remove('is-taken-over');
    const back = W && W.lastFocus;
    W = null;
    C.save();
    C.rerender();
    if (back && back.focus && document.body.contains(back)) back.focus();
  }

  function onKey(e) {
    if (!W) return;
    if (e.key === 'Escape') close();
  }

  function render() {
    const claim = C.claim(W.cid);
    const list = steps(claim);
    const key = list[W.step];
    const idx = S.inquiry.claims.indexOf(claim);
    const r = S.me.ratings[claim.id];

    const segs = list
      .map((k, i) => {
        const done = stepAnswered(claim, k);
        const cur = i === W.step;
        const label = k === 'prior' ? 'Starting belief' : k === 'review' ? 'Review' : 'Evidence ' + i;
        return `<button type="button" class="wseg${done ? ' is-done' : ''}${cur ? ' is-cur' : ''}" data-go="${i}" aria-label="${esc(label)}${
          done ? ', answered' : ''
        }"${cur ? ' aria-current="step"' : ''}></button>`;
      })
      .join('');

    let body = '';
    let canNext = stepAnswered(claim, key);
    if (key === 'prior') {
      body = `<h3 class="wq">Before weighing any evidence, how likely is this claim?</h3>
        <p class="step-hint">Your honest starting point from background knowledge. You can come back and change it.</p>
        ${C.credenceHTML(r ? r.prior : null)}`;
    } else if (key === 'review') {
      canNext = r && r.prior != null;
      const answered = claim.evidence.filter((e) => stepAnswered(claim, e.id)).length;
      const rows = claim.evidence
        .map((e, i) => {
          const x = r && r.ev && r.ev[e.id];
          const txt = !x ? 'Not answered' : x.skipped ? 'Skipped' : M.strengthLabel(x.s) + (x.t != null && x.t < 1 ? ` · trusted “${M.trustLabel(x.t).toLowerCase()}”` : '');
          return `<li><span class="rv-title">${esc(e.title)}</span><span class="rv-ans">${esc(txt)}</span><button type="button" class="btn-link" data-go="${i + 1}">Change</button></li>`;
        })
        .join('');
      const res = C.posteriorOf(claim, r);
      body = `<h3 class="wq">Review your assessment</h3>
        <p class="step-hint">${answered} of ${claim.evidence.length} pieces of evidence answered. Check your answers, and the path on the right: where you started, how each finding moved you, where you ended up.</p>
        ${res ? `<div class="rv-fig"><span class="cred-big num">${M.pctDb(res.post)}</span><span><b>${esc(M.verbalDb(res.post))}</b><br><span class="cred-freq">${esc(M.chance(M.toP(res.post)))}</span></span></div>` : ''}
        <ul class="rv-list"><li><span class="rv-title">Starting belief</span><span class="rv-ans">${r && r.prior != null ? M.pctDb(r.prior) : 'Not set'}</span><button type="button" class="btn-link" data-go="0">Change</button></li>${rows}</ul>
        <p class="fine">Once you submit, the panel’s assessments of this claim open to you. You can still edit your answers afterwards.</p>`;
    } else {
      const k = claim.evidence.findIndex((e) => e.id === key);
      const e = claim.evidence[k];
      const x = r && r.ev && r.ev[e.id];
      body = `${C.evidenceHead(e, k)}
        <div class="ev-q">
          <div class="q-label" id="ql-${esc(e.id)}">If this finding holds, what does it do to the claim?</div>
          ${C.scaleHTML(e, x)}
          <p class="readout">${C.readoutHTML(x)}</p>
        </div>
        <div class="ev-q">
          <div class="q-label" id="qt-${esc(e.id)}">How far do you trust the finding itself?</div>
          ${C.trustHTML(e, x)}
        </div>
        <details class="ev-note"${x && x.note ? ' open' : ''}><summary>Add a note for the panel</summary>
          <textarea class="field" data-note="${esc(e.id)}" rows="2" placeholder="Why? What would change your mind?">${esc((x && x.note) || '')}</textarea></details>`;
    }

    const isReview = key === 'review';
    const isEv = key !== 'prior' && !isReview;
    W.root.innerHTML = `
      <header class="wiz-head"><div class="wiz-in">
        <div class="wiz-top"><p class="eyebrow">Claim ${idx + 1} of ${S.inquiry.claims.length} · ${
      isReview ? 'Review' : key === 'prior' ? 'Starting belief' : 'Evidence ' + W.step + ' of ' + claim.evidence.length
    }</p>
          <button type="button" class="btn-ghost sm" data-wact="close">Save and close ×</button></div>
        <h2 class="wiz-claim" id="wiz-title">${esc(claim.title)}</h2>
        ${claim.statement && key === 'prior' ? `<p class="claim-statement">${esc(claim.statement)}</p>` : ''}
        <div class="wprog">${segs}</div>
      </div></header>
      <div class="wiz-body" id="wiz-body"><div class="wiz-cols">
        <div class="wiz-main">${body}</div>
        <aside class="wiz-side" aria-label="Your belief path"><div class="wiz-side-in">
          <h3 class="sub-h">Your belief path</h3>
          <p class="fine">Updates as you answer. Read from top to bottom: where you started, how each finding moves you, where you end up.</p>
          <div class="path-chart" id="wiz-path"></div>
          <div class="legend"><span class="lg"><i class="lg-for"></i>Supports</span><span class="lg"><i class="lg-against"></i>Opposes</span></div>
        </div></aside>
      </div></div>
      <footer class="wiz-foot"><div class="wiz-in wiz-foot-in">
        <button type="button" class="btn-ghost" data-wact="back"${W.step === 0 ? ' disabled' : ''}>← Back</button>
        <span class="wiz-spacer"></span>
        ${isEv ? `<button type="button" class="btn-link" data-wact="skip">Skip: outside my expertise</button>` : ''}
        ${
          isReview
            ? `<button type="button" class="btn" data-wact="submit"${canNext ? '' : ' disabled'}>${C.isComplete(claim.id) ? 'Save changes' : 'Submit assessment'}</button>`
            : `<button type="button" class="btn" data-wact="next"${canNext ? '' : ' disabled'}>${W.step === list.length - 2 ? 'Review →' : 'Next →'}</button>`
        }
      </div></footer>`;
    drawCharts();
    const body$ = W.root.querySelector('#wiz-body');
    body$.scrollTop = 0;
  }

  function drawCharts() {
    const claim = C.claim(W.cid);
    const key = steps(claim)[W.step];
    const el = W.root.querySelector('#wiz-path');
    if (el) C.charts.beliefPath(el, claim, S.me.ratings[claim.id], null, { hot: key, pending: 'to weigh' });
  }

  function refreshStep(focusSel) {
    render();
    if (focusSel) {
      const el = W.root.querySelector(focusSel);
      if (el) el.focus();
    }
  }

  function updateFooterOnly() {
    const claim = C.claim(W.cid);
    const key = steps(claim)[W.step];
    const next = W.root.querySelector('[data-wact="next"]');
    if (next) next.disabled = !stepAnswered(claim, key);
    W.root.querySelectorAll('.wseg').forEach((b, i) => b.classList.toggle('is-done', stepAnswered(claim, steps(claim)[i])));
  }

  let priorTimer = null;
  function bind(root) {
    root.addEventListener('click', (ev) => {
      const t = ev.target.closest('button');
      if (!t || !W) return;
      const claim = C.claim(W.cid);
      const list = steps(claim);
      const r = C.myRating(claim.id, true);
      if (t.dataset.go != null) {
        W.step = +t.dataset.go;
        render();
        return;
      }
      if (t.dataset.p) {
        const v = M.toDb(+t.dataset.p);
        r.prior = Math.round(v * 2) / 2;
        root.querySelector('#prior-range').value = r.prior;
        C.updateCredenceReadout(root, r.prior);
        updateFooterOnly();
        C.save();
        return;
      }
      if (t.dataset.s != null && t.dataset.ev) {
        const cur = r.ev[t.dataset.ev] || {};
        r.ev[t.dataset.ev] = { s: +t.dataset.s, t: cur.t != null ? cur.t : 0.67, note: cur.note };
        C.save();
        refreshStep(`[data-s="${t.dataset.s}"]`);
        return;
      }
      if (t.dataset.t != null && t.dataset.ev) {
        const cur = r.ev[t.dataset.ev];
        if (!cur || cur.s == null) return;
        cur.t = +t.dataset.t;
        C.save();
        refreshStep(`[data-t="${t.dataset.t}"]`);
        return;
      }
      const act = t.dataset.wact;
      if (act === 'close') close();
      else if (act === 'back' && W.step > 0) {
        W.step--;
        render();
      } else if (act === 'next' && W.step < list.length - 1) {
        W.step++;
        render();
      } else if (act === 'skip') {
        const key = list[W.step];
        const cur = r.ev[key] || {};
        r.ev[key] = { skipped: true, note: cur.note };
        C.save();
        W.step++;
        render();
      } else if (act === 'submit') {
        const first = !r.done;
        r.done = true;
        r.submittedAt = new Date().toISOString();
        C.save();
        const cid = W.cid;
        document.removeEventListener('keydown', onKey);
        document.getElementById('modal-root').innerHTML = '';
        document.body.classList.remove('is-taken-over');
        W = null;
        if (location.hash !== '#claim-' + cid) location.hash = 'claim-' + cid;
        else C.rerender();
        C.toast(first ? 'Assessment submitted. The panel’s views of this claim are now open to you.' : 'Changes saved.');
        setTimeout(() => {
          const el = document.getElementById('you-vs-panel');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    });

    root.addEventListener('input', (ev) => {
      if (!W) return;
      const t = ev.target;
      const claim = C.claim(W.cid);
      const r = C.myRating(claim.id, true);
      if (t.id === 'prior-range') {
        r.prior = Math.round(+t.value * 2) / 2;
        C.updateCredenceReadout(root, r.prior);
        clearTimeout(priorTimer);
        priorTimer = setTimeout(() => {
          updateFooterOnly();
          C.save();
        }, 120);
      } else if (t.dataset.note) {
        const cur = r.ev[t.dataset.note] || {};
        r.ev[t.dataset.note] = { ...cur, note: t.value };
        C.save();
      }
    });
    root.addEventListener('change', (ev) => {
      if (!W || ev.target.id !== 'prior-range') return;
      const r = C.myRating(W.cid, true);
      r.prior = Math.round(+ev.target.value * 2) / 2;
      C.updateCredenceReadout(root, r.prior);
      updateFooterOnly();
      C.save();
    });
  }
})();
