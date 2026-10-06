function claimsFromCampground(campground) {
  const claims = [
    { field: 'identity', value: campground.title, confidence: 0.9 },
    { field: 'location', value: { location: campground.location, geometry: campground.geometry }, confidence: 0.9 }
  ];
  if (campground.contactPhone) claims.push({ field: 'phone', value: campground.contactPhone, confidence: 0.75 });
  if (campground.sourceBusinessHours || campground.openSeason) claims.push({ field: 'hours', value: campground.sourceBusinessHours || campground.openSeason, confidence: 0.65 });
  if (campground.price != null || campground.sourceReferenceCost != null) claims.push({ field: 'price', value: campground.price ?? campground.sourceReferenceCost, confidence: campground.price != null ? 0.8 : 0.45 });
  if (campground.amenities?.length) claims.push({ field: 'amenities', value: campground.amenities, confidence: campground.dataSource === 'user' ? 0.75 : 0.5 });
  if (campground.images?.length) claims.push({ field: 'photos', value: campground.images.map(image => image.url), confidence: 0.7 });
  return claims;
}

function evidenceFromCampground(campground) {
  const sourceType = campground.dataSource === 'amap' ? 'amap' : 'user_listing';
  return {
    campground: campground._id,
    sourceType,
    sourceId: campground.sourceId || `listing:${campground._id}`,
    sourceName: sourceType === 'amap' ? '高德地图 / Amap' : 'Camping Recommend System community listing',
    sourceUrl: campground.bookingUrl || '',
    claims: claimsFromCampground(campground),
    capturedAt: campground.sourceUpdatedAt || campground.updatedAt || new Date(),
    submittedBy: sourceType === 'user_listing' ? campground.author : undefined,
    licenseNote: sourceType === 'amap' ? 'Imported through Amap Web Service API; verify applicable display and caching terms.' : ''
  };
}

module.exports = { claimsFromCampground, evidenceFromCampground };
