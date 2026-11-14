import mongoose from 'mongoose';
import config from './environment.js';

export const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    console.warn('[Database] MongoDB is not reachable. Operating with in-memory fallback.');
    return null;
  }
};

export default connectDatabase;

