import jwt from 'jsonwebtoken';
import config from '../config/environment.js';
import { formatError } from '../utils/responseFormatter.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(formatError('Access token required', 'UNAUTHORIZED'));
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json(formatError('Invalid or expired token', 'FORBIDDEN'));
    }
    req.user = user;
    next();
  });
};

export default authenticateToken;

