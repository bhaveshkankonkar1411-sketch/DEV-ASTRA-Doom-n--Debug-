import express from 'express';
import cors from 'cors';
import config from './config/environment.js';
import apiRoutes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Global Middleware
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;

