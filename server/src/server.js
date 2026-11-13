import app from './app.js';
import mongoose from 'mongoose';
import config from './config/environment.js';
import connectDatabase from './config/database.js';
import logger from './utils/logger.js';
import Product from './models/Product.js';
import { seedDatabase } from './scripts/seed.js';

const startServer = async () => {
  try {
    // Attempt database connection if URI provided
    if (config.mongodbUri) {
      await connectDatabase();
      if (mongoose.connection.readyState === 1) {
        try {
          const productCount = await Product.countDocuments();
          if (productCount === 0) {
            logger.info('[Auto-Seed] Empty database detected. Seeding sample catalogue and suppliers into MongoDB Atlas...');
            await seedDatabase();
            logger.info('[Auto-Seed] Initial catalogue seeded successfully into Atlas!');
          }
        } catch (seedErr) {
          logger.warn('[Auto-Seed] Could not check/seed database:', seedErr.message);
        }
      } else {
        logger.info('[Database] Operating smoothly with authenticated in-memory product & order ledger.');
      }
    } else {
      logger.warn('MONGODB_URI not set; running in disconnected database mode.');
    }

    app.listen(config.port, () => {
      logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
      logger.info(`Server URL: http://localhost:${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

