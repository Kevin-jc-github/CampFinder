const Campground = require('../models/campground');
const Evidence = require('../models/evidence');
const FieldReport = require('../models/fieldReport');
const { computeReliability } = require('./reliabilityEngine');

async function recalculateReliability(campgroundId) {
  const [campground, evidence, reports] = await Promise.all([
    Campground.findById(campgroundId),
    Evidence.find({ campground: campgroundId, status: { $ne: 'superseded' } }).lean(),
    FieldReport.find({ campground: campgroundId, moderationStatus: { $ne: 'rejected' } }).lean()
  ]);
  if (!campground) return null;
  campground.reliability = computeReliability({ campground: campground.toObject(), evidence, reports });
  await campground.save();
  return campground.reliability;
}

module.exports = { recalculateReliability };
