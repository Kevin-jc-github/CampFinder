const translations = {
  zh: {
    'site.title': 'CampFinder · 中国露营地指南', 'site.description': '发现、比较和分享中国露营地',
    'nav.explore': '找营地', 'nav.publish': '发布营地', 'nav.login': '登录', 'nav.register': '免费注册', 'nav.logout': '退出', 'nav.hello': '你好',
    'home.kicker': '探索 · 连接 · 出发', 'home.title1': '把周末，', 'home.title2': '还给山野。', 'home.subtitle': '从城市周边到雪山草原，探索 11,000+ 个中国露营地。真实位置、联系方式与社区体验，一站找到下一次出发。',
    'home.searchPlaceholder': '搜索城市、营地或景点', 'home.search': '探索营地', 'home.trust1': '全国城市覆盖', 'home.trust2': '高德地图数据', 'home.trust3': '社区真实评价',
    'home.cardKicker': '本周灵感', 'home.cardTitle': '睡进森林，醒在晨雾里', 'home.cardText': '筛选适合亲子、宠物与新手的营地，让第一次露营也轻松。',
    'home.statCamps': '营地数据', 'home.statCities': '覆盖城市', 'home.statTypes': '营地类型', 'home.browse': '浏览全部营地',
    'list.kicker': 'CampFinder 全国数据库', 'list.title': '去哪里，睡一晚？', 'list.count': '个营地等待探索', 'list.publish': '发布你的营地',
    'filter.keyword': '关键词', 'filter.keywordPlaceholder': '营地、景点或地址', 'filter.province': '省份', 'filter.allProvinces': '全部省份', 'filter.type': '营地类型', 'filter.allTypes': '全部类型', 'filter.amenity': '必备设施', 'filter.any': '不限', 'filter.sort': '排序方式', 'filter.recommended': '综合推荐', 'filter.newest': '最新发布', 'filter.priceAsc': '价格从低到高', 'filter.priceDesc': '价格从高到低', 'filter.submit': '查看结果', 'filter.reset': '重置',
    'map.missing': '配置高德地图 Key 后显示地图', 'list.empty': '没有找到匹配的营地', 'list.emptyHint': '试试更换关键词或减少筛选条件。',
    'card.amap': '高德 POI', 'card.verified': '已核验', 'card.rating': '高德评分', 'card.pending': '信息待确认', 'card.capacity': '最多 {count} 人', 'card.referenceCost': '参考消费', 'card.pricePending': '价格待确认',
    'pagination.previous': '上一页', 'pagination.next': '下一页',
    'detail.amapSource': '高德地图数据 · 未经本站核验', 'detail.about': '关于这个营地', 'detail.opening': '开放信息', 'detail.callConfirm': '请电话确认', 'detail.capacity': '接待能力', 'detail.capacityPending': '待营地主确认', 'detail.rating': '评分', 'detail.noReviews': '暂无评价', 'detail.siteRating': '本站', 'detail.amapRating': '高德', 'detail.source': '数据来源', 'detail.amapPoi': '高德地图 POI', 'detail.userPublished': '用户发布', 'detail.amenities': '设施与规则', 'detail.amenitiesPending': '暂未核实，请联系营地确认',
    'detail.contact': '联系与预订', 'detail.bookingNotice': '预订前请确认开放状态、收费、退改规则和天气。', 'detail.phone': '电话', 'detail.wechat': '微信', 'detail.notProvided': '暂未提供', 'detail.openAmap': '在高德地图查看', 'detail.book': '前往预订', 'detail.edit': '编辑', 'detail.delete': '删除', 'detail.deleteConfirm': '确定删除这个营地吗？',
    'review.title': '旅行者评价', 'review.unit': '条', 'review.score': '评分', 'review.experience': '分享真实体验', 'review.publish': '发布评价', 'review.loginPrefix': '登录', 'review.loginSuffix': '后分享你的体验。', 'review.user': '用户', 'review.delete': '删除评价',
    'form.newKicker': '把好地方分享给更多人', 'form.newTitle': '发布营地', 'form.newSubtitle': '完整、准确的信息会帮助旅行者做出更安心的选择。', 'form.editTitle': '编辑营地信息', 'form.name': '营地名称', 'form.type': '营地类型', 'form.province': '省份', 'form.city': '城市', 'form.district': '区县', 'form.address': '详细地址', 'form.addressHint': '镇、村、景区或道路门牌；用于地图定位', 'form.price': '价格', 'form.priceUnit': '计价单位', 'form.capacity': '最大接待人数', 'form.description': '营地介绍', 'form.facilities': '设施与规则', 'form.season': '开放季节', 'form.phone': '联系电话', 'form.wechat': '联系微信', 'form.bookingUrl': '预订链接', 'form.imageUrl': '图片外链（可选）', 'form.upload': '上传图片（最多 8 张，单张 5MB）', 'form.longitude': '经度（可选）', 'form.latitude': '纬度（可选）', 'form.publish': '发布营地', 'form.save': '保存修改', 'form.cancel': '取消', 'form.deleteImages': '删除已有图片', 'form.deleteImage': '删除',
    'auth.welcome': '欢迎回来', 'auth.loginTitle': '登录 CampFinder', 'auth.username': '用户名', 'auth.password': '密码', 'auth.login': '登录', 'auth.noAccount': '还没有账号？', 'auth.registerFree': '免费注册', 'auth.join': '加入露营社区', 'auth.registerTitle': '创建账号', 'auth.email': '邮箱', 'auth.register': '注册并登录', 'auth.hasAccount': '已有账号？', 'auth.loginNow': '直接登录',
    'footer.tagline': '发现值得出发的中国营地', 'footer.notice': '出行前请向营地主确认开放状态、天气与防火规定', 'error.back': '返回营地列表',
    'flash.loginRequired': '请先登录后再操作', 'flash.noEditPermission': '你没有权限修改这个营地', 'flash.noReviewPermission': '你没有权限删除这条评价', 'flash.created': '营地发布成功', 'flash.updated': '营地信息已更新', 'flash.deleted': '营地已删除', 'flash.reviewCreated': '评价发布成功', 'flash.reviewDeleted': '评价已删除', 'flash.reviewOnce': '每位用户只能评价一次', 'flash.welcome': '欢迎加入 CampFinder', 'flash.welcomeBack': '欢迎回来', 'flash.loggedOut': '你已安全退出'
  },
  en: {
    'site.title': 'CampFinder · Discover Campsites in China', 'site.description': 'Discover, compare and share campsites across China',
    'nav.explore': 'Explore', 'nav.publish': 'List a campsite', 'nav.login': 'Log in', 'nav.register': 'Sign up', 'nav.logout': 'Log out', 'nav.hello': 'Hi',
    'home.kicker': 'EXPLORE · CONNECT · ESCAPE', 'home.title1': 'Trade the city', 'home.title2': 'for the wild.', 'home.subtitle': 'Explore 11,000+ campsites across China—from easy weekend escapes to remote mountain stays. Find real locations, contacts and community insights in one place.',
    'home.searchPlaceholder': 'Search a city, campsite or landmark', 'home.search': 'Explore campsites', 'home.trust1': 'Nationwide coverage', 'home.trust2': 'Amap location data', 'home.trust3': 'Community reviews',
    'home.cardKicker': 'WEEKEND INSPIRATION', 'home.cardTitle': 'Sleep in the forest. Wake in the mist.', 'home.cardText': 'Filter for family-friendly, pet-friendly and beginner-ready places to make your first trip effortless.',
    'home.statCamps': 'campsites', 'home.statCities': 'cities covered', 'home.statTypes': 'camp styles', 'home.browse': 'Browse all campsites',
    'list.kicker': 'CAMPFINDER CHINA DIRECTORY', 'list.title': 'Where will you sleep next?', 'list.count': 'campsites to explore', 'list.publish': 'List your campsite',
    'filter.keyword': 'Search', 'filter.keywordPlaceholder': 'Campsite, landmark or address', 'filter.province': 'Province', 'filter.allProvinces': 'All provinces', 'filter.type': 'Camp style', 'filter.allTypes': 'All styles', 'filter.amenity': 'Must-have', 'filter.any': 'Any', 'filter.sort': 'Sort by', 'filter.recommended': 'Recommended', 'filter.newest': 'Newest', 'filter.priceAsc': 'Price: low to high', 'filter.priceDesc': 'Price: high to low', 'filter.submit': 'Show results', 'filter.reset': 'Reset',
    'map.missing': 'Add an Amap key to display the map', 'list.empty': 'No campsites match your search', 'list.emptyHint': 'Try another keyword or remove a filter.',
    'card.amap': 'Amap POI', 'card.verified': 'Verified', 'card.rating': 'Amap rating', 'card.pending': 'Details pending', 'card.capacity': 'Up to {count} guests', 'card.referenceCost': 'reference spend', 'card.pricePending': 'Price unavailable',
    'pagination.previous': 'Previous', 'pagination.next': 'Next',
    'detail.amapSource': 'Amap listing · Not verified by CampFinder', 'detail.about': 'About this campsite', 'detail.opening': 'Opening hours', 'detail.callConfirm': 'Please call to confirm', 'detail.capacity': 'Capacity', 'detail.capacityPending': 'Confirm with the operator', 'detail.rating': 'Rating', 'detail.noReviews': 'No reviews yet', 'detail.siteRating': 'CampFinder', 'detail.amapRating': 'Amap', 'detail.source': 'Data source', 'detail.amapPoi': 'Amap POI', 'detail.userPublished': 'Community listing', 'detail.amenities': 'Amenities & rules', 'detail.amenitiesPending': 'Not verified yet. Please confirm before your trip.',
    'detail.contact': 'Contact & booking', 'detail.bookingNotice': 'Confirm opening status, rates, cancellation terms and weather before booking.', 'detail.phone': 'Phone', 'detail.wechat': 'WeChat', 'detail.notProvided': 'Not provided', 'detail.openAmap': 'View on Amap', 'detail.book': 'Book now', 'detail.edit': 'Edit', 'detail.delete': 'Delete', 'detail.deleteConfirm': 'Delete this campsite?',
    'review.title': 'Traveller reviews', 'review.unit': 'reviews', 'review.score': 'Rating', 'review.experience': 'Share your experience', 'review.publish': 'Post review', 'review.loginPrefix': 'Log in', 'review.loginSuffix': ' to share your experience.', 'review.user': 'Traveller', 'review.delete': 'Delete review',
    'form.newKicker': 'SHARE A PLACE WORTH DISCOVERING', 'form.newTitle': 'List a campsite', 'form.newSubtitle': 'Complete, accurate details help travellers make safer choices.', 'form.editTitle': 'Edit campsite', 'form.name': 'Campsite name', 'form.type': 'Camp style', 'form.province': 'Province', 'form.city': 'City', 'form.district': 'District', 'form.address': 'Full address', 'form.addressHint': 'Town, village, park or street address; used for map location', 'form.price': 'Price', 'form.priceUnit': 'Price unit', 'form.capacity': 'Maximum guests', 'form.description': 'Description', 'form.facilities': 'Amenities & rules', 'form.season': 'Open season', 'form.phone': 'Phone', 'form.wechat': 'WeChat', 'form.bookingUrl': 'Booking URL', 'form.imageUrl': 'Image URL (optional)', 'form.upload': 'Upload photos (up to 8, 5MB each)', 'form.longitude': 'Longitude (optional)', 'form.latitude': 'Latitude (optional)', 'form.publish': 'Publish campsite', 'form.save': 'Save changes', 'form.cancel': 'Cancel', 'form.deleteImages': 'Remove existing photos', 'form.deleteImage': 'Remove',
    'auth.welcome': 'WELCOME BACK', 'auth.loginTitle': 'Log in to CampFinder', 'auth.username': 'Username', 'auth.password': 'Password', 'auth.login': 'Log in', 'auth.noAccount': 'New to CampFinder?', 'auth.registerFree': 'Create an account', 'auth.join': 'JOIN THE OUTDOOR COMMUNITY', 'auth.registerTitle': 'Create your account', 'auth.email': 'Email', 'auth.register': 'Sign up', 'auth.hasAccount': 'Already have an account?', 'auth.loginNow': 'Log in',
    'footer.tagline': 'Find a campsite worth the journey', 'footer.notice': 'Always confirm opening status, weather and fire restrictions before travelling', 'error.back': 'Back to campsites',
    'flash.loginRequired': 'Please log in first', 'flash.noEditPermission': 'You do not have permission to edit this campsite', 'flash.noReviewPermission': 'You do not have permission to delete this review', 'flash.created': 'Campsite published', 'flash.updated': 'Campsite updated', 'flash.deleted': 'Campsite deleted', 'flash.reviewCreated': 'Review posted', 'flash.reviewDeleted': 'Review deleted', 'flash.reviewOnce': 'Each user may review a campsite once', 'flash.welcome': 'Welcome to CampFinder', 'flash.welcomeBack': 'Welcome back', 'flash.loggedOut': 'You have been logged out'
  }
};

const valueTranslations = {
  '山野营地': 'Mountain & wild', '湖畔营地': 'Lakeside', '海边营地': 'Seaside', '森林营地': 'Forest', '草原营地': 'Grassland', '房车营地': 'RV park', '亲子营地': 'Family', '精致露营': 'Glamping',
  '卫生间': 'Restrooms', '淋浴': 'Showers', '水电桩': 'RV hookups', '停车场': 'Parking', '可明火': 'Campfires allowed', '可带宠物': 'Pet-friendly', '儿童活动': 'Kids activities', '装备租赁': 'Gear rental', '餐饮': 'Food & drinks', '手机信号': 'Mobile signal',
  '帐篷/晚': 'tent / night', '人/晚': 'guest / night', '车位/晚': 'pitch / night', '整租/晚': 'site / night', '全年': 'Year-round', '请电话确认': 'Please call to confirm'
};

const flashKeys = {
  '请先登录后再操作': 'flash.loginRequired', '你没有权限修改这个营地': 'flash.noEditPermission', '你没有权限删除这条评价': 'flash.noReviewPermission',
  '营地发布成功': 'flash.created', '营地信息已更新': 'flash.updated', '营地已删除': 'flash.deleted', '评价发布成功': 'flash.reviewCreated', '评价已删除': 'flash.reviewDeleted',
  '每位用户只能评价一次': 'flash.reviewOnce', '欢迎加入 CampFinder': 'flash.welcome', '欢迎回来': 'flash.welcomeBack', '你已安全退出': 'flash.loggedOut'
};

function createI18n(lang = 'zh') {
  const locale = lang === 'en' ? 'en' : 'zh';
  const t = (key, variables = {}) => {
    let text = translations[locale][key] || translations.zh[key] || key;
    Object.entries(variables).forEach(([name, value]) => { text = text.replaceAll(`{${name}}`, value); });
    return text;
  };
  const tv = value => locale === 'en' ? (valueTranslations[value] || value) : value;
  const tf = value => locale === 'en' ? t(flashKeys[value] || value) : value;
  return { lang: locale, t, tv, tf };
}

module.exports = { createI18n };
