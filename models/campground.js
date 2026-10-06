const mongoose = require('mongoose');
const Review = require('./review');

const { Schema } = mongoose;
const ImageSchema = new Schema({ url: { type: String, required: true }, filename: String }, { _id: false });

const ReliabilitySchema = new Schema({
  score: { type: Number, min: 0, max: 100, default: 0 },
  level: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  components: {
    source: { type: Number, min: 0, max: 25, default: 0 },
    recency: { type: Number, min: 0, max: 25, default: 0 },
    completeness: { type: Number, min: 0, max: 25, default: 0 },
    community: { type: Number, min: 0, max: 15, default: 0 },
    consistency: { type: Number, min: 0, max: 10, default: 10 }
  },
  reasons: { type: [String], default: [] },
  confirmationCount: { type: Number, min: 0, default: 0 },
  openIssueCount: { type: Number, min: 0, default: 0 },
  lastConfirmedAt: Date,
  calculatedAt: Date,
  algorithmVersion: { type: String, default: 'trust-v1' }
}, { _id: false });

const InferredAmenitySchema = new Schema({
  amenity: {
    type: String,
    enum: ['卫生间', '淋浴', '水电桩', '停车场', '可明火', '可带宠物', '儿童活动', '装备租赁', '餐饮', '手机信号'],
    required: true
  },
  confidence: { type: Number, min: 0, max: 1, required: true },
  evidenceText: { type: String, maxlength: 200, default: '' },
  modelVersion: { type: String, default: 'amenity-rules-v1' }
}, { _id: false });

const CampgroundSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  images: { type: [ImageSchema], default: [] },
  geometry: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [116.397428, 39.90923] }
  },
  price: { type: Number, min: 0, default: null },
  priceUnit: { type: String, enum: ['帐篷/晚', '人/晚', '车位/晚', '整租/晚'], default: '帐篷/晚' },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  location: { type: String, required: true, trim: true, maxlength: 160 },
  province: { type: String, required: true, trim: true, maxlength: 30 },
  city: { type: String, required: true, trim: true, maxlength: 30 },
  district: { type: String, trim: true, maxlength: 30, default: '' },
  type: {
    type: String,
    enum: ['山野营地', '湖畔营地', '海边营地', '森林营地', '草原营地', '房车营地', '亲子营地', '精致露营'],
    default: '山野营地'
  },
  amenities: [{
    type: String,
    enum: ['卫生间', '淋浴', '水电桩', '停车场', '可明火', '可带宠物', '儿童活动', '装备租赁', '餐饮', '手机信号']
  }],
  inferredAmenities: { type: [InferredAmenitySchema], default: [] },
  capacity: { type: Number, min: 1, max: 5000, default: null },
  bookingUrl: { type: String, trim: true, default: '' },
  contactPhone: { type: String, trim: true, default: '' },
  wechat: { type: String, trim: true, default: '' },
  openSeason: { type: String, trim: true, default: '全年' },
  verified: { type: Boolean, default: false },
  dataSource: { type: String, enum: ['user', 'amap', 'demo'], default: 'user' },
  sourceId: { type: String, trim: true },
  sourceRating: { type: Number, min: 0, max: 5, default: null },
  sourceReferenceCost: { type: Number, min: 0, default: null },
  sourceBusinessHours: { type: String, trim: true, default: '' },
  sourceUpdatedAt: Date,
  operationalStatus: { type: String, enum: ['unknown', 'open', 'temporarily_closed', 'closed'], default: 'unknown' },
  reliability: { type: ReliabilitySchema, default: () => ({}) },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, toJSON: { virtuals: true } });

CampgroundSchema.index({ geometry: '2dsphere' });
CampgroundSchema.index({ status: 1 });
CampgroundSchema.index({ status: 1, 'reliability.score': -1 });
CampgroundSchema.index({ province: 1, city: 1, type: 1, price: 1 });
CampgroundSchema.index({ title: 'text', description: 'text', location: 'text' });
CampgroundSchema.index({ dataSource: 1, sourceId: 1 }, { unique: true, sparse: true });
CampgroundSchema.virtual('coverImage').get(function coverImage() {
  return this.images[0]?.url || '/images/camp-placeholder.svg';
});
CampgroundSchema.post('findOneAndDelete', async function removeReviews(doc) {
  if (doc) await Review.deleteMany({ _id: { $in: doc.reviews } });
});

module.exports = mongoose.model('Campground', CampgroundSchema);
