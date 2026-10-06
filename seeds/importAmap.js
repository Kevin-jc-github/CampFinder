if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Campground = require('../models/campground');
const User = require('../models/user');
const { inferOperationalStatus } = require('../services/operationalStatus');

const featuredCities = [
  { name: '北京市', adcode: '110000' }, { name: '上海市', adcode: '310000' },
  { name: '杭州市', adcode: '330100' }, { name: '南京市', adcode: '320100' },
  { name: '成都市', adcode: '510100' }, { name: '重庆市', adcode: '500000' },
  { name: '广州市', adcode: '440100' }, { name: '深圳市', adcode: '440300' }
];
const specialRegions = [
  { name: '北京市', adcode: '110000' }, { name: '天津市', adcode: '120000' },
  { name: '上海市', adcode: '310000' }, { name: '重庆市', adcode: '500000' },
  { name: '香港特别行政区', adcode: '810000' }, { name: '澳门特别行政区', adcode: '820000' }
];
const demoTitles = [
  '莫干山竹海轻奢营地', '千岛湖星空湖畔营地', '崇礼山谷房车公园', '乌兰布统草原营地',
  '惠州双月湾海风营地', '成都龙泉山亲子营地', '大理苍山森林营地', '北京白河峡谷自助营地'
];

const allMode = process.argv.includes('--all');
const cacheDirectory = path.join(__dirname, '..', '.cache');
const progressFile = path.join(cacheDirectory, 'amap-import-progress.json');
const pageSize = 25;
const maxPages = Math.max(1, Number(process.env.AMAP_IMPORT_MAX_PAGES) || 40);
const delayMs = Math.max(80, Number(process.env.AMAP_IMPORT_DELAY_MS) || 180);
const cityLimit = Math.max(0, Number(process.env.AMAP_IMPORT_CITY_LIMIT) || 0);

function scalar(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function numberOrNull(value) {
  if ((typeof value !== 'string' && typeof value !== 'number') || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function inferType(name) {
  if (/房车/.test(name)) return '房车营地';
  if (/海|湾|沙滩/.test(name)) return '海边营地';
  if (/湖|水库|溪|江|河/.test(name)) return '湖畔营地';
  if (/森林|林场|竹|丛林/.test(name)) return '森林营地';
  if (/草原|草场/.test(name)) return '草原营地';
  if (/亲子|农场|乐园/.test(name)) return '亲子营地';
  if (/轻奢|glamping|帐篷酒店/i.test(name)) return '精致露营';
  return '山野营地';
}

function isQuotaError(error) {
  return /LIMIT|配额|10003|10004|10021|10044/.test(error.message);
}

async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function amapRequest(endpoint, params) {
  const url = new URL(`https://restapi.amap.com${endpoint}`);
  url.searchParams.set('key', process.env.AMAP_WEB_SERVICE_KEY);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (data.status !== '1') throw new Error(`${data.info} (${data.infocode})`);
      await sleep(delayMs);
      return data;
    } catch (error) {
      if (isQuotaError(error) || attempt === 4) throw error;
      await sleep(attempt * 800);
    }
  }
  throw new Error('高德接口请求失败');
}

async function getAllCities() {
  const data = await amapRequest('/v3/config/district', {
    keywords: '中国', subdistrict: '2', extensions: 'base'
  });
  const provinces = data.districts?.[0]?.districts || [];
  const cities = provinces.flatMap(province => (province.districts || [])
    .filter(item => item.level === 'city')
    .map(item => ({ name: item.name, adcode: item.adcode })));
  const unique = new Map([...cities, ...specialRegions].map(city => [city.adcode, city]));
  return [...unique.values()].sort((a, b) => a.adcode.localeCompare(b.adcode));
}

async function fetchCity(city) {
  const first = await amapRequest('/v3/place/text', {
    types: '080504', city: city.adcode, citylimit: 'true', offset: String(pageSize), page: '1', extensions: 'all'
  });
  const total = Number(first.count) || 0;
  const totalPages = Math.min(maxPages, Math.ceil(total / pageSize));
  const pois = [...(first.pois || [])];
  for (let page = 2; page <= totalPages; page += 1) {
    const data = await amapRequest('/v3/place/text', {
      types: '080504', city: city.adcode, citylimit: 'true', offset: String(pageSize), page: String(page), extensions: 'all'
    });
    if (!data.pois?.length) break;
    pois.push(...data.pois);
  }
  return { pois, reportedTotal: total, capped: totalPages < Math.ceil(total / pageSize) };
}

function toCampground(poi, authorId, city) {
  const [lng, lat] = scalar(poi.location).split(',').map(Number);
  const name = scalar(poi.name, '未命名营地');
  const address = scalar(poi.address, '详细地址待确认');
  const rating = numberOrNull(poi.biz_ext?.rating);
  const referenceCost = numberOrNull(poi.biz_ext?.cost);
  const hours = scalar(poi.biz_ext?.opentime2) || scalar(poi.biz_ext?.open_time);
  const images = (poi.photos || [])
    .map(photo => scalar(photo.url).replace(/^http:/, 'https:'))
    .filter(Boolean)
    .slice(0, 3)
    .map(url => ({ url }));
  const province = scalar(poi.pname, city.name);
  const cityName = scalar(poi.cityname, city.name);
  const district = scalar(poi.adname);
  const mapUrl = new URL('https://uri.amap.com/marker');
  mapUrl.searchParams.set('position', `${lng},${lat}`);
  mapUrl.searchParams.set('name', name);
  mapUrl.searchParams.set('src', 'campfinder');
  mapUrl.searchParams.set('coordinate', 'gaode');
  mapUrl.searchParams.set('callnative', '0');

  return {
    title: name,
    images,
    geometry: { type: 'Point', coordinates: [lng, lat] },
    price: null,
    description: `${name}是高德地图收录的露营地，位于${province}${cityName}${district}${address}。营业时间、收费标准、过夜政策和设施情况可能变化，请出发前电话确认。`,
    location: address,
    province,
    city: cityName,
    district,
    type: inferType(name),
    amenities: [],
    capacity: null,
    bookingUrl: mapUrl.toString(),
    contactPhone: scalar(poi.tel).split(';')[0],
    openSeason: '请电话确认',
    verified: false,
    dataSource: 'amap',
    sourceId: scalar(poi.id),
    sourceRating: rating,
    sourceReferenceCost: referenceCost,
    sourceBusinessHours: hours,
    sourceUpdatedAt: new Date(),
    operationalStatus: inferOperationalStatus(`${name} ${hours}`),
    status: 'published',
    author: authorId
  };
}

async function loadProgress() {
  if (!allMode) return { completed: [], failed: {} };
  try {
    return JSON.parse(await fs.readFile(progressFile, 'utf8'));
  } catch {
    return { completed: [], failed: {} };
  }
}

async function saveProgress(progress) {
  if (!allMode) return;
  await fs.mkdir(cacheDirectory, { recursive: true });
  await fs.writeFile(progressFile, JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }, null, 2));
}

async function upsertPois(pois, authorId, city) {
  const valid = pois.filter(poi => poi.id && /^\d+(\.\d+)?,\d+(\.\d+)?$/.test(scalar(poi.location)));
  if (!valid.length) return 0;
  await Campground.bulkWrite(valid.map(poi => ({
    updateOne: {
      filter: { dataSource: 'amap', sourceId: poi.id },
      update: { $set: toCampground(poi, authorId, city) },
      upsert: true
    }
  })), { ordered: false });
  return valid.length;
}

async function run() {
  if (!process.env.AMAP_WEB_SERVICE_KEY) throw new Error('缺少 AMAP_WEB_SERVICE_KEY');
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/campfinder-cn');
  let importUser = await User.findOne({ username: 'campfinder_amap' });
  if (!importUser) {
    importUser = await User.register(
      new User({ username: 'campfinder_amap', email: 'amap-import@campfinder.local' }),
      crypto.randomBytes(32).toString('hex')
    );
  }

  const discoveredCities = allMode ? await getAllCities() : featuredCities;
  const cities = cityLimit ? discoveredCities.slice(0, cityLimit) : discoveredCities;
  const progress = await loadProgress();
  const completed = new Set(progress.completed || []);
  let imported = 0;
  let processed = 0;
  console.log(`模式: ${allMode ? '全国' : '精选城市'}；城市数: ${cities.length}；已完成: ${completed.size}`);

  for (const [index, city] of cities.entries()) {
    if (completed.has(city.adcode)) continue;
    try {
      const result = await fetchCity(city);
      const count = await upsertPois(result.pois, importUser._id, city);
      imported += count;
      processed += 1;
      completed.add(city.adcode);
      delete progress.failed?.[city.adcode];
      progress.completed = [...completed];
      await saveProgress(progress);
      console.log(`[${index + 1}/${cities.length}] ${city.name}: 高德报告 ${result.reportedTotal}，同步 ${count}${result.capped ? `（达到每城 ${maxPages * pageSize} 条上限）` : ''}`);
    } catch (error) {
      progress.failed = { ...(progress.failed || {}), [city.adcode]: { name: city.name, error: error.message } };
      await saveProgress(progress);
      console.error(`[${index + 1}/${cities.length}] ${city.name}: 失败 - ${error.message}`);
      if (isQuotaError(error)) {
        console.error('检测到高德配额限制，已保存进度；下次运行 npm run import:amap:all 将断点续跑。');
        break;
      }
    }
  }

  const demoUser = await User.findOne({ username: 'campfinder_demo' });
  const demoFilter = demoUser ? { author: demoUser._id, title: { $in: demoTitles } } : { title: { $in: demoTitles } };
  const removed = await Campground.deleteMany(demoFilter);
  const total = await Campground.countDocuments({ dataSource: 'amap' });
  console.log(`本轮完成城市: ${processed}；本轮同步记录: ${imported}；高德 POI 总数: ${total}；移除演示数据: ${removed.deletedCount}`);
  console.log('提示：高德 POI 未经 Camping Recommend System 人工核验，生产使用前请确认高德数据许可条款。');
  await mongoose.disconnect();
}

run().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
