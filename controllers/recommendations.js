const Campground = require('../models/campground');
const { geocode } = require('../services/geocoder');
const { rankCampgrounds } = require('../services/recommendationEngine');
const ExpressError = require('../utils/ExpressError');

const CANDIDATE_LIMIT = 300;

function arrayParam(value) {
  if (!value) return [];
  return [...new Set([].concat(value).filter(Boolean))];
}

module.exports.renderForm = (req, res) => res.render('recommendations/index', { results: null, preferences: {} });

module.exports.recommend = async (req, res) => {
  const address = req.body.origin?.trim();
  const origin = address ? await geocode(address) : null;
  if (!origin) throw new ExpressError(req.session.lang === 'en' ? 'We could not locate that starting point.' : '无法定位该出发地点，请输入更完整的中国地址', 400);
  const preferences = {
    origin,
    originLabel: address || '',
    radiusKm: Math.min(1000, Math.max(10, Number(req.body.radiusKm) || 200)),
    maxPrice: Number(req.body.maxPrice) || null,
    amenities: arrayParam(req.body.amenities),
    types: arrayParam(req.body.types)
  };
  const query = { status: 'published', operationalStatus: { $nin: ['closed', 'temporarily_closed'] } };
  if (origin) {
    query.geometry = {
      $near: {
        $geometry: { type: 'Point', coordinates: origin },
        $maxDistance: preferences.radiusKm * 1000
      }
    };
  }
  const candidates = await Campground.find(query).limit(CANDIDATE_LIMIT).lean({ virtuals: true });
  const results = rankCampgrounds(candidates, preferences).slice(0, 20);
  res.render('recommendations/index', { results, preferences });
};
