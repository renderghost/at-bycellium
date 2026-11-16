/*
 * Credence — index page: what Credence is, and the list of questions.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const S = C.state;
  const views = (C.views = C.views || {});

  // Examples only: they show the life of a question, from drafting to a published report.
  const EXAMPLES = [
    { field: 'Neurodegeneration', title: 'Does the gut microbiome drive Parkinson’s disease?', stage: 'Drafting claims', meta: '3 claims drafted' },
    { field: 'Ageing biology', title: 'Do senolytic drugs extend healthy lifespan in humans?', stage: 'Recruiting assessors', meta: '6 of 15 assessors' },
    { field: 'Psychiatry', title: 'Does psilocybin-assisted therapy work for treatment-resistant depression?', stage: 'Assessment open', meta: '11 assessors' },
    { field: 'Research integrity', title: 'How reproducible is preclinical cancer biology?', stage: 'Report published', meta: '18 assessors' },
  ];

  views.home = function (main) {
    const claims = S.inquiry.claims;
    const funder = C.isFunder();
    const nEv = claims.reduce((a, c) => a + c.evidence.length, 0);
    const people = C.people(true).length;
    const done = claims.filter((c) => C.isComplete(c.id)).length;

    let liveDetail;
    if (funder) {
      const all = claims.map((c) => C.claimStats(c));
      const counts = {};
      all.forEach((s) => (counts[s.status] = (counts[s.status] || 0) + 1));
      liveDetail = `<div class="r-status">${Object.entries(C.STATUS)
        .filter(([k]) => counts[k])
        .map(([k, v]) => `<span class="pill pill-${v.tone}">${counts[k]} ${esc(v.short)}</span>`)
        .join('')}</div>
        <span class="q-cta">See what the panel concluded →</span>`;
    } else {
      liveDetail = `<div class="q-progress"><span class="bar" aria-hidden="true"><i style="width:${claims.length ? Math.round((done / claims.length) * 100) : 0}%"></i></span>
        <span>You have assessed ${done} of ${claims.length} claims</span></div>
        <span class="q-cta">${done ? 'Continue assessing →' : 'Start assessing →'}</span>`;
    }

    main.innerHTML = `<div class="home">
      <section class="hero">
        <p class="eyebrow">Prototype for the science jam</p>
        <h1 class="hero-title">Credence</h1>
        <p class="hero-lede">Expert panels weigh the evidence behind scientific claims. Funders see where a field stands, how much experts agree, and where money would change minds.</p>
        <div class="persona-cards" role="group" aria-label="Choose how to use Credence">
          <button type="button" class="pcard${!funder ? ' is-on' : ''}" data-persona="expert" aria-pressed="${!funder}">
            <span class="pcard-kicker">Expert</span><span class="pcard-title">Assess claims</span>
            <span class="pcard-body">Say how credible each claim is and how much each finding should move it. See the panel once you have committed.</span></button>
          <button type="button" class="pcard${funder ? ' is-on' : ''}" data-persona="funder" aria-pressed="${funder}">
            <span class="pcard-kicker">Funder</span><span class="pcard-title">Understand outcomes</span>
            <span class="pcard-body">See what the panel concluded, who is on it, what the view rests on, and where a study would change minds.</span></button>
        </div>
      </section>

      <section class="qs">
        <div class="qs-head"><h2>Questions</h2><button type="button" class="btn-ghost sm" data-act="new-question">+ Start a new question</button></div>
        <ul class="q-list">
          <li><a class="q-card is-live" href="#question">
            <span class="q-top"><span class="eyebrow">${esc(S.inquiry.field || 'Inquiry')}</span><span class="pill pill-info">Assessment open</span></span>
            <span class="q-title">${esc(S.inquiry.title || 'Untitled question')}</span>
            <span class="q-meta">${claims.length} claims · ${nEv} pieces of evidence · ${people} assessors${C.sampleActive() ? ' · sample panel' : ''}</span>
            ${liveDetail}
          </a></li>
          ${EXAMPLES.map(
            (x) => `<li><div class="q-card is-example" aria-disabled="true">
              <span class="q-top"><span class="eyebrow">${esc(x.field)}</span><span class="tag">Example</span></span>
              <span class="q-title">${esc(x.title)}</span>
              <span class="q-meta">${esc(x.stage)} · ${esc(x.meta)}</span>
              <span class="fine">Not live in this prototype.</span>
            </div></li>`
          ).join('')}
        </ul>
      </section>
    </div>`;
  };
})();
