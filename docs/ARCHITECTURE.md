# Camping Recommend System Architecture

Camping Recommend System is organized around the uncertainty of campsite information rather than around CRUD pages.

```text
Amap / owner listing / community observation
                    │
                    ▼
             Evidence collection
       source, timestamp, claims, confidence
                    │
                    ▼
            Reliability engine v1
 source + recency + completeness + community + consistency
          ┌─────────┴─────────┐
          ▼                   ▼
 Active verification      User discovery
 risk + diverse coverage       │
                              ▼
       MongoDB geospatial candidate retrieval
                    │
                    ▼
          Recommendation engine v1
 distance + budget + amenities + type + trust + rating
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      Web product          JSON API
```

## Core collections

### Campground

Stores the current product-facing representation, geographic point, confirmed amenities, inferred amenities, and the latest materialized reliability score.

### Evidence

Stores where information came from. Each record contains a source type, external or internal source identifier, timestamp, field-level claims, confidence and lifecycle status.

### FieldReport

Stores a user's dated observation. A report is not allowed to silently overwrite an Amap or owner claim. It remains visible as evidence and affects reliability according to moderation status.

## Reliability score

`trust-v1` is a deterministic, explainable 0–100 score:

| Component | Maximum | Purpose |
| --- | ---: | --- |
| Source strength | 25 | Owner and community evidence are weighted above an imported POI |
| Recency | 25 | Recent observations decay less than stale records |
| Completeness | 25 | Rewards useful fields such as phone, hours, price and photos |
| Community confirmation | 15 | Accepted confirmations count more than pending reports |
| Cross-source consistency | 10 | Penalizes conflicting field claims and open corrections |

The score is not a statement that a campsite is safe. It represents how much supporting information Camping Recommend System currently has.

## Recommendation score

`recommend-v1` retrieves nearby candidates with MongoDB's 2dsphere index and ranks them with:

| Signal | Weight |
| --- | ---: |
| Distance | 25% |
| Amenity match | 20% |
| Reliability | 20% |
| Budget | 15% |
| Camp type | 10% |
| Source rating | 10% |

Every result retains its component breakdown and explanation codes. A deterministic bilingual narrative generator converts the same signals into readable sentences, including relevant trade-offs such as missing prices or unconfirmed operating status. It does not call a language model, so every statement can be traced back to the ranking input. This enables evaluation and avoids a black-box “recommended for you” label.

## Information extraction

`amenity-rules-v1` is a conservative bilingual rule baseline. It handles explicit positive phrases and common negations. Extracted fields are stored in `inferredAmenities`, not in the confirmed `amenities` field.

## Active verification planning

`verify-plan-v1` answers a resource-allocation question: if the team can verify only `k` listings, which batch should it choose?

Each listing first receives a verification-risk score from five interpretable signals:

| Signal | Weight | Meaning |
| --- | ---: | --- |
| Low evidence confidence | 30% | Prioritizes records the trust model knows least about |
| Staleness | 20% | Prioritizes information likely to have changed |
| Missing critical fields | 25% | Phone, hours, price, photos, amenities and coordinates |
| Conflicting reports | 15% | Prioritizes unresolved or cross-source disagreement |
| Unknown operating status | 10% | Reduces the chance of recommending a non-operating site |

Sorting only by risk can spend an entire fieldwork budget on near-duplicate records from one dense city. The planner instead greedily maximizes:

```text
F(S) = sum(risk(i))
     + lambdaProvince * sum(sqrt(count by province))
     + lambdaCity * sum(sqrt(count by city))
     + lambdaFailure * sum(sqrt(count by primary failure mode))
```

The square-root terms have diminishing returns. The first selected record from a new city is valuable, while the twentieth similar record adds much less coverage. This is a monotone submodular objective under a cardinality constraint, so the standard greedy algorithm provides the classic `1 - 1/e` approximation guarantee. The output exposes base risk, marginal coverage bonuses and reason codes rather than hiding selection behind an opaque score.

For `n` candidate listings and a verification budget of `k`, the current exact greedy implementation runs in `O(nk)` time and `O(n)` memory. With 11,417 records and `k = 20`, the local API completes in roughly 0.2 seconds; indexing or lazy-greedy optimization can be added if the database grows by orders of magnitude.

## API

- `GET /api/v1/recommendations?lng=121.47&lat=31.23&radiusKm=200&maxPrice=200&types=森林营地`
- `GET /api/v1/verification-plan?limit=20`
- `GET /api/v1/campgrounds/:id/trust`

## Known limitations

- Amap text search may cap dense cities at approximately 200 retrievable POIs.
- Reference cost is not necessarily an overnight price.
- The amenity evaluation set is intentionally small and must be expanded before making research claims.
- Driving time is approximated by geodesic distance in ranking; a routing API is a future improvement.
- Listings whose source text explicitly says “temporarily closed” or “closed” are excluded from recommendations, but source status can still be incomplete.
- Community reports currently need a full moderation interface before production use.
- Verification priority estimates information value; it does not estimate physical safety or replace human review.
