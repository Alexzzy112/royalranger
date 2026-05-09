const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const path = require('path');

let client;
let db;

const MONGODB_URI = (process.env.ENV === 'DEV' && !process.env.VERCEL) ? process.env.LOCAL_MONGODB_URI : process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'royalranger';

let dbPromise = null;

async function initializeDatabase() {
  if (dbPromise) return dbPromise;
  
  dbPromise = (async () => {
    try {
      client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      await client.connect();
      db = client.db(DB_NAME);
      console.log('Connected to MongoDB');

      // Ensure collections exist (they will be created on first use)
      // We can create indexes if needed
      const members = db.collection('members');
      const admins = db.collection('admins');
      const feedback = db.collection('feedback');

      // Create indexes for email uniqueness
      await members.createIndex({ email: 1 }, { unique: true });
      await admins.createIndex({ email: 1 }, { unique: true });

      // Create default admin if none exists
      const adminCount = await admins.countDocuments();
      if (adminCount === 0) {
        const password = process.env.ADMIN_PASSWORD || 'Admin123!';
        const email = process.env.ADMIN_EMAIL || 'admin@royalrangerssw2.ng';
        const password_hash = await bcrypt.hash(password, 10);
        await admins.insertOne({ email, password_hash });
        console.log(`Default admin created: ${email}`);
      }
    } catch (err) {
      dbPromise = null;
      console.error('Unable to connect to MongoDB:', err);
      throw err;
    }
  })();
  return dbPromise;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

// Graceful shutdown
function closeDatabase() {
  if (client) {
    client.close();
  }
}

module.exports = {
  initializeDatabase,
  getDb,
  closeDatabase,
};