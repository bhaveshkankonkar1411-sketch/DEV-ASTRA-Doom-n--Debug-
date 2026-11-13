// Auth validation rules placeholder

export const validateRegistration = (data) => {
  const errors = [];
  if (!data.name || typeof data.name !== 'string') errors.push({ field: 'name', message: 'Name is required' });
  if (!data.email || !data.email.includes('@')) errors.push({ field: 'email', message: 'Valid email is required' });
  if (!data.password || data.password.length < 6) errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  return { isValid: errors.length === 0, errors };
};

export const validateLogin = (data) => {
  const errors = [];
  if (!data.email) errors.push({ field: 'email', message: 'Email is required' });
  if (!data.password) errors.push({ field: 'password', message: 'Password is required' });
  return { isValid: errors.length === 0, errors };
};

