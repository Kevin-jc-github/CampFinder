const fs = require('fs');
const path = require('path');
const { extractAmenities, VERSION: extractorVersion } = require('../services/amenityExtractor');
const { scoreCampground } = require('../services/recommendationEngine');

function evaluateAmenities() {
  const dataset = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'evaluation', 'amenity-labeled.json'), 'utf8'));
  let tp = 0;
  let fp = 0;
  let fn = 0;
  for (const example of dataset) {
    const predicted = new Set(extractAmenities(example.text).positive.map(item => item.amenity));
    const expected = new Set(example.amenities);
    for (const value of predicted) expected.has(value) ? tp += 1 : fp += 1;
    for (const value of expected) if (!predicted.has(value)) fn += 1;
  }
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  return { datasetSize: dataset.length, version: extractorVersion, precision, recall, f1: 2 * precision * recall / Math.max(Number.EPSILON, precision + recall), tp, fp, fn };
}

function evaluateRecommendationSanity() {
  const preferences = { origin: [121.47, 31.23], radiusKm: 200, maxPrice: 200, amenities: ['淋浴'], types: ['森林营地'] };
  const good = scoreCampground({ geometry: { coordinates: [121.5, 31.2] }, price: 150, amenities: ['淋浴'], type: '森林营地', reliability: { score: 85 }, sourceRating: 4.7 }, preferences);
  const weak = scoreCampground({ geometry: { coordinates: [123.5, 33.2] }, price: 400, amenities: [], type: '海边营地', reliability: { score: 30 }, sourceRating: 3.2 }, preferences);
  return { preferredScore: good.score, weakScore: weak.score, orderingPass: good.score > weak.score, margin: good.score - weak.score };
}

const result = { generatedAt: new Date().toISOString(), amenityExtraction: evaluateAmenities(), recommendationSanity: evaluateRecommendationSanity() };
console.log(JSON.stringify(result, null, 2));
if (result.amenityExtraction.f1 < 0.75 || !result.recommendationSanity.orderingPass) process.exitCode = 1;
