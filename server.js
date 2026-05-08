const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();
const { initializeDatabase, getDb, closeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'royal-rangers-secret-2026';

initializeDatabase().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Passport photograph must be an image.'));
    }
    cb(null, true);
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

const ensureAdmin = (req, res, next) => {
  if (req.session && req.session.adminAuthenticated) {
    return next();
  }
  res.redirect('/admin/login');
};

function generateUniqueId() {
  const prefix = 'RRZ2';
  const timestamp = Date.now();
  const randomCode = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${timestamp}-${randomCode}`;
}

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.adminAuthenticated) {
    return res.redirect('/admin/dashboard');
  }
  res.render('login', { error: null });
});

app.post('/admin/login', async (req, res) => {
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

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

app.get('/admin/dashboard', ensureAdmin, (req, res) => {
  res.render('dashboard', { adminEmail: req.session.adminEmail });
});

app.get('/api/members', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');
    const rows = await members.find().sort({ created_at: -1 }).toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch members.' });
  }
});

app.get('/api/members/:id', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');
    const ObjectId = require('mongodb').ObjectId;
    const row = await members.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!row) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch member.' });
  }
});

app.post('/api/members/:id/approve', ensureAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    
    const db = getDb();
    const members = db.collection('members');
    const ObjectId = require('mongodb').ObjectId;
    
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

app.put('/api/members/:id', ensureAdmin, async (req, res) => {
  try {
    const { full_name, rank, district, unit, date_of_birth, contact, status } = req.body;
    if (!full_name || !rank || !district || !unit || !date_of_birth || !contact) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    
    const db = getDb();
    const members = db.collection('members');
    const ObjectId = require('mongodb').ObjectId;
    
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

app.delete('/api/members/:id', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');
    const ObjectId = require('mongodb').ObjectId;
    
    const result = await members.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to delete member.' });
  }
});

app.post('/api/register', upload.single('photo'), async (req, res) => {
  const { full_name, rank, district, unit, date_of_birth, email, password, confirm_password, contact } = req.body;
  const photo = req.file;

  if (!full_name || !rank || !district || !unit || !date_of_birth || !email || !password || !confirm_password || !contact || !photo) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password should be at least 8 characters.' });
  }

  const db = getDb();
  const members = db.collection('members');

  // Check if email already exists
  const existingMember = await members.findOne({ email });
  if (existingMember) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const unique_id = generateUniqueId();
  const status = 'pending';

  try {
    // Upload photo to Cloudinary
    const cloudinaryResult = await new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'royal-rangers/profiles',
      public_id: `${unique_id}-profile`,
      transformation: [
        { width: 300, height: 300, crop: 'fill' }
      ]
    },
    (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }
  );

  streamifier.createReadStream(photo.buffer).pipe(stream);
});

    const photoUrl = cloudinaryResult.secure_url;

    const result = await members.insertOne({
      unique_id,
      full_name,
      rank,
      district,
      unit,
      date_of_birth,
      email,
      password_hash,
      contact,
      photo_url: photoUrl,
      status,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.json({ success: true, unique_id });
  } catch (err) {
    console.error('Error uploading photo to Cloudinary:', err);
    res.status(500).json({ error: 'Unable to save registration.' });
  }
    // res.status(500).json({ error: 'Unable to save registration.' });
  }
);

function ensureApplicant(req, res, next) {
  if (req.session && req.session.applicantAuthenticated && req.session.applicantId) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized.' });
}

app.post('/api/applicant/login', async (req, res) => {
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

    const bcrypt = require('bcrypt');

    if (!member.password_hash) {
      return res.status(400).json({ error: 'Account has no password set.' });
    }
    const passwordMatch = await bcrypt.compare(password, member.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    req.session.applicantAuthenticated = true;
    req.session.applicantId = member._id.toString(); // Convert ObjectId to string
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to process login.' });
  }
});

app.get('/api/applicant/me', ensureApplicant, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');
    const ObjectId = require('mongodb').ObjectId;
    const member = await members.findOne({ _id: new ObjectId(req.session.applicantId) });
    
    if (!member) {
      return res.status(404).json({ error: 'Applicant not found.' });
    }
    
    // Remove password hash from response for security
    const { password_hash, ...memberData } = member;
    res.json(memberData);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch applicant details.' });
  }
});

app.post('/api/applicant/logout', (req, res) => {
  req.session.applicantAuthenticated = false;
  req.session.applicantId = null;
  res.json({ success: true });
});

app.post('/api/members/approve-all/pending', ensureAdmin, async (req, res) => {
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

app.get('/api/members/:id/photo', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const members = db.collection('members');
    const ObjectId = require('mongodb').ObjectId;

    const row = await members.findOne({ _id: new ObjectId(req.params.id) }, { projection: { photo_url: 1 } });

    if (!row || !row.photo_url) {
      return res.status(404).json({ error: 'Photo not found.' });
    }

    res.json({ photo_url: row.photo_url });
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch photo.' });
  }
});

app.post('/api/feedback', async (req, res) => {
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

app.get('/api/feedback', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const feedback = db.collection('feedback');
    const rows = await feedback.find().sort({ created_at: -1 }).toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch feedback.' });
  }
});

app.post('/api/feedback/:id/respond', ensureAdmin, async (req, res) => {
  try {
    const { admin_response, status } = req.body;
    const db = getDb();
    const feedback = db.collection('feedback');
    const ObjectId = require('mongodb').ObjectId;
    
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

app.delete('/api/feedback/:id', ensureAdmin, async (req, res) => {
  try {
    const db = getDb();
    const feedback = db.collection('feedback');
    const ObjectId = require('mongodb').ObjectId;
    
    const result = await feedback.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to delete feedback.' });
  }
});

app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
