const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('[MongoDB] Warning: MONGO_URI is not defined in .env. Rooms will be stored in-memory for active sessions.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn('[MongoDB] Falling back to in-memory room storage for active multiplayer.');
    return false;
  }
};

module.exports = connectDB;
