/*
 * Credence — shared interface pieces: badges, avatars, breadcrumbs, the credence input,
 * the strength scale and trust chips, and the panel-summary wording used across views.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const S = C.state;

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

  C.initials = (name) =>
    String(name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

  C.displayName = (p) => (p && p.isMe ? (S.me.name ? S.me.name + ' (you)' : 'You') : (p && p.name) || 'Assessor');

  C.avatar = function (p, size) {
    const cls = p && p.isMe ? ' av-me' : '';
    return `<span class="av${cls}${size ? ' av-' + size : ''}" aria-hidden="true">${esc(C.initials(p && p.name))}</span>`;
  };

  C.crumbs = function (items) {
    return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items
      .map((it, i) =>
        i === items.length - 1 ? `<li aria-current="page">${esc(it.label)}</li>` : `<li><a href="${esc(it.href)}">${esc(it.label)}</a></li>`
      )
      .join('')}</ol></nav>`;
  };

  C.sampleNotice = function () {
    if (!C.sampleActive()) return '';
    return `<div class="notice"><span class="notice-ico" aria-hidden="true">!</span><span><b>Sample question.</b> The studies are real. The 20 assessors, their profiles and their ratings are fictional, simulated to show how a panel reads. Turn the sample panel off in <button class="btn-link" data-act="open-data">Data</button> when running with real people.</span></div>`;
  };

  C.evidenceHead = function (e, k) {
    const src = e.source || {};
    const srcText = [src.label, src.year].filter(Boolean).join(', ');
    return `<div class="ev-head">
      <div class="ev-tags">${k != null ? `<span class="tag">Evidence ${k + 1}</span>` : ''}${e.kind ? `<span class="tag">${esc(e.kind)}</span>` : ''}${C.statusBadge(e.status)}</div>
      <h4 class="ev-title">${esc(e.title)}</h4>
      ${e.summary ? `<p class="ev-sum">${esc(e.summary)}</p>` : ''}
      ${
        src.url
          ? `<p class="ev-src"><a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(srcText || 'Source')} ↗</a></p>`
          : srcText
          ? `<p class="ev-src">${esc(srcText)}</p>`
          : ''
      }
    </div>`;
  };

  /* ---------- the credence input (starting belief) ---------- */
  C.credenceHTML = function (prior) {
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
        <input type="range" id="prior-range" min="${-M.D}" max="${M.D}" step="0.5" value="${v}" aria-label="Starting belief" aria-valuetext="${
      unset ? 'Not set' : M.pct(p) + ', ' + M.verbal(p)
    }">
        <div class="cred-ticks" aria-hidden="true">${ticks}</div>
      </div>
      <div class="presets"><span class="presets-label">Quick pick</span>${presets}</div>
    </div>`;
  };

  C.updateCredenceReadout = function (root, v) {
    const p = M.toP(v);
    const cred = root.querySelector('#cred');
    cred.classList.remove('is-unset');
    root.querySelector('#cred-big').textContent = M.pct(p);
    root.querySelector('#cred-verbal').textContent = M.verbal(p);
    root.querySelector('#cred-freq').textContent = M.chance(p);
    root.querySelector('#prior-range').setAttribute('aria-valuetext', M.pct(p) + ', ' + M.verbal(p));
    cred.querySelectorAll('.preset').forEach((b) => b.classList.toggle('is-on', Math.abs(M.toDb(+b.dataset.p) - v) < 0.3));
  };

  /* ---------- strength scale & trust ---------- */
  C.readoutHTML = function (r) {
    if (!r || r.s == null) return r && r.skipped ? 'Skipped: outside your expertise.' : 'Not weighed yet.';
    if (r.s === 0) return '<b>No effect.</b> This finding does not move the claim either way.';
    const t = r.t != null ? r.t : 1;
    const eff = r.s * t;
    let txt = `<b>${esc(M.strengthLabel(r.s))}.</b> If it holds, it ${esc(M.factorText(r.s))}.`;
    if (t < 1) txt += ` Trusted “${esc(M.trustLabel(t))}”, it counts as ${esc(M.strengthLabel(eff).toLowerCase())}.`;
    return txt;
  };

  C.scaleHTML = function (e, r) {
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
      <div class="scale-labels" aria-hidden="true"><span>Decisive</span><span>Strong</span><span>Weak</span><span>None</span><span>Weak</span><span>Strong</span><span>Decisive</span></div>
      <div class="scale-dirs" aria-hidden="true"><span>← Opposes the claim</span><span>Supports the claim →</span></div>`;
  };

  C.trustHTML = function (e, r) {
    const has = r && r.s != null;
    const t = has ? (r.t != null ? r.t : 1) : null;
    const chips = M.TRUST.map((x) => {
      const on = t != null && Math.abs(x.v - t) < 0.01;
      return `<button type="button" role="radio" aria-checked="${on}" class="chip${on ? ' is-on' : ''}" data-t="${x.v}" data-ev="${esc(e.id)}"${
        has ? '' : ' disabled'
      }>${esc(x.label)}<small>${esc(x.hint)}</small></button>`;
    }).join('');
    return `<div class="chips${has ? '' : ' is-disabled'}" role="radiogroup" aria-labelledby="qt-${esc(e.id)}">${chips}</div>`;
  };

  /* ---------- panel wording ---------- */
  C.actionChip = function (s) {
    const st = C.STATUS[s.status];
    let type = s.status;
    let label = st.action;
    if (s.status.startsWith('settled') && s.repl) {
      type = 'replicate';
      label = 'Fund a replication';
    }
    return `<span class="act act-${type}">${esc(label)}</span>`;
  };

  C.shiftText = function (s) {
    if (s.n < 3) return '';
    if (Math.abs(s.shift) < 0.8) return 'Evidence barely moved the panel';
    return `${s.shift > 0 ? 'Up' : 'Down'} from ${M.pctDb(s.priorMed)} before evidence`;
  };

  C.quote = (t) => `<q>${esc(t)}</q>`;
  C.listText = function (arr) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  };

  C.ledeText = function (all) {
    const q = C.quote;
    const by = (s) => all.filter((x) => x.status === s);
    const parts = [];
    const contested = by('contested');
    const open = by('open');
    const yes = by('settled-true');
    const no = by('settled-false');
    if (contested.length) parts.push(`Experts are split on ${C.listText(contested.map((s) => q(s.claim.title)))}.`);
    if (yes.length)
      parts.push(`They consider ${C.listText(yes.map((s) => q(s.claim.title) + ' ' + esc(M.verbalDb(s.postMed).toLowerCase()) + ' (' + M.pctDb(s.postMed) + ')'))}.`);
    if (open.length) parts.push(`They agree that ${C.listText(open.map((s) => q(s.claim.title)))} ${open.length > 1 ? 'remain' : 'remains'} an open question.`);
    if (no.length) parts.push(`They think ${C.listText(no.map((s) => q(s.claim.title)))} ${no.length > 1 ? 'are' : 'is'} unlikely.`);
    if (!parts.length) return 'Not enough assessors have rated these claims yet to draw conclusions.';
    return parts.join(' ');
  };

  C.relationText = function (mine, st) {
    const d = mine - st.postMed;
    if (Math.abs(d) < 3) return 'close to the panel';
    return d > 0 ? 'more convinced than the panel' : 'more sceptical than the panel';
  };

  C.linkChips = function (p) {
    if (p.kind === 'sample') {
      return `<div class="links">${(p.sampleLinks || [])
        .map((l) => `<span class="link-chip is-sample" title="Sample profile: this link is a placeholder">${esc(l)}</span>`)
        .join('')}</div><p class="fine">Sample profile: in a live panel these link to the assessor’s ORCID, publications and social profiles.</p>`;
    }
    const L = p.links || {};
    const out = [];
    if (L.orcid) out.push(['ORCID', 'https://orcid.org/' + L.orcid]);
    if (L.bluesky) out.push(['Bluesky', 'https://bsky.app/profile/' + L.bluesky.replace(/^@/, '')]);
    if (L.scholar) out.push(['Google Scholar', L.scholar]);
    if (L.website) out.push(['Website', L.website]);
    if (!out.length) return `<p class="fine">No links added yet.</p>`;
    return `<div class="links">${out
      .map(([l, u]) => `<a class="link-chip" href="${esc(u)}" target="_blank" rel="noopener">${esc(l)} ↗</a>`)
      .join('')}</div>`;
  };
})();
