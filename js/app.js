/*
 * Credence — app shell: persona switch, routing, modal, tooltip, toast,
 * claim and evidence editors, and the Data menu (import / export).
 */
(function () {
  const C = (window.C = window.C || {});
  const esc = C.esc;
  const S = C.state;
  const main = document.getElementById('main');

  C.ui = { route: 'home', claimId: null };

  /* ---------- persona ---------- */
  function syncPersona() {
    const p = S.settings.persona;
    document.querySelectorAll('.persona-switch [data-persona]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.persona === p)));
    document.body.dataset.viewAs = p;
  }
  C.setPersona = function (p) {
    if (p !== 'expert' && p !== 'funder') return;
    S.settings.persona = p;
    C.save();
    syncPersona();
    // the report is for funders: send experts back to the claims
    if (p === 'expert' && location.hash === '#question-report') location.hash = 'question';
    else route();
    C.toast(p === 'funder' ? 'Funder view: panel results, profiles and the report are open.' : 'Expert view: assess claims; each claim’s panel opens after you submit.');
  };

  /* ---------- routing ---------- */
  function route() {
    let h = (location.hash || '#home').slice(1);
    // links from the first version of the prototype
    if (h === 'assess') h = 'question';
    else if (h === 'report') h = 'question-report';
    else if (h.startsWith('report-')) h = 'claim-' + h.slice(7);

    syncPersona();
    hideTip();
    let nav = 'home';
    if (h === 'question' || h === 'question-panel' || h === 'question-report') {
      C.views.question(main, h === 'question' ? 'claims' : h.slice(9));
      nav = 'question';
    } else if (h.startsWith('claim-')) {
      C.ui.claimId = h.slice(6);
      C.views.claim(main, C.ui.claimId);
      nav = 'question';
    } else if (h.startsWith('assessor-')) {
      C.views.assessor(main, h.slice(9));
      nav = 'question';
    } else if (h === 'method') {
      C.views.method(main);
      nav = 'method';
    } else {
      C.views.home(main);
    }
    document.querySelectorAll('.top-link').forEach((a) => {
      if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (C.ui.route !== h) window.scrollTo(0, 0);
    C.ui.route = h;
  }
  C.rerender = route;
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
    toastTimer = setTimeout(() => (el.hidden = true), 3400);
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
  C.modal = function (opts) {
    const lastFocus = document.activeElement;
    modalRoot.innerHTML = `<div class="modal-back">
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
      if (lastFocus && lastFocus.focus && document.body.contains(lastFocus)) lastFocus.focus();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', (e) => {
      if (e.target === back) return close();
      const b = e.target.closest('[data-mact]');
      if (!b) return;
      const a = opts.actions[+b.dataset.mact];
      if (!a.onClick) return close();
      try {
        const keep = a.onClick(back);
        if (keep !== true && modalRoot.firstElementChild === back) close();
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
        )}</textarea></div>
        ${isNew ? '<p class="fine">Who should be able to add claims is still an open question for the Bycelium team. In this prototype, experts and funders both can.</p>' : ''}`,
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
              C.save();
              location.hash = 'claim-' + c.id;
            } else {
              claim.title = title;
              claim.statement = statement;
              C.save();
              route();
            }
          },
        },
      ],
    });
  };

  C.deleteClaim = function (claim) {
    C.modal({
      title: 'Delete this claim?',
      body: `<p>${esc(claim.title)}</p><p class="step-hint">Its evidence and your assessment of it will be removed from this browser.</p>`,
      actions: [
        { label: 'Keep it' },
        {
          label: 'Delete claim',
          primary: true,
          onClick: () => {
            S.inquiry.claims = S.inquiry.claims.filter((c) => c !== claim);
            delete S.me.ratings[claim.id];
            C.save();
            location.hash = 'question';
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

  /* ---------- export / import ---------- */
  let framed = false;
  try {
    framed = window.self !== window.top;
  } catch (e) {
    framed = true;
  }
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
      /* blocked: Copy still works */
    }
  }
  const slug = (s) =>
    String(s || 'assessor')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'assessor';

  C.openExport = function (what) {
    const mine = what === 'mine';
    if (mine && !C.anyComplete()) {
      C.modal({
        title: 'Nothing to export yet',
        body: '<p class="step-hint">Submit at least one assessment first. Only submitted assessments are exported.</p>',
        actions: [{ label: 'Close', primary: true }],
      });
      return;
    }
    const text = JSON.stringify(mine ? C.exportMine() : C.exportInquiry(), null, 2);
    const name = mine ? `credence-ratings-${slug(S.me.name)}.json` : `credence-question-${slug(S.inquiry.title)}.json`;
    C.modal({
      title: mine ? 'Export my assessments' : 'Export the whole question',
      body: `<p class="step-hint">${
        mine
          ? `Includes your profile and ${Object.keys(C.myDoneRatings()).length} submitted assessment(s). Send this file, or the copied text, to your facilitator.${
              S.me.name ? '' : ' <b>Add your name in your profile first</b> so they know whose it is.'
            }`
          : 'Includes claims, evidence and every imported assessment. Share it so another team can continue or audit the question.'
      }</p><textarea class="field code" id="x-text" readonly>${esc(text)}</textarea>`,
      actions: [
        { label: 'Close' },
        ...(mine ? [{ label: 'Edit profile', onClick: () => setTimeout(C.editProfile, 0) }] : []),
        ...(framed
          ? []
          : [
              {
                label: 'Download file',
                onClick: () => {
                  download(name, text);
                  return true;
                },
              },
            ]),
        {
          label: 'Copy',
          primary: true,
          onClick: () => {
            C.copyText(text, 'Copied. Paste it into a message to your facilitator.');
          },
        },
      ],
    });
  };

  C.openImport = function () {
    C.modal({
      title: 'Import assessments or a question',
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
    const nImp = S.imported.assessors.length;
    C.modal({
      title: 'Data',
      body: `<div class="menu-list">
        ${
          S.inquiry.sample
            ? `<div class="menu-item"><div><h4>Illustrative panel</h4><p>20 fictional assessors with simulated assessments. Turn off when your real panel is in.</p></div>
          <button class="switch" role="switch" aria-checked="${S.settings.useSample}" id="d-sample" aria-label="Include illustrative panel"></button></div>`
            : ''
        }
        <div class="menu-item"><div><h4>Your profile</h4><p>Name, field, links and declared interests shown with your assessments.</p></div><button class="btn-ghost sm" id="d-profile">Edit</button></div>
        <div class="menu-item"><div><h4>Export my assessments</h4><p>A small file to send to your facilitator.</p></div><button class="btn-ghost sm" id="d-exp-mine">Export</button></div>
        <div class="menu-item"><div><h4>Import assessments or a question</h4><p>${nImp} imported assessor${nImp === 1 ? '' : 's'} so far.</p></div><button class="btn-ghost sm" id="d-imp">Import</button></div>
        <div class="menu-item"><div><h4>Export the whole question</h4><p>Claims, evidence and all assessments, to hand to another team.</p></div><button class="btn-ghost sm" id="d-exp-all">Export</button></div>
        <div class="menu-item"><div><h4>Restore the sample</h4><p>Bring back the Alzheimer’s question and clear your assessments and imports.</p></div><button class="btn-ghost sm" id="d-reset">Restore</button></div>
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
        el.querySelector('#d-profile').addEventListener('click', () => C.editProfile());
        el.querySelector('#d-exp-mine').addEventListener('click', () => C.openExport('mine'));
        el.querySelector('#d-exp-all').addEventListener('click', () => C.openExport('all'));
        el.querySelector('#d-imp').addEventListener('click', () => C.openImport());
        el.querySelector('#d-reset').addEventListener('click', () => confirmReset());
      },
    });
  };

  function newQuestion() {
    C.modal({
      title: 'Start a new question',
      body: `<div class="form-row"><label for="b-title">Question your panel will examine</label><input class="field" id="b-title" placeholder="e.g. Does the gut microbiome drive Parkinson’s disease?"></div>
        <div class="form-row"><label for="b-field">Field</label><input class="field" id="b-field" placeholder="e.g. Neurodegeneration · Life sciences"></div>
        <div class="form-row"><label for="b-desc">Why it matters (optional)</label><textarea class="field" id="b-desc" rows="2"></textarea></div>
        <p class="step-hint">This prototype holds one live question per browser, so the sample question and your assessments of it will be replaced. You can restore the sample from Data.</p>`,
      actions: [
        { label: 'Cancel' },
        {
          label: 'Start question',
          primary: true,
          onClick: (el) => {
            const title = el.querySelector('#b-title').value.trim();
            if (!title) throw new Error('Write the question first.');
            S.inquiry = {
              id: C.uid('inq-'),
              sample: false,
              field: el.querySelector('#b-field').value.trim() || 'Inquiry',
              title,
              description: el.querySelector('#b-desc').value.trim(),
              claims: [],
            };
            S.me.ratings = {};
            S.imported = { assessors: [], ratings: {} };
            C.save();
            if (location.hash === '#question') route();
            else location.hash = 'question';
          },
        },
      ],
    });
  }

  function confirmReset() {
    C.modal({
      title: 'Restore the sample question?',
      body: `<p class="step-hint">Your assessments, imported assessors and any claims you added will be removed from this browser. Your profile stays.</p>`,
      actions: [
        { label: 'Cancel' },
        {
          label: 'Restore sample',
          primary: true,
          onClick: () => {
            C.resetAll();
            location.hash = 'question';
            route();
            C.toast('Sample question restored.');
          },
        },
      ],
    });
  }

  /* ---------- global actions ---------- */
  document.addEventListener('click', (ev) => {
    const persona = ev.target.closest('button[data-persona]');
    if (persona) {
      const wasHome = !location.hash || location.hash === '#home';
      C.setPersona(persona.dataset.persona);
      if (wasHome && persona.classList.contains('pcard')) location.hash = 'question';
      return;
    }
    const assess = ev.target.closest('[data-assess]');
    if (assess) {
      C.openWizard(assess.dataset.assess, assess.dataset.step);
      return;
    }
    const t = ev.target.closest('[data-act]');
    if (!t) return;
    const claim = C.ui.claimId && C.claim(C.ui.claimId);
    const act = t.dataset.act;
    if (act === 'open-data') C.openData();
    else if (act === 'new-question') newQuestion();
    else if (act === 'add-claim') C.editClaim(null);
    else if (act === 'edit-claim' && claim) C.editClaim(claim);
    else if (act === 'del-claim' && claim) C.deleteClaim(claim);
    else if (act === 'add-ev' && claim) C.editEvidence(claim, null);
    else if (act === 'edit-profile') C.editProfile();
    else if (act === 'copy-summary') C.copyText(C.summaryText(), 'Summary copied. Paste it into your memo.');
    else if (act === 'copy-claim') C.copyText(C.summaryText(t.dataset.claimId), 'Claim summary copied.');
  });

  route();
})();
