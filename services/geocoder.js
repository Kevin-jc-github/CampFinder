const DEFAULT_COORDINATES = [104.195397, 35.86166];

async function geocode(address) {
  const key = process.env.AMAP_WEB_SERVICE_KEY;
  if (!key || !address) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const url = new URL('https://restapi.amap.com/v3/geocode/geo');
  url.searchParams.set('key', key);
  url.searchParams.set('address', address);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    const location = data.geocodes?.[0]?.location;
    if (!location) return null;
    const [lng, lat] = location.split(',').map(Number);
    return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveCoordinates(campground, fallback = DEFAULT_COORDINATES) {
  const lng = Number(campground.longitude);
  const lat = Number(campground.latitude);
  if (Number.isFinite(lng) && Number.isFinite(lat) && lng >= 73 && lng <= 136 && lat >= 3 && lat <= 54) return [lng, lat];
  return (await geocode(`${campground.province}${campground.city}${campground.district || ''}${campground.location}`)) || fallback;
}

module.exports = { geocode, resolveCoordinates, DEFAULT_COORDINATES };
