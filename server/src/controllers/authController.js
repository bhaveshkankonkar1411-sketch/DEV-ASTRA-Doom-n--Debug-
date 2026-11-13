import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/environment.js';
import { formatSuccess, formatError } from '../utils/responseFormatter.js';
import { validateRegistration, validateLogin } from '../validators/authValidator.js';

export const register = async (req, res, next) => {
  try {
    const { isValid, errors } = validateRegistration(req.body);
    if (!isValid) {
      return res.status(400).json(formatError('Validation error', 'VALIDATION_ERROR', errors));
    }

    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json(formatError('An account with this email already exists', 'EMAIL_ALREADY_EXISTS'));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json(
      formatSuccess(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
          token,
        },
        'User registered successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { isValid, errors } = validateLogin(req.body);
    if (!isValid) {
      return res.status(400).json(formatError('Validation error', 'VALIDATION_ERROR', errors));
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json(formatError('Invalid email or password', 'INVALID_CREDENTIALS'));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json(formatError('Invalid email or password', 'INVALID_CREDENTIALS'));
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json(
      formatSuccess(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
          token,
        },
        'Login successful'
      )
    );
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json(formatError('User not found', 'NOT_FOUND'));
    }

    res.json(
      formatSuccess(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            shopifyStore: user.shopifyStore,
          },
        },
        'Current user retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};
