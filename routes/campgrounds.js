const express = require('express');
const catchAsync = require('../utils/catchAsync');
const campgrounds = require('../controllers/campgrounds');
const upload = require('../config/upload');
const fieldReports = require('../controllers/fieldReports');
const { isLoggedIn, validateCampground, isAuthor, validateFieldReport } = require('../middleware');

const router = express.Router();
router.route('/')
  .get(catchAsync(campgrounds.index))
  .post(isLoggedIn, upload.array('images', 8), validateCampground, catchAsync(campgrounds.createCampground));
router.get('/new', isLoggedIn, campgrounds.renderNewForm);
router.get('/:id/edit', isLoggedIn, catchAsync(isAuthor), catchAsync(campgrounds.renderEditForm));
router.post('/:id/reports', isLoggedIn, validateFieldReport, catchAsync(fieldReports.create));
router.route('/:id')
  .get(catchAsync(campgrounds.showCampground))
  .put(isLoggedIn, upload.array('images', 8), validateCampground, catchAsync(isAuthor), catchAsync(campgrounds.updateCampground))
  .delete(isLoggedIn, catchAsync(isAuthor), catchAsync(campgrounds.deleteCampground));

module.exports = router;
