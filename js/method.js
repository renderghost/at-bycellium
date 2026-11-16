/*
 * Credence — Method view: how to read the numbers, and how to run it at a jam.
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

    main.innerHTML = `<div class="method">
      <section class="r-intro">
        <p class="eyebrow">Method</p>
        <h2 class="r-title">How Credence turns expert judgement into a decision</h2>
        <p class="r-lede">Science doesn’t prove claims; evidence shifts how credible they are. Credence asks experts two simple questions about each claim and each finding, combines their answers with Bayes’ rule, and shows non-experts where the field stands and where money would change minds.</p>
      </section>

      <section class="r-sec two-col">
        <div class="prose">
          <h3>Two roles</h3>
          <p><b>Assessors</b> are the experts. For each claim they give a starting belief, then weigh each piece of evidence: which way it pushes, how hard, and how far they trust it. They see how each answer moves them, and only then how the rest of the panel answered.</p>
          <p><b>Funders</b> read the report. It shows what the panel concluded, how much they agree, which evidence carried the most weight, and where a study would change the most minds.</p>
        </div>
        <div class="prose">
          <h3>How the numbers combine</h3>
          <p>Evidence multiplies the odds of a claim. Credence keeps score in <b>decibans</b>, Alan Turing’s codebreaking unit: ten times the logarithm of the odds. In decibans, evidence simply adds up.</p>
          <div class="formula">conclusion = starting belief<br>&nbsp;&nbsp;+ Σ (strength if true × trust)</div>
          <p>Trust is a simplification of how the existing prototype weights a premise by its credibility: a finding you trust “mostly” counts for two thirds of its strength.</p>
        </div>
      </section>

      <section class="r-sec two-col">
        <div class="prose">
          <h3>Reading credence</h3>
          <p>Every number comes with words from the IPCC’s calibrated scale and a natural frequency, so non-experts don’t have to interpret percentages alone.</p>
          <div class="tbl-wrap"><table><thead><tr><th class="num">Credence</th><th>In words</th><th>As a frequency</th><th class="num">Decibans</th></tr></thead><tbody>${ladder}</tbody></table></div>
        </div>
        <div class="prose">
          <h3>Strength of evidence</h3>
          <p>Assessors pick a band, not a number. Each band multiplies the odds by roughly the amount shown; opposition divides them.</p>
          <div class="tbl-wrap"><table><thead><tr><th>Band</th><th class="num">Odds ×</th><th class="num">Decibans</th></tr></thead><tbody>${steps}</tbody></table></div>
        </div>
      </section>

      <section class="r-sec prose" style="max-width:none">
        <h3>How the panel is summarised</h3>
        <ul>
          <li><b>Median</b>: half the panel is above, half below. Robust to one extreme assessor.</li>
          <li><b>Middle half</b>: the range holding the central 50% of assessors. Its width is the measure of disagreement.</li>
          <li><b>Split</b>: the middle half is wider than 20%–80% (12 dB). <b>Mixed</b>: 5–12 dB. <b>Broad agreement</b>: under 5 dB.</li>
          <li><b>Open question</b>: assessors agree, and the median sits between 25% and 75%.</li>
          <li><b>Most disputed evidence</b>: the finding whose weighting varies most across assessors. Settling it would do most to close the gap.</li>
          <li><b>Worth replicating</b>: a finding the panel would count as at least moderate if true, but whose median trust is “doubtful” or lower. The gap between the outline and the solid bar is what a replication could unlock.</li>
        </ul>
      </section>

      <section class="r-sec two-col">
        <div class="prose">
          <h3>Design choices</h3>
          <ul>
            <li><b>Blind first, then compare.</b> The panel stays hidden until you have weighed everything, so early views can’t anchor later ones.</li>
            <li><b>One point, not a range.</b> Each assessor gives a single answer. Uncertainty shows up as disagreement across the panel, where it is easiest to read.</li>
            <li><b>Top to bottom.</b> The belief path reads in the order you reason: start, each finding, conclusion.</li>
            <li><b>Words before decibans.</b> The maths stays underneath; the interface speaks in percentages, frequencies and plain labels.</li>
            <li><b>Colour-blind safe.</b> Blue supports and orange opposes, instead of green and red. Every colour also has a label.</li>
          </ul>
        </div>
        <div class="prose">
          <h3>Running it at a science jam</h3>
          <ol>
            <li>A team writes its claims and evidence in Assess (or imports an inquiry file from the Data menu).</li>
            <li>Turn off the illustrative panel in the Data menu so only real ratings count.</li>
            <li>Each assessor rates on their own device, then uses <b>Export my ratings</b> and sends the file to the facilitator.</li>
            <li>The facilitator imports every file. The report updates with the real panel.</li>
            <li>Discuss the most disputed evidence first: it is where minds are most likely to move.</li>
          </ol>
        </div>
      </section>

      <section class="r-sec prose" style="max-width:none">
        <h3>Limits of this prototype</h3>
        <ul>
          <li>The 20 assessors in the sample are fictional, and their ratings are simulated. The studies cited are real.</li>
          <li>Ratings live in this browser and move between people as files. A shared live panel would need a small backend.</li>
          <li>Trust is applied as a simple weight. A full model would treat each premise as a claim with its own credence, as the existing evidence diagrams do.</li>
          <li>The prototype doesn’t yet score assessors (contribution, expertise or inquiry scores) or reward them.</li>
        </ul>
      </section>
    </div>`;
  };
})();
