const { Router } = require('express');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');
const { ensureApplicant } = require('../middleware/auth');

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const db = getDb();
    const members = db.collection('members');

    const member = await members.findOne({ email });

    if (!member) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    if (!member.password_hash) {
      return res.status(400).json({ error: 'Account has no password set.' });
    }
    const passwordMatch = await bcrypt.compare(password, member.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    req.session.applicantAuthenticated = true;
    req.session.applicantId = member._id.toString();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to process login.' });
  }
});

router.get('/me', ensureApplicant, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');
    const member = await members.findOne({ _id: new ObjectId(req.session.applicantId) });

    if (!member) {
      return res.status(404).json({ error: 'Applicant not found.' });
    }

    const { password_hash, ...memberData } = member;
    res.json(memberData);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch applicant details.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.applicantAuthenticated = false;
  req.session.applicantId = null;
  res.json({ success: true });
});

module.exports = router;
