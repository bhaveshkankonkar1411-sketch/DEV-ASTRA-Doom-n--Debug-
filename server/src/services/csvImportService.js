import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { validateHeaders, validateRow, CSV_SCHEMA } from '../validators/csvValidator.js';

/**
 * Parse CSV input (Buffer, Stream, or String) and generate preview & validation report
 */
export const parseAndValidateCsv = async (input) => {
  return new Promise((resolve, reject) => {
    let inputStream;

    if (Buffer.isBuffer(input)) {
      inputStream = Readable.from(input.toString('utf-8'));
    } else if (typeof input === 'string') {
      inputStream = Readable.from(input);
    } else if (input instanceof Readable) {
      inputStream = input;
    } else {
      return reject(new Error('Invalid CSV input type. Expected Buffer, String, or Readable Stream.'));
    }

    const rawRows = [];
    let detectedHeaders = [];

    inputStream
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => header.trim(),
        })
      )
      .on('headers', (headers) => {
        detectedHeaders = headers;
      })
      .on('data', (row) => {
        rawRows.push(row);
      })
      .on('end', () => {
        const headerValidation = validateHeaders(detectedHeaders);

        if (!headerValidation.isValid) {
          return resolve({
            isValid: false,
            headerValidation,
            totalRows: rawRows.length,
            validRows: 0,
            invalidRows: rawRows.length,
            errors: headerValidation.missing,
            warnings: headerValidation.warnings,
            preview: [],
            aggregates: null,
          });
        }

        const validRecords = [];
        const allRowErrors = [];

        rawRows.forEach((row, index) => {
          const rowResult = validateRow(row, index + 1);
          if (rowResult.isValid) {
            validRecords.push(rowResult.data);
          } else {
            allRowErrors.push(...rowResult.errors);
          }
        });

        // Compute aggregate metrics
        let totalRevenue = 0;
        let totalCogs = 0;
        let totalExpenses = 0;
        let totalUnitsSold = 0;
        const uniqueProducts = new Set();

        for (const record of validRecords) {
          totalRevenue += record.computed.revenue;
          totalCogs += record.computed.cogs;
          totalExpenses += record.computed.expenses;
          totalUnitsSold += record.units_sold;
          uniqueProducts.add(record.product_name);
        }

        const totalNetProfit = totalRevenue - totalCogs - totalExpenses;
        const overallMarginPercent = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

        const aggregates = {
          currency: 'INR',
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalCogs: Number(totalCogs.toFixed(2)),
          totalExpenses: Number(totalExpenses.toFixed(2)),
          totalNetProfit: Number(totalNetProfit.toFixed(2)),
          overallMarginPercent: Number(overallMarginPercent.toFixed(2)),
          totalUnitsSold,
          uniqueProductsCount: uniqueProducts.size,
          calculationBasis: 'backend',
        };

        const previewRows = validRecords.slice(0, 5).map((r) => ({
          orderId: r.order_id,
          date: r.date,
          productName: r.product_name,
          unitsSold: r.units_sold,
          sellingPrice: r.selling_price,
          cogsPerUnit: r.cogs_per_unit,
          shippingCost: r.shipping_cost,
          platformFee: r.platform_fee,
          adSpend: r.ad_spend,
          computed: r.computed,
        }));

        resolve({
          isValid: allRowErrors.length === 0,
          headerValidation,
          totalRows: rawRows.length,
          validRows: validRecords.length,
          invalidRows: rawRows.length - validRecords.length,
          errors: allRowErrors,
          warnings: headerValidation.warnings,
          preview: previewRows,
          allValidRecords: validRecords,
          aggregates,
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

export const parseStoreCsv = parseAndValidateCsv;
export { CSV_SCHEMA } from '../validators/csvValidator.js';

export default {
  parseAndValidateCsv,
  parseStoreCsv,
  CSV_SCHEMA,
};
