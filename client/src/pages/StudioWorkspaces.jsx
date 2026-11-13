import { calculateGoal } from '../utils/workspaceMath';
import { useEffect, useState } from 'react';
import { Field, Icon, money, PageHead, ProductArt, products, useStored } from '../components/StudioUI';
import { GoalRing } from '../components/charts/StudioCharts';
import listingService from '../services/listingService';
import productService from '../services/productService';
import shopifyService from '../services/shopifyService';
import supplierService from '../services/supplierService';
import { readProductList } from '../utils/productContract';
import { readShopifyStatus, readShopifySync, shopifyProductPayload } from '../utils/shopifyContract';
import { readSupplierComparison } from '../utils/supplierContract';
export function Discovery({
  onSelect,
  initialSearch = '',
  demoMode = false
}) {
  const [query, setQuery] = useState(initialSearch),
    [category, setCategory] = useState('All products'),
    [sort, setSort] = useState('score');
  const [apiProducts, setApiProducts] = useState([]);
  const [usingSamples, setUsingSamples] = useState(demoMode);
  const [loading, setLoading] = useState(!demoMode);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (demoMode || usingSamples) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError('');
    productService.getProducts({ limit: 100 }, { signal: controller.signal })
      .then(response => {
        const catalogue = readProductList(response);
        if (active) setApiProducts(catalogue);
      })
      .catch(error => {
        if (active && error.name !== 'AbortError') setError(error.message || 'Could not load the product catalogue.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [demoMode, usingSamples, retry]);

  const sampleMode = demoMode || usingSamples;
  const catalogue = sampleMode ? products : apiProducts;
  const categories = [...new Set(catalogue.map(product => product.category))];
  const list = catalogue
    .filter(product => (category === 'All products' || product.category === category) &&
      (product.name + ' ' + product.category).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'score' ? b.score - a.score : (b.price - b.cost) - (a.price - a.cost));

  return <>
    <PageHead eyebrow="Find your edge" title="Your next bestseller starts here."
      description={sampleMode ? 'Explore the clearly labelled local sample catalogue.' : 'Search the backend product catalogue and review its source label, demand score, cost, and price.'}
      action={<span className="badge">{sampleMode ? 'Local demo catalogue' : 'Backend catalogue'}</span>} />
    <div className="panel filters">
      <label className="search-field"><Icon name="search" /><input aria-label="Search catalogue" placeholder="Search products or niches…" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <select aria-label="Product category" value={category} onChange={event => setCategory(event.target.value)}>
        {['All products', ...categories].map(value => <option key={value}>{value}</option>)}
      </select>
      <select aria-label="Sort products" value={sort} onChange={event => setSort(event.target.value)}>
        <option value="score">Highest demand score</option><option value="margin">Highest gross profit</option>
      </select>
    </div>
    {!sampleMode && error && <div className="insight" role="alert"><div><b>Catalogue unavailable</b><p>{error}</p>
      <div className="button-row"><button className="secondary" onClick={() => setRetry(value => value + 1)}>Retry backend</button>
        <button className="secondary" onClick={() => { setError(''); setUsingSamples(true); }}>Use local sample catalogue</button></div>
    </div></div>}
    {loading && <p className="planner-status" role="status">Loading products from the backend…</p>}
    <div className="results-line"><span>{list.length} products to explore</span><span>{sampleMode ? 'Local sample data' : 'Backend catalogue'}</span></div>
    <div className="product-grid">{list.map(product => <article key={product.id} className="panel product-card">
      <ProductArt product={product} /><div className="product-content">
        <div className="section-head"><span className="badge">{product.sourceLabel?.replaceAll('_', ' ') || product.trend}</span>
          <strong className="positive-text">{product.score}<small>/100</small></strong></div>
        <h2>{product.name}</h2><p>{product.category} · {product.trend}</p>
        <div className="product-prices"><span>Estimated cost<b>{money(product.cost)}</b></span><span>Suggested retail<b>{money(product.price)}</b></span></div>
        <button className="secondary full" onClick={() => onSelect(product)}>Explore product <Icon name="arrow" size={17} /></button>
      </div>
    </article>)}</div>
    {!loading && !error && !list.length && <div className="panel empty-state"><Icon name="search" size={38} /><h2>No matches yet</h2>
      <p>Try a broader search or a different category.</p>
      <button className="secondary" onClick={() => { setQuery(''); setCategory('All products'); }}>Reset filters</button>
    </div>}
    {sampleMode && !demoMode && <button className="text-button" onClick={() => setUsingSamples(false)}>Return to backend catalogue</button>}
  </>;
}
export function SupplierComparison({
  product,
  notify
}) {
  const [sort, setSort] = useState('cost'),
    [selected, setSelected] = useStored('droppilot_supplier', '');
  const [comparison, setComparison] = useState(null);
  const [comparisonProduct, setComparisonProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function loadComparison() {
      setLoading(true);
      setError('');
      try {
        let targetProduct = product?.sourceLabel ? product : null;
        if (!targetProduct) {
          targetProduct = readProductList(await productService.getProducts({ limit: 1 }, { signal: controller.signal }))[0];
        }
        if (!targetProduct) throw new Error('No backend product is available for supplier comparison.');
        const supplierIds = [
          ...(targetProduct.supplierIds || []),
          ...(targetProduct.suppliers || []).map(supplier => typeof supplier === 'string' ? supplier : supplier.id || supplier._id),
        ].filter(Boolean);
        const response = await supplierService.compareSuppliers({
          productId: targetProduct.id,
          supplierIds: [...new Set(supplierIds)],
        }, { signal: controller.signal });
        const data = readSupplierComparison(response);
        if (active) {
          setComparison(data);
          setComparisonProduct(targetProduct);
        }
      } catch (error) {
        if (active && error.name !== 'AbortError') setError(error.message || 'Could not compare suppliers.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadComparison();
    return () => {
      active = false;
      controller.abort();
    };
  }, [product, retry]);

  const rows = [...(comparison?.comparisons || [])].sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'days') return Number.parseInt(a.estimatedShippingDays, 10) - Number.parseInt(b.estimatedShippingDays, 10);
    return a.totalLandedCost - b.totalLandedCost;
  });
  return <>
    <PageHead eyebrow="A stronger supply chain" title="Great products. Better partners."
      description={`Backend comparison for ${comparisonProduct?.name || product?.name || 'your selected product'}.`}
      action={<select aria-label="Rank suppliers" value={sort} onChange={event => setSort(event.target.value)}>
        <option value="cost">Lowest landed cost</option><option value="days">Fastest delivery</option><option value="rating">Highest rating</option>
      </select>} />
    {loading && <p className="planner-status" role="status">Comparing suppliers with the backend…</p>}
    {error && <div className="insight" role="alert"><div><b>Supplier comparison unavailable</b><p>{error}</p>
      <button className="secondary" onClick={() => setRetry(value => value + 1)}>Retry comparison</button>
    </div></div>}
    {comparison?.recommendationReason && <div className="insight"><Icon name="check" /><p>{comparison.recommendationReason}</p></div>}
    {!loading && !error && !rows.length && <div className="panel empty-state"><p>No supplier comparisons were returned.</p></div>}
    <div className="supplier-grid">{rows.map(supplier => <section className={`panel supplier-card ${selected === supplier.supplierId ? 'chosen' : ''}`} key={supplier.supplierId}>
      <div className="section-head"><span className={`badge ${supplier.verified ? 'positive' : 'warning'}`}>{supplier.trustBadge}</span>
        {comparison?.recommendedSupplierId === supplier.supplierId && <span className="badge positive">Recommended</span>}
      </div>
      <h2>{supplier.name}</h2><p>{supplier.sourceLabel.replaceAll('_', ' ')} · {supplier.country}</p>
      <dl><div><dt>Unit cost</dt><dd>{money(supplier.unitCost)}</dd></div>
        <div><dt>Shipping</dt><dd>{money(supplier.shippingCost)}</dd></div>
        <div><dt>Landed cost</dt><dd>{money(supplier.totalLandedCost)}</dd></div>
        <div><dt>Delivery estimate</dt><dd>{supplier.estimatedShippingDays} days</dd></div>
        <div><dt>Rating</dt><dd>★ {supplier.rating} / 5</dd></div>
        <div><dt>Fulfillment</dt><dd>{supplier.fulfillmentRate}%</dd></div>
      </dl>
      <ul>{supplier.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul>
      <button className={selected === supplier.supplierId ? 'secondary full' : 'primary full'} onClick={() => {
        setSelected(supplier.supplierId);
        notify(`${supplier.name} selected as preferred supplier on this device.`);
      }}>{selected === supplier.supplierId ? 'Selected supplier' : 'Select supplier'}<Icon name={selected === supplier.supplierId ? 'check' : 'arrow'} size={17} /></button>
    </section>)}</div>
    <p className="footnote">Trust badge, supplier provenance, and recommendation are supplied by the backend. Your preferred-supplier choice is saved only on this device.</p>
  </>;
}
export function ListingStudio({
  product,
  content = false,
  notify,
  user
}) {
  const [features, setFeatures] = useState(product.features),
    [audience, setAudience] = useState('Everyday shoppers'),
    [channel, setChannel] = useState('Instagram'),
    [draft, setDraft] = useStored(`droppilot_draft_${user.email}_${product.id}_${content ? 'social' : 'listing'}`, null),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false);
  const [source, setSource] = useState(user.sessionMode === 'api' && !content ? 'api' : 'local');
  const generate = async () => {
    setBusy(true);
    try {
      if (source === 'api') {
        const res = await listingService.generateListing({
          productTitle: product.name,
          productFeatures: features.split('\n'),
          targetAudience: audience
        });
        if (!res.data?.description) throw new Error('The service did not return a listing.');
        setDraft({
          title: res.data.title || product.name,
          description: res.data.description
        });
      } else {
        const facts = features.split('\n').map(s => s.trim()).filter(Boolean);
        setDraft({
          title: content ? `${channel}: ${product.name}` : product.name,
          description: content ? `${channel === 'TikTok' ? 'Meet your next everyday essential.' : channel === 'Instagram' ? 'A little upgrade to your everyday.' : 'Discover ' + product.name + '.'}\n\n${product.name} for ${audience.toLowerCase()}.\n${facts.map(s => '• ' + s).join('\n')}\n\n${channel === 'Instagram' ? '#EverydayEssentials #SmartShopping' : 'Explore the details and find your fit.'}` : `Meet ${product.name}, designed for ${audience.toLowerCase()}.\n\n${facts.map(s => '• ' + s).join('\n')}\n\nExplore the features and choose what works for you.`
        });
      }
      setPreview(false);
      notify('Draft created. Review the product claims before publishing.');
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };
  return <><PageHead eyebrow={content ? 'One product. Many possibilities.' : 'From product to possibility'} title={content ? 'Make every channel your own.' : 'A listing worth stopping for.'} description={content ? 'Create channel-specific copy from the product facts you provide.' : 'Turn verified product details into a clear, editable listing.'} /><div className="workspace-grid"><section className="panel"><div className="product-inline"><ProductArt product={product} small /><div><h2>{product.name}</h2><p>{product.category}</p></div></div><label className="form-field"><span>Product facts, one per line</span><textarea rows="6" value={features} onChange={e => setFeatures(e.target.value)} /></label><Field label="Target audience" value={audience} onChange={e => setAudience(e.target.value)} />{content ? <label className="form-field"><span>Channel</span><select value={channel} onChange={e => setChannel(e.target.value)}>{['Instagram', 'TikTok', 'Facebook Ads', 'Shopify SEO'].map(c => <option key={c}>{c}</option>)}</select></label> : <label className="form-field"><span>Draft source</span><select value={source} onChange={e => setSource(e.target.value)}><option value="local">Local template</option><option value="api">Existing listing API</option></select></label>}<button className="primary full" disabled={busy || !features.trim() || !audience.trim()} onClick={generate}><Icon name="spark" />{busy ? 'Creating…' : content ? 'Create channel copy' : 'Generate listing'}</button><p className="footnote">{source === 'local' ? 'Built from your facts using a local template.' : 'Uses the existing backend listing service.'}</p></section><section className="panel"><div className="section-head"><h2>{preview ? 'Listing preview' : 'Your creative canvas'}</h2>{draft && <span className="badge positive">Saved on this device</span>}</div>{draft ? <><div className="segmented draft-tabs"><button className={!preview ? 'selected' : ''} onClick={() => setPreview(false)}>Edit draft</button><button className={preview ? 'selected' : ''} onClick={() => setPreview(true)}>Preview</button></div>{preview ? <article className="draft-preview"><h2>{draft.title}</h2><p>{draft.description}</p></article> : <><Field label="Title" value={draft.title} onChange={e => setDraft({
              ...draft,
              title: e.target.value
            })} /><label className="form-field"><span>Description</span><textarea rows="10" value={draft.description} onChange={e => setDraft({
                ...draft,
                description: e.target.value
              })} /></label></>}<div className="button-row"><button className="secondary" onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${draft.title}\n\n${draft.description}`);
                notify('Draft copied.');
              } catch {
                notify('Clipboard unavailable. Select and copy the draft text.');
              }
            }}>Copy text</button><button className="primary" onClick={() => {
              const blob = new Blob([`${draft.title}\n\n${draft.description}`], {
                type: 'text/plain'
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${product.id}-draft.txt`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              notify('Draft exported.');
            }}>Export draft <Icon name="arrow" size={17} /></button></div></> : <div className="empty-state"><span className="orb"><Icon name="file" size={34} /></span><h2>Good stories start with facts.</h2><p>Add your product details, then create your first draft.</p></div>}</section></div></>;
}
export function Goals({
  target,
  onEdit,
  recovery = false,
  onNavigate
}) {
  const [perOrder, setPerOrder] = useState(539),
    [show, setShow] = useState(false);
  const {
    remaining,
    days,
    dailyProfit,
    orders,
    dailyOrders
  } = calculateGoal(target, 42618, perOrder);
  return <><PageHead eyebrow={recovery ? 'Your next best move' : 'A little ambition. A clear plan.'} title={recovery ? 'Get back on your growth path.' : 'Give your growth a destination.'} description="Plan against the sample profit of ₹42,618. Your target is saved on this device." action={<button className="primary" onClick={onEdit}>Adjust target <Icon name="target" /></button>} /><div className="workspace-grid goal-workspace"><GoalRing target={target} onEdit={onEdit} /><section className="panel"><h2>{recovery ? 'Build your recovery plan' : 'Make the numbers work for you'}</h2><p>{days} days remaining this month, including today.</p><div className="mini-stats"><div><span>Remaining profit</span><strong>{money(remaining)}</strong></div><div><span>Daily profit needed</span><strong>{money(dailyProfit)}</strong></div></div><Field label="Estimated profit per order (₹)" type="number" min="1" value={perOrder} onChange={e => setPerOrder(Math.max(1, Number(e.target.value)))} /><div className="insight"><Icon name="target" /><p>At {money(perOrder)} profit per order, aim for <b>{orders} additional orders</b> this month — approximately <b>{dailyOrders} per day</b>.</p></div>{recovery ? <><button className="primary" onClick={() => setShow(true)}>Build action plan <Icon name="spark" /></button>{show && <ol className="recovery-steps"><li>Prioritize products with at least {money(perOrder)} profit per order.</li><li>Compare shipping and unit costs to protect your margin.</li><li>Review progress daily against {money(dailyProfit)} in profit.</li></ol>}</> : <button className="secondary" onClick={() => onNavigate('recovery')}>Explore a recovery plan <Icon name="arrow" /></button>}</section></div></>;
}
export function Shopify({
  notify
}) {
  const [domain, setDomain] = useState('');
  const [connection, setConnection] = useState(null);
  const [busy, setBusy] = useState('status');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState([]);

  function errorMessage(error) {
    if (error.status === 401 || error.status === 403) return 'Sign in with a backend account to manage the Shopify connection.';
    return error.message || 'The Shopify request failed.';
  }

  useEffect(() => {
    let active = true;
    shopifyService.getStatus()
      .then(response => {
        const status = readShopifyStatus(response);
        if (active) setConnection(status);
      })
      .catch(error => {
        if (active) setError(errorMessage(error));
      })
      .finally(() => {
        if (active) setBusy('');
      });
    return () => { active = false; };
  }, []);

  async function refreshStatus() {
    setBusy('status');
    setError('');
    try {
      setConnection(readShopifyStatus(await shopifyService.getStatus()));
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy('');
    }
  }

  async function connect(e) {
    e.preventDefault();
    setBusy('connect');
    setError('');
    setNotice('');
    try {
      const shopDomain = domain.trim().toLowerCase();
      const status = readShopifyStatus(await shopifyService.connectStore({ shopDomain }));
      if (!status.connected) throw new Error('The server did not confirm the Shopify connection.');
      setConnection(status);
      setNotice(status.disclosure);
      notify?.(status.isSimulated ? 'Demo Shopify connection confirmed.' : 'Shopify connection confirmed.');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy('');
    }
  }

  async function disconnect() {
    setBusy('disconnect');
    setError('');
    setNotice('');
    try {
      const response = await shopifyService.disconnectStore();
      if (response.data?.success !== true) throw new Error('The server did not confirm disconnection.');
      setConnection(readShopifyStatus(await shopifyService.getStatus()));
      setDomain('');
      setResults([]);
      setNotice('Shopify store disconnected.');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy('');
    }
  }

  async function sync() {
    const queuedProducts = products.filter(product => selected.includes(product.id));
    if (!connection?.connected || !queuedProducts.length) return;
    setBusy('sync');
    setError('');
    setNotice('');
    setResults([]);
    const confirmed = [];
    try {
      for (const product of queuedProducts) {
        const result = readShopifySync(await shopifyService.syncProduct(shopifyProductPayload(product)));
        confirmed.push({ ...result, productId: product.id, productName: product.name });
        setResults([...confirmed]);
        setSelected(previous => previous.filter(id => id !== product.id));
      }
      const simulatedCount = confirmed.filter(result => result.isSimulated).length;
      const summary = `${confirmed.length} product sync${confirmed.length === 1 ? '' : 's'} confirmed; ${simulatedCount} simulated.`;
      setNotice(summary);
      notify?.(summary);
    } catch (error) {
      setError(`${errorMessage(error)} ${confirmed.length ? `${confirmed.length} confirmed product(s) were removed from the selection. ` : ''}Check the store before retrying an unconfirmed product.`);
    } finally {
      setBusy('');
    }
  }

  const statusLabel = !connection
    ? 'Status unavailable'
    : connection.connected
      ? connection.isSimulated ? 'Connected · simulated' : 'Connected · live'
      : 'Not connected';
  const statusBadge = connection?.connected
    ? connection.isSimulated ? 'badge warning' : 'badge positive'
    : 'badge';

  return <>
    <PageHead eyebrow="Your storefront, in sync" title="Shopify connection & sync"
      description="Check the store connection, then sync selected product listings."
      action={<span className={statusBadge}>{statusLabel}</span>} />
    <div className="insight"><Icon name="file" /><p>{connection?.disclosure || 'Connection and sync status come from the backend. A simulated result is not a live Shopify update.'} Domain-only connection does not complete Shopify OAuth.</p></div>
    {busy && <p className="planner-status" role="status">{({
      status: 'Checking Shopify connection',
      connect: 'Connecting to Shopify',
      disconnect: 'Disconnecting Shopify',
      sync: 'Syncing selected products',
    })[busy]}…</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="form-message" role="status">{notice}</p>}
    <div className="workspace-grid">
      <section className="panel">
        <span className="orb mint"><Icon name="bag" size={30} /></span>
        <div className="section-head"><h2>Store connection</h2><button className="secondary" disabled={!!busy} onClick={refreshStatus}>Refresh status</button></div>
        <p>{connection?.connected ? `Connected store: ${connection.shopDomain || 'Shopify store'}` : 'Connect a Shopify store domain to enable product sync.'}</p>
        <form onSubmit={connect}>
          <Field label="Shopify store domain" type="text" required
            pattern="[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com"
            placeholder="your-store.myshopify.com" value={domain}
            disabled={!!busy || !!connection?.connected}
            onChange={event => setDomain(event.target.value)} />
          <button className="primary full" disabled={!!busy || !!connection?.connected}>
            {busy === 'connect' ? 'Connecting…' : 'Connect store'}<Icon name="arrow" />
          </button>
        </form>
        {connection?.connected && <button className="secondary full" disabled={!!busy} onClick={disconnect}>
          {busy === 'disconnect' ? 'Disconnecting…' : 'Disconnect store'}
        </button>}
      </section>
      <section className="panel">
        <h2>Choose products to sync</h2>
        <p>Each selected sample listing is sent separately. The backend reports whether each result is simulated or live.</p>
        {products.map(product => <label className="sync-row" key={product.id}>
          <input type="checkbox" checked={selected.includes(product.id)} disabled={!!busy}
            onChange={event => setSelected(event.target.checked ? [...selected, product.id] : selected.filter(id => id !== product.id))} />
          <ProductArt product={product} small /><span>{product.name}</span>
        </label>)}
        <button className="primary full" disabled={!!busy || !connection?.connected || !selected.length} onClick={sync}>
          {busy === 'sync' ? 'Syncing…' : `Sync ${selected.length} selected product${selected.length === 1 ? '' : 's'}`}
        </button>
        {results.map(result => <div className="insight" key={result.externalProductId}>
          <Icon name="check" /><div><b>{result.productName}: {result.status}</b>
            <p>{result.isSimulated ? `Simulated · ${result.disclosure}` : 'Live result confirmed by the backend.'}</p>
            <p>External ID: {result.externalProductId} · {new Date(result.syncedAt).toLocaleString()}</p>
          </div>
        </div>)}
      </section>
    </div>
  </>;
}
