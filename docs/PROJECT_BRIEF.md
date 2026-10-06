# Camping Recommend System — Project Brief for Applications

## Research question

How can a system help campers make decisions when campsite information is fragmented, incomplete and potentially outdated?

## What I built

- A nationwide campsite database covering 11,000+ Amap POIs.
- A field-level evidence model instead of treating imported values as unquestioned truth.
- A deterministic reliability score based on source, recency, completeness, community confirmation and consistency.
- A MongoDB geospatial and explainable recommendation engine.
- A bilingual rule-based amenity extraction baseline with a labeled evaluation set.
- A community correction workflow that preserves conflicting claims.
- A budget-aware active verification planner using greedy submodular optimization to decide which records humans should check first.
- A live data-quality dashboard and public JSON endpoints.

## What makes it more than a directory

The central technical contribution is not the webpage. It is the pipeline that represents uncertainty, retrieves geographically relevant candidates, ranks them with multiple signals, and allocates limited human verification effort across a nationwide database. Both recommendations and verification priorities expose their reasons.

## Honest limitations

The system is an MVP and research platform, not a mature booking business. It does not claim that all POIs are operating campsites, that reference cost equals an overnight rate, or that inferred amenities have been verified.
