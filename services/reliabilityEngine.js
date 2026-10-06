const VERSION = 'trust-v1';
const DAY_MS = 24 * 60 * 60 * 1000;

const SOURCE_WEIGHTS = {
  owner: 25,
  community: 20,
  user_listing: 18,
  amap: 15,
  system: 10
};

const COMPLETENESS_FIELDS = [
  campground => Boolean(campground.title),
  campground => Array.isArray(campground.geometry?.coordinates) && campground.geometry.coordinates.length === 2,
  campground => Boolean(campground.location && campground.city && campground.province),
  campground => Boolean(campground.contactPhone),
  campground => Boolean(campground.sourceBusinessHours || campground.openSeason),
  campground => campground.price != null || campground.sourceReferenceCost != null,
  campground => Array.isArray(campground.images) && campground.images.length > 0,
  campground => Array.isArray(campground.amenities) && campground.amenities.length > 0
];

function daysBetween(date, now) {
  if (!date) return Infinity;
  return Math.max(0, (now.getTime() - new Date(date).getTime()) / DAY_MS);
}

function recencyPoints(date, now) {
  const age = daysBetween(date, now);
  if (age <= 30) return 25;
  if (age <= 90) return 21;
  if (age <= 180) return 17;
  if (age <= 365) return 12;
  if (age <= 730) return 6;
  return 2;
}

function computeReliability({ campground, evidence = [], reports = [], now = new Date() }) {
  const activeEvidence = evidence.filter(item => item.status === 'active' || !item.status);
  const source = Math.max(0, ...activeEvidence.map(item => SOURCE_WEIGHTS[item.sourceType] || 5), SOURCE_WEIGHTS[campground.dataSource] || 5);
  const freshnessEvidence = activeEvidence.filter(item => item.sourceType !== 'system');
  const newestEvidence = freshnessEvidence.reduce((latest, item) => {
    const date = new Date(item.capturedAt || item.updatedAt || 0);
    return !latest || date > latest ? date : latest;
  }, campground.sourceUpdatedAt ? new Date(campground.sourceUpdatedAt) : null);
  const recency = recencyPoints(newestEvidence || campground.updatedAt, now);
  const completeness = Math.round((COMPLETENESS_FIELDS.filter(check => check(campground)).length / COMPLETENESS_FIELDS.length) * 25);

  const recentReports = reports.filter(report => report.moderationStatus !== 'rejected' && daysBetween(report.observedAt, now) <= 365);
  const confirmations = recentReports.filter(report => report.reportType === 'confirm_open');
  const issues = recentReports.filter(report => report.reportType !== 'confirm_open');
  const confirmationPoints = confirmations.reduce((sum, report) => sum + (report.moderationStatus === 'accepted' ? 5 : 2), 0);
  const issuePenalty = issues.reduce((sum, report) => sum + (report.moderationStatus === 'accepted' ? 5 : 2), 0);
  const community = Math.min(15, confirmationPoints) - Math.min(10, issuePenalty);

  const claimsByField = new Map();
  for (const item of activeEvidence) {
    const itemClaims = new Map();
    for (const claim of item.claims || []) {
      const values = itemClaims.get(claim.field) || [];
      values.push(claim.value);
      itemClaims.set(claim.field, values);
    }
    for (const [field, values] of itemClaims) {
      const sourceValues = claimsByField.get(field) || new Set();
      const normalized = values.length === 1 ? values[0] : values.map(value => JSON.stringify(value)).sort();
      sourceValues.add(JSON.stringify(normalized));
      claimsByField.set(field, sourceValues);
    }
  }
  const scalarConflictFields = new Set(['identity', 'location', 'phone', 'hours', 'price', 'status']);
  const conflicts = [...claimsByField.entries()].filter(([field, values]) => scalarConflictFields.has(field) && values.size > 1).length + new Set(issues.map(report => report.field).filter(Boolean)).size;
  const consistency = Math.max(0, 10 - conflicts * 2);

  const rawScore = source + recency + completeness + community + consistency;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const reasons = [];
  if (source >= 20) reasons.push('strong_source'); else reasons.push('third_party_source');
  if (recency >= 21) reasons.push('recently_updated'); else if (recency <= 6) reasons.push('stale_data');
  if (completeness >= 19) reasons.push('complete_profile'); else reasons.push('missing_details');
  if (confirmations.length) reasons.push('community_confirmed');
  if (issues.length) reasons.push('open_community_reports');
  if (conflicts) reasons.push('conflicting_evidence');

  return {
    score,
    level: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low',
    components: { source, recency, completeness, community: Math.max(0, community), consistency },
    reasons,
    confirmationCount: confirmations.length,
    openIssueCount: issues.length,
    lastConfirmedAt: confirmations.reduce((latest, item) => {
      const date = new Date(item.observedAt);
      return !latest || date > latest ? date : latest;
    }, null),
    calculatedAt: now,
    algorithmVersion: VERSION
  };
}

module.exports = { VERSION, computeReliability, recencyPoints };
