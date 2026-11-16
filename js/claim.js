/*
 * Credence — claim page.
 * Experts who have not yet assessed the claim see the evidence and a prompt to assess it.
 * Funders, and experts who have submitted, see the panel's results and every individual assessment.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const S = C.state;
  const views = (C.views = C.views || {});

  function lockedBody(claim) {
    const a = C.answered(claim);
    return `<section class="r-sec cta-card">
        <div class="r-sec-head"><h3>${a.n ? 'Finish your assessment' : 'Assess this claim'}</h3>
        <p>You’ll give a starting belief, then weigh ${claim.evidence.length} pieces of evidence one at a time. It takes about ${Math.max(
      2,
      Math.round((claim.evidence.length + 1) * 0.6)
    )} minutes, and your answers save as you go. The panel’s assessments of this claim open once you submit.</p></div>
        <div class="next-row"><button type="button" class="btn" data-assess="${esc(claim.id)}">${a.n ? `Continue (${a.n} of ${a.total} answered) →` : 'Start assessment →'}</button></div>
      </section>
      <section class="r-sec">
        <div class="r-sec-head"><h3>The evidence</h3><p>Read ahead if you like. You’ll weigh each finding in the assessment.</p></div>
        <ol class="ev-preview">${claim.evidence.map((e, k) => `<li class="ev">${C.evidenceHead(e, k)}</li>`).join('')}</ol>
        <button type="button" class="btn-dashed" data-act="add-ev">+ Add a piece of evidence</button>
      </section>
      <section class="r-sec locked-sec"><div class="locked"><span class="lock-ico" aria-hidden="true">🔒</span>
        <p><b>Panel results are hidden.</b> They open when you submit, so other people’s views can’t anchor yours.</p></div></section>`;
  }

  function compareSection(claim, s) {
    const mineRes = C.posteriorOf(claim, S.me.ratings[claim.id]);
    if (!mineRes) return '';
    const others = C.claimStats(claim, { includeMe: false });
    let rank = '';
    if (others.n) {
      const below = others.rows.filter((r) => r.post < mineRes.post - 0.25).length;
      const above = others.rows.filter((r) => r.post > mineRes.post + 0.25).length;
      if (above > below) rank = `You are more sceptical than ${above} of ${others.n} other assessors.`;
      else if (below > above) rank = `You are more convinced than ${below} of ${others.n} other assessors.`;
      else rank = 'You sit in the middle of the panel.';
    }
    const diffs = others.ev
      .filter((v) => v.mine && v.n >= 3)
      .map((v) => ({ v, d: v.mine.impact - v.impMed }))
      .filter((x) => Math.abs(x.d) >= 2)
      .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
      .slice(0, 3);
    return `<section class="r-sec" id="you-vs-panel">
      <div class="r-sec-head"><h3>You and the panel</h3><p>Where you ended up, how you got there, and where your weighting differs most from everyone else’s.</p></div>
      <div class="yvp">
        <div class="yvp-main">
          <div class="cmp-figs">
            <div class="cmp-fig"><span>You</span><b>${M.pctDb(mineRes.post)}</b><em>${esc(M.verbalDb(mineRes.post))}</em></div>
            <div class="cmp-fig"><span>Panel median</span><b>${others.n ? M.pctDb(others.postMed) : '—'}</b><em>${others.n ? esc(M.verbalDb(others.postMed)) : 'No other assessors yet'}</em></div>
          </div>
          ${rank ? `<p>${esc(rank)}</p>` : ''}
          <div id="yvp-strip"></div>
          <div class="legend"><span class="lg"><i class="lg-dot"></i>One assessor</span><span class="lg"><i class="lg-band"></i>Middle half</span><span class="lg"><i class="lg-med"></i>Median</span><span class="lg"><i class="lg-me"></i>You</span></div>
          <h4 class="sub-h">Where you differ most</h4>
          ${
            diffs.length
              ? `<ul class="diffs">${diffs
                  .map(
                    (x) =>
                      `<li><span class="d-title">${esc(x.v.e.title)}</span><span class="d-vs">You: ${esc(M.strengthLabel(x.v.mine.impact))} · Panel: ${esc(
                        M.strengthLabel(x.v.impMed)
                      )}</span></li>`
                  )
                  .join('')}</ul>`
              : '<p class="step-hint">You weighed every piece of evidence much as the panel did.</p>'
          }
          <div class="next-row"><button type="button" class="btn-ghost sm" data-assess="${esc(claim.id)}" data-step="review">Edit your assessment</button>${nextClaimButton(claim)}</div>
        </div>
        <div class="yvp-path"><h4 class="sub-h">Your belief path</h4><p class="fine">Grey shows the panel’s median path.</p><div class="path-chart" id="yvp-path"></div></div>
      </div>
    </section>`;
  }

  function nextClaimButton(claim) {
    const claims = S.inquiry.claims;
    const next = claims.find((c) => !C.isComplete(c.id));
    if (!next) return `<a class="btn sm" href="#question">All claims assessed: back to the question</a>`;
    return `<button type="button" class="btn sm" data-assess="${esc(next.id)}">Next: assess claim ${claims.indexOf(next) + 1} →</button>`;
  }

  function assessmentsSection(claim, s) {
    const rows = [...s.rows].sort((a, b) => (b.isMe ? 1 : 0) - (a.isMe ? 1 : 0) || b.post - a.post);
    const people = C.people(true);
    const items = rows
      .map((r) => {
        const p = people.find((x) => x.id === r.id) || r;
        const rt = (p.ratings && p.ratings[claim.id]) || {};
        const notes = claim.evidence.filter((e) => rt.ev && rt.ev[e.id] && rt.ev[e.id].note).length;
        const ev = claim.evidence
          .map((e) => {
            const x = rt.ev && rt.ev[e.id];
            if (!x) return `<tr><td>${esc(e.title)}</td><td colspan="2" class="mute">Not rated</td></tr>`;
            if (x.skipped || x.s == null) return `<tr><td>${esc(e.title)}</td><td colspan="2" class="mute">Skipped: outside their expertise</td></tr>`;
            const t = x.t != null ? x.t : 1;
            return `<tr><td>${esc(e.title)}${x.note ? `<p class="as-note">“${esc(x.note)}”</p>` : ''}</td><td>${esc(M.strengthLabel(x.s))}</td><td>${esc(M.trustLabel(t))}</td></tr>`;
          })
          .join('');
        return `<li><details class="as-item${r.isMe ? ' is-me' : ''}">
          <summary>${C.avatar(p)}
            <span class="as-who"><span class="as-name">${esc(C.displayName(p))}</span><span class="as-sub">${esc(p.discipline || '')}</span></span>
            <span class="as-path num">${M.pctDb(r.prior)} → <b>${M.pctDb(r.post)}</b></span>
            <span class="as-rel">${esc(C.relationText(r.post, s))}</span>
            <span class="as-notes">${notes ? notes + (notes === 1 ? ' note' : ' notes') : ''}</span>
          </summary>
          <div class="as-body">
            <div class="tbl-wrap"><table><thead><tr><th>Evidence</th><th>Weighed as (if true)</th><th>Trust</th></tr></thead><tbody>${ev}</tbody></table></div>
            <a class="btn-link" href="#assessor-${esc(p.id)}">View ${esc(p.isMe ? 'your' : p.name + '’s')} profile →</a>
          </div>
        </details></li>`;
      })
      .join('');
    return `<section class="r-sec" id="assessments">
      <div class="r-sec-head"><h3>Individual assessments</h3><p>Every submitted assessment of this claim, most convinced first. Open one to see how that assessor weighed each finding, with their notes.</p></div>
      <ul class="as-list">${items || '<li class="step-hint">No assessments yet.</li>'}</ul>
    </section>`;
  }

  function unlockedBody(claim) {
    const s = C.claimStats(claim);
    const funder = C.isFunder();
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
      actionBody = s.crux ? `Experts disagree most about ${C.quote(s.crux.e.title)}. Work that settles it would move the most minds.` : 'A decisive study would move the most minds.';
    else if (s.status === 'open') actionBody = 'The panel agrees this is unresolved. Exploratory, curiosity-led work could move it either way.';
    else if (s.status.startsWith('settled'))
      actionBody = s.repl
        ? `The panel agrees, but ${C.quote(s.repl.e.title)} would matter if it held up. Only a replication is likely to change minds here.`
        : 'More confirmatory work is unlikely to change minds. Fund work here only if it could overturn the consensus.';
    else actionBody = 'Recruit at least three assessors before drawing conclusions.';

    const sorted = [...s.ev].sort((a, b) => Math.abs(b.impMed || 0) - Math.abs(a.impMed || 0));
    const rows = sorted
      .map((v) => {
        const isCrux = s.crux && s.crux.e.id === v.e.id;
        const isRepl = s.repl && s.repl.e.id === v.e.id;
        const src = v.e.source || {};
        return `<div class="imp-row${isCrux ? ' is-crux' : ''}${isRepl ? ' is-repl' : ''}">
          <div class="imp-text"><p class="imp-title">${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(v.e.title)}</a>` : esc(v.e.title)}</p>
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
      callouts.push(`<div class="callout c-crux"><h4>Where experts disagree most</h4><p>${C.quote(s.crux.e.title)}. Most assessors weigh it somewhere between ${esc(
        M.strengthLabel(s.crux.impP10).toLowerCase()
      )} and ${esc(M.strengthLabel(s.crux.impP90).toLowerCase())}. Settling this finding would do most to bring the panel together.</p></div>`);
    if (s.repl)
      callouts.push(`<div class="callout c-repl"><h4>Important but doubted</h4><p>${C.quote(s.repl.e.title)} would count as ${esc(
        M.strengthLabel(s.repl.sMed).toLowerCase()
      )} if it held up, but the panel trusts it “${esc(M.trustLabel(s.repl.tMed).toLowerCase())}”. An independent replication would show whether it should count.</p></div>`);
    if (s.n >= 3)
      callouts.push(`<div class="callout c-conv"><h4>${narrowed ? 'Evidence brought the panel together' : widened ? 'Evidence pulled the panel apart' : 'Spread of views'}</h4>
        <p>Before weighing evidence, the middle half of the panel sat between ${M.pctDb(s.priorQ1)} and ${M.pctDb(s.priorQ3)}. Afterwards: ${M.pctDb(s.postQ1)} to ${M.pctDb(s.postQ3)}.</p></div>`);

    return `<section class="r-sec">
        <div class="rd-top">
          <div style="display:grid;gap:12px">
            <div class="rd-num">${
              s.n
                ? `<span class="rc-big num">${M.pctDb(s.postMed)}</span><span class="rd-verbal">${esc(M.verbalDb(s.postMed))} · panel median</span><span class="rd-range">Middle half of the panel: ${M.pctDb(
                    s.postQ1
                  )} to ${M.pctDb(s.postQ3)} · ${esc(C.agreementWord(s.postIqr).toLowerCase())} · ${s.n} assessors</span>`
                : '<span class="rd-verbal">No assessments yet</span>'
            }</div>
            <p class="rd-sentence">${sentence}</p>
          </div>
          ${funder ? `<div class="rd-action">${C.actionChip(s)}<p>${actionBody}</p></div>` : `<div class="rd-action"><span class="pill pill-${C.STATUS[s.status].tone}">${esc(C.STATUS[s.status].label)}</span><p>${actionBody}</p></div>`}
        </div>
      </section>
      ${!funder || C.isComplete(claim.id) ? compareSection(claim, s) : ''}
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
        <div class="imp-list"><div class="imp-head"><div></div><div id="imp-axis"></div><div></div></div>${rows || '<p class="step-hint">No evidence yet.</p>'}</div>
        <button type="button" class="btn-dashed" data-act="add-ev">+ Add a piece of evidence</button>
      </section>
      ${callouts.length ? `<section class="callouts">${callouts.join('')}</section>` : ''}
      ${assessmentsSection(claim, s)}
      <div class="r-tools"><a class="btn-ghost" href="#question">← All claims</a><button class="btn-ghost" data-act="copy-claim" data-claim-id="${esc(claim.id)}">Copy this summary</button></div>`;
  }

  views.claim = function (main, cid) {
    const claim = C.claim(cid);
    if (!claim) {
      location.hash = 'question';
      return;
    }
    const claims = S.inquiry.claims;
    const idx = claims.indexOf(claim);
    const unlocked = C.canSeePanel(claim.id);
    main.innerHTML = `<div class="page">
      ${C.crumbs([{ label: 'Questions', href: '#home' }, { label: S.inquiry.title || 'Question', href: '#question' }, { label: 'Claim ' + (idx + 1) }])}
      <section class="claim-hero">
        <p class="eyebrow">Claim ${idx + 1} of ${claims.length}${C.isComplete(claim.id) ? ' · assessed by you' : ''}</p>
        <h1 class="ov-title">${esc(claim.title)}</h1>
        ${claim.statement ? `<p class="claim-statement">${esc(claim.statement)}</p>` : ''}
        <div class="claim-tools"><span class="fine">${claim.evidence.length} pieces of evidence</span><button class="btn-link" data-act="edit-claim">Edit claim</button><button class="btn-link" data-act="del-claim">Delete claim</button></div>
      </section>
      ${C.sampleNotice()}
      ${unlocked ? unlockedBody(claim) : lockedBody(claim)}
    </div>`;

    if (!unlocked) return;
    const s = C.claimStats(claim);
    const slope = document.getElementById('rd-slope');
    if (slope) C.charts.slope(slope, s);
    const axis = document.getElementById('imp-axis');
    if (axis) C.charts.impactHeader(axis);
    document.querySelectorAll('[data-imp]').forEach((el) => {
      const v = s.ev.find((x) => x.e.id === el.dataset.imp);
      if (v) C.charts.impactRow(el, v);
    });
    const strip = document.getElementById('yvp-strip');
    if (strip) C.charts.strip(strip, s, { compact: true });
    const path = document.getElementById('yvp-path');
    if (path) {
      const others = C.claimStats(claim, { includeMe: false });
      C.charts.beliefPath(path, claim, S.me.ratings[claim.id], others.n ? others : null);
    }
  };
})();
