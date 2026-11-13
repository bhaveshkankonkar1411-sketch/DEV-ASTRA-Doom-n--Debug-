import { formatError } from '../utils/responseFormatter.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errorCode = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json(formatError(message, errorCode, err.details || []));
};

export default errorHandler;

