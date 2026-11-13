import { useEffect, useState } from 'react';
import { Field, Icon, PageHead, products } from '../components/StudioUI';
import pricingService from '../services/pricingService';
import { formatPaise, pricingFields, readPricingEstimate, toPricingPayload } from '../utils/pricingContract';

export function SmartPricingPage({ product = products[0] }) {
  const [inputs, setInputs] = useState(() => ({
    sellingPrice: String(product.price), supplierCost: String(product.cost),
    shippingCost: '80', platformFees: '36', advertisingCostPerOrder: '95', otherCosts: '0',
  }));
  const [request, setRequest] = useState({ status: 'loading', key: '', data: null, error: '' });
  const [retry, setRetry] = useState(0);
  let payload;
  let validationError = '';
  try { payload = toPricingPayload(inputs); } catch (error) { validationError = error.message; }
  const key = payload ? JSON.stringify(payload) : '';

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    let active = true;
    let timeout;
    const timer = setTimeout(async () => {
      setRequest({ status: 'loading', key, data: null, error: '' });
      timeout = setTimeout(() => {
        if (!active) return;
        active = false;
        controller.abort();
        setRequest({ status: 'error', key, data: null, error: 'The pricing request timed out. Please retry.' });
      }, 10000);
      try {
        const response = await pricingService.calculatePrice(JSON.parse(key), { signal: controller.signal });
        const data = readPricingEstimate(response);
        if (active) setRequest({ status: 'success', key, data, error: '' });
      } catch (error) {
        if (active && error.name !== 'AbortError') {
          setRequest({ status: 'error', key, data: null, error: error.message || 'Unable to calculate this estimate.' });
        }
      } finally { clearTimeout(timeout); }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [key, retry]);

  // A previous response is never displayed against newly edited inputs.
  const current = request.key === key && !validationError;
  const result = current && request.status === 'success' ? request.data : null;
  const error = validationError || (current && request.status === 'error' ? request.error : '');
  const pending = !error && !result;
  const edit = (field, value) => setInputs(previous => ({ ...previous, [field]: value }));
  const sliderValue = Math.max(0, Number(inputs.sellingPrice) || 0);
  const sliderMax = Math.max(3000, Number.isFinite(sliderValue) ? Math.min(sliderValue, 1000000000) : 3000);

  return <>
    <PageHead eyebrow="Every rupee, accounted for" title="Price with confidence."
      description={`Model the unit economics of ${product.name}. Estimates update as you type.`}
      action={<span className="badge">Estimate · INR (₹)</span>} />
    <div className="workspace-grid">
      <section className="panel">
        <h2>Know your costs</h2><p>Per order, in Indian rupees. Zero costs are allowed.</p>
        {Object.entries(pricingFields).filter(([field]) => field !== 'sellingPrice').map(([field, label]) =>
          <Field key={field} label={`${label} (₹)`} type="number" min="0" max="1000000000" step="0.01"
            value={inputs[field]} onChange={event => edit(field, event.target.value)} />)}
        <div className="total-row"><span>Total estimated cost</span><b>{result ? formatPaise(result.totalCost) : '—'}</b></div>
      </section>
      <section className="panel" aria-busy={pending}>
        <div className="section-head"><div><h2>Find your sweet spot</h2><p>Balance a competitive price with healthy profit.</p></div><Icon name="sliders" /></div>
        <Field label="Selling price (₹)" type="number" min="0" max="1000000000" step="0.01"
          value={inputs.sellingPrice} onChange={event => edit('sellingPrice', event.target.value)} />
        <input aria-label="Selling price slider" className="price-slider" type="range" min="0" max={sliderMax} step="0.01"
          value={Math.min(sliderValue, sliderMax)} onChange={event => edit('sellingPrice', event.target.value)} />
        <div className="price-scale"><span>₹0.00</span><span>{formatPaise(sliderMax * 100)}</span></div>
        <div className="pricing-status" role="status" aria-live="polite">
          {pending ? 'Calculating estimate…' : result ? 'Estimate updated · Calculated by the pricing service' : 'Estimate unavailable'}
        </div>
        {error && <div className="form-error" role="alert"><p>{error}</p>{!validationError &&
          <button className="secondary" onClick={() => { setRequest({ status: 'loading', key, data: null, error: '' }); setRetry(value => value + 1); }}>Retry calculation</button>}</div>}
        <div className="mini-stats">
          <div><span>Estimated profit / order</span><strong className={result?.estimatedProfit < 0 ? 'negative-text' : 'positive-text'}>{result ? formatPaise(result.estimatedProfit) : '—'}</strong></div>
          <div><span>Estimated margin</span><strong>{result ? `${result.profitMarginPercent.toFixed(2)}%` : '—'}</strong></div>
          <div><span>Break-even price</span><strong>{result ? formatPaise(result.totalCost) : '—'}</strong></div>
        </div>
        <div className="insight"><Icon name="spark" /><p>{result?.estimatedProfit < 0
          ? 'This selling price does not cover your costs. Increase it or reduce your expenses.'
          : 'Selling price minus product, shipping, fees, advertising, and other costs gives estimated profit. Estimates do not guarantee sales.'}</p></div>
        <p className="footnote">Calculation basis: backend · One order · INR. Amounts retain paise precision. At a zero selling price, the service reports margin as 0%.</p>
      </section>
    </div>
  </>;
}

export default SmartPricingPage;
