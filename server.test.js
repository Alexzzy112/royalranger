process.env.SESSION_SECRET = 'test-secret';
process.env.ENV = 'DEV';
process.env.LOCAL_MONGODB_URI = 'mongodb://localhost:27017/test';

const request = require('supertest');

let dbData = {};

jest.mock('./db', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(),
  getDb: jest.fn(() => {
    const makeCollection = (name) => ({
      findOne: jest.fn((query) => {
        const items = dbData[name] || [];
        return Promise.resolve(items.find(item => {
          return Object.entries(query).every(([k, v]) => item[k] === v);
        }) || null);
      }),
      find: jest.fn(() => ({
        sort: jest.fn(() => ({
          toArray: jest.fn(() => Promise.resolve(dbData[name] || []))
        }))
      })),
      insertOne: jest.fn((doc) => {
        if (!dbData[name]) dbData[name] = [];
        dbData[name].push(doc);
        return Promise.resolve({ insertedId: 'mock-id' });
      }),
      updateOne: jest.fn(() => Promise.resolve({ matchedCount: 1 })),
      updateMany: jest.fn(() => Promise.resolve({ modifiedCount: 1 })),
      deleteOne: jest.fn(() => Promise.resolve({ deletedCount: 1 })),
      countDocuments: jest.fn(() => Promise.resolve(0)),
      createIndex: jest.fn(() => Promise.resolve()),
    });
    return {
      collection: makeCollection,
    };
  }),
  closeDatabase: jest.fn(),
}));

const app = require('./app');
const { generateUniqueId } = require('./utils/generateId');

describe('generateUniqueId', () => {
  test('returns a string starting with RRZ2-', () => {
    const id = generateUniqueId();
    expect(id).toMatch(/^RRZ2-/);
  });

  test('returns a unique id each time', () => {
    const id1 = generateUniqueId();
    const id2 = generateUniqueId();
    expect(id1).not.toBe(id2);
  });

  test('has three parts separated by dashes', () => {
    const id = generateUniqueId();
    const parts = id.split('-');
    expect(parts).toHaveLength(3);
  });
});

describe('GET /', () => {
  test('returns 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });
});

describe('GET /admin/login', () => {
  test('returns 200', async () => {
    const res = await request(app).get('/admin/login');
    expect(res.statusCode).toBe(200);
  });
});

describe('POST /api/register', () => {
  test('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/feedback', () => {
  test('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
