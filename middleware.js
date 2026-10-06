const { campgroundSchema, reviewSchema, fieldReportSchema } = require('./schemas');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');

module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) res.locals.returnTo = req.session.returnTo;
  next();
};
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash('error', '请先登录后再操作');
    return res.redirect('/login');
  }
  next();
};
module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body, { abortEarly: false });
  if (error) throw new ExpressError(error.details.map(item => item.message).join('；'), 400);
  next();
};
module.exports.isAuthor = async (req, res, next) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) throw new ExpressError('未找到该营地', 404);
  if (!campground.author.equals(req.user._id)) {
    req.flash('error', '你没有权限修改这个营地');
    return res.redirect(`/campgrounds/${req.params.id}`);
  }
  res.locals.campground = campground;
  next();
};
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body, { abortEarly: false });
  if (error) throw new ExpressError(error.details.map(item => item.message).join('；'), 400);
  next();
};

module.exports.validateFieldReport = (req, res, next) => {
  const { error } = fieldReportSchema.validate(req.body, { abortEarly: false });
  if (error) throw new ExpressError(error.details.map(item => item.message).join('；'), 400);
  next();
};
module.exports.isReviewAuthor = async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) throw new ExpressError('未找到该评价', 404);
  if (!review.author.equals(req.user._id)) {
    req.flash('error', '你没有权限删除这条评价');
    return res.redirect(`/campgrounds/${req.params.id}`);
  }
  next();
};
