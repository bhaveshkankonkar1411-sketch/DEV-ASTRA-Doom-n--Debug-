import { formatSuccess } from '../utils/responseFormatter.js';

export const getSummary = async (req, res, next) => {
  try {
    res.json(
      formatSuccess(
        {
          totalRevenue: 0,
          totalCogs: 0,
          totalProfit: 0,
          netMargin: 0,
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
    res.json(
      formatSuccess(
        {
          labels: [],
          revenueData: [],
          profitData: [],
        },
        'Chart data retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

