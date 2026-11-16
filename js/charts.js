/*
 * Credence — hand-built SVG charts. No libraries.
 * Every chart draws credence on the same log-odds axis, labelled in percent.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;

  const esc = (C.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  });

  const TICKS_WIDE = [0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99];
  const TICKS_NARROW = [0.01, 0.1, 0.5, 0.9, 0.99]; // evenly spaced in decibans
  let TICKS = TICKS_WIDE;
  const useTicks = (w) => (TICKS = w < 460 ? TICKS_NARROW : TICKS_WIDE);
  const tickLabel = (p) => Math.round(p * 100) + '%';
  const r1 = (v) => Math.round(v * 10) / 10;

  function scaleX(left, width, D) {
    D = D || M.D;
    return (db) => left + ((M.clamp(db, -D, D) + D) / (2 * D)) * width;
  }

  function truncate(text, maxChars) {
    if (text.length <= maxChars) return text;
    return text.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
  }

  function grid(x, top, bottom, opts) {
    opts = opts || {};
    let out = '';
    for (const p of TICKS) {
      const db = M.toDb(p);
      const xx = r1(x(db));
      out += `<line x1="${xx}" x2="${xx}" y1="${top}" y2="${bottom}" class="${p === 0.5 ? 'g-mid' : 'g-line'}"/>`;
      if (opts.labels !== false) {
        out += `<text x="${xx}" y="${opts.labelY}" class="g-tick" text-anchor="middle">${tickLabel(p)}</text>`;
      }
    }
    return out;
  }

  function arrow(x1, x2, y, cls) {
    const dir = x2 > x1 ? 1 : -1;
    const head = Math.min(7, Math.abs(x2 - x1));
    const xb = x2 - dir * head;
    return (
      `<line x1="${r1(x1)}" x2="${r1(xb)}" y1="${y}" y2="${y}" class="${cls}-line"/>` +
      `<path d="M${r1(x2)},${y} L${r1(xb)},${y - 4.5} L${r1(xb)},${y + 4.5} Z" class="${cls}-head"/>`
    );
  }

  const C_ = (C.charts = {});

  /* ------------------------------------------------------------------
   * Belief path: the assessor's own reasoning, read top to bottom.
   * ------------------------------------------------------------------ */
  C_.beliefPath = function (el, claim, mine, panel, opts) {
    opts = opts || {};
    const W = Math.max(260, el.clientWidth || 340);
    const padL = 12;
    const padR = 12;
    const w = W - padL - padR;
    const x = scaleX(padL, w);
    const RH = 42;
    const top = 30;
    const items = claim.evidence;
    const rowsN = items.length + 2;
    const H = top + rowsN * RH + (panel ? 26 : 8);
    const chars = Math.floor(w / 6.4);
    useTicks(w);

    if (!mine || mine.prior == null) {
      el.innerHTML = `<div class="path-empty">Set your starting belief to see how the evidence moves you.</div>`;
      return;
    }

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Your belief path for this claim">`;
    svg += `<text x="${padL}" y="12" class="g-cap">← less likely</text><text x="${W - padR}" y="12" class="g-cap" text-anchor="end">more likely →</text>`;
    svg += grid(x, top - 4, H - (panel ? 26 : 8), { labelY: 25 });

    let cum = mine.prior;
    let pc = panel ? panel.priorMed : null;
    const panelPts = [];
    let y = top;

    // start row
    let my = y + 28;
    svg += `<text x="${padL}" y="${y + 13}" class="p-label strong">Starting belief · ${M.pctDb(cum)}</text>`;
    let prevY = my;
    let prevX = x(cum);
    if (panel && pc != null) panelPts.push([x(pc), my]);
    svg += `<circle cx="${r1(prevX)}" cy="${my}" r="5" class="p-dot"/>`;
    y += RH;

    items.forEach((e) => {
      const r = mine.ev && mine.ev[e.id];
      my = y + 28;
      const evStat = panel && panel.ev.find((v) => v.e.id === e.id);
      if (panel && evStat && evStat.n) {
        pc += evStat.impMed;
        panelPts.push([x(pc), my]);
      }
      if (!r || r.s == null) {
        const what = r && r.skipped ? 'skipped' : opts.pending || 'not rated';
        svg += `<g class="p-row${opts.hot === e.id ? ' is-hot' : ''}" data-ev="${esc(e.id)}"><rect x="0" y="${y + 1}" width="${W}" height="${RH - 2}" class="p-hit"/>`;
        svg += `<text x="${padL}" y="${y + 13}" class="p-label mute">${esc(truncate(e.title, chars - 10))} · ${what}</text></g>`;
        svg += `<line x1="${r1(prevX)}" x2="${r1(prevX)}" y1="${prevY + 6}" y2="${my + 6}" class="p-conn"/>`;
        prevY = my;
        y += RH;
        return;
      }
      const t = r.t != null ? r.t : 1;
      const impact = r.s * t;
      const x1 = x(cum);
      const x2 = x(cum + impact);
      const word = M.strengthLabel(impact);
      svg += `<line x1="${r1(x1)}" x2="${r1(x1)}" y1="${prevY + 6}" y2="${my}" class="p-conn"/>`;
      svg += `<g class="p-row${opts.hot === e.id ? ' is-hot' : ''}" data-ev="${esc(e.id)}" data-tip="${esc('<b>' + e.title + '</b><br>' + word + ' · ' + M.pctDb(cum) + ' → ' + M.pctDb(cum + impact))}">`;
      svg += `<rect x="0" y="${y + 1}" width="${W}" height="${RH - 2}" class="p-hit"/>`;
      svg += `<text x="${padL}" y="${y + 13}" class="p-label">${esc(truncate(e.title, chars))}</text>`;
      if (Math.abs(x2 - x1) < 3) {
        svg += `<circle cx="${r1(x1)}" cy="${my}" r="3.5" class="p-none"/>`;
      } else {
        svg += arrow(x1, x2, my, impact > 0 ? 'a-for' : 'a-against');
      }
      svg += `</g>`;
      cum += impact;
      prevX = x(cum);
      prevY = my;
      y += RH;
    });

    // end row
    my = y + 28;
    if (panel && pc != null) panelPts.push([x(pc), my]);
    svg += `<line x1="${r1(prevX)}" x2="${r1(prevX)}" y1="${prevY + 6}" y2="${my}" class="p-conn"/>`;
    if (panelPts.length > 1) {
      svg += `<polyline points="${panelPts.map((p) => r1(p[0]) + ',' + p[1]).join(' ')}" class="p-panel"/>`;
      const last = panelPts[panelPts.length - 1];
      svg += `<circle cx="${r1(last[0])}" cy="${last[1]}" r="5" class="p-panel-end"/>`;
      const anchor = last[0] > W - 90 ? 'end' : last[0] < 90 ? 'start' : 'middle';
      svg += `<text x="${r1(last[0])}" y="${my + 22}" class="p-label mute" text-anchor="${anchor}">Panel median · ${M.pctDb(pc)}</text>`;
    }
    const endX = x(cum);
    const unfinished = items.some((e) => !(mine.ev && mine.ev[e.id] && (mine.ev[e.id].s != null || mine.ev[e.id].skipped)));
    const endLabel = opts.pending && unfinished ? 'So far' : 'Your conclusion';
    svg += `<text x="${padL}" y="${y + 13}" class="p-label strong">${endLabel} · ${M.pctDb(cum)} · ${esc(M.verbalDb(cum))}</text>`;
    svg += `<circle cx="${r1(endX)}" cy="${my}" r="7.5" class="p-end"/>`;
    svg += `</svg>`;
    el.innerHTML = svg;
  };

  /* ------------------------------------------------------------------
   * Panel strip: one dot per assessor's conclusion, middle half shaded.
   * ------------------------------------------------------------------ */
  C_.strip = function (el, st, opts) {
    opts = opts || {};
    const W = Math.max(240, el.clientWidth || 420);
    const padL = 12;
    const padR = 12;
    const H = opts.compact ? 54 : 62;
    if (!st.n) {
      el.innerHTML = `<div class="path-empty" style="padding:14px">No ratings yet</div>`;
      return;
    }
    const x = scaleX(padL, W - padL - padR);
    useTicks(W - padL - padR);
    const base = opts.compact ? 26 : 30;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(
      'Conclusions of ' + st.n + ' assessors. Median ' + M.pctDb(st.postMed)
    )}">`;
    svg += grid(x, 4, H - 14, { labelY: H - 2 });
    if (st.n >= 2) {
      const a = x(st.postQ1);
      const b = x(st.postQ3);
      svg += `<rect x="${r1(a)}" y="${base - 15}" width="${r1(Math.max(2, b - a))}" height="30" rx="5" class="s-band"/>`;
    }
    // shift arrow from starting-belief median to conclusion median
    if (st.n >= 3 && Math.abs(st.shift) > 0.8) {
      svg += `<circle cx="${r1(x(st.priorMed))}" cy="5" r="3" class="s-prior"/>`;
      svg += arrow(x(st.priorMed), x(st.postMed), 5, st.shift > 0 ? 'a-for' : 'a-against');
    }
    // beeswarm
    const placed = [];
    const rows = [...st.rows].sort((a, b) => (a.isMe ? 1 : 0) - (b.isMe ? 1 : 0) || a.post - b.post);
    const offsets = [0, -8, 8, -15, 15, -4, 4, -11, 11];
    for (const r of rows) {
      const cx = x(r.post);
      let cy = base;
      for (const o of offsets) {
        const yy = base + o;
        if (!placed.some((p) => Math.abs(p[0] - cx) < 8.5 && Math.abs(p[1] - yy) < 8.5)) {
          cy = yy;
          break;
        }
      }
      placed.push([cx, cy]);
      const tip = `<b>${esc(r.name)}</b>${r.discipline ? ' · ' + esc(r.discipline) : ''}<br>Start ${M.pctDb(r.prior)} → conclusion ${M.pctDb(
        r.post
      )}<br>${r.n} of ${st.claim.evidence.length} pieces of evidence rated`;
      svg += `<circle cx="${r1(cx)}" cy="${cy}" r="${r.isMe ? 5.5 : 4.2}" class="${r.isMe ? 's-me' : 's-dot'}" data-tip="${esc(tip)}" tabindex="-1"/>`;
      if (r.isMe) svg += `<text x="${r1(cx)}" y="${cy - 9}" class="s-me-label" text-anchor="middle">You</text>`;
    }
    if (st.n >= 1) {
      const mx = r1(x(st.postMed));
      svg += `<line x1="${mx}" x2="${mx}" y1="${base - 17}" y2="${base + 17}" class="s-median"/>`;
    }
    svg += `</svg>`;
    el.innerHTML = svg;
  };

  /* ------------------------------------------------------------------
   * Funding map: credence × disagreement, one bubble per claim.
   * ------------------------------------------------------------------ */
  C_.map = function (el, list, onPick) {
    const W = Math.max(300, el.clientWidth || 560);
    const H = Math.round(Math.min(380, Math.max(280, W * 0.62)));
    const padL = 44;
    const padR = 16;
    const padT = 14;
    const padB = 44;
    const w = W - padL - padR;
    const h = H - padT - padB;
    const x = scaleX(padL, w);
    useTicks(w);
    const YMAX = 30;
    const y = (iqr) => padT + h - (M.clamp(iqr, 0, YMAX) / YMAX) * h;
    const { SPLIT, OPEN } = C.thresholds;
    const ySplit = y(SPLIT);
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Map of claims by panel credence and disagreement">`;
    // zones
    svg += `<rect x="${padL}" y="${padT}" width="${w}" height="${r1(ySplit - padT)}" class="z-contested"/>`;
    svg += `<rect x="${padL}" y="${r1(ySplit)}" width="${r1(x(-OPEN) - padL)}" height="${r1(padT + h - ySplit)}" class="z-false"/>`;
    svg += `<rect x="${r1(x(-OPEN))}" y="${r1(ySplit)}" width="${r1(x(OPEN) - x(-OPEN))}" height="${r1(padT + h - ySplit)}" class="z-open"/>`;
    svg += `<rect x="${r1(x(OPEN))}" y="${r1(ySplit)}" width="${r1(padL + w - x(OPEN))}" height="${r1(padT + h - ySplit)}" class="z-true"/>`;
    svg += grid(x, padT, padT + h, { labelY: padT + h + 16 });
    svg += `<text x="${padL + 8}" y="${padT + 18}" class="z-label">Contested · experts split</text>`;
    svg += `<text x="${padL + 8}" y="${padT + h - 10}" class="z-label">Agreed: likely false</text>`;
    svg += `<text x="${r1((x(-OPEN) + x(OPEN)) / 2)}" y="${padT + h - 10}" class="z-label" text-anchor="middle">Open</text>`;
    svg += `<text x="${padL + w - 8}" y="${padT + h - 10}" class="z-label" text-anchor="end">Agreed: likely true</text>`;
    // y axis, in words rather than decibans
    svg += `<text x="12" y="${r1(padT + h / 2)}" class="g-cap" transform="rotate(-90 12 ${r1(padT + h / 2)})" text-anchor="middle">Disagreement →</text>`;
    svg += `<text x="${padL - 6}" y="${r1(padT + h - 2)}" class="g-tick" text-anchor="end">low</text>`;
    svg += `<text x="${padL - 6}" y="${r1(padT + 10)}" class="g-tick" text-anchor="end">high</text>`;
    svg += `<line x1="${padL}" x2="${padL + w}" y1="${r1(ySplit)}" y2="${r1(ySplit)}" class="g-mid"/>`;
    svg += `<text x="${r1(padL + w / 2)}" y="${H - 6}" class="g-cap" text-anchor="middle">Panel’s median credence →</text>`;
    // bubbles: numbered to match the claim list; titles live in the key below and the tooltip
    const placed = [];
    list.forEach((st, i) => {
      if (st.n < 3) return; // too few assessors to place on the map
      const cx = x(st.postMed);
      let cy = y(st.postIqr);
      while (placed.some((p) => Math.hypot(p[0] - cx, p[1] - cy) < 22)) cy -= 6;
      placed.push([cx, cy]);
      const tip = `<b>${esc(st.claim.title)}</b><br>Median ${M.pctDb(st.postMed)} · middle half ${M.pctDb(st.postQ1)}–${M.pctDb(st.postQ3)}<br>${
        C.STATUS[st.status].label
      }`;
      svg += `<g class="m-pt" data-claim="${esc(st.claim.id)}" data-tip="${esc(tip)}" tabindex="0" role="button" aria-label="${esc(st.claim.title)}">`;
      svg += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="12" class="m-dot m-${st.status}"/>`;
      svg += `<text x="${r1(cx)}" y="${r1(cy + 4)}" class="m-num" text-anchor="middle">${i + 1}</text>`;
      svg += `</g>`;
    });
    svg += `</svg>`;
    el.innerHTML = svg;
    if (onPick) {
      el.querySelectorAll('.m-pt').forEach((g) => {
        g.addEventListener('click', () => onPick(g.dataset.claim));
        g.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            onPick(g.dataset.claim);
          }
        });
      });
    }
  };

  /* ------------------------------------------------------------------
   * Slopegraph: each assessor's start → conclusion.
   * ------------------------------------------------------------------ */
  C_.slope = function (el, st) {
    const W = Math.max(280, el.clientWidth || 520);
    const padL = 12;
    const padR = 12;
    const H = 232;
    const yA = 44;
    const yB = 178;
    const x = scaleX(padL, W - padL - padR);
    useTicks(W - padL - padR);
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="How each assessor moved from starting belief to conclusion">`;
    svg += `<text x="${padL}" y="14" class="g-cap strong">Before weighing evidence</text>`;
    svg += `<text x="${padL}" y="${H - 4}" class="g-cap strong">After weighing evidence</text>`;
    for (const p of TICKS) {
      const xx = r1(x(M.toDb(p)));
      svg += `<line x1="${xx}" x2="${xx}" y1="${yA}" y2="${yB}" class="${p === 0.5 ? 'g-mid' : 'g-line'}"/>`;
      svg += `<text x="${xx}" y="${yA - 14}" class="g-tick" text-anchor="middle">${tickLabel(p)}</text>`;
      svg += `<text x="${xx}" y="${yB + 22}" class="g-tick" text-anchor="middle">${tickLabel(p)}</text>`;
    }
    if (st.n >= 2) {
      svg += `<rect x="${r1(x(st.priorQ1))}" y="${yA - 7}" width="${r1(Math.max(2, x(st.priorQ3) - x(st.priorQ1)))}" height="14" rx="7" class="s-band"/>`;
      svg += `<rect x="${r1(x(st.postQ1))}" y="${yB - 7}" width="${r1(Math.max(2, x(st.postQ3) - x(st.postQ1)))}" height="14" rx="7" class="s-band"/>`;
    }
    const rows = [...st.rows].sort((a, b) => (a.isMe ? 1 : 0) - (b.isMe ? 1 : 0));
    for (const r of rows) {
      const tip = `<b>${esc(r.name)}</b>${r.discipline ? ' · ' + esc(r.discipline) : ''}<br>${M.pctDb(r.prior)} → ${M.pctDb(r.post)}`;
      svg += `<g data-tip="${esc(tip)}" class="${r.isMe ? 'sl-me' : 'sl-row'}">`;
      svg += `<line x1="${r1(x(r.prior))}" y1="${yA}" x2="${r1(x(r.post))}" y2="${yB}"/>`;
      svg += `<circle cx="${r1(x(r.prior))}" cy="${yA}" r="${r.isMe ? 5 : 3.5}"/><circle cx="${r1(x(r.post))}" cy="${yB}" r="${r.isMe ? 5 : 3.5}"/>`;
      svg += `</g>`;
    }
    if (st.n >= 1) {
      svg += `<g class="sl-med"><line x1="${r1(x(st.priorMed))}" y1="${yA}" x2="${r1(x(st.postMed))}" y2="${yB}"/>`;
      svg += `<circle cx="${r1(x(st.priorMed))}" cy="${yA}" r="6"/><circle cx="${r1(x(st.postMed))}" cy="${yB}" r="6"/></g>`;
    }
    svg += `</svg>`;
    el.innerHTML = svg;
  };

  /* ------------------------------------------------------------------
   * Evidence impact: one row per piece of evidence.
   * Outline = weight if fully trusted; fill = weight as the panel trusts it.
   * ------------------------------------------------------------------ */
  const IMP_D = 25;
  C_.impactScale = function (W) {
    const padL = 8;
    const padR = 8;
    return scaleX(padL, W - padL - padR, IMP_D);
  };

  C_.impactHeader = function (el) {
    const W = Math.max(200, el.clientWidth || 320);
    const x = C_.impactScale(W);
    const H = 34;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">`;
    svg += `<text x="8" y="12" class="g-cap">← opposes</text><text x="${W - 8}" y="12" class="g-cap" text-anchor="end">supports →</text>`;
    const marks = [
      [-20, 'Decisive'],
      [-10, 'Strong'],
      [0, 'None'],
      [10, 'Strong'],
      [20, 'Decisive'],
    ];
    for (const [v, l] of marks) svg += `<text x="${r1(x(v))}" y="29" class="g-tick" text-anchor="middle">${l}</text>`;
    svg += `</svg>`;
    el.innerHTML = svg;
  };

  C_.impactRow = function (el, v, opts) {
    opts = opts || {};
    const W = Math.max(200, el.clientWidth || 320);
    const x = C_.impactScale(W);
    const H = 34;
    const yc = 13;
    const x0 = x(0);
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(
      v.n ? 'Panel weighs it as ' + M.strengthLabel(v.impMed) : 'Not rated by the panel'
    )}">`;
    for (const g of [-20, -10, -5, 5, 10, 20]) svg += `<line x1="${r1(x(g))}" x2="${r1(x(g))}" y1="0" y2="${H}" class="g-line"/>`;
    svg += `<line x1="${r1(x0)}" x2="${r1(x0)}" y1="0" y2="${H}" class="g-mid"/>`;
    if (v.n) {
      const cls = v.sMed >= 0 ? 'for' : 'against';
      const pa = Math.min(x0, x(v.sMed));
      const pw = Math.abs(x(v.sMed) - x0);
      svg += `<rect x="${r1(pa)}" y="${yc - 7}" width="${r1(Math.max(1, pw))}" height="14" rx="3" class="i-pot i-${cls}"/>`;
      const ia = Math.min(x0, x(v.impMed));
      const iw = Math.abs(x(v.impMed) - x0);
      const icls = v.impMed >= 0 ? 'for' : 'against';
      if (iw >= 1) svg += `<rect x="${r1(ia)}" y="${yc - 7}" width="${r1(iw)}" height="14" rx="3" class="i-fill i-${icls}"/>`;
      if (v.n >= 3) {
        const a = x(v.impQ1);
        const b = x(v.impQ3);
        svg += `<line x1="${r1(a)}" x2="${r1(b)}" y1="${yc + 13}" y2="${yc + 13}" class="i-iqr"/>`;
        svg += `<line x1="${r1(a)}" x2="${r1(a)}" y1="${yc + 9}" y2="${yc + 17}" class="i-iqr"/><line x1="${r1(b)}" x2="${r1(b)}" y1="${yc + 9}" y2="${yc + 17}" class="i-iqr"/>`;
      }
    }
    if (v.mine && opts.showMine !== false) {
      const mx = r1(x(v.mine.impact));
      svg += `<path d="M${mx},${yc - 8} l-5,-6 h10 z" class="i-me"/>`;
    }
    svg += `</svg>`;
    el.innerHTML = svg;
  };

  /* ------------------------------------------------------------------
   * Mini comparison inside an evidence card (after you have rated it).
   * ------------------------------------------------------------------ */
  C_.miniCompare = function (el, v) {
    const W = Math.max(200, el.clientWidth || 300);
    const x = C_.impactScale(W);
    const H = 40;
    const yc = 16;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Your weighting compared with the panel">`;
    svg += `<line x1="${r1(x(0))}" x2="${r1(x(0))}" y1="2" y2="${H - 12}" class="g-mid"/>`;
    for (const g of [-20, -10, 10, 20]) svg += `<line x1="${r1(x(g))}" x2="${r1(x(g))}" y1="2" y2="${H - 12}" class="g-line"/>`;
    if (v.n >= 2) {
      svg += `<rect x="${r1(x(v.impQ1))}" y="${yc - 9}" width="${r1(Math.max(2, x(v.impQ3) - x(v.impQ1)))}" height="18" rx="5" class="s-band"/>`;
    }
    const placed = [];
    for (const imp of [...v.impacts].sort((a, b) => a - b)) {
      const cx = x(imp);
      let cy = yc;
      for (const o of [0, -6, 6, -11, 11]) {
        if (!placed.some((p) => Math.abs(p[0] - cx) < 6.5 && Math.abs(p[1] - (yc + o)) < 6.5)) {
          cy = yc + o;
          break;
        }
      }
      placed.push([cx, cy]);
      svg += `<circle cx="${r1(cx)}" cy="${cy}" r="3.2" class="s-dot"/>`;
    }
    if (v.n) svg += `<line x1="${r1(x(v.impMed))}" x2="${r1(x(v.impMed))}" y1="${yc - 11}" y2="${yc + 11}" class="s-median"/>`;
    if (v.mine) {
      const mx = r1(x(v.mine.impact));
      svg += `<circle cx="${mx}" cy="${yc}" r="5.5" class="s-me"/>`;
    }
    svg += `<text x="8" y="${H - 1}" class="g-tick">opposes</text><text x="${W - 8}" y="${H - 1}" class="g-tick" text-anchor="end">supports</text>`;
    svg += `</svg>`;
    el.innerHTML = svg;
  };

  /* ------------------------------------------------------------------
   * Step meter: inside the assessment form, where you are and how this
   * finding moves you.
   * ------------------------------------------------------------------ */
  C_.stepMeter = function (el, before, after) {
    const W = Math.max(240, el.clientWidth || 520);
    const padL = 14;
    const padR = 14;
    const H = 58;
    const w = W - padL - padR;
    const x = scaleX(padL, w);
    useTicks(w);
    const y = 30;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(
      'Your belief: ' + M.pctDb(before) + (after != null ? ' to ' + M.pctDb(after) : '')
    )}">`;
    svg += `<line x1="${padL}" x2="${padL + w}" y1="${y}" y2="${y}" class="g-mid"/>`;
    for (const p of TICKS) {
      const xx = r1(x(M.toDb(p)));
      svg += `<line x1="${xx}" x2="${xx}" y1="${y - 4}" y2="${y + 4}" class="g-mid"/><text x="${xx}" y="${H - 2}" class="g-tick" text-anchor="middle">${tickLabel(p)}</text>`;
    }
    const xb = x(before);
    if (after != null && Math.abs(x(after) - xb) >= 3) {
      svg += arrow(xb, x(after), y, after > before ? 'a-for' : 'a-against');
      svg += `<circle cx="${r1(xb)}" cy="${y}" r="5" class="p-none"/>`;
      svg += `<circle cx="${r1(x(after))}" cy="${y}" r="6.5" class="p-end"/>`;
      const xa = x(after);
      const anchor = xa > W - 60 ? 'end' : xa < 60 ? 'start' : 'middle';
      svg += `<text x="${r1(xa)}" y="${y - 13}" class="p-label strong" text-anchor="${anchor}">${M.pctDb(after)}</text>`;
    } else {
      svg += `<circle cx="${r1(xb)}" cy="${y}" r="6.5" class="p-end"/>`;
      const anchor = xb > W - 60 ? 'end' : xb < 60 ? 'start' : 'middle';
      svg += `<text x="${r1(xb)}" y="${y - 13}" class="p-label strong" text-anchor="${anchor}">${M.pctDb(before)}</text>`;
    }
    svg += `</svg>`;
    el.innerHTML = svg;
  };
})();
