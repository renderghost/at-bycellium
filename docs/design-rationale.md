# Credence: design rationale

This note explains why the Credence prototype works the way it does. It is written for the Bycelium team and for anyone reviewing the proposal before the January science jam.

## 1. What the current evidence prototype gets right, and where it struggles

The maths underneath evidence.bycelium.com is sound and worth keeping. It does three things well:
- it scores credence in decibans, so evidence adds up;
- it grades strength from anecdotal to decisive;
- it weights each finding by how credible its premise is.

The difficulties are in the presentation:

| Issue | Effect on users |
|---|---|
| The chart reads bottom-up: the starting belief is at the foot and the conclusion at the top. | People read top-down, so they have to reverse their reading order before anything makes sense. |
| Every value is a range (for example "0.01%–9%"), drawn as overlapping parallelograms. | It is hard to get a single answer to "how likely is this?", and the shapes need a legend before they mean anything. |
| It models one assessor. | There is no way to see whether 20 experts agree, which is the social core of the endorsement idea and the main purpose of a jam. |
| Terms are internal: dBan, dissonance, premise, "weight ≈ 69.4%". | Experts outside the project and every funder stall on vocabulary. |
| Red versus green carries meaning. | About 1 in 12 men cannot reliably tell them apart. |
| There is no decision layer. | A funder can't tell what to do next. |

The old market demo (demo.bycelium.com) showed the social dynamics well: followers, evidence and payouts. It also showed that stakes and euros make the picture harder for non-experts. Credence leaves money out of the first version.

## 2. Two users, two jobs

- **Assessors** (the brief calls them reviewers) are experts giving judgements. Their job: *record what I believe and why, quickly, without being anchored by others, then see where I differ.*
- **Funders** are non-experts making decisions. Their job: *understand what the field believes, how solid that is, and where money would change the most minds.*

The manifesto calls the expert act *endorsing*, and it deliberately positions itself against peer review. "Reviewer" echoes the system it criticises, so the prototype says **assessor**. Change it if the jam uses another term.

## 3. How the manifesto's ideas map onto the interface

| Manifesto idea | In Credence |
|---|---|
| Endorsement of a hypothesis (its current credibility) | Step 1: *Before weighing the evidence, how likely is this claim?* |
| Endorsement of evidence (how far it should shift belief) | Step 2: *If this finding holds, what does it do to the claim? How far do you trust it?* |
| Scientific progress is the aggregated shift of credibility caused by evidence | Report → *How the evidence moved the panel*: each assessor's line from start to conclusion, plus whether the panel converged or split |
| Strong-link science: quality over quantity | The report ranks evidence by how much it moved the panel, not by how many papers there are |
| Fund contributions, not proposals | *Where funding would change minds*: settle a disagreement, replicate a doubted but important finding, or explore an open question |

## 4. Design principles

1. **Words first, maths underneath.** Every number comes with a calibrated word (IPCC scale) and a natural frequency ("about 1 in 4"). Decibans appear only on the Method page.
2. **One answer per person; uncertainty comes from the crowd.** Assessors give a single point. Disagreement is shown as the spread of the panel, which is far easier to read than one person's range.
3. **Read in the order you reason.** The belief path runs top to bottom: start, each finding, conclusion.
4. **Blind first, then compare.** A claim's panel results stay hidden until the expert submits their own assessment of it. This protects the judgements from anchoring and herding, the failure mode the market demo dramatised with its "followers".
5. **Every chart answers a decision question.** The dot strips answer "do experts agree?", the funding map answers "where should money go?", and the impact bars answer "what is the view resting on?"
6. **Accessible by default.** Blue supports, orange opposes; every colour has a label. Designed for desktop first; works in dark mode. Charts have table views.

## 5. Key interactions

- **Strength scale.** A 13-step diverging control from *decisive opposition* to *decisive support*. It fills outward from the centre, so its shape matches its meaning. A live sentence translates the choice: "Strong support. If it holds, it multiplies the odds by about 16."
- **Trust.** Four plain options (not at all, doubtful, mostly, fully), so a strong finding the assessor doubts counts for less. This simplifies the existing premise-credibility weighting.
- **Belief path.** It updates on every click and connects to the evidence cards when hovered.
- **Where you differ most.** After the reveal, the three findings where the assessor's weighting departs most from the panel are listed. At a jam, discussion starts there.
- **Outline and fill bars** in the report. The outline shows how much a finding would count if fully trusted; the fill shows how much it counts today. A large gap (for example the retracted Aβ*56 paper) flags a finding worth replicating.

## 6. Page architecture

- **Top bar:** a persona switch (Expert / Funder), plus Method and Data.
- **Questions (home):** what Credence is, a choice of view, and the list of questions. Only the Alzheimer's question is live; four examples show the life of a question, from drafting claims to a published report.
- **Question:** an overview, then tabs. *Claims* prompts experts to assess and shows funders each claim's panel result. *Panel* lists every assessor. *Report* (funders only) holds the summary, the funding map and the ranked opportunities.
- **Assessment:** a full-screen form that asks one thing per screen: starting belief, each piece of evidence, then a review. A live belief path stays alongside.
- **Claim:** for funders, and for experts once they have submitted, it shows the panel result, how the evidence moved the panel, what moved it, and every individual assessment with notes.
- **Assessor profile:** expertise, links (ORCID, Bluesky, Google Scholar), declared interests, and how they assessed each claim.

**Gating, as built:** an expert sees a claim's panel results only after submitting their own assessment of that claim. Profiles open after their first submitted assessment. Within a profile, results for claims the expert hasn't assessed stay hidden. This keeps each judgement blind.

## 7. Questions for Mathis (founder, Bycelium)

1. **Who should add claims and evidence?** In the prototype, experts and funders both can. Alternatives: experts only; the question's organiser; or anyone, with a moderation step.
2. **When should the panel open to an expert?** Claim by claim (as built), or only once every claim on the question is assessed?
3. **How are profiles verified?** Signing in with ORCID would confirm identity and pull in publications.
4. **Named or anonymous?** Should funders see who said what, or disciplines only?
5. **Units.** Should the expert-facing scale stay in plain bands, or do they want decibans visible to assessors?
6. **Premises.** The existing diagrams treat each premise as a claim with its own credence. Is a single trust rating per finding acceptable for the jam?
7. **Scoring.** The manifesto proposes contribution, expertise and inquiry scores. Should the jam show any scoring, or is the panel view enough for a first test?
8. **Live data.** File export and import is enough for a facilitated jam. A shared live panel needs a small backend; is that wanted for January?

## 8. Suggested next steps before January

1. Run the prototype with three or four academics on the sample inquiry, and note where they hesitate.
2. Agree the jam's field and pre-load real claims and evidence.
3. Decide on live sync (question 8) and identity (question 4).
4. Add a short facilitator script around the "most disputed evidence" discussion.
