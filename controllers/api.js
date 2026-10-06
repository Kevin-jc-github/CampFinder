const Campground = require('../models/campground');
const Evidence = require('../models/evidence');
const FieldReport = require('../models/fieldReport');
const { rankCampgrounds } = require('../services/recommendationEngine');
const ExpressError = require('../utils/ExpressError');

function listParam(value) {
  if (!value) return [];
  return [...new Set(String(value).split(',').map(item => item.trim()).filter(Boolean))];
}

module.exports.recommendations = async (req, res) => {
  const lng = Number(req.query.lng);
  const lat = Number(req.query.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new ExpressError('lng and lat are required', 400);
  const radiusKm = Math.min(1000, Math.max(10, Number(req.query.radiusKm) || 200));
  const preferences = {
    origin: [lng, lat],
    radiusKm,
    maxPrice: Number(req.query.maxPrice) || null,
    amenities: listParam(req.query.amenities),
    types: listParam(req.query.types)
  };
  const candidates = await Campground.find({
    status: 'published',
    operationalStatus: { $nin: ['closed', 'temporarily_closed'] },
    geometry: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radiusKm * 1000 } }
  }).limit(300).lean();
  const results = rankCampgrounds(candidates, preferences).slice(0, Math.min(50, Math.max(1, Number(req.query.limit) || 20)));
  res.json({
    algorithm: 'recommend-v1',
    preferences,
    count: results.length,
    results: results.map(({ campground, recommendation }) => ({
      id: campground._id,
      title: campground.title,
      city: campground.city,
      location: campground.location,
      type: campground.type,
      score: recommendation.score,
      distanceKm: recommendation.distanceKm,
      trustScore: campground.reliability?.score || 0,
      breakdown: recommendation.breakdown,
      explanations: recommendation.explanations
    }))
  });
};

module.exports.trust = async (req, res) => {
  const [campground, evidence, reports] = await Promise.all([
    Campground.findById(req.params.id).select('title city dataSource sourceUpdatedAt reliability').lean(),
    Evidence.find({ campground: req.params.id, status: { $ne: 'superseded' } }).select('sourceType sourceName claims capturedAt status').sort({ capturedAt: -1 }).lean(),
    FieldReport.find({ campground: req.params.id, moderationStatus: { $ne: 'rejected' } }).select('reportType field observedAt moderationStatus').sort({ observedAt: -1 }).lean()
  ]);
  if (!campground) throw new ExpressError('Campground not found', 404);
  res.json({
    algorithm: campground.reliability?.algorithmVersion || 'trust-v1',
    campground,
    evidence: evidence.map(item => ({ sourceType: item.sourceType, sourceName: item.sourceName, supportedFields: [...new Set(item.claims.map(claim => claim.field))], capturedAt: item.capturedAt, status: item.status })),
    reports
  });
};
