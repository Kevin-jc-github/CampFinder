const Joi = require('joi');
const optionalUrl = Joi.string().uri({ scheme: ['http', 'https'] }).allow('');

module.exports.campgroundSchema = Joi.object({
  campground: Joi.object({
    title: Joi.string().trim().max(80).required(),
    price: Joi.number().min(0).required(),
    priceUnit: Joi.string().valid('帐篷/晚', '人/晚', '车位/晚', '整租/晚').required(),
    location: Joi.string().trim().max(160).required(),
    province: Joi.string().trim().max(30).required(),
    city: Joi.string().trim().max(30).required(),
    district: Joi.string().trim().max(30).allow(''),
    description: Joi.string().trim().max(3000).required(),
    type: Joi.string().valid('山野营地', '湖畔营地', '海边营地', '森林营地', '草原营地', '房车营地', '亲子营地', '精致露营').required(),
    amenities: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).default([]),
    capacity: Joi.number().integer().min(1).max(5000).required(),
    bookingUrl: optionalUrl,
    contactPhone: Joi.string().pattern(/^[0-9+\-\s]{6,20}$/).allow(''),
    wechat: Joi.string().trim().max(50).allow(''),
    openSeason: Joi.string().trim().max(50).allow(''),
    imageUrl: optionalUrl,
    longitude: Joi.number().min(73).max(136).allow(''),
    latitude: Joi.number().min(3).max(54).allow('')
  }).required(),
  deleteImages: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string())
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    body: Joi.string().trim().min(2).max(1000).required()
  }).required()
});

module.exports.fieldReportSchema = Joi.object({
  report: Joi.object({
    reportType: Joi.string().valid('confirm_open', 'closed', 'incorrect_location', 'incorrect_contact', 'incorrect_hours', 'incorrect_price', 'incorrect_amenity', 'safety_issue', 'other').required(),
    proposedValue: Joi.string().trim().max(500).allow(''),
    comment: Joi.string().trim().max(1000).allow(''),
    observedAt: Joi.date().max('now').required()
  }).required()
});
