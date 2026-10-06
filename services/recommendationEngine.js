const EARTH_RADIUS_KM = 6371;

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
  return { score, distanceKm, breakdown, explanations: explanations.slice(0, 4), algorithmVersion: 'recommend-v1' };
}

function rankCampgrounds(campgrounds, preferences) {
  return campgrounds
    .map(campground => ({ campground, recommendation: scoreCampground(campground, preferences) }))
    .sort((a, b) => b.recommendation.score - a.recommendation.score || (a.recommendation.distanceKm ?? Infinity) - (b.recommendation.distanceKm ?? Infinity));
}

module.exports = { haversineDistanceKm, scoreCampground, rankCampgrounds };
