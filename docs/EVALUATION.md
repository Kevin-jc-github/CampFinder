# Evaluation Plan

CampFinder separates product metrics from algorithm metrics.

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
2. Compare CampFinder ordering with a distance-only baseline.
3. Report NDCG@5 and pairwise preference accuracy.
4. Run an ablation study removing reliability, distance and amenity signals one at a time.
5. Measure median time to find an acceptable campsite with and without CampFinder.

## Data-quality outcomes

The quality dashboard tracks:

- mean and distribution of reliability scores;
- phone and structured-amenity coverage;
- source distribution;
- unresolved community reports;
- records prioritized for verification.

These are useful because a larger database is not automatically a better database.
