const fs = require('fs/promises');
const path = require('path');
const Campground = require('../models/campground');
const { resolveCoordinates } = require('../services/geocoder');
const { buildCampgroundFilter, getSort } = require('../utils/campgroundFilters');
const Evidence = require('../models/evidence');
const FieldReport = require('../models/fieldReport');
const { evidenceFromCampground } = require('../services/sourceEvidence');
const { recalculateReliability } = require('../services/reliabilityService');
const { extractAmenities } = require('../services/amenityExtractor');

const PAGE_SIZE = 12;

function normalizePayload(body) {
  const data = { ...body };
  data.amenities = data.amenities ? [].concat(data.amenities) : [];
  delete data.imageUrl;
  delete data.longitude;
  delete data.latitude;
  return data;
}

function uploadedImages(files = []) {
  return files.map(file => ({ url: `/uploads/${file.filename}`, filename: file.filename }));
}

async function removeLocalImage(filename) {
  if (!filename || path.basename(filename) !== filename) return;
  try {
    await fs.unlink(path.join(__dirname, '..', 'uploads', filename));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

module.exports.index = async (req, res) => {
  const filter = buildCampgroundFilter(req.query);
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const [campgrounds, mapCampgrounds, total, provinces] = await Promise.all([
    Campground.find(filter).sort(getSort(req.query.sort)).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean({ virtuals: true }),
    Campground.find(filter).select('title location province city price priceUnit geometry verified dataSource sourceRating sourceReferenceCost reliability').limit(500).lean(),
    Campground.countDocuments(filter),
    Campground.distinct('province', { status: 'published' })
  ]);
  res.render('campgrounds/index', {
    campgrounds,
    mapCampgrounds,
    provinces: provinces.sort(),
    filters: req.query,
    pagination: { page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total },
    pageUrl(targetPage) {
      const params = new URLSearchParams(req.query);
      params.set('page', targetPage);
      return `/campgrounds?${params.toString()}`;
    }
  });
};

module.exports.renderNewForm = (req, res) => res.render('campgrounds/new');

module.exports.createCampground = async (req, res) => {
  const source = req.body.campground;
  const campground = new Campground(normalizePayload(source));
  campground.geometry = { type: 'Point', coordinates: await resolveCoordinates(source) };
  campground.images = uploadedImages(req.files);
  if (source.imageUrl) campground.images.push({ url: source.imageUrl });
  campground.author = req.user._id;
  campground.inferredAmenities = extractAmenities(source.description).positive.filter(item => !campground.amenities.includes(item.amenity));
  await campground.save();
  const evidence = evidenceFromCampground(campground.toObject());
  await Evidence.create(evidence);
  await recalculateReliability(campground._id);
  req.flash('success', '营地发布成功');
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({ path: 'reviews', populate: { path: 'author' }, options: { sort: { createdAt: -1 } } })
    .populate('author');
  if (!campground) {
    req.flash('error', '未找到该营地');
    return res.redirect('/campgrounds');
  }
  const [evidence, fieldReports] = await Promise.all([
    Evidence.find({ campground: campground._id, status: { $ne: 'superseded' } }).sort({ capturedAt: -1 }).limit(10).lean(),
    FieldReport.find({ campground: campground._id, moderationStatus: { $ne: 'rejected' } }).populate('reporter', 'username').sort({ observedAt: -1 }).limit(10).lean()
  ]);
  res.render('campgrounds/show', { campground, evidence, fieldReports });
};

module.exports.renderEditForm = async (req, res) => {
  const campground = res.locals.campground || await Campground.findById(req.params.id);
  res.render('campgrounds/edit', { campground });
};

module.exports.updateCampground = async (req, res) => {
  const campground = res.locals.campground || await Campground.findById(req.params.id);
  const source = req.body.campground;
  Object.assign(campground, normalizePayload(source));
  campground.inferredAmenities = extractAmenities(source.description).positive.filter(item => !campground.amenities.includes(item.amenity));
  campground.geometry = {
    type: 'Point',
    coordinates: await resolveCoordinates(source, campground.geometry?.coordinates)
  };
  campground.images.push(...uploadedImages(req.files));
  if (source.imageUrl) campground.images.push({ url: source.imageUrl });

  const deleteImages = req.body.deleteImages ? [].concat(req.body.deleteImages) : [];
  for (const filename of deleteImages) await removeLocalImage(filename);
  campground.images = campground.images.filter(image => !image.filename || !deleteImages.includes(image.filename));

  await campground.save();
  const evidence = evidenceFromCampground(campground.toObject());
  await Evidence.findOneAndUpdate(
    { campground: campground._id, sourceType: evidence.sourceType, sourceId: evidence.sourceId },
    { $set: evidence },
    { upsert: true }
  );
  await recalculateReliability(campground._id);
  req.flash('success', '营地信息已更新');
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const campground = res.locals.campground || await Campground.findById(req.params.id);
  for (const image of campground.images) await removeLocalImage(image.filename);
  await Campground.findByIdAndDelete(req.params.id);
  req.flash('success', '营地已删除');
  res.redirect('/campgrounds');
};
