(() => {
  const container = document.getElementById('map');
  const camp = window.campgroundData;
  const coordinates = camp?.geometry?.coordinates;
  if (!container || !window.AMap || !Array.isArray(coordinates)) return;
  const map = new AMap.Map('map', { zoom: 13, center: coordinates, viewMode: '2D' });
  const marker = new AMap.Marker({ position: coordinates, title: camp.title });
  map.add(marker);
})();
