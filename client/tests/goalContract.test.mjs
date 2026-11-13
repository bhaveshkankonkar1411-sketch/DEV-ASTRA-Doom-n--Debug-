import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canImportCsv, readCsvPreview } from '../src/utils/goalContract.js';

const report = overrides => ({
  totalRows: 3,
  validRows: 2,
  invalidRows: 1,
  headerValidation: { isValid: true },
  preview: [{}, {}],
  errors: [{ row: 3, message: 'Invalid date' }],
  warnings: ['Optional expense columns are missing.'],
  ...overrides,
});

test('CSV preview requires consistent counts and explicit header validation', () => {
  assert.equal(readCsvPreview({ data: report() }).validRows, 2);
  assert.throws(() => readCsvPreview({ data: report({ invalidRows: 0 }) }), /validation report/);
  assert.throws(() => readCsvPreview({ data: report({ headerValidation: undefined }) }), /validation report/);
  assert.throws(() => readCsvPreview({ data: report({ preview: [{}, {}, {}] }) }), /validation report/);
});

test('CSV import requires valid headers, valid rows, and user acknowledgement', () => {
  const validReport = report();
  assert.equal(canImportCsv(validReport, true, false), true);
  assert.equal(canImportCsv(validReport, false, false), false);
  assert.equal(canImportCsv({ ...validReport, headerValidation: { isValid: false } }, true, false), false);
  assert.equal(canImportCsv({ ...validReport, validRows: 0 }, true, false), false);
  assert.equal(canImportCsv(validReport, true, true), false);
});
