import React from 'react';

export const MetricChart = ({ data, title }) => {
  return (
    <div className="metric-chart-card">
      <h4>{title || 'Performance Metric'}</h4>
      <div className="chart-wrapper">
        {/* Chart.js integration placeholder */}
        <p className="chart-placeholder">Chart Data Placeholder</p>
      </div>
    </div>
  );
};

export default MetricChart;

