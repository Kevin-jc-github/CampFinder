const test = require('node:test');
const assert = require('node:assert/strict');
const {
  missingCriticalFields,
  scoreVerificationNeed,
  planVerifications,
  summarizePlan,
  riskOnlyBaseline
} = require('../services/verificationPlanner');

const NOW = new Date('2026-10-06T00:00:00.000Z');

function campsite(overrides = {}) {
  return {
    _id: overrides._id || overrides.title,
    title: 'Test campsite',
    province: '北京市',
    city: '北京市',
    dataSource: 'amap',
    geometry: { coordinates: [116.4, 39.9] },
    contactPhone: '010-12345678',
    sourceBusinessHours: '09:00-18:00',
    sourceReferenceCost: 120,
    images: [{ url: 'https://example.com/camp.jpg' }],
    amenities: ['卫生间'],
    operationalStatus: 'open',
    reliability: { score: 60, components: { recency: 17 }, reasons: [], openIssueCount: 0 },
    ...overrides
  };
}

test('critical-field detection distinguishes confirmed information from missing data', () => {
  const gaps = missingCriticalFields(campsite({
    contactPhone: '',
    sourceBusinessHours: '',
    sourceReferenceCost: null,
    images: [],
    amenities: []
  }));
  assert.deepEqual(gaps, ['phone', 'hours', 'price', 'images', 'amenities']);
});

test('stale conflicting records receive higher verification risk', () => {
  const healthy = scoreVerificationNeed(campsite(), NOW);
  const risky = scoreVerificationNeed(campsite({
    contactPhone: '',
    amenities: [],
    operationalStatus: 'unknown',
    reliability: {
      score: 25,
      components: { recency: 2 },
      reasons: ['conflicting_evidence'],
      openIssueCount: 2
    }
  }), NOW);
  assert.ok(risky.baseScore > healthy.baseScore + 30);
  assert.equal(risky.reasons[0].code, 'low_trust');
  assert.ok(risky.missingFields.includes('phone'));
});

test('greedy plan preserves high risk while covering more cities than risk-only sorting', () => {
  const candidates = [
    campsite({ _id: 'bj-1', title: 'Beijing 1', reliability: { score: 10, components: { recency: 2 } } }),
    campsite({ _id: 'bj-2', title: 'Beijing 2', reliability: { score: 12, components: { recency: 2 } } }),
    campsite({ _id: 'bj-3', title: 'Beijing 3', reliability: { score: 14, components: { recency: 2 } } }),
    campsite({ _id: 'sh-1', title: 'Shanghai', province: '上海市', city: '上海市', reliability: { score: 16, components: { recency: 2 } } }),
    campsite({ _id: 'hz-1', title: 'Hangzhou', province: '浙江省', city: '杭州市', reliability: { score: 18, components: { recency: 2 } } }),
    campsite({ _id: 'cd-1', title: 'Chengdu', province: '四川省', city: '成都市', reliability: { score: 20, components: { recency: 2 } } })
  ];
  const planned = planVerifications(candidates, { limit: 3, now: NOW });
  const baseline = riskOnlyBaseline(candidates, { limit: 3, now: NOW });
  const plannedSummary = summarizePlan(planned);
  const baselineSummary = summarizePlan(baseline);

  assert.equal(planned[0].campground._id, 'bj-1');
  assert.ok(plannedSummary.cityCoverage > baselineSummary.cityCoverage);
  assert.ok(plannedSummary.averageRisk >= baselineSummary.averageRisk - 5);
});

test('planner is deterministic for identical inputs', () => {
  const candidates = [
    campsite({ _id: 'b', title: 'B' }),
    campsite({ _id: 'a', title: 'A' })
  ];
  const first = planVerifications(candidates, { limit: 2, now: NOW }).map(item => item.campground._id);
  const second = planVerifications(candidates, { limit: 2, now: NOW }).map(item => item.campground._id);
  assert.deepEqual(first, second);
  assert.deepEqual(first, ['a', 'b']);
});
