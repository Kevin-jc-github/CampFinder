const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  field: {
    type: String,
    enum: ['identity', 'location', 'phone', 'hours', 'price', 'amenities', 'status', 'photos', 'description'],
    required: true
  },
  value: mongoose.Schema.Types.Mixed,
  confidence: { type: Number, min: 0, max: 1, default: 0.5 }
}, { _id: false });

const EvidenceSchema = new mongoose.Schema({
  campground: { type: mongoose.Schema.Types.ObjectId, ref: 'Campground', required: true, index: true },
  sourceType: {
    type: String,
    enum: ['amap', 'owner', 'community', 'system', 'user_listing'],
    required: true
  },
  sourceId: { type: String, required: true },
  sourceName: { type: String, required: true },
  sourceUrl: { type: String, default: '' },
  claims: { type: [ClaimSchema], default: [] },
  capturedAt: { type: Date, required: true, default: Date.now },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'superseded', 'disputed'], default: 'active' },
  licenseNote: { type: String, default: '' }
}, { timestamps: true });

EvidenceSchema.index({ campground: 1, sourceType: 1, sourceId: 1 }, { unique: true });
EvidenceSchema.index({ campground: 1, status: 1, capturedAt: -1 });

module.exports = mongoose.model('Evidence', EvidenceSchema);
