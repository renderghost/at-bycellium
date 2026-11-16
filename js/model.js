/*
 * Credence — maths, state, storage and panel aggregation.
 *
 * Credence is stored in decibans (dB): 10 · log10(odds).
 *   0 dB = 50%, +10 dB = 10:1 on (91%), −10 dB = 1:10 (9%).
 * Evidence multiplies the odds, so in decibans it simply adds:
 *   conclusion = starting belief + Σ (strength × trust)
 */
(function () {
  const C = (window.C = window.C || {});

  /* ---------- maths ---------- */
  const D = 25; // charts span ±25 dB ≈ 0.3% … 99.7%
  const STEPS = [-25, -17, -12, -7, -4, -2, 0, 2, 4, 7, 12, 17, 25];
  const TRUST = [
    { v: 0, label: 'Not at all', hint: 'Discount it entirely' },
    { v: 0.33, label: 'Doubtful', hint: 'Counts for a third' },
    { v: 0.67, label: 'Mostly', hint: 'Counts for two thirds' },
    { v: 1, label: 'Fully', hint: 'Counts in full' },
  ];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const M = (C.math = {
    D,
    STEPS,
    TRUST,
    clamp,
    toDb(p) {
      p = clamp(p, 1e-9, 1 - 1e-9);
      return 10 * Math.log10(p / (1 - p));
    },
    toP(db) {
      return 1 / (1 + Math.pow(10, -db / 10));
    },
    factor(db) {
      return Math.pow(10, db / 10);
    },
    pct(p) {
      const v = p * 100;
      if (v < 1) return (v < 0.1 ? '<0.1' : v.toFixed(1)) + '%';
      if (v > 99) return (v > 99.9 ? '>99.9' : v.toFixed(1)) + '%';
      return Math.round(v) + '%';
    },
    pctDb(db) {
      return M.pct(M.toP(db));
    },
    chance(p) {
      const n = (x) => (x >= 1000 ? Math.round(x / 100) * 100 : x).toLocaleString('en-GB');
      if (p <= 0.5) {
        const k = Math.round(1 / p);
        return k <= 2 ? 'about 1 in 2' : 'about 1 in ' + n(k);
      }
      const k = Math.round(1 / (1 - p));
      return k <= 2 ? 'about 1 in 2' : 'about ' + n(k - 1) + ' in ' + n(k);
    },
    // IPCC calibrated language: familiar to scientists and readable by funders.
    verbal(p) {
      // judge the rounded value people actually see, so “90%” never reads “Likely”
      if (p > 0.01 && p < 0.99) p = Math.round(p * 100) / 100;
      if (p >= 0.99) return 'Virtually certain';
      if (p >= 0.95) return 'Extremely likely';
      if (p >= 0.9) return 'Very likely';
      if (p >= 0.66) return 'Likely';
      if (p > 0.33) return 'About as likely as not';
      if (p > 0.1) return 'Unlikely';
      if (p > 0.05) return 'Very unlikely';
      if (p > 0.01) return 'Extremely unlikely';
      return 'Exceptionally unlikely';
    },
    verbalDb(db) {
      return M.verbal(M.toP(db));
    },
    // Jeffreys-style bands, as used by the existing evidence diagrams.
    strengthWord(db) {
      const a = Math.abs(db);
      if (a < 1) return 'No effect';
      if (a < 3) return 'Anecdotal';
      if (a < 5) return 'Weak';
      if (a < 10) return 'Moderate';
      if (a < 15) return 'Strong';
      if (a < 20) return 'Very strong';
      return 'Decisive';
    },
    strengthLabel(db) {
      const w = M.strengthWord(db);
      if (w === 'No effect') return 'No effect';
      return w + (db > 0 ? ' support' : ' opposition');
    },
    factorText(db) {
      if (Math.abs(db) < 1) return 'leaves the odds unchanged';
      const f = M.factor(Math.abs(db));
      const r = f >= 20 ? Math.round(f / 10) * 10 : f >= 3 ? Math.round(f) : Math.round(f * 10) / 10;
      return (db > 0 ? 'multiplies the odds by about ' : 'divides the odds by about ') + r.toLocaleString('en-GB');
    },
    trustLabel(t) {
      let best = TRUST[0];
      for (const x of TRUST) if (Math.abs(x.v - t) < Math.abs(best.v - t)) best = x;
      return best.label;
    },
    snap(v, arr) {
      let best = arr[0];
      for (const x of arr) if (Math.abs(x - v) < Math.abs(best - v)) best = x;
      return best;
    },
    quantile(arr, q) {
      if (!arr.length) return NaN;
      const s = [...arr].sort((a, b) => a - b);
      const pos = (s.length - 1) * q;
      const lo = Math.floor(pos);
      const hi = Math.ceil(pos);
      return s[lo] + (s[hi] - s[lo]) * (pos - lo);
    },
    median(arr) {
      return M.quantile(arr, 0.5);
    },
  });

  /* ---------- seeded random numbers for the illustrative panel ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  C.generatePanel = function (sample) {
    const rnd = mulberry32(sample.seed);
    const gauss = () => {
      const u = 1 - rnd();
      const v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const ratings = {};
    for (const a of sample.assessors) {
      const r = (ratings[a.id] = {});
      const bold = 0.9 + rnd() * 0.2; // some people rate a little more boldly than others
      for (const c of sample.inquiry.claims) {
        const p = sample.params[c.id];
        if (!p) continue;
        const prior = p.prior.mu + p.prior.k * a.camp + gauss() * p.prior.sd;
        const ev = {};
        for (const e of c.evidence) {
          const q = p.ev[e.id];
          if (!q) continue;
          const noted = sample.notes && sample.notes[a.id] && sample.notes[a.id][e.id];
          if (rnd() < (q.skip != null ? q.skip : 0.1) && !noted) continue; // outside their expertise
          const s = M.snap((q.s + (q.k || 0) * a.camp + gauss() * q.sd) * bold, STEPS);
          const t = M.snap(clamp(q.t + (q.kt || 0) * a.camp + gauss() * (q.tsd != null ? q.tsd : 0.12), 0, 1), [0, 0.33, 0.67, 1]);
          ev[e.id] = noted ? { s, t, note: noted } : { s, t };
        }
        r[c.id] = { prior: Math.round(clamp(prior, -24, 24) * 2) / 2, ev };
      }
    }
    return ratings;
  };

  /* ---------- state & storage ---------- */
  const KEY = 'credence.prototype.v1';
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function readStore() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  const saved = readStore() || {};
  const S = (C.state = {
    inquiry: saved.inquiry || clone(C.SAMPLE.inquiry),
    sampleRatings: C.generatePanel(C.SAMPLE),
    me: Object.assign(
      { id: uid('me-'), name: '', discipline: '', affiliation: '', role: '', bio: '', interests: '', links: { orcid: '', bluesky: '', scholar: '', website: '' }, ratings: {} },
      saved.me || {}
    ),
    imported: saved.imported || { assessors: [], ratings: {} },
    settings: Object.assign({ useSample: true, persona: 'expert' }, saved.settings || {}),
  });

  C.uid = uid;
  C.clone = clone;

  C.save = function () {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ inquiry: S.inquiry, me: S.me, imported: S.imported, settings: S.settings })
      );
    } catch (e) {
      /* storage unavailable: the session still works */
    }
  };

  C.resetAll = function () {
    S.inquiry = clone(C.SAMPLE.inquiry);
    S.me.ratings = {};
    S.imported = { assessors: [], ratings: {} };
    S.settings = { useSample: true, persona: S.settings.persona || 'expert' };
    C.save();
  };

  C.claim = (id) => S.inquiry.claims.find((c) => c.id === id);

  C.myRating = function (cid, create) {
    let r = S.me.ratings[cid];
    if (!r && create) r = S.me.ratings[cid] = { prior: null, ev: {} };
    return r || null;
  };

  /* ---------- persona & gating ---------- */
  C.isFunder = () => S.settings.persona === 'funder';
  C.isComplete = (cid) => !!(S.me.ratings[cid] && S.me.ratings[cid].done);
  C.anyComplete = () => S.inquiry.claims.some((c) => C.isComplete(c.id));
  // Experts see a claim's panel only after submitting their own assessment of it, so they judge blind.
  C.canSeePanel = (cid) => C.isFunder() || C.isComplete(cid);
  C.canSeeProfiles = () => C.isFunder() || C.anyComplete();
  C.myDoneRatings = function () {
    const out = {};
    for (const [k, v] of Object.entries(S.me.ratings)) if (v && v.done) out[k] = v;
    return out;
  };
  C.answered = function (claim) {
    const r = S.me.ratings[claim.id];
    let n = r && r.prior != null ? 1 : 0;
    for (const e of claim.evidence) {
      const x = r && r.ev && r.ev[e.id];
      if (x && (x.s != null || x.skipped)) n++;
    }
    return { n, total: claim.evidence.length + 1 };
  };

  C.sampleActive = () => S.settings.useSample && S.inquiry.sample && S.inquiry.id === C.SAMPLE.inquiry.id;

  /* Everyone whose ratings count. */
  C.people = function (includeMe) {
    const list = [];
    if (C.sampleActive()) {
      for (const a of C.SAMPLE.assessors) list.push({ ...a, kind: 'sample', ratings: S.sampleRatings[a.id] || {} });
    }
    for (const a of S.imported.assessors) {
      if (a.id === S.me.id) continue;
      list.push({ ...a, kind: 'imported', ratings: S.imported.ratings[a.id] || {} });
    }
    if (includeMe && C.anyComplete()) list.push({ ...C.myProfile(), isMe: true, kind: 'me', ratings: C.myDoneRatings() });
    return list;
  };

  C.myProfile = () => ({
    id: S.me.id,
    name: S.me.name || 'You',
    discipline: S.me.discipline,
    affiliation: S.me.affiliation,
    role: S.me.role,
    bio: S.me.bio,
    interests: S.me.interests,
    links: S.me.links,
  });
  C.assessor = (id) => C.people(true).find((p) => p.id === id) || (id === S.me.id ? { ...C.myProfile(), isMe: true, kind: 'me', ratings: {} } : null);

  C.posteriorOf = function (claim, r) {
    if (!r || r.prior == null) return null;
    let post = r.prior;
    let n = 0;
    for (const e of claim.evidence) {
      const x = r.ev && r.ev[e.id];
      if (!x || x.s == null) continue;
      post += x.s * (x.t != null ? x.t : 1);
      n++;
    }
    return { prior: r.prior, post, n };
  };

  /* ---------- aggregation ---------- */
  const SPLIT = 12; // middle half wider than 20%–80% counts as split
  const OPEN = 4.77; // 25% … 75%
  C.thresholds = { SPLIT, OPEN };

  C.agreementWord = function (iqr) {
    if (iqr == null || isNaN(iqr)) return '—';
    if (iqr < 5) return 'Broad agreement';
    if (iqr <= SPLIT) return 'Mixed views';
    return 'Split';
  };

  C.claimStats = function (claim, opts) {
    opts = opts || {};
    const includeMe = opts.includeMe !== false;
    const people = C.people(includeMe);
    const rows = [];
    for (const p of people) {
      const r = p.ratings && p.ratings[claim.id];
      const res = C.posteriorOf(claim, r);
      if (!res) continue;
      rows.push({ id: p.id, name: p.name, discipline: p.discipline, isMe: !!p.isMe, kind: p.kind, ...res });
    }
    const priors = rows.map((r) => r.prior);
    const posts = rows.map((r) => r.post);
    const q = (a, x) => M.quantile(a, x);

    const ev = claim.evidence.map((e) => {
      const imp = [];
      const ss = [];
      const ts = [];
      let mine = null;
      for (const p of people) {
        const x = p.ratings && p.ratings[claim.id] && p.ratings[claim.id].ev && p.ratings[claim.id].ev[e.id];
        if (!x || x.s == null) continue;
        const t = x.t != null ? x.t : 1;
        if (p.isMe) mine = { s: x.s, t, impact: x.s * t };
        imp.push(x.s * t);
        ss.push(x.s);
        ts.push(t);
      }
      if (!includeMe) {
        const mr = S.me.ratings[claim.id];
        const x = mr && mr.ev && mr.ev[e.id];
        if (x && x.s != null) {
          const t = x.t != null ? x.t : 1;
          mine = { s: x.s, t, impact: x.s * t };
        }
      }
      const sMed = M.median(ss);
      const tMed = M.median(ts);
      const out = {
        e,
        n: imp.length,
        impacts: imp,
        sMed,
        tMed,
        impMed: M.median(imp),
        impQ1: q(imp, 0.25),
        impQ3: q(imp, 0.75),
        impP10: q(imp, 0.1),
        impP90: q(imp, 0.9),
        mine,
      };
      out.impIqr = out.impQ3 - out.impQ1;
      out.spread = out.impP90 - out.impP10; // how far apart most of the panel is
      out.unrealised = imp.length ? Math.abs(sMed) * (1 - tMed) : 0;
      return out;
    });

    const rated = ev.filter((x) => x.n >= 3);
    const crux = [...rated].sort((a, b) => b.spread - a.spread)[0] || null;
    const repl =
      [...rated].filter((x) => Math.abs(x.sMed) >= 7 && x.tMed <= 0.5).sort((a, b) => b.unrealised - a.unrealised)[0] || null;

    const st = {
      claim,
      rows,
      n: rows.length,
      priorMed: M.median(priors),
      priorQ1: q(priors, 0.25),
      priorQ3: q(priors, 0.75),
      postMed: M.median(posts),
      postQ1: q(posts, 0.25),
      postQ3: q(posts, 0.75),
      ev,
      crux: crux && crux.spread >= 6 ? crux : null,
      repl,
    };
    st.priorIqr = st.priorQ3 - st.priorQ1;
    st.postIqr = st.postQ3 - st.postQ1;
    st.shift = st.postMed - st.priorMed;
    if (st.n < 3) st.status = 'insufficient';
    else if (st.postIqr > SPLIT) st.status = 'contested';
    else if (Math.abs(st.postMed) < OPEN) st.status = 'open';
    else st.status = st.postMed > 0 ? 'settled-true' : 'settled-false';
    return st;
  };

  C.STATUS = {
    contested: { label: 'Contested', short: 'contested', action: 'Fund a decisive test', tone: 'warn' },
    open: { label: 'Open question', short: 'open', action: 'Fund exploration', tone: 'info' },
    'settled-true': { label: 'Consensus: likely true', short: 'agreed likely true', action: 'Low priority', tone: 'calm' },
    'settled-false': { label: 'Consensus: likely false', short: 'agreed likely false', action: 'Low priority', tone: 'calm' },
    insufficient: { label: 'Too few assessors', short: 'need more assessors', action: 'Recruit assessors', tone: 'mute' },
  };

  /* Ranked list of where money would most change expert minds. */
  C.opportunities = function (all) {
    const out = [];
    for (const s of all) {
      if (s.status === 'contested') {
        out.push({ type: 'settle', score: 10 + s.postIqr, stats: s, ev: s.crux });
      }
      if (s.repl) {
        out.push({ type: 'replicate', score: 6 + s.repl.unrealised, stats: s, ev: s.repl });
      }
      if (s.status === 'open') {
        out.push({ type: 'explore', score: 8 + (OPEN - Math.abs(s.postMed)), stats: s, ev: null });
      }
    }
    return out.sort((a, b) => b.score - a.score);
  };

  /* ---------- import / export ---------- */
  C.exportMine = function () {
    return {
      format: 'credence.ratings.v1',
      exportedAt: new Date().toISOString(),
      inquiryId: S.inquiry.id,
      assessor: { ...C.myProfile(), name: S.me.name || 'Anonymous' },
      ratings: C.myDoneRatings(),
    };
  };

  C.exportInquiry = function () {
    const assessors = [...S.imported.assessors];
    const ratings = { ...S.imported.ratings };
    if (C.anyComplete()) {
      assessors.push({ ...C.myProfile(), name: S.me.name || 'Anonymous' });
      ratings[S.me.id] = C.myDoneRatings();
    }
    return { format: 'credence.inquiry.v1', exportedAt: new Date().toISOString(), inquiry: S.inquiry, assessors, ratings };
  };

  /* Returns a short human message describing what was imported. */
  C.importData = function (obj) {
    if (!obj || typeof obj !== 'object') throw new Error('That file is not Credence data.');
    if (obj.format === 'credence.ratings.v1') {
      const a = obj.assessor || {};
      if (!a.id) throw new Error('The ratings file has no assessor id.');
      if (a.id === S.me.id) throw new Error('That file holds your own ratings; they are already here.');
      const i = S.imported.assessors.findIndex((x) => x.id === a.id);
      const entry = {
        id: a.id,
        name: a.name || 'Assessor',
        discipline: a.discipline || '',
        affiliation: a.affiliation || '',
        role: a.role || '',
        bio: a.bio || '',
        interests: a.interests || '',
        links: a.links || {},
      };
      if (i >= 0) S.imported.assessors[i] = entry;
      else S.imported.assessors.push(entry);
      S.imported.ratings[a.id] = obj.ratings || {};
      C.save();
      return 'Added ratings from ' + entry.name + '.';
    }
    if (obj.format === 'credence.inquiry.v1') {
      if (!obj.inquiry || !Array.isArray(obj.inquiry.claims)) throw new Error('The inquiry file has no claims.');
      S.inquiry = obj.inquiry;
      S.imported = { assessors: (obj.assessors || []).filter((a) => a.id !== S.me.id), ratings: obj.ratings || {} };
      if (obj.ratings && obj.ratings[S.me.id]) S.me.ratings = obj.ratings[S.me.id];
      C.save();
      return 'Loaded “' + (S.inquiry.title || 'inquiry') + '” with ' + S.imported.assessors.length + ' assessors.';
    }
    throw new Error('Unrecognised file. Expected a Credence ratings or inquiry export.');
  };
})();
