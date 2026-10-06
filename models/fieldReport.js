const mongoose = require('mongoose');

const FieldReportSchema = new mongoose.Schema({
  campground: { type: mongoose.Schema.Types.ObjectId, ref: 'Campground', required: true, index: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportType: {
    type: String,
    enum: ['confirm_open', 'closed', 'incorrect_location', 'incorrect_contact', 'incorrect_hours', 'incorrect_price', 'incorrect_amenity', 'safety_issue', 'other'],
    required: true
  },
  field: {
    type: String,
    enum: ['', 'status', 'location', 'phone', 'hours', 'price', 'amenities', 'safety'],
    default: ''
  },
  proposedValue: { type: String, trim: true, maxlength: 500, default: '' },
  comment: { type: String, trim: true, maxlength: 1000, default: '' },
  observedAt: { type: Date, required: true },
  moderationStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  timeBucket: { type: String, required: true },
  evidence: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' }
}, { timestamps: true });

FieldReportSchema.index({ campground: 1, reporter: 1, reportType: 1, timeBucket: 1 }, { unique: true });
FieldReportSchema.index({ campground: 1, moderationStatus: 1, observedAt: -1 });

module.exports = mongoose.model('FieldReport', FieldReportSchema);
