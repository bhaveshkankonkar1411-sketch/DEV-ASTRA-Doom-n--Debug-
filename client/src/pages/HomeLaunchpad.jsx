import { useRef } from 'react';
import { Icon } from '../components/StudioUI';

const modules = [
  { id: 'discover', label: 'Product Radar', detail: 'Live opportunity scoring', icon: 'compass', className: 'radar' },
  { id: 'suppliers', label: 'Supplier Margin Engine', detail: 'Cost and delivery intelligence', icon: 'box', className: 'supplier' },
  { id: 'shopify', label: '1-Click Shopify Sync', detail: 'Store-ready publishing flow', icon: 'bag', className: 'sync' },
  { id: 'overview', label: 'Live Profit Stream', detail: 'Revenue and margin analytics', icon: 'pulse', className: 'profit' }
];

export default function HomeLaunchpad({ user, onNavigate }) {
  const stageRef = useRef(null);
  const move = event => {
    const stage = stageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    stage.style.setProperty('--home-rx', `${y * -8}deg`);
    stage.style.setProperty('--home-ry', `${x * 11}deg`);
  };
  const reset = () => {
    stageRef.current?.style.setProperty('--home-rx', '0deg');
    stageRef.current?.style.setProperty('--home-ry', '0deg');
  };
  const firstName = user.name.split(/\s+/)[0];

  return <div className="home-launchpad">
    <header className="home-launchpad-head">
      <div><div className="eyebrow"><span className="status-dot" /> COMMAND LAUNCHPAD</div><h1>Welcome, {firstName}.</h1><p>Move from product signal to store profit through one connected operating system.</p></div>
      <button className="secondary" onClick={() => onNavigate('overview')}>Open Analytics Overview <Icon name="arrow" size={18} /></button>
    </header>

    <section className="home-stage-shell" ref={stageRef} onPointerMove={move} onPointerLeave={reset}>
      <div className="home-stage-grid" />
      <div className="home-stage">
        <div className="home-core-shadow" />
        <div className="home-core" aria-label="DropPilot commerce engine">
          <div className="home-core-face front"><Icon name="spark" size={42} /><strong>DropPilot</strong><span>ENGINE ONLINE</span></div>
          <div className="home-core-face top" /><div className="home-core-face side" />
          <i className="home-orbit orbit-one" /><i className="home-orbit orbit-two" />
        </div>
        <div className="home-beam beam-a" /><div className="home-beam beam-b" /><div className="home-beam beam-c" /><div className="home-beam beam-d" />
        {modules.map(module => <button key={module.id} className={`home-module ${module.className}`} onClick={() => onNavigate(module.id)}>
          <span className="home-module-icon"><Icon name={module.icon} size={22} /></span><span><b>{module.label}</b><small>{module.detail}</small></span><Icon name="arrow" size={18} />
        </button>)}
      </div>
      <div className="home-stage-status"><span className="status-dot" />All workspace modules connected</div>
    </section>

    <section className="home-actions" aria-label="Workspace shortcuts">
      <button className="primary" onClick={() => onNavigate('discover')}><Icon name="compass" />Discover Winning Products</button>
      <button className="secondary" onClick={() => onNavigate('shopify')}><Icon name="bag" />Sync Shopify Store</button>
    </section>
  </div>;
}
