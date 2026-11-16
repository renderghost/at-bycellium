/*
 * Credence — assessor profile, and the form for editing your own.
 */
(function () {
  const C = (window.C = window.C || {});
  const M = C.math;
  const esc = C.esc;
  const S = C.state;
  const views = (C.views = C.views || {});

  views.assessor = function (main, aid) {
    const crumbs = C.crumbs([
      { label: 'Questions', href: '#home' },
      { label: S.inquiry.title || 'Question', href: '#question' },
      { label: 'Panel', href: '#question-panel' },
      { label: 'Profile' },
    ]);
    const isMe = aid === S.me.id;
    if (!C.canSeeProfiles() && !isMe) {
      main.innerHTML = `<div class="page">${crumbs}<div class="empty"><h3>Profiles open after your first assessment</h3>
        <p>Judge the evidence before you see who said what. Submit an assessment of any claim to open the panel’s profiles.</p>
        <a class="btn" href="#question">Go to the claims</a></div></div>`;
      return;
    }
    const p = C.assessor(aid);
    if (!p) {
      main.innerHTML = `<div class="page">${crumbs}<div class="empty"><h3>Assessor not found</h3><p>They may have been removed from the panel.</p><a class="btn" href="#question-panel">Back to the panel</a></div></div>`;
      return;
    }

    const claims = S.inquiry.claims;
    const rows = claims
      .map((c, i) => {
        const r = p.ratings && p.ratings[c.id];
        const res = C.posteriorOf(c, r);
        const head = `<a class="pa-claim" href="#claim-${esc(c.id)}"><span class="mk-num">${i + 1}</span>${esc(c.title)}</a>`;
        if (!res) return `<li class="pa-row">${head}<span class="pa-none">Not assessed</span></li>`;
        if (!C.canSeePanel(c.id) && !isMe)
          return `<li class="pa-row">${head}<span class="pa-none">Hidden until you assess this claim</span></li>`;
        const st = C.claimStats(c);
        const notes = c.evidence.filter((e) => r.ev && r.ev[e.id] && r.ev[e.id].note);
        return `<li class="pa-row">${head}
          <span class="pa-path num">${M.pctDb(res.prior)} → <b>${M.pctDb(res.post)}</b></span>
          <span class="pa-rel">${st.n ? `Panel ${M.pctDb(st.postMed)} · ${esc(C.relationText(res.post, st).replace(" than the panel", ""))}` : ''}</span>
          <span class="pa-n">${res.n} of ${c.evidence.length} weighed</span>
          ${
            notes.length
              ? `<ul class="pa-notes">${notes.map((e) => `<li><span class="pa-note-ev">${esc(e.title)}</span>“${esc(r.ev[e.id].note)}”</li>`).join('')}</ul>`
              : ''
          }
        </li>`;
      })
      .join('');

    main.innerHTML = `<div class="page">
      ${crumbs}
      <section class="r-sec prof">
        <div class="prof-head">${C.avatar(p, 'lg')}
          <div class="prof-id">
            <h1 class="ov-title">${esc(C.displayName({ ...p, isMe }))}</h1>
            <p class="prof-sub">${esc([p.discipline, [p.role, p.affiliation].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'No details yet')}</p>
            ${p.kind === 'sample' ? '<span class="tag">Fictional sample assessor</span>' : p.kind === 'imported' ? '<span class="tag">Imported assessor</span>' : ''}
          </div>
          ${isMe ? '<button type="button" class="btn-ghost sm" data-act="edit-profile">Edit your profile</button>' : ''}
        </div>
        <div class="prof-grid">
          <div class="prose">
            ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
            ${p.expertise && p.expertise.length ? `<div class="ev-tags">${p.expertise.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}
            <h4 class="sub-h">Links</h4>
            ${C.linkChips(p)}
          </div>
          <div class="interests ${p.interests ? 'has' : ''}">
            <h4 class="sub-h">Declared interests</h4>
            <p>${p.interests ? esc(p.interests) : 'None declared.'}</p>
            <p class="fine">Funders can weigh an assessor’s views in light of what they declare.</p>
          </div>
        </div>
      </section>
      <section class="r-sec">
        <div class="r-sec-head"><h3>Assessments on this question</h3><p>Starting belief → conclusion for each claim, compared with the panel median.</p></div>
        <ul class="pa-list">${rows}</ul>
      </section>
    </div>`;
  };

  C.editProfile = function () {
    const L = S.me.links || {};
    C.modal({
      title: 'Your profile',
      body: `<p class="step-hint">Funders and fellow assessors see this next to your assessments. Links help them check your expertise.</p>
        <div class="form-grid">
          <div class="form-row"><label for="p-name">Name</label><input class="field" id="p-name" value="${esc(S.me.name)}" autocomplete="name"></div>
          <div class="form-row"><label for="p-disc">Field</label><input class="field" id="p-disc" value="${esc(S.me.discipline)}" placeholder="e.g. Neuropathology"></div>
          <div class="form-row"><label for="p-role">Role</label><input class="field" id="p-role" value="${esc(S.me.role)}" placeholder="e.g. Senior lecturer"></div>
          <div class="form-row"><label for="p-aff">Institution</label><input class="field" id="p-aff" value="${esc(S.me.affiliation)}"></div>
        </div>
        <div class="form-row"><label for="p-bio">One line about your work</label><input class="field" id="p-bio" maxlength="200" value="${esc(S.me.bio)}"></div>
        <div class="form-grid">
          <div class="form-row"><label for="p-orcid">ORCID iD</label><input class="field" id="p-orcid" value="${esc(L.orcid || '')}" placeholder="0000-0000-0000-0000"></div>
          <div class="form-row"><label for="p-bsky">Bluesky handle</label><input class="field" id="p-bsky" value="${esc(L.bluesky || '')}" placeholder="name.bsky.social"></div>
          <div class="form-row"><label for="p-scholar">Google Scholar link</label><input class="field" id="p-scholar" type="url" value="${esc(L.scholar || '')}" placeholder="https://"></div>
          <div class="form-row"><label for="p-web">Website</label><input class="field" id="p-web" type="url" value="${esc(L.website || '')}" placeholder="https://"></div>
        </div>
        <div class="form-row"><label for="p-int">Declared interests</label><textarea class="field" id="p-int" rows="2" placeholder="Funding, employment, consultancy or patents related to this question. Leave empty if none.">${esc(
          S.me.interests
        )}</textarea></div>`,
      actions: [
        { label: 'Cancel' },
        {
          label: 'Save profile',
          primary: true,
          onClick: (el) => {
            const v = (id) => el.querySelector(id).value.trim();
            const orcid = v('#p-orcid').replace(/^https?:\/\/orcid\.org\//i, '');
            if (orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(orcid)) throw new Error('An ORCID iD looks like 0000-0002-1825-0097.');
            for (const [id, label] of [
              ['#p-scholar', 'Google Scholar link'],
              ['#p-web', 'Website'],
            ])
              if (v(id) && !/^https?:\/\//i.test(v(id))) throw new Error(label + ' must start with http:// or https://');
            Object.assign(S.me, {
              name: v('#p-name'),
              discipline: v('#p-disc'),
              role: v('#p-role'),
              affiliation: v('#p-aff'),
              bio: v('#p-bio'),
              interests: v('#p-int'),
              links: { orcid, bluesky: v('#p-bsky').replace(/^@/, ''), scholar: v('#p-scholar'), website: v('#p-web') },
            });
            C.save();
            C.rerender();
            C.toast('Profile saved.');
          },
        },
      ],
    });
  };
})();
