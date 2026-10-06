const FieldReport = require('../models/fieldReport');
const Evidence = require('../models/evidence');
const Campground = require('../models/campground');
const ExpressError = require('../utils/ExpressError');
const { recalculateReliability } = require('../services/reliabilityService');

const FIELD_BY_TYPE = {
  confirm_open: 'status', closed: 'status', incorrect_location: 'location', incorrect_contact: 'phone',
  incorrect_hours: 'hours', incorrect_price: 'price', incorrect_amenity: 'amenities', safety_issue: 'safety', other: ''
};

module.exports.create = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) throw new ExpressError('未找到该营地', 404);
  const observedAt = new Date(req.body.report.observedAt);
  const timeBucket = observedAt.toISOString().slice(0, 7);
  try {
    const report = await FieldReport.create({
      campground: campground._id,
      reporter: req.user._id,
      reportType: req.body.report.reportType,
      field: FIELD_BY_TYPE[req.body.report.reportType] || '',
      proposedValue: req.body.report.proposedValue || '',
      comment: req.body.report.comment || '',
      observedAt,
      timeBucket
    });
    const evidence = await Evidence.create({
      campground: campground._id,
      sourceType: 'community',
      sourceId: `report:${report._id}`,
      sourceName: req.user.username,
      submittedBy: req.user._id,
      capturedAt: observedAt,
      claims: [{
        field: FIELD_BY_TYPE[report.reportType] === 'safety' ? 'status' : (FIELD_BY_TYPE[report.reportType] || 'description'),
        value: report.proposedValue || report.reportType,
        confidence: report.reportType === 'confirm_open' ? 0.8 : 0.65
      }],
      status: 'disputed'
    });
    report.evidence = evidence._id;
    await report.save();
    await recalculateReliability(campground._id);
    req.flash('success', report.reportType === 'confirm_open' ? '感谢确认营地状态' : '感谢提交纠错信息');
  } catch (error) {
    if (error.code === 11000) req.flash('error', '你本月已经提交过相同类型的报告');
    else throw error;
  }
  res.redirect(`/campgrounds/${campground._id}#community-report`);
};
