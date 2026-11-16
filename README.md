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

## The three views

| View | For | What it does |
|---|---|---|
| **Assess** | Experts ("assessors") | For each claim, the assessor sets a starting belief, then weighs each piece of evidence: which way it pushes, how hard, and how far they trust it. A belief path shows how each answer moves them. The panel's views stay hidden until they finish, then they see where they differ. |
| **Report** | Funders and non-experts | A plain-language summary and one row per claim, with a dot for every assessor's conclusion. A funding map and a ranked list show where to settle a disagreement, where to fund a replication and where to explore. Each claim has a detail page showing how the evidence moved the panel and what moved it. |
| **Method** | Everyone | How to read the numbers, how the panel is summarised, the design choices, and how to run a jam. |

## Running it with real people

1. Write the team's claims and evidence in **Assess**, or start a blank inquiry from **Data**.
2. In **Data**, turn off the illustrative panel.
3. Each assessor rates on their own device, then uses **Export my ratings** and sends the file (or the copied text) to the facilitator.
4. The facilitator uses **Data → Import** to load every file. The report now reflects the real panel.

File formats are plain JSON: `credence.ratings.v1` (one assessor) and `credence.inquiry.v1` (claims, evidence and all ratings).

## The maths, briefly

Credence is kept in decibans (dB = 10 · log10 odds), the unit the existing Bycelium prototypes use. Evidence multiplies odds, so in decibans it adds:

```
conclusion = starting belief + Σ (strength if true × trust)
```

The panel is summarised by its median and its middle half (interquartile range). A claim is *contested* when the middle half is wider than 20%–80% (12 dB). It is *open* when assessors agree and the median sits between 25% and 75%. The *most disputed evidence* is the finding whose weighting varies most (10th–90th percentile). A finding is *worth replicating* when it would count as at least moderate if true but the panel's median trust is doubtful or lower.

## Sample data

The sample inquiry asks what drives Alzheimer's disease and whether clearing amyloid will treat it. It contains 5 claims and 30 pieces of evidence from real published studies, linked to PubMed. These include the 2006 Aβ*56 paper retracted in 2024, the lecanemab and donanemab trials, and the 2025 VALAD valacyclovir trial. **The 20 assessors and their ratings are fictional**. They are generated deterministically in `js/model.js` from the parameters in `js/sample-data.js`, to show how a real panel would read.

## Files

```
index.html            app shell
css/app.css           design tokens (light and dark) and all styles
js/sample-data.js     sample inquiry and panel generator parameters
js/model.js           maths, state, storage, aggregation, import/export
js/charts.js          hand-built SVG charts (no libraries)
js/assess.js          Assess view
js/report.js          Report view
js/method.js          Method view
js/app.js             routing, header, Data menu, editors, modal, tooltip
tools/build-single.js builds dist/credence.html
docs/design-rationale.md  why the interface works the way it does
```

## Known limits

- Ratings move between people as files; a shared live panel needs a small backend.
- Trust is a single weight per finding. The existing evidence diagrams treat each premise as a claim with its own credibility, which is richer.
- No scoring of assessors yet (the manifesto's contribution, expertise and inquiry scores).
- Downloads are blocked when the page is viewed as a claude.ai artifact; use **Copy** there.
