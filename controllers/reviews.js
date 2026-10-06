const Campground = require('../models/campground');
const Review = require('../models/review');
const ExpressError = require('../utils/ExpressError');

module.exports.createReview = async (req, res) => {
  const campground = await Campground.findById(req.params.id).populate('reviews');
  if (!campground) throw new ExpressError('未找到该营地', 404);
  if (campground.reviews.some(review => review.author.equals(req.user._id))) {
    req.flash('error', '每位用户只能评价一次');
    return res.redirect(`/campgrounds/${campground._id}`);
  }
  const review = new Review({ ...req.body.review, author: req.user._id });
  campground.reviews.push(review);
  await Promise.all([review.save(), campground.save()]);
  req.flash('success', '评价发布成功');
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async (req, res) => {
  await Promise.all([
    Campground.findByIdAndUpdate(req.params.id, { $pull: { reviews: req.params.reviewId } }),
    Review.findByIdAndDelete(req.params.reviewId)
  ]);
  req.flash('success', '评价已删除');
  res.redirect(`/campgrounds/${req.params.id}`);
};
