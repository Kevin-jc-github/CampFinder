const VERSION = 'verify-plan-v1';
const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_DIVERSITY_WEIGHTS = {
  province: 10,
  city: 12,
  failureMode: 6
};

const GAP_WEIGHTS = {
  coordinates: 2,
  phone: 2,
  hours: 1.5,
  price: 1.5,
  images: 1,
  amenities: 2
};

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function hasCoordinates(campground) {
  const coordinates = campground.geometry?.coordinates;
  return Array.isArray(coordinates)
    && coordinates.length === 2
    && coordinates.every(Number.isFinite)
    && !(coordinates[0] === 0 && coordinates[1] === 0);
}

function missingCriticalFields(campground) {
  const missing = [];
  if (!hasCoordinates(campground)) missing.push('coordinates');
  if (!campground.contactPhone) missing.push('phone');
  const hasOpeningInformation = campground.dataSource === 'amap'
    ? Boolean(campground.sourceBusinessHours)
    : Boolean(campground.sourceBusinessHours || campground.openSeason);
  if (!hasOpeningInformation) missing.push('hours');
  if (campground.price == null && campground.sourceReferenceCost == null) missing.push('price');
  if (!Array.isArray(campground.images) || campground.images.length === 0) missing.push('images');
  if (!Array.isArray(campground.amenities) || campground.amenities.length === 0) missing.push('amenities');
  return missing;
}

function fallbackStaleness(campground, now) {
  const date = campground.sourceUpdatedAt || campground.updatedAt;
  if (!date) return 1;
  const days = Math.max(0, (now.getTime() - new Date(date).getTime()) / DAY_MS);
  return clamp(days / 730);
}

function scoreVerificationNeed(campground, now = new Date()) {
  const trustScore = Number(campground.reliability?.score) || 0;
  const uncertainty = clamp(1 - trustScore / 100);
  const recencyPoints = Number(campground.reliability?.components?.recency);
  const staleness = Number.isFinite(recencyPoints)
    ? clamp(1 - recencyPoints / 25)
    : fallbackStaleness(campground, now);

  const missingFields = missingCriticalFields(campground);
  const missingWeight = missingFields.reduce((sum, field) => sum + GAP_WEIGHTS[field], 0);
  const completenessGap = clamp(missingWeight / 10);

  const openIssueCount = Number(campground.reliability?.openIssueCount) || 0;
  const hasConflict = (campground.reliability?.reasons || []).includes('conflicting_evidence');
  const conflictRisk = clamp(Math.max(openIssueCount / 3, hasConflict ? 0.5 : 0));
  const statusUncertainty = campground.operationalStatus === 'unknown' || !campground.operationalStatus ? 1 : 0;

  const contributions = [
    { code: 'low_trust', value: uncertainty, points: 30 * uncertainty },
    { code: 'stale_information', value: staleness, points: 20 * staleness },
    { code: 'missing_critical_fields', value: missingFields, points: 25 * completenessGap },
    { code: 'conflicting_reports', value: openIssueCount, points: 15 * conflictRisk },
    { code: 'unknown_operational_status', value: statusUncertainty, points: 10 * statusUncertainty }
  ];

  const baseScore = contributions.reduce((sum, item) => sum + item.points, 0);
  const reasons = contributions
    .filter(item => item.points > 0.01)
    .sort((a, b) => b.points - a.points || a.code.localeCompare(b.code))
    .map(item => ({ ...item, points: Math.round(item.points * 10) / 10 }));

  return {
    baseScore: Math.round(baseScore * 10) / 10,
    signals: {
      uncertainty,
      staleness,
      completenessGap,
      conflictRisk,
      statusUncertainty
    },
    missingFields,
    reasons,
    primaryFailureMode: reasons[0]?.code || 'low_trust',
    algorithmVersion: VERSION
  };
}

function concaveMarginal(count) {
  return Math.sqrt(count + 1) - Math.sqrt(count);
}

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function stableKey(campground) {
  return `${campground.province || ''}|${campground.city || ''}|${campground.title || ''}|${campground._id || ''}`;
}

function planVerifications(campgrounds, options = {}) {
  const limit = Math.max(0, Math.min(campgrounds.length, Number(options.limit) || 20));
  const now = options.now || new Date();
  const weights = { ...DEFAULT_DIVERSITY_WEIGHTS, ...(options.diversityWeights || {}) };
  const remaining = campgrounds.map(campground => ({
    campground,
    verification: scoreVerificationNeed(campground, now)
  }));
  const selected = [];
  const provinceCounts = new Map();
  const cityCounts = new Map();
  const failureModeCounts = new Map();

  while (selected.length < limit && remaining.length) {
    let bestIndex = -1;
    let bestCandidate = null;

    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const province = candidate.campground.province || 'unknown';
      const city = `${province}/${candidate.campground.city || 'unknown'}`;
      const failureMode = candidate.verification.primaryFailureMode;
      const coverage = {
        province: weights.province * concaveMarginal(provinceCounts.get(province) || 0),
        city: weights.city * concaveMarginal(cityCounts.get(city) || 0),
        failureMode: weights.failureMode * concaveMarginal(failureModeCounts.get(failureMode) || 0)
      };
      const marginalScore = candidate.verification.baseScore
        + coverage.province
        + coverage.city
        + coverage.failureMode;
      const evaluated = { ...candidate, coverage, marginalScore };

      if (!bestCandidate
        || marginalScore > bestCandidate.marginalScore
        || (marginalScore === bestCandidate.marginalScore
          && stableKey(candidate.campground) < stableKey(bestCandidate.campground))) {
        bestCandidate = evaluated;
        bestIndex = index;
      }
    }

    remaining.splice(bestIndex, 1);
    const province = bestCandidate.campground.province || 'unknown';
    const city = `${province}/${bestCandidate.campground.city || 'unknown'}`;
    increment(provinceCounts, province);
    increment(cityCounts, city);
    increment(failureModeCounts, bestCandidate.verification.primaryFailureMode);
    selected.push({
      ...bestCandidate,
      rank: selected.length + 1,
      marginalScore: Math.round(bestCandidate.marginalScore * 10) / 10,
      coverage: Object.fromEntries(Object.entries(bestCandidate.coverage).map(([key, value]) => [key, Math.round(value * 10) / 10]))
    });
  }

  return selected;
}

function summarizePlan(plan) {
  const cities = new Set();
  const provinces = new Set();
  const failureModes = new Set();
  let totalBaseScore = 0;
  for (const item of plan) {
    cities.add(`${item.campground.province || ''}/${item.campground.city || ''}`);
    provinces.add(item.campground.province || 'unknown');
    failureModes.add(item.verification.primaryFailureMode);
    totalBaseScore += item.verification.baseScore;
  }
  return {
    count: plan.length,
    cityCoverage: cities.size,
    provinceCoverage: provinces.size,
    failureModeCoverage: failureModes.size,
    averageRisk: plan.length ? Math.round(totalBaseScore / plan.length * 10) / 10 : 0
  };
}

function riskOnlyBaseline(campgrounds, options = {}) {
  const now = options.now || new Date();
  const limit = Math.max(0, Math.min(campgrounds.length, Number(options.limit) || 20));
  return campgrounds
    .map(campground => ({ campground, verification: scoreVerificationNeed(campground, now) }))
    .sort((a, b) => b.verification.baseScore - a.verification.baseScore || stableKey(a.campground).localeCompare(stableKey(b.campground)))
    .slice(0, limit);
}

module.exports = {
  VERSION,
  missingCriticalFields,
  scoreVerificationNeed,
  planVerifications,
  summarizePlan,
  riskOnlyBaseline
};
