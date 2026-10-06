function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function buildCampgroundFilter(query) {
  const filter = { status: 'published' };
  const clauses = [];
  if (query.q?.trim()) {
    const keyword = new RegExp(escapeRegex(query.q.trim()), 'i');
    clauses.push({ $or: [{ title: keyword }, { description: keyword }, { location: keyword }] });
  }
  if (query.province?.trim()) filter.province = query.province.trim();
  if (query.city?.trim()) filter.city = query.city.trim();
  if (query.type?.trim()) filter.type = query.type.trim();
  if (query.amenity?.trim()) clauses.push({ $or: [{ amenities: query.amenity.trim() }, { 'inferredAmenities.amenity': query.amenity.trim() }] });
  if (query.maxPrice && Number.isFinite(Number(query.maxPrice))) filter.price = { $lte: Number(query.maxPrice) };
  if (clauses.length) filter.$and = clauses;
  return filter;
}
function getSort(sort) {
  return {
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    newest: { createdAt: -1 },
    reliable: { 'reliability.score': -1, sourceRating: -1 }
  }[sort] || { 'reliability.score': -1, sourceRating: -1, createdAt: -1 };
}
module.exports = { escapeRegex, buildCampgroundFilter, getSort };
