// CSV column headers validation placeholder
// Required columns based on PRD Section 3.9.2

export const REQUIRED_CSV_HEADERS = [
  'date',
  'product_name',
  'units_sold',
  'selling_price',
  'cogs_per_unit',
];

export const validateCsvHeaders = (headers = []) => {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_CSV_HEADERS.filter((req) => !normalized.includes(req));
  return {
    isValid: missing.length === 0,
    missing,
  };
};

