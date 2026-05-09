function generateUniqueId() {
  const prefix = 'RRZ2';
  const timestamp = Date.now();
  const randomCode = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${timestamp}-${randomCode}`;
}

module.exports = { generateUniqueId };
