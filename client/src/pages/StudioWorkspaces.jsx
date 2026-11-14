import { calculateGoal } from '../utils/workspaceMath';
import { useEffect, useState } from 'react';
import { Field, Icon, money, PageHead, ProductArt, products, useStored } from '../components/StudioUI';
import { GoalRing } from '../components/charts/StudioCharts';
import goalService from '../services/goalService';
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

  // Phase 2: Hugging Face Semantic Search State
  const [semanticMode, setSemanticMode] = useState(false);
  const [semanticItems, setSemanticItems] = useState(null);
  const [semanticMeta, setSemanticMeta] = useState(null);
  const [semanticLoading, setSemanticLoading] = useState(false);

  // Phase 3: Multi-Criteria Opportunity Recommendations State
  const [opportunityItems, setOpportunityItems] = useState(null);
  const [topExplanation, setTopExplanation] = useState(null);
  const [opportunityLoading, setOpportunityLoading] = useState(false);

  const fetchRecommendations = async (q = '') => {
    setOpportunityLoading(true);
    try {
      const res = await productService.getRecommendations({ query: q, includeExplanation: true });
      if (res.data?.recommendations) {
        setOpportunityItems(res.data.recommendations);
        const top = res.data.recommendations.find(r => r.aiExplanation);
        setTopExplanation(top ? { ...top.aiExplanation, productName: top.product.title || top.product.name, score: top.opportunityScore } : null);
      }
    } catch {
      setOpportunityItems(null);
    } finally {
      setOpportunityLoading(false);
    }
  };

  const runSemanticSearch = async (text) => {
    if (!text || !text.trim()) {
      setSemanticItems(null);
      setSemanticMeta(null);
      return;
    }
    setSemanticLoading(true);
    try {
      const res = await productService.semanticSearch(text.trim());
      if (res.data?.results) {
        setSemanticItems(res.data.results);
        setSemanticMeta({
          inferenceMode: res.data.inferenceMode,
          isFallback: res.data.isFallback,
          model: res.data.model,
          provider: res.data.provider,
          fallbackReason: res.data.fallbackReason,
        });
      }
    } catch {
      setSemanticItems(null);
      setSemanticMeta(null);
    } finally {
      setSemanticLoading(false);
    }
  };

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

  let list = [];
  if (sort === 'opportunity' && opportunityItems) {
    list = opportunityItems.map(item => ({
      ...item.product,
      id: item.product.id || item.product._id,
      name: item.product.title || item.product.name,
      price: item.product.suggestedRetailPrice || item.product.price,
      cost: item.product.estimatedCost || item.product.cost,
      score: item.product.demandScore || item.product.score,
      opportunityScore: item.opportunityScore,
      scoreBreakdown: item.scoreBreakdown,
      recommendationReason: item.recommendationReason,
    })).filter(product => (category === 'All products' || product.category === category));
  } else if (semanticMode && semanticItems) {
    list = semanticItems.map(item => ({
      ...item.product,
      id: item.product.id || item.product._id,
      name: item.product.title || item.product.name,
      price: item.product.suggestedRetailPrice || item.product.price,
      cost: item.product.estimatedCost || item.product.cost,
      score: item.product.demandScore || item.product.score,
      similarityScore: item.similarityScore,
      semanticModel: item.model,
    }));
  } else {
    list = catalogue
      .filter(product => (category === 'All products' || product.category === category) &&
        (product.name + ' ' + product.category).toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => sort === 'score' ? b.score - a.score : (b.price - b.cost) - (a.price - a.cost));
  }

  return <>
    <PageHead eyebrow="Find your edge" title="Your next bestseller starts here."
      description={sampleMode ? 'Explore the clearly labelled local sample catalogue.' : 'Search the backend product catalogue with keyword, Hugging Face semantic embeddings, or multi-criteria opportunity scoring.'}
      action={<span className="badge">{sampleMode ? 'Local demo catalogue' : 'Backend catalogue'}</span>} />
    <div className="panel filters">
      <label className="search-field"><Icon name="search" /><input aria-label="Search catalogue" placeholder={semanticMode ? 'Search by concept (e.g. ergonomic desk typing, summer cooling)...' : 'Search products or niches…'} value={query} onChange={event => {
        setQuery(event.target.value);
        if (semanticMode) runSemanticSearch(event.target.value);
        if (sort === 'opportunity') fetchRecommendations(event.target.value);
      }} onKeyDown={event => {
        if (event.key === 'Enter' && semanticMode) runSemanticSearch(query);
        if (event.key === 'Enter' && sort === 'opportunity') fetchRecommendations(query);
      }} /></label>
      <select aria-label="Product category" value={category} onChange={event => setCategory(event.target.value)}>
        {['All products', ...categories].map(value => <option key={value}>{value}</option>)}
      </select>
      <select aria-label="Sort products" value={sort} onChange={event => {
        const nextSort = event.target.value;
        setSort(nextSort);
        if (nextSort === 'opportunity') fetchRecommendations(query);
      }}>
        <option value="score">Highest demand score</option>
        <option value="margin">Highest gross profit</option>
        <option value="opportunity">⭐ AI Opportunity (Multi-Criteria)</option>
      </select>
      <button
        type="button"
        className={semanticMode ? 'primary' : 'secondary'}
        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
        onClick={() => {
          const next = !semanticMode;
          setSemanticMode(next);
          if (next && query.trim()) runSemanticSearch(query);
          else setSemanticItems(null);
        }}
      >
        <Icon name="spark" size={15} />
        {semanticMode ? '⚡ Semantic AI Active' : 'Semantic Search (MiniLM)'}
      </button>
    </div>
    {semanticMode && <div className="insight" style={{ marginBottom: '14px' }}>
      <Icon name="spark" />
      <p><b>Hugging Face Semantic Search Active (`sentence-transformers/all-MiniLM-L6-v2`)</b>: Matches products by conceptual meaning and dense vector distance rather than exact substring matching.</p>
    </div>}
    {sort === 'opportunity' && topExplanation && (
      <div className="panel" style={{ marginBottom: '16px', background: 'var(--canvas-subtle)', border: '1.5px solid var(--line)' }}>
        <div className="section-head" style={{ marginBottom: '8px' }}>
          <span className="badge positive">⭐ AI Opportunity Spotlight · Score: {topExplanation.score}/100</span>
          <span className="badge">Grounded by Gemini & ML Scoring Engine</span>
        </div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem' }}>{topExplanation.headline || topExplanation.productName}</h3>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: 'var(--muted)' }}>{topExplanation.explanation}</p>
        {Array.isArray(topExplanation.keyStrengths) && topExplanation.keyStrengths.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {topExplanation.keyStrengths.map((strength, i) => (
              <span key={i} className="badge" style={{ background: 'var(--canvas-subtle)', borderColor: 'var(--line)' }}>✓ {strength}</span>
            ))}
          </div>
        )}
        {topExplanation.actionTip && (
          <div style={{ fontSize: '0.85rem', color: '#C75B00', fontWeight: 600 }}>
            <b>Recommended Action:</b> {topExplanation.actionTip}
          </div>
        )}
      </div>
    )}
    {!sampleMode && error && <div className="insight" role="alert"><div><b>Catalogue unavailable</b><p>{error}</p>
      <div className="button-row"><button className="secondary" onClick={() => setRetry(value => value + 1)}>Retry backend</button>
        <button className="secondary" onClick={() => { setError(''); setUsingSamples(true); }}>Use local sample catalogue</button></div>
    </div></div>}
    {(loading || semanticLoading || opportunityLoading) && <p className="planner-status" role="status">
      {opportunityLoading ? 'Evaluating multi-criteria opportunity scores & generating strategic advice…' : semanticLoading ? 'Computing sentence embeddings with Hugging Face…' : 'Loading products from the backend…'}
    </p>}
    <div className="results-line">
      <span>{list.length} products to explore</span>
      <span>{sort === 'opportunity' ? 'Ranked by Multi-Criteria Opportunity Engine (Margin 35%, Demand 30%, Supplier 25%, Shipping 10%)' : semanticMode ? 'Ranked by MiniLM semantic similarity' : sampleMode ? 'Local sample data' : 'Backend catalogue'}</span>
    </div>
    <div className="product-grid">{list.map(product => <article key={product.id} className="panel product-card">
      <ProductArt product={product} /><div className="product-content">
        <div className="card-top-bar">
          <span className="compact-badge">
            {product.sourceLabel ? product.sourceLabel.replaceAll('_', ' ') : (product.trend || 'Trending')}
          </span>
          <div className="score-pill">
            <span className="score-star">★</span>
            <span className="score-num">{product.opportunityScore != null ? product.opportunityScore : product.score}</span>
            <span className="score-max">/100</span>
          </div>
        </div>
        <h2>{product.name}</h2><p>{product.category} · {product.trend || 'Trending'}</p>
        <div className="product-prices"><span>Estimated cost<b>{money(product.cost)}</b></span><span>Suggested retail<b>{money(product.price)}</b></span></div>
        {product.scoreBreakdown && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Margin: {product.scoreBreakdown.marginContribution}/35</span>
            <span>Demand: {product.scoreBreakdown.demandContribution}/30</span>
            <span>Supplier: {product.scoreBreakdown.supplierContribution}/25</span>
          </div>
        )}
        <button className="secondary full" onClick={() => onSelect(product)}>Explore product <Icon name="arrow" size={17} /></button>
      </div>
    </article>)}</div>
    {!loading && !semanticLoading && !error && !list.length && <div className="panel empty-state"><Icon name="search" size={38} /><h2>No matches yet</h2>
      <p>Try a broader search or a different category.</p>
      <button className="secondary" onClick={() => { setQuery(''); setCategory('All products'); setSemanticItems(null); }}>Reset filters</button>
    </div>}
    {sampleMode && !demoMode && <button className="text-button" onClick={() => setUsingSamples(false)}>Return to backend catalogue</button>}
  </>;
}

export function ProductSentimentInspector({ productId, productName }) {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productService.getSentiment(productId);
      if (res.data) {
        setSentiment(res.data);
      }
    } catch (err) {
      setError(err.message || 'Sentiment service currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sentiment-inspector" style={{ marginTop: '16px', padding: '16px', borderRadius: '16px', background: 'var(--canvas-subtle)', border: '1.5px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '0.88rem', color: '#C75B00', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="spark" size={15} /> Customer Feedback Sentiment (RoBERTa AI)
        </strong>
        {!sentiment && (
          <button type="button" className="secondary" disabled={loading} style={{ fontSize: '0.78rem', padding: '6px 12px', minHeight: '34px' }} onClick={analyze}>
            {loading ? 'Analyzing with RoBERTa…' : 'Inspect Reviews'}
          </button>
        )}
      </div>

      {error && <p className="form-error" style={{ marginTop: '8px' }}>{error}</p>}

      {sentiment && !sentiment.sentimentAvailable && (
        <p style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--muted)' }}>
          ℹ️ {sentiment.message}
        </p>
      )}

      {sentiment && sentiment.sentimentAvailable && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className={`badge ${sentiment.overallLabel === 'POSITIVE' ? 'positive' : sentiment.overallLabel === 'NEGATIVE' ? 'negative' : 'warning'}`}>
              {sentiment.overallLabel}: {sentiment.sentimentScore}% Positive
            </span>
            <small style={{ color: 'var(--muted)', fontWeight: 600 }}>
              {sentiment.analyzedReviewsCount} verified reviews analyzed
            </small>
          </div>
          <div style={{ height: '7px', width: '100%', background: 'rgba(184, 134, 91, 0.15)', borderRadius: '999px', overflow: 'hidden', display: 'flex', margin: '10px 0' }}>
            <div style={{ width: `${sentiment.positivePercent}%`, background: '#2E9B77' }} title={`Positive: ${sentiment.positivePercent}%`} />
            <div style={{ width: `${sentiment.neutralPercent}%`, background: '#A49788' }} title={`Neutral: ${sentiment.neutralPercent}%`} />
            <div style={{ width: `${sentiment.negativePercent}%`, background: '#E05252' }} title={`Negative: ${sentiment.negativePercent}%`} />
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text)', marginTop: '6px', fontWeight: 500 }}>
            {sentiment.summary?.replace(/\s*\(lexicon analyzed\)\.?/i, '.') || `${sentiment.sentimentScore}% positive sentiment across ${sentiment.analyzedReviewsCount} verified customer reviews.`}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span className="badge" style={{ fontSize: '0.74rem', background: 'var(--canvas-subtle)', color: '#C75B00', borderColor: 'var(--line)' }}>
              ✦ RoBERTa Sentiment AI · CardiffNLP
            </span>
          </div>
        </div>
      )}
    </div>
  );
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
  const [productTitle, setProductTitle] = useState(product?.name || 'Electric Cooker');
  const [features, setFeatures] = useState(product?.features || '');
  const [audience, setAudience] = useState('Everyday shoppers');
  const [channel, setChannel] = useState('Instagram');
  const [draft, setDraft] = useStored(`droppilot_draft_${user.email}_${product.id}_${content ? 'social' : 'listing'}`, null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [source, setSource] = useState(user?.sessionMode === 'api' ? 'api' : 'local');

  const generate = async () => {
    setBusy(true);
    try {
      if (source === 'api') {
        if (content) {
          const res = await listingService.generateMarketing({
            productTitle: productTitle.trim() || product.name,
            sellingPoints: features.split('\n').filter(Boolean),
            targetAudience: audience,
            channel: channel.toLowerCase(),
          });
          const d = res.data || {};
          let text = '';
          if (channel === 'TikTok') {
            const hook = d.tiktokHook || d.tiktok?.hook || d.hook || '3-Second Viral Hook';
            const script = d.adScript || d.tiktok?.script || d.script || '';
            text = `🔥 Hook (0-3s):\n${hook}\n\n🎬 Script:\n${script}`;
          } else if (channel === 'Instagram') {
            const caption = d.instagramCaption || d.instagram?.caption || d.caption || '';
            const tags = (d.instagram?.hashtags || d.hashtags || []).join(' ');
            text = tags ? `${caption}\n\n${tags}` : caption;
          } else if (channel === 'Facebook Ads') {
            const headline = d.facebook?.headline || d.headline || `${productTitle} - Limited Time Offer`;
            const primaryText = d.adScript || d.facebook?.primaryText || d.primaryText || d.instagramCaption || '';
            text = `📢 Headline: ${headline}\n\n📝 Primary Text & Ad Script:\n${primaryText}`;
          } else {
            let metaTitle = d.shopifySeo?.metaTitle || d.seoTitle || productTitle;
            let metaDescription = d.shopifySeo?.metaDescription || d.metaDescription || d.seoDescription || '';
            let keywords = Array.isArray(d.shopifySeo?.keywords || d.keywords)
              ? (d.shopifySeo?.keywords || d.keywords).join(', ')
              : (d.shopifySeo?.keywords || d.keywords || '');
            text = `Meta Title: ${metaTitle}\n\nMeta Description:\n${metaDescription}\n\nKeywords: ${keywords}`;
          }

          if (!text.trim()) {
            text = d.adScript || d.instagramCaption || d.tiktokHook || 'Generated marketing copy ready for review.';
          }

          let extractedSeoTitle = d.shopifySeo?.metaTitle || d.seoTitle || productTitle;
          let extractedSeoDescription = d.shopifySeo?.metaDescription || d.metaDescription || d.seoDescription || '';
          let extractedKeywords = Array.isArray(d.shopifySeo?.keywords || d.keywords)
            ? (d.shopifySeo?.keywords || d.keywords).join(', ')
            : (d.shopifySeo?.keywords || d.keywords || '');

          // Text parse fallbacks if Gemini returned formatted text in description
          if (!extractedSeoTitle || extractedSeoTitle === productTitle) {
            const mTitle = text.match(/Meta Title:\s*([^\n]+)/i);
            if (mTitle) extractedSeoTitle = mTitle[1].trim();
          }
          if (!extractedSeoDescription) {
            const mDesc = text.match(/Meta Description:\s*\n*([^\n]+(?:\n[^\n]+)?)/i);
            if (mDesc && !mDesc[1].toLowerCase().startsWith('keywords:')) {
              extractedSeoDescription = mDesc[1].trim();
            } else {
              extractedSeoDescription = text.slice(0, 155);
            }
          }
          if (!extractedKeywords) {
            const mKey = text.match(/Keywords:\s*([^\n]+)/i);
            if (mKey) {
              extractedKeywords = mKey[1].trim();
            } else {
              extractedKeywords = `${productTitle.toLowerCase()}, trending, best deals, online shopping`;
            }
          }

          setDraft({
            title: `${channel}: ${productTitle}`,
            description: text,
            seoTitle: extractedSeoTitle,
            seoDescription: extractedSeoDescription,
            keywords: extractedKeywords
          });
        } else {
          const res = await listingService.generateListing({
            productTitle: productTitle.trim() || product.name,
            features: features.split('\n').filter(Boolean),
            targetAudience: audience
          });
          if (!res.data?.description) throw new Error('The service did not return a listing.');
          setDraft({
            title: res.data.title || productTitle,
            description: res.data.description,
            seoTitle: res.data.seoTitle || res.data.title || productTitle,
            seoDescription: res.data.seoDescription || res.data.description?.slice(0, 155) || '',
            keywords: Array.isArray(res.data.keywords) ? res.data.keywords.join(', ') : (res.data.keywords || '')
          });
        }
      } else {
        const facts = features.split('\n').map(s => s.trim()).filter(Boolean);
        setDraft({
          title: content ? `${channel}: ${productTitle}` : productTitle,
          description: content ? `${channel === 'TikTok' ? 'Meet your next everyday essential.' : channel === 'Instagram' ? 'A little upgrade to your everyday.' : 'Discover ' + productTitle + '.'}\n\n${productTitle} for ${audience.toLowerCase()}.\n${facts.map(s => '• ' + s).join('\n')}\n\n${channel === 'Instagram' ? '#EverydayEssentials #SmartShopping' : 'Explore the details and find your fit.'}` : `Meet ${productTitle}, designed for ${audience.toLowerCase()}.\n\n${facts.map(s => '• ' + s).join('\n')}\n\nExplore the features and choose what works for you.`,
          seoTitle: productTitle,
          seoDescription: `Discover ${productTitle}. High quality, fast shipping, and great value for ${audience.toLowerCase()}.`,
          keywords: `${productTitle.toLowerCase()}, trending, best deals, online shopping`
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
  return <><PageHead eyebrow={content ? 'One product. Many possibilities.' : 'From product to possibility'} title={content ? 'Make every channel your own.' : 'A listing worth stopping for.'} description={content ? 'Create channel-specific copy from the product facts you provide.' : 'Turn verified product details into a clear, editable listing.'} /><div className="workspace-grid"><section className="panel"><Field label="Product Name / Title" value={productTitle} onChange={e => setProductTitle(e.target.value)} /><label className="form-field"><span>Product facts, one per line</span><textarea rows="6" value={features} onChange={e => setFeatures(e.target.value)} /></label><Field label="Target audience" value={audience} onChange={e => setAudience(e.target.value)} />{content && <label className="form-field"><span>Channel</span><select value={channel} onChange={e => setChannel(e.target.value)}>{['Instagram', 'TikTok', 'Facebook Ads', 'Shopify SEO'].map(c => <option key={c}>{c}</option>)}</select></label>}<label className="form-field"><span>Generation Engine</span><select value={source} onChange={e => setSource(e.target.value)}><option value="api">Google Gemini AI Model</option><option value="local">Fast Local Template</option></select></label><button className="primary full" disabled={busy || !features.trim() || !audience.trim()} onClick={generate}><Icon name="spark" />{busy ? 'Generating with AI…' : content ? 'Create channel copy' : 'Generate listing'}</button><p className="footnote">{source === 'local' ? 'Built from your facts using a local template.' : 'Powered by Google Gemini API & server generation.'}</p></section><section className="panel"><div className="section-head"><h2>{preview ? 'Listing preview' : 'Your creative canvas'}</h2>{draft && <span className="badge positive">Saved on this device</span>}</div>{draft ? <><div className="segmented draft-tabs"><button className={!preview ? 'selected' : ''} onClick={() => setPreview(false)}>Edit draft</button><button className={preview ? 'selected' : ''} onClick={() => setPreview(true)}>Preview</button></div>{preview ? <article className="draft-preview"><h2>{draft.title}</h2><p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{draft.description}</p>{draft.seoTitle && <div className="preview-seo" style={{ marginTop: '18px', padding: '16px', background: 'var(--canvas-subtle)', borderRadius: '16px', borderLeft: '4px solid var(--accent)' }}><h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C75B00', marginBottom: '6px', fontWeight: 800 }}>Google & Shopify SEO Preview</h4><strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>{draft.seoTitle}</strong><p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '4px' }}>{draft.seoDescription}</p>{draft.keywords && <small style={{ color: '#C75B00', display: 'block', marginTop: '6px', fontWeight: 600 }}>🔑 Keywords: {draft.keywords}</small>}</div>}</article> : <><Field label="Title" value={draft.title} onChange={e => setDraft({
              ...draft,
              title: e.target.value
            })} /><label className="form-field"><span>Description</span><textarea rows="8" value={draft.description} onChange={e => setDraft({
                ...draft,
                description: e.target.value
              })} /></label><div className="seo-edit-section" style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1.5px solid var(--line)' }}><h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#C75B00', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><Icon name="spark" size={16} /> SEO Search Optimization</h3><Field label="SEO Meta Title (Under 60 chars)" value={draft.seoTitle || ''} onChange={e => setDraft({ ...draft, seoTitle: e.target.value })} /><label className="form-field"><span>SEO Meta Description (Under 155 chars)</span><textarea rows="3" value={draft.seoDescription || ''} onChange={e => setDraft({ ...draft, seoDescription: e.target.value })} /></label><Field label="Target Keywords (comma-separated)" value={draft.keywords || ''} onChange={e => setDraft({ ...draft, keywords: e.target.value })} /></div></>}<div className="button-row"><button className="secondary" onClick={async () => {
              try {
                const fullText = `${draft.title}\n\n${draft.description}${draft.seoTitle ? `\n\n--- SEO METADATA ---\nSEO Title: ${draft.seoTitle}\nSEO Description: ${draft.seoDescription || ''}\nKeywords: ${draft.keywords || ''}` : ''}`;
                await navigator.clipboard.writeText(fullText);
                notify('Draft and SEO metadata copied.');
              } catch {
                notify('Clipboard unavailable. Select and copy the draft text.');
              }
            }}>Copy text</button><button className="secondary" disabled={busy} onClick={async () => {
              try {
                setBusy(true);
                await listingService.saveListing({
                  productId: product?.id || product?._id,
                  title: draft.title,
                  description: draft.description,
                  seoTitle: draft.seoTitle,
                  seoDescription: draft.seoDescription,
                  keywords: draft.keywords ? (typeof draft.keywords === 'string' ? draft.keywords.split(',').map(s => s.trim()) : draft.keywords) : [],
                  status: 'PUBLISHED'
                });
                notify('✦ Listing saved directly into MongoDB Atlas!');
              } catch (err) {
                notify(err.message || 'Could not save listing to database.');
              } finally {
                setBusy(false);
              }
            }}>Save to Database</button><button className="primary" onClick={() => {
              const fullText = `${draft.title}\n\n${draft.description}${draft.seoTitle ? `\n\n--- SEO METADATA ---\nSEO Title: ${draft.seoTitle}\nSEO Description: ${draft.seoDescription || ''}\nKeywords: ${draft.keywords || ''}` : ''}`;
              const blob = new Blob([fullText], {
                type: 'text/plain'
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${product.id}-draft.txt`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              notify('Draft exported with SEO metadata.');
            }}>Export draft <Icon name="arrow" size={17} /></button></div></> : <div className="empty-state"><span className="orb"><Icon name="file" size={34} /></span><h2>Good stories start with facts.</h2><p>Add your product details, then create your first draft.</p></div>}</section></div></>;
}
export function Goals({
  target,
  onEdit,
  recovery = false,
  onNavigate
}) {
  const [perOrder, setPerOrder] = useState(539);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [aiError, setAiError] = useState('');
  const [userQuery, setUserQuery] = useState('Why am I behind my monthly profit target and what tactical actions should I take?');

  const {
    remaining,
    days,
    dailyProfit,
    orders,
    dailyOrders
  } = calculateGoal(target, 42618, perOrder);

  const fetchAiRecovery = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await goalService.getRecoveryAdvice('active', {
        question: userQuery,
        target,
        goalMetrics: {
          target,
          currentNetProfit: 42618,
          remainingProfit: remaining,
          progressPercent: target > 0 ? Number(((42618 / target) * 100).toFixed(1)) : 0
        }
      });
      if (res.data) {
        setAiAdvice(res.data);
      } else {
        throw new Error('No advice returned from AI recovery engine.');
      }
    } catch (err) {
      setAiError(err.message || 'AI Recovery Engine currently unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  return <><PageHead eyebrow={recovery ? 'Your next best move' : 'A little ambition. A clear plan.'} title={recovery ? 'Get back on your growth path.' : 'Give your growth a destination.'} description="Plan against the sample profit of ₹42,618. Your target is saved on this device." action={<button className="primary" onClick={onEdit}>Adjust target <Icon name="target" /></button>} /><div className="workspace-grid goal-workspace"><GoalRing target={target} onEdit={onEdit} /><section className="panel"><h2>{recovery ? 'Build your recovery plan' : 'Make the numbers work for you'}</h2><p>{days} days remaining this month, including today.</p><div className="mini-stats"><div><span>Remaining profit</span><strong>{money(remaining)}</strong></div><div><span>Daily profit needed</span><strong>{money(dailyProfit)}</strong></div></div><Field label="Estimated profit per order (₹)" type="number" min="1" value={perOrder} onChange={e => setPerOrder(Math.max(1, Number(e.target.value)))} /><div className="insight"><Icon name="target" /><p>At {money(perOrder)} profit per order, aim for <b>{orders} additional orders</b> this month — approximately <b>{dailyOrders} per day</b>.</p></div>{recovery ? <div className="recovery-advisor" style={{ marginTop: '20px' }}>
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
      <input
        className="form-input"
        style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: 'var(--input, #FFF5E6)', border: '1.5px solid var(--line, #EED5B5)', color: 'inherit' }}
        value={userQuery}
        onChange={e => setUserQuery(e.target.value)}
        placeholder="Ask Gemini recovery question..."
      />
      <button className="primary" disabled={aiLoading || !userQuery.trim()} onClick={fetchAiRecovery}>
        <Icon name="spark" /> {aiLoading ? 'Analyzing with Gemini…' : 'Get Gemini Diagnosis'}
      </button>
    </div>

    {aiError && <p className="form-error" role="alert">{aiError}</p>}

    {aiAdvice && (
      <div className="ai-advice-card" style={{ marginTop: '16px', padding: '18px', background: 'var(--canvas-subtle)', borderRadius: '16px', border: '1.5px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <strong style={{ color: '#C75B00', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
            <Icon name="spark" size={16} /> Gemini Strategic Diagnosis
          </strong>
          {aiAdvice.source && (
            <span className="badge" style={{ fontSize: '0.75rem' }}>
              {aiAdvice.isFallback ? 'Deterministic benchmark' : 'Live Gemini 3.5'}
            </span>
          )}
        </div>
        
        <p style={{ lineHeight: '1.6', marginBottom: '14px' }}>{aiAdvice.answer}</p>

        {aiAdvice.possibleReasons && aiAdvice.possibleReasons.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--muted, #94a3b8)', marginBottom: '6px' }}>Root Causes Identified</h4>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.5' }}>
              {aiAdvice.possibleReasons.map((r, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  <b>{r.reason}:</b> <span style={{ color: 'var(--muted, #cbd5e1)' }}>{r.evidence}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {aiAdvice.suggestedActions && aiAdvice.suggestedActions.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--muted, #94a3b8)', marginBottom: '8px' }}>Action Plan</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiAdvice.suggestedActions.map((a, i) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--panel)', borderRadius: '8px', border: '1px solid var(--line)', borderLeft: '3px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{a.action}</strong>
                    {a.confidence && (
                      <span className="badge positive" style={{ fontSize: '0.7rem' }}>
                        {a.confidence} confidence
                      </span>
                    )}
                  </div>
                  {a.expectedImpact && <p style={{ fontSize: '0.85rem', color: 'var(--muted, #94a3b8)', marginTop: '4px' }}>Impact: {a.expectedImpact}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {aiAdvice.limitations && aiAdvice.limitations.length > 0 && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', marginTop: '10px' }}>
            <small style={{ color: 'var(--muted, #64748b)' }}>
              Limitations: {aiAdvice.limitations.join(' • ')}
            </small>
          </div>
        )}
      </div>
    )}

    {!aiAdvice && !aiLoading && (
      <ol className="recovery-steps" style={{ marginTop: '14px' }}>
        <li>Prioritize products with at least {money(perOrder)} profit per order.</li>
        <li>Compare shipping and unit costs to protect your margin.</li>
        <li>Review progress daily against {money(dailyProfit)} in profit.</li>
      </ol>
    )}
  </div> : <button className="secondary" onClick={() => onNavigate('recovery')}>Explore a recovery plan <Icon name="arrow" /></button>}</section></div></>;
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
