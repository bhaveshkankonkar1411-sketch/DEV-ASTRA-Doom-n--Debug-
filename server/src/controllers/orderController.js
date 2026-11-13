import mongoose from 'mongoose';
import Order from '../models/Order.js';
import StoreDataImport from '../models/StoreDataImport.js';
import { sampleOrderRecords } from '../fixtures/sampleData.js';
import { parseAndValidateCsv } from '../services/csvImportService.js';
import { aggregateOrdersProfit } from '../services/profitAggregationService.js';
import { formatSuccess, formatError } from '../utils/responseFormatter.js';

// In-memory fallback order store initialized with sample data
let inMemoryOrders = sampleOrderRecords.map((o, idx) => ({
  _id: `ord_${1000 + idx}`,
  userId: 'demo_user',
  externalOrderId: o.externalOrderId,
  orderDate: new Date(o.orderDate),
  productName: o.productName,
  unitsSold: o.unitsSold,
  sellingPrice: o.sellingPrice,
  cogs: o.cogs,
  shippingCost: o.shippingCost,
  platformFee: o.platformFee,
  adSpend: o.adSpend,
  otherExpenses: 0,
  netProfit: o.netProfit,
  currency: 'INR',
  source: o.source || 'CSV_IMPORT',
  status: 'DELIVERED',
  createdAt: new Date(o.orderDate),
}));

/**
 * GET /api/orders
 * List orders with pagination and filtering
 */
export const getOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      source = '',
      productName = '',
      startDate = '',
      endDate = '',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const query = {};
      if (req.user?.id) query.userId = req.user.id;
      if (source) query.source = source.toUpperCase();
      if (productName) query.productName = new RegExp(productName, 'i');
      if (startDate || endDate) {
        query.orderDate = {};
        if (startDate) query.orderDate.$gte = new Date(startDate);
        if (endDate) query.orderDate.$lte = new Date(endDate);
      }

      const total = await Order.countDocuments(query);
      const orders = await Order.find(query)
        .sort({ orderDate: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      return res.json(
        formatSuccess(
          {
            orders,
            pagination: {
              total,
              page: pageNum,
              limit: limitNum,
              totalPages: Math.ceil(total / limitNum) || 1,
            },
          },
          'Orders retrieved successfully'
        )
      );
    }

    // In-memory fallback
    let filtered = [...inMemoryOrders];

    if (source) {
      filtered = filtered.filter((o) => o.source.toLowerCase() === source.toLowerCase());
    }

    if (productName) {
      filtered = filtered.filter((o) =>
        o.productName.toLowerCase().includes(productName.toLowerCase())
      );
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter((o) => new Date(o.orderDate).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      filtered = filtered.filter((o) => new Date(o.orderDate).getTime() <= end);
    }

    filtered.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    const total = filtered.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    return res.json(
      formatSuccess(
        {
          orders: paginated,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
          },
        },
        'Orders retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/metrics or /api/orders/summary
 * Returns aggregated profit analytics & product performance breakdown
 */
export const getOrderMetrics = async (req, res, next) => {
  try {
    const { period = '', source = '', startDate = '', endDate = '' } = req.query;
    const isDbConnected = mongoose.connection.readyState === 1;

    let ordersList = [];

    if (isDbConnected) {
      const query = {};
      if (req.user?.id) query.userId = req.user.id;
      if (source) query.source = source.toUpperCase();
      if (startDate || endDate) {
        query.orderDate = {};
        if (startDate) query.orderDate.$gte = new Date(startDate);
        if (endDate) query.orderDate.$lte = new Date(endDate);
      }
      ordersList = await Order.find(query);
    } else {
      ordersList = [...inMemoryOrders];
      if (source) {
        ordersList = ordersList.filter((o) => o.source.toLowerCase() === source.toLowerCase());
      }
      if (startDate) {
        const start = new Date(startDate).getTime();
        ordersList = ordersList.filter((o) => new Date(o.orderDate).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        ordersList = ordersList.filter((o) => new Date(o.orderDate).getTime() <= end);
      }
    }

    const metrics = aggregateOrdersProfit(ordersList, {
      period: period || 'all_time',
      dataSource: source || 'csv_import',
    });

    return res.json(formatSuccess(metrics, 'Order profit metrics aggregated successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/:orderId
 * Retrieve details for a single order
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    let order = null;

    if (isDbConnected) {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId);
      }
      if (!order) {
        order = await Order.findOne({ externalOrderId: orderId });
      }
    } else {
      order = inMemoryOrders.find(
        (o) => o._id === orderId || o.externalOrderId === orderId
      );
    }

    if (!order) {
      return res.status(404).json(formatError('Order not found', 'ORDER_NOT_FOUND'));
    }

    return res.json(formatSuccess(order, 'Order details retrieved'));
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/orders/:orderId/status
 * Update local fulfillment/order status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json(formatError('Status is required', 'VALIDATION_ERROR'));
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let order = null;

    if (isDbConnected) {
      order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    } else {
      order = inMemoryOrders.find((o) => o._id === orderId || o.externalOrderId === orderId);
      if (order) {
        order.status = status;
      }
    }

    if (!order) {
      return res.status(404).json(formatError('Order not found', 'ORDER_NOT_FOUND'));
    }

    return res.json(formatSuccess(order, 'Order status updated successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/orders/import-csv
 * Parse CSV, persist order records and update aggregated metrics
 */
export const importCsv = async (req, res, next) => {
  try {
    let csvInput = null;

    if (req.file && req.file.buffer) {
      csvInput = req.file.buffer;
    } else if (req.body && req.body.csvData) {
      csvInput = req.body.csvData;
    }

    if (!csvInput) {
      return res.status(400).json(formatError('No CSV data provided', 'VALIDATION_ERROR'));
    }

    const report = await parseAndValidateCsv(csvInput);
    if (!report.isValid && report.validRows === 0) {
      return res
        .status(400)
        .json(formatError('CSV contains no valid order rows', 'CSV_INVALID', report.errors));
    }

    const userId = req.user?.id || 'demo_user';
    const isDbConnected = mongoose.connection.readyState === 1;

    const newOrders = report.allValidRecords.map((r, idx) => ({
      _id: `ord_${Date.now()}_${idx}`,
      userId,
      externalOrderId: r.order_id,
      orderDate: r.date,
      productName: r.product_name,
      unitsSold: r.units_sold,
      sellingPrice: r.selling_price,
      cogs: r.cogs_per_unit,
      shippingCost: r.shipping_cost,
      platformFee: r.platform_fee,
      adSpend: r.ad_spend,
      otherExpenses: r.other_expenses || 0,
      netProfit: r.computed.netProfit,
      currency: 'INR',
      source: 'CSV_IMPORT',
      status: 'COMPLETED',
      createdAt: new Date(),
    }));

    if (isDbConnected) {
      await Order.insertMany(newOrders);
      await StoreDataImport.create({
        userId,
        filename: req.file?.originalname || 'orders_import.csv',
        recordCount: newOrders.length,
        status: report.invalidRows === 0 ? 'COMPLETED' : 'FAILED',
        errors: report.errors.map((e) => e.message),
      });
    } else {
      // Append to in-memory orders
      inMemoryOrders.unshift(...newOrders);
    }

    // Compute updated aggregates
    const metrics = aggregateOrdersProfit(newOrders, {
      period: 'imported_batch',
      dataSource: 'csv_import',
    });

    return res.status(201).json(
      formatSuccess(
        {
          importedCount: newOrders.length,
          skippedRows: report.invalidRows,
          metrics,
        },
        'CSV orders imported and profit aggregated successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};
