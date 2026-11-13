import { formatSuccess, formatError } from '../utils/responseFormatter.js';

export const register = async (req, res, next) => {
  try {
    res.status(201).json(formatSuccess({ message: 'User registered' }, 'Registration successful'));
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    res.json(formatSuccess({ token: 'mock_jwt_token', user: { name: 'User' } }, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    res.json(formatSuccess({ user: req.user }, 'Current user retrieved'));
  } catch (err) {
    next(err);
  }
};

