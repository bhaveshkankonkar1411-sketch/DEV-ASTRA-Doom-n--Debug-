import { useId, useMemo, useState } from 'react';
import { Count, Icon, money } from '../StudioUI';
const week = [13240, 16980, 14100, 20480, 17200, 24160, 18660];
export function RevenueChart() {
  const [range, setRange] = useState('7D'),
    [active, setActive] = useState(null);
  const id = useId().replace(/:/g, '');
  const points = useMemo(() => {
    const count = range === '7D' ? 7 : range === '30D' ? 10 : 12;
    return Array.from({
      length: count
    }, (_, i) => {
      const revenue = range === '7D' ? week[i] : Math.round(week[i % 7] * (range === '30D' ? 3 : range === '90D' ? 7 : 30) * (.8 + i * .035));
      return {
        label: range === '7D' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] : range === '1Y' ? new Date(2026, i, 1).toLocaleDateString('en', {
          month: 'short'
        }) : `Day ${Math.round((i + 1) * (range === '30D' ? 3 : 7.5))}`,
        revenue,
        profit: range === '7D' ? [4390, 5620, 4980, 7120, 5740, 8480, 6288][i] : Math.round(revenue * (.32 + i % 3 * .014))
      };
    });
  }, [range]);
  const max = Math.max(...points.map(p => p.revenue)) * 1.17,
    width = 700,
    height = 228,
    step = width / points.length;
  const dots = points.map((p, i) => ({
    x: i * step + step / 2,
    y: height - p.profit / max * height
  }));
  const curve = dots.map((p, i) => i === 0 ? `M${p.x},${p.y}` : `C${dots[i - 1].x + step / 2},${dots[i - 1].y} ${p.x - step / 2},${p.y} ${p.x},${p.y}`).join(' ');
  return <section className="panel revenue-panel"><div className="section-head"><div><h2>Revenue & profit</h2><p>Your business, moving forward.</p></div><div className="segmented timeframe" aria-label="Chart timeframe">{['7D', '30D', '90D', '1Y'].map(r => <button key={r} aria-pressed={r === range} className={r === range ? 'selected' : ''} onClick={() => {
          setRange(r);
          setActive(null);
        }}>{r}</button>)}</div></div><div className="chart-summary"><strong><Count value={points.reduce((s, p) => s + p.revenue, 0)} format={money} /></strong><span className="badge positive"><Icon name="up" size={14} /> Sample revenue</span></div><div className="chart-legend"><span><i />Revenue</span><span><i />Profit trend</span><small>Illustrative data</small></div><div className="chart-wrap"><div className="chart-axis">{[1, .75, .5, .25, 0].map(n => <span key={n}>{money(max * n)}</span>)}</div><div className="chart-body"><svg className="revenue-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${range} sample revenue bars and profit trend`}><defs><linearGradient id={`${id}bar`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#FFC928" /><stop offset="1" stopColor="#FF9F43" /></linearGradient><linearGradient id={`${id}area`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#FF9F43" stopOpacity=".28" /><stop offset="1" stopColor="#FF9F43" stopOpacity="0" /></linearGradient></defs>{[0, .25, .5, .75, 1].map(n => <line key={n} x1="0" x2={width} y1={n * height} y2={n * height} className="grid-line" />)}{points.map((p, i) => <rect key={`${range}-${i}`} className="revenue-bar" x={i * step + step * .19} y={height - p.revenue / max * height} width={step * .62} height={p.revenue / max * height} rx="8" fill={`url(#${id}bar)`} opacity={active === null || active === i ? 1 : .45} />)}<path d={`${curve} L${dots.at(-1).x},${height} L${dots[0].x},${height} Z`} fill={`url(#${id}area)`} /><path d={curve} fill="none" stroke="#FF7A18" strokeWidth="3" />{dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#FFF9ED" stroke="#FF7A18" strokeWidth="2.5" />)}</svg><div className="chart-hitboxes">{points.map((p, i) => <button key={p.label} aria-label={`${p.label}: revenue ${money(p.revenue)}, profit ${money(p.profit)}`} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} onClick={() => setActive(active === i ? null : i)} />)}</div>{active !== null && <div className="chart-tooltip glass" style={{
          left: `${Math.min(78, Math.max(22, (active + .5) / points.length * 100))}%`
        }}><b>{points[active].label}</b><span>Revenue <strong>{money(points[active].revenue)}</strong></span><span>Profit <strong>{money(points[active].profit)}</strong></span></div>}<div className="chart-labels">{points.map(p => <span key={p.label}>{p.label}</span>)}</div></div></div></section>;
}
export function GoalRing({
  target,
  onEdit
}) {
  const percentage = Math.min(100, 42618 / target * 100);
  const id = useId().replace(/:/g, '');
  return <section className="panel goal-panel"><div className="section-head"><div><h2>Profit goal</h2><p>{new Date().toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric'
          })}</p></div><span className="badge positive">{percentage >= 100 ? 'Achieved' : 'In progress'}</span></div><div className="ring"><svg viewBox="0 0 200 200" aria-label={`${Math.round(percentage)} percent of goal`}><defs><linearGradient id={id}><stop stopColor="#FFC928" /><stop offset=".55" stopColor="#FF9F43" /><stop offset="1" stopColor="#FF7A18" /></linearGradient></defs><circle cx="100" cy="100" r="80" className="ring-track" /><circle cx="100" cy="100" r="80" fill="none" stroke={`url(#${id})`} strokeWidth="17" strokeLinecap="round" strokeDasharray="502.65" strokeDashoffset={502.65 * (1 - percentage / 100)} className="ring-progress" /></svg><div><strong><Count value={percentage} /><small>%</small></strong><span>of monthly goal</span></div></div><div className="goal-amount"><b>{money(42618)}</b><span>of {money(target)}</span></div><div className="milestones">{[25, 50, 75, 100].map(n => <span className={percentage >= n ? 'reached' : ''} key={n}><i>{percentage >= n ? <Icon name="check" size={11} /> : null}</i>{n}%</span>)}</div><button className="goal-link" onClick={onEdit}>View plan <Icon name="arrow" size={17} /></button></section>;
}
