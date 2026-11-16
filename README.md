# Credence: an evidence panel prototype

Credence is a working prototype of a more usable interface for Bycelium's idea of collecting *endorsements* instead of citations. Experts say how credible a scientific claim is and how much each piece of evidence should move it. Funders get a report showing where the field stands, how much experts agree, and where money would change the most minds.

It is built for a science jam: a team of around 20 academics arguing about the epistemic quality of a field (the sample is Alzheimer's research).

## Open it

There is no build step and nothing to install.

- **Online:** https://renderghost.github.io/at-bycellium/ (published by GitHub Pages from `main`; only the app files are published, not `docs/` or this README).
- **Locally:** open `index.html` in a browser, or open `dist/credence.html` (the same app as a single file you can email).
- **Rebuild the single file** after changing anything:

```bash
node tools/build-single.js
```

Ratings are saved in the browser (`localStorage`), so each person's work survives a reload.

## How it is organised

The top bar switches between two views, **Expert** and **Funder**, and links to **Method** and **Data**.

| Page | Expert | Funder |
|---|---|---|
| **Questions** (home) | Lists questions; only the Alzheimer's question is live, the others are examples. | Same, with a status summary for the live question. |
| **Question** | Overview, the claims to assess with progress, and the panel list. Either view can add claims. | Overview with a plain-language summary, every claim's panel result, the panel list, and a **Report** tab. |
| **Assessment** | A full-screen form, one item per screen: starting belief, then each piece of evidence, then review and submit. A live belief path sits alongside. | — |
| **Claim** | Locked until the expert submits their own assessment of that claim. Then: you and the panel, how the evidence moved the panel, what moved it, and every individual assessment. | All of that, plus the suggested funding action. |
| **Assessor profile** | Opens after the expert's first submitted assessment. Per-claim results stay hidden until the expert has assessed that claim. | Expertise, links (ORCID, Bluesky, Scholar), declared interests, and how they assessed each claim. |
| **Report** (question tab) | Funders only. | Summary, funding map, ranked opportunities and the numbers. |

## Running it with real people

1. Start a new question from the home page and add its claims and evidence (or import a question file from **Data**).
2. In **Data**, turn off the illustrative panel.
3. Each expert fills in their profile, assesses each claim on their own device, then uses **Data → Export my assessments** and sends the file (or the copied text) to the facilitator.
4. The facilitator uses **Data → Import** to load every file. Claims, panel and report now reflect the real panel.

File formats are plain JSON: `credence.ratings.v1` (one assessor) and `credence.inquiry.v1` (claims, evidence and all ratings).

## The maths, briefly

Credence is kept in decibans (dB = 10 · log10 odds), the unit the existing Bycelium prototypes use. Evidence multiplies odds, so in decibans it adds:

```
conclusion = starting belief + Σ (strength if true × trust)
```

The panel is summarised by its median and its middle half (interquartile range). A claim is *contested* when the middle half is wider than 20%–80% (12 dB). It is *open* when assessors agree and the median sits between 25% and 75%. The *most disputed evidence* is the finding whose weighting varies most (10th–90th percentile). A finding is *worth replicating* when it would count as at least moderate if true but the panel's median trust is doubtful or lower.

## Sample data

The sample inquiry asks what drives Alzheimer's disease and whether clearing amyloid will treat it. It contains 5 claims and 30 pieces of evidence from real published studies, linked to PubMed. These include the 2006 Aβ*56 paper retracted in 2024, the lecanemab and donanemab trials, and the 2025 VALAD valacyclovir trial. **The 20 assessors, their profiles, notes and ratings are fictional**. Institutions are invented and profile links are placeholders. They are generated deterministically in `js/model.js` from the parameters in `js/sample-data.js`, to show how a real panel would read.

## Files

```
index.html            app shell
css/app.css           design tokens (light and dark) and all styles
js/sample-data.js     sample question, fictional profiles and notes, panel generator parameters
js/model.js           maths, state, storage, persona gating, aggregation, import/export
js/charts.js          hand-built SVG charts (no libraries)
js/ui.js              shared pieces: badges, avatars, credence input, strength scale
js/wizard.js          the full-screen assessment form
js/home.js            Questions (home)
js/question.js        Question page: Claims, Panel and Report tabs
js/claim.js           Claim page
js/profile.js         Assessor profiles and "edit your profile"
js/method.js          Method page
js/app.js             routing, persona switch, Data menu, editors, modal, tooltip
tools/build-single.js builds dist/credence.html
docs/design-rationale.md  why the interface works the way it does
```

## Known limits

- Ratings move between people as files; a shared live panel needs a small backend.
- Trust is a single weight per finding. The existing evidence diagrams treat each premise as a claim with its own credibility, which is richer.
- No scoring of assessors yet (the manifesto's contribution, expertise and inquiry scores).
- Downloads are blocked when the page is viewed as a claude.ai artifact; use **Copy** there.
