const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const multer = require('multer');
const { getDb } = require('../db');
const { generateUniqueId } = require('../utils/generateId');

const router = Router();

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

router.post('/', upload.single('photo'), async (req, res) => {
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

  const existingMember = await members.findOne({ email });
  if (existingMember) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const unique_id = generateUniqueId();
  const status = 'pending';

  try {
    let photoUrl;
    const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY;

    if (useCloudinary) {
      const cloudinaryResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'royal-rangers/profiles',
            public_id: `${unique_id}-profile`,
            transformation: [{ width: 300, height: 300, crop: 'fill' }]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(photo.buffer).pipe(stream);
      });
      photoUrl = cloudinaryResult.secure_url;
    } else {
      const ext = path.extname(photo.originalname) || '.jpg';
      const filename = `${unique_id}-profile${ext}`;
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profiles');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, filename), photo.buffer);
      photoUrl = `/uploads/profiles/${filename}`;
    }

    await members.insertOne({
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
    console.error('Error saving registration:', err);
    res.status(500).json({ error: 'Unable to save registration.' });
  }
});

module.exports = router;
