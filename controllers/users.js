const User = require('../models/user');

module.exports.renderRegister = (req, res) => res.render('users/register');
module.exports.register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const registeredUser = await User.register(new User({ email, username }), password);
    req.login(registeredUser, error => {
      if (error) return next(error);
      req.flash('success', '欢迎加入 CampFinder');
      res.redirect('/campgrounds');
    });
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/register');
  }
};
module.exports.renderLogin = (req, res) => res.render('users/login');
module.exports.login = (req, res) => {
  req.flash('success', '欢迎回来');
  const redirectUrl = res.locals.returnTo || '/campgrounds';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};
module.exports.logout = (req, res, next) => {
  req.logout(error => {
    if (error) return next(error);
    req.flash('success', '你已安全退出');
    res.redirect('/campgrounds');
  });
};
