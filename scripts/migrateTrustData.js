if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const mongoose = require('mongoose');
const Campground = require('../models/campground');
const Evidence = require('../models/evidence');
const { computeReliability } = require('../services/reliabilityEngine');
const { evidenceFromCampground } = require('../services/sourceEvidence');

const BATCH_SIZE = 300;

async function run() {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/campfinder-cn');
  const total = await Campground.countDocuments({});
  const cursor = Campground.find({}).lean().cursor();
  let batch = [];
  let processed = 0;

  async function flush() {
    if (!batch.length) return;
    const evidenceDocs = batch.map(evidenceFromCampground);
    await Evidence.bulkWrite(evidenceDocs.map(evidence => ({
      updateOne: {
        filter: { campground: evidence.campground, sourceType: evidence.sourceType, sourceId: evidence.sourceId },
        update: { $set: evidence },
        upsert: true
      }
    })), { ordered: false });
    await Campground.bulkWrite(batch.map((campground, index) => ({
      updateOne: {
        filter: { _id: campground._id },
        update: { $set: { reliability: computeReliability({ campground, evidence: [evidenceDocs[index]], reports: [] }) } }
      }
    })), { ordered: false });
    processed += batch.length;
    console.log(`可信度迁移: ${processed}/${total}`);
    batch = [];
  }

  for await (const campground of cursor) {
    batch.push(campground);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
  console.log(`完成：${processed} 个营地，${await Evidence.countDocuments({})} 条证据。`);
  await mongoose.disconnect();
}

run().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
