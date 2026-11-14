import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/LandingPage.css';

const Arrow = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" /></svg>;
const Spark = ({ small = false }) => <svg className={small ? 'lp-spark small' : 'lp-spark'} viewBox="0 0 32 32" aria-hidden="true"><path d="m16 2 2.8 9.2L28 14l-9.2 2.8L16 26l-2.8-9.2L4 14l9.2-2.8L16 2Z" /><path d="m25 23 .9 3.1L29 27l-3.1.9L25 31l-.9-3.1L21 27l3.1-.9L25 23Z" /></svg>;
const LineIcon = ({ name, size = 18 }) => {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
    package: <><path d="m4 8 8-4 8 4-8 4-8-4Z" /><path d="v8l8 4 8-4V8M12 12v8" /></>,
    trend: <><path d="M5 17 19 3" /><path d="M10 3h9v9" /></>,
    play: <path d="m9 7 7 5-7 5V7Z" />,
    store: <><path d="M4 10h16l-2-6H6l-2 6Z" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>
  };
  return <svg className="lp-line-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

function Logo() {
  return <span className="lp-logo"><span className="lp-logo-mark"><Spark /></span><span>DropPilot</span></span>;
}

function Scene({ onExplore }) {
  const stageRef = useRef(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const move = event => {
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      stage.style.setProperty('--scene-x', `${x * 9}deg`);
      stage.style.setProperty('--scene-y', `${y * -7}deg`);
    };
    const leave = () => {
      stage.style.setProperty('--scene-x', '0deg');
      stage.style.setProperty('--scene-y', '0deg');
    };
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerleave', leave);
    return () => {
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerleave', leave);
    };
  }, []);
  return <div className="lp-scene-wrap" ref={stageRef} onClick={onExplore} role="button" tabIndex="0" onKeyDown={e => e.key === 'Enter' && onExplore()} aria-label="Explore the automated commerce workflow">
    <div className="lp-scene-grid" />
    <div className="lp-scene">
      <div className="lp-chaos-card supplier"><span className="lp-card-icon">S</span><span><b>Supplier feed</b><small>47 raw products</small></span><i className="lp-warning">!</i></div>
      <div className="lp-chaos-card price"><small>Unit cost changed</small><b>₹812 <del>₹694</del></b><em>+17%</em></div>
      <div className="lp-chaos-card shipping"><span className="lp-box-icon"><LineIcon name="package" /></span><span><b>Shipping delay</b><small>12–18 days</small></span></div>
      <div className="lp-beam beam-one" /><div className="lp-beam beam-two" /><div className="lp-beam beam-three" />
      <div className="lp-core-shadow" />
      <div className="lp-core">
        <div className="lp-core-face front"><Spark /><span>COMMERCE ENGINE</span></div>
        <div className="lp-core-face top" /><div className="lp-core-face side" />
        <i className="lp-core-ring one" /><i className="lp-core-ring two" />
      </div>
      <div className="lp-output-card winner"><span className="lp-live-dot" />WINNING PRODUCT FOUND<strong>34.1% <small>margin</small></strong><div className="lp-mini-bars"><i /><i /><i /><i /><i /></div></div>
      <div className="lp-output-card synced"><span className="lp-shop-badge">S</span><span><small>STORE STATUS</small><b>Shopify Auto-Synced</b></span><i><LineIcon name="check" size={13} /></i></div>
      <div className="lp-output-card profit"><small>NET PROFIT</small><strong>₹42,618</strong><span><LineIcon name="trend" size={12} />18.2% this month</span></div>
      <div className="lp-axis-label input">MESSY INPUTS</div><div className="lp-axis-label output">CLEAN OUTPUTS</div>
    </div>
    <div className="lp-scene-hint"><span>Move to inspect</span><i /></div>
  </div>;
}

function Comparison() {
  const [mode, setMode] = useState('pilot');
  const pilot = mode === 'pilot';
  return <div className={`lp-compare-card ${pilot ? 'is-pilot' : 'is-manual'}`}>
    <div className="lp-toggle" role="group" aria-label="Compare workflows">
      <button className={!pilot ? 'active' : ''} onClick={() => setMode('manual')}>The old way</button>
      <button className={pilot ? 'active' : ''} onClick={() => setMode('pilot')}><Spark small />DropPilot way</button>
    </div>
    <div className="lp-compare-stage">
      <div className="lp-compare-copy">
        <span className="lp-kicker">{pilot ? 'ONE CONNECTED WORKSPACE' : 'SIX DISCONNECTED TOOLS'}</span>
        <h3>{pilot ? 'Decisions happen while the signal is fresh.' : 'Every handoff leaks time and margin.'}</h3>
        <p>{pilot ? 'Discovery, supplier comparison, pricing, listing creation, and store sync move as one intelligent flow.' : 'Copy-pasted costs, stale tabs, blind pricing, and manual listings turn a promising product into operational drag.'}</p>
        <div className="lp-compare-points">
          {(pilot ? ['Automated product scoring', 'Margin-aware pricing', 'One-click listing sync'] : ['Manual research loops', 'Pricing by guesswork', 'Slow copy-and-paste sync']).map(item => <span key={item}><i><LineIcon name={pilot ? 'check' : 'close'} size={13} /></i>{item}</span>)}
        </div>
      </div>
      <div className="lp-compare-metrics">
        <div><small>TOOLS IN THE LOOP</small><strong>{pilot ? '1' : '6'}</strong><span>{pilot ? 'connected' : 'fragmented'}</span></div>
        <div><small>PRICING SIGNAL</small><strong>{pilot ? 'Live' : 'Blind'}</strong><span>{pilot ? 'margin-aware' : 'spreadsheet-led'}</span></div>
        <div><small>LISTING FLOW</small><strong>{pilot ? '1-click' : 'Manual'}</strong><span>{pilot ? 'ready to sync' : 'rework required'}</span></div>
      </div>
    </div>
  </div>;
}

function RadarVisual() {
  return <div className="lp-radar"><i className="ring r1" /><i className="ring r2" /><i className="ring r3" /><i className="sweep" /><span className="dot d1"><b>34%</b></span><span className="dot d2"><b>27%</b></span><span className="dot d3"><b>19%</b></span><div className="lp-radar-label"><small>BEST MATCH</small><strong>Supplier 02</strong><span>₹428 / 6 days</span></div></div>;
}

function ProfitPlanner() {
  const [revenue, setRevenue] = useState(200000);
  const profit = Math.round(revenue * 0.341);
  const format = value => `₹${Math.round(value / 1000)}k`;
  return <div className="lp-planner">
    <div className="lp-planner-head"><span><small>MONTHLY REVENUE</small><strong>₹{revenue.toLocaleString('en-IN')}</strong></span><span><small>PROJECTED PROFIT</small><strong className="orange">₹{profit.toLocaleString('en-IN')}</strong></span></div>
    <label className="lp-range"><span className="sr-only">Monthly revenue</span><input type="range" min="50000" max="1000000" step="10000" value={revenue} onChange={e => setRevenue(Number(e.target.value))} style={{ '--range-progress': `${(revenue - 50000) / 950000 * 100}%` }} /></label>
    <div className="lp-plan-chart"><div className="lp-gauge" style={{ '--gauge': `${Math.min(100, revenue / 10000)}%` }}><span><b>34.1%</b><small>projected margin</small></span></div><div className="lp-bars">{[.42, .58, .48, .68, .77, .92].map((v, i) => <i key={i} style={{ '--height': `${v * (45 + revenue / 16000)}px` }} />)}<span>{format(profit)}</span></div></div>
  </div>;
}

function PipelineVisual() {
  return <div className="lp-pipeline"><div className="lp-listing-sheet"><span /><span /><span /><div><i /><i /><i /></div><b>PRODUCT LISTING</b></div><div className="lp-pipeline-line"><i /><i /><i /></div><div className="lp-store"><span><LineIcon name="store" size={30} /></span><b>STORE</b><i><LineIcon name="check" size={13} /></i></div><div className="lp-sync-status"><span className="lp-live-dot" />Synced in real time</div></div>;
}

function Ticker() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = ref.current;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setActive(true), { threshold: .35 });
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <section className={`lp-ticker ${active ? 'active' : ''}`} ref={ref} aria-label="Illustrative workspace metrics">
    <div><strong>₹1.2Cr+</strong><span>store revenue tracked</span></div><div><strong>34.1%</strong><span>sample seller margin</span></div><div><strong>10×</strong><span>faster listing workflow</span></div><small>Illustrative demo metrics</small>
  </section>;
}

export default function LandingPage({ onLaunch }) {
  const [scrolled, setScrolled] = useState(false);
  const navItems = useMemo(() => [['The Problem', 'problem'], ['Core Modules', 'modules'], ['Live Demo', 'demo'], ['Pricing', 'pricing']], []);
  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 24);
      document.documentElement.style.setProperty('--landing-scroll', Math.min(1, window.scrollY / 700));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return <div className="landing-page">
    <header className={`lp-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <a href="#top" className="lp-nav-brand" onClick={e => { e.preventDefault(); scrollTo('top'); }}><Logo /></a>
      <nav aria-label="Landing page navigation">{navItems.map(([label, id]) => <a href={`#${id}`} key={id} onClick={e => { e.preventDefault(); scrollTo(id); }}>{label}</a>)}</nav>
      <div className="lp-nav-actions"><button className="lp-login" onClick={onLaunch}>Log in</button><button className="lp-button small" onClick={onLaunch}>Launch DropPilot <Arrow /></button></div>
    </header>
    <main>
      <section className="lp-hero" id="top">
        <div className="lp-hero-glow" />
        <div className="lp-hero-copy"><div className="lp-pill"><Spark small />Dropshipping command center</div><h1>Stop guessing products. <span>Automate your store’s profit.</span></h1><p>Replace six manual tools with one intelligent workspace for product discovery, supplier comparison, smart pricing, listing creation, and store sync.</p><div className="lp-hero-actions"><button className="lp-button" onClick={onLaunch}>Start scaling free <Arrow /></button><button className="lp-button outline" onClick={() => scrollTo('demo')}>Explore 3D workflow <span className="lp-play"><LineIcon name="play" size={13} /></span></button></div><div className="lp-trust-row"><span><i><LineIcon name="check" size={12} /></i>No card required</span><span><i><LineIcon name="check" size={12} /></i>Explore with demo data</span><span><i><LineIcon name="check" size={12} /></i>Built for focused operators</span></div></div>
        <Scene onExplore={() => scrollTo('demo')} /><div className="lp-scroll-cue"><span>SCROLL TO TRANSFORM</span><i /></div>
      </section>
      <section className="lp-section lp-problem" id="problem"><div className="lp-section-heading split"><div><span className="lp-kicker">01 — THE OPERATING SYSTEM</span><h2>From six messy tabs<br />to one clear decision.</h2></div><p>See the operational difference. Toggle the workflow and watch fragmented work become a connected profit engine.</p></div><Comparison /></section>
      <section className="lp-section lp-modules" id="modules"><div className="lp-section-heading"><span className="lp-kicker">02 — INTELLIGENCE, BUILT IN</span><h2>Every module knows<br />what the next one needs.</h2><p>No context switching. No data re-entry. Each decision compounds into the next.</p></div><div className="lp-bento">
        <article className="lp-feature radar-card"><div className="lp-feature-copy"><span className="lp-feature-number">01</span><span className="lp-kicker">DISCOVER + COMPARE</span><h3>Find products with margin already in view.</h3><p>Scan demand signals and compare supplier cost, speed, and opportunity in one pass.</p></div><RadarVisual /></article>
        <article className="lp-feature planner-card" id="demo"><div className="lp-feature-copy"><span className="lp-feature-number">02</span><span className="lp-kicker">SMART PRICING</span><h3>Price toward a goal, not a guess.</h3><p>Move the revenue target and model projected profit with a margin-aware plan.</p></div><ProfitPlanner /></article>
        <article className="lp-feature pipeline-card"><div className="lp-feature-copy"><span className="lp-feature-number">03</span><span className="lp-kicker">CREATE + SYNC</span><h3>Turn a product signal into a store-ready listing.</h3><p>Generate structured product content and move it into your commerce workflow without the copy-paste relay.</p></div><PipelineVisual /></article>
      </div></section>
      <Ticker />
      <section className="lp-section lp-final" id="pricing"><div className="lp-final-card"><div className="lp-final-orbit"><i /><i /><span><Spark /></span></div><div><span className="lp-kicker">YOUR COMMAND CENTER IS READY</span><h2>Ready to pilot your store on autopilot?</h2><p>Start with the connected workspace, explore the demo, and turn your next product decision into a deliberate move.</p></div><button className="lp-button dark" onClick={onLaunch}>Sign in to DropPilot <Arrow /></button></div></section>
    </main>
    <footer className="lp-footer"><Logo /><span>Commerce intelligence for focused operators.</span><div><button onClick={() => scrollTo('problem')}>Product</button><button onClick={() => scrollTo('modules')}>Modules</button><button onClick={onLaunch}>Log in</button></div><small>© 2026 DropPilot</small></footer>
  </div>;
}
