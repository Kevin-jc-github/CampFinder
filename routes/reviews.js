const express = require('express');
const router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const Review = require('../models/review');
const reviews = require('../controllers/reviews');
const {validateReview ,isLoggedIn, isReviewAuthor} = require('../middleware');
 
router.post('/', isLoggedIn ,validateReview, catchAsync(reviews.createReview));

router.delete('/:reviewId', isReviewAuthor,isLoggedIn,catchAsync(reviews.deleteReview));

module.exports = router;