export const GoalProgressChart = ({ goal = {} }) => {
  const target = Math.max(1, Number(goal.targetProfit) || 1);
  const achieved = Math.max(0, Number(goal.achievedProfit) || 0);
  const progress = Math.min(100, (achieved / target) * 100);

  return (
    <figure className="panel goal-progress-figure">
      <figcaption>
        <h2>Profit goal milestone pacing</h2>
        <strong>{Math.round(progress)}%</strong>
      </figcaption>
      <div className="goal-progress-track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin="0" aria-valuemax="100">
        <i style={{ width: `${progress}%` }} />
      </div>
    </figure>
  );
};

export default GoalProgressChart;

