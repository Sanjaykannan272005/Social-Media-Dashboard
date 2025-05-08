module.exports = {
    ensureAuthenticated: (req, res, next) => {
      if (req.isAuthenticated()) return next();
      res.status(401).json({ error: 'Not authenticated' });
    }
  };
  module.exports = {
    ensureAuthenticated: (req, res, next) => {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/login');
    }
  };