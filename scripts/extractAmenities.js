if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const mongoose = require('mongoose');
const Campground = require('../models/campground');
const Evidence = require('../models/evidence');
const { extractAmenities } = require('../services/amenityExtractor');

async function run() {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/campfinder-cn');
  const cursor = Campground.find({ status: 'published' }).select('description title sourceBusinessHours amenities').lean().cursor();
  let operations = [];
  let processed = 0;
  let extracted = 0;
  async function flush() {
    if (!operations.length) return;
    await Campground.bulkWrite(operations, { ordered: false });
    operations = [];
  }
  for await (const campground of cursor) {
    const text = [campground.title, campground.description, campground.sourceBusinessHours].filter(Boolean).join(' ');
    const result = extractAmenities(text);
    const existing = new Set(campground.amenities || []);
    const inferredAmenities = result.positive.filter(item => !existing.has(item.amenity));
    operations.push({ updateOne: { filter: { _id: campground._id }, update: { $set: { inferredAmenities } } } });
    if (inferredAmenities.length) {
      extracted += 1;
      await Evidence.updateOne(
        { campground: campground._id, sourceType: 'system', sourceId: `extractor:${result.modelVersion}` },
        { $set: { campground: campground._id, sourceType: 'system', sourceId: `extractor:${result.modelVersion}`, sourceName: 'CampFinder amenity extractor', capturedAt: new Date(), claims: inferredAmenities.map(item => ({ field: 'amenities', value: item.amenity, confidence: item.confidence })), status: 'active' } },
        { upsert: true }
      );
    }
    processed += 1;
    if (operations.length >= 500) await flush();
  }
  await flush();
  console.log(`设施抽取完成：扫描 ${processed} 条，${extracted} 条产生推断结果。`);
  await mongoose.disconnect();
}
run().catch(async error => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
