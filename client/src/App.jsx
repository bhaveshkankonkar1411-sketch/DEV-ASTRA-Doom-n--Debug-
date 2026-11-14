import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import authService from './services/authService';
import analyticsService from './services/analyticsService';
import { Count, Field, Icon, initials, Modal, money, navigation, PageHead, plans, ProductArt, products, suppliers, useStored } from './components/StudioUI';
import { GoalRing, RevenueChart } from './components/charts/StudioCharts';
import { Discovery, Goals, ListingStudio, ProductSentimentInspector, Shopify, SupplierComparison } from './pages/StudioWorkspaces';
import Pricing from './pages/SmartPricingPage';
import ProfitGoalPlannerPage from './pages/ProfitGoalPlannerPage';
import './styles/App.css';
function Brand() {
  return <div className="brand"><span className="brand-mark"><Icon name="spark" size={27} /></span><span>DropPilot<span className="brand-ai">AI</span><small>Your unfair advantage.</small></span></div>;
}
function ThemeSwitch({
  theme,
  setTheme
}) {
  return <div className="segmented theme-switch">{[['light', 'sun', 'Crystal Light Mode'], ['dark', 'moon', 'OLED Obsidian Dark Mode']].map(([value, icon, label]) => <button key={value} title={label} aria-label={label} aria-pressed={theme === value} className={theme === value ? 'selected' : ''} onClick={() => setTheme(value)}><Icon name={icon} size={17} /></button>)}</div>;
}
function AuthScreen({
  theme,
  setTheme
}) {
  const {
    login
  } = useAuth();
  const [mode, setMode] = useState('signin'),
    [form, setForm] = useState({
      name: '',
      email: '',
      password: '',
      plan: 'Growth Plan'
    }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const change = e => setForm({
    ...form,
    [e.target.name]: e.target.value
  });
  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'demo') {
        login(null, {
          name: form.name.trim(),
          email: form.email,
          plan: form.plan,
          sessionMode: 'demo'
        });
        return;
      }
      const res = mode === 'signup' ? await authService.register({
        name: form.name.trim(),
        email: form.email,
        password: form.password
      }) : await authService.login({
        email: form.email,
        password: form.password
      });
      if (!res.data?.token) {
        setMessage('Registration request accepted. Sign in once your backend account is available.');
        setMode('signin');
        return;
      }
      if (res.data.token === 'mock_jwt_token') throw new Error('This server currently returns a mock session. Use the demo workspace to explore the app.');
      if (!res.data.user?.name) throw new Error('The server did not return a complete user profile.');
      login(res.data.token, {
        ...res.data.user,
        email: res.data.user.email || form.email,
        plan: form.plan,
        sessionMode: 'api'
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="auth-shell"><header className="auth-header"><Brand /><ThemeSwitch theme={theme} setTheme={setTheme} /></header><main className="auth-main"><section className="auth-story"><div className="eyebrow"><span className="status-dot" /> YOUR NEXT CHAPTER IN COMMERCE</div><h1>Big ambition.<br />Meet your <span className="gradient-text">growth engine.</span></h1><p>Discover the right products. Build your brand.<br />Turn your next move into real momentum.</p><div className="auth-orbit"><div className="floating-chip chip-one"><Icon name="compass" />Discover what’s next</div><div className="floating-chip chip-two"><Icon name="pulse" />Built for your growth</div><div className="floating-chip chip-three"><Icon name="target" />Every goal. Within reach.</div></div><div className="auth-benefits"><span><Icon name="check" size={16} /> Nine connected tools</span><span><Icon name="check" size={16} /> One clear workspace</span></div></section><section className="auth-card glass"><span className="brand-mark"><Icon name="spark" size={27} /></span><div className="eyebrow">A SMARTER WAY TO BUILD</div><h2>{mode === 'signup' ? 'Make room for growth.' : mode === 'demo' ? 'Make it your workspace.' : 'Sign in to DropPilot'}</h2><p>{mode === 'demo' ? 'Explore with sample data and a profile saved on this device.' : 'Your next great idea deserves a great workspace.'}</p><form onSubmit={submit}>{mode !== 'signin' && <Field label="Full name" name="name" autoComplete="name" required maxLength="80" pattern=".*\S.*" value={form.name} onChange={change} />}<Field label="Email address" name="email" type="email" autoComplete="email" required value={form.email} onChange={change} />{mode !== 'demo' && <Field label="Password" name="password" type="password" minLength="6" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required value={form.password} onChange={change} />}<label className="form-field"><span>Workspace plan</span><select name="plan" value={form.plan} onChange={change}>{plans.map(p => <option key={p}>{p}</option>)}</select></label>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-message" role="status">{message}</p>}<button className="primary full auth-submit" disabled={busy}>{busy ? 'One moment…' : mode === 'demo' ? 'Enter demo workspace' : mode === 'signup' ? 'Create account' : 'Sign in'}<Icon name="arrow" size={18} /></button></form><div className="auth-links">{mode === 'signin' ? <>New here? <button onClick={() => {
              setMode('signup');
              setError('');
            }}>Create an account</button></> : <button onClick={() => {
            setMode('signin');
            setError('');
          }}>Back to sign in</button>}</div>{mode !== 'demo' && <button className="demo-link" onClick={() => {
          setMode('demo');
          setError('');
          setMessage('');
        }}>Explore the demo workspace <Icon name="arrow" size={16} /></button>}<p className="auth-note">Plan selection is a workspace preference. No payment is taken.</p></section></main><footer className="auth-footer">Designed for the way you build. <span>DropPilot AI · Commerce, with clarity.</span></footer></div>;
}
function Metric({
  label,
  value,
  format,
  delta,
  icon,
  tone
}) {
  return <article className={`panel kpi ${tone}`} onPointerMove={e => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
  }}><div className="kpi-top"><span>{label}</span><span className={`metric-orb ${tone}`}><Icon name={icon} /></span></div><strong className="metric-value"><Count value={value} format={format} /></strong><div className="kpi-bottom"><span><Icon name="up" size={13} />{delta}</span><small>vs. last month</small></div><svg className="sparkline" viewBox="0 0 110 28" aria-hidden="true"><path d="M1 25 13 20 25 22 37 12 49 16 61 8 73 11 85 4 97 6 109 1" /></svg></article>;
}
function Overview({
  user,
  target,
  onNavigate,
  onDiscover,
  onGoal,
  onSelect
}) {
  const [now, setNow] = useState(new Date());
  const [liveMetrics, setLiveMetrics] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    if (user?.sessionMode === 'api') {
      analyticsService.getSummary()
        .then(res => {
          if (active && res.data) {
            setLiveMetrics(res.data);
          }
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [user]);

  const greeting = now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening';
  const rev = liveMetrics?.totalRevenue || 124820;
  const profit = liveMetrics?.totalProfit || 42618;
  const margin = liveMetrics?.netMargin || 34.1;
  const isLive = Boolean(liveMetrics && user?.sessionMode === 'api');

  return <><div className="dashboard-hero"><PageHead eyebrow={<><span className="status-dot" /> {isLive ? 'LIVE STORE OVERVIEW' : 'YOUR BUSINESS AT A GLANCE'}</>} title={<>Good {greeting}, <span className="gradient-text">{user.name.split(' ')[0]}</span><span className="greeting-wave">✦</span></>} description={<>Let’s make your next move a great one. <span className="date-label">{now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}</span>{isLive ? ' · Connected to backend order ledger' : ''}</>} action={<button className="primary hero-action" onClick={onDiscover}><Icon name="plus" size={18} /> Find winning products</button>} /></div><div className="metrics-grid"><Metric label="Store revenue" value={rev} format={money} delta="18.2%" icon="wallet" tone="violet" /><Metric label="Net profit" value={profit} format={money} delta="12.4%" icon="pulse" tone="mint" /><Metric label="Active products" value={liveMetrics?.unitsSold ?? 24} delta="3 products" icon="box" tone="blue" /><Metric label="Avg. margin" value={margin} format={v => (typeof v === 'number' ? v.toFixed(1) : v) + '%'} delta="2.7%" icon="sliders" tone="peach" /></div><div className="dashboard-chart-grid"><RevenueChart /><GoalRing target={target} onEdit={onGoal} /></div><div className="dashboard-bottom-grid"><section className="panel top-products"><div className="section-head"><div><h2>Top products</h2><p>Small discoveries. Big potential.</p></div><button className="text-button" onClick={() => onNavigate('discover')}>View all <Icon name="arrow" size={16} /></button></div><div className="table-labels"><span>PRODUCT</span><span>GROSS PROFIT / UNIT</span></div>{products.slice(0, 3).map((p, i) => <button className="top-product-row" key={p.id} onClick={() => onSelect(p)}><span className="row-index">0{i + 1}</span><ProductArt product={p} small /><span className="product-name"><b>{p.name}</b><small>{p.orders.toLocaleString()} sample orders</small></span><strong>{money(p.price - p.cost)}<small>per unit</small></strong><Icon name="arrow" size={16} /></button>)}</section><section className="panel actions-panel"><div className="section-head"><div><h2>Action center</h2><p>A little focus goes a long way.</p></div><span className="action-count">3</span></div>{[['spark', 'violet', 'Bring your next listing to life', 'Create a product story that connects.', 'listing'], ['box', 'blue', 'Find your ideal supplier', 'Compare cost, speed, and reliability.', 'suppliers'], ['target', 'mint', 'Keep your goal in sight', `${money(Math.max(0, target - 42618))} left to your monthly target.`, 'goals']].map(([icon, tone, title, sub, page]) => <button className="action-row" key={page} onClick={() => onNavigate(page)}><span className={`metric-orb ${tone}`}><Icon name={icon} /></span><span><b>{title}</b><small>{sub}</small></span><Icon name="arrow" size={17} /></button>)}</section></div><div className="dashboard-foot"><span><Icon name="spark" size={15} /> A clearer view. A more confident you.</span><span>Sample workspace · All figures are illustrative</span></div></>;
}
function ProfileForm({
  user,
  onSave
}) {
  const [name, setName] = useState(user.name);
  return <form onSubmit={e => {
    e.preventDefault();
    if (name.trim()) onSave({
      name: name.trim()
    });
  }}><Field label="Full name" required maxLength="80" value={name} onChange={e => setName(e.target.value)} /><Field label="Email address" value={user.email || ''} readOnly /><p className="footnote">Profile preferences are saved on this device.</p><button className="primary full" disabled={!name.trim()}>Save profile</button></form>;
}
function GoalForm({
  target,
  onSave
}) {
  const [value, setValue] = useState(target);
  return <form onSubmit={e => {
    e.preventDefault();
    if (Number(value) > 0) onSave(Number(value));
  }}><p>Set an ambitious, achievable monthly profit target.</p><Field label="Monthly profit target (₹)" type="number" min="1" max="1000000000" step="1" required value={value} onChange={e => setValue(e.target.value)} /><div className="goal-presets">{[50000, 62500, 100000].map(n => <button type="button" key={n} className={Number(value) === n ? 'selected' : ''} onClick={() => setValue(n)}>{money(n)}</button>)}</div><div className="insight"><Icon name="target" /><p>With {money(42618)} in sample profit, you’re {Number(value) > 0 ? Math.min(100, Math.round(42618 / Number(value) * 100)) : 0}% of the way there.</p></div><button className="primary full">Save profit target <Icon name="arrow" /></button></form>;
}
function Spotlight({
  onNavigate,
  onSelect,
  onGoal
}) {
  const [query, setQuery] = useState('');
  const results = [...navigation.map(([id, name, icon]) => ({
    name,
    kind: 'Workspace',
    icon,
    action: () => onNavigate(id)
  })), ...products.map(p => ({
    name: p.name,
    kind: 'Product',
    icon: p.icon,
    action: () => onSelect(p)
  })), ...suppliers.map(s => ({
    name: s.name,
    kind: 'Supplier',
    icon: 'box',
    action: () => onNavigate('suppliers')
  })), {
    name: 'Adjust monthly profit target',
    kind: 'Quick action',
    icon: 'target',
    action: onGoal
  }].filter(r => r.name.toLowerCase().includes(query.toLowerCase()));
  return <><label className="search-field spotlight-input"><Icon name="search" /><input autoFocus placeholder="Search products, suppliers, or actions…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => {
        if (e.key === 'Enter' && results.length) results[0].action();
      }} /></label><div className="spotlight-results">{results.map(r => <button key={r.kind + r.name} onClick={r.action}><span className="metric-orb violet"><Icon name={r.icon} /></span><span><b>{r.name}</b><small>{r.kind}</small></span><Icon name="arrow" size={16} /></button>)}{!results.length && <div className="empty-state"><p>No matches. Try “supplier”, “fan”, or “goal”.</p></div>}</div><div className="spotlight-footer">Tab to navigate · Enter to select · Esc to close</div></>;
}
export default function App() {
  const {
    user,
    loading,
    logout,
    updateProfile
  } = useAuth();
  const [theme, setTheme] = useStored('droppilot_theme', 'light'),
    [target, setTarget] = useStored('droppilot_target', 62500);
  const [page, setPage] = useState('overview'),
    [menu, setMenu] = useState(false),
    [modal, setModal] = useState(null),
    [profile, setProfile] = useState(false),
    [selected, setSelected] = useState(products[0]),
    [toast, setToast] = useState('');
  const profileRef = useRef(null);
  const close = useCallback(() => setModal(null), []);
  const notify = useCallback(message => setToast(message), []);
  useEffect(() => {
    localStorage.setItem('droppilot_theme', 'light');
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }, [theme]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 5500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && user) {
        e.preventDefault();
        setModal('search');
        setProfile(false);
      }
      if (e.key === 'Escape') {
        setProfile(false);
        setMenu(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user]);
  useEffect(() => {
    const handler = e => {
      if (!profileRef.current?.contains(e.target)) setProfile(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);
  const navigate = id => {
    setPage(id);
    setMenu(false);
    setModal(null);
    setProfile(false);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const select = p => {
    setSelected(p);
    setModal('product');
  };
  const safeTarget = Number(target) > 0 ? Number(target) : 62500;
  if (loading) return <div className="loading-screen"><Brand /><p>Opening your workspace…</p></div>;
  if (!user) return <AuthScreen theme={theme} setTheme={setTheme} />;
  return <div className="app-shell"><a href="#workspace" className="skip-link">Skip to workspace</a>{menu && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}<aside className={`sidebar ${menu ? 'open' : ''}`}><Brand /><div className="workspace-switch"><span className="workspace-avatar">{initials(user.name)}</span><span><b>My workspace</b><small>Personal workspace</small></span><span className="status-dot" /></div><div className="nav-label">WORKSPACE</div><nav aria-label="Main navigation"><span className="nav-indicator" style={{
          transform: `translateY(${navigation.findIndex(n => n[0] === page) * 52}px)`
        }} />{navigation.map(([id, label, icon], i) => <button key={id} style={{
          '--i': i
        }} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={icon} /><span>{label}</span>{id === 'content' && <small className="ai-tag">AI</small>}</button>)}</nav><div className="sidebar-bottom"><div className="plan-card"><span className="plan-spark"><Icon name="spark" /></span><span className="eyebrow">ROOM TO GROW</span><h3>Your next level awaits.</h3><p>Big ideas deserve powerful tools.</p><button onClick={() => setModal('plan')}>Explore plans <Icon name="arrow" size={17} /></button></div><div className="sidebar-status"><span className="status-dot" />{user.sessionMode === 'api' ? 'API session' : 'Demo workspace'}<span>v.2.0</span></div></div></aside><div className="main-shell"><header className="topbar glass"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenu(true)}><Icon name="menu" /></button><button className="command-trigger" onClick={() => setModal('search')}><Icon name="search" /><span>Search products, suppliers, or listings…</span><kbd>⌘ K</kbd></button><div className="topbar-actions"><ThemeSwitch theme={theme} setTheme={setTheme} /><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setModal('notifications')}><Icon name="bell" /><i /></button><div className="profile-wrap" ref={profileRef}><button className="profile-trigger" aria-expanded={profile} onClick={() => setProfile(!profile)}><span className="avatar">{initials(user.name)}</span><span className="profile-info"><b>{user.name}</b><small>{user.plan || 'Starter'}</small></span><Icon name="down" size={15} /></button>{profile && <div className="profile-menu glass"><div><b>{user.name}</b><small>{user.email}</small></div>{[['user', 'Edit Profile', 'profile'], ['moon', 'Switch Theme', 'theme'], ['wallet', 'Billing & Plan', 'plan'], ['logout', 'Sign Out', 'logout']].map(([icon, label, action]) => <button key={action} onClick={() => {
                setProfile(false);
                if (action === 'theme') setTheme(theme === 'light' ? 'dark' : 'light');else if (action === 'logout') {
                  setModal(null);
                  setPage('overview');
                  logout();
                } else setModal(action);
              }}><Icon name={icon} size={18} />{label}</button>)}</div>}</div></div></header><main id="workspace" className="workspace" tabIndex="-1"><div className="page-enter" key={page}>{page === 'overview' && <Overview user={user} target={safeTarget} onNavigate={navigate} onDiscover={() => setModal('discover')} onGoal={() => setModal('goal')} onSelect={select} />} {page === 'discover' && <Discovery onSelect={select} />} {page === 'pricing' && <Pricing key={selected.id} product={selected} />} {page === 'suppliers' && <SupplierComparison product={selected} notify={notify} />} {(page === 'listing' || page === 'content') && <ListingStudio key={page + selected.id} product={selected} content={page === 'content'} notify={notify} user={user} />} {page === 'shopify' && <Shopify notify={notify} />} {page === 'goals' && <ProfitGoalPlannerPage />} {page === 'recovery' && <Goals target={safeTarget} onEdit={() => setModal('goal')} recovery={page === 'recovery'} onNavigate={navigate} />}</div></main></div>{modal && <Modal title={{
      search: 'A little shortcut to everything.',
      profile: 'Make it yours.',
      plan: 'Your workspace plan',
      goal: 'A goal worth growing toward.',
      notifications: 'Your workspace updates',
      discover: 'Find your next winning product',
      product: selected.name
    }[modal]} onClose={close} wide={modal === 'search' || modal === 'discover' || modal === 'plan'}>{modal === 'search' && <Spotlight onNavigate={navigate} onSelect={select} onGoal={() => setModal('goal')} />} {modal === 'profile' && <ProfileForm user={user} onSave={patch => {
        updateProfile(patch);
        close();
        notify('Profile updated.');
      }} />} {modal === 'goal' && <GoalForm target={safeTarget} onSave={value => {
        setTarget(value);
        close();
        notify('Your monthly profit target is updated.');
      }} />} {modal === 'plan' && <div className="revenue-streams-modal">
        <p style={{ color: 'var(--muted)', marginBottom: '18px', fontSize: '14px' }}>
          Choose the plan that fits your current store volume. Switch plans or upgrade anytime.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {[
            {
              name: 'Starter',
              price: 'Free / Demo',
              credits: '50 research credits/mo',
              fee: '2.5% order processing',
              supplier: 'Standard supplier catalog',
              modules: 'Basic AI Listing Templates'
            },
            {
              name: 'Growth Plan',
              price: '₹1,999 / mo',
              credits: '500 research credits/mo',
              fee: '1.5% order processing',
              supplier: 'Preferred supplier rates',
              modules: 'Gemini Listing Studio + Shopify Sync'
            },
            {
              name: 'Enterprise AI',
              price: '₹4,999 / mo',
              credits: 'Unlimited AI research credits',
              fee: '0.8% order processing',
              supplier: 'Direct wholesale discounts',
              modules: 'All Premium Automation Modules'
            }
          ].map(tier => (
            <button
              key={tier.name}
              className={user.plan === tier.name ? 'selected' : ''}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '16px 18px',
                background: user.plan === tier.name ? 'var(--panel)' : 'var(--canvas-subtle)',
                border: user.plan === tier.name ? '2px solid var(--accent)' : '1.5px solid var(--line)',
                borderRadius: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: user.plan === tier.name ? '0 6px 18px rgba(255, 150, 61, 0.22)' : 'none'
              }}
              onClick={() => {
                updateProfile({ plan: tier.name });
                notify(`Workspace tier set to ${tier.name}.`);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '16px', color: 'var(--text)' }}>{tier.name}</strong>
                {user.plan === tier.name && <span className="badge positive" style={{ fontSize: '11px', padding: '2px 8px' }}>Active</span>}
              </div>
              <div style={{ fontSize: '19px', fontWeight: 800, color: '#D96B00', marginBottom: '12px' }}>{tier.price}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12.5px', color: 'var(--muted)', lineHeight: '1.65' }}>
                <li>✓ {tier.credits}</li>
                <li>✓ {tier.fee}</li>
                <li>✓ {tier.supplier}</li>
                <li>✓ {tier.modules}</li>
              </ul>
            </button>
          ))}
        </div>
      </div>} {modal === 'discover' && <Discovery onSelect={select} />} {modal === 'product' && <><ProductArt product={selected} /><p>{selected.sourceLabel ? `${selected.sourceLabel.replaceAll('_', ' ')} · Backend demand score ${selected.score}/100` : `Local sample catalogue · Sample opportunity score ${selected.score}/100`}</p><div className="mini-stats"><div><span>Supplier cost</span><strong>{money(selected.cost)}</strong></div><div><span>Retail estimate</span><strong>{money(selected.price)}</strong></div></div>{selected.opportunityScore != null && (<div style={{ marginTop: '12px', padding: '14px 16px', borderRadius: '16px', background: 'var(--canvas-subtle)', border: '1.5px solid var(--line)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}><span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#C75B00' }}>⭐ AI Opportunity Score</span><span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#D96B00' }}>{selected.opportunityScore}/100</span></div>{selected.scoreBreakdown && (<div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}><span>Margin: {selected.scoreBreakdown.marginContribution}/35</span><span>Demand: {selected.scoreBreakdown.demandContribution}/30</span><span>Supplier: {selected.scoreBreakdown.supplierContribution}/25</span><span>Shipping: {selected.scoreBreakdown.shippingContribution}/10</span></div>)}{selected.recommendationReason && (<p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'var(--text)' }}>{selected.recommendationReason}</p>)}</div>)}<ProductSentimentInspector productId={selected.id} productName={selected.name} /><div className="button-row" style={{ marginTop: '16px' }}><button className="secondary" onClick={() => navigate('suppliers')}>Compare suppliers</button><button className="secondary" onClick={() => navigate('pricing')}>Model pricing</button><button className="primary" onClick={() => navigate('listing')}>Create listing <Icon name="arrow" /></button></div></>} {modal === 'notifications' && <div className="notification-list"><div><span className="metric-orb violet"><Icon name="target" /></span><span><b>Your goal, at a glance</b><p>{money(Math.max(0, safeTarget - 42618))} remains against the sample monthly profit.</p></span></div><div><span className="metric-orb mint"><Icon name="compass" /></span><span><b>Your next discovery awaits</b><p>Four sample products are ready to explore in your catalogue.</p></span></div><button className="secondary full" onClick={() => navigate('discover')}>Explore products <Icon name="arrow" /></button></div>}</Modal>}{toast && <div className="toast glass" role="status"><Icon name="spark" size={18} />{toast}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast('')}><Icon name="close" size={16} /></button></div>}</div>;
}
