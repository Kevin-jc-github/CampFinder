const express = require('express');
const catchAsync = require('../utils/catchAsync');
const quality = require('../controllers/quality');
const router = express.Router();
router.get('/', catchAsync(quality.dashboard));
module.exports = router;
