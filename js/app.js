/*
 * Credence — app shell: routing, inquiry header, data menu, editors, tooltip and toast.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const S = C.state;
  const main = document.getElementById('main');

  C.ui = { view: 'assess', claimId: null, reportClaim: null };

  /* ---------- header ---------- */
  C.renderHeader = function () {
    const el = document.getElementById('inq');
    const claims = S.inquiry.claims;
    const nEv = claims.reduce((a, c) => a + c.evidence.length, 0);
    const people = C.people(Object.keys(S.me.ratings).length > 0).length;
    const mine = claims.filter((c) => {
      const r = S.me.ratings[c.id];
      return r && r.prior != null;
    }).length;
    el.innerHTML = `<div class="wrap inq">
      <div class="inq-row">
        <div class="inq-main">
          <p class="eyebrow">${esc(S.inquiry.field || 'Inquiry')}</p>
          <h1 class="inq-title">${esc(S.inquiry.title || 'Untitled inquiry')}</h1>
          ${S.inquiry.description ? `<p class="inq-desc">${esc(S.inquiry.description)}</p>` : ''}
        </div>
        <div class="inq-meta">
          <span><b class="num">${claims.length}</b>claims</span>
          <span><b class="num">${nEv}</b>pieces of evidence</span>
          <span><b class="num">${people}</b>assessors</span>
          <span><b class="num">${mine}/${claims.length}</b>rated by you</span>
        </div>
      </div>
      ${
        C.sampleActive()
          ? `<div class="notice"><span class="notice-ico" aria-hidden="true">!</span><span><b>Sample inquiry.</b> The studies are real; the 20 assessors and their ratings are fictional, simulated to show how a panel reads. Turn the sample panel off in <button class="btn-link" data-act="open-data">Data</button> when running with real people.</span></div>`
          : ''
      }
    </div>`;
  };

  /* ---------- routing ---------- */
  function route() {
    const h = (location.hash || '#assess').slice(1);
    let view = 'assess';
    let arg = null;
    if (h === 'report') view = 'report';
    else if (h.startsWith('report-')) {
      view = 'report';
      arg = h.slice(7);
    } else if (h === 'method') view = 'method';
    C.ui.view = view;
    document.querySelectorAll('.tab').forEach((t) => {
      if (t.dataset.view === view) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    hideTip();
    C.renderHeader();
    if (view === 'report') C.views.report(main, arg);
    else if (view === 'method') C.views.method(main);
    else C.views.assess(main);
    if (!C._firstRoute) window.scrollTo(0, 0);
    C._firstRoute = false;
  }
  C.rerender = route;
  C._firstRoute = true;
  window.addEventListener('hashchange', route);

  let resizeTimer = null;
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastW) < 8) return;
    lastW = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(route, 160);
  });

  /* ---------- tooltip ---------- */
  const tip = document.getElementById('tooltip');
  function hideTip() {
    tip.hidden = true;
  }
  document.addEventListener('mousemove', (ev) => {
    const t = ev.target.closest && ev.target.closest('[data-tip]');
    if (!t) return hideTip();
    tip.innerHTML = t.getAttribute('data-tip');
    tip.hidden = false;
    const pad = 14;
    const r = tip.getBoundingClientRect();
    let x = ev.clientX + pad;
    let y = ev.clientY + pad;
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - pad;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  });
  document.addEventListener('scroll', hideTip, { passive: true });

  /* ---------- toast ---------- */
  let toastTimer = null;
  C.toast = function (msg) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 3200);
  };

  C.copyText = function (text, okMsg) {
    const fallback = () => C.showText('Copy this text', text);
    try {
      navigator.clipboard.writeText(text).then(() => C.toast(okMsg || 'Copied.'), fallback);
    } catch (e) {
      fallback();
    }
  };

  /* ---------- modal ---------- */
  const modalRoot = document.getElementById('modal-root');
  let lastFocus = null;
  C.modal = function (opts) {
    lastFocus = document.activeElement;
    modalRoot.innerHTML = `<div class="modal-back" data-close>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">${esc(opts.title)}</h2>
        <div class="modal-body">${opts.body}</div>
        <p class="err" id="modal-err" hidden></p>
        <div class="modal-actions">${(opts.actions || [])
          .map((a, i) => `<button type="button" class="${a.primary ? 'btn' : 'btn-ghost'}" data-mact="${i}">${esc(a.label)}</button>`)
          .join('')}</div>
      </div></div>`;
    const back = modalRoot.firstElementChild;
    const close = () => {
      modalRoot.innerHTML = '';
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', (e) => {
      if (e.target === back) close();
      const b = e.target.closest('[data-mact]');
      if (!b) return;
      const a = opts.actions[+b.dataset.mact];
      if (!a.onClick) return close();
      try {
        const keep = a.onClick(back);
        if (keep !== true) close();
      } catch (err) {
        const el = back.querySelector('#modal-err');
        el.textContent = err.message;
        el.hidden = false;
      }
    });
    if (opts.onOpen) opts.onOpen(back);
    const first = back.querySelector('input, textarea, select, button');
    if (first) first.focus();
    return { close, el: back };
  };

  C.showText = function (title, text) {
    C.modal({
      title,
      body: `<textarea class="field code" readonly id="show-text">${esc(text)}</textarea>`,
      actions: [{ label: 'Close' }],
      onOpen: (el) => el.querySelector('#show-text').select(),
    });
  };

  /* ---------- editors ---------- */
  const KINDS = ['Clinical trial', 'Cohort', 'Observational', 'Natural experiment', 'Meta-analysis', 'Genetics', 'Imaging', 'Pathology', 'Lab / animal', 'Review', 'Methods', 'Other'];
  const STATUSES = ['Single study', 'Replicated', 'Replication', 'Contested', 'Retracted'];

  C.editClaim = function (claim) {
    const isNew = !claim;
    C.modal({
      title: isNew ? 'Add a claim' : 'Edit claim',
      body: `<div class="form-row"><label for="f-title">Claim, in one short sentence</label><input class="field" id="f-title" maxlength="140" value="${esc(
        claim ? claim.title : ''
      )}" placeholder="e.g. Compound X slows disease Y in humans"></div>
        <div class="form-row"><label for="f-stmt">Precise statement (optional)</label><textarea class="field" id="f-stmt" rows="3" placeholder="What exactly would have to be true?">${esc(
          claim ? claim.statement : ''
        )}</textarea></div>`,
      actions: [
        { label: 'Cancel' },
        {
          label: isNew ? 'Add claim' : 'Save',
          primary: true,
          onClick: (el) => {
            const title = el.querySelector('#f-title').value.trim();
            if (!title) throw new Error('Write the claim first.');
            const statement = el.querySelector('#f-stmt').value.trim();
            if (isNew) {
              const c = { id: C.uid('c-'), title, statement, evidence: [] };
              S.inquiry.claims.push(c);
              C.ui.claimId = c.id;
            } else {
              claim.title = title;
              claim.statement = statement;
            }
            C.save();
            if (location.hash !== '#assess' && location.hash !== '') location.hash = 'assess';
            else route();
          },
        },
      ],
    });
  };

  C.deleteClaim = function (claim) {
    C.modal({
      title: 'Delete this claim?',
      body: `<p>${esc(claim.title)}</p><p class="step-hint">Its evidence and everyone’s ratings for it will be removed from this browser.</p>`,
      actions: [
        { label: 'Keep it' },
        {
          label: 'Delete claim',
          primary: true,
          onClick: () => {
            S.inquiry.claims = S.inquiry.claims.filter((c) => c !== claim);
            delete S.me.ratings[claim.id];
            C.ui.claimId = null;
            C.save();
            route();
          },
        },
      ],
    });
  };

  C.editEvidence = function (claim, e) {
    const isNew = !e;
    const src = (e && e.source) || {};
    C.modal({
      title: isNew ? 'Add a piece of evidence' : 'Edit evidence',
      body: `<div class="form-row"><label for="f-title">Finding, in one sentence</label><input class="field" id="f-title" maxlength="160" value="${esc(
        e ? e.title : ''
      )}" placeholder="What did the study find?"></div>
        <div class="form-row"><label for="f-sum">Summary (optional)</label><textarea class="field" id="f-sum" rows="3" placeholder="Design, size, key numbers">${esc(
          e ? e.summary : ''
        )}</textarea></div>
        <div class="form-grid">
          <div class="form-row"><label for="f-src">Source</label><input class="field" id="f-src" value="${esc(src.label || '')}" placeholder="Author et al., Journal"></div>
          <div class="form-row"><label for="f-year">Year</label><input class="field" id="f-year" inputmode="numeric" value="${esc(src.year || '')}"></div>
        </div>
        <div class="form-row"><label for="f-url">Link (DOI, PubMed or preprint)</label><input class="field" id="f-url" type="url" value="${esc(src.url || '')}" placeholder="https://"></div>
        <div class="form-grid">
          <div class="form-row"><label for="f-kind">Type of evidence</label><select class="field" id="f-kind">${KINDS.map(
            (k) => `<option${e && e.kind === k ? ' selected' : ''}>${esc(k)}</option>`
          ).join('')}</select></div>
          <div class="form-row"><label for="f-status">Status</label><select class="field" id="f-status">${STATUSES.map(
            (k) => `<option${e && e.status === k ? ' selected' : ''}>${esc(k)}</option>`
          ).join('')}</select></div>
        </div>`,
      actions: [
        { label: 'Cancel' },
        {
          label: isNew ? 'Add evidence' : 'Save',
          primary: true,
          onClick: (el) => {
            const title = el.querySelector('#f-title').value.trim();
            if (!title) throw new Error('Describe the finding first.');
            const url = el.querySelector('#f-url').value.trim();
            if (url && !/^https?:\/\//i.test(url)) throw new Error('Links must start with http:// or https://');
            const data = {
              title,
              summary: el.querySelector('#f-sum').value.trim(),
              source: { label: el.querySelector('#f-src').value.trim(), year: el.querySelector('#f-year').value.trim(), url },
              kind: el.querySelector('#f-kind').value,
              status: el.querySelector('#f-status').value,
            };
            if (isNew) claim.evidence.push({ id: C.uid('e-'), ...data });
            else Object.assign(e, data);
            C.save();
            route();
          },
        },
      ],
    });
  };

  C.deleteEvidence = function (claim, e) {
    C.modal({
      title: 'Remove this evidence?',
      body: `<p>${esc(e.title)}</p>`,
      actions: [
        { label: 'Keep it' },
        {
          label: 'Remove',
          primary: true,
          onClick: () => {
            claim.evidence = claim.evidence.filter((x) => x !== e);
            const r = S.me.ratings[claim.id];
            if (r && r.ev) delete r.ev[e.id];
            C.save();
            route();
          },
        },
      ],
    });
  };

  /* ---------- export / import ---------- */
  function download(name, text) {
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 500);
    } catch (e) {
      /* sandboxed viewers block downloads; Copy still works */
    }
  }
  const slug = (s) =>
    String(s || 'assessor')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'assessor';

  C.openExport = function (what) {
    const data = what === 'mine' ? C.exportMine() : C.exportInquiry();
    const text = JSON.stringify(data, null, 2);
    const name = what === 'mine' ? `credence-ratings-${slug(S.me.name)}.json` : `credence-inquiry-${slug(S.inquiry.title)}.json`;
    const nameField =
      what === 'mine'
        ? `<div class="form-grid"><div class="form-row"><label for="x-name">Your name</label><input class="field" id="x-name" value="${esc(
            S.me.name
          )}" placeholder="So the facilitator knows whose file this is"></div><div class="form-row"><label for="x-disc">Your field</label><input class="field" id="x-disc" value="${esc(
            S.me.discipline
          )}"></div></div>`
        : '';
    C.modal({
      title: what === 'mine' ? 'Export my ratings' : 'Export the whole inquiry',
      body: `${nameField}<p class="step-hint">${
        what === 'mine'
          ? 'Send this file (or the copied text) to your facilitator. They import it to add you to the panel.'
          : 'Includes claims, evidence and every imported rating. Share it so another team can continue or audit the inquiry.'
      }</p><textarea class="field code" id="x-text" readonly>${esc(text)}</textarea>`,
      actions: [
        { label: 'Close' },
        {
          label: 'Download file',
          onClick: (el) => {
            download(name, el.querySelector('#x-text').value);
            return true;
          },
        },
        {
          label: 'Copy',
          primary: true,
          onClick: (el) => {
            C.copyText(el.querySelector('#x-text').value, 'Copied. Paste it into a message to your facilitator.');
          },
        },
      ],
      onOpen: (el) => {
        const upd = () => {
          S.me.name = el.querySelector('#x-name').value;
          S.me.discipline = el.querySelector('#x-disc').value;
          C.save();
          el.querySelector('#x-text').value = JSON.stringify(C.exportMine(), null, 2);
        };
        if (what === 'mine') {
          el.querySelector('#x-name').addEventListener('input', upd);
          el.querySelector('#x-disc').addEventListener('input', upd);
        }
      },
    });
  };

  C.openImport = function () {
    C.modal({
      title: 'Import ratings or an inquiry',
      body: `<p class="step-hint">Choose one or more files exported from Credence, or paste the text of one.</p>
        <input type="file" id="i-files" accept="application/json,.json" multiple class="field">
        <textarea class="field code" id="i-text" placeholder="…or paste exported text here"></textarea>`,
      actions: [
        { label: 'Cancel' },
        {
          label: 'Import',
          primary: true,
          onClick: (el) => {
            const files = el.querySelector('#i-files').files;
            const text = el.querySelector('#i-text').value.trim();
            if (!files.length && !text) throw new Error('Choose a file or paste some text first.');
            const msgs = [];
            const finish = () => {
              C.toast(msgs.join(' '));
              route();
            };
            if (text) {
              let obj;
              try {
                obj = JSON.parse(text);
              } catch (e) {
                throw new Error('That text isn’t valid JSON. Copy the whole export, including the braces.');
              }
              msgs.push(C.importData(obj));
            }
            if (!files.length) return finish();
            let left = files.length;
            [...files].forEach((f) => {
              const rd = new FileReader();
              rd.onload = () => {
                try {
                  msgs.push(C.importData(JSON.parse(rd.result)));
                } catch (e) {
                  msgs.push(f.name + ': ' + e.message);
                }
                if (--left === 0) finish();
              };
              rd.readAsText(f);
            });
          },
        },
      ],
    });
  };

  C.openData = function () {
    const sampleInq = S.inquiry.sample;
    const nImp = S.imported.assessors.length;
    C.modal({
      title: 'Data',
      body: `<div class="menu-list">
        ${
          sampleInq
            ? `<div class="menu-item"><div><h4>Illustrative panel</h4><p>20 fictional assessors with simulated ratings. Turn off when your real panel is in.</p></div>
          <button class="switch" role="switch" aria-checked="${S.settings.useSample}" id="d-sample" aria-label="Include illustrative panel"></button></div>`
            : ''
        }
        <div class="menu-item"><div><h4>Export my ratings</h4><p>A small file to send to your facilitator.</p></div><button class="btn-ghost sm" id="d-exp-mine">Export</button></div>
        <div class="menu-item"><div><h4>Import ratings or an inquiry</h4><p>${nImp} imported assessor${nImp === 1 ? '' : 's'} so far.</p></div><button class="btn-ghost sm" id="d-imp">Import</button></div>
        <div class="menu-item"><div><h4>Export the whole inquiry</h4><p>Claims, evidence and all ratings, to hand to another team.</p></div><button class="btn-ghost sm" id="d-exp-all">Export</button></div>
        <div class="menu-item"><div><h4>Start a blank inquiry</h4><p>For your own field. Removes the sample claims from this browser.</p></div><button class="btn-ghost sm" id="d-blank">Start</button></div>
        <div class="menu-item"><div><h4>Restore the sample</h4><p>Bring back the Alzheimer’s inquiry and clear your ratings and imports.</p></div><button class="btn-ghost sm" id="d-reset">Restore</button></div>
      </div>`,
      actions: [{ label: 'Done', primary: true }],
      onOpen: (el) => {
        const sw = el.querySelector('#d-sample');
        if (sw)
          sw.addEventListener('click', () => {
            S.settings.useSample = !S.settings.useSample;
            sw.setAttribute('aria-checked', S.settings.useSample);
            C.save();
            route();
          });
        el.querySelector('#d-exp-mine').addEventListener('click', () => C.openExport('mine'));
        el.querySelector('#d-exp-all').addEventListener('click', () => C.openExport('all'));
        el.querySelector('#d-imp').addEventListener('click', () => C.openImport());
        el.querySelector('#d-blank').addEventListener('click', () => confirmBlank());
        el.querySelector('#d-reset').addEventListener('click', () => confirmReset());
      },
    });
  };

  function confirmBlank() {
    C.modal({
      title: 'Start a blank inquiry?',
      body: `<div class="form-row"><label for="b-title">Question your panel will examine</label><input class="field" id="b-title" placeholder="e.g. Is the gut–brain axis a real driver of Parkinson’s?"></div>
        <div class="form-row"><label for="b-field">Field</label><input class="field" id="b-field" placeholder="e.g. Neurodegeneration · Life sciences"></div>
        <p class="step-hint">The sample claims and your ratings of them will be removed from this browser. You can restore the sample later.</p>`,
      actions: [
        { label: 'Cancel' },
        {
          label: 'Start blank inquiry',
          primary: true,
          onClick: (el) => {
            const title = el.querySelector('#b-title').value.trim() || 'Untitled inquiry';
            S.inquiry = { id: C.uid('inq-'), sample: false, field: el.querySelector('#b-field').value.trim() || 'Inquiry', title, description: '', claims: [] };
            S.me.ratings = {};
            S.imported = { assessors: [], ratings: {} };
            S.settings.revealed = {};
            C.ui.claimId = null;
            C.save();
            location.hash = 'assess';
            route();
          },
        },
      ],
    });
  }

  function confirmReset() {
    C.modal({
      title: 'Restore the sample inquiry?',
      body: `<p class="step-hint">Your ratings, imported assessors and any claims you added will be removed from this browser.</p>`,
      actions: [
        { label: 'Cancel' },
        {
          label: 'Restore sample',
          primary: true,
          onClick: () => {
            C.resetAll();
            C.ui.claimId = null;
            route();
            C.toast('Sample inquiry restored.');
          },
        },
      ],
    });
  }

  /* ---------- global actions ---------- */
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'open-data') C.openData();
  });

  route();
})();
