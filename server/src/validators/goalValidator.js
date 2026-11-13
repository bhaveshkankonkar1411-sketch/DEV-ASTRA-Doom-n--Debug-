/**
 * Validation rules for Profit Goals per PRD Section 10.8
 */

export const validateGoal = (data = {}) => {
  const errors = [];

  const target = data.monthlyNetProfitTarget != null ? data.monthlyNetProfitTarget : data.targetProfit;

  if (target == null || typeof target !== 'number' || isNaN(target) || target <= 0) {
    errors.push({
      field: 'monthlyNetProfitTarget',
      message: 'Monthly net profit target must be a positive number',
    });
  }

  if (data.month && !/^\d{4}-\d{2}$/.test(data.month.trim())) {
    errors.push({
      field: 'month',
      message: 'Month must follow YYYY-MM format (e.g., 2026-11)',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default validateGoal;
