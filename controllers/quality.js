const Campground = require('../models/campground');
const FieldReport = require('../models/fieldReport');
const { planVerifications, summarizePlan } = require('../services/verificationPlanner');

module.exports.dashboard = async (req, res) => {
  const [summary, levels, sources, issues, verificationCandidates] = await Promise.all([
    Campground.aggregate([{ $match: { status: 'published' } }, { $group: { _id: null, total: { $sum: 1 }, avgReliability: { $avg: '$reliability.score' }, withPhone: { $sum: { $cond: [{ $ne: ['$contactPhone', ''] }, 1, 0] } }, withAmenities: { $sum: { $cond: [{ $gt: [{ $size: '$amenities' }, 0] }, 1, 0] } }, withInferredAmenities: { $sum: { $cond: [{ $gt: [{ $size: '$inferredAmenities' }, 0] }, 1, 0] } } } }]),
    Campground.aggregate([{ $match: { status: 'published' } }, { $group: { _id: '$reliability.level', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Campground.aggregate([{ $match: { status: 'published' } }, { $group: { _id: '$dataSource', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    FieldReport.aggregate([{ $match: { moderationStatus: { $ne: 'rejected' } } }, { $group: { _id: '$reportType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Campground.find({ status: 'published' })
      .select('title province city dataSource sourceUpdatedAt updatedAt contactPhone sourceBusinessHours openSeason price sourceReferenceCost images amenities inferredAmenities geometry operationalStatus reliability')
      .lean()
  ]);
  const verificationPlan = planVerifications(verificationCandidates, { limit: 20 });
  res.render('quality/dashboard', {
    summary: summary[0] || {},
    levels,
    sources,
    issues,
    verificationPlan,
    planSummary: summarizePlan(verificationPlan)
  });
};
