if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const mongoose = require('mongoose');
const Campground = require('../models/campground');
const Review = require('../models/review');
const User = require('../models/user');

const camps = [
  { title: '莫干山竹海轻奢营地', province: '浙江省', city: '湖州市', district: '德清县', location: '莫干山镇劳岭村', type: '精致露营', price: 680, priceUnit: '帐篷/晚', capacity: 48, coordinates: [119.881, 30.612], amenities: ['卫生间','淋浴','停车场','儿童活动','装备租赁','餐饮','手机信号'], openSeason: '3月至11月', description: '位于竹海和茶园之间，提供搭建完成的帐篷、床品和早餐，适合第一次露营与亲子家庭。' },
  { title: '千岛湖星空湖畔营地', province: '浙江省', city: '杭州市', district: '淳安县', location: '千岛湖镇近郊湖畔', type: '湖畔营地', price: 320, priceUnit: '帐篷/晚', capacity: 80, coordinates: [119.043, 29.608], amenities: ['卫生间','淋浴','停车场','可带宠物','装备租赁','手机信号'], openSeason: '4月至10月', description: '临湖草地视野开阔，可看日落和星空。部分区域允许自带帐篷，节假日建议提前预约。' },
  { title: '崇礼山谷房车公园', province: '河北省', city: '张家口市', district: '崇礼区', location: '太子城山谷', type: '房车营地', price: 260, priceUnit: '车位/晚', capacity: 120, coordinates: [115.431, 40.958], amenities: ['卫生间','淋浴','水电桩','停车场','餐饮','手机信号'], openSeason: '全年', description: '面向房车与自驾用户的四季营地，配有水电桩、公共卫浴和补给点，冬季需关注道路情况。' },
  { title: '乌兰布统草原营地', province: '内蒙古自治区', city: '赤峰市', district: '克什克腾旗', location: '乌兰布统苏木草原景区附近', type: '草原营地', price: 180, priceUnit: '人/晚', capacity: 150, coordinates: [117.33, 42.502], amenities: ['卫生间','停车场','装备租赁','餐饮','手机信号'], openSeason: '6月至9月', description: '草原日落、银河和骑马体验是主要特色。昼夜温差大，需准备保暖衣物并遵守草原防火规定。' },
  { title: '惠州双月湾海风营地', province: '广东省', city: '惠州市', district: '惠东县', location: '港口滨海旅游度假区', type: '海边营地', price: 299, priceUnit: '帐篷/晚', capacity: 90, coordinates: [114.883, 22.621], amenities: ['卫生间','淋浴','停车场','可带宠物','装备租赁','餐饮','手机信号'], openSeason: '全年，台风天气关闭', description: '步行可达沙滩，适合看海上日出。夏季注意防晒，台风和强对流天气期间会临时关闭。' },
  { title: '成都龙泉山亲子营地', province: '四川省', city: '成都市', district: '龙泉驿区', location: '龙泉山城市森林公园周边', type: '亲子营地', price: 220, priceUnit: '帐篷/晚', capacity: 60, coordinates: [104.273, 30.568], amenities: ['卫生间','停车场','可明火','儿童活动','装备租赁','餐饮','手机信号'], openSeason: '全年', description: '从成都城区出发方便，设有自然教育和儿童活动区域，适合周末短途与家庭聚会。' },
  { title: '大理苍山森林营地', province: '云南省', city: '大理白族自治州', district: '大理市', location: '苍山脚下感通片区', type: '森林营地', price: 380, priceUnit: '帐篷/晚', capacity: 36, coordinates: [100.142, 25.594], amenities: ['卫生间','淋浴','停车场','装备租赁','餐饮','手机信号'], openSeason: '全年，雨季关注天气', description: '背靠苍山、远眺洱海，营位密度较低。雨季需提前确认道路和营地开放状态。' },
  { title: '北京白河峡谷自助营地', province: '北京市', city: '北京市', district: '怀柔区', location: '琉璃庙镇白河峡谷沿线', type: '山野营地', price: 120, priceUnit: '帐篷/晚', capacity: 45, coordinates: [116.685, 40.659], amenities: ['卫生间','停车场','可带宠物','手机信号'], openSeason: '4月至10月', description: '偏自助型山野营地，适合有经验的露营用户。汛期、森林防火期可能关闭，出发前必须确认。' }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/campfinder-cn');
  await Promise.all([Campground.deleteMany({}), Review.deleteMany({})]);
  let user = await User.findOne({ username: 'campfinder_demo' });
  if (!user) user = await User.register(new User({ username: 'campfinder_demo', email: 'demo@campfinder.cn' }), process.env.SEED_PASSWORD || 'CampFinder2026!');
  await Campground.insertMany(camps.map(camp => ({
    ...camp,
    author: user._id,
    geometry: { type: 'Point', coordinates: camp.coordinates },
    images: [{ url: '/images/camp-placeholder.svg' }],
    verified: false,
    dataSource: 'demo'
  })));
  console.log(`已写入 ${camps.length} 个中国营地示例`);
  await mongoose.disconnect();
}

seed().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
