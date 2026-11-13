import app from './app.js';
import config from './config/environment.js';
import connectDatabase from './config/database.js';
import logger from './utils/logger.js';

const startServer = async () => {
  try {
    // Attempt database connection if URI provided
    if (config.mongodbUri) {
      await connectDatabase();
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

