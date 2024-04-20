const Campground = require('../models/campground');
<<<<<<< HEAD
=======
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding-v6");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");
>>>>>>> ebf3e3b (add map, change styling)


module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
<<<<<<< HEAD
    res.render('campgrounds/index', { campgrounds });
=======
    res.render('campgrounds/index', { campgrounds })
>>>>>>> ebf3e3b (add map, change styling)
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
<<<<<<< HEAD
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    await campground.save();
=======
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    console.log(campground);
>>>>>>> ebf3e3b (add map, change styling)
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

<<<<<<< HEAD
module.exports.showCampground = async (req, res) => {
=======
module.exports.showCampground = async (req, res,) => {
>>>>>>> ebf3e3b (add map, change styling)
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
<<<<<<< HEAD
        return res.render('campgrounds/show', { campground });
=======
        return res.redirect('/campgrounds');
>>>>>>> ebf3e3b (add map, change styling)
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
<<<<<<< HEAD
    const campground = await Campground.findById(req.params.id);
=======
    const { id } = req.params;
    const campground = await Campground.findById(id)
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
>>>>>>> ebf3e3b (add map, change styling)
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
<<<<<<< HEAD
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`);
=======
    console.log(req.body);
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`)
>>>>>>> ebf3e3b (add map, change styling)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
<<<<<<< HEAD
    req.flash('success', 'Successfully delete a campground!');
=======
    req.flash('success', 'Successfully deleted campground')
>>>>>>> ebf3e3b (add map, change styling)
    res.redirect('/campgrounds');
}