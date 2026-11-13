// Product validation rules placeholder

export const validateProduct = (data) => {
  const errors = [];
  if (!data.title) errors.push({ field: 'title', message: 'Product title is required' });
  if (!data.category) errors.push({ field: 'category', message: 'Product category is required' });
  if (data.suggestedRetailPrice == null || data.suggestedRetailPrice < 0) {
    errors.push({ field: 'suggestedRetailPrice', message: 'Valid retail price required' });
  }
  return { isValid: errors.length === 0, errors };
};

