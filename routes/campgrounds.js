const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
<<<<<<< HEAD
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const {isLoggedIn,validateCampground, isAuthor} = require('../middleware.js')
const campgrounds = require('../controllers/campgrounds.js')


router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground));
=======
const {isLoggedIn,validateCampground, isAuthor} = require('../middleware')
const campgrounds = require('../controllers/campgrounds.js')
const multer = require('multer')
const {storage} = require('../cloudinary');
const upload = multer({ storage });
const Campground = require('../models/campground');

router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'),validateCampground, catchAsync(campgrounds.createCampground));

>>>>>>> ebf3e3b (add map, change styling)

router.get('/new', isLoggedIn, campgrounds.renderNewForm);


router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
<<<<<<< HEAD
    .put(isLoggedIn, isAuthor, validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));


//for edit the camp by id
router.get('/:id/edit', isAuthor, isLoggedIn, catchAsync(campgrounds.renderEditForm));
=======
    .put(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, catchAsync(campgrounds.deleteCampground));


//for edit the camp by id
router.get('/:id/edit', isLoggedIn, catchAsync(campgrounds.renderEditForm));
>>>>>>> ebf3e3b (add map, change styling)


module.exports = router;