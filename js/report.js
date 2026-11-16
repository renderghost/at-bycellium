/*
 * Credence — Report view (for funders and other non-experts).
 * Overview: where the panel stands, and where funding would change minds.
 * Claim detail: how the evidence moved the panel, and what moved it.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const S = C.state;
  const views = (C.views = C.views || {});

  const q = (t) => `<q>${esc(t)}</q>`;

  function listText(arr) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  }

  function lede(all) {
    const by = (s) => all.filter((x) => x.status === s);
    const parts = [];
    const contested = by('contested');
    const open = by('open');
    const yes = by('settled-true');
    const no = by('settled-false');
    if (contested.length) parts.push(`Experts are split on ${listText(contested.map((s) => q(s.claim.title)))}.`);
    if (yes.length)
      parts.push(
        `They consider ${listText(yes.map((s) => q(s.claim.title) + ' ' + esc(M.verbalDb(s.postMed).toLowerCase()) + ' (' + M.pctDb(s.postMed) + ')'))}.`
      );
    if (open.length) parts.push(`They agree that ${listText(open.map((s) => q(s.claim.title)))} ${open.length > 1 ? 'remain' : 'remains'} an open question.`);
    if (no.length) parts.push(`They think ${listText(no.map((s) => q(s.claim.title)))} ${no.length > 1 ? 'are' : 'is'} unlikely.`);
    if (!parts.length) return 'Not enough assessors have rated these claims yet to draw conclusions.';
    return parts.join(' ');
  }

  function actionFor(s) {
    const st = C.STATUS[s.status];
    let type = s.status;
    let label = st.action;
    if (s.status.startsWith('settled') && s.repl) {
      type = 'replicate';
      label = 'Fund a replication';
    }
    return `<span class="act act-${type}">${esc(label)}</span>`;
  }

  function shiftText(s) {
    if (s.n < 3) return '';
    if (Math.abs(s.shift) < 0.8) return 'Evidence barely moved the panel';
    return `${s.shift > 0 ? 'Up' : 'Down'} from ${M.pctDb(s.priorMed)} before evidence`;
  }

  function oppHTML(o) {
    const s = o.stats;
    const t = s.claim.title;
    let kind;
    let title;
    let body;
    if (o.type === 'settle') {
      kind = 'Settle a disagreement';
      title = `Resolve whether ${t.charAt(0).toLowerCase() + t.slice(1)}`;
      body = `The middle half of the panel ranges from ${M.pctDb(s.postQ1)} to ${M.pctDb(s.postQ3)}. ${
        o.ev ? `They disagree most about ${q(o.ev.e.title)}. A study that settles it would move the most minds.` : 'A decisive study would move the most minds.'
      }`;
    } else if (o.type === 'replicate') {
      kind = 'Replicate';
      title = o.ev.e.title;
      body = `If this held up, the panel would count it as ${esc(M.strengthLabel(o.ev.sMed).toLowerCase())}. They trust it “${esc(
        M.trustLabel(o.ev.tMed).toLowerCase()
      )}”, so today it barely counts. An independent replication would show whether it should.`;
    } else {
      kind = 'Explore';
      title = `Explore whether ${t.charAt(0).toLowerCase() + t.slice(1)}`;
      body = `The panel agrees this is unresolved (median ${M.pctDb(s.postMed)}), and no finding yet counts strongly either way. Good ground for curiosity-led work.`;
    }
    const num = S.inquiry.claims.indexOf(s.claim) + 1;
    return `<li class="opp opp-${o.type}"><span class="opp-kind"><span class="opp-claim">Claim ${num}</span>${esc(kind)}</span><h4 class="opp-title">${esc(title)}</h4><p class="opp-body">${body}</p>
      <a class="opp-link" href="#report-${esc(s.claim.id)}">See the evidence →</a></li>`;
  }

  /* ---------- overview ---------- */
  function overview(main) {
    const claims = S.inquiry.claims;
    if (!claims.length) {
      main.innerHTML = `<div class="empty"><h3>Nothing to report yet</h3><p>Add claims and evidence in Assess, then gather ratings from your panel.</p><a class="btn" href="#assess">Go to Assess</a></div>`;
      return;
    }
    const all = claims.map((c) => C.claimStats(c));
    const nPeople = new Set(all.flatMap((s) => s.rows.map((r) => r.id))).size;
    const nEv = claims.reduce((a, c) => a + c.evidence.length, 0);
    const opps = C.opportunities(all);
    const counts = {};
    all.forEach((s) => (counts[s.status] = (counts[s.status] || 0) + 1));
    const settled = all.filter((s) => s.status.startsWith('settled') && !s.repl);

    const statusChips = Object.entries(C.STATUS)
      .filter(([k]) => counts[k])
      .map(([k, v]) => `<span class="pill pill-${v.tone}">${counts[k]} ${esc(v.short)}</span>`)
      .join('');

    const rows = all
      .map((s, i) => {
        const st = C.STATUS[s.status];
        return `<li class="rc"><a class="rc-link" href="#report-${esc(s.claim.id)}">
          <div class="rc-text"><span class="rc-num">${i + 1}</span><div><h4 class="rc-title">${esc(s.claim.title)}</h4>
            <p class="rc-meta"><span class="pill pill-${st.tone}">${esc(st.label)}</span><span class="pill-plain">${esc(C.agreementWord(s.postIqr))} · ${s.n} assessors</span></p></div></div>
          <div class="rc-fig">${s.n ? `<span class="rc-big num">${M.pctDb(s.postMed)}</span><span class="rc-verbal">${esc(M.verbalDb(s.postMed))}</span><span class="rc-shift">${esc(shiftText(s))}</span>` : '<span class="rc-verbal">No ratings yet</span>'}</div>
          <div class="rc-strip" data-strip="${esc(s.claim.id)}"></div>
          <div class="rc-act">${actionFor(s)}</div>
        </a></li>`;
      })
      .join('');

    const table = `<details class="r-table"><summary>Show the numbers as a table</summary><div class="tbl-wrap"><table>
      <thead><tr><th>Claim</th><th class="num">Assessors</th><th class="num">Before evidence</th><th class="num">After evidence</th><th class="num">Middle half</th><th>Status</th></tr></thead>
      <tbody>${all
        .map(
          (s) =>
            `<tr><td>${esc(s.claim.title)}</td><td class="num">${s.n}</td><td class="num">${s.n ? M.pctDb(s.priorMed) : '—'}</td><td class="num">${
              s.n ? M.pctDb(s.postMed) : '—'
            }</td><td class="num">${s.n ? M.pctDb(s.postQ1) + '–' + M.pctDb(s.postQ3) : '—'}</td><td>${esc(C.STATUS[s.status].label)}</td></tr>`
        )
        .join('')}</tbody></table></div></details>`;

    main.innerHTML = `<div class="report">
      <section class="r-intro">
        <p class="eyebrow">Report for funders</p>
        <h2 class="r-title">What ${nPeople} assessor${nPeople === 1 ? '' : 's'} concluded from ${nEv} pieces of evidence</h2>
        <p class="r-lede">${lede(all)}</p>
        <div class="r-status">${statusChips}</div>
        <div class="r-tools"><button class="btn-ghost sm" data-act="copy-summary">Copy summary as text</button></div>
      </section>

      <section class="r-sec">
        <div class="r-sec-head"><h3>Where the panel stands</h3>
          <p>Each dot is one assessor’s conclusion after weighing all the evidence. A tight cluster means agreement; a wide spread means experts disagree. Select a claim to see what drove it.</p></div>
        <div class="legend"><span class="lg"><i class="lg-dot"></i>One assessor</span><span class="lg"><i class="lg-band"></i>Middle half of the panel</span><span class="lg"><i class="lg-med"></i>Median</span><span class="lg"><i class="lg-for"></i>Shift from before evidence</span>${
          Object.keys(S.me.ratings).length ? '<span class="lg"><i class="lg-me"></i>You</span>' : ''
        }</div>
        <ol class="r-claims">${rows}</ol>
        ${table}
      </section>

      <section class="r-sec">
        <div class="r-sec-head"><h3>Where funding would change minds</h3>
          <p>Money changes the most minds where experts disagree, where an important finding is doubted, or where everyone agrees the question is open. Settled claims gain little from more of the same.</p></div>
        <div class="r-fund-grid">
          <div><div class="r-map" id="r-map"></div>
            <ol class="map-key">${all.map((s, i) => `<li><a href="#report-${esc(s.claim.id)}"><span class="mk-num">${i + 1}</span>${esc(s.claim.title)}</a></li>`).join('')}</ol></div>
          <div>
            ${opps.length ? `<ol class="opps" aria-label="Funding opportunities, most promising first">${opps.slice(0, 5).map(oppHTML).join('')}</ol>` : '<p class="step-hint">No clear opportunities yet: every claim is either settled or has too few assessors.</p>'}
            ${
              settled.length
                ? `<p class="low-pri" style="margin-top:10px"><b>Lower priority:</b> ${listText(settled.map((s) => q(s.claim.title)))} ${
                    settled.length > 1 ? 'look' : 'looks'
                  } settled. Fund further work there only if it could overturn the consensus.</p>`
                : ''
            }
          </div>
        </div>
      </section>
    </div>`;

    drawOverview(all);
  }

  function drawOverview(all) {
    document.querySelectorAll('[data-strip]').forEach((el) => {
      const s = all.find((x) => x.claim.id === el.dataset.strip);
      if (s) C.charts.strip(el, s);
    });
    const map = document.getElementById('r-map');
    if (map) C.charts.map(map, all, (cid) => (location.hash = 'report-' + cid));
  }

  /* ---------- claim detail ---------- */
  function detail(main, cid) {
    const claim = C.claim(cid);
    if (!claim) {
      location.hash = 'report';
      return;
    }
    const idx = S.inquiry.claims.indexOf(claim);
    const s = C.claimStats(claim);
    const st = C.STATUS[s.status];
    const narrowed = s.postIqr < s.priorIqr - 1;
    const widened = s.postIqr > s.priorIqr + 1;

    let sentence = 'Too few assessors have rated this claim to summarise it.';
    if (s.n >= 3) {
      sentence = `The panel thinks this is ${esc(M.verbalDb(s.postMed).toLowerCase())} (median ${M.pctDb(s.postMed)}). `;
      if (Math.abs(s.shift) >= 0.8)
        sentence += `Weighing the evidence moved them ${s.shift > 0 ? 'up' : 'down'} from ${M.pctDb(s.priorMed)}${
          narrowed ? ' and brought their views closer together.' : widened ? ', but their views spread further apart.' : '.'
        }`;
      else sentence += 'The evidence barely moved them overall.';
      if (s.status === 'contested') sentence += ' Assessors remain split.';
    }

    let actionBody = '';
    if (s.status === 'contested')
      actionBody = s.crux
        ? `Experts disagree most about ${q(s.crux.e.title)}. Work that settles it would move the most minds.`
        : 'A decisive study would move the most minds.';
    else if (s.status === 'open') actionBody = 'The panel agrees this is unresolved. Exploratory, curiosity-led work could move it either way.';
    else if (s.status.startsWith('settled'))
      actionBody = s.repl
        ? `The view looks settled, but ${q(s.repl.e.title)} would matter if it held up. Only a replication is likely to change minds here.`
        : 'More confirmatory work is unlikely to change minds. Fund work here only if it could overturn the consensus.';
    else actionBody = 'Recruit at least three assessors before drawing conclusions.';

    const sorted = [...s.ev].sort((a, b) => Math.abs(b.impMed || 0) - Math.abs(a.impMed || 0));
    const rows = sorted
      .map((v) => {
        const isCrux = s.crux && s.crux.e.id === v.e.id;
        const isRepl = s.repl && s.repl.e.id === v.e.id;
        return `<div class="imp-row${isCrux ? ' is-crux' : ''}${isRepl ? ' is-repl' : ''}">
          <div class="imp-text"><p class="imp-title">${esc(v.e.title)}</p>
            <p class="imp-meta">${v.e.kind ? `<span class="tag">${esc(v.e.kind)}</span>` : ''}${C.statusBadge(v.e.status)}<span>${v.n} rated</span>${
          v.n ? `<span>· trusted “${esc(M.trustLabel(v.tMed).toLowerCase())}”</span>` : ''
        }</p></div>
          <div class="imp-chart" data-imp="${esc(v.e.id)}"></div>
          <div class="imp-word">${v.n ? esc(M.strengthLabel(v.impMed)) : 'Not rated'}${
          v.n && Math.abs(v.sMed - v.impMed) >= 3 ? `<small>${esc(M.strengthLabel(v.sMed))} if fully trusted</small>` : ''
        }${isCrux ? '<span class="flag flag-crux">Most disputed</span>' : ''}${isRepl ? '<span class="flag flag-repl">Replicate</span>' : ''}</div>
        </div>`;
      })
      .join('');

    const callouts = [];
    if (s.crux)
      callouts.push(`<div class="callout c-crux"><h4>Where experts disagree most</h4><p>${q(s.crux.e.title)}. Most assessors weigh it somewhere between ${esc(
        M.strengthLabel(s.crux.impP10).toLowerCase()
      )} and ${esc(M.strengthLabel(s.crux.impP90).toLowerCase())}. Settling this finding would do most to bring the panel together.</p></div>`);
    if (s.repl)
      callouts.push(`<div class="callout c-repl"><h4>Important but doubted</h4><p>${q(s.repl.e.title)} would count as ${esc(
        M.strengthLabel(s.repl.sMed).toLowerCase()
      )} if it held up, but the panel trusts it “${esc(M.trustLabel(s.repl.tMed).toLowerCase())}”. An independent replication would show whether it should count.</p></div>`);
    if (s.n >= 3)
      callouts.push(`<div class="callout c-conv"><h4>${narrowed ? 'Evidence brought the panel together' : widened ? 'Evidence pulled the panel apart' : 'Spread of views'}</h4>
        <p>Before weighing evidence, the middle half of the panel sat between ${M.pctDb(s.priorQ1)} and ${M.pctDb(s.priorQ3)}. Afterwards: ${M.pctDb(s.postQ1)} to ${M.pctDb(
        s.postQ3
      )}.</p></div>`);

    main.innerHTML = `<div class="report">
      <a class="back" href="#report">← All claims</a>
      <section class="r-intro">
        <p class="eyebrow">Claim ${idx + 1} · ${esc(st.label)}</p>
        <h2 class="r-title">${esc(claim.title)}</h2>
        ${claim.statement ? `<p class="claim-statement">${esc(claim.statement)}</p>` : ''}
        <div class="rd-top" style="margin-top:8px">
          <div style="display:grid;gap:12px">
            <div class="rd-num">${s.n ? `<span class="rc-big num">${M.pctDb(s.postMed)}</span><span class="rd-verbal">${esc(M.verbalDb(s.postMed))}</span><span class="rd-range">Middle half of the panel: ${M.pctDb(s.postQ1)} to ${M.pctDb(
      s.postQ3
    )} · ${esc(C.agreementWord(s.postIqr).toLowerCase())} · ${s.n} assessors</span>` : '<span class="rd-verbal">No ratings yet</span>'}</div>
            <p class="rd-sentence">${sentence}</p>
          </div>
          <div class="rd-action">${actionFor(s)}<p>${actionBody}</p></div>
        </div>
      </section>

      <section class="r-sec">
        <div class="r-sec-head"><h3>How the evidence moved the panel</h3>
          <p>Each line is one assessor, from their starting belief (top) to their conclusion after weighing the evidence (bottom). The thick line is the median. Shaded bars show the middle half of the panel.</p></div>
        <div id="rd-slope"></div>
        <div class="legend"><span class="lg"><i class="lg-panel"></i>One assessor</span><span class="lg"><i class="lg-med" style="width:16px;height:3px"></i>Median</span>${
          s.rows.some((r) => r.isMe) ? '<span class="lg"><i class="lg-me"></i>You</span>' : ''
        }</div>
      </section>

      <section class="r-sec">
        <div class="r-sec-head"><h3>What moved the panel</h3>
          <p>Solid bars show how much each finding counts once the panel’s trust in it is applied. Outlines show how much it would count if fully trusted: a big gap marks a finding that matters but is doubted. Whiskers show the middle half of assessors.</p></div>
        <div class="legend"><span class="lg"><i class="lg-fill"></i>Counts as weighed</span><span class="lg"><i class="lg-pot"></i>If fully trusted</span>${
          s.ev.some((v) => v.mine) ? '<span class="lg"><i class="lg-me" style="border-radius:0;clip-path:polygon(0 0,100% 0,50% 100%)"></i>You</span>' : ''
        }</div>
        <div class="imp-list">
          <div class="imp-head"><div></div><div id="imp-axis"></div><div></div></div>
          ${rows || '<p class="step-hint">No evidence yet.</p>'}
        </div>
      </section>

      ${callouts.length ? `<section class="callouts">${callouts.join('')}</section>` : ''}

      <div class="r-tools"><a class="btn-ghost" href="#report">← All claims</a><button class="btn-ghost" data-act="copy-claim" data-claim-id="${esc(
        claim.id
      )}">Copy this summary</button><button class="btn" data-act="assess-claim" data-claim-id="${esc(claim.id)}">Rate this claim yourself</button></div>
    </div>`;

    const slope = document.getElementById('rd-slope');
    if (slope) C.charts.slope(slope, s);
    const axis = document.getElementById('imp-axis');
    if (axis) C.charts.impactHeader(axis);
    document.querySelectorAll('[data-imp]').forEach((el) => {
      const v = s.ev.find((x) => x.e.id === el.dataset.imp);
      if (v) C.charts.impactRow(el, v);
    });
  }

  views.report = function (main, cid) {
    if (cid) detail(main, cid);
    else overview(main);
    bind(main);
  };

  /* ---------- plain-text summaries for memos ---------- */
  C.summaryText = function (cid) {
    const claims = cid ? [C.claim(cid)] : S.inquiry.claims;
    const lines = [];
    lines.push(S.inquiry.title);
    if (C.sampleActive()) lines.push('(Illustrative panel: ratings are simulated for this prototype.)');
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
        lines.push(`  Suggested action: ${C.STATUS[s.status].action}.`);
      } else lines.push('  No ratings yet.');
      lines.push('');
    }
    return lines.join('\n');
  };

  function bind(main) {
    if (main._reportBound) return;
    main._reportBound = true;
    main.addEventListener('click', (ev) => {
      if (C.ui.view !== 'report') return;
      const t = ev.target.closest('button');
      if (!t) return;
      if (t.dataset.act === 'copy-summary') C.copyText(C.summaryText(), 'Summary copied. Paste it into your memo.');
      else if (t.dataset.act === 'copy-claim') C.copyText(C.summaryText(t.dataset.claimId), 'Claim summary copied.');
      else if (t.dataset.act === 'assess-claim') {
        C.ui.claimId = t.dataset.claimId;
        location.hash = 'assess';
      }
    });
  }
})();
