# CampFinder Architecture

CampFinder is organized around the uncertainty of campsite information rather than around CRUD pages.

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
                    │
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

The score is not a statement that a campsite is safe. It represents how much supporting information CampFinder currently has.

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

Every result retains its component breakdown and explanation codes. This enables evaluation and avoids a black-box “recommended for you” label.

## Information extraction

`amenity-rules-v1` is a conservative bilingual rule baseline. It handles explicit positive phrases and common negations. Extracted fields are stored in `inferredAmenities`, not in the confirmed `amenities` field.

## API

- `GET /api/v1/recommendations?lng=121.47&lat=31.23&radiusKm=200&maxPrice=200&types=森林营地`
- `GET /api/v1/campgrounds/:id/trust`

## Known limitations

- Amap text search may cap dense cities at approximately 200 retrievable POIs.
- Reference cost is not necessarily an overnight price.
- The amenity evaluation set is intentionally small and must be expanded before making research claims.
- Driving time is approximated by geodesic distance in ranking; a routing API is a future improvement.
- Listings whose source text explicitly says “temporarily closed” or “closed” are excluded from recommendations, but source status can still be incomplete.
- Community reports currently need a full moderation interface before production use.
