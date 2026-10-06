if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const helmet = require('helmet');
const compression = require('compression');
const { createI18n } = require('./config/i18n');

const ExpressError = require('./utils/ExpressError');
const User = require('./models/user');
const Campground = require('./models/campground');
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const recommendationRoutes = require('./routes/recommendations');
const qualityRoutes = require('./routes/quality');
const apiRoutes = require('./routes/api');

const app = express();
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/campfinder-cn';
const port = Number(process.env.PORT) || 3000;

mongoose.connect(mongoUrl);
mongoose.connection.on('error', error => console.error('MongoDB 连接失败:', error.message));
mongoose.connection.once('open', () => console.log('MongoDB 已连接'));

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(compression());
app.use(express.urlencoded({ extended: true, limit: '200kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0 }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '30d' }));

const sessionConfig = {
  name: 'campfinder.sid',
  secret: process.env.SESSION_SECRET || 'development-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

if (process.env.NODE_ENV === 'production' || process.env.USE_MONGO_SESSION === 'true') {
  sessionConfig.store = MongoStore.create({ mongoUrl, touchAfter: 24 * 60 * 60 });
}

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/language/:lang', (req, res) => {
  req.session.lang = req.params.lang === 'en' ? 'en' : 'zh';
  const nextPath = typeof req.query.next === 'string' && req.query.next.startsWith('/') && !req.query.next.startsWith('//')
    ? req.query.next
    : '/';
  res.redirect(nextPath);
});

app.use((req, res, next) => {
  const i18n = createI18n(req.session.lang);
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.amapKey = process.env.AMAP_JS_KEY || '';
  res.locals.amapSecurityCode = process.env.AMAP_SECURITY_JS_CODE || '';
  res.locals.lang = i18n.lang;
  res.locals.t = i18n.t;
  res.locals.tv = i18n.tv;
  res.locals.tf = i18n.tf;
  res.locals.currentUrl = req.originalUrl;
  next();
});

app.use('/', userRoutes);
app.use('/recommendations', recommendationRoutes);
app.use('/quality', qualityRoutes);
app.use('/api/v1', apiRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.get('/', async (req, res, next) => {
  try {
    const [campCount, cityCount] = await Promise.all([
      Campground.countDocuments({ status: 'published' }),
      Campground.distinct('city', { status: 'published' }).then(cities => cities.length)
    ]);
    res.render('home', { campCount, cityCount });
  } catch (error) {
    next(error);
  }
});

app.all('*', (req, res, next) => next(new ExpressError(req.session.lang === 'en' ? 'Page not found' : '页面不存在', 404)));
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) console.error(err);
  res.status(statusCode).render('error', {
    err: { statusCode, message: err.message || (req.session.lang === 'en' ? 'Something went wrong. Please try again.' : '服务器开小差了，请稍后再试') }
  });
});

if (require.main === module) {
  app.listen(port, () => console.log(`CampFinder 中国版运行于 http://localhost:${port}`));
}

module.exports = app;
