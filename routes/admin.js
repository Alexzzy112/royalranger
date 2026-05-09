const { Router } = require('express');
const bcrypt = require('bcrypt');
const { getDb } = require('../db');
const { ensureAdmin } = require('../middleware/auth');

const router = Router();

router.get('/login', (req, res) => {
  if (req.session && req.session.adminAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const admins = db.collection('admins');
  const admin = await admins.findOne({ email });

  if (!admin) {
    return res.render('login', { error: 'Invalid credentials.' });
  }

  const passwordMatch = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatch) {
    return res.render('login', { error: 'Invalid credentials.' });
  }

  req.session.adminAuthenticated = true;
  req.session.adminEmail = admin.email;
  res.redirect('/admin/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.get('/dashboard', ensureAdmin, (req, res) => {
  res.render('dashboard', { adminEmail: req.session.adminEmail });
});

module.exports = router;
