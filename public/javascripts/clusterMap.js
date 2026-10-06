(() => {
  const container = document.getElementById('cluster-map');
  const camps = window.campfinderMapData || [];
  const ui = window.campfinderUi || { view: '查看详情', pricePending: '价格待确认', referenceCost: '参考消费' };
  if (!container || !window.AMap || !camps.length) return;
  const map = new AMap.Map('cluster-map', { zoom: 4, center: [104.195397, 35.86166], viewMode: '2D' });
  const bounds = new AMap.Bounds();
  camps.forEach(camp => {
    const coordinates = camp.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) return;
    const marker = new AMap.Marker({ position: coordinates, title: camp.title });
    marker.on('click', () => {
      const wrapper = document.createElement('div');
      const title = document.createElement('strong');
      const address = document.createElement('p');
      const link = document.createElement('a');
      title.textContent = camp.title;
      const cost = camp.price != null ? `¥${camp.price}/${camp.priceUnit}` : (camp.sourceReferenceCost != null ? `¥${camp.sourceReferenceCost} ${ui.referenceCost}` : ui.pricePending);
      address.textContent = `${camp.province} ${camp.city} · ${cost}`;
      link.href = `/campgrounds/${camp._id}`;
      link.textContent = ui.view;
      wrapper.append(title, address, link);
      new AMap.InfoWindow({ content: wrapper, offset: new AMap.Pixel(0, -28) }).open(map, coordinates);
    });
    map.add(marker);
    bounds.extend(coordinates);
  });
  if (camps.length > 1) map.setBounds(bounds, false, [40, 40, 40, 40]);
})();
