/*
 * Credence — question page: overview, then tabs for Claims, Panel and (for funders) Report.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const S = C.state;
  const views = (C.views = C.views || {});

  function header(tab) {
    const claims = S.inquiry.claims;
    const funder = C.isFunder();
    const nEv = claims.reduce((a, c) => a + c.evidence.length, 0);
    const people = C.people(true);
    const done = claims.filter((c) => C.isComplete(c.id)).length;

    let personaBox = '';
    if (funder) {
      const all = claims.map((c) => C.claimStats(c));
      const counts = {};
      all.forEach((s) => (counts[s.status] = (counts[s.status] || 0) + 1));
      personaBox = `<div class="ov-box">
        <p class="ov-lede">${C.ledeText(all)}</p>
        <div class="r-status">${Object.entries(C.STATUS)
          .filter(([k]) => counts[k])
          .map(([k, v]) => `<span class="pill pill-${v.tone}">${counts[k]} ${esc(v.short)}</span>`)
          .join('')}</div>
        ${tab !== 'report' ? `<a class="btn sm" href="#question-report">Read the report →</a>` : ''}
      </div>`;
    } else {
      const next = claims.find((c) => !C.isComplete(c.id));
      const ans = next ? C.answered(next) : null;
      personaBox = `<div class="ov-box">
        <div class="q-progress"><span class="bar" aria-hidden="true"><i style="width:${claims.length ? Math.round((done / claims.length) * 100) : 0}%"></i></span>
          <span><b>You have assessed ${done} of ${claims.length} claims.</b> Each claim’s panel results open once you submit your own assessment of it.</span></div>
        ${
          next
            ? `<button type="button" class="btn sm" data-assess="${esc(next.id)}">${ans.n ? 'Continue' : 'Assess'} claim ${claims.indexOf(next) + 1}: ${esc(next.title)} →</button>`
            : claims.length
            ? `<p>You have assessed every claim. Open any claim to compare with the panel.</p>`
            : ''
        }
      </div>`;
    }

    const tabs = [
      ['claims', '#question', `Claims <span class="ct">${claims.length}</span>`],
      ['panel', '#question-panel', `Panel <span class="ct">${people.length}</span>`],
    ];
    if (funder) tabs.push(['report', '#question-report', 'Report']);

    return `${C.crumbs([{ label: 'Questions', href: '#home' }, { label: S.inquiry.title || 'Question' }])}
      <section class="ov">
        <div class="ov-main">
          <p class="eyebrow">${esc(S.inquiry.field || 'Inquiry')}</p>
          <h1 class="ov-title">${esc(S.inquiry.title || 'Untitled question')}</h1>
          ${S.inquiry.description ? `<p class="inq-desc">${esc(S.inquiry.description)}</p>` : ''}
          <div class="inq-meta">
            <span><b class="num">${claims.length}</b>claims</span>
            <span><b class="num">${nEv}</b>pieces of evidence</span>
            <span><b class="num">${people.length}</b>assessors</span>
          </div>
        </div>
        ${personaBox}
      </section>
      ${C.sampleNotice()}
      <nav class="ptabs" aria-label="Question sections">${tabs
        .map(([k, h, l]) => `<a class="ptab" href="${h}"${k === tab ? ' aria-current="page"' : ''}>${l}</a>`)
        .join('')}</nav>`;
  }

  /* ---------- Claims tab ---------- */
  function claimsTab() {
    const claims = S.inquiry.claims;
    if (!claims.length) {
      return `<div class="empty"><h3>No claims yet</h3><p>Write down a claim the panel should test, such as “Compound X slows disease Y in humans”.</p>
        <button class="btn" data-act="add-claim">Add the first claim</button></div>`;
    }
    const funder = C.isFunder();
    const rows = claims
      .map((c, i) => {
        const head = `<span class="cl-num">${i + 1}</span>
          <div class="cl-main"><a class="cl-title" href="#claim-${esc(c.id)}">${esc(c.title)}</a>
          ${c.statement ? `<p class="cl-stmt">${esc(c.statement)}</p>` : ''}`;
        if (funder) {
          const s = C.claimStats(c);
          const st = C.STATUS[s.status];
          return `<li class="cl-row cl-funder">
            ${head}<p class="rc-meta"><span class="pill pill-${st.tone}">${esc(st.label)}</span><span class="pill-plain">${esc(C.agreementWord(s.postIqr))} · ${s.n} assessed · ${
            c.evidence.length
          } pieces of evidence</span></p></div>
            <div class="rc-fig">${
              s.n
                ? `<span class="rc-big num">${M.pctDb(s.postMed)}</span><span class="rc-verbal">${esc(M.verbalDb(s.postMed))}</span><span class="rc-shift">${esc(C.shiftText(s))}</span>`
                : '<span class="rc-verbal">No assessments yet</span>'
            }</div>
            <div class="rc-strip" data-strip="${esc(c.id)}"></div>
            <div class="cl-act">${C.actionChip(s)}<a class="btn-link" href="#claim-${esc(c.id)}">Inspect assessments →</a></div>
          </li>`;
        }
        const a = C.answered(c);
        const complete = C.isComplete(c.id);
        let state;
        if (complete) {
          const res = C.posteriorOf(c, S.me.ratings[c.id]);
          const s = C.claimStats(c);
          state = `<div class="cl-you"><span class="pill pill-calm">Assessed</span>
            <span class="cl-figs">You <b class="num">${res ? M.pctDb(res.post) : '—'}</b> · Panel <b class="num">${s.n ? M.pctDb(s.postMed) : '—'}</b></span></div>
            <div class="cl-btns"><a class="btn sm" href="#claim-${esc(c.id)}">Compare with the panel →</a><button type="button" class="btn-link" data-assess="${esc(c.id)}">Edit</button></div>`;
        } else if (a.n) {
          state = `<div class="cl-you"><span class="pill pill-warn">In progress</span><span class="cl-figs">${a.n} of ${a.total} answered</span></div>
            <div class="cl-btns"><button type="button" class="btn sm" data-assess="${esc(c.id)}">Continue →</button></div>`;
        } else {
          state = `<div class="cl-you"><span class="pill pill-mute">Not assessed</span><span class="cl-figs">${c.evidence.length} pieces of evidence · about ${Math.max(
            2,
            Math.round((c.evidence.length + 1) * 0.6)
          )} min</span></div>
            <div class="cl-btns"><button type="button" class="btn sm" data-assess="${esc(c.id)}">Assess this claim →</button></div>`;
        }
        return `<li class="cl-row cl-expert${complete ? ' is-done' : ''}">${head}</div><div class="cl-state">${state}</div></li>`;
      })
      .join('');
    const legend = funder
      ? `<div class="legend"><span class="lg"><i class="lg-dot"></i>One assessor’s conclusion</span><span class="lg"><i class="lg-band"></i>Middle half of the panel</span><span class="lg"><i class="lg-med"></i>Median</span><span class="lg"><i class="lg-for"></i>Shift from before evidence</span></div>`
      : '';
    return `<section class="r-sec">
      <div class="r-sec-head"><h3>${funder ? 'Where the panel stands on each claim' : 'Claims to assess'}</h3>
        <p>${
          funder
            ? 'Each dot is one assessor’s conclusion after weighing all the evidence. A tight cluster means agreement; a wide spread means experts disagree. Open a claim to inspect the individual assessments.'
            : 'Assess each claim on its own: a starting belief, then each piece of evidence, one at a time. The panel’s views of a claim stay hidden until you submit, so they can’t anchor yours.'
        }</p></div>
      ${legend}
      <ol class="cl-list">${rows}</ol>
      <button type="button" class="btn-dashed" data-act="add-claim">+ Add a claim</button>
    </section>`;
  }

  /* ---------- Panel tab ---------- */
  function panelTab() {
    const people = C.people(true);
    const claims = S.inquiry.claims;
    const canSee = C.canSeeProfiles();
    const funder = C.isFunder();
    const counts = (p) => claims.filter((c) => p.ratings && p.ratings[c.id] && p.ratings[c.id].prior != null).length;
    const disciplines = new Set(people.map((p) => p.discipline).filter(Boolean)).size;
    const withInterests = people.filter((p) => p.interests).length;

    const meRow =
      !funder && !C.anyComplete()
        ? `<li class="pn-row pn-me">${C.avatar({ name: S.me.name || 'You', isMe: true })}
          <div class="pn-main"><span class="pn-name">${esc(S.me.name || 'You')}</span><span class="pn-sub">${esc(
            [S.me.discipline, S.me.affiliation].filter(Boolean).join(' · ') || 'Add your field and links so funders can see your expertise.'
          )}</span></div>
          <span class="pn-count">Not on the panel until you submit an assessment</span>
          <button type="button" class="btn-ghost sm" data-act="edit-profile">Edit your profile</button></li>`
        : '';

    const rows = people
      .map((p) => {
        const n = counts(p);
        const name = canSee ? `<a class="pn-name" href="#assessor-${esc(p.id)}">${esc(C.displayName(p))}</a>` : `<span class="pn-name">${esc(C.displayName(p))}</span>`;
        return `<li class="pn-row${p.isMe ? ' pn-me' : ''}">${C.avatar(p)}
          <div class="pn-main">${name}<span class="pn-sub">${esc([p.discipline, p.role && p.affiliation ? p.role + ', ' + p.affiliation : p.affiliation].filter(Boolean).join(' · '))}</span></div>
          <span class="pn-count">${n} of ${claims.length} claims assessed</span>
          <span class="pn-flag">${p.interests ? '<span class="pill pill-warn">Declared interest</span>' : '<span class="pill-plain">No interests declared</span>'}</span>
          ${p.isMe ? '<button type="button" class="btn-link" data-act="edit-profile">Edit profile</button>' : ''}
        </li>`;
      })
      .join('');

    return `<section class="r-sec">
      <div class="r-sec-head"><h3>The panel</h3>
        <p>${people.length} assessors from ${disciplines} disciplines. ${withInterests} declared a potential conflict of interest. ${
      canSee ? 'Open a profile to see their expertise, links and how they assessed each claim.' : ''
    }</p></div>
      ${
        canSee
          ? ''
          : `<div class="notice notice-info"><span class="notice-ico" aria-hidden="true">i</span><span>Profiles open after you submit your first assessment, so you judge the evidence before you see who said what.</span></div>`
      }
      <ul class="pn-list">${meRow}${rows}</ul>
    </section>`;
  }

  /* ---------- Report tab (funders) ---------- */
  function reportTab() {
    if (!C.isFunder()) {
      return `<div class="empty"><h3>Reports are for funders</h3><p>Switch to the Funder view to read the panel’s report on this question.</p>
        <button type="button" class="btn" data-persona="funder">Switch to Funder</button></div>`;
    }
    const claims = S.inquiry.claims;
    const all = claims.map((c) => C.claimStats(c));
    const nPeople = new Set(all.flatMap((s) => s.rows.map((r) => r.id))).size;
    const nEv = claims.reduce((a, c) => a + c.evidence.length, 0);
    const opps = C.opportunities(all);
    const settled = all.filter((s) => s.status.startsWith('settled') && !s.repl);

    const table = `<div class="tbl-wrap"><table>
      <thead><tr><th>Claim</th><th class="num">Assessors</th><th class="num">Before evidence</th><th class="num">After evidence</th><th class="num">Middle half</th><th>Status</th><th>Suggested action</th></tr></thead>
      <tbody>${all
        .map(
          (s) =>
            `<tr><td><a href="#claim-${esc(s.claim.id)}">${esc(s.claim.title)}</a></td><td class="num">${s.n}</td><td class="num">${s.n ? M.pctDb(s.priorMed) : '—'}</td><td class="num">${
              s.n ? M.pctDb(s.postMed) : '—'
            }</td><td class="num">${s.n ? M.pctDb(s.postQ1) + '–' + M.pctDb(s.postQ3) : '—'}</td><td>${esc(C.STATUS[s.status].label)}</td><td>${esc(
              s.status.startsWith('settled') && s.repl ? 'Fund a replication' : C.STATUS[s.status].action
            )}</td></tr>`
        )
        .join('')}</tbody></table></div>`;

    return `<section class="r-intro">
        <p class="eyebrow">Report for funders</p>
        <h2 class="r-title">What ${nPeople} assessor${nPeople === 1 ? '' : 's'} concluded from ${nEv} pieces of evidence</h2>
        <p class="r-lede">${C.ledeText(all)}</p>
        <div class="r-tools"><button class="btn-ghost sm" data-act="copy-summary">Copy summary as text</button></div>
      </section>
      <section class="r-sec">
        <div class="r-sec-head"><h3>Where funding would change minds</h3>
          <p>Money changes the most minds where experts disagree, where an important finding is doubted, or where everyone agrees the question is open. Claims with a consensus gain little from more of the same.</p></div>
        <div class="r-fund-grid">
          <div><div class="r-map" id="r-map"></div>
            <ol class="map-key">${all.map((s, i) => `<li><a href="#claim-${esc(s.claim.id)}"><span class="mk-num">${i + 1}</span>${esc(s.claim.title)}</a></li>`).join('')}</ol></div>
          <div>
            ${opps.length ? `<ol class="opps" aria-label="Funding opportunities, most promising first">${opps.slice(0, 5).map(oppHTML).join('')}</ol>` : '<p class="step-hint">No clear opportunities yet: every claim either has a consensus or too few assessors.</p>'}
            ${
              settled.length
                ? `<p class="low-pri" style="margin-top:10px"><b>Lower priority:</b> ${C.listText(settled.map((s) => C.quote(s.claim.title)))} ${
                    settled.length > 1 ? 'have' : 'has'
                  } a clear consensus. Fund further work there only if it could overturn it.</p>`
                : ''
            }
          </div>
        </div>
      </section>
      <section class="r-sec">
        <div class="r-sec-head"><h3>The numbers</h3><p>Medians and the middle half of the panel, before and after weighing the evidence.</p></div>
        ${table}
      </section>`;
  }

  function oppHTML(o) {
    const s = o.stats;
    const t = s.claim.title;
    const lc = t.charAt(0).toLowerCase() + t.slice(1);
    let kind;
    let title;
    let body;
    if (o.type === 'settle') {
      kind = 'Settle a disagreement';
      title = `Resolve whether ${lc}`;
      body = `The middle half of the panel ranges from ${M.pctDb(s.postQ1)} to ${M.pctDb(s.postQ3)}. ${
        o.ev ? `They disagree most about ${C.quote(o.ev.e.title)}. A study that settles it would move the most minds.` : 'A decisive study would move the most minds.'
      }`;
    } else if (o.type === 'replicate') {
      kind = 'Replicate';
      title = o.ev.e.title;
      body = `If this held up, the panel would count it as ${esc(M.strengthLabel(o.ev.sMed).toLowerCase())}. They trust it “${esc(
        M.trustLabel(o.ev.tMed).toLowerCase()
      )}”, so today it barely counts. An independent replication would show whether it should.`;
    } else {
      kind = 'Explore';
      title = `Explore whether ${lc}`;
      body = `The panel agrees this is unresolved (median ${M.pctDb(s.postMed)}), and no finding yet counts strongly either way. Good ground for curiosity-led work.`;
    }
    const num = S.inquiry.claims.indexOf(s.claim) + 1;
    return `<li class="opp opp-${o.type}"><span class="opp-kind"><span class="opp-claim">Claim ${num}</span>${esc(kind)}</span><h4 class="opp-title">${esc(title)}</h4><p class="opp-body">${body}</p>
      <a class="opp-link" href="#claim-${esc(s.claim.id)}">See the evidence →</a></li>`;
  }

  views.question = function (main, tab) {
    tab = tab || 'claims';
    let body;
    if (tab === 'panel') body = panelTab();
    else if (tab === 'report') body = reportTab();
    else body = claimsTab();
    main.innerHTML = `<div class="page">${header(tab)}<div class="tab-body">${body}</div></div>`;

    document.querySelectorAll('[data-strip]').forEach((el) => {
      const c = C.claim(el.dataset.strip);
      if (c) C.charts.strip(el, C.claimStats(c));
    });
    const map = document.getElementById('r-map');
    if (map) C.charts.map(map, S.inquiry.claims.map((c) => C.claimStats(c)), (cid) => (location.hash = 'claim-' + cid));
  };

  /* ---------- plain-text summaries for memos ---------- */
  C.summaryText = function (cid) {
    const claims = cid ? [C.claim(cid)] : S.inquiry.claims;
    const lines = [S.inquiry.title];
    if (C.sampleActive()) lines.push('(Illustrative panel: assessors and ratings are simulated for this prototype.)');
    lines.push('');
    for (const c of claims) {
      const s = C.claimStats(c);
      lines.push('• ' + c.title);
      if (s.n >= 1) {
        lines.push(
          `  Panel median ${M.pctDb(s.postMed)} (${M.verbalDb(s.postMed).toLowerCase()}), middle half ${M.pctDb(s.postQ1)}–${M.pctDb(s.postQ3)}, ${s.n} assessors. ${C.STATUS[s.status].label}.`
        );
        if (Math.abs(s.shift) >= 0.8) lines.push(`  Evidence moved the panel from ${M.pctDb(s.priorMed)} to ${M.pctDb(s.postMed)}.`);
        if (s.crux) lines.push(`  Most disputed evidence: ${s.crux.e.title}.`);
        if (s.repl) lines.push(`  Worth replicating: ${s.repl.e.title}.`);
        lines.push(`  Suggested action: ${s.status.startsWith('settled') && s.repl ? 'Fund a replication' : C.STATUS[s.status].action}.`);
      } else lines.push('  No assessments yet.');
      lines.push('');
    }
    return lines.join('\n');
  };
})();
