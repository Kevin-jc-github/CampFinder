const express = require('express');
const catchAsync = require('../utils/catchAsync');
const reviews = require('../controllers/reviews');
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');

const router = express.Router({ mergeParams: true });
router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview));
router.delete('/:reviewId', isLoggedIn, catchAsync(isReviewAuthor), catchAsync(reviews.deleteReview));
module.exports = router;
