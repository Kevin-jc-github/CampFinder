const express = require('express');
const passport = require('passport');
const { rateLimit } = require('express-rate-limit');
const catchAsync = require('../utils/catchAsync');
const { storeReturnTo } = require('../middleware');
const users = require('../controllers/users');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
router.route('/register').get(users.renderRegister).post(authLimiter, catchAsync(users.register));
router.route('/login').get(users.renderLogin).post(
  authLimiter,
  storeReturnTo,
  passport.authenticate('local', { failureFlash: '用户名或密码错误', failureRedirect: '/login' }),
  users.login
);
router.post('/logout', users.logout);
module.exports = router;
