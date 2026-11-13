// Profit Goal validation rules placeholder

export const validateGoal = (data) => {
  const errors = [];
  if (!data.title) errors.push({ field: 'title', message: 'Goal title is required' });
  if (data.targetProfit == null || data.targetProfit <= 0) errors.push({ field: 'targetProfit', message: 'Target profit must be positive' });
  if (!data.targetDate) errors.push({ field: 'targetDate', message: 'Target deadline date is required' });
  return { isValid: errors.length === 0, errors };
};

