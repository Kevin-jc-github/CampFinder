<div align="center">

# CampFinder China

### An evidence-aware campsite discovery and recommendation system for China

面向中国露营场景的真实数据采集、可信度建模、地理空间推荐与主动核验系统

[![Node.js](https://img.shields.io/badge/Node.js-18.18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-2dsphere-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/tests-23%20passing-2f855a)](#evaluation)
[![License](https://img.shields.io/badge/code%20license-MIT-blue.svg)](LICENSE)

[Why CampFinder?](#why-campfinder) · [Architecture](#system-architecture) · [Algorithms](#algorithmic-design) · [Quick start](#quick-start) · [API](#json-api) · [中文简介](#中文简介)

</div>

## Overview

CampFinder is not only a campsite directory. It is a full-stack system for making decisions from location data that may be incomplete, stale, or contradictory.

The system collects real campsite-related POIs across China, preserves field-level provenance, calculates an explainable reliability score, retrieves nearby candidates through geospatial indexing, ranks them against a camper's constraints, and determines which records should be verified first when human review capacity is limited.

The current local research snapshot contains **11,417 Amap POIs across 382 cities with results**. Raw third-party data is not committed to this repository; the reproducible ingestion and processing pipeline is.

## Why CampFinder?

Campsite information in China is commonly distributed across map applications, social platforms, official accounts, and individual travel posts. A traveller may find a location but still be unable to answer practical questions:

- Is the campsite still operating?
- Is the listed price current and does it represent an overnight stay?
- Are toilets, showers, electricity, parking, or mobile signal actually available?
- Are two conflicting claims equally trustworthy?
- Which nearby campsite best matches the trip rather than merely having the highest rating?

CampFinder treats this as an information-quality and decision-support problem. Instead of assuming that every database field is true, it models where a claim came from, how recent it is, whether other evidence agrees, and what remains unknown.

## What makes it different

- **Evidence-aware data model** — current listing data, source evidence, machine inference, and community reports are stored separately.
- **Explainable reliability scoring** — every `0–100` trust score is decomposed into source, recency, completeness, community, and consistency components.
- **Geospatial recommendation** — MongoDB candidate retrieval and multi-signal ranking combine distance with budget, amenities, campsite type, reliability, and rating.
- **Active verification planning** — a greedy submodular-style planner allocates a limited verification budget across high-risk records, cities, provinces, and failure modes.
- **Conservative information extraction** — bilingual rules identify campsite amenities while handling common negations and keeping inferred values separate from confirmed facts.
- **Reproducible evaluation** — deterministic algorithms, versioned outputs, unit tests, synthetic baselines, and explicit limitations.

## System architecture

```text
Amap POI / owner listing / community field report
                         │
                         ▼
        ingestion · validation · normalization · upsert
                         │
                         ▼
        field-level evidence and provenance records
                         │
                         ▼
            explainable reliability: trust-v1
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
 geospatial recommendation   active verification planning
      recommend-v1                 verify-plan-v1
              │                     │
              └──────────┬──────────┘
                         ▼
              bilingual web UI + JSON API
```

The three main collections intentionally represent different concepts:

| Collection | Responsibility |
| --- | --- |
| `Campground` | Current product-facing listing, coordinates, confirmed and inferred amenities, and materialized reliability |
| `Evidence` | Source, capture time, field-level claims, confidence, licensing note, and evidence lifecycle |
| `FieldReport` | A dated community observation that can support or dispute existing information without silently overwriting it |

More detail is available in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Algorithmic design

### 1. Explainable reliability scoring

`trust-v1` calculates a deterministic information-reliability score:

| Component | Maximum | Purpose |
| --- | ---: | --- |
| Source strength | 25 | Weigh owner and community evidence above a single imported source |
| Recency | 25 | Apply a stepwise decay to older observations |
| Completeness | 25 | Reward useful fields such as phone, hours, price, photos, and amenities |
| Community confirmation | 15 | Distinguish accepted confirmations from pending reports |
| Cross-source consistency | 10 | Penalize conflicting claims and unresolved corrections |

```text
Trust(c) = Source(c) + Recency(c) + Completeness(c)
         + Community(c) + Consistency(c)
```

The score estimates how much supporting information CampFinder has. It is **not** a physical-safety guarantee.

Implementation: [services/reliabilityEngine.js](services/reliabilityEngine.js)

### 2. Geospatial and multi-objective recommendation

Recommendations use a two-stage process:

1. A MongoDB `2dsphere` index and `$near` query retrieve up to 300 candidates inside the requested radius.
2. `recommend-v1` ranks those candidates using normalized, interpretable signals.

| Signal | Weight |
| --- | ---: |
| Distance | 25% |
| Amenity match | 20% |
| Reliability | 20% |
| Budget fit | 15% |
| Campsite type | 10% |
| Source rating | 10% |

Distance is computed with the Haversine formula. Each result retains its component breakdown and explanation codes such as `nearby`, `within_budget`, `amenity_match`, and `high_reliability`.

Implementation: [services/recommendationEngine.js](services/recommendationEngine.js)

### 3. Bilingual amenity extraction

`amenity-rules-v1` converts unstructured Chinese or English descriptions into candidate amenities. It supports explicit positive phrases and common negations such as “没有淋浴” or “no shower”.

Inferred amenities include their evidence text, confidence, and model version and are stored separately from confirmed amenities. This prevents a machine-generated guess from being presented as verified information.

Implementation: [services/amenityExtractor.js](services/amenityExtractor.js)

### 4. Active verification planning

When only `k` records can be checked by people, sorting by lowest trust may spend the entire budget on similar records from one dense city. `verify-plan-v1` first calculates verification risk from:

```text
Risk(c) = 30 × uncertainty
        + 20 × staleness
        + 25 × critical-field gaps
        + 15 × conflicting reports
        + 10 × unknown operating status
```

It then greedily maximizes a coverage-aware objective:

```text
F(S) = Σ risk(i)
     + λp Σ √(selected count by province)
     + λc Σ √(selected count by city)
     + λf Σ √(selected count by primary failure mode)
```

The square-root terms create diminishing returns: selecting the first record from a city adds more coverage value than selecting the tenth similar record from that city. The objective is monotone and submodular under a cardinality constraint, giving the standard greedy algorithm its classic `1 - 1/e` approximation guarantee.

The implementation runs in `O(nk)` time and `O(n)` memory. With 11,417 records and a verification budget of 20, the local development API responds in approximately 0.2 seconds.

Implementation: [services/verificationPlanner.js](services/verificationPlanner.js)

## Evaluation

Run the complete deterministic evaluation:

```bash
npm test
npm run evaluate
```

Current checked-in results:

| Evaluation | Result |
| --- | ---: |
| Automated tests | 23 / 23 passing |
| Amenity extraction precision | 1.00 |
| Amenity extraction recall | 0.905 |
| Amenity extraction F1 | 0.95 |
| Recommendation sanity margin | 84 points |

The amenity result uses a deliberately small 15-example bilingual dataset. It validates the evaluation pipeline, not broad generalization.

On the current 11,417-record local snapshot, both verification strategies were given 20 selections:

| Strategy | Cities covered | Province-level regions | Average information risk |
| --- | ---: | ---: | ---: |
| Risk-only sorting | 1 | 1 | 41.1 |
| Coverage-aware greedy planning | 20 | 20 | 41.1 |

The coverage-aware method expanded geographic coverage without reducing average selected risk in this snapshot. See [docs/EVALUATION.md](docs/EVALUATION.md) for methodology and limitations.

## Product capabilities

- Search, filtering, pagination, and sorting by keyword, province, campsite type, amenity, and price
- Chinese address structure, RMB pricing, opening season, capacity, phone, WeChat, and booking links
- Amap JavaScript maps and server-side geocoding
- Responsive Chinese/English interface with session-level language switching
- Registration, authentication, author permissions, reviews, and local multi-image uploads
- Community field reports for opening status, location, contact, hours, price, amenities, and safety concerns
- Data-quality dashboard with reliability distribution, source coverage, unresolved issues, and algorithmic verification priorities
- Public JSON endpoints for recommendation, trust evidence, and verification planning

## Quick start

### Requirements

- Node.js `18.18+`
- MongoDB
- An Amap browser key for maps
- An Amap Web Service key for geocoding and POI import

### Installation

```bash
git clone https://github.com/Kevin-jc-github/CampFinder.git
cd CampFinder
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3100](http://localhost:3100).

The application can run without Amap credentials, but maps, geocoding, and real-data import will be unavailable.

### Environment variables

```env
PORT=3100
MONGO_URL=mongodb://127.0.0.1:27017/campfinder-cn
SESSION_SECRET=replace-with-at-least-32-random-characters
USE_MONGO_SESSION=false

AMAP_JS_KEY=
AMAP_SECURITY_JS_CODE=
AMAP_WEB_SERVICE_KEY=
```

Never commit `.env`. Browser keys, Web Service keys, and GitHub credentials must be managed outside the repository.

## Loading data

### Small local demonstration dataset

```bash
npm run seed
```

> [!WARNING]
> `npm run seed` deletes all existing campgrounds and reviews from the configured database before inserting eight demonstration records. Use a separate development database.

The demonstration account is `campfinder_demo`. Its development password defaults to `CampFinder2026!` and can be overridden with `SEED_PASSWORD`.

### Selected-city Amap import

```bash
npm run import:amap
```

### Nationwide Amap import

```bash
npm run import:amap:all
```

Nationwide progress is checkpointed in `.cache/amap-import-progress.json`. Re-running the command resumes completed-city progress. Requests include delay, retry, timeout, quota detection, and idempotent bulk upsert behavior.

Optional controls:

```env
AMAP_IMPORT_DELAY_MS=180
AMAP_IMPORT_MAX_PAGES=40
AMAP_IMPORT_CITY_LIMIT=0
SEED_PASSWORD=replace-for-local-demo
```

After import, the script derives operating status, creates source evidence, recalculates reliability, and extracts inferred amenities.

## JSON API

### Explainable recommendation

```http
GET /api/v1/recommendations?lng=121.47&lat=31.23&radiusKm=200&maxPrice=200&types=森林营地&amenities=淋浴
```

Returns ranked campsites with distance, trust score, component breakdown, and explanation codes.

### Campground trust evidence

```http
GET /api/v1/campgrounds/:id/trust
```

Returns the materialized trust score, supporting sources, field coverage, and non-rejected community reports.

### Verification plan

```http
GET /api/v1/verification-plan?limit=20
```

Returns a coverage-aware verification batch with base risk, missing fields, reason contributions, and marginal diversity bonuses.

API routes are rate-limited to 120 requests per 15 minutes per client.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the server with Node watch mode |
| `npm start` | Start the server normally |
| `npm test` | Run all Node test suites |
| `npm run evaluate` | Run algorithm baselines and metrics |
| `npm run check` | Run JavaScript syntax checks |
| `npm run seed` | Replace local campsite/review data with eight demo records |
| `npm run import:amap` | Import selected cities and run post-processing |
| `npm run import:amap:all` | Resume nationwide import and post-processing |
| `npm run migrate:trust` | Materialize source evidence and trust scores |
| `npm run extract:amenities` | Re-run amenity inference |
| `npm run derive:status` | Recompute operational status labels |

## Repository structure

```text
CampFinder/
├── config/          # i18n and upload configuration
├── controllers/     # web and API request handlers
├── data/evaluation/ # checked-in labeled evaluation examples
├── docs/            # architecture, evaluation, and project notes
├── models/          # MongoDB schemas and indexes
├── public/          # responsive styles and browser scripts
├── routes/          # Express route definitions
├── scripts/         # migration, extraction, status, and evaluation jobs
├── seeds/           # demo seeding and resumable Amap ingestion
├── services/        # pure algorithm and domain-service modules
├── test/            # Node test suites
└── views/           # bilingual EJS templates
```

## Known limitations

- Amap text search can cap retrievable POIs in dense cities.
- A POI reference cost is not necessarily an overnight campsite price.
- Imported records are real POIs but are not automatically verified by CampFinder.
- Recommendation weights are explicit product hypotheses, not parameters learned from large-scale user behavior.
- Haversine distance approximates proximity; it does not represent driving time or route accessibility.
- The amenity evaluation set is too small for generalization claims.
- Community reports need a complete moderator workflow before production deployment.
- Local image storage is suitable for a single-instance MVP, not a horizontally scaled service.

## Roadmap

- Collect a larger double-annotated amenity dataset and report inter-annotator agreement
- Evaluate recommendation quality with user-ranked candidate sets, NDCG@5, and ablation studies
- Add routing-based travel time, weather, fire restrictions, and temporary-closure alerts
- Build owner claiming and evidence moderation workflows
- Move media to object storage with content review and image processing
- Add favourites, trip planning, and privacy-preserving usage signals

## Data and licensing

The source code is available under the [MIT License](LICENSE).

Amap-derived data is **not** covered by the MIT code license. Anyone operating or distributing an imported dataset must independently comply with Amap's API, display, storage, attribution, and commercial-use terms. CampFinder does not claim that every imported POI is an operating campsite or that third-party values have been verified.

## Contributing

Issues and pull requests are welcome. For algorithm changes, please include:

1. the problem or failure case being addressed;
2. a deterministic test or evaluation example;
3. comparison with the current baseline;
4. any new assumptions, data requirements, or user-safety implications.

This keeps the project focused on measurable improvements rather than feature accumulation.

## 中文简介

CampFinder 是一个面向中国露营场景的信息可信发现系统。它不仅提供营地搜索与地图展示，还把数据来源、更新时间、字段完整度和用户纠错建模为证据，通过可解释的可信度评分与地理空间推荐帮助用户决策；同时使用带边际收益递减的贪心规划算法，在人工核验资源有限时优先覆盖高风险且具有代表性的地区。

项目的重点是处理真实世界中的不完整信息，而不是单纯完成一个营地增删改查网站。
