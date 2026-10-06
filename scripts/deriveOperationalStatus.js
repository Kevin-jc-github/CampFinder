if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const mongoose = require('mongoose');
const Campground = require('../models/campground');
const { inferOperationalStatus } = require('../services/operationalStatus');

async function run() {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/campfinder-cn');
  const cursor = Campground.find({}).select('title sourceBusinessHours operationalStatus').lean().cursor();
  let operations = [];
  const counts = { unknown: 0, open: 0, temporarily_closed: 0, closed: 0 };
  async function flush() { if (operations.length) { await Campground.bulkWrite(operations, { ordered: false }); operations = []; } }
  for await (const campground of cursor) {
    const operationalStatus = inferOperationalStatus(`${campground.title} ${campground.sourceBusinessHours || ''}`);
    counts[operationalStatus] += 1;
    operations.push({ updateOne: { filter: { _id: campground._id }, update: { $set: { operationalStatus } } } });
    if (operations.length >= 500) await flush();
  }
  await flush();
  console.log(JSON.stringify(counts));
  await mongoose.disconnect();
}
run().catch(async error => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
