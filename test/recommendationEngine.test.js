const test = require('node:test');
const assert = require('node:assert/strict');
const { haversineDistanceKm, scoreCampground, rankCampgrounds } = require('../services/recommendationEngine');

test('haversine distance returns realistic distance', () => {
  const distance = haversineDistanceKm([121.47, 31.23], [120.16, 30.27]);
  assert.ok(distance > 150 && distance < 200);
});

test('matching amenities and reliable data improve recommendation', () => {
  const base = { geometry: { coordinates: [121.5, 31.2] }, price: 100, type: '森林营地', sourceRating: 4.5 };
  const preferences = { origin: [121.47, 31.23], radiusKm: 200, maxPrice: 200, amenities: ['淋浴'], types: ['森林营地'] };
  const strong = scoreCampground({ ...base, amenities: ['淋浴'], reliability: { score: 85 } }, preferences);
  const weak = scoreCampground({ ...base, amenities: [], reliability: { score: 20 } }, preferences);
  assert.ok(strong.score > weak.score);
  assert.ok(strong.explanations.some(item => item.code === 'amenity_match'));
});

test('ranking is deterministic by score', () => {
  const preferences = { origin: [120, 30], radiusKm: 300, amenities: [], types: [] };
  const ranked = rankCampgrounds([
    { _id: 'weak', geometry: { coordinates: [122, 32] }, amenities: [], reliability: { score: 20 } },
    { _id: 'strong', geometry: { coordinates: [120.1, 30.1] }, amenities: [], reliability: { score: 90 } }
  ], preferences);
  assert.equal(ranked[0].campground._id, 'strong');
});

test('recommendation includes factual bilingual natural-language explanations', () => {
  const preferences = { origin: [121.47, 31.23], radiusKm: 200, maxPrice: 200, amenities: ['淋浴'], types: ['森林营地'] };
  const recommendation = scoreCampground({
    geometry: { coordinates: [121.5, 31.2] },
    price: 150,
    amenities: ['淋浴'],
    inferredAmenities: [],
    type: '森林营地',
    reliability: { score: 82 },
    operationalStatus: 'open',
    sourceRating: 4.7
  }, preferences);
  assert.match(recommendation.narrative.zh, /距离出发地约/);
  assert.match(recommendation.narrative.zh, /预算内/);
  assert.match(recommendation.narrative.zh, /信息可信度为 82\/100/);
  assert.match(recommendation.narrative.en, /within your ¥200 budget/);
  assert.match(recommendation.narrative.en, /forest campsite type/);
  assert.doesNotMatch(recommendation.narrative.en, /森林营地|淋浴/);
});
