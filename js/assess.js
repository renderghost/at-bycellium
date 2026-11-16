/*
 * Credence — Assess view (for assessors / experts).
 * One claim at a time: starting belief → weigh each piece of evidence → compare with the panel.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const S = C.state;
  const views = (C.views = C.views || {});

  const STATUS_BADGE = {
    Retracted: ['retracted', '✕'],
    Contested: ['contested', '!'],
    Replicated: ['replicated', '✓'],
    'Single study': ['single', '1'],
    Replication: ['replication', '↻'],
  };
  C.statusBadge = function (status) {
    if (!status) return '';
    const b = STATUS_BADGE[status] || ['other', '·'];
    return `<span class="badge badge-${b[0]}"><i aria-hidden="true">${b[1]}</i>${esc(status)}</span>`;
  };

  function progress(claim) {
    const r = S.me.ratings[claim.id];
    let done = r && r.prior != null ? 1 : 0;
    for (const e of claim.evidence) if (r && r.ev && r.ev[e.id] && r.ev[e.id].s != null) done++;
    return { done, total: claim.evidence.length + 1, rated: done - (r && r.prior != null ? 1 : 0) };
  }

  const isRevealed = (cid) => !!S.settings.revealed[cid];

  function maybeAutoReveal(claim) {
    const p = progress(claim);
    if (p.done === p.total && !isRevealed(claim.id)) {
      S.settings.revealed[claim.id] = true;
      C.save();
      return true;
    }
    return false;
  }

  /* ---------- markup ---------- */
  function railHTML(current) {
    const items = S.inquiry.claims
      .map((c, i) => {
        const p = progress(c);
        const res = C.posteriorOf(c, S.me.ratings[c.id]);
        return `<li><button class="claim-btn" data-claim="${esc(c.id)}" aria-current="${c.id === current ? 'true' : 'false'}">
          <span class="cb-num">${i + 1}</span>
          <span class="cb-body"><span class="cb-title">${esc(c.title)}</span>
            <span class="cb-meta"><span class="cb-prog" aria-hidden="true"><i style="width:${Math.round((p.done / p.total) * 100)}%"></i></span>${p.rated} of ${c.evidence.length} weighed</span></span>
          <span class="cb-val">${res ? M.pctDb(res.post) : ''}</span>
        </button></li>`;
      })
      .join('');
    return `<div class="rail-head"><h2 class="rail-title">Claims</h2><button class="btn-link" data-act="add-claim">+ Add claim</button></div>
      <ol class="claim-list">${items}</ol>
      <div class="you-card">
        <label for="me-name">Assessing as</label>
        <input class="field" id="me-name" placeholder="Your name" value="${esc(S.me.name)}" autocomplete="name">
        <input class="field" id="me-disc" placeholder="Your field, e.g. Neuropathology" value="${esc(S.me.discipline)}">
        <button class="btn-ghost sm" data-act="export-mine">Export my ratings</button>
      </div>`;
  }

  function credenceHTML(prior) {
    const unset = prior == null;
    const v = unset ? 0 : prior;
    const p = M.toP(v);
    const ticks = [0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99]
      .map((t) => `<span style="--t:${(M.toDb(t) + M.D) / (2 * M.D)}">${Math.round(t * 100)}%</span>`)
      .join('');
    const presets = [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]
      .map((t) => {
        const on = !unset && Math.abs(M.toDb(t) - v) < 0.3;
        return `<button type="button" class="preset${on ? ' is-on' : ''}" data-p="${t}">${Math.round(t * 100)}%</button>`;
      })
      .join('');
    return `<div class="cred${unset ? ' is-unset' : ''}" id="cred">
      <div class="cred-read" aria-live="polite">
        <span class="cred-big num" id="cred-big">${unset ? '—' : M.pct(p)}</span>
        <span class="cred-words"><span class="cred-verbal" id="cred-verbal">${unset ? 'Not set yet' : esc(M.verbal(p))}</span>
        <span class="cred-freq" id="cred-freq">${unset ? 'Drag the slider or pick a value' : esc(M.chance(p))}</span></span>
      </div>
      <div class="cred-track">
        <input type="range" id="prior-range" min="${-M.D}" max="${M.D}" step="0.5" value="${v}" aria-label="Starting belief" aria-valuetext="${unset ? 'Not set' : M.pct(p) + ', ' + M.verbal(p)}">
        <div class="cred-ticks" aria-hidden="true">${ticks}</div>
      </div>
      <div class="presets"><span class="presets-label">Quick pick</span>${presets}</div>
    </div>`;
  }

  function readoutHTML(r) {
    if (!r || r.s == null) return 'Not weighed yet.';
    if (r.s === 0) return '<b>No effect.</b> This finding does not move the claim either way.';
    const t = r.t != null ? r.t : 1;
    const eff = r.s * t;
    let txt = `<b>${esc(M.strengthLabel(r.s))}.</b> If it holds, it ${esc(M.factorText(r.s))}.`;
    if (t < 1) txt += ` Trusted “${esc(M.trustLabel(t))}”, it counts as ${esc(M.strengthLabel(eff).toLowerCase())}.`;
    return txt;
  }

  function scaleHTML(e, r) {
    const sel = r && r.s != null ? r.s : null;
    const segs = M.STEPS.map((s, i) => {
      const dist = Math.abs(i - 6);
      const dir = s > 0 ? 'for' : s < 0 ? 'against' : 'mid';
      const on = sel === s;
      const fill = sel != null && sel !== 0 && Math.sign(s) === Math.sign(sel) && Math.abs(s) <= Math.abs(sel);
      const label = M.strengthLabel(s);
      return `<button type="button" role="radio" aria-checked="${on}" class="seg ${dir} lvl-${dist}${fill ? ' is-fill' : ''}${on ? ' is-on' : ''}" data-s="${s}" data-ev="${esc(
        e.id
      )}" aria-label="${esc(label)}" title="${esc(label)}"></button>`;
    }).join('');
    return `<div class="scale" role="radiogroup" aria-labelledby="ql-${esc(e.id)}">${segs}</div>
      <div class="scale-labels" aria-hidden="true"><span>Decisive</span><span>Strong</span><span>Weak</span><span class="sl-mid">None</span><span>Weak</span><span>Strong</span><span>Decisive</span></div>
      <div class="scale-dirs" aria-hidden="true"><span>← Opposes the claim</span><span>Supports the claim →</span></div>`;
  }

  function trustHTML(e, r) {
    const has = r && r.s != null;
    const t = has ? (r.t != null ? r.t : 1) : null;
    const chips = M.TRUST.map((x) => {
      const on = t != null && Math.abs(x.v - t) < 0.01;
      return `<button type="button" role="radio" aria-checked="${on}" class="chip${on ? ' is-on' : ''}" data-t="${x.v}" data-ev="${esc(e.id)}"${
        has ? '' : ' disabled'
      }>${esc(x.label)}<small>${esc(x.hint)}</small></button>`;
    }).join('');
    return `<div class="chips${has ? '' : ' is-disabled'}" role="radiogroup" aria-labelledby="qt-${esc(e.id)}">${chips}</div>`;
  }

  function compareMiniHTML(claim, e, r, st) {
    if (!isRevealed(claim.id) || !r || r.s == null || !st) return '';
    const v = st.ev.find((x) => x.e.id === e.id);
    if (!v || !v.n) return `<div class="ev-compare"><p>No one else on the panel has weighed this yet.</p></div>`;
    const mine = r.s * (r.t != null ? r.t : 1);
    const diff = mine - v.impMed;
    let rel = 'You weigh it about the same as the panel.';
    if (Math.abs(diff) >= 3) rel = diff > 0 ? 'You read it as more supportive than most of the panel.' : 'You read it as more damaging to the claim than most of the panel.';
    return `<div class="ev-compare"><div class="mini" data-mini="${esc(e.id)}"></div>
      <p><b>Panel median:</b> ${esc(M.strengthLabel(v.impMed))} (${v.n} assessors). ${rel}</p></div>`;
  }

  function cardHTML(claim, e, k, st) {
    const r = S.me.ratings[claim.id] && S.me.ratings[claim.id].ev[e.id];
    const rated = r && r.s != null;
    const src = e.source || {};
    const srcText = [src.label, src.year].filter(Boolean).join(', ');
    return `<article class="ev${rated ? ' is-rated' : ''}" id="ev-${esc(e.id)}" data-card="${esc(e.id)}">
      <div class="ev-top">
        <span class="ev-num" aria-hidden="true">${rated ? '✓' : k + 1}</span>
        <div class="ev-head">
          <div class="ev-tags">${e.kind ? `<span class="tag">${esc(e.kind)}</span>` : ''}${C.statusBadge(e.status)}</div>
          <h4 class="ev-title">${esc(e.title)}</h4>
          ${e.summary ? `<p class="ev-sum">${esc(e.summary)}</p>` : ''}
          ${src.url ? `<p class="ev-src"><a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(srcText || 'Source')} ↗</a></p>` : srcText ? `<p class="ev-src">${esc(srcText)}</p>` : ''}
        </div>
      </div>
      <div class="ev-q">
        <div class="q-label" id="ql-${esc(e.id)}">If this finding holds, what does it do to the claim?</div>
        ${scaleHTML(e, r)}
        <p class="readout" id="ro-${esc(e.id)}">${readoutHTML(r)}</p>
      </div>
      <div class="ev-q">
        <div class="q-label" id="qt-${esc(e.id)}">How far do you trust the finding itself?</div>
        ${trustHTML(e, r)}
      </div>
      <details class="ev-note"${r && r.note ? ' open' : ''}><summary>Note for the panel</summary>
        <textarea class="field" data-note="${esc(e.id)}" rows="2" placeholder="Why? What would change your mind?">${esc((r && r.note) || '')}</textarea></details>
      ${compareMiniHTML(claim, e, r, st)}
      <div class="ev-tools"><button class="btn-link" data-act="edit-ev" data-ev="${esc(e.id)}">Edit</button><button class="btn-link" data-act="del-ev" data-ev="${esc(
      e.id
    )}">Remove</button></div>
    </article>`;
  }

  function compareHTML(claim, st) {
    const p = progress(claim);
    const mineRes = C.posteriorOf(claim, S.me.ratings[claim.id]);
    if (!isRevealed(claim.id)) {
      return `<h3 class="step-title"><span class="step-n">3</span>Compare with the panel</h3>
        <div class="locked"><p>The panel’s views stay hidden until you have weighed everything (${p.done} of ${p.total} answers so far), so they don’t anchor yours.</p>
        <button class="btn-ghost sm" data-act="reveal">Show the panel now</button></div>`;
    }
    if (!st || st.n === 0) {
      return `<h3 class="step-title"><span class="step-n">3</span>Compare with the panel</h3>
        <div class="locked"><p>No other assessors have rated this claim yet. Import their ratings from the Data menu, or share yours with the facilitator.</p></div>`;
    }
    const idx = S.inquiry.claims.findIndex((c) => c.id === claim.id);
    const next = S.inquiry.claims[idx + 1];
    let rank = '';
    if (mineRes) {
      const below = st.rows.filter((r) => r.post < mineRes.post - 0.25).length;
      const above = st.rows.filter((r) => r.post > mineRes.post + 0.25).length;
      if (above > below) rank = `You are more sceptical than ${above} of ${st.n} assessors.`;
      else if (below > above) rank = `You are more convinced than ${below} of ${st.n} assessors.`;
      else rank = `You sit in the middle of the panel.`;
    }
    const diffs = st.ev
      .filter((v) => v.mine && v.n >= 3)
      .map((v) => ({ v, d: v.mine.impact - v.impMed }))
      .filter((x) => Math.abs(x.d) >= 2)
      .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
      .slice(0, 3);
    const diffList = diffs.length
      ? `<ul class="diffs">${diffs
          .map(
            (x) => `<li><span class="d-title">${esc(x.v.e.title)}</span><span class="d-vs">You: ${esc(M.strengthLabel(x.v.mine.impact))} · Panel: ${esc(
              M.strengthLabel(x.v.impMed)
            )}</span></li>`
          )
          .join('')}</ul>`
      : `<p class="step-hint">You weighed every piece of evidence much as the panel did.</p>`;
    return `<h3 class="step-title"><span class="step-n">3</span>Compare with the panel</h3>
      <div class="cmp-figs">
        <div class="cmp-fig"><span>You</span><b>${mineRes ? M.pctDb(mineRes.post) : '—'}</b><em>${mineRes ? esc(M.verbalDb(mineRes.post)) : 'Set a starting belief'}</em></div>
        <div class="cmp-fig"><span>Panel median</span><b>${M.pctDb(st.postMed)}</b><em>${esc(M.verbalDb(st.postMed))} · ${esc(C.agreementWord(st.postIqr).toLowerCase())}</em></div>
      </div>
      ${rank ? `<p>${esc(rank)}</p>` : ''}
      <div class="strip-host" id="cmp-strip"></div>
      <div class="legend"><span class="lg"><i class="lg-dot"></i>One assessor’s conclusion</span><span class="lg"><i class="lg-band"></i>Middle half</span><span class="lg"><i class="lg-med"></i>Median</span><span class="lg"><i class="lg-me"></i>You</span></div>
      <h4 style="font-size:15px;margin-top:6px">Where you differ most</h4>
      ${diffList}
      <p class="step-hint">Differences are where the conversation should start: add a note to explain your weighting.</p>
      <div class="next-row">${next ? `<button class="btn" data-claim="${esc(next.id)}">Next claim →</button>` : `<a class="btn" href="#report">See the funder report →</a>`}
      <button class="btn-ghost" data-act="export-mine">Export my ratings</button></div>`;
  }

  function pathboxHTML(claim) {
    const revealed = isRevealed(claim.id);
    return `<div class="pb-head"><h3>Your belief path</h3><p class="pb-sub">Read from top to bottom: where you started, how each finding moved you, where you ended up.</p></div>
      <div class="path-chart" id="path-chart"></div>
      <div class="legend"><span class="lg"><i class="lg-for"></i>Supports</span><span class="lg"><i class="lg-against"></i>Opposes</span>${
        revealed ? '<span class="lg"><i class="lg-panel"></i>Panel median path</span>' : ''
      }</div>
      ${
        revealed
          ? `<button class="btn-link" data-act="hide-panel" style="justify-self:start">Hide the panel</button>`
          : `<div class="reveal-box">The panel’s path is hidden while you rate, so it doesn’t anchor you.<button class="btn-ghost sm" data-act="reveal">Show it anyway</button></div>`
      }`;
  }

  function miniBarHTML(claim) {
    const res = C.posteriorOf(claim, S.me.ratings[claim.id]);
    const p = progress(claim);
    return `<span>${res ? `Your conclusion <b>${M.pctDb(res.post)}</b> · ${esc(M.verbalDb(res.post))}` : 'Set your starting belief'}</span>
      <span class="num" style="color:var(--ink-3)">${p.done}/${p.total}</span>
      <button class="btn-ghost sm" data-act="to-path">Path ↓</button>`;
  }

  /* ---------- render ---------- */
  views.assess = function (main) {
    const claims = S.inquiry.claims;
    if (!claims.length) {
      main.innerHTML = `<div class="empty"><h3>No claims yet</h3><p>Start by writing down a claim your team wants to test, such as “Compound X slows disease Y in humans”.</p>
        <button class="btn" data-act="add-claim">Add the first claim</button></div>`;
      bind(main);
      return;
    }
    if (!C.ui.claimId || !C.claim(C.ui.claimId)) C.ui.claimId = claims[0].id;
    const claim = C.claim(C.ui.claimId);
    const idx = claims.indexOf(claim);
    const st = C.claimStats(claim, { includeMe: false });
    const r = S.me.ratings[claim.id];
    const p = progress(claim);

    main.innerHTML = `<div class="assess">
      <aside class="rail" aria-label="Claims" id="rail">${railHTML(claim.id)}</aside>
      <section class="work" id="work">
        <header class="claim-head">
          <p class="eyebrow">Claim ${idx + 1} of ${claims.length}</p>
          <h2 class="claim-title">${esc(claim.title)}</h2>
          ${claim.statement ? `<p class="claim-statement">${esc(claim.statement)}</p>` : ''}
          <div class="claim-tools"><button class="btn-link" data-act="edit-claim">Edit claim</button><button class="btn-link" data-act="del-claim">Delete claim</button></div>
        </header>
        <section class="step" id="step-prior">
          <h3 class="step-title"><span class="step-n">1</span>Before weighing the evidence, how likely is this claim?</h3>
          <p class="step-hint">Your honest starting point from background knowledge. The scale stretches near 0% and 100% because moving there takes ten times more evidence per step.</p>
          ${credenceHTML(r ? r.prior : null)}
        </section>
        <section class="step" id="step-evidence">
          <div class="step-row"><h3 class="step-title"><span class="step-n">2</span>Weigh each piece of evidence</h3><span class="step-count" id="ev-count">${p.rated} of ${claim.evidence.length} weighed</span></div>
          <p class="step-hint">First: if the finding holds, which way does it push the claim, and how hard? Then: how far do you trust the finding itself? A strong finding you doubt counts for less.</p>
          <div class="ev-list" id="ev-list">${claim.evidence.map((e, k) => cardHTML(claim, e, k, st)).join('') || '<p class="step-hint">No evidence yet.</p>'}</div>
          <button class="btn-dashed" data-act="add-ev">+ Add a piece of evidence</button>
        </section>
        <section class="step" id="step-compare">${compareHTML(claim, C.claimStats(claim, { includeMe: true }))}</section>
      </section>
      <aside class="pathbox" aria-label="Your belief path" id="pathbox"><div class="pathbox-inner" id="pathbox-inner">${pathboxHTML(claim)}</div></aside>
    </div>
    <div class="mini-bar" id="mini-bar">${miniBarHTML(claim)}</div>`;

    drawCharts(claim, st);
    bind(main);
  };

  function drawCharts(claim, st) {
    st = st || C.claimStats(claim, { includeMe: false });
    const pathEl = document.getElementById('path-chart');
    if (pathEl) C.charts.beliefPath(pathEl, claim, S.me.ratings[claim.id], isRevealed(claim.id) && st.n ? st : null);
    document.querySelectorAll('[data-mini]').forEach((el) => {
      const v = st.ev.find((x) => x.e.id === el.dataset.mini);
      if (v) C.charts.miniCompare(el, v);
    });
    const strip = document.getElementById('cmp-strip');
    if (strip) C.charts.strip(strip, C.claimStats(claim, { includeMe: true }), { compact: true });
  }

  /* Partial refresh after a rating change, keeping focus where it was. */
  function refresh(claim, evId) {
    const revealedNow = maybeAutoReveal(claim);
    const st = C.claimStats(claim, { includeMe: false });
    const active = document.activeElement;
    const focusKey = active && (active.dataset.s != null ? 's' : active.dataset.t != null ? 't' : null);
    const focusVal = focusKey && active.dataset[focusKey];

    if (evId) {
      const card = document.querySelector(`[data-card="${CSS.escape(evId)}"]`);
      const e = claim.evidence.find((x) => x.id === evId);
      if (card && e) {
        const k = claim.evidence.indexOf(e);
        card.outerHTML = cardHTML(claim, e, k, st);
        if (focusKey) {
          const again = document.querySelector(`[data-card="${CSS.escape(evId)}"] [data-${focusKey}="${focusVal}"]`);
          if (again) again.focus();
        }
      }
    }
    if (revealedNow) {
      // re-render every card so they all show the comparison
      document.getElementById('ev-list').innerHTML = claim.evidence.map((e, k) => cardHTML(claim, e, k, st)).join('');
      C.toast('All weighed. The panel’s views are now shown for comparison.');
    }
    const p = progress(claim);
    document.getElementById('rail').innerHTML = railHTML(claim.id);
    document.getElementById('ev-count').textContent = `${p.rated} of ${claim.evidence.length} weighed`;
    document.getElementById('step-compare').innerHTML = compareHTML(claim, C.claimStats(claim, { includeMe: true }));
    document.getElementById('pathbox-inner').innerHTML = pathboxHTML(claim);
    document.getElementById('mini-bar').innerHTML = miniBarHTML(claim);
    drawCharts(claim, st);
    C.save();
    C.renderHeader();
  }

  function updatePriorReadout(v) {
    const p = M.toP(v);
    const cred = document.getElementById('cred');
    cred.classList.remove('is-unset');
    document.getElementById('cred-big').textContent = M.pct(p);
    document.getElementById('cred-verbal').textContent = M.verbal(p);
    document.getElementById('cred-freq').textContent = M.chance(p);
    const range = document.getElementById('prior-range');
    range.setAttribute('aria-valuetext', M.pct(p) + ', ' + M.verbal(p));
    cred.querySelectorAll('.preset').forEach((b) => b.classList.toggle('is-on', Math.abs(M.toDb(+b.dataset.p) - v) < 0.3));
  }

  let priorTimer = null;
  function setPrior(claim, v, live) {
    const r = C.myRating(claim.id, true);
    r.prior = Math.round(v * 2) / 2;
    updatePriorReadout(r.prior);
    const pathEl = document.getElementById('path-chart');
    const st = C.claimStats(claim, { includeMe: false });
    if (pathEl) C.charts.beliefPath(pathEl, claim, r, isRevealed(claim.id) && st.n ? st : null);
    clearTimeout(priorTimer);
    priorTimer = setTimeout(() => refreshLight(claim), live ? 250 : 0);
  }
  function refreshLight(claim) {
    maybeAutoReveal(claim);
    document.getElementById('rail').innerHTML = railHTML(claim.id);
    document.getElementById('mini-bar').innerHTML = miniBarHTML(claim);
    document.getElementById('step-compare').innerHTML = compareHTML(claim, C.claimStats(claim, { includeMe: true }));
    const strip = document.getElementById('cmp-strip');
    if (strip) C.charts.strip(strip, C.claimStats(claim, { includeMe: true }), { compact: true });
    C.save();
    C.renderHeader();
  }

  function bind(main) {
    if (main._assessBound) return;
    main._assessBound = true;

    main.addEventListener('click', (ev) => {
      if (C.ui.view !== 'assess') return;
      const t = ev.target.closest('button, [data-claim]');
      if (!t) return;
      const claim = C.claim(C.ui.claimId);

      if (t.dataset.claim && !t.closest('.m-pt')) {
        C.ui.claimId = t.dataset.claim;
        views.assess(main);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (t.dataset.s != null && t.dataset.ev) {
        const r = C.myRating(claim.id, true);
        const cur = r.ev[t.dataset.ev] || {};
        const s = +t.dataset.s;
        r.ev[t.dataset.ev] = { ...cur, s, t: cur.t != null ? cur.t : 0.67 };
        refresh(claim, t.dataset.ev);
        return;
      }
      if (t.dataset.t != null && t.dataset.ev) {
        const r = C.myRating(claim.id, true);
        const cur = r.ev[t.dataset.ev];
        if (!cur) return;
        cur.t = +t.dataset.t;
        refresh(claim, t.dataset.ev);
        return;
      }
      if (t.dataset.p) {
        const v = M.toDb(+t.dataset.p);
        document.getElementById('prior-range').value = v;
        setPrior(claim, v, false);
        return;
      }
      const act = t.dataset.act;
      if (!act) return;
      if (act === 'reveal') {
        S.settings.revealed[claim.id] = true;
        C.save();
        views.assess(main);
      } else if (act === 'hide-panel') {
        S.settings.revealed[claim.id] = false;
        C.save();
        views.assess(main);
      } else if (act === 'add-claim') C.editClaim(null);
      else if (act === 'edit-claim') C.editClaim(claim);
      else if (act === 'del-claim') C.deleteClaim(claim);
      else if (act === 'add-ev') C.editEvidence(claim, null);
      else if (act === 'edit-ev') C.editEvidence(claim, claim.evidence.find((e) => e.id === t.dataset.ev));
      else if (act === 'del-ev') C.deleteEvidence(claim, claim.evidence.find((e) => e.id === t.dataset.ev));
      else if (act === 'export-mine') C.openExport('mine');
      else if (act === 'to-path') document.getElementById('pathbox').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    main.addEventListener('input', (ev) => {
      if (C.ui.view !== 'assess') return;
      const t = ev.target;
      const claim = C.claim(C.ui.claimId);
      if (t.id === 'prior-range') setPrior(claim, +t.value, true);
      else if (t.dataset.note) {
        const r = C.myRating(claim.id, true);
        const cur = r.ev[t.dataset.note] || {};
        r.ev[t.dataset.note] = { ...cur, note: t.value };
        C.save();
      } else if (t.id === 'me-name') {
        S.me.name = t.value;
        C.save();
      } else if (t.id === 'me-disc') {
        S.me.discipline = t.value;
        C.save();
      }
    });

    // first touch on an unset slider should count as setting it
    main.addEventListener('change', (ev) => {
      if (C.ui.view !== 'assess') return;
      if (ev.target.id === 'prior-range') setPrior(C.claim(C.ui.claimId), +ev.target.value, false);
    });

    // hovering a row of the belief path highlights the matching card
    main.addEventListener('mouseover', (ev) => {
      const g = ev.target.closest && ev.target.closest('.p-row');
      document.querySelectorAll('.ev.is-focus').forEach((x) => x.classList.remove('is-focus'));
      if (g) {
        const card = document.querySelector(`[data-card="${CSS.escape(g.dataset.ev)}"]`);
        if (card) card.classList.add('is-focus');
      }
    });
    main.addEventListener('click', (ev) => {
      const g = ev.target.closest && ev.target.closest('.p-row');
      if (!g) return;
      const card = document.querySelector(`[data-card="${CSS.escape(g.dataset.ev)}"]`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
})();
