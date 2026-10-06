const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  body: { type: String, required: true, trim: true, maxlength: 1000 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
module.exports = mongoose.model('Review', reviewSchema);
