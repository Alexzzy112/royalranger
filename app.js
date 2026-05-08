const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const { initializeDatabase } = require('./db');

const app = express();
const SESSION_SECRET = process.env.SESSION_SECRET;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const MONGODB_URI = (process.env.ENV === 'DEV' && !process.env.VERCEL) ? process.env.LOCAL_MONGODB_URI : process.env.MONGODB_URI;

let sessionStore;
try {
  sessionStore = MongoStore.create({ mongoUrl: MONGODB_URI, collectionName: 'sessions' });
} catch (err) {
  console.warn('MongoStore unavailable, falling back to MemoryStore:', err.message);
  sessionStore = new session.MemoryStore();
}

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
  } catch (err) {
    console.warn('Database unavailable, running without DB:', err.message);
  }
  next();
});

app.use('/', require('./routes/public'));
app.use('/admin', require('./routes/admin'));
app.use('/api/members', require('./routes/members'));
app.use('/api/register', require('./routes/register'));
app.use('/api/applicant', require('./routes/applicant'));
app.use('/api/feedback', require('./routes/feedback'));

app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = app;
