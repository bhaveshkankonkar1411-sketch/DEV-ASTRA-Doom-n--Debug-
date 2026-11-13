export const MAX_CSV_BYTES = 5 * 1024 * 1024;

export function validateCsvFile(file) {
  if (!file || !/\.csv$/i.test(file.name)) throw new Error('Choose a CSV file.');
  if (!file.size) throw new Error('This file is empty. Choose a CSV containing order rows.');
  if (file.size > MAX_CSV_BYTES) throw new Error('CSV files must be 5 MB or smaller.');
  return file;
}

// The fetched goal/CSV implementation and fixtures use rupees, unlike the
// pricing API's paise contract. Preserve its amounts without a 100x conversion.
export function goalPayload(target, month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Choose a valid month.');
  if (!/^\d+(\.\d{1,2})?$/.test(String(target)) || Number(target) <= 0 || Number(target) > 1000000000) {
    throw new Error('Enter a target above ₹0 and up to ₹1,00,00,00,000, with at most two decimal places.');
  }
  return { currency: 'INR', month, monthlyNetProfitTarget: Number(target) };
}

export function readCsvPreview(response) {
  const data = response?.data;
  if (!data || !['totalRows', 'validRows', 'invalidRows'].every(key => Number.isInteger(data[key]) && data[key] >= 0) ||
      data.validRows + data.invalidRows !== data.totalRows ||
      typeof data.headerValidation?.isValid !== 'boolean' ||
      !Array.isArray(data.preview) || data.preview.length > data.validRows ||
      !Array.isArray(data.errors) || !Array.isArray(data.warnings)) {
    throw new Error('The server did not return a CSV validation report. Run the updated backend.');
  }
  return data;
}

export function canImportCsv(report, acknowledged, imported) {
  return Boolean(report?.validRows > 0 && report?.headerValidation?.isValid && acknowledged && !imported);
}

export function readCurrentGoal(response) {
  const data = response?.data;
  if (!data || !data.goalId || !['target', 'currentNetProfit', 'remainingProfit', 'progressPercent'].every(key => Number.isFinite(data[key]))) {
    throw new Error('The server did not return goal progress. Run the updated backend.');
  }
  return data;
}

export const formatGoalMoney = value => Number.isFinite(value)
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  : 'Unavailable';
