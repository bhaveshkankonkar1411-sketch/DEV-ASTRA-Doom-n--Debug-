import { formatError } from '../utils/responseFormatter.js';

export const validateRequest = (schema) => (req, res, next) => {
  if (!schema) return next();
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return res.status(400).json(formatError('Validation error', 'VALIDATION_ERROR', details));
  }
  next();
};

export default validateRequest;

