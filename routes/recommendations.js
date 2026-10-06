const express = require('express');
const catchAsync = require('../utils/catchAsync');
const recommendations = require('../controllers/recommendations');
const router = express.Router();
router.get('/', recommendations.renderForm);
router.post('/', catchAsync(recommendations.recommend));
module.exports = router;
