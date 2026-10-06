const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeRegex, buildCampgroundFilter, getSort } = require('../utils/campgroundFilters');

test('escapeRegex prevents regular expression injection', () => {
  assert.equal(escapeRegex('杭州.*'), '杭州\\.\\*');
});

test('buildCampgroundFilter maps China-specific filters', () => {
  const filter = buildCampgroundFilter({ province: '浙江省', type: '湖畔营地', amenity: '淋浴', maxPrice: '399' });
  assert.deepEqual(filter, { status: 'published', province: '浙江省', type: '湖畔营地', price: { $lte: 399 }, $and: [{ $or: [{ amenities: '淋浴' }, { 'inferredAmenities.amenity': '淋浴' }] }] });
});

test('unknown sort falls back to recommendation order', () => {
  assert.deepEqual(getSort('unknown'), { 'reliability.score': -1, sourceRating: -1, createdAt: -1 });
});
