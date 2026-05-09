const ensureAdmin = (req, res, next) => {
  if (req.session && req.session.adminAuthenticated) {
    return next();
  }
  res.redirect('/admin/login');
};

function ensureApplicant(req, res, next) {
  if (req.session && req.session.applicantAuthenticated && req.session.applicantId) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized.' });
}

module.exports = { ensureAdmin, ensureApplicant };
