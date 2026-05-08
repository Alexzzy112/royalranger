const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');
const { ensureAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');
    const rows = await members.find().sort({ created_at: -1 }).toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch members.' });
  }
});

router.post('/approve-all/pending', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');

    const result = await members.updateMany(
      { status: 'pending' },
      {
        $set: {
          status: 'approved',
          updated_at: new Date()
        }
      }
    );

    res.json({ success: true, message: `${result.modifiedCount} members approved.` });
  } catch (err) {
    res.status(500).json({ error: 'Unable to approve all members.' });
  }
});

router.get('/:id', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');
    const row = await members.findOne({ _id: new ObjectId(req.params.id) });

    if (!row) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch member.' });
  }
});

router.get('/:id/photo', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');

    const row = await members.findOne({ _id: new ObjectId(req.params.id) }, { projection: { photo_url: 1 } });

    if (!row || !row.photo_url) {
      return res.status(404).json({ error: 'Photo not found.' });
    }

    res.json({ photo_url: row.photo_url });
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch photo.' });
  }
});

router.post('/:id/approve', ensureAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const db = getDb();
    const members = db.collection('members');

    const result = await members.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: status,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to update status.' });
  }
});

router.put('/:id', ensureAdmin, async (req, res) => {
  try {
    const { full_name, rank, district, unit, date_of_birth, contact, status } = req.body;
    if (!full_name || !rank || !district || !unit || !date_of_birth || !contact) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const db = getDb();
    const members = db.collection('members');

    const result = await members.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          full_name,
          rank,
          district,
          unit,
          date_of_birth,
          contact,
          status: status || 'pending',
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to update member.' });
  }
});

router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');

    const result = await members.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to delete member.' });
  }
});

module.exports = router;
