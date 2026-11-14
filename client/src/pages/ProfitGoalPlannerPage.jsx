import { useEffect, useRef, useState } from 'react';
import { Field, Icon, PageHead } from '../components/StudioUI';
import goalService from '../services/goalService';
import '../styles/Planner.css';
import { canImportCsv, formatGoalMoney as money, goalPayload, readCsvPreview, readCurrentGoal, validateCsvFile } from '../utils/goalContract';

function ErrorNotice({ message }) {
  return message ? <p className="form-error" role="alert">{message}</p> : null;
}
const errorMessage = error => error.status === 401 || error.status === 403
  ? 'Sign in with a backend account to save goals and view analysis. Demo profiles do not authorize these requests.'
  : error.name === 'TimeoutError' ? 'The request timed out. Check the backend connection and try again.'
  : error.message || 'The request failed.';

export default function ProfitGoalPlannerPage() {
  const today = new Date();
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  const [target, setTarget] = useState('50000');
  const [goal, setGoal] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [schema, setSchema] = useState(null);
  const [file, setFile] = useState(null);
  const [sample, setSample] = useState(false);
  const [report, setReport] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState('load');
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [checkedAt, setCheckedAt] = useState(null);
  const mounted = useRef(false);
  const lock = useRef(false);
  const controller = useRef(null);

  async function run(action, operation) {
    if (lock.current) return;
    lock.current = true;
    const currentController = new AbortController();
    controller.current = currentController;
    const signal = AbortSignal.any([currentController.signal, AbortSignal.timeout(20000)]);
    setBusy(action);
    setErrors(previous => ({ ...previous, [action]: '' }));
    try { await operation({ signal }); }
    catch (error) {
      if (mounted.current && !currentController.signal.aborted && error.name !== 'AbortError') setErrors(previous => ({ ...previous, [action]: errorMessage(error) }));
    } finally {
      if (controller.current === currentController) {
        lock.current = false;
        if (mounted.current) setBusy('');
      }
    }
  }

  async function loadCurrent(options) {
    try {
      const data = readCurrentGoal(await goalService.getCurrent(options));
      if (!mounted.current) return;
      setGoal(data); setAnalysis(null); setCheckedAt(new Date());
      setErrors(previous => ({ ...previous, goal: '' }));
    } catch (error) {
      if (!mounted.current || error.name === 'AbortError') return;
      setGoal(null); setAnalysis(null);
      setErrors(previous => ({ ...previous, goal: error.code === 'GOAL_NOT_FOUND' ? '' : errorMessage(error) }));
    }
  }

  useEffect(() => {
    mounted.current = true;
    run('load', async options => {
      await Promise.all([
        loadCurrent(options),
        goalService.getCsvSchema(options).then(response => {
          if (!response.data?.schema?.required || typeof response.data.sampleCsvTemplate !== 'string') throw new Error('CSV schema unavailable. Run the updated backend.');
          if (mounted.current) setSchema(response.data);
        }).catch(error => { if (mounted.current && error.name !== 'AbortError') setErrors(previous => ({ ...previous, schema: errorMessage(error) })); }),
      ]);
    });
    return () => { mounted.current = false; lock.current = false; controller.current?.abort(); };
  }, []);

  function chooseFile(next, isSample = false) {
    setReport(null); setReceipt(null); setAcknowledged(false); setNotice('');
    setErrors(previous => ({ ...previous, preview: '', import: '', file: '' }));
    try { setFile(validateCsvFile(next)); setSample(isSample); }
    catch (error) { setFile(null); setSample(false); setErrors(previous => ({ ...previous, file: error.message })); }
  }

  function saveGoal(event) {
    event.preventDefault();
    let payload;
    try { payload = goalPayload(target, month); }
    catch (error) { setErrors(previous => ({ ...previous, save: error.message })); return; }
    run('save', async options => {
      const response = await goalService.createGoal(payload, options);
      if (!response.data?._id && !response.data?.id) throw new Error('The server did not confirm goal creation.');
      if (!mounted.current) return;
      setNotice('Monthly goal saved. Loading the server’s reported progress.');
      await loadCurrent(options);
    });
  }

  function preview() {
    if (!file) return;
    setReport(null); setReceipt(null); setAcknowledged(false);
    run('preview', async options => {
      const result = readCsvPreview(await goalService.previewCsv(file, options));
      if (mounted.current) setReport(result);
    });
  }

  function importFile() {
    if (!canImportCsv(report, acknowledged, receipt)) return;
    run('import', async options => {
      const response = await goalService.importCsv(file, options);
      if (!response.data?.id || !Number.isInteger(response.data.recordCount)) throw new Error('The import result is uncertain. Check existing orders before uploading again.');
      if (!mounted.current) return;
      setReceipt({ ...response.data, sourceName: file.name, sample });
      setNotice('Import receipt received. Refresh progress to inspect the server’s current dataset.');
    });
  }

  function analyze() {
    if (!goal) return;
    setAnalysis(null);
    run('analysis', async options => {
      const response = await goalService.analyze({ goalId: goal.goalId, period: goal.month, dataSource: goal.dataSource || 'server_reported' }, options);
      const data = response.data;
      if (!data?.goal || !data.financials || !Array.isArray(data.productPerformance) || data.calculationBasis !== 'backend') throw new Error('The server did not return a goal analysis.');
      if (mounted.current) { setAnalysis(data); setCheckedAt(new Date()); }
    });
  }

  const progress = analysis?.goal || goal;
  const financials = analysis?.financials || goal?.financials;
  const performance = analysis?.productPerformance || goal?.productPerformance || [];
  const percent = Number.isFinite(progress?.progressPercent) ? progress.progressPercent : 0;

  return <>
    <PageHead eyebrow="A clear destination for your growth" title="Profit goal planner"
      description="Set a monthly target, validate your order CSV, and inspect server-calculated performance."
      action={<span className="badge">INR · Backend calculations</span>} />
    <div className="insight"><Icon name="file" /><p>The current backend may use sample orders when its database is disconnected. An import receipt confirms processing; it does not confirm that goal analysis includes those rows. Period filtering and source labels also depend on the backend.</p></div>
    {notice && <p role="status" className="form-message">{notice}</p>}
    {busy && <p role="status" className="planner-status">{({ load: 'Loading workspace', save: 'Saving goal', preview: 'Validating CSV', import: 'Importing valid rows', analysis: 'Analyzing performance', refresh: 'Refreshing progress', schema: 'Loading CSV schema' })[busy]}…</p>}
    <div className="workspace-grid">
      <section className="panel"><h2>Your monthly destination</h2><p>Saving creates a new active goal for the selected month.</p>
        <form onSubmit={saveGoal}>
          <Field label="Month" type="month" required value={month} disabled={!!busy} onChange={event => setMonth(event.target.value)} />
          <Field label="Monthly net profit target (₹)" type="number" min="0.01" max="1000000000" step="0.01" required value={target} disabled={!!busy} onChange={event => setTarget(event.target.value)} />
          <ErrorNotice message={errors.save} /><button className="primary full" disabled={!!busy}>Save monthly goal <Icon name="target" /></button>
        </form>
      </section>
      <section className="panel"><div className="section-head"><h2>Reported progress</h2><button className="secondary" disabled={!!busy} onClick={() => run('refresh', loadCurrent)}>Refresh</button></div>
        <ErrorNotice message={errors.goal || errors.refresh} />
        {progress ? <>
          <p>{goal.month} · {String(progress.status || 'Unavailable').replaceAll('_', ' ')}</p>
          <div className="mini-stats"><div><span>Net profit</span><strong>{money(progress.currentNetProfit)}</strong></div><div><span>Remaining target</span><strong>{money(progress.remainingProfit)}</strong></div></div>
          <div className="section-head"><b>{percent.toFixed(1)}% of target</b><span>{money(progress.target)}</span></div>
          <div className="goal-progress-track" role="progressbar" aria-label="Monthly profit goal" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.min(100, Math.max(0, percent))}><i style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div>
          {!!goal.milestones?.length && <ul className="planner-milestones">{goal.milestones.map((milestone, index) => <li key={index}><span>{new Date(milestone.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span><b>{money(milestone.targetAmount)}</b><span>{progress.currentNetProfit >= milestone.targetAmount ? 'Reached' : 'Pending'}</span></li>)}</ul>}
          <button className="secondary full" disabled={!!busy} onClick={analyze}>Analyze current performance <Icon name="pulse" /></button>
          <ErrorNotice message={errors.analysis} />
        </> : !busy && !errors.goal && <div className="empty-state"><Icon name="target" size={36} /><h3>No active goal yet</h3><p>Create a monthly target to get started.</p></div>}
        {checkedAt && <p className="footnote">Retrieved {checkedAt.toLocaleString('en-IN')} · Reported source: {analysis?.dataSource || goal?.dataSource || 'Unavailable'}</p>}
      </section>
    </div>

    <section className="panel planner-section"><div className="section-head"><div><h2>Bring your store data</h2><p>Upload → preview → review → import. CSV amounts are rupees, up to 5 MB.</p></div><Icon name="file" /></div>
      <ErrorNotice message={errors.schema} />
      {!schema && <button className="secondary" disabled={!!busy} onClick={() => run('schema', async options => {
        const response = await goalService.getCsvSchema(options);
        if (!response.data?.schema?.required) throw new Error('CSV schema unavailable.');
        if (mounted.current) { setSchema(response.data); setErrors(previous => ({ ...previous, schema: '' })); }
      })}>Retry schema</button>}
      {schema && <><details className="csv-schema"><summary>Required columns and cost assumptions</summary><ul>{schema.schema.required.map(field => <li key={field.key}><code>{field.key}</code> — {field.description}</li>)}</ul><p>Optional: {(schema.schema.optional || []).map(field => field.key).join(', ')}. Selling price and COGS are per unit; shipping, fees, advertising, and other expenses are per order. Omitted or invalid optional expenses may be treated as zero by this backend. Review all costs before import.</p></details>
        <div className="button-row"><button className="secondary" disabled={!!busy} onClick={() => {
          const url = URL.createObjectURL(new Blob([schema.sampleCsvTemplate], { type: 'text/csv' }));
          const link = document.createElement('a'); link.href = url; link.download = 'droppilot-sample-orders.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}>Download sample CSV</button><button className="secondary" disabled={!!busy} onClick={() => chooseFile(new File([schema.sampleCsvTemplate], 'sample-orders.csv', { type: 'text/csv' }), true)}>Load sample for preview</button></div></>}
      <label className="form-field"><span>Order CSV</span><input type="file" accept=".csv,text/csv" disabled={!!busy} onChange={event => { if (event.target.files[0]) chooseFile(event.target.files[0]); event.target.value = ''; }} /></label>
      {file && <p><b>{file.name}</b> · {(file.size / 1024).toFixed(1)} KB · {sample ? 'Sample data' : 'Uploaded CSV'}</p>}
      <ErrorNotice message={errors.file || errors.preview} />
      <button className="primary" disabled={!file || !!busy || !!receipt} onClick={preview}>Preview & validate</button>
      {report && <div className="csv-report"><div className="mini-stats"><div><span>Total rows</span><strong>{report.totalRows}</strong></div><div><span>Valid rows</span><strong>{report.validRows}</strong></div><div><span>Rejected rows</span><strong>{report.invalidRows}</strong></div></div>
        {!!report.warnings.length && <div className="insight"><div><b>Cost assumptions</b><ul>{report.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div></div>}
        {!!report.errors.length && <details open><summary>{report.errors.length} validation issues</summary><ul className="csv-errors">{report.errors.map((error, index) => <li key={index}>{typeof error === 'string' ? error : `${error.row ? `Row ${error.row} · ` : ''}${error.field || ''}: ${error.message}`}</li>)}</ul></details>}
        {!!report.preview.length && <div className="planner-table"><table><caption>First {report.preview.length} valid rows · {sample ? 'Sample data' : file.name}</caption><thead><tr><th>Date</th><th>Product</th><th>Units</th><th>Price / unit</th><th>COGS / unit</th><th>Net profit</th></tr></thead><tbody>{report.preview.map((row, index) => <tr key={index}><td>{new Date(row.date).toLocaleDateString('en-IN')}</td><td>{row.productName}</td><td>{row.unitsSold}</td><td>{money(row.sellingPrice)}</td><td>{money(row.cogsPerUnit)}</td><td>{money(row.computed?.netProfit)}</td></tr>)}</tbody></table></div>}
        {report.aggregates && <div className="mini-stats"><div><span>Preview revenue</span><strong>{money(report.aggregates.totalRevenue)}</strong></div><div><span>Preview net profit</span><strong>{money(report.aggregates.totalNetProfit)}</strong></div><div><span>Preview margin</span><strong>{report.aggregates.overallMarginPercent}%</strong></div></div>}
        {report.validRows > 0 && <label className="sync-row"><input type="checkbox" checked={acknowledged} disabled={!!busy || !!receipt} onChange={event => setAcknowledged(event.target.checked)} /><span>I reviewed the cost assumptions and will import {report.validRows} valid rows{report.invalidRows ? `, skipping ${report.invalidRows} rejected rows` : ''}. Re-importing the same file can duplicate records.</span></label>}
        <button className="primary" disabled={!!busy || !canImportCsv(report, acknowledged, receipt)} onClick={importFile}>{receipt ? 'Import receipt received' : `Import ${report.validRows} valid rows`}</button>
      </div>}
      <ErrorNotice message={errors.import} />
      {errors.import && <p className="footnote">Do not repeat an uncertain import until you check whether its rows were saved.</p>}
      {receipt && <div className="insight"><Icon name="check" /><div><b>{receipt.recordCount} rows processed · {receipt.status}</b><p>{receipt.sourceName} · {receipt.sample ? 'Sample data' : 'Uploaded CSV'} · {new Date(receipt.importedAt).toLocaleString('en-IN')}</p><p>Receipt: {receipt.id}. Use Refresh to inspect goal progress; processing alone does not confirm persistence.</p></div></div>}
    </section>

    {financials && <section className="panel planner-section"><h2>Financial breakdown</h2><p>Server-reported totals; all amounts in INR.</p><dl className="financial-breakdown">{[['revenue', 'Revenue'], ['supplierCosts', 'Supplier costs'], ['shippingCosts', 'Shipping'], ['platformFees', 'Platform fees'], ['advertisingCosts', 'Advertising'], ['otherExpenses', 'Other expenses']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{money(financials[key])}</dd></div>)}</dl></section>}
    {goal && <section className="panel planner-section"><h2>Product profitability</h2>{performance.length ? <div className="planner-table"><table><thead><tr><th>Product</th><th>Units</th><th>Revenue</th><th>Total cost</th><th>Ad spend</th><th>Net profit</th><th>Margin</th></tr></thead><tbody>{performance.map((product, index) => <tr key={index}><td>{product.productName}</td><td>{product.unitsSold}</td><td>{money(product.revenue)}</td><td>{money(product.totalCost)}</td><td>{money(product.adSpend)}</td><td className={product.netProfit < 0 ? 'negative-text' : 'positive-text'}>{money(product.netProfit)}</td><td>{Number.isFinite(product.profitMarginPercent) ? `${product.profitMarginPercent}%` : 'Unavailable'}</td></tr>)}</tbody></table></div> : <p>No product performance data was returned.</p>}</section>}
    {analysis?.aiSummary && <section className="panel planner-section"><h2>Performance summary</h2><p>{analysis.aiSummary}</p><p className="footnote">Server-generated summary. The fetched backend currently uses a deterministic summary, not Gemini.</p></section>}
  </>;
}
