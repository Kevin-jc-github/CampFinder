const EARTH_RADIUS_KM = 6371;

const ENGLISH_VALUES = {
  '山野营地': 'mountain and wild',
  '湖畔营地': 'lakeside',
  '海边营地': 'seaside',
  '森林营地': 'forest',
  '草原营地': 'grassland',
  '房车营地': 'RV park',
  '亲子营地': 'family',
  '精致露营': 'glamping',
  '卫生间': 'restrooms',
  '淋浴': 'showers',
  '水电桩': 'RV hookups',
  '停车场': 'parking',
  '可明火': 'campfires',
  '可带宠物': 'pet-friendly access',
  '儿童活动': 'children’s activities',
  '装备租赁': 'gear rental',
  '餐饮': 'food service',
  '手机信号': 'mobile signal'
};

function toRadians(value) {
  return value * Math.PI / 180;
}

function haversineDistanceKm(origin, destination) {
  if (!origin || !destination) return null;
  const [lng1, lat1] = origin;
  const [lng2, lat2] = destination;
  if (![lng1, lat1, lng2, lat2].every(Number.isFinite)) return null;
  const latDelta = toRadians(lat2 - lat1);
  const lngDelta = toRadians(lng2 - lng1);
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lngDelta / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function joinNaturalList(items, lang) {
  if (!items.length) return '';
  if (lang === 'en') {
    if (items.length === 1) return items[0];
    return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
  }
  return items.join('、');
}

function joinClauses(items, lang) {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  const conjunction = lang === 'en' ? ' and ' : '，并且';
  const separator = lang === 'en' ? ', ' : '，';
  return `${items.slice(0, -1).join(separator)}${conjunction}${items.at(-1)}`;
}

function localizedValue(value, lang) {
  return lang === 'en' ? (ENGLISH_VALUES[value] || value) : value;
}

function buildRecommendationNarrative(campground, preferences, recommendation, lang = 'zh') {
  const isEnglish = lang === 'en';
  const positive = [];
  const caveats = [];
  const distanceKm = recommendation.distanceKm;
  if (Number.isFinite(distanceKm)) {
    positive.push(isEnglish
      ? `it is about ${Math.round(distanceKm)} km from your starting point`
      : `距离出发地约 ${Math.round(distanceKm)} 公里`);
  }

  const displayedPrice = campground.price ?? campground.sourceReferenceCost;
  const maxPrice = Number(preferences.maxPrice);
  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    if (displayedPrice == null) {
      caveats.push(isEnglish ? 'its price has not been confirmed' : '价格尚未确认');
    } else if (displayedPrice <= maxPrice) {
      positive.push(isEnglish
        ? `its reference price of ¥${displayedPrice} is within your ¥${maxPrice} budget`
        : `参考消费 ¥${displayedPrice} 在你的 ¥${maxPrice} 预算内`);
    } else {
      caveats.push(isEnglish
        ? `its reference price of ¥${displayedPrice} is above your ¥${maxPrice} budget`
        : `参考消费 ¥${displayedPrice} 高于你的 ¥${maxPrice} 预算`);
    }
  }

  const wantedAmenities = [...new Set(preferences.amenities || [])];
  const availableAmenities = new Set([
    ...(campground.amenities || []),
    ...(campground.inferredAmenities || []).filter(item => item.confidence >= 0.75).map(item => item.amenity)
  ]);
  const matchedAmenities = wantedAmenities.filter(item => availableAmenities.has(item));
  const missingAmenities = wantedAmenities.filter(item => !availableAmenities.has(item));
  if (matchedAmenities.length) {
    positive.push(isEnglish
      ? `the available information matches ${joinNaturalList(matchedAmenities.map(item => localizedValue(item, 'en')), 'en')}`
      : `现有资料匹配你需要的${joinNaturalList(matchedAmenities, 'zh')}`);
  }
  if (missingAmenities.length) {
    caveats.push(isEnglish
      ? `the availability of ${joinNaturalList(missingAmenities.map(item => localizedValue(item, 'en')), 'en')} still needs confirmation`
      : `${joinNaturalList(missingAmenities, 'zh')}仍需确认`);
  }

  const preferredTypes = [...new Set(preferences.types || [])];
  if (preferredTypes.length) {
    if (preferredTypes.includes(campground.type)) {
      positive.push(isEnglish
        ? `it matches your preferred ${localizedValue(campground.type, 'en')} campsite type`
        : `属于你偏好的${campground.type}`);
    } else {
      caveats.push(isEnglish
        ? `its campsite type does not match the selected types`
        : `营地类型不在你的首选范围内`);
    }
  }

  const trustScore = campground.reliability?.score ?? 0;
  if (trustScore >= 75) {
    positive.push(isEnglish
      ? `its information trust score is ${trustScore}/100 with relatively strong supporting evidence`
      : `信息可信度为 ${trustScore}/100，支持证据较充分`);
  } else if (trustScore >= 50) {
    caveats.push(isEnglish
      ? `its information trust score is ${trustScore}/100, so key details should be confirmed before travelling`
      : `信息可信度为 ${trustScore}/100，出发前仍应确认关键资料`);
  } else {
    caveats.push(isEnglish
      ? `its information trust score is only ${trustScore}/100 and the available evidence is limited`
      : `信息可信度仅为 ${trustScore}/100，现有证据较有限`);
  }
  if (campground.operationalStatus === 'unknown') {
    caveats.push(isEnglish ? 'its current operating status is unknown' : '当前营业状态尚未确认');
  }

  const positiveText = positive.length
    ? (isEnglish
      ? `This campsite is recommended because ${joinClauses(positive, 'en')}.`
      : `推荐这个营地，是因为${joinClauses(positive, 'zh')}。`)
    : (isEnglish
      ? `This campsite has an overall match score of ${recommendation.score}/100.`
      : `这个营地的综合匹配度为 ${recommendation.score}/100。`);
  const caveatText = caveats.length
    ? (isEnglish
      ? `However, ${joinClauses(caveats, 'en')}.`
      : `不过，${joinClauses(caveats, 'zh')}。`)
    : '';
  if (!caveatText) return positiveText;
  return isEnglish ? `${positiveText} ${caveatText}` : `${positiveText}${caveatText}`;
}

function scoreCampground(campground, preferences = {}) {
  const explanations = [];
  const breakdown = {};
  const destination = campground.geometry?.coordinates;
  const distanceKm = haversineDistanceKm(preferences.origin, destination);
  const radiusKm = Number(preferences.radiusKm) || 300;
  if (distanceKm == null) breakdown.distance = 0.35;
  else {
    breakdown.distance = clamp(1 - distanceKm / radiusKm);
    if (distanceKm <= radiusKm * 0.5) explanations.push({ code: 'nearby', value: Math.round(distanceKm) });
  }

  const displayedPrice = campground.price ?? campground.sourceReferenceCost;
  const maxPrice = Number(preferences.maxPrice);
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) breakdown.budget = 0.6;
  else if (displayedPrice == null) breakdown.budget = 0.25;
  else {
    breakdown.budget = clamp(1 - Math.max(0, displayedPrice - maxPrice) / maxPrice);
    if (displayedPrice <= maxPrice) explanations.push({ code: 'within_budget', value: displayedPrice });
  }

  const wantedAmenities = [...new Set(preferences.amenities || [])];
  const campgroundAmenities = new Set([
    ...(campground.amenities || []),
    ...(campground.inferredAmenities || []).filter(item => item.confidence >= 0.75).map(item => item.amenity)
  ]);
  const amenityMatches = wantedAmenities.filter(item => campgroundAmenities.has(item));
  breakdown.amenities = wantedAmenities.length ? amenityMatches.length / wantedAmenities.length : 0.6;
  if (amenityMatches.length) explanations.push({ code: 'amenity_match', value: amenityMatches });

  const preferredTypes = [...new Set(preferences.types || [])];
  breakdown.type = preferredTypes.length ? (preferredTypes.includes(campground.type) ? 1 : 0) : 0.6;
  if (preferredTypes.includes(campground.type)) explanations.push({ code: 'type_match', value: campground.type });

  const reliabilityScore = campground.reliability?.score ?? 0;
  breakdown.reliability = clamp(reliabilityScore / 100);
  if (reliabilityScore >= 75) explanations.push({ code: 'high_reliability', value: reliabilityScore });
  else if (reliabilityScore < 50) explanations.push({ code: 'limited_evidence', value: reliabilityScore });

  const rating = Number(campground.sourceRating) || 0;
  breakdown.quality = rating ? clamp(rating / 5) : 0.45;
  if (rating >= 4.5) explanations.push({ code: 'high_rating', value: rating });

  const weights = { distance: 0.25, budget: 0.15, amenities: 0.2, type: 0.1, reliability: 0.2, quality: 0.1 };
  const score = Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + breakdown[key] * weight, 0) * 100);
  const recommendation = { score, distanceKm, breakdown, explanations: explanations.slice(0, 4), algorithmVersion: 'recommend-v1' };
  recommendation.narrative = {
    zh: buildRecommendationNarrative(campground, preferences, recommendation, 'zh'),
    en: buildRecommendationNarrative(campground, preferences, recommendation, 'en')
  };
  return recommendation;
}

function rankCampgrounds(campgrounds, preferences) {
  return campgrounds
    .map(campground => ({ campground, recommendation: scoreCampground(campground, preferences) }))
    .sort((a, b) => b.recommendation.score - a.recommendation.score || (a.recommendation.distanceKm ?? Infinity) - (b.recommendation.distanceKm ?? Infinity));
}

module.exports = { haversineDistanceKm, buildRecommendationNarrative, scoreCampground, rankCampgrounds };
