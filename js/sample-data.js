/*
 * Sample inquiry for the Credence prototype.
 *
 * The claims and evidence summaries describe real, published studies.
 * The assessors and their ratings are FICTIONAL: they are generated from the
 * parameters at the bottom of this file to show how a real panel might look.
 */
(function () {
  const C = (window.C = window.C || {});

  const pm = (term) => 'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(term);

  const inquiry = {
    id: 'alz-amyloid',
    sample: true,
    field: 'Neurodegeneration · Life sciences',
    title: 'What drives Alzheimer’s disease, and will clearing amyloid treat it?',
    description:
      'Thirty years of research and most Alzheimer’s drug funding have followed the amyloid hypothesis. ' +
      'This inquiry asks a panel how credible its core claims and its main rivals are today.',
    claims: [
      {
        id: 'c1',
        title: 'Amyloid-β build-up sets Alzheimer’s in motion',
        statement:
          'Accumulation of amyloid-β in the brain is the upstream cause that triggers tau pathology, neurodegeneration and dementia (the amyloid cascade hypothesis).',
        evidence: [
          {
            id: 'c1e1',
            title: 'Every known cause of inherited early-onset Alzheimer’s alters amyloid-β',
            summary:
              'Mutations in APP, PSEN1 and PSEN2 that cause familial early-onset Alzheimer’s all change how amyloid-β is produced or processed.',
            source: { label: 'Hardy & Selkoe, Science', year: 2002, url: pm('Hardy Selkoe amyloid hypothesis of Alzheimer\'s disease progress and problems 2002') },
            kind: 'Genetics',
            status: 'Replicated',
          },
          {
            id: 'c1e2',
            title: 'An extra copy of APP in Down syndrome brings near-universal Alzheimer’s pathology',
            summary:
              'People with Down syndrome carry three copies of the APP gene. Alzheimer’s biomarker changes appear in a predictable order from around age 40, and most go on to develop dementia.',
            source: { label: 'Fortea et al., Lancet', year: 2020, url: pm('Fortea Clinical and biomarker changes of Alzheimer\'s disease in adults with Down syndrome') },
            kind: 'Cohort',
            status: 'Replicated',
          },
          {
            id: 'c1e3',
            title: 'A rare APP variant that lowers amyloid-β protects against Alzheimer’s',
            summary:
              'The Icelandic A673T variant reduces amyloid-β production (by about 40% in cell studies). Carriers are protected against Alzheimer’s and age-related cognitive decline.',
            source: { label: 'Jonsson et al., Nature', year: 2012, url: pm('Jonsson A mutation in APP protects against Alzheimer\'s disease and age-related cognitive decline') },
            kind: 'Genetics',
            status: 'Single study',
          },
          {
            id: 'c1e4',
            title: 'Many cognitively normal older people have amyloid plaques',
            summary:
              'A meta-analysis of 55 studies estimated that amyloid positivity in cognitively normal people rises from about 10% at age 50 to 44% at age 90.',
            source: { label: 'Jansen et al., JAMA', year: 2015, url: pm('Jansen Prevalence of cerebral amyloid pathology in persons without dementia meta-analysis') },
            kind: 'Meta-analysis',
            status: 'Replicated',
          },
          {
            id: 'c1e5',
            title: 'Tangles, not plaques, track cognitive impairment',
            summary:
              'Reviews of clinico-pathological studies find that the burden of tau tangles matches cognitive status more closely than amyloid plaque burden does.',
            source: { label: 'Nelson et al., J Neuropathol Exp Neurol', year: 2012, url: pm('Nelson Correlation of Alzheimer disease neuropathologic changes with cognitive status a review of the literature') },
            kind: 'Pathology',
            status: 'Replicated',
          },
          {
            id: 'c1e6',
            title: 'Blocking amyloid-β production with BACE inhibitors failed',
            summary:
              'Verubecestat cut amyloid-β levels in spinal fluid substantially but did not slow decline. Several BACE inhibitor trials were stopped, some showing early cognitive worsening.',
            source: { label: 'Egan et al., NEJM', year: 2018, url: pm('Egan Randomized Trial of Verubecestat for Mild-to-Moderate Alzheimer\'s Disease') },
            kind: 'Clinical trial',
            status: 'Replicated',
          },
          {
            id: 'c1e7',
            title: 'Antibodies that clear amyloid modestly slow decline',
            summary:
              'Lecanemab and donanemab removed most plaque and slowed decline on clinical scales by roughly a quarter to a third over 18 months in early Alzheimer’s.',
            source: { label: 'van Dyck et al., NEJM', year: 2023, url: pm('van Dyck Lecanemab in Early Alzheimer\'s Disease') },
            kind: 'Clinical trial',
            status: 'Replicated',
          },
        ],
      },
      {
        id: 'c2',
        title: 'Clearing amyloid slows decline enough to matter to patients',
        statement:
          'Anti-amyloid antibody treatment gives people with early Alzheimer’s a clinically meaningful benefit that outweighs its risks.',
        evidence: [
          {
            id: 'c2e1',
            title: 'Lecanemab: 27% slower decline over 18 months',
            summary:
              'In Clarity AD (1,795 participants), the CDR-SB dementia score worsened by 1.21 points on lecanemab and 1.66 on placebo: a 0.45-point difference.',
            source: { label: 'van Dyck et al., NEJM', year: 2023, url: pm('van Dyck Lecanemab in Early Alzheimer\'s Disease') },
            kind: 'Clinical trial',
            status: 'Single study',
          },
          {
            id: 'c2e2',
            title: 'Donanemab: about 35% slower decline in people with less tau',
            summary:
              'In TRAILBLAZER-ALZ 2, decline on the iADRS scale was 3.25 points smaller than on placebo over 76 weeks in people with low or medium tau. The benefit was smaller across all participants.',
            source: { label: 'Sims et al., JAMA', year: 2023, url: pm('Sims Donanemab in Early Symptomatic Alzheimer Disease TRAILBLAZER-ALZ 2') },
            kind: 'Clinical trial',
            status: 'Single study',
          },
          {
            id: 'c2e3',
            title: 'The benefit is smaller than common thresholds for a meaningful change',
            summary:
              'The 0.45-point CDR-SB difference is below published estimates of the smallest change patients would notice: roughly 1 point in mild cognitive impairment and more in mild dementia.',
            source: { label: 'Andrews et al., Alzheimer’s & Dementia TRCI', year: 2019, url: pm('Andrews Disease severity and minimal clinically important differences in clinical outcome assessments for Alzheimer\'s disease clinical trials') },
            kind: 'Methods',
            status: 'Contested',
          },
          {
            id: 'c2e4',
            title: 'Brain swelling and bleeding (ARIA) are common side effects',
            summary:
              'Brain swelling (ARIA-E) affected about 12.6% of people on lecanemab and 24% on donanemab. Three deaths in TRAILBLAZER-ALZ 2 were judged treatment-related.',
            source: { label: 'Sims et al., JAMA', year: 2023, url: pm('Sims Donanemab in Early Symptomatic Alzheimer Disease TRAILBLAZER-ALZ 2') },
            kind: 'Clinical trial',
            status: 'Replicated',
          },
          {
            id: 'c2e5',
            title: 'Solanezumab did not prevent decline in people with amyloid but no symptoms',
            summary:
              'The A4 study followed over 1,100 amyloid-positive, cognitively unimpaired adults for about 4.5 years. Solanezumab binds soluble amyloid-β but does not clear plaque, and showed no benefit.',
            source: { label: 'Sperling et al., NEJM', year: 2023, url: pm('Sperling Trial of Solanezumab in Preclinical Alzheimer\'s Disease') },
            kind: 'Clinical trial',
            status: 'Single study',
          },
          {
            id: 'c2e6',
            title: 'Gantenerumab missed its primary endpoints',
            summary:
              'The twin GRADUATE I and II trials showed no significant slowing of decline. The drug removed less plaque than expected.',
            source: { label: 'Bateman et al., NEJM', year: 2023, url: pm('Bateman Two Phase 3 Trials of Gantenerumab in Early Alzheimer\'s Disease') },
            kind: 'Clinical trial',
            status: 'Replicated',
          },
          {
            id: 'c2e7',
            title: 'Aducanumab’s identical twin trials disagreed',
            summary:
              'EMERGE reported slowing at high dose while ENGAGE did not. The drug received a contested accelerated approval in 2021 and was withdrawn by its maker in 2024.',
            source: { label: 'Budd Haeberlein et al., J Prev Alzheimers Dis', year: 2022, url: pm('Budd Haeberlein Two Randomized Phase 3 Studies of Aducanumab in Early Alzheimer\'s Disease') },
            kind: 'Clinical trial',
            status: 'Contested',
          },
        ],
      },
      {
        id: 'c3',
        title: 'Tau, more than amyloid, drives cognitive decline',
        statement:
          'The spread of tau tangles is the main direct driver of neurodegeneration and symptoms, so tau should predict decline better than amyloid.',
        evidence: [
          {
            id: 'c3e1',
            title: 'Tangle burden matches cognitive status better than plaques',
            summary:
              'Across clinico-pathological studies, the stage and density of tau tangles correlate with cognitive impairment more closely than amyloid plaques do.',
            source: { label: 'Nelson et al., J Neuropathol Exp Neurol', year: 2012, url: pm('Nelson Correlation of Alzheimer disease neuropathologic changes with cognitive status a review of the literature') },
            kind: 'Pathology',
            status: 'Replicated',
          },
          {
            id: 'c3e2',
            title: 'Tau PET predicts future decline better than amyloid PET or MRI',
            summary:
              'Across eight cohorts, baseline tau PET explained more of later cognitive change than amyloid PET or MRI. In amyloid-positive MCI, R² was 0.35 for tau PET and 0.17 for amyloid PET.',
            source: { label: 'Ossenkoppele et al., JAMA Neurology', year: 2021, url: pm('Ossenkoppele Accuracy of Tau Positron Emission Tomography as a Prognostic Marker in Preclinical and Prodromal Alzheimer Disease') },
            kind: 'Imaging',
            status: 'Replicated',
          },
          {
            id: 'c3e3',
            title: 'Tau mutations alone can cause dementia',
            summary:
              'Mutations in MAPT, the tau gene, cause inherited frontotemporal dementia with tau pathology and without amyloid plaques.',
            source: { label: 'Hutton et al., Nature', year: 1998, url: pm('Hutton Association of missense and 5\'-splice-site mutations in tau with the inherited dementia FTDP-17') },
            kind: 'Genetics',
            status: 'Replicated',
          },
          {
            id: 'c3e4',
            title: 'Amyloid and tau together predict decline far better than amyloid alone',
            summary:
              'Cognitively unimpaired people positive on both amyloid and tau PET declined much faster than those with amyloid only, suggesting the two act together.',
            source: { label: 'Ossenkoppele et al., Nature Medicine', year: 2022, url: pm('Amyloid and tau PET-positive cognitively unimpaired individuals are at high risk for future cognitive decline') },
            kind: 'Imaging',
            status: 'Single study',
          },
          {
            id: 'c3e5',
            title: 'An anti-tau antibody did not slow decline',
            summary:
              'In the TAURIEL phase 2 trial in prodromal to mild Alzheimer’s, semorinemab did not slow clinical decline.',
            source: { label: 'Teng et al., JAMA Neurology', year: 2022, url: pm('Teng Safety and Efficacy of Semorinemab in Individuals With Prodromal to Mild Alzheimer Disease') },
            kind: 'Clinical trial',
            status: 'Single study',
          },
        ],
      },
      {
        id: 'c4',
        title: 'Small soluble amyloid-β clumps, not plaques, do the damage',
        statement:
          'Soluble amyloid-β oligomers are the main toxic form in Alzheimer’s disease; insoluble plaques are comparatively inert.',
        evidence: [
          {
            id: 'c4e1',
            title: 'An oligomer called Aβ*56 impairs memory',
            summary:
              'Aβ*56, purified from transgenic mouse brains, impaired memory when injected into young rats. Retracted in 2024 by most of its authors after a 2022 investigation found manipulated images. The senior author still defends the finding.',
            source: { label: 'Lesné et al., Nature (retracted)', year: 2006, url: pm('Lesne A specific amyloid-beta protein assembly in the brain impairs memory') },
            kind: 'Lab / animal',
            status: 'Retracted',
          },
          {
            id: 'c4e2',
            title: 'Amyloid-β dimers from Alzheimer’s brains disrupt synapses and memory',
            summary:
              'Soluble amyloid-β dimers extracted from patients’ brains impaired synaptic plasticity and memory in rodents. Insoluble plaque cores did not, unless dissolved to release dimers.',
            source: { label: 'Shankar et al., Nature Medicine', year: 2008, url: pm('Shankar Amyloid-beta protein dimers isolated directly from Alzheimer\'s brains impair synaptic plasticity and memory') },
            kind: 'Lab / animal',
            status: 'Single study',
          },
          {
            id: 'c4e3',
            title: 'Naturally secreted oligomers block memory signalling in living animals',
            summary:
              'Low concentrations of naturally secreted amyloid-β oligomers inhibited hippocampal long-term potentiation in living rats; monomers did not.',
            source: { label: 'Walsh et al., Nature', year: 2002, url: pm('Walsh Naturally secreted oligomers of amyloid beta protein potently inhibit hippocampal long-term potentiation in vivo') },
            kind: 'Lab / animal',
            status: 'Single study',
          },
          {
            id: 'c4e4',
            title: '“Oligomer” preparations differ widely between labs',
            summary:
              'A critical review found oligomer preparations are poorly characterised, vary between labs and are often tested at unrealistic concentrations.',
            source: { label: 'Benilova, Karran & De Strooper, Nat Neurosci', year: 2012, url: pm('Benilova The toxic Abeta oligomer and Alzheimer\'s disease an emperor in need of clothes') },
            kind: 'Review',
            status: 'Replicated',
          },
          {
            id: 'c4e5',
            title: 'The most effective antibody targets soluble protofibrils',
            summary:
              'Lecanemab binds soluble amyloid-β protofibrils far more selectively than monomers, which fits soluble aggregates being a useful drug target.',
            source: { label: 'Söderberg et al., Neurotherapeutics', year: 2023, url: pm('Soderberg Lecanemab, Aducanumab, and Gantenerumab Binding Profiles to Different Forms of Amyloid-Beta') },
            kind: 'Lab / animal',
            status: 'Single study',
          },
        ],
      },
      {
        id: 'c5',
        title: 'Herpes virus infections contribute to Alzheimer’s',
        statement:
          'Infection or reactivation of herpes viruses, such as HSV-1 or varicella-zoster, is a contributing cause of Alzheimer’s disease in some people.',
        evidence: [
          {
            id: 'c5e1',
            title: 'HSV-1 DNA sits inside amyloid plaques',
            summary: 'Herpes simplex virus type 1 DNA was found located within amyloid plaques in post-mortem Alzheimer’s brains.',
            source: { label: 'Wozniak, Mee & Itzhaki, J Pathol', year: 2009, url: pm('Wozniak Mee Itzhaki Herpes simplex virus type 1 DNA is located within Alzheimer\'s disease amyloid plaques') },
            kind: 'Pathology',
            status: 'Single study',
          },
          {
            id: 'c5e2',
            title: 'Amyloid-β traps herpes viruses in mice',
            summary:
              'In mice and cell models, amyloid-β entrapped HSV-1 and protected against infection, suggesting plaques may be an antimicrobial response.',
            source: { label: 'Eimer et al., Neuron', year: 2018, url: pm('Eimer Alzheimer\'s Disease-Associated beta-Amyloid Is Rapidly Seeded by Herpesviridae to Protect against Brain Infection') },
            kind: 'Lab / animal',
            status: 'Single study',
          },
          {
            id: 'c5e3',
            title: 'Antiviral treatment linked to lower dementia risk in Taiwan',
            summary:
              'In a Taiwanese health-insurance cohort, people with HSV infections had a higher dementia risk, and those treated with antivirals had a lower risk than those who were not.',
            source: { label: 'Tzeng et al., Neurotherapeutics', year: 2018, url: pm('Tzeng Anti-herpetic Medications and Reduced Risk of Dementia in Patients with Herpes Simplex Virus Infections') },
            kind: 'Observational',
            status: 'Single study',
          },
          {
            id: 'c5e4',
            title: 'Shingles vaccination cut new dementia diagnoses by about a fifth',
            summary:
              'In Wales, eligibility for shingles vaccination depended on date of birth. People just eligible were 3.5 percentage points (about 20%) less likely to receive a new dementia diagnosis over seven years.',
            source: { label: 'Eyting et al., Nature', year: 2025, url: pm('Eyting A natural experiment on the effect of herpes zoster vaccination on dementia') },
            kind: 'Natural experiment',
            status: 'Single study',
          },
          {
            id: 'c5e5',
            title: 'A reported link with herpesvirus 6 did not replicate',
            summary:
              'A multi-cohort reanalysis found no association between human herpesvirus 6 and Alzheimer’s, failing to reproduce an earlier multi-omic report.',
            source: { label: 'Allnutt et al., Neuron', year: 2020, url: pm('Allnutt Human Herpesvirus 6 Detection in Alzheimer\'s Disease Cases and Controls across Multiple Cohorts') },
            kind: 'Cohort',
            status: 'Replication',
          },
          {
            id: 'c5e6',
            title: 'Valacyclovir did not slow early Alzheimer’s',
            summary:
              'In the VALAD trial, 120 HSV-positive people with early Alzheimer’s took valacyclovir or placebo for 78 weeks. The drug did not help, and cognitive scores worsened slightly more than on placebo.',
            source: { label: 'Devanand et al., JAMA (VALAD)', year: 2025, url: pm('Valacyclovir Treatment of Early Symptomatic Alzheimer Disease VALAD Randomized Clinical Trial') },
            kind: 'Clinical trial',
            status: 'Single study',
          },
        ],
      },
    ],
  };

  // Fictional assessors. `camp` runs from -1 (sceptical of the amyloid hypothesis) to +1 (proponent).
  const assessors = [
    { id: 's01', name: 'Amara', discipline: 'Neuropathology', camp: 0.6 },
    { id: 's02', name: 'Bastien', discipline: 'Clinical trials', camp: 0.8 },
    { id: 's03', name: 'Chen', discipline: 'Biostatistics', camp: -0.3 },
    { id: 's04', name: 'Dalia', discipline: 'Human genetics', camp: 0.7 },
    { id: 's05', name: 'Emeka', discipline: 'Neuroimaging', camp: 0.0 },
    { id: 's06', name: 'Freya', discipline: 'Virology', camp: -0.8 },
    { id: 's07', name: 'Gustavo', discipline: 'Protein biochemistry', camp: 0.4 },
    { id: 's08', name: 'Hana', discipline: 'Epidemiology', camp: -0.4 },
    { id: 's09', name: 'Ivo', discipline: 'Pharmacology', camp: 0.2 },
    { id: 's10', name: 'Jun', discipline: 'Synaptic physiology', camp: 0.5 },
    { id: 's11', name: 'Kalinda', discipline: 'Geriatric medicine', camp: -0.6 },
    { id: 's12', name: 'Luca', discipline: 'Neuroimmunology', camp: -0.5 },
    { id: 's13', name: 'Mireille', discipline: 'Cell biology', camp: 0.1 },
    { id: 's14', name: 'Nikhil', discipline: 'Neurology', camp: 0.3 },
    { id: 's15', name: 'Olufemi', discipline: 'Health economics', camp: -0.2 },
    { id: 's16', name: 'Priya', discipline: 'Molecular neuroscience', camp: 0.6 },
    { id: 's17', name: 'Quentin', discipline: 'Research integrity', camp: -0.7 },
    { id: 's18', name: 'Rosa', discipline: 'Fluid biomarkers', camp: 0.2 },
    { id: 's19', name: 'Sven', discipline: 'Systems biology', camp: -0.1 },
    { id: 's20', name: 'Tomasz', discipline: 'Neuropsychology', camp: -0.4 },
  ];

  /*
   * Generator parameters (all in decibans, dB = 10·log10(odds)).
   *   prior: mu (centre), sd (spread), k (shift per unit of camp)
   *   ev:    s (strength if true), sd, k (camp effect on strength),
   *          t (trust 0–1), tsd, kt (camp effect on trust)
   */
  const params = {
    // Contested: the amyloid camp and its sceptics read the BACE failures very differently.
    c1: {
      prior: { mu: 3, sd: 3, k: 5 },
      ev: {
        c1e1: { s: 8, sd: 2, k: 1, t: 0.95 },
        c1e2: { s: 6, sd: 2, k: 1, t: 0.9 },
        c1e3: { s: 5, sd: 2, k: 1, t: 0.8 },
        c1e4: { s: -6, sd: 2, k: 2, t: 0.9 },
        c1e5: { s: -5, sd: 2, k: 2, t: 0.9 },
        c1e6: { s: -8, sd: 3, k: 6, t: 0.85 },
        c1e7: { s: 6, sd: 2, k: 3, t: 0.75 },
      },
    },
    // Contested: the crux is whether a 0.45-point CDR-SB difference matters to patients.
    c2: {
      prior: { mu: -1, sd: 3, k: 9 },
      ev: {
        c2e1: { s: 7, sd: 2, k: 2, t: 0.85 },
        c2e2: { s: 7, sd: 2, k: 2, t: 0.85 },
        c2e3: { s: -8, sd: 3, k: 10, t: 0.75 },
        c2e4: { s: -4, sd: 2, k: 2, t: 0.95 },
        c2e5: { s: -2, sd: 2, k: 1, t: 0.9 },
        c2e6: { s: -2, sd: 2, k: 1, t: 0.9 },
        c2e7: { s: -2, sd: 2, k: 1, t: 0.5, tsd: 0.2 },
      },
    },
    // Broad consensus that tau tracks decline.
    c3: {
      prior: { mu: -1, sd: 3, k: -1.5 },
      ev: {
        c3e1: { s: 6, sd: 2, k: -0.5, t: 0.9 },
        c3e2: { s: 6, sd: 2, k: -0.5, t: 0.85 },
        c3e3: { s: 3, sd: 2, k: 0, t: 0.95 },
        c3e4: { s: -4, sd: 2, k: 1, t: 0.85 },
        c3e5: { s: -2, sd: 2, k: 0.5, t: 0.85 },
      },
    },
    // Open, and leaning on a retracted paper that would matter a lot if it held up.
    c4: {
      prior: { mu: -2, sd: 3, k: 1.5 },
      ev: {
        c4e1: { s: 12, sd: 2, k: 1, t: 0.05, tsd: 0.1 },
        c4e2: { s: 6, sd: 2, k: 1, t: 0.55, tsd: 0.2 },
        c4e3: { s: 4, sd: 2, k: 1, t: 0.7 },
        c4e4: { s: -5, sd: 2, k: 1, t: 0.8 },
        c4e5: { s: 2, sd: 2, k: 1, t: 0.6 },
      },
    },
    // Consensus leans false, but the shingles natural experiment is strong if it replicates.
    c5: {
      prior: { mu: -7, sd: 3, k: -1.5 },
      ev: {
        c5e1: { s: 3, sd: 2, k: -0.5, t: 0.55 },
        c5e2: { s: 2, sd: 2, k: -0.5, t: 0.7 },
        c5e3: { s: 3, sd: 2, k: -0.5, t: 0.4 },
        c5e4: { s: 9, sd: 3, k: -1, t: 0.35, tsd: 0.15 },
        c5e5: { s: -4, sd: 2, k: 0.5, t: 0.85 },
        c5e6: { s: -6, sd: 2, k: 0.5, t: 0.85 },
      },
    },
  };

  C.SAMPLE = { inquiry, assessors, params, seed: 20260116 };
})();
