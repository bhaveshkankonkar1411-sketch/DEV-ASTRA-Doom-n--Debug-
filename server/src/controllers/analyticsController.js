import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { sampleOrderRecords } from '../fixtures/sampleData.js';
import { aggregateOrdersProfit } from '../services/profitAggregationService.js';
import { formatSuccess } from '../utils/responseFormatter.js';

const getOrdersForUser = async (userId) => mongoose.connection.readyState === 1
  ? Order.find({ userId })
  : sampleOrderRecords;

export const getSummary = async (req, res, next) => {
  try {
    const metrics = aggregateOrdersProfit(await getOrdersForUser(req.user.id), { dataSource: mongoose.connection.readyState === 1 ? 'database' : 'sample_orders' });
    res.json(
      formatSuccess(
        {
          totalRevenue: metrics.financials.revenue,
          totalCogs: metrics.financials.supplierCosts,
          totalProfit: metrics.financials.netProfit,
          netMargin: metrics.financials.profitMarginPercent,
          totalOrders: metrics.totalOrders,
          dataSource: metrics.dataSource,
        },
        'Analytics summary retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

export const getCharts = async (req, res, next) => {
  try {
    const orders = await getOrdersForUser(req.user.id);
    const grouped = new Map();
    for (const order of orders) {
      const key = new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const entry = grouped.get(key) || { revenue: 0, profit: 0 };
      entry.revenue += Number(order.unitsSold) * Number(order.sellingPrice);
      entry.profit += Number(order.netProfit);
      grouped.set(key, entry);
    }
    const points = [...grouped.entries()].map(([label, value]) => ({ label, ...value }));
    res.json(
      formatSuccess(
        {
          labels: points.map(point => point.label),
          revenueData: points.map(point => Number(point.revenue.toFixed(2))),
          profitData: points.map(point => Number(point.profit.toFixed(2))),
          dataSource: mongoose.connection.readyState === 1 ? 'database' : 'sample_orders',
        },
        'Chart data retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

