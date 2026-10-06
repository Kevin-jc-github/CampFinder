const test = require('node:test');
const assert = require('node:assert/strict');
const { computeReliability, recencyPoints } = require('../services/reliabilityEngine');

const completeCampground = {
  title: 'Test Camp',
  geometry: { coordinates: [120, 30] },
  location: 'Test address', province: '浙江省', city: '杭州市',
  contactPhone: '13800000000', sourceBusinessHours: '09:00-18:00',
  sourceReferenceCost: 100, images: [{ url: 'x' }], amenities: ['卫生间'],
  dataSource: 'amap', sourceUpdatedAt: new Date('2026-09-20'), updatedAt: new Date('2026-09-20')
};

test('recent complete records with confirmations score higher', () => {
  const now = new Date('2026-10-01');
  const base = computeReliability({ campground: completeCampground, evidence: [{ sourceType: 'amap', status: 'active', capturedAt: now, claims: [] }], reports: [], now });
  const confirmed = computeReliability({ campground: completeCampground, evidence: [{ sourceType: 'owner', status: 'active', capturedAt: now, claims: [] }], reports: [{ reportType: 'confirm_open', moderationStatus: 'pending', observedAt: now }], now });
  assert.ok(confirmed.score > base.score);
  assert.ok(confirmed.reasons.includes('community_confirmed'));
});

test('conflicting evidence and issue reports reduce consistency', () => {
  const now = new Date('2026-10-01');
  const result = computeReliability({
    campground: completeCampground,
    evidence: [
      { sourceType: 'amap', status: 'active', capturedAt: now, claims: [{ field: 'phone', value: '1' }] },
      { sourceType: 'community', status: 'active', capturedAt: now, claims: [{ field: 'phone', value: '2' }] }
    ],
    reports: [{ reportType: 'incorrect_contact', field: 'phone', moderationStatus: 'pending', observedAt: now }],
    now
  });
  assert.ok(result.components.consistency < 10);
  assert.ok(result.reasons.includes('conflicting_evidence'));
});

test('recency scoring decays over time', () => {
  const now = new Date('2026-10-01');
  assert.ok(recencyPoints(new Date('2026-09-20'), now) > recencyPoints(new Date('2024-01-01'), now));
});

test('multiple values from one source are not treated as a conflict', () => {
  const now = new Date('2026-10-01');
  const result = computeReliability({ campground: completeCampground, evidence: [{ sourceType: 'system', status: 'active', capturedAt: now, claims: [{ field: 'amenities', value: '淋浴' }, { field: 'amenities', value: '停车场' }] }], reports: [], now });
  assert.equal(result.components.consistency, 10);
});

test('pending confirmations have limited influence', () => {
  const now = new Date('2026-10-01');
  const pending = computeReliability({ campground: completeCampground, evidence: [], reports: [{ reportType: 'confirm_open', moderationStatus: 'pending', observedAt: now }], now });
  const accepted = computeReliability({ campground: completeCampground, evidence: [], reports: [{ reportType: 'confirm_open', moderationStatus: 'accepted', observedAt: now }], now });
  assert.ok(accepted.score > pending.score);
});
