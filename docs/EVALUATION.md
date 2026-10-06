# Evaluation Plan

Camping Recommend System separates product metrics from algorithm metrics.

## Reproducible commands

```bash
npm test
npm run evaluate
npm run migrate:trust
npm run extract:amenities
```

## Current baseline

The small checked-in amenity dataset contains positive, negative and bilingual examples. On 2026-10-06, `amenity-rules-v1` produced:

- Precision: 1.00
- Recall: 0.905
- F1: 0.95
- Dataset size: 15 examples

This result demonstrates the evaluation pipeline, not generalization. The next meaningful milestone is a manually labeled sample of at least 300 real campsite descriptions with inter-annotator agreement.

## Planned recommendation evaluation

1. Ask campers to provide a trip scenario and independently rank five candidates.
2. Compare Camping Recommend System ordering with a distance-only baseline.
3. Report NDCG@5 and pairwise preference accuracy.
4. Run an ablation study removing reliability, distance and amenity signals one at a time.
5. Measure median time to find an acceptable campsite with and without Camping Recommend System.

## Verification-planning baseline

The active verification planner is compared with a naive baseline that simply chooses the `k` highest-risk records. The checked-in synthetic scenario intentionally contains several near-duplicate high-risk records in one city. For the same three verification slots, the evaluation reports:

- average selected information risk;
- distinct city and province coverage;
- primary failure-mode coverage;
- risk retention compared with risk-only sorting.

The test passes only when the coverage-aware planner reaches more cities while keeping average risk within five points of the risk-only baseline. This small controlled scenario tests the intended behavior; a production evaluation should additionally measure how many selected verifications result in material data corrections.

On the current 11,417-record local dataset with a budget of 20 verifications:

| Strategy | Cities | Province-level regions | Average information risk |
| --- | ---: | ---: | ---: |
| Risk-only sorting | 1 | 1 | 41.1 |
| Coverage-aware greedy planning | 20 | 20 | 41.1 |

Many imported records currently have identical risk because they share the same source and missing fields. Risk-only sorting therefore chooses an arbitrary geographic cluster, while diminishing-return coverage uses the same budget across the country without reducing average risk. This is a snapshot of the local database, not a claim that the same gain will hold after more community evidence arrives.

## Data-quality outcomes

The quality dashboard tracks:

- mean and distribution of reliability scores;
- phone and structured-amenity coverage;
- source distribution;
- unresolved community reports;
- records prioritized by the active verification planner.

These are useful because a larger database is not automatically a better database.
