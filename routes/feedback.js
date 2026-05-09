const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');
const { ensureAdmin } = require('../middleware/auth');

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { full_name, email, subject, message } = req.body;
    if (!full_name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const db = getDb();
    const feedback = db.collection('feedback');

    await feedback.insertOne({
      full_name,
      email,
      subject,
      message,
      status: 'new',
      created_at: new Date(),
      updated_at: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to submit feedback.' });
  }
});

router.get('/', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const feedback = db.collection('feedback');
    const rows = await feedback.find().sort({ created_at: -1 }).toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch feedback.' });
  }
});

router.post('/:id/respond', ensureAdmin, async (req, res) => {
  try {
    const { admin_response, status } = req.body;
    const db = getDb();
    const feedback = db.collection('feedback');

    const result = await feedback.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          admin_response,
          status: status || 'responded',
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to update feedback.' });
  }
});

router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const feedback = db.collection('feedback');

    const result = await feedback.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to delete feedback.' });
  }
});

module.exports = router;
