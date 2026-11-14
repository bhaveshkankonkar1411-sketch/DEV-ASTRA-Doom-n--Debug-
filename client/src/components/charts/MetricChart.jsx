export const MetricChart = ({ data = [], title = 'Performance metric' }) => {
  const values = data.map((point) => Number(point.value) || 0);
  const maximum = Math.max(1, ...values);

  return (
    <figure className="panel" aria-label={title}>
      <h2>{title}</h2>
      <div className="metric-chart" role="img" aria-label={`${title} bar chart`}>
        {data.map((point, index) => (
          <div className="metric-chart-column" key={point.label ?? index}>
            <i style={{ height: `${(values[index] / maximum) * 100}%` }} />
            <span>{point.label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
};

export default MetricChart;

