/*
 * Credence — Method page: how to read the numbers, how to run it at a jam, and open questions.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const views = (C.views = C.views || {});

  views.method = function (main) {
    const ladder = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
      .map((p) => {
        const db = M.toDb(p);
        return `<tr><td class="num">${M.pct(p)}</td><td>${esc(M.verbal(p))}</td><td>${esc(M.chance(p))}</td><td class="num">${db > 0 ? '+' : ''}${db.toFixed(1)} dB</td></tr>`;
      })
      .join('');
    const steps = M.STEPS.filter((s) => s > 0)
      .map((s) => `<tr><td>${esc(M.strengthWord(s))}</td><td class="num">×${M.factor(s) >= 10 ? Math.round(M.factor(s)) : M.factor(s).toFixed(1)}</td><td class="num">${s} dB</td></tr>`)
      .join('');

    main.innerHTML = `<div class="page method">
      ${C.crumbs([{ label: 'Questions', href: '#home' }, { label: 'Method' }])}
      <section class="r-intro">
        <p class="eyebrow">Method</p>
        <h1 class="r-title">How Credence turns expert judgement into a decision</h1>
        <p class="r-lede">Science doesn’t prove claims; evidence shifts how credible they are. Credence asks experts two simple questions about each claim and each finding, combines their answers with Bayes’ rule, and shows funders where the field stands and where money would change minds.</p>
      </section>

      <section class="r-sec two-col">
        <div class="prose">
          <h3>Two views</h3>
          <p><b>Expert.</b> For each claim, an expert gives a starting belief, then weighs each piece of evidence, one at a time: which way it pushes, how hard, and how far they trust it. Only after submitting do they see how the rest of the panel assessed that claim, and who the other assessors are.</p>
          <p><b>Funder.</b> A funder sees every claim’s panel result, every individual assessment and every assessor’s profile, and a report showing where a study would change the most minds.</p>
        </div>
        <div class="prose">
          <h3>How the numbers combine</h3>
          <p>Evidence multiplies the odds of a claim. Credence keeps score in <b>decibans</b>, Alan Turing’s codebreaking unit: ten times the logarithm of the odds. In decibans, evidence simply adds up.</p>
          <div class="formula">conclusion = starting belief<br>&nbsp;&nbsp;+ Σ (strength if true × trust)</div>
          <p>Trust simplifies the way the existing evidence diagrams weight a premise by its credibility: a finding you trust “mostly” counts for two thirds of its strength.</p>
        </div>
      </section>

      <section class="r-sec two-col">
        <div class="prose">
          <h3>Reading credence</h3>
          <p>Every number comes with words from the IPCC’s calibrated scale and a natural frequency, so nobody has to interpret percentages alone.</p>
          <div class="tbl-wrap"><table><thead><tr><th class="num">Credence</th><th>In words</th><th>As a frequency</th><th class="num">Decibans</th></tr></thead><tbody>${ladder}</tbody></table></div>
        </div>
        <div class="prose">
          <h3>Strength of evidence</h3>
          <p>Experts pick a band, not a number. Each band multiplies the odds by roughly the amount shown; opposition divides them.</p>
          <div class="tbl-wrap"><table><thead><tr><th>Band</th><th class="num">Odds ×</th><th class="num">Decibans</th></tr></thead><tbody>${steps}</tbody></table></div>
        </div>
      </section>

      <section class="r-sec prose" style="max-width:none">
        <h3>How the panel is summarised</h3>
        <ul>
          <li><b>Median</b>: half the panel is above, half below. Robust to one extreme assessor.</li>
          <li><b>Middle half</b>: the range holding the central 50% of assessors. Its width measures disagreement.</li>
          <li><b>Split</b>: the middle half is wider than 20%–80% (12 dB). <b>Mixed</b>: 5–12 dB. <b>Broad agreement</b>: under 5 dB.</li>
          <li><b>Open question</b>: assessors agree, and the median sits between 25% and 75%.</li>
          <li><b>Most disputed evidence</b>: the finding whose weighting varies most across assessors. Settling it would do most to close the gap.</li>
          <li><b>Worth replicating</b>: a finding the panel would count as at least moderate if true, but whose median trust is “doubtful” or lower.</li>
        </ul>
      </section>

      <section class="r-sec two-col">
        <div class="prose">
          <h3>Design choices</h3>
          <ul>
            <li><b>Blind first, then compare.</b> An expert sees the panel’s view of a claim, and the assessors’ profiles, only after committing their own assessment.</li>
            <li><b>One thing at a time.</b> The assessment asks for one judgement per screen, with a meter showing how each answer moves you.</li>
            <li><b>One point, not a range.</b> Each assessor gives a single answer. Uncertainty shows up as disagreement across the panel, where it is easiest to read.</li>
            <li><b>Words before decibans.</b> The maths stays underneath; the interface speaks in percentages, frequencies and plain labels.</li>
            <li><b>Colour-blind safe.</b> Blue supports and orange opposes, instead of green and red. Every colour also has a label.</li>
          </ul>
        </div>
        <div class="prose">
          <h3>Running it at a science jam</h3>
          <ol>
            <li>A team writes its question, claims and evidence (start a new question from the home page, or import one from Data).</li>
            <li>Turn off the illustrative panel in Data so only real assessments count.</li>
            <li>Each expert completes their profile, assesses each claim on their own device, then uses <b>Export my ratings</b> and sends the file to the facilitator.</li>
            <li>The facilitator imports every file. Claims, panel and report update with the real panel.</li>
            <li>Discuss the most disputed evidence first: it is where minds are most likely to move.</li>
          </ol>
        </div>
      </section>

      <section class="r-sec prose" style="max-width:none">
        <h3>Open questions for the Bycelium team</h3>
        <ul>
          <li><b>Who should add claims and evidence?</b> In this prototype both experts and funders can. Options include experts only, a question’s organiser, or anyone with a moderation step.</li>
          <li><b>When should the panel open to an expert?</b> Here it opens claim by claim, after each assessment. It could instead open only once every claim is assessed.</li>
          <li><b>How are profiles verified?</b> Signing in with ORCID would confirm identity and pull publications automatically.</li>
          <li><b>Named or anonymous?</b> Should funders see who said what, or disciplines only?</li>
          <li><b>Scoring.</b> Should the jam show contribution, expertise or inquiry scores, or is the panel view enough for a first test?</li>
        </ul>
      </section>

      <section class="r-sec prose" style="max-width:none">
        <h3>Limits of this prototype</h3>
        <ul>
          <li>The 20 assessors in the sample, their profiles and their ratings are fictional. The studies cited are real.</li>
          <li>Ratings live in this browser and move between people as files. A shared live panel would need a small backend.</li>
          <li>Trust is applied as a simple weight. A full model would treat each premise as a claim with its own credence, as the existing evidence diagrams do.</li>
        </ul>
      </section>
    </div>`;
  };
})();
