const test = require('node:test');
const assert = require('node:assert/strict');
const { extractAmenities } = require('../services/amenityExtractor');

test('extracts positive Chinese amenity mentions', () => {
  const result = extractAmenities('营地提供淋浴和停车场，也欢迎携带宠物。');
  assert.deepEqual(result.positive.map(item => item.amenity), ['淋浴', '停车场', '可带宠物']);
});
test('negation blocks false positive amenities', () => {
  const result = extractAmenities('营地禁止明火，没有淋浴，需自带帐篷。');
  assert.equal(result.positive.some(item => item.amenity === '可明火'), false);
  assert.equal(result.positive.some(item => item.amenity === '淋浴'), false);
  assert.ok(result.negative.some(item => item.amenity === '可明火'));
});
test('supports English amenity descriptions', () => {
  const result = extractAmenities('Pet-friendly forest campsite with showers and parking.');
  assert.ok(result.positive.some(item => item.amenity === '可带宠物'));
  assert.ok(result.positive.some(item => item.amenity === '淋浴'));
});
